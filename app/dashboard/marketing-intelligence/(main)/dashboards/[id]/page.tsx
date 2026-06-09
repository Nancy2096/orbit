"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowLeft,
  Edit,
  Share2,
  Download,
  RefreshCw,
  Calendar,
  Plus,
  MoreVertical,
  Star,
  StarOff,
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart,
  PieChart,
  Users,
  DollarSign,
  Eye,
  MousePointer,
  Target
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock dashboard data
const mockDashboards: Record<string, {
  id: string
  name: string
  description: string
  createdBy: string
  createdAt: string
  lastModified: string
  isFavorite: boolean
  isShared: boolean
}> = {
  "dash1": {
    id: "dash1",
    name: "Performance General",
    description: "Vista general de todas las campañas",
    createdBy: "Admin",
    createdAt: "2026-04-15",
    lastModified: "2026-05-18",
    isFavorite: true,
    isShared: true
  },
  "dash2": {
    id: "dash2",
    name: "ROI por Canal",
    description: "Análisis de retorno por canal de marketing",
    createdBy: "Analista",
    createdAt: "2026-04-20",
    lastModified: "2026-05-17",
    isFavorite: true,
    isShared: false
  },
  "dash3": {
    id: "dash3",
    name: "Embudo de Conversión",
    description: "Seguimiento del funnel de ventas",
    createdBy: "Admin",
    createdAt: "2026-05-01",
    lastModified: "2026-05-16",
    isFavorite: false,
    isShared: true
  },
  "dash4": {
    id: "dash4",
    name: "Social Media Metrics",
    description: "Métricas de redes sociales",
    createdBy: "Community Manager",
    createdAt: "2026-05-10",
    lastModified: "2026-05-15",
    isFavorite: false,
    isShared: false
  },
  "dash5": {
    id: "dash5",
    name: "Leads Overview",
    description: "Estado y calidad de leads",
    createdBy: "Ventas",
    createdAt: "2026-05-12",
    lastModified: "2026-05-18",
    isFavorite: false,
    isShared: true
  }
}

// Mock widgets data
const mockWidgets = [
  {
    id: "w1",
    type: "kpi",
    title: "Gasto Total",
    value: "$45,230",
    change: 12.5,
    icon: DollarSign,
    color: "blue"
  },
  {
    id: "w2",
    type: "kpi",
    title: "Impresiones",
    value: "2.4M",
    change: 8.3,
    icon: Eye,
    color: "purple"
  },
  {
    id: "w3",
    type: "kpi",
    title: "Clics",
    value: "156K",
    change: -2.1,
    icon: MousePointer,
    color: "green"
  },
  {
    id: "w4",
    type: "kpi",
    title: "Conversiones",
    value: "3,847",
    change: 15.7,
    icon: Target,
    color: "orange"
  },
  {
    id: "w5",
    type: "chart",
    chartType: "line",
    title: "Tendencia de Gasto",
    data: [30, 40, 35, 50, 49, 60, 70, 65, 80, 75, 90, 85]
  },
  {
    id: "w6",
    type: "chart",
    chartType: "bar",
    title: "Rendimiento por Canal",
    data: [
      { name: "Google Ads", value: 45000 },
      { name: "Facebook", value: 32000 },
      { name: "Instagram", value: 28000 },
      { name: "LinkedIn", value: 15000 },
      { name: "TikTok", value: 12000 }
    ]
  },
  {
    id: "w7",
    type: "chart",
    chartType: "pie",
    title: "Distribución de Presupuesto",
    data: [
      { name: "Awareness", value: 35 },
      { name: "Consideration", value: 25 },
      { name: "Conversion", value: 40 }
    ]
  },
  {
    id: "w8",
    type: "table",
    title: "Top Campañas",
    data: [
      { campaign: "Verano 2026", spend: "$12,500", conversions: 847, roas: 3.2 },
      { campaign: "Lanzamiento Producto", spend: "$8,300", conversions: 562, roas: 4.1 },
      { campaign: "Retargeting Q2", spend: "$5,200", conversions: 423, roas: 5.8 },
      { campaign: "Brand Awareness", spend: "$15,000", conversions: 312, roas: 1.8 }
    ]
  }
]

export default function DashboardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [dateRange, setDateRange] = useState("last30")
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const dashboard = mockDashboards[resolvedParams.id]
  const [isFavorite, setIsFavorite] = useState(dashboard?.isFavorite || false)

  if (!dashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Dashboard no encontrado</p>
        <Button asChild>
          <Link href="/dashboard/marketing-intelligence/dashboards">Volver a Dashboards</Link>
        </Button>
      </div>
    )
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1500)
  }

  const getColorClass = (color: string) => {
    switch (color) {
      case "blue": return "bg-blue-500"
      case "purple": return "bg-purple-500"
      case "green": return "bg-green-500"
      case "orange": return "bg-orange-500"
      default: return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/marketing-intelligence/dashboards">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{dashboard.name}</h1>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsFavorite(!isFavorite)}
              >
                {isFavorite ? (
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ) : (
                  <StarOff className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>
              {dashboard.isShared && (
                <Badge variant="secondary">
                  <Share2 className="h-3 w-3 mr-1" />
                  Compartido
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{dashboard.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="last7">Últimos 7 días</SelectItem>
              <SelectItem value="last30">Últimos 30 días</SelectItem>
              <SelectItem value="last90">Últimos 90 días</SelectItem>
              <SelectItem value="thisMonth">Este mes</SelectItem>
              <SelectItem value="lastMonth">Mes anterior</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/marketing-intelligence/dashboards/${resolvedParams.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Widget
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockWidgets.filter(w => w.type === "kpi").map((widget) => (
          <Card key={widget.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{widget.title}</p>
                  <p className="text-2xl font-bold mt-1">{widget.value}</p>
                  <div className={`flex items-center gap-1 mt-2 text-sm ${widget.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {widget.change >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>{Math.abs(widget.change)}%</span>
                    <span className="text-muted-foreground">vs periodo anterior</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${getColorClass(widget.color)} bg-opacity-10`}>
                  <widget.icon className={`h-6 w-6 text-${widget.color}-500`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Tendencia de Gasto</CardTitle>
              <CardDescription>Evolución mensual del gasto en campañas</CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Exportar datos</DropdownMenuItem>
                <DropdownMenuItem>Configurar</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">Eliminar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-end justify-between gap-2 pt-4">
              {[30, 40, 35, 50, 49, 60, 70, 65, 80, 75, 90, 85].map((value, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                    style={{ height: `${value * 2}px` }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][index]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Rendimiento por Canal</CardTitle>
              <CardDescription>Comparativa de gasto por plataforma</CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Exportar datos</DropdownMenuItem>
                <DropdownMenuItem>Configurar</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">Eliminar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Google Ads", value: 45000, color: "bg-blue-500" },
                { name: "Facebook", value: 32000, color: "bg-indigo-500" },
                { name: "Instagram", value: 28000, color: "bg-pink-500" },
                { name: "LinkedIn", value: 15000, color: "bg-sky-500" },
                { name: "TikTok", value: 12000, color: "bg-purple-500" }
              ].map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.name}</span>
                    <span className="font-medium">${(item.value / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: `${(item.value / 45000) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución de Presupuesto</CardTitle>
            <CardDescription>Por etapa del funnel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-4">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="20" />
                  <circle 
                    cx="50" cy="50" r="40" fill="none" 
                    stroke="#3b82f6" strokeWidth="20"
                    strokeDasharray={`${35 * 2.51} ${100 * 2.51}`}
                    strokeDashoffset="0"
                  />
                  <circle 
                    cx="50" cy="50" r="40" fill="none" 
                    stroke="#8b5cf6" strokeWidth="20"
                    strokeDasharray={`${25 * 2.51} ${100 * 2.51}`}
                    strokeDashoffset={`${-35 * 2.51}`}
                  />
                  <circle 
                    cx="50" cy="50" r="40" fill="none" 
                    stroke="#10b981" strokeWidth="20"
                    strokeDasharray={`${40 * 2.51} ${100 * 2.51}`}
                    strokeDashoffset={`${-60 * 2.51}`}
                  />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { name: "Awareness", value: 35, color: "bg-blue-500" },
                { name: "Consideration", value: 25, color: "bg-purple-500" },
                { name: "Conversion", value: 40, color: "bg-green-500" }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Top Campañas</CardTitle>
            <CardDescription>Mejores campañas por rendimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Campaña</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Gasto</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Conversiones</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { campaign: "Verano 2026", spend: "$12,500", conversions: 847, roas: 3.2 },
                    { campaign: "Lanzamiento Producto", spend: "$8,300", conversions: 562, roas: 4.1 },
                    { campaign: "Retargeting Q2", spend: "$5,200", conversions: 423, roas: 5.8 },
                    { campaign: "Brand Awareness", spend: "$15,000", conversions: 312, roas: 1.8 }
                  ].map((row, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-3 px-2 font-medium">{row.campaign}</td>
                      <td className="py-3 px-2 text-right">{row.spend}</td>
                      <td className="py-3 px-2 text-right">{row.conversions}</td>
                      <td className="py-3 px-2 text-right">
                        <Badge variant={row.roas >= 3 ? "default" : "secondary"}>
                          {row.roas}x
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
