import { MEXICO_CITY_TZ } from "@/lib/date-mx"

/**
 * Regla única para decidir qué comisiones de citas se pagan en nómina.
 * La usan el detalle de nómina, su exportación y la pantalla Comisiones Citas
 * para que los totales siempre coincidan.
 *
 * - Solo cuentan las comisiones "approved" (nunca pendientes ni canceladas).
 * - Una comisión ya pagada (status "paid" o con paid_at) nunca vuelve a contar.
 * - Entran al periodo según su fecha de aprobación en America/Mexico_City.
 */
export interface PayableCommissionLike {
  status: string
  approved_at: string | null
  paid_at?: string | null
  commission_amount: number | string | null
}

export interface DateRange {
  start: string
  end: string
}

const mexicoCityDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: MEXICO_CITY_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

export function toMexicoCityDay(timestamp: string | null | undefined): string | null {
  if (!timestamp) return null
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return null
  return mexicoCityDayFormatter.format(date)
}

export function monthRangeOf(dateOnly: string): DateRange {
  const year = Number(dateOnly.slice(0, 4))
  const month = Number(dateOnly.slice(5, 7))
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const prefix = dateOnly.slice(0, 7)
  return { start: `${prefix}-01`, end: `${prefix}-${String(lastDay).padStart(2, "0")}` }
}

export function isPayableCommission(c: PayableCommissionLike): boolean {
  return c.status === "approved" && !c.paid_at && !!c.approved_at
}

export function commissionApprovalDay(c: PayableCommissionLike): string | null {
  return toMexicoCityDay(c.approved_at)
}

export function isPayableInRange(c: PayableCommissionLike, range: DateRange): boolean {
  if (!isPayableCommission(c)) return false
  const day = commissionApprovalDay(c)
  return !!day && day >= range.start && day <= range.end
}

export function payableCommissionsInRange<T extends PayableCommissionLike>(list: T[], range: DateRange): T[] {
  return list.filter((c) => isPayableInRange(c, range))
}

/** Aprobadas sin pagar cuya fecha de aprobación es anterior al rango (rezagadas). */
export function payableCommissionsBefore<T extends PayableCommissionLike>(list: T[], day: string): T[] {
  return list.filter((c) => {
    if (!isPayableCommission(c)) return false
    const approvedDay = commissionApprovalDay(c)
    return !!approvedDay && approvedDay < day
  })
}

export function sumCommissionAmounts(list: PayableCommissionLike[]): number {
  return list.reduce((sum, c) => sum + Number(c.commission_amount || 0), 0)
}

/**
 * Rango de aprobación que corresponde a un colaborador dentro de un periodo.
 * Los colaboradores mensuales cobran todo el mes una sola vez (en el periodo
 * mensual o en la segunda quincena); en la primera quincena no cobran.
 * Los demás cobran lo aprobado dentro del propio periodo.
 */
export function commissionRangeForPeriod(input: {
  periodType: string
  startDate: string
  endDate: string
  paymentFrequency?: string | null
}): DateRange | null {
  const isMonthlyStaff = (input.paymentFrequency || "biweekly") === "monthly"
  if (!isMonthlyStaff) return { start: input.startDate, end: input.endDate }
  const isMonthlyPayingPeriod =
    input.periodType === "mensual" ||
    (input.periodType === "quincenal" ? Number(input.startDate.slice(8, 10)) > 15 : true)
  return isMonthlyPayingPeriod ? monthRangeOf(input.startDate) : null
}
