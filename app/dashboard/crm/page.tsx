"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useAgency } from "@/contexts/agency-context"
import { 
  Target, 
  UserPlus, 
  TrendingUp, 
  TrendingDown,
  Calendar, 
  Phone, 
  Clock,
  CheckCircle,
  DollarSign,
  Users,
  Kanban,
  Settings2,
  Eye,
  AlertTriangle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
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
  BarChart,
  Bar,
} from "recharts"

interface DashboardStats {
  totalLeads: number
  totalLeadsChange: number
  newLeads: number
  newLeadsChange: number
  contacted: number
  contactedChange: number
  qualified: number
  qualifiedChange: number
  scheduledAppointments: number
  scheduledAppointmentsChange: number
  confirmedAppointments: number
  confirmedAppointmentsChange: number
  completedVisits: number
  completedVisitsChange: number
  closedSales: number
  closedSalesChange: number
  conversionRate: number
  avgResponseTime: number
  lostLeads: number
  noFollowUp: number
  pipelineValue: number
  activeProjects: number
  activeAdvisors: number
  activeLeads: number
}

interface FunnelData {
  name: string
  value: number
  color: string
}

interface SourceData {
  name: string
  value: number
  color: string
}

interface TrendData {
  month: string
  leads: number
  sales: number
}

interface AdvisorData {
  name: string
  conversions: number
  total: number
  rate: number
}

interface LossReason {
  reason: string
  percentage: number
  color: string
}

interface MonthlyGoal {
  name: string
  current: number
  target: number
  percentage: number
}

export default function CRMDashboardPage() {
  const { selectedAgencyId, loading: agencyLoading } = useAgency()
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30")
  
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 875,
    totalLeadsChange: 12,
    newLeads: 45,
    newLeadsChange: 8,
    contacted: 156,
    contactedChange: 5,
    qualified: 234,
    qualifiedChange: 15,
    scheduledAppointments: 28,
    scheduledAppointmentsChange: 3,
    confirmedAppointments: 22,
    confirmedAppointmentsChange: -2,
    completedVisits: 18,
    completedVisitsChange: 10,
    closedSales: 12,
    closedSalesChange: 20,
    conversionRate: 8.5,
    avgResponseTime: 4.2,
    lostLeads: 67,
    noFollowUp: 23,
    pipelineValue: 156000000,
    activeProjects: 4,
    activeAdvisors: 6,
    activeLeads: 10,
  })

  const [funnelData] = useState<FunnelData[]>([
    { name: "Leads", value: 875, color: "#22c55e" },
    { name: "Contactados", value: 650, color: "#06b6d4" },
    { name: "Calificados", value: 234, color: "#eab308" },
    { name: "Citas", value: 89, color: "#a855f7" },
    { name: "Visitas", value: 45, color: "#ef4444" },
    { name: "Ventas", value: 12, color: "#22c55e" },
  ])

  const [sourceData] = useState<SourceData[]>([
    { name: "Google Ads", value: 245, color: "#22c55e" },
    { name: "Meta Ads", value: 312, color: "#06b6d4" },
    { name: "Landing", value: 156, color: "#eab308" },
    { name: "Referidos", value: 89, color: "#a855f7" },
    { name: "WhatsApp", value: 45, color: "#ef4444" },
    { name: "Otros", value: 28, color: "#d1d5db" },
  ])

  const [trendData] = useState<TrendData[]>([
    { month: "Ene", leads: 120, sales: 8 },
    { month: "Feb", leads: 145, sales: 10 },
    { month: "Mar", leads: 180, sales: 12 },
    { month: "Abr", leads: 210, sales: 15 },
    { month: "May", leads: 195, sales: 14 },
    { month: "Jun", leads: 245, sales: 18 },
  ])

  const [advisorData] = useState<AdvisorData[]>([
    { name: "Laura M.", conversions: 4, total: 28, rate: 14.3 },
    { name: "Carlos R.", conversions: 5, total: 32, rate: 15.6 },
    { name: "Sofia T.", conversions: 3, total: 15, rate: 20 },
    { name: "Miguel H.", conversions: 2, total: 25, rate: 8 },
    { name: "Andrea L.", conversions: 2, total: 8, rate: 25 },
  ])

  const [lossReasons] = useState<LossReason[]>([
    { reason: "Presupuesto", percentage: 35, color: "#22c55e" },
    { reason: "Competencia", percentage: 25, color: "#06b6d4" },
    { reason: "Ubicación", percentage: 20, color: "#eab308" },
    { reason: "Tiempo", percentage: 12, color: "#3b82f6" },
    { reason: "Otros", percentage: 8, color: "#ef4444" },
  ])

  const [monthlyGoals] = useState<MonthlyGoal[]>([
    { name: "Ventas", current: 12, target: 20, percentage: 60 },
    { name: "Citas", current: 28, target: 40, percentage: 70 },
    { name: "Leads Calificados", current: 234, target: 300, percentage: 78 },
  ])

  const supabase = createClient()

  useEffect(() => {
    if (selectedAgencyId) {
      fetchDashboardData()
    } else {
      setLoading(false)
    }
  }, [selectedAgencyId, dateRange])

  const fetchDashboardData = async () => {
    if (!selectedAgencyId) return
    setLoading(true)
    
    // Fetch real data from database
    const { data: prospects } = await supabase
      .from("crm_prospects")
      .select(`
        id, status, estimated_value, created_at,
        stage:crm_pipeline_stages(id, name, color, is_won)
      `)
      .eq("agency_id", selectedAgencyId)

    if (prospects && prospects.length > 0) {
      const active = prospects.filter(p => p.status === "active")
      const won = prospects.filter(p => (p.stage as any)?.is_won)
      const totalValue = active.reduce((sum, p) => sum + (p.estimated_value || 0), 0)
      
      setStats(prev => ({
        ...prev,
        totalLeads: prospects.length,
        pipelineValue: totalValue,
        closedSales: won.length,
        activeLeads: active.length,
      }))
    }

    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}m MXN`
    }
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const renderChangeIndicator = (change: number) => {
    const isPositive = change >= 0
    return (
      <span className={`flex items-center text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {isPositive ? '+' : ''}{change}% vs mes anterior
      </span>
    )
  }

  const getCurrentMonth = () => {
    return new Date().toLocaleDateString('es-ES', { month: 'long' })
  }

  if (loading || agencyLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen general de rendimiento comercial
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              En vivo
            </span>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Configuración */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configuración</CardTitle>
        </CardHeader>
        <CardContent>
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
              <Link href="/dashboard/crm/reassign">
                <Users className="mr-2 h-4 w-4" />
                Reasignar
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
        </CardContent>
      </Card>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Embudo de Conversión</CardTitle>
            <CardDescription>Progreso de leads a través del pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnelData.map((item, index) => {
                const maxValue = funnelData[0].value
                const width = (item.value / maxValue) * 100
                return (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-24 text-sm text-muted-foreground">{item.name}</div>
                    <div className="flex-1">
                      <div 
                        className="h-6 rounded transition-all"
                        style={{ 
                          width: `${width}%`, 
                          backgroundColor: item.color,
                          minWidth: '20px'
                        }}
                      />
                    </div>
                    <div className="w-16 text-right text-sm font-medium">{item.value}</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Leads by Source - Donut Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Leads por Fuente</CardTitle>
            <CardDescription>Distribución de leads por canal de adquisición</CardDescription>
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
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                {sourceData.map((source) => (
                  <div key={source.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: source.color }}
                    />
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
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia Mensual</CardTitle>
            <CardDescription>Leads y ventas por mes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Advisor Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento por Asesor</CardTitle>
            <CardDescription>Leads activos y tasa de conversión</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {advisorData.map((advisor) => (
                <div key={advisor.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{advisor.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {advisor.conversions}/{advisor.total} ({advisor.rate}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-green-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${(advisor.total / 40) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Loss Reasons */}
        <Card>
          <CardHeader>
            <CardTitle>Razones de Pérdida</CardTitle>
            <CardDescription>Principales motivos de leads perdidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lossReasons.map((item) => (
                <div key={item.reason} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.reason}</span>
                    <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Goals */}
        <Card>
          <CardHeader>
            <CardTitle>Meta Mensual</CardTitle>
            <CardDescription>Progreso hacia objetivos de {getCurrentMonth()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {monthlyGoals.map((goal) => (
                <div key={goal.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{goal.name}</span>
                    <span className="text-sm font-medium">{goal.current} / {goal.target}</span>
                  </div>
                  <div className="h-3 w-full bg-green-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${goal.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {goal.percentage}% completado - Faltan {goal.target - goal.current} {goal.name.toLowerCase()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
