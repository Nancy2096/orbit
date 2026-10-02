// Reglas compartidas (modal y servidor) para el envío de facturas por correo.

export const MAX_TO_RECIPIENTS = 5
export const MAX_CC_RECIPIENTS = 5

// Límite temporal: las funciones de Vercel rechazan peticiones de más de ~4.5 MB.
// Mientras no exista la subida directa a Vercel Blob, los adjuntos adicionales
// viajan en la misma petición y deben quedar por debajo de ese límite.
export const MAX_ATTACHMENTS_TOTAL_BYTES = 4 * 1024 * 1024
export const MAX_ATTACHMENTS_TOTAL_LABEL = "4 MB"

export const NON_SENDABLE_INVOICE_STATUSES: Record<string, string> = {
  draft: "No se puede enviar una factura en borrador. Emítela antes de enviarla al cliente.",
  cancelled: "No se puede enviar una factura cancelada.",
}

const EMAIL_PATTERN = /^[^\s@,;<>()]+@[^\s@,;<>()]+\.[^\s@,;<>()]{2,}$/

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_PATTERN.test(value)
}

export function parseEmailList(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

// Devuelve un mensaje de error o null si la lista es válida.
export function validateEmailList(
  emails: string[],
  { field, max, required }: { field: string; max: number; required?: boolean },
): string | null {
  if (required && emails.length === 0) return `Ingresa al menos un correo en "${field}"`
  if (emails.length > max) return `Máximo ${max} correos en "${field}" (ingresaste ${emails.length})`
  const invalid = emails.filter((e) => !isValidEmail(e))
  if (invalid.length > 0) return `Correo inválido en "${field}": ${invalid.join(", ")}`
  const unique = new Set(emails.map((e) => e.toLowerCase()))
  if (unique.size !== emails.length) return `Hay correos repetidos en "${field}"`
  return null
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function attachmentsTooLargeMessage(totalBytes: number): string {
  return `Los adjuntos adicionales suman ${formatBytes(totalBytes)} y el máximo temporal es ${MAX_ATTACHMENTS_TOTAL_LABEL}. Quita archivos o compártelos por otro medio.`
}
