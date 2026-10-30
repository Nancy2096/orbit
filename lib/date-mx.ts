export const MEXICO_CITY_TZ = "America/Mexico_City"

/** Fecha de hoy (YYYY-MM-DD) en America/Mexico_City, sin importar la zona del navegador. */
export function todayInMexicoCity(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MEXICO_CITY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

export function isValidDateOnly(value: string | null | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

/** true si la fecha (YYYY-MM-DD) es posterior a hoy en Ciudad de México. */
export function isFutureInMexicoCity(value: string): boolean {
  return value > todayInMexicoCity()
}

/**
 * Formatea una columna `date` (YYYY-MM-DD) sin convertir de zona horaria.
 * `new Date("2026-10-29")` se interpreta como UTC y en México se mostraría el 28.
 */
export function formatDateOnly(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" },
): string {
  if (!value) return "-"
  const [y, m, d] = value.slice(0, 10).split("-").map(Number)
  if (!y || !m || !d) return "-"
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-MX", { ...options, timeZone: "UTC" })
}
