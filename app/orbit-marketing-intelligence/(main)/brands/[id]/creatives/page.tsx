"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import {
  ArrowLeft,
  Sparkles,
  ImageIcon,
  Download,
  RefreshCw,
  Heart,
  Trash2,
  MoreVertical,
  Copy,
  Wand2,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Settings,
  Grid3X3,
  List,
  Search,
  Filter,
  Plus,
  Lock,
} from "lucide-react"
import { mockBrands, mockBuyerPersonas } from "@/lib/marketing-intelligence/brand-mock-data"
import { mockGeneratedImages } from "@/lib/marketing-intelligence/brand-phase2-mock-data"

export default function CreativesPage() {
  const params = useParams()
  const brandId = params.id as string
  const brand = mockBrands.find(b => b.id === brandId)
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [generateOpen, setGenerateOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  
  const [newPrompt, setNewPrompt] = useState({
    prompt: "",
    style: "realistic",
    aspectRatio: "1:1",
    persona: "",
    quantity: 4,
  })

  const brandImages = mockGeneratedImages.filter(img => img.brandId === brandId)
  
  // Check if brief is complete enough to generate
  const briefScore = brand?.briefScore || 0
  const canGenerate = briefScore >= 70

  const filteredImages = brandImages.filter(img => {
    const matchesSearch = img.prompt.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || img.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleGenerate = async () => {
    if (!canGenerate) {
      toast.error("Completa el brief al menos al 70% para generar imágenes")
      return
    }
    setGenerating(true)
    // Simulate generation
    await new Promise(resolve => setTimeout(resolve, 3000))
    setGenerating(false)
    setGenerateOpen(false)
    toast.success(`${newPrompt.quantity} imágenes generadas correctamente`)
  }

  const handleDownload = (imageId: string) => {
    toast.success("Imagen descargada")
  }

  const handleFavorite = (imageId: string) => {
    toast.success("Imagen agregada a favoritos")
  }

  const handleDelete = (imageId: string) => {
    toast.success("Imagen eliminada")
  }

  const handleRegenerate = (imageId: string) => {
    toast.success("Regenerando imagen...")
  }

  const toggleSelectImage = (imageId: string) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    )
  }

  const statusColors: Record<string, string> = {
    completed: "bg-green-100 text-green-700",
    generating: "bg-blue-100 text-blue-700",
    failed: "bg-red-100 text-red-700",
    queued: "bg-amber-100 text-amber-700",
  }

  const statusLabels: Record<string, string> = {
    completed: "Completada",
    generating: "Generando",
    failed: "Error",
    queued: "En cola",
  }

  if (!brand) {
    return (
      <div className="p-8">
        <p>Marca no encontrada</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/orbit-marketing-intelligence/brands/${brandId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wand2 className="h-6 w-6 text-purple-600" />
              Estudio Creativo IA
            </h1>
            <p className="text-muted-foreground">{brand.name} - Generación de imágenes con IA</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedImages.length > 0 && (
            <div className="flex items-center gap-2 mr-4">
              <Badge variant="secondary">{selectedImages.length} seleccionadas</Badge>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
              <Button variant="outline" size="sm" className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </div>
          )}
          
          <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
            <DialogTrigger asChild>
              <Button disabled={!canGenerate}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generar Imágenes
                {!canGenerate && <Lock className="h-3 w-3 ml-2" />}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Generar Imágenes con IA</DialogTitle>
                <DialogDescription>
                  Describe lo que quieres crear y la IA generará variaciones
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Prompt / Descripción *</Label>
                  <Textarea
                    placeholder="Describe la imagen que deseas generar. Ej: Render de departamento moderno con vista al mar, sala de estar minimalista con luz natural..."
                    value={newPrompt.prompt}
                    onChange={(e) => setNewPrompt(prev => ({ ...prev, prompt: e.target.value }))}
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estilo Visual</Label>
                    <Select
                      value={newPrompt.style}
                      onValueChange={(v) => setNewPrompt(prev => ({ ...prev, style: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realistic">Realista / Fotográfico</SelectItem>
                        <SelectItem value="3d_render">Render 3D</SelectItem>
                        <SelectItem value="architectural">Arquitectónico</SelectItem>
                        <SelectItem value="lifestyle">Lifestyle</SelectItem>
                        <SelectItem value="minimalist">Minimalista</SelectItem>
                        <SelectItem value="luxury">Lujo / Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Relación de Aspecto</Label>
                    <Select
                      value={newPrompt.aspectRatio}
                      onValueChange={(v) => setNewPrompt(prev => ({ ...prev, aspectRatio: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1:1">1:1 (Cuadrado)</SelectItem>
                        <SelectItem value="4:5">4:5 (Instagram)</SelectItem>
                        <SelectItem value="9:16">9:16 (Stories/Reels)</SelectItem>
                        <SelectItem value="16:9">16:9 (Horizontal)</SelectItem>
                        <SelectItem value="3:4">3:4 (Vertical)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Buyer Persona (opcional)</Label>
                    <Select
                      value={newPrompt.persona}
                      onValueChange={(v) => setNewPrompt(prev => ({ ...prev, persona: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar persona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sin especificar</SelectItem>
                        {mockBuyerPersonas.filter(p => p.brandId === brandId).map(persona => (
                          <SelectItem key={persona.id} value={persona.id}>
                            {persona.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Cantidad de Variaciones</Label>
                    <Select
                      value={newPrompt.quantity.toString()}
                      onValueChange={(v) => setNewPrompt(prev => ({ ...prev, quantity: parseInt(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 imagen</SelectItem>
                        <SelectItem value="2">2 imágenes</SelectItem>
                        <SelectItem value="4">4 imágenes</SelectItem>
                        <SelectItem value="8">8 imágenes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    <span>La IA utilizará el brief de la marca para mantener consistencia visual</span>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setGenerateOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleGenerate} disabled={!newPrompt.prompt || generating}>
                  {generating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generar {newPrompt.quantity} Imágenes
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Brief Warning */}
      {!canGenerate && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div className="flex-1">
                <p className="font-medium text-amber-800">Brief incompleto ({briefScore}%)</p>
                <p className="text-sm text-amber-700">
                  Completa el brief de la marca al menos al 70% para desbloquear la generación de imágenes con IA
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/orbit-marketing-intelligence/brands/${brandId}/brief`}>
                  Completar Brief
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <ImageIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{brandImages.length}</p>
                <p className="text-sm text-muted-foreground">Total Generadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {brandImages.filter(i => i.status === 'completed').length}
                </p>
                <p className="text-sm text-muted-foreground">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-100">
                <Heart className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {brandImages.filter(i => i.favorite).length}
                </p>
                <p className="text-sm text-muted-foreground">Favoritas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {brandImages.filter(i => i.status === 'generating' || i.status === 'queued').length}
                </p>
                <p className="text-sm text-muted-foreground">En Proceso</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por prompt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="completed">Completadas</SelectItem>
            <SelectItem value="generating">Generando</SelectItem>
            <SelectItem value="queued">En cola</SelectItem>
            <SelectItem value="failed">Con error</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex items-center border rounded-lg">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="rounded-r-none"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Images Grid/List */}
      {filteredImages.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Wand2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay imágenes generadas</h3>
            <p className="text-muted-foreground mb-4">
              Comienza a crear contenido visual con IA
            </p>
            {canGenerate && (
              <Button onClick={() => setGenerateOpen(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generar Primera Imagen
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredImages.map((image) => (
            <Card 
              key={image.id} 
              className={`group overflow-hidden cursor-pointer transition-all ${
                selectedImages.includes(image.id) ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => toggleSelectImage(image.id)}
            >
              <div className="relative aspect-square bg-muted">
                {image.status === 'completed' ? (
                  <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-purple-300" />
                  </div>
                ) : image.status === 'generating' ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-red-400" />
                  </div>
                )}
                
                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button 
                    size="icon" 
                    variant="secondary"
                    onClick={(e) => { e.stopPropagation(); handleDownload(image.id) }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="secondary"
                    onClick={(e) => { e.stopPropagation(); handleFavorite(image.id) }}
                  >
                    <Heart className={`h-4 w-4 ${image.favorite ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="secondary"
                    onClick={(e) => { e.stopPropagation(); handleRegenerate(image.id) }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Status Badge */}
                <Badge className={`absolute top-2 right-2 ${statusColors[image.status]}`}>
                  {statusLabels[image.status]}
                </Badge>
                
                {/* Selection indicator */}
                {selectedImages.includes(image.id) && (
                  <div className="absolute top-2 left-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              
              <CardContent className="p-3">
                <p className="text-sm line-clamp-2 text-muted-foreground">
                  {image.prompt}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="outline" className="text-xs">
                    {image.style}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(image.generatedAt).toLocaleDateString('es-MX')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredImages.map((image) => (
                <div 
                  key={image.id} 
                  className={`flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer ${
                    selectedImages.includes(image.id) ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => toggleSelectImage(image.id)}
                >
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="h-8 w-8 text-purple-300" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{image.prompt}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{image.style}</Badge>
                      <Badge variant="outline" className="text-xs">{image.aspectRatio}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(image.generatedAt).toLocaleDateString('es-MX')}
                      </span>
                    </div>
                  </div>
                  
                  <Badge className={statusColors[image.status]}>
                    {statusLabels[image.status]}
                  </Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDownload(image.id)}>
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleFavorite(image.id)}>
                        <Heart className="h-4 w-4 mr-2" />
                        {image.favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRegenerate(image.id)}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(image.id)} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
