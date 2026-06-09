"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
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
  CheckCircle2,
  FileText,
  Plus,
  MoreHorizontal,
  Play,
  Pause,
  Edit,
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
  CheckSquare,
  Upload,
  Download,
  Trash,
  ExternalLink,
  Bell,
  AtSign,
  FileImage,
  File,
  X,
  StickyNote,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Hash,
  Image,
  Video,
  Layers,
  Rss,
  GripVertical,
} from "lucide-react"
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

// Platform icons
const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-4 w-4 text-pink-500" />,
  facebook: <Facebook className="h-4 w-4 text-blue-600" />,
  twitter: <Twitter className="h-4 w-4 text-sky-500" />,
  tiktok: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>,
  linkedin: <svg className="h-4 w-4 text-blue-700" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
  youtube: <Youtube className="h-4 w-4 text-red-600" />,
}

// Type icons
const typeIcons: Record<string, React.ReactNode> = {
  imagen: <Image className="h-3 w-3" />,
  video: <Video className="h-3 w-3" />,
  story: <Layers className="h-3 w-3" />,
  reel: <Video className="h-3 w-3" />,
  carrusel: <Layers className="h-3 w-3" />,
}

// Pipeline stages
const stages = [
  { id: "idea", name: "Idea", color: "#6366f1" },
  { id: "copywriting", name: "Copywriting", color: "#8b5cf6" },
  { id: "diseno", name: "Diseño", color: "#ec4899" },
  { id: "revision_interna", name: "Revisión Interna", color: "#f59e0b" },
  { id: "aprobacion_cliente", name: "Aprobación Cliente", color: "#3b82f6" },
  { id: "programado", name: "Programado", color: "#10b981" },
  { id: "publicado", name: "Publicado", color: "#22c55e" },
  { id: "finalizado", name: "Finalizado", color: "#059669" }
]

// Mock RSS task data
const getRssTaskById = (taskId: string, projectId: string) => ({
  id: taskId,
  title: "Post Lanzamiento Campaña",
  platform: "instagram",
  type: "imagen",
  stage: "aprobacion_cliente",
  scheduledDate: "2024-04-08",
  dueDate: "2024-04-08",
  createdAt: "2024-03-20",
  assignee: { name: "Ana López", initials: "AL", email: "ana@agencia.com" },
  description: "POV: Cuando descubres Coca-Cola Zero. Crear contenido atractivo para la audiencia joven mostrando los beneficios del producto sin azúcar.",
  hashtags: ["#CocaColaZero", "#SinAzucar", "#RefrescoSaludable"],
  priority: "alta",
  hours: 6,
  hoursLogged: 4,
  projectId: projectId,
  projectName: "Coca-Cola Zero - Campaña Digital",
  client: "Coca-Cola México",
  account: "Coca-Cola Premium",
  subtasks: [
    { id: "st1", title: "Definir concepto creativo", completed: true },
    { id: "st2", title: "Redactar copy", completed: true },
    { id: "st3", title: "Crear diseño visual", completed: true },
    { id: "st4", title: "Revisión interna", completed: true },
    { id: "st5", title: "Enviar a cliente", completed: false },
    { id: "st6", title: "Aplicar correcciones", completed: false },
    { id: "st7", title: "Programar publicación", completed: false },
  ],
  comments: [
    { 
      id: "c1", 
      author: { name: "Ana López", initials: "AL" }, 
      text: "Ya está listo el primer borrador del diseño. @Carlos Ruiz por favor revisa el copy.", 
      date: "2024-03-22T10:30:00",
      attachments: [
        { id: "ca1", name: "Diseño_v1.png", type: "image", size: "2.4 MB" }
      ]
    },
    { 
      id: "c2", 
      author: { name: "Carlos Ruiz", initials: "CR" }, 
      text: "Copy revisado y aprobado. El tono es perfecto para el target.", 
      date: "2024-03-23T14:15:00",
      attachments: []
    },
    { 
      id: "c3", 
      author: { name: "Eduardo Méndez", initials: "EM" }, 
      text: "Enviado al cliente para aprobación. Esperamos respuesta para el viernes.", 
      date: "2024-03-25T09:00:00",
      attachments: [
        { id: "ca2", name: "Presentacion_Cliente.pdf", type: "pdf", size: "5.1 MB" }
      ]
    },
  ],
  notes: [
    { 
      id: "n1", 
      author: { name: "Ana López", initials: "AL" }, 
      text: "El cliente mencionó en la última llamada que prefiere fotos con personas reales en lugar de renders.", 
      date: "2024-03-21T11:00:00", 
      isPrivate: false,
      attachments: [
        { id: "na1", name: "referencias_fotos.zip", type: "archive", size: "15.2 MB" }
      ],
      driveLinks: [
        { id: "dl1", name: "Carpeta Referencias", url: "https://drive.google.com/drive/folders/abc123" }
      ]
    },
    { 
      id: "n2", 
      author: { name: "Eduardo Méndez", initials: "EM" }, 
      text: "Nota interna: El presupuesto para sesión de fotos está aprobado. Máximo $5,000 MXN.", 
      date: "2024-03-22T09:30:00", 
      isPrivate: true,
      attachments: [],
      driveLinks: [
        { id: "dl2", name: "Cotización Fotógrafo", url: "https://drive.google.com/file/d/xyz789" }
      ]
    },
    { 
      id: "n3", 
      author: { name: "Carlos Ruiz", initials: "CR" }, 
      text: "Adjunto el brandbook actualizado de Coca-Cola para referencia de colores y tipografía.", 
      date: "2024-03-23T16:00:00", 
      isPrivate: false,
      attachments: [
        { id: "na2", name: "CocaCola_Brandbook_2024.pdf", type: "pdf", size: "8.7 MB" }
      ],
      driveLinks: []
    },
  ],
  attachments: [
    { id: "a1", name: "Brief_Campaña.pdf", type: "pdf", size: "1.2 MB", uploadedBy: "Eduardo Méndez", date: "2024-03-20" },
    { id: "a2", name: "Diseño_Final.psd", type: "psd", size: "45.8 MB", uploadedBy: "Ana López", date: "2024-03-24" },
    { id: "a3", name: "Diseño_Final.jpg", type: "image", size: "2.1 MB", uploadedBy: "Ana López", date: "2024-03-24" },
    { id: "a4", name: "Copy_Aprobado.docx", type: "doc", size: "156 KB", uploadedBy: "Carlos Ruiz", date: "2024-03-23" },
  ],
  timeEntries: [
    { id: "t1", date: "2024-03-21", hours: 1.5, description: "Investigación y concepto", user: "Ana López" },
    { id: "t2", date: "2024-03-22", hours: 2.0, description: "Diseño inicial", user: "Ana López" },
    { id: "t3", date: "2024-03-23", hours: 0.5, description: "Redacción de copy", user: "Carlos Ruiz" },
  ],
  history: [
    { id: "h1", action: "Tarea creada", user: "Eduardo Méndez", date: "2024-03-20T09:00:00" },
    { id: "h2", action: "Asignada a Ana López", user: "Eduardo Méndez", date: "2024-03-20T09:05:00" },
    { id: "h3", action: "Movida a Copywriting", user: "Ana López", date: "2024-03-21T10:00:00" },
    { id: "h4", action: "Movida a Diseño", user: "Ana López", date: "2024-03-22T09:00:00" },
    { id: "h5", action: "Archivo subido: Diseño_v1.png", user: "Ana López", date: "2024-03-22T10:30:00" },
    { id: "h6", action: "Movida a Revisión Interna", user: "Ana López", date: "2024-03-23T14:00:00" },
    { id: "h7", action: "Movida a Aprobación Cliente", user: "Eduardo Méndez", date: "2024-03-25T09:00:00" },
  ],
})

export default function RssTaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const taskId = params.taskId as string
  
  const [task, setTask] = useState(() => getRssTaskById(taskId, projectId))
  const [activeTab, setActiveTab] = useState("overview")
  const [isTracking, setIsTracking] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [commentAttachments, setCommentAttachments] = useState<{id: string; name: string; type: string; size: string}[]>([])
  const [newNote, setNewNote] = useState("")
  const [noteIsPrivate, setNoteIsPrivate] = useState(false)
  const [noteAttachments, setNoteAttachments] = useState<{id: string; name: string; type: string; size: string}[]>([])
  const [noteDriveLinks, setNoteDriveLinks] = useState<{id: string; name: string; url: string}[]>([])
  const [showAddDriveLink, setShowAddDriveLink] = useState(false)
  const [newDriveLinkName, setNewDriveLinkName] = useState("")
  const [newDriveLinkUrl, setNewDriveLinkUrl] = useState("")
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editedTask, setEditedTask] = useState({...task})

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

  const addComment = () => {
    if (!newComment.trim()) return
    const comment = {
      id: `c${Date.now()}`,
      author: { name: "Usuario Actual", initials: "UA" },
      text: newComment,
      date: new Date().toISOString(),
      attachments: [...commentAttachments]
    }
    setTask(prev => ({
      ...prev,
      comments: [...prev.comments, comment]
    }))
    setNewComment("")
    setCommentAttachments([])
  }

  const addNote = () => {
    if (!newNote.trim()) return
    const note = {
      id: `n${Date.now()}`,
      author: { name: "Usuario Actual", initials: "UA" },
      text: newNote,
      date: new Date().toISOString(),
      isPrivate: noteIsPrivate,
      attachments: [...noteAttachments],
      driveLinks: [...noteDriveLinks]
    }
    setTask(prev => ({
      ...prev,
      notes: [...prev.notes, note]
    }))
    setNewNote("")
    setNoteIsPrivate(false)
    setNoteAttachments([])
    setNoteDriveLinks([])
  }

  const addDriveLink = () => {
    if (!newDriveLinkName.trim() || !newDriveLinkUrl.trim()) return
    setNoteDriveLinks(prev => [...prev, {
      id: `dl${Date.now()}`,
      name: newDriveLinkName,
      url: newDriveLinkUrl
    }])
    setNewDriveLinkName("")
    setNewDriveLinkUrl("")
    setShowAddDriveLink(false)
  }

  const saveTask = () => {
    setTask(editedTask)
    setShowEditDialog(false)
  }

  const deleteTask = () => {
    router.push(`/orbit-tasksflow/projects/${projectId}`)
  }

  const currentStage = stages.find(s => s.id === task.stage)
  const completedSubtasks = task.subtasks.filter(s => s.completed).length
  const progress = Math.round((completedSubtasks / task.subtasks.length) * 100)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
<div className="flex items-center gap-4">
  <div>
  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
  <Link href="/orbit-tasksflow/projects" className="hover:underline">Proyectos</Link>
  <span>/</span>
  <Link href={`/orbit-tasksflow/projects/${projectId}`} className="hover:underline">{task.projectName}</Link>
  <span>/</span>
  <Link href={`/orbit-tasksflow/projects/${projectId}?tab=rss`} className="hover:underline">Parrilla RSS</Link>
  <span>/</span>
              <span>Tarea</span>
            </div>
            <div className="flex items-center gap-3">
              {platformIcons[task.platform]}
              <h1 className="text-2xl font-bold">{task.title}</h1>
            </div>
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
          <Button variant="outline" onClick={() => {
            setEditedTask({...task})
            setShowEditDialog(true)
          }}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-destructive" onClick={deleteTask}>
                <Trash className="h-4 w-4 mr-2" />
                Eliminar Tarea
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      

      {/* Quick Info Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Etapa:</span>
              <Badge style={{ backgroundColor: currentStage?.color }} className="text-white">
                {currentStage?.name}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Prioridad:</span>
              <Badge 
                variant="outline" 
                className={
                  task.priority === 'alta' ? 'border-red-300 bg-red-50 text-red-700' :
                  task.priority === 'media' ? 'border-amber-300 bg-amber-50 text-amber-700' :
                  'border-green-300 bg-green-50 text-green-700'
                }
              >
                <Flag className="h-3 w-3 mr-1" />
                {task.priority === 'alta' ? 'Alta' : task.priority === 'media' ? 'Media' : 'Baja'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Tipo:</span>
              <Badge variant="outline" className="flex items-center gap-1">
                {typeIcons[task.type]}
                {task.type}
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
              <span className="text-sm">Publicación: {formatDate(task.scheduledDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{task.hoursLogged}h / {task.hours}h</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center gap-3">
          <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
            <Link href={`/orbit-tasksflow/projects/${projectId}?tab=rss`}>
              <Rss className="h-4 w-4 mr-2" />
              Parrilla RSS
            </Link>
          </Button>
          <TabsList className="grid grid-cols-6 w-full max-w-3xl">
            <TabsTrigger value="overview" className="gap-2">
              <FileText className="h-4 w-4" />
              Resumen
            </TabsTrigger>
          <TabsTrigger value="subtasks" className="gap-2">
            <ListTodo className="h-4 w-4" />
            Subtareas
          </TabsTrigger>
          <TabsTrigger value="comments" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Comentarios
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            <StickyNote className="h-4 w-4" />
            Notas
          </TabsTrigger>
          <TabsTrigger value="attachments" className="gap-2">
            <Paperclip className="h-4 w-4" />
            Archivos
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Descripción</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{task.description}</p>
                  {task.hashtags && task.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                      <span className="text-sm text-muted-foreground mr-2">Hashtags:</span>
                      {task.hashtags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          <Hash className="h-3 w-3 mr-1" />{tag.replace('#', '')}
                        </Badge>
                      ))}
                    </div>
                  )}
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
                    <span className="text-lg font-bold">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">{completedSubtasks}</p>
                      <p className="text-sm text-muted-foreground">Subtareas completadas</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">{task.subtasks.length - completedSubtasks}</p>
                      <p className="text-sm text-muted-foreground">Subtareas pendientes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pipeline Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pipeline de Contenido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1 overflow-x-auto pb-2">
                    {stages.map((stage, index) => {
                      const isActive = stage.id === task.stage
                      const isPast = stages.findIndex(s => s.id === task.stage) > index
                      return (
                        <div key={stage.id} className="flex items-center">
                          <div 
                            className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                              isActive 
                                ? 'text-white shadow-md' 
                                : isPast 
                                  ? 'bg-muted text-muted-foreground' 
                                  : 'bg-muted/50 text-muted-foreground/50'
                            }`}
                            style={isActive ? { backgroundColor: stage.color } : {}}
                          >
                            {stage.name}
                          </div>
                          {index < stages.length - 1 && (
                            <div className={`w-4 h-0.5 mx-1 ${isPast ? 'bg-muted-foreground' : 'bg-muted'}`} />
                          )}
                        </div>
                      )
                    })}
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
                    <span className="font-medium">{task.hours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trabajado</span>
                    <span className="font-medium">{task.hoursLogged}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Restante</span>
                    <span className="font-medium text-amber-600">{(task.hours - task.hoursLogged).toFixed(1)}h</span>
                  </div>
                  <Progress value={(task.hoursLogged / task.hours) * 100} className="h-2" />
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
                    <Link href={`/orbit-tasksflow/projects/${projectId}`} className="font-medium text-primary hover:underline truncate max-w-[150px]">
                      {task.projectName}
                    </Link>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cliente</span>
                    <span className="font-medium">{task.client}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plataforma</span>
                    <div className="flex items-center gap-2">
                      {platformIcons[task.platform]}
                      <span className="capitalize">{task.platform}</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creada</span>
                    <span className="font-medium">{formatDate(task.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha publicación</span>
                    <span className="font-medium">{formatDate(task.scheduledDate)}</span>
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
                Agregar Subtarea
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {task.subtasks.map(subtask => (
                  <div 
                    key={subtask.id} 
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox 
                      checked={subtask.completed}
                      onCheckedChange={() => toggleSubtask(subtask.id)}
                    />
                    <span className={subtask.completed ? "line-through text-muted-foreground" : ""}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comentarios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* New Comment */}
              <div className="space-y-3">
                <Textarea 
                  placeholder="Escribe un comentario... Usa @ para mencionar"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[100px]"
                />
                {commentAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                    {commentAttachments.map((file) => (
                      <Badge key={file.id} variant="secondary" className="flex items-center gap-2 px-3 py-1.5">
                        {file.type === 'image' ? <FileImage className="h-4 w-4" /> : <File className="h-4 w-4" />}
                        <span className="max-w-32 truncate">{file.name}</span>
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
                  <Button size="sm" disabled={!newComment.trim()} onClick={addComment}>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              {/* Comments List */}
              <div className="space-y-6">
                {task.comments.map((comment: any) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback>{comment.author.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{comment.author.name}</span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(comment.date)}</span>
                      </div>
                      <p className="text-sm">{comment.text}</p>
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
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <StickyNote className="h-5 w-5" />
                Notas
              </CardTitle>
              <CardDescription>
                Agrega notas con archivos adjuntos y enlaces de Google Drive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* New Note */}
              <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                <Textarea 
                  placeholder="Escribe una nota..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[80px]"
                />
                
                {/* Note Attachments */}
                {noteAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {noteAttachments.map((file) => (
                      <Badge key={file.id} variant="secondary" className="flex items-center gap-2 px-3 py-1.5">
                        <File className="h-4 w-4" />
                        <span className="max-w-32 truncate">{file.name}</span>
                        <button 
                          onClick={() => setNoteAttachments(prev => prev.filter(f => f.id !== file.id))}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Drive Links */}
                {noteDriveLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {noteDriveLinks.map((link) => (
                      <Badge key={link.id} variant="outline" className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border-blue-200">
                        <svg className="h-4 w-4" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                          <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                          <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                          <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                          <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                          <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                          <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                        </svg>
                        <span className="max-w-32 truncate text-blue-700">{link.name}</span>
                        <button 
                          onClick={() => setNoteDriveLinks(prev => prev.filter(l => l.id !== link.id))}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Add Drive Link Dialog */}
                {showAddDriveLink && (
                  <div className="p-3 border rounded-lg bg-background space-y-3">
                    <div className="space-y-2">
                      <Label>Nombre del enlace</Label>
                      <Input 
                        placeholder="Ej: Carpeta de Referencias"
                        value={newDriveLinkName}
                        onChange={(e) => setNewDriveLinkName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL de Google Drive</Label>
                      <Input 
                        placeholder="https://drive.google.com/..."
                        value={newDriveLinkUrl}
                        onChange={(e) => setNewDriveLinkUrl(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={addDriveLink}>Agregar</Button>
                      <Button size="sm" variant="outline" onClick={() => setShowAddDriveLink(false)}>Cancelar</Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        const newFile = { id: `temp-${Date.now()}`, name: 'Archivo.pdf', type: 'pdf', size: '1.2 MB' }
                        setNoteAttachments(prev => [...prev, newFile])
                      }}
                      className="gap-2"
                    >
                      <Paperclip className="h-4 w-4" />
                      Adjuntar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowAddDriveLink(true)}
                      className="gap-2"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                        <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                        <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                        <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                        <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                        <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                        <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                      </svg>
                      Vincular Drive
                    </Button>
                    <div className="flex items-center gap-2 ml-4">
                      <Checkbox 
                        id="private" 
                        checked={noteIsPrivate}
                        onCheckedChange={(checked) => setNoteIsPrivate(checked as boolean)}
                      />
                      <Label htmlFor="private" className="text-sm cursor-pointer flex items-center gap-1">
                        <EyeOff className="h-3 w-3" />
                        Nota privada
                      </Label>
                    </div>
                  </div>
                  <Button size="sm" disabled={!newNote.trim()} onClick={addNote}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Nota
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              {/* Notes List */}
              <div className="space-y-4">
                {task.notes.map((note: any) => (
                  <div key={note.id} className={`p-4 rounded-lg border ${note.isPrivate ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800' : 'bg-muted/30'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{note.author.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium text-sm">{note.author.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{formatDateTime(note.date)}</span>
                        </div>
                      </div>
                      {note.isPrivate && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Privada
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm mb-3">{note.text}</p>
                    
                    {/* Note Attachments */}
                    {note.attachments?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {note.attachments.map((file: any) => (
                          <div key={file.id} className="flex items-center gap-2 px-3 py-2 bg-background border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                            <FileText className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-medium">{file.name}</span>
                            <span className="text-xs text-muted-foreground">{file.size}</span>
                            <Download className="h-3 w-3 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Drive Links */}
                    {note.driveLinks?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {note.driveLinks.map((link: any) => (
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
                {task.attachments.map((file: any) => (
                  <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                        {file.type === 'image' ? (
                          <FileImage className="h-5 w-5 text-blue-500" />
                        ) : file.type === 'pdf' ? (
                          <FileText className="h-5 w-5 text-red-500" />
                        ) : (
                          <File className="h-5 w-5 text-muted-foreground" />
                        )}
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
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
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
              <div className="space-y-4">
                {task.history.map((entry: any, index: number) => (
                  <div key={entry.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <History className="h-4 w-4 text-muted-foreground" />
                      </div>
                      {index < task.history.length - 1 && (
                        <div className="w-0.5 h-full bg-muted mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium">{entry.action}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{entry.user}</span>
                        <span>•</span>
                        <span>{formatDateTime(entry.date)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Tarea
            </DialogTitle>
            <DialogDescription>
              Modifica los detalles de la tarea de la parrilla.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Título</Label>
                <Input 
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select 
                  value={editedTask.priority} 
                  onValueChange={(v) => setEditedTask({...editedTask, priority: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Horas Estimadas</Label>
                <Input 
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={editedTask.hours}
                  onChange={(e) => setEditedTask({...editedTask, hours: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <Select 
                  value={editedTask.platform} 
                  onValueChange={(v) => setEditedTask({...editedTask, platform: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="twitter">Twitter/X</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Contenido</Label>
                <Select 
                  value={editedTask.type} 
                  onValueChange={(v) => setEditedTask({...editedTask, type: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="imagen">Imagen</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="reel">Reel</SelectItem>
                    <SelectItem value="carrusel">Carrusel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Etapa</Label>
                <Select 
                  value={editedTask.stage} 
                  onValueChange={(v) => setEditedTask({...editedTask, stage: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                          {s.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha Publicación</Label>
                <Input 
                  type="date"
                  value={editedTask.scheduledDate}
                  onChange={(e) => setEditedTask({...editedTask, scheduledDate: e.target.value})}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Descripción</Label>
                <Textarea 
                  value={editedTask.description || ""}
                  onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveTask}>
              <CheckSquare className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
