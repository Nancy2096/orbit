import "server-only"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { getNotificationEmail } from "@/lib/notifications/recipients"
import { isOperationsDirectorFor } from "@/lib/bonus-workflow"

export const runtime = "nodejs"

export type BonusEvent =
  | "created" // Paso 1→2: registrado, espera autorización del jefe directo
  | "manager_approved" // Paso 2→3: el jefe/dirección autorizó
  | "rejected" // Paso 2: rechazado
  | "payment_requested" // Paso 3→4: evidencias completas, listo para autorización de pago
  | "payment_authorized" // Paso 4: pago autorizado, se pagará en la próxima nómina

/**
 * Cliente con service role (sin sesión ni cookies). Necesario para:
 *  - leer el bono aunque el llamador no tenga acceso por RLS,
 *  - recorrer la cadena de `reports_to_id` de una agencia,
 *  - listar a la Dirección de Operaciones a partir de puestos y roles.
 * Se crea uno por invocación para no compartir estado entre requests.
 */
function createAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error("[notify:bonus] Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.")
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

interface DepartmentRef {
  name: string | null
}

interface StaffRef {
  id: string
  first_name: string | null
  last_name: string | null
  department?: DepartmentRef | DepartmentRef[] | null
}

interface BonusRow {
  id: string
  staff_id: string
  agency_id: string | null
  bonus_type: string | null
  amount: number | null
  course_name: string | null
  course_hours: number | null
  agency_impact: string | null
  description: string | null
  status: string
  workflow_stage: string
  manager_approved_by: string | null
  manager_approved_at: string | null
  manager_note: string | null
  rejected_by: string | null
  rejected_at: string | null
  rejection_reason: string | null
  approved_at: string | null
  certificate_url: string | null
  certificate_filename: string | null
  presentation_url: string | null
  presentation_filename: string | null
  videocall_url: string | null
  created_at: string
  staff: StaffRef | StaffRef[] | null
  agency: { id: string; name: string | null } | { id: string; name: string | null }[] | null
  bonus_type_ref: { id: string; name: string | null } | { id: string; name: string | null }[] | null
}

export interface BonusNotification {
  to: string[]
  replyTo?: string
  subject: string
  html: string
  /** Datos crudos para que el llamador valide el evento contra el estado real. */
  request: {
    id: string
    staff_id: string
    workflow_stage: string
    manager_approved_by: string | null
    rejected_by: string | null
  }
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function fullName(staff: Pick<StaffRef, "first_name" | "last_name"> | null): string {
  if (!staff) return "Empleado"
  return `${staff.first_name ?? ""} ${staff.last_name ?? ""}`.trim() || "Empleado"
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount)
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return ""
  try {
    return new Date(value).toLocaleString("es-MX", {
      timeZone: "America/Mexico_City",
      dateStyle: "long",
      timeStyle: "short",
    })
  } catch {
    return value
  }
}

const appUrl = (process.env.APP_URL || "").replace(/\/$/, "")

// Convierte una URL de blob privado en un enlace absoluto que pasa por /api/file.
function fileUrlAbs(blobUrl: string | null): string | null {
  if (!blobUrl) return null
  try {
    const pathname = new URL(blobUrl).pathname.replace(/^\//, "")
    return `${appUrl}/api/file?pathname=${encodeURIComponent(pathname)}`
  } catch {
    return blobUrl
  }
}

// Plantilla base: documento HTML completo con lang="es", legible en celular.
function wrap(title: string, inner: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;">
  <div style="margin:0;padding:24px 12px;background:#f4f4f5;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
      <div style="background:#111827;padding:16px 20px;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;letter-spacing:0.5px;">Orbit</span>
      </div>
      <div style="padding:20px;font-size:15px;line-height:1.55;">
        ${inner}
      </div>
    </div>
  </div>
</body>
</html>`
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:#6b7280;font-size:13px;vertical-align:top;width:140px;">${esc(label)}</td>
    <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;">${value}</td>
  </tr>`
}

// Bloque común con los datos del bono para todas las plantillas.
function bonusDetailRows(bonus: BonusRow, opts: { includeEvidence?: boolean } = {}): string {
  const typeName =
    one(bonus.bonus_type_ref)?.name?.trim() || bonus.bonus_type || "Bono por capacitación"
  const rows: string[] = []
  rows.push(detailRow("Tipo de bono", esc(typeName)))
  if (bonus.course_name?.trim()) rows.push(detailRow("Curso", esc(bonus.course_name.trim())))
  if (bonus.course_hours != null) rows.push(detailRow("Horas del curso", esc(`${bonus.course_hours} h`)))
  rows.push(detailRow("Monto del bono", esc(formatCurrency(Number(bonus.amount || 0)))))
  if (bonus.agency_impact?.trim()) rows.push(detailRow("Impacto en la agencia", esc(bonus.agency_impact.trim())))
  if (bonus.description?.trim()) rows.push(detailRow("Notas", esc(bonus.description.trim())))

  if (opts.includeEvidence) {
    const cert = fileUrlAbs(bonus.certificate_url)
    const pres = fileUrlAbs(bonus.presentation_url)
    const evidence: string[] = []
    if (cert) {
      evidence.push(
        `<a href="${cert}" style="color:#2563eb;text-decoration:underline;">${esc(bonus.certificate_filename || "Certificado")}</a>`,
      )
    }
    if (pres) {
      evidence.push(
        `<a href="${pres}" style="color:#2563eb;text-decoration:underline;">${esc(bonus.presentation_filename || "Presentación")}</a>`,
      )
    }
    if (bonus.videocall_url) {
      evidence.push(`<a href="${bonus.videocall_url}" style="color:#2563eb;text-decoration:underline;">Videollamada</a>`)
    }
    if (evidence.length > 0) {
      rows.push(detailRow("Evidencias", evidence.join("<br>")))
    }
  }

  return `<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">${rows.join("")}</table>`
}

function reviewButton(bonusId: string, label: string): string {
  const url = `${appUrl}/dashboard/hr/bonuses/${bonusId}`
  return `<a href="${url}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;">${esc(label)}</a>`
}

// Recorre la cadena de reports_to_id del solicitante y devuelve el primer jefe
// que exista, esté activo y tenga usuario vinculado (subiendo eslabones si no).
async function resolveDirectBoss(
  admin: ReturnType<typeof createAdmin>,
  agencyId: string | null,
  requesterStaffId: string,
): Promise<{ staffId: string; label: string } | null> {
  if (!agencyId) return null

  const { data: rows } = await admin
    .from("staff")
    .select("id, first_name, last_name, reports_to_id, is_active, user_id")
    .eq("agency_id", agencyId)

  const byId = new Map((rows || []).map((s: any) => [s.id, s]))
  const requester = byId.get(requesterStaffId)
  if (!requester) return null

  const visited = new Set<string>()
  let nextId: string | null | undefined = requester.reports_to_id
  while (nextId && !visited.has(nextId)) {
    visited.add(nextId)
    const node = byId.get(nextId)
    if (!node) break // el eslabón no existe: no hay a dónde seguir subiendo
    // Debe existir, estar activo y tener usuario vinculado; si no, se sube.
    if (node.is_active && node.user_id) {
      return { staffId: node.id, label: fullName(node) }
    }
    nextId = node.reports_to_id
  }
  return null
}

// Lista a la Dirección de Operaciones usando el criterio compartido, pero SIN
// contar el acceso global como destinatario (isGlobalAccess: false). Hoy esto
// resuelve a los directores de operaciones / superadmin (Enrique y Keila).
async function resolveOperationsDirectors(
  admin: ReturnType<typeof createAdmin>,
): Promise<string[]> {
  const { data: staffRows } = await admin
    .from("staff")
    .select("id, user_id, is_active, position:positions(name, level)")
    .eq("is_active", true)

  const rows = staffRows || []
  const userIds = [...new Set(rows.filter((s: any) => s.user_id).map((s: any) => s.user_id))]

  const roleByUser = new Map<string, string | null>()
  if (userIds.length > 0) {
    const { data: userRows } = await admin
      .from("users")
      .select("id, role:roles(name)")
      .in("id", userIds as string[])
    for (const u of userRows || []) {
      roleByUser.set((u as any).id, one((u as any).role)?.name ?? null)
    }
  }

  const staffIds: string[] = []
  for (const s of rows as any[]) {
    const pos = one(s.position) as { name: string | null; level: string | null } | null
    const roleName = s.user_id ? roleByUser.get(s.user_id) ?? null : null
    if (
      isOperationsDirectorFor({
        positionLevel: pos?.level ?? null,
        positionName: pos?.name ?? null,
        roleName,
        isGlobalAccess: false,
      })
    ) {
      staffIds.push(s.id)
    }
  }
  return staffIds
}

// Resuelve emails a partir de una lista de staffId, omitiendo vacíos y duplicados.
async function emailsFor(staffIds: string[]): Promise<string[]> {
  const out: string[] = []
  const seen = new Set<string>()
  for (const sid of staffIds) {
    const email = await getNotificationEmail(sid)
    if (email && !seen.has(email.toLowerCase())) {
      seen.add(email.toLowerCase())
      out.push(email)
    }
  }
  return out
}

/**
 * Construye la notificación de correo para un bono por capacitación.
 *
 * Destinatarios (exactamente quienes pueden actuar en cada etapa según
 * lib/bonus-workflow.ts):
 *  - "created": el jefe directo del solicitante (primer eslabón válido de la
 *    cadena reports_to_id: existente, activo y con usuario vinculado).
 *  - "manager_approved" / "rejected" / "payment_authorized": el solicitante.
 *  - "payment_requested": la Dirección de Operaciones (director+"operac" o
 *    superadmin), que es quien ejecuta la autorización de pago.
 *
 * Devuelve `null` si el bono no existe.
 */
export async function buildBonusNotification(
  id: string,
  event: BonusEvent,
): Promise<BonusNotification | null> {
  const admin = createAdmin()

  const { data, error } = await admin
    .from("bonuses")
    .select(
      `
      id, staff_id, agency_id, bonus_type, amount, course_name, course_hours,
      agency_impact, description, status, workflow_stage,
      manager_approved_by, manager_approved_at, manager_note,
      rejected_by, rejected_at, rejection_reason, approved_at,
      certificate_url, certificate_filename, presentation_url, presentation_filename,
      videocall_url, created_at,
      staff:staff_id(id, first_name, last_name, department:departments!staff_department_id_fkey(name)),
      agency:agencies(id, name),
      bonus_type_ref:bonus_types(id, name)
    `,
    )
    .eq("id", id)
    .single<BonusRow>()

  if (error || !data) {
    if (error) console.error("[notify:bonus] No se pudo obtener el bono:", error.message)
    return null
  }

  const requester = one(data.staff)
  const requesterName = fullName(requester)
  const requesterEmail = (await getNotificationEmail(data.staff_id)) || undefined
  const courseLabel = data.course_name?.trim() || "Bono por capacitación"

  const requestMeta = {
    id: data.id,
    staff_id: data.staff_id,
    workflow_stage: data.workflow_stage,
    manager_approved_by: data.manager_approved_by,
    rejected_by: data.rejected_by,
  }

  if (event === "created") {
    const boss = await resolveDirectBoss(admin, data.agency_id, data.staff_id)
    if (!boss) {
      console.warn(
        `[notify:bonus] El bono ${data.id} no tiene jefe directo válido (activo y con usuario); no se notifica.`,
      )
    }
    const to = boss ? await emailsFor([boss.staffId]) : []

    const inner = `
      <p style="margin:0 0 4px;font-size:17px;font-weight:bold;">Nuevo bono por autorizar</p>
      <p style="margin:0 0 16px;color:#4b5563;">${esc(requesterName)} registró un bono por capacitación que requiere tu autorización${boss ? ` (${esc(boss.label)})` : ""}.</p>
      ${bonusDetailRows(data)}
      ${reviewButton(data.id, "Revisar bono")}
      <p style="margin:18px 0 0;color:#9ca3af;font-size:12px;">Registrado el ${esc(formatTimestamp(data.created_at))}</p>
    `

    return {
      to,
      replyTo: requesterEmail,
      subject: `[Orbit] Nuevo bono por autorizar – ${requesterName}`,
      html: wrap("Nuevo bono por autorizar", inner),
      request: requestMeta,
    }
  }

  if (event === "payment_requested") {
    const to = await emailsFor(await resolveOperationsDirectors(admin))
    if (to.length === 0) {
      console.warn(`[notify:bonus] No se encontraron destinatarios de Dirección de Operaciones para ${data.id}.`)
    }

    const inner = `
      <p style="margin:0 0 4px;font-size:17px;font-weight:bold;">Bono listo para autorización de pago</p>
      <p style="margin:0 0 16px;color:#4b5563;">El bono de ${esc(requesterName)} completó las evidencias y está listo para tu autorización de pago.</p>
      ${bonusDetailRows(data, { includeEvidence: true })}
      ${reviewButton(data.id, "Autorizar pago")}
    `

    return {
      to,
      replyTo: requesterEmail,
      subject: `[Orbit] Bono listo para autorización de pago – ${requesterName}`,
      html: wrap("Bono listo para autorización de pago", inner),
      request: requestMeta,
    }
  }

  // Eventos dirigidos al solicitante: manager_approved | rejected | payment_authorized
  if (!requesterEmail) {
    console.warn(
      `[notify:bonus] El solicitante (${data.staff_id}) no tiene email; no se notifica el evento "${event}" del bono ${data.id}.`,
    )
  }
  const to = requesterEmail ? [requesterEmail] : []

  if (event === "rejected") {
    const accent = "#dc2626"
    const notesBlock = data.rejection_reason?.trim()
      ? `<div style="margin-top:16px;padding:12px 14px;background:#f9fafb;border-left:3px solid ${accent};border-radius:4px;">
           <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.4px;">Motivo del rechazo</p>
           <p style="margin:0;color:#111827;font-size:14px;">${esc(data.rejection_reason.trim())}</p>
         </div>`
      : ""
    const inner = `
      <p style="margin:0 0 4px;font-size:17px;font-weight:bold;">Tu bono fue <span style="color:${accent};">rechazado</span></p>
      <p style="margin:0 0 16px;color:#4b5563;">Hola ${esc(requesterName)}, tu bono por el curso "${esc(courseLabel)}" fue rechazado.</p>
      ${bonusDetailRows(data)}
      ${notesBlock}
      ${data.rejected_at ? `<p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">Rechazado el ${esc(formatTimestamp(data.rejected_at))}</p>` : ""}
    `
    return {
      to,
      subject: `[Orbit] Tu bono fue rechazado – ${courseLabel}`,
      html: wrap("Tu bono fue rechazado", inner),
      request: requestMeta,
    }
  }

  if (event === "manager_approved") {
    const accent = "#16a34a"
    const noteBlock = data.manager_note?.trim()
      ? `<div style="margin-top:16px;padding:12px 14px;background:#f9fafb;border-left:3px solid ${accent};border-radius:4px;">
           <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.4px;">Nota de autorización</p>
           <p style="margin:0;color:#111827;font-size:14px;">${esc(data.manager_note.trim())}</p>
         </div>`
      : ""
    const inner = `
      <p style="margin:0 0 4px;font-size:17px;font-weight:bold;">Tu bono fue <span style="color:${accent};">autorizado</span></p>
      <p style="margin:0 0 16px;color:#4b5563;">Hola ${esc(requesterName)}, tu bono por el curso "${esc(courseLabel)}" fue autorizado. Ahora sube las evidencias: certificado, presentación y videollamada.</p>
      ${bonusDetailRows(data)}
      ${noteBlock}
      <div style="margin-top:20px;">${reviewButton(data.id, "Subir evidencias")}</div>
    `
    return {
      to,
      subject: `[Orbit] Tu bono fue autorizado – ${courseLabel}`,
      html: wrap("Tu bono fue autorizado", inner),
      request: requestMeta,
    }
  }

  // event === "payment_authorized"
  const accent = "#0d9488"
  const inner = `
    <p style="margin:0 0 4px;font-size:17px;font-weight:bold;">El pago de tu bono fue <span style="color:${accent};">autorizado</span></p>
    <p style="margin:0 0 16px;color:#4b5563;">Hola ${esc(requesterName)}, el pago de tu bono por el curso "${esc(courseLabel)}" fue autorizado. Se pagará en la próxima nómina.</p>
    ${bonusDetailRows(data)}
    ${data.approved_at ? `<p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">Autorizado el ${esc(formatTimestamp(data.approved_at))}</p>` : ""}
  `
  return {
    to,
    subject: `[Orbit] El pago de tu bono fue autorizado – ${courseLabel}`,
    html: wrap("El pago de tu bono fue autorizado", inner),
    request: requestMeta,
  }
}
