import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"
import { computeTotals, formatCurrency, periodLabel } from "@/lib/pre-invoices"

// POST: envía la prefactura por correo al cliente usando Resend.
// Solo incluye los servicios marcados como incluidos (entregados).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Falta configurar RESEND_API_KEY para enviar correos." },
      { status: 400 },
    )
  }

  let to: string
  try {
    const body = await request.json()
    to = body.to
  } catch {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido" }, { status: 400 })
  }

  if (!to) {
    return NextResponse.json({ error: "Correo de destino requerido" }, { status: 400 })
  }

  const supabase = await createClient()

  // Verifica la sesión (misma capa de auth que el resto de la app)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { data: preInvoice, error: piError } = await supabase
    .from("pre_invoices")
    .select("*")
    .eq("id", id)
    .single()

  if (piError || !preInvoice) {
    return NextResponse.json({ error: "No se encontró la prefactura" }, { status: 404 })
  }

  const { data: items } = await supabase
    .from("pre_invoice_items")
    .select("*")
    .eq("pre_invoice_id", id)
    .eq("is_included", true)
    .order("sort_order", { ascending: true })

  const includedItems = items || []
  if (includedItems.length === 0) {
    return NextResponse.json(
      { error: "No hay servicios incluidos para enviar" },
      { status: 400 },
    )
  }

  const totals = computeTotals(includedItems.map((i) => ({ amount: i.amount, is_included: true })))

  // Datos para el encabezado del correo
  let clientName = ""
  let agencyName = ""
  if (preInvoice.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("name")
      .eq("id", preInvoice.client_id)
      .single()
    clientName = client?.name || ""
  }
  if (preInvoice.agency_id) {
    const { data: agency } = await supabase
      .from("agencies")
      .select("name")
      .eq("id", preInvoice.agency_id)
      .single()
    agencyName = agency?.name || ""
  }

  const currency = preInvoice.currency
  const rows = includedItems
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">${escapeHtml(item.description)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(item.amount, currency)}</td>
        </tr>`,
    )
    .join("")

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#111;">
    <h2 style="margin-bottom:4px;">Pre-Factura ${escapeHtml(preInvoice.pre_invoice_number)}</h2>
    <p style="color:#666;margin-top:0;">${escapeHtml(agencyName)} · ${periodLabel(preInvoice.period_start)}</p>
    ${clientName ? `<p>Estimado(a) <strong>${escapeHtml(clientName)}</strong>,</p>` : ""}
    <p>Adjuntamos el detalle de los servicios correspondientes al periodo.</p>
    <table style="width:100%;border-collapse:collapse;margin-top:16px;">
      <thead>
        <tr style="text-align:left;color:#666;border-bottom:2px solid #333;">
          <th style="padding-bottom:8px;">Servicio</th>
          <th style="padding-bottom:8px;text-align:right;">Cant.</th>
          <th style="padding-bottom:8px;text-align:right;">Importe</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <table style="width:240px;margin-left:auto;margin-top:16px;">
      <tr><td style="color:#666;">Subtotal</td><td style="text-align:right;">${formatCurrency(totals.subtotal, currency)}</td></tr>
      <tr><td style="color:#666;">IVA (16%)</td><td style="text-align:right;">${formatCurrency(totals.tax, currency)}</td></tr>
      <tr style="font-weight:bold;border-top:1px solid #333;"><td style="padding-top:8px;">Total</td><td style="padding-top:8px;text-align:right;">${formatCurrency(totals.total, currency)}</td></tr>
    </table>
    ${preInvoice.notes ? `<p style="margin-top:24px;color:#666;">${escapeHtml(preInvoice.notes)}</p>` : ""}
    <p style="margin-top:24px;color:#999;font-size:12px;">Este documento es una prefactura y no tiene validez fiscal.</p>
  </div>`

  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"

  const { error: sendError } = await resend.emails.send({
    from: fromAddress,
    to,
    subject: `Pre-Factura ${preInvoice.pre_invoice_number} · ${periodLabel(preInvoice.period_start)}`,
    html,
  })

  if (sendError) {
    return NextResponse.json({ error: sendError.message }, { status: 502 })
  }

  // Marca la prefactura como enviada (sin degradar una ya facturada)
  const nextStatus = preInvoice.status === "invoiced" ? "invoiced" : "sent"
  await supabase
    .from("pre_invoices")
    .update({ status: nextStatus, sent_at: new Date().toISOString(), sent_to: to })
    .eq("id", id)

  return NextResponse.json({ success: true })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
