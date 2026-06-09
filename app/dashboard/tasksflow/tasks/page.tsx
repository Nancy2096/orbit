"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Clock,
  AlertTriangle,
  Building2,
  Briefcase,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Copy,
  ChevronDown,
  ArrowUpDown,
  Timer,
  CheckCircle2,
  XCircle,
  PauseCircle,
  User,
  Users,
} from "lucide-react"
import Link from "next/link"
import { TaskFlowNavigation } from "@/components/tasksflow/navigation"

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
  role: "Diseñador Senior"
}

// Team members for filter
const teamMembers = [
  { id: "user-1", name: "Diana García", initials: "DG" },
  { id: "user-2", name: "Eduardo Méndez", initials: "EM" },
  { id: "user-3", name: "María López", initials: "ML" },
  { id: "user-4", name: "Carlos Ruiz", initials: "CR" },
  { id: "user-5", name: "Roberto Sánchez", initials: "RS" },
  { id: "user-6", name: "Ana Torres", initials: "AT" },
  { id: "user-7", name: "Laura Vega", initials: "LV" },
  { id: "user-8", name: "Pedro Martínez", initials: "PM" },
]

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
]

export default function TasksPage() {
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterArea, setFilterArea] = useState("all")
  const [filterPerson, setFilterPerson] = useState(currentUser.name) // Default to current user
  const [showMyTasksOnly, setShowMyTasksOnly] = useState(true) // Start with "My Tasks" selected
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [agencies, setAgencies] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("agencies").select("id, name").eq("is_active", true)
      if (data) setAgencies(data)
      setLoading(false)
    }
    fetchData()
  }, [])

  const filteredTasks = dummyTasks.filter(task => {
    if (searchQuery && !task.name.toLowerCase().includes(searchQuery.toLowerCase()) && !task.assignee.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterStatus !== "all" && task.status !== filterStatus) return false
    if (filterPriority !== "all" && task.priority !== filterPriority) return false
    if (filterArea !== "all" && task.area !== filterArea) return false
    if (filterPerson !== "all" && task.assignee !== filterPerson) return false
    return true
  })

  // My tasks (current user's tasks)
  const myTasks = dummyTasks.filter(task => task.assignee === currentUser.name)
  const myTasksOverdue = myTasks.filter(t => t.isOverdue).length
  const myTasksInProgress = myTasks.filter(t => t.status === "en_proceso").length

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    )
  }

  const toggleAllTasks = () => {
    if (selectedTasks.length === filteredTasks.length) {
      setSelectedTasks([])
    } else {
      setSelectedTasks(filteredTasks.map(t => t.id))
    }
  }

  // Stats
  const totalTasks = dummyTasks.length
  const overdueTasks = dummyTasks.filter(t => t.isOverdue).length
  const inProgressTasks = dummyTasks.filter(t => t.status === "en_proceso").length
  const completedTasks = dummyTasks.filter(t => t.status === "aprobada" || t.status === "entregada").length

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
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ListTodo className="h-7 w-7 text-primary" />
            Lista de Tareas
          </h1>
          <p className="text-muted-foreground">Gestiona y filtra todas las tareas del equipo</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <TaskFlowNavigation />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/50 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Total Tareas</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalTasks}</p>
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
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{inProgressTasks}</p>
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
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{overdueTasks}</p>
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
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{completedTasks}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Tasks Toggle Section */}
      <Card className={showMyTasksOnly ? "border-primary bg-primary/5" : ""}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant={showMyTasksOnly ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setShowMyTasksOnly(true)
                  setFilterPerson(currentUser.name)
                }}
                className="gap-2"
              >
                <User className="h-4 w-4" />
                Mis Tareas
              </Button>
              <Button
                variant={!showMyTasksOnly ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setShowMyTasksOnly(false)
                  setFilterPerson("all")
                }}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                Todas las Tareas
              </Button>
            </div>
            
            {showMyTasksOnly && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border-2 border-primary">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {currentUser.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{currentUser.name}</p>
                    <p className="text-xs text-muted-foreground">{currentUser.role}</p>
                  </div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="flex gap-4">
                  <div>
                    <p className="text-lg font-bold text-primary">{myTasks.length}</p>
                    <p className="text-xs text-muted-foreground">Asignadas</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-amber-600">{myTasksInProgress}</p>
                    <p className="text-xs text-muted-foreground">En Proceso</p>
                  </div>
                  {myTasksOverdue > 0 && (
                    <div>
                      <p className="text-lg font-bold text-red-600">{myTasksOverdue}</p>
                      <p className="text-xs text-muted-foreground">Vencidas</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar tareas o personas..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Person Filter */}
            <Select 
              value={filterPerson} 
              onValueChange={(value) => {
                setFilterPerson(value)
                setShowMyTasksOnly(value === currentUser.name)
              }}
            >
              <SelectTrigger className="w-44">
                <User className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Persona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las personas</SelectItem>
                <SelectItem value={currentUser.name}>
                  <span className="font-medium">{currentUser.name} (Yo)</span>
                </SelectItem>
                {teamMembers.filter(m => m.name !== currentUser.name).map((member) => (
                  <SelectItem key={member.id} value={member.name}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[10px]">{member.initials}</AvatarFallback>
                      </Avatar>
                      {member.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
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

            {(filterStatus !== "all" || filterPriority !== "all" || filterArea !== "all" || searchQuery || (filterPerson !== "all" && filterPerson !== currentUser.name)) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setFilterStatus("all")
                  setFilterPriority("all")
                  setFilterArea("all")
                  setSearchQuery("")
                  setFilterPerson(currentUser.name)
                  setShowMyTasksOnly(true)
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                    onCheckedChange={toggleAllTasks}
                  />
                </TableHead>
                <TableHead>Tarea</TableHead>
                <TableHead>Proyecto / Cliente</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead>Fecha Límite</TableHead>
                <TableHead>Horas</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => {
                const statusConfig = taskStatusConfig[task.status as keyof typeof taskStatusConfig]
                const prioConfig = priorityConfig[task.priority as keyof typeof priorityConfig]
                
                return (
                  <TableRow key={task.id} className={task.isOverdue ? "bg-red-50/50 dark:bg-red-950/30" : ""}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedTasks.includes(task.id)}
                        onCheckedChange={() => toggleTaskSelection(task.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {task.isClientVisible ? (
                          <Eye className="h-3 w-3 text-blue-500 shrink-0" />
                        ) : (
                          <EyeOff className="h-3 w-3 text-muted-foreground shrink-0" />
                        )}
                        <Link 
                          href={`/dashboard/tasksflow/tasks/${task.id}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {task.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{task.project}</p>
                        <p className="text-xs text-muted-foreground">{task.client}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">{task.assignee.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.assignee}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{task.area}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${prioConfig.color} text-white`}>
                        {prioConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
                        <span className="text-sm">{statusConfig.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm ${task.isOverdue ? "text-red-600 font-medium" : ""}`}>
                        {task.isOverdue && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                        {task.dueDate}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{task.hours > 0 ? `${task.hours}h` : "-"}</span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/tasksflow/tasks/${task.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalle
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedTasks.length > 0 && (
        <Card className="fixed bottom-6 left-1/2 -translate-x-1/2 shadow-lg border-primary">
          <CardContent className="p-3 flex items-center gap-4">
            <span className="text-sm font-medium">{selectedTasks.length} seleccionadas</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Cambiar estatus</Button>
              <Button variant="outline" size="sm">Reasignar</Button>
              <Button variant="outline" size="sm" className="text-red-600">Eliminar</Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedTasks([])}>
              Cancelar
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
