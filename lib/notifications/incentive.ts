import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { getNotificationEmail } from "@/lib/notifications/recipients"
import {
  INCENTIVE_AUTHORIZER_ROLES,
  INCENTIVE_TYPE_LABELS,
  formatDateOnly,
  formatIncentiveAmount,
} from "@/lib/incentives"

export type IncentiveEvent = "created" | "approved" | "rejected"

export interface IncentiveNotification {
  to: string[]
  subject: string
  html: string
}

interface IncentiveRow {
  id: string
  incentive_number: string | null
  staff_id: string
  incentive_type: string
  amount: number
  description: string | null
  request_date: string
  pay_in_payroll_date: string | null
  rejection_reason: string | null
  staff: { first_name: string | null; last_name: string | null } | { first_name: string | null; last_name: string | null }[] | null
  agency: { name: string | null } | { name: string | null }[] | null
  currency: { code: string | null } | { code: string | null }[] | null
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

const appUrl = (process.env.APP_URL || "").replace(/\/$/, "")

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

function reviewButton(id: string, label: string): string {
  const url = `${appUrl}/dashboard/hr/bonuses/incentives/${id}`
  return `<a href="${url}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;">${esc(label)}</a>`
}

async function authorizerEmails(admin: ReturnType<typeof createAdminClient>): Promise<string[]> {
  const { data } = await admin
    .from("users")
    .select("email, role:roles!inner(name)")
    .eq("is_active", true)
    .in("role.name", INCENTIVE_AUTHORIZER_ROLES)
  return Array.from(
    new Set((data || []).map((u: { email: string | null }) => u.email?.trim()).filter((e): e is string => !!e)),
  )
}

export async function buildIncentiveNotification(
  id: string,
  event: IncentiveEvent,
): Promise<IncentiveNotification | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("incentives")
    .select(
      `id, incentive_number, staff_id, incentive_type, amount, description, request_date,
       pay_in_payroll_date, rejection_reason,
       staff:staff_id(first_name, last_name),
       agency:agency_id(name),
       currency:currency_id(code)`,
    )
    .eq("id", id)
    .single<IncentiveRow>()

  if (error || !data) return null

  const staff = one(data.staff)
  const employee = `${staff?.first_name ?? ""} ${staff?.last_name ?? ""}`.trim() || "Empleado"
  const agency = one(data.agency)?.name ?? ""
  const code = one(data.currency)?.code ?? "MXN"
  const typeLabel = INCENTIVE_TYPE_LABELS[data.incentive_type] ?? data.incentive_type
  const folio = data.incentive_number ? ` ${data.incentive_number}` : ""

  const rows = [
    detailRow("Empleado", esc(employee)),
    agency ? detailRow("Agencia", esc(agency)) : "",
    detailRow("Tipo", esc(typeLabel)),
    detailRow("Monto", esc(formatIncentiveAmount(Number(data.amount), code))),
    detailRow("Solicitado", esc(formatDateOnly(data.request_date))),
    data.pay_in_payroll_date ? detailRow("Pagar en la nómina de", esc(formatDateOnly(data.pay_in_payroll_date))) : "",
    data.description ? detailRow("Motivo", esc(data.description)) : "",
  ]

  if (event === "created") {
    const to = await authorizerEmails(admin)
    if (to.length === 0) return null
    const subject = `Incentivo${folio} pendiente de autorización: ${employee}`
    const html = wrap(
      subject,
      `<p style="margin:0 0 16px;">Se registró un incentivo que requiere tu autorización.</p>
       <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">${rows.join("")}</table>
       ${reviewButton(data.id, "Revisar incentivo")}`,
    )
    return { to, subject, html }
  }

  const email = await getNotificationEmail(data.staff_id)
  if (!email) return null

  if (event === "approved") {
    const subject = `Tu incentivo${folio} fue aprobado`
    const html = wrap(
      subject,
      `<p style="margin:0 0 16px;">Hola ${esc(staff?.first_name ?? "")}, tu incentivo fue aprobado y se incluirá en la nómina indicada.</p>
       <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">${rows.join("")}</table>`,
    )
    return { to: [email], subject, html }
  }

  const subject = `Tu incentivo${folio} fue rechazado`
  const reason = data.rejection_reason ? detailRow("Motivo del rechazo", esc(data.rejection_reason)) : ""
  const html = wrap(
    subject,
    `<p style="margin:0 0 16px;">Hola ${esc(staff?.first_name ?? "")}, tu incentivo no fue aprobado.</p>
     <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">${rows.join("")}${reason}</table>`,
  )
  return { to: [email], subject, html }
}
