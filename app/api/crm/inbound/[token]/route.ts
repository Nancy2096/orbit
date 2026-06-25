import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Endpoint público de captura de leads. Lo usan Meta Lead Ads, Google Lead
// Forms, Zapier y los formularios de la página web. Se autentica con el token
// de la URL (no requiere sesión de usuario). Crea un prospecto en la agencia
// dueña del token.
export const dynamic = "force-dynamic"

// Toma el primer valor no vacío de una lista de posibles claves del payload.
function pick(body: Record<string, unknown>, keys: string[]): string {
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
  if (v.includes("web") || v.includes("form") || v.includes("sitio") || v.includes("pagina")) return "Formulario Web"
  return "Formulario Web"
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 })
  }

  let supabase
  try {
    supabase = createAdminClient()
  } catch (e) {
    console.log("[v0] Inbound webhook sin configuración de servicio:", (e as Error).message)
    return NextResponse.json({ error: "Servicio no configurado" }, { status: 500 })
  }

  // Validar token -> agencia
  const { data: hook, error: hookError } = await supabase
    .from("crm_inbound_webhooks")
    .select("agency_id")
    .eq("token", token)
    .maybeSingle()

  if (hookError || !hook) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 })
  }

  const agencyId = hook.agency_id as string

  // Parsear el cuerpo (JSON o formulario)
  let body: Record<string, unknown> = {}
  const contentType = request.headers.get("content-type") || ""
  try {
    if (contentType.includes("application/json")) {
      body = (await request.json()) as Record<string, unknown>
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const form = await request.formData()
      body = Object.fromEntries(form.entries())
    } else {
      // Intento por defecto: JSON
      body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    }
  } catch {
    body = {}
  }

  const contactName = pick(body, ["contact_name", "name", "full_name", "nombre", "fullName"])
  const email = pick(body, ["contact_email", "email", "correo", "e-mail"])
  const phone = pick(body, ["contact_phone", "phone", "telefono", "teléfono", "tel", "whatsapp"])
  const companyName = pick(body, ["company_name", "company", "empresa", "negocio"])
  const message = pick(body, ["message", "mensaje", "notes", "comentarios", "comment"])
  const sourceRaw = pick(body, ["source", "origen", "platform", "utm_source", "channel"])

  if (!contactName && !email && !phone) {
    return NextResponse.json(
      { error: "Se requiere al menos un nombre, correo o teléfono" },
      { status: 422 },
    )
  }

  // Etapa por defecto (primera del pipeline de la agencia)
  const { data: stage } = await supabase
    .from("crm_pipeline_stages")
    .select("id")
    .eq("agency_id", agencyId)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle()

  // Fuente de lead: buscar por nombre o crearla
  const sourceName = resolveSourceName(sourceRaw)
  let sourceId: string | null = null
  const { data: existingSource } = await supabase
    .from("crm_lead_sources")
    .select("id")
    .eq("agency_id", agencyId)
    .ilike("name", sourceName)
    .maybeSingle()

  if (existingSource) {
    sourceId = existingSource.id as string
  } else {
    const { data: createdSource } = await supabase
      .from("crm_lead_sources")
      .insert({
        agency_id: agencyId,
        name: sourceName,
        source_type: "integration",
        is_active: true,
      })
      .select("id")
      .maybeSingle()
    sourceId = (createdSource?.id as string) ?? null
  }

  // Crear prospecto
  const { data: prospect, error: insertError } = await supabase
    .from("crm_prospects")
    .insert({
      agency_id: agencyId,
      contact_name: contactName || email || phone || "Lead sin nombre",
      contact_email: email || null,
      contact_phone: phone || null,
      company_name: companyName || null,
      stage_id: stage?.id ?? null,
      source_id: sourceId,
      notes: message || null,
      status: "active",
    })
    .select("id")
    .maybeSingle()

  if (insertError) {
    console.log("[v0] Error creando prospecto desde webhook:", insertError.message)
    return NextResponse.json({ error: "No se pudo crear el prospecto" }, { status: 500 })
  }

  return NextResponse.json({ success: true, prospect_id: prospect?.id, source: sourceName })
}
