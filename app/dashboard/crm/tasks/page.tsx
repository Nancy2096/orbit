"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { 
  Plus,
  Search,
  Calendar,
  Clock,
  Phone,
  Mail,
  Users,
  CheckCircle,
  AlertTriangle,
  Filter,
  MessageCircle,
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
  assigned_to?: SalesRep | null
  stage?: { name: string | null; is_lost: boolean | null } | null
}

const PAGE_SIZE = 200

const isClosedStage = (stage?: Prospect["stage"]) =>
  !!stage &&
  (stage.is_lost === true || /no\s*interes|no\s*contactad|perdid/i.test(stage.name || ""))

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
  is_paused?: boolean | null
  assigned_staff: SalesRep | null
  prospect: Prospect | null
}

export default function TasksPage() {
  const { selectedAgencyId, loading: agencyLoading } = useAgency()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [salesReps, setSalesReps] = useState<SalesRep[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("pending")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [filterSalesRep, setFilterSalesRep] = useState<string>("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [searchTerm, filterStatus, filterPriority, filterSalesRep])
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    task_type: "call",
    due_date: "",
    due_time: "",
    priority: "medium",
    prospect_id: "",
    assigned_to: "",
  })
  const supabase = createClient()

  useEffect(() => {
    if (selectedAgencyId) {
      fetchData()
    } else {
      setLoading(false)
      setTasks([])
      setProspects([])
    }
  }, [selectedAgencyId])

  const fetchData = async () => {
    if (!selectedAgencyId) return
    setLoading(true)

    // Fetch sales reps only from Comercial and Dirección departments
    const { data: commercialDepts } = await supabase
      .from("departments")
      .select("id")
      .eq("agency_id", selectedAgencyId)
      .in("name", ["Comercial", "Dirección"])
    
    const deptIds = commercialDepts?.map(d => d.id) || []

    // Los departamentos ya pertenecen a la agencia; no se filtra staff.agency_id
    // porque la Dirección (p. ej. el Director General) tiene agency_id vacío.
    const { data: salesRepsData } = await supabase
      .from("staff")
      .select("id, first_name, last_name")
      .eq("is_active", true)
      .in("department_id", deptIds.length > 0 ? deptIds : ["00000000-0000-0000-0000-000000000000"])
      .order("first_name")

    // Supabase devuelve máximo 1000 filas por consulta, así que se pagina.
    const tasksData: Omit<Task, "assigned_staff">[] = []
    const pageSize = 1000
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from("crm_tasks")
        .select(`
          id, title, description, task_type, due_date, priority, is_completed, completed_at, assigned_to, is_paused,
          prospect:crm_prospects(id, contact_name, company_name, stage:crm_pipeline_stages(name, is_lost))
        `)
        .eq("agency_id", selectedAgencyId)
        .order("due_date", { ascending: true })
        .order("id", { ascending: true })
        .range(from, from + pageSize - 1)
      if (error) {
        console.error("Error al cargar tareas:", error)
        toast.error("Error al cargar las tareas")
        break
      }
      tasksData.push(...((data || []) as unknown as Omit<Task, "assigned_staff">[]))
      if (!data || data.length < pageSize) break
    }

    // crm_tasks no tiene relación declarada con staff: el responsable se resuelve aquí,
    // incluyendo a quien tenga tareas aunque no esté en Comercial/Dirección.
    const repsById = new Map<string, SalesRep>((salesRepsData || []).map(r => [r.id, r]))
    const missingIds = [...new Set(tasksData.map(t => t.assigned_to).filter((id): id is string => !!id && !repsById.has(id)))]
    if (missingIds.length > 0) {
      const { data: extraStaff } = await supabase
        .from("staff")
        .select("id, first_name, last_name")
        .in("id", missingIds)
      extraStaff?.forEach(s => repsById.set(s.id, s))
    }

    const assigneeIds = new Set(tasksData.map(t => t.assigned_to).filter(Boolean))
    setSalesReps(
      [...repsById.values()]
        .filter(r => (salesRepsData || []).some(s => s.id === r.id) || assigneeIds.has(r.id))
        .sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, "es")),
    )

    setTasks(tasksData.map(t => ({ ...t, assigned_staff: t.assigned_to ? repsById.get(t.assigned_to) ?? null : null })))

    // Fetch prospects for dropdown (filtered by agency)
    const { data: prospectsData } = await supabase
      .from("crm_prospects")
      .select("id, contact_name, company_name, assigned_to:staff!crm_prospects_assigned_to_fkey(id, first_name, last_name)")
      .eq("agency_id", selectedAgencyId)
      .eq("status", "active")
      .order("contact_name")

    if (prospectsData) {
      setProspects(prospectsData as Prospect[])
    }

    setLoading(false)
  }

  const filteredTasks = tasks.filter(task => {
    const salesRepName = task.assigned_staff
      ? `${task.assigned_staff.first_name} ${task.assigned_staff.last_name}`.toLowerCase()
      : ""
    
    const matchesSearch = searchTerm === "" ||
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.prospect?.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salesRepName.includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === "all" ||
      (filterStatus === "pending" && !task.is_completed) ||
      (filterStatus === "completed" && task.is_completed) ||
      (filterStatus === "overdue" && !task.is_completed && new Date(task.due_date) < new Date())

    const matchesPriority = filterPriority === "all" || task.priority === filterPriority
    
    // Filter by task's assigned_to, not prospect's
    const matchesSalesRep = filterSalesRep === "all" || task.assigned_to === filterSalesRep

    return matchesSearch && matchesStatus && matchesPriority && matchesSalesRep
  })

  const toggleTaskComplete = async (taskId: string, isCompleted: boolean) => {
    const task = tasks.find(t => t.id === taskId)
    const completing = !isCompleted
    const now = new Date().toISOString()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Mismos campos que usan el detalle del prospecto y el calendario, para que
    // la tarea aparezca realizada (con su fecha) en todos lados sin duplicarse.
    const { error } = await supabase
      .from("crm_tasks")
      .update({
        status: completing ? "completed" : "pending",
        is_completed: completing,
        completed_at: completing ? now : null,
        completed_by: completing ? user?.id ?? null : null,
        updated_at: now,
      })
      .eq("id", taskId)

    if (error) {
      toast.error("Error al actualizar la tarea")
      return
    }

    if (task?.prospect) {
      const { error: activityError } = await supabase.from("crm_activities").insert({
        prospect_id: task.prospect.id,
        task_id: task.id,
        activity_type: "task",
        subject: `${completing ? "Tarea realizada" : "Tarea reabierta"}: ${task.title}`.slice(0, 250),
        description: completing
          ? `La tarea "${task.title}" se marcó como realizada desde Comercial > Tareas.`
          : `La tarea "${task.title}" se reabrió desde Comercial > Tareas y volvió a pendiente.`,
        activity_date: now,
        is_completed: completing,
        completed_at: completing ? now : null,
        completed_by: completing ? user?.id ?? null : null,
        created_by: user?.id ?? null,
      })
      if (activityError) console.error("No se pudo registrar la actividad:", activityError)
    }

    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, is_completed: completing, completed_at: completing ? now : null } : t
    ))

    toast.success(!isCompleted ? "Tarea completada" : "Tarea reabierta")
  }

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.due_date || !newTask.due_time || !newTask.assigned_to) {
      toast.error("El titulo, fecha, hora y asesor son requeridos")
      return
    }

    // Combine date and time
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

    toast.success("Tarea creada exitosamente")
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
    })
    fetchData()
  }

  const getTaskTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      call: <Phone className="h-4 w-4" />,
      whatsapp: <MessageCircle className="h-4 w-4" />,
      email: <Mail className="h-4 w-4" />,
      meeting: <Users className="h-4 w-4" />,
      follow_up: <Clock className="h-4 w-4" />,
      other: <Calendar className="h-4 w-4" />,
    }
    return icons[type] || <Calendar className="h-4 w-4" />
  }

  const getTaskTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      call: "Llamada",
      whatsapp: "WhatsApp",
      email: "Email",
      meeting: "Reunión",
      follow_up: "Seguimiento",
      other: "Otro",
    }
    return labels[type] || type
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      high: "destructive",
      medium: "default",
      low: "secondary",
    }
    const labels: Record<string, string> = {
      high: "Alta",
      medium: "Media",
      low: "Baja",
    }
    return <Badge variant={variants[priority] || "outline"}>{labels[priority] || priority}</Badge>
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return { text: `Hace ${Math.abs(diffDays)} días`, isOverdue: true }
    if (diffDays === 0) return { text: "Hoy", isOverdue: false }
    if (diffDays === 1) return { text: "Mañana", isOverdue: false }
    if (diffDays <= 7) return { text: `En ${diffDays} días`, isOverdue: false }
    
    return { 
      text: date.toLocaleDateString("es-MX", { day: "numeric", month: "short" }), 
      isOverdue: false 
    }
  }

  if (loading || agencyLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-[500px]" />
      </div>
    )
  }

  if (!selectedAgencyId) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Selecciona una Agencia</h2>
          <p className="text-muted-foreground max-w-md">
            Para ver las tareas, primero selecciona una agencia en el selector de arriba.
          </p>
        </div>
      </div>
    )
  }

  const pendingCount = tasks.filter(t => !t.is_completed).length
  const overdueCount = tasks.filter(t => !t.is_completed && new Date(t.due_date) < new Date()).length
  const todayCount = tasks.filter(t => {
    const today = new Date().toDateString()
    return !t.is_completed && new Date(t.due_date).toDateString() === today
  }).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tareas</h1>
          <p className="text-muted-foreground">
            Gestiona tus seguimientos y próximos pasos
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Tarea
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Para Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Rep Filter - Prominent */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Seleccionar Asesor Comercial
          </CardTitle>
          <CardDescription>
            Selecciona un asesor para ver sus tareas asignadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {salesReps.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No hay asesores configurados en departamentos Comercial o Dirección.
            </div>
          ) : (
            <Select value={filterSalesRep} onValueChange={setFilterSalesRep}>
              <SelectTrigger className="w-full md:w-[300px] bg-background">
                <SelectValue placeholder="Selecciona un asesor" />
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
          )}
        </CardContent>
      </Card>

      {/* Additional Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tareas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
                <SelectItem value="overdue">Vencidas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card>
        <CardContent className="p-0">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p>No hay tareas</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredTasks.slice(0, visibleCount).map((task) => {
                const dateInfo = formatDate(task.due_date)
                return (
                  <div
                    key={task.id}
                    className={`flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors ${
                      task.is_completed ? "opacity-60" : ""
                    }`}
                  >
                    <Checkbox
                      checked={task.is_completed}
                      onCheckedChange={() => toggleTaskComplete(task.id, task.is_completed)}
                      className="mt-1"
                    />
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                      {getTaskTypeIcon(task.task_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium ${task.is_completed ? "line-through" : ""}`}>
                        {task.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {task.assigned_staff && (
                          <Badge variant="outline" className="text-xs">
                            {task.assigned_staff.first_name} {task.assigned_staff.last_name}
                          </Badge>
                        )}
                        {task.prospect ? (
                          <Link
                            href={`/dashboard/crm/prospects/${task.prospect.id}`}
                            className="text-sm text-muted-foreground hover:underline"
                          >
                            {task.prospect.contact_name}
                            {task.prospect.company_name && ` - ${task.prospect.company_name}`}
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">Sin prospecto</span>
                        )}
                        {isClosedStage(task.prospect?.stage) && task.prospect?.stage?.name && (
                          <Badge variant="secondary" className="text-xs">{task.prospect.stage.name}</Badge>
                        )}
                        {task.is_paused && !task.is_completed && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">Pausada por etapa</Badge>
                        )}
                      </div>
                      {task.is_completed && task.completed_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Realizada el {new Date(task.completed_at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
                        </p>
                      )}
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getPriorityBadge(task.priority)}
                      <div className="text-right">
                        <span className={`text-sm block ${dateInfo.isOverdue && !task.is_completed ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                          {dateInfo.text}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(task.due_date).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {task.is_completed ? (
                        <Badge variant="secondary" className="text-xs">Completada</Badge>
                      ) : dateInfo.isOverdue ? (
                        <Badge variant="destructive" className="text-xs">Vencida</Badge>
                      ) : null}
                    </div>
                  </div>
                )
              })}
              {filteredTasks.length > visibleCount && (
                <div className="flex flex-col items-center gap-2 p-4">
                  <span className="text-sm text-muted-foreground">
                    Mostrando {visibleCount} de {filteredTasks.length} tareas
                  </span>
                  <Button variant="outline" onClick={() => setVisibleCount(c => c + PAGE_SIZE)}>
                    Mostrar más
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
            {/* Sales Rep - First and Required */}
            <div className="space-y-2 p-3 border rounded-lg bg-primary/5 border-primary/20">
              <Label htmlFor="task_assigned_to" className="font-medium">Asesor Comercial *</Label>
              {salesReps.length === 0 ? (
                <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                  No hay asesores comerciales disponibles. Asegúrate de que haya personal en los departamentos "Comercial" o "Dirección".
                </div>
              ) : (
                <Select
                  value={newTask.assigned_to}
                  onValueChange={(value) => setNewTask({ ...newTask, assigned_to: value })}
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
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="task_title">Titulo *</Label>
              <Input
                id="task_title"
                placeholder="Ej: Llamar para dar seguimiento"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="task_type">Tipo</Label>
                <Select
                  value={newTask.task_type}
                  onValueChange={(value) => setNewTask({ ...newTask, task_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Llamada</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Reunion</SelectItem>
                    <SelectItem value="follow_up">Seguimiento</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task_priority">Prioridad</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
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

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="task_due_date">Fecha *</Label>
                <Input
                  id="task_due_date"
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task_due_time">Hora *</Label>
                <Input
                  id="task_due_time"
                  type="time"
                  value={newTask.due_time}
                  onChange={(e) => setNewTask({ ...newTask, due_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task_prospect">Prospecto (opcional)</Label>
              <Select
                value={newTask.prospect_id}
                onValueChange={(value) => setNewTask({ ...newTask, prospect_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin prospecto vinculado" />
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

            <div className="space-y-2">
              <Label htmlFor="task_description">Descripción</Label>
              <Textarea
                id="task_description"
                placeholder="Detalles adicionales..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTask}>
              Crear Tarea
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
