// Reglas compartidas (cliente y servidor) para los archivos de cotización.

export const QUOTATION_MAX_SIZE_MB = 25
export const QUOTATION_MAX_SIZE_BYTES = QUOTATION_MAX_SIZE_MB * 1024 * 1024

export const QUOTATION_ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "image/webp",
]

export const QUOTATION_ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg", ".webp"]

export const QUOTATION_ACCEPT = QUOTATION_ALLOWED_EXTENSIONS.join(",")

export const QUOTATION_FORMAT_ERROR = "Formato no permitido. Sube PDF, Word, Excel o imagen (JPG, PNG, WEBP)."
export const QUOTATION_SIZE_ERROR = `El archivo supera el máximo de ${QUOTATION_MAX_SIZE_MB} MB.`

export function hasAllowedQuotationExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase()
  return QUOTATION_ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

/** Devuelve el mensaje de error si el archivo no es válido, o null si es válido. */
export function validateQuotationFile(file: { name: string; size: number; type?: string | null }): string | null {
  if (!hasAllowedQuotationExtension(file.name)) return QUOTATION_FORMAT_ERROR
  if (file.type && !QUOTATION_ALLOWED_CONTENT_TYPES.includes(file.type)) return QUOTATION_FORMAT_ERROR
  if (file.size > QUOTATION_MAX_SIZE_BYTES) return QUOTATION_SIZE_ERROR
  return null
}

export function safeBlobFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

/** Convierte una URL de Blob privada (o ya proxied) a la ruta /api/file. */
export function toFileHref(url: string): string {
  if (url.startsWith("/api/file")) return url
  try {
    const pathname = new URL(url).pathname.replace(/^\//, "")
    return `/api/file?pathname=${encodeURIComponent(pathname)}`
  } catch {
    return url
  }
}
