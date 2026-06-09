"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  ArrowLeft,
  Plus,
  Sparkles,
  Palette,
  Type,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Download,
  Eye,
  Edit,
  Copy,
  Trash2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { mockBrands, mockBuyerPersonas } from "@/lib/marketing-intelligence/brand-mock-data"
import { mockMoodboards, mockPaidCampaigns } from "@/lib/marketing-intelligence/brand-phase2-mock-data"
import { Moodboard } from "@/lib/marketing-intelligence/brand-phase2-types"

const purposeLabels: Record<string, string> = {
  campaign: 'Campaña',
  persona: 'Buyer Persona',
  general: 'General',
  seasonal: 'Temporal',
}

export default function BrandMoodboardsPage() {
  const params = useParams()
  const brandId = params.id as string

  const brand = mockBrands.find(b => b.id === brandId)
  const personas = mockBuyerPersonas.filter(p => p.brandId === brandId || p.brandId === 'brand-1')
  const campaigns = mockPaidCampaigns.filter(c => c.brandId === brandId || c.brandId === 'brand-1')
  
  const [moodboards, setMoodboards] = useState<Moodboard[]>(
    mockMoodboards.filter(m => m.brandId === brandId || m.brandId === 'brand-1')
  )
  const [filterPurpose, setFilterPurpose] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedMoodboard, setSelectedMoodboard] = useState<Moodboard | null>(null)
  const [newMoodboard, setNewMoodboard] = useState({
    name: "",
    description: "",
    purpose: "general" as Moodboard['purpose'],
    campaignId: "",
    buyerPersonaId: "",
  })

  if (!brand) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Marca no encontrada</p>
      </div>
    )
  }

  // Filter moodboards
  const filteredMoodboards = moodboards.filter(moodboard => {
    const matchesPurpose = filterPurpose === "all" || moodboard.purpose === filterPurpose
    const matchesStatus = filterStatus === "all" || moodboard.status === filterStatus
    return matchesPurpose && matchesStatus
  })

  const handleCreateMoodboard = () => {
    if (!newMoodboard.name) {
      toast.error("El nombre es requerido")
      return
    }

    const moodboard: Moodboard = {
      id: `moodboard-${Date.now()}`,
      brandId,
      name: newMoodboard.name,
      description: newMoodboard.description || undefined,
      purpose: newMoodboard.purpose,
      campaignId: newMoodboard.campaignId || undefined,
      buyerPersonaId: newMoodboard.buyerPersonaId || undefined,
      references: [],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setMoodboards(prev => [moodboard, ...prev])
    setCreateDialogOpen(false)
    setNewMoodboard({
      name: "",
      description: "",
      purpose: "general",
      campaignId: "",
      buyerPersonaId: "",
    })
    toast.success("Moodboard creado exitosamente")
  }

  const getPersonaName = (personaId?: string) => {
    if (!personaId) return null
    const persona = personas.find(p => p.id === personaId)
    return persona?.name
  }

  const getCampaignName = (campaignId?: string) => {
    if (!campaignId) return null
    const campaign = campaigns.find(c => c.id === campaignId)
    return campaign?.name
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
            <h1 className="text-2xl font-bold">Moodboards</h1>
            <p className="text-muted-foreground">{brand.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            Generar con IA
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Moodboard
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Moodboard</DialogTitle>
                <DialogDescription>
                  Crea un nuevo moodboard para definir el estilo visual
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    placeholder="Ej: Estilo Premium Q1"
                    value={newMoodboard.name}
                    onChange={(e) => setNewMoodboard(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    placeholder="Describe el propósito de este moodboard..."
                    value={newMoodboard.description}
                    onChange={(e) => setNewMoodboard(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Propósito</Label>
                  <Select
                    value={newMoodboard.purpose}
                    onValueChange={(v) => setNewMoodboard(prev => ({ ...prev, purpose: v as Moodboard['purpose'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="campaign">Campaña específica</SelectItem>
                      <SelectItem value="persona">Buyer Persona</SelectItem>
                      <SelectItem value="seasonal">Temporal/Estacional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newMoodboard.purpose === 'campaign' && (
                  <div className="space-y-2">
                    <Label>Campaña</Label>
                    <Select
                      value={newMoodboard.campaignId}
                      onValueChange={(v) => setNewMoodboard(prev => ({ ...prev, campaignId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar campaña" />
                      </SelectTrigger>
                      <SelectContent>
                        {campaigns.map(campaign => (
                          <SelectItem key={campaign.id} value={campaign.id}>{campaign.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {newMoodboard.purpose === 'persona' && (
                  <div className="space-y-2">
                    <Label>Buyer Persona</Label>
                    <Select
                      value={newMoodboard.buyerPersonaId}
                      onValueChange={(v) => setNewMoodboard(prev => ({ ...prev, buyerPersonaId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar persona" />
                      </SelectTrigger>
                      <SelectContent>
                        {personas.map(persona => (
                          <SelectItem key={persona.id} value={persona.id}>{persona.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateMoodboard}>Crear Moodboard</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={filterPurpose} onValueChange={setFilterPurpose}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Propósito" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="campaign">Campañas</SelectItem>
            <SelectItem value="persona">Personas</SelectItem>
            <SelectItem value="seasonal">Temporales</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="draft">Borrador</SelectItem>
            <SelectItem value="approved">Aprobados</SelectItem>
            <SelectItem value="archived">Archivados</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="ml-auto">
          {filteredMoodboards.length} moodboards
        </Badge>
      </div>

      {/* Moodboard Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredMoodboards.map(moodboard => (
          <Card key={moodboard.id} className="overflow-hidden group">
            {/* Preview Grid */}
            <div className="aspect-video bg-muted relative">
              <div className="grid grid-cols-2 gap-0.5 h-full p-0.5">
                {moodboard.references.slice(0, 4).map((ref, i) => (
                  <div key={ref.id} className="relative bg-gray-200">
                    <Image
                      src={ref.url}
                      alt={ref.description || ''}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
                {moodboard.references.length === 0 && (
                  <div className="col-span-2 flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Button size="sm" variant="secondary" onClick={() => setSelectedMoodboard(moodboard)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalle
                </Button>
              </div>
            </div>

            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{moodboard.name}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {moodboard.references.length} referencias
                  </CardDescription>
                </div>
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
                    <DropdownMenuItem><Download className="h-4 w-4 mr-2" /> Descargar</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <Badge variant="outline" className="text-xs">
                  {purposeLabels[moodboard.purpose]}
                </Badge>
                {moodboard.status === 'approved' && (
                  <Badge className="text-xs bg-green-100 text-green-700">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Aprobado
                  </Badge>
                )}
                {moodboard.status === 'draft' && (
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Borrador
                  </Badge>
                )}
              </div>

              {moodboard.buyerPersonaId && (
                <p className="text-xs text-muted-foreground mb-2">
                  Persona: {getPersonaName(moodboard.buyerPersonaId)}
                </p>
              )}
              {moodboard.campaignId && (
                <p className="text-xs text-muted-foreground mb-2">
                  Campaña: {getCampaignName(moodboard.campaignId)}
                </p>
              )}

              {/* Color Palette */}
              {moodboard.colorPalette && (
                <div className="flex items-center gap-1 mt-3">
                  <Palette className="h-3 w-3 text-muted-foreground mr-1" />
                  {Object.entries(moodboard.colorPalette)
                    .filter(([key]) => !['additional'].includes(key))
                    .slice(0, 5)
                    .map(([key, color]) => (
                      <div
                        key={key}
                        className="w-5 h-5 rounded-full border"
                        style={{ backgroundColor: color as string }}
                        title={key}
                      />
                    ))}
                </div>
              )}

              {/* Typography */}
              {moodboard.typography && (
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Type className="h-3 w-3 mr-1" />
                  {moodboard.typography.primary}
                  {moodboard.typography.secondary && ` / ${moodboard.typography.secondary}`}
                </div>
              )}

              {/* Style Keywords */}
              {moodboard.styleKeywords && moodboard.styleKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {moodboard.styleKeywords.slice(0, 4).map(keyword => (
                    <Badge key={keyword} variant="outline" className="text-xs font-normal">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMoodboards.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay moodboards con los filtros seleccionados
          </CardContent>
        </Card>
      )}

      {/* Moodboard Detail Dialog */}
      <Dialog open={!!selectedMoodboard} onOpenChange={(open) => !open && setSelectedMoodboard(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          {selectedMoodboard && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedMoodboard.name}</DialogTitle>
                <DialogDescription>{selectedMoodboard.description}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* References Grid */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Referencias Visuales</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {selectedMoodboard.references.map(ref => (
                      <div key={ref.id} className="aspect-square relative rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={ref.url}
                          alt={ref.description || ''}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                    <button className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors">
                      <Plus className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Color Palette */}
                {selectedMoodboard.colorPalette && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Paleta de Colores</h4>
                    <div className="flex gap-3">
                      {Object.entries(selectedMoodboard.colorPalette)
                        .filter(([key]) => key !== 'additional')
                        .map(([key, color]) => (
                          <div key={key} className="text-center">
                            <div
                              className="w-12 h-12 rounded-lg border mb-1"
                              style={{ backgroundColor: color as string }}
                            />
                            <span className="text-xs text-muted-foreground capitalize">{key}</span>
                            <p className="text-xs font-mono">{color as string}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Style Keywords */}
                {selectedMoodboard.styleKeywords && selectedMoodboard.styleKeywords.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Palabras Clave de Estilo</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMoodboard.styleKeywords.map(keyword => (
                        <Badge key={keyword} variant="secondary">{keyword}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mood Keywords */}
                {selectedMoodboard.moodKeywords && selectedMoodboard.moodKeywords.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Emociones / Mood</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMoodboard.moodKeywords.map(keyword => (
                        <Badge key={keyword} variant="outline">{keyword}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedMoodboard(null)}>Cerrar</Button>
                <Button>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generar Creativos
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
