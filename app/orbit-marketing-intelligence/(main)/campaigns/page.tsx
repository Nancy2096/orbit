"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Search, 
  Filter,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  MousePointer,
  Eye,
  ShoppingCart,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Pause,
  Play,
  Settings,
  ExternalLink
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts"
import { useOMIFilters } from "@/contexts/omi-filters-context"

// Mock campaigns data
const mockCampaigns = [
  {
    id: "camp1",
    name: "Campaña Verano 2026",
    platform: "meta",
    status: "active",
    objective: "conversions",
    budget: 15000,
    spent: 12450,
    impressions: 2450000,
    clicks: 48500,
    ctr: 1.98,
    cpc: 0.26,
    conversions: 1250,
    cpa: 9.96,
    roas: 4.2,
    startDate: "2026-05-01",
    endDate: "2026-06-30"
  },
  {
    id: "camp2",
    name: "Brand Awareness Q2",
    platform: "meta",
    status: "active",
    objective: "awareness",
    budget: 8000,
    spent: 6200,
    impressions: 5200000,
    clicks: 26000,
    ctr: 0.5,
    cpc: 0.24,
    conversions: 0,
    cpa: 0,
    roas: 0,
    startDate: "2026-04-15",
    endDate: "2026-06-15"
  },
  {
    id: "camp3",
    name: "Search - Productos",
    platform: "google",
    status: "active",
    objective: "conversions",
    budget: 12000,
    spent: 9800,
    impressions: 980000,
    clicks: 52000,
    ctr: 5.31,
    cpc: 0.19,
    conversions: 2100,
    cpa: 4.67,
    roas: 6.8,
    startDate: "2026-04-01",
    endDate: "2026-06-30"
  },
  {
    id: "camp4",
    name: "Retargeting - Carritos",
    platform: "meta",
    status: "active",
    objective: "conversions",
    budget: 5000,
    spent: 4200,
    impressions: 850000,
    clicks: 42500,
    ctr: 5.0,
    cpc: 0.10,
    conversions: 850,
    cpa: 4.94,
    roas: 8.5,
    startDate: "2026-05-01",
    endDate: "2026-05-31"
  },
  {
    id: "camp5",
    name: "YouTube - Video Ads",
    platform: "google",
    status: "paused",
    objective: "awareness",
    budget: 6000,
    spent: 3500,
    impressions: 1200000,
    clicks: 18000,
    ctr: 1.5,
    cpc: 0.19,
    conversions: 120,
    cpa: 29.17,
    roas: 1.2,
    startDate: "2026-04-01",
    endDate: "2026-05-15"
  },
  {
    id: "camp6",
    name: "TikTok - Gen Z",
    platform: "tiktok",
    status: "active",
    objective: "traffic",
    budget: 4000,
    spent: 2800,
    impressions: 1800000,
    clicks: 90000,
    ctr: 5.0,
    cpc: 0.03,
    conversions: 450,
    cpa: 6.22,
    roas: 3.5,
    startDate: "2026-05-10",
    endDate: "2026-06-10"
  },
  {
    id: "camp7",
    name: "LinkedIn - B2B Leads",
    platform: "linkedin",
    status: "active",
    objective: "lead_gen",
    budget: 10000,
    spent: 7500,
    impressions: 320000,
    clicks: 6400,
    ctr: 2.0,
    cpc: 1.17,
    conversions: 85,
    cpa: 88.24,
    roas: 2.8,
    startDate: "2026-04-20",
    endDate: "2026-06-20"
  }
]

const performanceData = [
  { date: "May 1", spend: 1200, conversions: 45, roas: 3.8 },
  { date: "May 5", spend: 1450, conversions: 52, roas: 4.2 },
  { date: "May 10", spend: 1680, conversions: 68, roas: 4.5 },
  { date: "May 15", spend: 1520, conversions: 58, roas: 4.1 },
  { date: "May 18", spend: 1890, conversions: 75, roas: 4.8 }
]

const platformDistribution = [
  { name: "Meta Ads", value: 45, color: "#1877F2" },
  { name: "Google Ads", value: 35, color: "#34A853" },
  { name: "TikTok", value: 12, color: "#000000" },
  { name: "LinkedIn", value: 8, color: "#0A66C2" }
]

export default function PaidCampaignsPage() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [searchTerm, setSearchTerm] = useState("")
  const [platformFilter, setPlatformFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  
  const { 
    selectedClient, 
    selectedBrand, 
    selectedPeriod,
    getClientName,
    getBrandName,
    getPeriodLabel 
  } = useOMIFilters()

  // Filter campaigns based on global filters + local filters
  const filteredCampaigns = useMemo(() => {
    let campaigns = mockCampaigns
    
    // Apply global client/brand filter (simulated - in real app would filter by client/brand ID)
    if (selectedClient !== "all") {
      // Simulate filtering by taking a subset based on client
      campaigns = campaigns.filter((_, i) => i % 2 === 0)
    }
    if (selectedBrand !== "all") {
      campaigns = campaigns.filter((_, i) => i % 3 === 0)
    }
    
    // Apply local filters
    return campaigns.filter(campaign => {
      const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesPlatform = platformFilter === "all" || campaign.platform === platformFilter
      const matchesStatus = statusFilter === "all" || campaign.status === statusFilter
      return matchesSearch && matchesPlatform && matchesStatus
    })
  }, [selectedClient, selectedBrand, searchTerm, platformFilter, statusFilter])

  const totalSpent = filteredCampaigns.reduce((sum, c) => sum + c.spent, 0)
  const totalBudget = filteredCampaigns.reduce((sum, c) => sum + c.budget, 0)
  const totalConversions = filteredCampaigns.reduce((sum, c) => sum + c.conversions, 0)
  const totalImpressions = filteredCampaigns.reduce((sum, c) => sum + c.impressions, 0)
  const avgRoas = filteredCampaigns.filter(c => c.roas > 0).length > 0 
    ? filteredCampaigns.filter(c => c.roas > 0).reduce((sum, c) => sum + c.roas, 0) / filteredCampaigns.filter(c => c.roas > 0).length
    : 0

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "meta": return "bg-blue-100 text-blue-800"
      case "google": return "bg-green-100 text-green-800"
      case "tiktok": return "bg-gray-900 text-white"
      case "linkedin": return "bg-sky-100 text-sky-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case "meta": return "Meta Ads"
      case "google": return "Google Ads"
      case "tiktok": return "TikTok"
      case "linkedin": return "LinkedIn"
      default: return platform
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-100 text-green-800">Activa</Badge>
      case "paused": return <Badge className="bg-amber-100 text-amber-800">Pausada</Badge>
      case "ended": return <Badge className="bg-gray-100 text-gray-800">Finalizada</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campañas de Pago</h1>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">Monitorea y analiza el rendimiento de tus campañas publicitarias</p>
            {(selectedClient !== "all" || selectedBrand !== "all") && (
              <div className="flex items-center gap-1.5 ml-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                {selectedClient !== "all" && (
                  <Badge variant="secondary" className="text-xs">{getClientName(selectedClient)}</Badge>
                )}
                {selectedBrand !== "all" && (
                  <Badge variant="secondary" className="text-xs">{getBrandName(selectedBrand)}</Badge>
                )}
                <Badge variant="outline" className="text-xs">{getPeriodLabel()}</Badge>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sincronizar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gasto Total</p>
                <p className="text-2xl font-bold">${totalSpent.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">de ${totalBudget.toLocaleString()} presupuesto</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <Progress value={(totalSpent / totalBudget) * 100} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Impresiones</p>
                <p className="text-2xl font-bold">{(totalImpressions / 1000000).toFixed(1)}M</p>
                <div className="flex items-center text-xs text-green-600">
                  <ArrowUpRight className="h-3 w-3" />
                  +12.5% vs periodo anterior
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clics Totales</p>
                <p className="text-2xl font-bold">{mockCampaigns.reduce((sum, c) => sum + c.clicks, 0).toLocaleString()}</p>
                <div className="flex items-center text-xs text-green-600">
                  <ArrowUpRight className="h-3 w-3" />
                  +8.3% vs periodo anterior
                </div>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <MousePointer className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversiones</p>
                <p className="text-2xl font-bold">{totalConversions.toLocaleString()}</p>
                <div className="flex items-center text-xs text-green-600">
                  <ArrowUpRight className="h-3 w-3" />
                  +15.2% vs periodo anterior
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ROAS Promedio</p>
                <p className="text-2xl font-bold">{avgRoas.toFixed(1)}x</p>
                <div className="flex items-center text-xs text-green-600">
                  <ArrowUpRight className="h-3 w-3" />
                  +0.3 vs periodo anterior
                </div>
              </div>
              <div className="p-3 bg-cyan-100 rounded-lg">
                <Target className="h-6 w-6 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="campaigns">Campañas</TabsTrigger>
          <TabsTrigger value="platforms">Por Plataforma</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Executive summary metrics */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Conversion funnel */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Embudo de Conversión</CardTitle>
                <CardDescription>Del impacto a la conversión en todas las campañas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const totalClicks = filteredCampaigns.reduce((sum, c) => sum + c.clicks, 0)
                  const funnel = [
                    { label: "Impresiones", value: totalImpressions, icon: Eye, color: "#8b5cf6" },
                    { label: "Clics", value: totalClicks, icon: MousePointer, color: "#f59e0b" },
                    { label: "Conversiones", value: totalConversions, icon: ShoppingCart, color: "#10b981" },
                  ]
                  const max = funnel[0].value || 1
                  return funnel.map((step, i) => {
                    const pct = (step.value / max) * 100
                    const prevValue = i > 0 ? funnel[i - 1].value : null
                    const stepRate = prevValue ? (step.value / prevValue) * 100 : null
                    const Icon = step.icon
                    return (
                      <div key={step.label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md" style={{ backgroundColor: `${step.color}1a` }}>
                              <Icon className="h-4 w-4" style={{ color: step.color }} />
                            </div>
                            <span className="font-medium">{step.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{step.value.toLocaleString()}</span>
                            {stepRate !== null && (
                              <Badge variant="outline" className="text-xs">{stepRate.toFixed(1)}%</Badge>
                            )}
                          </div>
                        </div>
                        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: step.color }}
                          />
                        </div>
                      </div>
                    )
                  })
                })()}
              </CardContent>
            </Card>

            {/* Budget utilization + efficiency */}
            <Card>
              <CardHeader>
                <CardTitle>Uso de Presupuesto</CardTitle>
                <CardDescription>Gasto vs presupuesto asignado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-bold">{((totalSpent / totalBudget) * 100).toFixed(0)}%</span>
                    <span className="text-sm text-muted-foreground">utilizado</span>
                  </div>
                  <Progress value={(totalSpent / totalBudget) * 100} className="mt-2 h-2" />
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>${totalSpent.toLocaleString()}</span>
                    <span>${totalBudget.toLocaleString()}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">CPC Promedio</p>
                    <p className="text-lg font-bold">
                      ${(() => {
                        const clicks = filteredCampaigns.reduce((s, c) => s + c.clicks, 0)
                        return clicks ? (totalSpent / clicks).toFixed(2) : "0.00"
                      })()}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">CPA Promedio</p>
                    <p className="text-lg font-bold">
                      ${totalConversions ? (totalSpent / totalConversions).toFixed(2) : "0.00"}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Campañas Activas</p>
                    <p className="text-lg font-bold">{filteredCampaigns.filter(c => c.status === "active").length}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">ROAS Promedio</p>
                    <p className="text-lg font-bold text-green-600">{avgRoas.toFixed(1)}x</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ROAS by campaign + best/worst */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>ROAS por Campaña</CardTitle>
                <CardDescription>Retorno de la inversión publicitaria</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={filteredCampaigns.filter(c => c.roas > 0).sort((a, b) => b.roas - a.roas)}
                    layout="vertical"
                    margin={{ left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => [`${value.toFixed(1)}x`, "ROAS"]} />
                    <Bar dataKey="roas" radius={[0, 4, 4, 0]}>
                      {filteredCampaigns
                        .filter(c => c.roas > 0)
                        .sort((a, b) => b.roas - a.roas)
                        .map((c, i) => (
                          <Cell key={i} fill={c.roas >= 4 ? "#10b981" : c.roas >= 2 ? "#f59e0b" : "#ef4444"} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {(() => {
                const ranked = filteredCampaigns.filter(c => c.roas > 0).sort((a, b) => b.roas - a.roas)
                const best = ranked[0]
                const worst = ranked[ranked.length - 1]
                return (
                  <>
                    {best && (
                      <Card className="border-green-200 bg-green-50/50">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                            <CardTitle className="text-sm">Mejor Rendimiento</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="font-semibold">{best.name}</p>
                          <Badge className={getPlatformColor(best.platform)}>{getPlatformName(best.platform)}</Badge>
                          <div className="mt-3 flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">ROAS</span>
                            <span className="font-bold text-green-600">{best.roas.toFixed(1)}x</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Conversiones</span>
                            <span className="font-medium">{best.conversions.toLocaleString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {worst && worst !== best && (
                      <Card className="border-red-200 bg-red-50/50">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                            <CardTitle className="text-sm">Necesita Atención</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="font-semibold">{worst.name}</p>
                          <Badge className={getPlatformColor(worst.platform)}>{getPlatformName(worst.platform)}</Badge>
                          <div className="mt-3 flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">ROAS</span>
                            <span className="font-bold text-red-600">{worst.roas.toFixed(1)}x</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">CPA</span>
                            <span className="font-medium">${worst.cpa.toFixed(2)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Performance Chart */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Rendimiento de Campañas</CardTitle>
                <CardDescription>Gasto y conversiones por día</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line yAxisId="left" type="monotone" dataKey="spend" stroke="#3b82f6" strokeWidth={2} name="Gasto ($)" />
                    <Line yAxisId="right" type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={2} name="Conversiones" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Platform Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Plataforma</CardTitle>
                <CardDescription>% del gasto total</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={platformDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {platformDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {platformDistribution.map(platform => (
                    <div key={platform.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: platform.color }} />
                        <span>{platform.name}</span>
                      </div>
                      <span className="font-medium">{platform.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle>Campañas Destacadas</CardTitle>
              <CardDescription>Las 5 campañas con mejor rendimiento</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaña</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead className="text-right">Gasto</TableHead>
                    <TableHead className="text-right">Conversiones</TableHead>
                    <TableHead className="text-right">CPA</TableHead>
                    <TableHead className="text-right">ROAS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCampaigns
                    .filter(c => c.roas > 0)
                    .sort((a, b) => b.roas - a.roas)
                    .slice(0, 5)
                    .map(campaign => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>
                        <Badge className={getPlatformColor(campaign.platform)}>
                          {getPlatformName(campaign.platform)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">${campaign.spent.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{campaign.conversions.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${campaign.cpa.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <span className={campaign.roas >= 4 ? "text-green-600 font-medium" : ""}>
                          {campaign.roas.toFixed(1)}x
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar campañas..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Plataformas</SelectItem>
                <SelectItem value="meta">Meta Ads</SelectItem>
                <SelectItem value="google">Google Ads</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="paused">Pausadas</SelectItem>
                <SelectItem value="ended">Finalizadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campaigns Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaña</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Presupuesto</TableHead>
                  <TableHead className="text-right">Gastado</TableHead>
                  <TableHead className="text-right">Impresiones</TableHead>
                  <TableHead className="text-right">Clics</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Conv.</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map(campaign => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(campaign.startDate).toLocaleDateString('es-MX')} - {new Date(campaign.endDate).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPlatformColor(campaign.platform)}>
                        {getPlatformName(campaign.platform)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell className="text-right">${campaign.budget.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div>
                        <p>${campaign.spent.toLocaleString()}</p>
                        <Progress value={(campaign.spent / campaign.budget) * 100} className="h-1 mt-1" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{(campaign.impressions / 1000).toFixed(0)}K</TableCell>
                    <TableCell className="text-right">{campaign.clicks.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{campaign.ctr.toFixed(2)}%</TableCell>
                    <TableCell className="text-right">{campaign.conversions.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {campaign.roas > 0 ? (
                        <span className={campaign.roas >= 4 ? "text-green-600 font-medium" : ""}>
                          {campaign.roas.toFixed(1)}x
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          {campaign.status === "active" ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Meta Ads */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <span className="text-blue-600 font-bold text-sm">f</span>
                    </div>
                    Meta Ads
                  </CardTitle>
                  <Badge className="bg-green-100 text-green-800">Conectado</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Campañas Activas</p>
                    <p className="text-2xl font-bold">{mockCampaigns.filter(c => c.platform === "meta" && c.status === "active").length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gasto Total</p>
                    <p className="text-2xl font-bold">${mockCampaigns.filter(c => c.platform === "meta").reduce((sum, c) => sum + c.spent, 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ROAS Promedio</p>
                    <p className="text-2xl font-bold text-green-600">5.2x</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Conversiones</p>
                    <p className="text-2xl font-bold">{mockCampaigns.filter(c => c.platform === "meta").reduce((sum, c) => sum + c.conversions, 0).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Google Ads */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <span className="text-green-600 font-bold text-sm">G</span>
                    </div>
                    Google Ads
                  </CardTitle>
                  <Badge className="bg-green-100 text-green-800">Conectado</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Campañas Activas</p>
                    <p className="text-2xl font-bold">{mockCampaigns.filter(c => c.platform === "google" && c.status === "active").length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gasto Total</p>
                    <p className="text-2xl font-bold">${mockCampaigns.filter(c => c.platform === "google").reduce((sum, c) => sum + c.spent, 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ROAS Promedio</p>
                    <p className="text-2xl font-bold text-green-600">4.0x</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Conversiones</p>
                    <p className="text-2xl font-bold">{mockCampaigns.filter(c => c.platform === "google").reduce((sum, c) => sum + c.conversions, 0).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* TikTok */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-gray-900 rounded-lg">
                      <span className="text-white font-bold text-sm">T</span>
                    </div>
                    TikTok Ads
                  </CardTitle>
                  <Badge className="bg-green-100 text-green-800">Conectado</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Campañas Activas</p>
                    <p className="text-2xl font-bold">{mockCampaigns.filter(c => c.platform === "tiktok" && c.status === "active").length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gasto Total</p>
                    <p className="text-2xl font-bold">${mockCampaigns.filter(c => c.platform === "tiktok").reduce((sum, c) => sum + c.spent, 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ROAS Promedio</p>
                    <p className="text-2xl font-bold text-green-600">3.5x</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Conversiones</p>
                    <p className="text-2xl font-bold">{mockCampaigns.filter(c => c.platform === "tiktok").reduce((sum, c) => sum + c.conversions, 0).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* LinkedIn */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-sky-100 rounded-lg">
                      <span className="text-sky-600 font-bold text-sm">in</span>
                    </div>
                    LinkedIn Ads
                  </CardTitle>
                  <Badge className="bg-green-100 text-green-800">Conectado</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Campañas Activas</p>
                    <p className="text-2xl font-bold">{mockCampaigns.filter(c => c.platform === "linkedin" && c.status === "active").length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gasto Total</p>
                    <p className="text-2xl font-bold">${mockCampaigns.filter(c => c.platform === "linkedin").reduce((sum, c) => sum + c.spent, 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ROAS Promedio</p>
                    <p className="text-2xl font-bold text-amber-600">2.8x</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Leads Generados</p>
                    <p className="text-2xl font-bold">{mockCampaigns.filter(c => c.platform === "linkedin").reduce((sum, c) => sum + c.conversions, 0).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
