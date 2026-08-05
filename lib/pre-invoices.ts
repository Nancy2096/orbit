// Tipos y utilidades compartidas para el módulo de Pre-Facturas.
import type { SupabaseClient } from "@supabase/supabase-js"

export const IVA_RATE = 0.16

// Roles autorizados a modificar precios unitarios en una prefactura.
export const PRICE_EDIT_ROLES = ["finanzas", "direccion_general", "superadmin"]

// ¿El rol puede editar precios unitarios de la prefactura?
export function canEditPreInvoicePrices(roleName: string | null | undefined): boolean {
  if (!roleName) return false
  return PRICE_EDIT_ROLES.includes(roleName)
}

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
  tax_enabled: boolean
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
// taxEnabled=false (p. ej. clientes extranjeros o acuerdos sin IVA) => impuesto en 0.
export function computeTotals(
  items: { amount: number; is_included: boolean }[],
  taxEnabled = true,
) {
  const subtotal = items
    .filter((i) => i.is_included)
    .reduce((sum, i) => sum + (i.amount || 0), 0)
  const tax = taxEnabled ? Math.round(subtotal * IVA_RATE * 100) / 100 : 0
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

// Refresca los montos de una prefactura tomando los datos actualizados de los
// servicios contratados en Cuentas / Proyectos. Respeta la moneda del servicio
// (p. ej. USD no se convierte a MXN) y recalcula totales según tax_enabled.
// No modifica las líneas manuales ni el estado de inclusión existente.
export async function refreshPreInvoiceAmounts(
  supabase: SupabaseClient,
  preInvoiceId: string,
): Promise<{ subtotal: number; tax: number; total: number; currency: string }> {
  const { data: pre, error: preErr } = await supabase
    .from("pre_invoices")
    .select("id, tax_enabled, currency")
    .eq("id", preInvoiceId)
    .single()
  if (preErr || !pre) throw new Error(preErr?.message || "Prefactura no encontrada")

  const { data: items, error: itemsErr } = await supabase
    .from("pre_invoice_items")
    .select("*")
    .eq("pre_invoice_id", preInvoiceId)
    .order("sort_order")
  if (itemsErr) throw new Error(itemsErr.message)

  let currency = pre.currency || "MXN"
  const updatedItems = (items || []).map((it) => ({ ...it }))

  for (const item of updatedItems) {
    if (item.source_service_type === "account_service" && item.source_service_id) {
      const { data: svc } = await supabase
        .from("account_services")
        .select("quantity, unit_price, custom_name, currency_code, service:services(name)")
        .eq("id", item.source_service_id)
        .maybeSingle()
      if (svc) {
        const quantity = Number(svc.quantity) || 1
        const unit_price = Number(svc.unit_price) || 0
        const svcName = Array.isArray(svc.service) ? svc.service[0]?.name : (svc.service as { name?: string } | null)?.name
        item.quantity = quantity
        item.unit_price = unit_price
        item.amount = lineAmount(quantity, unit_price, Number(item.discount) || 0)
        item.description = svc.custom_name || svcName || item.description
        if (svc.currency_code) currency = svc.currency_code
      }
    } else if (item.source_service_type === "project_service" && item.source_service_id) {
      const { data: svc } = await supabase
        .from("project_services")
        .select("quantity, unit_price, discount_percentage, billing_percentage, currency, notes, service:services(name)")
        .eq("id", item.source_service_id)
        .maybeSingle()
      if (svc) {
        const quantity = Number(svc.quantity) || 1
        const unit_price = Number(svc.unit_price) || 0
        const discount = Number(svc.discount_percentage) || 0
        const billingPct = svc.billing_percentage != null ? Number(svc.billing_percentage) : null
        const baseAmount = lineAmount(quantity, unit_price, discount)
        const amount =
          billingPct != null && billingPct !== 100
            ? Math.round(baseAmount * (billingPct / 100) * 100) / 100
            : baseAmount
        item.quantity = quantity
        item.unit_price = unit_price
        item.discount = discount
        item.amount = amount
        if (svc.currency) currency = svc.currency
      }
    }
  }

  // Persistir cada línea actualizada (solo campos calculados).
  for (const item of updatedItems) {
    await supabase
      .from("pre_invoice_items")
      .update({
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        amount: item.amount,
        description: item.description,
      })
      .eq("id", item.id)
  }

  const totals = computeTotals(
    updatedItems.map((i) => ({ amount: Number(i.amount) || 0, is_included: i.is_included })),
    pre.tax_enabled !== false,
  )

  await supabase
    .from("pre_invoices")
    .update({
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      currency,
      updated_at: new Date().toISOString(),
    })
    .eq("id", preInvoiceId)

  return { ...totals, currency }
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
