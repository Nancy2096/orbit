// Helpers compartidos para las fechas y alertas de las plantillas de evaluación.
// Usados tanto en la página de Evaluaciones (cliente) como en el Dashboard (servidor).

export type TemplateSchedule = {
  template_id: string
  template_name: string | null
  application_date: string | null
  next_evaluation_date: string | null
  updated_at?: string
}

export type AlertLevel = "overdue" | "due-soon" | "upcoming" | "none"

export type ScheduleAlert = {
  templateId: string
  templateName: string
  // Fecha relevante (la próxima a vencer entre aplicación y siguiente evaluación).
  date: string
  // Qué representa la fecha.
  kind: "application" | "next"
  level: AlertLevel
  days: number // días restantes (negativo si ya pasó)
}

// Umbral en días para considerar una fecha "próxima".
export const DUE_SOON_DAYS = 7

// Calcula los días entre hoy y una fecha (ISO yyyy-mm-dd). Negativo = en el pasado.
export function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${dateStr}T00:00:00`)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function levelForDays(days: number): AlertLevel {
  if (days < 0) return "overdue"
  if (days <= DUE_SOON_DAYS) return "due-soon"
  return "upcoming"
}

// Formatea una fecha ISO a formato legible en español.
export function formatScheduleDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
}

// Texto relativo (ej. "vence en 3 días", "venció hace 2 días", "hoy").
export function relativeLabel(days: number): string {
  if (days === 0) return "es hoy"
  if (days < 0) return `venció hace ${Math.abs(days)} ${Math.abs(days) === 1 ? "día" : "días"}`
  return `en ${days} ${days === 1 ? "día" : "días"}`
}

// Construye la lista de alertas a partir de los horarios, ordenadas por urgencia.
export function buildAlerts(schedules: TemplateSchedule[]): ScheduleAlert[] {
  const alerts: ScheduleAlert[] = []

  for (const s of schedules) {
    const name = s.template_name || "Plantilla sin nombre"

    const candidates: Array<{ date: string; kind: "application" | "next" }> = []
    if (s.application_date) candidates.push({ date: s.application_date, kind: "application" })
    if (s.next_evaluation_date) candidates.push({ date: s.next_evaluation_date, kind: "next" })

    for (const c of candidates) {
      const days = daysUntil(c.date)
      const level = levelForDays(days)
      // Solo alertamos sobre fechas vencidas o próximas.
      if (level === "overdue" || level === "due-soon") {
        alerts.push({
          templateId: s.template_id,
          templateName: name,
          date: c.date,
          kind: c.kind,
          level,
          days,
        })
      }
    }
  }

  // Ordena: vencidas primero, luego por días ascendentes.
  return alerts.sort((a, b) => a.days - b.days)
}
