// Tipos y utilidades compartidas para el módulo de Pre-Facturas.

export const IVA_RATE = 0.16

export type PreInvoiceStatus = "draft" | "sent" | "invoiced" | "cancelled"
export type PreInvoiceSourceType = "account" | "project"

export interface PreInvoiceItem {
  id: string
  pre_invoice_id: string
  source_service_type: "account_service" | "project_service" | "manual"
  source_service_id: string | null
  service_id: string | null
  description: string
  quantity: number
  unit_price: number
  discount: number
  amount: number
  is_included: boolean
  sort_order: number
}

export interface PreInvoice {
  id: string
  pre_invoice_number: string
  source_type: PreInvoiceSourceType
  account_id: string | null
  project_id: string | null
  client_id: string | null
  agency_id: string | null
  period_start: string
  period_label: string | null
  status: PreInvoiceStatus
  currency: string
  subtotal: number
  tax: number
  total: number
  notes: string | null
  invoice_id: string | null
  sent_at: string | null
  sent_to: string | null
  created_at: string
  updated_at: string
}

export const STATUS_LABELS: Record<PreInvoiceStatus, string> = {
  draft: "Borrador",
  sent: "Enviada",
  invoiced: "Facturada",
  cancelled: "Cancelada",
}

export const STATUS_VARIANTS: Record<PreInvoiceStatus, "secondary" | "default" | "outline" | "destructive"> = {
  draft: "secondary",
  sent: "default",
  invoiced: "outline",
  cancelled: "destructive",
}

// Monto de una línea aplicando descuento porcentual.
export function lineAmount(quantity: number, unitPrice: number, discount: number): number {
  const amount = (quantity || 0) * (unitPrice || 0) * (1 - (discount || 0) / 100)
  return Math.round(amount * 100) / 100
}

// Totales de una prefactura considerando solo las líneas incluidas.
export function computeTotals(items: { amount: number; is_included: boolean }[]) {
  const subtotal = items
    .filter((i) => i.is_included)
    .reduce((sum, i) => sum + (i.amount || 0), 0)
  const tax = Math.round(subtotal * IVA_RATE * 100) / 100
  const total = Math.round((subtotal + tax) * 100) / 100
  return { subtotal: Math.round(subtotal * 100) / 100, tax, total }
}

export function formatCurrency(amount: number, currency = "MXN"): string {
  return `$${(amount || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`
}

// Etiqueta legible del periodo, p.ej. "Enero 2026".
export function periodLabel(periodStart: string): string {
  const [year, month] = periodStart.split("-").map(Number)
  const date = new Date(year, (month || 1) - 1, 1)
  const label = date.toLocaleDateString("es-MX", { month: "long", year: "numeric" })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// Primer día del mes en formato YYYY-MM-DD a partir de un valor "YYYY-MM".
export function periodStartFromMonth(month: string): string {
  return `${month}-01`
}

// Lista de los últimos N meses (incluyendo el actual) como opciones YYYY-MM.
export function recentMonths(count = 12): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    options.push({ value, label: periodLabel(`${value}-01`) })
  }
  return options
}
