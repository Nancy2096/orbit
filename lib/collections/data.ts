import "server-only"

import type { CollectionsAccess } from "@/lib/collections/access"
import {
  DUE_SOON_DAYS,
  OPEN_INVOICE_STATUSES,
  agingBucketFor,
  daysBetween,
  suggestActionFor,
  toLocalIsoDate,
  type ActivityType,
  type AgingBucket,
  type SuggestedAction,
} from "@/lib/collections/rules"

export interface CurrencyKpis {
  arTotal: number
  dso: number | null
  dsoPrevious: number | null
  overdueTotal: number
  issuedThisYear: number
  overduePctOfIssued: number | null
  dueThisMonthTotal: number
  collectedThisMonth: number
  collectionRate: number | null
  dueSoonTotal: number
  dueSoonCount: number
  aging: Record<AgingBucket, number>
}

export interface CollectionRow {
  clientId: string
  agencyId: string
  agencyName: string
  clientName: string
  accounts: string[]
  invoiceNumbers: string[]
  invoiceCount: number
  pendingByCurrency: Record<string, number>
  overdueByCurrency: Record<string, number>
  maxDaysOverdue: number
  bucket: AgingBucket
  hasOverdue: boolean
  hasDueSoon: boolean
  nextDueDate: string | null
  lastActivity: { type: ActivityType; note: string | null; createdAt: string } | null
  promise: { id: string; promisedDate: string; amount: number; currency: string; isBroken: boolean } | null
  servicePaused: boolean
  suggestedAction: SuggestedAction
  contactEmail: string | null
  contactName: string | null
  contactPhone: string | null
}

export interface CollectionsSummary {
  today: string
  agencies: { id: string; name: string }[]
  currencies: string[]
  kpis: Record<string, CurrencyKpis>
  rows: CollectionRow[]
}

interface InvoiceRow {
  id: string
  agency_id: string
  client_id: string | null
  invoice_number: string | null
  status: string
  issue_date: string | null
  due_date: string | null
  total_amount: number | null
  paid_amount: number | null
  balance_due: number | null
  payment_date: string | null
  currency: { code: string } | { code: string }[] | null
  account: { account_name: string | null } | { account_name: string | null }[] | null
}

const one = <T,>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null)

const num = (value: unknown) => (typeof value === "number" ? value : Number(value) || 0)

function emptyKpis(): CurrencyKpis {
  return {
    arTotal: 0,
    dso: null,
    dsoPrevious: null,
    overdueTotal: 0,
    issuedThisYear: 0,
    overduePctOfIssued: null,
    dueThisMonthTotal: 0,
    collectedThisMonth: 0,
    collectionRate: null,
    dueSoonTotal: 0,
    dueSoonCount: 0,
    aging: { current: 0, d1_30: 0, d31_60: 0, d60_plus: 0 },
  }
}

const isOpen = (inv: InvoiceRow) =>
  (OPEN_INVOICE_STATUSES as readonly string[]).includes(inv.status) && num(inv.balance_due) > 0

// Saldo por cobrar aproximado a una fecha: facturas emitidas hasta esa fecha que no
// estaban pagadas en ella. Las parcialidades se toman con el saldo actual.
function receivableAt(inv: InvoiceRow, isoDate: string): number {
  if (!inv.issue_date || inv.issue_date > isoDate) return 0
  if (inv.status === "draft" || inv.status === "cancelled") return 0
  if (inv.status === "paid") {
    return inv.payment_date && inv.payment_date.slice(0, 10) <= isoDate ? 0 : num(inv.total_amount)
  }
  return num(inv.balance_due)
}

function issuedBetween(invoices: InvoiceRow[], fromIso: string, toIso: string): number {
  return invoices
    .filter((i) => i.status !== "draft" && i.status !== "cancelled" && i.issue_date && i.issue_date >= fromIso && i.issue_date <= toIso)
    .reduce((sum, i) => sum + num(i.total_amount), 0)
}

function dsoFor(invoices: InvoiceRow[], atIso: string): number | null {
  const at = new Date(`${atIso}T00:00:00`)
  const from = new Date(at)
  from.setDate(from.getDate() - 89)
  const issued = issuedBetween(invoices, toLocalIsoDate(from), atIso)
  if (issued <= 0) return null
  const ar = invoices.reduce((sum, i) => sum + receivableAt(i, atIso), 0)
  return Math.round((ar / issued) * 90)
}

export async function loadCollectionsSummary(
  access: CollectionsAccess,
  agencyFilter: string | null,
): Promise<CollectionsSummary> {
  const now = new Date()
  const today = toLocalIsoDate(now)
  const soonLimit = toLocalIsoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + DUE_SOON_DAYS))
  const monthStart = toLocalIsoDate(new Date(now.getFullYear(), now.getMonth(), 1))
  const monthEnd = toLocalIsoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  const prevMonthEnd = toLocalIsoDate(new Date(now.getFullYear(), now.getMonth(), 0))
  const yearStart = `${now.getFullYear()}-01-01`

  let scope: string[] | null = access.allAgencies ? null : [...access.agencyIds]
  if (agencyFilter) {
    if (!access.canAccessAgency(agencyFilter)) scope = []
    else scope = [agencyFilter]
  }

  const empty: CollectionsSummary = { today, agencies: [], currencies: [], kpis: {}, rows: [] }
  if (scope && scope.length === 0) return empty

  const { service } = access
  let agenciesQuery = service.from("agencies").select("id, name").order("name")
  if (!access.allAgencies) agenciesQuery = agenciesQuery.in("id", [...access.agencyIds])

  let invoicesQuery = service
    .from("invoices")
    .select(
      "id, agency_id, client_id, invoice_number, status, issue_date, due_date, total_amount, paid_amount, balance_due, payment_date, currency:currencies(code), account:accounts(account_name)",
    )
    .neq("status", "draft")
    .neq("status", "cancelled")
    .range(0, 9999)
  if (scope) invoicesQuery = invoicesQuery.in("agency_id", scope)

  const [{ data: agencies }, { data: invoiceData, error: invoicesError }] = await Promise.all([
    agenciesQuery,
    invoicesQuery,
  ])
  if (invoicesError) throw new Error(invoicesError.message)

  const invoices = (invoiceData ?? []) as unknown as InvoiceRow[]
  const agencyNames = new Map((agencies ?? []).map((a) => [a.id as string, a.name as string]))

  const byCurrency = new Map<string, InvoiceRow[]>()
  for (const inv of invoices) {
    const code = one(inv.currency)?.code || "MXN"
    if (!byCurrency.has(code)) byCurrency.set(code, [])
    byCurrency.get(code)!.push(inv)
  }

  const kpis: Record<string, CurrencyKpis> = {}
  for (const [code, list] of byCurrency) {
    const k = emptyKpis()
    for (const inv of list) {
      if (inv.due_date && inv.due_date >= monthStart && inv.due_date <= monthEnd) {
        k.dueThisMonthTotal += num(inv.total_amount)
        k.collectedThisMonth += num(inv.paid_amount)
      }
      if (!isOpen(inv)) continue
      const balance = num(inv.balance_due)
      const daysOverdue = inv.due_date ? daysBetween(inv.due_date, today) : 0
      k.arTotal += balance
      k.aging[agingBucketFor(daysOverdue)] += balance
      if (daysOverdue > 0) k.overdueTotal += balance
      if (inv.due_date && inv.due_date >= today && inv.due_date <= soonLimit) {
        k.dueSoonTotal += balance
        k.dueSoonCount += 1
      }
    }
    k.issuedThisYear = issuedBetween(list, yearStart, today)
    k.overduePctOfIssued = k.issuedThisYear > 0 ? Math.round((k.overdueTotal / k.issuedThisYear) * 100) : null
    k.collectionRate = k.dueThisMonthTotal > 0 ? Math.round((k.collectedThisMonth / k.dueThisMonthTotal) * 100) : null
    k.dso = dsoFor(list, today)
    k.dsoPrevious = dsoFor(list, prevMonthEnd)
    kpis[code] = k
  }

  const openInvoices = invoices.filter((inv) => isOpen(inv) && inv.client_id)
  const clientIds = [...new Set(openInvoices.map((i) => i.client_id as string))]

  const rows: CollectionRow[] = []
  if (clientIds.length > 0) {
    const [{ data: clients }, { data: activities }, { data: promises }, { data: statuses }] = await Promise.all([
      service
        .from("clients")
        .select("id, agency_id, company_name, billing_email, primary_contact_name, primary_contact_email, primary_contact_phone")
        .in("id", clientIds),
      service
        .from("collection_activities")
        .select("client_id, activity_type, note, created_at")
        .in("client_id", clientIds)
        .order("created_at", { ascending: false })
        .range(0, 4999),
      service
        .from("payment_promises")
        .select("id, client_id, promised_date, amount, status, currency:currencies(code)")
        .in("client_id", clientIds)
        .eq("status", "pending")
        .order("promised_date", { ascending: true }),
      service.from("collection_client_status").select("client_id, service_paused").in("client_id", clientIds),
    ])

    const lastActivity = new Map<string, CollectionRow["lastActivity"]>()
    for (const a of activities ?? []) {
      if (!lastActivity.has(a.client_id)) {
        lastActivity.set(a.client_id, { type: a.activity_type as ActivityType, note: a.note, createdAt: a.created_at })
      }
    }
    const nextPromise = new Map<string, CollectionRow["promise"]>()
    for (const p of promises ?? []) {
      if (nextPromise.has(p.client_id)) continue
      nextPromise.set(p.client_id, {
        id: p.id,
        promisedDate: p.promised_date,
        amount: num(p.amount),
        currency: one(p.currency as unknown as { code: string } | null)?.code || "MXN",
        isBroken: p.promised_date < today,
      })
    }
    const paused = new Set((statuses ?? []).filter((s) => s.service_paused).map((s) => s.client_id as string))

    for (const client of clients ?? []) {
      const list = openInvoices.filter((i) => i.client_id === client.id)
      const pendingByCurrency: Record<string, number> = {}
      const overdueByCurrency: Record<string, number> = {}
      let maxDaysOverdue = 0
      let hasDueSoon = false
      let nextDueDate: string | null = null
      const accounts = new Set<string>()
      for (const inv of list) {
        const code = one(inv.currency)?.code || "MXN"
        const balance = num(inv.balance_due)
        const daysOverdue = inv.due_date ? daysBetween(inv.due_date, today) : 0
        pendingByCurrency[code] = (pendingByCurrency[code] || 0) + balance
        if (daysOverdue > 0) overdueByCurrency[code] = (overdueByCurrency[code] || 0) + balance
        maxDaysOverdue = Math.max(maxDaysOverdue, daysOverdue)
        if (inv.due_date && inv.due_date >= today) {
          if (inv.due_date <= soonLimit) hasDueSoon = true
          if (!nextDueDate || inv.due_date < nextDueDate) nextDueDate = inv.due_date
        }
        const accountName = one(inv.account)?.account_name
        if (accountName) accounts.add(accountName)
      }
      const promise = nextPromise.get(client.id) ?? null
      const servicePaused = paused.has(client.id)
      rows.push({
        clientId: client.id,
        agencyId: client.agency_id,
        agencyName: agencyNames.get(client.agency_id) || "",
        clientName: client.company_name || "Sin nombre",
        accounts: [...accounts].sort(),
        invoiceNumbers: list.map((i) => i.invoice_number || "").filter(Boolean),
        invoiceCount: list.length,
        pendingByCurrency,
        overdueByCurrency,
        maxDaysOverdue,
        bucket: agingBucketFor(maxDaysOverdue),
        hasOverdue: maxDaysOverdue > 0,
        hasDueSoon,
        nextDueDate,
        lastActivity: lastActivity.get(client.id) ?? null,
        promise,
        servicePaused,
        suggestedAction: suggestActionFor({ maxDaysOverdue, hasDueSoon, servicePaused, promise }),
        contactEmail: client.billing_email || client.primary_contact_email || null,
        contactName: client.primary_contact_name || null,
        contactPhone: client.primary_contact_phone || null,
      })
    }
    rows.sort((a, b) => b.maxDaysOverdue - a.maxDaysOverdue || a.clientName.localeCompare(b.clientName, "es"))
  }

  const currencies = [...byCurrency.keys()].sort((a, b) => (a === "MXN" ? -1 : b === "MXN" ? 1 : a.localeCompare(b)))
  return {
    today,
    agencies: (agencies ?? []).map((a) => ({ id: a.id as string, name: a.name as string })),
    currencies,
    kpis,
    rows,
  }
}
