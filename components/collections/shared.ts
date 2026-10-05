import { mutate } from "swr"
import { parseLocalDate } from "@/lib/utils"
import type { ActivityType, AgingBucket, SuggestedAction } from "@/lib/collections/rules"

export type { CollectionRow, CollectionsSummary, CurrencyKpis } from "@/lib/collections/data"

export interface ClientDetail {
  today: string
  client: {
    id: string
    agencyId: string
    name: string
    legalName: string | null
    contactName: string | null
    contactEmail: string | null
    contactPhone: string | null
  }
  accounts: { id: string; name: string; code: string | null }[]
  invoices: {
    id: string
    invoiceNumber: string | null
    issueDate: string | null
    dueDate: string | null
    total: number
    balance: number
    currency: string
    accountName: string | null
    daysOverdue: number
  }[]
  overdueByCurrency: Record<string, number>
  maxDaysOverdue: number
  activities: {
    id: string
    type: ActivityType
    note: string | null
    metadata: Record<string, unknown> | null
    createdAt: string
    userName: string | null
  }[]
  promises: {
    id: string
    promisedDate: string
    amount: number
    status: "pending" | "fulfilled" | "broken" | "cancelled"
    note: string | null
    createdAt: string
    currency: string
    isBroken: boolean
  }[]
  servicePaused: boolean
  pauseReason: string | null
  pausedAt: string | null
}

// Datos mínimos del cliente que necesitan los diálogos de acción.
export interface ActionTarget {
  clientId: string
  clientName: string
  contactEmail: string | null
  contactName: string | null
  contactPhone: string | null
  pendingByCurrency: Record<string, number>
  servicePaused: boolean
}

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || "Error al cargar la información")
  return data as T
}

export async function postJson(url: string, body: unknown, method = "POST") {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || "No se pudo completar la acción")
  return data
}

export function refreshCollections() {
  return mutate((key) => typeof key === "string" && key.startsWith("/api/collections"))
}

export function formatMoney(amount: number, currency: string, compact = false): string {
  const formatted = amount.toLocaleString("es-MX", {
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: compact ? 0 : 2,
  })
  return `$${formatted} ${currency}`
}

export function formatDate(iso: string | null, withYear = true): string {
  if (!iso) return "—"
  const date = iso.length > 10 ? new Date(iso) : parseLocalDate(iso)
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export const BUCKET_STYLES: Record<AgingBucket, { bar: string; badge: string; dot: string }> = {
  current: {
    bar: "bg-emerald-500",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  d1_30: {
    bar: "bg-amber-400",
    badge: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
    dot: "bg-amber-400",
  },
  d31_60: {
    bar: "bg-orange-500",
    badge: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  d60_plus: {
    bar: "bg-red-700",
    badge: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
    dot: "bg-red-700",
  },
}

export const ACTION_STYLES: Record<SuggestedAction, string> = {
  none: "border-border bg-muted text-muted-foreground",
  soft_reminder: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  formal_notice: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  collection_call: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300",
  recommend_pause: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  follow_promise: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300",
  service_paused: "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
}
