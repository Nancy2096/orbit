import { NextResponse } from "next/server"
import { loadAccessibleClient, requireCollectionsAccess } from "@/lib/collections/access"
import { OPEN_INVOICE_STATUSES, daysBetween, toLocalIsoDate } from "@/lib/collections/rules"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const one = <T,>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null)

export async function GET(_request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const access = await requireCollectionsAccess()
  if (access instanceof NextResponse) return access

  const { clientId } = await params
  const { client, error } = await loadAccessibleClient(access, clientId)
  if (error) return error

  const { service } = access
  const today = toLocalIsoDate(new Date())

  const [{ data: invoices }, { data: activities }, { data: promises }, { data: status }, { data: accounts }] =
    await Promise.all([
      service
        .from("invoices")
        .select("id, invoice_number, status, issue_date, due_date, total_amount, balance_due, currency:currencies(code), account:accounts(account_name)")
        .eq("client_id", client.id)
        .in("status", [...OPEN_INVOICE_STATUSES])
        .gt("balance_due", 0)
        .order("due_date", { ascending: true }),
      service
        .from("collection_activities")
        .select("id, activity_type, note, metadata, created_at, user:users(first_name, last_name)")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(100),
      service
        .from("payment_promises")
        .select("id, promised_date, amount, status, note, created_at, currency:currencies(code)")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(50),
      service
        .from("collection_client_status")
        .select("service_paused, pause_reason, paused_at")
        .eq("client_id", client.id)
        .maybeSingle(),
      service.from("accounts").select("id, account_name, account_code").eq("client_id", client.id).order("account_name"),
    ])

  const openInvoices = (invoices ?? []).map((inv) => {
    const daysOverdue = inv.due_date ? daysBetween(inv.due_date, today) : 0
    return {
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      issueDate: inv.issue_date,
      dueDate: inv.due_date,
      total: Number(inv.total_amount) || 0,
      balance: Number(inv.balance_due) || 0,
      currency: one(inv.currency as unknown as { code: string } | null)?.code || "MXN",
      accountName: one(inv.account as unknown as { account_name: string | null } | null)?.account_name || null,
      daysOverdue,
    }
  })

  const overdueByCurrency: Record<string, number> = {}
  let maxDaysOverdue = 0
  for (const inv of openInvoices) {
    maxDaysOverdue = Math.max(maxDaysOverdue, inv.daysOverdue)
    if (inv.daysOverdue > 0) overdueByCurrency[inv.currency] = (overdueByCurrency[inv.currency] || 0) + inv.balance
  }

  return NextResponse.json({
    today,
    client: {
      id: client.id,
      agencyId: client.agency_id,
      name: client.company_name || "Sin nombre",
      legalName: client.legal_name,
      contactName: client.primary_contact_name,
      contactEmail: client.billing_email || client.primary_contact_email || null,
      contactPhone: client.primary_contact_phone,
    },
    accounts: (accounts ?? []).map((a) => ({ id: a.id, name: a.account_name, code: a.account_code })),
    invoices: openInvoices,
    overdueByCurrency,
    maxDaysOverdue,
    activities: (activities ?? []).map((a) => {
      const user = one(a.user as unknown as { first_name: string | null; last_name: string | null } | null)
      return {
        id: a.id,
        type: a.activity_type,
        note: a.note,
        metadata: a.metadata,
        createdAt: a.created_at,
        userName: user ? [user.first_name, user.last_name].filter(Boolean).join(" ") : null,
      }
    }),
    promises: (promises ?? []).map((p) => ({
      id: p.id,
      promisedDate: p.promised_date,
      amount: Number(p.amount) || 0,
      status: p.status,
      note: p.note,
      createdAt: p.created_at,
      currency: one(p.currency as unknown as { code: string } | null)?.code || "MXN",
      isBroken: p.status === "pending" && p.promised_date < today,
    })),
    servicePaused: status?.service_paused === true,
    pauseReason: status?.pause_reason ?? null,
    pausedAt: status?.paused_at ?? null,
  })
}
