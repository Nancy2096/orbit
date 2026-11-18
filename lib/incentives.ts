export const INCENTIVE_AUTHORIZER_ROLES = ["superadmin", "direccion_general"]

export type IncentiveStatus = "pending" | "approved" | "rejected" | "paid"

export const INCENTIVE_TYPE_LABELS: Record<string, string> = {
  performance: "Desempeño",
  sales: "Metas de ventas",
  referral: "Referido",
  retention: "Permanencia",
  special: "Especial",
  other: "Otro",
}

export const INCENTIVE_STATUS_LABELS: Record<IncentiveStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
  paid: "Pagado",
}

export const INCENTIVE_STATUS_STYLES: Record<IncentiveStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300",
}

export const INCENTIVE_RECEIPT_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"]
export const INCENTIVE_RECEIPT_MAX_BYTES = 10 * 1024 * 1024

export function isIncentiveAuthorizer(roleName: string | null | undefined): boolean {
  return !!roleName && INCENTIVE_AUTHORIZER_ROLES.includes(roleName)
}

export function todayInMexico(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date())
}

export function formatIncentiveAmount(amount: number, currencyCode: string | null | undefined): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: currencyCode || "MXN" }).format(amount)
}

export function formatDateOnly(value: string | null | undefined): string {
  if (!value) return "—"
  const [y, m, d] = value.slice(0, 10).split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
}

export function receiptFileUrl(pathname: string, download?: { filename: string | null }): string {
  const params = new URLSearchParams({ pathname })
  if (download) {
    params.set("download", "1")
    if (download.filename) params.set("filename", download.filename)
  }
  return `/api/file?${params.toString()}`
}
