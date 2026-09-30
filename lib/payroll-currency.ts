export interface PaymentStaffLike {
  payroll_payment_currency_id?: string | null
  currency_id?: string | null
  payroll_exchange_rate?: number | string | null
}

export interface PaymentEntryLike {
  gross_pay: number
  net_pay: number
  paid_currency_code?: string | null
  paid_amount?: number | null
  staff?: PaymentStaffLike | null
}

export interface EntryPayment {
  code: string
  rate: number
  amount: number
  grossAmount: number
}

export type CurrencyTotals = Record<string, { gross: number; net: number }>

// Moneda y monto en que REALMENTE se paga al colaborador. El neto se calcula en
// pesos; si el colaborador se paga en otra moneda (Sueldos y salarios) se divide
// entre su tipo de cambio. Un monto capturado como pagado tiene prioridad.
export function getEntryPayment(
  entry: PaymentEntryLike,
  codeById: (id: string | null | undefined) => string,
): EntryPayment {
  const gross = Number(entry.gross_pay) || 0
  const net = Number(entry.net_pay) || 0

  if (entry.paid_amount != null && entry.paid_currency_code) {
    const paid = Number(entry.paid_amount) || 0
    const rate = paid > 0 ? net / paid : 0
    return {
      code: entry.paid_currency_code,
      rate,
      amount: paid,
      grossAmount: rate > 0 ? gross / rate : gross,
    }
  }

  const s = entry.staff || {}
  const code = codeById(s.payroll_payment_currency_id || s.currency_id || null)
  const rate = Number(s.payroll_exchange_rate) || 0
  const convert = code !== "MXN" && rate > 0
  return {
    code,
    rate: convert ? rate : 0,
    amount: convert ? net / rate : net,
    grossAmount: convert ? gross / rate : gross,
  }
}

export function sumByCurrency(
  entries: PaymentEntryLike[],
  codeById: (id: string | null | undefined) => string,
): CurrencyTotals {
  const totals: CurrencyTotals = {}
  for (const e of entries) {
    const p = getEntryPayment(e, codeById)
    if (!totals[p.code]) totals[p.code] = { gross: 0, net: 0 }
    totals[p.code].gross += p.grossAmount
    totals[p.code].net += p.amount
  }
  return totals
}

export interface ActivityStaffLike {
  is_active?: boolean | null
  hire_date?: string | null
  status_change_date?: string | null
}

// Activo durante el periodo: ingresó antes del cierre y sigue activo, o su baja
// fue en/después del inicio del periodo. Las bajas anteriores no aparecen.
export function isActiveDuringPeriod(staff: ActivityStaffLike, startDate: string, endDate: string): boolean {
  if (staff.hire_date && String(staff.hire_date).slice(0, 10) > endDate) return false
  if (staff.is_active) return true
  const changed = staff.status_change_date ? String(staff.status_change_date).slice(0, 10) : null
  return !!changed && changed >= startDate
}
