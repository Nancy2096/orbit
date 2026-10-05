import { NextResponse } from "next/server"
import { requireCollectionsAccess } from "@/lib/collections/access"

export const runtime = "nodejs"

const NEXT_STATUSES = ["fulfilled", "broken", "cancelled"] as const
type NextStatus = (typeof NEXT_STATUSES)[number]

export async function PATCH(request: Request, { params }: { params: Promise<{ promiseId: string }> }) {
  const access = await requireCollectionsAccess()
  if (access instanceof NextResponse) return access

  const { promiseId } = await params
  if (!/^[0-9a-f-]{36}$/i.test(promiseId)) return NextResponse.json({ error: "Compromiso inválido" }, { status: 400 })

  const body = await request.json().catch(() => null)
  const status = body?.status as NextStatus
  if (!NEXT_STATUSES.includes(status)) return NextResponse.json({ error: "Estado inválido" }, { status: 400 })

  const { service } = access
  const { data: promise } = await service
    .from("payment_promises")
    .select("id, agency_id, client_id, status, promised_date, amount, currency:currencies(code)")
    .eq("id", promiseId)
    .maybeSingle()
  if (!promise) return NextResponse.json({ error: "Compromiso no encontrado" }, { status: 404 })
  if (!access.canAccessAgency(promise.agency_id)) {
    return NextResponse.json({ error: "No tienes acceso a la agencia de este compromiso" }, { status: 403 })
  }
  if (promise.status !== "pending") {
    return NextResponse.json({ error: "Solo se pueden actualizar compromisos pendientes" }, { status: 409 })
  }

  const { error: updateError } = await service
    .from("payment_promises")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", promise.id)
    .eq("status", "pending")
  if (updateError) {
    console.error("[collections] Error al actualizar compromiso:", updateError)
    return NextResponse.json({ error: "No se pudo actualizar el compromiso" }, { status: 500 })
  }

  const currency = Array.isArray(promise.currency) ? promise.currency[0] : promise.currency
  await service.from("collection_activities").insert({
    agency_id: promise.agency_id,
    client_id: promise.client_id,
    activity_type: "promise",
    metadata: {
      action: status,
      promised_date: promise.promised_date,
      amount: Number(promise.amount),
      currency: (currency as { code?: string } | null)?.code || "MXN",
    },
    created_by: access.userId,
  })

  return NextResponse.json({ ok: true })
}
