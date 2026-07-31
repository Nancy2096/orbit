import * as XLSX from "xlsx"
import type { createClient } from "@/lib/supabase/client"

type SupabaseClient = ReturnType<typeof createClient>

// Estructuras mínimas necesarias para calcular y exportar la tabla de nómina.
// Se replica fielmente la lógica del detalle (app/dashboard/hr/payroll/[id]).
export interface PayrollExportStaff {
  id: string
  first_name: string
  last_name: string
  position: string | null
  monthly_salary: number | null
  payment_frequency: string | null
  is_active: boolean
  agency_id: string | null
  employment_status: string | null
  hire_date: string | null
  status_change_date: string | null
  finiquito: number | null
  finiquito_paid_at: string | null
  bank_name: string | null
  bank_clabe: string | null
  bank_account_number: string | null
}

export interface PayrollExportPeriod {
  id: string
  period_name: string
  period_type: string
  start_date: string
  end_date: string
  payment_date: string | null
  status: string
  payment_concept: string | null
  agency_id: string | null
  // Ajuste de impuestos/deducciones guardado y aprobado para el periodo.
  tax_config: {
    taxRate: number
    imssRate: number
    isrRate: number
    otherDeductions: number
  } | null
}

export interface PayrollExportEntry {
  staff: PayrollExportStaff
  base_salary: number
  bonuses: number
  commissions: number
  finiquito: number
  loanDeductions: number
  deductions: number
  taxes: number
  gross_pay: number
  net_pay: number
}

// Cálculo del salario base del periodo (idéntico al del detalle de nómina).
export function calculateBaseSalary(
  staff: PayrollExportStaff,
  periodType: string,
  startDate?: string | null,
  endDate?: string | null,
): number {
  const monthlySalary = staff.monthly_salary || 0
  const frequency = staff.payment_frequency || "biweekly"
  const dailyRate = monthlySalary / 30.5

  const parseDate = (s?: string | null) => (s ? new Date(s + "T00:00:00Z") : null)
  const daysInclusive = (a: Date, b: Date) => Math.floor((b.getTime() - a.getTime()) / 86400000) + 1

  const periodStart = parseDate(startDate)
  const periodEnd = parseDate(endDate)
  const hire = parseDate(staff.hire_date)
  const exit = !staff.is_active && staff.status_change_date ? parseDate(staff.status_change_date) : null

  const standardSalary = (): number => {
    switch (periodType) {
      case "semanal":
        return monthlySalary / 4
      case "quincenal": {
        const startDay = periodStart ? periodStart.getUTCDate() : 1
        const isFirstHalf = startDay <= 15
        if (frequency === "monthly") return isFirstHalf ? 0 : monthlySalary
        return monthlySalary / 2
      }
      case "mensual":
        return monthlySalary
      default:
        return monthlySalary
    }
  }

  if (frequency === "monthly") {
    if (periodType === "quincenal" && periodStart && periodStart.getUTCDate() <= 15) {
      return 0
    }
    const ref = periodEnd || periodStart
    if (!ref) return monthlySalary
    const monthStart = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1))
    const monthEnd = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 0))
    const isPartial = (hire && hire > monthStart) || (exit && exit < monthEnd)
    if (!isPartial) return monthlySalary
    const activeStart = hire && hire > monthStart ? hire : monthStart
    const activeEnd = exit && exit < monthEnd ? exit : monthEnd
    if (activeEnd < activeStart) return 0
    return Math.round(dailyRate * daysInclusive(activeStart, activeEnd) * 100) / 100
  }

  if (periodStart && periodEnd) {
    const isPartial = (hire && hire > periodStart) || (exit && exit < periodEnd)
    if (isPartial) {
      const activeStart = hire && hire > periodStart ? hire : periodStart
      const activeEnd = exit && exit < periodEnd ? exit : periodEnd
      if (activeEnd < activeStart) return 0
      return Math.round(dailyRate * daysInclusive(activeStart, activeEnd) * 100) / 100
    }
  }

  return standardSalary()
}

// Recalcula las entradas de nómina de un periodo desde staff/bonos/comisiones/préstamos.
// Refleja lo que muestra el detalle al cargar (impuestos estimados al 10%).
export async function computePayrollEntries(
  supabase: SupabaseClient,
  period: PayrollExportPeriod,
  includeGlobalStaff = false,
): Promise<PayrollExportEntry[]> {
  const isGlobalPeriod = !period.agency_id

  let staffQuery = supabase.from("staff").select("*").order("first_name")

  if (isGlobalPeriod) {
    // Periodo global: todo el personal.
  } else if (includeGlobalStaff) {
    staffQuery = staffQuery.or(`agency_id.eq.${period.agency_id},agency_id.is.null`)
  } else {
    staffQuery = staffQuery.eq("agency_id", period.agency_id)
  }

  const { data: staffRaw } = await staffQuery

  const staffData = (staffRaw || []).filter((s) => {
    if (s.is_active) return true
    const hasFiniquito = Number(s.finiquito) > 0 && !s.finiquito_paid_at
    const changed = s.status_change_date
    const leftDuringPeriod =
      !!changed && changed >= period.start_date && changed <= period.end_date
    return hasFiniquito || leftDuringPeriod
  })

  const staffIds = staffData.map((s) => s.id)
  const bonusesByStaff: Record<string, number> = {}
  const commissionsByStaff: Record<string, number> = {}
  const loanDeductionsByStaff: Record<string, number> = {}

  const start = period.start_date
  const end = period.end_date
  const inPeriod = (dateStr: string | null | undefined, fallback: string | null | undefined) => {
    const raw = dateStr || fallback
    if (!raw) return false
    const d = String(raw).slice(0, 10)
    return d >= start && d <= end
  }

  if (staffIds.length > 0) {
    const [bonusesRes, commissionsRes, loansRes] = await Promise.all([
      supabase
        .from("bonuses")
        .select("staff_id, amount, benefit_type, status, effective_date, created_at")
        .in("staff_id", staffIds)
        .in("status", ["approved", "paid"]),
      supabase
        .from("commissions")
        .select("staff_id, commission_amount, status, period_date, created_at")
        .in("staff_id", staffIds)
        .in("status", ["approved", "paid"]),
      supabase
        .from("loans")
        .select("staff_id, payment_amount, remaining_balance, status")
        .in("staff_id", staffIds)
        .in("status", ["active", "approved"]),
    ])

    for (const b of bonusesRes.data || []) {
      if (b.benefit_type === "free_days") continue
      if (!inPeriod(b.effective_date, b.created_at)) continue
      bonusesByStaff[b.staff_id] = (bonusesByStaff[b.staff_id] || 0) + Number(b.amount || 0)
    }
    for (const c of commissionsRes.data || []) {
      if (!inPeriod(c.period_date, c.created_at)) continue
      commissionsByStaff[c.staff_id] =
        (commissionsByStaff[c.staff_id] || 0) + Number(c.commission_amount || 0)
    }
    for (const l of loansRes.data || []) {
      const remaining = Number(l.remaining_balance ?? 0)
      if (remaining <= 0) continue
      const amount = Math.min(Number(l.payment_amount || 0), remaining)
      if (amount <= 0) continue
      loanDeductionsByStaff[l.staff_id] = (loanDeductionsByStaff[l.staff_id] || 0) + amount
    }
  }

  // Usar la configuración de impuestos/deducciones guardada y aprobada para el
  // periodo. Si no existe (periodos antiguos), se usan los valores por defecto
  // que muestra el detalle.
  const config = {
    taxRate: period.tax_config?.taxRate ?? 10,
    imssRate: period.tax_config?.imssRate ?? 3,
    isrRate: period.tax_config?.isrRate ?? 0,
    otherDeductions: period.tax_config?.otherDeductions ?? 0,
  }
  const taxRate = (config.taxRate + config.imssRate + config.isrRate) / 100

  return staffData.map((staff) => {
    const baseSalary = calculateBaseSalary(staff, period.period_type, period.start_date, period.end_date)
    const bonuses = bonusesByStaff[staff.id] || 0
    const commissions = commissionsByStaff[staff.id] || 0
    const finiquito =
      staff.employment_status === "terminated" && !staff.finiquito_paid_at
        ? Number(staff.finiquito || 0)
        : 0
    const deductions = config.otherDeductions
    const loanDeductions = loanDeductionsByStaff[staff.id] || 0
    const grossPay = baseSalary + bonuses + commissions + finiquito
    const taxes = grossPay * taxRate
    const netPay = grossPay - deductions - loanDeductions - taxes

    return {
      staff,
      base_salary: baseSalary,
      bonuses,
      commissions,
      finiquito,
      loanDeductions,
      deductions,
      taxes,
      gross_pay: grossPay,
      net_pay: netPay,
    }
  })
}

// Genera y descarga un archivo .xls con la tabla de nómina del periodo.
export function exportPayrollToXls(period: PayrollExportPeriod, entries: PayrollExportEntry[]) {
  const round2 = (n: number) => Math.round(n * 100) / 100

  const rows = entries.map((e) => ({
    Colaborador: `${e.staff.first_name} ${e.staff.last_name}`.trim(),
    Puesto: e.staff.position || "",
    Banco: e.staff.bank_name || "",
    "CLABE Interbancaria": e.staff.bank_clabe || "",
    Concepto: period.payment_concept || "",
    "Salario Base": round2(e.base_salary),
    Bonos: round2(e.bonuses),
    Comisiones: round2(e.commissions),
    Finiquito: round2(e.finiquito),
    Préstamos: round2(e.loanDeductions),
    Deducciones: round2(e.deductions),
    Impuestos: round2(e.taxes),
    "Total Bruto": round2(e.gross_pay),
    "Total Neto": round2(e.net_pay),
  }))

  // Fila de totales al final.
  if (rows.length > 0) {
    rows.push({
      Colaborador: "TOTAL",
      Puesto: "",
      Banco: "",
      "CLABE Interbancaria": "",
      Concepto: "",
      "Salario Base": round2(entries.reduce((s, e) => s + e.base_salary, 0)),
      Bonos: round2(entries.reduce((s, e) => s + e.bonuses, 0)),
      Comisiones: round2(entries.reduce((s, e) => s + e.commissions, 0)),
      Finiquito: round2(entries.reduce((s, e) => s + e.finiquito, 0)),
      Préstamos: round2(entries.reduce((s, e) => s + e.loanDeductions, 0)),
      Deducciones: round2(entries.reduce((s, e) => s + e.deductions, 0)),
      Impuestos: round2(entries.reduce((s, e) => s + e.taxes, 0)),
      "Total Bruto": round2(entries.reduce((s, e) => s + e.gross_pay, 0)),
      "Total Neto": round2(entries.reduce((s, e) => s + e.net_pay, 0)),
    })
  }

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Nómina")

  const safeName = period.period_name.replace(/[^\w\-]+/g, "_")
  XLSX.writeFile(workbook, `Nomina_${safeName}.xls`, { bookType: "xls" })
}
