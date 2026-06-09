"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts"
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Kanban,
  Calendar,
  GanttChart,
  FileCheck,
  Activity,
  FileText,
  Building2,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  Filter,
  X,
  CalendarDays,
  User,
  Briefcase,
} from "lucide-react"
import Link from "next/link"
import { TaskFlowNavigation } from "@/components/tasksflow/navigation"

// Workload status configuration
const workloadStatusConfig = {
  disponible: { label: "Disponible", color: "bg-green-500", textColor: "text-green-600", bgLight: "bg-green-50 dark:bg-green-950" },
  saludable: { label: "Saludable", color: "bg-emerald-500", textColor: "text-emerald-600", bgLight: "bg-emerald-50 dark:bg-emerald-950" },
  alta_carga: { label: "Alta Carga", color: "bg-amber-500", textColor: "text-amber-600", bgLight: "bg-amber-50 dark:bg-amber-950" },
  sobrecargado: { label: "Sobrecargado", color: "bg-orange-500", textColor: "text-orange-600", bgLight: "bg-orange-50 dark:bg-orange-950" },
  riesgo: { label: "Riesgo", color: "bg-red-500", textColor: "text-red-600", bgLight: "bg-red-50 dark:bg-red-950" },
}

// Team workload data
const teamWorkloadData = [
  { 
    id: "1", 
    name: "Diana García", 
    role: "Diseñadora", 
    area: "Diseño",
    tasks: 8, 
    completed: 5, 
    overdue: 1, 
    inProgress: 2,
    hours: 32, 
    capacity: 40, 
    status: "saludable",
    efficiency: 92,
    avgDeliveryTime: 1.2,
    projects: ["Campaña Leads Q2", "Branding Residencial"]
  },
  { 
    id: "2", 
    name: "Carlos Ruiz", 
    role: "Programador", 
    area: "Programación",
    tasks: 6, 
    completed: 3, 
    overdue: 2, 
    inProgress: 1,
    hours: 45, 
    capacity: 40, 
    status: "sobrecargado",
    efficiency: 78,
    avgDeliveryTime: 1.8,
    projects: ["Landing Torre Central"]
  },
  { 
    id: "3", 
    name: "Eduardo Méndez", 
    role: "Estratega Digital", 
    area: "Estrategia",
    tasks: 5, 
    completed: 4, 
    overdue: 0, 
    inProgress: 1,
    hours: 28, 
    capacity: 40, 
    status: "disponible",
    efficiency: 95,
    avgDeliveryTime: 0.8,
    projects: ["Campaña Leads Q2", "SEO Mensual Mayo"]
  },
  { 
    id: "4", 
    name: "María López", 
    role: "Copywriter", 
    area: "Copywriting",
    tasks: 4, 
    completed: 2, 
    overdue: 0, 
    inProgress: 2,
    hours: 20, 
    capacity: 40, 
    status: "disponible",
    efficiency: 88,
    avgDeliveryTime: 1.0,
    projects: ["Branding Residencial"]
  },
  { 
    id: "5", 
    name: "Laura Vega", 
    role: "Community Manager", 
    area: "Community",
    tasks: 7, 
    completed: 4, 
    overdue: 1, 
    inProgress: 2,
    hours: 38, 
    capacity: 40, 
    status: "alta_carga",
    efficiency: 85,
    avgDeliveryTime: 1.1,
    projects: ["Branding Residencial", "Campaña Leads Q2"]
  },
  { 
    id: "6", 
    name: "Roberto Sánchez", 
    role: "Producción Audiovisual", 
    area: "Producción",
    tasks: 3, 
    completed: 0, 
    overdue: 2, 
    inProgress: 1,
    hours: 48, 
    capacity: 40, 
    status: "riesgo",
    efficiency: 45,
    avgDeliveryTime: 2.5,
    projects: ["Renders 3D"]
  },
  { 
    id: "7", 
    name: "Ana Torres", 
    role: "Analista SEO", 
    area: "Estrategia",
    tasks: 4, 
    completed: 3, 
    overdue: 0, 
    inProgress: 1,
    hours: 30, 
    capacity: 40, 
    status: "saludable",
    efficiency: 94,
    avgDeliveryTime: 0.9,
    projects: ["SEO Mensual Mayo"]
  },
  { 
    id: "8", 
    name: "Pedro Martínez", 
    role: "Productor Video", 
    area: "Producción",
    tasks: 2, 
    completed: 0, 
    overdue: 0, 
    inProgress: 2,
    hours: 35, 
    capacity: 40, 
    status: "saludable",
    efficiency: 82,
    avgDeliveryTime: 1.3,
    projects: ["Branding Residencial"]
  },
]

// Area workload data
const areaWorkloadData = [
  { name: "Diseño", tasks: 12, completed: 8, overdue: 1, capacity: 80, used: 65, members: 2 },
  { name: "Programación", tasks: 8, completed: 4, overdue: 2, capacity: 40, used: 45, members: 1 },
  { name: "Estrategia", tasks: 10, completed: 7, overdue: 0, capacity: 80, used: 58, members: 2 },
  { name: "Community", tasks: 6, completed: 4, overdue: 1, capacity: 40, used: 38, members: 1 },
  { name: "Producción", tasks: 5, completed: 0, overdue: 2, capacity: 80, used: 83, members: 2 },
  { name: "Copywriting", tasks: 4, completed: 2, overdue: 0, capacity: 40, used: 20, members: 1 },
]

// Weekly heatmap data
const weeklyHeatmapData = [
  { day: "Lun", Diana: 8, Carlos: 9, Eduardo: 6, María: 5, Laura: 8, Roberto: 10 },
  { day: "Mar", Diana: 7, Carlos: 10, Eduardo: 7, María: 4, Laura: 7, Roberto: 10 },
  { day: "Mie", Diana: 6, Carlos: 8, Eduardo: 5, María: 4, Laura: 8, Roberto: 9 },
  { day: "Jue", Diana: 7, Carlos: 9, Eduardo: 6, María: 4, Laura: 7, Roberto: 10 },
  { day: "Vie", Diana: 4, Carlos: 9, Eduardo: 4, María: 3, Laura: 8, Roberto: 9 },
]

const CHART_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

// Mock data for filters
const mockAccounts = [
  { id: "1", name: "Desarrolladora Horizonte" },
  { id: "2", name: "Torre Central Living" },
  { id: "3", name: "Residencial Bosques" },
  { id: "4", name: "Grupo Inmobiliario Altiva" },
  { id: "5", name: "Nova Arquitectura" },
]

export default function WorkloadPage() {
  const [loading, setLoading] = useState(true)
  const [selectedAgency, setSelectedAgency] = useState("all")
  const [selectedArea, setSelectedArea] = useState("all")
  const [agencies, setAgencies] = useState<any[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedPerson, setSelectedPerson] = useState("all")
  const [selectedAccount, setSelectedAccount] = useState("all")
  
  const activeFiltersCount = [dateFrom, dateTo, selectedPerson !== "all" ? selectedPerson : "", selectedAccount !== "all" ? selectedAccount : ""].filter(Boolean).length

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("agencies").select("id, name").eq("is_active", true)
      if (data) setAgencies(data)
      setLoading(false)
    }
    fetchData()
  }, [])

  // Calculate summary stats
  const totalMembers = teamWorkloadData.length
  const overloadedMembers = teamWorkloadData.filter(m => m.status === "sobrecargado" || m.status === "riesgo").length
  const availableMembers = teamWorkloadData.filter(m => m.status === "disponible").length
  const totalOverdueTasks = teamWorkloadData.reduce((sum, m) => sum + m.overdue, 0)
  const avgEfficiency = Math.round(teamWorkloadData.reduce((sum, m) => sum + m.efficiency, 0) / totalMembers)

  // Workload distribution for pie chart
  const workloadDistribution = Object.entries(workloadStatusConfig).map(([key, config]) => ({
    name: config.label,
    value: teamWorkloadData.filter(m => m.status === key).length,
    color: config.color,
  })).filter(d => d.value > 0)

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary" />
            Carga de Trabajo
          </h1>
          <p className="text-muted-foreground">Monitorea la capacidad y productividad del equipo</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedAgency} onValueChange={setSelectedAgency}>
            <SelectTrigger className="w-36">
              <Building2 className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Agencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {agencies.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedArea} onValueChange={setSelectedArea}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las áreas</SelectItem>
              <SelectItem value="diseno">Diseño</SelectItem>
              <SelectItem value="programacion">Programación</SelectItem>
              <SelectItem value="estrategia">Estrategia</SelectItem>
              <SelectItem value="community">Community</SelectItem>
              <SelectItem value="produccion">Producción</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros Avanzados
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setDateFrom("")
                  setDateTo("")
                  setSelectedPerson("all")
                  setSelectedAccount("all")
                }}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar Filtros
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Date Range */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  Fecha Desde
                </Label>
                <Input 
                  type="date" 
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  Fecha Hasta
                </Label>
                <Input 
                  type="date" 
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              
              {/* Person Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Persona
                </Label>
                <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar persona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las personas</SelectItem>
                    {teamWorkloadData.map(person => (
                      <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Account/Project Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  Cuenta / Proyecto
                </Label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las cuentas</SelectItem>
                    {mockAccounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Active Filters Summary */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                <span className="text-sm text-muted-foreground">Filtros activos:</span>
                {dateFrom && (
                  <Badge variant="secondary" className="gap-1">
                    Desde: {dateFrom}
                    <button onClick={() => setDateFrom("")} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {dateTo && (
                  <Badge variant="secondary" className="gap-1">
                    Hasta: {dateTo}
                    <button onClick={() => setDateTo("")} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedPerson !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {teamWorkloadData.find(p => p.id === selectedPerson)?.name}
                    <button onClick={() => setSelectedPerson("all")} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedAccount !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {mockAccounts.find(a => a.id === selectedAccount)?.name}
                    <button onClick={() => setSelectedAccount("all")} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <TaskFlowNavigation />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Equipo</p>
                <p className="text-2xl font-bold">{totalMembers}</p>
              </div>
              <Users className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Disponibles</p>
                <p className="text-2xl font-bold text-green-700">{availableMembers}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">Sobrecargados</p>
                <p className="text-2xl font-bold text-red-700">{overloadedMembers}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600">Tareas Vencidas</p>
                <p className="text-2xl font-bold text-amber-700">{totalOverdueTasks}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Eficiencia Promedio</p>
                <p className="text-2xl font-bold text-blue-700">{avgEfficiency}%</p>
              </div>
              <Target className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Workload by Person */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Carga por Persona</CardTitle>
            <CardDescription>Horas trabajadas vs capacidad semanal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamWorkloadData} layout="vertical" margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 50]} />
                  <YAxis type="category" dataKey="name" width={100} className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="hours" name="Horas usadas" radius={[0, 4, 4, 0]}>
                    {teamWorkloadData.map((entry, index) => {
                      const loadPercent = (entry.hours / entry.capacity) * 100
                      const color = loadPercent > 100 ? "#ef4444" : loadPercent > 90 ? "#f97316" : loadPercent > 75 ? "#f59e0b" : "#10b981"
                      return <Cell key={`cell-${index}`} fill={color} />
                    })}
                  </Bar>
                  <Bar dataKey="capacity" name="Capacidad" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Workload Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Distribución de Carga</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={workloadDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {workloadDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {workloadDistribution.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-xs">{item.name}</span>
                  <span className="text-xs font-bold ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Detail */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Detalle del Equipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {teamWorkloadData.map((member) => {
              const status = workloadStatusConfig[member.status as keyof typeof workloadStatusConfig]
              const loadPercent = Math.round((member.hours / member.capacity) * 100)

              return (
                <div key={member.id} className={`p-4 rounded-lg border ${status.bgLight}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {member.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                    <Badge className={`${status.color} text-white text-xs`}>
                      {status.label}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Capacidad</span>
                      <span className="font-medium">{member.hours}h / {member.capacity}h</span>
                    </div>
                    <Progress value={Math.min(loadPercent, 100)} className="h-2" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded bg-background">
                      <p className="text-lg font-bold">{member.tasks}</p>
                      <p className="text-xs text-muted-foreground">Tareas</p>
                    </div>
                    <div className="p-2 rounded bg-background">
                      <p className="text-lg font-bold text-green-600">{member.completed}</p>
                      <p className="text-xs text-muted-foreground">Completadas</p>
                    </div>
                    <div className="p-2 rounded bg-background">
                      <p className={`text-lg font-bold ${member.overdue > 0 ? "text-red-600" : ""}`}>{member.overdue}</p>
                      <p className="text-xs text-muted-foreground">Vencidas</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-amber-500" />
                      <span className="text-xs">Eficiencia: {member.efficiency}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-blue-500" />
                      <span className="text-xs">{member.avgDeliveryTime}d prom</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Area Workload */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Carga por Área</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {areaWorkloadData.map((area) => {
              const loadPercent = Math.round((area.used / area.capacity) * 100)
              const statusColor = loadPercent > 100 ? "text-red-600" : loadPercent > 80 ? "text-amber-600" : "text-green-600"

              return (
                <div key={area.name} className="p-4 rounded-lg border">
                  <h4 className="font-medium mb-2">{area.name}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Carga</span>
                      <span className={`font-medium ${statusColor}`}>{loadPercent}%</span>
                    </div>
                    <Progress value={Math.min(loadPercent, 100)} className="h-1.5" />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Tareas</p>
                      <p className="font-medium">{area.tasks}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Vencidas</p>
                      <p className={`font-medium ${area.overdue > 0 ? "text-red-600" : ""}`}>{area.overdue}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
