"use client"

import { useEffect, useRef, useState } from "react"
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
  Gauge,
  Building2,
  FolderKanban,
  CalendarClock,
  TrendingUp,
  ArrowRight,
  RefreshCw,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  BarChart,
  Bar,
  ReferenceLine,
  LabelList,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { ObjectiveGauge } from "@/components/dashboard/objective-gauge"

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

interface Objectives {
  accountsTarget: number
  projectsTarget: number
  accountsMonthlyTarget: number
  projectsMonthlyTarget: number
}

interface ObjectiveProgress {
  accountsCurrent: number
  projectsCurrent: number
  projectsActive: number
  projectsInactive: number
  accountsThisMonth: number
  projectsThisMonth: number
}

interface MonthlyObjectiveItem {
  month: string
  cuentas: number
  proyectos: number
  metaCuentas: number
  metaProyectos: number
}

const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

export default function CRMDashboardPage() {
  const { selectedAgencyId, selectedAgency, loading: agencyLoading } = useAgency()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
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

  const [objectives, setObjectives] = useState<Objectives>({
    accountsTarget: 0,
    projectsTarget: 0,
    accountsMonthlyTarget: 0,
    projectsMonthlyTarget: 0,
  })
  const [objectiveProgress, setObjectiveProgress] = useState<ObjectiveProgress>({
    accountsCurrent: 0,
    projectsCurrent: 0,
    projectsActive: 0,
    projectsInactive: 0,
    accountsThisMonth: 0,
    projectsThisMonth: 0,
  })
  const [monthlyObjectives, setMonthlyObjectives] = useState<MonthlyObjectiveItem[]>([])

  const supabase = createClient()

  // Referencia estable a la última versión de la carga, para invocarla desde
  // listeners sin capturar valores obsoletos.
  const fetchRef = useRef<(silent?: boolean) => void>(() => {})

  useEffect(() => {
    // Esperar a que el contexto de agencias termine de cargar; luego cargar
    // datos tanto para una agencia específica como para el modo global.
    if (!agencyLoading) {
      fetchDashboardData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgencyId, agencyLoading])

  // Refrescar automáticamente al regresar a la página (cambio de pestaña o de
  // ruta), para reflejar cambios en cuentas, proyectos, metas y prospectos
  // hechos en otras secciones.
  useEffect(() => {
    const onFocus = () => fetchRef.current?.(true)
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchRef.current?.(true)
    }
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  const fetchDashboardData = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)

    // Modo global: sin agencia seleccionada se muestran datos de todas las agencias.
    const isGlobal = !selectedAgencyId
    // Aplica el filtro por agencia solo cuando hay una seleccionada.
    const byAgency = <T extends { eq: (col: string, val: any) => T }>(q: T): T =>
      isGlobal ? q : q.eq("agency_id", selectedAgencyId)

    const [
      { data: prospects },
      { data: stages },
      { data: sources },
      { data: staff },
      { data: agency },
      { data: accounts },
      { data: projects },
    ] = await Promise.all([
      byAgency(
        supabase
          .from("crm_prospects")
          .select("id, status, estimated_value, created_at, lost_reason, stage_id, source_id, assigned_to"),
      ),
      byAgency(
        supabase.from("crm_pipeline_stages").select("id, name, color, is_won, is_lost, sort_order"),
      ),
      byAgency(supabase.from("crm_lead_sources").select("id, name")),
      byAgency(supabase.from("staff").select("id, first_name, last_name")),
      // Settings (metas): una agencia o todas. Siempre se resuelve como arreglo.
      isGlobal
        ? supabase.from("agencies").select("settings")
        : supabase.from("agencies").select("settings").eq("id", selectedAgencyId),
      // Cuentas: solo tipo retainer, filtradas por agencia o globales.
      isGlobal
        ? supabase.from("accounts").select("id, status, created_at, account_type").eq("account_type", "retainer")
        : supabase
            .from("accounts")
            .select("id, status, created_at, account_type")
            .eq("account_type", "retainer")
            .eq("agency_id", selectedAgencyId),
      // Proyectos: todos o los de las cuentas de la agencia seleccionada.
      isGlobal
        ? supabase.from("projects").select("id, created_at, status")
        : supabase
            .from("projects")
            .select("id, created_at, status, accounts!inner(agency_id)")
            .eq("accounts.agency_id", selectedAgencyId),
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

    // ----- Objetivos de operación y venta (settings de la agencia) -----
    // En modo global se suman las metas de todas las agencias.
    const agencyList = (Array.isArray(agency) ? agency : agency ? [agency] : []) as any[]
    const objectivesData: Objectives = agencyList.reduce(
      (acc, a) => {
        const o = a?.settings?.objectives || {}
        acc.accountsTarget += Number(o.accounts_target) || 0
        acc.projectsTarget += Number(o.projects_target) || 0
        acc.accountsMonthlyTarget += Number(o.accounts_monthly_target) || 0
        acc.projectsMonthlyTarget += Number(o.projects_monthly_target) || 0
        return acc
      },
      { accountsTarget: 0, projectsTarget: 0, accountsMonthlyTarget: 0, projectsMonthlyTarget: 0 } as Objectives,
    )
    setObjectives(objectivesData)

    const accountRows = (accounts || []) as {
      id: string
      status: string | null
      created_at: string | null
      account_type: string | null
    }[]
    const projectRows = (projects || []) as { id: string; created_at: string | null; status: string | null }[]

    // "Cuentas" se define igual que la sección Cuentas: solo tipo retainer.
    const retainerRows = accountRows.filter((a) => a.account_type === "retainer")

    const now = new Date()
    const curYear = now.getFullYear()
    const curMonth = now.getMonth()

    const isThisMonth = (iso: string | null) => {
      if (!iso) return false
      const d = new Date(iso)
      return d.getFullYear() === curYear && d.getMonth() === curMonth
    }

    const accountsCurrent = retainerRows.filter((a) => a.status === "active").length
    const projectsCurrent = projectRows.length
    const projectsActive = projectRows.filter((p) => p.status === "in_progress").length
    const projectsInactive = projectsCurrent - projectsActive
    const accountsThisMonth = retainerRows.filter((a) => isThisMonth(a.created_at)).length
    const projectsThisMonth = projectRows.filter((p) => isThisMonth(p.created_at)).length

    setObjectiveProgress({
      accountsCurrent,
      projectsCurrent,
      projectsActive,
      projectsInactive,
      accountsThisMonth,
      projectsThisMonth,
    })

    // Serie mensual del año en curso: nuevas cuentas y proyectos vs meta mensual.
    const monthly: MonthlyObjectiveItem[] = Array.from({ length: 12 }, (_, m) => ({
      month: MONTHS_ES[m],
      cuentas: retainerRows.filter((a) => {
        if (!a.created_at) return false
        const d = new Date(a.created_at)
        return d.getFullYear() === curYear && d.getMonth() === m
      }).length,
      proyectos: projectRows.filter((p) => {
        if (!p.created_at) return false
        const d = new Date(p.created_at)
        return d.getFullYear() === curYear && d.getMonth() === m
      }).length,
      metaCuentas: objectivesData.accountsMonthlyTarget,
      metaProyectos: objectivesData.projectsMonthlyTarget,
    }))
    setMonthlyObjectives(monthly)

    setLoading(false)
    setRefreshing(false)
  }

  // Mantener el ref apuntando a la función más reciente en cada render.
  fetchRef.current = fetchDashboardData

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

  // Embudo de venta enfocado: Ganados -> Cuentas activas -> Objetivo de venta.
  const wonCount = stats.won
  const activeAccounts = objectiveProgress.accountsCurrent
  const salesTarget = objectives.accountsTarget

  const funnelStages = [
    { key: "won", name: "Ganados", value: wonCount, color: "#ca8a04", icon: Trophy },
    { key: "active", name: "Cuentas activas", value: activeAccounts, color: "#16a34a", icon: Building2 },
    { key: "target", name: "Objetivo de venta", value: salesTarget, color: "#2563eb", icon: Target },
  ]
  const funnelTop = Math.max(wonCount, activeAccounts, salesTarget, 1)
  // Conversión de ganados a cuentas activas.
  const wonToActivePct = wonCount > 0 ? Math.round((activeAccounts / wonCount) * 100) : 0
  // Avance de cuentas activas hacia el objetivo de venta.
  const targetProgressPct = salesTarget > 0 ? Math.min(100, Math.round((activeAccounts / salesTarget) * 100)) : 0
  const remainingToTarget = Math.max(0, salesTarget - activeAccounts)

  const monthPct = (current: number, target: number) =>
    target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
  const accountsMonthPct = monthPct(objectiveProgress.accountsThisMonth, objectives.accountsMonthlyTarget)
  const projectsMonthPct = monthPct(objectiveProgress.projectsThisMonth, objectives.projectsMonthlyTarget)
  const currentMonthName = new Date().toLocaleDateString("es-MX", { month: "long" })
  const hasObjectives =
    objectives.accountsTarget > 0 ||
    objectives.projectsTarget > 0 ||
    objectives.accountsMonthlyTarget > 0 ||
    objectives.projectsMonthlyTarget > 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {selectedAgency
              ? `Desempeño comercial de ${selectedAgency.name} frente a sus objetivos`
              : "Desempeño comercial global de todas las agencias"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchDashboardData(true)} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Actualizando..." : "Actualizar"}
          </Button>
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

      {/* ===== Panel de Objetivos ===== */}
      {!hasObjectives ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <div className="rounded-full bg-muted p-3">
              <Target className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">Sin objetivos configurados</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Define los objetivos de operación y de venta en Agencias → Objetivos para ver aquí tu avance con
              tacómetros e indicadores.
            </p>
            <Button variant="outline" size="sm" asChild className="mt-2">
              <Link href="/dashboard/agencies">
                <Target className="mr-2 h-4 w-4" />
                Configurar objetivos
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Tacómetros de objetivos de operación */}
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
            <CardHeader className="border-b bg-card/40">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gauge className="h-5 w-5 text-primary" />
                Objetivos de operación
              </CardTitle>
              <CardDescription>Avance total de cuentas y proyectos frente a la meta de la agencia.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr_1.1fr]">
                <div className="flex flex-col items-center justify-center rounded-xl border bg-card/60 p-4">
                  <ObjectiveGauge
                    label="Cuentas activas"
                    current={objectiveProgress.accountsCurrent}
                    target={objectives.accountsTarget}
                    color="var(--chart-1)"
                    icon={Building2}
                  />
                </div>
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card/60 p-4">
                  <ObjectiveGauge
                    label="Proyectos"
                    current={objectiveProgress.projectsCurrent}
                    target={objectives.projectsTarget}
                    color="var(--chart-2)"
                    icon={FolderKanban}
                  />
                  <div className="flex items-center justify-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[var(--chart-2)]" aria-hidden="true" />
                      <span className="text-muted-foreground">Activos</span>
                      <span className="font-semibold tabular-nums text-foreground">
                        {objectiveProgress.projectsActive}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" aria-hidden="true" />
                      <span className="text-muted-foreground">Inactivos</span>
                      <span className="font-semibold tabular-nums text-foreground">
                        {objectiveProgress.projectsInactive}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Objetivos del mes en curso */}
                <div className="flex flex-col gap-3 rounded-xl border bg-card/60 p-4">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">
                      Metas de venta · <span className="capitalize">{currentMonthName}</span>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" /> Cuentas del mes
                      </span>
                      <span className="font-semibold tabular-nums">
                        {objectiveProgress.accountsThisMonth} / {objectives.accountsMonthlyTarget || "—"}
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[var(--chart-1)] transition-all"
                        style={{ width: `${accountsMonthPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <FolderKanban className="h-3.5 w-3.5" /> Proyectos del mes
                      </span>
                      <span className="font-semibold tabular-nums">
                        {objectiveProgress.projectsThisMonth} / {objectives.projectsMonthlyTarget || "—"}
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[var(--chart-2)] transition-all"
                        style={{ width: `${projectsMonthPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
                    <div className="rounded-lg bg-muted/60 p-2 text-center">
                      <div className="text-lg font-bold tabular-nums text-[var(--chart-1)]">{accountsMonthPct}%</div>
                      <div className="text-[11px] text-muted-foreground">Cuentas</div>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-2 text-center">
                      <div className="text-lg font-bold tabular-nums text-[var(--chart-2)]">{projectsMonthPct}%</div>
                      <div className="text-[11px] text-muted-foreground">Proyectos</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Embudo de venta hacia el objetivo + Objetivos por mes */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Embudo de venta hacia objetivos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Embudo de venta hacia el objetivo
                </CardTitle>
                <CardDescription>De cuentas ganadas a activas y su avance hacia la meta de venta.</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Funnel visual centrado (trapecios) */}
                <div className="flex flex-col items-center gap-1.5">
                  {funnelStages.map((stage, i) => {
                    const widthPct = Math.max(22, (stage.value / funnelTop) * 100)
                    const nextWidthPct =
                      i < funnelStages.length - 1
                        ? Math.max(22, (funnelStages[i + 1].value / funnelTop) * 100)
                        : widthPct
                    const StageIcon = stage.icon
                    // Etiqueta de conversión entre etapas.
                    const connectorLabel =
                      i === 0 ? `${wonToActivePct}% se activan` : i === 1 ? `${targetProgressPct}% del objetivo` : null
                    return (
                      <div key={stage.key} className="flex w-full flex-col items-center">
                        <div
                          className="relative flex items-center justify-center py-4 text-white shadow-sm transition-all"
                          style={{
                            width: `${widthPct}%`,
                            minWidth: "160px",
                            backgroundColor: stage.color,
                            clipPath: `polygon(0 0, 100% 0, ${50 + nextWidthPct / widthPct / 2 * 50}% 100%, ${50 - nextWidthPct / widthPct / 2 * 50}% 100%)`,
                            borderRadius: i === 0 ? "0.5rem 0.5rem 0 0" : "0",
                          }}
                        >
                          <div className="flex flex-col items-center gap-0.5 px-2 text-center">
                            <div className="flex items-center gap-1.5">
                              <StageIcon className="h-4 w-4 opacity-90" />
                              <span className="text-xs font-medium opacity-95">{stage.name}</span>
                            </div>
                            <span className="text-2xl font-bold tabular-nums leading-none">{stage.value}</span>
                          </div>
                        </div>
                        {connectorLabel && (
                          <div className="my-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                            <ArrowRight className="h-3 w-3 rotate-90" />
                            {connectorLabel}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Avance hacia el objetivo de venta */}
                <div className="mt-4 rounded-lg border bg-muted/40 p-3">
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Target className="h-4 w-4 text-[#2563eb]" />
                      Avance al objetivo
                    </span>
                    <span className="font-bold tabular-nums text-[#2563eb]">{targetProgressPct}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[#2563eb] transition-all"
                      style={{ width: `${targetProgressPct}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {remainingToTarget > 0 ? (
                      <>
                        Faltan <span className="font-semibold text-foreground">{remainingToTarget}</span> cuentas para
                        alcanzar la meta de <span className="font-semibold text-foreground">{salesTarget}</span>.
                      </>
                    ) : (
                      <span className="font-semibold text-[#16a34a]">¡Objetivo de venta alcanzado!</span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Objetivos de cada mes del año */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  Ventas por mes del año
                </CardTitle>
                <CardDescription>Cuentas nuevas por mes frente a la meta mensual.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyObjectives} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradCuentas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#16a34a" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#16a34a" stopOpacity={0.55} />
                        </linearGradient>
                        <linearGradient id="gradProyectos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity={0.55} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                      <XAxis
                        dataKey="month"
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend iconType="circle" />
                      {objectives.accountsMonthlyTarget > 0 && (
                        <ReferenceLine
                          y={objectives.accountsMonthlyTarget}
                          stroke="#16a34a"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          label={{
                            value: `Meta cuentas ${objectives.accountsMonthlyTarget}`,
                            position: "insideTopRight",
                            fill: "#16a34a",
                            fontSize: 10,
                          }}
                        />
                      )}
                      <Bar dataKey="cuentas" name="Cuentas" fill="url(#gradCuentas)" radius={[6, 6, 0, 0]} barSize={18}>
                        <LabelList dataKey="cuentas" position="top" className="fill-muted-foreground text-[10px]" />
                      </Bar>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                {objectives.accountsMonthlyTarget > 0 && (
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Meta mensual: {objectives.accountsMonthlyTarget} cuentas
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

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
