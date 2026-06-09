"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  DollarSign,
  Users,
  MousePointer,
  Eye,
  Calendar,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  AlertTriangle,
} from "lucide-react"
import { 
  AdvancedKPICard, 
  KPISemaphore, 
  TrendIndicator,
  AlertSummary,
  InsightsSummary,
} from "@/components/marketing-intelligence/brands"
import { ChartCard, MILineChart, MIBarChart, MIDonutChart } from "@/components/marketing-intelligence/charts"
import { 
  getBrandKPIs, 
  getBrandCampaigns, 
  getBrandOrganicContent,
  getBrandAlerts,
  getBrandInsights,
} from "@/lib/marketing-intelligence/brand-phase3-mock-data"
import { mockBrands } from "@/lib/marketing-intelligence/brand-mock-data"
import type { KPIWithStatus } from "@/lib/marketing-intelligence/brand-types"

// Mock trend data for charts
const monthlyTrendData = [
  { month: "Ene", leads: 1450, investment: 220000, roas: 380 },
  { month: "Feb", leads: 1680, investment: 245000, roas: 420 },
  { month: "Mar", leads: 1890, investment: 270000, roas: 494 },
  { month: "Abr", leads: 2163, investment: 290000, roas: 520 },
]

const channelDistribution = [
  { name: "Meta Ads", value: 65, color: "#1877F2" },
  { name: "Google Ads", value: 28, color: "#4285F4" },
  { name: "TikTok Ads", value: 5, color: "#000000" },
  { name: "Orgánico", value: 2, color: "#10B981" },
]

const funnelData = [
  { stage: "Impresiones", value: 4500000, percentage: 100 },
  { stage: "Alcance", value: 1650000, percentage: 36.7 },
  { stage: "Clics", value: 48000, percentage: 2.9 },
  { stage: "Leads", value: 2163, percentage: 4.5 },
  { stage: "Citas", value: 215, percentage: 9.9 },
  { stage: "Ventas", value: 12, percentage: 5.6 },
]

export default function BrandAnalyticsPage() {
  const params = useParams()
  const brandId = params.id as string
  
  const [period, setPeriod] = useState("month")
  const [viewMode, setViewMode] = useState("overview")
  
  const brand = mockBrands.find(b => b.id === brandId)
  const kpis = getBrandKPIs(brandId)
  const campaigns = getBrandCampaigns(brandId)
  const organicContent = getBrandOrganicContent(brandId)
  const alerts = getBrandAlerts(brandId)
  const insights = getBrandInsights(brandId)
  
  if (!brand) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Marca no encontrada</p>
        <Button variant="link" asChild>
          <Link href="/orbit-marketing-intelligence/brands">Volver a marcas</Link>
        </Button>
      </div>
    )
  }

  // Calculate totals
  const totalInvestment = campaigns.reduce((sum, c) => sum + c.investment, 0)
  const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0)
  const totalSales = campaigns.reduce((sum, c) => sum + c.sales, 0)
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0)
  const avgCPL = totalInvestment / totalLeads
  const avgROAS = (totalRevenue / totalInvestment) * 100

  // KPIs by status
  const excellentKPIs = kpis.filter(k => k.status === "excellent")
  const warningKPIs = kpis.filter(k => k.status === "warning" || k.status === "critical")

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/orbit-marketing-intelligence/brands/${brandId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Dashboard de Analytics
            </h1>
            <p className="text-muted-foreground">{brand.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Alerts and Insights Summary */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-6">
          <AlertSummary alerts={alerts} />
          <InsightsSummary insights={insights} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/orbit-marketing-intelligence/brands/${brandId}/alerts`}>
              Ver alertas
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/orbit-marketing-intelligence/brands/${brandId}/insights`}>
              Ver insights
            </Link>
          </Button>
        </div>
      </div>

      {/* Main KPIs Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Inversión Total</p>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalInvestment)}</p>
            <TrendIndicator trend="up" value={12.5} size="sm" />
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Leads</p>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{totalLeads.toLocaleString()}</p>
            <TrendIndicator trend="up" value={14.5} size="sm" />
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">CPL Promedio</p>
              <KPISemaphore status="good" size="md" />
            </div>
            <p className="text-2xl font-bold">${avgCPL.toFixed(2)}</p>
            <TrendIndicator trend="down" value={-8.3} inverted size="sm" />
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">ROAS</p>
              <KPISemaphore status="excellent" size="md" />
            </div>
            <p className="text-2xl font-bold">{avgROAS.toFixed(0)}%</p>
            <TrendIndicator trend="up" value={23.5} size="sm" />
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Ventas</p>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{totalSales}</p>
            <TrendIndicator trend="up" value={20} size="sm" />
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Ingresos</p>
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
            <TrendIndicator trend="up" value={35} size="sm" />
          </CardContent>
        </Card>
      </div>

      {/* KPI Status Grid with Semáforos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Estado de KPIs vs Objetivos</CardTitle>
              <CardDescription>
                Comparativo de métricas actuales contra rangos establecidos
              </CardDescription>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span>Excelente ({excellentKPIs.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span>Bueno</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <span>Atención</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span>Crítico ({warningKPIs.length})</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map(kpi => (
              <AdvancedKPICard
                key={kpi.code}
                {...kpi}
                inverted={["cpl", "cpc", "cpm", "frequency"].includes(kpi.code)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tendencia Mensual</CardTitle>
            <CardDescription>Evolución de leads e inversión</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <MILineChart
                data={monthlyTrendData}
                lines={[
                  { dataKey: "leads", name: "Leads", color: "#3B82F6" },
                  { dataKey: "roas", name: "ROAS %", color: "#10B981" },
                ]}
                xAxisKey="month"
              />
            </div>
          </CardContent>
        </Card>

        {/* Channel Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución por Canal</CardTitle>
            <CardDescription>Inversión por plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <MIDonutChart
                data={channelDistribution}
                dataKey="value"
                nameKey="name"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Marketing Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funnel de Marketing</CardTitle>
          <CardDescription>Conversión por etapa del embudo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelData.map((stage, index) => (
              <div key={stage.stage} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{stage.stage}</span>
                    <Badge variant="secondary">{stage.value.toLocaleString()}</Badge>
                  </div>
                  {index > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {stage.percentage}% conversión
                    </span>
                  )}
                </div>
                <Progress 
                  value={index === 0 ? 100 : (stage.value / funnelData[0].value) * 100 * 50} 
                  className="h-3"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer" asChild>
          <Link href={`/orbit-marketing-intelligence/brands/${brandId}/rankings/campaigns`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Rankings Campañas</p>
                <p className="text-xs text-muted-foreground">Top performers</p>
              </div>
            </CardContent>
          </Link>
        </Card>
        
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer" asChild>
          <Link href={`/orbit-marketing-intelligence/brands/${brandId}/rankings/organic`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-100">
                <Eye className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="font-medium">Rankings Orgánico</p>
                <p className="text-xs text-muted-foreground">Mejor contenido</p>
              </div>
            </CardContent>
          </Link>
        </Card>
        
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer" asChild>
          <Link href={`/orbit-marketing-intelligence/brands/${brandId}/insights`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Insights IA</p>
                <p className="text-xs text-muted-foreground">{insights.filter(i => !i.acknowledged).length} nuevos</p>
              </div>
            </CardContent>
          </Link>
        </Card>
        
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer" asChild>
          <Link href={`/orbit-marketing-intelligence/brands/${brandId}/reports`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Download className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Reportes</p>
                <p className="text-xs text-muted-foreground">Generar reporte</p>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  )
}
