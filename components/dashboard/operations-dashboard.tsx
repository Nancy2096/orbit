"use client"

import { useMemo, useState, useTransition, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { OperationsData } from "@/app/dashboard/operations/page"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  TrendingUp,
  Layers,
  FolderKanban,
  Briefcase,
  CalendarClock,
  DollarSign,
  Wallet,
  Target,
  Gauge,
  Percent,
  X,
} from "lucide-react"
import { ObjectiveGauge } from "@/components/dashboard/objective-gauge"

const statusLabels: Record<string, string> = {
  active: "Activa",
  inactive: "Inactiva",
  paused: "Pausada",
  suspended: "Suspendida",
  cancelled: "Cancelada",
  pending: "Pendiente",
  sin_estado: "Sin estado",
}

const STATUS_COLORS = [
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-1)",
  "var(--chart-4)",
  "var(--chart-5)",
]

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 }).format(
    value || 0,
  )
}

const GLOBAL_VALUE = "global"

// Paleta base para las gráficas de participación. Para más de 5 rebanadas se
// generan tonos derivados aclarando el color base hacia el fondo.
const SHARE_BASE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]
function shareColor(i: number) {
  const base = SHARE_BASE[i % SHARE_BASE.length]
  const round = Math.floor(i / SHARE_BASE.length)
  if (round === 0) return base
  const pct = Math.max(35, 80 - round * 25)
  return `color-mix(in oklab, ${base} ${pct}%, var(--background))`
}

const shareChartConfig = { value: { label: "Monto" } } satisfies ChartConfig

interface ShareItem {
  name: string
  value: number
  currency: string
  pct: number
  fill: string
}

interface ShareResult {
  items: ShareItem[]
  total: number
  count: number
}

function SharePie({
  title,
  description,
  share,
  controls,
}: {
  title: string
  description: string
  share: ShareResult
  controls?: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {controls ? <div className="pt-2">{controls}</div> : null}
      </CardHeader>
      <CardContent>
        {share.items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Sin datos para el periodo seleccionado.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <ChartContainer config={shareChartConfig} className="mx-auto h-[240px] w-full">
              <PieChart>
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const p = payload[0].payload as ShareItem
                    return (
                      <div className="rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl">
                        <div className="font-medium text-foreground">{p.name}</div>
                        <div className="text-muted-foreground">
                          {p.currency ? formatMoney(p.value, p.currency) : formatCompact(p.value)}
                          {" · "}
                          <span className="font-semibold text-foreground">{p.pct.toFixed(1)}%</span>
                        </div>
                      </div>
                    )
                  }}
                />
                <Pie data={share.items} dataKey="value" nameKey="name" innerRadius={52} outerRadius={92}>
                  {share.items.map((e) => (
                    <Cell key={e.name} fill={e.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {share.items.map((e) => (
                <li key={e.name} className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: e.fill }} aria-hidden="true" />
                    <span className="truncate text-muted-foreground">{e.name}</span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums text-foreground">{e.pct.toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function OperationsDashboard({ data }: { data: OperationsData }) {
  const { kpis, objectives } = data
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleAgencyChange = (value: string) => {
    startTransition(() => {
      router.push(value === GLOBAL_VALUE ? "/dashboard/operations" : `/dashboard/operations?agency=${value}`)
    })
  }

  const selectedAgencyName = data.selectedAgencyId
    ? data.agencies.find((a) => a.id === data.selectedAgencyId)?.name ?? "Agencia"
    : null

  const projectionConfig = {
    mxn: { label: "MXN acumulado", color: "var(--chart-1)" },
    usd: { label: "USD acumulado", color: "var(--chart-2)" },
  } satisfies ChartConfig

  const agencyConfig = {
    mrr: { label: "MRR (MXN)", color: "var(--chart-1)" },
  } satisfies ChartConfig

  const clientTypeConfig = {
    count: { label: "Clientes", color: "var(--chart-3)" },
  } satisfies ChartConfig

  const topConfig = {
    amount: { label: "Monto mensual", color: "var(--chart-2)" },
  } satisfies ChartConfig

  const unitConfig = {
    count: { label: "Cantidad", color: "var(--chart-4)" },
  } satisfies ChartConfig

  // Filtro de fecha para las gráficas de participación (por mes o personalizado).
  const nowRef = new Date()
  const currentMonth = `${nowRef.getFullYear()}-${String(nowRef.getMonth() + 1).padStart(2, "0")}`
  const [rangeMode, setRangeMode] = useState<"all" | "month" | "custom">("all")
  const [month, setMonth] = useState<string>(currentMonth)
  const [fromDate, setFromDate] = useState<string>("")
  const [toDate, setToDate] = useState<string>("")

  // Cuentas seleccionadas para combinar en una sola rebanada (mismo cliente) y
  // nombre opcional para ese grupo.
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])
  const [groupLabel, setGroupLabel] = useState<string>("")

  const inRange = useMemo(() => {
    return (createdAt: string | null) => {
      if (rangeMode === "all") return true
      if (!createdAt) return false
      const d = createdAt.slice(0, 10)
      if (rangeMode === "month") return d.slice(0, 7) === month
      if (fromDate && d < fromDate) return false
      if (toDate && d > toDate) return false
      return true
    }
  }, [rangeMode, month, fromDate, toDate])

  // Cuentas disponibles en el periodo, para poblar el selector de agrupación.
  const accountOptions = useMemo(
    () =>
      data.shareRows
        .filter((r) => r.type === "retainer" && inRange(r.createdAt))
        .sort((a, b) => b.amount - a.amount),
    [data.shareRows, inRange],
  )

  const { accountsShare, projectsShare } = useMemo(() => {
    const build = (type: "retainer" | "project"): ShareResult => {
      const rows = data.shareRows.filter((r) => r.type === type && inRange(r.createdAt))
      const total = rows.reduce((sum, r) => sum + r.amount, 0)
      const sorted = [...rows].sort((a, b) => b.amount - a.amount)

      // Solo para Cuentas: combinar las seleccionadas en una única rebanada.
      const selected = type === "retainer" ? new Set(selectedAccountIds) : new Set<string>()
      const grouped = sorted.filter((r) => selected.has(r.id))

      if (grouped.length > 1) {
        const groupTotal = grouped.reduce((sum, r) => sum + r.amount, 0)
        const rest = sorted.filter((r) => !selected.has(r.id))
        const groupItem: ShareItem = {
          name: groupLabel.trim() || `Grupo (${grouped.length} cuentas)`,
          value: groupTotal,
          currency: "",
          pct: total ? (groupTotal / total) * 100 : 0,
          fill: shareColor(0),
        }
        const restItems: ShareItem[] = rest.map((r, i) => ({
          name: r.name,
          value: r.amount,
          currency: r.currency,
          pct: total ? (r.amount / total) * 100 : 0,
          fill: shareColor(i + 1),
        }))
        return { items: [groupItem, ...restItems], total, count: rows.length }
      }

      // Se muestran TODAS las cuentas/proyectos, sin agrupar.
      const items: ShareItem[] = sorted.map((r, i) => ({
        name: r.name,
        value: r.amount,
        currency: r.currency,
        pct: total ? (r.amount / total) * 100 : 0,
        fill: shareColor(i),
      }))
      return { items, total, count: rows.length }
    }

    return { accountsShare: build("retainer"), projectsShare: build("project") }
  }, [data.shareRows, inRange, selectedAccountIds, groupLabel])

  const statusData = useMemo(
    () =>
      data.accountsByStatus.map((s, i) => ({
        name: statusLabels[s.status] || s.status,
        value: s.count,
        fill: STATUS_COLORS[i % STATUS_COLORS.length],
      })),
    [data.accountsByStatus],
  )

  const statusConfig = useMemo(() => {
    const cfg: ChartConfig = { value: { label: "Cuentas" } }
    statusData.forEach((s, i) => {
      cfg[s.name] = { label: s.name, color: STATUS_COLORS[i % STATUS_COLORS.length] }
    })
    return cfg
  }, [statusData])

  const kpiCards = [
    {
      title: "Ingreso mensual (MXN)",
      value: formatMoney(kpis.mrrMXN, "MXN"),
      sub: "Cuentas + proyectos activos",
      icon: DollarSign,
    },
    {
      title: "Ingreso mensual (USD)",
      value: formatMoney(kpis.mrrUSD, "USD"),
      sub: "Cuentas + proyectos activos",
      icon: DollarSign,
    },
    {
      title: "Proyección anual (MXN)",
      value: formatMoney(kpis.annualMXN, "MXN"),
      sub: "Ingreso mensual x 12 meses",
      icon: TrendingUp,
    },
    {
      title: "Proyección anual (USD)",
      value: formatMoney(kpis.annualUSD, "USD"),
      sub: "Ingreso mensual x 12 meses",
      icon: TrendingUp,
    },
    {
      title: "Clientes activos",
      value: kpis.clientsActive.toLocaleString("es-MX"),
      sub: `${kpis.clientsTotal} clientes registrados`,
      icon: Briefcase,
    },
    {
      title: "Ticket promedio (MXN)",
      value: formatMoney(kpis.avgTicketMXN, "MXN"),
      sub: "Por cuenta activa MXN",
      icon: Wallet,
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Dashboard de Operaciones</h1>
          <p className="text-sm text-muted-foreground text-pretty">
            {selectedAgencyName
              ? `Indicadores de ${selectedAgencyName} con valores mensuales y proyección a futuro.`
              : "Indicadores globales de todas las agencias con valores mensuales y proyección a futuro."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={data.selectedAgencyId ?? GLOBAL_VALUE}
            onValueChange={handleAgencyChange}
            disabled={isPending}
          >
            <SelectTrigger className="w-[220px]" aria-label="Filtrar por agencia">
              <SelectValue placeholder="Selecciona agencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={GLOBAL_VALUE}>Global (todas las agencias)</SelectItem>
              {data.agencies.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/accounts">Ver cuentas</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/projects">Ver proyectos</Link>
          </Button>
        </div>
      </div>

      {/* Objetivos de operación: tacómetros */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
        <CardHeader className="border-b bg-card/40">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="size-5 text-primary" aria-hidden="true" />
            Objetivos de operación
          </CardTitle>
          <CardDescription>
            Avance de cuentas y proyectos frente a los objetivos definidos en Agencias.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col items-center gap-3 rounded-xl border bg-card/60 p-4">
              <ObjectiveGauge
                label="Cuentas"
                current={objectives.accountsCurrent}
                target={objectives.accountsTarget}
                color="var(--chart-1)"
                icon={Layers}
              />
              <div className="flex w-full items-center justify-center gap-2 text-xs">
                <Target className="size-3.5 text-muted-foreground" aria-hidden="true" />
                <span className="text-muted-foreground">Meta mensual:</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {objectives.accountsMonthlyTarget.toLocaleString("es-MX")} cuentas
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 rounded-xl border bg-card/60 p-4">
              <ObjectiveGauge
                label="Proyectos"
                current={objectives.projectsCurrent}
                target={objectives.projectsTarget}
                color="var(--chart-2)"
                icon={FolderKanban}
              />
              <div className="flex w-full items-center justify-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[var(--chart-2)]" aria-hidden="true" />
                  <span className="text-muted-foreground">Activos</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {objectives.projectsActive.toLocaleString("es-MX")}
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-muted-foreground/40" aria-hidden="true" />
                  <span className="text-muted-foreground">Inactivos</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {objectives.projectsInactive.toLocaleString("es-MX")}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((k) => (
          <Card key={k.title}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardDescription className="text-xs">{k.title}</CardDescription>
              <k.icon className="size-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums text-balance">{k.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Proyección de ingresos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4 text-muted-foreground" aria-hidden="true" />
            Proyección de ingresos acumulados (12 meses)
          </CardTitle>
          <CardDescription>
            Ingreso mensual (cuentas + proyectos activos) acumulado mes a mes, separado por moneda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={projectionConfig} className="h-[300px] w-full">
            <AreaChart data={data.projection} margin={{ left: 12, right: 12 }}>
              <defs>
                <linearGradient id="fillMxn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-mxn)" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="var(--color-mxn)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillUsd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-usd)" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="var(--color-usd)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={48}
                tickFormatter={(v) => formatCompact(Number(v))}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">
                          {name === "mxn" ? "MXN" : "USD"}
                        </span>
                        <span className="font-mono font-medium tabular-nums">
                          {formatMoney(Number(value), name === "mxn" ? "MXN" : "USD")}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Area
                dataKey="mxn"
                type="monotone"
                fill="url(#fillMxn)"
                stroke="var(--color-mxn)"
                strokeWidth={2}
              />
              <Area
                dataKey="usd"
                type="monotone"
                fill="url(#fillUsd)"
                stroke="var(--color-usd)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* MRR por agencia */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingreso mensual por agencia (MXN)</CardTitle>
            <CardDescription>Recurrente de cuentas activas por agencia.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={agencyConfig} className="h-[280px] w-full">
              <BarChart data={data.mrrByAgency} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="agency" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={48}
                  tickFormatter={(v) => formatCompact(Number(v))}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <span className="font-mono font-medium tabular-nums">
                          {formatMoney(Number(value), "MXN")}
                        </span>
                      )}
                    />
                  }
                />
                <Bar dataKey="mrr" fill="var(--color-mrr)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Distribución por estado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cuentas por estado</CardTitle>
            <CardDescription>Distribución de todas las cuentas.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ChartContainer config={statusConfig} className="h-[280px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95}>
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top cuentas por monto mensual */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top cuentas por monto mensual (MXN)</CardTitle>
            <CardDescription>Las cuentas activas de mayor valor recurrente.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={topConfig} className="h-[300px] w-full">
              <BarChart
                data={data.topAccountsMXN}
                layout="vertical"
                margin={{ left: 12, right: 16 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCompact(Number(v))}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={110}
                  tickFormatter={(v: string) => (v.length > 16 ? v.slice(0, 15) + "…" : v)}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <span className="font-mono font-medium tabular-nums">
                          {formatMoney(Number(value), "MXN")}
                        </span>
                      )}
                    />
                  }
                />
                <Bar dataKey="amount" fill="var(--color-amount)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Tipo de Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tipo de Cliente</CardTitle>
            <CardDescription>Distribución de la cartera por tipo de cliente.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={clientTypeConfig} className="h-[300px] w-full">
              <BarChart data={data.clientsByType} layout="vertical" margin={{ left: 12, right: 16 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis
                  dataKey="type"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={110}
                  tickFormatter={(v: string) => (v.length > 16 ? v.slice(0, 15) + "…" : v)}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Participación de cuentas y proyectos por monto contratado */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-balance">
              <Percent className="size-5 text-muted-foreground" aria-hidden="true" />
              Participación de cuentas y proyectos
            </h2>
            <p className="text-sm text-muted-foreground text-pretty">
              Porcentaje que representa cada cuenta y cada proyecto sobre el monto total contratado del periodo.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={rangeMode} onValueChange={(v) => setRangeMode(v as "all" | "month" | "custom")}>
              <SelectTrigger className="w-[170px]" aria-label="Filtrar por periodo">
                <CalendarClock className="size-4 text-muted-foreground" aria-hidden="true" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el histórico</SelectItem>
                <SelectItem value="month">Por mes</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            {rangeMode === "month" && (
              <Input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-[170px]"
                aria-label="Mes"
              />
            )}
            {rangeMode === "custom" && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-[150px]"
                  aria-label="Desde"
                />
                <span className="text-xs text-muted-foreground">a</span>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-[150px]"
                  aria-label="Hasta"
                />
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SharePie
            title="Cuentas por participación"
            description={`${accountsShare.count} cuentas con monto en el periodo.`}
            share={accountsShare}
            controls={
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Layers className="size-4" aria-hidden="true" />
                        {selectedAccountIds.length > 0
                          ? `${selectedAccountIds.length} cuenta(s) seleccionada(s)`
                          : "Agrupar cuentas"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar cuenta..." />
                        <CommandList>
                          <CommandEmpty>Sin cuentas en el periodo.</CommandEmpty>
                          <CommandGroup>
                            {accountOptions.map((a) => {
                              const checked = selectedAccountIds.includes(a.id)
                              return (
                                <CommandItem
                                  key={a.id}
                                  value={a.name}
                                  onSelect={() =>
                                    setSelectedAccountIds((prev) =>
                                      checked ? prev.filter((id) => id !== a.id) : [...prev, a.id],
                                    )
                                  }
                                  className="gap-2"
                                >
                                  <Checkbox checked={checked} className="pointer-events-none" />
                                  <span className="flex-1 truncate">{a.name}</span>
                                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                    {formatMoney(a.amount, a.currency)}
                                  </span>
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedAccountIds.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-muted-foreground"
                      onClick={() => {
                        setSelectedAccountIds([])
                        setGroupLabel("")
                      }}
                    >
                      <X className="size-4" aria-hidden="true" />
                      Limpiar
                    </Button>
                  )}
                </div>
                {selectedAccountIds.length > 1 && (
                  <Input
                    value={groupLabel}
                    onChange={(e) => setGroupLabel(e.target.value)}
                    placeholder="Nombre del grupo (ej. Grupo Cliente X)"
                    className="h-8 max-w-[280px]"
                    aria-label="Nombre del grupo"
                  />
                )}
                {selectedAccountIds.length === 1 && (
                  <p className="text-xs text-muted-foreground">
                    Selecciona al menos 2 cuentas para combinarlas en una sola rebanada.
                  </p>
                )}
              </div>
            }
          />
          <SharePie
            title="Proyectos por participación"
            description={`${projectsShare.count} proyectos con monto en el periodo.`}
            share={projectsShare}
          />
        </div>
      </section>

      {/* Unidades por tipo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="size-4 text-muted-foreground" aria-hidden="true" />
            Cuentas y proyectos por estado (unidades)
          </CardTitle>
          <CardDescription>Conteo unitario de cuentas retainer y proyectos.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={unitConfig} className="h-[260px] w-full">
            <BarChart data={data.unitByType} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="type" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
