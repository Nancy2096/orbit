"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  LayoutDashboard, 
  Search, 
  Plus, 
  Settings,
  Share2,
  Copy,
  Trash,
  Edit,
  Eye,
  BarChart3,
  LineChart,
  PieChart,
  Table as TableIcon,
  TrendingUp,
  Calendar,
  Users,
  Globe,
  Star,
  StarOff,
  MoreVertical,
  GripVertical
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock dashboards
const mockDashboards = [
  {
    id: "dash1",
    name: "Performance General",
    description: "Vista general de todas las campañas",
    createdBy: "Admin",
    createdAt: "2026-04-15",
    lastModified: "2026-05-18",
    isFavorite: true,
    isShared: true,
    widgets: 8,
    thumbnail: "performance"
  },
  {
    id: "dash2",
    name: "ROI por Canal",
    description: "Análisis de retorno por canal de marketing",
    createdBy: "Analista",
    createdAt: "2026-04-20",
    lastModified: "2026-05-17",
    isFavorite: true,
    isShared: false,
    widgets: 6,
    thumbnail: "roi"
  },
  {
    id: "dash3",
    name: "Embudo de Conversión",
    description: "Seguimiento del funnel de ventas",
    createdBy: "Admin",
    createdAt: "2026-05-01",
    lastModified: "2026-05-16",
    isFavorite: false,
    isShared: true,
    widgets: 5,
    thumbnail: "funnel"
  },
  {
    id: "dash4",
    name: "Social Media Metrics",
    description: "Métricas de redes sociales",
    createdBy: "Community Manager",
    createdAt: "2026-05-10",
    lastModified: "2026-05-15",
    isFavorite: false,
    isShared: false,
    widgets: 7,
    thumbnail: "social"
  },
  {
    id: "dash5",
    name: "Leads Overview",
    description: "Estado y calidad de leads",
    createdBy: "Ventas",
    createdAt: "2026-05-12",
    lastModified: "2026-05-18",
    isFavorite: false,
    isShared: true,
    widgets: 4,
    thumbnail: "leads"
  }
]

const widgetTypes = [
  { id: "line", name: "Gráfico de Líneas", icon: LineChart, description: "Tendencias a lo largo del tiempo" },
  { id: "bar", name: "Gráfico de Barras", icon: BarChart3, description: "Comparación entre categorías" },
  { id: "pie", name: "Gráfico Circular", icon: PieChart, description: "Distribución porcentual" },
  { id: "table", name: "Tabla de Datos", icon: TableIcon, description: "Datos en formato tabular" },
  { id: "kpi", name: "KPI Card", icon: TrendingUp, description: "Métrica individual destacada" },
  { id: "funnel", name: "Embudo", icon: Users, description: "Visualización de conversión" }
]

const availableMetrics = [
  { id: "spend", name: "Gasto Total", category: "ads" },
  { id: "impressions", name: "Impresiones", category: "ads" },
  { id: "clicks", name: "Clics", category: "ads" },
  { id: "ctr", name: "CTR", category: "ads" },
  { id: "cpc", name: "CPC", category: "ads" },
  { id: "conversions", name: "Conversiones", category: "ads" },
  { id: "cpa", name: "CPA", category: "ads" },
  { id: "roas", name: "ROAS", category: "ads" },
  { id: "sessions", name: "Sesiones", category: "analytics" },
  { id: "users", name: "Usuarios", category: "analytics" },
  { id: "bounce_rate", name: "Tasa de Rebote", category: "analytics" },
  { id: "page_views", name: "Páginas Vistas", category: "analytics" },
  { id: "leads", name: "Leads", category: "crm" },
  { id: "mql", name: "MQLs", category: "crm" },
  { id: "sql", name: "SQLs", category: "crm" },
  { id: "opportunities", name: "Oportunidades", category: "crm" }
]

export default function CustomDashboardsPage() {
  const router = useRouter()
  const [dashboards, setDashboards] = useState(mockDashboards)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterView, setFilterView] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showWidgetDialog, setShowWidgetDialog] = useState(false)
  const [selectedDashboard, setSelectedDashboard] = useState<typeof mockDashboards[0] | null>(null)
  const [newDashboard, setNewDashboard] = useState({ name: "", description: "" })
  const [selectedWidgetType, setSelectedWidgetType] = useState("")
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([])

  const filteredDashboards = dashboards.filter(dash => {
    const matchesSearch = dash.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dash.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterView === "favorites") return matchesSearch && dash.isFavorite
    if (filterView === "shared") return matchesSearch && dash.isShared
    return matchesSearch
  })

  const toggleFavorite = (id: string) => {
    setDashboards(prev => prev.map(d => 
      d.id === id ? { ...d, isFavorite: !d.isFavorite } : d
    ))
  }

  const deleteDashboard = (id: string) => {
    setDashboards(prev => prev.filter(d => d.id !== id))
  }

  const createDashboard = () => {
    const newDash = {
      id: `dash${Date.now()}`,
      name: newDashboard.name,
      description: newDashboard.description,
      createdBy: "Admin",
      createdAt: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      isFavorite: false,
      isShared: false,
      widgets: 0,
      thumbnail: "custom"
    }
    setDashboards(prev => [...prev, newDash])
    setNewDashboard({ name: "", description: "" })
    setShowCreateDialog(false)
  }

  const getThumbnailGradient = (type: string) => {
    switch (type) {
      case "performance": return "from-blue-500 to-cyan-500"
      case "roi": return "from-green-500 to-emerald-500"
      case "funnel": return "from-purple-500 to-pink-500"
      case "social": return "from-orange-500 to-red-500"
      case "leads": return "from-amber-500 to-yellow-500"
      default: return "from-gray-500 to-slate-500"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboards Personalizados</h1>
          <p className="text-muted-foreground">Crea y gestiona tus propios dashboards de análisis</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Dashboard
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar dashboards..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Tabs value={filterView} onValueChange={setFilterView}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2">
              <Star className="h-4 w-4" />
              Favoritos
            </TabsTrigger>
            <TabsTrigger value="shared" className="gap-2">
              <Share2 className="h-4 w-4" />
              Compartidos
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDashboards.map(dashboard => (
          <Card 
            key={dashboard.id} 
            className="group hover:shadow-lg transition-all cursor-pointer overflow-hidden"
            onClick={() => router.push(`/orbit-marketing-intelligence/dashboards/${dashboard.id}`)}
          >
            {/* Thumbnail */}
            <div className={`h-32 bg-gradient-to-br ${getThumbnailGradient(dashboard.thumbnail)} relative`}>
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/orbit-marketing-intelligence/dashboards/${dashboard.id}`)
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Dashboard
                </Button>
              </div>
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 bg-white/20 hover:bg-white/40"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavorite(dashboard.id)
                  }}
                >
                  {dashboard.isFavorite ? (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ) : (
                    <StarOff className="h-4 w-4 text-white" />
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/20 hover:bg-white/40">
                      <MoreVertical className="h-4 w-4 text-white" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/orbit-marketing-intelligence/dashboards/${dashboard.id}`)
                    }}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/orbit-marketing-intelligence/dashboards/${dashboard.id}/edit`)
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartir
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteDashboard(dashboard.id)
                      }}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {dashboard.isShared && (
                <Badge className="absolute bottom-2 left-2 bg-white/20 text-white border-0">
                  <Share2 className="h-3 w-3 mr-1" />
                  Compartido
                </Badge>
              )}
            </div>

            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{dashboard.name}</CardTitle>
              <CardDescription>{dashboard.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{dashboard.widgets} widgets</span>
                <span>Editado {new Date(dashboard.lastModified).toLocaleDateString('es-MX')}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Create New Card */}
        <Card 
          className="border-dashed cursor-pointer hover:border-primary hover:bg-muted/50 transition-all flex items-center justify-center min-h-[280px]"
          onClick={() => setShowCreateDialog(true)}
        >
          <div className="text-center">
            <div className="p-4 bg-muted rounded-full inline-block mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium">Crear Nuevo Dashboard</p>
            <p className="text-sm text-muted-foreground">Diseña tu propio panel de análisis</p>
          </div>
        </Card>
      </div>

      {/* Create Dashboard Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Dashboard</DialogTitle>
            <DialogDescription>
              Crea un dashboard personalizado para visualizar tus métricas de marketing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre del Dashboard</Label>
              <Input 
                placeholder="Ej: Performance Q2 2026"
                value={newDashboard.name}
                onChange={(e) => setNewDashboard({ ...newDashboard, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea 
                placeholder="Describe el propósito de este dashboard..."
                value={newDashboard.description}
                onChange={(e) => setNewDashboard({ ...newDashboard, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Plantilla Inicial</Label>
              <Select defaultValue="blank">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blank">En Blanco</SelectItem>
                  <SelectItem value="performance">Performance de Campañas</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="leads">Generación de Leads</SelectItem>
                  <SelectItem value="ecommerce">E-commerce</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={createDashboard} disabled={!newDashboard.name}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Widget Dialog */}
      <Dialog open={showWidgetDialog} onOpenChange={setShowWidgetDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar Widget</DialogTitle>
            <DialogDescription>
              Selecciona el tipo de visualización y las métricas a mostrar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Tipo de Widget</Label>
              <div className="grid grid-cols-3 gap-3">
                {widgetTypes.map(type => (
                  <Card 
                    key={type.id}
                    className={`cursor-pointer transition-all ${selectedWidgetType === type.id ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}
                    onClick={() => setSelectedWidgetType(type.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <type.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="font-medium text-sm">{type.name}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Métricas a Mostrar</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto border rounded-lg p-3">
                {availableMetrics.map(metric => (
                  <div key={metric.id} className="flex items-center gap-2">
                    <Checkbox 
                      id={metric.id}
                      checked={selectedMetrics.includes(metric.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedMetrics([...selectedMetrics, metric.id])
                        } else {
                          setSelectedMetrics(selectedMetrics.filter(m => m !== metric.id))
                        }
                      }}
                    />
                    <label htmlFor={metric.id} className="text-sm cursor-pointer">
                      {metric.name}
                    </label>
                    <Badge variant="outline" className="text-[10px] ml-auto">
                      {metric.category}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWidgetDialog(false)}>
              Cancelar
            </Button>
            <Button disabled={!selectedWidgetType || selectedMetrics.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Widget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
