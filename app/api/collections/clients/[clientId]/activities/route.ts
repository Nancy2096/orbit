import { NextResponse } from "next/server"
import { loadAccessibleClient, requireCollectionsAccess } from "@/lib/collections/access"
import { LOGGABLE_ACTIVITY_TYPES, MAX_NOTE_LENGTH, type ActivityType } from "@/lib/collections/rules"

export const runtime = "nodejs"

export async function POST(request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const access = await requireCollectionsAccess()
  if (access instanceof NextResponse) return access

  const { clientId } = await params
  const { client, error } = await loadAccessibleClient(access, clientId)
  if (error) return error

  const body = await request.json().catch(() => null)
  const type = body?.type as ActivityType
  const note = typeof body?.note === "string" ? body.note.trim() : ""

  if (!LOGGABLE_ACTIVITY_TYPES.includes(type)) {
    return NextResponse.json({ error: "Tipo de gestión inválido" }, { status: 400 })
  }
  if ((type === "call" || type === "note") && !note) {
    return NextResponse.json({ error: "Escribe una nota para registrar la gestión" }, { status: 400 })
  }
  if (note.length > MAX_NOTE_LENGTH) {
    return NextResponse.json({ error: `La nota no puede exceder ${MAX_NOTE_LENGTH} caracteres` }, { status: 400 })
  }

  const { error: insertError } = await access.service.from("collection_activities").insert({
    agency_id: client.agency_id,
    client_id: client.id,
    activity_type: type,
    note: note || null,
    created_by: access.userId,
  })
  if (insertError) {
    console.error("[collections] Error al registrar gestión:", insertError)
    return NextResponse.json({ error: "No se pudo registrar la gestión" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
