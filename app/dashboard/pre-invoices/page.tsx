"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Plus,
  Search,
  Eye,
  ClipboardList,
  FileText,
  Send,
  DollarSign,
  RefreshCw,
  Trash2,
  Calendar,
  ChevronRight,
  ArrowLeft,
  FileCheck,
} from "lucide-react"
import { toast } from "sonner"
import {
  STATUS_LABELS,
  STATUS_VARIANTS,
  STATUS_CLASSES,
  formatCurrency,
  periodLabel,
  refreshPreInvoiceAmounts,
  convertPreInvoiceToInvoice,
  type PreInvoiceStatus,
} from "@/lib/pre-invoices"

interface PreInvoiceRow {
  id: string
  pre_invoice_number: string
  source_type: "account" | "project"
  status: PreInvoiceStatus
  period_start: string
  currency: string
  total: number
  agency_id: string | null
  client: { company_name: string } | null
  account: { account_name: string } | null
  project: { name: string } | null
  agency: { name: string } | null
}

interface PeriodGroup {
  period: string
  label: string
  count: number
  draft: number
  sent: number
  invoiced: number
  cancelled: number
  totalsByCurrency: Record<string, number>
}

export default function PreInvoicesPage() {
  const supabase = createClient()
  const [rows, setRows] = useState<PreInvoiceRow[]>([])
  const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [agencyFilter, setAgencyFilter] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null)
  const [refreshingId, setRefreshingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [billing, setBilling] = useState(false)

  // Recalcula los montos con los datos actuales de Cuentas/Proyectos.
  async function handleRefresh(id: string) {
    setRefreshingId(id)
    try {
      const totals = await refreshPreInvoiceAmounts(supabase, id)
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, total: totals.total, currency: totals.currency } : r)),
      )
      toast.success("Montos actualizados con los datos de Cuentas/Proyectos")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar la prefactura")
    } finally {
      setRefreshingId(null)
    }
  }

  // Elimina la prefactura y sus líneas.
  async function handleDelete(id: string, number: string) {
    if (!confirm(`¿Eliminar la prefactura ${number}? Esta acción no se puede deshacer.`)) return
    setDeletingId(id)
    try {
      await supabase.from("pre_invoice_items").delete().eq("pre_invoice_id", id)
      const { error } = await supabase.from("pre_invoices").delete().eq("id", id)
      if (error) throw new Error(error.message)
      setRows((prev) => prev.filter((r) => r.id !== id))
      toast.success("Prefactura eliminada")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar la prefactura")
    } finally {
      setDeletingId(null)
    }
  }

  // Factura todas las prefacturas seleccionadas (que aún estén pendientes).
  // La confirmación se realiza con un AlertDialog en PeriodDetailView.
  async function handleBillSelected(ids: string[]) {
    if (ids.length === 0) return
    setBilling(true)
    let ok = 0
    let failed = 0
    for (const id of ids) {
      try {
        await convertPreInvoiceToInvoice(supabase, id)
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: "invoiced" } : r)))
        ok += 1
      } catch (err) {
        failed += 1
        console.log("[v0] Error al facturar prefactura", id, err)
      }
    }
    setBilling(false)
    setSelectedIds(new Set())
    if (ok > 0) toast.success(`${ok} ${ok === 1 ? "prefactura facturada" : "prefacturas facturadas"}`)
    if (failed > 0) toast.error(`${failed} no se pudieron facturar (revisa que tengan servicios incluidos)`)
  }

  // Cambia manualmente el estado de una prefactura. Para "Facturada" se usa la
  // conversión (que genera la factura); el resto son actualizaciones directas.
  async function handleStatusChange(id: string, status: PreInvoiceStatus) {
    setStatusUpdatingId(id)
    try {
      if (status === "invoiced") {
        await convertPreInvoiceToInvoice(supabase, id)
      } else {
        const { error } = await supabase.from("pre_invoices").update({ status }).eq("id", id)
        if (error) throw new Error(error.message)
      }
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
      toast.success(`Estado actualizado a "${STATUS_LABELS[status]}"`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cambiar el estado")
    } finally {
      setStatusUpdatingId(null)
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [rowsRes, agenciesRes] = await Promise.all([
        supabase
          .from("pre_invoices")
          .select(
            `id, pre_invoice_number, source_type, status, period_start, currency, total, agency_id,
             client:clients(company_name),
             account:accounts(account_name),
             project:projects(name),
             agency:agencies(name)`,
          )
          .order("created_at", { ascending: false }),
        supabase.from("agencies").select("id, name").eq("is_active", true).order("name"),
      ])
      if (rowsRes.data) setRows(rowsRes.data as unknown as PreInvoiceRow[])
      if (agenciesRes.data) setAgencies(agenciesRes.data)
      setLoading(false)
    }
    load()
  }, [supabase])

  // Prefacturas visibles según agencia (aplica tanto a la vista de periodos
  // como al detalle de un periodo).
  const agencyFiltered = useMemo(
    () => rows.filter((r) => agencyFilter === "all" || r.agency_id === agencyFilter),
    [rows, agencyFilter],
  )

  // Agrupación por periodo para la vista inicial.
  const periodGroups = useMemo<PeriodGroup[]>(() => {
    const map = new Map<string, PeriodGroup>()
    for (const r of agencyFiltered) {
      const key = r.period_start
      let g = map.get(key)
      if (!g) {
        g = {
          period: key,
          label: periodLabel(key),
          count: 0,
          draft: 0,
          sent: 0,
          invoiced: 0,
          cancelled: 0,
          totalsByCurrency: {},
        }
        map.set(key, g)
      }
      g.count += 1
      g[r.status] += 1
      const cur = r.currency || "MXN"
      g.totalsByCurrency[cur] = (g.totalsByCurrency[cur] || 0) + (r.total || 0)
    }
    return Array.from(map.values()).sort((a, b) => b.period.localeCompare(a.period))
  }, [agencyFiltered])

  // Prefacturas del periodo seleccionado, con búsqueda y estado.
  const periodRows = useMemo(() => {
    if (!selectedPeriod) return []
    return agencyFiltered.filter((r) => {
      if (r.period_start !== selectedPeriod) return false
      const name = r.account?.account_name || r.project?.name || ""
      const clientName = r.client?.company_name || ""
      const matchesSearch =
        !search ||
        name.toLowerCase().includes(search.toLowerCase()) ||
        clientName.toLowerCase().includes(search.toLowerCase()) ||
        r.pre_invoice_number.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === "all" || r.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [agencyFiltered, selectedPeriod, search, statusFilter])

  const stats = {
    total: rows.length,
    draft: rows.filter((r) => r.status === "draft").length,
    sent: rows.filter((r) => r.status === "sent").length,
    invoiced: rows.filter((r) => r.status === "invoiced").length,
  }

  const selectedLabel = selectedPeriod ? periodLabel(selectedPeriod) : ""

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">Pre-Facturas</h1>
          <p className="text-muted-foreground">
            Genera y revisa las prefacturas de cuentas y proyectos activos antes de enviarlas al cliente
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/pre-invoices/generate">
            <Plus className="mr-2 h-4 w-4" />
            Generar Pre-Facturas
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ClipboardList} label="Total" value={stats.total} />
        <StatCard icon={FileText} label="Borradores" value={stats.draft} />
        <StatCard icon={Send} label="Enviadas" value={stats.sent} />
        <StatCard icon={DollarSign} label="Facturadas" value={stats.invoiced} />
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="h-6 w-6" />
            </div>
          ) : selectedPeriod === null ? (
            <PeriodListView
              groups={periodGroups}
              agencies={agencies}
              agencyFilter={agencyFilter}
              setAgencyFilter={setAgencyFilter}
              onSelect={(period) => {
                setSelectedPeriod(period)
                setSearch("")
                setStatusFilter("all")
                setSelectedIds(new Set())
              }}
            />
          ) : (
            <PeriodDetailView
              label={selectedLabel}
              rows={periodRows}
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onBack={() => {
                setSelectedPeriod(null)
                setSelectedIds(new Set())
              }}
              onRefresh={handleRefresh}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              refreshingId={refreshingId}
              deletingId={deletingId}
              statusUpdatingId={statusUpdatingId}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              onBillSelected={handleBillSelected}
              billing={billing}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function PeriodListView({
  groups,
  agencies,
  agencyFilter,
  setAgencyFilter,
  onSelect,
}: {
  groups: PeriodGroup[]
  agencies: { id: string; name: string }[]
  agencyFilter: string
  setAgencyFilter: (v: string) => void
  onSelect: (period: string) => void
}) {
  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Selecciona un periodo para ver las prefacturas generadas ese mes.
        </p>
        <Select value={agencyFilter} onValueChange={setAgencyFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Agencia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las agencias</SelectItem>
            {agencies.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <ClipboardList className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No hay prefacturas</p>
          <p className="text-sm text-muted-foreground">
            Genera prefacturas de tus cuentas y proyectos activos para empezar.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <button
              key={g.period}
              type="button"
              onClick={() => onSelect(g.period)}
              className="group flex flex-col gap-4 rounded-lg border bg-card p-5 text-left transition-colors hover:border-primary/50 hover:bg-accent/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold leading-tight">{g.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {g.count} {g.count === 1 ? "prefactura" : "prefacturas"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {g.draft > 0 && (
                  <Badge variant={STATUS_VARIANTS.draft}>{g.draft} {STATUS_LABELS.draft.toLowerCase()}</Badge>
                )}
                {g.sent > 0 && (
                  <Badge variant={STATUS_VARIANTS.sent}>{g.sent} {STATUS_LABELS.sent.toLowerCase()}</Badge>
                )}
                {g.invoiced > 0 && (
                  <Badge variant={STATUS_VARIANTS.invoiced} className={STATUS_CLASSES.invoiced}>
                    {g.invoiced} {STATUS_LABELS.invoiced.toLowerCase()}
                  </Badge>
                )}
                {g.cancelled > 0 && (
                  <Badge variant={STATUS_VARIANTS.cancelled}>
                    {g.cancelled} {STATUS_LABELS.cancelled.toLowerCase()}
                  </Badge>
                )}
              </div>

              <div className="mt-auto border-t pt-3">
                <p className="text-xs text-muted-foreground">Total del periodo</p>
                <div className="flex flex-col">
                  {Object.entries(g.totalsByCurrency).map(([currency, amount]) => (
                    <span key={currency} className="font-semibold">
                      {formatCurrency(amount, currency)}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  )
}

function PeriodDetailView({
  label,
  rows,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  onBack,
  onRefresh,
  onDelete,
  onStatusChange,
  refreshingId,
  deletingId,
  statusUpdatingId,
  selectedIds,
  setSelectedIds,
  onBillSelected,
  billing,
}: {
  label: string
  rows: PreInvoiceRow[]
  search: string
  setSearch: (v: string) => void
  statusFilter: string
  setStatusFilter: (v: string) => void
  onBack: () => void
  onRefresh: (id: string) => void
  onDelete: (id: string, number: string) => void
  onStatusChange: (id: string, status: PreInvoiceStatus) => void
  refreshingId: string | null
  deletingId: string | null
  statusUpdatingId: string | null
  selectedIds: Set<string>
  setSelectedIds: (updater: (prev: Set<string>) => Set<string>) => void
  onBillSelected: (ids: string[]) => void
  billing: boolean
}) {
  // Solo se pueden facturar prefacturas que aún no estén facturadas ni canceladas.
  const billableRows = rows.filter((r) => r.status !== "invoiced" && r.status !== "cancelled")
  const selectableIds = billableRows.map((r) => r.id)
  const selectedBillable = selectableIds.filter((id) => selectedIds.has(id))
  const allSelected = selectableIds.length > 0 && selectedBillable.length === selectableIds.length
  const someSelected = selectedBillable.length > 0 && !allSelected

  // Confirmación de facturación en lote (reemplaza el confirm() nativo).
  const [confirmBillOpen, setConfirmBillOpen] = useState(false)

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        selectableIds.forEach((id) => next.delete(id))
      } else {
        selectableIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Periodos
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{label}</h2>
            <Badge variant="secondary">{rows.length}</Badge>
          </div>
          <div className="ml-auto">
            <Button
              size="sm"
              onClick={() => setConfirmBillOpen(true)}
              disabled={selectedBillable.length === 0 || billing}
            >
              {billing ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <FileCheck className="mr-2 h-4 w-4" />
              )}
              Facturar seleccionados
              {selectedBillable.length > 0 ? ` (${selectedBillable.length})` : ""}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cuenta, cliente o número..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(STATUS_LABELS).map(([value, statusLabel]) => (
                <SelectItem key={value} value={value}>
                  {statusLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <ClipboardList className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Sin resultados</p>
          <p className="text-sm text-muted-foreground">
            No hay prefacturas que coincidan con los filtros en este periodo.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={toggleAll}
                  disabled={selectableIds.length === 0}
                  aria-label="Seleccionar todas las prefacturas facturables"
                />
              </TableHead>
              <TableHead>Número</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Agencia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const canSelect = r.status !== "invoiced" && r.status !== "cancelled"
              return (
              <TableRow key={r.id} data-state={selectedIds.has(r.id) ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(r.id)}
                    onCheckedChange={() => toggleOne(r.id)}
                    disabled={!canSelect}
                    aria-label={`Seleccionar prefactura ${r.pre_invoice_number}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <Link
                    href={`/dashboard/pre-invoices/${r.id}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {r.pre_invoice_number}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{r.account?.account_name || r.project?.name || "-"}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.source_type === "account" ? "Cuenta" : "Proyecto"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{r.client?.company_name || "-"}</TableCell>
                <TableCell>{r.agency?.name || "-"}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[r.status]} className={STATUS_CLASSES[r.status]}>
                    {STATUS_LABELS[r.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(r.total, r.currency)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Select
                      value={r.status}
                      onValueChange={(v) => onStatusChange(r.id, v as PreInvoiceStatus)}
                      disabled={statusUpdatingId === r.id}
                    >
                      <SelectTrigger className="h-8 w-[130px]" title="Cambiar estado">
                        {statusUpdatingId === r.id ? (
                          <span className="flex items-center gap-1">
                            <Spinner className="h-3 w-3" />
                            Guardando
                          </span>
                        ) : (
                          <SelectValue />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(STATUS_LABELS) as PreInvoiceStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/pre-invoices/${r.id}`}>
                        <Eye className="mr-1 h-4 w-4" />
                        Ver
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRefresh(r.id)}
                      disabled={refreshingId === r.id}
                      title="Actualizar montos con los datos de Cuentas/Proyectos"
                    >
                      {refreshingId === r.id ? (
                        <Spinner className="mr-1 h-4 w-4" />
                      ) : (
                        <RefreshCw className="mr-1 h-4 w-4" />
                      )}
                      Actualizar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(r.id, r.pre_invoice_number)}
                      disabled={deletingId === r.id}
                      title="Borrar prefactura"
                    >
                      {deletingId === r.id ? (
                        <Spinner className="h-4 w-4" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      <AlertDialog open={confirmBillOpen} onOpenChange={(open) => !open && setConfirmBillOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Facturar {selectedBillable.length}{" "}
              {selectedBillable.length === 1 ? "prefactura" : "prefacturas"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se generará una factura por cada prefactura seleccionada y pasarán al estado
              &quot;Facturada&quot;. Las nuevas facturas aparecerán en la sección de Facturas y Pagos
              como &quot;Por Cobrar&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={billing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                setConfirmBillOpen(false)
                onBillSelected(selectedBillable)
              }}
              disabled={billing}
            >
              Facturar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
