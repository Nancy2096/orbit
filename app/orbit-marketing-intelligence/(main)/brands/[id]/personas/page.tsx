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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
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
import { toast } from "sonner"
import {
  ArrowLeft,
  Users,
  Plus,
  Sparkles,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Target,
  Heart,
  AlertTriangle,
  Lightbulb,
  ShoppingCart,
  MessageSquare,
  MapPin,
  Briefcase,
  GraduationCap,
  DollarSign,
  Calendar,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Loader2,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react"
import { mockBrands, mockBuyerPersonas } from "@/lib/marketing-intelligence/brand-mock-data"
import { BuyerPersonaCard } from "@/components/marketing-intelligence/brands/buyer-persona-card"
import { QualityScoreBadge } from "@/components/marketing-intelligence/brands/quality-score-badge"

export default function BrandPersonasPage() {
  const params = useParams()
  const brandId = params.id as string
  
  const brand = mockBrands.find(b => b.id === brandId)
  const initialPersonas = mockBuyerPersonas.filter(p => p.brandId === brandId)
  
  const [personas, setPersonas] = useState(initialPersonas)
  const [isGenerating, setIsGenerating] = useState(false)
  const [newPersonaOpen, setNewPersonaOpen] = useState(false)
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState<string | null>(null)
  
  // New persona form state
  const [newPersona, setNewPersona] = useState({
    name: "",
    role: "",
    age: "",
    location: "",
    income: "",
    education: "",
    occupation: "",
    bio: "",
    goals: [] as string[],
    painPoints: [] as string[],
    motivations: [] as string[],
    preferredChannels: [] as string[],
  })
  
  if (!brand) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Marca no encontrada</p>
      </div>
    )
  }
  
  // Check if brief is complete enough to generate personas
  const briefScore = brand.briefCompleteness || 0
  const canGeneratePersonas = briefScore >= 70
  
  const handleGenerateWithAI = async () => {
    if (!canGeneratePersonas) {
      toast.error("Completa el brief al menos al 70% para generar personas con IA")
      return
    }
    
    setIsGenerating(true)
    
    // Simulate AI generation
    setTimeout(() => {
      const newAIPersona = {
        id: `persona-ai-${Date.now()}`,
        brandId,
        name: "Patricia Inversora",
        role: "primary",
        avatar: "/placeholder-avatar.png",
        demographics: {
          age: "45-55",
          gender: "Femenino",
          location: "Ciudad de México, Polanco",
          income: "$150,000 - $250,000 MXN mensuales",
          education: "Maestría en Finanzas",
          occupation: "Directora de Inversiones",
          familyStatus: "Casada, 2 hijos adultos"
        },
        psychographics: {
          goals: [
            "Diversificar su portafolio de inversiones",
            "Asegurar rendimientos a largo plazo",
            "Encontrar propiedades de lujo como inversión"
          ],
          painPoints: [
            "Desconfianza en desarrolladoras sin trayectoria",
            "Falta de transparencia en plusvalía proyectada",
            "Procesos de compra complicados"
          ],
          motivations: [
            "Seguridad financiera para el retiro",
            "Legado para sus hijos",
            "Estatus y exclusividad"
          ],
          values: ["Seguridad", "Prestigio", "Transparencia"],
          interests: ["Bienes raíces", "Viajes", "Arte", "Golf"]
        },
        behaviors: {
          preferredChannels: ["linkedin", "email", "eventos"],
          contentPreferences: ["Análisis de mercado", "Casos de éxito", "Reportes de ROI"],
          buyingBehavior: "Investigadora meticulosa, necesita múltiples touchpoints",
          decisionFactors: ["Track record del desarrollador", "Ubicación premium", "Potencial de plusvalía"]
        },
        quotes: [
          "Necesito ver números reales, no promesas",
          "La ubicación y el desarrollador son todo"
        ],
        isAIGenerated: true
      }
      
      setPersonas(prev => [...prev, newAIPersona])
      setIsGenerating(false)
      toast.success("Buyer persona generada con IA")
    }, 3000)
  }
  
  const handleGenerateImage = async (personaId: string) => {
    setIsGeneratingImage(personaId)
    
    // Simulate image generation
    setTimeout(() => {
      setPersonas(prev => prev.map(p => 
        p.id === personaId 
          ? { ...p, avatar: `https://api.dicebear.com/7.x/personas/svg?seed=${personaId}` }
          : p
      ))
      setIsGeneratingImage(null)
      toast.success("Imagen generada")
    }, 2000)
  }
  
  const handleCreatePersona = () => {
    if (!newPersona.name || !newPersona.role) {
      toast.error("Nombre y rol son requeridos")
      return
    }
    
    const persona = {
      id: `persona-${Date.now()}`,
      brandId,
      name: newPersona.name,
      role: newPersona.role,
      avatar: "/placeholder-avatar.png",
      demographics: {
        age: newPersona.age,
        location: newPersona.location,
        income: newPersona.income,
        education: newPersona.education,
        occupation: newPersona.occupation,
      },
      psychographics: {
        goals: newPersona.goals,
        painPoints: newPersona.painPoints,
        motivations: newPersona.motivations,
        values: [],
        interests: []
      },
      behaviors: {
        preferredChannels: newPersona.preferredChannels,
        contentPreferences: [],
        buyingBehavior: "",
        decisionFactors: []
      },
      quotes: [],
      isAIGenerated: false
    }
    
    setPersonas(prev => [...prev, persona])
    setNewPersonaOpen(false)
    setNewPersona({
      name: "",
      role: "",
      age: "",
      location: "",
      income: "",
      education: "",
      occupation: "",
      bio: "",
      goals: [],
      painPoints: [],
      motivations: [],
      preferredChannels: [],
    })
    toast.success("Buyer persona creada")
  }
  
  const handleDeletePersona = (personaId: string) => {
    setPersonas(prev => prev.filter(p => p.id !== personaId))
    toast.success("Persona eliminada")
  }
  
  const channelIcons: Record<string, React.ReactNode> = {
    instagram: <Instagram className="h-4 w-4" />,
    facebook: <Facebook className="h-4 w-4" />,
    linkedin: <Linkedin className="h-4 w-4" />,
    youtube: <Youtube className="h-4 w-4" />,
    email: <MessageSquare className="h-4 w-4" />,
    eventos: <Calendar className="h-4 w-4" />,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/orbit-marketing-intelligence/brands/${brandId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Buyer Personas</h1>
              <Badge variant="secondary">{personas.length} personas</Badge>
            </div>
            <p className="text-muted-foreground">{brand.name} - Perfiles de audiencia objetivo</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleGenerateWithAI}
            disabled={!canGeneratePersonas || isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : canGeneratePersonas ? (
              <Sparkles className="h-4 w-4 mr-2" />
            ) : (
              <Lock className="h-4 w-4 mr-2" />
            )}
            {isGenerating ? "Generando..." : "Generar con IA"}
          </Button>
          <Dialog open={newPersonaOpen} onOpenChange={setNewPersonaOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Persona
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Buyer Persona</DialogTitle>
                <DialogDescription>
                  Define manualmente un perfil de tu audiencia objetivo
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="persona-name">Nombre *</Label>
                    <Input 
                      id="persona-name"
                      placeholder="Ej: María Compradora"
                      value={newPersona.name}
                      onChange={(e) => setNewPersona(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="persona-role">Tipo *</Label>
                    <Select 
                      value={newPersona.role} 
                      onValueChange={(v) => setNewPersona(prev => ({ ...prev, role: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">Primaria</SelectItem>
                        <SelectItem value="secondary">Secundaria</SelectItem>
                        <SelectItem value="negative">Negativa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Separator />
                <p className="text-sm font-medium">Demografía</p>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Edad</Label>
                    <Input 
                      placeholder="Ej: 35-45"
                      value={newPersona.age}
                      onChange={(e) => setNewPersona(prev => ({ ...prev, age: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ubicación</Label>
                    <Input 
                      placeholder="Ej: CDMX"
                      value={newPersona.location}
                      onChange={(e) => setNewPersona(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ingresos</Label>
                    <Input 
                      placeholder="Ej: $50,000 - $80,000"
                      value={newPersona.income}
                      onChange={(e) => setNewPersona(prev => ({ ...prev, income: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Educación</Label>
                    <Input 
                      placeholder="Ej: Licenciatura"
                      value={newPersona.education}
                      onChange={(e) => setNewPersona(prev => ({ ...prev, education: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ocupación</Label>
                    <Input 
                      placeholder="Ej: Gerente de Marketing"
                      value={newPersona.occupation}
                      onChange={(e) => setNewPersona(prev => ({ ...prev, occupation: e.target.value }))}
                    />
                  </div>
                </div>
                
                <Separator />
                <p className="text-sm font-medium">Psicografía</p>
                
                <div className="space-y-2">
                  <Label>Objetivos</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newPersona.goals.map((goal, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {goal}
                        <button
                          onClick={() => setNewPersona(prev => ({
                            ...prev,
                            goals: prev.goals.filter((_, i) => i !== index)
                          }))}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Escribe un objetivo y presiona Enter"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value) {
                        e.preventDefault()
                        setNewPersona(prev => ({
                          ...prev,
                          goals: [...prev.goals, e.currentTarget.value]
                        }))
                        e.currentTarget.value = ""
                      }
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Pain Points</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newPersona.painPoints.map((point, index) => (
                      <Badge key={index} variant="destructive" className="gap-1 bg-red-100 text-red-700">
                        {point}
                        <button
                          onClick={() => setNewPersona(prev => ({
                            ...prev,
                            painPoints: prev.painPoints.filter((_, i) => i !== index)
                          }))}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Escribe un pain point y presiona Enter"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value) {
                        e.preventDefault()
                        setNewPersona(prev => ({
                          ...prev,
                          painPoints: [...prev.painPoints, e.currentTarget.value]
                        }))
                        e.currentTarget.value = ""
                      }
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Canales Preferidos</Label>
                  <div className="flex flex-wrap gap-2">
                    {["instagram", "facebook", "linkedin", "youtube", "email", "eventos"].map(channel => (
                      <Button
                        key={channel}
                        type="button"
                        variant={newPersona.preferredChannels.includes(channel) ? "default" : "outline"}
                        size="sm"
                        onClick={() => setNewPersona(prev => ({
                          ...prev,
                          preferredChannels: prev.preferredChannels.includes(channel)
                            ? prev.preferredChannels.filter(c => c !== channel)
                            : [...prev.preferredChannels, channel]
                        }))}
                        className="gap-1"
                      >
                        {channelIcons[channel]}
                        {channel}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewPersonaOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreatePersona}>
                  Crear Persona
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Brief Completeness Warning */}
      {!canGeneratePersonas && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-full bg-amber-100">
              <Lock className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-amber-900">Brief incompleto para generación con IA</p>
              <p className="text-sm text-amber-700">
                Completa el brief al menos al 70% para desbloquear la generación de personas con IA. 
                Actualmente está al {briefScore}%.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={briefScore} className="w-32 h-2" />
              <Button variant="outline" asChild>
                <Link href={`/orbit-marketing-intelligence/brands/${brandId}/brief`}>
                  Completar Brief
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Personas Grid */}
      {personas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sin Buyer Personas</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Las buyer personas te ayudan a entender mejor a tu audiencia y crear contenido más relevante.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setNewPersonaOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Manualmente
              </Button>
              {canGeneratePersonas && (
                <Button onClick={handleGenerateWithAI}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generar con IA
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {personas.map((persona) => (
            <Card key={persona.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={persona.avatar} />
                        <AvatarFallback className="text-lg">
                          {persona.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full"
                        onClick={() => handleGenerateImage(persona.id)}
                        disabled={isGeneratingImage === persona.id}
                      >
                        {isGeneratingImage === persona.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{persona.name}</CardTitle>
                        {persona.isAIGenerated && (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <Sparkles className="h-3 w-3" />
                            IA
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{persona.demographics?.occupation}</CardDescription>
                      <Badge 
                        variant="outline" 
                        className={`mt-1 ${
                          persona.role === "primary" ? "border-green-300 text-green-700" :
                          persona.role === "secondary" ? "border-blue-300 text-blue-700" :
                          "border-red-300 text-red-700"
                        }`}
                      >
                        {persona.role === "primary" ? "Primaria" : 
                         persona.role === "secondary" ? "Secundaria" : "Negativa"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeletePersona(persona.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Demographics */}
                <div className="flex flex-wrap gap-3 text-sm">
                  {persona.demographics?.age && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {persona.demographics.age}
                    </div>
                  )}
                  {persona.demographics?.location && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {persona.demographics.location}
                    </div>
                  )}
                  {persona.demographics?.income && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <DollarSign className="h-3.5 w-3.5" />
                      {persona.demographics.income}
                    </div>
                  )}
                </div>
                
                <Separator />
                
                {/* Goals */}
                {persona.psychographics?.goals && persona.psychographics.goals.length > 0 && (
                  <div>
                    <p className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-green-600" />
                      Objetivos
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {persona.psychographics.goals.slice(0, 3).map((goal, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-600">•</span>
                          {goal}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Pain Points */}
                {persona.psychographics?.painPoints && persona.psychographics.painPoints.length > 0 && (
                  <div>
                    <p className="text-sm font-medium flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      Pain Points
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {persona.psychographics.painPoints.slice(0, 3).map((point, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-red-600">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Preferred Channels */}
                {persona.behaviors?.preferredChannels && persona.behaviors.preferredChannels.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Canales Preferidos</p>
                    <div className="flex flex-wrap gap-2">
                      {persona.behaviors.preferredChannels.map((channel, i) => (
                        <Badge key={i} variant="outline" className="gap-1">
                          {channelIcons[channel] || <MessageSquare className="h-3 w-3" />}
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Quotes */}
                {persona.quotes && persona.quotes.length > 0 && (
                  <div className="p-3 bg-muted/50 rounded-lg italic text-sm text-muted-foreground">
                    &ldquo;{persona.quotes[0]}&rdquo;
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
