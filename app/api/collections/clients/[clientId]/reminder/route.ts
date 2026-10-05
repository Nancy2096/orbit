import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"
import { loadAccessibleClient, requireCollectionsAccess } from "@/lib/collections/access"
import { MAX_NOTE_LENGTH, OPEN_INVOICE_STATUSES, daysBetween, toLocalIsoDate } from "@/lib/collections/rules"
import {
  MAX_CC_RECIPIENTS,
  MAX_TO_RECIPIENTS,
  isValidEmail,
  parseEmailList,
  validateEmailList,
} from "@/lib/invoice-email-rules"

export const runtime = "nodejs"

const MAX_SUBJECT_LENGTH = 200

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function formatMoney(amount: number, currency: string): string {
  return `$${amount.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
}

function formatDate(iso: string | null): string {
  if (!iso) return "Sin fecha"
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
}

export async function POST(request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const access = await requireCollectionsAccess()
  if (access instanceof NextResponse) return access

  const { clientId } = await params
  const { client, error } = await loadAccessibleClient(access, clientId)
  if (error) return error

  const body = await request.json().catch(() => null)
  const to = parseEmailList(typeof body?.to === "string" ? body.to : "")
  const cc = parseEmailList(typeof body?.cc === "string" ? body.cc : "")
  const subject = typeof body?.subject === "string" ? body.subject.trim() : ""
  const message = typeof body?.message === "string" ? body.message.trim() : ""

  const recipientsError =
    validateEmailList(to, { field: "Para", max: MAX_TO_RECIPIENTS, required: true }) ||
    validateEmailList(cc, { field: "CC", max: MAX_CC_RECIPIENTS })
  if (recipientsError) return NextResponse.json({ error: recipientsError }, { status: 400 })
  if (!subject || subject.length > MAX_SUBJECT_LENGTH) {
    return NextResponse.json({ error: `El asunto es obligatorio (máx. ${MAX_SUBJECT_LENGTH} caracteres)` }, { status: 400 })
  }
  if (message.length > MAX_NOTE_LENGTH * 3) {
    return NextResponse.json({ error: "El mensaje es demasiado largo" }, { status: 400 })
  }

  const { service } = access
  const today = toLocalIsoDate(new Date())
  const [{ data: invoices }, { data: agency }] = await Promise.all([
    service
      .from("invoices")
      .select("invoice_number, due_date, balance_due, currency:currencies(code)")
      .eq("client_id", client.id)
      .in("status", [...OPEN_INVOICE_STATUSES])
      .gt("balance_due", 0)
      .order("due_date", { ascending: true }),
    service.from("agencies").select("name, email").eq("id", client.agency_id).maybeSingle(),
  ])

  if (!invoices || invoices.length === 0) {
    return NextResponse.json({ error: "El cliente no tiene facturas pendientes" }, { status: 409 })
  }

  const rowsHtml = invoices
    .map((inv) => {
      const currency = (Array.isArray(inv.currency) ? inv.currency[0] : inv.currency) as { code?: string } | null
      const days = inv.due_date ? daysBetween(inv.due_date, today) : 0
      const statusText = days > 0 ? `Vencida hace ${days} día${days === 1 ? "" : "s"}` : "Por vencer"
      const cell = "padding:8px;border-bottom:1px solid #e5e7eb"
      return `<tr><td style="${cell}">${escapeHtml(inv.invoice_number || "—")}</td><td style="${cell}">${escapeHtml(
        formatDate(inv.due_date),
      )}</td><td style="${cell};text-align:right">${escapeHtml(
        formatMoney(Number(inv.balance_due) || 0, currency?.code || "MXN"),
      )}</td><td style="${cell}">${statusText}</td></tr>`
    })
    .join("")

  const paragraphs = message
    .split(/\n+/)
    .filter(Boolean)
    .map((line: string) => `<p style="margin:0 0 12px">${escapeHtml(line)}</p>`)
    .join("")
  const agencyName = agency?.name || "Orbit"
  const head = "padding:8px;text-align:left;color:#6b7280;font-weight:normal;border-bottom:1px solid #e5e7eb"

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;max-width:600px;margin:0 auto">
      <p style="margin:0 0 12px">Estimado(a) ${escapeHtml(client.primary_contact_name || client.company_name || "cliente")},</p>
      ${paragraphs}
      <p style="margin:16px 0 8px">Estado de cuenta de <strong>${escapeHtml(client.company_name || "")}</strong>:</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 16px">
        <thead><tr><th style="${head}">Factura</th><th style="${head}">Vencimiento</th><th style="${head};text-align:right">Saldo</th><th style="${head}">Estado</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <p style="margin:0 0 12px">Si ya realizaste el pago, por favor responde a este correo con el comprobante para aplicarlo.</p>
      <p style="margin:0">Saludos,<br/>${escapeHtml(agencyName)}</p>
    </div>`

  const replyTo = [agency?.email?.trim(), process.env.FINANCE_REPLY_TO?.trim()].find(
    (value): value is string => !!value && isValidEmail(value),
  )
  if (!replyTo) {
    console.warn(`[collections/reminder] Cliente ${client.id}: sin Reply-To (agencies.email y FINANCE_REPLY_TO vacíos)`)
  }

  try {
    const result = await sendEmail({ to, cc, subject, html, replyTo })
    await service.from("collection_activities").insert({
      agency_id: client.agency_id,
      client_id: client.id,
      activity_type: "email",
      note: subject,
      metadata: { to, cc, skipped: result.skipped === true, invoices: invoices.length },
      created_by: access.userId,
    })
    return NextResponse.json({ ok: true, skipped: result.skipped === true })
  } catch (sendError) {
    console.error("[collections/reminder] Error al enviar:", sendError)
    return NextResponse.json({ error: "No se pudo enviar el correo. Intenta de nuevo." }, { status: 502 })
  }
}
