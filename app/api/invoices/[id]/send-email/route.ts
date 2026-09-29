import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/email"
import { renderInvoicePdf, type InvoicePdfData } from "@/lib/invoice-pdf"

export const runtime = "nodejs"

// Límite defensivo para adjuntos extra (por archivo y en total).
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024 // 10 MB por archivo
const MAX_TOTAL_ATTACHMENT_BYTES = 20 * 1024 * 1024 // 20 MB en total

function serviceClient() {
  return createSupabaseClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  // 1) Exigir sesión (igual que /api/notify).
  const supabase = await createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  // 2) Leer el formulario (campos + adjuntos extra).
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

  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json(
      { error: "Correo del destinatario inválido" },
      { status: 400 },
    )
  }

  // 3) Cargar la factura con service role (lectura confiable sin depender de RLS).
  const db = serviceClient()
  const { data: invoice, error: invoiceError } = await db
    .from("invoices")
    .select(
      `
      id, invoice_number, issue_date, due_date, subtotal, discount_amount,
      tax_amount, total_amount, notes,
      client:clients(id, company_name, rfc, billing_email, primary_contact_email, address),
      agency:agencies(id, name, legal_name, tax_id, address, phone, email, settings),
      currency:currencies(id, code, symbol)
    `,
    )
    .eq("id", id)
    .single()

  if (invoiceError || !invoice) {
    return NextResponse.json(
      { error: "Factura no encontrada" },
      { status: 404 },
    )
  }

  const client = Array.isArray(invoice.client) ? invoice.client[0] : invoice.client
  const agency = Array.isArray(invoice.agency) ? invoice.agency[0] : invoice.agency
  const currency = Array.isArray(invoice.currency) ? invoice.currency[0] : invoice.currency

  const { data: itemRows } = await db
    .from("invoice_items")
    .select("description, quantity, unit_price, subtotal, service:services(id, name)")
    .eq("invoice_id", id)
    .order("sort_order")

  const items = (itemRows || []).map((row) => {
    const service = Array.isArray(row.service) ? row.service[0] : row.service
    const quantity = Number(row.quantity) || 0
    const unitPrice = Number(row.unit_price) || 0
    const lineTotal =
      row.subtotal != null ? Number(row.subtotal) : quantity * unitPrice
    return {
      description: row.description,
      service_name: service?.name ?? null,
      quantity,
      unit_price: unitPrice,
      line_total: lineTotal,
    }
  })

  const branding =
    (agency?.settings as { branding?: Record<string, string> } | null)?.branding || {}

  const pdfData: InvoicePdfData = {
    invoice_number: invoice.invoice_number,
    issue_date: invoice.issue_date,
    due_date: invoice.due_date,
    currency_code: currency?.code || "MXN",
    subtotal: Number(invoice.subtotal) || 0,
    discount_amount: Number(invoice.discount_amount) || 0,
    tax_amount: Number(invoice.tax_amount) || 0,
    total_amount: Number(invoice.total_amount) || 0,
    notes: invoice.notes,
    agency: {
      name: agency?.name || "Orbit",
      legal_name: agency?.legal_name ?? null,
      tax_id: agency?.tax_id ?? null,
      address: agency?.address ?? null,
      phone: agency?.phone ?? null,
      email: agency?.email ?? null,
      primary_color: branding.primary_color || "#0f172a",
      secondary_color: branding.secondary_color || "#64748b",
      text_color: branding.text_color || "#0f172a",
    },
    client: {
      company_name: client?.company_name || "Cliente",
      rfc: client?.rfc ?? null,
      address: client?.address ?? null,
      email: client?.billing_email || client?.primary_contact_email || null,
    },
    items,
  }

  // 4) Generar el PDF de la factura.
  let invoicePdf: Buffer
  try {
    invoicePdf = await renderInvoicePdf(pdfData)
  } catch (error) {
    console.error("[invoice-send] Error al generar PDF", error)
    return NextResponse.json(
      { error: "No se pudo generar el PDF de la factura" },
      { status: 500 },
    )
  }

  // 5) Recolectar adjuntos extra del formulario.
  const attachments: { filename: string; content: Buffer; contentType?: string }[] = [
    {
      filename: `Factura-${invoice.invoice_number}.pdf`,
      content: invoicePdf,
      contentType: "application/pdf",
    },
  ]

  let totalBytes = invoicePdf.byteLength
  const extraFiles = form.getAll("attachments").filter((f): f is File => f instanceof File)
  for (const file of extraFiles) {
    if (file.size === 0) continue
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return NextResponse.json(
        { error: `El archivo "${file.name}" supera el límite de 10 MB` },
        { status: 400 },
      )
    }
    totalBytes += file.size
    if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
      return NextResponse.json(
        { error: "Los adjuntos superan el límite total de 20 MB" },
        { status: 400 },
      )
    }
    const buf = Buffer.from(await file.arrayBuffer())
    attachments.push({
      filename: file.name,
      content: buf,
      contentType: file.type || undefined,
    })
  }

  // 6) Construir asunto y cuerpo, y enviar.
  const subject =
    subjectInput || `Factura ${invoice.invoice_number} · ${pdfData.agency.name}`
  const ccList = cc
    ? cc.split(/[,;]+/).map((s) => s.trim()).filter(Boolean)
    : undefined

  const safeMessage = (message || "").replace(/\n/g, "<br />")
  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
      <p>Estimado cliente de <strong>${pdfData.client.company_name}</strong>,</p>
      ${
        safeMessage
          ? `<p>${safeMessage}</p>`
          : `<p>Adjuntamos la factura <strong>${invoice.invoice_number}</strong> por un total de <strong>${new Intl.NumberFormat(
              "es-MX",
              { minimumFractionDigits: 2, maximumFractionDigits: 2 },
            ).format(pdfData.total_amount)} ${pdfData.currency_code}</strong>.</p>`
      }
      <p style="color:#64748b; font-size: 13px;">Este correo fue enviado desde Orbit por ${pdfData.agency.name}.</p>
    </div>
  `

  let sendResult: { skipped?: boolean; messageId?: string }
  try {
    sendResult = await sendEmail({
      to,
      cc: ccList,
      subject,
      html,
      replyTo: pdfData.agency.email || undefined,
      attachments,
    })
  } catch (error) {
    console.error("[invoice-send] Error al enviar correo", error)
    return NextResponse.json(
      { error: "No se pudo enviar el correo" },
      { status: 502 },
    )
  }

  // 7) Registrar el envío (bitácora + campos denormalizados en la factura).
  const sentAt = new Date().toISOString()
  const extraCount = attachments.length - 1

  const { error: logError } = await db.from("invoice_emails").insert({
    invoice_id: id,
    sent_at: sentAt,
    sent_by: authUser.id,
    sent_to: to,
    cc: cc || null,
    subject,
    message: message || null,
    attachments_count: extraCount,
  })
  if (logError) {
    console.error("[invoice-send] No se pudo registrar la bitácora", logError.message)
  }

  // Incrementa el contador de envíos y guarda el último destinatario/fecha.
  const { data: current } = await db
    .from("invoices")
    .select("email_sent_count")
    .eq("id", id)
    .single()
  const nextCount = (Number(current?.email_sent_count) || 0) + 1

  const { error: updateError } = await db
    .from("invoices")
    .update({
      email_sent_at: sentAt,
      email_sent_count: nextCount,
      email_last_sent_to: to,
      updated_at: sentAt,
    })
    .eq("id", id)
  if (updateError) {
    console.error("[invoice-send] No se pudo actualizar la factura", updateError.message)
  }

  return NextResponse.json({
    ok: true,
    skipped: sendResult.skipped ?? false,
    sent_at: sentAt,
    sent_to: to,
    attachments_count: extraCount,
  })
}
