"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Calendar,
  Kanban,
  MoreHorizontal,
  Download,
  Upload,
  Sparkles,
  Image,
  Video,
  Layers,
  FileText,
  Eye,
  Edit,
  Trash2,
  Copy,
  CheckCircle2,
  Clock,
  AlertCircle,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Smartphone,
  GanttChart,
  History,
} from "lucide-react"
import { mockBrands, mockBuyerPersonas } from "@/lib/marketing-intelligence/brand-mock-data"
import { mockContentPieces, mockContentPillars } from "@/lib/marketing-intelligence/brand-phase2-mock-data"
import { ContentPiece, ContentStatus, contentStatusConfig, SocialPlatform, ContentFormat } from "@/lib/marketing-intelligence/brand-phase2-types"
import { ContentKanban, ContentStatusBadge } from "@/components/marketing-intelligence/brands"

// Platform icons
const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-4 w-4 text-pink-500" />,
  facebook: <Facebook className="h-4 w-4 text-blue-600" />,
  tiktok: <Smartphone className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4 text-blue-700" />,
  youtube: <Youtube className="h-4 w-4 text-red-600" />,
  twitter: <span className="h-4 w-4 font-bold text-xs">X</span>,
}

// Format icons
const formatIcons: Record<string, React.ReactNode> = {
  imagen: <Image className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  reel: <Video className="h-4 w-4" />,
  story: <Layers className="h-4 w-4" />,
  carrusel: <Layers className="h-4 w-4" />,
  article: <FileText className="h-4 w-4" />,
  thread: <FileText className="h-4 w-4" />,
  live: <Video className="h-4 w-4" />,
}

export default function BrandContentPage() {
  const params = useParams()
  const router = useRouter()
  const brandId = params.id as string

  const brand = mockBrands.find(b => b.id === brandId)
  const pillars = mockContentPillars.filter(p => p.brandId === brandId || p.brandId === 'brand-1')
  const personas = mockBuyerPersonas.filter(p => p.brandId === brandId || p.brandId === 'brand-1')
  
  const [contentPieces, setContentPieces] = useState<ContentPiece[]>(
    mockContentPieces.filter(c => c.brandId === brandId || c.brandId === 'brand-1')
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPlatform, setFilterPlatform] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPillar, setFilterPillar] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"table" | "kanban" | "timeline">("table")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [selectedContent, setSelectedContent] = useState<ContentPiece | null>(null)
  const [newContent, setNewContent] = useState({
    title: "",
    platform: "instagram" as SocialPlatform,
    format: "imagen" as ContentFormat,
    pillarId: "",
    buyerPersonaId: "",
    funnelStage: "awareness" as "awareness" | "consideration" | "conversion" | "retention",
    copy: "",
  })

  if (!brand) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Marca no encontrada</p>
      </div>
    )
  }

  // Filter content
  const filteredContent = contentPieces.filter(piece => {
    const matchesSearch = piece.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPlatform = filterPlatform === "all" || piece.platform === filterPlatform
    const matchesStatus = filterStatus === "all" || piece.status === filterStatus
    const matchesPillar = filterPillar === "all" || piece.pillarId === filterPillar
    return matchesSearch && matchesPlatform && matchesStatus && matchesPillar
  })

  // Stats
  const stats = {
    total: contentPieces.length,
    published: contentPieces.filter(c => c.status === 'published').length,
    scheduled: contentPieces.filter(c => c.status === 'scheduled').length,
    inProgress: contentPieces.filter(c => ['draft', 'writing', 'design', 'internal_review', 'client_review'].includes(c.status)).length,
    pending: contentPieces.filter(c => c.status === 'idea').length,
  }

  const handleCreateContent = () => {
    if (!newContent.title) {
      toast.error("El título es requerido")
      return
    }

    const piece: ContentPiece = {
      id: `content-${Date.now()}`,
      brandId,
      title: newContent.title,
      platform: newContent.platform,
      format: newContent.format,
      pillarId: newContent.pillarId || undefined,
      buyerPersonaId: newContent.buyerPersonaId || undefined,
      funnelStage: newContent.funnelStage,
      status: 'idea',
      copy: newContent.copy || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setContentPieces(prev => [piece, ...prev])
    setCreateDialogOpen(false)
    setNewContent({
      title: "",
      platform: "instagram",
      format: "imagen",
      pillarId: "",
      buyerPersonaId: "",
      funnelStage: "awareness",
      copy: "",
    })
    toast.success("Contenido creado exitosamente")
  }

  const handleMoveContent = (id: string, newStatus: ContentStatus) => {
    setContentPieces(prev => prev.map(piece => 
      piece.id === id ? { ...piece, status: newStatus, updatedAt: new Date().toISOString() } : piece
    ))
    const statusLabel = contentStatusConfig[newStatus].label
    toast.success(`Movido a "${statusLabel}"`)
  }

  const getPillarInfo = (pillarId?: string) => {
    if (!pillarId) return null
    return pillars.find(p => p.id === pillarId)
  }

  const getPersonaInfo = (personaId?: string) => {
    if (!personaId) return null
    return personas.find(p => p.id === personaId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/orbit-marketing-intelligence/brands/${brandId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Planeación de Contenido</h1>
            <p className="text-muted-foreground">{brand.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            Generar con IA
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Contenido
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Contenido</DialogTitle>
                <DialogDescription>
                  Agrega una nueva pieza de contenido a la planeación
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    placeholder="Ej: Reel de amenidades"
                    value={newContent.title}
                    onChange={(e) => setNewContent(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Plataforma</Label>
                    <Select
                      value={newContent.platform}
                      onValueChange={(v) => setNewContent(prev => ({ ...prev, platform: v as SocialPlatform }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="twitter">X (Twitter)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Formato</Label>
                    <Select
                      value={newContent.format}
                      onValueChange={(v) => setNewContent(prev => ({ ...prev, format: v as ContentFormat }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="imagen">Imagen</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="reel">Reel</SelectItem>
                        <SelectItem value="story">Story</SelectItem>
                        <SelectItem value="carrusel">Carrusel</SelectItem>
                        <SelectItem value="article">Artículo</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pilar de Contenido</Label>
                    <Select
                      value={newContent.pillarId}
                      onValueChange={(v) => setNewContent(prev => ({ ...prev, pillarId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar pilar" />
                      </SelectTrigger>
                      <SelectContent>
                        {pillars.map(pillar => (
                          <SelectItem key={pillar.id} value={pillar.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pillar.color }} />
                              {pillar.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Buyer Persona</Label>
                    <Select
                      value={newContent.buyerPersonaId}
                      onValueChange={(v) => setNewContent(prev => ({ ...prev, buyerPersonaId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar persona" />
                      </SelectTrigger>
                      <SelectContent>
                        {personas.map(persona => (
                          <SelectItem key={persona.id} value={persona.id}>
                            {persona.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Etapa del Funnel</Label>
                  <Select
                    value={newContent.funnelStage}
                    onValueChange={(v) => setNewContent(prev => ({ ...prev, funnelStage: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="awareness">Awareness</SelectItem>
                      <SelectItem value="consideration">Consideration</SelectItem>
                      <SelectItem value="conversion">Conversion</SelectItem>
                      <SelectItem value="retention">Retention</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Copy (opcional)</Label>
                  <Textarea
                    placeholder="Escribe el copy del contenido..."
                    rows={3}
                    value={newContent.copy}
                    onChange={(e) => setNewContent(prev => ({ ...prev, copy: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateContent}>Crear Contenido</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            <p className="text-xs text-muted-foreground">Publicados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-cyan-600">{stats.scheduled}</div>
            <p className="text-xs text-muted-foreground">Programados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">En Progreso</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-indigo-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Ideas</p>
          </CardContent>
        </Card>
      </div>

      {/* Pillars */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pilares de Contenido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {pillars.map(pillar => {
              const count = contentPieces.filter(c => c.pillarId === pillar.id).length
              return (
                <div 
                  key={pillar.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                  style={{ borderColor: pillar.color }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pillar.color }} />
                  <span className="text-sm font-medium">{pillar.name}</span>
                  <Badge variant="secondary" className="text-xs">{pillar.percentage}%</Badge>
                  <span className="text-xs text-muted-foreground">{count} piezas</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters & View Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contenido..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Plataforma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="idea">Ideas</SelectItem>
              <SelectItem value="draft">Borrador</SelectItem>
              <SelectItem value="writing">Copywriting</SelectItem>
              <SelectItem value="design">Diseño</SelectItem>
              <SelectItem value="internal_review">Rev. Interna</SelectItem>
              <SelectItem value="client_review">Aprob. Cliente</SelectItem>
              <SelectItem value="approved">Aprobado</SelectItem>
              <SelectItem value="scheduled">Programado</SelectItem>
              <SelectItem value="published">Publicado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPillar} onValueChange={setFilterPillar}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Pilar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los pilares</SelectItem>
              {pillars.map(pillar => (
                <SelectItem key={pillar.id} value={pillar.id}>{pillar.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            title="Vista tabla"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "kanban" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("kanban")}
            title="Vista kanban"
          >
            <Kanban className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "timeline" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("timeline")}
            title="Vista timeline"
          >
            <GanttChart className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content List */}
      {viewMode === "table" ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contenido</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Pilar</TableHead>
                  <TableHead>Persona</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContent.map(piece => {
                  const pillar = getPillarInfo(piece.pillarId)
                  const persona = getPersonaInfo(piece.buyerPersonaId)
                  return (
                    <TableRow key={piece.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded">
                            {formatIcons[piece.format]}
                          </div>
                          <div>
                            <p className="font-medium">{piece.title}</p>
                            <p className="text-xs text-muted-foreground capitalize">{piece.format}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {platformIcons[piece.platform]}
                          <span className="text-sm capitalize">{piece.platform}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {pillar ? (
                          <Badge variant="outline" style={{ borderColor: pillar.color, color: pillar.color }}>
                            {pillar.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {persona ? (
                          <span className="text-sm">{persona.name}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ContentStatusBadge status={piece.status} />
                      </TableCell>
                      <TableCell>
                        {piece.scheduledDate ? (
                          <span className="text-sm">
                            {new Date(piece.scheduledDate).toLocaleDateString('es-MX', { 
                              day: 'numeric', 
                              month: 'short' 
                            })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sin fecha</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem><Eye className="h-4 w-4 mr-2" /> Ver detalle</DropdownMenuItem>
                            <DropdownMenuItem><Edit className="h-4 w-4 mr-2" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem><Copy className="h-4 w-4 mr-2" /> Duplicar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedContent(piece)
                              setHistoryOpen(true)
                            }}>
                              <History className="h-4 w-4 mr-2" /> Ver historial
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {filteredContent.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No se encontró contenido con los filtros seleccionados
              </div>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "kanban" ? (
        <ContentKanban
          pieces={filteredContent}
          pillars={pillars.map(p => ({ id: p.id, name: p.name, color: p.color }))}
          onMove={handleMoveContent}
        />
      ) : (
        /* Timeline View */
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GanttChart className="h-4 w-4" />
              Timeline Mensual
            </CardTitle>
            <CardDescription>Vista de contenido programado en el tiempo</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" /> Mes anterior
              </Button>
              <h3 className="font-semibold">
                {new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
              </h3>
              <Button variant="outline" size="sm">
                Mes siguiente <ArrowLeft className="h-4 w-4 ml-1 rotate-180" />
              </Button>
            </div>
            
            {/* Timeline Grid */}
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Days Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Grid with Content */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }).map((_, index) => {
                    const dayOfMonth = index - new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() + 2
                    const isCurrentMonth = dayOfMonth > 0 && dayOfMonth <= new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
                    const isToday = isCurrentMonth && dayOfMonth === new Date().getDate()
                    
                    // Get content for this day
                    const dayContent = filteredContent.filter(piece => {
                      if (!piece.scheduledDate) return false
                      const pieceDate = new Date(piece.scheduledDate)
                      return pieceDate.getDate() === dayOfMonth && 
                             pieceDate.getMonth() === new Date().getMonth() &&
                             pieceDate.getFullYear() === new Date().getFullYear()
                    })
                    
                    return (
                      <div 
                        key={index}
                        className={`min-h-[100px] border rounded-lg p-1 ${
                          isCurrentMonth ? "bg-background" : "bg-muted/30"
                        } ${isToday ? "ring-2 ring-primary" : ""}`}
                      >
                        {isCurrentMonth && (
                          <>
                            <div className={`text-xs font-medium mb-1 ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                              {dayOfMonth}
                            </div>
                            <div className="space-y-1">
                              {dayContent.slice(0, 3).map(piece => {
                                const pillar = getPillarInfo(piece.pillarId)
                                return (
                                  <div 
                                    key={piece.id}
                                    className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity"
                                    style={{ backgroundColor: pillar?.color + "20", borderLeft: `2px solid ${pillar?.color || "#gray"}` }}
                                    title={piece.title}
                                  >
                                    <div className="flex items-center gap-1">
                                      {platformIcons[piece.platform]}
                                      <span className="truncate">{piece.title}</span>
                                    </div>
                                  </div>
                                )
                              })}
                              {dayContent.length > 3 && (
                                <div className="text-xs text-muted-foreground text-center">
                                  +{dayContent.length - 3} más
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
              {pillars.map(pillar => (
                <div key={pillar.id} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: pillar.color }} />
                  <span className="text-xs text-muted-foreground">{pillar.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Version History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial de Versiones
            </DialogTitle>
            <DialogDescription>
              {selectedContent?.title} - Versión actual: {selectedContent?.version || 1}
            </DialogDescription>
          </DialogHeader>
          
          {selectedContent?.versionHistory && selectedContent.versionHistory.length > 0 ? (
            <div className="space-y-4">
              {selectedContent.versionHistory.slice().reverse().map((version, index) => (
                <div 
                  key={version.id} 
                  className={`p-4 rounded-lg border ${index === 0 ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        v{version.version}
                      </Badge>
                      <span className="text-sm font-medium">{version.title}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(version.changedAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Por:</span> {version.changedBy}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {version.changeType === 'create' && 'Creación'}
                      {version.changeType === 'edit' && 'Edición'}
                      {version.changeType === 'status_change' && 'Cambio de estado'}
                      {version.changeType === 'approval' && 'Aprobación'}
                      {version.changeType === 'schedule' && 'Programación'}
                    </Badge>
                  </div>
                  
                  {version.changeDescription && (
                    <p className="text-sm text-muted-foreground">{version.changeDescription}</p>
                  )}
                  
                  {version.previousValues && Object.keys(version.previousValues).length > 0 && (
                    <div className="mt-2 pt-2 border-t text-xs">
                      <span className="text-muted-foreground">Cambios: </span>
                      {version.previousValues.title && (
                        <span className="text-muted-foreground">
                          Título: <span className="line-through">{version.previousValues.title}</span>
                        </span>
                      )}
                      {version.previousValues.status && (
                        <span className="ml-2 text-muted-foreground">
                          Estado: <span className="line-through">{version.previousValues.status}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No hay historial de versiones disponible para este contenido.</p>
              <p className="text-sm">El historial se generará con los próximos cambios.</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
