"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"
import { useAgency } from "@/contexts/agency-context"
import {
  Target,
  UserPlus,
  Users,
  Kanban,
  Settings2,
  DollarSign,
  Trophy,
  Layers,
  Percent,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

// Paleta consistente para gráficas (verde primario + apoyos)
const PALETTE = ["#16a34a", "#0891b2", "#ca8a04", "#7c3aed", "#dc2626", "#2563eb", "#db2777", "#0d9488", "#9ca3af"]

interface Stage {
  id: string
  name: string
  color: string | null
  is_won: boolean
  is_lost: boolean
  sort_order: number | null
}

interface Prospect {
  id: string
  status: string | null
  estimated_value: number | null
  created_at: string | null
  lost_reason: string | null
  stage_id: string | null
  source_id: string | null
  assigned_to: string | null
}

interface FunnelItem {
  name: string
  value: number
  color: string
}

interface NamedValue {
  name: string
  value: number
  color: string
}

interface TrendItem {
  month: string
  leads: number
  ganados: number
}

interface AdvisorItem {
  name: string
  total: number
  won: number
  rate: number
}

interface LossItem {
  reason: string
  value: number
  percentage: number
  color: string
}

interface Stats {
  total: number
  active: number
  inPipeline: number
  won: number
  lost: number
  pipelineValue: number
  avgTicket: number
  conversionRate: number
}

const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

export default function CRMDashboardPage() {
  const { selectedAgencyId, loading: agencyLoading } = useAgency()
  const [loading, setLoading] = useState(true)
  const [hasData, setHasData] = useState(false)

  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    inPipeline: 0,
    won: 0,
    lost: 0,
    pipelineValue: 0,
    avgTicket: 0,
    conversionRate: 0,
  })
  const [funnelData, setFunnelData] = useState<FunnelItem[]>([])
  const [sourceData, setSourceData] = useState<NamedValue[]>([])
  const [trendData, setTrendData] = useState<TrendItem[]>([])
  const [advisorData, setAdvisorData] = useState<AdvisorItem[]>([])
  const [lossReasons, setLossReasons] = useState<LossItem[]>([])

  const supabase = createClient()

  useEffect(() => {
    if (selectedAgencyId) {
      fetchDashboardData()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgencyId])

  const fetchDashboardData = async () => {
    if (!selectedAgencyId) return
    setLoading(true)

    const [{ data: prospects }, { data: stages }, { data: sources }, { data: staff }] = await Promise.all([
      supabase
        .from("crm_prospects")
        .select("id, status, estimated_value, created_at, lost_reason, stage_id, source_id, assigned_to")
        .eq("agency_id", selectedAgencyId),
      supabase
        .from("crm_pipeline_stages")
        .select("id, name, color, is_won, is_lost, sort_order")
        .eq("agency_id", selectedAgencyId),
      supabase.from("crm_lead_sources").select("id, name").eq("agency_id", selectedAgencyId),
      supabase.from("staff").select("id, first_name, last_name").eq("agency_id", selectedAgencyId),
    ])

    const rows = (prospects || []) as Prospect[]
    const stageList = (stages || []) as Stage[]
    const stageMap = new Map(stageList.map((s) => [s.id, s]))
    const sourceMap = new Map((sources || []).map((s: any) => [s.id, s.name as string]))
    const staffMap = new Map((staff || []).map((s: any) => [s.id, `${s.first_name} ${s.last_name}`.trim()]))

    setHasData(rows.length > 0)

    // ----- KPIs -----
    const total = rows.length
    const wonRows = rows.filter((p) => stageMap.get(p.stage_id || "")?.is_won)
    const lostRows = rows.filter((p) => p.status === "lost" || stageMap.get(p.stage_id || "")?.is_lost)
    const won = wonRows.length
    const lost = lostRows.length
    const active = rows.filter((p) => p.status === "active").length
    const inPipeline = rows.filter((p) => {
      const st = stageMap.get(p.stage_id || "")
      return !st?.is_won && !st?.is_lost
    }).length
    const valued = rows.filter((p) => (p.estimated_value || 0) > 0)
    const pipelineValue = rows
      .filter((p) => {
        const st = stageMap.get(p.stage_id || "")
        return !st?.is_lost
      })
      .reduce((sum, p) => sum + (p.estimated_value || 0), 0)
    const avgTicket = valued.length ? valued.reduce((s, p) => s + (p.estimated_value || 0), 0) / valued.length : 0
    const conversionRate = total ? (won / total) * 100 : 0

    setStats({ total, active, inPipeline, won, lost, pipelineValue, avgTicket, conversionRate })

    // ----- Funnel por etapa (ordenado por sort_order) -----
    const stageCounts = new Map<string, number>()
    for (const p of rows) {
      const key = p.stage_id || "none"
      stageCounts.set(key, (stageCounts.get(key) || 0) + 1)
    }
    const funnel: FunnelItem[] = stageList
      .slice()
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
      .map((s, i) => ({
        name: s.name,
        value: stageCounts.get(s.id) || 0,
        color: s.color || PALETTE[i % PALETTE.length],
      }))
      .filter((f) => f.value > 0)
    setFunnelData(funnel)

    // ----- Fuentes -----
    const sourceCounts = new Map<string, number>()
    for (const p of rows) {
      const name = p.source_id ? sourceMap.get(p.source_id) || "Sin fuente" : "Sin fuente"
      sourceCounts.set(name, (sourceCounts.get(name) || 0) + 1)
    }
    const sourceArr: NamedValue[] = Array.from(sourceCounts.entries())
      .map(([name, value], i) => ({ name, value, color: PALETTE[i % PALETTE.length] }))
      .sort((a, b) => b.value - a.value)
    setSourceData(sourceArr)

    // ----- Tendencia mensual (por created_at) -----
    const monthCounts = new Map<string, { leads: number; ganados: number }>()
    for (const p of rows) {
      if (!p.created_at) continue
      const d = new Date(p.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const entry = monthCounts.get(key) || { leads: 0, ganados: 0 }
      entry.leads += 1
      if (stageMap.get(p.stage_id || "")?.is_won) entry.ganados += 1
      monthCounts.set(key, entry)
    }
    const trend: TrendItem[] = Array.from(monthCounts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, v]) => {
        const [y, m] = key.split("-")
        return { month: `${MONTHS_ES[Number(m) - 1]} ${y.slice(2)}`, leads: v.leads, ganados: v.ganados }
      })
    setTrendData(trend)

    // ----- Rendimiento por asesor -----
    const advisorCounts = new Map<string, { total: number; won: number }>()
    for (const p of rows) {
      const name = p.assigned_to ? staffMap.get(p.assigned_to) || "Sin asignar" : "Sin asignar"
      const entry = advisorCounts.get(name) || { total: 0, won: 0 }
      entry.total += 1
      if (stageMap.get(p.stage_id || "")?.is_won) entry.won += 1
      advisorCounts.set(name, entry)
    }
    const advisors: AdvisorItem[] = Array.from(advisorCounts.entries())
      .map(([name, v]) => ({ name, total: v.total, won: v.won, rate: v.total ? (v.won / v.total) * 100 : 0 }))
      .sort((a, b) => b.total - a.total)
    setAdvisorData(advisors)

    // ----- Razones de pérdida -----
    const lossCounts = new Map<string, number>()
    for (const p of lostRows) {
      const reason = p.lost_reason?.trim() || "Sin especificar"
      lossCounts.set(reason, (lossCounts.get(reason) || 0) + 1)
    }
    const lossTotal = Array.from(lossCounts.values()).reduce((a, b) => a + b, 0)
    const losses: LossItem[] = Array.from(lossCounts.entries())
      .map(([reason, value], i) => ({
        reason,
        value,
        percentage: lossTotal ? Math.round((value / lossTotal) * 100) : 0,
        color: PALETTE[i % PALETTE.length],
      }))
      .sort((a, b) => b.value - a.value)
    setLossReasons(losses)

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
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-72" />
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
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Selecciona una Agencia</h2>
          <p className="text-muted-foreground max-w-md">
            Para ver el dashboard del CRM, primero selecciona una agencia en el selector de arriba.
          </p>
        </div>
      </div>
    )
  }

  const kpis = [
    { label: "Prospectos totales", value: stats.total.toLocaleString("es-MX"), icon: Users, hint: `${stats.active} activos` },
    { label: "En pipeline", value: stats.inPipeline.toLocaleString("es-MX"), icon: Layers, hint: "Sin cerrar" },
    { label: "Ganados", value: stats.won.toLocaleString("es-MX"), icon: Trophy, hint: `${stats.lost} perdidos` },
    {
      label: "Tasa de conversión",
      value: `${stats.conversionRate.toFixed(1)}%`,
      icon: Percent,
      hint: "Ganados / total",
    },
    {
      label: "Valor de pipeline",
      value: formatCurrency(stats.pipelineValue),
      icon: DollarSign,
      hint: "Oportunidades abiertas",
    },
    {
      label: "Ticket promedio",
      value: formatCurrency(stats.avgTicket),
      icon: Target,
      hint: "Valor estimado prom.",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Resumen general basado en tus prospectos reales</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/crm/pipeline/settings">
              <Settings2 className="mr-2 h-4 w-4" />
              Ajustar Pipeline
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/crm/lead-sources">
              <Target className="mr-2 h-4 w-4" />
              Fuentes de Lead
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/crm/pipeline">
              <Kanban className="mr-2 h-4 w-4" />
              Ver Pipeline
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/dashboard/crm/prospects/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo Prospecto
            </Link>
          </Button>
        </div>
      </div>

      {!hasData ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Sin prospectos todavía</h2>
            <p className="text-muted-foreground max-w-md">
              Cuando registres o importes prospectos para esta agencia, aquí verás sus métricas en tiempo real.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {kpis.map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{kpi.label}</span>
                    <kpi.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="mt-2 text-2xl font-bold">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{kpi.hint}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Funnel por etapa */}
            <Card>
              <CardHeader>
                <CardTitle>Embudo por Etapa</CardTitle>
                <CardDescription>Distribución de prospectos en el pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                {funnelData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Sin datos de etapas.</p>
                ) : (
                  <div className="space-y-3">
                    {funnelData.map((item) => {
                      const maxValue = Math.max(...funnelData.map((f) => f.value))
                      const width = maxValue ? (item.value / maxValue) * 100 : 0
                      return (
                        <div key={item.name} className="flex items-center gap-3">
                          <div className="w-32 text-sm text-muted-foreground truncate" title={item.name}>
                            {item.name}
                          </div>
                          <div className="flex-1 bg-muted rounded">
                            <div
                              className="h-6 rounded transition-all"
                              style={{ width: `${width}%`, backgroundColor: item.color, minWidth: "8px" }}
                            />
                          </div>
                          <div className="w-12 text-right text-sm font-medium">{item.value}</div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fuentes */}
            <Card>
              <CardHeader>
                <CardTitle>Prospectos por Fuente</CardTitle>
                <CardDescription>Distribución por canal de adquisición</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sourceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {sourceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 grid gap-3">
                    {sourceData.map((source) => (
                      <div key={source.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: source.color }} />
                        <span className="text-sm text-muted-foreground">{source.name}</span>
                        <span className="text-sm font-medium ml-auto">{source.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Tendencia */}
            <Card>
              <CardHeader>
                <CardTitle>Tendencia Mensual</CardTitle>
                <CardDescription>Prospectos creados y ganados por mes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="leads"
                        name="Prospectos"
                        stroke="#16a34a"
                        fill="#16a34a"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="ganados"
                        name="Ganados"
                        stroke="#2563eb"
                        fill="#2563eb"
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Asesores */}
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento por Asesor</CardTitle>
                <CardDescription>Prospectos asignados y tasa de conversión</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {advisorData.map((advisor) => {
                    const maxTotal = Math.max(...advisorData.map((a) => a.total), 1)
                    return (
                      <div key={advisor.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{advisor.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {advisor.won}/{advisor.total} ({advisor.rate.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${(advisor.total / maxTotal) * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Razones de pérdida */}
          <Card>
            <CardHeader>
              <CardTitle>Razones de Pérdida</CardTitle>
              <CardDescription>Motivos de prospectos marcados como perdidos</CardDescription>
            </CardHeader>
            <CardContent>
              {lossReasons.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No hay prospectos perdidos registrados.
                </p>
              ) : (
                <div className="space-y-4">
                  {lossReasons.map((item) => (
                    <div key={item.reason} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.reason}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.value} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
