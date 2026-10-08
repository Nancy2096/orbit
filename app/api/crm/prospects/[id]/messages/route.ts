import { NextResponse } from "next/server"
import { requireProspectAccess } from "@/lib/crm/prospect-access"
import { sendEmail } from "@/lib/email"
import { escapeHtml, messageParagraphs, wrapEmailDocument } from "@/lib/email-format"
import { MAX_CC_RECIPIENTS, MAX_TO_RECIPIENTS, validateEmailList } from "@/lib/invoice-email-rules"
import { MAX_MESSAGE_LENGTH, MAX_SUBJECT_LENGTH, toWhatsAppNumber } from "@/lib/crm/prospect-messages"

export const runtime = "nodejs"

// Datos del remitente para completar las variables de las plantillas.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await requireProspectAccess(id)
  if (access instanceof NextResponse) return access
  return NextResponse.json({ senderName: access.senderName, senderEmail: access.userEmail })
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
  const message = typeof body?.message === "string" ? body.message.trim() : ""
  const taskTitle = typeof body?.taskTitle === "string" ? body.taskTitle.trim().slice(0, 200) : ""
  const taskId = typeof body?.taskId === "string" && /^[0-9a-f-]{36}$/i.test(body.taskId) ? body.taskId : null

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

  const to = cleanList(body?.to)
  const cc = cleanList(body?.cc)
  const subject = typeof body?.subject === "string" ? body.subject.trim() : ""

  const listError =
    validateEmailList(to, { field: "Para", max: MAX_TO_RECIPIENTS, required: true }) ||
    validateEmailList(cc, { field: "CC", max: MAX_CC_RECIPIENTS })
  if (listError) return NextResponse.json({ error: listError }, { status: 400 })
  if (!subject) return NextResponse.json({ error: "Escribe el asunto" }, { status: 400 })
  if (subject.length > MAX_SUBJECT_LENGTH) {
    return NextResponse.json({ error: `El asunto no puede exceder ${MAX_SUBJECT_LENGTH} caracteres` }, { status: 400 })
  }

  const html = wrapEmailDocument(
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1f2937;max-width:600px">${messageParagraphs(message)}${
      access.senderName ? `<p style="margin:16px 0 0;color:#4b5563">${escapeHtml(access.senderName)}</p>` : ""
    }</div>`,
  )

  let skipped = false
  try {
    const result = await sendEmail({
      to,
      cc: cc.length > 0 ? cc : undefined,
      subject,
      html,
      // Las respuestas del prospecto llegan al asesor que envió el correo.
      replyTo: access.userEmail || undefined,
    })
    skipped = !!result.skipped
  } catch (error) {
    console.error("[crm/messages] Error al enviar el correo:", error)
    return NextResponse.json({ error: "No se pudo enviar el correo. Intenta de nuevo." }, { status: 502 })
  }

  const recipients = `Para: ${to.join(", ")}${cc.length ? `\nCC: ${cc.join(", ")}` : ""}`
  const { error: logError } = await logActivity(
    "email",
    `${skipped ? "Correo omitido (envíos desactivados)" : "Correo enviado"}: ${subject}`,
    `${recipients}\n\n${message}`,
  )
  if (logError) console.error("[crm/messages] No se pudo registrar el correo:", logError)

  return NextResponse.json({ ok: true, skipped, logged: !logError })
}
