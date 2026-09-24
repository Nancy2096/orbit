import "server-only"

import nodemailer from "nodemailer"

export const runtime = "nodejs"

interface SendEmailParams {
  to: string | string[]
  cc?: string | string[]
  subject: string
  html: string
  replyTo?: string
}

interface SendEmailResult {
  skipped?: boolean
  messageId?: string
}

function toArray(value?: string | string[]): string[] {
  if (!value) return []
  return Array.isArray(value) ? value.filter(Boolean) : [value]
}

let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
  return transporter
}

/**
 * Envía un correo a través de SMTP (Gmail).
 *
 * Reglas:
 * - Si EMAIL_NOTIFICATIONS_ENABLED !== 'true' no envía nada y regresa { skipped: true }.
 * - El remitente siempre es "Orbit" <SMTP_FROM>.
 * - Si EMAIL_TEST_RECIPIENT tiene valor, redirige TODO a esa dirección, elimina
 *   las copias (cc) y antepone al asunto la marca de prueba con los destinatarios reales.
 */
export async function sendEmail({
  to,
  cc,
  subject,
  html,
  replyTo,
}: SendEmailParams): Promise<SendEmailResult> {
  if (process.env.EMAIL_NOTIFICATIONS_ENABLED !== "true") {
    console.log(
      `[email] Envío omitido (EMAIL_NOTIFICATIONS_ENABLED != 'true'). Asunto: "${subject}"`,
    )
    return { skipped: true }
  }

  const originalTo = toArray(to)
  const originalCc = toArray(cc)

  let finalTo: string[] = originalTo
  let finalCc: string[] = originalCc
  let finalSubject = subject

  const testRecipient = process.env.EMAIL_TEST_RECIPIENT
  if (testRecipient) {
    const originalRecipients = [...originalTo, ...originalCc].join(", ")
    finalTo = [testRecipient]
    finalCc = []
    finalSubject = `[PRUEBA → ${originalRecipients}] ${subject}`
  }

  const from = `"Orbit" <${process.env.SMTP_FROM}>`

  try {
    const info = await getTransporter().sendMail({
      from,
      to: finalTo,
      cc: finalCc.length > 0 ? finalCc : undefined,
      subject: finalSubject,
      html,
      replyTo,
    })

    const recipientsLog = [...finalTo, ...finalCc].join(", ")
    console.log(
      `[email] Envío exitoso. Destinatarios: ${recipientsLog} | Asunto: "${finalSubject}"`,
    )

    return { messageId: info.messageId }
  } catch (error) {
    console.error(
      `[email] Error al enviar correo. Asunto: "${finalSubject}"`,
      error,
    )
    throw error
  }
}
