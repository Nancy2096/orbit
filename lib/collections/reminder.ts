import "server-only"

import type { CollectionsAccess } from "@/lib/collections/access"
import { OPEN_INVOICE_STATUSES, daysBetween, todayInBusinessTimeZone } from "@/lib/collections/rules"
import { isValidEmail } from "@/lib/invoice-email-rules"

export interface ReminderInvoice {
  invoiceNumber: string | null
  dueDate: string | null
  balance: number
  daysOverdue: number
}

export interface ReminderCurrencyGroup {
  currency: string
  invoices: ReminderInvoice[]
  subtotal: number
}

export interface ReminderContext {
  today: string
  agencyName: string
  agencyEmail: string | null
  groups: ReminderCurrencyGroup[]
  otherAgencies: { invoiceCount: number; agencyCount: number }
}

interface ReminderClient {
  id: string
  agency_id: string
}

const roundCents = (value: number) => Math.round(value * 100) / 100

// Facturas abiertas del cliente SOLO de su agencia, agrupadas por moneda (nunca se suman monedas distintas).
// Las de otras agencias solo se cuentan para avisar en el modal.
export async function loadReminderContext(
  access: CollectionsAccess,
  client: ReminderClient,
): Promise<ReminderContext | null> {
  const { service } = access
  const today = todayInBusinessTimeZone()

  const [{ data: invoices }, { data: agency }] = await Promise.all([
    service
      .from("invoices")
      .select("invoice_number, agency_id, due_date, balance_due, currency:currencies(code)")
      .eq("client_id", client.id)
      .in("status", [...OPEN_INVOICE_STATUSES])
      .gt("balance_due", 0)
      .order("due_date", { ascending: true }),
    service.from("agencies").select("id, name, email").eq("id", client.agency_id).maybeSingle(),
  ])

  if (!agency || !access.canAccessAgency(agency.id)) return null

  const byCurrency = new Map<string, ReminderCurrencyGroup>()
  const otherAgencyIds = new Set<string>()
  let otherInvoiceCount = 0

  for (const inv of invoices ?? []) {
    if (inv.agency_id !== client.agency_id) {
      otherInvoiceCount += 1
      if (inv.agency_id) otherAgencyIds.add(inv.agency_id)
      continue
    }
    const currencyRow = (Array.isArray(inv.currency) ? inv.currency[0] : inv.currency) as { code?: string } | null
    const currency = currencyRow?.code || "MXN"
    const balance = Number(inv.balance_due) || 0
    const group = byCurrency.get(currency) ?? { currency, invoices: [], subtotal: 0 }
    group.invoices.push({
      invoiceNumber: inv.invoice_number,
      dueDate: inv.due_date,
      balance,
      daysOverdue: inv.due_date ? Math.max(0, daysBetween(inv.due_date, today)) : 0,
    })
    group.subtotal = roundCents(group.subtotal + balance)
    byCurrency.set(currency, group)
  }

  const groups = [...byCurrency.values()].sort((a, b) =>
    a.currency === "MXN" ? -1 : b.currency === "MXN" ? 1 : a.currency.localeCompare(b.currency),
  )

  const agencyEmail = agency.email?.trim()
  return {
    today,
    agencyName: agency.name || "Orbit",
    agencyEmail: agencyEmail && isValidEmail(agencyEmail) ? agencyEmail : null,
    groups,
    otherAgencies: { invoiceCount: otherInvoiceCount, agencyCount: otherAgencyIds.size },
  }
}
