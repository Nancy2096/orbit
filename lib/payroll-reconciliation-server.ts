import "server-only"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { buildPayrollBreakdownItems, sumBreakdown } from "@/lib/payroll-bank-breakdown"

type Service = ReturnType<typeof createAdminClient>

export interface PayrollActor {
  userId: string
  roleName: string | null
  service: Service
}

// Usuario activo con acceso a la nómina (payroll_all.update en su rol).
export async function getPayrollActor(): Promise<PayrollActor | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const service = createAdminClient()
  const { data: row } = await service
    .from("users")
    .select("is_active, role_id, role:roles(name)")
    .eq("id", user.id)
    .maybeSingle()
  if (!row || row.is_active === false || !row.role_id) return null

  const role = Array.isArray(row.role) ? row.role[0] : row.role
  const roleName = (role as { name?: string } | null)?.name ?? null

  const { data: perms } = await service
    .from("role_permissions")
    .select("permission:permissions!inner(module, action)")
    .eq("role_id", row.role_id)
    .eq("permission.module", "payroll_all")
    .eq("permission.action", "update")
    .limit(1)
  if (roleName !== "superadmin" && (!perms || perms.length === 0)) return null

  return { userId: user.id, roleName, service }
}

export async function getPaidPayrollPermissions(service: Service, userId: string) {
  const [edit, cancel] = await Promise.all([
    service.rpc("can_manage_paid_payroll", { p_user: userId, p_key: "payroll.edit_paid" }),
    service.rpc("can_manage_paid_payroll", { p_user: userId, p_key: "payroll.cancel" }),
  ])
  return { editPaid: edit.data === true, cancel: cancel.data === true }
}

export interface SnapshotEntry {
  staff_id: string
  staff?: {
    first_name?: string
    last_name?: string
    payroll_bank_name?: string | null
    currency_id?: string | null
    payroll_payment_currency_id?: string | null
    payroll_exchange_rate?: number | null
  } | null
  base_salary: number
  bonuses: number
  commissions: number
  finiquito: number
  deductions: number
  loanDeductions: number
  taxes: number
  gross_pay: number
  net_pay: number
  paid_currency_code?: string | null
  paid_amount?: number | null
  payment_cancelled?: boolean
  [key: string]: unknown
}

export interface PeriodRow {
  id: string
  period_name: string
  status: string
  agency_id: string | null
  tax_config: { taxRate?: number; imssRate?: number; isrRate?: number } | null
  entries_snapshot: SnapshotEntry[] | null
}

export async function loadPeriod(service: Service, periodId: string) {
  const { data } = await service
    .from("payroll_periods")
    .select("id, period_name, status, agency_id, tax_config, entries_snapshot")
    .eq("id", periodId)
    .maybeSingle()
  return (data as PeriodRow | null) ?? null
}

// Banco, monto (en la moneda del banco) y desglose del pago de UN colaborador.
// Se calcula en el servidor para que el cliente no pueda alterar el monto.
export async function computeStaffMovement(service: Service, period: PeriodRow, staffId: string) {
  const entry = (period.entries_snapshot || []).find((e) => e.staff_id === staffId)
  if (!entry) return { error: "El colaborador no está en esta nómina" as const }

  const { data: staffRow } = await service
    .from("staff")
    .select("payroll_bank_name")
    .eq("id", staffId)
    .maybeSingle()
  const bankName = String(entry.staff?.payroll_bank_name || staffRow?.payroll_bank_name || "").trim()
  if (!bankName) return { missing: "Sin banco de origen" as const }

  const [{ data: accounts }, { data: currencies }] = await Promise.all([
    service.from("bank_accounts").select("id, bank_name, agency_id, is_primary, currency_id").eq("is_active", true),
    service.from("currencies").select("id, code"),
  ])
  const matches = (accounts || []).filter(
    (a) => String(a.bank_name || "").trim().toLowerCase() === bankName.toLowerCase(),
  )
  const sameAgency = matches.filter((a) => a.agency_id === period.agency_id)
  const pool = sameAgency.length > 0 ? sameAgency : matches
  const account = pool.find((a) => a.is_primary) || pool[0]
  if (!account) return { missing: `Sin cuenta bancaria activa para ${bankName}` as const }

  const codeById = (id: string | null | undefined) =>
    (currencies || []).find((c) => c.id === id)?.code || "MXN"
  const bankCode = codeById(account.currency_id)
  const items = buildPayrollBreakdownItems([entry], bankCode, codeById)
  const amount = sumBreakdown(items)
  const name = `${entry.staff?.first_name ?? ""} ${entry.staff?.last_name ?? ""}`.replace(/\s+/g, " ").trim()

  return {
    bankAccountId: account.id as string,
    amount,
    breakdown: { source: "registro", bank_code: bankCode, items },
    description: `Pago de nómina ${period.period_name} · ${name || "Colaborador"}`,
  }
}

// Crea, reemplaza o revierte el movimiento bancario del colaborador. La regla
// "solo con comprobante y fecha real" la valida la función de la base.
export async function syncStaffMovement(
  service: Service,
  period: PeriodRow,
  staffId: string,
  userId: string,
  opts: { paymentDate?: string | null; reason?: string | null } = {},
) {
  const calc = await computeStaffMovement(service, period, staffId)
  if ("error" in calc) throw new Error(calc.error)
  const ok = "bankAccountId" in calc
  const { data, error } = await service.rpc("payroll_sync_staff_movement", {
    p_period: period.id,
    p_staff: staffId,
    p_user: userId,
    p_payment_date: opts.paymentDate ?? null,
    p_bank_account_id: ok ? calc.bankAccountId : null,
    p_amount: ok ? calc.amount : null,
    p_breakdown: ok ? calc.breakdown : null,
    p_description: ok ? calc.description : null,
    p_reason: opts.reason ?? null,
  })
  if (error) throw new Error(error.message)
  return { ...(data as { status: string; movement_id: string | null }), warning: ok ? null : calc.missing }
}
