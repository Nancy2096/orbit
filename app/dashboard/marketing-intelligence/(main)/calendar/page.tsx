"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Grid3X3,
  List,
  Filter,
  MoreHorizontal,
  Clock,
  Image as ImageIcon,
  Video,
  Copy,
  Trash2,
  Edit,
  Eye,
  Send,
  Save,
  X,
  Hash,
  Link2,
  Users,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Upload,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Circle,
  Pencil,
  Palette,
  FileCheck,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { mockSocialPosts, mockBestPostingTimes } from "@/lib/marketing-intelligence/mock-data-phase2"
import { mockMIClients, mockMIBrands } from "@/lib/marketing-intelligence/mock-data"
import type { SocialPost, PostStatus, SocialNetwork, PostFormat } from "@/lib/marketing-intelligence/types-phase2"

// Network icons
const networkIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
    </svg>
  ),
  twitter: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  threads: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.17.408-2.133 1.37-2.788.812-.552 1.862-.9 3.04-.987.896-.066 1.728-.015 2.48.13-.045-.797-.22-1.405-.518-1.82-.39-.538-1.017-.817-1.865-.83-1.17-.017-2.105.41-2.508 1.146l-1.776-1.058c.757-1.38 2.36-2.203 4.299-2.172 1.44.024 2.596.482 3.437 1.362.755.79 1.206 1.878 1.342 3.233.457.166.869.374 1.23.624 1.323.913 2.126 2.3 2.321 4.012.257 2.254-.534 4.282-2.295 5.872-1.686 1.524-4.063 2.357-7.034 2.468-.034 0-.068.001-.102.001zM12.1 13.61c-.993.07-1.766.29-2.302.656-.468.319-.658.7-.635 1.268.025.451.244.848.651 1.183.509.418 1.24.625 2.1.578 1.076-.06 1.91-.44 2.48-1.133.458-.558.758-1.316.895-2.261-.93-.265-1.963-.376-3.189-.29z" />
    </svg>
  ),
  bluesky: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 01-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.479 0-.689-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z" />
    </svg>
  ),
  pinterest: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0a12 12 0 00-4.37 23.17c-.1-.94-.2-2.4.04-3.44l1.43-6.07s-.37-.74-.37-1.83c0-1.71.99-2.99 2.23-2.99 1.05 0 1.56.79 1.56 1.74 0 1.06-.68 2.64-1.03 4.1-.29 1.24.62 2.25 1.84 2.25 2.21 0 3.91-2.33 3.91-5.69 0-2.98-2.14-5.06-5.2-5.06-3.54 0-5.62 2.66-5.62 5.41 0 1.07.41 2.22.93 2.85a.37.37 0 01.09.36l-.35 1.41c-.05.23-.18.27-.42.17-1.56-.73-2.54-3.01-2.54-4.85 0-3.95 2.87-7.58 8.27-7.58 4.35 0 7.73 3.1 7.73 7.24 0 4.32-2.72 7.79-6.51 7.79-1.27 0-2.47-.66-2.88-1.44l-.78 2.99c-.28 1.09-1.05 2.45-1.56 3.28A12 12 0 1012 0z" />
    </svg>
  ),
}

const networkColors: Record<string, string> = {
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
  idea: { label: "Idea", color: "bg-gray-500", icon: Circle },
  en_redaccion: { label: "En Redacción", color: "bg-blue-500", icon: Pencil },
  en_diseno: { label: "En Diseño", color: "bg-purple-500", icon: Palette },
  en_revision: { label: "En Revisión", color: "bg-amber-500", icon: FileCheck },
  aprobado: { label: "Aprobado", color: "bg-green-500", icon: CheckCircle },
  programado: { label: "Programado", color: "bg-cyan-500", icon: Clock },
  publicado: { label: "Publicado", color: "bg-emerald-600", icon: Send },
  rechazado: { label: "Rechazado", color: "bg-red-500", icon: AlertCircle },
}

const formatOptions: { value: PostFormat; label: string }[] = [
  { value: "imagen", label: "Imagen" },
  { value: "video", label: "Video" },
  { value: "carrusel", label: "Carrusel" },
  { value: "reel", label: "Reel" },
  { value: "story", label: "Story" },
  { value: "short", label: "Short" },
  { value: "pin", label: "Pin" },
  { value: "thread", label: "Thread" },
]

const networkOptions: { value: SocialNetwork; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "youtube", label: "YouTube" },
  { value: "twitter", label: "X / Twitter" },
  { value: "threads", label: "Threads" },
  { value: "bluesky", label: "Bluesky" },
  { value: "pinterest", label: "Pinterest" },
]

// Calendar helpers
const daysOfWeek = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function ContentCalendarPage() {
  const [view, setView] = useState<"month" | "week" | "day" | "list" | "grid">("month")
  const [currentDate, setCurrentDate] = useState(new Date(2024, 0, 15)) // January 2024
  const [posts, setPosts] = useState<SocialPost[]>(mockSocialPosts)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showPostDetail, setShowPostDetail] = useState(false)
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterNetwork, setFilterNetwork] = useState<string>("all")

  // New post form state
  const [newPost, setNewPost] = useState({
    clientId: "",
    brandId: "",
    networks: [] as SocialNetwork[],
    format: "imagen" as PostFormat,
    copy: "",
    caption: "",
    hashtags: "",
    cta: "",
    link: "",
    scheduledDate: "",
    scheduledTime: "",
    copyResponsible: "",
    designResponsible: "",
    approvalResponsible: "",
  })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  // Filter posts
  const filteredPosts = posts.filter(post => {
    if (filterStatus !== "all" && post.status !== filterStatus) return false
    if (filterNetwork !== "all" && !post.networks.includes(filterNetwork as SocialNetwork)) return false
    return true
  })

  // Get posts for a specific date
  const getPostsForDate = (date: string) => {
    return filteredPosts.filter(post => post.scheduledDate === date)
  }

  // Navigate calendar
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  // Handle network toggle
  const toggleNetwork = (network: SocialNetwork) => {
    setNewPost(prev => ({
      ...prev,
      networks: prev.networks.includes(network)
        ? prev.networks.filter(n => n !== network)
        : [...prev.networks, network]
    }))
  }

  // Create new post
  const handleCreatePost = () => {
    const post: SocialPost = {
      id: `post-${Date.now()}`,
      clientId: newPost.clientId,
      clientName: mockMIClients.find(c => c.id === newPost.clientId)?.name || "",
      brandId: newPost.brandId,
      brandName: mockMIBrands.find(b => b.id === newPost.brandId)?.name || "",
      networks: newPost.networks,
      format: newPost.format,
      status: "idea",
      copy: newPost.copy,
      caption: newPost.caption,
      hashtags: newPost.hashtags.split(",").map(h => h.trim()).filter(Boolean),
      cta: newPost.cta,
      link: newPost.link,
      mediaUrl: "",
      mediaType: newPost.format === "video" || newPost.format === "reel" ? "video" : "image",
      scheduledDate: newPost.scheduledDate,
      scheduledTime: newPost.scheduledTime,
      copyResponsible: newPost.copyResponsible,
      designResponsible: newPost.designResponsible,
      approvalResponsible: newPost.approvalResponsible,
      internalComments: [],
      clientComments: [],
      history: [
        { id: `h-${Date.now()}`, action: "Creado", userId: "current", userName: "Usuario Actual", timestamp: new Date().toISOString() }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setPosts(prev => [...prev, post])
    setShowCreateDialog(false)
    setNewPost({
      clientId: "",
      brandId: "",
      networks: [],
      format: "imagen",
      copy: "",
      caption: "",
      hashtags: "",
      cta: "",
      link: "",
      scheduledDate: "",
      scheduledTime: "",
      copyResponsible: "",
      designResponsible: "",
      approvalResponsible: "",
    })
  }

  // Update post status
  const updatePostStatus = (postId: string, newStatus: PostStatus) => {
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { 
            ...p, 
            status: newStatus, 
            updatedAt: new Date().toISOString(),
            history: [...p.history, {
              id: `h-${Date.now()}`,
              action: `Estado cambiado a ${statusConfig[newStatus].label}`,
              userId: "current",
              userName: "Usuario Actual",
              timestamp: new Date().toISOString()
            }]
          } 
        : p
    ))
  }

  // Render calendar grid
  const renderCalendarGrid = () => {
    const days = []
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 border-r border-b bg-muted/30" />)
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const dayPosts = getPostsForDate(dateStr)
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()
      
      days.push(
        <div 
          key={day} 
          className={cn(
            "h-32 border-r border-b p-1 overflow-hidden",
            isToday && "bg-primary/5"
          )}
        >
          <div className={cn(
            "text-sm font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
            isToday && "bg-primary text-primary-foreground"
          )}>
            {day}
          </div>
          <div className="space-y-1 overflow-y-auto max-h-[calc(100%-28px)]">
            {dayPosts.slice(0, 3).map(post => {
              const StatusIcon = statusConfig[post.status].icon
              return (
                <div
                  key={post.id}
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded cursor-pointer truncate flex items-center gap-1",
                    "bg-primary/10 hover:bg-primary/20 transition-colors"
                  )}
                  onClick={() => {
                    setSelectedPost(post)
                    setShowPostDetail(true)
                  }}
                >
                  <StatusIcon className="h-2.5 w-2.5 flex-shrink-0" />
                  <span className="truncate">{post.copy}</span>
                </div>
              )
            })}
            {dayPosts.length > 3 && (
              <div className="text-[10px] text-muted-foreground px-1">
                +{dayPosts.length - 3} más
              </div>
            )}
          </div>
        </div>
      )
    }
    
    return days
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendario de Contenido</h1>
          <p className="text-muted-foreground">Planifica y gestiona tus publicaciones en redes sociales</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Publicación
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nueva Publicación</DialogTitle>
                <DialogDescription>
                  Completa los detalles para crear un nuevo post
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                {/* Client and Brand */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Select value={newPost.clientId} onValueChange={(v) => setNewPost(p => ({ ...p, clientId: v, brandId: "" }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockMIClients.map(client => (
                          <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Marca</Label>
                    <Select value={newPost.brandId} onValueChange={(v) => setNewPost(p => ({ ...p, brandId: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar marca" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockMIBrands
                          .filter(b => !newPost.clientId || b.clientId === newPost.clientId)
                          .map(brand => (
                            <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Networks */}
                <div className="space-y-2">
                  <Label>Redes Sociales</Label>
                  <div className="flex flex-wrap gap-2">
                    {networkOptions.map(network => {
                      const NetworkIcon = networkIcons[network.value]
                      const isSelected = newPost.networks.includes(network.value)
                      return (
                        <Button
                          key={network.value}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleNetwork(network.value)}
                          className="gap-2"
                        >
                          {NetworkIcon && <NetworkIcon className="h-4 w-4" />}
                          {network.label}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {/* Format and Schedule */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Formato</Label>
                    <Select value={newPost.format} onValueChange={(v) => setNewPost(p => ({ ...p, format: v as PostFormat }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {formatOptions.map(format => (
                          <SelectItem key={format.value} value={format.value}>{format.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Input 
                      type="date" 
                      value={newPost.scheduledDate}
                      onChange={(e) => setNewPost(p => ({ ...p, scheduledDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora</Label>
                    <Input 
                      type="time" 
                      value={newPost.scheduledTime}
                      onChange={(e) => setNewPost(p => ({ ...p, scheduledTime: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Best times recommendation */}
                {newPost.networks.length > 0 && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      Mejores horarios recomendados
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["12:00", "18:00", "21:00"].map(time => (
                        <Badge 
                          key={time} 
                          variant="outline" 
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                          onClick={() => setNewPost(p => ({ ...p, scheduledTime: time }))}
                        >
                          {time}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Copy and Caption */}
                <div className="space-y-2">
                  <Label>Copy / Título</Label>
                  <Input 
                    value={newPost.copy}
                    onChange={(e) => setNewPost(p => ({ ...p, copy: e.target.value }))}
                    placeholder="Título o idea principal del post"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Caption</Label>
                  <Textarea 
                    value={newPost.caption}
                    onChange={(e) => setNewPost(p => ({ ...p, caption: e.target.value }))}
                    placeholder="Texto completo de la publicación..."
                    rows={4}
                  />
                </div>

                {/* Hashtags and CTA */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hashtags</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        className="pl-9"
                        value={newPost.hashtags}
                        onChange={(e) => setNewPost(p => ({ ...p, hashtags: e.target.value }))}
                        placeholder="hashtag1, hashtag2, hashtag3"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>CTA</Label>
                    <Input 
                      value={newPost.cta}
                      onChange={(e) => setNewPost(p => ({ ...p, cta: e.target.value }))}
                      placeholder="Ej: Agenda tu visita"
                    />
                  </div>
                </div>

                {/* Link */}
                <div className="space-y-2">
                  <Label>Link</Label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      className="pl-9"
                      value={newPost.link}
                      onChange={(e) => setNewPost(p => ({ ...p, link: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* Media Upload */}
                <div className="space-y-2">
                  <Label>Archivo Creativo</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Arrastra archivos aquí o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, MP4 hasta 100MB
                    </p>
                  </div>
                </div>

                {/* Responsibles */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Responsable Copy</Label>
                    <Input 
                      value={newPost.copyResponsible}
                      onChange={(e) => setNewPost(p => ({ ...p, copyResponsible: e.target.value }))}
                      placeholder="Nombre"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Responsable Diseño</Label>
                    <Input 
                      value={newPost.designResponsible}
                      onChange={(e) => setNewPost(p => ({ ...p, designResponsible: e.target.value }))}
                      placeholder="Nombre"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Responsable Aprobación</Label>
                    <Input 
                      value={newPost.approvalResponsible}
                      onChange={(e) => setNewPost(p => ({ ...p, approvalResponsible: e.target.value }))}
                      placeholder="Nombre"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button variant="outline">
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Borrador
                </Button>
                <Button onClick={handleCreatePost}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Publicación
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterNetwork} onValueChange={setFilterNetwork}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Red social" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las redes</SelectItem>
              {networkOptions.map(network => (
                <SelectItem key={network.value} value={network.value}>{network.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border bg-muted/50 p-1">
            <Button
              variant={view === "month" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("month")}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {view === "month" && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold">
                  {monthNames[month]} {year}
                </h2>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Hoy
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Week days header */}
            <div className="grid grid-cols-7 border-b">
              {daysOfWeek.map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {renderCalendarGrid()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid View */}
      {view === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPosts.map(post => {
            const StatusIcon = statusConfig[post.status].icon
            return (
              <Card 
                key={post.id} 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => {
                  setSelectedPost(post)
                  setShowPostDetail(true)
                }}
              >
                <CardContent className="p-4">
                  {/* Media placeholder */}
                  <div className="aspect-square rounded-lg bg-muted mb-3 flex items-center justify-center">
                    {post.mediaType === "video" ? (
                      <Video className="h-12 w-12 text-muted-foreground" />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* Networks */}
                  <div className="flex items-center gap-1 mb-2">
                    {post.networks.map(network => {
                      const Icon = networkIcons[network]
                      return Icon ? (
                        <div
                          key={network}
                          className="flex h-5 w-5 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${networkColors[network]}20` }}
                        >
                          <Icon className="h-3 w-3" style={{ color: networkColors[network] }} />
                        </div>
                      ) : null
                    })}
                  </div>
                  
                  {/* Copy */}
                  <p className="text-sm font-medium line-clamp-2 mb-2">{post.copy}</p>
                  
                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <StatusIcon className={cn("h-3 w-3", statusConfig[post.status].color.replace("bg-", "text-"))} />
                      <span>{statusConfig[post.status].label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      <span>{post.scheduledDate}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Publicación</TableHead>
                  <TableHead>Redes</TableHead>
                  <TableHead>Formato</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map(post => {
                  const StatusIcon = statusConfig[post.status].icon
                  return (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="max-w-[300px]">
                          <p className="font-medium truncate">{post.copy}</p>
                          <p className="text-xs text-muted-foreground truncate">{post.brandName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {post.networks.map(network => {
                            const Icon = networkIcons[network]
                            return Icon ? (
                              <div
                                key={network}
                                className="flex h-6 w-6 items-center justify-center rounded-full"
                                style={{ backgroundColor: `${networkColors[network]}20` }}
                              >
                                <Icon className="h-3 w-3" style={{ color: networkColors[network] }} />
                              </div>
                            ) : null
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{post.format}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1", statusConfig[post.status].color, "text-white")}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[post.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{post.scheduledDate}</p>
                          <p className="text-muted-foreground">{post.scheduledTime}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">{post.copyResponsible || "-"}</div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedPost(post)
                              setShowPostDetail(true)
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
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
      )}

      {/* Post Detail Dialog */}
      <Dialog open={showPostDetail} onOpenChange={setShowPostDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedPost && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle>{selectedPost.copy}</DialogTitle>
                    <DialogDescription>{selectedPost.brandName} - {selectedPost.clientName}</DialogDescription>
                  </div>
                  <Badge className={cn("gap-1", statusConfig[selectedPost.status].color, "text-white")}>
                    {statusConfig[selectedPost.status].label}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="grid gap-6 md:grid-cols-2 py-4">
                {/* Preview */}
                <div className="space-y-4">
                  <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                    {selectedPost.mediaType === "video" ? (
                      <Video className="h-16 w-16 text-muted-foreground" />
                    ) : (
                      <ImageIcon className="h-16 w-16 text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* Networks */}
                  <div className="flex flex-wrap gap-2">
                    {selectedPost.networks.map(network => {
                      const Icon = networkIcons[network]
                      return (
                        <Badge key={network} variant="outline" className="gap-1">
                          {Icon && <Icon className="h-3 w-3" />}
                          <span className="capitalize">{network}</span>
                        </Badge>
                      )
                    })}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Caption</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedPost.caption || "Sin caption"}</p>
                  </div>

                  {selectedPost.hashtags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Hashtags</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedPost.hashtags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Formato</p>
                      <p className="font-medium capitalize">{selectedPost.format}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CTA</p>
                      <p className="font-medium">{selectedPost.cta || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fecha programada</p>
                      <p className="font-medium">{selectedPost.scheduledDate} {selectedPost.scheduledTime}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Link</p>
                      <p className="font-medium truncate">{selectedPost.link || "-"}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-2">Responsables</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Copy</span>
                        <span>{selectedPost.copyResponsible || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Diseño</span>
                        <span>{selectedPost.designResponsible || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Aprobación</span>
                        <span>{selectedPost.approvalResponsible || "-"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status change buttons */}
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Cambiar Estado</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(statusConfig).map(([key, config]) => {
                        const StatusIcon = config.icon
                        return (
                          <Button
                            key={key}
                            variant={selectedPost.status === key ? "default" : "outline"}
                            size="sm"
                            onClick={() => updatePostStatus(selectedPost.id, key as PostStatus)}
                            className="gap-1"
                          >
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* History */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">Historial de Cambios</h4>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {selectedPost.history.map(entry => (
                      <div key={entry.id} className="flex items-center gap-2 text-sm">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="font-medium">{entry.action}</span>
                        <span className="text-muted-foreground">por {entry.userName}</span>
                        <span className="text-muted-foreground text-xs">
                          {new Date(entry.timestamp).toLocaleString('es-MX')}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPostDetail(false)}>
                  Cerrar
                </Button>
                <Button>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Publicación
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
