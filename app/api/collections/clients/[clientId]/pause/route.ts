import { NextResponse } from "next/server"
import { loadAccessibleClient, requireCollectionsAccess } from "@/lib/collections/access"
import { MAX_NOTE_LENGTH } from "@/lib/collections/rules"

export const runtime = "nodejs"

// Solo marca y registra la pausa: no cambia el estado de cuentas, proyectos ni tareas.
export async function POST(request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const access = await requireCollectionsAccess()
  if (access instanceof NextResponse) return access

  const { clientId } = await params
  const { client, error } = await loadAccessibleClient(access, clientId)
  if (error) return error

  const body = await request.json().catch(() => null)
  if (typeof body?.paused !== "boolean") return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
  const paused: boolean = body.paused
  const reason = typeof body?.reason === "string" ? body.reason.trim() : ""
  if (paused && !reason) {
    return NextResponse.json({ error: "Indica el motivo de la pausa de servicio" }, { status: 400 })
  }
  if (reason.length > MAX_NOTE_LENGTH) {
    return NextResponse.json({ error: `El motivo no puede exceder ${MAX_NOTE_LENGTH} caracteres` }, { status: 400 })
  }

  const { service } = access
  const { data: current } = await service
    .from("collection_client_status")
    .select("service_paused")
    .eq("client_id", client.id)
    .maybeSingle()
  if ((current?.service_paused === true) === paused) {
    return NextResponse.json(
      { error: paused ? "El servicio ya está marcado en pausa" : "El servicio no está en pausa" },
      { status: 409 },
    )
  }

  const now = new Date().toISOString()
  const { error: upsertError } = await service.from("collection_client_status").upsert({
    client_id: client.id,
    agency_id: client.agency_id,
    service_paused: paused,
    pause_reason: paused ? reason : null,
    paused_at: paused ? now : null,
    paused_by: paused ? access.userId : null,
    updated_at: now,
  })
  if (upsertError) {
    console.error("[collections] Error al cambiar pausa:", upsertError)
    return NextResponse.json({ error: "No se pudo actualizar la pausa de servicio" }, { status: 500 })
  }

  await service.from("collection_activities").insert({
    agency_id: client.agency_id,
    client_id: client.id,
    activity_type: paused ? "pause" : "resume",
    note: reason || null,
    created_by: access.userId,
  })

  return NextResponse.json({ ok: true })
}
