"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  FolderKanban,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BarChart3,
  Plus,
  MoreHorizontal,
  Play,
  Pause,
  Edit,
  Briefcase,
  Target,
  TrendingUp,
  ListTodo,
  Package,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Mail,
  Phone,
  User,
  Star,
  ExternalLink,
  FolderOpen,
  FileText as FileIcon,
  Link2,
  Palette,
  Video,
  Image,
  PieChart,
  CheckSquare,
  Settings,
  Unlink,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquarePlus,
  MessageCircle,
  Paperclip,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  Send,
  Rss,
  GripVertical,
  ImageIcon,
  Film,
  Layers,
  Hash,
  Pencil,
  Receipt,
  DollarSign,
  CreditCard,
  Ban,
  Upload,
  FileImage,
  Download,
  Trash
} from "lucide-react"

// Mock data - In production this would come from the database
const mockProject = {
  id: "proj-001",
  name: "Campaña Digital Q2 2024",
  description: "Campaña integral de marketing digital incluyendo redes sociales, pauta digital y contenido.",
  client: "Coca-Cola México",
  account: "Coca-Cola Zero",
  status: "en_progreso",
  priority: "alta",
  health: "good",
  progress: 65,
  startDate: "2024-03-01",
  dueDate: "2024-06-30",
  hoursBudget: 240,
  hoursWorked: 156,
  budget: 450000,
  spent: 280000,
  services: ["Social Media", "Pauta Digital", "Diseño", "Video"],
  manager: { name: "María García", initials: "MG" },
  coordinator: { name: "Juan Pérez", initials: "JP" },
  team: [
    { id: "1", name: "María García", initials: "MG", role: "Project Manager", hoursAssigned: 40 },
    { id: "2", name: "Juan Pérez", initials: "JP", role: "Coordinador", hoursAssigned: 60 },
    { id: "3", name: "Ana López", initials: "AL", role: "Diseñadora", hoursAssigned: 80 },
    { id: "4", name: "Carlos Ruiz", initials: "CR", role: "Community Manager", hoursAssigned: 60 },
  ],
  tasks: {
    total: 24,
    completed: 16,
    inProgress: 5,
    pending: 3,
    overdue: 1
  },
  deliverables: {
    total: 8,
    approved: 5,
    pending: 2,
    rejected: 1
  },
  // Social Links & Website
  socialLinks: {
    website: "https://www.coca-cola.com.mx",
    facebook: "https://facebook.com/cocacolamx",
    instagram: "https://instagram.com/cocacolamx",
    twitter: "https://twitter.com/cocacolamx",
    linkedin: "https://linkedin.com/company/coca-cola",
    youtube: "https://youtube.com/cocacolamx",
    tiktok: "https://tiktok.com/@cocacolamx"
  },
  // Client Contacts
  clientContacts: [
    { 
      id: "c1", 
      name: "Roberto Hernández", 
      position: "Director de Marketing", 
      email: "roberto.hernandez@coca-cola.com", 
      phone: "+52 55 1234 5678",
      isPrimary: true,
      permissions: {
        resumen: "ver_comentar",
        tareas: "ver_comentar",
        entregables: "ver_comentar",
        equipo: "ver",
        documentos: "ver_comentar",
        calendario: "ver",
        solicitudes: "ver_comentar",
        parrilla_rss: "ver",
        facturacion: "ver"
      }
    },
    { 
      id: "c2", 
      name: "Laura Martínez", 
      position: "Brand Manager", 
      email: "laura.martinez@coca-cola.com", 
      phone: "+52 55 2345 6789",
      isPrimary: false,
      permissions: {
        resumen: "ver",
        tareas: "ver",
        entregables: "ver_comentar",
        equipo: "ninguno",
        documentos: "ver",
        calendario: "ver",
        solicitudes: "ver",
        parrilla_rss: "ver",
        facturacion: "ninguno"
      }
    },
    { 
      id: "c3", 
      name: "Miguel Ángel Torres", 
      position: "Coordinador de Proyectos", 
      email: "miguel.torres@coca-cola.com", 
      phone: "+52 55 3456 7890",
      isPrimary: false,
      permissions: {
        resumen: "ver",
        tareas: "ver_comentar",
        entregables: "ver",
        equipo: "ninguno",
        documentos: "ver",
        calendario: "ver",
        solicitudes: "ninguno",
        parrilla_rss: "ninguno",
        facturacion: "ninguno"
      }
    }
  ],
  // Billing / Invoicing
  billing: {
    monthlyFee: 85000,
    currency: "MXN",
    billingDay: 1,
    invoices: [
      {
        id: "inv-001",
        month: "2024-01",
        period: "Enero 2024",
        amount: 85000,
        status: "pagada",
        invoiceNumber: "F-2024-001",
        invoiceDate: "2024-01-05",
        dueDate: "2024-01-20",
        paidDate: "2024-01-18",
        tasks: [
          { id: "bt1", title: "Envío de factura por email", status: "completada", date: "2024-01-05", assignee: "Ana López" },
          { id: "bt2", title: "Confirmación de recepción", status: "completada", date: "2024-01-06", assignee: "Ana López" },
          { id: "bt3", title: "Pago recibido - confirmar", status: "completada", date: "2024-01-18", assignee: "Carlos Ruiz" }
        ],
        attachments: [
          { id: "att1", name: "Confirmación_envío_factura.jpg", date: "2024-01-05", type: "image" },
          { id: "att2", name: "Comprobante_pago.jpg", date: "2024-01-18", type: "image" }
        ]
      },
      {
        id: "inv-002",
        month: "2024-02",
        period: "Febrero 2024",
        amount: 85000,
        status: "pagada",
        invoiceNumber: "F-2024-015",
        invoiceDate: "2024-02-02",
        dueDate: "2024-02-17",
        paidDate: "2024-02-15",
        tasks: [
          { id: "bt4", title: "Envío de factura por email", status: "completada", date: "2024-02-02", assignee: "Ana López" },
          { id: "bt5", title: "Seguimiento telefónico", status: "completada", date: "2024-02-10", assignee: "Ana López" },
          { id: "bt6", title: "Pago confirmado", status: "completada", date: "2024-02-15", assignee: "Carlos Ruiz" }
        ],
        attachments: [
          { id: "att3", name: "Email_factura_febrero.jpg", date: "2024-02-02", type: "image" }
        ]
      },
      {
        id: "inv-003",
        month: "2024-03",
        period: "Marzo 2024",
        amount: 85000,
        status: "pagada",
        invoiceNumber: "F-2024-032",
        invoiceDate: "2024-03-04",
        dueDate: "2024-03-19",
        paidDate: "2024-03-20",
        tasks: [
          { id: "bt7", title: "Envío de factura", status: "completada", date: "2024-03-04", assignee: "Ana López" },
          { id: "bt8", title: "Recordatorio de pago", status: "completada", date: "2024-03-18", assignee: "Ana López" },
          { id: "bt9", title: "Pago recibido tarde - registrar", status: "completada", date: "2024-03-20", assignee: "Carlos Ruiz" }
        ],
        attachments: []
      },
      {
        id: "inv-004",
        month: "2024-04",
        period: "Abril 2024",
        amount: 85000,
        status: "por_cobrar",
        invoiceNumber: "F-2024-048",
        invoiceDate: "2024-04-03",
        dueDate: "2024-04-18",
        paidDate: null,
        tasks: [
          { id: "bt10", title: "Generar factura del mes", status: "completada", date: "2024-04-01", assignee: "Ana López" },
          { id: "bt11", title: "Envío de factura por email", status: "completada", date: "2024-04-03", assignee: "Ana López" },
          { id: "bt12", title: "Seguimiento de pago", status: "en_progreso", date: "2024-04-10", assignee: "Carlos Ruiz" }
        ],
        attachments: [
          { id: "att4", name: "Confirmación_envío_abril.jpg", date: "2024-04-03", type: "image" }
        ]
      },
      {
        id: "inv-005",
        month: "2023-12",
        period: "Diciembre 2023",
        amount: 85000,
        status: "vencida",
        invoiceNumber: "F-2023-145",
        invoiceDate: "2023-12-05",
        dueDate: "2023-12-20",
        paidDate: null,
        tasks: [
          { id: "bt13", title: "Envío de factura", status: "completada", date: "2023-12-05", assignee: "Ana López" },
          { id: "bt14", title: "Primer recordatorio", status: "completada", date: "2023-12-18", assignee: "Ana López" },
          { id: "bt15", title: "Segundo recordatorio", status: "completada", date: "2023-12-22", assignee: "Carlos Ruiz" },
          { id: "bt16", title: "Llamada de cobranza", status: "completada", date: "2024-01-05", assignee: "Carlos Ruiz" },
          { id: "bt17", title: "Escalar a gerencia", status: "pendiente", date: "2024-01-15", assignee: "Ana López" }
        ],
        attachments: [
          { id: "att5", name: "Recordatorio_1_dic.jpg", date: "2023-12-18", type: "image" },
          { id: "att6", name: "Recordatorio_2_dic.jpg", date: "2023-12-22", type: "image" }
        ]
      }
    ]
  },
  // Google Drive Documents
  driveConnected: true,
  driveRootFolder: "https://drive.google.com/drive/folders/1ABC123xyz",
  // Google Calendar
  calendarConnected: true,
  calendarId: "proyecto-q2-2024@group.calendar.google.com",
  // RSS Pipeline - Social Media Content Grid
  rssPipeline: {
    stages: [
      { id: "idea", name: "Idea", color: "#6366f1" },
      { id: "copywriting", name: "Copywriting", color: "#8b5cf6" },
      { id: "diseno", name: "Diseño", color: "#ec4899" },
      { id: "revision_interna", name: "Revisión Interna", color: "#f59e0b" },
      { id: "aprobacion_cliente", name: "Aprobación Cliente", color: "#3b82f6" },
      { id: "programado", name: "Programado", color: "#10b981" },
      { id: "publicado", name: "Publicado", color: "#22c55e" },
      { id: "finalizado", name: "Finalizado", color: "#059669" }
    ],
    items: [
      { id: "rss1", title: "Post Lanzamiento Campaña", platform: "instagram", type: "imagen", stage: "publicado", scheduledDate: "2024-04-01", dueDate: "2024-04-01", createdAt: "2024-03-20", assignee: { name: "Ana López", initials: "AL" }, description: "¡Llegó Coca-Cola Zero! Sin azúcar, mismo sabor.", hashtags: ["#CocaColaZero", "#SinAzucar"], priority: "alta", hours: 4, hoursLogged: 4 },
      { id: "rss2", title: "Story Detrás de Cámaras", platform: "instagram", type: "story", stage: "publicado", scheduledDate: "2024-04-01", dueDate: "2024-04-01", createdAt: "2024-03-22", assignee: { name: "Carlos Ruiz", initials: "CR" }, description: "Así se vivió el lanzamiento", hashtags: ["#BTS"], priority: "media", hours: 2, hoursLogged: 2 },
      { id: "rss3", title: "Reel Tendencia", platform: "instagram", type: "reel", stage: "aprobacion_cliente", scheduledDate: "2024-04-08", dueDate: "2024-04-08", createdAt: "2024-03-25", assignee: { name: "Ana López", initials: "AL" }, description: "POV: Cuando descubres Coca-Cola Zero", hashtags: ["#POV", "#CocaColaZero"], priority: "alta", hours: 6, hoursLogged: 4 },
      { id: "rss4", title: "Post Beneficios", platform: "facebook", type: "imagen", stage: "diseno", scheduledDate: "2024-04-10", dueDate: "2024-04-10", createdAt: "2024-03-28", assignee: { name: "Ana López", initials: "AL" }, description: "5 razones para elegir Coca-Cola Zero", hashtags: ["#Beneficios"], priority: "media", hours: 3, hoursLogged: 1 },
      { id: "rss5", title: "Video Testimonial", platform: "tiktok", type: "video", stage: "revision_interna", scheduledDate: "2024-04-12", dueDate: "2024-04-12", createdAt: "2024-03-30", assignee: { name: "Carlos Ruiz", initials: "CR" }, description: "Real fans, real taste", hashtags: ["#Testimonial"], priority: "alta", hours: 8, hoursLogged: 5 },
      { id: "rss6", title: "Carrusel Productos", platform: "instagram", type: "carrusel", stage: "copywriting", scheduledDate: "2024-04-15", dueDate: "2024-04-15", createdAt: "2024-04-01", assignee: { name: "Ana López", initials: "AL" }, description: "", hashtags: [], priority: "media", hours: 4, hoursLogged: 0.5 },
      { id: "rss7", title: "Post Promoción Semanal", platform: "facebook", type: "imagen", stage: "idea", scheduledDate: "2024-04-18", dueDate: "2024-04-18", createdAt: "2024-04-02", assignee: { name: "Carlos Ruiz", initials: "CR" }, description: "", hashtags: [], priority: "baja", hours: 2, hoursLogged: 0 },
      { id: "rss8", title: "Story Encuesta", platform: "instagram", type: "story", stage: "programado", scheduledDate: "2024-04-05", dueDate: "2024-04-05", createdAt: "2024-03-28", assignee: { name: "Carlos Ruiz", initials: "CR" }, description: "¿Ya probaste Coca-Cola Zero?", hashtags: ["#Encuesta"], priority: "media", hours: 1, hoursLogged: 1 },
      { id: "rss9", title: "TikTok Challenge", platform: "tiktok", type: "video", stage: "idea", scheduledDate: "2024-04-20", dueDate: "2024-04-20", createdAt: "2024-04-03", assignee: { name: "Ana López", initials: "AL" }, description: "", hashtags: [], priority: "alta", hours: 10, hoursLogged: 0 },
      { id: "rss10", title: "Post Cierre de Mes", platform: "instagram", type: "imagen", stage: "finalizado", scheduledDate: "2024-03-31", dueDate: "2024-03-31", createdAt: "2024-03-15", assignee: { name: "Ana López", initials: "AL" }, description: "Gracias por un mes increíble", hashtags: ["#Gracias"], priority: "media", hours: 3, hoursLogged: 3 }
    ]
  },
  // Client Requests
  clientRequests: [
    {
      id: "req1",
      title: "Cambio de copy en banner principal",
      description: "Necesitamos modificar el texto del banner principal para la campaña de Coca-Cola Zero. El nuevo copy debe enfatizar 'Sin azúcar, mismo sabor'.",
      status: "pendiente",
      priority: "alta",
      type: "cambio",
      requestedBy: { name: "Roberto Hernández", position: "Director de Marketing" },
      createdAt: "2024-04-05T10:30:00",
      dueDate: "2024-04-08",
      attachments: 2,
      comments: 3
    },
    {
      id: "req2",
      title: "Agregar 5 stories adicionales para Instagram",
      description: "El cliente solicita 5 stories adicionales para la semana del lanzamiento. Deben seguir la misma línea gráfica de la campaña.",
      status: "en_revision",
      priority: "media",
      type: "adicional",
      requestedBy: { name: "Laura Martínez", position: "Brand Manager" },
      createdAt: "2024-04-03T14:15:00",
      dueDate: "2024-04-10",
      attachments: 0,
      comments: 5
    },
    {
      id: "req3",
      title: "Aprobación de artes finales para pauta",
      description: "Se requiere aprobación de los 8 formatos de pauta digital antes de subir a plataformas.",
      status: "aprobada",
      priority: "alta",
      type: "aprobacion",
      requestedBy: { name: "Roberto Hernández", position: "Director de Marketing" },
      createdAt: "2024-04-01T09:00:00",
      dueDate: "2024-04-02",
      attachments: 8,
      comments: 2
    },
    {
      id: "req4",
      title: "Video adicional para TikTok",
      description: "Producir un video corto (15-30 seg) con formato vertical para TikTok siguiendo las tendencias actuales.",
      status: "en_progreso",
      priority: "media",
      type: "adicional",
      requestedBy: { name: "Miguel Ángel Torres", position: "Coordinador de Proyectos" },
      createdAt: "2024-04-04T11:45:00",
      dueDate: "2024-04-12",
      attachments: 1,
      comments: 7
    },
    {
      id: "req5",
      title: "Corrección de colores en diseños",
      description: "Los tonos rojos no coinciden con el Pantone oficial de la marca. Favor de ajustar todos los diseños.",
      status: "completada",
      priority: "alta",
      type: "correccion",
      requestedBy: { name: "Laura Martínez", position: "Brand Manager" },
      createdAt: "2024-03-28T16:20:00",
      dueDate: "2024-03-29",
      attachments: 4,
      comments: 6
    }
  ],
  calendarTasks: [
    { id: "t1", title: "Kickoff Meeting", date: "2024-03-01", endDate: "2024-03-01", type: "meeting", priority: "alta", status: "completada" },
    { id: "t2", title: "Entrega Brief Creativo", date: "2024-03-05", endDate: "2024-03-05", type: "deliverable", priority: "alta", status: "completada" },
    { id: "t3", title: "Revisión Diseños v1", date: "2024-03-10", endDate: "2024-03-10", type: "review", priority: "media", status: "completada" },
    { id: "t4", title: "Producción Videos", date: "2024-03-12", endDate: "2024-03-20", type: "task", priority: "alta", status: "completada" },
    { id: "t5", title: "Aprobación Cliente", date: "2024-03-22", endDate: "2024-03-22", type: "milestone", priority: "alta", status: "completada" },
    { id: "t6", title: "Lanzamiento Campaña", date: "2024-04-01", endDate: "2024-04-01", type: "milestone", priority: "alta", status: "en_progreso" },
    { id: "t7", title: "Optimización Pauta", date: "2024-04-05", endDate: "2024-04-15", type: "task", priority: "media", status: "en_progreso" },
    { id: "t8", title: "Reporte Semanal", date: "2024-04-08", endDate: "2024-04-08", type: "report", priority: "baja", status: "pendiente" },
    { id: "t9", title: "Review Métricas", date: "2024-04-15", endDate: "2024-04-15", type: "review", priority: "media", status: "pendiente" },
    { id: "t10", title: "Entrega Reporte Mensual", date: "2024-04-30", endDate: "2024-04-30", type: "deliverable", priority: "alta", status: "pendiente" },
    { id: "t11", title: "Cierre Q2", date: "2024-06-30", endDate: "2024-06-30", type: "milestone", priority: "alta", status: "pendiente" }
  ],
  documentFolders: [
    {
      id: "df1",
      name: "Briefs y Estrategia",
      icon: "briefcase",
      driveLink: "https://drive.google.com/drive/folders/1Brief123",
      filesCount: 12,
      lastModified: "2024-03-15"
    },
    {
      id: "df2",
      name: "Diseños y Creativos",
      icon: "palette",
      driveLink: "https://drive.google.com/drive/folders/1Design456",
      filesCount: 45,
      lastModified: "2024-03-18"
    },
    {
      id: "df3",
      name: "Videos y Animaciones",
      icon: "video",
      driveLink: "https://drive.google.com/drive/folders/1Video789",
      filesCount: 8,
      lastModified: "2024-03-17"
    },
    {
      id: "df4",
      name: "Reportes y Métricas",
      icon: "chart",
      driveLink: "https://drive.google.com/drive/folders/1Report012",
      filesCount: 24,
      lastModified: "2024-03-19"
    },
    {
      id: "df5",
      name: "Aprobaciones Cliente",
      icon: "check",
      driveLink: "https://drive.google.com/drive/folders/1Approval345",
      filesCount: 15,
      lastModified: "2024-03-16"
    },
    {
      id: "df6",
      name: "Assets y Recursos",
      icon: "image",
      driveLink: "https://drive.google.com/drive/folders/1Assets678",
      filesCount: 67,
      lastModified: "2024-03-14"
    }
  ]
}

const mockTasks = [
  { id: "1", title: "Diseño de key visuals", status: "completado", priority: "alta", assignee: "AL", assigneeName: "Ana López", dueDate: "2024-03-15", createdAt: "2024-03-01", hours: 16, description: "Crear los key visuals para la campaña de Q2" },
  { id: "2", title: "Desarrollo de contenido para redes", status: "en_progreso", priority: "alta", assignee: "CR", assigneeName: "Carlos Ruiz", dueDate: "2024-04-01", createdAt: "2024-03-10", hours: 24, description: "Contenido para Instagram, Facebook y TikTok" },
  { id: "3", title: "Configuración de campañas en Meta", status: "en_progreso", priority: "media", assignee: "JP", assigneeName: "Juan Pérez", dueDate: "2024-04-10", createdAt: "2024-03-15", hours: 8, description: "Setup de audiencias y presupuestos en Meta Ads" },
  { id: "4", title: "Producción de videos cortos", status: "pendiente", priority: "alta", assignee: "AL", assigneeName: "Ana López", dueDate: "2024-04-20", createdAt: "2024-03-20", hours: 32, description: "Videos para reels y TikTok" },
  { id: "5", title: "Análisis de métricas semanales", status: "en_progreso", priority: "media", assignee: "MG", assigneeName: "María García", dueDate: "2024-04-05", createdAt: "2024-03-25", hours: 4, description: "Dashboard con métricas de performance" },
  { id: "6", title: "Optimización de pauta", status: "vencido", priority: "alta", assignee: "JP", assigneeName: "Juan Pérez", dueDate: "2024-03-25", createdAt: "2024-03-05", hours: 12, description: "Ajustar presupuestos según rendimiento" },
]

const mockDeliverables = [
  { id: "d1", name: "Key Visuals Campaña", status: "aprobado", dueDate: "2024-03-15", files: 5 },
  { id: "d2", name: "Calendario de Contenidos Abril", status: "aprobado", dueDate: "2024-03-28", files: 1 },
  { id: "d3", name: "Videos Promocionales", status: "pendiente", dueDate: "2024-04-20", files: 0 },
  { id: "d4", name: "Reporte de Métricas Q1", status: "aprobado", dueDate: "2024-04-01", files: 1 },
  { id: "d5", name: "Creativos para Pauta", status: "revision", dueDate: "2024-04-05", files: 12 },
]

const statusConfig = {
  completado: { label: "Completado", color: "bg-green-500", textColor: "text-green-600" },
  en_progreso: { label: "En Progreso", color: "bg-blue-500", textColor: "text-blue-600" },
  pendiente: { label: "Pendiente", color: "bg-gray-400", textColor: "text-gray-600" },
  vencido: { label: "Vencido", color: "bg-red-500", textColor: "text-red-600" },
}

const deliverableStatusConfig = {
  aprobado: { label: "Aprobado", color: "bg-green-500" },
  pendiente: { label: "Pendiente", color: "bg-amber-500" },
  revision: { label: "En Revisión", color: "bg-blue-500" },
  rechazado: { label: "Rechazado", color: "bg-red-500" },
}

const priorityConfig = {
  alta: { label: "Alta", color: "text-red-600 bg-red-50 border-red-200" },
  media: { label: "Media", color: "text-amber-600 bg-amber-50 border-amber-200" },
  baja: { label: "Baja", color: "text-green-600 bg-green-50 border-green-200" },
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const [activeTab, setActiveTab] = useState("overview")
  const [showLinkFolderDialog, setShowLinkFolderDialog] = useState(false)
  const [editingFolder, setEditingFolder] = useState<any>(null)
  const [newFolderName, setNewFolderName] = useState("")
  const [newFolderLink, setNewFolderLink] = useState("")
  const [newFolderIcon, setNewFolderIcon] = useState("folder")
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false)
  const [editingContact, setEditingContact] = useState<any>(null)
  const [contactPermissions, setContactPermissions] = useState<Record<string, string>>({})
  const [showEditTaskDialog, setShowEditTaskDialog] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [tasks, setTasks] = useState(mockTasks)
  const [showGoogleCalendarDialog, setShowGoogleCalendarDialog] = useState(false)
  const [calendarConnected, setCalendarConnected] = useState(mockProject.calendarConnected)
  const [connectingCalendar, setConnectingCalendar] = useState(false)
  const [showRequestDetailDialog, setShowRequestDetailDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [clientRequests, setClientRequests] = useState(mockProject.clientRequests)
  
const toggleTaskComplete = (taskId: string) => {
  const task = tasks.find(t => t.id === taskId)
  if (!task) return
  
  const newStatus = task.status === "completado" ? "pendiente" : "completado"
  
  setTasks(prevTasks =>
  prevTasks.map(t => {
  if (t.id === taskId) {
  return { ...t, status: newStatus }
  }
  return t
  })
  )
  
  // If task has a linked request, update the request status accordingly
  if ((task as any).linkedRequestId) {
    if (newStatus === "completado") {
      setClientRequests(prev => 
        prev.map(r => r.id === (task as any).linkedRequestId 
          ? { ...r, status: 'completada' } 
          : r
        )
      )
    } else {
      // If unmarking as complete, set request back to en_progreso
      setClientRequests(prev => 
        prev.map(r => r.id === (task as any).linkedRequestId 
          ? { ...r, status: 'en_progreso' } 
          : r
        )
      )
    }
  }
  }
  
  const modulesList = [
    { key: "resumen", label: "Resumen", icon: BarChart3, description: "Vista general del proyecto" },
    { key: "tareas", label: "Tareas", icon: ListTodo, description: "Lista de tareas y avances" },
    { key: "entregables", label: "Entregables", icon: Package, description: "Archivos y entregas del proyecto" },
    { key: "equipo", label: "Equipo", icon: Users, description: "Miembros asignados al proyecto" },
    { key: "documentos", label: "Documentos", icon: FolderOpen, description: "Carpetas y archivos compartidos" },
    { key: "calendario", label: "Calendario", icon: Calendar, description: "Fechas importantes y eventos" },
    { key: "solicitudes", label: "Solicitudes", icon: MessageSquarePlus, description: "Solicitudes de cambios del cliente" },
    { key: "parrilla_rss", label: "Parrilla RSS", icon: Rss, description: "Calendario de publicaciones" },
    { key: "facturacion", label: "Facturación", icon: Receipt, description: "Facturas y pagos del proyecto" },
  ]
  
  const project = mockProject
  const hoursOverBudget = project.hoursWorked > project.hoursBudget
  const budgetOverspent = project.spent > project.budget

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/orbit-tasksflow/projects">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge variant={project.status === "completado" ? "default" : "secondary"}>
                {project.status === "en_progreso" ? "En Progreso" : project.status}
              </Badge>
              <Badge variant="outline" className={priorityConfig[project.priority as keyof typeof priorityConfig].color}>
                Prioridad {priorityConfig[project.priority as keyof typeof priorityConfig].label}
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              {project.client} - {project.account}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/orbit-tasksflow/projects/${project.id}/settings`}>
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Link>
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Target className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{project.progress}%</p>
                <p className="text-xs text-muted-foreground">Avance</p>
              </div>
            </div>
            <Progress value={project.progress} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{project.tasks.completed}/{project.tasks.total}</p>
                <p className="text-xs text-muted-foreground">Tareas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Package className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{project.deliverables.approved}/{project.deliverables.total}</p>
                <p className="text-xs text-muted-foreground">Entregables</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={hoursOverBudget ? "border-red-200 dark:border-red-800" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${hoursOverBudget ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
                <Clock className={`h-4 w-4 ${hoursOverBudget ? "text-red-600" : "text-amber-600"}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${hoursOverBudget ? "text-red-600" : ""}`}>
                  {project.hoursWorked}h
                </p>
                <p className="text-xs text-muted-foreground">/ {project.hoursBudget}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={budgetOverspent ? "border-red-200 dark:border-red-800" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${budgetOverspent ? "bg-red-100 dark:bg-red-900/30" : "bg-green-100 dark:bg-green-900/30"}`}>
                <TrendingUp className={`h-4 w-4 ${budgetOverspent ? "text-red-600" : "text-green-600"}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${budgetOverspent ? "text-red-600" : ""}`}>
                  ${(project.spent / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-muted-foreground">/ ${(project.budget / 1000).toFixed(0)}k</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {project.tasks.overdue > 0 && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-600">
                  {project.tasks.overdue} tarea{project.tasks.overdue > 1 ? "s" : ""} vencida{project.tasks.overdue > 1 ? "s" : ""}
                </p>
                <p className="text-sm text-red-600/80">
                  Hay tareas que requieren atención inmediata
                </p>
              </div>
              <Button variant="destructive" size="sm" className="ml-auto">
                Ver Tareas Vencidas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-2 p-2 bg-muted/50 rounded-xl">
          <TabsTrigger 
            value="overview" 
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted transition-all"
          >
            <BarChart3 className="h-5 w-5" />
            <span>Resumen</span>
          </TabsTrigger>
          <TabsTrigger 
            value="tasks" 
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-blue-50 dark:hover:bg-blue-950 transition-all"
          >
            <ListTodo className="h-5 w-5" />
            <span>Tareas</span>
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs data-[state=active]:bg-blue-400/30 data-[state=active]:text-white">{project.tasks.total}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="deliverables" 
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-all"
          >
            <Package className="h-5 w-5" />
            <span>Entregables</span>
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{project.deliverables.total}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="documents" 
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-amber-50 dark:hover:bg-amber-950 transition-all"
          >
            <FolderOpen className="h-5 w-5" />
            <span>Documentos</span>
          </TabsTrigger>
          <TabsTrigger 
            value="calendar" 
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg data-[state=active]:bg-rose-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-rose-50 dark:hover:bg-rose-950 transition-all"
          >
            <Calendar className="h-5 w-5" />
            <span>Calendario</span>
          </TabsTrigger>
          <TabsTrigger 
            value="requests" 
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-cyan-50 dark:hover:bg-cyan-950 transition-all"
          >
            <MessageSquarePlus className="h-5 w-5" />
            <span>Solicitudes</span>
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{project.clientRequests.length}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="rss" 
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-orange-50 dark:hover:bg-orange-950 transition-all"
          >
            <Rss className="h-5 w-5" />
            <span>Parrilla RSS</span>
          </TabsTrigger>
          <TabsTrigger 
            value="billing" 
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg data-[state=active]:bg-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-teal-50 dark:hover:bg-teal-950 transition-all"
          >
            <Receipt className="h-5 w-5" />
            <span>Facturación</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Project Info */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Información del Proyecto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Descripción</p>
                  <p>{project.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Fecha Inicio</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {project.startDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Fecha Entrega</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {project.dueDate}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Servicios</p>
                  <div className="flex flex-wrap gap-2">
                    {project.services.map((service, i) => (
                      <Badge key={i} variant="outline">{service}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Responsables</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {project.manager.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{project.manager.name}</p>
                    <p className="text-sm text-muted-foreground">Project Manager</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {project.coordinator.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{project.coordinator.name}</p>
                    <p className="text-sm text-muted-foreground">Coordinador</p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Equipo ({project.team.length})</p>
                  <div className="flex -space-x-2">
                    {project.team.map((member) => (
                      <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Social Links & Website + Client Contacts */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Social Links & Website */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Redes Sociales y Página Web
                </CardTitle>
                <CardDescription>Links del cliente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {project.socialLinks.website && (
                    <a 
                      href={project.socialLinks.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Globe className="h-5 w-5 text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Página Web</p>
                        <p className="text-xs text-muted-foreground truncate">{project.socialLinks.website.replace("https://", "")}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                  {project.socialLinks.facebook && (
                    <a 
                      href={project.socialLinks.facebook} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Facebook className="h-5 w-5 text-blue-700" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Facebook</p>
                        <p className="text-xs text-muted-foreground truncate">@{project.socialLinks.facebook.split("/").pop()}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                  {project.socialLinks.instagram && (
                    <a 
                      href={project.socialLinks.instagram} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Instagram className="h-5 w-5 text-pink-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Instagram</p>
                        <p className="text-xs text-muted-foreground truncate">@{project.socialLinks.instagram.split("/").pop()}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                  {project.socialLinks.twitter && (
                    <a 
                      href={project.socialLinks.twitter} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Twitter className="h-5 w-5 text-sky-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Twitter / X</p>
                        <p className="text-xs text-muted-foreground truncate">@{project.socialLinks.twitter.split("/").pop()}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                  {project.socialLinks.linkedin && (
                    <a 
                      href={project.socialLinks.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Linkedin className="h-5 w-5 text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">LinkedIn</p>
                        <p className="text-xs text-muted-foreground truncate">{project.socialLinks.linkedin.split("/").pop()}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                  {project.socialLinks.youtube && (
                    <a 
                      href={project.socialLinks.youtube} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Youtube className="h-5 w-5 text-red-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">YouTube</p>
                        <p className="text-xs text-muted-foreground truncate">{project.socialLinks.youtube.split("/").pop()}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                  {project.socialLinks.tiktok && (
                    <a 
                      href={project.socialLinks.tiktok} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">TikTok</p>
                        <p className="text-xs text-muted-foreground truncate">{project.socialLinks.tiktok.split("/").pop()}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Client Contacts */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Contactos del Cliente
                  </CardTitle>
                  <CardDescription>{project.clientContacts.length} contacto(s) registrado(s)</CardDescription>
                </div>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.clientContacts.map((contact) => (
                    <div 
                      key={contact.id} 
                      className={`p-3 rounded-lg border ${contact.isPrimary ? 'bg-primary/5 border-primary/30' : 'bg-muted/50 border-transparent'}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {contact.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{contact.name}</p>
                              {contact.isPrimary && (
                                <Badge variant="secondary" className="text-xs">
                                  <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                                  Principal
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{contact.position}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingContact(contact)
                              setContactPermissions(contact.permissions || {})
                              setShowPermissionsDialog(true)
                            }}
                            title="Configurar permisos"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar contacto">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" title="Eliminar">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <a 
                          href={`mailto:${contact.email}`} 
                          className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Mail className="h-4 w-4" />
                          {contact.email}
                        </a>
                        <a 
                          href={`tel:${contact.phone}`} 
                          className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Phone className="h-4 w-4" />
                          {contact.phone}
                        </a>
                      </div>
                      {/* Permission badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t">
                        <span className="text-xs text-muted-foreground mr-1">Acceso:</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-400">
                          Resumen
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-400">
                          Tareas
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-gray-50 dark:bg-gray-800">
                          Entregables
                        </Badge>
                        {contact.isPrimary && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            +3 más
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-xs ml-auto"
                          onClick={() => {
                            setEditingContact(contact)
                            setContactPermissions(contact.permissions || {})
                            setShowPermissionsDialog(true)
                          }}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Configurar Acceso
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tareas del Proyecto</CardTitle>
                <CardDescription>
                  {tasks.filter(t => t.status === "completado").length} de {tasks.length} completadas
                </CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Tarea
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Tarea</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Asignado</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead className="text-right">Horas</TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => {
                    const status = statusConfig[task.status as keyof typeof statusConfig]
                    const priority = priorityConfig[task.priority as keyof typeof priorityConfig]
                    return (
                      <TableRow 
                        key={task.id} 
                        className={`cursor-pointer hover:bg-muted/50 transition-colors ${task.status === "vencido" ? "bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50" : ""}`}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={task.status === "completado"} 
                            onCheckedChange={() => toggleTaskComplete(task.id)}
                          />
                        </TableCell>
<TableCell>
  <div className="flex items-center gap-2">
    <Link
    href={`/orbit-tasksflow/tasks/${task.id}`}
    className="font-medium text-primary hover:underline"
    >
    {task.title}
    </Link>
    {(task as any).linkedRequestId && (
      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200">
        Solicitud
      </Badge>
    )}
  </div>
  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
  </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${status.color}`} />
                            <span className={`text-sm ${status.textColor}`}>{status.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={priority.color}>
                            {priority.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {task.assignee}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground hidden lg:inline">{task.assigneeName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={task.status === "vencido" ? "text-red-600 font-medium" : ""}>
                            <div className="text-sm">{task.dueDate}</div>
                            <div className="text-xs text-muted-foreground">Creada: {task.createdAt}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{task.hours}h</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/orbit-tasksflow/tasks/${task.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Detalle
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => {
                                setEditingTask(task)
                                setShowEditTaskDialog(true)
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash className="h-4 w-4 mr-2" />
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
        </TabsContent>

        {/* Deliverables Tab */}
        <TabsContent value="deliverables" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Entregables</CardTitle>
                <CardDescription>
                  {project.deliverables.approved} de {project.deliverables.total} aprobados
                </CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Entregable
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockDeliverables.map((deliverable) => {
                  const status = deliverableStatusConfig[deliverable.status as keyof typeof deliverableStatusConfig]
                  return (
                    <Card key={deliverable.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${status.color}`} />
                            <span className="text-sm font-medium">{status.label}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                        <h4 className="font-semibold mb-2">{deliverable.name}</h4>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {deliverable.dueDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {deliverable.files} archivos
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          {/* Google Drive Connection Status */}
          <Card className={project.driveConnected ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/30" : "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30"}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${project.driveConnected ? "bg-green-100 dark:bg-green-900/50" : "bg-amber-100 dark:bg-amber-900/50"}`}>
                    <svg className="h-6 w-6" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">
                      {project.driveConnected ? "Google Drive Conectado" : "Google Drive No Conectado"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {project.driveConnected 
                        ? `${project.documentFolders.length} carpetas configuradas` 
                        : "Conecta Google Drive para gestionar documentos"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {project.driveConnected ? (
                    <>
                      <Button variant="outline" size="sm" asChild>
                        <a href={project.driveRootFolder} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Abrir en Drive
                        </a>
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar
                      </Button>
                    </>
                  ) : (
                    <Button size="sm">
                      <Link2 className="h-4 w-4 mr-2" />
                      Conectar Google Drive
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Folders */}
          {project.driveConnected && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Carpetas de Documentos
                  </CardTitle>
                  <CardDescription>
                    Organiza los documentos del proyecto con enlaces a Google Drive
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => {
                  setEditingFolder(null)
                  setNewFolderName("")
                  setNewFolderLink("")
                  setNewFolderIcon("folder")
                  setShowLinkFolderDialog(true)
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Carpeta
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {project.documentFolders.map((folder) => {
                    const iconMap: Record<string, React.ReactNode> = {
                      briefcase: <Briefcase className="h-6 w-6 text-blue-600" />,
                      palette: <Palette className="h-6 w-6 text-purple-600" />,
                      video: <Video className="h-6 w-6 text-red-600" />,
                      chart: <PieChart className="h-6 w-6 text-green-600" />,
                      check: <CheckSquare className="h-6 w-6 text-emerald-600" />,
                      image: <Image className="h-6 w-6 text-orange-600" />,
                      folder: <FolderOpen className="h-6 w-6 text-gray-600" />
                    }
                    const hasLink = folder.driveLink && folder.driveLink !== ""
                    return (
                      <Card key={folder.id} className={`relative hover:shadow-md transition-all ${hasLink ? 'hover:border-primary/50' : 'border-dashed border-2'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className={`p-2 rounded-lg ${hasLink ? 'bg-muted' : 'bg-amber-50 dark:bg-amber-950/30'}`}>
                              {iconMap[folder.icon] || <FolderOpen className="h-6 w-6 text-gray-600" />}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {hasLink && (
                                  <DropdownMenuItem asChild>
                                    <a href={folder.driveLink} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Abrir en Drive
                                    </a>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => {
                                  setEditingFolder(folder)
                                  setNewFolderName(folder.name)
                                  setNewFolderLink(folder.driveLink || "")
                                  setNewFolderIcon(folder.icon)
                                  setShowLinkFolderDialog(true)
                                }}>
                                  <Link2 className="h-4 w-4 mr-2" />
                                  {hasLink ? "Cambiar Enlace Drive" : "Vincular con Drive"}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar Carpeta
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          {hasLink ? (
                            <a
                              href={folder.driveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group block"
                            >
                              <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                                {folder.name}
                              </h4>
                              <div className="flex items-center gap-1 text-xs text-green-600 mb-2">
                                <svg className="h-3 w-3" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                                  <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                                  <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                                  <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                                  <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                                  <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                                  <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                                </svg>
                                <span>Vinculado con Google Drive</span>
                              </div>
                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <FileIcon className="h-3.5 w-3.5" />
                                  {folder.filesCount} archivos
                                </span>
                                <span>{folder.lastModified}</span>
                              </div>
                            </a>
                          ) : (
                            <div>
                              <h4 className="font-semibold mb-1">{folder.name}</h4>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full mt-2 border-dashed"
                                onClick={() => {
                                  setEditingFolder(folder)
                                  setNewFolderName(folder.name)
                                  setNewFolderLink("")
                                  setNewFolderIcon(folder.icon)
                                  setShowLinkFolderDialog(true)
                                }}
                              >
                                <Link2 className="h-4 w-4 mr-2" />
                                Vincular con Google Drive
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Add More Section */}
                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-muted-foreground">Vincular rápidamente una carpeta de Google Drive</p>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setEditingFolder(null)
                        setNewFolderName("")
                        setNewFolderLink("")
                        setNewFolderIcon("folder")
                        setShowLinkFolderDialog(true)
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configuración Avanzada
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Nombre de la carpeta" 
                      className="max-w-[200px]"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                    />
                    <Input 
                      placeholder="https://drive.google.com/drive/folders/..." 
                      className="flex-1"
                      value={newFolderLink}
                      onChange={(e) => setNewFolderLink(e.target.value)}
                    />
                    <Button 
                      variant="outline"
                      disabled={!newFolderName.trim() || !newFolderLink.trim()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Pega el enlace completo de la carpeta de Google Drive (ej: https://drive.google.com/drive/folders/abc123...)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Links */}
          {project.driveConnected && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Enlaces Rápidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://docs.google.com/document/create" target="_blank" rel="noopener noreferrer">
                      <FileIcon className="h-4 w-4 mr-2" />
                      Nuevo Documento
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://docs.google.com/spreadsheets/create" target="_blank" rel="noopener noreferrer">
                      <PieChart className="h-4 w-4 mr-2" />
                      Nueva Hoja de Cálculo
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://docs.google.com/presentation/create" target="_blank" rel="noopener noreferrer">
                      <Palette className="h-4 w-4 mr-2" />
                      Nueva Presentación
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4">
          {/* Google Calendar Connection Status */}
          <Card className={calendarConnected ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/30" : "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30"}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${calendarConnected ? "bg-green-100 dark:bg-green-900/50" : "bg-amber-100 dark:bg-amber-900/50"}`}>
                    <svg className="h-6 w-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.316 5.684H24v12.632h-5.684V5.684z" fill="#1a73e8"/>
                      <path d="M5.684 24v-5.684h12.632V24H5.684z" fill="#1a73e8"/>
                      <path d="M18.316 5.684V0H1.895A1.895 1.895 0 0 0 0 1.895v16.421h5.684V5.684h12.632z" fill="#ea4335"/>
                      <path d="M5.684 18.316H0v3.789A1.895 1.895 0 0 0 1.895 24h3.789v-5.684z" fill="#188038"/>
                      <path d="M24 5.684h-5.684V0h3.789A1.895 1.895 0 0 1 24 1.895v3.789z" fill="#1967d2"/>
                      <path d="M18.316 18.316H24V24h-3.789a1.895 1.895 0 0 1-1.895-1.895v-3.789z" fill="#1967d2"/>
                      <path d="M5.684 5.684h12.632v12.632H5.684z" fill="#fff"/>
                      <path d="M15.789 9.474H8.211v1.263h7.578V9.474zM15.789 12h-7.578v1.263h7.578V12zM15.789 14.526H8.211v1.263h7.578v-1.263z" fill="#1a73e8"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">
                      {calendarConnected ? "Google Calendar Conectado" : "Google Calendar No Conectado"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {calendarConnected 
                        ? `${project.calendarTasks.length + tasks.length + project.rssPipeline.items.length} eventos sincronizados` 
                        : "Conecta Google Calendar para sincronizar tareas y eventos"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {calendarConnected ? (
                    <>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`https://calendar.google.com/calendar/r?cid=${project.calendarId}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Abrir en Calendar
                        </a>
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => setShowGoogleCalendarDialog(true)}>
                      <Link2 className="h-4 w-4 mr-2" />
                      Conectar Google Calendar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendar View */}
          {calendarConnected && (
            <>
              {/* Mini Calendar + Task List */}
              <div className="grid gap-4 lg:grid-cols-3">
                {/* Calendar Grid */}
                <Card className="lg:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle>Calendario del Proyecto</CardTitle>
                      <CardDescription>Marzo - Junio 2024</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">Hoy</Button>
                      <Button variant="outline" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Month View */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-center">Abril 2024</h3>
                      <div className="grid grid-cols-7 gap-1 text-center text-sm">
                        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(day => (
                          <div key={day} className="p-2 font-medium text-muted-foreground">{day}</div>
                        ))}
                        {/* Empty cells for days before month starts (April 2024 starts on Monday) */}
                        <div className="p-2 text-muted-foreground/50"></div>
                        {/* Calendar days */}
                        {Array.from({ length: 30 }, (_, i) => {
                          const day = i + 1
                          const dateStr = `2024-04-${day.toString().padStart(2, '0')}`
                          const dayTasks = project.calendarTasks.filter(t => t.date === dateStr || (t.date <= dateStr && t.endDate >= dateStr))
                          const hasTask = dayTasks.length > 0
                          const isToday = day === 8
                          return (
                            <div 
                              key={day} 
                              className={`p-1 min-h-[60px] rounded-md border ${isToday ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50'}`}
                            >
                              <span className={`text-sm ${isToday ? 'font-bold text-primary' : ''}`}>{day}</span>
                              {hasTask && (
                                <div className="mt-1 space-y-0.5">
                                  {dayTasks.slice(0, 2).map(task => {
                                    const typeColors: Record<string, string> = {
                                      meeting: 'bg-blue-500',
                                      deliverable: 'bg-purple-500',
                                      review: 'bg-amber-500',
                                      task: 'bg-green-500',
                                      milestone: 'bg-red-500',
                                      report: 'bg-cyan-500',
                                      rss: 'bg-orange-500'
                                    }
                                    return (
                                      <Link 
                                        key={task.id} 
                                        href={`/orbit-tasksflow/tasks/${task.id}`}
                                        className={`text-[10px] px-1 py-0.5 rounded truncate text-white block hover:opacity-80 transition-opacity ${typeColors[task.type] || 'bg-gray-500'}`}
                                        title={task.title}
                                      >
                                        {task.title.length > 10 ? task.title.substring(0, 10) + '...' : task.title}
                                      </Link>
                                    )
                                  })}
                                  {dayTasks.length > 2 && (
                                    <div className="text-[10px] text-muted-foreground">+{dayTasks.length - 2} más</div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Tasks */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Próximos Eventos</CardTitle>
                    <CardDescription>Tareas y entregas pendientes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {project.calendarTasks
                      .filter(t => t.status !== 'completada')
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .slice(0, 6)
                      .map(task => {
                        const typeConfig: Record<string, { color: string, icon: React.ReactNode, label: string }> = {
                          meeting: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300', icon: <Users className="h-3 w-3" />, label: 'Reunión' },
                          deliverable: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300', icon: <Package className="h-3 w-3" />, label: 'Entregable' },
                          review: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300', icon: <Eye className="h-3 w-3" />, label: 'Revisión' },
                          task: { color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300', icon: <ListTodo className="h-3 w-3" />, label: 'Tarea' },
                          milestone: { color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300', icon: <Target className="h-3 w-3" />, label: 'Hito' },
                          report: { color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300', icon: <FileIcon className="h-3 w-3" />, label: 'Reporte' }
                        }
                        const config = typeConfig[task.type] || typeConfig.task
                        return (
                          <Link 
                            key={task.id} 
                            href={`/orbit-tasksflow/tasks/${task.id}`}
                            className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          >
                            <div className={`p-1.5 rounded ${config.color}`}>
                              {config.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate hover:text-primary transition-colors">{task.title}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(task.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
                                <Badge variant="outline" className="text-[10px] px-1">{config.label}</Badge>
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                  </CardContent>
                </Card>
              </div>

              {/* Task Timeline */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Línea de Tiempo</CardTitle>
                    <CardDescription>Visualización cronológica de tareas y eventos</CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Evento
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {project.calendarTasks.map((task, index) => {
                      const statusColors: Record<string, string> = {
                        completada: 'bg-green-500',
                        en_progreso: 'bg-blue-500',
                        pendiente: 'bg-gray-300 dark:bg-gray-600'
                      }
                      const typeColors: Record<string, string> = {
                        meeting: 'border-blue-500',
                        deliverable: 'border-purple-500',
                        review: 'border-amber-500',
                        task: 'border-green-500',
                        milestone: 'border-red-500',
                        report: 'border-cyan-500'
                      }
                      return (
                        <div key={task.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${statusColors[task.status]}`} />
                            {index < project.calendarTasks.length - 1 && (
                              <div className="w-0.5 flex-1 bg-border my-1" />
                            )}
                          </div>
                          <Link 
                            href={`/orbit-tasksflow/tasks/${task.id}`}
                            className={`flex-1 pb-4 border-l-2 pl-4 -ml-[7px] hover:bg-muted/30 rounded-r-lg transition-colors ${typeColors[task.type] || 'border-gray-300'}`}
                          >
                            <div className="flex items-center justify-between">
                              <p className={`font-medium hover:text-primary transition-colors ${task.status === 'completada' ? 'line-through text-muted-foreground' : ''}`}>
                                {task.title}
                              </p>
                              <Badge variant={task.status === 'completada' ? 'secondary' : task.status === 'en_progreso' ? 'default' : 'outline'}>
                                {task.status === 'completada' ? 'Completada' : task.status === 'en_progreso' ? 'En Progreso' : 'Pendiente'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(task.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                                {task.endDate !== task.date && (
                                  <> - {new Date(task.endDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</>
                                )}
                              </span>
                            </div>
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Sync Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Configuración de Sincronización</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="sync-tasks" className="rounded" defaultChecked />
                      <label htmlFor="sync-tasks" className="text-sm">Sincronizar tareas</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="sync-deliverables" className="rounded" defaultChecked />
                      <label htmlFor="sync-deliverables" className="text-sm">Sincronizar entregables</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="sync-milestones" className="rounded" defaultChecked />
                      <label htmlFor="sync-milestones" className="text-sm">Sincronizar hitos</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="notifications" className="rounded" defaultChecked />
                      <label htmlFor="notifications" className="text-sm">Notificaciones por email</label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Client Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          {/* Header Stats */}
          <div className="grid gap-4 md:grid-cols-5">
            {(() => {
              const stats = {
                total: project.clientRequests.length,
                pendiente: project.clientRequests.filter(r => r.status === 'pendiente').length,
                en_revision: project.clientRequests.filter(r => r.status === 'en_revision').length,
                en_progreso: project.clientRequests.filter(r => r.status === 'en_progreso').length,
                completada: project.clientRequests.filter(r => r.status === 'completada' || r.status === 'aprobada').length
              }
              return (
                <>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <MessageSquarePlus className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats.total}</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                          <ClockIcon className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-amber-600">{stats.pendiente}</p>
                          <p className="text-xs text-muted-foreground">Pendientes</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <Eye className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-600">{stats.en_revision}</p>
                          <p className="text-xs text-muted-foreground">En Revisión</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                          <RefreshCw className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-purple-600">{stats.en_progreso}</p>
                          <p className="text-xs text-muted-foreground">En Progreso</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">{stats.completada}</p>
                          <p className="text-xs text-muted-foreground">Completadas</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )
            })()}
          </div>

          {/* New Request Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Nueva Solicitud
              </CardTitle>
              <CardDescription>Crea una nueva solicitud para el equipo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2 space-y-2">
                  <Label>Título de la solicitud</Label>
                  <Input placeholder="Ej: Cambio de copy en banner principal" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Descripción</Label>
                  <textarea 
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Describe detalladamente lo que necesitas..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de solicitud</Label>
                  <Select defaultValue="cambio">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cambio">Cambio</SelectItem>
                      <SelectItem value="adicional">Trabajo Adicional</SelectItem>
                      <SelectItem value="correccion">Corrección</SelectItem>
                      <SelectItem value="aprobacion">Aprobación</SelectItem>
                      <SelectItem value="consulta">Consulta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select defaultValue="media">
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
                  <Label>Fecha requerida</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Adjuntos</Label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Paperclip className="h-4 w-4 mr-2" />
                      Adjuntar archivos
                    </Button>
                    <span className="text-sm text-muted-foreground">0 archivos</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Solicitud
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Requests List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Solicitudes del Cliente</CardTitle>
                <CardDescription>Historial de solicitudes y su estado actual</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
<SelectContent>
  <SelectItem value="all">Todos</SelectItem>
  <SelectItem value="pendiente">Pendientes</SelectItem>
  <SelectItem value="en_progreso">En Progreso</SelectItem>
  <SelectItem value="completada">Completadas</SelectItem>
  <SelectItem value="rechazada">Rechazadas</SelectItem>
  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clientRequests.map((request) => {
const statusConfig: Record<string, { label: string, color: string, bgColor: string, icon: React.ReactNode }> = {
  pendiente: { label: "Pendiente", color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30", icon: <ClockIcon className="h-3 w-3" /> },
  en_progreso: { label: "En Progreso", color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30", icon: <RefreshCw className="h-3 w-3" /> },
  completada: { label: "Completada", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30", icon: <CheckCircle2 className="h-3 w-3" /> },
  rechazada: { label: "Rechazada", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30", icon: <XCircle className="h-3 w-3" /> }
  }
                  const typeConfig: Record<string, { label: string, color: string }> = {
                    cambio: { label: "Cambio", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
                    adicional: { label: "Adicional", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" },
                    correccion: { label: "Corrección", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300" },
                    aprobacion: { label: "Aprobación", color: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" },
                    consulta: { label: "Consulta", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300" }
                  }
                  const priorityConfig: Record<string, string> = {
                    alta: "border-l-red-500",
                    media: "border-l-amber-500",
                    baja: "border-l-green-500"
                  }
                  const status = statusConfig[request.status] || statusConfig.pendiente
                  const type = typeConfig[request.type] || typeConfig.cambio
                  
                  return (
                    <div 
                      key={request.id} 
                      className={`p-4 rounded-lg border border-l-4 ${priorityConfig[request.priority]} bg-muted/30 hover:bg-muted/50 transition-colors`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold">{request.title}</h4>
                            <Badge variant="outline" className={type.color}>{type.label}</Badge>
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                              {status.icon}
                              {status.label}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{request.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Avatar className="h-4 w-4">
                                <AvatarFallback className="text-[8px]">
                                  {request.requestedBy.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              {request.requestedBy.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(request.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              Requerido: {new Date(request.dueDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                            </span>
                            {request.attachments > 0 && (
                              <span className="flex items-center gap-1">
                                <Paperclip className="h-3 w-3" />
                                {request.attachments}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {request.comments}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request)
                              setShowRequestDetailDialog(true)
                            }}
                          >
                            Ver Solicitud
                          </Button>
                          {request.status === 'pendiente' && (
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => {
                                // Create a new task from the request
                                const newTask = {
                                  id: `task-req-${request.id}`,
                                  title: `[Solicitud] ${request.title}`,
                                  status: "pendiente",
                                  priority: request.priority,
                                  assignee: "MG",
                                  assigneeName: "María García",
                                  dueDate: request.dueDate,
                                  createdAt: new Date().toISOString().split('T')[0],
                                  hours: 4,
                                  description: request.description,
                                  linkedRequestId: request.id // Link to the original request
                                }
                                setTasks(prev => [...prev, newTask])
                                
                                // Update request status to "en_progreso" and link to task
                                setClientRequests(prev => 
                                  prev.map(r => r.id === request.id 
                                    ? { ...r, status: 'en_progreso', linkedTaskId: newTask.id } 
                                    : r
                                  )
                                )
                              }}
                            >
                              Atender
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setClientRequests(prev => prev.filter(r => r.id !== request.id))
                            }}
                          >
                            <Trash className="h-4 w-4 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RSS Pipeline Tab */}
        <TabsContent value="rss" className="space-y-4">
          <RssPipelineModule project={project} />
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4">
          <BillingModule project={project} />
        </TabsContent>
      </Tabs>

      {/* Link Folder to Google Drive Dialog */}
      <Dialog open={showLinkFolderDialog} onOpenChange={setShowLinkFolderDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              {editingFolder ? "Vincular Carpeta con Google Drive" : "Nueva Carpeta"}
            </DialogTitle>
            <DialogDescription>
              {editingFolder 
                ? "Conecta esta carpeta con una carpeta de Google Drive para acceder rápidamente a los documentos."
                : "Crea una nueva carpeta y vincúlala opcionalmente con Google Drive."
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Nombre de la Carpeta</Label>
              <Input 
                id="folder-name"
                placeholder="Ej: Creativos, Reportes, Contratos..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="folder-icon">Icono</Label>
              <Select value={newFolderIcon} onValueChange={setNewFolderIcon}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar icono" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="folder">
                    <span className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" /> Carpeta General
                    </span>
                  </SelectItem>
                  <SelectItem value="briefcase">
                    <span className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" /> Briefing / Estrategia
                    </span>
                  </SelectItem>
                  <SelectItem value="palette">
                    <span className="flex items-center gap-2">
                      <Palette className="h-4 w-4" /> Creativos / Diseño
                    </span>
                  </SelectItem>
                  <SelectItem value="video">
                    <span className="flex items-center gap-2">
                      <Video className="h-4 w-4" /> Videos / Multimedia
                    </span>
                  </SelectItem>
                  <SelectItem value="chart">
                    <span className="flex items-center gap-2">
                      <PieChart className="h-4 w-4" /> Reportes / Analytics
                    </span>
                  </SelectItem>
                  <SelectItem value="check">
                    <span className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4" /> Aprobaciones
                    </span>
                  </SelectItem>
                  <SelectItem value="image">
                    <span className="flex items-center gap-2">
                      <Image className="h-4 w-4" /> Imágenes / Fotos
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="folder-link">Enlace de Google Drive</Label>
              <div className="relative">
                <Input 
                  id="folder-link"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={newFolderLink}
                  onChange={(e) => setNewFolderLink(e.target.value)}
                  className="pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="h-4 w-4 opacity-50" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Abre la carpeta en Google Drive, copia el enlace de la barra de direcciones y pégalo aquí.
              </p>
            </div>

            {newFolderLink && newFolderLink.includes("drive.google.com") && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckSquare className="h-4 w-4" />
                  <span className="text-sm font-medium">Enlace válido de Google Drive detectado</span>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkFolderDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                setShowLinkFolderDialog(false)
                setNewFolderName("")
                setNewFolderLink("")
                setNewFolderIcon("folder")
                setEditingFolder(null)
              }}
              disabled={!newFolderName.trim()}
            >
              <Link2 className="h-4 w-4 mr-2" />
              {editingFolder ? "Guardar Cambios" : "Crear Carpeta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Permissions Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurar Permisos de Acceso
            </DialogTitle>
            <DialogDescription>
              {editingContact && (
                <span>
                  Configura qué módulos puede ver <strong>{editingContact.name}</strong> ({editingContact.position}) en el portal del cliente.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {editingContact && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {editingContact.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{editingContact.name}</p>
                  <p className="text-sm text-muted-foreground">{editingContact.email}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-1">
              <div className="grid grid-cols-[1fr,100px,100px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b">
                <span>Módulo</span>
                <span className="text-center">Ver</span>
                <span className="text-center">Ver y Comentar</span>
              </div>
              
              {modulesList.map((module) => {
                const ModuleIcon = module.icon
                const currentPermission = contactPermissions[module.key] || "ninguno"
                
                return (
                  <div 
                    key={module.key} 
                    className={`grid grid-cols-[1fr,100px,100px] gap-2 px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors ${currentPermission !== "ninguno" ? "bg-muted/30" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${currentPermission !== "ninguno" ? "bg-primary/10" : "bg-muted"}`}>
                        <ModuleIcon className={`h-4 w-4 ${currentPermission !== "ninguno" ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{module.label}</p>
                        <p className="text-xs text-muted-foreground">{module.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => setContactPermissions(prev => ({
                          ...prev,
                          [module.key]: currentPermission === "ver" ? "ninguno" : "ver"
                        }))}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                          currentPermission === "ver" 
                            ? "bg-blue-500 border-blue-500 text-white" 
                            : "border-gray-300 hover:border-blue-300"
                        }`}
                      >
                        {currentPermission === "ver" && <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => setContactPermissions(prev => ({
                          ...prev,
                          [module.key]: currentPermission === "ver_comentar" ? "ninguno" : "ver_comentar"
                        }))}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                          currentPermission === "ver_comentar" 
                            ? "bg-green-500 border-green-500 text-white" 
                            : "border-gray-300 hover:border-green-300"
                        }`}
                      >
                        {currentPermission === "ver_comentar" && <MessageCircle className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="flex items-center gap-4 mt-4 pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const allView: Record<string, string> = {}
                  modulesList.forEach(m => allView[m.key] = "ver")
                  setContactPermissions(allView)
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                Solo Ver Todo
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const allComment: Record<string, string> = {}
                  modulesList.forEach(m => allComment[m.key] = "ver_comentar")
                  setContactPermissions(allComment)
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Ver y Comentar Todo
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  const none: Record<string, string> = {}
                  modulesList.forEach(m => none[m.key] = "ninguno")
                  setContactPermissions(none)
                }}
                className="text-muted-foreground"
              >
                Quitar Todo
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                setShowPermissionsDialog(false)
                setEditingContact(null)
                setContactPermissions({})
              }}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Guardar Permisos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={showEditTaskDialog} onOpenChange={setShowEditTaskDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Tarea
            </DialogTitle>
            <DialogDescription>
              Modifica los detalles de la tarea.
            </DialogDescription>
          </DialogHeader>
          
          {editingTask && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Título de la Tarea</Label>
                <Input 
                  id="task-title"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="task-description">Descripción</Label>
                <Textarea 
                  id="task-description"
                  value={editingTask.description || ""}
                  onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select 
                    value={editingTask.status} 
                    onValueChange={(value) => setEditingTask({...editingTask, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="en_progreso">En Progreso</SelectItem>
                      <SelectItem value="completado">Completado</SelectItem>
                      <SelectItem value="vencido">Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select 
                    value={editingTask.priority} 
                    onValueChange={(value) => setEditingTask({...editingTask, priority: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-duedate">Fecha de Vencimiento</Label>
                  <Input 
                    id="task-duedate"
                    type="date"
                    value={editingTask.dueDate}
                    onChange={(e) => setEditingTask({...editingTask, dueDate: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="task-hours">Horas Estimadas</Label>
                  <Input 
                    id="task-hours"
                    type="number"
                    value={editingTask.hours || 0}
                    onChange={(e) => setEditingTask({...editingTask, hours: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditTaskDialog(false)
              setEditingTask(null)
            }}>
              Cancelar
            </Button>
<Button onClick={() => {
  // Save the task changes
  setTasks(prev => prev.map(t => 
    t.id === editingTask.id ? editingTask : t
  ))
  
  // If task is completed and has a linked request, update the request status
  if (editingTask.status === 'completado' && editingTask.linkedRequestId) {
    setClientRequests(prev => 
      prev.map(r => r.id === editingTask.linkedRequestId 
        ? { ...r, status: 'completada' } 
        : r
      )
    )
  }
  
  setShowEditTaskDialog(false)
  setEditingTask(null)
  }}>
  <CheckSquare className="h-4 w-4 mr-2" />
  Guardar Cambios
  </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Google Calendar Connection Dialog */}
      <Dialog open={showGoogleCalendarDialog} onOpenChange={setShowGoogleCalendarDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg className="h-6 w-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.316 5.684H24v12.632h-5.684V5.684z" fill="#1a73e8"/>
                <path d="M5.684 24v-5.684h12.632V24H5.684z" fill="#1a73e8"/>
                <path d="M18.316 5.684V0H1.895A1.895 1.895 0 0 0 0 1.895v16.421h5.684V5.684h12.632z" fill="#ea4335"/>
                <path d="M5.684 18.316H0v3.789A1.895 1.895 0 0 0 1.895 24h3.789v-5.684z" fill="#188038"/>
                <path d="M24 5.684h-5.684V0h3.789A1.895 1.895 0 0 1 24 1.895v3.789z" fill="#1967d2"/>
                <path d="M18.316 18.316H24V24h-3.789a1.895 1.895 0 0 1-1.895-1.895v-3.789z" fill="#1967d2"/>
                <path d="M5.684 5.684h12.632v12.632H5.684z" fill="#fff"/>
                <path d="M15.789 9.474H8.211v1.263h7.578V9.474zM15.789 12h-7.578v1.263h7.578V12zM15.789 14.526H8.211v1.263h7.578v-1.263z" fill="#1a73e8"/>
              </svg>
              Conectar Google Calendar
            </DialogTitle>
            <DialogDescription>
              Sincroniza todas las tareas y eventos del proyecto con tu Google Calendar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <h4 className="font-medium">Al conectar Google Calendar podrás:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Sincronizar todas las tareas del proyecto automáticamente
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Ver eventos de la Parrilla RSS en tu calendario
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Recibir recordatorios de fechas importantes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Compartir el calendario con el equipo
                </li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <Label>Tareas a sincronizar</Label>
              <div className="text-sm text-muted-foreground p-3 border rounded-lg">
                <div className="flex justify-between items-center">
                  <span>Tareas del proyecto</span>
                  <Badge variant="secondary">{tasks.length} tareas</Badge>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span>Eventos del calendario</span>
                  <Badge variant="secondary">{project.calendarTasks.length} eventos</Badge>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span>Items Parrilla RSS</span>
                  <Badge variant="secondary">{project.rssPipeline.items.length} publicaciones</Badge>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoogleCalendarDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={async () => {
                setConnectingCalendar(true)
                // Simulate Google OAuth flow
                await new Promise(resolve => setTimeout(resolve, 1500))
                setCalendarConnected(true)
                setConnectingCalendar(false)
                setShowGoogleCalendarDialog(false)
              }}
              disabled={connectingCalendar}
            >
              {connectingCalendar ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Conectando...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Conectar con Google
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Detail Dialog */}
      <Dialog open={showRequestDetailDialog} onOpenChange={setShowRequestDetailDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle>{selectedRequest.title}</DialogTitle>
                  <Badge variant="outline" className={
                    selectedRequest.type === 'cambio' ? "bg-blue-100 text-blue-700" :
                    selectedRequest.type === 'adicional' ? "bg-purple-100 text-purple-700" :
                    selectedRequest.type === 'correccion' ? "bg-orange-100 text-orange-700" :
                    selectedRequest.type === 'aprobacion' ? "bg-green-100 text-green-700" :
                    "bg-gray-100 text-gray-700"
                  }>
                    {selectedRequest.type === 'cambio' ? 'Cambio' :
                     selectedRequest.type === 'adicional' ? 'Adicional' :
                     selectedRequest.type === 'correccion' ? 'Corrección' :
                     selectedRequest.type === 'aprobacion' ? 'Aprobación' : 'Consulta'}
                  </Badge>
                </div>
                <DialogDescription>
                  Solicitud #{selectedRequest.id}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Status and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Estado</Label>
                    <Select 
                      value={selectedRequest.status}
                      onValueChange={(value) => {
                        // Update both the selected request and the list
                        setSelectedRequest({ ...selectedRequest, status: value })
                        setClientRequests(prev => 
                          prev.map(r => r.id === selectedRequest.id 
                            ? { ...r, status: value } 
                            : r
                          )
                        )
                      }}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
<SelectContent>
  <SelectItem value="pendiente">
  <div className="flex items-center gap-2">
  <div className="w-2 h-2 rounded-full bg-amber-500" />
  Pendiente
  </div>
  </SelectItem>
  <SelectItem value="en_progreso">
  <div className="flex items-center gap-2">
  <div className="w-2 h-2 rounded-full bg-blue-500" />
  En Progreso
  </div>
  </SelectItem>
  <SelectItem value="completada">
  <div className="flex items-center gap-2">
  <div className="w-2 h-2 rounded-full bg-green-500" />
  Completada
  </div>
  </SelectItem>
  <SelectItem value="rechazada">
  <div className="flex items-center gap-2">
  <div className="w-2 h-2 rounded-full bg-red-500" />
  Rechazada
  </div>
  </SelectItem>
  </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Prioridad</Label>
                    <Select 
                      value={selectedRequest.priority}
                      onValueChange={(value) => {
                        setSelectedRequest({ ...selectedRequest, priority: value })
                        setClientRequests(prev => 
                          prev.map(r => r.id === selectedRequest.id 
                            ? { ...r, priority: value } 
                            : r
                          )
                        )
                      }}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baja">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gray-400" />
                            Baja
                          </div>
                        </SelectItem>
                        <SelectItem value="media">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            Media
                          </div>
                        </SelectItem>
                        <SelectItem value="alta">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            Alta
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Descripción</Label>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {selectedRequest.description}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Solicitado por</Label>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {selectedRequest.requestedBy.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{selectedRequest.requestedBy.name}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Rol</Label>
                    <p className="text-sm">{selectedRequest.requestedBy.role}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Fecha de solicitud</Label>
                    <p className="text-sm">{new Date(selectedRequest.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Fecha requerida</Label>
                    <p className="text-sm">{new Date(selectedRequest.dueDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>

                {/* Attachments */}
                {selectedRequest.attachments > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Archivos adjuntos ({selectedRequest.attachments})</Label>
                    <div className="flex gap-2 flex-wrap">
                      {Array.from({ length: selectedRequest.attachments }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">archivo_{i + 1}.pdf</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments Section */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Comentarios ({selectedRequest.comments})</Label>
                  <div className="border rounded-lg p-3 space-y-3 max-h-40 overflow-y-auto">
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">MG</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">María García</span>
                          <span className="text-xs text-muted-foreground">hace 2 horas</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Revisando la solicitud, les comparto mi análisis pronto.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Escribe un comentario..." className="flex-1" />
                    <Button size="sm">Enviar</Button>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="flex-col sm:flex-row gap-2">
                {selectedRequest.status === 'pendiente' && (
                  <>
                    <Button 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setClientRequests(prev => 
                          prev.map(r => r.id === selectedRequest.id 
                            ? { ...r, status: 'rechazada' } 
                            : r
                          )
                        )
                        setShowRequestDetailDialog(false)
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rechazar
                    </Button>
                    <Button 
                      onClick={() => {
                        // Create a new task from the request
                        const newTask = {
                          id: `task-req-${selectedRequest.id}`,
                          title: `[Solicitud] ${selectedRequest.title}`,
                          status: "pendiente",
                          priority: selectedRequest.priority,
                          assignee: "MG",
                          assigneeName: "María García",
                          dueDate: selectedRequest.dueDate,
                          createdAt: new Date().toISOString().split('T')[0],
                          hours: 4,
                          description: selectedRequest.description,
                          linkedRequestId: selectedRequest.id
                        }
                        setTasks(prev => [...prev, newTask])
                        
                        // Update request status to "en_progreso" and link to task
                        setClientRequests(prev => 
                          prev.map(r => r.id === selectedRequest.id 
                            ? { ...r, status: 'en_progreso', linkedTaskId: newTask.id } 
                            : r
                          )
                        )
                        setShowRequestDetailDialog(false)
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Atender Solicitud
                    </Button>
                  </>
                )}
                {selectedRequest.status === 'en_progreso' && (
                  <>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setShowRequestDetailDialog(false)
                        router.push(`/orbit-tasksflow/tasks/task-req-${selectedRequest.id}`)
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalle
                    </Button>
                    <Button 
                      onClick={() => {
                        setClientRequests(prev => 
                          prev.map(r => r.id === selectedRequest.id 
                            ? { ...r, status: 'completada' } 
                            : r
                          )
                        )
                        setShowRequestDetailDialog(false)
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar como Completada
                    </Button>
                  </>
                )}
                {selectedRequest.status === 'completada' && (
                  <>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setShowRequestDetailDialog(false)
                        router.push(`/orbit-tasksflow/tasks/task-req-${selectedRequest.id}`)
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalle
                    </Button>
                    <Button variant="outline" onClick={() => setShowRequestDetailDialog(false)}>
                      Cerrar
                    </Button>
                  </>
                )}
                {selectedRequest.status === 'rechazada' && (
                  <Button variant="outline" onClick={() => setShowRequestDetailDialog(false)}>
                    Cerrar
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// RSS Pipeline Module Component
function RssPipelineModule({ project }: { project: typeof mockProject }) {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const [stages, setStages] = useState(project.rssPipeline.stages)
  const [items, setItems] = useState(project.rssPipeline.items)
  const [editingStage, setEditingStage] = useState<string | null>(null)
  const [showNewTask, setShowNewTask] = useState(false)
  const [newTask, setNewTask] = useState({
    title: "",
    platform: "instagram",
    type: "imagen",
    description: "",
    scheduledDate: "",
    dueDate: "",
    priority: "media",
    hours: 4,
    assignee: { name: "Sin Asignar", initials: "SA" }
  })
  const [selectedRssTask, setSelectedRssTask] = useState<any>(null)
  const [showTaskDetail, setShowTaskDetail] = useState(false)
  const [activeTaskTab, setActiveTaskTab] = useState("resumen")
  const [newComment, setNewComment] = useState("")
  const [showEditRssTask, setShowEditRssTask] = useState(false)
  const [editingRssTask, setEditingRssTask] = useState<any>(null)
  
  // Mock task details for RSS items
  const getTaskDetails = (item: any) => ({
    ...item,
    status: item.stage,
    subtasks: [
      { id: "st1", title: "Crear diseño visual", completed: item.stage !== "idea", assignee: "Ana López" },
      { id: "st2", title: "Escribir copy", completed: item.stage !== "idea" && item.stage !== "diseño", assignee: "Carlos Ruiz" },
      { id: "st3", title: "Revisión cliente", completed: item.stage === "aprobacion_cliente" || item.stage === "programado" || item.stage === "publicado" || item.stage === "finalizado", assignee: "Diana García" },
      { id: "st4", title: "Programar publicación", completed: item.stage === "programado" || item.stage === "publicado" || item.stage === "finalizado", assignee: "Eduardo Méndez" },
    ],
    comments: [
      { id: "c1", author: { name: "Ana López", initials: "AL" }, text: "Ya está listo el diseño, subí el archivo.", date: "2026-05-10T10:30:00" },
      { id: "c2", author: { name: "Carlos Ruiz", initials: "CR" }, text: "Copy aprobado por el cliente.", date: "2026-05-11T14:15:00" },
    ],
    files: [
      { id: "f1", name: `${item.title.replace(/\s+/g, '_')}_diseño.psd`, type: "psd", size: "15.2 MB", uploadedBy: "Ana López", uploadedAt: "2026-05-10" },
      { id: "f2", name: `${item.title.replace(/\s+/g, '_')}_final.jpg`, type: "image", size: "2.1 MB", uploadedBy: "Ana López", uploadedAt: "2026-05-10" },
    ],
    timeTracking: {
      estimated: item.hours || 4,
      logged: item.hoursLogged || 0,
      entries: [
        { id: "t1", user: item.assignee.name, hours: (item.hoursLogged || 0) * 0.6, date: item.createdAt, description: "Diseño de creativos" },
        { id: "t2", user: "Carlos Ruiz", hours: (item.hoursLogged || 0) * 0.4, date: item.createdAt, description: "Redacción de copy" },
      ]
    },
    history: [
      { id: "h1", action: "Tarea creada", user: "Sistema", date: `${item.createdAt}T09:00:00` },
      { id: "h2", action: `Asignado a ${item.assignee.name}`, user: "Sistema", date: `${item.createdAt}T09:05:00` },
      { id: "h3", action: `Movido a ${stages.find(s => s.id === item.stage)?.name || item.stage}`, user: item.assignee.name, date: `${item.createdAt}T10:00:00` },
    ]
  })

  const platformIcons: Record<string, React.ReactNode> = {
    instagram: <Instagram className="h-4 w-4 text-pink-600" />,
    facebook: <Facebook className="h-4 w-4 text-blue-600" />,
    twitter: <Twitter className="h-4 w-4 text-sky-500" />,
    tiktok: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>,
    linkedin: <Linkedin className="h-4 w-4 text-blue-700" />,
    youtube: <Youtube className="h-4 w-4 text-red-600" />
  }

  const typeIcons: Record<string, React.ReactNode> = {
    imagen: <ImageIcon className="h-3 w-3" />,
    video: <Film className="h-3 w-3" />,
    story: <Layers className="h-3 w-3" />,
    reel: <Film className="h-3 w-3" />,
    carrusel: <Layers className="h-3 w-3" />
  }

  const moveItem = (itemId: string, newStage: string) => {
    setItems(items.map(item => 
      item.id === itemId ? { ...item, stage: newStage } : item
    ))
  }

  const updateStageColor = (stageId: string, newColor: string) => {
    setStages(stages.map(stage =>
      stage.id === stageId ? { ...stage, color: newColor } : stage
    ))
  }

  const addNewTask = () => {
    if (!newTask.title) return
    const task = {
      id: `rss${Date.now()}`,
      title: newTask.title,
      platform: newTask.platform,
      type: newTask.type,
      stage: "idea",
      scheduledDate: newTask.scheduledDate || newTask.dueDate,
      dueDate: newTask.dueDate || newTask.scheduledDate,
      createdAt: new Date().toISOString().split('T')[0],
      assignee: newTask.assignee,
      description: newTask.description,
      hashtags: [],
      priority: newTask.priority,
      hours: newTask.hours,
      hoursLogged: 0
    }
    setItems([...items, task])
    setNewTask({ 
      title: "", 
      platform: "instagram", 
      type: "imagen", 
      description: "", 
      scheduledDate: "",
      dueDate: "",
      priority: "media",
      hours: 4,
      assignee: { name: "Sin Asignar", initials: "SA" }
    })
    setShowNewTask(false)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Rss className="h-5 w-5" />
            Parrilla de Contenidos
          </h3>
          <p className="text-sm text-muted-foreground">
            {items.length} tareas | {items.filter(i => i.stage === 'publicado' || i.stage === 'finalizado').length} completadas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditingStage(editingStage ? null : 'edit')}>
            <Pencil className="h-4 w-4 mr-2" />
            {editingStage ? 'Terminar Edición' : 'Editar Pipeline'}
          </Button>
          <Button size="sm" onClick={() => setShowNewTask(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      {/* New Task Form */}
      {showNewTask && (
        <Card className="border-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nueva Tarea de Parrilla</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-2 space-y-2">
                <Label>Título de la Tarea</Label>
                <Input 
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  placeholder="Ej: Post Lanzamiento Campaña"
                />
              </div>
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select value={newTask.priority} onValueChange={(v) => setNewTask({...newTask, priority: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        Alta
                      </div>
                    </SelectItem>
                    <SelectItem value="media">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        Media
                      </div>
                    </SelectItem>
                    <SelectItem value="baja">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Baja
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Horas Estimadas</Label>
                <Input 
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={newTask.hours}
                  onChange={(e) => setNewTask({...newTask, hours: parseFloat(e.target.value) || 0})}
                  placeholder="4"
                />
              </div>
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <Select value={newTask.platform} onValueChange={(v) => setNewTask({...newTask, platform: v})}>
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
                <Select value={newTask.type} onValueChange={(v) => setNewTask({...newTask, type: v})}>
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
                <Label>Fecha Límite</Label>
                <Input 
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha Publicación</Label>
                <Input 
                  type="date"
                  value={newTask.scheduledDate}
                  onChange={(e) => setNewTask({...newTask, scheduledDate: e.target.value})}
                />
              </div>
              <div className="lg:col-span-4 space-y-2">
                <Label>Descripción</Label>
                <Textarea 
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  placeholder="Descripción de la tarea, copy del contenido, instrucciones..."
                  className="min-h-[80px]"
                />
              </div>
              <div className="lg:col-span-4 flex items-center justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setShowNewTask(false)}>Cancelar</Button>
                <Button onClick={addNewTask}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Tarea
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stage Editor */}
      {editingStage && (
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Configurar Etapas del Pipeline</CardTitle>
            <CardDescription>Personaliza los colores de cada etapa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-8">
              {stages.map((stage) => (
                <div key={stage.id} className="space-y-2">
                  <Label className="text-xs">{stage.name}</Label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={stage.color}
                      onChange={(e) => updateStageColor(stage.id, e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <div 
                      className="flex-1 h-8 rounded text-white text-xs flex items-center justify-center font-medium"
                      style={{ backgroundColor: stage.color }}
                    >
                      {stage.name.substring(0, 8)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline Kanban */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3" style={{ minWidth: stages.length * 220 }}>
          {stages.map((stage) => {
            const stageItems = items.filter(item => item.stage === stage.id)
            return (
              <div key={stage.id} className="flex-1 min-w-[200px]">
                {/* Stage Header */}
                <div 
                  className="p-2 rounded-t-lg text-white font-medium text-sm flex items-center justify-between"
                  style={{ backgroundColor: stage.color }}
                >
                  <span>{stage.name}</span>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                    {stageItems.length}
                  </Badge>
                </div>
                
                {/* Stage Content */}
                <div className="bg-muted/50 rounded-b-lg p-2 min-h-[400px] space-y-2">
                  {stageItems.map((item) => (
                    <Card 
                      key={item.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50"
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('itemId', item.id)}
                      onClick={() => {
                        router.push(`/orbit-tasksflow/projects/${projectId}/rss/${item.id}`)
                      }}
                    >
<CardContent className="p-3 space-y-2">
                                        {/* Header with title and priority */}
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <Badge 
                                                variant="outline" 
                                                className={`text-[10px] px-1.5 py-0 ${
                                                  item.priority === 'alta' ? 'border-red-300 bg-red-50 text-red-700' :
                                                  item.priority === 'media' ? 'border-amber-300 bg-amber-50 text-amber-700' :
                                                  'border-green-300 bg-green-50 text-green-700'
                                                }`}
                                              >
                                                {item.priority === 'alta' ? 'Alta' : item.priority === 'media' ? 'Media' : 'Baja'}
                                              </Badge>
                                              {platformIcons[item.platform]}
                                            </div>
                                            <span className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">{item.title}</span>
                                          </div>
                                          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
                                        </div>
                                        
                                        {/* Description */}
                                        {item.description && (
                                          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                                        )}

                                        {/* Metadata row */}
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex items-center gap-1">
                                            {typeIcons[item.type]}
                                            {item.type}
                                          </Badge>
                                          <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(item.dueDate || item.scheduledDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {item.hoursLogged || 0}h / {item.hours}h
                                          </span>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="space-y-1">
                                          <Progress 
                                            value={((item.hoursLogged || 0) / (item.hours || 1)) * 100} 
                                            className="h-1.5"
                                          />
                                        </div>

                                        {/* Footer with assignee and stage selector */}
                                        <div className="flex items-center justify-between pt-2 border-t">
                                          <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                                {item.assignee.initials}
                                              </AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs text-muted-foreground truncate max-w-[80px]">{item.assignee.name}</span>
                                          </div>
                                          <Select 
                                            value={item.stage}
                                            onValueChange={(newStage) => moveItem(item.id, newStage)}
                                          >
                                            <SelectTrigger className="h-6 text-[10px] w-auto border-0 bg-transparent p-0 pr-6">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {stages.map(s => (
                                                <SelectItem key={s.id} value={s.id} className="text-xs">
                                                  <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                                                    {s.name}
                                                  </div>
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </CardContent>
                    </Card>
                  ))}

                  {/* Drop Zone */}
                  <div 
                    className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 text-center text-xs text-muted-foreground opacity-0 hover:opacity-100 transition-opacity"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const itemId = e.dataTransfer.getData('itemId')
                      if (itemId) moveItem(itemId, stage.id)
                    }}
                  >
                    Soltar aquí
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Monthly Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumen del Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{items.length}</p>
              <p className="text-xs text-muted-foreground">Total Tareas</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-green-600">
                {items.filter(i => i.stage === 'publicado' || i.stage === 'finalizado').length}
              </p>
              <p className="text-xs text-muted-foreground">Completadas</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-blue-600">
                {items.filter(i => !['publicado', 'finalizado', 'idea'].includes(i.stage)).length}
              </p>
              <p className="text-xs text-muted-foreground">En Proceso</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-amber-600">
                {items.filter(i => i.stage === 'idea').length}
              </p>
              <p className="text-xs text-muted-foreground">Por Iniciar</p>
            </div>
          </div>
          
          {/* Platform Distribution */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium mb-3">Distribución por Plataforma</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(
                items.reduce((acc, item) => {
                  acc[item.platform] = (acc[item.platform] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
              ).map(([platform, count]) => (
                <div key={platform} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
                  {platformIcons[platform]}
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RSS Task Detail Dialog */}
      <Dialog open={showTaskDetail} onOpenChange={setShowTaskDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedRssTask && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  {platformIcons[selectedRssTask.platform]}
                  <div>
                    <DialogTitle className="text-xl">{selectedRssTask.title}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {typeIcons[selectedRssTask.type]}
                        <span className="ml-1">{selectedRssTask.type}</span>
                      </Badge>
                      <span>-</span>
                      <span>{new Date(selectedRssTask.scheduledDate).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              <Tabs value={activeTaskTab} onValueChange={setActiveTaskTab} className="mt-4">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="resumen" className="text-xs">Resumen</TabsTrigger>
                  <TabsTrigger value="subtareas" className="text-xs">Subtareas</TabsTrigger>
                  <TabsTrigger value="comentarios" className="text-xs">Comentarios</TabsTrigger>
                  <TabsTrigger value="archivos" className="text-xs">Archivos</TabsTrigger>
                  <TabsTrigger value="historial" className="text-xs">Historial</TabsTrigger>
                </TabsList>
                
                {/* Resumen Tab */}
                <TabsContent value="resumen" className="space-y-4 mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Información General</CardTitle>
                      </CardHeader>
<CardContent className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Estado:</span>
                                          <Badge style={{ backgroundColor: stages.find(s => s.id === selectedRssTask.stage)?.color }}>
                                            {stages.find(s => s.id === selectedRssTask.stage)?.name}
                                          </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Prioridad:</span>
                                          <Badge 
                                            variant="outline" 
                                            className={
                                              selectedRssTask.priority === 'alta' ? 'border-red-300 bg-red-50 text-red-700' :
                                              selectedRssTask.priority === 'media' ? 'border-amber-300 bg-amber-50 text-amber-700' :
                                              'border-green-300 bg-green-50 text-green-700'
                                            }
                                          >
                                            {selectedRssTask.priority === 'alta' ? 'Alta' : selectedRssTask.priority === 'media' ? 'Media' : 'Baja'}
                                          </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Plataforma:</span>
                                          <span className="flex items-center gap-1">{platformIcons[selectedRssTask.platform]} {selectedRssTask.platform}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Tipo:</span>
                                          <span>{selectedRssTask.type}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Asignado:</span>
                                          <span className="flex items-center gap-2">
                                            <Avatar className="h-5 w-5">
                                              <AvatarFallback className="text-[8px]">{selectedRssTask.assignee.initials}</AvatarFallback>
                                            </Avatar>
                                            {selectedRssTask.assignee.name}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Fecha límite:</span>
                                          <span>{new Date(selectedRssTask.dueDate || selectedRssTask.scheduledDate).toLocaleDateString('es-MX')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Creada:</span>
                                          <span>{new Date(selectedRssTask.createdAt).toLocaleDateString('es-MX')}</span>
                                        </div>
                                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Tiempo</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Progreso:</span>
                          <span className="text-sm font-medium">{selectedRssTask.timeTracking.logged}h / {selectedRssTask.timeTracking.estimated}h</span>
                        </div>
                        <Progress value={(selectedRssTask.timeTracking.logged / selectedRssTask.timeTracking.estimated) * 100} className="h-2" />
                        <div className="space-y-2 pt-2">
                          {selectedRssTask.timeTracking.entries.map((entry: any) => (
                            <div key={entry.id} className="flex items-center justify-between text-xs p-2 rounded bg-muted/50">
                              <div>
                                <span className="font-medium">{entry.user}</span>
                                <span className="text-muted-foreground ml-2">{entry.description}</span>
                              </div>
                              <span className="font-medium">{entry.hours}h</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
<Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm">Descripción</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-sm">{selectedRssTask.description || "Sin descripción"}</p>
                                      {selectedRssTask.hashtags && selectedRssTask.hashtags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                                          <span className="text-xs text-muted-foreground mr-2">Hashtags:</span>
                                          {selectedRssTask.hashtags.map((tag: string) => (
                                            <Badge key={tag} variant="secondary" className="text-xs">
                                              <Hash className="h-3 w-3 mr-1" />{tag.replace('#', '')}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                </TabsContent>
                
                {/* Subtareas Tab */}
                <TabsContent value="subtareas" className="mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Subtareas</CardTitle>
                        <span className="text-xs text-muted-foreground">
                          {selectedRssTask.subtasks.filter((s: any) => s.completed).length}/{selectedRssTask.subtasks.length} completadas
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selectedRssTask.subtasks.map((subtask: any) => (
                        <div key={subtask.id} className={`flex items-center justify-between p-3 rounded-lg border ${subtask.completed ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900' : 'bg-muted/30'}`}>
                          <div className="flex items-center gap-3">
                            <Checkbox checked={subtask.completed} />
                            <span className={`text-sm ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>{subtask.title}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{subtask.assignee}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Comentarios Tab */}
                <TabsContent value="comentarios" className="mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Comentarios</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedRssTask.comments.map((comment: any) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">{comment.author.initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{comment.author.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(comment.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-sm mt-1">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                      
                      <div className="pt-4 border-t">
                        <div className="flex gap-2">
                          <Textarea 
                            placeholder="Escribe un comentario..." 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="min-h-[60px]"
                          />
                        </div>
                        <div className="flex justify-end mt-2">
                          <Button size="sm" disabled={!newComment.trim()}>
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Comentar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Archivos Tab */}
                <TabsContent value="archivos" className="mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Archivos</CardTitle>
                        <Button size="sm" variant="outline">
                          <Upload className="h-4 w-4 mr-2" />
                          Subir Archivo
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selectedRssTask.files.map((file: any) => (
                        <div key={file.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded bg-primary/10">
                              {file.type === 'image' ? <ImageIcon className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{file.size} - Subido por {file.uploadedBy}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Historial Tab */}
                <TabsContent value="historial" className="mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Historial de Actividad</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedRssTask.history.map((item: any, index: number) => (
                          <div key={item.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              {index < selectedRssTask.history.length - 1 && (
                                <div className="w-0.5 h-full bg-border mt-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <p className="text-sm">{item.action}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.user} - {new Date(item.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              
              <DialogFooter className="mt-4">
                <div className="flex items-center justify-between w-full">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => {
                      setItems(prev => prev.filter(item => item.id !== selectedRssTask.id))
                      setShowTaskDetail(false)
                      setSelectedRssTask(null)
                    }}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Eliminar Tarea
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowTaskDetail(false)}>
                      Cerrar
                    </Button>
                    <Button onClick={() => {
                      setShowTaskDetail(false)
                      router.push(`/orbit-tasksflow/projects/${projectId}/rss/${selectedRssTask.id}`)
                    }}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalle
                    </Button>
                  </div>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit RSS Task Dialog */}
      <Dialog open={showEditRssTask} onOpenChange={setShowEditRssTask}>
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
          {editingRssTask && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Título</Label>
                  <Input 
                    value={editingRssTask.title}
                    onChange={(e) => setEditingRssTask({...editingRssTask, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select 
                    value={editingRssTask.priority} 
                    onValueChange={(v) => setEditingRssTask({...editingRssTask, priority: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          Alta
                        </div>
                      </SelectItem>
                      <SelectItem value="media">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                          Media
                        </div>
                      </SelectItem>
                      <SelectItem value="baja">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          Baja
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Horas Estimadas</Label>
                  <Input 
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={editingRssTask.hours}
                    onChange={(e) => setEditingRssTask({...editingRssTask, hours: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Plataforma</Label>
                  <Select 
                    value={editingRssTask.platform} 
                    onValueChange={(v) => setEditingRssTask({...editingRssTask, platform: v})}
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
                    value={editingRssTask.type} 
                    onValueChange={(v) => setEditingRssTask({...editingRssTask, type: v})}
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
                    value={editingRssTask.stage} 
                    onValueChange={(v) => setEditingRssTask({...editingRssTask, stage: v})}
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
                  <Label>Fecha Límite</Label>
                  <Input 
                    type="date"
                    value={editingRssTask.dueDate || editingRssTask.scheduledDate}
                    onChange={(e) => setEditingRssTask({...editingRssTask, dueDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha Publicación</Label>
                  <Input 
                    type="date"
                    value={editingRssTask.scheduledDate}
                    onChange={(e) => setEditingRssTask({...editingRssTask, scheduledDate: e.target.value})}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Descripción</Label>
                  <Textarea 
                    value={editingRssTask.description || ""}
                    onChange={(e) => setEditingRssTask({...editingRssTask, description: e.target.value})}
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditRssTask(false)
              setEditingRssTask(null)
            }}>
              Cancelar
            </Button>
            <Button onClick={() => {
              // Update the item in the items array
              setItems(prev => prev.map(item => 
                item.id === editingRssTask.id ? editingRssTask : item
              ))
              setShowEditRssTask(false)
              setEditingRssTask(null)
            }}>
              <CheckSquare className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Billing Module Component
function BillingModule({ project }: { project: typeof mockProject }) {
  const [invoices, setInvoices] = useState(project.billing.invoices)
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)
  const [showNewTask, setShowNewTask] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [showUpload, setShowUpload] = useState<string | null>(null)

  const statusConfig: Record<string, { label: string, color: string, bgColor: string, icon: React.ReactNode }> = {
    por_cobrar: { label: "Por Cobrar", color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30", icon: <ClockIcon className="h-4 w-4" /> },
    pagada: { label: "Pagada", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30", icon: <CheckCircle2 className="h-4 w-4" /> },
    vencida: { label: "Vencida", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30", icon: <AlertTriangle className="h-4 w-4" /> },
    cancelada: { label: "Cancelada", color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-900/30", icon: <Ban className="h-4 w-4" /> }
  }

  const stats = {
    total: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    pagadas: invoices.filter(i => i.status === 'pagada').reduce((sum, inv) => sum + inv.amount, 0),
    porCobrar: invoices.filter(i => i.status === 'por_cobrar').reduce((sum, inv) => sum + inv.amount, 0),
    vencidas: invoices.filter(i => i.status === 'vencida').reduce((sum, inv) => sum + inv.amount, 0)
  }

  const addTask = (invoiceId: string) => {
    if (!newTaskTitle.trim()) return
    setInvoices(invoices.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          tasks: [...inv.tasks, {
            id: `bt${Date.now()}`,
            title: newTaskTitle,
            status: "pendiente",
            date: new Date().toISOString().split('T')[0],
            assignee: "Sin asignar"
          }]
        }
      }
      return inv
    }))
    setNewTaskTitle("")
    setShowNewTask(null)
  }

  const toggleTaskStatus = (invoiceId: string, taskId: string) => {
    setInvoices(invoices.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          tasks: inv.tasks.map(task => {
            if (task.id === taskId) {
              return { ...task, status: task.status === 'completada' ? 'pendiente' : 'completada' }
            }
            return task
          })
        }
      }
      return inv
    }))
  }

  const handleFileUpload = (invoiceId: string, file: File) => {
    const newAttachment = {
      id: `att${Date.now()}`,
      name: file.name,
      date: new Date().toISOString().split('T')[0],
      type: "image"
    }
    setInvoices(invoices.map(inv => {
      if (inv.id === invoiceId) {
        return { ...inv, attachments: [...inv.attachments, newAttachment] }
      }
      return inv
    }))
    setShowUpload(null)
  }

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Facturado</p>
                <p className="text-xl font-bold">${stats.total.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagadas</p>
                <p className="text-xl font-bold text-green-600">${stats.pagadas.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <ClockIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Por Cobrar</p>
                <p className="text-xl font-bold text-amber-600">${stats.porCobrar.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vencidas</p>
                <p className="text-xl font-bold text-red-600">${stats.vencidas.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Fee Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Cuota Mensual</p>
                <p className="text-sm text-muted-foreground">Día de facturación: {project.billing.billingDay} de cada mes</p>
              </div>
            </div>
            <p className="text-2xl font-bold">${project.billing.monthlyFee.toLocaleString()} {project.billing.currency}</p>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Historial de Facturación
          </CardTitle>
          <CardDescription>Lista mensual de facturas y estado de cobranza</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invoices
              .sort((a, b) => b.month.localeCompare(a.month))
              .map((invoice) => {
                const status = statusConfig[invoice.status]
                const isExpanded = selectedInvoice === invoice.id
                const pendingTasks = invoice.tasks.filter(t => t.status !== 'completada').length

                return (
                  <div key={invoice.id} className="border rounded-lg overflow-hidden">
                    {/* Invoice Header */}
                    <div 
                      className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${isExpanded ? 'bg-muted/30' : ''}`}
                      onClick={() => setSelectedInvoice(isExpanded ? null : invoice.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${status.bgColor}`}>
                            <span className={status.color}>{status.icon}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{invoice.period}</p>
                              <Badge variant="outline" className="text-xs">{invoice.invoiceNumber}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Emitida: {new Date(invoice.invoiceDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {' | '}Vence: {new Date(invoice.dueDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-lg">${invoice.amount.toLocaleString()}</p>
                            <Badge className={`${status.bgColor} ${status.color} border-0`}>
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            {pendingTasks > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {pendingTasks} pendiente{pendingTasks > 1 ? 's' : ''}
                              </Badge>
                            )}
                            {invoice.attachments.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <FileImage className="h-3 w-3 mr-1" />
                                {invoice.attachments.length}
                              </Badge>
                            )}
                            <ChevronRight className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t bg-muted/20 p-4 space-y-4">
                        {/* Invoice Details */}
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm flex items-center gap-2">
                              <ListTodo className="h-4 w-4" />
                              Tareas de Cobranza ({invoice.tasks.length})
                            </h4>
                            <div className="space-y-2">
                              {invoice.tasks.map((task) => (
                                <div 
                                  key={task.id} 
                                  className="flex items-center gap-3 p-2 rounded-lg bg-background border"
                                >
                                  <Checkbox 
                                    checked={task.status === 'completada'}
                                    onCheckedChange={() => toggleTaskStatus(invoice.id, task.id)}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${task.status === 'completada' ? 'line-through text-muted-foreground' : ''}`}>
                                      {task.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(task.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} - {task.assignee}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              
                              {/* Add New Task */}
                              {showNewTask === invoice.id ? (
                                <div className="flex gap-2">
                                  <Input 
                                    placeholder="Nueva tarea de cobranza..."
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    className="flex-1"
                                    onKeyDown={(e) => e.key === 'Enter' && addTask(invoice.id)}
                                  />
                                  <Button size="sm" onClick={() => addTask(invoice.id)}>Agregar</Button>
                                  <Button size="sm" variant="ghost" onClick={() => { setShowNewTask(null); setNewTaskTitle("") }}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full"
                                  onClick={() => setShowNewTask(invoice.id)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Agregar Tarea
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium text-sm flex items-center gap-2">
                              <FileImage className="h-4 w-4" />
                              Comprobantes de Comunicación ({invoice.attachments.length})
                            </h4>
                            <div className="space-y-2">
                              {invoice.attachments.map((attachment) => (
                                <div 
                                  key={attachment.id} 
                                  className="flex items-center gap-3 p-2 rounded-lg bg-background border"
                                >
                                  <div className="p-2 rounded bg-muted">
                                    <FileImage className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate">{attachment.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(attachment.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                  </div>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}

                              {invoice.attachments.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-2">
                                  No hay comprobantes adjuntos
                                </p>
                              )}

                              {/* Upload Attachment */}
                              {showUpload === invoice.id ? (
                                <div className="p-4 border-2 border-dashed rounded-lg text-center">
                                  <input 
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    id={`upload-${invoice.id}`}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) handleFileUpload(invoice.id, file)
                                    }}
                                  />
                                  <label 
                                    htmlFor={`upload-${invoice.id}`}
                                    className="cursor-pointer"
                                  >
                                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                      Haz clic para seleccionar imagen
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      JPG, PNG (máx. 5MB)
                                    </p>
                                  </label>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="mt-2"
                                    onClick={() => setShowUpload(null)}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full"
                                  onClick={() => setShowUpload(invoice.id)}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Subir Comprobante
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Payment Info */}
                        {invoice.status === 'pagada' && invoice.paidDate && (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm">
                              Pagada el {new Date(invoice.paidDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                        )}

                        {invoice.status === 'vencida' && (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm">
                              Vencida desde el {new Date(invoice.dueDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })} - 
                              {' '}{Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))} días de atraso
                            </span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2 border-t">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Factura
                          </Button>
                          {invoice.status === 'por_cobrar' && (
                            <Button variant="outline" size="sm">
                              <Send className="h-4 w-4 mr-2" />
                              Enviar Recordatorio
                            </Button>
                          )}
                          {(invoice.status === 'por_cobrar' || invoice.status === 'vencida') && (
                            <Button size="sm">
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Marcar como Pagada
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
