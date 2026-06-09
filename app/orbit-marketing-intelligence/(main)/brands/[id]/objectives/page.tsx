"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
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
import { toast } from "sonner"
import {
  ArrowLeft,
  Target,
  DollarSign,
  TrendingUp,
  BarChart3,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Percent,
  Users,
  MousePointer,
  Eye,
  ShoppingCart,
  Heart,
  MessageSquare,
  Share2,
} from "lucide-react"
import { mockBrands } from "@/lib/marketing-intelligence/brand-mock-data"
import { KPIRangeInput, KPIStatusIndicator } from "@/components/marketing-intelligence/brands/kpi-range-input"

// KPI templates by category
const kpiTemplates = {
  awareness: [
    { id: "impressions", name: "Impresiones", icon: Eye, unit: "number" },
    { id: "reach", name: "Alcance", icon: Users, unit: "number" },
    { id: "brand_mentions", name: "Menciones de marca", icon: MessageSquare, unit: "number" },
    { id: "share_of_voice", name: "Share of Voice", icon: Percent, unit: "percentage" },
  ],
  engagement: [
    { id: "engagement_rate", name: "Tasa de Engagement", icon: Heart, unit: "percentage" },
    { id: "comments", name: "Comentarios", icon: MessageSquare, unit: "number" },
    { id: "shares", name: "Compartidos", icon: Share2, unit: "number" },
    { id: "saves", name: "Guardados", icon: Heart, unit: "number" },
  ],
  traffic: [
    { id: "website_visits", name: "Visitas al sitio", icon: MousePointer, unit: "number" },
    { id: "ctr", name: "CTR", icon: Percent, unit: "percentage" },
    { id: "bounce_rate", name: "Bounce Rate", icon: TrendingUp, unit: "percentage" },
    { id: "session_duration", name: "Duración de sesión", icon: Clock, unit: "time" },
  ],
  conversion: [
    { id: "leads", name: "Leads generados", icon: Users, unit: "number" },
    { id: "conversion_rate", name: "Tasa de conversión", icon: Percent, unit: "percentage" },
    { id: "cpl", name: "Costo por Lead", icon: DollarSign, unit: "currency" },
    { id: "sales", name: "Ventas", icon: ShoppingCart, unit: "number" },
    { id: "revenue", name: "Revenue", icon: DollarSign, unit: "currency" },
    { id: "roas", name: "ROAS", icon: TrendingUp, unit: "multiplier" },
  ],
}

// Budget allocation categories
const budgetCategories = [
  { id: "paid_social", name: "Pauta en Redes Sociales", color: "#3b82f6" },
  { id: "paid_search", name: "Search (Google Ads)", color: "#10b981" },
  { id: "display", name: "Display / Programática", color: "#f59e0b" },
  { id: "influencers", name: "Influencers", color: "#ec4899" },
  { id: "content_production", name: "Producción de Contenido", color: "#8b5cf6" },
  { id: "tools", name: "Herramientas y Software", color: "#6366f1" },
  { id: "other", name: "Otros", color: "#94a3b8" },
]

export default function BrandObjectivesPage() {
  const params = useParams()
  const brandId = params.id as string
  
  const brand = mockBrands.find(b => b.id === brandId)
  
  const [activeTab, setActiveTab] = useState("objectives")
  
  // Objectives state
  const [objectives, setObjectives] = useState([
    {
      id: "obj1",
      name: "Aumentar awareness de marca",
      category: "awareness",
      targetDate: "2024-06-30",
      status: "on_track",
      progress: 65,
      kpis: ["impressions", "reach", "brand_mentions"]
    },
    {
      id: "obj2",
      name: "Generar leads calificados",
      category: "conversion",
      targetDate: "2024-06-30",
      status: "at_risk",
      progress: 40,
      kpis: ["leads", "cpl", "conversion_rate"]
    },
    {
      id: "obj3",
      name: "Mejorar engagement en redes",
      category: "engagement",
      targetDate: "2024-06-30",
      status: "on_track",
      progress: 78,
      kpis: ["engagement_rate", "comments", "shares"]
    },
  ])
  
  // Budget state
  const [monthlyBudget, setMonthlyBudget] = useState(150000)
  const [budgetAllocation, setBudgetAllocation] = useState([
    { categoryId: "paid_social", percentage: 40, amount: 60000 },
    { categoryId: "paid_search", percentage: 25, amount: 37500 },
    { categoryId: "content_production", percentage: 15, amount: 22500 },
    { categoryId: "influencers", percentage: 10, amount: 15000 },
    { categoryId: "tools", percentage: 5, amount: 7500 },
    { categoryId: "other", percentage: 5, amount: 7500 },
  ])
  
  // KPIs state with ranges
  const [kpiTargets, setKpiTargets] = useState([
    { kpiId: "impressions", min: 500000, target: 750000, max: 1000000, current: 620000 },
    { kpiId: "reach", min: 100000, target: 150000, max: 200000, current: 125000 },
    { kpiId: "engagement_rate", min: 2, target: 3.5, max: 5, current: 3.2 },
    { kpiId: "leads", min: 100, target: 200, max: 300, current: 85 },
    { kpiId: "cpl", min: 150, target: 200, max: 300, current: 245 },
    { kpiId: "conversion_rate", min: 1, target: 2, max: 3, current: 1.4 },
  ])
  
  if (!brand) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Marca no encontrada</p>
      </div>
    )
  }
  
  const getKpiInfo = (kpiId: string) => {
    for (const category of Object.values(kpiTemplates)) {
      const kpi = category.find(k => k.id === kpiId)
      if (kpi) return kpi
    }
    return null
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "on_track": return "bg-green-100 text-green-700 border-green-200"
      case "at_risk": return "bg-amber-100 text-amber-700 border-amber-200"
      case "off_track": return "bg-red-100 text-red-700 border-red-200"
      default: return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "on_track": return "En camino"
      case "at_risk": return "En riesgo"
      case "off_track": return "Fuera de objetivo"
      default: return "Sin estado"
    }
  }
  
  const handleUpdateBudgetAllocation = (categoryId: string, newPercentage: number) => {
    setBudgetAllocation(prev => prev.map(item => 
      item.categoryId === categoryId 
        ? { ...item, percentage: newPercentage, amount: (monthlyBudget * newPercentage) / 100 }
        : item
    ))
  }
  
  const totalAllocated = budgetAllocation.reduce((sum, item) => sum + item.percentage, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/orbit-marketing-intelligence/brands/${brandId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Objetivos, Presupuestos y KPIs</h1>
            <p className="text-muted-foreground">{brand.name} - Planificación estratégica</p>
          </div>
        </div>
        <Button onClick={() => toast.success("Cambios guardados")}>
          <Save className="h-4 w-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="objectives" className="gap-2">
            <Target className="h-4 w-4" />
            Objetivos
          </TabsTrigger>
          <TabsTrigger value="budget" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Presupuesto
          </TabsTrigger>
          <TabsTrigger value="kpis" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            KPIs
          </TabsTrigger>
        </TabsList>
        
        {/* Objectives Tab */}
        <TabsContent value="objectives" className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Define los objetivos de marketing para esta marca
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Objetivo
            </Button>
          </div>
          
          <div className="grid gap-4">
            {objectives.map((objective) => (
              <Card key={objective.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{objective.name}</h3>
                        <Badge variant="outline" className={getStatusColor(objective.status)}>
                          {objective.status === "on_track" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {objective.status === "at_risk" && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {getStatusLabel(objective.status)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Fecha límite: {objective.targetDate}
                        </span>
                        <Badge variant="secondary">{objective.category}</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progreso</span>
                          <span className="font-medium">{objective.progress}%</span>
                        </div>
                        <Progress 
                          value={objective.progress} 
                          className={`h-2 ${
                            objective.status === "on_track" ? "[&>div]:bg-green-500" :
                            objective.status === "at_risk" ? "[&>div]:bg-amber-500" :
                            "[&>div]:bg-red-500"
                          }`}
                        />
                      </div>
                      
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-2">KPIs asociados:</p>
                        <div className="flex flex-wrap gap-2">
                          {objective.kpis.map(kpiId => {
                            const kpi = getKpiInfo(kpiId)
                            if (!kpi) return null
                            const Icon = kpi.icon
                            return (
                              <Badge key={kpiId} variant="outline" className="gap-1">
                                <Icon className="h-3 w-3" />
                                {kpi.name}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Budget Tab */}
        <TabsContent value="budget" className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Presupuesto Mensual</CardDescription>
                <CardTitle className="text-3xl">${monthlyBudget.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  type="number"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                  className="mt-2"
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Presupuesto Trimestral</CardDescription>
                <CardTitle className="text-3xl">${(monthlyBudget * 3).toLocaleString()}</CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Presupuesto Anual</CardDescription>
                <CardTitle className="text-3xl">${(monthlyBudget * 12).toLocaleString()}</CardTitle>
              </CardHeader>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Distribución del Presupuesto</CardTitle>
                  <CardDescription>Asigna el presupuesto por categoría</CardDescription>
                </div>
                <Badge variant={totalAllocated === 100 ? "default" : "destructive"}>
                  {totalAllocated}% asignado
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {totalAllocated !== 100 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">
                    {totalAllocated < 100 
                      ? `Faltan ${100 - totalAllocated}% por asignar`
                      : `Excedido en ${totalAllocated - 100}%`
                    }
                  </span>
                </div>
              )}
              
              <div className="space-y-4">
                {budgetAllocation.map((item) => {
                  const category = budgetCategories.find(c => c.id === item.categoryId)
                  if (!category) return null
                  
                  return (
                    <div key={item.categoryId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            ${item.amount.toLocaleString()}
                          </span>
                          <div className="flex items-center gap-2 w-32">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={item.percentage}
                              onChange={(e) => handleUpdateBudgetAllocation(item.categoryId, Number(e.target.value))}
                              className="h-8 text-right"
                            />
                            <span className="text-sm">%</span>
                          </div>
                        </div>
                      </div>
                      <Progress 
                        value={item.percentage} 
                        className="h-2"
                        style={{ 
                          // @ts-ignore
                          '--progress-color': category.color 
                        } as React.CSSProperties}
                      />
                    </div>
                  )
                })}
              </div>
              
              {/* Visual breakdown */}
              <div className="mt-6 h-8 rounded-full overflow-hidden flex">
                {budgetAllocation.map((item) => {
                  const category = budgetCategories.find(c => c.id === item.categoryId)
                  if (!category || item.percentage === 0) return null
                  
                  return (
                    <div
                      key={item.categoryId}
                      className="h-full transition-all"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: category.color
                      }}
                      title={`${category.name}: ${item.percentage}%`}
                    />
                  )
                })}
              </div>
              
              <div className="mt-4 flex flex-wrap gap-3">
                {budgetAllocation.map((item) => {
                  const category = budgetCategories.find(c => c.id === item.categoryId)
                  if (!category || item.percentage === 0) return null
                  
                  return (
                    <div key={item.categoryId} className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* KPIs Tab */}
        <TabsContent value="kpis" className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Define rangos de KPIs con semáforo automático
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Agregar KPI
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>KPIs con Rangos y Semáforos</CardTitle>
              <CardDescription>
                El semáforo indica automáticamente si el KPI está en verde (alcanzado), 
                amarillo (en riesgo) o rojo (por debajo del mínimo)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>KPI</TableHead>
                    <TableHead className="text-center">Mínimo</TableHead>
                    <TableHead className="text-center">Objetivo</TableHead>
                    <TableHead className="text-center">Máximo</TableHead>
                    <TableHead className="text-center">Actual</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kpiTargets.map((kpiTarget) => {
                    const kpiInfo = getKpiInfo(kpiTarget.kpiId)
                    if (!kpiInfo) return null
                    const Icon = kpiInfo.icon
                    
                    // Determine status based on current value
                    let status: "green" | "yellow" | "red"
                    if (kpiTarget.current >= kpiTarget.target) {
                      status = "green"
                    } else if (kpiTarget.current >= kpiTarget.min) {
                      status = "yellow"
                    } else {
                      status = "red"
                    }
                    
                    // For inverse KPIs like CPL (lower is better)
                    if (kpiTarget.kpiId === "cpl" || kpiTarget.kpiId === "bounce_rate") {
                      if (kpiTarget.current <= kpiTarget.target) {
                        status = "green"
                      } else if (kpiTarget.current <= kpiTarget.max) {
                        status = "yellow"
                      } else {
                        status = "red"
                      }
                    }
                    
                    const formatValue = (value: number) => {
                      if (kpiInfo.unit === "currency") return `$${value.toLocaleString()}`
                      if (kpiInfo.unit === "percentage") return `${value}%`
                      if (kpiInfo.unit === "multiplier") return `${value}x`
                      return value.toLocaleString()
                    }
                    
                    return (
                      <TableRow key={kpiTarget.kpiId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{kpiInfo.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            value={kpiTarget.min}
                            onChange={(e) => setKpiTargets(prev => prev.map(k => 
                              k.kpiId === kpiTarget.kpiId ? { ...k, min: Number(e.target.value) } : k
                            ))}
                            className="w-24 h-8 text-center mx-auto"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            value={kpiTarget.target}
                            onChange={(e) => setKpiTargets(prev => prev.map(k => 
                              k.kpiId === kpiTarget.kpiId ? { ...k, target: Number(e.target.value) } : k
                            ))}
                            className="w-24 h-8 text-center mx-auto font-semibold"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            value={kpiTarget.max}
                            onChange={(e) => setKpiTargets(prev => prev.map(k => 
                              k.kpiId === kpiTarget.kpiId ? { ...k, max: Number(e.target.value) } : k
                            ))}
                            className="w-24 h-8 text-center mx-auto"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold">{formatValue(kpiTarget.current)}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <KPIStatusIndicator status={status} />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {/* KPI Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Plantillas de KPIs</CardTitle>
              <CardDescription>Agrega KPIs predefinidos por categoría</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {Object.entries(kpiTemplates).map(([category, kpis]) => (
                  <div key={category}>
                    <h4 className="font-medium mb-3 capitalize">{category}</h4>
                    <div className="space-y-2">
                      {kpis.map(kpi => {
                        const Icon = kpi.icon
                        const isAdded = kpiTargets.some(k => k.kpiId === kpi.id)
                        
                        return (
                          <div 
                            key={kpi.id}
                            className={`flex items-center justify-between p-2 rounded-lg border ${
                              isAdded ? "bg-muted/50" : "hover:bg-muted/30 cursor-pointer"
                            }`}
                            onClick={() => {
                              if (!isAdded) {
                                setKpiTargets(prev => [...prev, {
                                  kpiId: kpi.id,
                                  min: 0,
                                  target: 100,
                                  max: 200,
                                  current: 0
                                }])
                                toast.success(`KPI "${kpi.name}" agregado`)
                              }
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{kpi.name}</span>
                            </div>
                            {isAdded ? (
                              <Badge variant="secondary" className="text-xs">Agregado</Badge>
                            ) : (
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
