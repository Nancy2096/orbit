"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { CommentFormatToolbar } from "@/components/orbit-tasksflow/comment-format-toolbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { RichTextEditor } from "@/app/orbit-tasksflow/_components/rich-text-editor"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Calendar,
  User,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Plus,
  MoreHorizontal,
  Edit,
  Save,
  Clock,
  Briefcase,
  FolderKanban,
  MessageCircle,
  Paperclip,
  Send,
  Eye,
  EyeOff,
  Timer,
  ListTodo,
  ListChecks,
  Link2,
  Flag,
  Tag,
  CheckSquare,
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
  ChevronDown,
  ChevronUp,
  Check,
  History,
  Rocket,
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  useCatalog,
  TASK_TYPES_STORAGE_KEY,
  TASK_FORMATS_STORAGE_KEY,
  AREAS_STORAGE_KEY,
  TASK_STATUSES_STORAGE_KEY,
  defaultTaskTypes,
  defaultTaskFormats,
  defaultAreas,
  defaultTaskStatuses,
} from "@/lib/orbit-tasksflow/catalogs"
import { projectsData } from "@/lib/orbit-tasksflow/projects-data"


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
          author: { id: "user-2", name: "Eduardo M����ndez", initials: "EM" }, 
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
    subtasks: [] as Array<{ id: string; name: string; completed: boolean }>,
    comments: [],
    attachments: [],
    timeEntries: [],
    history: [{ id: "h1", action: "Tarea creada", user: "Sistema", date: "2026-05-01T10:30:00" }],
    relatedTasks: [],
    tags: [],
    // Reacciones con emoji: máximo una por usuario.
    reactions: [] as Array<{ userId: string; userName: string; emoji: string }>,
    notes: [] as Array<{ id: string; author: { name: string; initials: string }; text: string; date: string; isPrivate: boolean; attachments: Array<{ id: string; name: string; type: string; size: string; url?: string }>; driveLinks: Array<{ id: string; name: string; url: string }> }>,
    notifyOnComplete: [],
    projectTeam: [
      { id: "user-1", name: "Diana García", initials: "DG", role: "Diseñador Senior" },
      { id: "user-2", name: "Eduardo Méndez", initials: "EM", role: "Estratega Digital" },
    ],
  }
}

export function TaskDetailView({
  taskId: taskIdProp,
  taskName,
  embedded = false,
  onClose,
}: {
  taskId?: string
  taskName?: string
  embedded?: boolean
  onClose?: () => void
} = {}) {
  const params = useParams()
  const taskId = (taskIdProp ?? (params.id as string))
  const [activeTab, setActiveTab] = useState("overview")
  const [newComment, setNewComment] = useState("")
  const [task, setTask] = useState(() => {
    const base = getTaskById(taskId)
    // Si el id no está en la base local, usa el nombre real recibido en lugar de "Tarea <id>".
    return taskName && base.name === `Tarea ${taskId}` ? { ...base, name: taskName } : base
  })
  const { items: taskTypes } = useCatalog(TASK_TYPES_STORAGE_KEY, defaultTaskTypes)
  const { items: taskFormats } = useCatalog(TASK_FORMATS_STORAGE_KEY, defaultTaskFormats)
  const { items: areas } = useCatalog(AREAS_STORAGE_KEY, defaultAreas)
  const { items: taskStatuses } = useCatalog(TASK_STATUSES_STORAGE_KEY, defaultTaskStatuses)

  // Etiqueta/color de un estado: la etiqueta viene del catálogo (editable) y el
  // color del mapa conocido; los estados nuevos usan un color por defecto.
  const getStatusMeta = (key: string) => ({
    label: taskStatuses.find((s) => s.id === key)?.name || taskStatusConfig[key]?.label || key,
    color: taskStatusConfig[key]?.color || "bg-gray-500",
  })
  const [selectedTypeId, setSelectedTypeId] = useState<string>("")
  const [selectedFormatId, setSelectedFormatId] = useState<string>("")
  const [selectedAreaId, setSelectedAreaId] = useState<string>("")
  // Subtareas funcionales
  const [newSubtaskName, setNewSubtaskName] = useState("")
  const [showAddSubtask, setShowAddSubtask] = useState(false)
  // Adjuntos, enlaces de Drive e imágenes embebidas de la Descripción
  const [descriptionDriveLinks, setDescriptionDriveLinks] = useState<{ id: string; name: string; url: string }[]>([])
  const [descriptionImages, setDescriptionImages] = useState<{ id: string; name: string; url: string }[]>([])
  const [descriptionAttachments, setDescriptionAttachments] = useState<{ id: string; name: string; type: string; size: string }[]>([])
  const [showAddDescDriveLink, setShowAddDescDriveLink] = useState(false)
  const [newDescDriveLinkName, setNewDescDriveLinkName] = useState("")
  const [newDescDriveLinkUrl, setNewDescDriveLinkUrl] = useState("")
  const [isDescDragOver, setIsDescDragOver] = useState(false)
  const [isNoteDragOver, setIsNoteDragOver] = useState(false)
  const [workedHoursInput, setWorkedHoursInput] = useState<number>(() => Math.floor(task.workedHours))
  const [workedMinutesInput, setWorkedMinutesInput] = useState<number>(() => Math.round((task.workedHours % 1) * 60))
  const [proposalsCount, setProposalsCount] = useState<number>(0)
  const [adjustmentsCount, setAdjustmentsCount] = useState<number>(0)
  const [deliverablesCount, setDeliverablesCount] = useState<number>(0)
  const [commentAttachments, setCommentAttachments] = useState<{id: string; name: string; type: string; size: string}[]>([])
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState("")
  const [newNote, setNewNote] = useState("")
  const [noteAttachments, setNoteAttachments] = useState<{id: string; name: string; type: string; size: string}[]>([])
  const [noteDriveLinks, setNoteDriveLinks] = useState<{id: string; name: string; url: string}[]>([])
  const [showAddDriveLink, setShowAddDriveLink] = useState(false)
  const [newDriveLinkName, setNewDriveLinkName] = useState("")
  const [newDriveLinkUrl, setNewDriveLinkUrl] = useState("")
  const [deliverables, setDeliverables] = useState<{ id: string; name: string; url: string }[]>([])
  const [showAddDeliverable, setShowAddDeliverable] = useState(false)
  const [newDeliverableName, setNewDeliverableName] = useState("")
  const [newDeliverableUrl, setNewDeliverableUrl] = useState("")
  const [showEditDialog, setShowEditDialog] = useState(false)
  // Edición inline del título (doble clic sobre el texto).
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState("")
  const commitTitle = () => {
    const trimmed = titleDraft.trim()
    if (trimmed && trimmed !== task.name) {
      logActivity(`Título cambiado a "${trimmed}"`)
      setTask(prev => ({ ...prev, name: trimmed }))
    }
    setEditingTitle(false)
  }
  // Panel de comentarios (desplegable) y vista de historial (cambia de "ventana").
  const [showComments, setShowComments] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  // Paneles desplegables de Subtareas y Tareas Relacionadas (debajo del cuadro morado).
  const [showSubtasks, setShowSubtasks] = useState(false)
  const [showRelated, setShowRelated] = useState(false)
  // Refs a los textarea para aplicar el formato de texto desde la barra.
  const commentInputRef = useRef<HTMLTextAreaElement | null>(null)
  const noteInputRef = useRef<HTMLTextAreaElement | null>(null)
  // Tipo de comentario (Propuesta / Ajuste / Entregables): solo se puede elegir uno,
  // y al elegirlo se captura una cantidad manual. Además del tiempo estimado dedicado.
  const [noteType, setNoteType] = useState<string>("")
  const [noteQuantity, setNoteQuantity] = useState<string>("")
  const [noteHours, setNoteHours] = useState<string>("")
  const [noteMinutes, setNoteMinutes] = useState<string>("")
  // Aprobación Interna de la sección de comentarios: registra quién y cuándo aprobó.
  const [internalApproval, setInternalApproval] = useState<{ by: string; at: string } | null>(null)

  const addDeliverable = () => {
    if (!newDeliverableUrl.trim()) return
    const name = newDeliverableName.trim() || "Entregable de Google Drive"
    setDeliverables(prev => [
      ...prev,
      {
        id: `del-${Date.now()}`,
        name,
        url: newDeliverableUrl.trim(),
      },
    ])
    logActivity(`Editable agregado: "${name}"`)
    setNewDeliverableName("")
    setNewDeliverableUrl("")
    setShowAddDeliverable(false)
  }

  const removeDeliverable = (id: string) => {
    setDeliverables(prev => prev.filter(d => d.id !== id))
    logActivity("Editable eliminado")
  }

  const [editedTask, setEditedTask] = useState({
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    estimatedHours: task.estimatedHours
  })

  const status = getStatusMeta(task.status)
  const priority = priorityConfig[task.priority] || { label: task.priority, color: "bg-gray-400", textColor: "text-gray-600" }


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
    setTask(prev => {
      const target = prev.subtasks.find(s => s.id === subtaskId)
      const action = target
        ? `Subtarea "${target.name}" marcada como ${target.completed ? "pendiente" : "completada"}`
        : "Subtarea actualizada"
      return {
        ...prev,
        subtasks: prev.subtasks.map(s =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        ),
        history: [
          ...prev.history,
          { id: `h-${Date.now()}`, action, user: currentUser.name, date: new Date().toISOString() },
        ],
      }
    })
  }

  const addSubtask = () => {
    const name = newSubtaskName.trim()
    if (!name) return
    setTask(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, { id: `sub-${Date.now()}`, name, completed: false }],
      history: [
        ...prev.history,
        { id: `h-${Date.now()}`, action: `Subtarea agregada: "${name}"`, user: currentUser.name, date: new Date().toISOString() },
      ],
    }))
    setNewSubtaskName("")
    setShowAddSubtask(false)
  }

  const deleteSubtask = (subtaskId: string) => {
    setTask(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(s => s.id !== subtaskId),
    }))
    logActivity("Subtarea eliminada")
  }

  const deleteComment = (commentId: string) => {
    setTask(prev => ({
      ...prev,
      comments: prev.comments.filter((c: any) => c.id !== commentId)
    }))
    logActivity("Comentario eliminado")
  }

  // Lee archivos de imagen soltados y devuelve promesas con data URL para mostrarlos embebidos.
  const readImageFiles = (files: FileList | File[]): Promise<{ id: string; name: string; url: string }[]> => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/"))
    return Promise.all(
      imageFiles.map(
        (file, i) =>
          new Promise<{ id: string; name: string; url: string }>((resolve) => {
            const reader = new FileReader()
            reader.onload = () =>
              resolve({ id: `img-${Date.now()}-${i}`, name: file.name, url: reader.result as string })
            reader.readAsDataURL(file)
          }),
      ),
    )
  }

  const handleDescriptionDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDescDragOver(false)
    if (!e.dataTransfer.files?.length) return
    const images = await readImageFiles(e.dataTransfer.files)
    if (images.length === 0) return
    setDescriptionImages(prev => [...prev, ...images])
    logActivity(`Imagen agregada a la descripción (${images.length})`)
  }

  const handleNoteDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsNoteDragOver(false)
    if (!e.dataTransfer.files?.length) return
    const images = await readImageFiles(e.dataTransfer.files)
    if (images.length === 0) return
    setNoteAttachments(prev => [
      ...prev,
      ...images.map(img => ({ id: img.id, name: img.name, type: "image", size: "", url: img.url })),
    ])
  }

  // --- Descripción editable con registro de guardado ---
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [descriptionDraft, setDescriptionDraft] = useState(task.description)
  const [descriptionUpdatedAt, setDescriptionUpdatedAt] = useState<string | null>(null)

  const saveDescription = () => {
    setTask(prev => ({ ...prev, description: descriptionDraft }))
    setDescriptionUpdatedAt(new Date().toISOString())
    setIsEditingDescription(false)
    logActivity("Descripción actualizada")
  }

  const cancelEditDescription = () => {
    setDescriptionDraft(task.description)
    setIsEditingDescription(false)
  }

  // --- Vincular tareas de cualquier cuenta ---
  const [showLinkTaskDialog, setShowLinkTaskDialog] = useState(false)
  const [linkTaskSearch, setLinkTaskSearch] = useState("")

  // Mapea los estados del catálogo de proyectos a las claves de taskStatusConfig.
  const projectStatusMap: Record<string, string> = {
    en_progreso: "en_proceso",
    pendiente: "por_asignar",
    vencido: "vencida",
    completado: "entregada",
  }

  // Todas las tareas de todas las cuentas, aptas para vincular.
  const linkableTasks = projectsData.flatMap(project =>
    project.tasks.map(t => ({
      id: t.id,
      name: t.title,
      status: projectStatusMap[t.status] || t.status,
      assignee: t.assigneeName,
      account: project.account,
      projectName: project.name,
    }))
  )

  const linkTask = (t: { id: string; name: string; status: string; assignee: string }) => {
    setTask(prev => {
      if (prev.relatedTasks.some((r: any) => r.id === t.id)) return prev
      return {
        ...prev,
        relatedTasks: [...prev.relatedTasks, t],
        history: [
          ...prev.history,
          { id: `h-${Date.now()}`, action: `Tarea vinculada: "${t.name}"`, user: currentUser.name, date: new Date().toISOString() },
        ],
      }
    })
    setShowLinkTaskDialog(false)
    setLinkTaskSearch("")
  }

  const unlinkTask = (id: string) => {
    setTask(prev => {
      const target = prev.relatedTasks.find((r: any) => r.id === id)
      return {
        ...prev,
        relatedTasks: prev.relatedTasks.filter((r: any) => r.id !== id),
        history: [
          ...prev.history,
          { id: `h-${Date.now()}`, action: `Tarea desvinculada${target ? `: "${target.name}"` : ""}`, user: currentUser.name, date: new Date().toISOString() },
        ],
      }
    })
  }

  const filteredLinkableTasks = linkableTasks.filter(t => {
    const alreadyLinked = task.relatedTasks.some((r: any) => r.id === t.id)
    const isSelf = t.id === task.id
    const term = linkTaskSearch.toLowerCase()
    const matches =
      t.name.toLowerCase().includes(term) ||
      t.account.toLowerCase().includes(term) ||
      t.assignee.toLowerCase().includes(term)
    return !alreadyLinked && !isSelf && matches
  })

  // --- Comentarios funcionales ---
  const currentUser = { id: "user-1", name: "Diana García", initials: "DG" }
  const reactionEmojis = ["👍", "🎉", "❤️", "🔥", "👏", "🚀", "😍", "✅"]
  const myReaction = (task.reactions ?? []).find(r => r.userId === currentUser.id)?.emoji

  // Agrupa las reacciones por emoji con su conteo y quiénes reaccionaron.
  const groupedReactions = Object.values(
    (task.reactions ?? []).reduce((acc, r) => {
      if (!acc[r.emoji]) acc[r.emoji] = { emoji: r.emoji, count: 0, users: [] as string[] }
      acc[r.emoji].count += 1
      acc[r.emoji].users.push(r.userName)
      return acc
    }, {} as Record<string, { emoji: string; count: number; users: string[] }>),
  )

  // Registra en el historial de actividad cualquier ajuste hecho en la tarea.
  const logActivity = (action: string) => {
    setTask(prev => ({
      ...prev,
      history: [
        ...prev.history,
        { id: `h-${Date.now()}`, action, user: currentUser.name, date: new Date().toISOString() },
      ],
    }))
  }

  // Reacción con emoji: un usuario puede tener solo un emoji activo a la vez.
  // Volver a elegir el mismo emoji lo quita; elegir otro lo reemplaza.
  const toggleReaction = (emoji: string) => {
    setTask(prev => {
      const reactions = prev.reactions ?? []
      const existing = reactions.find(r => r.userId === currentUser.id)
      let next: typeof reactions
      if (existing && existing.emoji === emoji) {
        next = reactions.filter(r => r.userId !== currentUser.id)
      } else {
        next = [
          ...reactions.filter(r => r.userId !== currentUser.id),
          { userId: currentUser.id, userName: currentUser.name, emoji },
        ]
      }
      return { ...prev, reactions: next }
    })
  }

  const addComment = () => {
    if (!newComment.trim()) return
    // Detecta menciones a partir de los nombres del equipo presentes en el texto.
    const mentions = (task.projectTeam || [])
      .filter((m: any) => newComment.includes(m.name))
      .map((m: any) => ({ id: m.id, name: m.name }))
    const comment = {
      id: `c-${Date.now()}`,
      author: currentUser,
      text: newComment.trim(),
      date: new Date().toISOString(),
      mentions,
      attachments: commentAttachments,
    }
    setTask(prev => ({ ...prev, comments: [...(prev.comments || []), comment] }))
    logActivity("Comentario agregado")
    setNewComment("")
    setCommentAttachments([])
    setShowMentions(false)
  }

  // --- Asignación múltiple ---
  // Lista actual de asignados (compatibiliza el modelo antiguo de un solo `assignee`).
  const assignees: any[] = (task as any).assignees ?? (task.assignee ? [task.assignee] : [])

  const toggleAssignee = (member: any) => {
    setTask(prev => {
      const current: any[] = (prev as any).assignees ?? (prev.assignee ? [prev.assignee] : [])
      const exists = current.some((a: any) => a.id === member.id)
      const next = exists ? current.filter((a: any) => a.id !== member.id) : [...current, member]
      return {
        ...prev,
        assignees: next,
        // Mantiene `assignee` en sincronía (primer asignado) por compatibilidad.
        assignee: next[0] ?? prev.assignee,
        history: [
          ...prev.history,
          {
            id: `h-${Date.now()}`,
            action: exists ? `Desasignada a ${member.name}` : `Asignada a ${member.name}`,
            user: currentUser.name,
            date: new Date().toISOString(),
          },
        ],
      }
    })
  }

  // --- Notificar al completar (varias personas) ---
  const addNotifyPerson = (member: any) => {
    setTask(prev => {
      if ((prev.notifyOnComplete ?? []).some((n: any) => n.id === member.id)) return prev
      return {
        ...prev,
        notifyOnComplete: [
          ...(prev.notifyOnComplete ?? []),
          { id: member.id, name: member.name, initials: member.initials },
        ],
      }
    })
    logActivity(`Se notificará a ${member.name} al completar`)
  }

  const removeNotifyPerson = (id: string) => {
    setTask(prev => ({
      ...prev,
      notifyOnComplete: (prev.notifyOnComplete ?? []).filter((n: any) => n.id !== id),
    }))
  }

  // --- Subtareas: asignado y fecha de entrega ---
  const setSubtaskAssignee = (subtaskId: string, member: any) => {
    setTask(prev => ({
      ...prev,
      subtasks: prev.subtasks.map((s: any) =>
        s.id === subtaskId
          ? { ...s, assignee: { id: member.id, name: member.name, initials: member.initials } }
          : s
      ),
    }))
    logActivity(`Subtarea asignada a ${member.name}`)
  }

  const setSubtaskDueDate = (subtaskId: string, dueDate: string) => {
    setTask(prev => ({
      ...prev,
      subtasks: prev.subtasks.map((s: any) =>
        s.id === subtaskId ? { ...s, dueDate } : s
      ),
    }))
    logActivity(`Fecha de entrega de subtarea: ${formatDate(dueDate)}`)
  }

  return (
    <div
      className={embedded ? "p-4 space-y-6" : "p-6 space-y-6"}
      style={
        {
          // Acento morado local: vuelve morados los botones de acción (primary)
          // y los estados hover (accent) sin alterar el tema global del resto de Orbit.
          "--primary": "oklch(0.55 0.22 293)",
          "--primary-foreground": "oklch(0.985 0 0)",
          "--ring": "oklch(0.55 0.22 293)",
          "--accent": "oklch(0.96 0.03 293)",
          "--accent-foreground": "oklch(0.45 0.2 293)",
        } as React.CSSProperties
      }
    >
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 p-5 text-white shadow-lg">
        {/* Halo decorativo */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-fuchsia-400/20 blur-2xl" aria-hidden="true" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            {embedded ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Cerrar detalle"
                className="shrink-0 text-white hover:bg-white/15 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="shrink-0 text-white hover:bg-white/15 hover:text-white"
              >
                <Link href="/orbit-tasksflow/tasks">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
            )}
            <div className="min-w-0 flex items-center gap-3">
              <span className={`h-3 w-3 shrink-0 rounded-full ring-4 ring-white/20 ${status.color}`} aria-hidden="true" />
              {editingTitle ? (
                <input
                  autoFocus
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={commitTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                      e.preventDefault()
                      commitTitle()
                    } else if (e.key === "Escape") {
                      setEditingTitle(false)
                    }
                  }}
                  className="min-w-0 flex-1 rounded-md border border-white/40 bg-white/15 px-2 py-1 text-2xl font-bold leading-tight text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/60"
                  aria-label="Editar título de la tarea"
                />
              ) : (
                <h1
                  className="text-2xl font-bold leading-tight text-balance cursor-text rounded-md px-1 -mx-1 hover:bg-white/10 transition-colors"
                  onDoubleClick={() => {
                    setTitleDraft(task.name)
                    setEditingTitle(true)
                  }}
                  title="Doble clic para editar"
                >
                  {task.name}
                </h1>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Más acciones"
                  className="text-white hover:bg-white/15 hover:text-white"
                >
                  <Rocket className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Reaccionar</DropdownMenuLabel>
                <div className="grid grid-cols-4 gap-1 p-1">
                  {reactionEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => toggleReaction(emoji)}
                      aria-label={`Reaccionar con ${emoji}`}
                      aria-pressed={myReaction === emoji}
                      className={`flex h-9 items-center justify-center rounded-md text-xl transition-colors hover:bg-accent ${
                        myReaction === emoji ? "bg-accent ring-2 ring-primary" : ""
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                {myReaction && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => toggleReaction(myReaction)}>
                      <X className="h-4 w-4 mr-2" />
                      Quitar mi reacción
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Metadatos: Estado · Creada por/cuándo · Prioridad */}
        <div className="relative mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          {/* Estado */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Estado</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="focus:outline-none">
                  <Badge className={`${status.color} text-white cursor-pointer hover:opacity-90 transition-opacity`}>
                    {status.label}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Badge>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
                {taskStatuses.map((s) => {
                  const meta = getStatusMeta(s.id)
                  return (
                    <DropdownMenuItem
                      key={s.id}
                      onSelect={() => {
                        if (task.status !== s.id) logActivity(`Estado cambiado a ${meta.label}`)
                        setTask(prev => ({ ...prev, status: s.id }))
                      }}
                      className={task.status === s.id ? "bg-muted" : ""}
                    >
                      <span className={`w-2 h-2 rounded-full mr-2 ${meta.color}`} />
                      {meta.label}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Creada por y cuándo */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Creada por</span>
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5 shrink-0">
                <AvatarFallback className="text-[10px] text-purple-700">{task.createdBy.initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-white">{task.createdBy.name}</span>
              <span className="text-sm text-white/70">· {formatDateTime(task.createdAt)}</span>
            </div>
          </div>

          {/* Prioridad */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Prioridad</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="focus:outline-none">
                  <Badge className={`bg-white ${priority.textColor} cursor-pointer hover:bg-white/90 transition-colors`}>
                    <Flag className="h-3 w-3 mr-1" />
                    {priority.label}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Badge>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
                {Object.entries(priorityConfig).map(([key, cfg]) => (
                  <DropdownMenuItem
                    key={key}
                    onSelect={() => {
                      if (task.priority !== key) logActivity(`Prioridad cambiada a ${cfg.label}`)
                      setTask(prev => ({ ...prev, priority: key }))
                    }}
                    className={task.priority === key ? "bg-muted" : ""}
                  >
                    <span className={`w-2 h-2 rounded-full mr-2 ${cfg.color}`} />
                    {cfg.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Reacciones sobre la tarea */}
        {groupedReactions.length > 0 && (
          <div className="relative mt-4 flex flex-wrap items-center gap-2">
            {groupedReactions.map((r) => {
              const mine = myReaction === r.emoji
              return (
                <button
                  key={r.emoji}
                  type="button"
                  onClick={() => toggleReaction(r.emoji)}
                  title={r.users.join(", ")}
                  aria-pressed={mine}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm backdrop-blur transition-colors ${
                    mine
                      ? "border-white bg-white/25 text-white"
                      : "border-white/30 bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <span className="text-base leading-none">{r.emoji}</span>
                  <span className="font-semibold tabular-nums">{r.count}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Info Bar */}
      <Card className="shadow-sm border-b-2 border-b-purple-500">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
            {/* Columna izquierda */}
            <div className="space-y-5">
            {/* Asignado (varias personas) */}
            <div className="flex flex-col items-start gap-1.5">
              <span className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                <Users className="h-4 w-4" />
                Asignado
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {assignees.map((person: any) => (
                  <span key={person.id} className="group/chip flex items-center gap-1.5 text-sm font-medium">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[9px]">{person.initials}</AvatarFallback>
                    </Avatar>
                    {person.name}
                    <button
                      className="text-muted-foreground opacity-0 transition-opacity group-hover/chip:opacity-100 hover:text-destructive"
                      aria-label={`Quitar a ${person.name}`}
                      onClick={() => toggleAssignee(person)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Agregar
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="space-y-1">
                      <p className="text-sm font-medium px-2 py-1">Equipo del Proyecto</p>
                      {task.projectTeam?.map((member: any) => {
                        const selected = assignees.some((a: any) => a.id === member.id)
                        return (
                          <button
                            key={member.id}
                            onClick={() => toggleAssignee(member)}
                            className={`flex items-center gap-2 w-full px-2 py-2 rounded hover:bg-muted transition-colors text-left ${selected ? "bg-muted" : ""}`}
                          >
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs">{member.initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{member.name}</p>
                              <p className="text-xs text-muted-foreground">{member.role}</p>
                            </div>
                            {selected && <X className="h-3.5 w-3.5 text-muted-foreground" />}
                          </button>
                        )
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Vencimiento */}
            <div className="flex flex-col items-start gap-1.5">
              <span className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                <Calendar className="h-4 w-4" />
                Vencimiento
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-md -ml-1.5 px-1.5 py-1 text-sm font-medium hover:bg-muted transition-colors focus:outline-none"
                  >
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    {formatDate(task.dueDate)}
                    <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker
                    mode="single"
                    selected={task.dueDate ? new Date(`${task.dueDate}T00:00:00`) : undefined}
                    onSelect={(date) => {
                      if (!date) return
                      const y = date.getFullYear()
                      const m = String(date.getMonth() + 1).padStart(2, "0")
                      const d = String(date.getDate()).padStart(2, "0")
                      const next = `${y}-${m}-${d}`
                      if (task.dueDate !== next) logActivity(`Fecha límite cambiada a ${formatDate(next)}`)
                      setTask(prev => ({ ...prev, dueDate: next }))
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Notificar al completar */}
            <div className="flex flex-col items-start gap-1.5">
              <span className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                <BellRing className="h-4 w-4 text-amber-600" />
                Notificar al completar
              </span>
              <div className="flex items-center flex-wrap gap-1.5">
                {task.notifyOnComplete?.map((person: any) => (
                  <span key={person.id} className="group/chip flex items-center gap-1.5 text-sm font-medium">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[9px]">{person.initials}</AvatarFallback>
                    </Avatar>
                    {person.name}
                    <button
                      className="text-muted-foreground opacity-0 transition-opacity group-hover/chip:opacity-100 hover:text-destructive"
                      aria-label={`Quitar a ${person.name}`}
                      onClick={() => removeNotifyPerson(person.id)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Agregar
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="space-y-1">
                      <p className="text-sm font-medium px-2 py-1">Equipo del Proyecto</p>
                      {task.projectTeam?.filter((m: any) => !task.notifyOnComplete?.some((n: any) => n.id === m.id)).map((member: any) => (
                        <button
                          key={member.id}
                          onClick={() => addNotifyPerson(member)}
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
            </div>

            {/* Notas */}
            <button
              type="button"
              className={`flex w-full items-center gap-1.5 rounded-md -mx-1 px-1 py-0.5 text-sm font-bold transition-colors hover:bg-muted focus:outline-none ${showComments && !showHistory ? "text-primary" : "text-foreground"}`}
              onClick={() => {
                setShowHistory(false)
                setShowComments(v => !v)
              }}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="flex-1 text-left">Notas</span>
              {showComments && !showHistory ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            </div>

            {/* Columna derecha */}
            <div className="space-y-5 md:border-l md:border-border md:pl-8">
              {/* Visibilidad */}
              <div className="flex flex-col items-start gap-1.5">
                <span className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                  {task.isClientVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  Visibilidad
                </span>
                <span className={`text-sm font-medium ${task.isClientVisible ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {task.isClientVisible ? "Visible Cliente" : "Interna"}
                </span>
              </div>

              {/* Acciones: Tareas Relacionadas e Historial */}
              <div className="flex flex-col items-stretch gap-3">
                <button
                  type="button"
                  className={`flex w-full items-center gap-1.5 rounded-md -mx-1 px-1 py-0.5 text-sm font-bold transition-colors hover:bg-muted focus:outline-none ${showRelated ? "text-primary" : "text-foreground"}`}
                  onClick={() => setShowRelated(v => !v)}
                >
                  <Link2 className="h-4 w-4" />
                  <span className="flex-1 text-left">Tareas Relacionadas</span>
                  {showRelated ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                <button
                  type="button"
                  className={`flex w-full items-center gap-1.5 rounded-md -mx-1 px-1 py-0.5 text-sm font-bold transition-colors hover:bg-muted focus:outline-none ${showHistory ? "text-primary" : "text-foreground"}`}
                  onClick={() => setShowHistory(v => !v)}
                >
                  <History className="h-4 w-4" />
                  <span className="flex-1 text-left">Historial</span>
                  {showHistory ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Panel de Comentarios (desplegable, respeta los dos cuadros de arriba) */}
      {showComments && !showHistory && (
        <Card className="border-b-2 border-b-purple-500 animate-in fade-in slide-in-from-top-2 duration-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Notas ({task.comments?.length || 0})
            </CardTitle>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setShowComments(false)}>
              <ChevronUp className="h-4 w-4" />
              Ocultar
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Comment Input */}
            <div className="flex gap-3">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback>DG</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <div className="relative">
                  <CommentFormatToolbar
                    value={newComment}
                    onValueChange={setNewComment}
                    textareaRef={commentInputRef}
                  />
                  <Textarea
                    ref={commentInputRef}
                    placeholder="Escribe una nota... Usa @ para mencionar a alguien"
                    value={newComment}
                    onChange={(e) => {
                      setNewComment(e.target.value)
                      const lastChar = e.target.value.slice(-1)
                      if (lastChar === '@') {
                        setShowMentions(true)
                      }
                    }}
                    className="min-h-[100px] rounded-t-none"
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
                  <Button size="sm" disabled={!newComment.trim()} onClick={addComment}>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Comments List */}
            <div className="space-y-6">
              {task.comments?.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Aún no hay notas.</p>
              )}
              {task.comments?.map((comment: any) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback>{comment.author.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{comment.author.name}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(comment.date)}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => deleteComment(comment.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar nota
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
      )}

      {/* Vista de Historial (cambia de ventana, respeta los dos cuadros de arriba) */}
      {showHistory && (
        <Card className="border-b-2 border-b-purple-500 animate-in fade-in duration-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial de Actividad
            </CardTitle>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowHistory(false)}>
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </CardHeader>
          <CardContent>
            {task.history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Sin actividad registrada.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-6">
                  {[...task.history].reverse().map((event) => (
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
            )}
          </CardContent>
        </Card>
      )}

      {/* Panel desplegable: Subtareas (debajo del cuadro morado) */}
      {showSubtasks && (
        <Card className="border-b-2 border-b-purple-500 animate-in fade-in slide-in-from-top-2 duration-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <ListChecks className="h-5 w-5" />
                Subtareas
              </CardTitle>
              <CardDescription>
                {task.subtasks.filter(s => s.completed).length} de {task.subtasks.length} completadas
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowAddSubtask(prev => !prev)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Subtarea
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {showAddSubtask && (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                <Input
                  autoFocus
                  placeholder="Nombre de la subtarea..."
                  value={newSubtaskName}
                  onChange={(e) => setNewSubtaskName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                      e.preventDefault()
                      addSubtask()
                    } else if (e.key === "Escape") {
                      setShowAddSubtask(false)
                      setNewSubtaskName("")
                    }
                  }}
                />
                <Button size="sm" onClick={addSubtask} disabled={!newSubtaskName.trim()}>
                  Agregar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setShowAddSubtask(false); setNewSubtaskName("") }}>
                  Cancelar
                </Button>
              </div>
            )}

            {task.subtasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay subtareas todavía. Agrega la primera.
              </p>
            ) : (
              <ol className="space-y-2">
                {task.subtasks.map((subtask, index) => (
                  <li
                    key={subtask.id}
                    className={`group flex items-center gap-3 p-3 border rounded-lg transition-colors ${subtask.completed ? 'bg-muted/50' : 'hover:bg-muted/30'}`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                    <Checkbox
                      checked={subtask.completed}
                      onCheckedChange={() => toggleSubtask(subtask.id)}
                      aria-label={`Marcar "${subtask.name}" como ${subtask.completed ? 'pendiente' : 'completada'}`}
                    />
                    <span className={`flex-1 text-sm ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {subtask.name}
                    </span>

                    {/* Asignado de la subtarea */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs hover:bg-muted transition-colors focus:outline-none shrink-0"
                          aria-label={`Asignar subtarea "${subtask.name}"`}
                        >
                          {subtask.assignee ? (
                            <>
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[9px]">{subtask.assignee.initials}</AvatarFallback>
                              </Avatar>
                              <span className="hidden sm:inline max-w-[90px] truncate">{subtask.assignee.name}</span>
                            </>
                          ) : (
                            <>
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="hidden sm:inline text-muted-foreground">Asignar</span>
                            </>
                          )}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2" align="end">
                        <div className="space-y-1">
                          <p className="text-sm font-medium px-2 py-1">Asignar a</p>
                          {task.projectTeam?.map((member: any) => (
                            <button
                              key={member.id}
                              onClick={() => setSubtaskAssignee(subtask.id, member)}
                              className={`flex items-center gap-2 w-full px-2 py-2 rounded hover:bg-muted transition-colors text-left ${subtask.assignee?.id === member.id ? "bg-muted" : ""}`}
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">{member.initials}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{member.name}</span>
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Fecha de entrega de la subtarea */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs hover:bg-muted transition-colors focus:outline-none shrink-0"
                          aria-label={`Fecha de entrega de "${subtask.name}"`}
                        >
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className={subtask.dueDate ? "" : "text-muted-foreground hidden sm:inline"}>
                            {subtask.dueDate ? formatDate(subtask.dueDate) : "Fecha"}
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <CalendarPicker
                          mode="single"
                          selected={subtask.dueDate ? new Date(`${subtask.dueDate}T00:00:00`) : undefined}
                          onSelect={(date) => {
                            if (!date) return
                            const y = date.getFullYear()
                            const m = String(date.getMonth() + 1).padStart(2, "0")
                            const d = String(date.getDate()).padStart(2, "0")
                            setSubtaskDueDate(subtask.id, `${y}-${m}-${d}`)
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive shrink-0"
                      onClick={() => deleteSubtask(subtask.id)}
                      aria-label={`Eliminar ${subtask.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      )}

      {/* Panel desplegable: Tareas Relacionadas (debajo del cuadro morado) */}
      {showRelated && (
        <Card className="border-b-2 border-b-purple-500 animate-in fade-in slide-in-from-top-2 duration-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Tareas Relacionadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {task.relatedTasks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay tareas vinculadas todavía.
                </p>
              )}
              {task.relatedTasks.map((relTask: any) => (
                <div key={relTask.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <ListTodo className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <span className="font-medium block truncate">{relTask.name}</span>
                      {relTask.account && (
                        <span className="text-xs text-muted-foreground">{relTask.account}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm text-muted-foreground hidden sm:inline">{relTask.assignee}</span>
                    <Badge className={`${getStatusMeta(relTask.status).color} text-white text-xs`}>
                      {getStatusMeta(relTask.status).label}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => unlinkTask(relTask.id)}
                      aria-label="Desvincular tarea"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setShowLinkTaskDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Vincular Tarea
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      {!showHistory && (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="space-y-6">
            {/* Detalles + Tiempo y Tareas (2 columnas, arriba de Descripción) */}
            <div className="grid gap-6 md:grid-cols-2 items-start">
              {/* Details */}
              <Card className="border-b-2 border-b-purple-500">
                <CardHeader>
                  <CardTitle className="text-lg">Detalles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground shrink-0">Tipo</span>
                    <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                      <SelectTrigger className="h-8 w-[150px] max-w-[60%]">
                        <SelectValue placeholder="Selecciona tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {taskTypes.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground shrink-0">Formato</span>
                    <Select value={selectedFormatId} onValueChange={setSelectedFormatId}>
                      <SelectTrigger className="h-8 w-[150px] max-w-[60%]">
                        <SelectValue placeholder="Selecciona formato" />
                      </SelectTrigger>
                      <SelectContent>
                        {taskFormats.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground shrink-0">Área</span>
                    <Select
                      value={selectedAreaId}
                      onValueChange={(value) => {
                        setSelectedAreaId(value)
                        const name = areas.find(a => a.id === value)?.name
                        if (name) {
                          setTask(prev => ({ ...prev, area: name }))
                          logActivity(`Área cambiada a ${name}`)
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 w-[150px] max-w-[60%]">
                        <SelectValue placeholder={task.area}>
                          {areas.find(a => a.id === selectedAreaId)?.name ?? task.area}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {areas.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Time & Tasks Summary */}
              <Card className="border-b-2 border-b-purple-500">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Timer className="h-5 w-5" />
                    Tiempo y Tareas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Trabajado</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          min={0}
                          value={workedHoursInput}
                          onChange={(e) => setWorkedHoursInput(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-20"
                          aria-label="Horas trabajadas"
                        />
                        <span className="text-sm text-muted-foreground">h</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          min={0}
                          max={59}
                          value={workedMinutesInput}
                          onChange={(e) => setWorkedMinutesInput(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="w-20"
                          aria-label="Minutos trabajados"
                        />
                        <span className="text-sm text-muted-foreground">min</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="proposals-count" className="text-muted-foreground">Propuestas</Label>
                      <Input
                        id="proposals-count"
                        type="number"
                        min={0}
                        value={proposalsCount}
                        onChange={(e) => setProposalsCount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-24"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="adjustments-count" className="text-muted-foreground">Ajustes</Label>
                      <Input
                        id="adjustments-count"
                        type="number"
                        min={0}
                        value={adjustmentsCount}
                        onChange={(e) => setAdjustmentsCount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-24"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="deliverables-count" className="text-muted-foreground">Entregables</Label>
                      <Input
                        id="deliverables-count"
                        type="number"
                        min={0}
                        value={deliverablesCount}
                        onChange={(e) => setDeliverablesCount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-24"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
              <Card className="border-b-2 border-b-purple-500">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Descripción</CardTitle>
                  {descriptionUpdatedAt && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Última edición: {formatDateTime(descriptionUpdatedAt)}
                    </p>
                  )}
                </CardHeader>
                <CardContent
                  onDragOver={(e) => { e.preventDefault(); setIsDescDragOver(true) }}
                  onDragLeave={() => setIsDescDragOver(false)}
                  onDrop={handleDescriptionDrop}
                >
                  <RichTextEditor
                    value={task.description || ""}
                    onChange={(html) => {
                      setTask((prev: any) => ({ ...prev, description: html }))
                      setDescriptionUpdatedAt(new Date().toISOString())
                    }}
                    placeholder="Escribe una descripción o arrastra una imagen aquí…"
                  />

                  {/* Imágenes embebidas (arrastra imágenes aquí) */}
                  {descriptionImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                      {descriptionImages.map((img) => (
                        <div key={img.id} className="group relative overflow-hidden rounded-lg border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url || "/placeholder.svg"} alt={img.name} className="h-32 w-full object-cover" />
                          <button
                            onClick={() => setDescriptionImages(prev => prev.filter(i => i.id !== img.id))}
                            className="absolute top-1.5 right-1.5 rounded-full bg-background/80 p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                            aria-label={`Quitar ${img.name}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Archivos adjuntos de la descripción */}
                  {descriptionAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {descriptionAttachments.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-muted border rounded-lg text-sm"
                        >
                          <Paperclip className="h-3 w-3 text-muted-foreground" />
                          <span className="max-w-[150px] truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground">{file.size}</span>
                          <button
                            onClick={() => setDescriptionAttachments(prev => prev.filter(f => f.id !== file.id))}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label={`Quitar ${file.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Enlaces de Google Drive de la descripción */}
                  {descriptionDriveLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {descriptionDriveLinks.map((link) => (
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
                          <button
                            onClick={(e) => { e.preventDefault(); setDescriptionDriveLinks(prev => prev.filter(l => l.id !== link.id)) }}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label={`Quitar ${link.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Formulario para enlace de Drive */}
                  {showAddDescDriveLink && (
                    <div className="p-3 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20 space-y-3 mt-4">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Nombre del archivo"
                          value={newDescDriveLinkName}
                          onChange={(e) => setNewDescDriveLinkName(e.target.value)}
                        />
                        <Input
                          placeholder="https://drive.google.com/..."
                          value={newDescDriveLinkUrl}
                          onChange={(e) => setNewDescDriveLinkUrl(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setShowAddDescDriveLink(false); setNewDescDriveLinkName(""); setNewDescDriveLinkUrl("") }}>
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          disabled={!newDescDriveLinkName.trim() || !newDescDriveLinkUrl.trim()}
                          onClick={() => {
                            setDescriptionDriveLinks(prev => [...prev, { id: `ddl-${Date.now()}`, name: newDescDriveLinkName, url: newDescDriveLinkUrl }])
                            setNewDescDriveLinkName("")
                            setNewDescDriveLinkUrl("")
                            setShowAddDescDriveLink(false)
                          }}
                        >
                          Agregar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Barra de acciones + zona de arrastre */}
                  <div className={`flex flex-wrap items-center gap-1 mt-4 pt-4 border-t ${isDescDragOver ? "rounded-lg ring-2 ring-primary ring-offset-2" : ""}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 px-2 ${showSubtasks ? "text-primary" : ""}`}
                      onClick={() => setShowSubtasks(v => !v)}
                    >
                      <ListChecks className="h-4 w-4 mr-1" />
                      Subtareas
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => {
                        const input = document.createElement("input")
                        input.type = "file"
                        input.multiple = true
                        input.onchange = (e) => {
                          const files = (e.target as HTMLInputElement).files
                          if (files && files.length) {
                            const newFiles = Array.from(files).map(f => ({
                              id: `da-${Date.now()}-${Math.random()}`,
                              name: f.name,
                              type: f.type.split('/')[0] || 'file',
                              size: `${(f.size / 1024).toFixed(1)} KB`,
                            }))
                            setDescriptionAttachments(prev => [...prev, ...newFiles])
                            logActivity(`Archivo adjuntado a la descripción (${newFiles.length})`)
                          }
                        }
                        input.click()
                      }}
                    >
                      <Paperclip className="h-4 w-4 mr-1" />
                      Adjuntar
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setShowAddDescDriveLink(true)}>
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
                    {isDescDragOver && (
                      <span className="ml-auto text-xs text-muted-foreground">Suelta la imagen aquí</span>
                    )}
                  </div>

                  {/* Tags */}
                  {task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                      {task.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              <Card className="border-b-2 border-b-purple-500">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Comentarios ({task.notes?.length || 0})
                  </CardTitle>
                  <CardDescription>Comentarios sobre la tarea</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Note */}
                  <div
                    className={`space-y-3 p-4 border rounded-lg bg-muted/30 transition-colors ${isNoteDragOver ? "ring-2 ring-primary ring-offset-2 bg-primary/5" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setIsNoteDragOver(true) }}
                    onDragLeave={() => setIsNoteDragOver(false)}
                    onDrop={handleNoteDrop}
                  >
                    <div>
                      <CommentFormatToolbar
                        value={newNote}
                        onValueChange={setNewNote}
                        textareaRef={noteInputRef}
                      />
                      <Textarea
                        ref={noteInputRef}
                        placeholder="Escribe un comentario o arrastra una imagen aquí..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="min-h-[80px] rounded-t-none"
                      />
                    </div>
                    
                    {/* Attachments Preview */}
                    {(noteAttachments.length > 0 || noteDriveLinks.length > 0) && (
                      <div className="flex flex-wrap gap-2">
                        {noteAttachments.map((file) => (
                          file.type === "image" && file.url ? (
                            <div key={file.id} className="group relative h-16 w-16 overflow-hidden rounded-lg border">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={file.url || "/placeholder.svg"} alt={file.name} className="h-full w-full object-cover" />
                              <button
                                onClick={() => setNoteAttachments(prev => prev.filter(f => f.id !== file.id))}
                                className="absolute top-0.5 right-0.5 rounded-full bg-background/80 p-0.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                                aria-label={`Quitar ${file.name}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
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
                          )
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

                    <div className="flex flex-wrap items-center justify-between gap-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground">Tipo:</span>
                        {[
                          { key: "propuesta", label: "Propuesta" },
                          { key: "ajuste", label: "Ajuste" },
                          { key: "entregables", label: "Entregables" },
                        ].map((t) => (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() => {
                              // Selección única: al elegir otro tipo se reemplaza; volver a
                              // hacer clic en el mismo tipo lo deselecciona y limpia la cantidad.
                              setNoteType((prev) => {
                                const next = prev === t.key ? "" : t.key
                                if (next !== t.key) setNoteQuantity("")
                                return next
                              })
                            }}
                            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                              noteType === t.key
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-input bg-background hover:bg-muted"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                        {/* Recuadro de cantidad manual, aparece al seleccionar un tipo */}
                        {noteType && (
                          <div className="flex items-center gap-1.5">
                            <Label htmlFor="note-quantity" className="text-sm text-muted-foreground">
                              Cantidad:
                            </Label>
                            <Input
                              id="note-quantity"
                              type="number"
                              min={0}
                              placeholder="0"
                              value={noteQuantity}
                              onChange={(e) => setNoteQuantity(e.target.value)}
                              className="h-8 w-20"
                              aria-label={`Cantidad de ${noteType}`}
                            />
                          </div>
                        )}
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
                      <div className="flex items-center gap-2">
                        {/* Tiempo estimado que se le dedicó a esta parte de la tarea */}
                        <div className="flex items-center gap-1 rounded-md border px-2 py-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            min={0}
                            placeholder="0"
                            value={noteHours}
                            onChange={(e) => setNoteHours(e.target.value)}
                            className="h-7 w-12 px-1 text-center"
                            aria-label="Horas estimadas"
                          />
                          <span className="text-xs text-muted-foreground">h</span>
                          <Input
                            type="number"
                            min={0}
                            max={59}
                            placeholder="00"
                            value={noteMinutes}
                            onChange={(e) => setNoteMinutes(e.target.value)}
                            className="h-7 w-12 px-1 text-center"
                            aria-label="Minutos estimados"
                          />
                          <span className="text-xs text-muted-foreground">m</span>
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
                              types: noteType ? [noteType] : [],
                              quantity: noteType ? (parseInt(noteQuantity || "0", 10) || 0) : 0,
                              estimatedMinutes:
                                (parseInt(noteHours || "0", 10) || 0) * 60 +
                                (parseInt(noteMinutes || "0", 10) || 0),
                              attachments: noteAttachments,
                              driveLinks: noteDriveLinks,
                            }
                            setTask(prev => ({
                              ...prev,
                              notes: [...(prev.notes || []), note],
                            }))
                            setNewNote("")
                            setNoteType("")
                            setNoteQuantity("")
                            setNoteHours("")
                            setNoteMinutes("")
                            setNoteAttachments([])
                            setNoteDriveLinks([])
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Comentario
                        </Button>
                        {/* Aprobación Interna: botón llamativo pegado a la derecha */}
                        <Button
                          type="button"
                          size="sm"
                          variant={internalApproval ? "default" : "outline"}
                          title={
                            internalApproval
                              ? `Aprobado por ${internalApproval.by} · ${formatDateTime(internalApproval.at)}`
                              : "Marcar como aprobado internamente"
                          }
                          onClick={() =>
                            setInternalApproval((prev) =>
                              prev ? null : { by: "Usuario Actual", at: new Date().toISOString() },
                            )
                          }
                          className={
                            internalApproval
                              ? "border-2 border-green-600 bg-green-600 text-white hover:bg-green-700"
                              : "border-2 border-green-600 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30"
                          }
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Aprobación Interna
                        </Button>
                      </div>
                    </div>
                    {internalApproval && (
                      <p className="text-right text-xs text-green-700 dark:text-green-400">
                        Aprobado por <span className="font-medium">{internalApproval.by}</span> ·{" "}
                        {formatDateTime(internalApproval.at)}
                      </p>
                    )}
                  </div>

                  {/* Notes List */}
                  <div className="space-y-3">
                    {task.notes?.map((note: any) => (
                      <div key={note.id} className="p-4 rounded-lg border bg-muted/30">
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[10px]">{note.author.initials}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{note.author.name}</span>
                            {note.types?.map((t: string) => (
                              <Badge key={t} variant="outline" className="text-xs capitalize">
                                {t}{note.quantity ? ` · ${note.quantity}` : ""}
                              </Badge>
                            ))}
                            {note.estimatedMinutes > 0 && (
                              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {Math.floor(note.estimatedMinutes / 60)}h {note.estimatedMinutes % 60}m
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(note.date)}</span>
                        </div>
                        <p className="text-sm">{note.text}</p>
                        
                        {/* Note Attachments & Drive Links */}
                        {((note.attachments && note.attachments.length > 0) || (note.driveLinks && note.driveLinks.length > 0)) && (
                          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                            {note.attachments?.map((file: any) => (
                              file.type === 'image' && file.url ? (
                                <a
                                  key={file.id}
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block overflow-hidden rounded-lg border hover:opacity-90 transition-opacity"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={file.url || "/placeholder.svg"} alt={file.name} className="h-28 w-40 object-cover" />
                                </a>
                              ) : (
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
                              )
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

              {/* Dialog: Vincular Tarea */}
              <Dialog open={showLinkTaskDialog} onOpenChange={(open) => { setShowLinkTaskDialog(open); if (!open) setLinkTaskSearch("") }}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Vincular Tarea</DialogTitle>
                    <DialogDescription>
                      Selecciona una tarea de esta cuenta o de cualquier otra cuenta para vincularla.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input
                      placeholder="Buscar por tarea, cuenta o responsable..."
                      value={linkTaskSearch}
                      onChange={(e) => setLinkTaskSearch(e.target.value)}
                    />
                    <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                      {filteredLinkableTasks.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                          No se encontraron tareas para vincular.
                        </p>
                      ) : (
                        filteredLinkableTasks.map(t => (
                          <button
                            key={t.id}
                            onClick={() => linkTask(t)}
                            className="flex items-center justify-between gap-3 w-full p-3 border rounded-lg hover:bg-muted/50 transition-colors text-left"
                          >
                            <div className="min-w-0">
                              <span className="font-medium block truncate">{t.name}</span>
                              <span className="text-xs text-muted-foreground">{t.account} · {t.assignee}</span>
                            </div>
                            <Badge className={`${getStatusMeta(t.status).color} text-white text-xs shrink-0`}>
                              {getStatusMeta(t.status).label}
                            </Badge>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setShowLinkTaskDialog(false); setLinkTaskSearch("") }}>
                      Cerrar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

          {/* Entregables (links a Google Drive) */}
          <Card className="border-b-2 border-b-purple-500">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Editables</CardTitle>
                <CardDescription>Enlaces a los editables en Google Drive</CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowAddDeliverable(prev => !prev)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar link
              </Button>
            </CardHeader>
            <CardContent>
              {showAddDeliverable && (
                <div className="mb-4 p-4 border rounded-lg space-y-3 bg-muted/30">
                  <div className="space-y-1.5">
                    <Label htmlFor="deliverable-name" className="text-xs">Nombre (opcional)</Label>
                    <Input
                      id="deliverable-name"
                      placeholder="Ej. Diseños finales, Presentación..."
                      value={newDeliverableName}
                      onChange={(e) => setNewDeliverableName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="deliverable-url" className="text-xs">Link de Google Drive</Label>
                    <Input
                      id="deliverable-url"
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={newDeliverableUrl}
                      onChange={(e) => setNewDeliverableUrl(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAddDeliverable(false)
                        setNewDeliverableName("")
                        setNewDeliverableUrl("")
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={addDeliverable} disabled={!newDeliverableUrl.trim()}>
                      Agregar
                    </Button>
                  </div>
                </div>
              )}

              {deliverables.length > 0 ? (
                <div className="space-y-3">
                  {deliverables.map(link => (
                    <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 min-w-0 flex-1"
                      >
                        <div className="h-10 w-10 rounded bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Link2 className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{link.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                        </div>
                      </a>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="ghost" size="icon" asChild>
                          <a href={link.url} target="_blank" rel="noopener noreferrer" aria-label="Abrir entregable">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => removeDeliverable(link.id)} aria-label="Eliminar entregable">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                !showAddDeliverable && (
                  <div className="text-center py-8">
                    <Link2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Aún no hay entregables. Agrega un link de Google Drive.</p>
                  </div>
                )
              )}
            </CardContent>
          </Card>

        </TabsContent>
      </Tabs>
      )}

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
              <RichTextEditor
                value={editedTask.description}
                onChange={(html) => setEditedTask(prev => ({ ...prev, description: html }))}
                placeholder="Escribe una descripción o arrastra una imagen aquí…"
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

export default function TaskDetailPage() {
  return <TaskDetailView />
}
