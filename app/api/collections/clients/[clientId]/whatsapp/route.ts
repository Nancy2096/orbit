import { NextResponse } from "next/server"
import { loadAccessibleClient, requireCollectionsAccess } from "@/lib/collections/access"
import { MAX_NOTE_LENGTH, toWhatsAppNumber } from "@/lib/collections/rules"

export const runtime = "nodejs"

// Registra que se abrió WhatsApp con el recordatorio (el envío lo hace el usuario en WhatsApp).
export async function POST(request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const access = await requireCollectionsAccess()
  if (access instanceof NextResponse) return access

  const { clientId } = await params
  const { client, error } = await loadAccessibleClient(access, clientId)
  if (error) return error

  const body = await request.json().catch(() => null)
  const phone = typeof body?.phone === "string" ? body.phone.trim() : ""
  const message = typeof body?.message === "string" ? body.message.trim() : ""
  const waNumber = phone ? toWhatsAppNumber(phone) : null

  if (phone && !waNumber) return NextResponse.json({ error: "El teléfono no es válido" }, { status: 400 })
  if (!message) return NextResponse.json({ error: "Escribe el mensaje" }, { status: 400 })
  if (message.length > MAX_NOTE_LENGTH) {
    return NextResponse.json({ error: `El mensaje no puede exceder ${MAX_NOTE_LENGTH} caracteres` }, { status: 400 })
  }

  const { error: insertError } = await access.service.from("collection_activities").insert({
    agency_id: client.agency_id,
    client_id: client.id,
    activity_type: "whatsapp",
    result: "opened",
    note: message,
    metadata: { phone: phone || null, waNumber },
    created_by: access.userId,
  })
  if (insertError) {
    console.error("[collections/whatsapp] No se pudo guardar la gestión en el historial:", insertError)
    return NextResponse.json({ error: "WhatsApp se abrió, pero no se pudo guardar en el historial" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
