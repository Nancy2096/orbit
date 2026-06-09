"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  Building2,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  ExternalLink,
  Download,
  Eye,
  ThumbsUp,
  ThumbsDown,
  History,
  FileImage,
  FileVideo,
  File,
  Link as LinkIcon,
  User,
  Users,
} from "lucide-react"
import Link from "next/link"

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
  { id: "user-2", name: "Carlos Ruiz", initials: "CR" },
  { id: "user-3", name: "María López", initials: "ML" },
  { id: "user-4", name: "Laura Vega", initials: "LV" },
  { id: "user-5", name: "Roberto Sánchez", initials: "RS" },
  { id: "user-6", name: "Ana Torres", initials: "AT" },
  { id: "user-7", name: "Pedro Martínez", initials: "PM" },
]

// Projects for filter
const projectsList = [
  { id: "proj-1", name: "Campaña Leads Q2", client: "Desarrolladora Horizonte" },
  { id: "proj-2", name: "Landing Torre Central", client: "Torre Central Living" },
  { id: "proj-3", name: "Branding Residencial", client: "Residencial Bosques" },
  { id: "proj-4", name: "SEO Mensual Mayo", client: "Grupo Inmobiliario Altiva" },
  { id: "proj-5", name: "Renders 3D", client: "Nova Arquitectura" },
]

const deliverableStatusConfig = {
  en_preparacion: { label: "En Preparación", color: "bg-slate-500", textColor: "text-slate-600" },
  revision_interna: { label: "Revisión Interna", color: "bg-cyan-500", textColor: "text-cyan-600" },
  revision_cliente: { label: "Revisión Cliente", color: "bg-blue-500", textColor: "text-blue-600" },
  cambios: { label: "Cambios Solicitados", color: "bg-amber-500", textColor: "text-amber-600" },
  aprobado: { label: "Aprobado", color: "bg-emerald-500", textColor: "text-emerald-600" },
  rechazado: { label: "Rechazado", color: "bg-red-500", textColor: "text-red-600" },
  entregado: { label: "Entregado", color: "bg-green-600", textColor: "text-green-700" },
  publicado: { label: "Publicado", color: "bg-purple-500", textColor: "text-purple-600" },
}

const deliverableTypes = {
  arte_redes: { label: "Artes para Redes", icon: FileImage },
  calendario: { label: "Calendario de Contenido", icon: Calendar },
  landing: { label: "Landing Page", icon: LinkIcon },
  campana: { label: "Campaña", icon: Activity },
  reporte: { label: "Reporte", icon: FileText },
  render: { label: "Render 3D", icon: FileImage },
  video: { label: "Video", icon: FileVideo },
  copy: { label: "Copy", icon: FileText },
  web: { label: "Página Web", icon: LinkIcon },
  blog: { label: "Blog Post", icon: FileText },
  presentacion: { label: "Presentación", icon: File },
  branding: { label: "Branding", icon: FileImage },
}

const dummyDeliverables = [
  { 
    id: "1", 
    name: "Artes redes mayo - Campaña Leads", 
    client: "Desarrolladora Horizonte", 
    project: "Campaña Leads Q2",
    type: "arte_redes",
    status: "aprobado", 
    assignee: "Diana García",
    dueDate: "2026-05-08",
    approvedDate: "2026-05-08",
    approvedBy: "Cliente - Juan Pérez",
    version: 3,
    comments: 5,
    clientVisible: true,
    link: "#",
  },
  { 
    id: "2", 
    name: "Landing page v2 - Torre Central", 
    client: "Torre Central Living", 
    project: "Landing Torre Central",
    type: "landing",
    status: "revision_cliente", 
    assignee: "Carlos Ruiz",
    dueDate: "2026-05-12",
    version: 2,
    comments: 8,
    clientVisible: true,
    link: "#",
  },
  { 
    id: "3", 
    name: "Calendario contenidos mayo", 
    client: "Residencial Bosques", 
    project: "Branding Residencial",
    type: "calendario",
    status: "cambios", 
    assignee: "Laura Vega",
    dueDate: "2026-05-10",
    version: 1,
    comments: 12,
    clientVisible: true,
    link: "#",
  },
  { 
    id: "4", 
    name: "Reporte campañas abril", 
    client: "Grupo Inmobiliario Altiva", 
    project: "SEO Mensual Mayo",
    type: "reporte",
    status: "aprobado", 
    assignee: "Ana Torres",
    dueDate: "2026-05-05",
    approvedDate: "2026-05-05",
    approvedBy: "Cliente - María Gómez",
    version: 1,
    comments: 2,
    clientVisible: true,
    link: "#",
  },
  { 
    id: "5", 
    name: "Render fachada principal", 
    client: "Nova Arquitectura", 
    project: "Renders 3D",
    type: "render",
    status: "en_preparacion", 
    assignee: "Roberto Sánchez",
    dueDate: "2026-05-15",
    version: 1,
    comments: 0,
    clientVisible: false,
    link: "#",
  },
  { 
    id: "6", 
    name: "Video promocional 30s", 
    client: "Residencial Bosques", 
    project: "Branding Residencial",
    type: "video",
    status: "revision_interna", 
    assignee: "Pedro Martínez",
    dueDate: "2026-05-18",
    version: 1,
    comments: 3,
    clientVisible: false,
    link: "#",
  },
  { 
    id: "7", 
    name: "Copies landing - Torre Central", 
    client: "Torre Central Living", 
    project: "Landing Torre Central",
    type: "copy",
    status: "aprobado", 
    assignee: "María López",
    dueDate: "2026-05-09",
    approvedDate: "2026-05-09",
    approvedBy: "Interno - Eduardo M.",
    version: 2,
    comments: 4,
    clientVisible: false,
    link: "#",
  },
  { 
    id: "8", 
    name: "Manual de marca Bosques", 
    client: "Residencial Bosques", 
    project: "Branding Residencial",
    type: "branding",
    status: "en_preparacion", 
    assignee: "Diana García",
    dueDate: "2026-05-25",
    version: 1,
    comments: 0,
    clientVisible: false,
    link: "#",
  },
]

export default function DeliverablesPage() {
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [agencies, setAgencies] = useState<any[]>([])
  const [selectedAgency, setSelectedAgency] = useState("all")
  const [filterPerson, setFilterPerson] = useState(currentUser.name) // Default to current user
  const [filterProject, setFilterProject] = useState("all")
  const [showMyDeliverablesOnly, setShowMyDeliverablesOnly] = useState(true) // Start with "My Deliverables" selected

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("agencies").select("id, name").eq("is_active", true)
      if (data) setAgencies(data)
      setLoading(false)
    }
    fetchData()
  }, [])

  const filteredDeliverables = dummyDeliverables.filter(d => {
    if (searchQuery && !d.name.toLowerCase().includes(searchQuery.toLowerCase()) && !d.assignee.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterStatus !== "all" && d.status !== filterStatus) return false
    if (filterType !== "all" && d.type !== filterType) return false
    if (filterPerson !== "all" && d.assignee !== filterPerson) return false
    if (filterProject !== "all" && d.project !== filterProject) return false
    return true
  })

  // My deliverables stats
  const myDeliverables = dummyDeliverables.filter(d => d.assignee === currentUser.name)
  const myPendingApproval = myDeliverables.filter(d => d.status === "revision_cliente").length
  const myInProgress = myDeliverables.filter(d => d.status === "en_preparacion" || d.status === "revision_interna").length

  // General stats
  const pendingApproval = dummyDeliverables.filter(d => d.status === "revision_cliente").length
  const approved = dummyDeliverables.filter(d => d.status === "aprobado").length
  const needsChanges = dummyDeliverables.filter(d => d.status === "cambios").length
  const inProgress = dummyDeliverables.filter(d => d.status === "en_preparacion" || d.status === "revision_interna").length

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
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
            <FileCheck className="h-7 w-7 text-primary" />
            Entregables
          </h1>
          <p className="text-muted-foreground">Gestiona aprobaciones y versiones de entregables</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Entregable
          </Button>
        </div>
      </div>

      {/* My Deliverables Toggle Section */}
      <Card className={showMyDeliverablesOnly ? "border-primary bg-primary/5" : ""}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant={showMyDeliverablesOnly ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setShowMyDeliverablesOnly(true)
                  setFilterPerson(currentUser.name)
                }}
                className="gap-2"
              >
                <User className="h-4 w-4" />
                Mis Entregables
              </Button>
              <Button
                variant={!showMyDeliverablesOnly ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setShowMyDeliverablesOnly(false)
                  setFilterPerson("all")
                }}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                Todos los Entregables
              </Button>
            </div>
            
            {showMyDeliverablesOnly && (
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
                    <p className="text-lg font-bold text-primary">{myDeliverables.length}</p>
                    <p className="text-xs text-muted-foreground">Asignados</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-amber-600">{myInProgress}</p>
                    <p className="text-xs text-muted-foreground">En Progreso</p>
                  </div>
                  {myPendingApproval > 0 && (
                    <div>
                      <p className="text-lg font-bold text-blue-600">{myPendingApproval}</p>
                      <p className="text-xs text-muted-foreground">Por Aprobar</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Pendientes Aprobación</p>
                <p className="text-2xl font-bold text-blue-700">{pendingApproval}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600">Con Cambios</p>
                <p className="text-2xl font-bold text-amber-700">{needsChanges}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600">Aprobados</p>
                <p className="text-2xl font-bold text-emerald-700">{approved}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Preparación</p>
                <p className="text-2xl font-bold">{inProgress}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar entregables o personas..." 
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
                setShowMyDeliverablesOnly(value === currentUser.name)
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
                {projectsList.map((proj) => (
                  <SelectItem key={proj.id} value={proj.name}>
                    <div className="flex items-center gap-2">
                      <span>{proj.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Estatus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estatus</SelectItem>
                {Object.entries(deliverableStatusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {Object.entries(deliverableTypes).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
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
            {(filterStatus !== "all" || filterType !== "all" || searchQuery || (filterPerson !== "all" && filterPerson !== currentUser.name) || filterProject !== "all") && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setFilterStatus("all")
                  setFilterType("all")
                  setSearchQuery("")
                  setFilterPerson(currentUser.name)
                  setFilterProject("all")
                  setShowMyDeliverablesOnly(true)
                }}
              >
                Limpiar filtros
              </Button>
            )}

            <div className="ml-auto text-sm text-muted-foreground">
              {filteredDeliverables.length} entregables
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deliverables Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDeliverables.map((deliverable) => {
          const status = deliverableStatusConfig[deliverable.status as keyof typeof deliverableStatusConfig]
          const TypeIcon = deliverableTypes[deliverable.type as keyof typeof deliverableTypes]?.icon || File

          return (
            <Card key={deliverable.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-muted">
                      <TypeIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {deliverableTypes[deliverable.type as keyof typeof deliverableTypes]?.label}
                    </Badge>
                  </div>
                  <Badge className={`${status.color} text-white text-xs`}>
                    {status.label}
                  </Badge>
                </div>

                {/* Title */}
                <h3 className="font-medium mb-1 line-clamp-2">{deliverable.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {deliverable.client} - {deliverable.project}
                </p>

                {/* Info */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{deliverable.dueDate}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <History className="h-3 w-3" />
                    <span>v{deliverable.version}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    <span>{deliverable.comments} comentarios</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    <span>{deliverable.clientVisible ? "Cliente" : "Interno"}</span>
                  </div>
                </div>

                {/* Approval info if approved */}
                {deliverable.status === "aprobado" && deliverable.approvedBy && (
                  <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 mb-3">
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3 inline mr-1" />
                      Aprobado por {deliverable.approvedBy}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">{deliverable.approvedDate}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {deliverable.assignee.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{deliverable.assignee}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                    {deliverable.status === "revision_cliente" && (
                      <>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                          <ThumbsUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50">
                          <ThumbsDown className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
