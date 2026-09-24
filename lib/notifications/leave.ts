import "server-only"

import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export type LeaveEvent = "created" | "approved" | "rejected"

interface StaffRef {
  id: string
  first_name: string | null
  last_name: string | null
  email?: string | null
  reports_to_id?: string | null
}

interface LeaveTypeRef {
  id: string
  name: string | null
}

interface LeaveRequestRow {
  id: string
  staff_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  total_days: number | null
  is_half_day: boolean | null
  half_day_period: "morning" | "afternoon" | null
  reason: string | null
  status: string
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  approver_id: string | null
  created_at: string
  staff: StaffRef | StaffRef[] | null
  leave_type: LeaveTypeRef | LeaveTypeRef[] | null
  approver: StaffRef | StaffRef[] | null
  reviewer: StaffRef | StaffRef[] | null
}

export interface LeaveNotification {
  to: string[]
  replyTo?: string
  subject: string
  html: string
  /** Datos crudos de la solicitud, para que el llamador valide el evento contra el estado real. */
  request: {
    id: string
    staff_id: string
    status: string
    reviewed_by: string | null
  }
}

// Normaliza un embed de Supabase que puede llegar como objeto o como arreglo.
function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
]

// Fechas "solo día" (YYYY-MM-DD): se formatean sin conversión de zona horaria
// para evitar el desfase de un día. Ej: "2026-10-01" -> "1 de octubre de 2026".
function formatDay(value: string | null | undefined): string {
  if (!value) return ""
  const [y, m, d] = value.split("-").map((n) => Number.parseInt(n, 10))
  if (!y || !m || !d) return value
  return `${d} de ${MESES[m - 1]} de ${y}`
}

// Timestamps (created_at, reviewed_at): se formatean en la zona horaria de la Ciudad de México.
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

function fullName(staff: StaffRef | null): string {
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

const halfDayLabel: Record<"morning" | "afternoon", string> = {
  morning: "Mañana",
  afternoon: "Tarde",
}

// Plantilla base: contenedor legible en celular.
function wrap(inner: string): string {
  return `
  <div style="margin:0;padding:24px 12px;background:#f4f4f5;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
      <div style="background:#111827;padding:16px 20px;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;letter-spacing:0.5px;">Orbit</span>
      </div>
      <div style="padding:20px;font-size:15px;line-height:1.55;">
        ${inner}
      </div>
    </div>
  </div>`
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:#6b7280;font-size:13px;vertical-align:top;width:130px;">${esc(label)}</td>
    <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;">${value}</td>
  </tr>`
}

/**
 * Construye la notificación de correo para una solicitud de ausencia (leave_request).
 *
 * Reglas de destinatarios:
 * - "created": el `approver_id` de la solicitud si existe; si no, el jefe directo
 *   del solicitante (`reports_to_id`). En ambos casos el destinatario es siempre un
 *   aprobador válido según `computeApproverChain` de app/dashboard/hr/vacations/page.tsx:
 *   el approver_id se elige en la UI desde esa misma cadena (jefes + RH), y el jefe
 *   directo (`reports_to_id`) es el primer eslabón de esa cadena jerárquica.
 * - "approved" / "rejected": el propio solicitante.
 * Siempre se excluye al solicitante de los aprobadores y se omite (console.warn) a
 * cualquier destinatario sin email.
 *
 * Devuelve `null` si la solicitud no existe.
 */
export async function buildLeaveNotification(
  id: string,
  event: LeaveEvent,
): Promise<LeaveNotification | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("leave_requests")
    .select(
      `
      id, staff_id, leave_type_id, start_date, end_date, total_days,
      is_half_day, half_day_period, reason, status, reviewed_by, reviewed_at,
      review_notes, approver_id, created_at,
      staff:staff_id(id, first_name, last_name, email, reports_to_id),
      leave_type:leave_type_id(id, name),
      approver:approver_id(id, first_name, last_name, email),
      reviewer:reviewed_by(id, first_name, last_name)
    `,
    )
    .eq("id", id)
    .single<LeaveRequestRow>()

  if (error || !data) {
    if (error) console.error("[notify:leave] No se pudo obtener la solicitud:", error.message)
    return null
  }

  const requester = one(data.staff)
  const leaveType = one(data.leave_type)
  const approver = one(data.approver)
  const reviewer = one(data.reviewer)

  const typeName = leaveType?.name?.trim() || "ausencia"
  const requesterName = fullName(requester)
  const requesterEmail = requester?.email?.trim() || undefined

  const requestMeta = {
    id: data.id,
    staff_id: data.staff_id,
    status: data.status,
    reviewed_by: data.reviewed_by,
  }

  const appUrl = (process.env.APP_URL || "").replace(/\/$/, "")
  const reviewUrl = `${appUrl}/dashboard/hr/vacations`

  if (event === "created") {
    // Determinar el destinatario aprobador.
    let recipientEmail: string | undefined
    let recipientLabel = ""

    if (data.approver_id && data.approver_id !== data.staff_id) {
      // Aprobador designado en la solicitud (elegido desde la cadena de aprobadores).
      if (approver?.email?.trim()) {
        recipientEmail = approver.email.trim()
        recipientLabel = fullName(approver)
      } else {
        console.warn(
          `[notify:leave] Aprobador designado (${data.approver_id}) sin email; no se notifica la solicitud ${data.id}.`,
        )
      }
    } else {
      // Sin aprobador designado (o era el propio solicitante): usar el jefe directo.
      const bossId = requester?.reports_to_id ?? null
      if (bossId && bossId !== data.staff_id) {
        const { data: boss } = await supabase
          .from("staff")
          .select("id, first_name, last_name, email")
          .eq("id", bossId)
          .single<StaffRef>()
        if (boss?.email?.trim()) {
          recipientEmail = boss.email.trim()
          recipientLabel = fullName(boss)
        } else {
          console.warn(
            `[notify:leave] Jefe directo (${bossId}) sin email; no se notifica la solicitud ${data.id}.`,
          )
        }
      } else {
        console.warn(
          `[notify:leave] La solicitud ${data.id} no tiene aprobador ni jefe directo válido; no se notifica.`,
        )
      }
    }

    const rows: string[] = []
    rows.push(detailRow("Tipo", esc(typeName)))
    rows.push(detailRow("Fecha de inicio", esc(formatDay(data.start_date))))
    rows.push(detailRow("Fecha de fin", esc(formatDay(data.end_date))))
    rows.push(detailRow("Total de días", esc(String(data.total_days ?? "-"))))
    if (data.is_half_day) {
      const period = data.half_day_period ? halfDayLabel[data.half_day_period] : ""
      rows.push(detailRow("Medio día", period ? esc(`Sí (${period})`) : "Sí"))
    }
    if (data.reason?.trim()) {
      rows.push(detailRow("Motivo", esc(data.reason.trim())))
    }

    const inner = `
      <p style="margin:0 0 4px;font-size:17px;font-weight:bold;">Nueva solicitud de ${esc(typeName)}</p>
      <p style="margin:0 0 16px;color:#4b5563;">${esc(requesterName)} envió una solicitud que requiere tu revisión${recipientLabel ? ` (${esc(recipientLabel)})` : ""}.</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">${rows.join("")}</table>
      <a href="${reviewUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;">Revisar solicitud</a>
      <p style="margin:18px 0 0;color:#9ca3af;font-size:12px;">Solicitud creada el ${esc(formatTimestamp(data.created_at))}.</p>
    `

    return {
      to: recipientEmail ? [recipientEmail] : [],
      replyTo: requesterEmail,
      subject: `[Orbit] Nueva solicitud de ${typeName} – ${requesterName}`,
      html: wrap(inner),
      request: requestMeta,
    }
  }

  // event === "approved" | "rejected" -> notificar al solicitante.
  const decision = event === "approved" ? "aprobada" : "rechazada"
  const accent = event === "approved" ? "#16a34a" : "#dc2626"

  if (!requesterEmail) {
    console.warn(
      `[notify:leave] El solicitante (${data.staff_id}) no tiene email; no se notifica la resolución de ${data.id}.`,
    )
  }

  const rows: string[] = []
  rows.push(detailRow("Tipo", esc(typeName)))
  rows.push(detailRow("Fecha de inicio", esc(formatDay(data.start_date))))
  rows.push(detailRow("Fecha de fin", esc(formatDay(data.end_date))))
  rows.push(detailRow("Total de días", esc(String(data.total_days ?? "-"))))
  if (reviewer) {
    rows.push(detailRow("Revisada por", esc(fullName(reviewer))))
  }
  if (data.reviewed_at) {
    rows.push(detailRow("Fecha de revisión", esc(formatTimestamp(data.reviewed_at))))
  }

  const notesBlock = data.review_notes?.trim()
    ? `<div style="margin-top:16px;padding:12px 14px;background:#f9fafb;border-left:3px solid ${accent};border-radius:4px;">
         <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.4px;">Notas de la revisión</p>
         <p style="margin:0;color:#111827;font-size:14px;">${esc(data.review_notes.trim())}</p>
       </div>`
    : ""

  const inner = `
    <p style="margin:0 0 4px;font-size:17px;font-weight:bold;">Tu solicitud fue <span style="color:${accent};">${decision}</span></p>
    <p style="margin:0 0 16px;color:#4b5563;">Hola ${esc(requesterName)}, tu solicitud de ${esc(typeName)} fue ${decision}.</p>
    <table style="width:100%;border-collapse:collapse;">${rows.join("")}</table>
    ${notesBlock}
  `

  return {
    to: requesterEmail ? [requesterEmail] : [],
    subject: `[Orbit] Tu solicitud de ${typeName} fue ${decision}`,
    html: wrap(inner),
    request: requestMeta,
  }
}
