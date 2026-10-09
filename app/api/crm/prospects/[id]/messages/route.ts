import { NextResponse } from "next/server"
import { requireProspectAccess, senderDisplayName } from "@/lib/crm/prospect-access"
import { sendEmail } from "@/lib/email"
import { escapeHtml, messageToHtml, wrapEmailDocument } from "@/lib/email-format"
import { MAX_CC_RECIPIENTS, MAX_TO_RECIPIENTS, validateEmailList } from "@/lib/invoice-email-rules"
import {
  MAX_MESSAGE_LENGTH,
  MAX_SUBJECT_LENGTH,
  cleanSubject,
  needsSignature,
  toWhatsAppNumber,
} from "@/lib/crm/prospect-messages"

export const runtime = "nodejs"

// Datos del remitente para completar las variables de las plantillas.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await requireProspectAccess(id)
  if (access instanceof NextResponse) return access
  return NextResponse.json({
    senderName: access.senderName,
    senderEmail: access.userEmail,
    fromName: senderDisplayName(access.senderName, access.agencyName),
    canSendEmail: access.canSendEmail,
  })
}

function cleanList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await requireProspectAccess(id)
  if (access instanceof NextResponse) return access
  const { prospect, service, userId } = access

  const body = await request.json().catch(() => null)
  const channel = body?.channel
  const message = typeof body?.message === "string" ? body.message.replace(/\r\n?/g, "\n").trim() : ""
  const taskTitle = typeof body?.taskTitle === "string" ? cleanSubject(body.taskTitle).slice(0, 200) : ""
  const taskId = typeof body?.taskId === "string" && /^[0-9a-f-]{36}$/i.test(body.taskId) ? body.taskId : null
  const completeTask = body?.completeTask === true

  if (!message) return NextResponse.json({ error: "Escribe el mensaje" }, { status: 400 })
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: `El mensaje no puede exceder ${MAX_MESSAGE_LENGTH} caracteres` }, { status: 400 })
  }

  if (taskId) {
    const { data: task } = await service.from("crm_tasks").select("prospect_id").eq("id", taskId).maybeSingle()
    if (!task || task.prospect_id !== prospect.id) {
      return NextResponse.json({ error: "La tarea no pertenece a este prospecto" }, { status: 400 })
    }
  }

  const logActivity = (activity_type: string, subject: string, description: string) =>
    service.from("crm_activities").insert({
      agency_id: prospect.agency_id,
      prospect_id: prospect.id,
      task_id: taskId,
      activity_type,
      subject: subject.slice(0, 250),
      description,
      activity_date: new Date().toISOString(),
      is_completed: true,
      completed_at: new Date().toISOString(),
      completed_by: userId,
      created_by: userId,
    })

  if (channel === "whatsapp") {
    const phone = typeof body?.phone === "string" ? body.phone.trim() : ""
    const waNumber = toWhatsAppNumber(phone)
    if (!waNumber) return NextResponse.json({ error: "El teléfono no es válido" }, { status: 400 })

    const { error } = await logActivity(
      "whatsapp",
      `WhatsApp enviado${taskTitle ? `: ${taskTitle}` : ""}`,
      `Se abrió WhatsApp Web para enviar el mensaje al +${waNumber}.\n\n${message}`,
    )
    if (error) {
      console.error("[crm/messages] No se pudo registrar el WhatsApp:", error)
      return NextResponse.json({ error: "WhatsApp se abrió, pero no se pudo registrar en actividades" }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  if (channel !== "email") return NextResponse.json({ error: "Canal inválido" }, { status: 400 })

  if (!access.canSendEmail) {
    return NextResponse.json(
      { error: "Solo el responsable del prospecto o un usuario autorizado puede enviar correos" },
      { status: 403 },
    )
  }

  const to = cleanList(body?.to)
  const cc = cleanList(body?.cc)
  const subject = cleanSubject(typeof body?.subject === "string" ? body.subject : "")

  const listError =
    validateEmailList(to, { field: "Para", max: MAX_TO_RECIPIENTS, required: true }) ||
    validateEmailList(cc, { field: "CC", max: MAX_CC_RECIPIENTS })
  if (listError) return NextResponse.json({ error: listError }, { status: 400 })
  if (!subject) return NextResponse.json({ error: "Escribe el asunto" }, { status: 400 })
  if (subject.length > MAX_SUBJECT_LENGTH) {
    return NextResponse.json({ error: `El asunto no puede exceder ${MAX_SUBJECT_LENGTH} caracteres` }, { status: 400 })
  }

  const signature = needsSignature(message, access.senderName)
    ? `<p style="margin:16px 0 0;color:#4b5563">${escapeHtml(access.senderName)}</p>`
    : ""
  const html = wrapEmailDocument(
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1f2937;max-width:600px">${messageToHtml(message)}${signature}</div>`,
  )

  // Copia oculta automática al usuario que envía, salvo que ya esté en Para o CC.
  const senderEmail = access.userEmail?.trim() || ""
  const alreadyIncluded = [...to, ...cc].some((e) => e.toLowerCase() === senderEmail.toLowerCase())
  const bcc = senderEmail && !alreadyIncluded ? [senderEmail] : []

  const recipientLines = [
    `Para: ${to.join(", ")}`,
    cc.length ? `CC: ${cc.join(", ")}` : "",
    bcc.length ? `CCO: ${bcc.join(", ")} (copia automática)` : "",
  ].filter(Boolean)

  let skipped = false
  let redirectedTo: string | undefined
  try {
    const result = await sendEmail({
      to,
      cc: cc.length > 0 ? cc : undefined,
      bcc: bcc.length > 0 ? bcc : undefined,
      subject,
      html,
      fromName: senderDisplayName(access.senderName, access.agencyName),
      // Las respuestas del prospecto llegan al asesor que envió el correo.
      replyTo: senderEmail || undefined,
    })
    skipped = !!result.skipped
    redirectedTo = result.redirectedTo
  } catch (error) {
    console.error("[crm/messages] Error al enviar el correo:", error)
    const { error: logError } = await logActivity(
      "email",
      `Error al enviar: ${subject}`,
      `${recipientLines.join("\n")}\n\nEl correo no se pudo enviar.\n\n${message}`,
    )
    if (logError) console.error("[crm/messages] No se pudo registrar el error de envío:", logError)
    return NextResponse.json(
      { error: "No se pudo enviar el correo. Intenta de nuevo.", logged: !logError },
      { status: 502 },
    )
  }

  let taskCompleted = false
  if (completeTask && taskId && !skipped) {
    const now = new Date().toISOString()
    const { error: taskError } = await service
      .from("crm_tasks")
      .update({ status: "completed", is_completed: true, completed_at: now, completed_by: userId, updated_at: now })
      .eq("id", taskId)
      .eq("prospect_id", prospect.id)
    if (taskError) console.error("[crm/messages] No se pudo completar la tarea:", taskError)
    taskCompleted = !taskError
  }

  const title = skipped
    ? `Correo omitido (envíos desactivados): ${subject}`
    : redirectedTo
      ? `Correo enviado al correo de prueba: ${subject}`
      : `Correo enviado: ${subject}`
  const notes = [
    redirectedTo ? `Se desvió al correo de prueba ${redirectedTo}; los destinatarios reales no lo recibieron.` : "",
    taskCompleted ? "La tarea se marcó como completada." : "",
  ].filter(Boolean)

  const { error: logError } = await logActivity(
    "email",
    title,
    `${recipientLines.join("\n")}${notes.length ? `\n\n${notes.join("\n")}` : ""}\n\n${message}`,
  )
  if (logError) console.error("[crm/messages] No se pudo registrar el correo:", logError)

  return NextResponse.json({ ok: true, skipped, redirected: !!redirectedTo, taskCompleted, logged: !logError })
}
