"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
  RadialBarChart,
  RadialBar,
} from "recharts"
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Kanban,
  Calendar,
  GanttChart,
  FileCheck,
  Users,
  Activity,
  FileText,
  Layers,
  Settings,
  Plus,
  Download,
  Filter,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Briefcase,
  Building2,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Timer,
  Target,
  Zap,
  XCircle,
  PlayCircle,
  PauseCircle,
  MoreHorizontal,
  UserCog,
  X,
  CalendarDays,
  User,
} from "lucide-react"
import Link from "next/link"
import { TaskFlowNavigation } from "@/components/tasksflow/navigation"

// Status configurations
const taskStatusConfig = {
  nueva: { label: "Nueva", color: "bg-slate-500", textColor: "text-slate-600" },
  por_asignar: { label: "Por Asignar", color: "bg-purple-500", textColor: "text-purple-600" },
  en_proceso: { label: "En Proceso", color: "bg-blue-500", textColor: "text-blue-600" },
  revision_interna: { label: "Revisión Interna", color: "bg-cyan-500", textColor: "text-cyan-600" },
  revision_cliente: { label: "Revisión Cliente", color: "bg-indigo-500", textColor: "text-indigo-600" },
  cambios_solicitados: { label: "Cambios", color: "bg-amber-500", textColor: "text-amber-600" },
  aprobada: { label: "Aprobada", color: "bg-emerald-500", textColor: "text-emerald-600" },
  entregada: { label: "Entregada", color: "bg-green-600", textColor: "text-green-700" },
  pausada: { label: "Pausada", color: "bg-gray-400", textColor: "text-gray-500" },
  cancelada: { label: "Cancelada", color: "bg-red-400", textColor: "text-red-500" },
  vencida: { label: "Vencida", color: "bg-red-600", textColor: "text-red-700" },
}

const priorityConfig = {
  baja: { label: "Baja", color: "bg-slate-400", icon: "↓" },
  media: { label: "Media", color: "bg-blue-400", icon: "→" },
  alta: { label: "Alta", color: "bg-amber-500", icon: "↑" },
  urgente: { label: "Urgente", color: "bg-orange-500", icon: "⚡" },
  critica: { label: "Crítica", color: "bg-red-600", icon: "🔥" },
}

const projectHealthConfig = {
  saludable: { label: "Saludable", color: "bg-emerald-500", bgLight: "bg-emerald-50 dark:bg-emerald-950" },
  atencion: { label: "Atención", color: "bg-amber-500", bgLight: "bg-amber-50 dark:bg-amber-950" },
  riesgo: { label: "En Riesgo", color: "bg-orange-500", bgLight: "bg-orange-50 dark:bg-orange-950" },
  critico: { label: "Crítico", color: "bg-red-600", bgLight: "bg-red-50 dark:bg-red-950" },
}

// Dummy data
const dummyProjects = [
  { id: "1", name: "Campaña Leads Q2", client: "Desarrolladora Horizonte", progress: 75, health: "saludable", tasks: 24, completed: 18, dueDate: "2026-05-25", team: ["AM", "DG", "PR"] },
  { id: "2", name: "Landing Torre Central", client: "Torre Central Living", progress: 45, health: "atencion", tasks: 18, completed: 8, dueDate: "2026-05-18", team: ["PR", "DG"] },
  { id: "3", name: "Branding Residencial", client: "Residencial Bosques", progress: 30, health: "riesgo", tasks: 32, completed: 10, dueDate: "2026-05-15", team: ["DG", "CM", "PR"] },
  { id: "4", name: "SEO Mensual Mayo", client: "Grupo Inmobiliario Altiva", progress: 60, health: "saludable", tasks: 12, completed: 7, dueDate: "2026-05-30", team: ["ED"] },
  { id: "5", name: "Renders 3D", client: "Nova Arquitectura", progress: 15, health: "critico", tasks: 8, completed: 1, dueDate: "2026-05-12", team: ["PA"] },
]

const dummyTasks = [
  { id: "1", name: "Diseñar artes campaña leads", project: "Campaña Leads Q2", client: "Desarrolladora Horizonte", assignee: "Diana García", status: "en_proceso", priority: "alta", dueDate: "2026-05-12", hours: 4.5, area: "Diseño" },
  { id: "2", name: "Configurar Meta Ads", project: "Campaña Leads Q2", client: "Desarrolladora Horizonte", assignee: "Eduardo Méndez", status: "por_asignar", priority: "urgente", dueDate: "2026-05-11", hours: 0, area: "Estrategia" },
  { id: "3", name: "Revisar copies landing", project: "Landing Torre Central", client: "Torre Central Living", assignee: "María López", status: "revision_interna", priority: "media", dueDate: "2026-05-13", hours: 2, area: "Copywriting" },
  { id: "4", name: "Subir cambios a web", project: "Landing Torre Central", client: "Torre Central Living", assignee: "Carlos Ruiz", status: "cambios_solicitados", priority: "alta", dueDate: "2026-05-10", hours: 3, area: "Programación" },
  { id: "5", name: "Render exterior torre", project: "Renders 3D", client: "Nova Arquitectura", assignee: "Roberto Sánchez", status: "vencida", priority: "critica", dueDate: "2026-05-08", hours: 12, area: "Producción" },
  { id: "6", name: "Reporte mensual abril", project: "SEO Mensual Mayo", client: "Grupo Inmobiliario Altiva", assignee: "Ana Torres", status: "aprobada", priority: "media", dueDate: "2026-05-15", hours: 3, area: "Estrategia" },
  { id: "7", name: "Calendario redes mayo", project: "Branding Residencial", client: "Residencial Bosques", assignee: "Laura Vega", status: "revision_cliente", priority: "alta", dueDate: "2026-05-14", hours: 5, area: "Community" },
  { id: "8", name: "Video promocional", project: "Branding Residencial", client: "Residencial Bosques", assignee: "Pedro Martínez", status: "en_proceso", priority: "urgente", dueDate: "2026-05-16", hours: 8, area: "Producción" },
]

const dummyTeamWorkload = [
  { name: "Diana García", role: "Diseñadora", tasks: 8, completed: 5, overdue: 1, hours: 32, capacity: 40, status: "saludable" },
  { name: "Carlos Ruiz", role: "Programador", tasks: 6, completed: 3, overdue: 2, hours: 45, capacity: 40, status: "sobrecargado" },
  { name: "Eduardo Méndez", role: "Estratega", tasks: 5, completed: 4, overdue: 0, hours: 28, capacity: 40, status: "disponible" },
  { name: "María López", role: "Copywriter", tasks: 4, completed: 2, overdue: 0, hours: 20, capacity: 40, status: "saludable" },
  { name: "Laura Vega", role: "Community", tasks: 7, completed: 4, overdue: 1, hours: 38, capacity: 40, status: "alta_carga" },
  { name: "Roberto Sánchez", role: "Producción", tasks: 3, completed: 0, overdue: 2, hours: 48, capacity: 40, status: "riesgo" },
]

const dummyDeliverables = [
  { id: "1", name: "Artes redes mayo", client: "Desarrolladora Horizonte", status: "aprobado", type: "Diseño", date: "2026-05-08" },
  { id: "2", name: "Landing page v2", client: "Torre Central Living", status: "revision_cliente", type: "Web", date: "2026-05-10" },
  { id: "3", name: "Calendario contenidos", client: "Residencial Bosques", status: "cambios", type: "Estrategia", date: "2026-05-09" },
  { id: "4", name: "Reporte campañas", client: "Grupo Inmobiliario Altiva", status: "aprobado", type: "Reporte", date: "2026-05-05" },
]

const chartColors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

export default function TasksFlowPage() {
  const [loading, setLoading] = useState(true)
  const [selectedAgency, setSelectedAgency] = useState<string>("all")
  const [selectedClient, setSelectedClient] = useState<string>("all")
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [agencies, setAgencies] = useState<any[]>([])
  const [period, setPeriod] = useState("week")
  const [showFilters, setShowFilters] = useState(false)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedPerson, setSelectedPerson] = useState("all")
  const [selectedAccount, setSelectedAccount] = useState("all")
  
  const activeFiltersCount = [dateFrom, dateTo, selectedPerson !== "all" ? selectedPerson : "", selectedAccount !== "all" ? selectedAccount : ""].filter(Boolean).length
  
  // Mock data for filters
  const mockStaff = [
    { id: "1", name: "Diana García" },
    { id: "2", name: "Carlos Ruiz" },
    { id: "3", name: "Eduardo Méndez" },
    { id: "4", name: "María López" },
    { id: "5", name: "Laura Vega" },
    { id: "6", name: "Roberto Sánchez" },
  ]
  
  const mockAccounts = [
    { id: "1", name: "Desarrolladora Horizonte" },
    { id: "2", name: "Torre Central Living" },
    { id: "3", name: "Residencial Bosques" },
    { id: "4", name: "Grupo Inmobiliario Altiva" },
    { id: "5", name: "Nova Arquitectura" },
  ]

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: agenciesData } = await supabase.from("agencies").select("id, name").eq("is_active", true)
      if (agenciesData) setAgencies(agenciesData)
      setLoading(false)
    }
    fetchData()
  }, [])

  // Calculate KPIs
  const totalProjects = dummyProjects.length
  const projectsAtRisk = dummyProjects.filter(p => p.health === "riesgo" || p.health === "critico").length
  const totalTasks = dummyTasks.length
  const tasksOverdue = dummyTasks.filter(t => t.status === "vencida").length
  const tasksInProgress = dummyTasks.filter(t => t.status === "en_proceso").length
  const tasksCompleted = dummyTasks.filter(t => t.status === "aprobada" || t.status === "entregada").length
  const pendingApprovals = dummyDeliverables.filter(d => d.status === "revision_cliente").length
  const teamOverloaded = dummyTeamWorkload.filter(t => t.status === "sobrecargado" || t.status === "riesgo").length

  // Chart data
  const tasksByStatusData = Object.entries(taskStatusConfig).map(([key, config]) => ({
    name: config.label,
    value: dummyTasks.filter(t => t.status === key).length,
    color: config.color.replace("bg-", "#").replace("-500", ""),
  })).filter(d => d.value > 0)

  const tasksByAreaData = [
    { name: "Diseño", tareas: 12, completadas: 8 },
    { name: "Programación", tareas: 8, completadas: 4 },
    { name: "Estrategia", tareas: 10, completadas: 7 },
    { name: "Community", tareas: 6, completadas: 4 },
    { name: "Producción", tareas: 5, completadas: 1 },
    { name: "Copywriting", tareas: 4, completadas: 3 },
  ]

  const weeklyProductivityData = [
    { day: "Lun", tareas: 8, horas: 42 },
    { day: "Mar", tareas: 12, horas: 48 },
    { day: "Mie", tareas: 6, horas: 38 },
    { day: "Jue", tareas: 10, horas: 45 },
    { day: "Vie", tareas: 14, horas: 52 },
    { day: "Sab", tareas: 2, horas: 8 },
  ]

  const projectProgressData = dummyProjects.map(p => ({
    name: p.name.length > 20 ? p.name.substring(0, 20) + "..." : p.name,
    avance: p.progress,
    fill: projectHealthConfig[p.health as keyof typeof projectHealthConfig].color.replace("bg-", "#"),
  }))

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
            <ListTodo className="h-7 w-7 text-primary" />
            TasksFlow
          </h1>
          <p className="text-muted-foreground">Sistema de gestión de tareas, proyectos y entregables</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedAgency} onValueChange={setSelectedAgency}>
            <SelectTrigger className="w-40">
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

          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-40">
              <Briefcase className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="horizonte">Desarrolladora Horizonte</SelectItem>
              <SelectItem value="torre">Torre Central Living</SelectItem>
              <SelectItem value="bosques">Residencial Bosques</SelectItem>
            </SelectContent>
          </Select>

          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mes</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
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
                    {mockStaff.map(person => (
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
                    {mockStaff.find(p => p.id === selectedPerson)?.name}
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

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Proyectos Activos</p>
                <p className="text-3xl font-bold">{totalProjects}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-red-500 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {projectsAtRisk} en riesgo
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <FolderKanban className="h-6 w-6 text-primary" />
              </div>
            </div>
            <Progress value={(totalProjects - projectsAtRisk) / totalProjects * 100} className="mt-3 h-1.5" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tareas Activas</p>
                <p className="text-3xl font-bold">{totalTasks}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-blue-500">{tasksInProgress} en proceso</span>
                  <span className="text-xs text-red-500">{tasksOverdue} vencidas</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <ListTodo className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <Progress value={tasksCompleted / totalTasks * 100} className="mt-3 h-1.5" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aprobaciones Pendientes</p>
                <p className="text-3xl font-bold">{pendingApprovals}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-amber-500 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Esperando cliente
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-amber-500/10">
                <FileCheck className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Equipo Sobrecargado</p>
                <p className="text-3xl font-bold">{teamOverloaded}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">
                    de {dummyTeamWorkload.length} personas
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-red-500/10">
                <Users className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <Progress value={(dummyTeamWorkload.length - teamOverloaded) / dummyTeamWorkload.length * 100} className="mt-3 h-1.5" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Projects Health */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Salud de Proyectos</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/tasksflow/projects">
                  Ver todos <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dummyProjects.map((project) => {
                const healthConfig = projectHealthConfig[project.health as keyof typeof projectHealthConfig]
                return (
                  <div key={project.id} className={`p-3 rounded-lg border ${healthConfig.bgLight}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${healthConfig.color}`} />
                        <div>
                          <p className="font-medium text-sm">{project.name}</p>
                          <p className="text-xs text-muted-foreground">{project.client}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {project.team.map((member, i) => (
                            <Avatar key={i} className="h-6 w-6 border-2 border-background">
                              <AvatarFallback className="text-xs">{member}</AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {project.completed}/{project.tasks}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{project.dueDate}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={project.progress} className="h-2 flex-1" />
                      <span className="text-sm font-medium w-12 text-right">{project.progress}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tasks by Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tareas por Estatus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tasksByStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {tasksByStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {tasksByStatusData.slice(0, 6).map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
                  <span className="text-xs truncate">{item.name}</span>
                  <span className="text-xs font-bold ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tasks by Area */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tareas por Área</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tasksByAreaData} layout="vertical" margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={90} className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="tareas" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Total" />
                  <Bar dataKey="completadas" fill="#10b981" radius={[0, 4, 4, 0]} name="Completadas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Productivity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Productividad Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyProductivityData}>
                  <defs>
                    <linearGradient id="colorTareas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="tareas" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTareas)" name="Tareas" />
                  <Line type="monotone" dataKey="horas" stroke="#10b981" strokeWidth={2} dot={false} name="Horas" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Third Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Tareas Recientes</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/tasksflow/tasks">
                  Ver todas <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dummyTasks.slice(0, 6).map((task) => {
                const statusConf = taskStatusConfig[task.status as keyof typeof taskStatusConfig]
                const priorityConf = priorityConfig[task.priority as keyof typeof priorityConfig]
                return (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className={`w-2 h-2 rounded-full ${statusConf.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{task.name}</p>
                      <p className="text-xs text-muted-foreground">{task.project} - {task.client}</p>
                    </div>
                    <Badge variant="outline" className={`text-xs ${priorityConf.color.replace("bg-", "border-")} ${priorityConf.color.replace("bg-", "text-").replace("-500", "-600").replace("-400", "-500")}`}>
                      {priorityConf.icon} {priorityConf.label}
                    </Badge>
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs">{task.assignee.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{task.dueDate}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Team Workload */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Carga del Equipo</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/tasksflow/workload">
                  Ver más <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dummyTeamWorkload.map((member) => {
                const loadPercentage = (member.hours / member.capacity) * 100
                const statusColor = member.status === "disponible" ? "bg-green-500" :
                                    member.status === "saludable" ? "bg-emerald-500" :
                                    member.status === "alta_carga" ? "bg-amber-500" :
                                    member.status === "sobrecargado" ? "bg-orange-500" : "bg-red-500"
                return (
                  <div key={member.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                        <span className="text-sm font-medium">{member.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{member.hours}h / {member.capacity}h</span>
                    </div>
                    <Progress value={Math.min(loadPercentage, 100)} className="h-1.5" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{member.tasks} tareas</span>
                      {member.overdue > 0 && (
                        <span className="text-red-500">{member.overdue} vencidas</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Alertas y Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">{tasksOverdue} tareas vencidas</p>
                <p className="text-xs text-red-600 dark:text-red-400">Requieren atención inmediata</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">{pendingApprovals} aprobaciones pendientes</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">Esperando respuesta de cliente</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">{projectsAtRisk} proyectos en riesgo</p>
                <p className="text-xs text-orange-600 dark:text-orange-400">Revisar avance y recursos</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">{teamOverloaded} personas sobrecargadas</p>
                <p className="text-xs text-purple-600 dark:text-purple-400">Redistribuir carga</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deliverables Section */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Entregables Recientes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/tasksflow/deliverables">
                Ver todos <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {dummyDeliverables.map((deliverable) => {
              const statusColor = deliverable.status === "aprobado" ? "bg-emerald-500" :
                                  deliverable.status === "revision_cliente" ? "bg-blue-500" :
                                  deliverable.status === "cambios" ? "bg-amber-500" : "bg-gray-500"
              const statusLabel = deliverable.status === "aprobado" ? "Aprobado" :
                                  deliverable.status === "revision_cliente" ? "En Revisión" :
                                  deliverable.status === "cambios" ? "Cambios" : deliverable.status
              return (
                <div key={deliverable.id} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                    <Badge variant="outline" className="text-xs">{deliverable.type}</Badge>
                  </div>
                  <p className="font-medium text-sm mb-1">{deliverable.name}</p>
                  <p className="text-xs text-muted-foreground mb-2">{deliverable.client}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{deliverable.date}</span>
                    <Badge variant={deliverable.status === "aprobado" ? "default" : "secondary"} className="text-xs">
                      {statusLabel}
                    </Badge>
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
