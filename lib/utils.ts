import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Parsea una fecha en horario local. Para cadenas sin hora ("YYYY-MM-DD"),
// evita el desfase de un día que ocurre cuando el navegador las interpreta
// como medianoche UTC (mostrando el día anterior en zonas horarias negativas).
export function parseLocalDate(dateString: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString.trim())
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  }
  return new Date(dateString)
}

// Devuelve una fecha "YYYY-MM-DD" en horario local (sin conversión a UTC).
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// Suma meses a una fecha "YYYY-MM-DD" y devuelve el resultado en el mismo formato.
export function addMonthsToDateString(dateString: string, months: number): string {
  const d = parseLocalDate(dateString)
  d.setMonth(d.getMonth() + months)
  return toLocalDateString(d)
}
