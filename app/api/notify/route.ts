import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email"
import { buildLeaveNotification, type LeaveEvent } from "@/lib/notifications/leave"

export const runtime = "nodejs"

const LEAVE_EVENTS: LeaveEvent[] = ["created", "approved", "rejected"]

export async function POST(req: Request) {
  const supabase = await createClient()

  // 1) Exigir sesión.
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  // 2) Leer y validar el cuerpo. Cualquier correo que venga en el body se ignora
  //    por completo: los destinatarios se calculan solo en el servidor.
  let body: { entity?: string; id?: string; event?: string } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const { entity, id, event } = body
  if (entity !== "leave" || !id || !event || !LEAVE_EVENTS.includes(event as LeaveEvent)) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
  }
  const leaveEvent = event as LeaveEvent

  // Resolver el empleado (staff) del usuario que llama: primero por user_id y,
  // como respaldo, por email (muchos registros de staff no tienen user_id).
  let callerStaffId: string | null = null
  const { data: byUser } = await supabase
    .from("staff")
    .select("id")
    .eq("user_id", authUser.id)
    .limit(1)
  if (byUser?.[0]) {
    callerStaffId = byUser[0].id
  } else if (authUser.email) {
    const { data: byEmail } = await supabase
      .from("staff")
      .select("id")
      .ilike("email", authUser.email)
      .limit(1)
    if (byEmail?.[0]) callerStaffId = byEmail[0].id
  }

  try {
    // 3) Calcular destinatarios y construir el mensaje (en el servidor).
    const notification = await buildLeaveNotification(id, leaveEvent)
    if (!notification) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
    }

    // 4) Validar que el evento coincida con el estado real de la solicitud.
    const { status, staff_id, reviewed_by } = notification.request
    let valid = false
    if (leaveEvent === "created") {
      // Debe seguir pendiente y quien llama debe ser el solicitante.
      valid = status === "pending" && !!callerStaffId && staff_id === callerStaffId
    } else {
      // El estado debe ser exactamente el evento y quien resolvió debe ser quien llama.
      valid = status === leaveEvent && !!callerStaffId && reviewed_by === callerStaffId
    }

    if (!valid) {
      return NextResponse.json(
        { error: "El evento no coincide con el estado de la solicitud" },
        { status: 409 },
      )
    }

    // Sin destinatarios con email: no se envía nada, pero no es un error.
    if (notification.to.length === 0) {
      return NextResponse.json({ ok: true, sent: false, reason: "sin destinatarios" })
    }

    const result = await sendEmail({
      to: notification.to,
      subject: notification.subject,
      html: notification.html,
      replyTo: notification.replyTo,
    })

    return NextResponse.json({ ok: true, sent: !result.skipped, ...result })
  } catch (error) {
    // Cualquier fallo al calcular o enviar se registra pero nunca rompe la respuesta.
    console.error("[notify] Error al procesar la notificación de leave:", error)
    return NextResponse.json({ ok: true, sent: false, error: "fallo interno" })
  }
}
