// Utilidades compartidas para las plantillas HTML de correo (facturas y cobranza).

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function formatNumber(amount: number | null | undefined): string {
  const value = typeof amount === "number" && Number.isFinite(amount) ? amount : 0
  return value.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// "$1,234.50" con el símbolo indicado.
export function formatAmountWithSymbol(amount: number | null | undefined, symbol: string): string {
  return `${symbol}${formatNumber(amount)}`
}

// "$1,234.50 MXN".
export function formatMoneyWithCode(amount: number | null | undefined, currencyCode: string): string {
  return `$${formatNumber(amount)} ${currencyCode}`
}

// Fecha de calendario (YYYY-MM-DD) en español: "5 de octubre de 2026". No depende de la zona del servidor.
export function formatLongDate(value: string | null | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || "")
  if (!match) return "Sin fecha"
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
}

// Convierte el mensaje libre del usuario en párrafos HTML escapados.
export function messageParagraphs(message: string): string {
  return message
    .split(/\n+/)
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 12px">${escapeHtml(line)}</p>`)
    .join("")
}

export function wrapEmailDocument(body: string): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8" /></head><body>${body}</body></html>`
}
