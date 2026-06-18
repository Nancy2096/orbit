"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAgency } from "@/contexts/agency-context"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Kanban,
  Calendar,
  ShoppingCart,
  UserCheck,
  Megaphone,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Timer,
  Award,
  AlertTriangle,
  Phone,
  Mail,
  MessageSquare,
  Eye,
  MousePointerClick,
  Share2,
  Globe,
  Facebook,
  Instagram,
  Package,
  Building,
} from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  Funnel,
  FunnelChart,
  LabelList,
} from "recharts"

interface StageMetric {
  stage_name: string
  stage_color: string
  count: number
  total_value: number
  order_index?: number
}

interface SourceMetric {
  source_name: string
  count: number
  total_value: number
  won_count: number
  conversion_rate: number
  cost_per_lead?: number
  roi?: number
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
  avg_response_time: number
  tasks_completed: number
  calls_made: number
  emails_sent: number
}

export default function MetricsPage() {
  const { selectedAgencyId, loading: agencyLoading } = useAgency()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<string>("month")
  const [selectedSalesRep, setSelectedSalesRep] = useState<string>("all")
  const [salesReps, setSalesReps] = useState<SalesRep[]>([])
  const [activeTab, setActiveTab] = useState("pipeline")
  
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
  
  const supabase = createClient()

  // Mock data for enhanced visualizations
  const monthlyTrend = [
    { month: "Ene", leads: 120, ventas: 8, valor: 2400000 },
    { month: "Feb", leads: 145, ventas: 12, valor: 3200000 },
    { month: "Mar", leads: 168, ventas: 15, valor: 4100000 },
    { month: "Abr", leads: 182, ventas: 14, valor: 3800000 },
    { month: "May", leads: 210, ventas: 18, valor: 5200000 },
    { month: "Jun", leads: 245, ventas: 22, valor: 6100000 },
  ]

  const forecastData = [
    { month: "Jul", proyectado: 7200000, optimista: 8500000, conservador: 5800000 },
    { month: "Ago", proyectado: 7800000, optimista: 9200000, conservador: 6200000 },
    { month: "Sep", proyectado: 8400000, optimista: 10000000, conservador: 6800000 },
    { month: "Oct", proyectado: 9100000, optimista: 11000000, conservador: 7500000 },
    { month: "Nov", proyectado: 9800000, optimista: 12000000, conservador: 8200000 },
    { month: "Dic", proyectado: 10500000, optimista: 13000000, conservador: 9000000 },
  ]

  const pipelineByStage = [
    { name: "Nuevos", value: 45, amount: 12500000, color: "#3b82f6" },
    { name: "Contactados", value: 32, amount: 9800000, color: "#06b6d4" },
    { name: "Calificados", value: 24, amount: 8200000, color: "#8b5cf6" },
    { name: "Propuesta", value: 18, amount: 6500000, color: "#f59e0b" },
    { name: "Negociación", value: 12, amount: 4800000, color: "#ef4444" },
    { name: "Cierre", value: 8, amount: 3200000, color: "#22c55e" },
  ]

  const salesByProduct = [
    { name: "Departamentos", value: 45, amount: 28500000 },
    { name: "Casas", value: 30, amount: 22000000 },
    { name: "Terrenos", value: 15, amount: 8500000 },
    { name: "Comercial", value: 10, amount: 12000000 },
  ]

  const channelPerformance = [
    { 
      name: "Google Ads", 
      leads: 312, 
      conversiones: 28, 
      costo: 45000, 
      ingresos: 8400000,
      cpl: 144,
      roi: 18567,
      ctr: 3.2,
      impressions: 125000,
    },
    { 
      name: "Meta Ads", 
      leads: 245, 
      conversiones: 22, 
      costo: 38000, 
      ingresos: 6200000,
      cpl: 155,
      roi: 16216,
      ctr: 2.8,
      impressions: 180000,
    },
    { 
      name: "Portal Inmuebles24", 
      leads: 189, 
      conversiones: 18, 
      costo: 25000, 
      ingresos: 5100000,
      cpl: 132,
      roi: 20300,
      ctr: 4.1,
      impressions: 45000,
    },
    { 
      name: "Referidos", 
      leads: 89, 
      conversiones: 15, 
      costo: 0, 
      ingresos: 4800000,
      cpl: 0,
      roi: 100,
      ctr: 0,
      impressions: 0,
    },
    { 
      name: "WhatsApp", 
      leads: 67, 
      conversiones: 8, 
      costo: 5000, 
      ingresos: 2400000,
      cpl: 75,
      roi: 47900,
      ctr: 0,
      impressions: 0,
    },
    { 
      name: "Landing Page", 
      leads: 156, 
      conversiones: 14, 
      costo: 12000, 
      ingresos: 3900000,
      cpl: 77,
      roi: 32400,
      ctr: 5.2,
      impressions: 32000,
    },
  ]

  const advisorPerformance = [
    { 
      name: "Laura Martínez", 
      leads: 45, 
      ventas: 8, 
      valor: 24500000, 
      conversion: 17.8,
      tiempoRespuesta: 12,
      tareas: 89,
      llamadas: 156,
      emails: 234,
      calificacion: 4.8,
    },
    { 
      name: "Carlos Rodríguez", 
      leads: 52, 
      ventas: 10, 
      valor: 31200000, 
      conversion: 19.2,
      tiempoRespuesta: 8,
      tareas: 95,
      llamadas: 178,
      emails: 267,
      calificacion: 4.9,
    },
    { 
      name: "Sofía Torres", 
      leads: 38, 
      ventas: 6, 
      valor: 18900000, 
      conversion: 15.8,
      tiempoRespuesta: 15,
      tareas: 72,
      llamadas: 134,
      emails: 198,
      calificacion: 4.6,
    },
    { 
      name: "Miguel Hernández", 
      leads: 41, 
      ventas: 5, 
      valor: 15600000, 
      conversion: 12.2,
      tiempoRespuesta: 22,
      tareas: 65,
      llamadas: 112,
      emails: 156,
      calificacion: 4.3,
    },
    { 
      name: "Andrea López", 
      leads: 35, 
      ventas: 7, 
      valor: 21800000, 
      conversion: 20.0,
      tiempoRespuesta: 10,
      tareas: 82,
      llamadas: 145,
      emails: 212,
      calificacion: 4.7,
    },
  ]

  const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"]

  useEffect(() => {
    if (selectedAgencyId) {
      fetchMetrics()
    } else {
      setLoading(false)
    }
  }, [period, selectedAgencyId, selectedSalesRep])

  const fetchMetrics = async () => {
    if (!selectedAgencyId) return
    setLoading(true)

    // Get date filter
    let dateFilter: Date | null = null
    if (period !== "all") {
      const now = new Date()
      if (period === "month") {
        dateFilter = new Date(now.getFullYear(), now.getMonth(), 1)
      } else if (period === "quarter") {
        const quarter = Math.floor(now.getMonth() / 3)
        dateFilter = new Date(now.getFullYear(), quarter * 3, 1)
      } else if (period === "year") {
        dateFilter = new Date(now.getFullYear(), 0, 1)
      }
    }

    // Fetch sales reps
    const { data: salesRepsData } = await supabase
      .from("staff")
      .select("id, first_name, last_name")
      .or(`agency_id.eq.${selectedAgencyId},is_global.eq.true`)
      .eq("is_active", true)
      .order("first_name")

    if (salesRepsData) setSalesReps(salesRepsData)

    // Fetch all prospects for this agency
    let query = supabase
      .from("crm_prospects")
      .select(`
        id, status, estimated_value, created_at, won_date, lost_date, assigned_to,
        stage:crm_pipeline_stages(id, name, color, is_won, is_lost, order_index),
        source:crm_lead_sources(id, name)
      `)
      .eq("agency_id", selectedAgencyId)

    if (dateFilter) {
      query = query.gte("created_at", dateFilter.toISOString())
    }

    if (selectedSalesRep !== "all") {
      query = query.eq("assigned_to", selectedSalesRep)
    }

    const { data: prospects } = await query

    if (prospects) {
      // Calculate main metrics
      const active = prospects.filter(p => p.status === "active")
      const won = prospects.filter(p => {
        const stage = p.stage as { is_won?: boolean } | null
        return stage?.is_won
      })
      const lost = prospects.filter(p => {
        const stage = p.stage as { is_lost?: boolean } | null
        return stage?.is_lost
      })

      const totalPipelineValue = active.reduce((sum, p) => sum + (p.estimated_value || 0), 0)
      const wonValue = won.reduce((sum, p) => sum + (p.estimated_value || 0), 0)
      const conversionRate = prospects.length > 0 ? (won.length / prospects.length) * 100 : 0
      const avgDealSize = won.length > 0 ? wonValue / won.length : 0

      // Calculate avg days to close
      const closedDeals = won.filter(p => p.won_date && p.created_at)
      const totalDays = closedDeals.reduce((sum, p) => {
        const created = new Date(p.created_at)
        const closed = new Date(p.won_date!)
        const days = Math.ceil((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
        return sum + days
      }, 0)
      const avgDaysToClose = closedDeals.length > 0 ? Math.round(totalDays / closedDeals.length) : 0

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

      // Calculate stage metrics
      const stageGroups: Record<string, StageMetric> = {}
      prospects.forEach(p => {
        if (p.stage && p.status === "active") {
          const stage = p.stage as { name: string; color: string; order_index?: number }
          const key = stage.name
          if (!stageGroups[key]) {
            stageGroups[key] = {
              stage_name: stage.name,
              stage_color: stage.color,
              count: 0,
              total_value: 0,
              order_index: stage.order_index,
            }
          }
          stageGroups[key].count++
          stageGroups[key].total_value += p.estimated_value || 0
        }
      })
      setStageMetrics(Object.values(stageGroups).sort((a, b) => (a.order_index || 0) - (b.order_index || 0)))

      // Calculate source metrics
      const sourceGroups: Record<string, SourceMetric> = {}
      prospects.forEach(p => {
        if (p.source) {
          const source = p.source as { name: string }
          const key = source.name
          if (!sourceGroups[key]) {
            sourceGroups[key] = {
              source_name: source.name,
              count: 0,
              total_value: 0,
              won_count: 0,
              conversion_rate: 0,
            }
          }
          sourceGroups[key].count++
          sourceGroups[key].total_value += p.estimated_value || 0
          const stage = p.stage as { is_won?: boolean } | null
          if (stage?.is_won) {
            sourceGroups[key].won_count++
          }
        }
      })
      
      // Calculate conversion rates for sources
      Object.values(sourceGroups).forEach(s => {
        s.conversion_rate = s.count > 0 ? (s.won_count / s.count) * 100 : 0
      })
      
      setSourceMetrics(Object.values(sourceGroups).sort((a, b) => b.count - a.count))
    }

    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    }
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatFullCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStageColorHex = (color: string) => {
    const colors: Record<string, string> = {
      blue: "#3b82f6",
      cyan: "#06b6d4",
      yellow: "#eab308",
      orange: "#f97316",
      purple: "#8b5cf6",
      green: "#22c55e",
      red: "#ef4444",
      pink: "#ec4899",
      indigo: "#6366f1",
      teal: "#14b8a6",
    }
    return colors[color] || "#6b7280"
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
            Para ver las metricas, primero selecciona una agencia en el selector de arriba.
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
          <h1 className="text-3xl font-bold tracking-tight">Metricas del CRM</h1>
          <p className="text-muted-foreground">
            Analiza el rendimiento de tu pipeline de ventas
          </p>
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="pipeline" className="flex items-center gap-2">
            <Kanban className="h-4 w-4" />
            <span className="hidden sm:inline">Pipeline</span>
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Forecast</span>
          </TabsTrigger>
          <TabsTrigger value="ventas" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Ventas</span>
          </TabsTrigger>
          <TabsTrigger value="asesores" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Asesores</span>
          </TabsTrigger>
          <TabsTrigger value="medios" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            <span className="hidden sm:inline">Medios</span>
          </TabsTrigger>
          <TabsTrigger value="servicios" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Servicios</span>
          </TabsTrigger>
          <TabsTrigger value="perdidas" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Perdidas</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Pipeline */}
        <TabsContent value="pipeline" className="space-y-6">
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Valor del Pipeline</p>
                    <p className="text-2xl font-bold">{formatCurrency(metrics.totalPipelineValue)}</p>
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <ArrowUpRight className="h-3 w-3" /> +12% vs mes anterior
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ingreso por Servicios</p>
                    <p className="text-3xl font-bold">{formatCurrency(4850000)}</p>
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <ArrowUpRight className="h-3 w-3" />
                      +25% vs mes anterior
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ticket Promedio</p>
                    <p className="text-3xl font-bold">{formatCurrency(31090)}</p>
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <ArrowUpRight className="h-3 w-3" />
                      +8% vs mes anterior
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Servicios Activos</p>
                    <p className="text-3xl font-bold">12</p>
                    <p className="text-xs text-muted-foreground mt-1">En catalogo</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Building className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Servicios mas vendidos y distribucion */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Servicios */}
            <Card>
              <CardHeader>
                <CardTitle>Servicios Mas Vendidos</CardTitle>
                <CardDescription>Ranking de servicios por unidades vendidas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart 
                    data={[
                      { name: 'Consultoria Digital', ventas: 45, ingresos: 1350000 },
                      { name: 'Desarrollo Web', ventas: 32, ingresos: 960000 },
                      { name: 'Marketing Digital', ventas: 28, ingresos: 840000 },
                      { name: 'SEO/SEM', ventas: 24, ingresos: 480000 },
                      { name: 'Branding', ventas: 15, ingresos: 600000 },
                      { name: 'Social Media', ventas: 12, ingresos: 360000 },
                    ]}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'ventas' ? `${value} unidades` : formatCurrency(value),
                        name === 'ventas' ? 'Ventas' : 'Ingresos'
                      ]}
                      contentStyle={{ borderRadius: '8px' }}
                    />
                    <Bar dataKey="ventas" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribucion de Ingresos por Servicio */}
            <Card>
              <CardHeader>
                <CardTitle>Distribucion de Ingresos</CardTitle>
                <CardDescription>Participacion de cada servicio en ingresos totales</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Consultoria Digital', value: 1350000, fill: '#22c55e' },
                        { name: 'Desarrollo Web', value: 960000, fill: '#3b82f6' },
                        { name: 'Marketing Digital', value: 840000, fill: '#a855f7' },
                        { name: 'SEO/SEM', value: 480000, fill: '#eab308' },
                        { name: 'Branding', value: 600000, fill: '#f97316' },
                        { name: 'Social Media', value: 360000, fill: '#06b6d4' },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tendencia de Servicios */}
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Ventas por Servicio</CardTitle>
              <CardDescription>Evolucion mensual de los principales servicios</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={[
                  { mes: 'Ene', consultoria: 8, desarrollo: 5, marketing: 4, seo: 3 },
                  { mes: 'Feb', consultoria: 10, desarrollo: 6, marketing: 5, seo: 4 },
                  { mes: 'Mar', consultoria: 9, desarrollo: 8, marketing: 6, seo: 5 },
                  { mes: 'Abr', consultoria: 12, desarrollo: 7, marketing: 7, seo: 5 },
                  { mes: 'May', consultoria: 14, desarrollo: 9, marketing: 8, seo: 6 },
                  { mes: 'Jun', consultoria: 15, desarrollo: 10, marketing: 9, seo: 7 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip contentStyle={{ borderRadius: '8px' }} />
                  <Legend />
                  <Area type="monotone" dataKey="consultoria" name="Consultoria" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="desarrollo" name="Desarrollo" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="marketing" name="Marketing" stackId="1" stroke="#a855f7" fill="#a855f7" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="seo" name="SEO/SEM" stackId="1" stroke="#eab308" fill="#eab308" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tabla de Servicios */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle por Servicio</CardTitle>
              <CardDescription>Metricas completas de cada servicio</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Servicio</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="text-right">Ticket Prom.</TableHead>
                    <TableHead className="text-right">% Total</TableHead>
                    <TableHead className="text-right">Tendencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { nombre: 'Consultoria Digital', unidades: 45, ingresos: 1350000, trend: 15 },
                    { nombre: 'Desarrollo Web', unidades: 32, ingresos: 960000, trend: 12 },
                    { nombre: 'Marketing Digital', unidades: 28, ingresos: 840000, trend: 8 },
                    { nombre: 'SEO/SEM', unidades: 24, ingresos: 480000, trend: -3 },
                    { nombre: 'Branding', unidades: 15, ingresos: 600000, trend: 20 },
                    { nombre: 'Social Media', unidades: 12, ingresos: 360000, trend: 5 },
                  ].map((servicio) => {
                    const totalIngresos = 4590000
                    const porcentaje = ((servicio.ingresos / totalIngresos) * 100).toFixed(1)
                    const ticketProm = servicio.ingresos / servicio.unidades
                    return (
                      <TableRow key={servicio.nombre}>
                        <TableCell className="font-medium">{servicio.nombre}</TableCell>
                        <TableCell className="text-right">{servicio.unidades}</TableCell>
                        <TableCell className="text-right">{formatCurrency(servicio.ingresos)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(ticketProm)}</TableCell>
                        <TableCell className="text-right">{porcentaje}%</TableCell>
                        <TableCell className="text-right">
                          <span className={`flex items-center justify-end gap-1 ${servicio.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {servicio.trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {Math.abs(servicio.trend)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Forecast */}
        <TabsContent value="forecast" className="space-y-6">
          {/* Forecast KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700">Proyeccion Q3</p>
                    <p className="text-2xl font-bold text-green-900">$23.4M</p>
                    <p className="text-xs text-green-600 mt-1">+18% vs Q2</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700">Pipeline Ponderado</p>
                    <p className="text-2xl font-bold text-blue-900">$18.7M</p>
                    <p className="text-xs text-blue-600 mt-1">80% probabilidad</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700">Deals en Cierre</p>
                    <p className="text-2xl font-bold text-purple-900">12</p>
                    <p className="text-xs text-purple-600 mt-1">$8.2M valor</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-700">Meta Anual</p>
                    <p className="text-2xl font-bold text-orange-900">68%</p>
                    <p className="text-xs text-orange-600 mt-1">$85M de $125M</p>
                  </div>
                  <Award className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Forecast Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Proyeccion de Ingresos</CardTitle>
              <CardDescription>Escenarios optimista, proyectado y conservador</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`} />
                  <Tooltip formatter={(value: number) => [formatFullCurrency(value), ""]} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="optimista" 
                    stroke="#22c55e" 
                    fill="#22c55e" 
                    fillOpacity={0.1}
                    strokeDasharray="5 5"
                    name="Optimista"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="proyectado" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                    name="Proyectado"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="conservador" 
                    stroke="#f59e0b" 
                    fill="#f59e0b" 
                    fillOpacity={0.1}
                    strokeDasharray="5 5"
                    name="Conservador"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pipeline Probability */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline por Probabilidad</CardTitle>
                <CardDescription>Valor ponderado por etapa</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { etapa: "Cierre (90%)", valor: 3200000, ponderado: 2880000, prob: 90 },
                    { etapa: "Negociacion (70%)", valor: 4800000, ponderado: 3360000, prob: 70 },
                    { etapa: "Propuesta (50%)", valor: 6500000, ponderado: 3250000, prob: 50 },
                    { etapa: "Calificados (30%)", valor: 8200000, ponderado: 2460000, prob: 30 },
                    { etapa: "Contactados (10%)", valor: 9800000, ponderado: 980000, prob: 10 },
                  ].map((item) => (
                    <div key={item.etapa} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{item.etapa}</span>
                        <div className="text-right">
                          <span className="text-sm font-bold text-green-600">{formatCurrency(item.ponderado)}</span>
                          <span className="text-xs text-muted-foreground ml-2">de {formatCurrency(item.valor)}</span>
                        </div>
                      </div>
                      <Progress value={item.prob} className="h-2" />
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Ponderado</span>
                    <span className="text-xl font-bold text-green-600">$12.93M</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Proyeccion vs Meta</CardTitle>
                <CardDescription>Progreso hacia objetivos del periodo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    { label: "Ventas Q3", actual: 12, meta: 20, valor: 24500000, metaValor: 40000000 },
                    { label: "Leads Calificados", actual: 89, meta: 120, valor: 0, metaValor: 0 },
                    { label: "Citas Realizadas", actual: 45, meta: 60, valor: 0, metaValor: 0 },
                  ].map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className="text-sm">
                          <span className="font-bold">{item.actual}</span>
                          <span className="text-muted-foreground"> / {item.meta}</span>
                        </span>
                      </div>
                      <Progress value={(item.actual / item.meta) * 100} className="h-3" />
                      {item.valor > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.valor)} de {formatCurrency(item.metaValor)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Ventas */}
        <TabsContent value="ventas" className="space-y-6">
          {/* Sales KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Ventas Cerradas</p>
                  <p className="text-3xl font-bold">{metrics.wonProspects}</p>
                  <p className="text-xs text-green-600 mt-1">+15% vs mes anterior</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Valor Vendido</p>
                  <p className="text-3xl font-bold">{formatCurrency(metrics.wonValue)}</p>
                  <p className="text-xs text-green-600 mt-1">+22% vs mes anterior</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Ticket Promedio</p>
                  <p className="text-3xl font-bold">{formatCurrency(metrics.avgDealSize || 2850000)}</p>
                  <p className="text-xs text-green-600 mt-1">+8% vs mes anterior</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Deals Perdidos</p>
                  <p className="text-3xl font-bold">{metrics.lostProspects}</p>
                  <p className="text-xs text-red-600 mt-1">+3 vs mes anterior</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-3xl font-bold">{metrics.conversionRate.toFixed(1)}%</p>
                  <p className="text-xs text-green-600 mt-1">+1.2% vs mes anterior</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sales Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Ventas</CardTitle>
                <CardDescription>Leads vs Ventas por mes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="leads" fill="#3b82f6" name="Leads" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="ventas" stroke="#22c55e" strokeWidth={3} name="Ventas" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ventas por Producto</CardTitle>
                <CardDescription>Distribucion de ventas por tipo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                      <Pie
                        data={salesByProduct}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {salesByProduct.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number, name, props) => [
                        `${value} ventas - ${formatCurrency(props.payload.amount)}`,
                        props.payload.name
                      ]} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {salesByProduct.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm">{item.name}</span>
                      <span className="text-sm font-medium ml-auto">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sales Velocity */}
          <Card>
            <CardHeader>
              <CardTitle>Velocidad de Ventas</CardTitle>
              <CardDescription>Metricas de eficiencia del proceso de ventas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Timer className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold">{metrics.avgDaysToClose || 28}</p>
                  <p className="text-sm text-muted-foreground">Dias promedio cierre</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold">4.2h</p>
                  <p className="text-sm text-muted-foreground">Tiempo respuesta</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Phone className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold">3.5</p>
                  <p className="text-sm text-muted-foreground">Contactos por venta</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <p className="text-2xl font-bold">$285K</p>
                  <p className="text-sm text-muted-foreground">Valor por dia pipeline</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Asesores */}
        <TabsContent value="asesores" className="space-y-6">
          {/* Top Performers */}
          <div className="grid gap-4 md:grid-cols-3">
            {advisorPerformance.slice(0, 3).map((advisor, index) => (
              <Card key={advisor.name} className={index === 0 ? "border-yellow-400 bg-yellow-50/50" : ""}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full ${
                        index === 0 ? "bg-yellow-100" : 
                        index === 1 ? "bg-gray-100" : "bg-orange-100"
                      }`}>
                        <Award className={`h-6 w-6 ${
                          index === 0 ? "text-yellow-600" : 
                          index === 1 ? "text-gray-600" : "text-orange-600"
                        }`} />
                      </div>
                      <div>
                        <p className="font-semibold">{advisor.name}</p>
                        <p className="text-sm text-muted-foreground">#{index + 1} del mes</p>
                      </div>
                    </div>
                    <Badge variant={index === 0 ? "default" : "outline"}>
                      {advisor.conversion.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Ventas</p>
                      <p className="text-lg font-bold">{advisor.ventas}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="text-lg font-bold">{formatCurrency(advisor.valor)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Comparativa de Rendimiento</CardTitle>
              <CardDescription>Metricas detalladas por asesor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Asesor</th>
                      <th className="text-right py-3 px-4 font-medium">Leads</th>
                      <th className="text-right py-3 px-4 font-medium">Ventas</th>
                      <th className="text-right py-3 px-4 font-medium">Conversion</th>
                      <th className="text-right py-3 px-4 font-medium">Valor</th>
                      <th className="text-right py-3 px-4 font-medium">T. Respuesta</th>
                      <th className="text-right py-3 px-4 font-medium">Calificacion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advisorPerformance.map((advisor) => (
                      <tr key={advisor.name} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{advisor.name}</td>
                        <td className="text-right py-3 px-4">{advisor.leads}</td>
                        <td className="text-right py-3 px-4">
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {advisor.ventas}
                          </Badge>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className={advisor.conversion >= 15 ? "text-green-600" : "text-orange-600"}>
                            {advisor.conversion.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right py-3 px-4 font-medium">{formatCurrency(advisor.valor)}</td>
                        <td className="text-right py-3 px-4">
                          <span className={advisor.tiempoRespuesta <= 15 ? "text-green-600" : "text-red-600"}>
                            {advisor.tiempoRespuesta} min
                          </span>
                        </td>
                        <td className="text-right py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <span className="font-medium">{advisor.calificacion}</span>
                            <span className="text-yellow-500">★</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Activity Metrics */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Actividad por Asesor</CardTitle>
                <CardDescription>Llamadas, emails y tareas completadas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={advisorPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="llamadas" fill="#3b82f6" name="Llamadas" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="emails" fill="#22c55e" name="Emails" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="tareas" fill="#f59e0b" name="Tareas" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Eficiencia por Asesor</CardTitle>
                <CardDescription>Leads asignados vs conversiones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {advisorPerformance.map((advisor) => (
                    <div key={advisor.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{advisor.name}</span>
                        <span className="text-sm">
                          {advisor.ventas}/{advisor.leads} ({advisor.conversion.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex gap-1 h-4">
                        <div 
                          className="bg-green-500 rounded-l"
                          style={{ width: `${(advisor.ventas / advisor.leads) * 100}%` }}
                        />
                        <div 
                          className="bg-gray-200 rounded-r flex-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Medios */}
        <TabsContent value="medios" className="space-y-6">
          {/* Channel Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Leads</p>
                    <p className="text-2xl font-bold">1,058</p>
                    <p className="text-xs text-green-600 mt-1">6 canales activos</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Inversion Total</p>
                    <p className="text-2xl font-bold">$125K</p>
                    <p className="text-xs text-muted-foreground mt-1">Este mes</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">CPL Promedio</p>
                    <p className="text-2xl font-bold">$118</p>
                    <p className="text-xs text-green-600 mt-1">-12% vs mes ant.</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">ROI Promedio</p>
                    <p className="text-2xl font-bold">24,567%</p>
                    <p className="text-xs text-green-600 mt-1">+8% vs mes ant.</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Channel Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Canal</CardTitle>
              <CardDescription>Metricas detalladas de cada fuente de leads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Canal</th>
                      <th className="text-right py-3 px-4 font-medium">Leads</th>
                      <th className="text-right py-3 px-4 font-medium">Conversiones</th>
                      <th className="text-right py-3 px-4 font-medium">Tasa Conv.</th>
                      <th className="text-right py-3 px-4 font-medium">Inversion</th>
                      <th className="text-right py-3 px-4 font-medium">CPL</th>
                      <th className="text-right py-3 px-4 font-medium">Ingresos</th>
                      <th className="text-right py-3 px-4 font-medium">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelPerformance.map((channel) => (
                      <tr key={channel.name} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {channel.name === "Google Ads" && <Globe className="h-4 w-4 text-blue-600" />}
                            {channel.name === "Meta Ads" && <Facebook className="h-4 w-4 text-blue-500" />}
                            {channel.name === "Portal Inmuebles24" && <Globe className="h-4 w-4 text-orange-600" />}
                            {channel.name === "Referidos" && <Share2 className="h-4 w-4 text-green-600" />}
                            {channel.name === "WhatsApp" && <MessageSquare className="h-4 w-4 text-green-500" />}
                            {channel.name === "Landing Page" && <MousePointerClick className="h-4 w-4 text-purple-600" />}
                            <span className="font-medium">{channel.name}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">{channel.leads}</td>
                        <td className="text-right py-3 px-4">
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {channel.conversiones}
                          </Badge>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className={(channel.conversiones / channel.leads) * 100 >= 10 ? "text-green-600" : "text-orange-600"}>
                            {((channel.conversiones / channel.leads) * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right py-3 px-4">
                          {channel.costo > 0 ? formatCurrency(channel.costo) : "-"}
                        </td>
                        <td className="text-right py-3 px-4">
                          {channel.cpl > 0 ? `$${channel.cpl}` : "-"}
                        </td>
                        <td className="text-right py-3 px-4 font-medium">{formatCurrency(channel.ingresos)}</td>
                        <td className="text-right py-3 px-4">
                          <span className="text-green-600 font-medium">
                            {channel.costo > 0 ? `${Math.round((channel.ingresos / channel.costo) * 100)}%` : "∞"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Channel Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribucion de Leads por Canal</CardTitle>
                <CardDescription>Porcentaje de leads por fuente</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={channelPerformance}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="leads"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {channelPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CPL vs Conversion por Canal</CardTitle>
                <CardDescription>Costo por lead y tasa de conversion</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={channelPerformance.filter(c => c.cpl > 0)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="cpl" fill="#3b82f6" name="CPL ($)" radius={[4, 4, 0, 0]} />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="conversiones" 
                      stroke="#22c55e" 
                      strokeWidth={3}
                      name="Conversiones"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Channel Efficiency */}
          <Card>
            <CardHeader>
              <CardTitle>Eficiencia de Inversion</CardTitle>
              <CardDescription>Comparativa de retorno por canal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {channelPerformance
                  .filter(c => c.costo > 0)
                  .sort((a, b) => (b.ingresos / b.costo) - (a.ingresos / a.costo))
                  .map((channel) => {
                    const roi = (channel.ingresos / channel.costo) * 100
                    const maxRoi = Math.max(...channelPerformance.filter(c => c.costo > 0).map(c => (c.ingresos / c.costo) * 100))
                    return (
                      <div key={channel.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{channel.name}</span>
                          <div className="text-right">
                            <span className="text-sm font-bold text-green-600">{roi.toFixed(0)}% ROI</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {formatCurrency(channel.ingresos)} / {formatCurrency(channel.costo)}
                            </span>
                          </div>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                            style={{ width: `${(roi / maxRoi) * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Servicios */}
        <TabsContent value="servicios" className="space-y-6">
          {/* KPIs de Servicios */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Servicios Vendidos</p>
                    <p className="text-3xl font-bold">156</p>
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <ArrowUpRight className="h-3 w-3" />
                      +18% vs mes anterior
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ingreso por Servicios</p>
                    <p className="text-3xl font-bold">{formatCurrency(4850000)}</p>
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <ArrowUpRight className="h-3 w-3" />
                      +25% vs mes anterior
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ticket Promedio</p>
                    <p className="text-3xl font-bold">{formatCurrency(31090)}</p>
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <ArrowUpRight className="h-3 w-3" />
                      +8% vs mes anterior
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Servicios Activos</p>
                    <p className="text-3xl font-bold">12</p>
                    <p className="text-xs text-muted-foreground mt-1">En catalogo</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Building className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Servicios mas vendidos y distribucion */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Servicios Mas Vendidos</CardTitle>
                <CardDescription>Ranking de servicios por unidades vendidas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart 
                    data={[
                      { name: 'Consultoria Digital', ventas: 45 },
                      { name: 'Desarrollo Web', ventas: 32 },
                      { name: 'Marketing Digital', ventas: 28 },
                      { name: 'SEO/SEM', ventas: 24 },
                      { name: 'Branding', ventas: 15 },
                      { name: 'Social Media', ventas: 12 },
                    ]}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                    <Bar dataKey="ventas" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribucion de Ingresos</CardTitle>
                <CardDescription>Participacion de cada servicio en ingresos totales</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Consultoria', value: 1350000, fill: '#22c55e' },
                        { name: 'Desarrollo', value: 960000, fill: '#3b82f6' },
                        { name: 'Marketing', value: 840000, fill: '#a855f7' },
                        { name: 'SEO/SEM', value: 480000, fill: '#eab308' },
                        { name: 'Branding', value: 600000, fill: '#f97316' },
                        { name: 'Social', value: 360000, fill: '#06b6d4' },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tendencia de Servicios */}
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Ventas por Servicio</CardTitle>
              <CardDescription>Evolucion mensual de los principales servicios</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={[
                  { mes: 'Ene', consultoria: 8, desarrollo: 5, marketing: 4, seo: 3 },
                  { mes: 'Feb', consultoria: 10, desarrollo: 6, marketing: 5, seo: 4 },
                  { mes: 'Mar', consultoria: 9, desarrollo: 8, marketing: 6, seo: 5 },
                  { mes: 'Abr', consultoria: 12, desarrollo: 7, marketing: 7, seo: 5 },
                  { mes: 'May', consultoria: 14, desarrollo: 9, marketing: 8, seo: 6 },
                  { mes: 'Jun', consultoria: 15, desarrollo: 10, marketing: 9, seo: 7 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip contentStyle={{ borderRadius: '8px' }} />
                  <Legend />
                  <Area type="monotone" dataKey="consultoria" name="Consultoria" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="desarrollo" name="Desarrollo" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="marketing" name="Marketing" stackId="1" stroke="#a855f7" fill="#a855f7" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="seo" name="SEO/SEM" stackId="1" stroke="#eab308" fill="#eab308" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tabla de Servicios */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle por Servicio</CardTitle>
              <CardDescription>Metricas completas de cada servicio</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Servicio</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="text-right">Ticket Prom.</TableHead>
                    <TableHead className="text-right">% Total</TableHead>
                    <TableHead className="text-right">Tendencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { nombre: 'Consultoria Digital', unidades: 45, ingresos: 1350000, trend: 15 },
                    { nombre: 'Desarrollo Web', unidades: 32, ingresos: 960000, trend: 12 },
                    { nombre: 'Marketing Digital', unidades: 28, ingresos: 840000, trend: 8 },
                    { nombre: 'SEO/SEM', unidades: 24, ingresos: 480000, trend: -3 },
                    { nombre: 'Branding', unidades: 15, ingresos: 600000, trend: 20 },
                    { nombre: 'Social Media', unidades: 12, ingresos: 360000, trend: 5 },
                  ].map((servicio) => {
                    const totalIngresos = 4590000
                    const porcentaje = ((servicio.ingresos / totalIngresos) * 100).toFixed(1)
                    const ticketProm = servicio.ingresos / servicio.unidades
                    return (
                      <TableRow key={servicio.nombre}>
                        <TableCell className="font-medium">{servicio.nombre}</TableCell>
                        <TableCell className="text-right">{servicio.unidades}</TableCell>
                        <TableCell className="text-right">{formatCurrency(servicio.ingresos)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(ticketProm)}</TableCell>
                        <TableCell className="text-right">{porcentaje}%</TableCell>
                        <TableCell className="text-right">
                          <span className={`flex items-center justify-end gap-1 ${servicio.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {servicio.trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {Math.abs(servicio.trend)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Perdidas */}
        <TabsContent value="perdidas" className="space-y-6">
          {/* KPIs de Perdidas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-700">Leads Perdidos</p>
                    <p className="text-3xl font-bold text-red-900">67</p>
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                      <ArrowUpRight className="h-3 w-3" />
                      +12 vs mes anterior
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-700">Valor Perdido</p>
                    <p className="text-3xl font-bold text-orange-900">{formatCurrency(8500000)}</p>
                    <p className="text-xs text-orange-600 mt-1">Oportunidades no cerradas</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tasa de Perdida</p>
                    <p className="text-3xl font-bold">18.5%</p>
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <ArrowDownRight className="h-3 w-3" />
                      -2.3% vs mes anterior
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Dias Prom. hasta Perdida</p>
                    <p className="text-3xl font-bold">23</p>
                    <p className="text-xs text-muted-foreground mt-1">Desde primer contacto</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Razones de Perdida */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Razones de Perdida</CardTitle>
                <CardDescription>Principales motivos por los que no compran</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { razon: 'Presupuesto insuficiente', cantidad: 23, porcentaje: 35, color: '#22c55e' },
                    { razon: 'Eligio competencia', cantidad: 16, porcentaje: 25, color: '#06b6d4' },
                    { razon: 'Ubicacion no conveniente', cantidad: 13, porcentaje: 20, color: '#eab308' },
                    { razon: 'Tiempo de entrega', cantidad: 8, porcentaje: 12, color: '#3b82f6' },
                    { razon: 'No respondio', cantidad: 4, porcentaje: 6, color: '#a855f7' },
                    { razon: 'Otros', cantidad: 3, porcentaje: 5, color: '#ef4444' },
                  ].map((item) => (
                    <div key={item.razon} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{item.razon}</span>
                        <span className="text-sm text-muted-foreground">{item.cantidad} ({item.porcentaje}%)</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ width: `${item.porcentaje}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Perdidas por Etapa del Pipeline</CardTitle>
                <CardDescription>En que punto del proceso se pierden los leads</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { etapa: 'Nuevo', perdidos: 5 },
                    { etapa: 'Contactado', perdidos: 12 },
                    { etapa: 'Calificado', perdidos: 18 },
                    { etapa: 'Cita Agendada', perdidos: 8 },
                    { etapa: 'Visita', perdidos: 10 },
                    { etapa: 'Propuesta', perdidos: 14 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="etapa" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                    <Bar dataKey="perdidos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tendencia de Perdidas y Competencia */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Perdidas</CardTitle>
                <CardDescription>Evolucion mensual de leads perdidos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { mes: 'Ene', perdidos: 8, valorPerdido: 950000 },
                    { mes: 'Feb', perdidos: 12, valorPerdido: 1200000 },
                    { mes: 'Mar', perdidos: 10, valorPerdido: 1100000 },
                    { mes: 'Abr', perdidos: 15, valorPerdido: 1800000 },
                    { mes: 'May', perdidos: 11, valorPerdido: 1400000 },
                    { mes: 'Jun', perdidos: 11, valorPerdido: 1350000 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `$${v/1000000}M`} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'perdidos' ? value : formatCurrency(value),
                        name === 'perdidos' ? 'Leads Perdidos' : 'Valor Perdido'
                      ]}
                      contentStyle={{ borderRadius: '8px' }}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="perdidos" name="Leads Perdidos" stroke="#ef4444" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="valorPerdido" name="Valor Perdido" stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Perdidas a Competencia</CardTitle>
                <CardDescription>A quien estan eligiendo nuestros prospectos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Competidor A', value: 8, fill: '#ef4444' },
                        { name: 'Competidor B', value: 5, fill: '#f97316' },
                        { name: 'Competidor C', value: 3, fill: '#eab308' },
                        { name: 'Desconocido', value: 6, fill: '#94a3b8' },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    />
                    <Tooltip formatter={(value: number) => [`${value} leads`, 'Perdidos a']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Analisis de Recuperacion */}
          <Card>
            <CardHeader>
              <CardTitle>Oportunidades de Recuperacion</CardTitle>
              <CardDescription>Leads perdidos que podrian recontactarse</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Alta probabilidad</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">12 leads</p>
                  <p className="text-sm text-green-700">{formatCurrency(1800000)} en valor potencial</p>
                  <p className="text-xs text-green-600 mt-2">Perdidos por tiempo - pueden recontactarse</p>
                </div>
                <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Media probabilidad</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-900">18 leads</p>
                  <p className="text-sm text-yellow-700">{formatCurrency(2400000)} en valor potencial</p>
                  <p className="text-xs text-yellow-600 mt-2">Perdidos por presupuesto - monitorear</p>
                </div>
                <div className="p-4 border rounded-lg bg-red-50 border-red-200">
                  <div className="flex items-center gap-3 mb-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800">Baja probabilidad</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900">37 leads</p>
                  <p className="text-sm text-red-700">{formatCurrency(4300000)} en valor perdido</p>
                  <p className="text-xs text-red-600 mt-2">Eligieron competencia - dificil recuperar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Perdidas Recientes */}
          <Card>
            <CardHeader>
              <CardTitle>Perdidas Recientes</CardTitle>
              <CardDescription>Ultimos leads marcados como perdidos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Razon</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead className="text-right">Valor Est.</TableHead>
                    <TableHead>Asesor</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { nombre: 'Juan Perez', razon: 'Presupuesto', etapa: 'Propuesta', valor: 450000, asesor: 'Laura M.', fecha: '28 May' },
                    { nombre: 'Maria Garcia', razon: 'Competencia', etapa: 'Visita', valor: 380000, asesor: 'Carlos R.', fecha: '27 May' },
                    { nombre: 'Roberto Lopez', razon: 'Tiempo', etapa: 'Calificado', valor: 520000, asesor: 'Sofia T.', fecha: '26 May' },
                    { nombre: 'Ana Martinez', razon: 'No respondio', etapa: 'Contactado', valor: 280000, asesor: 'Miguel H.', fecha: '25 May' },
                    { nombre: 'Carlos Ruiz', razon: 'Ubicacion', etapa: 'Cita', valor: 650000, asesor: 'Andrea L.', fecha: '24 May' },
                  ].map((lead, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{lead.nombre}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-red-600 border-red-200">
                          {lead.razon}
                        </Badge>
                      </TableCell>
                      <TableCell>{lead.etapa}</TableCell>
                      <TableCell className="text-right">{formatCurrency(lead.valor)}</TableCell>
                      <TableCell>{lead.asesor}</TableCell>
                      <TableCell className="text-muted-foreground">{lead.fecha}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
