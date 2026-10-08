// Reglas compartidas (cliente y servidor) de Gestión de Cobranza.

export const OPEN_INVOICE_STATUSES = ["pending", "partial", "overdue", "sent"] as const
export const DUE_SOON_DAYS = 7
export const COLLECTION_TARGET_PERCENT = 90

export type AgingBucket = "current" | "d1_30" | "d31_60" | "d60_plus"

export const AGING_BUCKETS: { key: AgingBucket; label: string; badge: string }[] = [
  { key: "current", label: "Al día", badge: "Al día" },
  { key: "d1_30", label: "Vencido 1-30 días", badge: "1-30 días" },
  { key: "d31_60", label: "Vencido 31-60 días", badge: "31-60 días" },
  { key: "d60_plus", label: "Vencido +60 días", badge: "+60 días crítico" },
]

export function agingBucketFor(daysOverdue: number): AgingBucket {
  if (daysOverdue <= 0) return "current"
  if (daysOverdue <= 30) return "d1_30"
  if (daysOverdue <= 60) return "d31_60"
  return "d60_plus"
}

export type SuggestedAction =
  | "none"
  | "soft_reminder"
  | "formal_notice"
  | "collection_call"
  | "recommend_pause"
  | "follow_promise"
  | "service_paused"

export const SUGGESTED_ACTION_LABELS: Record<SuggestedAction, string> = {
  none: "Sin acción",
  soft_reminder: "Enviar Recordatorio Suave",
  formal_notice: "Notificación Formal",
  collection_call: "Llamada de Cobranza",
  recommend_pause: "Recomendar Pausa de Servicio",
  follow_promise: "Dar Seguimiento a Promesa",
  service_paused: "Servicio en Pausa",
}

export function suggestActionFor(params: {
  maxDaysOverdue: number
  hasDueSoon: boolean
  servicePaused: boolean
  promise: { promisedDate: string; isBroken: boolean } | null
}): SuggestedAction {
  const { maxDaysOverdue, hasDueSoon, servicePaused, promise } = params
  if (servicePaused) return "service_paused"
  if (promise?.isBroken) return maxDaysOverdue > 60 ? "recommend_pause" : "collection_call"
  if (promise) return "follow_promise"
  if (maxDaysOverdue > 60) return "recommend_pause"
  if (maxDaysOverdue > 30) return "collection_call"
  if (maxDaysOverdue > 15) return "formal_notice"
  if (maxDaysOverdue > 0 || hasDueSoon) return "soft_reminder"
  return "none"
}

export type ActivityType = "email" | "whatsapp" | "call" | "note" | "promise" | "pause" | "resume"

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  email: "Correo enviado",
  whatsapp: "WhatsApp enviado",
  call: "Llamada realizada",
  note: "Nota",
  promise: "Compromiso de pago",
  pause: "Pausa de servicio",
  resume: "Servicio reactivado",
}

// WhatsApp se registra en su propia ruta (/whatsapp) para guardar teléfono y resultado.
export const LOGGABLE_ACTIVITY_TYPES: ActivityType[] = ["call", "note"]

export type ActivityResult = "sent" | "skipped" | "error" | "opened"

export const ACTIVITY_RESULT_LABELS: Record<ActivityResult, string> = {
  sent: "Enviado",
  skipped: "Omitido",
  error: "Error",
  opened: "Abierto",
}

export function activityLabel(type: ActivityType, result: ActivityResult | null | undefined): string {
  if (type === "email" && result === "error") return "Correo con error"
  if (type === "email" && result === "skipped") return "Correo omitido"
  if (type === "whatsapp" && result === "opened") return "WhatsApp abierto"
  return ACTIVITY_LABELS[type]
}

export const MAX_NOTE_LENGTH = 1000

export const BUSINESS_TIME_ZONE = "America/Mexico_City"

// Fecha de hoy (YYYY-MM-DD) en America/Mexico_City, sin importar la zona del servidor.
export function todayInBusinessTimeZone(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}

// Fecha local YYYY-MM-DD (evita desfases de zona horaria con toISOString).
export function toLocalIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.UTC(+fromIso.slice(0, 4), +fromIso.slice(5, 7) - 1, +fromIso.slice(8, 10))
  const to = Date.UTC(+toIso.slice(0, 4), +toIso.slice(5, 7) - 1, +toIso.slice(8, 10))
  return Math.round((to - from) / 86_400_000)
}

export function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))
}

// Normaliza un teléfono para wa.me (solo dígitos; agrega 52 a números MX de 10 dígitos).
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  const digits = (phone || "").replace(/\D/g, "")
  if (digits.length === 10) return `52${digits}`
  if (digits.length >= 11 && digits.length <= 15) return digits
  return null
}
