"use client"

import useSWR from "swr"
import {
  History,
  FilePlus2,
  Pencil,
  Settings2,
  Calculator,
  Unlock,
  UserPen,
  BadgeCheck,
  Banknote,
  DollarSign,
  Paperclip,
  FileX2,
  StickyNote,
  Trash2,
  Download,
  type LucideIcon,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { payrollHistoryKey, type PayrollHistoryAction } from "@/lib/payroll-history"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

interface HistoryUser {
  first_name: string | null
  last_name: string | null
  email: string | null
}

interface HistoryRow {
  id: string
  action: PayrollHistoryAction
  description: string
  details: { changes?: { field: string; from: string; to: string }[] } | null
  created_at: string
  user: HistoryUser | null
}

const ACTION_META: Record<PayrollHistoryAction, { label: string; icon: LucideIcon; tone: string }> = {
  period_created: { label: "Creación", icon: FilePlus2, tone: "bg-primary/10 text-primary" },
  period_edited: { label: "Edición del periodo", icon: Pencil, tone: "bg-muted text-foreground" },
  config_updated: { label: "Configuración", icon: Settings2, tone: "bg-muted text-foreground" },
  calculated: { label: "Cálculo", icon: Calculator, tone: "bg-primary/10 text-primary" },
  modify_enabled: { label: "Modificación", icon: Unlock, tone: "bg-amber-100 text-amber-800" },
  entry_edited: { label: "Edición de renglón", icon: UserPen, tone: "bg-amber-100 text-amber-800" },
  approved: { label: "Aprobación", icon: BadgeCheck, tone: "bg-emerald-100 text-emerald-800" },
  paid: { label: "Pago", icon: Banknote, tone: "bg-emerald-100 text-emerald-800" },
  usd_corrected: { label: "Corrección USD", icon: DollarSign, tone: "bg-amber-100 text-amber-800" },
  receipt_attached: { label: "Comprobante", icon: Paperclip, tone: "bg-muted text-foreground" },
  receipt_removed: { label: "Comprobante eliminado", icon: FileX2, tone: "bg-destructive/10 text-destructive" },
  note_added: { label: "Nota", icon: StickyNote, tone: "bg-muted text-foreground" },
  note_edited: { label: "Nota editada", icon: Pencil, tone: "bg-muted text-foreground" },
  note_deleted: { label: "Nota eliminada", icon: Trash2, tone: "bg-destructive/10 text-destructive" },
  exported: { label: "Descarga", icon: Download, tone: "bg-muted text-foreground" },
}

const FALLBACK_META = { label: "Movimiento", icon: History, tone: "bg-muted text-foreground" }

function userLabel(u: HistoryUser | null): string {
  if (!u) return "Usuario desconocido"
  const name = `${u.first_name || ""} ${u.last_name || ""}`.trim()
  return name || u.email || "Usuario desconocido"
}

const dateFormatter = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" })
const timeFormatter = new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

export function PayrollHistory({ periodId }: { periodId: string }) {
  const { data, error, isLoading } = useSWR(payrollHistoryKey(periodId), async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("payroll_history")
      .select("id, action, description, details, created_at, user:users!user_id(first_name, last_name, email)")
      .eq("payroll_period_id", periodId)
      .order("created_at", { ascending: false })
    if (error) throw error
    return (data as unknown as HistoryRow[]) || []
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Histórico
        </CardTitle>
        <CardDescription>
          Registro de cada movimiento en esta nómina: qué se hizo, quién lo hizo y cuándo (fecha y hora).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner className="h-6 w-6" />
          </div>
        ) : error ? (
          <p className="py-4 text-center text-sm text-destructive">No se pudo cargar el histórico.</p>
        ) : !data || data.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Aún no hay movimientos registrados para este periodo.
          </p>
        ) : (
          <ol className="relative space-y-4 border-l pl-6">
            {data.map((row) => {
              const meta = ACTION_META[row.action] ?? FALLBACK_META
              const Icon = meta.icon
              const date = new Date(row.created_at)
              const changes = row.details?.changes ?? []
              return (
                <li key={row.id} className="relative">
                  <span
                    className={`absolute -left-[37px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background ${meta.tone}`}
                    aria-hidden="true"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-medium text-pretty">{row.description}</p>
                      {changes.length > 0 && (
                        <ul className="space-y-0.5 text-xs text-muted-foreground">
                          {changes.map((c, i) => (
                            <li key={i}>
                              <span className="font-medium text-foreground">{c.field}:</span> {c.from || "—"}
                              {" → "}
                              {c.to || "—"}
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{userLabel(row.user)}</span>
                        {" · "}
                        {meta.label}
                      </p>
                    </div>
                    <time
                      dateTime={row.created_at}
                      className="shrink-0 text-xs tabular-nums text-muted-foreground sm:text-right"
                    >
                      <span className="block">{dateFormatter.format(date)}</span>
                      <span className="block">{timeFormatter.format(date)}</span>
                    </time>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
