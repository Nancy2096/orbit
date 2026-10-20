// La nómina se paga los días 15 y 30 de cada mes (o el último día si el mes es más corto).

const lastDayOfMonth = (year: number, month: number) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

const toISO = (d: Date) => d.toISOString().split("T")[0]

const payday = (year: number, month: number, half: 1 | 2) =>
  new Date(Date.UTC(year, month, half === 1 ? 15 : Math.min(30, lastDayOfMonth(year, month))))

/** Fecha de pago de nómina (15 o 30) correspondiente a una fecha cualquiera. */
export function snapToPayday(dateISO: string): string {
  const d = new Date(`${dateISO.slice(0, 10)}T00:00:00Z`)
  const half = d.getUTCDate() <= 15 ? 1 : 2
  return toISO(payday(d.getUTCFullYear(), d.getUTCMonth(), half))
}

/** Siguiente fecha de pago de nómina posterior a la indicada. */
export function nextPayday(dateISO: string): string {
  const snapped = new Date(`${snapToPayday(dateISO)}T00:00:00Z`)
  const y = snapped.getUTCFullYear()
  const m = snapped.getUTCMonth()
  if (snapped.getUTCDate() === 15) return toISO(payday(y, m, 2))
  return toISO(payday(m === 11 ? y + 1 : y, (m + 1) % 12, 1))
}

/** Fechas de pago (15/30) desde el inicio del préstamo que ya ocurrieron antes de `beforeISO`. */
export function pastPaydays(startISO: string, frequency: string | null, beforeISO: string, max: number): string[] {
  const dates: string[] = []
  let date = snapToPayday(startISO)
  const step = frequency === "monthly" ? 2 : 1
  while (date < beforeISO.slice(0, 10) && dates.length < max) {
    dates.push(date)
    for (let i = 0; i < step; i++) date = nextPayday(date)
  }
  return dates
}

/** Avanza `periods` pagos según la frecuencia, siempre cayendo en 15 o 30. */
export function addPaydays(startISO: string, frequency: string | null, periods: number): string {
  let date = snapToPayday(startISO)
  const step = frequency === "monthly" ? 2 : 1
  for (let i = 0; i < periods * step; i++) date = nextPayday(date)
  return date
}
