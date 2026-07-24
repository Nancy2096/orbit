// Helpers para la configuración de disponibilidad y límite de uso de los tipos de bono.
// Estas reglas se definen en el catálogo de la agencia y se aplican al solicitar un bono.

export interface BonusAvailabilityConfig {
  available_months: number[] // Meses (1-12) en que el bono está habilitado. Vacío = todo el año.
  limit_period: string // 'none' | 'month' | 'quarter' | 'semester' | 'year'
  limit_count: number // Cuántas veces puede usarlo un colaborador dentro del periodo.
}

export const MONTH_OPTIONS: { value: number; label: string; short: string }[] = [
  { value: 1, label: "Enero", short: "Ene" },
  { value: 2, label: "Febrero", short: "Feb" },
  { value: 3, label: "Marzo", short: "Mar" },
  { value: 4, label: "Abril", short: "Abr" },
  { value: 5, label: "Mayo", short: "May" },
  { value: 6, label: "Junio", short: "Jun" },
  { value: 7, label: "Julio", short: "Jul" },
  { value: 8, label: "Agosto", short: "Ago" },
  { value: 9, label: "Septiembre", short: "Sep" },
  { value: 10, label: "Octubre", short: "Oct" },
  { value: 11, label: "Noviembre", short: "Nov" },
  { value: 12, label: "Diciembre", short: "Dic" },
]

export const LIMIT_PERIOD_OPTIONS: { value: string; label: string; noun: string }[] = [
  { value: "none", label: "Sin límite", noun: "" },
  { value: "month", label: "Por mes", noun: "mes" },
  { value: "quarter", label: "Por trimestre", noun: "trimestre" },
  { value: "semester", label: "Por semestre", noun: "semestre" },
  { value: "year", label: "Por año", noun: "año" },
]

export function describeAvailableMonths(months: number[] | null | undefined): string {
  if (!months || months.length === 0) return "Disponible todo el año"
  if (months.length === 12) return "Disponible todo el año"
  const sorted = [...months].sort((a, b) => a - b)
  const labels = sorted.map((m) => MONTH_OPTIONS.find((o) => o.value === m)?.short ?? String(m))
  return `Disponible en: ${labels.join(", ")}`
}

export function describeLimit(period: string | null | undefined, count: number | null | undefined): string {
  if (!period || period === "none") return "Uso ilimitado"
  const noun = LIMIT_PERIOD_OPTIONS.find((o) => o.value === period)?.noun ?? period
  const n = count ?? 1
  return `${n} ${n === 1 ? "vez" : "veces"} por ${noun} por colaborador`
}

// ¿El bono está habilitado en el mes de la fecha dada?
export function isMonthAvailable(months: number[] | null | undefined, date: Date = new Date()): boolean {
  if (!months || months.length === 0) return true
  return months.includes(date.getMonth() + 1)
}

// Rango [start, end) del periodo actual para contar usos previos del colaborador.
export function getPeriodRange(
  period: string | null | undefined,
  date: Date = new Date(),
): { start: Date; end: Date } | null {
  if (!period || period === "none") return null
  const year = date.getFullYear()
  const month = date.getMonth() // 0-11

  if (period === "year") {
    return { start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1) }
  }
  if (period === "month") {
    return { start: new Date(year, month, 1), end: new Date(year, month + 1, 1) }
  }
  if (period === "quarter") {
    const qStart = Math.floor(month / 3) * 3
    return { start: new Date(year, qStart, 1), end: new Date(year, qStart + 3, 1) }
  }
  if (period === "semester") {
    const sStart = month < 6 ? 0 : 6
    return { start: new Date(year, sStart, 1), end: new Date(year, sStart + 6, 1) }
  }
  return null
}

export function getPeriodLabel(period: string | null | undefined): string {
  return LIMIT_PERIOD_OPTIONS.find((o) => o.value === period)?.noun ?? ""
}
