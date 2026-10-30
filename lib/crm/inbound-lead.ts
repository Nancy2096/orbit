import "server-only"

import { after, NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"
import { createProspect } from "@/lib/crm/create-prospect"
import { notifyAdvisorNewLead } from "@/lib/notifications/new-lead"
import { getStaffName, resolveZapAssignee } from "@/lib/crm/zap-assignee"

type Payload = Record<string, unknown>

// Toma el primer valor no vacío de una lista de posibles claves del payload.
function pick(body: Payload, keys: string[]): string {
  for (const key of keys) {
    const value = body[key]
    if (typeof value === "string" && value.trim()) return value.trim()
    if (typeof value === "number") return String(value)
  }
  return ""
}

// Normaliza el origen recibido a un nombre de fuente de lead legible.
function resolveSourceName(raw: string): string {
  const v = raw.toLowerCase()
  if (v.includes("meta") || v.includes("facebook") || v.includes("instagram") || v === "fb" || v === "ig")
    return "Meta Ads"
  if (v.includes("google")) return "Google Ads"
  if (v.includes("zapier")) return "Zapier"
  return "Formulario Web"
}

function normalizeEmail(value: string | null | undefined): string {
  return (value || "").replace(/\s+/g, "").toLowerCase()
}

function last10Digits(value: string | null | undefined): string {
  const digits = (value || "").replace(/\D/g, "")
  return digits.length >= 10 ? digits.slice(-10) : ""
}

function readBearer(request: Request): string {
  const header = request.headers.get("authorization") || ""
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : ""
}

async function readBody(request: Request): Promise<Payload> {
  const contentType = request.headers.get("content-type") || ""
  try {
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const form = await request.formData()
      return Object.fromEntries(form.entries()) as Payload
    }
    const json = await request.json()
    return json && typeof json === "object" ? (json as Payload) : {}
  } catch {
    return {}
  }
}

type DuplicateMatch = { prospectId: string; matchedBy: "external_lead_id" | "email" | "phone" }

// Busca un prospecto existente de la agencia: external_lead_id, luego correo y luego teléfono.
async function findDuplicate(
  supabase: SupabaseClient,
  agencyId: string,
  externalLeadId: string,
  email: string,
  phone: string,
): Promise<DuplicateMatch | null> {
  if (externalLeadId) {
    const { data, error } = await supabase
      .from("crm_prospects")
      .select("id")
      .eq("agency_id", agencyId)
      .eq("external_lead_id", externalLeadId)
      .limit(1)
      .maybeSingle()
    if (error) console.warn("[crm:inbound] No se pudo buscar por external_lead_id:", error.message)
    if (data) return { prospectId: data.id as string, matchedBy: "external_lead_id" }
  }

  const emailKey = normalizeEmail(email)
  const phoneKey = last10Digits(phone)
  if (!emailKey && !phoneKey) return null

  // Se comparan en memoria para poder normalizar correo y teléfono igual que el lead entrante.
  const rows: { id: string; contact_email: string | null; contact_phone: string | null }[] = []
  const pageSize = 1000
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("crm_prospects")
      .select("id, contact_email, contact_phone")
      .eq("agency_id", agencyId)
      .or("contact_email.not.is.null,contact_phone.not.is.null")
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1)
    if (error) {
      console.warn("[crm:inbound] No se pudo buscar duplicados por correo/teléfono:", error.message)
      break
    }
    rows.push(...(data ?? []))
    if (!data || data.length < pageSize) break
  }

  if (emailKey) {
    const hit = rows.find((r) => normalizeEmail(r.contact_email) === emailKey)
    if (hit) return { prospectId: hit.id, matchedBy: "email" }
  }
  if (phoneKey) {
    const hit = rows.find((r) => last10Digits(r.contact_phone) === phoneKey)
    if (hit) return { prospectId: hit.id, matchedBy: "phone" }
  }
  return null
}

async function resolveSourceId(supabase: SupabaseClient, agencyId: string, sourceName: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from("crm_lead_sources")
    .select("id")
    .eq("agency_id", agencyId)
    .ilike("name", sourceName)
    .limit(1)
    .maybeSingle()
  if (existing) return existing.id as string

  const { data: created } = await supabase
    .from("crm_lead_sources")
    .insert({ agency_id: agencyId, name: sourceName, source_type: "integration", is_active: true })
    .select("id")
    .maybeSingle()
  return (created?.id as string) ?? null
}

async function logActivity(
  supabase: SupabaseClient,
  params: { agencyId: string; prospectId: string; assignedTo: string | null; subject: string; description: string },
) {
  const now = new Date().toISOString()
  const { error } = await supabase.from("crm_activities").insert({
    agency_id: params.agencyId,
    prospect_id: params.prospectId,
    activity_type: "note",
    subject: params.subject.slice(0, 250),
    description: params.description || null,
    activity_date: now,
    is_completed: true,
    completed_at: now,
    assigned_to: params.assignedTo,
  })
  if (error) console.error("[crm:inbound] No se pudo registrar la actividad:", error.message)
}

/**
 * Captura de leads entrantes (Zapier, Meta, Google, página web).
 * El token de la agencia puede venir en `Authorization: Bearer <token>` o en la URL.
 */
export async function handleInboundLead(request: Request, urlToken?: string): Promise<NextResponse> {
  const token = readBearer(request) || (urlToken || "").trim()
  if (!token) return NextResponse.json({ error: "Token inválido" }, { status: 401 })

  let supabase: SupabaseClient
  try {
    supabase = createAdminClient()
  } catch (e) {
    console.error("[crm:inbound] Sin configuración de servicio:", (e as Error).message)
    return NextResponse.json({ error: "Servicio no configurado" }, { status: 500 })
  }

  const { data: hook, error: hookError } = await supabase
    .from("crm_inbound_webhooks")
    .select("agency_id")
    .eq("token", token)
    .maybeSingle()
  if (hookError || !hook) return NextResponse.json({ error: "Token inválido" }, { status: 401 })

  const agencyId = hook.agency_id as string
  const body = await readBody(request)

  const contactName = pick(body, ["contact_name", "name", "full_name", "nombre", "fullName"])
  const email = pick(body, ["contact_email", "email", "correo", "e-mail"])
  const phone = pick(body, ["contact_phone", "phone", "phone_number", "telefono", "teléfono", "tel", "whatsapp"])
  const companyName = pick(body, ["company_name", "company", "empresa", "negocio"])
  const message = pick(body, ["message", "mensaje", "notes", "comentarios", "comment"])
  const sourceRaw = pick(body, ["source", "origen", "platform", "utm_source", "channel"])
  const externalLeadId = pick(body, ["external_lead_id", "lead_id", "leadgen_id"])
  const platform = pick(body, ["platform", "plataforma", "source", "origen"])
  const form = pick(body, ["form_name", "form", "formulario", "form_id"])
  const campaign = pick(body, ["campaign_name", "campaign", "campaña", "campana", "utm_campaign"])
  const ad = pick(body, ["ad_name", "ad", "anuncio", "ad_id"])
  const assignedToEmail = pick(body, ["assigned_to_email"])

  if (!contactName && !email && !phone) {
    return NextResponse.json({ error: "Se requiere al menos un nombre, correo o teléfono" }, { status: 422 })
  }

  const sourceName = resolveSourceName(sourceRaw)

  const duplicate = await findDuplicate(supabase, agencyId, externalLeadId, email, phone)
  if (duplicate) {
    const { data: existing } = await supabase
      .from("crm_prospects")
      .select("assigned_to")
      .eq("id", duplicate.prospectId)
      .maybeSingle()
    const details = [
      `Coincidencia por: ${duplicate.matchedBy === "external_lead_id" ? "ID del lead" : duplicate.matchedBy === "email" ? "correo" : "teléfono"}`,
      contactName && `Nombre: ${contactName}`,
      email && `Correo: ${email}`,
      phone && `Teléfono: ${phone}`,
      platform && `Plataforma: ${platform}`,
      form && `Formulario: ${form}`,
      campaign && `Campaña: ${campaign}`,
      ad && `Anuncio: ${ad}`,
      externalLeadId && `ID del lead: ${externalLeadId}`,
      message && `Mensaje: ${message}`,
    ]
      .filter(Boolean)
      .join("\n")
    await logActivity(supabase, {
      agencyId,
      prospectId: duplicate.prospectId,
      assignedTo: (existing?.assigned_to as string) ?? null,
      subject: `Lead recibido nuevamente desde ${sourceName}`,
      description: details,
    })
    return NextResponse.json(
      { success: true, duplicate: true, prospect_id: duplicate.prospectId, matched_by: duplicate.matchedBy, source: sourceName },
      { status: 200 },
    )
  }

  const { data: stage } = await supabase
    .from("crm_pipeline_stages")
    .select("id")
    .eq("agency_id", agencyId)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle()

  const sourceId = await resolveSourceId(supabase, agencyId, sourceName)
  const finalName = contactName || email || phone || "Lead sin nombre"

  const zap = assignedToEmail
    ? await resolveZapAssignee(supabase, agencyId, assignedToEmail)
    : ({ ok: false, reason: null, detail: "no se indicó assigned_to_email" } as const)
  const assignedByZap = zap.ok
  const fallbackReason = zap.ok ? null : zap.detail

  let result
  try {
    result = await createProspect(supabase, {
      agencyId,
      contactName: finalName,
      contactEmail: email || null,
      contactPhone: phone || null,
      companyName: companyName || null,
      notes: message || null,
      stageId: (stage?.id as string) ?? null,
      sourceId,
      externalLeadId: externalLeadId || null,
      assignTo: zap.ok ? zap.staffId : "auto",
      assignedBy: null,
    })
  } catch (e) {
    console.error("[crm:inbound] Error creando prospecto:", (e as Error).message)
    return NextResponse.json({ error: "No se pudo crear el prospecto" }, { status: 500 })
  }

  let assignmentLine: string
  if (zap.ok) {
    assignmentLine = `Asignado por Zap a ${zap.name}`
  } else if (result.assignedTo) {
    const fallbackName = await getStaffName(supabase, result.assignedTo)
    assignmentLine = `Asignado por respaldo a ${fallbackName} (motivo: ${fallbackReason})`
  } else {
    assignmentLine = `Sin asesor asignado: el respaldo no tiene asesores habilitados (motivo: ${fallbackReason})`
  }

  const details = [
    assignmentLine,
    assignedToEmail && !zap.ok && `assigned_to_email recibido: ${assignedToEmail}`,
    platform && `Plataforma: ${platform}`,
    form && `Formulario: ${form}`,
    campaign && `Campaña: ${campaign}`,
    ad && `Anuncio: ${ad}`,
    externalLeadId && `ID del lead: ${externalLeadId}`,
  ]
    .filter(Boolean)
    .join("\n")
  await logActivity(supabase, {
    agencyId,
    prospectId: result.prospectId,
    assignedTo: result.assignedTo,
    subject: `Lead recibido desde ${sourceName}`,
    description: details,
  })

  if (result.assignedTo) {
    const assignedTo = result.assignedTo
    after(() =>
      notifyAdvisorNewLead({
        prospectId: result.prospectId,
        assignedTo,
        sourceName,
        contactName: finalName,
        contactEmail: email || null,
        contactPhone: phone || null,
        companyName: companyName || null,
        message: message || null,
      }),
    )
  }

  return NextResponse.json(
    {
      success: true,
      duplicate: false,
      prospect_id: result.prospectId,
      source: sourceName,
      assigned_to: result.assignedTo,
      assignment_method: assignedByZap ? "zap" : "fallback",
      fallback_reason: fallbackReason,
      tasks_created: result.tasksCreated,
    },
    { status: 201 },
  )
}
