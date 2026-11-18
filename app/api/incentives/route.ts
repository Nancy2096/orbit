import { NextRequest, NextResponse } from "next/server"
import { getIncentiveActor, notifyIncentive } from "@/lib/incentives-server"
import { INCENTIVE_TYPE_LABELS } from "@/lib/incentives"

export const runtime = "nodejs"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : null
}

export async function POST(request: NextRequest) {
  const actor = await getIncentiveActor()
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })

  const agencyId = typeof body.agency_id === "string" ? body.agency_id : ""
  const staffId = typeof body.staff_id === "string" ? body.staff_id : ""
  const incentiveType = typeof body.incentive_type === "string" ? body.incentive_type : ""
  const amount = Math.round(Number(body.amount) * 100) / 100
  const requestDate = typeof body.request_date === "string" && DATE_RE.test(body.request_date) ? body.request_date : null
  const payDate =
    typeof body.pay_in_payroll_date === "string" && DATE_RE.test(body.pay_in_payroll_date)
      ? body.pay_in_payroll_date
      : null

  if (!agencyId || !staffId || !requestDate) {
    return NextResponse.json({ error: "Completa agencia, empleado y fecha de solicitud" }, { status: 400 })
  }
  if (!INCENTIVE_TYPE_LABELS[incentiveType]) {
    return NextResponse.json({ error: "Tipo de incentivo inválido" }, { status: 400 })
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) {
    return NextResponse.json({ error: "El monto debe ser mayor a cero" }, { status: 400 })
  }

  const { service } = actor
  const { data: staff } = await service
    .from("staff")
    .select("id, agency_id, agency_ids, is_global, is_active, payroll_payment_currency_id, currency_id")
    .eq("id", staffId)
    .maybeSingle()

  const belongs =
    staff &&
    (staff.is_global ||
      staff.agency_id === agencyId ||
      (Array.isArray(staff.agency_ids) && staff.agency_ids.includes(agencyId)))
  if (!staff || !staff.is_active || !belongs) {
    return NextResponse.json({ error: "El empleado no pertenece a la agencia seleccionada" }, { status: 400 })
  }

  const year = requestDate.slice(0, 4)
  const row = {
    agency_id: agencyId,
    staff_id: staffId,
    incentive_type: incentiveType,
    request_date: requestDate,
    description: text(body.description, 2000),
    notes: text(body.notes, 2000),
    amount,
    currency_id: staff.payroll_payment_currency_id || staff.currency_id || null,
    pay_in_payroll_date: payDate,
    status: "pending",
    created_by: actor.userId,
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    const { count } = await service
      .from("incentives")
      .select("id", { count: "exact", head: true })
      .like("incentive_number", `INC-${year}-%`)
    const number = `INC-${year}-${String((count || 0) + 1 + attempt).padStart(4, "0")}`

    const { data, error } = await service
      .from("incentives")
      .insert({ ...row, incentive_number: number })
      .select("id")
      .single()

    if (!error && data) {
      await notifyIncentive(data.id, "created")
      return NextResponse.json({ id: data.id, incentive_number: number })
    }
    if (error?.code !== "23505") {
      console.error("[incentives] Error al crear:", error)
      return NextResponse.json({ error: error?.message || "No se pudo crear el incentivo" }, { status: 500 })
    }
  }

  return NextResponse.json({ error: "No se pudo generar el folio, intenta de nuevo" }, { status: 409 })
}
