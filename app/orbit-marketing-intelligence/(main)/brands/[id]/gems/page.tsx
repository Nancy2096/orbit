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
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  ArrowLeft,
  Bot,
  Sparkles,
  Settings,
  Play,
  Pause,
  MoreVertical,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Zap,
  MessageSquare,
  FileText,
  ImageIcon,
  TrendingUp,
  Users,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Brain,
  Cpu,
  Wand2,
} from "lucide-react"
import { mockBrands, mockBuyerPersonas } from "@/lib/marketing-intelligence/brand-mock-data"
import { mockGemConfigs } from "@/lib/marketing-intelligence/brand-phase2-mock-data"

export default function GemsPage() {
  const params = useParams()
  const brandId = params.id as string
  const brand = mockBrands.find(b => b.id === brandId)
  
  const [createOpen, setCreateOpen] = useState(false)
  const [editGem, setEditGem] = useState<string | null>(null)
  
  const brandGems = mockGemConfigs.filter(g => g.brandId === brandId)

  const categoryIcons: Record<string, React.ReactNode> = {
    content: <FileText className="h-5 w-5" />,
    copy: <MessageSquare className="h-5 w-5" />,
    image: <ImageIcon className="h-5 w-5" />,
    analysis: <TrendingUp className="h-5 w-5" />,
    strategy: <Target className="h-5 w-5" />,
    audience: <Users className="h-5 w-5" />,
  }

  const categoryColors: Record<string, string> = {
    content: "bg-purple-100 text-purple-700",
    copy: "bg-blue-100 text-blue-700",
    image: "bg-pink-100 text-pink-700",
    analysis: "bg-green-100 text-green-700",
    strategy: "bg-amber-100 text-amber-700",
    audience: "bg-indigo-100 text-indigo-700",
  }

  const categoryLabels: Record<string, string> = {
    content: "Contenido",
    copy: "Copywriting",
    image: "Imágenes",
    analysis: "Análisis",
    strategy: "Estrategia",
    audience: "Audiencia",
  }

  const handleToggleGem = (gemId: string, active: boolean) => {
    toast.success(active ? "GEM activado" : "GEM desactivado")
  }

  const handleDuplicateGem = (gemId: string) => {
    toast.success("GEM duplicado correctamente")
  }

  const handleDeleteGem = (gemId: string) => {
    toast.success("GEM eliminado")
  }

  const handleTestGem = (gemId: string) => {
    toast.success("Ejecutando prueba del GEM...")
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
              <Brain className="h-6 w-6 text-indigo-600" />
              GEMs y Agentes IA
            </h1>
            <p className="text-muted-foreground">{brand.name} - Configuración de asistentes inteligentes</p>
          </div>
        </div>
        
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Crear GEM
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo GEM</DialogTitle>
              <DialogDescription>
                Configura un asistente de IA especializado para esta marca
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del GEM *</Label>
                  <Input placeholder="Ej: Generador de Copy para Instagram" />
                </div>
                <div className="space-y-2">
                  <Label>Categoría *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="content">Contenido</SelectItem>
                      <SelectItem value="copy">Copywriting</SelectItem>
                      <SelectItem value="image">Imágenes</SelectItem>
                      <SelectItem value="analysis">Análisis</SelectItem>
                      <SelectItem value="strategy">Estrategia</SelectItem>
                      <SelectItem value="audience">Audiencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input placeholder="Breve descripción de lo que hace este GEM" />
              </div>
              
              <div className="space-y-2">
                <Label>System Prompt *</Label>
                <Textarea 
                  placeholder="Instrucciones detalladas para el comportamiento de la IA..."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Define el comportamiento, tono, restricciones y formato de salida del GEM
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Modelo IA</Label>
                  <Select defaultValue="gpt-4o">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o (Recomendado)</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini (Rápido)</SelectItem>
                      <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                      <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Temperatura: 0.7</Label>
                  <Slider defaultValue={[0.7]} max={1} step={0.1} className="mt-2" />
                  <p className="text-xs text-muted-foreground">
                    Menor = más preciso, Mayor = más creativo
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Buyer Persona (opcional)</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar persona objetivo" />
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
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Incluir contexto de marca</Label>
                  <p className="text-xs text-muted-foreground">
                    Inyecta automáticamente el brief de la marca en cada ejecución
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => { setCreateOpen(false); toast.success("GEM creado correctamente") }}>
                <Sparkles className="h-4 w-4 mr-2" />
                Crear GEM
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100">
                <Bot className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{brandGems.length}</p>
                <p className="text-sm text-muted-foreground">GEMs Totales</p>
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
                  {brandGems.filter(g => g.isActive).length}
                </p>
                <p className="text-sm text-muted-foreground">Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {brandGems.reduce((sum, g) => sum + g.usageCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Ejecuciones</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Math.round(brandGems.reduce((sum, g) => sum + g.avgResponseTime, 0) / (brandGems.length || 1))}s
                </p>
                <p className="text-sm text-muted-foreground">Tiempo Promedio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs by Category */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="content">Contenido</TabsTrigger>
          <TabsTrigger value="copy">Copywriting</TabsTrigger>
          <TabsTrigger value="image">Imágenes</TabsTrigger>
          <TabsTrigger value="analysis">Análisis</TabsTrigger>
          <TabsTrigger value="strategy">Estrategia</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {brandGems.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay GEMs configurados</h3>
                <p className="text-muted-foreground mb-4">
                  Crea asistentes de IA personalizados para esta marca
                </p>
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer GEM
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {brandGems.map((gem) => (
                <Card key={gem.id} className="relative overflow-hidden">
                  {/* Status Indicator */}
                  <div className={`absolute top-0 right-0 w-16 h-16 ${gem.isActive ? 'bg-green-500' : 'bg-gray-400'} opacity-10 rounded-bl-full`} />
                  
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${categoryColors[gem.category]}`}>
                          {categoryIcons[gem.category]}
                        </div>
                        <div>
                          <CardTitle className="text-base">{gem.name}</CardTitle>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {categoryLabels[gem.category]}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={gem.isActive} 
                          onCheckedChange={(checked) => handleToggleGem(gem.id, checked)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {gem.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Cpu className="h-4 w-4" />
                        <span>{gem.model}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Zap className="h-4 w-4" />
                        <span>Temp: {gem.temperature}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Activity className="h-4 w-4" />
                        <span>{gem.usageCount} usos</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{gem.avgResponseTime}s prom</span>
                      </div>
                    </div>
                    
                    {gem.buyerPersonaId && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {mockBuyerPersonas.find(p => p.id === gem.buyerPersonaId)?.name || 'Persona'}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleTestGem(gem.id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Probar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditGem(gem.id)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDuplicateGem(gem.id)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteGem(gem.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Filtered tabs content */}
        {['content', 'copy', 'image', 'analysis', 'strategy'].map(category => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {brandGems.filter(g => g.category === category).map((gem) => (
                <Card key={gem.id} className="relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-16 h-16 ${gem.isActive ? 'bg-green-500' : 'bg-gray-400'} opacity-10 rounded-bl-full`} />
                  
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${categoryColors[gem.category]}`}>
                          {categoryIcons[gem.category]}
                        </div>
                        <div>
                          <CardTitle className="text-base">{gem.name}</CardTitle>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {categoryLabels[gem.category]}
                          </Badge>
                        </div>
                      </div>
                      <Switch 
                        checked={gem.isActive} 
                        onCheckedChange={(checked) => handleToggleGem(gem.id, checked)}
                      />
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {gem.description}
                    </p>
                    
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleTestGem(gem.id)}>
                        <Play className="h-4 w-4 mr-1" />
                        Probar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setEditGem(gem.id)}>
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {brandGems.filter(g => g.category === category).length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No hay GEMs en esta categoría</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setCreateOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear GEM
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Tips Card */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            Tips para Mejores GEMs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 md:grid-cols-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Usa prompts específicos y detallados para mejores resultados</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Asigna buyer personas para contenido más relevante</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Temperatura baja (0.3-0.5) para tareas precisas</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Temperatura alta (0.7-1.0) para creatividad</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
