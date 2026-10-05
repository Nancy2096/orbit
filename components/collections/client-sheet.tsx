"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  CalendarCheck,
  CheckCircle2,
  Mail,
  MessageCircle,
  NotebookPen,
  PauseCircle,
  Phone,
  PlayCircle,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { ACTIVITY_LABELS, AGING_BUCKETS, agingBucketFor, type ActivityType } from "@/lib/collections/rules"
import { PromiseForm } from "@/components/collections/promise-dialog"
import {
  BUCKET_STYLES,
  fetcher,
  formatDate,
  formatDateTime,
  formatMoney,
  postJson,
  refreshCollections,
  type ActionTarget,
  type ClientDetail,
} from "@/components/collections/shared"
import type { ReminderChannel } from "@/components/collections/reminder-dialog"

const RISK_LABELS = {
  current: "Riesgo bajo",
  d1_30: "Riesgo moderado",
  d31_60: "Riesgo alto",
  d60_plus: "Riesgo crítico",
} as const

const ACTIVITY_ICONS: Record<ActivityType, typeof Mail> = {
  email: Mail,
  whatsapp: MessageCircle,
  call: Phone,
  note: NotebookPen,
  promise: CalendarCheck,
  pause: PauseCircle,
  resume: PlayCircle,
}

const PROMISE_ACTION_LABELS: Record<string, string> = {
  created: "Compromiso registrado",
  fulfilled: "Compromiso cumplido",
  broken: "Compromiso incumplido",
  cancelled: "Compromiso cancelado",
}

const BUCKET_BADGE = Object.fromEntries(AGING_BUCKETS.map((b) => [b.key, b.badge]))

interface ClientSheetProps {
  clientId: string | null
  onOpenChange: (open: boolean) => void
  onReminder: (target: ActionTarget, channel: ReminderChannel) => void
  onPause: (target: ActionTarget) => void
}

export function ClientSheet({ clientId, onOpenChange, onReminder, onPause }: ClientSheetProps) {
  const { data, error, isLoading } = useSWR<ClientDetail>(
    clientId ? `/api/collections/clients/${clientId}` : null,
    fetcher,
  )

  const target: ActionTarget | null = data
    ? {
        clientId: data.client.id,
        clientName: data.client.name,
        contactEmail: data.client.contactEmail,
        contactName: data.client.contactName,
        contactPhone: data.client.contactPhone,
        pendingByCurrency: data.invoices.reduce<Record<string, number>>((acc, inv) => {
          acc[inv.currency] = (acc[inv.currency] || 0) + inv.balance
          return acc
        }, {}),
        servicePaused: data.servicePaused,
      }
    : null

  const bucket = agingBucketFor(data?.maxDaysOverdue ?? 0)

  return (
    <Sheet open={!!clientId} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="gap-3 border-b p-6">
          {isLoading || !data ? (
            <>
              <SheetTitle className="sr-only">Detalle de cobranza</SheetTitle>
              <SheetDescription className="sr-only">Cargando información del cliente</SheetDescription>
              {error ? (
                <p className="text-sm text-destructive">{error.message}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 pr-8">
                <SheetTitle className="text-lg">{data.client.name}</SheetTitle>
                <Badge variant="outline" className={BUCKET_STYLES[bucket].badge}>
                  {RISK_LABELS[bucket]}
                </Badge>
                {data.servicePaused && <Badge variant="secondary">Servicio en pausa</Badge>}
              </div>
              <SheetDescription className="flex flex-col gap-1">
                <span>
                  {data.accounts.length > 0
                    ? data.accounts.map((a) => (a.code ? `${a.name} (${a.code})` : a.name)).join(" · ")
                    : "Sin cuentas registradas"}
                </span>
                {data.client.contactEmail && <span>{data.client.contactEmail}</span>}
              </SheetDescription>
              <div className="flex flex-wrap gap-6 pt-1">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Total vencido</span>
                  {Object.keys(data.overdueByCurrency).length === 0 ? (
                    <span className="text-xl font-semibold">$0</span>
                  ) : (
                    Object.entries(data.overdueByCurrency).map(([code, amount]) => (
                      <span key={code} className="text-xl font-semibold tabular-nums text-red-600 dark:text-red-400">
                        {formatMoney(amount, code)}
                      </span>
                    ))
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Saldo pendiente</span>
                  {Object.entries(target?.pendingByCurrency ?? {}).map(([code, amount]) => (
                    <span key={code} className="text-xl font-semibold tabular-nums">
                      {formatMoney(amount, code)}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </SheetHeader>

        {data && target && (
          <div className="flex flex-col gap-6 p-6">
            <section aria-labelledby="quick-actions" className="flex flex-col gap-3">
              <h3 id="quick-actions" className="text-sm font-semibold">
                Acciones rápidas
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Button variant="outline" onClick={() => onReminder(target, "whatsapp")}>
                  <MessageCircle data-icon="inline-start" />
                  Recordatorio WhatsApp
                </Button>
                <Button variant="outline" onClick={() => onReminder(target, "email")}>
                  <Mail data-icon="inline-start" />
                  Correo de cobranza
                </Button>
                <Button
                  variant="outline"
                  className={target.servicePaused ? undefined : "text-destructive hover:text-destructive"}
                  onClick={() => onPause(target)}
                >
                  {target.servicePaused ? <PlayCircle data-icon="inline-start" /> : <PauseCircle data-icon="inline-start" />}
                  {target.servicePaused ? "Reactivar servicio" : "Solicitar pausa"}
                </Button>
              </div>
              {data.servicePaused && data.pauseReason && (
                <p className="text-xs text-muted-foreground">
                  Pausa desde {formatDate(data.pausedAt)}: {data.pauseReason}
                </p>
              )}
            </section>

            <Separator />

            <section aria-labelledby="pending-invoices" className="flex flex-col gap-3">
              <h3 id="pending-invoices" className="text-sm font-semibold">
                Facturas pendientes ({data.invoices.length})
              </h3>
              <ul className="flex flex-col divide-y rounded-lg border">
                {data.invoices.map((inv) => {
                  const invBucket = agingBucketFor(inv.daysOverdue)
                  return (
                    <li key={inv.id} className="flex items-start justify-between gap-3 p-3 text-sm">
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="font-medium">{inv.invoiceNumber || "Sin número"}</span>
                        <span className="text-xs text-muted-foreground">
                          Emitida {formatDate(inv.issueDate)} · Vence {formatDate(inv.dueDate)}
                        </span>
                        {inv.accountName && <span className="truncate text-xs text-muted-foreground">{inv.accountName}</span>}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="font-medium tabular-nums">{formatMoney(inv.balance, inv.currency)}</span>
                        {inv.balance < inv.total && (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            de {formatMoney(inv.total, inv.currency)}
                          </span>
                        )}
                        <Badge variant="outline" className={BUCKET_STYLES[invBucket].badge}>
                          {inv.daysOverdue > 0 ? BUCKET_BADGE[invBucket] : "Por vencer"}
                        </Badge>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>

            <Separator />

            <section aria-labelledby="new-promise" className="flex flex-col gap-3">
              <h3 id="new-promise" className="text-sm font-semibold">
                Nuevo compromiso de pago
              </h3>
              <PromiseForm key={data.client.id} target={target} embedded />
            </section>

            <PromisesList promises={data.promises} />

            <Separator />

            <section aria-labelledby="timeline" className="flex flex-col gap-3">
              <h3 id="timeline" className="text-sm font-semibold">
                Historial de gestiones
              </h3>
              {data.activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay gestiones registradas.</p>
              ) : (
                <ol className="relative flex flex-col gap-5 border-l pl-6">
                  {data.activities.map((activity) => {
                    const Icon = ACTIVITY_ICONS[activity.type] ?? NotebookPen
                    const meta = activity.metadata ?? {}
                    const promiseAction = typeof meta.action === "string" ? PROMISE_ACTION_LABELS[meta.action] : null
                    const title = activity.type === "promise" && promiseAction ? promiseAction : ACTIVITY_LABELS[activity.type]
                    const recipients = Array.isArray(meta.to) ? (meta.to as string[]).join(", ") : null
                    return (
                      <li key={activity.id} className="relative flex flex-col gap-1">
                        <span className="absolute -left-[37px] flex size-6 items-center justify-center rounded-full border bg-background">
                          <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                        </span>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-sm font-medium">{title}</span>
                          <time className="text-xs text-muted-foreground" dateTime={activity.createdAt}>
                            {formatDateTime(activity.createdAt)}
                          </time>
                        </div>
                        {activity.type === "promise" && typeof meta.amount === "number" && (
                          <span className="text-xs text-muted-foreground">
                            {formatMoney(meta.amount, String(meta.currency || "MXN"))} para el{" "}
                            {formatDate(String(meta.promised_date || ""))}
                          </span>
                        )}
                        {recipients && <span className="text-xs text-muted-foreground">Para: {recipients}</span>}
                        {activity.note && <p className="whitespace-pre-line text-sm text-muted-foreground">{activity.note}</p>}
                        {activity.userName && <span className="text-xs text-muted-foreground">Por {activity.userName}</span>}
                      </li>
                    )
                  })}
                </ol>
              )}
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function PromisesList({ promises }: { promises: ClientDetail["promises"] }) {
  const [updating, setUpdating] = useState<string | null>(null)
  const pending = promises.filter((p) => p.status === "pending")
  if (pending.length === 0) return null

  async function update(id: string, status: "fulfilled" | "broken" | "cancelled") {
    setUpdating(id)
    try {
      await postJson(`/api/collections/promises/${id}`, { status }, "PATCH")
      toast.success("Compromiso actualizado")
      await refreshCollections()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el compromiso")
    } finally {
      setUpdating(null)
    }
  }

  return (
    <section aria-labelledby="active-promises" className="flex flex-col gap-3">
      <h3 id="active-promises" className="text-sm font-semibold">
        Compromisos activos
      </h3>
      <ul className="flex flex-col gap-2">
        {pending.map((p) => (
          <li
            key={p.id}
            className={cn(
              "flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between",
              p.isBroken && "border-red-200 dark:border-red-900",
            )}
          >
            <div className="flex flex-col gap-0.5 text-sm">
              <span className="font-medium tabular-nums">
                {formatMoney(p.amount, p.currency)} · {formatDate(p.promisedDate)}
              </span>
              {p.isBroken && <span className="text-xs text-red-600 dark:text-red-400">Fecha vencida sin marcar</span>}
              {p.note && <span className="text-xs text-muted-foreground">{p.note}</span>}
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" disabled={updating === p.id} onClick={() => update(p.id, "fulfilled")}>
                <CheckCircle2 data-icon="inline-start" />
                Cumplido
              </Button>
              <Button size="sm" variant="ghost" disabled={updating === p.id} onClick={() => update(p.id, "broken")}>
                <XCircle data-icon="inline-start" />
                Incumplido
              </Button>
              <Button size="sm" variant="ghost" disabled={updating === p.id} onClick={() => update(p.id, "cancelled")}>
                Cancelar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
