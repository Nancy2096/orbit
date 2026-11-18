import { NextRequest, NextResponse } from "next/server"
import { getIncentiveActor } from "@/lib/incentives-server"

export const runtime = "nodejs"

// Marca como pagados los incentivos aprobados incluidos en una nómina ya pagada.
// Solo cambian los que siguen "approved" y caen en el periodo, así nunca se
// vuelven a contar en otra nómina.
export async function POST(request: NextRequest) {
  const actor = await getIncentiveActor()
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const periodId = typeof body?.periodId === "string" ? body.periodId : ""
  const ids: string[] = Array.isArray(body?.incentiveIds)
    ? body.incentiveIds.filter((v: unknown): v is string => typeof v === "string").slice(0, 2000)
    : []
  if (!periodId) return NextResponse.json({ error: "Falta el periodo" }, { status: 400 })
  if (ids.length === 0) return NextResponse.json({ paid: 0 })

  const { data: period } = await actor.service
    .from("payroll_periods")
    .select("id, status, start_date, end_date")
    .eq("id", periodId)
    .maybeSingle()
  if (!period) return NextResponse.json({ error: "Periodo no encontrado" }, { status: 404 })
  if (period.status !== "paid") {
    return NextResponse.json({ error: "La nómina aún no está marcada como pagada" }, { status: 409 })
  }

  const now = new Date().toISOString()
  const { data, error } = await actor.service
    .from("incentives")
    .update({ status: "paid", paid_at: now, payroll_period_id: period.id, updated_at: now })
    .in("id", ids)
    .eq("status", "approved")
    .gte("pay_in_payroll_date", period.start_date)
    .lte("pay_in_payroll_date", period.end_date)
    .select("id")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ paid: data?.length ?? 0 })
}
