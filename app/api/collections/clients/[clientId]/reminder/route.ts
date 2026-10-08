import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"
import { loadAccessibleClient, requireCollectionsAccess } from "@/lib/collections/access"
import { loadReminderContext, type ReminderContext } from "@/lib/collections/reminder"
import { MAX_NOTE_LENGTH, type ActivityResult } from "@/lib/collections/rules"
import {
  escapeHtml,
  formatLongDate,
  formatMoneyWithCode,
  messageParagraphs,
  wrapEmailDocument,
} from "@/lib/email-format"
import {
  MAX_CC_RECIPIENTS,
  MAX_TO_RECIPIENTS,
  isValidEmail,
  parseEmailList,
  validateEmailList,
} from "@/lib/invoice-email-rules"

export const runtime = "nodejs"

const MAX_SUBJECT_LENGTH = 200

const noAgencyAccess = () =>
  NextResponse.json({ error: "No tienes acceso a la agencia de este cliente" }, { status: 403 })

// Vista previa para el modal: facturas incluidas por moneda, CC sugerido y avisos.
export async function GET(_request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const access = await requireCollectionsAccess()
  if (access instanceof NextResponse) return access

  const { clientId } = await params
  const { client, error } = await loadAccessibleClient(access, clientId)
  if (error) return error

  const context = await loadReminderContext(access, client)
  if (!context) return noAgencyAccess()
  return NextResponse.json(context)
}

function buildHtml(params: { recipientName: string; clientName: string; message: string; context: ReminderContext }) {
  const { recipientName, clientName, message, context } = params
  const cell = "padding:8px;border-bottom:1px solid #e5e7eb"
  const head = "padding:8px;text-align:left;color:#6b7280;font-weight:normal;border-bottom:1px solid #e5e7eb"

  const tables = context.groups
    .map((group) => {
      const rows = group.invoices
        .map((inv) => {
          const statusText =
            inv.daysOverdue > 0 ? `Vencida hace ${inv.daysOverdue} día${inv.daysOverdue === 1 ? "" : "s"}` : "Por vencer"
          return `<tr><td style="${cell}">${escapeHtml(inv.invoiceNumber || "—")}</td><td style="${cell}">${escapeHtml(
            formatLongDate(inv.dueDate),
          )}</td><td style="${cell};text-align:right">${escapeHtml(
            formatMoneyWithCode(inv.balance, group.currency),
          )}</td><td style="${cell}">${statusText}</td></tr>`
        })
        .join("")
      return `
        <p style="margin:16px 0 8px;font-weight:bold">Facturas en ${escapeHtml(group.currency)}</p>
        <table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 8px">
          <thead><tr><th style="${head}">Factura</th><th style="${head}">Vencimiento</th><th style="${head};text-align:right">Saldo</th><th style="${head}">Estado</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><td colspan="2" style="padding:8px;font-weight:bold">Subtotal ${escapeHtml(
            group.currency,
          )}</td><td style="padding:8px;text-align:right;font-weight:bold">${escapeHtml(
            formatMoneyWithCode(group.subtotal, group.currency),
          )}</td><td></td></tr></tfoot>
        </table>`
    })
    .join("")

  return wrapEmailDocument(`
    <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;max-width:600px;margin:0 auto">
      <p style="margin:0 0 12px">Estimado(a) ${escapeHtml(recipientName)},</p>
      ${messageParagraphs(message)}
      <p style="margin:16px 0 0">Estado de cuenta de <strong>${escapeHtml(clientName)}</strong> al ${escapeHtml(
        formatLongDate(context.today),
      )}:</p>
      ${tables}
      <p style="margin:16px 0 12px">Si ya realizaste el pago, por favor responde a este correo con el comprobante para aplicarlo.</p>
      <p style="margin:0">Saludos,<br/>${escapeHtml(context.agencyName)}</p>
    </div>`)
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

  const context = await loadReminderContext(access, client)
  if (!context) return noAgencyAccess()
  if (context.groups.length === 0) {
    return NextResponse.json({ error: "El cliente no tiene facturas pendientes en su agencia" }, { status: 409 })
  }

  const html = buildHtml({
    recipientName: client.primary_contact_name || client.company_name || "cliente",
    clientName: client.company_name || "",
    message,
    context,
  })

  const replyTo = [context.agencyEmail, process.env.FINANCE_REPLY_TO?.trim()].find(
    (value): value is string => !!value && isValidEmail(value),
  )
  if (!replyTo) {
    console.warn(`[collections/reminder] Cliente ${client.id}: sin Reply-To (agencies.email y FINANCE_REPLY_TO vacíos)`)
  }

  let result: ActivityResult
  let sendErrorMessage: string | null = null
  try {
    const sent = await sendEmail({ to, cc, subject, html, replyTo })
    result = sent.skipped === true ? "skipped" : "sent"
  } catch (sendError) {
    console.error("[collections/reminder] Error al enviar:", sendError)
    result = "error"
    sendErrorMessage = (sendError instanceof Error ? sendError.message : String(sendError)).slice(0, 500)
  }

  const { error: logError } = await access.service.from("collection_activities").insert({
    agency_id: client.agency_id,
    client_id: client.id,
    activity_type: "email",
    result,
    note: subject,
    metadata: {
      to,
      cc,
      replyTo: replyTo ?? null,
      invoiceNumbers: context.groups.flatMap((g) => g.invoices.map((inv) => inv.invoiceNumber).filter(Boolean)),
      subtotals: Object.fromEntries(context.groups.map((g) => [g.currency, g.subtotal])),
      ...(sendErrorMessage ? { error: sendErrorMessage } : {}),
    },
    created_by: access.userId,
  })
  if (logError) console.error("[collections/reminder] No se pudo guardar la gestión en el historial:", logError)

  if (result === "error") {
    return NextResponse.json(
      {
        error: `No se pudo enviar el correo. Intenta de nuevo.${logError ? " Tampoco se pudo guardar el intento en el historial." : ""}`,
      },
      { status: 502 },
    )
  }
  return NextResponse.json({ ok: true, skipped: result === "skipped", historyLogged: !logError })
}
