import "server-only"

import nodemailer from "nodemailer"

export const runtime = "nodejs"

interface EmailAttachment {
  filename: string
  content: Buffer | string
  contentType?: string
}

interface SendEmailParams {
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  html: string
  replyTo?: string
  attachments?: EmailAttachment[]
  /** Nombre visible del remitente. Si se omite se usa "Orbit". */
  fromName?: string
  /**
   * Dirección del remitente. Solo se acepta si está en COMMERCIAL_SENDER_EMAILS;
   * si se omite se usa SMTP_FROM.
   */
  fromEmail?: string
}

interface SendEmailResult {
  skipped?: boolean
  messageId?: string
  /** Correo de prueba al que se desvió el envío (EMAIL_TEST_RECIPIENT). */
  redirectedTo?: string
  /** Encabezado From que se usó (o se habría usado si el envío se omitió). */
  from: string
}

const EMAIL_PATTERN = /^[^\s@<>",;\\]+@[^\s@<>",;\\]+\.[^\s@<>",;\\]+$/

function commercialSenderEmails(): Set<string> {
  return new Set(
    (process.env.COMMERCIAL_SENDER_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => EMAIL_PATTERN.test(e)),
  )
}

/** Indica si el correo puede usarse como remitente (está en COMMERCIAL_SENDER_EMAILS). */
export function isAllowedSenderEmail(email: string | null | undefined): boolean {
  const normalized = (email || "").trim().toLowerCase()
  return !!normalized && EMAIL_PATTERN.test(normalized) && commercialSenderEmails().has(normalized)
}

/** Arma el encabezado From. Lanza error si fromEmail no está autorizado. */
export function buildFromHeader(fromName?: string, fromEmail?: string): string {
  let address = process.env.SMTP_FROM || ""
  if (fromEmail) {
    if (!isAllowedSenderEmail(fromEmail)) {
      throw new Error(`El remitente ${fromEmail} no está autorizado en COMMERCIAL_SENDER_EMAILS`)
    }
    address = fromEmail.trim()
  }
  return `"${sanitizeDisplayName(fromName)}" <${address}>`
}

// Evita inyección de encabezados y comillas que rompan el campo From.
function sanitizeDisplayName(name: string | undefined): string {
  const clean = (name || "").replace(/[\r\n"<>\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120)
  return clean || "Orbit"
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
 * - El remitente es "Orbit" <SMTP_FROM>, o "{fromName}" <SMTP_FROM> si se indica fromName.
 *   Si se indica fromEmail (y está en COMMERCIAL_SENDER_EMAILS) la dirección es fromEmail.
 * - Si EMAIL_TEST_RECIPIENT tiene valor, redirige TODO a esa dirección, elimina
 *   las copias (cc y bcc) y antepone al asunto la marca de prueba con los destinatarios reales.
 */
export async function sendEmail({
  to,
  cc,
  bcc,
  subject,
  html,
  replyTo,
  attachments,
  fromName,
  fromEmail,
}: SendEmailParams): Promise<SendEmailResult> {
  const from = buildFromHeader(fromName, fromEmail)

  if (process.env.EMAIL_NOTIFICATIONS_ENABLED !== "true") {
    console.log(
      `[email] Envío omitido (EMAIL_NOTIFICATIONS_ENABLED != 'true'). Asunto: "${subject}"`,
    )
    return { skipped: true, from }
  }

  const originalTo = toArray(to)
  const originalCc = toArray(cc)

  let finalTo: string[] = originalTo
  let finalCc: string[] = originalCc
  let finalBcc: string[] = toArray(bcc)
  let finalSubject = subject

  const testRecipient = process.env.EMAIL_TEST_RECIPIENT
  if (testRecipient) {
    const originalRecipients = [...originalTo, ...originalCc].join(", ")
    finalTo = [testRecipient]
    finalCc = []
    finalBcc = []
    finalSubject = `[PRUEBA → ${originalRecipients}] ${subject}`
  }

  try {
    const info = await getTransporter().sendMail({
      from,
      to: finalTo,
      cc: finalCc.length > 0 ? finalCc : undefined,
      bcc: finalBcc.length > 0 ? finalBcc : undefined,
      subject: finalSubject,
      html,
      replyTo,
      attachments,
    })

    const recipientsLog = [...finalTo, ...finalCc].join(", ")
    console.log(
      `[email] Envío exitoso. Destinatarios: ${recipientsLog} | Asunto: "${finalSubject}"`,
    )

    return { messageId: info.messageId, redirectedTo: testRecipient || undefined, from }
  } catch (error) {
    console.error(
      `[email] Error al enviar correo. Asunto: "${finalSubject}"`,
      error,
    )
    throw error
  }
}
