"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, 
  Instagram, Facebook, Linkedin, Youtube, Twitter,
  Image, Video, LayoutGrid, List, Grid3X3, 
  Clock, Edit, Copy, Trash2, Eye, Send,
  CheckCircle2, XCircle, AlertCircle, Sparkles,
  Upload, Hash, Link, User, FileText, History,
  Filter, Download, RefreshCw, MoreHorizontal, Play
} from "lucide-react"
import { mockSocialPosts } from "@/lib/marketing-intelligence/mock-data-phase2"
import type { SocialPost, PostStatus, SocialNetwork, PostFormat } from "@/lib/marketing-intelligence/types-phase2"

// Network icons
const networkIcons: Record<SocialNetwork, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
  twitter: Twitter,
  tiktok: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
    </svg>
  ),
  pinterest: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0a12 12 0 00-4.37 23.17c-.1-.94-.2-2.4.04-3.44l1.43-6.07s-.37-.74-.37-1.83c0-1.71.99-2.99 2.23-2.99 1.05 0 1.56.79 1.56 1.74 0 1.06-.68 2.64-1.03 4.1-.29 1.24.62 2.25 1.84 2.25 2.21 0 3.91-2.33 3.91-5.69 0-2.98-2.14-5.06-5.2-5.06-3.54 0-5.62 2.66-5.62 5.41 0 1.07.41 2.22.93 2.85a.37.37 0 01.09.36l-.35 1.41c-.05.23-.18.27-.42.17-1.56-.73-2.54-3.01-2.54-4.85 0-3.95 2.87-7.58 8.27-7.58 4.35 0 7.73 3.1 7.73 7.24 0 4.32-2.72 7.79-6.51 7.79-1.27 0-2.47-.66-2.88-1.44l-.78 2.99c-.28 1.09-1.05 2.45-1.56 3.28A12 12 0 1012 0z" />
    </svg>
  ),
  threads: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.17.408-2.133 1.37-2.788.812-.552 1.862-.9 3.04-.987.896-.066 1.728-.015 2.48.13-.045-.797-.22-1.405-.518-1.82-.39-.538-1.017-.817-1.865-.83-1.17-.017-2.105.41-2.508 1.146l-1.776-1.058c.757-1.38 2.36-2.203 4.299-2.172 1.44.024 2.596.482 3.437 1.362.755.79 1.206 1.878 1.342 3.233.457.166.869.374 1.23.624 1.323.913 2.126 2.3 2.321 4.012.257 2.254-.534 4.282-2.295 5.872-1.686 1.524-4.063 2.357-7.034 2.468-.034 0-.068.001-.102.001zM12.1 13.61c-.993.07-1.766.29-2.302.656-.468.319-.658.7-.635 1.268.025.451.244.848.651 1.183.509.418 1.24.625 2.1.578 1.076-.06 1.91-.44 2.48-1.133.458-.558.758-1.316.895-2.261-.93-.265-1.963-.376-3.189-.29z" />
    </svg>
  ),
  bluesky: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 01-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.479 0-.689-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z" />
    </svg>
  ),
}

const networkColors: Record<SocialNetwork, string> = {
  instagram: "#E4405F",
  facebook: "#1877F2",
  tiktok: "#000000",
  linkedin: "#0A66C2",
  youtube: "#FF0000",
  pinterest: "#E60023",
  twitter: "#000000",
  threads: "#000000",
  bluesky: "#0085FF",
}

const statusConfig: Record<PostStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  idea: { label: "Idea", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", icon: Sparkles },
  en_redaccion: { label: "En redacción", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", icon: FileText },
  en_diseno: { label: "En diseño", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300", icon: Image },
  en_revision: { label: "En revisión", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300", icon: Eye },
  aprobado: { label: "Aprobado", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", icon: CheckCircle2 },
  programado: { label: "Programado", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300", icon: Clock },
  publicado: { label: "Publicado", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300", icon: Send },
  rechazado: { label: "Rechazado", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", icon: XCircle },
}

const formatIcons: Record<PostFormat, React.ComponentType<{ className?: string }>> = {
  imagen: Image,
  video: Video,
  carrusel: LayoutGrid,
  reel: Play,
  story: Clock,
  short: Play,
  pin: Image,
  thread: FileText,
}

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

export default function CalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 0, 15)) // January 2024
  const [view, setView] = useState<"month" | "week" | "day" | "grid" | "list">("month")
  const [selectedClient, setSelectedClient] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedNetwork, setSelectedNetwork] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null)
  const [isPostDetailOpen, setIsPostDetailOpen] = useState(false)

  // Filter posts
  const filteredPosts = useMemo(() => {
    return mockSocialPosts.filter(post => {
      if (selectedClient !== "all" && post.clientId !== selectedClient) return false
      if (selectedStatus !== "all" && post.status !== selectedStatus) return false
      if (selectedNetwork !== "all" && !post.networks.includes(selectedNetwork as SocialNetwork)) return false
      return true
    })
  }, [selectedClient, selectedStatus, selectedNetwork])

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    
    const days: (number | null)[] = []
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  // Get posts for a specific date
  const getPostsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return filteredPosts.filter(post => post.scheduledDate === dateStr)
  }

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date(2024, 0, 15))
  }

  // Get week days
  const getWeekDays = () => {
    const start = new Date(currentDate)
    start.setDate(start.getDate() - start.getDay())
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      days.push(d)
    }
    return days
  }

  const renderPostCard = (post: SocialPost, compact = false) => {
    const StatusIcon = statusConfig[post.status].icon
    return (
      <div 
        key={post.id}
        className={`p-2 rounded-md border cursor-pointer hover:shadow-md transition-shadow ${compact ? 'text-xs' : ''}`}
        style={{ borderLeftColor: networkColors[post.networks[0]], borderLeftWidth: 3 }}
        onClick={() => {
          setSelectedPost(post)
          setIsPostDetailOpen(true)
        }}
      >
        <div className="flex items-center gap-1 mb-1">
          {post.networks.slice(0, 2).map(network => {
            const Icon = networkIcons[network]
            return <Icon key={network} className="h-3 w-3" style={{ color: networkColors[network] }} />
          })}
          {post.networks.length > 2 && (
            <span className="text-[10px] text-muted-foreground">+{post.networks.length - 2}</span>
          )}
          <Badge variant="outline" className={`ml-auto text-[10px] px-1 py-0 ${statusConfig[post.status].color}`}>
            {statusConfig[post.status].label}
          </Badge>
        </div>
        <p className={`font-medium truncate ${compact ? 'text-xs' : 'text-sm'}`}>{post.copy.slice(0, 40)}...</p>
        <div className="flex items-center gap-2 mt-1 text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="text-[10px]">{post.scheduledTime}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendario de Contenido</h1>
          <p className="text-muted-foreground">Planifica y programa tus publicaciones</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Publicación
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nueva Publicación</DialogTitle>
                <DialogDescription>
                  Configura todos los detalles de tu publicación
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Select defaultValue="client-1">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client-1">Grupo Inmobiliario Premium</SelectItem>
                        <SelectItem value="client-2">Urbania Desarrollos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Marca</Label>
                    <Select defaultValue="brand-1">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brand-1">Bosques Living</SelectItem>
                        <SelectItem value="brand-2">Altavista Plaza</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Redes Sociales</Label>
                  <div className="flex flex-wrap gap-3">
                    {(["instagram", "facebook", "tiktok", "linkedin", "youtube", "twitter", "threads", "bluesky"] as SocialNetwork[]).map(network => {
                      const Icon = networkIcons[network]
                      return (
                        <label key={network} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox id={network} />
                          <Icon className="h-4 w-4" style={{ color: networkColors[network] }} />
                          <span className="text-sm capitalize">{network}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Formato</Label>
                    <Select defaultValue="imagen">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="imagen">Imagen</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="carrusel">Carrusel</SelectItem>
                        <SelectItem value="reel">Reel</SelectItem>
                        <SelectItem value="story">Story</SelectItem>
                        <SelectItem value="short">Short</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select defaultValue="idea">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusConfig).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora</Label>
                    <Input type="time" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Copy / Idea</Label>
                  <Textarea placeholder="Escribe el copy o la idea principal..." rows={3} />
                </div>

                <div className="space-y-2">
                  <Label>Caption</Label>
                  <Textarea placeholder="Escribe el caption completo..." rows={4} />
                </div>

                <div className="space-y-2">
                  <Label>Hashtags</Label>
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <Input placeholder="#hashtag1 #hashtag2 #hashtag3" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CTA</Label>
                    <Input placeholder="Ej: Agenda tu visita" />
                  </div>
                  <div className="space-y-2">
                    <Label>Link</Label>
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4 text-muted-foreground" />
                      <Input placeholder="https://..." />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Archivo Creativo</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Arrastra un archivo o haz clic para subir</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, MP4 hasta 100MB</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Responsable Copy</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maria">María García</SelectItem>
                        <SelectItem value="carlos">Carlos López</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Responsable Diseño</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="carlos">Carlos López</SelectItem>
                        <SelectItem value="ana">Ana Martínez</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Aprobador</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ana">Ana Martínez</SelectItem>
                        <SelectItem value="roberto">Roberto Sánchez</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Comentarios Internos</Label>
                  <Textarea placeholder="Notas internas del equipo..." rows={2} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="outline">
                  Guardar Borrador
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(false)}>
                  Crear Publicación
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters & Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold min-w-[180px] text-center">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoy
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los clientes</SelectItem>
                  <SelectItem value="client-1">Grupo Inmobiliario</SelectItem>
                  <SelectItem value="client-2">Urbania Desarrollos</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Red social" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las redes</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {Object.entries(statusConfig).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
                <TabsList>
                  <TabsTrigger value="month">
                    <CalendarIcon className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="week">
                    <Grid3X3 className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="grid">
                    <LayoutGrid className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="list">
                    <List className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Views */}
      {view === "month" && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
              {/* Header */}
              {DAYS.map(day => (
                <div key={day} className="bg-background p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              {/* Days */}
              {getDaysInMonth(currentDate).map((day, idx) => {
                const posts = day ? getPostsForDate(day) : []
                const isToday = day === 15 && currentDate.getMonth() === 0 && currentDate.getFullYear() === 2024
                return (
                  <div 
                    key={idx} 
                    className={`bg-background min-h-[120px] p-2 ${day ? 'hover:bg-muted/50' : ''} transition-colors`}
                  >
                    {day && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${isToday ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {posts.slice(0, 2).map(post => renderPostCard(post, true))}
                          {posts.length > 2 && (
                            <p className="text-xs text-muted-foreground text-center">+{posts.length - 2} más</p>
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
      )}

      {view === "week" && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-4">
              {getWeekDays().map((date, idx) => {
                const day = date.getDate()
                const posts = getPostsForDate(day)
                return (
                  <div key={idx} className="space-y-2">
                    <div className="text-center p-2 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">{DAYS[date.getDay()]}</p>
                      <p className="text-lg font-semibold">{day}</p>
                    </div>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2 pr-2">
                        {posts.map(post => renderPostCard(post))}
                        {posts.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-4">Sin publicaciones</p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {view === "grid" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPosts.map(post => (
            <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
              setSelectedPost(post)
              setIsPostDetailOpen(true)
            }}>
              <div className="aspect-square bg-muted relative">
                {post.mediaUrl ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
                    {post.mediaType === "video" ? (
                      <Play className="h-12 w-12 text-muted-foreground" />
                    ) : (
                      <Image className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  {post.networks.map(network => {
                    const Icon = networkIcons[network]
                    return (
                      <div key={network} className="p-1 rounded bg-background/80">
                        <Icon className="h-4 w-4" style={{ color: networkColors[network] }} />
                      </div>
                    )
                  })}
                </div>
                <Badge className={`absolute top-2 right-2 ${statusConfig[post.status].color}`}>
                  {statusConfig[post.status].label}
                </Badge>
              </div>
              <CardContent className="p-4">
                <p className="font-medium text-sm line-clamp-2 mb-2">{post.copy}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{post.brandName}</span>
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {post.scheduledDate}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {view === "list" && (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredPosts.map(post => (
                <div key={post.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => {
                  setSelectedPost(post)
                  setIsPostDetailOpen(true)
                }}>
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    {post.mediaType === "video" ? (
                      <Play className="h-6 w-6 text-muted-foreground" />
                    ) : (
                      <Image className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {post.networks.map(network => {
                        const Icon = networkIcons[network]
                        return <Icon key={network} className="h-4 w-4" style={{ color: networkColors[network] }} />
                      })}
                      <Badge variant="outline" className={statusConfig[post.status].color}>
                        {statusConfig[post.status].label}
                      </Badge>
                    </div>
                    <p className="font-medium text-sm truncate">{post.copy}</p>
                    <p className="text-xs text-muted-foreground">{post.brandName} - {post.clientName}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">{post.scheduledDate}</p>
                    <p className="text-xs text-muted-foreground">{post.scheduledTime}</p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post Detail Dialog */}
      <Dialog open={isPostDetailOpen} onOpenChange={setIsPostDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedPost && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle>Detalle de Publicación</DialogTitle>
                    <DialogDescription>{selectedPost.brandName} - {selectedPost.clientName}</DialogDescription>
                  </div>
                  <Badge className={statusConfig[selectedPost.status].color}>
                    {statusConfig[selectedPost.status].label}
                  </Badge>
                </div>
              </DialogHeader>
              <div className="grid gap-6 md:grid-cols-2 py-4">
                {/* Preview */}
                <div className="space-y-4">
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                    {selectedPost.mediaType === "video" ? (
                      <Play className="h-16 w-16 text-muted-foreground" />
                    ) : (
                      <Image className="h-16 w-16 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Label>Redes:</Label>
                    <div className="flex gap-1">
                      {selectedPost.networks.map(network => {
                        const Icon = networkIcons[network]
                        return (
                          <div key={network} className="p-1.5 rounded-lg border">
                            <Icon className="h-5 w-5" style={{ color: networkColors[network] }} />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Copy</Label>
                    <p className="mt-1">{selectedPost.copy}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Caption</Label>
                    <p className="mt-1 whitespace-pre-wrap">{selectedPost.caption}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Hashtags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedPost.hashtags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Fecha</Label>
                      <p className="mt-1 font-medium">{selectedPost.scheduledDate}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Hora</Label>
                      <p className="mt-1 font-medium">{selectedPost.scheduledTime}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground text-xs">Copy</Label>
                      <p className="font-medium">{selectedPost.copyResponsible}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Diseño</Label>
                      <p className="font-medium">{selectedPost.designResponsible || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Aprobación</Label>
                      <p className="font-medium">{selectedPost.approvalResponsible}</p>
                    </div>
                  </div>

                  {/* History */}
                  {selectedPost.history.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Historial
                      </Label>
                      <div className="mt-2 space-y-2">
                        {selectedPost.history.map(entry => (
                          <div key={entry.id} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span className="text-muted-foreground">{new Date(entry.timestamp).toLocaleDateString()}</span>
                            <span>{entry.action}</span>
                            <span className="text-muted-foreground">por {entry.userName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicar
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredPosts.filter(p => p.status === "programado").length}</p>
                <p className="text-xs text-muted-foreground">Programadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
                <Eye className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredPosts.filter(p => p.status === "en_revision").length}</p>
                <p className="text-xs text-muted-foreground">En revisión</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredPosts.filter(p => p.status === "aprobado").length}</p>
                <p className="text-xs text-muted-foreground">Aprobadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900">
                <Send className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredPosts.filter(p => p.status === "publicado").length}</p>
                <p className="text-xs text-muted-foreground">Publicadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
