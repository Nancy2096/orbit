"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Clock,
  Calendar,
  User,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Plus,
  MoreHorizontal,
  Play,
  Pause,
  Edit,
  Briefcase,
  FolderKanban,
  MessageCircle,
  Paperclip,
  Send,
  Eye,
  EyeOff,
  Timer,
  ListTodo,
  History,
  Link2,
  Flag,
  Tag,
  CheckSquare,
  Upload,
  Download,
  Trash2,
  ExternalLink,
  Bell,
  BellRing,
  AtSign,
  Image,
  FileImage,
  File,
  X,
  StickyNote,
  LayoutGrid,
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"


const taskStatusConfig: Record<string, { label: string; color: string }> = {
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

const priorityConfig: Record<string, { label: string; color: string; textColor: string }> = {
  baja: { label: "Baja", color: "bg-slate-400", textColor: "text-slate-600" },
  media: { label: "Media", color: "bg-blue-400", textColor: "text-blue-600" },
  alta: { label: "Alta", color: "bg-amber-500", textColor: "text-amber-600" },
  urgente: { label: "Urgente", color: "bg-orange-500", textColor: "text-orange-600" },
  critica: { label: "Crítica", color: "bg-red-600", textColor: "text-red-600" },
}

// Mock tasks database - same as in tasks list
const tasksDatabase: Record<string, any> = {
  "1": {
    id: "1",
    name: "Diseñar artes campaña leads",
    description: "Crear los diseños para la campaña de captación de leads del proyecto Horizonte. Incluye banners para redes sociales, email marketing y landing page.",
    project: { id: "proj-001", name: "Campaña Leads Q2" },
    client: "Desarrolladora Horizonte",
    account: "Horizonte Premium",
    status: "en_proceso",
    priority: "alta",
    dueDate: "2026-05-12",
    startDate: "2026-05-01",
    estimatedHours: 8,
    workedHours: 4.5,
    progress: 56,
    area: "Diseño",
    isClientVisible: true,
    isOverdue: false,
    assignee: { id: "user-1", name: "Diana García", initials: "DG", role: "Diseñador Senior", email: "diana@agencia.com" },
    createdBy: { id: "user-2", name: "Eduardo Méndez", initials: "EM" },
  },
  "2": {
    id: "2",
    name: "Configurar Meta Ads",
    description: "Configurar la campaña de Meta Ads para la captación de leads. Incluye configuración de audiencias, presupuesto y seguimiento de conversiones.",
    project: { id: "proj-001", name: "Campaña Leads Q2" },
    client: "Desarrolladora Horizonte",
    account: "Horizonte Premium",
    status: "por_asignar",
    priority: "urgente",
    dueDate: "2026-05-11",
    startDate: "2026-05-01",
    estimatedHours: 6,
    workedHours: 0,
    progress: 0,
    area: "Estrategia",
    isClientVisible: false,
    isOverdue: true,
    assignee: { id: "user-2", name: "Eduardo Méndez", initials: "EM", role: "Estratega Digital", email: "eduardo@agencia.com" },
    createdBy: { id: "user-1", name: "Diana García", initials: "DG" },
  },
  "3": {
    id: "3",
    name: "Revisar copies landing",
    description: "Revisar y ajustar los copies de la landing page de Torre Central para mejorar conversiones.",
    project: { id: "proj-002", name: "Landing Torre Central" },
    client: "Torre Central Living",
    account: "Torre Central",
    status: "revision_interna",
    priority: "media",
    dueDate: "2026-05-13",
    startDate: "2026-05-05",
    estimatedHours: 4,
    workedHours: 2,
    progress: 50,
    area: "Copywriting",
    isClientVisible: false,
    isOverdue: false,
    assignee: { id: "user-3", name: "María López", initials: "ML", role: "Copywriter", email: "maria@agencia.com" },
    createdBy: { id: "user-2", name: "Eduardo Méndez", initials: "EM" },
  },
  "4": {
    id: "4",
    name: "Subir cambios a web",
    description: "Implementar los cambios solicitados en la landing page de Torre Central.",
    project: { id: "proj-002", name: "Landing Torre Central" },
    client: "Torre Central Living",
    account: "Torre Central",
    status: "cambios_solicitados",
    priority: "alta",
    dueDate: "2026-05-10",
    startDate: "2026-05-03",
    estimatedHours: 5,
    workedHours: 3,
    progress: 60,
    area: "Programación",
    isClientVisible: true,
    isOverdue: true,
    assignee: { id: "user-4", name: "Carlos Ruiz", initials: "CR", role: "Desarrollador Web", email: "carlos@agencia.com" },
    createdBy: { id: "user-2", name: "Eduardo Méndez", initials: "EM" },
  },
  "5": {
    id: "5",
    name: "Render exterior torre",
    description: "Crear render exterior de alta calidad para el proyecto Nova Arquitectura.",
    project: { id: "proj-005", name: "Renders 3D" },
    client: "Nova Arquitectura",
    account: "Nova Arq",
    status: "en_proceso",
    priority: "critica",
    dueDate: "2026-05-08",
    startDate: "2026-04-25",
    estimatedHours: 20,
    workedHours: 12,
    progress: 60,
    area: "Producción",
    isClientVisible: true,
    isOverdue: true,
    assignee: { id: "user-5", name: "Roberto Sánchez", initials: "RS", role: "Artista 3D", email: "roberto@agencia.com" },
    createdBy: { id: "user-2", name: "Eduardo Méndez", initials: "EM" },
  },
}

// Default task template for unknown IDs
const getTaskById = (id: string) => {
  if (tasksDatabase[id]) {
    return {
      ...tasksDatabase[id],
      createdAt: "2026-05-01T10:30:00",
      updatedAt: "2026-05-10T14:20:00",
      subtasks: [
        { id: "sub-1", name: "Revisar requerimientos", completed: true },
        { id: "sub-2", name: "Desarrollo inicial", completed: true },
        { id: "sub-3", name: "Revisión interna", completed: false },
        { id: "sub-4", name: "Ajustes finales", completed: false },
        { id: "sub-5", name: "Entrega al cliente", completed: false },
      ],
      comments: [
        { 
          id: "c1", 
          author: { id: "user-2", name: "Eduardo Méndez", initials: "EM" }, 
          text: "Revisemos los requerimientos antes de empezar. @Diana García por favor revisa el brandbook actualizado.", 
          date: "2026-05-02T09:00:00",
          mentions: [{ id: "user-1", name: "Diana García" }],
          attachments: [
            { id: "ca1", name: "Brandbook_2026.pdf", type: "pdf", size: "2.4 MB" }
          ]
        },
        { 
          id: "c2", 
          author: { id: "user-1", name: tasksDatabase[id].assignee.name, initials: tasksDatabase[id].assignee.initials }, 
          text: "Entendido, comenzaré con el desarrollo. Adjunto el primer borrador para revisión.", 
          date: "2026-05-02T10:15:00",
          mentions: [],
          attachments: [
            { id: "ca2", name: "Borrador_v1.png", type: "image", size: "1.8 MB" }
          ]
        },
        { 
          id: "c3", 
          author: { id: "user-2", name: "Eduardo Méndez", initials: "EM" }, 
          text: "@María López necesito que revises los copies antes de la entrega final.", 
          date: "2026-05-05T14:30:00",
          mentions: [{ id: "user-3", name: "María López" }],
          attachments: []
        },
      ],
      notes: [
        { 
          id: "n1", 
          author: { name: "Diana García", initials: "DG" }, 
          text: "El cliente prefiere tonos más cálidos según la última reunión.", 
          date: "2026-05-03T11:00:00", 
          isPrivate: false,
          attachments: [
            { id: "na1", name: "paleta_colores.png", type: "image", size: "245 KB" }
          ],
          driveLinks: []
        },
        { 
          id: "n2", 
          author: { name: "Eduardo Méndez", initials: "EM" }, 
          text: "Nota interna: presupuesto adicional aprobado para esta tarea.", 
          date: "2026-05-04T09:30:00", 
          isPrivate: true,
          attachments: [],
          driveLinks: [
            { id: "dl1", name: "Presupuesto Aprobado", url: "https://drive.google.com/file/d/abc123" }
          ]
        },
      ],
      notifyOnComplete: [
        { id: "user-2", name: "Eduardo Méndez", initials: "EM" },
        { id: "user-3", name: "María López", initials: "ML" },
      ],
      projectTeam: [
        { id: "user-1", name: "Diana García", initials: "DG", role: "Diseñador Senior" },
        { id: "user-2", name: "Eduardo Méndez", initials: "EM", role: "Estratega Digital" },
        { id: "user-3", name: "María López", initials: "ML", role: "Copywriter" },
        { id: "user-4", name: "Carlos Ruiz", initials: "CR", role: "Desarrollador Web" },
        { id: "user-5", name: "Roberto Sánchez", initials: "RS", role: "Artista 3D" },
      ],
      attachments: [
        { id: "a1", name: "Requerimientos.pdf", type: "pdf", size: "1.2 MB", uploadedBy: "Eduardo Méndez", date: "2026-05-01" },
        { id: "a2", name: "Referencia_visual.png", type: "image", size: "2.4 MB", uploadedBy: tasksDatabase[id].assignee.name, date: "2026-05-05" },
      ],
      timeEntries: [
        { id: "t1", date: "2026-05-02", hours: 1.5, description: "Revisión de requerimientos" },
        { id: "t2", date: "2026-05-05", hours: 2.0, description: "Desarrollo inicial" },
      ],
      history: [
        { id: "h1", action: "Tarea creada", user: "Eduardo Méndez", date: "2026-05-01T10:30:00" },
        { id: "h2", action: `Asignada a ${tasksDatabase[id].assignee.name}`, user: "Eduardo Méndez", date: "2026-05-01T10:35:00" },
        { id: "h3", action: "Estado cambiado a En Proceso", user: tasksDatabase[id].assignee.name, date: "2026-05-02T09:00:00" },
      ],
      relatedTasks: [
        { id: "2", name: "Configurar Meta Ads", status: "por_asignar", assignee: "Eduardo Méndez" },
        { id: "3", name: "Revisar copies landing", status: "revision_interna", assignee: "María López" },
      ],
      tags: [tasksDatabase[id].area, tasksDatabase[id].client, "Proyecto"],
    }
  }
  
  // Fallback for unknown IDs
  return {
    id: id,
    name: `Tarea ${id}`,
    description: "Descripción de la tarea pendiente de definir.",
    project: { id: "proj-001", name: "Proyecto General" },
    client: "Cliente",
    account: "Cuenta",
    status: "nueva",
    priority: "media",
    dueDate: "2026-05-20",
    startDate: "2026-05-01",
    estimatedHours: 4,
    workedHours: 0,
    progress: 0,
    area: "General",
    isClientVisible: false,
    isOverdue: false,
    assignee: { id: "user-1", name: "Diana García", initials: "DG", role: "Diseñador Senior", email: "diana@agencia.com" },
    createdBy: { id: "user-2", name: "Eduardo Méndez", initials: "EM" },
    createdAt: "2026-05-01T10:30:00",
    updatedAt: "2026-05-10T14:20:00",
    subtasks: [],
    comments: [],
    attachments: [],
    timeEntries: [],
    history: [{ id: "h1", action: "Tarea creada", user: "Sistema", date: "2026-05-01T10:30:00" }],
    relatedTasks: [],
    tags: [],
    notes: [] as Array<{ id: string; author: { name: string; initials: string }; text: string; date: string; isPrivate: boolean; attachments: Array<{ id: string; name: string; type: string; size: string }>; driveLinks: Array<{ id: string; name: string; url: string }> }>,
    notifyOnComplete: [],
    projectTeam: [
      { id: "user-1", name: "Diana García", initials: "DG", role: "Diseñador Senior" },
      { id: "user-2", name: "Eduardo Méndez", initials: "EM", role: "Estratega Digital" },
    ],
  }
}

export default function TaskDetailPage() {
  const params = useParams()
  const taskId = params.id as string
  const [activeTab, setActiveTab] = useState("overview")
  const [newComment, setNewComment] = useState("")
  const [isTracking, setIsTracking] = useState(false)
  const [task, setTask] = useState(() => getTaskById(taskId))
  const [commentAttachments, setCommentAttachments] = useState<{id: string; name: string; type: string; size: string}[]>([])
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState("")
  const [newNote, setNewNote] = useState("")
  const [noteIsPrivate, setNoteIsPrivate] = useState(false)
  const [noteAttachments, setNoteAttachments] = useState<{id: string; name: string; type: string; size: string}[]>([])
  const [noteDriveLinks, setNoteDriveLinks] = useState<{id: string; name: string; url: string}[]>([])
  const [showAddDriveLink, setShowAddDriveLink] = useState(false)
  const [newDriveLinkName, setNewDriveLinkName] = useState("")
  const [newDriveLinkUrl, setNewDriveLinkUrl] = useState("")
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editedTask, setEditedTask] = useState({
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    estimatedHours: task.estimatedHours
  })

  const status = taskStatusConfig[task.status] || { label: task.status, color: "bg-gray-500" }
  const priority = priorityConfig[task.priority] || { label: task.priority, color: "bg-gray-400", textColor: "text-gray-600" }

  const completedSubtasks = task.subtasks.filter(s => s.completed).length
  const totalSubtasks = task.subtasks.length

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric"
    })
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("es-MX", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const toggleSubtask = (subtaskId: string) => {
    setTask(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(s => 
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
      )
    }))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/tasksflow/tasks">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Link href="/dashboard/tasksflow/projects" className="hover:underline">Proyectos</Link>
              <span>/</span>
              <Link href={`/dashboard/tasksflow/projects/${task.project.id}`} className="hover:underline">{task.project.name}</Link>
              <span>/</span>
              <span>Tarea</span>
            </div>
            <h1 className="text-2xl font-bold">{task.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={isTracking ? "destructive" : "default"}
            onClick={() => setIsTracking(!isTracking)}
          >
            {isTracking ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isTracking ? "Detener" : "Iniciar Tiempo"}
          </Button>
          <Button variant="outline" onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Quick Info Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Estado:</span>
              <Badge className={`${status.color} text-white`}>{status.label}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Prioridad:</span>
              <Badge variant="outline" className={priority.textColor}>
                <Flag className="h-3 w-3 mr-1" />
                {priority.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Asignado:</span>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">{task.assignee.initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{task.assignee.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Vence: {formatDate(task.dueDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{task.workedHours}h / {task.estimatedHours}h</span>
            </div>
            <div className="flex items-center gap-2">
              {task.isClientVisible ? (
                <Badge variant="outline" className="text-emerald-600">
                  <Eye className="h-3 w-3 mr-1" />
                  Visible Cliente
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  <EyeOff className="h-3 w-3 mr-1" />
                  Interna
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-wrap h-auto gap-2 p-2 bg-muted/50 rounded-xl">
          {/* Link to Project Summary */}
          <Link 
            href={`/dashboard/tasksflow/projects/${task.project.id}`}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
          >
            <LayoutGrid className="h-5 w-5" />
            <span>Resumen</span>
          </Link>
          
          <TabsList className="flex flex-wrap h-auto gap-2 p-0 bg-transparent">
          <TabsTrigger 
            value="overview" 
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-cyan-50 dark:hover:bg-cyan-950 transition-all"
          >
            <ListTodo className="h-5 w-5" />
            <span>Tareas</span>
          </TabsTrigger>
          <TabsTrigger 
            value="subtasks" 
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-blue-50 dark:hover:bg-blue-950 transition-all"
          >
            <CheckSquare className="h-5 w-5" />
            <span>Subtareas</span>
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{completedSubtasks}/{totalSubtasks}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="comments" 
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-all"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Comentarios</span>
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{task.comments.length}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="attachments" 
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg data-[state=active]:bg-violet-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-violet-50 dark:hover:bg-violet-950 transition-all"
          >
            <Paperclip className="h-5 w-5" />
            <span>Archivos</span>
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{task.attachments.length}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="time" 
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-amber-50 dark:hover:bg-amber-950 transition-all"
          >
            <Timer className="h-5 w-5" />
            <span>Tiempo</span>
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg data-[state=active]:bg-slate-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-slate-50 dark:hover:bg-slate-950 transition-all"
          >
            <History className="h-5 w-5" />
            <span>Historial</span>
          </TabsTrigger>
        </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Descripción</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{task.description}</p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                    {task.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <StickyNote className="h-5 w-5" />
                    Notas ({task.notes?.length || 0})
                  </CardTitle>
                  <CardDescription>Notas internas sobre la tarea</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Note */}
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                    <Textarea 
                      placeholder="Escribe una nota..." 
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="min-h-[80px]"
                    />
                    
                    {/* Attachments Preview */}
                    {(noteAttachments.length > 0 || noteDriveLinks.length > 0) && (
                      <div className="flex flex-wrap gap-2">
                        {noteAttachments.map((file) => (
                          <div key={file.id} className="flex items-center gap-2 px-3 py-1.5 bg-background border rounded-full text-sm">
                            <Paperclip className="h-3 w-3 text-muted-foreground" />
                            <span className="max-w-[150px] truncate">{file.name}</span>
                            <button 
                              onClick={() => setNoteAttachments(prev => prev.filter(f => f.id !== file.id))}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        {noteDriveLinks.map((link) => (
                          <div key={link.id} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-full text-sm">
                            <svg className="h-3 w-3" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                            </svg>
                            <span className="max-w-[150px] truncate text-blue-700 dark:text-blue-400">{link.name}</span>
                            <button 
                              onClick={() => setNoteDriveLinks(prev => prev.filter(l => l.id !== link.id))}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Drive Link Form */}
                    {showAddDriveLink && (
                      <div className="p-3 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-400">
                          <svg className="h-4 w-4" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                            <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                          </svg>
                          Agregar enlace de Google Drive
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input 
                            placeholder="Nombre del archivo"
                            value={newDriveLinkName}
                            onChange={(e) => setNewDriveLinkName(e.target.value)}
                          />
                          <Input 
                            placeholder="https://drive.google.com/..."
                            value={newDriveLinkUrl}
                            onChange={(e) => setNewDriveLinkUrl(e.target.value)}
                          />
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setShowAddDriveLink(false)
                              setNewDriveLinkName("")
                              setNewDriveLinkUrl("")
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            size="sm"
                            disabled={!newDriveLinkName.trim() || !newDriveLinkUrl.trim()}
                            onClick={() => {
                              setNoteDriveLinks(prev => [...prev, {
                                id: `dl-${Date.now()}`,
                                name: newDriveLinkName,
                                url: newDriveLinkUrl
                              }])
                              setNewDriveLinkName("")
                              setNewDriveLinkUrl("")
                              setShowAddDriveLink(false)
                            }}
                          >
                            Agregar
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox 
                            checked={noteIsPrivate}
                            onCheckedChange={(checked) => setNoteIsPrivate(checked as boolean)}
                          />
                          <span className="text-muted-foreground">Nota privada</span>
                        </label>
                        <Separator orientation="vertical" className="h-4" />
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2"
                            onClick={() => {
                              const input = document.createElement('input')
                              input.type = 'file'
                              input.multiple = true
                              input.onchange = (e) => {
                                const files = (e.target as HTMLInputElement).files
                                if (files) {
                                  const newFiles = Array.from(files).map(f => ({
                                    id: `f-${Date.now()}-${Math.random()}`,
                                    name: f.name,
                                    type: f.type.split('/')[0] || 'file',
                                    size: `${(f.size / 1024).toFixed(1)} KB`
                                  }))
                                  setNoteAttachments(prev => [...prev, ...newFiles])
                                }
                              }
                              input.click()
                            }}
                          >
                            <Paperclip className="h-4 w-4 mr-1" />
                            Adjuntar
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2"
                            onClick={() => setShowAddDriveLink(true)}
                          >
                            <svg className="h-4 w-4 mr-1" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                            </svg>
                            Drive
                          </Button>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        disabled={!newNote.trim()}
                        onClick={() => {
                          const note = {
                            id: `note-${Date.now()}`,
                            author: { name: "Usuario Actual", initials: "UA" },
                            text: newNote,
                            date: new Date().toISOString(),
                            isPrivate: noteIsPrivate,
                            attachments: noteAttachments,
                            driveLinks: noteDriveLinks
                          }
                          setTask(prev => ({
                            ...prev,
                            notes: [...(prev.notes || []), note]
                          }))
                          setNewNote("")
                          setNoteIsPrivate(false)
                          setNoteAttachments([])
                          setNoteDriveLinks([])
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Nota
                      </Button>
                    </div>
                  </div>

                  {/* Notes List */}
                  <div className="space-y-3">
                    {task.notes?.map((note: any) => (
                      <div key={note.id} className={`p-4 rounded-lg border ${note.isPrivate ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900' : 'bg-muted/30'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[10px]">{note.author.initials}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{note.author.name}</span>
                            {note.isPrivate && (
                              <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                                <EyeOff className="h-3 w-3 mr-1" />
                                Privada
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDateTime(note.date)}</span>
                        </div>
                        <p className="text-sm">{note.text}</p>
                        
                        {/* Note Attachments & Drive Links */}
                        {((note.attachments && note.attachments.length > 0) || (note.driveLinks && note.driveLinks.length > 0)) && (
                          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                            {note.attachments?.map((file: any) => (
                              <a 
                                key={file.id}
                                href="#"
                                className="flex items-center gap-2 px-3 py-1.5 bg-background border rounded-lg text-sm hover:bg-muted/50 transition-colors"
                              >
                                {file.type === 'image' ? (
                                  <FileImage className="h-4 w-4 text-blue-500" />
                                ) : file.type === 'pdf' ? (
                                  <FileText className="h-4 w-4 text-red-500" />
                                ) : (
                                  <File className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="max-w-[150px] truncate">{file.name}</span>
                                <span className="text-xs text-muted-foreground">{file.size}</span>
                                <Download className="h-3 w-3 text-muted-foreground" />
                              </a>
                            ))}
                            {note.driveLinks?.map((link: any) => (
                              <a 
                                key={link.id}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                                  <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                                  <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                                  <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                                  <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                                  <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                                  <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                                </svg>
                                <span className="max-w-[150px] truncate text-blue-700 dark:text-blue-400">{link.name}</span>
                                <ExternalLink className="h-3 w-3 text-blue-500" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Progreso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Completado</span>
                    <span className="text-lg font-bold">{task.progress}%</span>
                  </div>
                  <Progress value={task.progress} className="h-3" />
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">{completedSubtasks}</p>
                      <p className="text-sm text-muted-foreground">Subtareas completadas</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">{totalSubtasks - completedSubtasks}</p>
                      <p className="text-sm text-muted-foreground">Subtareas pendientes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Related Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Link2 className="h-5 w-5" />
                    Tareas Relacionadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {task.relatedTasks.map(relTask => (
                      <div key={relTask.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <ListTodo className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{relTask.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">{relTask.assignee}</span>
                          <Badge className={`${taskStatusConfig[relTask.status]?.color || 'bg-gray-500'} text-white text-xs`}>
                            {taskStatusConfig[relTask.status]?.label || relTask.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Vincular Tarea
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Time Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Timer className="h-5 w-5" />
                    Tiempo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimado</span>
                    <span className="font-medium">{task.estimatedHours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trabajado</span>
                    <span className="font-medium">{task.workedHours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Restante</span>
                    <span className="font-medium text-amber-600">{(task.estimatedHours - task.workedHours).toFixed(1)}h</span>
                  </div>
                  <Progress value={(task.workedHours / task.estimatedHours) * 100} className="h-2" />
                </CardContent>
              </Card>

              {/* Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detalles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Proyecto</span>
                    <Link href={`/dashboard/tasksflow/projects/${task.project.id}`} className="font-medium text-primary hover:underline">
                      {task.project.name}
                    </Link>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cliente</span>
                    <span className="font-medium">{task.client}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Área</span>
                    <Badge variant="outline">{task.area}</Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha inicio</span>
                    <span className="font-medium">{formatDate(task.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha límite</span>
                    <span className="font-medium">{formatDate(task.dueDate)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creada por</span>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[10px]">{task.createdBy.initials}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{task.createdBy.name}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creada</span>
                    <span className="text-sm">{formatDateTime(task.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actualizada</span>
                    <span className="text-sm">{formatDateTime(task.updatedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Subtasks Tab */}
        <TabsContent value="subtasks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Subtareas</CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Subtarea
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {task.subtasks.map(subtask => (
                  <div 
                    key={subtask.id} 
                    className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${subtask.completed ? 'bg-muted/50' : 'hover:bg-muted/30'}`}
                  >
                    <Checkbox 
                      checked={subtask.completed} 
                      onCheckedChange={() => toggleSubtask(subtask.id)}
                    />
                    <span className={subtask.completed ? 'line-through text-muted-foreground' : ''}>
                      {subtask.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments" className="space-y-4">
          {/* Notify on Complete Card */}
          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BellRing className="h-5 w-5 text-amber-600" />
                Notificar al Completar
              </CardTitle>
              <CardDescription>Estas personas recibirán una notificación cuando la tarea se complete</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {task.notifyOnComplete?.map((person: any) => (
                  <Badge key={person.id} variant="secondary" className="flex items-center gap-2 px-3 py-1.5">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px]">{person.initials}</AvatarFallback>
                    </Avatar>
                    {person.name}
                    <button className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Agregar
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2">
                    <div className="space-y-2">
                      <p className="text-sm font-medium px-2 py-1">Equipo del Proyecto</p>
                      {task.projectTeam?.filter((m: any) => !task.notifyOnComplete?.some((n: any) => n.id === m.id)).map((member: any) => (
                        <button
                          key={member.id}
                          className="flex items-center gap-2 w-full px-2 py-2 rounded hover:bg-muted transition-colors text-left"
                        >
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs">{member.initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.role}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          {/* Comments Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Comentarios ({task.comments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comment Input */}
              <div className="flex gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback>DG</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div className="relative">
                    <Textarea 
                      placeholder="Escribe un comentario... Usa @ para mencionar a alguien" 
                      value={newComment}
                      onChange={(e) => {
                        setNewComment(e.target.value)
                        const lastChar = e.target.value.slice(-1)
                        if (lastChar === '@') {
                          setShowMentions(true)
                        }
                      }}
                      className="min-h-[100px]"
                    />
                    {showMentions && (
                      <Card className="absolute bottom-full left-0 mb-2 w-64 z-10 shadow-lg">
                        <CardContent className="p-2">
                          <p className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1">Mencionar a:</p>
                          {task.projectTeam?.map((member: any) => (
                            <button
                              key={member.id}
                              onClick={() => {
                                setNewComment(prev => prev + member.name + ' ')
                                setShowMentions(false)
                              }}
                              className="flex items-center gap-2 w-full px-2 py-2 rounded hover:bg-muted transition-colors text-left"
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[10px]">{member.initials}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{member.name}</p>
                                <p className="text-xs text-muted-foreground">{member.role}</p>
                              </div>
                            </button>
                          ))}
                          <button 
                            onClick={() => setShowMentions(false)}
                            className="w-full text-xs text-muted-foreground mt-2 hover:text-foreground"
                          >
                            Cerrar
                          </button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  
                  {/* Attachments Preview */}
                  {commentAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                      {commentAttachments.map((file) => (
                        <Badge key={file.id} variant="secondary" className="flex items-center gap-2 px-3 py-1.5">
                          {file.type === 'image' ? <FileImage className="h-4 w-4" /> : <File className="h-4 w-4" />}
                          <span className="max-w-32 truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground">{file.size}</span>
                          <button 
                            onClick={() => setCommentAttachments(prev => prev.filter(f => f.id !== file.id))}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowMentions(!showMentions)}
                        className="gap-2"
                      >
                        <AtSign className="h-4 w-4" />
                        Mencionar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          const newFile = { id: `temp-${Date.now()}`, name: 'Archivo_ejemplo.pdf', type: 'pdf', size: '1.2 MB' }
                          setCommentAttachments(prev => [...prev, newFile])
                        }}
                        className="gap-2"
                      >
                        <Paperclip className="h-4 w-4" />
                        Adjuntar
                      </Button>
                    </div>
                    <Button size="sm" disabled={!newComment.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar
                    </Button>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Comments List */}
              <div className="space-y-6">
                {task.comments?.map((comment: any) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback>{comment.author.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{comment.author.name}</span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(comment.date)}</span>
                      </div>
                      <p className="text-sm">
                        {comment.text.split(/(@\w+\s\w+)/g).map((part: string, i: number) => 
                          part.startsWith('@') ? (
                            <span key={i} className="text-primary font-medium bg-primary/10 px-1 rounded">{part}</span>
                          ) : (
                            <span key={i}>{part}</span>
                          )
                        )}
                      </p>
                      
                      {/* Comment Attachments */}
                      {comment.attachments?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {comment.attachments.map((file: any) => (
                            <div key={file.id} className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                              {file.type === 'image' ? (
                                <FileImage className="h-4 w-4 text-blue-500" />
                              ) : (
                                <FileText className="h-4 w-4 text-orange-500" />
                              )}
                              <span className="text-sm font-medium">{file.name}</span>
                              <span className="text-xs text-muted-foreground">{file.size}</span>
                              <Download className="h-3 w-3 text-muted-foreground" />
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Mentions indicator */}
                      {comment.mentions?.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Bell className="h-3 w-3" />
                          Notificó a: {comment.mentions.map((m: any) => m.name).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attachments Tab */}
        <TabsContent value="attachments" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Archivos Adjuntos</CardTitle>
              <Button size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Subir Archivo
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {task.attachments.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{file.size} - Subido por {file.uploadedBy} el {file.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Tab */}
        <TabsContent value="time" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Registro de Tiempo</CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Entrada
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {task.timeEntries.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold">{entry.hours}h</p>
                      </div>
                      <div>
                        <p className="font-medium">{entry.description}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(entry.date)}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{task.workedHours}h</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Historial de Actividad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-6">
                  {task.history.map((event, index) => (
                    <div key={event.id} className="relative flex gap-4 pl-10">
                      <div className="absolute left-2 w-4 h-4 rounded-full bg-background border-2 border-primary" />
                      <div>
                        <p className="font-medium">{event.action}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.user} - {formatDateTime(event.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Task Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Tarea
            </DialogTitle>
            <DialogDescription>
              Modifica los detalles de la tarea. Los cambios se guardarán automáticamente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Título de la Tarea</Label>
              <Input 
                id="edit-title"
                value={editedTask.title}
                onChange={(e) => setEditedTask(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea 
                id="edit-description"
                value={editedTask.description}
                onChange={(e) => setEditedTask(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">Estado</Label>
                <Select 
                  value={editedTask.status} 
                  onValueChange={(value) => setEditedTask(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="in_progress">En Progreso</SelectItem>
                    <SelectItem value="review">En Revisión</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                    <SelectItem value="blocked">Bloqueada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Prioridad</Label>
                <Select 
                  value={editedTask.priority} 
                  onValueChange={(value) => setEditedTask(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-duedate">Fecha de Entrega</Label>
                <Input 
                  id="edit-duedate"
                  type="date"
                  value={editedTask.dueDate.split('T')[0]}
                  onChange={(e) => setEditedTask(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-hours">Horas Estimadas</Label>
                <Input 
                  id="edit-hours"
                  type="number"
                  value={editedTask.estimatedHours}
                  onChange={(e) => setEditedTask(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                setTask(prev => ({
                  ...prev,
                  ...editedTask
                }))
                setShowEditDialog(false)
              }}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
