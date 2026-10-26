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
import {
  EMAIL_PERMISSION_NOTICE,
  TaskMessageDialog,
  buildContactOptions,
  useMessageSender,
  type ContactOption,
  type MessageChannel,
} from "@/components/crm/task-message-dialog"
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
  MessageCircle,
  PlayCircle,
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
  contact_email?: string | null
  contact_phone?: string | null
  assigned_to?: string | null
  stage?: { name: string | null; is_lost: boolean | null } | null
}

// Etapas cerradas (Perdido, No interesado, No contactado): el prospecto ya no
// debe generar tareas pendientes en el calendario.
const isClosedStage = (stage?: Prospect["stage"]) =>
  !!stage &&
  (stage.is_lost === true || /no\s*interes|no\s*contactad|perdid/i.test(stage.name || ""))

interface Appointment {
  id: string
  title: string
  appointment_type: string | null
  start_datetime: string
  status: string | null
  prospect: Prospect | null
}

const PAGE_SIZE = 1000

const toLocalDateKey = (value: string | Date) => {
  const d = typeof value === "string" ? new Date(value) : value
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
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
  whatsapp_message?: string | null
  email_subject?: string | null
  email_message?: string | null
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  tasks: Task[]
  appointments: Appointment[]
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
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [salesReps, setSalesReps] = useState<SalesRep[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [filterSalesRep, setFilterSalesRep] = useState<string>("all")
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [dayDetailKey, setDayDetailKey] = useState<string | null>(null)
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null)
  const [messageDialog, setMessageDialog] = useState<{
    task: Task
    channel: MessageChannel
    emailOptions: ContactOption[]
    phoneOptions: ContactOption[]
  } | null>(null)
  const [openingChannel, setOpeningChannel] = useState<MessageChannel | null>(null)
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

    // Supabase limita cada consulta a 1000 filas, así que se pagina para traer
    // todas las tareas y citas de todos los prospectos de la agencia.
    const fetchAll = async <T,>(
      build: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>,
    ): Promise<T[]> => {
      const rows: T[] = []
      for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await build(from, from + PAGE_SIZE - 1)
        if (error) {
          console.error("[calendar] fetch error:", error.message)
          break
        }
        rows.push(...((data ?? []) as T[]))
        if (!data || data.length < PAGE_SIZE) break
      }
      return rows
    }

    const [tasksData, appointmentsData] = await Promise.all([
      fetchAll<Task>((from, to) =>
        supabase
          .from("crm_tasks")
          .select(`
            id, title, description, task_type, due_date, priority, is_completed, completed_at, assigned_to,
            whatsapp_message, email_subject, email_message,
            prospect:crm_prospects(id, contact_name, company_name, contact_email, contact_phone, assigned_to,
              stage:crm_pipeline_stages(name, is_lost))
          `)
          .eq("agency_id", selectedAgencyId)
          .order("due_date", { ascending: true })
          .order("id", { ascending: true })
          .range(from, to),
      ),
      fetchAll<Appointment>((from, to) =>
        supabase
          .from("crm_appointments")
          .select(`
            id, title, appointment_type, start_datetime, status,
            prospect:crm_prospects(id, contact_name, company_name, assigned_to)
          `)
          .eq("agency_id", selectedAgencyId)
          .order("start_datetime", { ascending: true })
          .order("id", { ascending: true })
          .range(from, to),
      ),
    ])

    setAppointments(appointmentsData)

    // El filtro incluye a todo asesor, gerente o director con prospectos o tareas
    // asignadas, aunque no pertenezca a los departamentos Comercial/Dirección.
    const repsById = new Map<string, SalesRep>()
    for (const rep of salesRepsData ?? []) repsById.set(rep.id, rep)
    const ownerIds = new Set<string>()
    for (const t of tasksData) {
      if (t.prospect?.assigned_to) ownerIds.add(t.prospect.assigned_to)
      if (t.assigned_to) ownerIds.add(t.assigned_to)
    }
    for (const a of appointmentsData) {
      if (a.prospect?.assigned_to) ownerIds.add(a.prospect.assigned_to)
    }
    const missingIds = [...ownerIds].filter((id) => !repsById.has(id))
    if (missingIds.length > 0) {
      const { data: extraStaff } = await supabase
        .from("staff")
        .select("id, first_name, last_name")
        .in("id", missingIds)
      for (const s of extraStaff ?? []) repsById.set(s.id, s)
    }
    // crm_tasks no tiene relación declarada con staff, así que el responsable se resuelve aquí.
    setTasks(
      tasksData
        .filter((t) => t.is_completed || !isClosedStage(t.prospect?.stage))
        .map((t) => ({
        ...t,
        assigned_staff: t.assigned_to ? repsById.get(t.assigned_to) ?? null : null,
      })),
    )
    setSalesReps(
      [...repsById.values()].sort((a, b) =>
        `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, "es"),
      ),
    )

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

  // Una tarea o cita pertenece al asesor dueño del prospecto; si la tarea no
  // tiene prospecto (o se asignó a otra persona), también cuenta para su responsable.
  const filteredTasks = useMemo(() => {
    if (filterSalesRep === "all") return tasks
    return tasks.filter(
      (t) => t.prospect?.assigned_to === filterSalesRep || t.assigned_to === filterSalesRep,
    )
  }, [tasks, filterSalesRep])

  const filteredAppointments = useMemo(() => {
    if (filterSalesRep === "all") return appointments
    return appointments.filter((a) => a.prospect?.assigned_to === filterSalesRep)
  }, [appointments, filterSalesRep])

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of filteredTasks) {
      if (!t.due_date) continue
      const key = toLocalDateKey(t.due_date)
      const list = map.get(key)
      if (list) list.push(t)
      else map.set(key, [t])
    }
    return map
  }, [filteredTasks])

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const a of filteredAppointments) {
      if (!a.start_datetime) continue
      const key = toLocalDateKey(a.start_datetime)
      const list = map.get(key)
      if (list) list.push(a)
      else map.set(key, [a])
    }
    return map
  }, [filteredAppointments])

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
        appointments: [],
      })
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateStr = toLocalDateKey(date)

      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        tasks: tasksByDay.get(dateStr) ?? [],
        appointments: appointmentsByDay.get(dateStr) ?? [],
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
        appointments: [],
      })
    }
    
    return days
  }, [currentDate, tasksByDay, appointmentsByDay])

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

  const openMessageDialog = async (task: Task, channel: MessageChannel) => {
    if (!task.prospect) return
    setOpeningChannel(channel)
    const { data: extraContacts } = await supabase
      .from("crm_prospect_contacts")
      .select("contact_name, contact_email, contact_phone")
      .eq("prospect_id", task.prospect.id)
    setOpeningChannel(null)

    setDetailOpen(false)
    setMessageDialog({
      task,
      channel,
      emailOptions: buildContactOptions(task.prospect, extraContacts, "contact_email"),
      phoneOptions: buildContactOptions(task.prospect, extraContacts, "contact_phone"),
    })
  }

  const closeMessageDialog = () => {
    setMessageDialog(null)
    setDetailOpen(true)
  }

  const markTaskCompletedLocally = (taskId: string) => {
    const completedAt = new Date().toISOString()
    const complete = (t: Task): Task => ({ ...t, is_completed: true, completed_at: completedAt })
    setTasks((prev) => prev.map((t) => (t.id === taskId ? complete(t) : t)))
    setSelectedTask((prev) => (prev?.id === taskId ? complete(prev) : prev))
  }

  const toggleTaskComplete = async (task: Task) => {
    const completing = !task.is_completed
    const now = new Date().toISOString()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase
      .from("crm_tasks")
      .update({
        status: completing ? "completed" : "pending",
        is_completed: completing,
        completed_at: completing ? now : null,
        completed_by: completing ? user?.id ?? null : null,
        updated_at: now,
      })
      .eq("id", task.id)

    if (error) {
      toast.error("Error al actualizar la tarea")
      return
    }

    if (task.prospect) {
      const { error: activityError } = await supabase.from("crm_activities").insert({
        prospect_id: task.prospect.id,
        task_id: task.id,
        activity_type: "task",
        subject: `${completing ? "Tarea realizada" : "Tarea reabierta"}: ${task.title}`.slice(0, 250),
        description: completing
          ? `La tarea "${task.title}" se marcó como realizada desde el calendario.`
          : `La tarea "${task.title}" se reabrió desde el calendario y volvió a pendiente.`,
        activity_date: now,
        is_completed: completing,
        completed_at: completing ? now : null,
        completed_by: completing ? user?.id ?? null : null,
        created_by: user?.id ?? null,
      })
      if (activityError) console.error("No se pudo registrar la actividad:", activityError)
    }

    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, is_completed: completing, completed_at: completing ? now : null } : t
    ))

    toast.success(completing ? "Tarea realizada y registrada en actividades" : "Tarea reabierta")
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
    const monthTasks = filteredTasks.filter(t => {
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
  }, [currentDate, filteredTasks])

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

  const dayDetail = dayDetailKey
    ? calendarDays.find((d) => toLocalDateKey(d.date) === dayDetailKey) ?? null
    : null

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
            <CardTitle className="text-sm font-medium">Realizadas</CardTitle>
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
                              task.is_completed ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200' : ''
                            }`}
                            style={task.is_completed ? undefined : { backgroundColor: `hsl(var(--primary) / 0.1)` }}
                          >
                            {task.is_completed ? (
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600" aria-label="Realizada" />
                            ) : (
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getPriorityColor(task.priority)}`} />
                            )}
                            {getTaskTypeIcon(task.task_type)}
                            <span className={`truncate flex-1 ${task.is_completed ? 'line-through opacity-70' : ''}`}>
                              {task.title.substring(0, 12)}
                            </span>
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
                    {day.appointments.slice(0, Math.max(0, 3 - day.tasks.length)).map(apt => (
                      <Tooltip key={apt.id}>
                        <TooltipTrigger asChild>
                          {apt.prospect ? (
                            <Link
                              href={`/dashboard/crm/prospects/${apt.prospect.id}`}
                              className="w-full flex items-center gap-1 p-1 rounded text-xs bg-purple-100 text-purple-700 hover:opacity-80 transition-opacity"
                            >
                              <Users className="h-3 w-3 shrink-0" />
                              <span className="truncate flex-1">{apt.title}</span>
                            </Link>
                          ) : (
                            <div className="w-full flex items-center gap-1 p-1 rounded text-xs bg-purple-100 text-purple-700">
                              <Users className="h-3 w-3 shrink-0" />
                              <span className="truncate flex-1">{apt.title}</span>
                            </div>
                          )}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[250px]">
                          <div className="space-y-1">
                            <p className="font-medium">{apt.title}</p>
                            <p className="text-xs text-muted-foreground">Cita</p>
                            {apt.prospect && (
                              <p className="text-xs">Prospecto: {apt.prospect.contact_name}</p>
                            )}
                            {apt.prospect?.assigned_to && (
                              <p className="text-xs">
                                Asesor: {(() => {
                                  const rep = salesReps.find(r => r.id === apt.prospect?.assigned_to)
                                  return rep ? `${rep.first_name} ${rep.last_name}` : "—"
                                })()}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {new Date(apt.start_datetime).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {day.tasks.length + day.appointments.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setDayDetailKey(toLocalDateKey(day.date))}
                        className="w-full rounded px-1 py-0.5 text-xs font-medium text-primary text-center hover:bg-primary/10 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Ver todas las actividades del ${day.date.toLocaleDateString("es-MX", { day: "numeric", month: "long" })}`}
                      >
                        +{day.tasks.length + day.appointments.length - 3} más
                      </button>
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
      <Dialog open={!!dayDetail} onOpenChange={(open) => !open && setDayDetailKey(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {dayDetail?.date.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </DialogTitle>
            <DialogDescription>
              {dayDetail
                ? `${dayDetail.tasks.length} ${dayDetail.tasks.length === 1 ? "tarea" : "tareas"} · ${dayDetail.appointments.length} ${dayDetail.appointments.length === 1 ? "cita" : "citas"}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {dayDetail && (
            <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
              {dayDetail.tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 ${task.is_completed ? "bg-green-50 dark:bg-green-950/40" : ""}`}
                >
                  {task.is_completed ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" aria-label="Realizada" />
                  ) : (
                    <span className={`h-2 w-2 shrink-0 rounded-full ${getPriorityColor(task.priority)}`} aria-hidden="true" />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setDayDetailKey(null)
                      setSelectedTask(task)
                      setDetailOpen(true)
                    }}
                    className="min-w-0 flex-1 text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  >
                    <p className={`truncate text-sm font-medium ${task.is_completed ? "line-through opacity-70" : ""}`}>
                      {task.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {new Date(task.due_date).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                      {" · "}
                      {getTaskTypeLabel(task.task_type)}
                      {task.prospect ? ` · ${task.prospect.contact_name}` : ""}
                      {task.is_completed && task.completed_at
                        ? ` · Realizada ${new Date(task.completed_at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}`
                        : ""}
                    </p>
                  </button>
                  <Button
                    size="sm"
                    variant={task.is_completed ? "ghost" : "outline"}
                    className="shrink-0"
                    disabled={togglingTaskId === task.id}
                    onClick={async () => {
                      setTogglingTaskId(task.id)
                      await toggleTaskComplete(task)
                      setTogglingTaskId(null)
                    }}
                  >
                    {togglingTaskId === task.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : task.is_completed ? (
                      "Reabrir"
                    ) : (
                      "Marcar Realizada"
                    )}
                  </Button>
                </div>
              ))}
              {dayDetail.appointments.map((apt) => (
                <div key={apt.id} className="flex items-center gap-3 rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-900 dark:bg-purple-950/40">
                  <Users className="h-4 w-4 shrink-0 text-purple-700" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{apt.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Cita · {new Date(apt.start_datetime).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                      {apt.prospect ? ` · ${apt.prospect.contact_name}` : ""}
                    </p>
                  </div>
                  {apt.prospect && (
                    <Button asChild size="sm" variant="ghost" className="shrink-0">
                      <Link href={`/dashboard/crm/prospects/${apt.prospect.id}`}>Ver prospecto</Link>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                        <Badge className="gap-1 bg-green-600 text-white hover:bg-green-600">
                          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                          Realizada
                          {selectedTask.completed_at &&
                            ` · ${new Date(selectedTask.completed_at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}`}
                        </Badge>
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
                {selectedTask.prospect && !selectedTask.is_completed && (
                  <TaskActions
                    task={selectedTask}
                    openingChannel={openingChannel}
                    onOpenMessage={(channel) => openMessageDialog(selectedTask, channel)}
                  />
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
                  {selectedTask.is_completed ? "Reabrir Tarea" : "Marcar Realizada"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {messageDialog?.task.prospect && (
        <TaskMessageDialog
          open
          onOpenChange={(open) => {
            if (!open) closeMessageDialog()
          }}
          channel={messageDialog.channel}
          prospectId={messageDialog.task.prospect.id}
          prospectName={messageDialog.task.prospect.contact_name}
          task={messageDialog.task}
          emailOptions={messageDialog.emailOptions}
          phoneOptions={messageDialog.phoneOptions}
          onLogged={() => {}}
          onTaskCompleted={markTaskCompletedLocally}
        />
      )}

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

function TaskActions({
  task,
  openingChannel,
  onOpenMessage,
}: {
  task: Task
  openingChannel: MessageChannel | null
  onOpenMessage: (channel: MessageChannel) => void
}) {
  const { data: sender, isLoading: senderLoading } = useMessageSender(task.prospect?.id)
  if (!task.prospect) return null
  const hasEmail = Boolean(task.email_subject?.trim() || task.email_message?.trim())
  const hasWhatsApp = Boolean(task.whatsapp_message?.trim())
  const emailNotAllowed = hasEmail && sender !== undefined && !sender.canSendEmail
  const phone = task.prospect.contact_phone?.trim()
  const isCall = task.task_type === "call"

  const notices: string[] = []
  if (!hasEmail) notices.push("Correo: esta tarea no tiene mensaje de correo.")
  else if (emailNotAllowed) notices.push(EMAIL_PERMISSION_NOTICE)
  if (!hasWhatsApp) notices.push("WhatsApp: esta tarea no tiene mensaje de WhatsApp.")

  return (
    <div className="rounded-lg border bg-muted/40 p-3">
      <Label className="flex items-center gap-1.5 text-muted-foreground">
        <PlayCircle className="h-4 w-4" />
        Realizar tarea
      </Label>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => onOpenMessage("email")}
          disabled={openingChannel !== null || !hasEmail || emailNotAllowed || senderLoading}
          title={!hasEmail ? "Esta tarea no tiene mensaje de correo" : emailNotAllowed ? EMAIL_PERMISSION_NOTICE : undefined}
        >
          {openingChannel === "email" || (hasEmail && senderLoading) ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Mail className="mr-1.5 h-4 w-4" />
          )}
          Enviar correo
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onOpenMessage("whatsapp")}
          disabled={openingChannel !== null || !hasWhatsApp}
          title={hasWhatsApp ? undefined : "Esta tarea no tiene mensaje de WhatsApp"}
        >
          {openingChannel === "whatsapp" ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <MessageCircle className="mr-1.5 h-4 w-4" />
          )}
          Enviar WhatsApp
        </Button>
        {isCall && phone && (
          <Button size="sm" variant="outline" asChild>
            <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
              <Phone className="mr-1.5 h-4 w-4" />
              Llamar {phone}
            </a>
          </Button>
        )}
        <Button size="sm" variant="outline" asChild>
          <Link href={`/dashboard/crm/prospects/${task.prospect.id}`}>
            <ExternalLink className="mr-1.5 h-4 w-4" />
            Abrir prospecto
          </Link>
        </Button>
      </div>
      {notices.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          {notices.map((notice) => (
            <li key={notice} className="flex items-start gap-1.5">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />
              {notice}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
