"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
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
  MessageSquare,
  Paperclip,
  AlertTriangle,
  CheckCircle2,
  Users,
  User,
  Briefcase,
  Building2,
  Eye,
  EyeOff,
  ChevronDown,
  GripVertical,
  Timer,
  Edit,
  Trash2,
  Copy,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"

// Status columns configuration
const kanbanColumns = [
  { id: "nueva", title: "Nueva", color: "bg-slate-500", count: 0 },
  { id: "por_asignar", title: "Por Asignar", color: "bg-purple-500", count: 0 },
  { id: "en_proceso", title: "En Proceso", color: "bg-blue-500", count: 0 },
  { id: "revision_interna", title: "Revisión Interna", color: "bg-cyan-500", count: 0 },
  { id: "revision_cliente", title: "Revisión Cliente", color: "bg-indigo-500", count: 0 },
  { id: "cambios_solicitados", title: "Cambios", color: "bg-amber-500", count: 0 },
  { id: "aprobada", title: "Aprobada", color: "bg-emerald-500", count: 0 },
  { id: "entregada", title: "Entregada", color: "bg-green-600", count: 0 },
]

const priorityConfig = {
  baja: { label: "Baja", color: "bg-slate-400", borderColor: "border-slate-400", textColor: "text-slate-600" },
  media: { label: "Media", color: "bg-blue-400", borderColor: "border-blue-400", textColor: "text-blue-600" },
  alta: { label: "Alta", color: "bg-amber-500", borderColor: "border-amber-500", textColor: "text-amber-600" },
  urgente: { label: "Urgente", color: "bg-orange-500", borderColor: "border-orange-500", textColor: "text-orange-600" },
  critica: { label: "Crítica", color: "bg-red-600", borderColor: "border-red-600", textColor: "text-red-600" },
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

// Projects for filter
const projectsList = [
  { id: "proj-1", name: "Campaña Leads Q2", client: "Desarrolladora Horizonte" },
  { id: "proj-2", name: "Landing Torre Central", client: "Torre Central Living" },
  { id: "proj-3", name: "Branding Residencial", client: "Residencial Bosques" },
  { id: "proj-4", name: "SEO Mensual Mayo", client: "Grupo Inmobiliario Altiva" },
  { id: "proj-5", name: "Renders 3D", client: "Nova Arquitectura" },
]

// Dummy tasks
const dummyTasks = [
  { id: "1", name: "Diseñar artes campaña leads", project: "Campaña Leads Q2", client: "Desarrolladora Horizonte", assignee: "Diana García", assigneeInitials: "DG", status: "en_proceso", priority: "alta", dueDate: "2026-05-12", hours: 4.5, comments: 3, attachments: 2, isClientVisible: true, isOverdue: false, area: "Diseño" },
  { id: "2", name: "Configurar Meta Ads", project: "Campaña Leads Q2", client: "Desarrolladora Horizonte", assignee: "Eduardo Méndez", assigneeInitials: "EM", status: "por_asignar", priority: "urgente", dueDate: "2026-05-11", hours: 0, comments: 1, attachments: 0, isClientVisible: false, isOverdue: true, area: "Estrategia" },
  { id: "3", name: "Revisar copies landing", project: "Landing Torre Central", client: "Torre Central Living", assignee: "María López", assigneeInitials: "ML", status: "revision_interna", priority: "media", dueDate: "2026-05-13", hours: 2, comments: 5, attachments: 1, isClientVisible: false, isOverdue: false, area: "Copywriting" },
  { id: "4", name: "Subir cambios a web", project: "Landing Torre Central", client: "Torre Central Living", assignee: "Carlos Ruiz", assigneeInitials: "CR", status: "cambios_solicitados", priority: "alta", dueDate: "2026-05-10", hours: 3, comments: 8, attachments: 3, isClientVisible: true, isOverdue: true, area: "Programación" },
  { id: "5", name: "Render exterior torre", project: "Renders 3D", client: "Nova Arquitectura", assignee: "Roberto Sánchez", assigneeInitials: "RS", status: "en_proceso", priority: "critica", dueDate: "2026-05-08", hours: 12, comments: 2, attachments: 4, isClientVisible: true, isOverdue: true, area: "Producción" },
  { id: "6", name: "Reporte mensual abril", project: "SEO Mensual Mayo", client: "Grupo Inmobiliario Altiva", assignee: "Ana Torres", assigneeInitials: "AT", status: "aprobada", priority: "media", dueDate: "2026-05-15", hours: 3, comments: 2, attachments: 1, isClientVisible: true, isOverdue: false, area: "Estrategia" },
  { id: "7", name: "Calendario redes mayo", project: "Branding Residencial", client: "Residencial Bosques", assignee: "Laura Vega", assigneeInitials: "LV", status: "revision_cliente", priority: "alta", dueDate: "2026-05-14", hours: 5, comments: 12, attachments: 6, isClientVisible: true, isOverdue: false, area: "Community" },
  { id: "8", name: "Video promocional", project: "Branding Residencial", client: "Residencial Bosques", assignee: "Pedro Martínez", assigneeInitials: "PM", status: "en_proceso", priority: "urgente", dueDate: "2026-05-16", hours: 8, comments: 4, attachments: 2, isClientVisible: false, isOverdue: false, area: "Producción" },
  { id: "9", name: "Diseño logo nuevo", project: "Branding Residencial", client: "Residencial Bosques", assignee: "Diana García", assigneeInitials: "DG", status: "nueva", priority: "alta", dueDate: "2026-05-20", hours: 0, comments: 0, attachments: 0, isClientVisible: false, isOverdue: false, area: "Diseño" },
  { id: "10", name: "Configurar Google Ads", project: "Campaña Leads Q2", client: "Desarrolladora Horizonte", assignee: "Eduardo Méndez", assigneeInitials: "EM", status: "nueva", priority: "media", dueDate: "2026-05-18", hours: 0, comments: 0, attachments: 0, isClientVisible: false, isOverdue: false, area: "Estrategia" },
  { id: "11", name: "Publicar stories", project: "Branding Residencial", client: "Residencial Bosques", assignee: "Laura Vega", assigneeInitials: "LV", status: "entregada", priority: "baja", dueDate: "2026-05-09", hours: 1, comments: 0, attachments: 5, isClientVisible: true, isOverdue: false, area: "Community" },
  { id: "12", name: "Optimizar landing", project: "Landing Torre Central", client: "Torre Central Living", assignee: "Carlos Ruiz", assigneeInitials: "CR", status: "por_asignar", priority: "media", dueDate: "2026-05-19", hours: 0, comments: 1, attachments: 0, isClientVisible: false, isOverdue: false, area: "Programación" },
]

function TaskCard({ task }: { task: typeof dummyTasks[0] }) {
  const priority = priorityConfig[task.priority as keyof typeof priorityConfig]
  
  return (
    <div 
      className={`group p-3 rounded-lg border bg-card hover:shadow-md transition-all cursor-pointer ${
        task.isOverdue ? 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30' : ''
      } ${priority.borderColor} border-l-4`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {task.isClientVisible ? (
            <Eye className="h-3 w-3 text-blue-500" title="Visible para cliente" />
          ) : (
            <EyeOff className="h-3 w-3 text-muted-foreground" title="Solo interno" />
          )}
          <Badge variant="outline" className={`text-xs ${priority.textColor}`}>
            {priority.label}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="h-4 w-4 mr-2" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ArrowRight className="h-4 w-4 mr-2" />
              Mover a...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Task Name */}
      <p className="font-medium text-sm mb-1 line-clamp-2">{task.name}</p>
      
      {/* Project & Client */}
      <p className="text-xs text-muted-foreground mb-2 truncate">
        {task.project}
      </p>
      <p className="text-xs text-muted-foreground mb-3 truncate">
        <Briefcase className="h-3 w-3 inline mr-1" />
        {task.client}
      </p>

      {/* Due Date */}
      <div className={`flex items-center gap-1 text-xs mb-3 ${task.isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
        {task.isOverdue ? (
          <AlertTriangle className="h-3 w-3" />
        ) : (
          <Clock className="h-3 w-3" />
        )}
        <span>{task.dueDate}</span>
        {task.hours > 0 && (
          <>
            <span className="mx-1">|</span>
            <Timer className="h-3 w-3" />
            <span>{task.hours}h</span>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">{task.assigneeInitials}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate max-w-20">{task.assignee.split(" ")[0]}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          {task.comments > 0 && (
            <span className="flex items-center gap-0.5 text-xs">
              <MessageSquare className="h-3 w-3" />
              {task.comments}
            </span>
          )}
          {task.attachments > 0 && (
            <span className="flex items-center gap-0.5 text-xs">
              <Paperclip className="h-3 w-3" />
              {task.attachments}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function KanbanPage() {
  const [loading, setLoading] = useState(true)
  const [selectedAgency, setSelectedAgency] = useState<string>("all")
  const [selectedClient, setSelectedClient] = useState<string>("all")
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [agencies, setAgencies] = useState<any[]>([])
  const [filterPerson, setFilterPerson] = useState(currentUser.name) // Default to current user
  const [showMyTasksOnly, setShowMyTasksOnly] = useState(true) // Start with "My Tasks" selected

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: agenciesData } = await supabase.from("agencies").select("id, name").eq("is_active", true)
      if (agenciesData) setAgencies(agenciesData)
      setLoading(false)
    }
    fetchData()
  }, [])

  // Filter tasks based on person and project
  const filteredTasks = dummyTasks.filter(task => {
    if (searchQuery && !task.name.toLowerCase().includes(searchQuery.toLowerCase()) && !task.assignee.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterPerson !== "all" && task.assignee !== filterPerson) return false
    if (selectedProject !== "all" && task.project !== selectedProject) return false
    return true
  })

  // My tasks stats
  const myTasks = dummyTasks.filter(t => t.assignee === currentUser.name)
  const myTasksInProgress = myTasks.filter(t => t.status === "en_proceso").length
  const myTasksOverdue = myTasks.filter(t => t.isOverdue).length

  // Group tasks by status
  const tasksByColumn = kanbanColumns.map(column => ({
    ...column,
    tasks: filteredTasks.filter(task => task.status === column.id),
    count: filteredTasks.filter(task => task.status === column.id).length,
  }))

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-4 overflow-x-auto">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-96 w-72 flex-shrink-0" />)}
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
            <Kanban className="h-7 w-7 text-primary" />
            Tablero Kanban
          </h1>
          <p className="text-muted-foreground">Gestiona tareas arrastrando entre columnas</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar tareas o personas..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>
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
            {/* Person Filter */}
            <Select 
              value={filterPerson} 
              onValueChange={(value) => {
                setFilterPerson(value)
                setShowMyTasksOnly(value === currentUser.name)
              }}
            >
              <SelectTrigger className="w-48">
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

            {/* Project Filter */}
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-52">
                <FolderKanban className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Proyecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proyectos</SelectItem>
                {projectsList.map((proj) => (
                  <SelectItem key={proj.id} value={proj.name}>
                    <div className="flex items-center gap-2">
                      <span>{proj.name}</span>
                    </div>
                  </SelectItem>
                ))}
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

            {/* Clear Filters */}
            {(searchQuery || (filterPerson !== "all" && filterPerson !== currentUser.name) || selectedProject !== "all") && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setFilterPerson(currentUser.name)
                  setSelectedProject("all")
                  setShowMyTasksOnly(true)
                }}
              >
                Limpiar filtros
              </Button>
            )}

            <div className="ml-auto text-sm text-muted-foreground">
              {filteredTasks.length} tareas
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {tasksByColumn.map((column) => (
            <div key={column.id} className="w-72 flex-shrink-0">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${column.color}`} />
                  <span className="font-medium text-sm">{column.title}</span>
                  <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {column.count}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Column Content */}
              <div className="space-y-3 min-h-96 p-2 rounded-lg bg-muted/30 border-2 border-dashed border-muted">
                {column.tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <ListTodo className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">Sin tareas</p>
                  </div>
                ) : (
                  column.tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-sm font-medium text-muted-foreground">Leyenda de prioridades:</span>
            {Object.entries(priorityConfig).map(([key, config]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${config.color}`} />
                <span className="text-sm">{config.label}</span>
              </div>
            ))}
            <span className="text-sm text-muted-foreground ml-4">|</span>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Visible para cliente</span>
            </div>
            <div className="flex items-center gap-2">
              <EyeOff className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Solo interno</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
