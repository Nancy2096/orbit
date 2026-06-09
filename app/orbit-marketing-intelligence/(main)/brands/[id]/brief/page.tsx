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
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
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
  FileText,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Info,
  Target,
  Users,
  MessageSquare,
  Palette,
  Volume2,
  Hash,
  Ban,
  Lightbulb,
  TrendingUp,
  Lock,
  Unlock,
} from "lucide-react"
import { mockBrands, mockBuyerPersonas } from "@/lib/marketing-intelligence/brand-mock-data"
import { QualityScoreBadge, QualityScoreCircle } from "@/components/marketing-intelligence/brands/quality-score-badge"
import { MissingInfoPanel } from "@/components/marketing-intelligence/brands/missing-info-panel"

// Define brief sections with weights
const briefSections = [
  { id: "identity", name: "Identidad de Marca", weight: 20, icon: Target },
  { id: "audience", name: "Audiencia", weight: 20, icon: Users },
  { id: "voice", name: "Voz y Tono", weight: 15, icon: MessageSquare },
  { id: "visual", name: "Directrices Visuales", weight: 15, icon: Palette },
  { id: "messaging", name: "Mensajes Clave", weight: 15, icon: Volume2 },
  { id: "hashtags", name: "Hashtags y Keywords", weight: 10, icon: Hash },
  { id: "donts", name: "Lo que NO hacer", weight: 5, icon: Ban },
]

export default function BrandBriefPage() {
  const params = useParams()
  const brandId = params.id as string
  
  const brand = mockBrands.find(b => b.id === brandId)
  const personas = mockBuyerPersonas.filter(p => p.brandId === brandId)
  
  const [activeSection, setActiveSection] = useState("identity")
  const [isEditing, setIsEditing] = useState(false)
  const [autoSave, setAutoSave] = useState(true)
  
  // Brief state - in real app this would come from the brand data
  const [briefData, setBriefData] = useState({
    // Identity
    missionStatement: brand?.brief?.missionStatement || "",
    visionStatement: brand?.brief?.visionStatement || "",
    brandValues: brand?.brief?.brandValues || [],
    uniqueSellingProposition: brand?.brief?.uniqueSellingProposition || "",
    brandPersonality: brand?.brief?.brandPersonality || [],
    
    // Audience
    primaryAudience: brand?.brief?.primaryAudience || "",
    secondaryAudience: brand?.brief?.secondaryAudience || "",
    audiencePainPoints: brand?.brief?.audiencePainPoints || [],
    audienceDesires: brand?.brief?.audienceDesires || [],
    
    // Voice & Tone
    voiceAttributes: brand?.brief?.voiceAttributes || [],
    toneExamples: brand?.brief?.toneExamples || [],
    writingStyle: brand?.brief?.writingStyle || "",
    
    // Visual
    colorPalette: brand?.brief?.colorPalette || [],
    typography: brand?.brief?.typography || "",
    imageryStyle: brand?.brief?.imageryStyle || "",
    visualMoodboard: brand?.brief?.visualMoodboard || [],
    
    // Messaging
    tagline: brand?.brief?.tagline || "",
    elevatorPitch: brand?.brief?.elevatorPitch || "",
    keyMessages: brand?.brief?.keyMessages || [],
    
    // Hashtags
    brandHashtags: brand?.brief?.brandHashtags || [],
    campaignHashtags: brand?.brief?.campaignHashtags || [],
    keywords: brand?.brief?.keywords || [],
    
    // Don'ts
    avoidTopics: brand?.brief?.avoidTopics || [],
    avoidWords: brand?.brief?.avoidWords || [],
    competitorMentions: brand?.brief?.competitorMentions || false,
  })
  
  if (!brand) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Marca no encontrada</p>
      </div>
    )
  }
  
  // Calculate section completeness
  const calculateSectionScore = (sectionId: string): number => {
    switch (sectionId) {
      case "identity":
        const identityFields = [
          briefData.missionStatement ? 1 : 0,
          briefData.visionStatement ? 1 : 0,
          briefData.brandValues.length >= 3 ? 1 : briefData.brandValues.length / 3,
          briefData.uniqueSellingProposition ? 1 : 0,
          briefData.brandPersonality.length >= 3 ? 1 : briefData.brandPersonality.length / 3,
        ]
        return (identityFields.reduce((a, b) => a + b, 0) / identityFields.length) * 100
      case "audience":
        const audienceFields = [
          briefData.primaryAudience ? 1 : 0,
          briefData.secondaryAudience ? 0.5 : 0,
          briefData.audiencePainPoints.length >= 3 ? 1 : briefData.audiencePainPoints.length / 3,
          briefData.audienceDesires.length >= 3 ? 1 : briefData.audienceDesires.length / 3,
        ]
        return (audienceFields.reduce((a, b) => a + b, 0) / audienceFields.length) * 100
      case "voice":
        const voiceFields = [
          briefData.voiceAttributes.length >= 3 ? 1 : briefData.voiceAttributes.length / 3,
          briefData.toneExamples.length >= 2 ? 1 : briefData.toneExamples.length / 2,
          briefData.writingStyle ? 1 : 0,
        ]
        return (voiceFields.reduce((a, b) => a + b, 0) / voiceFields.length) * 100
      case "visual":
        const visualFields = [
          briefData.colorPalette.length >= 3 ? 1 : briefData.colorPalette.length / 3,
          briefData.typography ? 1 : 0,
          briefData.imageryStyle ? 1 : 0,
        ]
        return (visualFields.reduce((a, b) => a + b, 0) / visualFields.length) * 100
      case "messaging":
        const messagingFields = [
          briefData.tagline ? 1 : 0,
          briefData.elevatorPitch ? 1 : 0,
          briefData.keyMessages.length >= 3 ? 1 : briefData.keyMessages.length / 3,
        ]
        return (messagingFields.reduce((a, b) => a + b, 0) / messagingFields.length) * 100
      case "hashtags":
        const hashtagFields = [
          briefData.brandHashtags.length >= 3 ? 1 : briefData.brandHashtags.length / 3,
          briefData.keywords.length >= 5 ? 1 : briefData.keywords.length / 5,
        ]
        return (hashtagFields.reduce((a, b) => a + b, 0) / hashtagFields.length) * 100
      case "donts":
        const dontFields = [
          briefData.avoidTopics.length >= 2 ? 1 : briefData.avoidTopics.length / 2,
          briefData.avoidWords.length >= 3 ? 1 : briefData.avoidWords.length / 3,
        ]
        return (dontFields.reduce((a, b) => a + b, 0) / dontFields.length) * 100
      default:
        return 0
    }
  }
  
  // Calculate overall quality score
  const calculateOverallScore = (): number => {
    let totalScore = 0
    briefSections.forEach(section => {
      const sectionScore = calculateSectionScore(section.id)
      totalScore += (sectionScore * section.weight) / 100
    })
    return Math.round(totalScore)
  }
  
  const overallScore = calculateOverallScore()
  const canGeneratePersonas = overallScore >= 70
  
  // Get missing items for current section
  const getMissingItems = (sectionId: string): string[] => {
    const missing: string[] = []
    switch (sectionId) {
      case "identity":
        if (!briefData.missionStatement) missing.push("Declaración de misión")
        if (!briefData.visionStatement) missing.push("Declaración de visión")
        if (briefData.brandValues.length < 3) missing.push(`Valores de marca (${3 - briefData.brandValues.length} más)`)
        if (!briefData.uniqueSellingProposition) missing.push("Propuesta única de valor")
        if (briefData.brandPersonality.length < 3) missing.push(`Personalidad de marca (${3 - briefData.brandPersonality.length} más)`)
        break
      case "audience":
        if (!briefData.primaryAudience) missing.push("Audiencia primaria")
        if (briefData.audiencePainPoints.length < 3) missing.push(`Pain points (${3 - briefData.audiencePainPoints.length} más)`)
        if (briefData.audienceDesires.length < 3) missing.push(`Deseos de audiencia (${3 - briefData.audienceDesires.length} más)`)
        break
      // Add more cases as needed
    }
    return missing
  }
  
  const handleSave = () => {
    toast.success("Brief guardado correctamente")
    setIsEditing(false)
  }
  
  const handleGenerateWithAI = () => {
    toast.info("Generando sugerencias con IA...", { duration: 2000 })
    setTimeout(() => {
      toast.success("Sugerencias generadas")
    }, 2000)
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
              <h1 className="text-2xl font-bold">Brief Inteligente</h1>
              <QualityScoreBadge score={overallScore} size="lg" />
            </div>
            <p className="text-muted-foreground">{brand.name} - Centro de inteligencia de marca</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch checked={autoSave} onCheckedChange={setAutoSave} />
            <Label className="text-sm text-muted-foreground">Auto-guardar</Label>
          </div>
          <Button variant="outline" onClick={handleGenerateWithAI}>
            <Sparkles className="h-4 w-4 mr-2" />
            Sugerir con IA
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar - Section Navigation */}
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Secciones del Brief</CardTitle>
              <CardDescription>Completa cada sección para mejorar el score</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {briefSections.map((section) => {
                const score = calculateSectionScore(section.id)
                const Icon = section.icon
                const isActive = activeSection === section.id
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isActive ? "" : ""}`}>
                        {section.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress 
                          value={score} 
                          className={`h-1.5 flex-1 ${isActive ? "bg-primary-foreground/20" : ""}`}
                        />
                        <span className={`text-xs ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                          {Math.round(score)}%
                        </span>
                      </div>
                    </div>
                    {score === 100 && (
                      <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-primary-foreground" : "text-green-600"}`} />
                    )}
                  </button>
                )
              })}
            </CardContent>
          </Card>
          
          {/* Quality Score Summary */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Quality Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center mb-4">
                <QualityScoreCircle score={overallScore} size={120} />
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  {canGeneratePersonas ? (
                    <>
                      <Unlock className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-medium">Personas IA desbloqueadas</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Completa al 70% para desbloquear IA
                      </span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="col-span-9">
          {/* Identity Section */}
          {activeSection === "identity" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Identidad de Marca
                    </CardTitle>
                    <CardDescription>Define quién es tu marca y qué la hace única</CardDescription>
                  </div>
                  <Badge variant="outline">{Math.round(calculateSectionScore("identity"))}% completo</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="mission">Declaración de Misión *</Label>
                  <Textarea
                    id="mission"
                    placeholder="¿Cuál es el propósito fundamental de tu marca? ¿Por qué existe?"
                    value={briefData.missionStatement}
                    onChange={(e) => setBriefData(prev => ({ ...prev, missionStatement: e.target.value }))}
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Describe el propósito principal de la marca y el impacto que busca generar.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vision">Declaración de Visión *</Label>
                  <Textarea
                    id="vision"
                    placeholder="¿Cómo ves a tu marca en el futuro? ¿Qué quieres lograr?"
                    value={briefData.visionStatement}
                    onChange={(e) => setBriefData(prev => ({ ...prev, visionStatement: e.target.value }))}
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Valores de Marca * (mínimo 3)</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {briefData.brandValues.map((value, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {value}
                        <button
                          onClick={() => setBriefData(prev => ({
                            ...prev,
                            brandValues: prev.brandValues.filter((_, i) => i !== index)
                          }))}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Escribe un valor y presiona Enter"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value) {
                        e.preventDefault()
                        setBriefData(prev => ({
                          ...prev,
                          brandValues: [...prev.brandValues, e.currentTarget.value]
                        }))
                        e.currentTarget.value = ""
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ejemplos: Innovación, Confianza, Excelencia, Sostenibilidad, Transparencia
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="usp">Propuesta Única de Valor (USP) *</Label>
                  <Textarea
                    id="usp"
                    placeholder="¿Qué hace única a tu marca frente a la competencia?"
                    value={briefData.uniqueSellingProposition}
                    onChange={(e) => setBriefData(prev => ({ ...prev, uniqueSellingProposition: e.target.value }))}
                    className="min-h-[80px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Personalidad de Marca * (mínimo 3 adjetivos)</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {briefData.brandPersonality.map((trait, index) => (
                      <Badge key={index} variant="outline" className="gap-1">
                        {trait}
                        <button
                          onClick={() => setBriefData(prev => ({
                            ...prev,
                            brandPersonality: prev.brandPersonality.filter((_, i) => i !== index)
                          }))}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Ej: Profesional, Cercana, Innovadora..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value) {
                        e.preventDefault()
                        setBriefData(prev => ({
                          ...prev,
                          brandPersonality: [...prev.brandPersonality, e.currentTarget.value]
                        }))
                        e.currentTarget.value = ""
                      }
                    }}
                  />
                </div>
                
                {getMissingItems("identity").length > 0 && (
                  <MissingInfoPanel 
                    items={getMissingItems("identity")} 
                    severity="warning"
                    title="Campos pendientes para completar esta sección"
                  />
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Audience Section */}
          {activeSection === "audience" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Audiencia
                    </CardTitle>
                    <CardDescription>Define a quién te diriges y qué necesitan</CardDescription>
                  </div>
                  <Badge variant="outline">{Math.round(calculateSectionScore("audience"))}% completo</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-audience">Audiencia Primaria *</Label>
                    <Textarea
                      id="primary-audience"
                      placeholder="Describe tu audiencia principal: demografía, comportamiento, intereses..."
                      value={briefData.primaryAudience}
                      onChange={(e) => setBriefData(prev => ({ ...prev, primaryAudience: e.target.value }))}
                      className="min-h-[120px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary-audience">Audiencia Secundaria</Label>
                    <Textarea
                      id="secondary-audience"
                      placeholder="Describe audiencias secundarias o nichos específicos..."
                      value={briefData.secondaryAudience}
                      onChange={(e) => setBriefData(prev => ({ ...prev, secondaryAudience: e.target.value }))}
                      className="min-h-[120px]"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Pain Points de la Audiencia * (mínimo 3)</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {briefData.audiencePainPoints.map((point, index) => (
                      <Badge key={index} variant="destructive" className="gap-1 bg-red-100 text-red-700 hover:bg-red-200">
                        {point}
                        <button
                          onClick={() => setBriefData(prev => ({
                            ...prev,
                            audiencePainPoints: prev.audiencePainPoints.filter((_, i) => i !== index)
                          }))}
                          className="ml-1 hover:text-red-900"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="¿Qué problemas o frustraciones tiene tu audiencia?"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value) {
                        e.preventDefault()
                        setBriefData(prev => ({
                          ...prev,
                          audiencePainPoints: [...prev.audiencePainPoints, e.currentTarget.value]
                        }))
                        e.currentTarget.value = ""
                      }
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Deseos y Aspiraciones * (mínimo 3)</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {briefData.audienceDesires.map((desire, index) => (
                      <Badge key={index} variant="secondary" className="gap-1 bg-green-100 text-green-700">
                        {desire}
                        <button
                          onClick={() => setBriefData(prev => ({
                            ...prev,
                            audienceDesires: prev.audienceDesires.filter((_, i) => i !== index)
                          }))}
                          className="ml-1 hover:text-green-900"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="¿Qué quiere lograr o sentir tu audiencia?"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value) {
                        e.preventDefault()
                        setBriefData(prev => ({
                          ...prev,
                          audienceDesires: [...prev.audienceDesires, e.currentTarget.value]
                        }))
                        e.currentTarget.value = ""
                      }
                    }}
                  />
                </div>
                
                {personas.length > 0 && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">Buyer Personas vinculadas</p>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/orbit-marketing-intelligence/brands/${brandId}/personas`}>
                          Ver Personas
                        </Link>
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      {personas.slice(0, 3).map(persona => (
                        <Badge key={persona.id} variant="outline">
                          {persona.name}
                        </Badge>
                      ))}
                      {personas.length > 3 && (
                        <Badge variant="outline">+{personas.length - 3} más</Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Voice & Tone Section */}
          {activeSection === "voice" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Voz y Tono
                    </CardTitle>
                    <CardDescription>Define cómo se comunica tu marca</CardDescription>
                  </div>
                  <Badge variant="outline">{Math.round(calculateSectionScore("voice"))}% completo</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Atributos de Voz * (mínimo 3)</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Define las características que siempre deben estar presentes en la comunicación
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {briefData.voiceAttributes.map((attr, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {attr}
                        <button
                          onClick={() => setBriefData(prev => ({
                            ...prev,
                            voiceAttributes: prev.voiceAttributes.filter((_, i) => i !== index)
                          }))}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Ej: Profesional, Empático, Directo, Inspirador..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value) {
                        e.preventDefault()
                        setBriefData(prev => ({
                          ...prev,
                          voiceAttributes: [...prev.voiceAttributes, e.currentTarget.value]
                        }))
                        e.currentTarget.value = ""
                      }
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="writing-style">Estilo de Escritura *</Label>
                  <Select 
                    value={briefData.writingStyle} 
                    onValueChange={(v) => setBriefData(prev => ({ ...prev, writingStyle: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un estilo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal y corporativo</SelectItem>
                      <SelectItem value="professional">Profesional pero accesible</SelectItem>
                      <SelectItem value="conversational">Conversacional y cercano</SelectItem>
                      <SelectItem value="casual">Casual y relajado</SelectItem>
                      <SelectItem value="playful">Divertido y juguetón</SelectItem>
                      <SelectItem value="inspirational">Inspiracional y motivador</SelectItem>
                      <SelectItem value="educational">Educativo e informativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Ejemplos de Tono por Contexto</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Agrega ejemplos de cómo debería sonar la marca en diferentes situaciones
                  </p>
                  {briefData.toneExamples.map((example, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input value={example} readOnly className="flex-1" />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setBriefData(prev => ({
                          ...prev,
                          toneExamples: prev.toneExamples.filter((_, i) => i !== index)
                        }))}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <Input
                    placeholder="Ej: En redes sociales: casual y amigable. En emails: profesional pero cálido."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value) {
                        e.preventDefault()
                        setBriefData(prev => ({
                          ...prev,
                          toneExamples: [...prev.toneExamples, e.currentTarget.value]
                        }))
                        e.currentTarget.value = ""
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Visual Section */}
          {activeSection === "visual" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Directrices Visuales
                    </CardTitle>
                    <CardDescription>Define la identidad visual de tu marca</CardDescription>
                  </div>
                  <Badge variant="outline">{Math.round(calculateSectionScore("visual"))}% completo</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Paleta de Colores * (mínimo 3)</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {briefData.colorPalette.map((color, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
                      >
                        <div 
                          className="w-4 h-4 rounded-full border" 
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm">{color}</span>
                        <button
                          onClick={() => setBriefData(prev => ({
                            ...prev,
                            colorPalette: prev.colorPalette.filter((_, i) => i !== index)
                          }))}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      className="w-12 h-10 p-1 cursor-pointer"
                      onChange={(e) => {
                        const color = e.target.value
                        if (!briefData.colorPalette.includes(color)) {
                          setBriefData(prev => ({
                            ...prev,
                            colorPalette: [...prev.colorPalette, color]
                          }))
                        }
                      }}
                    />
                    <Input
                      placeholder="O escribe un código HEX (#FFFFFF)"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value) {
                          e.preventDefault()
                          setBriefData(prev => ({
                            ...prev,
                            colorPalette: [...prev.colorPalette, e.currentTarget.value]
                          }))
                          e.currentTarget.value = ""
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="typography">Tipografía *</Label>
                  <Textarea
                    id="typography"
                    placeholder="Describe las fuentes utilizadas: títulos, cuerpo de texto, acentos..."
                    value={briefData.typography}
                    onChange={(e) => setBriefData(prev => ({ ...prev, typography: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="imagery">Estilo de Imágenes *</Label>
                  <Textarea
                    id="imagery"
                    placeholder="Describe el estilo visual: fotografía, ilustraciones, filtros, composición..."
                    value={briefData.imageryStyle}
                    onChange={(e) => setBriefData(prev => ({ ...prev, imageryStyle: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Messaging Section */}
          {activeSection === "messaging" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Volume2 className="h-5 w-5" />
                      Mensajes Clave
                    </CardTitle>
                    <CardDescription>Define los mensajes principales de tu marca</CardDescription>
                  </div>
                  <Badge variant="outline">{Math.round(calculateSectionScore("messaging"))}% completo</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline / Eslogan *</Label>
                  <Input
                    id="tagline"
                    placeholder="Tu frase memorable de marca"
                    value={briefData.tagline}
                    onChange={(e) => setBriefData(prev => ({ ...prev, tagline: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="elevator">Elevator Pitch *</Label>
                  <Textarea
                    id="elevator"
                    placeholder="Explica tu marca en 30 segundos o menos"
                    value={briefData.elevatorPitch}
                    onChange={(e) => setBriefData(prev => ({ ...prev, elevatorPitch: e.target.value }))}
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Mensajes Clave * (mínimo 3)</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Los puntos más importantes que quieres comunicar siempre
                  </p>
                  {briefData.keyMessages.map((msg, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {index + 1}
                      </div>
                      <Input value={msg} readOnly className="flex-1" />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setBriefData(prev => ({
                          ...prev,
                          keyMessages: prev.keyMessages.filter((_, i) => i !== index)
                        }))}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <Input
                    placeholder="Agrega un mensaje clave"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value) {
                        e.preventDefault()
                        setBriefData(prev => ({
                          ...prev,
                          keyMessages: [...prev.keyMessages, e.currentTarget.value]
                        }))
                        e.currentTarget.value = ""
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Hashtags Section */}
          {activeSection === "hashtags" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Hash className="h-5 w-5" />
                      Hashtags y Keywords
                    </CardTitle>
                    <CardDescription>Define tus hashtags y palabras clave para SEO y redes</CardDescription>
                  </div>
                  <Badge variant="outline">{Math.round(calculateSectionScore("hashtags"))}% completo</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Hashtags de Marca * (mínimo 3)</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {briefData.brandHashtags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        #{tag}
                        <button
                          onClick={() => setBriefData(prev => ({
                            ...prev,
                            brandHashtags: prev.brandHashtags.filter((_, i) => i !== index)
                          }))}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Hashtags propios de tu marca (sin #)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value) {
                        e.preventDefault()
                        setBriefData(prev => ({
                          ...prev,
                          brandHashtags: [...prev.brandHashtags, e.currentTarget.value.replace("#", "")]
                        }))
                        e.currentTarget.value = ""
                      }
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Keywords SEO * (mínimo 5)</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {briefData.keywords.map((keyword, index) => (
                      <Badge key={index} variant="outline" className="gap-1">
                        {keyword}
                        <button
                          onClick={() => setBriefData(prev => ({
                            ...prev,
                            keywords: prev.keywords.filter((_, i) => i !== index)
                          }))}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Palabras clave para SEO y búsqueda"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value) {
                        e.preventDefault()
                        setBriefData(prev => ({
                          ...prev,
                          keywords: [...prev.keywords, e.currentTarget.value]
                        }))
                        e.currentTarget.value = ""
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Don'ts Section */}
          {activeSection === "donts" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Ban className="h-5 w-5" />
                      Lo que NO hacer
                    </CardTitle>
                    <CardDescription>Define los límites y restricciones de comunicación</CardDescription>
                  </div>
                  <Badge variant="outline">{Math.round(calculateSectionScore("donts"))}% completo</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Temas a Evitar * (mínimo 2)</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {briefData.avoidTopics.map((topic, index) => (
                      <Badge key={index} variant="destructive" className="gap-1">
                        {topic}
                        <button
                          onClick={() => setBriefData(prev => ({
                            ...prev,
                            avoidTopics: prev.avoidTopics.filter((_, i) => i !== index)
                          }))}
                          className="ml-1"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Temas que la marca nunca debe tocar"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value) {
                        e.preventDefault()
                        setBriefData(prev => ({
                          ...prev,
                          avoidTopics: [...prev.avoidTopics, e.currentTarget.value]
                        }))
                        e.currentTarget.value = ""
                      }
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Palabras Prohibidas * (mínimo 3)</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {briefData.avoidWords.map((word, index) => (
                      <Badge key={index} variant="outline" className="gap-1 border-destructive text-destructive">
                        {word}
                        <button
                          onClick={() => setBriefData(prev => ({
                            ...prev,
                            avoidWords: prev.avoidWords.filter((_, i) => i !== index)
                          }))}
                          className="ml-1"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Palabras que nunca deben usarse"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value) {
                        e.preventDefault()
                        setBriefData(prev => ({
                          ...prev,
                          avoidWords: [...prev.avoidWords, e.currentTarget.value]
                        }))
                        e.currentTarget.value = ""
                      }
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Menciones de Competidores</p>
                    <p className="text-sm text-muted-foreground">¿Se permite mencionar competidores?</p>
                  </div>
                  <Switch
                    checked={briefData.competitorMentions}
                    onCheckedChange={(checked) => setBriefData(prev => ({ ...prev, competitorMentions: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
