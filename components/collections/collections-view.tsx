"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { CalendarPlus, Download, Search, SlidersHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AGING_BUCKETS, SUGGESTED_ACTION_LABELS, activityLabel, type AgingBucket } from "@/lib/collections/rules"
import { ClientSheet } from "@/components/collections/client-sheet"
import { CollectionsTable, type RowAction } from "@/components/collections/collections-table"
import { CallNoteDialog, PauseDialog } from "@/components/collections/note-dialogs"
import { PromiseDialog } from "@/components/collections/promise-dialog"
import { ReminderDialog, type ReminderChannel } from "@/components/collections/reminder-dialog"
import { AgingStrip, KpiCards } from "@/components/collections/summary-cards"
import {
  fetcher,
  type ActionTarget,
  type CollectionRow,
  type CollectionsSummary,
} from "@/components/collections/shared"

type TabKey = "all" | "overdue" | "due_soon" | "promise" | "paused"

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "overdue", label: "Vencidos" },
  { key: "due_soon", label: "Por Vencer" },
  { key: "promise", label: "Con Compromiso de Pago" },
  { key: "paused", label: "Pausa de Servicio" },
]

function matchesTab(row: CollectionRow, tab: TabKey) {
  switch (tab) {
    case "overdue":
      return row.hasOverdue
    case "due_soon":
      return row.hasDueSoon
    case "promise":
      return !!row.promise
    case "paused":
      return row.servicePaused
    default:
      return true
  }
}

function toTarget(row: CollectionRow): ActionTarget {
  return {
    clientId: row.clientId,
    clientName: row.clientName,
    contactEmail: row.contactEmail,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    pendingByCurrency: row.pendingByCurrency,
    servicePaused: row.servicePaused,
  }
}

function csvCell(value: string | number) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function exportCsv(rows: CollectionRow[], currencies: string[]) {
  const header = [
    "Cliente",
    "Agencia",
    "Cuentas",
    ...currencies.flatMap((c) => [`Pendiente ${c}`, `Vencido ${c}`]),
    "Facturas",
    "Folios",
    "Días vencido",
    "Antigüedad",
    "Última gestión",
    "Fecha última gestión",
    "Compromiso",
    "Monto compromiso",
    "Acción sugerida",
    "Pausa de servicio",
  ]
  const bucketLabel = Object.fromEntries(AGING_BUCKETS.map((b) => [b.key, b.badge]))
  const lines = rows.map((r) =>
    [
      r.clientName,
      r.agencyName,
      r.accounts.join(" | "),
      ...currencies.flatMap((c) => [(r.pendingByCurrency[c] ?? 0).toFixed(2), (r.overdueByCurrency[c] ?? 0).toFixed(2)]),
      r.invoiceCount,
      r.invoiceNumbers.join(" | "),
      Math.max(r.maxDaysOverdue, 0),
      bucketLabel[r.bucket],
      r.lastActivity ? activityLabel(r.lastActivity.type, r.lastActivity.result) : "",
      r.lastActivity ? r.lastActivity.createdAt.slice(0, 10) : "",
      r.promise ? r.promise.promisedDate : "",
      r.promise ? `${r.promise.amount.toFixed(2)} ${r.promise.currency}` : "",
      SUGGESTED_ACTION_LABELS[r.suggestedAction],
      r.servicePaused ? "Sí" : "No",
    ]
      .map(csvCell)
      .join(","),
  )
  const blob = new Blob([`\uFEFF${[header.map(csvCell).join(","), ...lines].join("\n")}`], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `cobranza-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

type DialogState =
  | { kind: "reminder"; target: ActionTarget; channel: ReminderChannel }
  | { kind: "promise"; target: ActionTarget | null }
  | { kind: "pause"; target: ActionTarget }
  | { kind: "call"; target: ActionTarget }
  | null

export function CollectionsView() {
  const [agency, setAgency] = useState("all")
  const [bucketFilter, setBucketFilter] = useState<AgingBucket | "all">("all")
  const [tab, setTab] = useState<TabKey>("all")
  const [query, setQuery] = useState("")
  const [selectedCurrency, setSelectedCurrency] = useState("MXN")
  const [openClientId, setOpenClientId] = useState<string | null>(null)
  const [dialog, setDialog] = useState<DialogState>(null)

  const { data, error, isLoading } = useSWR<CollectionsSummary>(`/api/collections?agency=${agency}`, fetcher)

  const currencies = data?.currencies ?? []
  const currency = currencies.includes(selectedCurrency) ? selectedCurrency : (currencies[0] ?? "MXN")
  const kpis = data?.kpis[currency]

  const baseRows = useMemo(
    () => (data?.rows ?? []).filter((r) => bucketFilter === "all" || r.bucket === bucketFilter),
    [data, bucketFilter],
  )

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return baseRows.filter((row) => {
      if (!matchesTab(row, tab)) return false
      if (!q) return true
      return (
        row.clientName.toLowerCase().includes(q) ||
        row.accounts.some((a) => a.toLowerCase().includes(q)) ||
        row.invoiceNumbers.some((n) => n.toLowerCase().includes(q))
      )
    })
  }, [baseRows, tab, query])

  const tabCounts = useMemo(
    () => Object.fromEntries(TABS.map((t) => [t.key, baseRows.filter((r) => matchesTab(r, t.key)).length])),
    [baseRows],
  )

  const activeFilters = (agency !== "all" ? 1 : 0) + (bucketFilter !== "all" ? 1 : 0)

  function handleAction(row: CollectionRow, action: RowAction) {
    const target = toTarget(row)
    if (action === "history") setOpenClientId(row.clientId)
    else if (action === "reminder") setDialog({ kind: "reminder", target, channel: row.contactEmail ? "email" : "whatsapp" })
    else setDialog({ kind: action, target })
  }

  const closeDialog = (open: boolean) => {
    if (!open) setDialog(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Gestión de Cobranza</h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Control de cartera vencida, compromisos de pago y acciones de seguimiento de clientes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setDialog({ kind: "promise", target: null })} disabled={!data || data.rows.length === 0}>
            <CalendarPlus data-icon="inline-start" />
            Registrar Compromiso de Pago
          </Button>
          <Button variant="outline" onClick={() => exportCsv(filteredRows, currencies)} disabled={filteredRows.length === 0}>
            <Download data-icon="inline-start" />
            Exportar Reporte
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <SlidersHorizontal />
                <span className="sr-only">Filtros avanzados</span>
                {activeFilters > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {activeFilters}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="flex w-72 flex-col gap-4">
              <p className="text-sm font-medium">Filtros avanzados</p>
              <div className="flex flex-col gap-2">
                <Label htmlFor="filter-agency">Agencia</Label>
                <Select value={agency} onValueChange={setAgency}>
                  <SelectTrigger id="filter-agency" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las agencias</SelectItem>
                    {(data?.agencies ?? []).map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="filter-bucket">Antigüedad</Label>
                <Select value={bucketFilter} onValueChange={(v) => setBucketFilter(v as AgingBucket | "all")}>
                  <SelectTrigger id="filter-bucket" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {AGING_BUCKETS.map((b) => (
                      <SelectItem key={b.key} value={b.key}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {activeFilters > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAgency("all")
                    setBucketFilter("all")
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {error ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No se pudo cargar la cartera</EmptyTitle>
            <EmptyDescription>{error.message}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : isLoading || !data ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : (
        <>
          {currencies.length > 1 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Moneda de indicadores</span>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={currency}
                onValueChange={(v) => v && setSelectedCurrency(v)}
              >
                {currencies.map((c) => (
                  <ToggleGroupItem key={c} value={c} aria-label={`Ver indicadores en ${c}`}>
                    {c}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          )}

          {kpis && (
            <>
              <KpiCards kpis={kpis} currency={currency} />
              <AgingStrip kpis={kpis} currency={currency} />
            </>
          )}

          <section aria-labelledby="collections-table-title" className="flex flex-col gap-4">
            <h2 id="collections-table-title" className="sr-only">
              Clientes con saldo pendiente
            </h2>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="max-w-full overflow-x-auto">
                <TabsList>
                  {TABS.map((t) => (
                    <TabsTrigger key={t.key} value={t.key} className="gap-1.5">
                      {t.label}
                      <Badge variant="secondary" className="h-5 min-w-5 px-1.5 tabular-nums">
                        {tabCounts[t.key]}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="relative w-full xl:w-80">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar cliente, cuenta o factura"
                  aria-label="Buscar cliente, cuenta o factura"
                  className="pl-9"
                />
              </div>
            </div>

            {filteredRows.length === 0 ? (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyTitle>{data.rows.length === 0 ? "Sin saldos pendientes" : "Sin resultados"}</EmptyTitle>
                  <EmptyDescription>
                    {data.rows.length === 0
                      ? "No hay clientes con facturas por cobrar en las agencias seleccionadas."
                      : "Ningún cliente coincide con la búsqueda o filtros aplicados."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <CollectionsTable rows={filteredRows} onOpen={(row) => setOpenClientId(row.clientId)} onAction={handleAction} />
            )}
          </section>
        </>
      )}

      <ClientSheet
        clientId={openClientId}
        onOpenChange={(open) => !open && setOpenClientId(null)}
        onReminder={(target, channel) => setDialog({ kind: "reminder", target, channel })}
        onPause={(target) => setDialog({ kind: "pause", target })}
      />
      <ReminderDialog
        open={dialog?.kind === "reminder"}
        onOpenChange={closeDialog}
        target={dialog?.kind === "reminder" ? dialog.target : null}
        channel={dialog?.kind === "reminder" ? dialog.channel : "email"}
      />
      <PromiseDialog
        open={dialog?.kind === "promise"}
        onOpenChange={closeDialog}
        target={dialog?.kind === "promise" ? dialog.target : null}
        options={(data?.rows ?? []).map(toTarget)}
      />
      <PauseDialog
        open={dialog?.kind === "pause"}
        onOpenChange={closeDialog}
        target={dialog?.kind === "pause" ? dialog.target : null}
      />
      <CallNoteDialog
        open={dialog?.kind === "call"}
        onOpenChange={closeDialog}
        target={dialog?.kind === "call" ? dialog.target : null}
      />
    </div>
  )
}
