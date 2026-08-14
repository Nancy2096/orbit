"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ListTodo,
  Search,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  ChevronRight,
  CalendarDays,
} from "lucide-react"
import Link from "next/link"

const taskStatusConfig = {
  nueva: { label: "Nueva", color: "bg-slate-500" },
  por_asignar: { label: "Por Asignar", color: "bg-purple-500" },
  en_proceso: { label: "En Proceso", color: "bg-blue-500" },
  revision_interna: { label: "Revisión Interna", color: "bg-cyan-500" },
  revision_cliente: { label: "Revisión Cliente", color: "bg-indigo-500" },
  cambios_solicitados: { label: "Cambios", color: "bg-amber-500" },
  aprobada: { label: "Aprobada", color: "bg-emerald-500" },
  entregada: { label: "Entregada", color: "bg-green-600" },
  pausada: { label: "Pausada", color: "bg-gray-400" },
  cancelada: { label: "Cancelada", color: "bg-red-400" },
  vencida: { label: "Vencida", color: "bg-red-600" },
}

const priorityConfig = {
  baja: { label: "Baja", color: "bg-slate-400", textColor: "text-slate-600" },
  media: { label: "Media", color: "bg-blue-400", textColor: "text-blue-600" },
  alta: { label: "Alta", color: "bg-amber-500", textColor: "text-amber-600" },
  urgente: { label: "Urgente", color: "bg-orange-500", textColor: "text-orange-600" },
  critica: { label: "Crítica", color: "bg-red-600", textColor: "text-red-600" },
}

// Current logged in user (simulated)
const currentUser = {
  id: "user-1",
  name: "Diana García",
  initials: "DG",
  email: "diana@agencia.com",
  role: "Diseñador Senior",
}

const dummyTasks = [
  { id: "1", name: "Diseñar artes campaña leads", project: "Campaña Leads Q2", client: "Desarrolladora Horizonte", assignee: "Diana García", status: "en_proceso", priority: "alta", dueDate: "2026-05-12", hours: 4.5, area: "Diseño", isClientVisible: true, isOverdue: false },
  { id: "2", name: "Configurar Meta Ads", project: "Campaña Leads Q2", client: "Desarrolladora Horizonte", assignee: "Eduardo Méndez", status: "por_asignar", priority: "urgente", dueDate: "2026-05-11", hours: 0, area: "Estrategia", isClientVisible: false, isOverdue: true },
  { id: "3", name: "Revisar copies landing", project: "Landing Torre Central", client: "Torre Central Living", assignee: "María López", status: "revision_interna", priority: "media", dueDate: "2026-05-13", hours: 2, area: "Copywriting", isClientVisible: false, isOverdue: false },
  { id: "4", name: "Subir cambios a web", project: "Landing Torre Central", client: "Torre Central Living", assignee: "Carlos Ruiz", status: "cambios_solicitados", priority: "alta", dueDate: "2026-05-10", hours: 3, area: "Programación", isClientVisible: true, isOverdue: true },
  { id: "5", name: "Render exterior torre", project: "Renders 3D", client: "Nova Arquitectura", assignee: "Roberto Sánchez", status: "en_proceso", priority: "critica", dueDate: "2026-05-08", hours: 12, area: "Producción", isClientVisible: true, isOverdue: true },
  { id: "6", name: "Reporte mensual abril", project: "SEO Mensual Mayo", client: "Grupo Inmobiliario Altiva", assignee: "Ana Torres", status: "aprobada", priority: "media", dueDate: "2026-05-15", hours: 3, area: "Estrategia", isClientVisible: true, isOverdue: false },
  { id: "7", name: "Calendario redes mayo", project: "Branding Residencial", client: "Residencial Bosques", assignee: "Laura Vega", status: "revision_cliente", priority: "alta", dueDate: "2026-05-14", hours: 5, area: "Community", isClientVisible: true, isOverdue: false },
  { id: "8", name: "Video promocional", project: "Branding Residencial", client: "Residencial Bosques", assignee: "Pedro Martínez", status: "en_proceso", priority: "urgente", dueDate: "2026-05-16", hours: 8, area: "Producción", isClientVisible: false, isOverdue: false },
  { id: "9", name: "Diseño logo nuevo", project: "Branding Residencial", client: "Residencial Bosques", assignee: "Diana García", status: "nueva", priority: "alta", dueDate: "2026-05-20", hours: 0, area: "Diseño", isClientVisible: false, isOverdue: false },
  { id: "10", name: "Configurar Google Ads", project: "Campaña Leads Q2", client: "Desarrolladora Horizonte", assignee: "Eduardo Méndez", status: "nueva", priority: "media", dueDate: "2026-05-18", hours: 0, area: "Estrategia", isClientVisible: false, isOverdue: false },
  { id: "11", name: "Nuevos creativos Meta Ads", project: "Campaña Meta Ads Abril", client: "Desarrolladora Horizonte", assignee: "Diana García", status: "en_proceso", priority: "media", dueDate: "2026-05-21", hours: 2.5, area: "Diseño", isClientVisible: false, isOverdue: false },
  { id: "12", name: "Rediseño banner home", project: "Landing Torre Central", client: "Torre Central Living", assignee: "Diana García", status: "cambios_solicitados", priority: "alta", dueDate: "2026-05-09", hours: 1.5, area: "Diseño", isClientVisible: true, isOverdue: true },
  { id: "13", name: "Sistema de iconos marca", project: "Branding Residencial", client: "Residencial Bosques", assignee: "Diana García", status: "revision_interna", priority: "media", dueDate: "2026-05-19", hours: 3, area: "Diseño", isClientVisible: false, isOverdue: false },
  { id: "14", name: "Kit de plantillas redes", project: "SEO Mensual Mayo", client: "Grupo Inmobiliario Altiva", assignee: "Diana García", status: "entregada", priority: "baja", dueDate: "2026-05-06", hours: 6, area: "Diseño", isClientVisible: true, isOverdue: false },
]

function formatDueDate(date: string) {
  const d = new Date(date + "T00:00:00")
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
}

export default function MyTasksPage() {
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterArea, setFilterArea] = useState("all")

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      await supabase.from("agencies").select("id").eq("is_active", true)
      setLoading(false)
    }
    fetchData()
  }, [])

  // Solo las tareas asignadas al usuario actual
  const myTasks = dummyTasks.filter((task) => task.assignee === currentUser.name)

  const filteredTasks = myTasks.filter((task) => {
    if (searchQuery && !task.name.toLowerCase().includes(searchQuery.toLowerCase()) && !task.project.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterStatus !== "all" && task.status !== filterStatus) return false
    if (filterPriority !== "all" && task.priority !== filterPriority) return false
    if (filterArea !== "all" && task.area !== filterArea) return false
    return true
  })

  // Stats personales
  const totalMyTasks = myTasks.length
  const myInProgress = myTasks.filter((t) => t.status === "en_proceso").length
  const myOverdue = myTasks.filter((t) => t.isOverdue).length
  const myCompleted = myTasks.filter((t) => t.status === "aprobada" || t.status === "entregada").length

  const hasFilters = filterStatus !== "all" || filterPriority !== "all" || filterArea !== "all" || searchQuery !== ""

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 border-2 border-primary">
            <AvatarFallback className="bg-primary text-primary-foreground">{currentUser.initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ListTodo className="h-6 w-6 text-primary" />
              Mis Tareas
            </h1>
            <p className="text-muted-foreground">
              {currentUser.name} · {currentUser.role}
            </p>
          </div>
        </div>
      </div>

      {/* Stats personales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/50 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Asignadas</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalMyTasks}</p>
              </div>
              <ListTodo className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950 dark:to-amber-900/50 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 dark:text-amber-400">En Proceso</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{myInProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950 dark:to-red-900/50 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">Vencidas</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{myOverdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950 dark:to-green-900/50 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Completadas</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{myCompleted}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar en mis tareas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estatus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estatus</SelectItem>
                {Object.entries(taskStatusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterArea} onValueChange={setFilterArea}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Diseño">Diseño</SelectItem>
                <SelectItem value="Programación">Programación</SelectItem>
                <SelectItem value="Estrategia">Estrategia</SelectItem>
                <SelectItem value="Community">Community</SelectItem>
                <SelectItem value="Producción">Producción</SelectItem>
                <SelectItem value="Copywriting">Copywriting</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de mis tareas — una línea por tarea, cada una es un link */}
      <Card>
        <CardContent className="p-0">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16">
              <ListTodo className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {hasFilters ? "No hay tareas que coincidan con los filtros." : "No tienes tareas asignadas."}
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {filteredTasks.map((task) => {
                const statusCfg = taskStatusConfig[task.status as keyof typeof taskStatusConfig]
                const prioCfg = priorityConfig[task.priority as keyof typeof priorityConfig]
                return (
                  <li key={task.id}>
                    <Link
                      href={`/orbit-tasksflow/tasks/${task.id}`}
                      className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors ${task.isOverdue ? "bg-red-50/40 dark:bg-red-950/20" : ""}`}
                    >
                      {/* Estado */}
                      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusCfg.color}`} title={statusCfg.label} />

                      {/* Visibilidad cliente */}
                      {task.isClientVisible ? (
                        <Eye className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}

                      {/* Nombre + proyecto/cliente */}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{task.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {task.project} · {task.client}
                        </p>
                      </div>

                      {/* Área */}
                      <Badge variant="outline" className="hidden md:inline-flex shrink-0">{task.area}</Badge>

                      {/* Prioridad */}
                      <Badge className={`${prioCfg.color} text-white shrink-0 hidden sm:inline-flex`}>{prioCfg.label}</Badge>

                      {/* Estatus */}
                      <span className="text-sm text-muted-foreground w-28 shrink-0 hidden lg:block">{statusCfg.label}</span>

                      {/* Fecha límite */}
                      <span className={`text-sm flex items-center gap-1 w-24 shrink-0 justify-end ${task.isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                        {task.isOverdue ? <AlertTriangle className="h-3.5 w-3.5" /> : <CalendarDays className="h-3.5 w-3.5" />}
                        {formatDueDate(task.dueDate)}
                      </span>

                      {/* Horas */}
                      <span className="text-sm text-muted-foreground w-12 text-right shrink-0 hidden sm:block">
                        {task.hours > 0 ? `${task.hours}h` : "—"}
                      </span>

                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
