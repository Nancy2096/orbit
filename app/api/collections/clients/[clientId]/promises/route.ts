import { NextResponse } from "next/server"
import { loadAccessibleClient, requireCollectionsAccess } from "@/lib/collections/access"
import { MAX_NOTE_LENGTH, OPEN_INVOICE_STATUSES, isIsoDate, toLocalIsoDate } from "@/lib/collections/rules"

export const runtime = "nodejs"

export async function POST(request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const access = await requireCollectionsAccess()
  if (access instanceof NextResponse) return access

  const { clientId } = await params
  const { client, error } = await loadAccessibleClient(access, clientId)
  if (error) return error

  const body = await request.json().catch(() => null)
  const promisedDate = body?.promisedDate
  const amount = Number(body?.amount)
  const currencyCode = typeof body?.currency === "string" ? body.currency.toUpperCase() : "MXN"
  const note = typeof body?.note === "string" ? body.note.trim() : ""

  if (!isIsoDate(promisedDate)) return NextResponse.json({ error: "Fecha de compromiso inválida" }, { status: 400 })
  if (promisedDate < toLocalIsoDate(new Date())) {
    return NextResponse.json({ error: "La fecha del compromiso no puede ser anterior a hoy" }, { status: 400 })
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "El monto debe ser mayor a cero" }, { status: 400 })
  }
  if (note.length > MAX_NOTE_LENGTH) {
    return NextResponse.json({ error: `La nota no puede exceder ${MAX_NOTE_LENGTH} caracteres` }, { status: 400 })
  }

  const { service } = access
  const { data: currency } = await service.from("currencies").select("id, code").eq("code", currencyCode).maybeSingle()
  if (!currency) return NextResponse.json({ error: "Moneda inválida" }, { status: 400 })

  const { data: open } = await service
    .from("invoices")
    .select("balance_due")
    .eq("client_id", client.id)
    .eq("currency_id", currency.id)
    .in("status", [...OPEN_INVOICE_STATUSES])
    .gt("balance_due", 0)
  const openBalance = (open ?? []).reduce((sum, i) => sum + (Number(i.balance_due) || 0), 0)
  if (openBalance <= 0) {
    return NextResponse.json({ error: `El cliente no tiene saldo pendiente en ${currency.code}` }, { status: 400 })
  }
  if (amount > openBalance + 0.005) {
    return NextResponse.json(
      { error: `El monto excede el saldo pendiente en ${currency.code} (${openBalance.toFixed(2)})` },
      { status: 400 },
    )
  }

  const roundedAmount = Math.round(amount * 100) / 100
  const { error: insertError } = await service.from("payment_promises").insert({
    agency_id: client.agency_id,
    client_id: client.id,
    promised_date: promisedDate,
    amount: roundedAmount,
    currency_id: currency.id,
    note: note || null,
    created_by: access.userId,
  })
  if (insertError) {
    console.error("[collections] Error al registrar compromiso:", insertError)
    return NextResponse.json({ error: "No se pudo registrar el compromiso" }, { status: 500 })
  }

  await service.from("collection_activities").insert({
    agency_id: client.agency_id,
    client_id: client.id,
    activity_type: "promise",
    note: note || null,
    metadata: { action: "created", promised_date: promisedDate, amount: roundedAmount, currency: currency.code },
    created_by: access.userId,
  })

  return NextResponse.json({ ok: true })
}
