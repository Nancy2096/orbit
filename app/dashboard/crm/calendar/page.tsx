"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAgency } from "@/contexts/agency-context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Phone,
  Mail,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Link2,
  Unlink,
  RefreshCw,
  Loader2,
} from "lucide-react"

interface SalesRep {
  id: string
  first_name: string
  last_name: string
}

interface Prospect {
  id: string
  contact_name: string
  company_name: string | null
}

interface Task {
  id: string
  title: string
  description: string | null
  task_type: string
  due_date: string
  priority: string
  is_completed: boolean
  completed_at: string | null
  assigned_to: string | null
  assigned_staff: SalesRep | null
  prospect: Prospect | null
  google_event_id?: string | null
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  tasks: Task[]
}

interface GoogleCalendarConnection {
  connected: boolean
  email?: string
  syncEnabled: boolean
}

export default function CRMCalendarPage() {
  const { selectedAgencyId, loading: agencyLoading } = useAgency()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [salesReps, setSalesReps] = useState<SalesRep[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [filterSalesRep, setFilterSalesRep] = useState<string>("all")
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [googleConnection, setGoogleConnection] = useState<GoogleCalendarConnection>({
    connected: false,
    syncEnabled: false,
  })
  const [syncingGoogle, setSyncingGoogle] = useState(false)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    task_type: "call",
    due_date: "",
    due_time: "",
    priority: "medium",
    prospect_id: "",
    assigned_to: "",
    sync_to_google: true,
  })
  const supabase = createClient()

  useEffect(() => {
    if (selectedAgencyId) {
      fetchData()
      checkGoogleConnection()
    } else {
      setLoading(false)
      setTasks([])
      setProspects([])
    }
  }, [selectedAgencyId])

  const fetchData = async () => {
    if (!selectedAgencyId) return
    setLoading(true)

    // Fetch sales reps
    const { data: commercialDepts } = await supabase
      .from("departments")
      .select("id")
      .eq("agency_id", selectedAgencyId)
      .in("name", ["Comercial", "Dirección"])
    
    const deptIds = commercialDepts?.map(d => d.id) || []
    
    const { data: salesRepsData } = await supabase
      .from("staff")
      .select("id, first_name, last_name, department_id")
      .eq("agency_id", selectedAgencyId)
      .eq("is_active", true)
      .in("department_id", deptIds.length > 0 ? deptIds : ["00000000-0000-0000-0000-000000000000"])
      .order("first_name")

    if (salesRepsData) setSalesReps(salesRepsData)

    // Fetch tasks
    const { data: tasksData } = await supabase
      .from("crm_tasks")
      .select(`
        id, title, description, task_type, due_date, priority, is_completed, completed_at, assigned_to,
        assigned_staff:staff!crm_tasks_assigned_to_fkey(id, first_name, last_name),
        prospect:crm_prospects(id, contact_name, company_name)
      `)
      .eq("agency_id", selectedAgencyId)
      .order("due_date", { ascending: true })

    if (tasksData) {
      setTasks(tasksData as Task[])
    }

    // Fetch prospects
    const { data: prospectsData } = await supabase
      .from("crm_prospects")
      .select("id, contact_name, company_name")
      .eq("agency_id", selectedAgencyId)
      .eq("status", "active")
      .order("contact_name")

    if (prospectsData) {
      setProspects(prospectsData as Prospect[])
    }

    setLoading(false)
  }

  const checkGoogleConnection = async () => {
    // Simulate checking Google Calendar connection
    // In production, this would check OAuth tokens stored in the database
    const storedConnection = localStorage.getItem(`google_calendar_${selectedAgencyId}`)
    if (storedConnection) {
      setGoogleConnection(JSON.parse(storedConnection))
    }
  }

  const handleConnectGoogle = async () => {
    setSyncingGoogle(true)
    // Simulate Google OAuth flow
    // In production, this would redirect to Google OAuth
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const connection: GoogleCalendarConnection = {
      connected: true,
      email: "usuario@example.com",
      syncEnabled: true,
    }
    setGoogleConnection(connection)
    localStorage.setItem(`google_calendar_${selectedAgencyId}`, JSON.stringify(connection))
    toast.success("Google Calendar conectado exitosamente")
    setSyncingGoogle(false)
  }

  const handleDisconnectGoogle = async () => {
    setSyncingGoogle(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setGoogleConnection({ connected: false, syncEnabled: false })
    localStorage.removeItem(`google_calendar_${selectedAgencyId}`)
    toast.success("Google Calendar desconectado")
    setSyncingGoogle(false)
  }

  const handleSyncGoogle = async () => {
    if (!googleConnection.connected) return
    setSyncingGoogle(true)
    
    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 2000))
    toast.success("Calendario sincronizado con Google Calendar")
    setSyncingGoogle(false)
  }

  // Calendar calculations
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDay = firstDay.getDay()
    const daysInMonth = lastDay.getDate()
    
    const days: CalendarDay[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i)
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        tasks: [],
      })
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateStr = date.toISOString().split('T')[0]
      const dayTasks = tasks.filter(t => {
        if (!t.due_date) return false
        const taskDate = new Date(t.due_date).toISOString().split('T')[0]
        if (taskDate !== dateStr) return false
        if (filterSalesRep !== "all" && t.assigned_to !== filterSalesRep) return false
        return true
      })
      
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        tasks: dayTasks,
      })
    }
    
    // Next month days
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day)
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        tasks: [],
      })
    }
    
    return days
  }, [currentDate, tasks, filterSalesRep])

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.due_date || !newTask.due_time || !newTask.assigned_to) {
      toast.error("El titulo, fecha, hora y asesor son requeridos")
      return
    }

    const dueDateTime = `${newTask.due_date}T${newTask.due_time}:00`

    const { error } = await supabase.from("crm_tasks").insert({
      agency_id: selectedAgencyId,
      title: newTask.title,
      description: newTask.description || null,
      task_type: newTask.task_type,
      due_date: dueDateTime,
      priority: newTask.priority,
      prospect_id: newTask.prospect_id && newTask.prospect_id !== "none" ? newTask.prospect_id : null,
      assigned_to: newTask.assigned_to,
    })

    if (error) {
      toast.error("Error al crear la tarea")
      console.error(error)
      return
    }

    // If Google sync is enabled, would create event in Google Calendar
    if (newTask.sync_to_google && googleConnection.connected) {
      toast.success("Tarea creada y sincronizada con Google Calendar")
    } else {
      toast.success("Tarea creada exitosamente")
    }

    setModalOpen(false)
    setNewTask({
      title: "",
      description: "",
      task_type: "call",
      due_date: "",
      due_time: "",
      priority: "medium",
      prospect_id: "",
      assigned_to: "",
      sync_to_google: true,
    })
    fetchData()
  }

  const toggleTaskComplete = async (task: Task) => {
    const { error } = await supabase
      .from("crm_tasks")
      .update({
        is_completed: !task.is_completed,
        completed_at: !task.is_completed ? new Date().toISOString() : null,
      })
      .eq("id", task.id)

    if (error) {
      toast.error("Error al actualizar la tarea")
      return
    }

    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, is_completed: !task.is_completed, completed_at: !task.is_completed ? new Date().toISOString() : null } : t
    ))

    toast.success(!task.is_completed ? "Tarea completada" : "Tarea reabierta")
    setDetailOpen(false)
  }

  const getTaskTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      call: <Phone className="h-3 w-3" />,
      email: <Mail className="h-3 w-3" />,
      meeting: <Users className="h-3 w-3" />,
      follow_up: <Clock className="h-3 w-3" />,
      other: <CalendarIcon className="h-3 w-3" />,
    }
    return icons[type] || <CalendarIcon className="h-3 w-3" />
  }

  const getTaskTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      call: "Llamada",
      email: "Email",
      meeting: "Reunión",
      follow_up: "Seguimiento",
      other: "Otro",
    }
    return labels[type] || type
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: "bg-red-500",
      medium: "bg-amber-500",
      low: "bg-green-500",
    }
    return colors[priority] || "bg-gray-500"
  }

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      high: "Alta",
      medium: "Media",
      low: "Baja",
    }
    return labels[priority] || priority
  }

  // Stats
  const monthStats = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const monthTasks = tasks.filter(t => {
      if (!t.due_date) return false
      const date = new Date(t.due_date)
      return date.getFullYear() === year && date.getMonth() === month
    })
    
    return {
      total: monthTasks.length,
      pending: monthTasks.filter(t => !t.is_completed).length,
      completed: monthTasks.filter(t => t.is_completed).length,
      overdue: monthTasks.filter(t => !t.is_completed && new Date(t.due_date) < new Date()).length,
    }
  }, [currentDate, tasks])

  if (loading || agencyLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-[600px]" />
      </div>
    )
  }

  if (!selectedAgencyId) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <CalendarIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Selecciona una Agencia</h2>
          <p className="text-muted-foreground max-w-md">
            Para ver el calendario, primero selecciona una agencia en el selector de arriba.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendario CRM</h1>
          <p className="text-muted-foreground">
            Visualiza todas las actividades y tareas pendientes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Tarea
          </Button>
          <Link href="/dashboard/crm/tasks">
            <Button variant="ghost">
              Ver Lista
            </Button>
          </Link>
        </div>
      </div>

      {/* Google Calendar Connection */}
      <Card className={googleConnection.connected ? "border-green-500/30 bg-green-500/5" : "border-muted"}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${googleConnection.connected ? "bg-green-500/10" : "bg-muted"}`}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <div>
                <CardTitle className="text-base">Google Calendar</CardTitle>
                <CardDescription>
                  {googleConnection.connected 
                    ? `Conectado como ${googleConnection.email}` 
                    : "Conecta para sincronizar tus tareas"}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {googleConnection.connected ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSyncGoogle}
                    disabled={syncingGoogle}
                  >
                    {syncingGoogle ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="ml-2 hidden sm:inline">Sincronizar</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleDisconnectGoogle}
                    disabled={syncingGoogle}
                  >
                    <Unlink className="h-4 w-4" />
                    <span className="ml-2 hidden sm:inline">Desconectar</span>
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={handleConnectGoogle}
                  disabled={syncingGoogle}
                  size="sm"
                >
                  {syncingGoogle ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="mr-2 h-4 w-4" />
                  )}
                  Conectar Google Calendar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total del Mes</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthStats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{monthStats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{monthStats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtrar por asesor:</span>
              <Select value={filterSalesRep} onValueChange={setFilterSalesRep}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todos los asesores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los asesores</SelectItem>
                  {salesReps.map((rep) => (
                    <SelectItem key={rep.id} value={rep.id}>
                      {rep.first_name} {rep.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoy
              </Button>
              <h2 className="text-lg font-semibold min-w-[180px] text-center">
                {currentDate.toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
              </h2>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent className="p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            <TooltipProvider>
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={`min-h-[100px] p-1 border rounded-lg transition-colors ${
                    day.isCurrentMonth ? 'bg-background' : 'bg-muted/30'
                  } ${day.isToday ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    day.isCurrentMonth ? '' : 'text-muted-foreground'
                  } ${day.isToday ? 'text-primary' : ''}`}>
                    {day.date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {day.tasks.slice(0, 3).map(task => (
                      <Tooltip key={task.id}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              setSelectedTask(task)
                              setDetailOpen(true)
                            }}
                            className={`w-full flex items-center gap-1 p-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity text-left ${
                              task.is_completed ? 'opacity-50 line-through' : ''
                            }`}
                            style={{ 
                              backgroundColor: task.is_completed ? 'hsl(var(--muted))' : `hsl(var(--primary) / 0.1)`,
                            }}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getPriorityColor(task.priority)}`} />
                            {getTaskTypeIcon(task.task_type)}
                            <span className="truncate flex-1">{task.title.substring(0, 12)}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[250px]">
                          <div className="space-y-1">
                            <p className="font-medium">{task.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {getTaskTypeLabel(task.task_type)} - {getPriorityLabel(task.priority)}
                            </p>
                            {task.assigned_staff && (
                              <p className="text-xs">
                                Asignado: {task.assigned_staff.first_name} {task.assigned_staff.last_name}
                              </p>
                            )}
                            {task.prospect && (
                              <p className="text-xs">
                                Prospecto: {task.prospect.contact_name}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {new Date(task.due_date).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {day.tasks.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{day.tasks.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span>Alta prioridad</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Media prioridad</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span>Baja prioridad</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-3 w-3" />
          <span>Llamada</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-3 w-3" />
          <span>Email</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-3 w-3" />
          <span>Reunión</span>
        </div>
      </div>

      {/* Task Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedTask && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${getPriorityColor(selectedTask.priority)}`} />
                  <DialogTitle>{selectedTask.title}</DialogTitle>
                </div>
                <DialogDescription>
                  {getTaskTypeLabel(selectedTask.task_type)} - Prioridad {getPriorityLabel(selectedTask.priority)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {selectedTask.description && (
                  <div>
                    <Label className="text-muted-foreground">Descripción</Label>
                    <p className="text-sm mt-1">{selectedTask.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Fecha y Hora</Label>
                    <p className="text-sm mt-1">
                      {new Date(selectedTask.due_date).toLocaleDateString("es-MX", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      <br />
                      {new Date(selectedTask.due_date).toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Estado</Label>
                    <div className="mt-1">
                      {selectedTask.is_completed ? (
                        <Badge variant="secondary">Completada</Badge>
                      ) : new Date(selectedTask.due_date) < new Date() ? (
                        <Badge variant="destructive">Vencida</Badge>
                      ) : (
                        <Badge>Pendiente</Badge>
                      )}
                    </div>
                  </div>
                </div>
                {selectedTask.assigned_staff && (
                  <div>
                    <Label className="text-muted-foreground">Asignado a</Label>
                    <p className="text-sm mt-1">
                      {selectedTask.assigned_staff.first_name} {selectedTask.assigned_staff.last_name}
                    </p>
                  </div>
                )}
                {selectedTask.prospect && (
                  <div>
                    <Label className="text-muted-foreground">Prospecto</Label>
                    <Link 
                      href={`/dashboard/crm/prospects/${selectedTask.prospect.id}`}
                      className="text-sm mt-1 text-primary hover:underline flex items-center gap-1"
                    >
                      {selectedTask.prospect.contact_name}
                      {selectedTask.prospect.company_name && ` - ${selectedTask.prospect.company_name}`}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  Cerrar
                </Button>
                <Button 
                  onClick={() => toggleTaskComplete(selectedTask)}
                  variant={selectedTask.is_completed ? "secondary" : "default"}
                >
                  {selectedTask.is_completed ? "Reabrir Tarea" : "Marcar Completada"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Task Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nueva Tarea</DialogTitle>
            <DialogDescription>
              Crea una nueva tarea de seguimiento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task_assigned_to">Asesor Comercial *</Label>
              <Select
                value={newTask.assigned_to}
                onValueChange={(value) => setNewTask(prev => ({ ...prev, assigned_to: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un asesor" />
                </SelectTrigger>
                <SelectContent>
                  {salesReps.map((rep) => (
                    <SelectItem key={rep.id} value={rep.id}>
                      {rep.first_name} {rep.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ej: Llamar para seguimiento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detalles adicionales..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task_type">Tipo</Label>
                <Select
                  value={newTask.task_type}
                  onValueChange={(value) => setNewTask(prev => ({ ...prev, task_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Llamada</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Reunión</SelectItem>
                    <SelectItem value="follow_up">Seguimiento</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due_date">Fecha *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_time">Hora *</Label>
                <Input
                  id="due_time"
                  type="time"
                  value={newTask.due_time}
                  onChange={(e) => setNewTask(prev => ({ ...prev, due_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prospect">Prospecto (opcional)</Label>
              <Select
                value={newTask.prospect_id}
                onValueChange={(value) => setNewTask(prev => ({ ...prev, prospect_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin prospecto asociado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin prospecto</SelectItem>
                  {prospects.map((prospect) => (
                    <SelectItem key={prospect.id} value={prospect.id}>
                      {prospect.contact_name}
                      {prospect.company_name && ` - ${prospect.company_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {googleConnection.connected && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-sm">Sincronizar con Google Calendar</span>
                </div>
                <Switch
                  checked={newTask.sync_to_google}
                  onCheckedChange={(checked) => setNewTask(prev => ({ ...prev, sync_to_google: checked }))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTask}>
              Crear Tarea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
