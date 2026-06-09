"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Kanban,
  Calendar as CalendarIcon,
  GanttChart,
  FileCheck,
  Activity,
  FileText,
  Plus,
  ChevronLeft,
  ChevronRight,
  Building2,
  Briefcase,
  Clock,
  AlertTriangle,
  User,
  Users,
} from "lucide-react"
import Link from "next/link"
import { TaskFlowNavigation } from "@/components/tasksflow/navigation"

const priorityConfig = {
  baja: { label: "Baja", color: "bg-slate-400" },
  media: { label: "Media", color: "bg-blue-400" },
  alta: { label: "Alta", color: "bg-amber-500" },
  urgente: { label: "Urgente", color: "bg-orange-500" },
  critica: { label: "Crítica", color: "bg-red-600" },
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
]

// Projects for filter
const projects = [
  { id: "proj-1", name: "Campaña Leads Q2", client: "Horizonte" },
  { id: "proj-2", name: "Landing Torre Central", client: "Torre Central" },
  { id: "proj-3", name: "Branding Residencial", client: "Bosques" },
  { id: "proj-4", name: "SEO Mensual Mayo", client: "Altiva" },
  { id: "proj-5", name: "Renders 3D", client: "Nova Arq" },
]

// Calendar events with dates in May 2026 - now with assignee
const calendarEvents = [
  { id: "1", name: "Diseñar artes campaña", date: "2026-05-12", priority: "alta", client: "Horizonte", project: "Campaña Leads Q2", type: "task", assignee: "Diana García" },
  { id: "2", name: "Configurar Meta Ads", date: "2026-05-11", priority: "urgente", client: "Horizonte", project: "Campaña Leads Q2", type: "task", assignee: "Eduardo Méndez" },
  { id: "3", name: "Revisar copies landing", date: "2026-05-13", priority: "media", client: "Torre Central", project: "Landing Torre Central", type: "task", assignee: "Diana García" },
  { id: "4", name: "Subir cambios web", date: "2026-05-10", priority: "alta", client: "Torre Central", project: "Landing Torre Central", type: "task", assignee: "Carlos Ruiz" },
  { id: "5", name: "Render exterior", date: "2026-05-08", priority: "critica", client: "Nova Arq", project: "Renders 3D", type: "task", assignee: "Roberto Sánchez" },
  { id: "6", name: "Reporte mensual", date: "2026-05-15", priority: "media", client: "Altiva", project: "SEO Mensual Mayo", type: "deliverable", assignee: "María López" },
  { id: "7", name: "Calendario redes", date: "2026-05-14", priority: "alta", client: "Bosques", project: "Branding Residencial", type: "deliverable", assignee: "Diana García" },
  { id: "8", name: "Video promocional", date: "2026-05-16", priority: "urgente", client: "Bosques", project: "Branding Residencial", type: "task", assignee: "Ana Torres" },
  { id: "9", name: "Logo nuevo", date: "2026-05-20", priority: "alta", client: "Bosques", project: "Branding Residencial", type: "task", assignee: "Diana García" },
  { id: "10", name: "Google Ads", date: "2026-05-18", priority: "media", client: "Horizonte", project: "Campaña Leads Q2", type: "task", assignee: "Eduardo Méndez" },
  { id: "11", name: "Landing v2 entrega", date: "2026-05-22", priority: "alta", client: "Torre Central", project: "Landing Torre Central", type: "deliverable", assignee: "Carlos Ruiz" },
  { id: "12", name: "Campaña activa", date: "2026-05-25", priority: "urgente", client: "Horizonte", project: "Campaña Leads Q2", type: "milestone", assignee: "Diana García" },
  { id: "13", name: "Revisión interna", date: "2026-05-19", priority: "media", client: "Altiva", project: "SEO Mensual Mayo", type: "task", assignee: "María López" },
  { id: "14", name: "QA página web", date: "2026-05-21", priority: "alta", client: "Torre Central", project: "Landing Torre Central", type: "task", assignee: "Diana García" },
  { id: "15", name: "Entrega renders", date: "2026-05-23", priority: "critica", client: "Nova Arq", project: "Renders 3D", type: "deliverable", assignee: "Roberto Sánchez" },
]

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

export default function CalendarPage() {
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)) // May 2026
  const [viewMode, setViewMode] = useState<"month" | "week">("month")
  const [agencies, setAgencies] = useState<any[]>([])
  const [selectedAgency, setSelectedAgency] = useState("all")
  const [filterPerson, setFilterPerson] = useState(currentUser.name) // Default to current user
  const [filterProject, setFilterProject] = useState("all")
  const [showMyTasksOnly, setShowMyTasksOnly] = useState(true) // Start with "My Tasks" selected

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("agencies").select("id, name").eq("is_active", true)
      if (data) setAgencies(data)
      setLoading(false)
    }
    fetchData()
  }, [])

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    
    const days: (Date | null)[] = []
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1))
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return filteredEvents.filter(event => event.date === dateStr)
  }

  // Filter events based on person and project
  const filteredEvents = calendarEvents.filter(event => {
    if (filterPerson !== "all" && event.assignee !== filterPerson) return false
    if (filterProject !== "all" && event.project !== filterProject) return false
    return true
  })

  // My tasks stats
  const myTasks = calendarEvents.filter(e => e.assignee === currentUser.name)
  const myTasksThisMonth = myTasks.filter(e => e.date.startsWith("2026-05")).length

  const isToday = (date: Date) => {
    const today = new Date(2026, 4, 11) // Simulating today as May 11, 2026
    return date.toDateString() === today.toDateString()
  }

  const isPastDate = (date: Date) => {
    const today = new Date(2026, 4, 11)
    return date < today
  }

  const days = getDaysInMonth(currentDate)

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-7 w-7 text-primary" />
            Calendario
          </h1>
          <p className="text-muted-foreground">Vista de tareas y entregables por fecha</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex border rounded-md">
            <Button 
              variant={viewMode === "month" ? "secondary" : "ghost"} 
              size="sm"
              onClick={() => setViewMode("month")}
            >
              Mes
            </Button>
            <Button 
              variant={viewMode === "week" ? "secondary" : "ghost"} 
              size="sm"
              onClick={() => setViewMode("week")}
            >
              Semana
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <TaskFlowNavigation />

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
                Mi Calendario
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
                Todos los Calendarios
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
                <div>
                  <p className="text-lg font-bold text-primary">{myTasksThisMonth}</p>
                  <p className="text-xs text-muted-foreground">Este mes</p>
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
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="w-52">
                <FolderKanban className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Proyecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proyectos</SelectItem>
                {projects.map((proj) => (
                  <SelectItem key={proj.id} value={proj.name}>
                    <div className="flex items-center gap-2">
                      <span>{proj.name}</span>
                      <span className="text-xs text-muted-foreground">({proj.client})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(filterPerson !== currentUser.name || filterProject !== "all") && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setFilterPerson(currentUser.name)
                  setFilterProject("all")
                  setShowMyTasksOnly(true)
                }}
              >
                Limpiar filtros
              </Button>
            )}

            <div className="ml-auto text-sm text-muted-foreground">
              {filteredEvents.length} eventos
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={() => setCurrentDate(new Date(2026, 4, 1))}>
              Hoy
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 border-t border-l">
            {days.map((date, index) => {
              const events = date ? getEventsForDate(date) : []
              const today = date && isToday(date)
              const past = date && isPastDate(date)
              const hasOverdue = events.some(e => past && e.type === "task")

              return (
                <div
                  key={index}
                  className={`min-h-28 p-1 border-r border-b ${
                    !date ? "bg-muted/30" : 
                    today ? "bg-primary/5 ring-2 ring-primary ring-inset" :
                    past ? "bg-muted/20" : ""
                  }`}
                >
                  {date && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${today ? "text-primary" : past ? "text-muted-foreground" : ""}`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {events.slice(0, 3).map(event => {
                          const priority = priorityConfig[event.priority as keyof typeof priorityConfig]
                          return (
                            <div
                              key={event.id}
                              className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${
                                event.type === "deliverable" ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300" :
                                event.type === "milestone" ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300" :
                                past && event.type === "task" ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300" :
                                "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                              }`}
                            >
                              <div className="flex items-center gap-1">
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${priority.color}`} />
                                <span className="truncate">{event.name}</span>
                              </div>
                            </div>
                          )
                        })}
                        {events.length > 3 && (
                          <div className="text-xs text-muted-foreground text-center">
                            +{events.length - 3} más
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-sm font-medium text-muted-foreground">Leyenda:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/50" />
              <span className="text-sm">Tareas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-900/50" />
              <span className="text-sm">Entregables</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-100 dark:bg-purple-900/50" />
              <span className="text-sm">Hitos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/50" />
              <span className="text-sm">Vencidas</span>
            </div>
            <span className="text-sm text-muted-foreground">|</span>
            <span className="text-sm font-medium text-muted-foreground">Prioridad:</span>
            {Object.entries(priorityConfig).map(([key, config]) => (
              <div key={key} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${config.color}`} />
                <span className="text-xs">{config.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
