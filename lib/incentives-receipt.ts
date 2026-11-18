import "server-only"

import type { IncentiveActor } from "@/lib/incentives-server"

const RECEIPT_ROLES = ["rrhh", "finanzas"]

export async function canManageIncentiveReceipt(
  actor: IncentiveActor,
  incentiveId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data } = await actor.service
    .from("incentives")
    .select("id, status, created_by, receipt_url")
    .eq("id", incentiveId)
    .maybeSingle()

  if (!data) return { ok: false, error: "Incentivo no encontrado" }
  if (data.status !== "approved" && data.status !== "paid") {
    return { ok: false, error: "Solo se puede subir el comprobante de un incentivo aprobado" }
  }
  if (data.status === "paid" && data.receipt_url) {
    return { ok: false, error: "El incentivo ya está pagado y tiene comprobante" }
  }

  const allowed =
    actor.isAuthorizer ||
    data.created_by === actor.userId ||
    (actor.roleName != null && RECEIPT_ROLES.includes(actor.roleName))
  if (!allowed) return { ok: false, error: "No tienes permiso para subir este comprobante" }

  return { ok: true }
}
