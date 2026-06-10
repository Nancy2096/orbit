"use client"

import { useState, useMemo } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Image,
  Video,
  Layers,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Smartphone,
  GripVertical,
} from "lucide-react"
import { mockBrands } from "@/lib/marketing-intelligence/brand-mock-data"
import { mockContentPieces, mockHeatmapData, mockContentPillars } from "@/lib/marketing-intelligence/brand-phase2-mock-data"
import { ContentPiece, contentStatusConfig } from "@/lib/marketing-intelligence/brand-phase2-types"
import { BestTimeHeatmapCard } from "@/components/marketing-intelligence/brands"

// Platform icons
const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-3 w-3 text-pink-500" />,
  facebook: <Facebook className="h-3 w-3 text-blue-600" />,
  tiktok: <Smartphone className="h-3 w-3" />,
  linkedin: <Linkedin className="h-3 w-3 text-blue-700" />,
  youtube: <Youtube className="h-3 w-3 text-red-600" />,
  twitter: <span className="h-3 w-3 text-xs font-bold">X</span>,
}

// Format icons
const formatIcons: Record<string, React.ReactNode> = {
  imagen: <Image className="h-3 w-3" />,
  video: <Video className="h-3 w-3" />,
  reel: <Video className="h-3 w-3" />,
  story: <Layers className="h-3 w-3" />,
  carrusel: <Layers className="h-3 w-3" />,
  article: <FileText className="h-3 w-3" />,
  thread: <FileText className="h-3 w-3" />,
  live: <Video className="h-3 w-3" />,
}

const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  content: ContentPiece[]
}

export default function BrandCalendarPage() {
  const params = useParams()
  const brandId = params.id as string

  const brand = mockBrands.find(b => b.id === brandId)
  const pillars = mockContentPillars.filter(p => p.brandId === brandId || p.brandId === 'brand-1')
  const contentPieces = mockContentPieces.filter(c => c.brandId === brandId || c.brandId === 'brand-1')
  const heatmapData = mockHeatmapData.find(h => h.brandId === brandId || h.brandId === 'brand-1')
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [filterPlatform, setFilterPlatform] = useState<string>("all")
  const [draggingPiece, setDraggingPiece] = useState<string | null>(null)
  const [dragOverDate, setDragOverDate] = useState<string | null>(null)
  const [contentPiecesState, setContentPiecesState] = useState(contentPieces)

  if (!brand) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Marca no encontrada</p>
      </div>
    )
  }

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const startDay = firstDayOfMonth.getDay()
    const daysInMonth = lastDayOfMonth.getDate()
    
    const days: CalendarDay[] = []
    const today = new Date()
    
    // Previous month days
    const prevMonth = new Date(year, month, 0)
    const prevMonthDays = prevMonth.getDate()
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i)
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        content: [],
      })
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateStr = date.toISOString().split('T')[0]
      const dayContent = contentPiecesState.filter(c => {
        if (!c.scheduledDate) return false
        const matches = c.scheduledDate === dateStr
        if (filterPlatform !== 'all' && c.platform !== filterPlatform) return false
        return matches
      })
      
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        content: dayContent,
      })
    }
    
    // Next month days to complete the grid
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i)
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        content: [],
      })
    }
    
    return days
  }, [currentDate, contentPiecesState, filterPlatform])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Drag and drop handlers
  const handleDragStart = (pieceId: string) => {
    setDraggingPiece(pieceId)
  }

  const handleDragEnd = () => {
    setDraggingPiece(null)
    setDragOverDate(null)
  }

  const handleDragOver = (e: React.DragEvent, dateString: string) => {
    e.preventDefault()
    setDragOverDate(dateString)
  }

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault()
    if (!draggingPiece) return
    
    const dateString = targetDate.toISOString().split('T')[0]
    
    setContentPiecesState(prev => prev.map(piece => {
      if (piece.id === draggingPiece) {
        return { ...piece, scheduledDate: dateString }
      }
      return piece
    }))
    
    setDraggingPiece(null)
    setDragOverDate(null)
  }

  // Stats for current month
  const monthStats = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const monthContent = contentPiecesState.filter(c => {
      if (!c.scheduledDate) return false
      const date = new Date(c.scheduledDate)
      return date.getFullYear() === year && date.getMonth() === month
    })
    
    return {
      total: monthContent.length,
      published: monthContent.filter(c => c.status === 'published').length,
      scheduled: monthContent.filter(c => c.status === 'scheduled' || c.status === 'approved').length,
      pending: monthContent.filter(c => !['published', 'scheduled', 'approved'].includes(c.status)).length,
    }
  }, [currentDate, contentPiecesState])

  const getPillarColor = (pillarId?: string) => {
    if (!pillarId) return undefined
    const pillar = pillars.find(p => p.id === pillarId)
    return pillar?.color
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
            <h1 className="text-2xl font-bold">Calendario de Publicaciones</h1>
            <p className="text-muted-foreground">{brand.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/orbit-marketing-intelligence/brands/${brandId}/content`}>
              Ver Planeación
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        {/* Calendar */}
        <div className="space-y-4">
          {/* Month Navigation */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <h2 className="text-lg font-semibold">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={goToToday}>
                    Hoy
                  </Button>
                </div>
                <div className="flex items-center gap-2">
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Drag instruction */}
              <div className="flex items-center gap-2 mb-3 p-2 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                <GripVertical className="h-4 w-4" />
                <span>Arrastra las publicaciones entre fechas para reprogramarlas</span>
              </div>
              
              {/* Day Headers */}
              <div className="grid grid-cols-7 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                <TooltipProvider>
                  {calendarDays.map((day, index) => {
                    const dateString = day.date.toISOString().split('T')[0]
                    const isDragOver = dragOverDate === dateString
                    
                    return (
                      <div
                        key={index}
                        className={`min-h-[100px] p-1 border rounded-lg transition-colors ${
                          day.isCurrentMonth ? 'bg-background' : 'bg-muted/30'
                        } ${day.isToday ? 'ring-2 ring-primary' : ''} ${
                          isDragOver ? 'bg-primary/10 border-primary border-dashed' : ''
                        }`}
                        onDragOver={(e) => handleDragOver(e, dateString)}
                        onDragLeave={() => setDragOverDate(null)}
                        onDrop={(e) => handleDrop(e, day.date)}
                      >
                      <div className={`text-sm font-medium mb-1 ${
                          day.isCurrentMonth ? '' : 'text-muted-foreground'
                        } ${day.isToday ? 'text-primary' : ''}`}>
                          {day.date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {day.content.slice(0, 3).map(piece => {
                            const statusConfig = contentStatusConfig[piece.status]
                            const pillarColor = getPillarColor(piece.pillarId)
                            const isDragging = draggingPiece === piece.id
                            return (
                              <Tooltip key={piece.id}>
                                <TooltipTrigger asChild>
                                  <div
                                    draggable
                                    onDragStart={() => handleDragStart(piece.id)}
                                    onDragEnd={handleDragEnd}
                                    className={`flex items-center gap-1 p-1 rounded text-xs cursor-grab active:cursor-grabbing hover:opacity-80 transition-all ${
                                      isDragging ? 'opacity-50 ring-2 ring-primary' : ''
                                    }`}
                                    style={{ 
                                      backgroundColor: pillarColor ? `${pillarColor}20` : statusConfig.bgColor,
                                      borderLeft: pillarColor ? `2px solid ${pillarColor}` : undefined
                                    }}
                                  >
                                    <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
                                    {platformIcons[piece.platform]}
                                    <span className="truncate flex-1">{piece.title.substring(0, 12)}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                <div className="space-y-1">
                                  <p className="font-medium">{piece.title}</p>
                                  <div className="flex items-center gap-2 text-xs">
                                    {platformIcons[piece.platform]}
                                    <span className="capitalize">{piece.platform}</span>
                                    <span>-</span>
                                    <span className="capitalize">{piece.format}</span>
                                  </div>
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs"
                                    style={{ borderColor: statusConfig.color, color: statusConfig.color }}
                                  >
                                    {statusConfig.label}
                                  </Badge>
                                  {piece.scheduledTime && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {piece.scheduledTime}
                                    </p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )
                        })}
                        {day.content.length > 3 && (
                          <div className="text-xs text-muted-foreground text-center">
                            +{day.content.length - 3} más
                          </div>
                        )}
                      </div>
                    </div>
                    )
                  })}
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Month Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resumen del Mes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total programado</span>
                <span className="font-semibold">{monthStats.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Publicados
                </span>
                <span className="font-semibold text-green-600">{monthStats.published}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3 text-cyan-500" />
                  Programados
                </span>
                <span className="font-semibold text-cyan-600">{monthStats.scheduled}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-amber-500" />
                  Pendientes
                </span>
                <span className="font-semibold text-amber-600">{monthStats.pending}</span>
              </div>
            </CardContent>
          </Card>

          {/* Best Times Heatmap */}
          {heatmapData && (
            <BestTimeHeatmapCard
              data={heatmapData.data}
              platform="instagram"
              title="Mejores Horarios"
              description={`Basado en ${heatmapData.dataPoints} publicaciones`}
            />
          )}

          {/* Upcoming Posts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Próximas Publicaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contentPieces
                  .filter(c => c.scheduledDate && ['scheduled', 'approved'].includes(c.status))
                  .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())
                  .slice(0, 5)
                  .map(piece => (
                    <div key={piece.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <div className="p-1.5 bg-muted rounded">
                        {formatIcons[piece.format]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{piece.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {platformIcons[piece.platform]}
                          <span>
                            {new Date(piece.scheduledDate!).toLocaleDateString('es-MX', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </span>
                          {piece.scheduledTime && <span>{piece.scheduledTime}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                {contentPieces.filter(c => c.scheduledDate && ['scheduled', 'approved'].includes(c.status)).length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No hay publicaciones programadas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Recomendaciones IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="font-medium text-amber-800">Horario óptimo detectado</p>
                  <p className="text-amber-700 text-xs mt-1">
                    Tus publicaciones de Reels tienen 40% más engagement los martes a las 20:00
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-medium text-blue-800">Frecuencia recomendada</p>
                  <p className="text-blue-700 text-xs mt-1">
                    Para mantener engagement, considera publicar 4-5 veces por semana en Instagram
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
