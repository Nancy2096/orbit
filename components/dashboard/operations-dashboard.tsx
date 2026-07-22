"use client"

import { useMemo, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { OperationsData } from "@/app/dashboard/operations/page"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
      title: "Cuentas activas",
      value: kpis.activeRetainers.toLocaleString("es-MX"),
      sub: `${kpis.totalAccounts} cuentas en total`,
      icon: Layers,
    },
    {
      title: "Proyectos activos",
      value: kpis.activeProjects.toLocaleString("es-MX"),
      sub: "Cuentas tipo proyecto",
      icon: FolderKanban,
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
