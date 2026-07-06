"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
import { Plus, Search, Eye, ClipboardList, FileText, Send, DollarSign } from "lucide-react"
import {
  STATUS_LABELS,
  STATUS_VARIANTS,
  formatCurrency,
  periodLabel,
  recentMonths,
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

export default function PreInvoicesPage() {
  const supabase = createClient()
  const months = useMemo(() => recentMonths(12), [])
  const [rows, setRows] = useState<PreInvoiceRow[]>([])
  const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [agencyFilter, setAgencyFilter] = useState<string>("all")
  const [periodFilter, setPeriodFilter] = useState<string>("all")

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

  const filtered = rows.filter((r) => {
    const name = r.account?.account_name || r.project?.name || ""
    const clientName = r.client?.company_name || ""
    const matchesSearch =
      !search ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      clientName.toLowerCase().includes(search.toLowerCase()) ||
      r.pre_invoice_number.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || r.status === statusFilter
    const matchesAgency = agencyFilter === "all" || r.agency_id === agencyFilter
    const matchesPeriod = periodFilter === "all" || r.period_start.startsWith(periodFilter)
    return matchesSearch && matchesStatus && matchesAgency && matchesPeriod
  })

  const stats = {
    total: rows.length,
    draft: rows.filter((r) => r.status === "draft").length,
    sent: rows.filter((r) => r.status === "sent").length,
    invoiced: rows.filter((r) => r.status === "invoiced").length,
  }

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
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cuenta, cliente o número..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los periodos</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={agencyFilter} onValueChange={setAgencyFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
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

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="h-6 w-6" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium">No hay prefacturas</p>
              <p className="text-sm text-muted-foreground">
                Genera prefacturas de tus cuentas y proyectos activos para empezar.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Agencia</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.pre_invoice_number}</TableCell>
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
                    <TableCell>{periodLabel(r.period_start)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[r.status]}>{STATUS_LABELS[r.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(r.total, r.currency)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/pre-invoices/${r.id}`}>
                          <Eye className="mr-1 h-4 w-4" />
                          Ver
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
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
