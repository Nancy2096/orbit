"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
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
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  Building2,
  Briefcase,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Users,
  ExternalLink,
  FolderOpen,
  LayoutGrid,
  List,
} from "lucide-react"
import Link from "next/link"
import { TaskFlowNavigation } from "@/components/tasksflow/navigation"

const projectHealthConfig = {
  saludable: { label: "Saludable", color: "bg-emerald-500", bgLight: "bg-emerald-50 dark:bg-emerald-950", border: "border-emerald-200 dark:border-emerald-800" },
  atencion: { label: "Atención", color: "bg-amber-500", bgLight: "bg-amber-50 dark:bg-amber-950", border: "border-amber-200 dark:border-amber-800" },
  riesgo: { label: "En Riesgo", color: "bg-orange-500", bgLight: "bg-orange-50 dark:bg-orange-950", border: "border-orange-200 dark:border-orange-800" },
  critico: { label: "Crítico", color: "bg-red-500", bgLight: "bg-red-50 dark:bg-red-950", border: "border-red-200 dark:border-red-800" },
}

const priorityConfig = {
  baja: { label: "Baja", color: "bg-slate-400" },
  media: { label: "Media", color: "bg-blue-400" },
  alta: { label: "Alta", color: "bg-amber-500" },
  urgente: { label: "Urgente", color: "bg-orange-500" },
  critica: { label: "Crítica", color: "bg-red-600" },
}

const dummyProjects = [
  { 
    id: "1", 
    name: "Campaña Leads Q2", 
    client: "Desarrolladora Horizonte", 
    account: "Marketing Digital",
    logo: "https://ui-avatars.com/api/?name=DH&background=0D9488&color=fff&size=128",
    progress: 75, 
    health: "saludable", 
    priority: "alta",
    tasks: { total: 24, completed: 18, overdue: 0 },
    deliverables: { total: 5, approved: 3, pending: 2 },
    startDate: "2026-04-15",
    dueDate: "2026-05-25",
    hoursWorked: 85,
    hoursBudget: 80,
    team: [
      { name: "Ana M.", initials: "AM", role: "PM" },
      { name: "Diana G.", initials: "DG", role: "Diseño" },
      { name: "Eduardo M.", initials: "EM", role: "Estrategia" },
    ],
    services: ["Meta Ads", "Google Ads", "Landing Page"],
    status: "activo",
  },
  { 
    id: "2", 
    name: "Landing Torre Central", 
    client: "Torre Central Living", 
    account: "Web",
    logo: "https://ui-avatars.com/api/?name=TC&background=3B82F6&color=fff&size=128",
    progress: 45, 
    health: "atencion", 
    priority: "alta",
    tasks: { total: 18, completed: 8, overdue: 2 },
    deliverables: { total: 3, approved: 1, pending: 2 },
    startDate: "2026-05-01",
    dueDate: "2026-05-18",
    hoursWorked: 62,
    hoursBudget: 60,
    team: [
      { name: "Carlos R.", initials: "CR", role: "Programación" },
      { name: "Diana G.", initials: "DG", role: "Diseño" },
    ],
    services: ["Desarrollo Web", "Diseño UI/UX"],
    status: "activo",
  },
  { 
    id: "3", 
    name: "Branding Residencial", 
    client: "Residencial Bosques", 
    account: "Branding",
    logo: "https://ui-avatars.com/api/?name=RB&background=22C55E&color=fff&size=128",
    progress: 30, 
    health: "riesgo", 
    priority: "urgente",
    tasks: { total: 32, completed: 10, overdue: 4 },
    deliverables: { total: 8, approved: 2, pending: 6 },
    startDate: "2026-04-20",
    dueDate: "2026-05-15",
    hoursWorked: 78,
    hoursBudget: 70,
    team: [
      { name: "Diana G.", initials: "DG", role: "Diseño" },
      { name: "Laura V.", initials: "LV", role: "Community" },
      { name: "Pedro M.", initials: "PM", role: "Producción" },
    ],
    services: ["Branding", "Redes Sociales", "Video"],
    status: "activo",
  },
  { 
    id: "4", 
    name: "SEO Mensual Mayo", 
    client: "Grupo Inmobiliario Altiva", 
    account: "SEO",
    logo: "https://ui-avatars.com/api/?name=GA&background=8B5CF6&color=fff&size=128",
    progress: 60, 
    health: "saludable", 
    priority: "media",
    tasks: { total: 12, completed: 7, overdue: 0 },
    deliverables: { total: 2, approved: 1, pending: 1 },
    startDate: "2026-05-01",
    dueDate: "2026-05-30",
    hoursWorked: 35,
    hoursBudget: 40,
    team: [
      { name: "Ana T.", initials: "AT", role: "SEO" },
    ],
    services: ["SEO On-Page", "Link Building", "Reportes"],
    status: "activo",
  },
  { 
    id: "5", 
    name: "Renders 3D", 
    client: "Nova Arquitectura", 
    account: "Producción",
    logo: "https://ui-avatars.com/api/?name=NA&background=F59E0B&color=fff&size=128",
    progress: 15, 
    health: "critico", 
    priority: "critica",
    tasks: { total: 8, completed: 1, overdue: 3 },
    deliverables: { total: 4, approved: 0, pending: 4 },
    startDate: "2026-04-28",
    dueDate: "2026-05-12",
    hoursWorked: 45,
    hoursBudget: 40,
    team: [
      { name: "Roberto S.", initials: "RS", role: "3D" },
    ],
    services: ["Renders 3D", "Recorridos Virtuales"],
    status: "activo",
  },
  { 
    id: "6", 
    name: "Campaña Meta Ads Abril", 
    client: "Desarrolladora Horizonte", 
    account: "Marketing Digital",
    logo: "https://ui-avatars.com/api/?name=DH&background=0D9488&color=fff&size=128",
    progress: 100, 
    health: "saludable", 
    priority: "media",
    tasks: { total: 18, completed: 18, overdue: 0 },
    deliverables: { total: 4, approved: 4, pending: 0 },
    startDate: "2026-04-01",
    dueDate: "2026-04-30",
    hoursWorked: 65,
    hoursBudget: 70,
    team: [
      { name: "Eduardo M.", initials: "EM", role: "Estrategia" },
      { name: "Diana G.", initials: "DG", role: "Diseño" },
    ],
    services: ["Meta Ads", "Creatives"],
    status: "completado",
  },
]

export default function ProjectsPage() {
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterHealth, setFilterHealth] = useState("all")
  const [filterStatus, setFilterStatus] = useState("activo")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [agencies, setAgencies] = useState<any[]>([])
  const [selectedAgency, setSelectedAgency] = useState("all")

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("agencies").select("id, name").eq("is_active", true)
      if (data) setAgencies(data)
      setLoading(false)
    }
    fetchData()
  }, [])

  const filteredProjects = dummyProjects.filter(project => {
    if (searchQuery && !project.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !project.client.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterHealth !== "all" && project.health !== filterHealth) return false
    if (filterStatus !== "all" && project.status !== filterStatus) return false
    return true
  })

  // Stats
  const activeProjects = dummyProjects.filter(p => p.status === "activo").length
  const atRiskProjects = dummyProjects.filter(p => p.health === "riesgo" || p.health === "critico").length
  const completedProjects = dummyProjects.filter(p => p.status === "completado").length
  const totalTasks = dummyProjects.reduce((sum, p) => sum + p.tasks.total, 0)

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64" />)}
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
            <FolderKanban className="h-7 w-7 text-primary" />
            Cuentas y Proyectos
          </h1>
          <p className="text-muted-foreground">Gestiona y monitorea todas las cuentas y proyectos activos</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <Link href="/dashboard/tasksflow/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proyecto
            </Link>
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <TaskFlowNavigation />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Proyectos Activos</p>
                <p className="text-2xl font-bold">{activeProjects}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600">En Riesgo</p>
                <p className="text-2xl font-bold text-amber-700">{atRiskProjects}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Completados</p>
                <p className="text-2xl font-bold text-green-700">{completedProjects}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tareas</p>
                <p className="text-2xl font-bold">{totalTasks}</p>
              </div>
              <ListTodo className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar proyectos o clientes..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterHealth} onValueChange={setFilterHealth}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Salud" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(projectHealthConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="completado">Completados</SelectItem>
                <SelectItem value="pausado">Pausados</SelectItem>
              </SelectContent>
            </Select>

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

            <div className="flex border rounded-md ml-auto">
              <Button 
                variant={viewMode === "grid" ? "secondary" : "ghost"} 
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === "list" ? "secondary" : "ghost"} 
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className={`grid gap-4 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : ""}`}>
        {filteredProjects.map((project) => {
          const health = projectHealthConfig[project.health as keyof typeof projectHealthConfig]
          const priority = priorityConfig[project.priority as keyof typeof priorityConfig]
          const hoursOverBudget = project.hoursWorked > project.hoursBudget

          return (
            <Link key={project.id} href={`/dashboard/tasksflow/projects/${project.id}`}>
              <Card className={`hover:shadow-md transition-shadow cursor-pointer ${health.border}`}>
              <CardContent className="p-4">
                {/* Header with Logo */}
                <div className="flex items-start gap-3 mb-3">
                  {/* Logo */}
                  <div className="shrink-0">
                    {project.logo ? (
                      <div className="w-12 h-12 rounded-lg border bg-white dark:bg-muted overflow-hidden flex items-center justify-center">
                        <img 
                          src={project.logo} 
                          alt={`Logo ${project.client}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg border bg-muted flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  {/* Title & Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${health.color}`} />
                      <Badge variant="outline" className={`text-xs ${priority.color.replace("bg-", "border-")} ${priority.color.replace("bg-", "text-").replace("-500", "-600").replace("-400", "-500")}`}>
                        {priority.label}
                      </Badge>
                      <Badge variant={project.status === "completado" ? "default" : "secondary"} className="text-xs ml-auto">
                        {project.status === "completado" ? "Completado" : "Activo"}
                      </Badge>
                    </div>
                    <h3 className="font-semibold truncate">{project.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {project.client} - {project.account}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Avance</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-lg font-bold">{project.tasks.completed}/{project.tasks.total}</p>
                    <p className="text-xs text-muted-foreground">Tareas</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-lg font-bold">{project.deliverables.approved}/{project.deliverables.total}</p>
                    <p className="text-xs text-muted-foreground">Entregables</p>
                  </div>
                  <div className={`p-2 rounded ${hoursOverBudget ? "bg-red-50 dark:bg-red-950" : "bg-muted/50"}`}>
                    <p className={`text-lg font-bold ${hoursOverBudget ? "text-red-600" : ""}`}>
                      {project.hoursWorked}h
                    </p>
                    <p className="text-xs text-muted-foreground">/ {project.hoursBudget}h</p>
                  </div>
                </div>

                {/* Overdue Alert */}
                {project.tasks.overdue > 0 && (
                  <div className="p-2 rounded bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 mb-3">
                    <p className="text-xs text-red-600 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {project.tasks.overdue} tareas vencidas
                    </p>
                  </div>
                )}

                {/* Dates */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Clock className="h-3 w-3" />
                  <span>{project.startDate}</span>
                  <span>-</span>
                  <span>{project.dueDate}</span>
                </div>

                {/* Services */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {project.services.slice(0, 3).map((service, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                  {project.services.length > 3 && (
                    <Badge variant="outline" className="text-xs">+{project.services.length - 3}</Badge>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-2">
                      {project.team.slice(0, 3).map((member, i) => (
                        <Avatar key={i} className="h-6 w-6 border-2 border-background">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {member.initials}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    {project.team.length > 3 && (
                      <span className="text-xs text-muted-foreground ml-1">+{project.team.length - 3}</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
