import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/email"
import { generateInvoicePdf, type InvoicePdfItem } from "@/lib/invoice-pdf"
import { getModulesForPath } from "@/lib/permission-access"
import {
  MAX_ATTACHMENTS_TOTAL_BYTES,
  MAX_CC_RECIPIENTS,
  MAX_TO_RECIPIENTS,
  NON_SENDABLE_INVOICE_STATUSES,
  attachmentsTooLargeMessage,
  buildDefaultInvoiceSubject,
  formatInvoiceMonth,
  isValidEmail,
  parseEmailList,
  validateCfdiFiles,
  validateEmailList,
} from "@/lib/invoice-email-rules"

export const runtime = "nodejs"

type ServiceClient = ReturnType<typeof createServiceClient>

interface SenderAccess {
  canUseInvoices: boolean
  allAgencies: boolean
  agencyIds: Set<string>
}

// Mismo criterio que el panel: superadmin tiene acceso total; el resto necesita
// alguno de los módulos de la ruta /dashboard/invoices. is_global_access solo
// amplía el alcance a todas las agencias, no otorga módulos.
async function getSenderAccess(service: ServiceClient, userId: string): Promise<SenderAccess> {
  const { data: userRow } = await service
    .from("users")
    .select("role_id, is_global_access, is_active, role:roles(name)")
    .eq("id", userId)
    .maybeSingle()

  const none: SenderAccess = { canUseInvoices: false, allAgencies: false, agencyIds: new Set() }
  if (!userRow || userRow.is_active === false) return none

  const role = Array.isArray(userRow.role) ? userRow.role[0] : userRow.role
  const isSuperadmin = role?.name === "superadmin"

  let canUseInvoices = isSuperadmin
  if (!canUseInvoices && userRow.role_id) {
    const requiredModules = getModulesForPath("/dashboard/invoices") ?? []
    const { data: rolePerms } = await service
      .from("role_permissions")
      .select("permission:permissions(module)")
      .eq("role_id", userRow.role_id)
    canUseInvoices = (rolePerms ?? []).some((row) => {
      const perm = Array.isArray(row.permission) ? row.permission[0] : row.permission
      return !!perm?.module && requiredModules.includes(perm.module)
    })
  }

  const allAgencies = isSuperadmin || userRow.is_global_access === true
  let agencyIds = new Set<string>()
  if (!allAgencies) {
    const { data: links } = await service.from("user_agencies").select("agency_id").eq("user_id", userId)
    agencyIds = new Set((links ?? []).map((l) => l.agency_id as string))
  }

  return { canUseInvoices, allAgencies, agencyIds }
}

function resolveReplyTo(agencyEmail: string | null | undefined, invoiceNumber: string): string | undefined {
  const candidates = [agencyEmail?.trim(), process.env.FINANCE_REPLY_TO?.trim()]
  const replyTo = candidates.find((value): value is string => !!value && isValidEmail(value))
  if (!replyTo) {
    console.warn(
      `[invoices/send-email] Factura ${invoiceNumber}: sin Reply-To (agencies.email vacío y FINANCE_REPLY_TO no configurado o inválido)`,
    )
  }
  return replyTo
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function formatAmount(amount: number | null | undefined, symbol: string): string {
  const value = typeof amount === "number" && Number.isFinite(amount) ? amount : 0
  return `${symbol}${value.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDueDate(value: string | null | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || "")
  if (!match) return "Sin fecha"
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
}

function buildHtml(params: {
  clientName: string
  agencyName: string
  period: string
  total: string
  currencyCode: string
  dueDate: string
  message: string
  includesSummary: boolean
}): string {
  const { clientName, agencyName, period, total, currencyCode, dueDate, message, includesSummary } = params
  const paragraphs = message
    .split(/\n+/)
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 12px">${escapeHtml(line)}</p>`)
    .join("")

  const periodText = period ? ` correspondiente a <strong>${escapeHtml(period)}</strong>` : ""
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#6b7280">${label}</td><td style="padding:6px 0;font-weight:bold;color:#111827">${escapeHtml(value)}</td></tr>`

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;max-width:560px;margin:0 auto">
      <p style="margin:0 0 12px">Estimado(a) ${escapeHtml(clientName)},</p>
      <p style="margin:0 0 16px">Adjuntamos el CFDI (PDF y XML) de la factura de <strong>${escapeHtml(
        clientName,
      )}</strong>${periodText}.</p>
      <table style="border-collapse:collapse;margin:0 0 16px;font-size:14px">
        ${row("Total", total)}
        ${row("Moneda", currencyCode || "—")}
        ${row("Fecha de vencimiento", dueDate)}
      </table>
      ${paragraphs}
      ${
        includesSummary
          ? `<p style="margin:0 0 12px;color:#6b7280;font-size:13px">También se incluye un resumen informativo generado por Orbit, que no es un CFDI.</p>`
          : ""
      }
      <p style="margin:0 0 12px">Quedamos atentos a cualquier duda.</p>
      <p style="margin:24px 0 0;color:#6b7280;font-size:13px">${escapeHtml(agencyName)}</p>
    </div>
  `
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  // 1) Exigir sesión de usuario.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const service = createServiceClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const access = await getSenderAccess(service, user.id)
  if (!access.canUseInvoices) {
    return NextResponse.json(
      { error: "No tienes permiso para enviar facturas (módulo de Facturas)" },
      { status: 403 },
    )
  }

  // 2) Leer el formulario (multipart) con destinatarios y adjuntos.
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const toList = parseEmailList(String(form.get("to") || ""))
  const ccList = parseEmailList(String(form.get("cc") || ""))
  const subjectInput = String(form.get("subject") || "").trim()
  const message = String(form.get("message") || "").trim()

  const recipientsError =
    validateEmailList(toList, { field: "Para", max: MAX_TO_RECIPIENTS, required: true }) ||
    validateEmailList(ccList, { field: "CC", max: MAX_CC_RECIPIENTS })
  if (recipientsError) {
    return NextResponse.json({ error: recipientsError }, { status: 400 })
  }

  const to = toList.join(", ")
  const cc = ccList.join(", ")

  // 3) Cargar la factura con datos para el PDF (service role: lectura consistente).
  const { data: invoice, error: invoiceError } = await service
    .from("invoices")
    .select(
      `
      id,
      invoice_number,
      agency_id,
      status,
      issue_date,
      due_date,
      subtotal,
      tax_amount,
      discount_amount,
      total_amount,
      notes,
      email_sent_count,
      client:clients(company_name, address),
      agency:agencies(name, legal_name, tax_id, address, phone, email, website),
      currency:currencies(code, symbol)
    `,
    )
    .eq("id", id)
    .single()

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
  }

  if (!access.allAgencies && (!invoice.agency_id || !access.agencyIds.has(invoice.agency_id))) {
    return NextResponse.json(
      { error: "No tienes acceso a la agencia de esta factura" },
      { status: 403 },
    )
  }

  const blockedReason = NON_SENDABLE_INVOICE_STATUSES[invoice.status]
  if (blockedReason) {
    return NextResponse.json({ error: blockedReason }, { status: 409 })
  }

  // Validar el tamaño antes de generar el PDF para no hacer trabajo innecesario.
  const extraFiles = form
    .getAll("attachments")
    .filter((f): f is File => f instanceof File && f.size > 0)
  const totalExtra = extraFiles.reduce((sum, file) => sum + file.size, 0)
  if (totalExtra > MAX_ATTACHMENTS_TOTAL_BYTES) {
    return NextResponse.json({ error: attachmentsTooLargeMessage(totalExtra) }, { status: 413 })
  }

  const cfdiError = validateCfdiFiles(extraFiles.map((f) => f.name))
  if (cfdiError) {
    return NextResponse.json({ error: cfdiError }, { status: 400 })
  }

  const includeOrbitSummary = form.get("include_orbit_summary") === "true"

  const client = Array.isArray(invoice.client) ? invoice.client[0] : invoice.client
  const agency = Array.isArray(invoice.agency) ? invoice.agency[0] : invoice.agency
  const currency = Array.isArray(invoice.currency) ? invoice.currency[0] : invoice.currency

  const attachments: { filename: string; content: Buffer; contentType?: string }[] = []

  // 4) Resumen informativo de Orbit (opcional, no es un CFDI).
  if (includeOrbitSummary) {
    const { data: itemRows } = await service
      .from("invoice_items")
      .select("description, quantity, unit_price, subtotal, sort_order")
      .eq("invoice_id", id)
      .order("sort_order")

    const items: InvoicePdfItem[] = (itemRows || []).map((row) => ({
      description: row.description,
      quantity: row.quantity,
      unit_price: row.unit_price,
      subtotal: row.subtotal,
    }))

    try {
      const pdfBuffer = await generateInvoicePdf({
        invoice_number: invoice.invoice_number,
        status: invoice.status,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        subtotal: invoice.subtotal,
        tax_amount: invoice.tax_amount,
        discount_amount: invoice.discount_amount,
        total_amount: invoice.total_amount,
        notes: invoice.notes,
        currency,
        client,
        agency,
        items,
      })
      attachments.push({
        filename: `Resumen-Factura-${invoice.invoice_number}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      })
    } catch (error) {
      console.error("[invoices/send-email] Error generando el resumen PDF:", error)
      return NextResponse.json({ error: "No se pudo generar el resumen de Orbit" }, { status: 500 })
    }
  }

  // 5) Archivos del CFDI (PDF y XML) y otros adjuntos del usuario.
  for (const file of extraFiles) {
    const arrayBuffer = await file.arrayBuffer()
    attachments.push({
      filename: file.name,
      content: Buffer.from(arrayBuffer),
      contentType: file.type || undefined,
    })
  }

  const subject = subjectInput || buildDefaultInvoiceSubject(client?.company_name, invoice.issue_date)
  const replyTo = resolveReplyTo(agency?.email, invoice.invoice_number)

  // 6) Enviar el correo (respeta EMAIL_NOTIFICATIONS_ENABLED / EMAIL_TEST_RECIPIENT).
  let result
  try {
    result = await sendEmail({
      to: toList,
      cc: ccList.length > 0 ? ccList : undefined,
      replyTo,
      subject,
      html: buildHtml({
        clientName: client?.company_name || "cliente",
        agencyName: agency?.name || agency?.legal_name || "Orbit",
        period: formatInvoiceMonth(invoice.issue_date),
        total: formatAmount(invoice.total_amount, currency?.symbol || "$"),
        currencyCode: currency?.code || "",
        dueDate: formatDueDate(invoice.due_date),
        message,
        includesSummary: includeOrbitSummary,
      }),
      attachments,
    })
  } catch (error) {
    console.error("[invoices/send-email] Error enviando correo:", error)
    return NextResponse.json({ error: "No se pudo enviar el correo" }, { status: 500 })
  }

  if (result.skipped) {
    return NextResponse.json({ skipped: true, sent_to: to })
  }

  // 7) Registrar el envío (bitácora + campos denormalizados en la factura).
  const nowIso = new Date().toISOString()

  await service.from("invoice_emails").insert({
    invoice_id: id,
    sent_by: user.id,
    sent_to: to,
    cc: cc || null,
    subject,
    message: message || null,
    attachments_count: attachments.length,
  })

  await service
    .from("invoices")
    .update({
      email_sent_at: nowIso,
      email_sent_count: (invoice.email_sent_count || 0) + 1,
      email_last_sent_to: to,
    })
    .eq("id", id)

  return NextResponse.json({ sent_to: to, sent_at: nowIso })
}
