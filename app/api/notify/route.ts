import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email"
import { buildLeaveNotification, type LeaveEvent } from "@/lib/notifications/leave"
import { buildBonusNotification, type BonusEvent } from "@/lib/notifications/bonus"
import { buildExpenseNotification, type ExpenseEvent } from "@/lib/notifications/expense"

export const runtime = "nodejs"

const LEAVE_EVENTS: LeaveEvent[] = ["created", "approved", "rejected"]
const BONUS_EVENTS: BonusEvent[] = [
  "created",
  "manager_approved",
  "rejected",
  "payment_requested",
  "payment_authorized",
]
const EXPENSE_EVENTS: ExpenseEvent[] = ["submitted", "approved", "rejected", "paid"]

// Para gastos, cada evento tiene un único estado real válido (status). Si el
// estado actual no coincide, el evento se rechaza con 409 sin enviar nada.
const EXPENSE_EVENT_STATUS: Record<ExpenseEvent, string> = {
  submitted: "pending",
  approved: "approved",
  rejected: "rejected",
  paid: "paid",
}

// Forma común de una notificación construida en el servidor.
interface BuiltNotification {
  to: string[]
  replyTo?: string
  subject: string
  html: string
}

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
  if (!id || !event || (entity !== "leave" && entity !== "bonus" && entity !== "expense")) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
  }

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
    // 3) Calcular destinatarios, construir el/los mensaje(s) y validar el evento
    //    contra el estado real de la entidad (en el servidor).
    let messages: BuiltNotification[] = []
    let valid = false

    if (entity === "leave") {
      if (!LEAVE_EVENTS.includes(event as LeaveEvent)) {
        return NextResponse.json({ error: "Evento inválido" }, { status: 400 })
      }
      const leaveEvent = event as LeaveEvent
      const built = await buildLeaveNotification(id, leaveEvent)
      if (!built) {
        return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
      }
      messages = [built]

      const { status, staff_id, reviewed_by } = built.request
      if (leaveEvent === "created") {
        // Debe seguir pendiente y quien llama debe ser el solicitante.
        valid = status === "pending" && !!callerStaffId && staff_id === callerStaffId
      } else {
        // El estado debe ser exactamente el evento y quien resolvió debe ser quien llama.
        valid = status === leaveEvent && !!callerStaffId && reviewed_by === callerStaffId
      }
    } else if (entity === "bonus") {
      if (!BONUS_EVENTS.includes(event as BonusEvent)) {
        return NextResponse.json({ error: "Evento inválido" }, { status: 400 })
      }
      const bonusEvent = event as BonusEvent
      const built = await buildBonusNotification(id, bonusEvent)
      if (!built) {
        return NextResponse.json({ error: "Bono no encontrado" }, { status: 404 })
      }
      messages = [built]

      // Validación de evento contra el estado real (workflow_stage) y, cuando el
      // flujo lo registra, contra el actor (manager_approved_by / rejected_by son
      // el id de auth del usuario que actuó).
      const { workflow_stage, manager_approved_by, rejected_by } = built.request
      switch (bonusEvent) {
        case "created":
          valid = workflow_stage === "pending_manager"
          break
        case "manager_approved":
          valid = workflow_stage === "pending_evidence" && manager_approved_by === authUser.id
          break
        case "rejected":
          valid = workflow_stage === "rejected" && rejected_by === authUser.id
          break
        case "payment_requested":
          valid = workflow_stage === "pending_payment"
          break
        case "payment_authorized":
          valid = workflow_stage === "authorized"
          break
      }
    } else {
      // entity === "expense"
      if (!EXPENSE_EVENTS.includes(event as ExpenseEvent)) {
        return NextResponse.json({ error: "Evento inválido" }, { status: 400 })
      }
      const expenseEvent = event as ExpenseEvent
      const built = await buildExpenseNotification(id, expenseEvent)
      if (!built) {
        return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 })
      }
      messages = built.messages

      // Para gastos no hay control de rol por acción: basta con la sesión (ya
      // exigida arriba) y que el estado real coincida exactamente con el evento.
      // Los destinatarios se calculan solo en el servidor (nunca vienen del body).
      valid = built.request.status === EXPENSE_EVENT_STATUS[expenseEvent]
    }

    if (!valid) {
      return NextResponse.json(
        { error: "El evento no coincide con el estado actual" },
        { status: 409 },
      )
    }

    // Enviar cada mensaje con al menos un destinatario. Sin destinatarios: no se
    // envía nada, pero no es un error.
    const toSend = messages.filter((m) => m.to.length > 0)
    if (toSend.length === 0) {
      return NextResponse.json({ ok: true, sent: false, reason: "sin destinatarios" })
    }

    const results = await Promise.all(
      toSend.map((m) =>
        sendEmail({ to: m.to, subject: m.subject, html: m.html, replyTo: m.replyTo }),
      ),
    )

    return NextResponse.json({
      ok: true,
      sent: results.some((r) => !r.skipped),
      messages: results.length,
    })
  } catch (error) {
    // Cualquier fallo al calcular o enviar se registra pero nunca rompe la respuesta.
    console.error(`[notify] Error al procesar la notificación de ${entity}:`, error)
    return NextResponse.json({ ok: true, sent: false, error: "fallo interno" })
  }
}
