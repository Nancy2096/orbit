"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAgency } from "@/contexts/agency-context"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import {
  Users,
  DollarSign,
  Target,
  Trophy,
  BarChart3,
  Kanban,
  UserCheck,
  Megaphone,
  Percent,
  XCircle,
  Layers,
} from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const COLORS = ["#16a34a", "#0891b2", "#ca8a04", "#7c3aed", "#dc2626", "#2563eb", "#db2777", "#0d9488", "#9ca3af"]
const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

interface StageMetric {
  stage_name: string
  stage_color: string
  count: number
  total_value: number
  sort_order: number
}

interface SourceMetric {
  source_name: string
  count: number
  total_value: number
  won_count: number
  conversion_rate: number
}

interface SalesRep {
  id: string
  first_name: string
  last_name: string
}

interface SalesRepMetric {
  id: string
  name: string
  total_prospects: number
  active_prospects: number
  won_prospects: number
  lost_prospects: number
  total_value: number
  won_value: number
  conversion_rate: number
}

interface LossMetric {
  reason: string
  count: number
  percentage: number
}

interface TrendPoint {
  month: string
  prospectos: number
  ganados: number
  valor: number
}

export default function MetricsPage() {
  const { selectedAgencyId, loading: agencyLoading } = useAgency()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<string>("all")
  const [selectedSalesRep, setSelectedSalesRep] = useState<string>("all")
  const [salesReps, setSalesReps] = useState<SalesRep[]>([])
  const [activeTab, setActiveTab] = useState("pipeline")
  const [hasData, setHasData] = useState(false)

  const [metrics, setMetrics] = useState({
    totalProspects: 0,
    activeProspects: 0,
    wonProspects: 0,
    lostProspects: 0,
    totalPipelineValue: 0,
    wonValue: 0,
    conversionRate: 0,
    avgDealSize: 0,
    avgDaysToClose: 0,
  })

  const [stageMetrics, setStageMetrics] = useState<StageMetric[]>([])
  const [sourceMetrics, setSourceMetrics] = useState<SourceMetric[]>([])
  const [salesRepMetrics, setSalesRepMetrics] = useState<SalesRepMetric[]>([])
  const [lossMetrics, setLossMetrics] = useState<LossMetric[]>([])
  const [trend, setTrend] = useState<TrendPoint[]>([])

  const supabase = createClient()

  useEffect(() => {
    if (selectedAgencyId) {
      fetchMetrics()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, selectedAgencyId, selectedSalesRep])

  const fetchMetrics = async () => {
    if (!selectedAgencyId) return
    setLoading(true)

    // Filtro de fecha
    let dateFilter: Date | null = null
    if (period !== "all") {
      const now = new Date()
      if (period === "month") dateFilter = new Date(now.getFullYear(), now.getMonth(), 1)
      else if (period === "quarter") dateFilter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
      else if (period === "year") dateFilter = new Date(now.getFullYear(), 0, 1)
    }

    // Asesores
    const { data: salesRepsData } = await supabase
      .from("staff")
      .select("id, first_name, last_name")
      .or(`agency_id.eq.${selectedAgencyId},is_global.eq.true`)
      .eq("is_active", true)
      .order("first_name")
    const reps = (salesRepsData || []) as SalesRep[]
    setSalesReps(reps)
    const repNameMap = new Map(reps.map((r) => [r.id, `${r.first_name} ${r.last_name}`.trim()]))

    // Prospectos (con etapa y fuente)
    let query = supabase
      .from("crm_prospects")
      .select(
        `id, status, estimated_value, created_at, won_date, lost_date, lost_reason, assigned_to,
         stage:crm_pipeline_stages(id, name, color, is_won, is_lost, sort_order),
         source:crm_lead_sources(id, name)`,
      )
      .eq("agency_id", selectedAgencyId)

    if (dateFilter) query = query.gte("created_at", dateFilter.toISOString())
    if (selectedSalesRep !== "all") query = query.eq("assigned_to", selectedSalesRep)

    const { data: prospectsData } = await query
    const prospects = (prospectsData || []) as any[]
    setHasData(prospects.length > 0)

    const isWon = (p: any) => !!p.stage?.is_won
    const isLost = (p: any) => p.status === "lost" || !!p.stage?.is_lost

    const won = prospects.filter(isWon)
    const lost = prospects.filter(isLost)
    const active = prospects.filter((p) => p.status === "active")
    const valued = prospects.filter((p) => (p.estimated_value || 0) > 0)

    const totalPipelineValue = prospects
      .filter((p) => !isLost(p))
      .reduce((sum, p) => sum + (p.estimated_value || 0), 0)
    const wonValue = won.reduce((sum, p) => sum + (p.estimated_value || 0), 0)
    const conversionRate = prospects.length ? (won.length / prospects.length) * 100 : 0
    const avgDealSize = valued.length ? valued.reduce((s, p) => s + (p.estimated_value || 0), 0) / valued.length : 0

    const closedDeals = won.filter((p) => p.won_date && p.created_at)
    const avgDaysToClose = closedDeals.length
      ? Math.round(
          closedDeals.reduce((sum, p) => {
            const days = Math.ceil(
              (new Date(p.won_date).getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24),
            )
            return sum + Math.max(days, 0)
          }, 0) / closedDeals.length,
        )
      : 0

    setMetrics({
      totalProspects: prospects.length,
      activeProspects: active.length,
      wonProspects: won.length,
      lostProspects: lost.length,
      totalPipelineValue,
      wonValue,
      conversionRate,
      avgDealSize,
      avgDaysToClose,
    })

    // Etapas
    const stageGroups: Record<string, StageMetric> = {}
    prospects.forEach((p) => {
      if (!p.stage) return
      const key = p.stage.name
      if (!stageGroups[key]) {
        stageGroups[key] = {
          stage_name: p.stage.name,
          stage_color: p.stage.color || COLORS[Object.keys(stageGroups).length % COLORS.length],
          count: 0,
          total_value: 0,
          sort_order: p.stage.sort_order ?? 999,
        }
      }
      stageGroups[key].count++
      stageGroups[key].total_value += p.estimated_value || 0
    })
    setStageMetrics(Object.values(stageGroups).sort((a, b) => a.sort_order - b.sort_order))

    // Fuentes
    const sourceGroups: Record<string, SourceMetric> = {}
    prospects.forEach((p) => {
      const name = p.source?.name || "Sin fuente"
      if (!sourceGroups[name]) {
        sourceGroups[name] = { source_name: name, count: 0, total_value: 0, won_count: 0, conversion_rate: 0 }
      }
      sourceGroups[name].count++
      sourceGroups[name].total_value += p.estimated_value || 0
      if (isWon(p)) sourceGroups[name].won_count++
    })
    Object.values(sourceGroups).forEach((s) => {
      s.conversion_rate = s.count ? (s.won_count / s.count) * 100 : 0
    })
    setSourceMetrics(Object.values(sourceGroups).sort((a, b) => b.count - a.count))

    // Asesores
    const repGroups: Record<string, SalesRepMetric> = {}
    prospects.forEach((p) => {
      const id = p.assigned_to || "unassigned"
      const name = p.assigned_to ? repNameMap.get(p.assigned_to) || "Desconocido" : "Sin asignar"
      if (!repGroups[id]) {
        repGroups[id] = {
          id,
          name,
          total_prospects: 0,
          active_prospects: 0,
          won_prospects: 0,
          lost_prospects: 0,
          total_value: 0,
          won_value: 0,
          conversion_rate: 0,
        }
      }
      const g = repGroups[id]
      g.total_prospects++
      if (p.status === "active") g.active_prospects++
      if (isWon(p)) {
        g.won_prospects++
        g.won_value += p.estimated_value || 0
      }
      if (isLost(p)) g.lost_prospects++
      g.total_value += p.estimated_value || 0
    })
    Object.values(repGroups).forEach((g) => {
      g.conversion_rate = g.total_prospects ? (g.won_prospects / g.total_prospects) * 100 : 0
    })
    setSalesRepMetrics(Object.values(repGroups).sort((a, b) => b.total_prospects - a.total_prospects))

    // Razones de pérdida
    const lossGroups: Record<string, number> = {}
    lost.forEach((p) => {
      const reason = (p.lost_reason || "").trim() || "Sin especificar"
      lossGroups[reason] = (lossGroups[reason] || 0) + 1
    })
    const lossTotal = Object.values(lossGroups).reduce((a, b) => a + b, 0)
    setLossMetrics(
      Object.entries(lossGroups)
        .map(([reason, count]) => ({
          reason,
          count,
          percentage: lossTotal ? Math.round((count / lossTotal) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count),
    )

    // Tendencia mensual
    const monthGroups: Record<string, { prospectos: number; ganados: number; valor: number }> = {}
    prospects.forEach((p) => {
      if (!p.created_at) return
      const d = new Date(p.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      if (!monthGroups[key]) monthGroups[key] = { prospectos: 0, ganados: 0, valor: 0 }
      monthGroups[key].prospectos++
      monthGroups[key].valor += p.estimated_value || 0
      if (isWon(p)) monthGroups[key].ganados++
    })
    setTrend(
      Object.entries(monthGroups)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, v]) => {
          const [y, m] = key.split("-")
          return { month: `${MONTHS_ES[Number(m) - 1]} ${y.slice(2)}`, ...v }
        }),
    )

    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`
    return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(
      amount,
    )
  }

  if (loading || agencyLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (!selectedAgencyId) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Selecciona una Agencia</h2>
          <p className="text-muted-foreground max-w-md">
            Para ver las métricas, primero selecciona una agencia en el selector de arriba.
          </p>
        </div>
      </div>
    )
  }

  const kpiCards = [
    { label: "Prospectos totales", value: metrics.totalProspects.toLocaleString("es-MX"), icon: Users, hint: `${metrics.activeProspects} activos` },
    { label: "Valor de pipeline", value: formatCurrency(metrics.totalPipelineValue), icon: DollarSign, hint: "Oportunidades abiertas" },
    { label: "Tasa de conversión", value: `${metrics.conversionRate.toFixed(1)}%`, icon: Percent, hint: `${metrics.wonProspects} ganados` },
    { label: "Ticket promedio", value: formatCurrency(metrics.avgDealSize), icon: Target, hint: "Valor estimado prom." },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Métricas del CRM</h1>
          <p className="text-muted-foreground">Rendimiento de tu pipeline con datos reales de prospectos</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedSalesRep} onValueChange={setSelectedSalesRep}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos los asesores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los asesores</SelectItem>
              {salesReps.map((rep) => (
                <SelectItem key={rep.id} value={rep.id}>
                  {rep.first_name} {rep.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
              <SelectItem value="all">Todo el tiempo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!hasData ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Sin datos para este periodo</h2>
            <p className="text-muted-foreground max-w-md">
              No hay prospectos que coincidan con los filtros seleccionados. Ajusta el periodo o el asesor.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpiCards.map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{kpi.label}</p>
                      <p className="text-2xl font-bold">{kpi.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{kpi.hint}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-full">
                      <kpi.icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pipeline" className="flex items-center gap-2">
                <Kanban className="h-4 w-4" />
                <span className="hidden sm:inline">Pipeline</span>
              </TabsTrigger>
              <TabsTrigger value="asesores" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Asesores</span>
              </TabsTrigger>
              <TabsTrigger value="medios" className="flex items-center gap-2">
                <Megaphone className="h-4 w-4" />
                <span className="hidden sm:inline">Fuentes</span>
              </TabsTrigger>
              <TabsTrigger value="perdidas" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Pérdidas</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab: Pipeline */}
            <TabsContent value="pipeline" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Prospectos por Etapa</CardTitle>
                    <CardDescription>Distribución del pipeline y valor estimado</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stageMetrics.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-8 text-center">Sin datos de etapas.</p>
                    ) : (
                      <div className="space-y-4">
                        {stageMetrics.map((s) => {
                          const maxCount = Math.max(...stageMetrics.map((m) => m.count), 1)
                          return (
                            <div key={s.stage_name} className="space-y-1.5">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">{s.stage_name}</span>
                                <span className="text-muted-foreground">
                                  {s.count} · {formatCurrency(s.total_value)}
                                </span>
                              </div>
                              <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${(s.count / maxCount) * 100}%`, backgroundColor: s.stage_color }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Resumen del Pipeline</CardTitle>
                    <CardDescription>Estado general de tus prospectos</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Layers className="h-4 w-4" /> Activos
                        </div>
                        <p className="text-2xl font-bold mt-1">{metrics.activeProspects}</p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Trophy className="h-4 w-4" /> Ganados
                        </div>
                        <p className="text-2xl font-bold mt-1">{metrics.wonProspects}</p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <XCircle className="h-4 w-4" /> Perdidos
                        </div>
                        <p className="text-2xl font-bold mt-1">{metrics.lostProspects}</p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <DollarSign className="h-4 w-4" /> Valor ganado
                        </div>
                        <p className="text-2xl font-bold mt-1">{formatCurrency(metrics.wonValue)}</p>
                      </div>
                    </div>
                    {metrics.avgDaysToClose > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Tiempo promedio de cierre: <span className="font-medium">{metrics.avgDaysToClose} días</span>
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {trend.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tendencia Mensual</CardTitle>
                    <CardDescription>Prospectos creados y ganados por mes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={trend}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip contentStyle={{ borderRadius: "8px" }} />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="prospectos"
                          name="Prospectos"
                          stroke="#16a34a"
                          fill="#16a34a"
                          fillOpacity={0.2}
                        />
                        <Area
                          type="monotone"
                          dataKey="ganados"
                          name="Ganados"
                          stroke="#2563eb"
                          fill="#2563eb"
                          fillOpacity={0.15}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab: Asesores */}
            <TabsContent value="asesores" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Rendimiento por Asesor</CardTitle>
                  <CardDescription>Prospectos asignados, ganados y tasa de conversión</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asesor</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Activos</TableHead>
                        <TableHead className="text-right">Ganados</TableHead>
                        <TableHead className="text-right">Perdidos</TableHead>
                        <TableHead className="text-right">Conversión</TableHead>
                        <TableHead className="text-right">Valor pipeline</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesRepMetrics.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell className="text-right">{r.total_prospects}</TableCell>
                          <TableCell className="text-right">{r.active_prospects}</TableCell>
                          <TableCell className="text-right">{r.won_prospects}</TableCell>
                          <TableCell className="text-right">{r.lost_prospects}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Progress value={r.conversion_rate} className="h-2 w-16" />
                              <span className="text-sm tabular-nums">{r.conversion_rate.toFixed(1)}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(r.total_value)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Prospectos por Asesor</CardTitle>
                  <CardDescription>Carga de trabajo por asesor</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesRepMetrics}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: "8px" }} />
                      <Legend />
                      <Bar dataKey="total_prospects" name="Total" fill="#16a34a" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="won_prospects" name="Ganados" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Fuentes */}
            <TabsContent value="medios" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Prospectos por Fuente</CardTitle>
                    <CardDescription>Distribución por canal de adquisición</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={sourceMetrics}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="count"
                          nameKey="source_name"
                        >
                          {sourceMetrics.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Conversión por Fuente</CardTitle>
                    <CardDescription>Prospectos ganados sobre el total de cada fuente</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fuente</TableHead>
                          <TableHead className="text-right">Prospectos</TableHead>
                          <TableHead className="text-right">Ganados</TableHead>
                          <TableHead className="text-right">Conversión</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sourceMetrics.map((s, i) => (
                          <TableRow key={s.source_name}>
                            <TableCell className="font-medium">
                              <span className="flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                />
                                {s.source_name}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">{s.count}</TableCell>
                            <TableCell className="text-right">{s.won_count}</TableCell>
                            <TableCell className="text-right">{s.conversion_rate.toFixed(1)}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab: Pérdidas */}
            <TabsContent value="perdidas" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Razones de Pérdida</CardTitle>
                  <CardDescription>Motivos de prospectos marcados como perdidos</CardDescription>
                </CardHeader>
                <CardContent>
                  {lossMetrics.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="rounded-full bg-muted p-4 mb-3">
                        <Trophy className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        No hay prospectos perdidos en este periodo. Cuando marques prospectos como perdidos, aquí verás
                        los motivos agrupados.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {lossMetrics.map((item, i) => (
                        <div key={item.reason} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.reason}</span>
                            <span className="text-sm text-muted-foreground">
                              {item.count} ({item.percentage}%)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${item.percentage}%`, backgroundColor: COLORS[i % COLORS.length] }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
