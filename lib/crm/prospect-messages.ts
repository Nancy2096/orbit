// Reglas compartidas (modal y servidor) para los mensajes de tareas de prospectos.

export const MAX_SUBJECT_LENGTH = 200
export const MAX_MESSAGE_LENGTH = 5000

export interface TemplateValues {
  prospectName: string
  senderName: string
}

// Variables que aparecen en las plantillas de "Ajustar Tareas". Las que no se
// pueden resolver ([Nombre del Desarrollo], [Nombre del Gerente Comercial]...)
// se dejan tal cual para que el asesor las complete antes de enviar.
const SENDER_TOKENS = ["agente", "nombre del asesor", "tu nombre"]
const PROSPECT_TOKENS = ["nombre"]

export function fillTemplate(text: string | null | undefined, values: TemplateValues): string {
  if (!text) return ""
  return text.replace(/\[([^\]]{1,40})\]/g, (match, rawToken: string) => {
    const token = rawToken.trim().toLowerCase()
    if (PROSPECT_TOKENS.includes(token) && values.prospectName) return values.prospectName
    if (SENDER_TOKENS.includes(token) && values.senderName) return values.senderName
    return match
  })
}

export function hasPendingPlaceholders(text: string): boolean {
  return /\[[^\]]{1,40}\]/.test(text)
}

// Normaliza un teléfono para WhatsApp (solo dígitos; agrega 52 a números MX de 10 dígitos).
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  const digits = (phone || "").replace(/\D/g, "")
  if (digits.length === 10) return `52${digits}`
  if (digits.length >= 11 && digits.length <= 15) return digits
  return null
}

// Abre WhatsApp Web con la sesión que el usuario tenga iniciada en su navegador.
export function buildWhatsAppWebUrl(waNumber: string, message: string): string {
  return `https://web.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent(message)}`
}
