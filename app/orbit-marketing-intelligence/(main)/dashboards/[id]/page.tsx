"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
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
  Users,
  DollarSign,
  Eye,
  MousePointer,
  Target,
  Percent,
  ArrowRight,
  Heart,
  MessageCircle,
  Share,
  UserPlus,
  Mail,
  Phone,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Table2,
  Gauge,
  Activity,
  TrendingUp as MetricIcon,
  Hash,
  CircleDot
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Widget types available for adding
const widgetTypes = [
  {
    id: "kpi",
    name: "KPI Card",
    description: "Muestra una métrica individual con tendencia",
    icon: MetricIcon,
    category: "metrics"
  },
  {
    id: "line-chart",
    name: "Gráfico de Líneas",
    description: "Ideal para mostrar tendencias temporales",
    icon: LineChartIcon,
    category: "charts"
  },
  {
    id: "bar-chart",
    name: "Gráfico de Barras",
    description: "Comparar valores entre categorías",
    icon: BarChart3,
    category: "charts"
  },
  {
    id: "pie-chart",
    name: "Gráfico Circular",
    description: "Mostrar distribución porcentual",
    icon: PieChartIcon,
    category: "charts"
  },
  {
    id: "gauge",
    name: "Indicador de Progreso",
    description: "Visualizar progreso hacia una meta",
    icon: Gauge,
    category: "metrics"
  },
  {
    id: "table",
    name: "Tabla de Datos",
    description: "Mostrar datos en formato tabular",
    icon: Table2,
    category: "data"
  },
  {
    id: "activity-feed",
    name: "Feed de Actividad",
    description: "Mostrar eventos recientes",
    icon: Activity,
    category: "data"
  },
  {
    id: "counter",
    name: "Contador",
    description: "Número grande destacado",
    icon: Hash,
    category: "metrics"
  },
  {
    id: "donut-chart",
    name: "Gráfico de Dona",
    description: "Distribución con total central",
    icon: CircleDot,
    category: "charts"
  }
]

// Data sources available
const dataSources = [
  { id: "campaigns", name: "Campañas", description: "Datos de campañas pagadas" },
  { id: "social", name: "Redes Sociales", description: "Métricas de social media" },
  { id: "leads", name: "Leads", description: "Información de leads y CRM" },
  { id: "analytics", name: "Analytics", description: "Datos de Google Analytics" },
  { id: "seo", name: "SEO", description: "Métricas de posicionamiento" },
  { id: "email", name: "Email Marketing", description: "Estadísticas de email" },
]

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

// Dashboard-specific data
const dashboardData: Record<string, {
  kpis: Array<{ title: string; value: string; change: number; icon: any; color: string }>
  charts: any
  table: any
}> = {
  // Performance General
  "dash1": {
    kpis: [
      { title: "Gasto Total", value: "$45,230", change: 12.5, icon: DollarSign, color: "blue" },
      { title: "Impresiones", value: "2.4M", change: 8.3, icon: Eye, color: "purple" },
      { title: "Clics", value: "156K", change: -2.1, icon: MousePointer, color: "green" },
      { title: "Conversiones", value: "3,847", change: 15.7, icon: Target, color: "orange" }
    ],
    charts: {
      line: {
        title: "Tendencia de Gasto",
        description: "Evolución mensual del gasto en campañas",
        data: [30, 40, 35, 50, 49, 60, 70, 65, 80, 75, 90, 85]
      },
      bar: {
        title: "Rendimiento por Canal",
        description: "Comparativa de gasto por plataforma",
        data: [
          { name: "Google Ads", value: 45000, color: "bg-blue-500" },
          { name: "Facebook", value: 32000, color: "bg-indigo-500" },
          { name: "Instagram", value: 28000, color: "bg-pink-500" },
          { name: "LinkedIn", value: 15000, color: "bg-sky-500" },
          { name: "TikTok", value: 12000, color: "bg-purple-500" }
        ]
      },
      pie: {
        title: "Distribución de Presupuesto",
        description: "Por etapa del funnel",
        data: [
          { name: "Awareness", value: 35, color: "bg-blue-500" },
          { name: "Consideration", value: 25, color: "bg-purple-500" },
          { name: "Conversion", value: 40, color: "bg-green-500" }
        ]
      }
    },
    table: {
      title: "Top Campañas",
      description: "Mejores campañas por rendimiento",
      headers: ["Campaña", "Gasto", "Conversiones", "ROAS"],
      rows: [
        { campaign: "Verano 2026", spend: "$12,500", conversions: 847, roas: 3.2 },
        { campaign: "Lanzamiento Producto", spend: "$8,300", conversions: 562, roas: 4.1 },
        { campaign: "Retargeting Q2", spend: "$5,200", conversions: 423, roas: 5.8 },
        { campaign: "Brand Awareness", spend: "$15,000", conversions: 312, roas: 1.8 }
      ]
    }
  },
  // ROI por Canal
  "dash2": {
    kpis: [
      { title: "ROI Promedio", value: "324%", change: 18.2, icon: Percent, color: "green" },
      { title: "Inversión Total", value: "$132,500", change: 5.4, icon: DollarSign, color: "blue" },
      { title: "Retorno Total", value: "$429,700", change: 22.1, icon: TrendingUp, color: "purple" },
      { title: "Canales Activos", value: "8", change: 0, icon: Target, color: "orange" }
    ],
    charts: {
      line: {
        title: "Evolución del ROI",
        description: "ROI mensual por todos los canales",
        data: [180, 210, 245, 280, 310, 290, 320, 350, 340, 380, 360, 324]
      },
      bar: {
        title: "ROI por Canal",
        description: "Retorno de inversión por plataforma",
        data: [
          { name: "Email Marketing", value: 4200, color: "bg-green-500" },
          { name: "SEO Orgánico", value: 3800, color: "bg-emerald-500" },
          { name: "Google Ads", value: 320, color: "bg-blue-500" },
          { name: "Facebook Ads", value: 280, color: "bg-indigo-500" },
          { name: "LinkedIn", value: 220, color: "bg-sky-500" }
        ]
      },
      pie: {
        title: "Distribución de Inversión",
        description: "Por canal de marketing",
        data: [
          { name: "Paid Media", value: 45, color: "bg-blue-500" },
          { name: "Content", value: 25, color: "bg-purple-500" },
          { name: "Email", value: 15, color: "bg-green-500" },
          { name: "SEO", value: 15, color: "bg-orange-500" }
        ]
      }
    },
    table: {
      title: "Detalle por Canal",
      description: "Métricas de ROI detalladas",
      headers: ["Canal", "Inversión", "Retorno", "ROI"],
      rows: [
        { campaign: "Email Marketing", spend: "$8,500", conversions: "$35,700", roas: 4.2 },
        { campaign: "SEO Orgánico", spend: "$12,000", conversions: "$45,600", roas: 3.8 },
        { campaign: "Google Ads", spend: "$45,000", conversions: "$144,000", roas: 3.2 },
        { campaign: "Facebook Ads", spend: "$32,000", conversions: "$89,600", roas: 2.8 },
        { campaign: "LinkedIn Ads", spend: "$15,000", conversions: "$33,000", roas: 2.2 }
      ]
    }
  },
  // Embudo de Conversión
  "dash3": {
    kpis: [
      { title: "Visitantes", value: "125,430", change: 8.5, icon: Users, color: "blue" },
      { title: "Leads Generados", value: "4,521", change: 12.3, icon: UserPlus, color: "purple" },
      { title: "Oportunidades", value: "892", change: 5.7, icon: Target, color: "orange" },
      { title: "Clientes", value: "156", change: 18.9, icon: CheckCircle, color: "green" }
    ],
    charts: {
      line: {
        title: "Conversiones por Etapa",
        description: "Tendencia semanal de conversiones",
        data: [100, 95, 88, 75, 62, 48, 35, 28, 22, 18, 15, 12]
      },
      bar: {
        title: "Embudo de Conversión",
        description: "Porcentaje de conversión por etapa",
        data: [
          { name: "Visitantes → Leads", value: 3.6, color: "bg-blue-500" },
          { name: "Leads → MQL", value: 45, color: "bg-indigo-500" },
          { name: "MQL → SQL", value: 32, color: "bg-purple-500" },
          { name: "SQL → Oportunidad", value: 48, color: "bg-pink-500" },
          { name: "Oportunidad → Cliente", value: 17.5, color: "bg-green-500" }
        ]
      },
      pie: {
        title: "Estado del Pipeline",
        description: "Distribución de oportunidades",
        data: [
          { name: "Prospección", value: 30, color: "bg-blue-500" },
          { name: "Calificación", value: 25, color: "bg-purple-500" },
          { name: "Propuesta", value: 20, color: "bg-orange-500" },
          { name: "Negociación", value: 15, color: "bg-pink-500" },
          { name: "Cierre", value: 10, color: "bg-green-500" }
        ]
      }
    },
    table: {
      title: "Métricas del Funnel",
      description: "Rendimiento por etapa",
      headers: ["Etapa", "Volumen", "Tasa Conv.", "Tiempo Prom."],
      rows: [
        { campaign: "Visitantes", spend: "125,430", conversions: "-", roas: "-" },
        { campaign: "Leads", spend: "4,521", conversions: "3.6%", roas: "2 días" },
        { campaign: "MQL", spend: "2,034", conversions: "45%", roas: "5 días" },
        { campaign: "SQL", spend: "651", conversions: "32%", roas: "8 días" },
        { campaign: "Clientes", spend: "156", conversions: "17.5%", roas: "15 días" }
      ]
    }
  },
  // Social Media Metrics
  "dash4": {
    kpis: [
      { title: "Seguidores Totales", value: "458K", change: 4.2, icon: Users, color: "blue" },
      { title: "Engagement Rate", value: "4.8%", change: 0.6, icon: Heart, color: "pink" },
      { title: "Alcance Mensual", value: "2.1M", change: 15.3, icon: Eye, color: "purple" },
      { title: "Menciones", value: "1,234", change: -3.2, icon: MessageCircle, color: "orange" }
    ],
    charts: {
      line: {
        title: "Crecimiento de Seguidores",
        description: "Nuevos seguidores por mes",
        data: [2500, 3200, 2800, 4100, 3800, 4500, 5200, 4800, 5800, 6200, 5500, 6800]
      },
      bar: {
        title: "Engagement por Red Social",
        description: "Tasa de interacción por plataforma",
        data: [
          { name: "TikTok", value: 8.5, color: "bg-pink-500" },
          { name: "Instagram", value: 5.2, color: "bg-purple-500" },
          { name: "LinkedIn", value: 3.8, color: "bg-blue-500" },
          { name: "Facebook", value: 2.1, color: "bg-indigo-500" },
          { name: "Twitter/X", value: 1.8, color: "bg-sky-500" }
        ]
      },
      pie: {
        title: "Distribución de Seguidores",
        description: "Por red social",
        data: [
          { name: "Instagram", value: 40, color: "bg-purple-500" },
          { name: "Facebook", value: 25, color: "bg-blue-500" },
          { name: "TikTok", value: 20, color: "bg-pink-500" },
          { name: "LinkedIn", value: 10, color: "bg-sky-500" },
          { name: "Twitter/X", value: 5, color: "bg-gray-500" }
        ]
      }
    },
    table: {
      title: "Top Publicaciones",
      description: "Contenido con mejor rendimiento",
      headers: ["Publicación", "Red", "Likes", "Shares"],
      rows: [
        { campaign: "Lanzamiento producto nuevo", spend: "Instagram", conversions: "12.5K", roas: "2.3K" },
        { campaign: "Behind the scenes", spend: "TikTok", conversions: "45.2K", roas: "8.1K" },
        { campaign: "Caso de éxito cliente", spend: "LinkedIn", conversions: "3.8K", roas: "892" },
        { campaign: "Promoción verano", spend: "Facebook", conversions: "8.9K", roas: "1.5K" },
        { campaign: "Tutorial producto", spend: "YouTube", conversions: "22.1K", roas: "4.2K" }
      ]
    }
  },
  // Leads Overview
  "dash5": {
    kpis: [
      { title: "Total Leads", value: "2,847", change: 14.2, icon: Users, color: "blue" },
      { title: "Leads Calificados", value: "1,234", change: 8.7, icon: CheckCircle, color: "green" },
      { title: "En Seguimiento", value: "456", change: -2.3, icon: Clock, color: "orange" },
      { title: "Sin Contactar", value: "189", change: -15.4, icon: AlertCircle, color: "red" }
    ],
    charts: {
      line: {
        title: "Generación de Leads",
        description: "Leads captados por semana",
        data: [120, 145, 132, 168, 155, 189, 201, 178, 210, 195, 225, 238]
      },
      bar: {
        title: "Leads por Fuente",
        description: "Origen de los leads",
        data: [
          { name: "Sitio Web", value: 1200, color: "bg-blue-500" },
          { name: "Google Ads", value: 650, color: "bg-green-500" },
          { name: "Referidos", value: 420, color: "bg-purple-500" },
          { name: "Redes Sociales", value: 380, color: "bg-pink-500" },
          { name: "Email", value: 197, color: "bg-orange-500" }
        ]
      },
      pie: {
        title: "Calidad de Leads",
        description: "Por scoring",
        data: [
          { name: "Hot (80-100)", value: 15, color: "bg-red-500" },
          { name: "Warm (50-79)", value: 35, color: "bg-orange-500" },
          { name: "Cold (20-49)", value: 30, color: "bg-blue-500" },
          { name: "New (0-19)", value: 20, color: "bg-gray-500" }
        ]
      }
    },
    table: {
      title: "Leads Recientes",
      description: "Últimos leads ingresados",
      headers: ["Nombre", "Empresa", "Score", "Estado"],
      rows: [
        { campaign: "María González", spend: "Tech Solutions", conversions: "92", roas: "Hot" },
        { campaign: "Carlos Ruiz", spend: "Digital Corp", conversions: "78", roas: "Warm" },
        { campaign: "Ana Martínez", spend: "Marketing Pro", conversions: "65", roas: "Warm" },
        { campaign: "Pedro López", spend: "Startup XYZ", conversions: "45", roas: "Cold" },
        { campaign: "Laura Sánchez", spend: "Enterprise Inc", conversions: "88", roas: "Hot" }
      ]
    }
  }
}

export default function DashboardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [dateRange, setDateRange] = useState("last30")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [addWidgetOpen, setAddWidgetOpen] = useState(false)
  const [selectedWidgetType, setSelectedWidgetType] = useState<string | null>(null)
  const [widgetConfig, setWidgetConfig] = useState({
    name: "",
    dataSource: "",
    metric: "",
    description: ""
  })
  const [customWidgets, setCustomWidgets] = useState<Array<{
    id: string
    type: string
    name: string
    dataSource: string
    metric: string
  }>>([])
  
  const dashboard = mockDashboards[resolvedParams.id]
  const data = dashboardData[resolvedParams.id]
  const [isFavorite, setIsFavorite] = useState(dashboard?.isFavorite || false)

  if (!dashboard || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Dashboard no encontrado</p>
        <Button asChild>
          <Link href="/orbit-marketing-intelligence/dashboards">Volver a Dashboards</Link>
        </Button>
      </div>
    )
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1500)
  }

  const handleAddWidget = () => {
    if (!selectedWidgetType || !widgetConfig.name || !widgetConfig.dataSource) {
      toast.error("Completa todos los campos requeridos")
      return
    }
    
    const newWidget = {
      id: `widget-${Date.now()}`,
      type: selectedWidgetType,
      name: widgetConfig.name,
      dataSource: widgetConfig.dataSource,
      metric: widgetConfig.metric
    }
    
    setCustomWidgets(prev => [...prev, newWidget])
    setAddWidgetOpen(false)
    setSelectedWidgetType(null)
    setWidgetConfig({ name: "", dataSource: "", metric: "", description: "" })
    toast.success(`Widget "${widgetConfig.name}" agregado correctamente`)
  }

  const removeCustomWidget = (widgetId: string) => {
    setCustomWidgets(prev => prev.filter(w => w.id !== widgetId))
    toast.success("Widget eliminado")
  }

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-100 text-blue-600",
      purple: "bg-purple-100 text-purple-600",
      green: "bg-green-100 text-green-600",
      orange: "bg-orange-100 text-orange-600",
      pink: "bg-pink-100 text-pink-600",
      red: "bg-red-100 text-red-600"
    }
    return colors[color] || "bg-gray-100 text-gray-600"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Hot": return <Badge className="bg-red-500">Hot</Badge>
      case "Warm": return <Badge className="bg-orange-500">Warm</Badge>
      case "Cold": return <Badge className="bg-blue-500">Cold</Badge>
      default: return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/orbit-marketing-intelligence/dashboards">
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
            <Link href={`/orbit-marketing-intelligence/dashboards/${resolvedParams.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
          <Dialog open={addWidgetOpen} onOpenChange={setAddWidgetOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Widget
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Widget</DialogTitle>
                <DialogDescription>
                  Selecciona el tipo de widget y configúralo para agregarlo al dashboard
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="type" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="type">1. Tipo de Widget</TabsTrigger>
                  <TabsTrigger value="config" disabled={!selectedWidgetType}>2. Configuración</TabsTrigger>
                </TabsList>
                
                <TabsContent value="type" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-3">Métricas</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {widgetTypes.filter(w => w.category === "metrics").map(widget => (
                          <Card 
                            key={widget.id}
                            className={`cursor-pointer transition-all hover:border-primary ${selectedWidgetType === widget.id ? 'border-primary bg-primary/5' : ''}`}
                            onClick={() => setSelectedWidgetType(widget.id)}
                          >
                            <CardContent className="p-4 text-center">
                              <widget.icon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="font-medium text-sm">{widget.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">{widget.description}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-3">Gráficos</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {widgetTypes.filter(w => w.category === "charts").map(widget => (
                          <Card 
                            key={widget.id}
                            className={`cursor-pointer transition-all hover:border-primary ${selectedWidgetType === widget.id ? 'border-primary bg-primary/5' : ''}`}
                            onClick={() => setSelectedWidgetType(widget.id)}
                          >
                            <CardContent className="p-4 text-center">
                              <widget.icon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="font-medium text-sm">{widget.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">{widget.description}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-3">Datos</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {widgetTypes.filter(w => w.category === "data").map(widget => (
                          <Card 
                            key={widget.id}
                            className={`cursor-pointer transition-all hover:border-primary ${selectedWidgetType === widget.id ? 'border-primary bg-primary/5' : ''}`}
                            onClick={() => setSelectedWidgetType(widget.id)}
                          >
                            <CardContent className="p-4 text-center">
                              <widget.icon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="font-medium text-sm">{widget.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">{widget.description}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="config" className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="widget-name">Nombre del Widget *</Label>
                      <Input 
                        id="widget-name"
                        placeholder="Ej: Conversiones Mensuales"
                        value={widgetConfig.name}
                        onChange={(e) => setWidgetConfig(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="data-source">Fuente de Datos *</Label>
                      <Select 
                        value={widgetConfig.dataSource} 
                        onValueChange={(v) => setWidgetConfig(prev => ({ ...prev, dataSource: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una fuente de datos" />
                        </SelectTrigger>
                        <SelectContent>
                          {dataSources.map(source => (
                            <SelectItem key={source.id} value={source.id}>
                              <div>
                                <span className="font-medium">{source.name}</span>
                                <span className="text-muted-foreground ml-2">- {source.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="metric">Métrica Principal</Label>
                      <Select 
                        value={widgetConfig.metric} 
                        onValueChange={(v) => setWidgetConfig(prev => ({ ...prev, metric: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una métrica" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="impressions">Impresiones</SelectItem>
                          <SelectItem value="clicks">Clics</SelectItem>
                          <SelectItem value="conversions">Conversiones</SelectItem>
                          <SelectItem value="spend">Gasto</SelectItem>
                          <SelectItem value="revenue">Ingresos</SelectItem>
                          <SelectItem value="ctr">CTR</SelectItem>
                          <SelectItem value="cpc">CPC</SelectItem>
                          <SelectItem value="roas">ROAS</SelectItem>
                          <SelectItem value="leads">Leads</SelectItem>
                          <SelectItem value="followers">Seguidores</SelectItem>
                          <SelectItem value="engagement">Engagement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Descripción (opcional)</Label>
                      <Textarea 
                        id="description"
                        placeholder="Breve descripción del widget"
                        value={widgetConfig.description}
                        onChange={(e) => setWidgetConfig(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Vista Previa</h4>
                      <div className="flex items-center gap-3">
                        {selectedWidgetType && (
                          <>
                            {(() => {
                              const WidgetIcon = widgetTypes.find(w => w.id === selectedWidgetType)?.icon || BarChart3
                              return <WidgetIcon className="h-10 w-10 text-primary" />
                            })()}
                            <div>
                              <p className="font-medium">{widgetConfig.name || "Sin nombre"}</p>
                              <p className="text-sm text-muted-foreground">
                                {widgetTypes.find(w => w.id === selectedWidgetType)?.name} · {dataSources.find(s => s.id === widgetConfig.dataSource)?.name || "Sin fuente"}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setAddWidgetOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddWidget} disabled={!selectedWidgetType || !widgetConfig.name || !widgetConfig.dataSource}>
                  Agregar Widget
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Custom Widgets Added by User */}
      {customWidgets.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Widgets Personalizados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customWidgets.map(widget => {
              const WidgetIcon = widgetTypes.find(w => w.id === widget.type)?.icon || BarChart3
              return (
                <Card key={widget.id} className="relative group">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    onClick={() => removeCustomWidget(widget.id)}
                  >
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </Button>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <WidgetIcon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">{widget.name}</CardTitle>
                    </div>
                    <CardDescription>
                      {dataSources.find(s => s.id === widget.dataSource)?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-24 bg-muted/50 rounded-lg flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">
                        {widgetTypes.find(w => w.id === widget.type)?.name}
                      </p>
                    </div>
                    <Badge variant="outline" className="mt-3">
                      {widget.metric || "Sin métrica"}
                    </Badge>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.kpis.map((kpi, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.title}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                  <div className={`flex items-center gap-1 mt-2 text-sm ${kpi.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {kpi.change >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>{Math.abs(kpi.change)}%</span>
                    <span className="text-muted-foreground">vs periodo anterior</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${getColorClass(kpi.color)}`}>
                  <kpi.icon className="h-6 w-6" />
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
              <CardTitle className="text-lg">{data.charts.line.title}</CardTitle>
              <CardDescription>{data.charts.line.description}</CardDescription>
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
              {data.charts.line.data.map((value: number, index: number) => {
                const maxValue = Math.max(...data.charts.line.data)
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                      style={{ height: `${(value / maxValue) * 180}px` }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][index]}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">{data.charts.bar.title}</CardTitle>
              <CardDescription>{data.charts.bar.description}</CardDescription>
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
              {data.charts.bar.data.map((item: any, index: number) => {
                const maxValue = Math.max(...data.charts.bar.data.map((d: any) => d.value))
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="font-medium">
                        {item.value >= 1000 ? `${(item.value / 1000).toFixed(item.value >= 10000 ? 0 : 1)}K` : `${item.value}${resolvedParams.id === 'dash4' || resolvedParams.id === 'dash3' ? '%' : ''}`}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color} rounded-full transition-all`}
                        style={{ width: `${(item.value / maxValue) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{data.charts.pie.title}</CardTitle>
            <CardDescription>{data.charts.pie.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-4">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="20" />
                  {data.charts.pie.data.reduce((acc: any[], item: any, index: number) => {
                    const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].value : 0
                    const colorMap: Record<string, string> = {
                      "bg-blue-500": "#3b82f6",
                      "bg-purple-500": "#8b5cf6",
                      "bg-green-500": "#10b981",
                      "bg-orange-500": "#f97316",
                      "bg-pink-500": "#ec4899",
                      "bg-red-500": "#ef4444",
                      "bg-sky-500": "#0ea5e9",
                      "bg-gray-500": "#6b7280"
                    }
                    acc.push({
                      ...item,
                      offset,
                      stroke: colorMap[item.color] || "#6b7280"
                    })
                    return acc
                  }, []).map((item: any, index: number) => (
                    <circle 
                      key={index}
                      cx="50" cy="50" r="40" fill="none" 
                      stroke={item.stroke} strokeWidth="20"
                      strokeDasharray={`${item.value * 2.51} ${100 * 2.51}`}
                      strokeDashoffset={`${-item.offset * 2.51}`}
                    />
                  ))}
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              {data.charts.pie.data.map((item: any, index: number) => (
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
            <CardTitle className="text-lg">{data.table.title}</CardTitle>
            <CardDescription>{data.table.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    {data.table.headers.map((header: string, index: number) => (
                      <th key={index} className={`py-3 px-2 text-sm font-medium text-muted-foreground ${index === 0 ? 'text-left' : 'text-right'}`}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.table.rows.map((row: any, index: number) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-3 px-2 font-medium">{row.campaign}</td>
                      <td className="py-3 px-2 text-right">{row.spend}</td>
                      <td className="py-3 px-2 text-right">{row.conversions}</td>
                      <td className="py-3 px-2 text-right">
                        {resolvedParams.id === 'dash5' ? (
                          getStatusBadge(row.roas)
                        ) : (
                          <Badge variant={typeof row.roas === 'number' && row.roas >= 3 ? "default" : "secondary"}>
                            {typeof row.roas === 'number' ? `${row.roas}x` : row.roas}
                          </Badge>
                        )}
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
