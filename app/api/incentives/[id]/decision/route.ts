import { NextRequest, NextResponse } from "next/server"
import { getIncentiveActor, notifyIncentive } from "@/lib/incentives-server"
import { todayInMexico } from "@/lib/incentives"

export const runtime = "nodejs"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const actor = await getIncentiveActor()
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!actor.isAuthorizer) {
    return NextResponse.json(
      { error: "Solo Super Administrador o Dirección General pueden autorizar incentivos" },
      { status: 403 },
    )
  }

  const body = await request.json().catch(() => null)
  const action = body?.action
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
  }

  const { service } = actor
  const { data: current } = await service
    .from("incentives")
    .select("id, status, pay_in_payroll_date")
    .eq("id", id)
    .maybeSingle()
  if (!current) return NextResponse.json({ error: "Incentivo no encontrado" }, { status: 404 })
  if (current.status !== "pending") {
    return NextResponse.json({ error: "El incentivo ya no está pendiente" }, { status: 409 })
  }

  const now = new Date().toISOString()
  let update: Record<string, unknown>

  if (action === "approve") {
    const requested = typeof body.pay_in_payroll_date === "string" && DATE_RE.test(body.pay_in_payroll_date)
      ? body.pay_in_payroll_date
      : null
    update = {
      status: "approved",
      approved_by: actor.userId,
      approved_at: now,
      pay_in_payroll_date: requested || current.pay_in_payroll_date || todayInMexico(),
      updated_at: now,
    }
  } else {
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 1000) : ""
    if (!reason) return NextResponse.json({ error: "Indica el motivo del rechazo" }, { status: 400 })
    update = {
      status: "rejected",
      rejected_by: actor.userId,
      rejected_at: now,
      rejection_reason: reason,
      updated_at: now,
    }
  }

  const { data, error } = await service
    .from("incentives")
    .update(update)
    .eq("id", id)
    .eq("status", "pending")
    .select("id")
  if (error) {
    console.error("[incentives] Error al decidir:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "El incentivo ya no está pendiente" }, { status: 409 })
  }

  await notifyIncentive(id, action === "approve" ? "approved" : "rejected")
  return NextResponse.json({ ok: true })
}
