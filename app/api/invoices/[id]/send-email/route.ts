import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/email"
import { generateInvoicePdf, type InvoicePdfItem } from "@/lib/invoice-pdf"

export const runtime = "nodejs"

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB por archivo
const MAX_TOTAL_BYTES = 20 * 1024 * 1024 // 20 MB en total (adjuntos extra)

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function buildHtml(params: {
  invoiceNumber: string
  clientName: string
  agencyName: string
  message: string
}): string {
  const { invoiceNumber, clientName, agencyName, message } = params
  const paragraphs = message
    .split(/\n+/)
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 12px">${escapeHtml(line)}</p>`)
    .join("")

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;max-width:560px;margin:0 auto">
      <h2 style="color:#111827;margin:0 0 16px">Factura ${escapeHtml(invoiceNumber)}</h2>
      <p style="margin:0 0 12px">Estimado(a) ${escapeHtml(clientName)},</p>
      ${
        paragraphs ||
        `<p style="margin:0 0 12px">Adjuntamos la factura <strong>${escapeHtml(
          invoiceNumber,
        )}</strong> en formato PDF. Quedamos atentos a cualquier duda.</p>`
      }
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

  // 2) Leer el formulario (multipart) con destinatarios y adjuntos.
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const to = String(form.get("to") || "").trim()
  const cc = String(form.get("cc") || "").trim()
  const subjectInput = String(form.get("subject") || "").trim()
  const message = String(form.get("message") || "").trim()

  if (!to) {
    return NextResponse.json({ error: "Falta el correo del destinatario" }, { status: 400 })
  }

  // 3) Cargar la factura con datos para el PDF (service role: lectura consistente).
  const service = createServiceClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const { data: invoice, error: invoiceError } = await service
    .from("invoices")
    .select(
      `
      id,
      invoice_number,
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

  const client = Array.isArray(invoice.client) ? invoice.client[0] : invoice.client
  const agency = Array.isArray(invoice.agency) ? invoice.agency[0] : invoice.agency
  const currency = Array.isArray(invoice.currency) ? invoice.currency[0] : invoice.currency

  // 4) Generar el PDF de la factura.
  let pdfBuffer: Buffer
  try {
    pdfBuffer = await generateInvoicePdf({
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
  } catch (error) {
    console.error("[invoices/send-email] Error generando PDF:", error)
    return NextResponse.json({ error: "No se pudo generar el PDF de la factura" }, { status: 500 })
  }

  // 5) Construir adjuntos: PDF de la factura + archivos extra (con límites).
  const attachments: { filename: string; content: Buffer; contentType?: string }[] = [
    {
      filename: `Factura-${invoice.invoice_number}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf",
    },
  ]

  const extraFiles = form.getAll("attachments").filter((f): f is File => f instanceof File)
  let totalExtra = 0
  for (const file of extraFiles) {
    if (file.size === 0) continue
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `El archivo "${file.name}" supera el límite de 10 MB` },
        { status: 400 },
      )
    }
    totalExtra += file.size
    if (totalExtra > MAX_TOTAL_BYTES) {
      return NextResponse.json(
        { error: "Los adjuntos superan el límite total de 20 MB" },
        { status: 400 },
      )
    }
    const arrayBuffer = await file.arrayBuffer()
    attachments.push({
      filename: file.name,
      content: Buffer.from(arrayBuffer),
      contentType: file.type || undefined,
    })
  }

  const subject = subjectInput || `Factura ${invoice.invoice_number}`
  const ccList = cc
    ? cc.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined

  // 6) Enviar el correo (respeta EMAIL_NOTIFICATIONS_ENABLED / EMAIL_TEST_RECIPIENT).
  let result
  try {
    result = await sendEmail({
      to,
      cc: ccList,
      subject,
      html: buildHtml({
        invoiceNumber: invoice.invoice_number,
        clientName: client?.company_name || "cliente",
        agencyName: agency?.name || agency?.legal_name || "Orbit",
        message,
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
