"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Brain,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  MessageSquare,
  Wand2,
  Copy,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Zap,
  FileText,
  Hash,
  Calendar,
  User,
  Building2,
  BarChart3,
  Settings,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Send,
  ListTodo,
} from "lucide-react"
import { mockAiInsights, mockAiTasks } from "@/lib/marketing-intelligence/mock-data-phase3"
import type { AiInsight, AiTask, InsightPriority, InsightType, AiProvider } from "@/lib/marketing-intelligence/types-phase3"

const priorityConfig: Record<InsightPriority, { label: string; color: string }> = {
  baja: { label: "Baja", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  media: { label: "Media", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  alta: { label: "Alta", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  critica: { label: "Crítica", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
}

const typeConfig: Record<InsightType, { label: string; icon: any; color: string }> = {
  anomaly: { label: "Anomalía", icon: AlertTriangle, color: "text-red-500" },
  recommendation: { label: "Recomendación", icon: Lightbulb, color: "text-yellow-500" },
  finding: { label: "Hallazgo", icon: Target, color: "text-blue-500" },
  alert: { label: "Alerta", icon: Zap, color: "text-orange-500" },
}

export default function IaInsightsPage() {
  const [insights, setInsights] = useState<AiInsight[]>(mockAiInsights)
  const [tasks, setTasks] = useState<AiTask[]>(mockAiTasks)
  const [activeTab, setActiveTab] = useState("resumen")
  const [selectedClient, setSelectedClient] = useState("all")
  const [selectedPeriod, setSelectedPeriod] = useState("30d")
  const [aiProvider, setAiProvider] = useState<AiProvider>("chatgpt")
  const [showGeneratorDialog, setShowGeneratorDialog] = useState(false)
  const [generatorType, setGeneratorType] = useState<string>("")
  const [generatorInput, setGeneratorInput] = useState("")
  const [generatedContent, setGeneratedContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const filteredInsights = insights.filter(insight => {
    if (selectedClient === "all") return true
    return insight.clientId === selectedClient
  })

  const anomalies = filteredInsights.filter(i => i.type === 'anomaly')
  const recommendations = filteredInsights.filter(i => i.type === 'recommendation')
  const findings = filteredInsights.filter(i => i.type === 'finding')

  const handleGenerateContent = () => {
    setIsGenerating(true)
    // Simulated AI generation
    setTimeout(() => {
      const mockResponses: Record<string, string> = {
        copy: "Descubre tu nuevo hogar en Torre Skyline. Departamentos de lujo con vistas panorámicas a la ciudad. Amenidades de primer nivel y ubicación privilegiada. ¡Agenda tu visita hoy!",
        caption: "La vista que siempre soñaste, ahora puede ser tuya. Torre Skyline te ofrece más que un departamento, te ofrece un estilo de vida. #VidaDeLujo #NuevoHogar #TorreSkyline",
        hashtags: "#RealEstate #Departamentos #Lujo #Inversión #NuevoHogar #VidaUrbana #TorreSkyline #Inmobiliaria #PropiedadesPremium #CiudadDeMéxico",
        campaign_idea: "Campaña: 'Tu Vista, Tu Vida'\n\nObjetivo: Generar leads calificados para Torre Skyline\n\nConcepto: Mostrar el estilo de vida aspiracional que ofrece vivir en Torre Skyline a través de testimoniales de residentes y tours virtuales.\n\nCanales: Meta Ads (Instagram/Facebook), Google Ads, TikTok\n\nFormato: Video corto + carrusel de imágenes\n\nCTA: Agenda tu visita virtual",
        executive_summary: "Durante el periodo analizado, la campaña de Meta Ads generó 145 leads con un CPL de $58, un 28% superior al periodo anterior. Se recomienda optimizar las audiencias de remarketing y probar nuevos creativos. Google Ads mostró mejor calidad de leads con una tasa de conversión 35% mayor. El tráfico orgánico se mantiene estable con oportunidades de mejora en SEO técnico.",
        next_steps: "1. Optimizar audiencias de Meta Ads enfocándose en intereses de inversión\n2. Crear 3 nuevos creativos para A/B testing\n3. Incrementar presupuesto de Google Ads en 20%\n4. Implementar estrategia de remarketing por etapa del funnel\n5. Revisar y corregir errores de SEO técnico detectados",
      }
      setGeneratedContent(mockResponses[generatorType] || "Contenido generado exitosamente.")
      setIsGenerating(false)
    }, 2000)
  }

  const openGenerator = (type: string) => {
    setGeneratorType(type)
    setGeneratorInput("")
    setGeneratedContent("")
    setShowGeneratorDialog(true)
  }

  const handleMarkInsightStatus = (insightId: string, status: 'revisado' | 'aplicado' | 'ignorado') => {
    setInsights(insights.map(i => i.id === insightId ? { ...i, status } : i))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            IA e Insights
          </h1>
          <p className="text-muted-foreground">Análisis inteligente y recomendaciones automáticas para tus campañas</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={aiProvider} onValueChange={(v) => setAiProvider(v as AiProvider)}>
            <SelectTrigger className="w-[150px]">
              <Sparkles className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chatgpt">ChatGPT</SelectItem>
              <SelectItem value="gemini">Gemini</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Configurar IA
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-2 flex-1">
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-[200px]">
                  <Building2 className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los clientes</SelectItem>
                  <SelectItem value="client-1">Vertex Inmobiliaria</SelectItem>
                  <SelectItem value="client-2">TechStart</SelectItem>
                  <SelectItem value="client-3">FoodDelight</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[150px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 días</SelectItem>
                  <SelectItem value="30d">Últimos 30 días</SelectItem>
                  <SelectItem value="90d">Últimos 90 días</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>
              <RefreshCw className="mr-2 h-4 w-4" />
              Generar Análisis
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="hallazgos">Hallazgos</TabsTrigger>
          <TabsTrigger value="anomalias">Anomalías</TabsTrigger>
          <TabsTrigger value="recomendaciones">Recomendaciones</TabsTrigger>
          <TabsTrigger value="generador">Generador</TabsTrigger>
          <TabsTrigger value="tareas">Tareas</TabsTrigger>
        </TabsList>

        {/* Resumen Tab */}
        <TabsContent value="resumen" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Hallazgos</CardTitle>
                <Target className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{findings.length}</div>
                <p className="text-xs text-muted-foreground">Insights importantes detectados</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Anomalías</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{anomalies.length}</div>
                <p className="text-xs text-muted-foreground">Requieren atención</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Recomendaciones</CardTitle>
                <Lightbulb className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recommendations.length}</div>
                <p className="text-xs text-muted-foreground">Oportunidades de mejora</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tareas Sugeridas</CardTitle>
                <ListTodo className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'pendiente').length}</div>
                <p className="text-xs text-muted-foreground">Pendientes de asignar</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Insights */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Anomalías Detectadas
                </CardTitle>
                <CardDescription>Métricas fuera de lo normal que requieren atención</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {anomalies.slice(0, 3).map((insight) => (
                  <div key={insight.id} className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                      {insight.changePercent && insight.changePercent > 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-red-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{insight.title}</div>
                      <div className="text-sm text-muted-foreground">{insight.description}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">{insight.clientName}</Badge>
                        <Badge className={priorityConfig[insight.priority].color}>{priorityConfig[insight.priority].label}</Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Recomendaciones IA
                </CardTitle>
                <CardDescription>Sugerencias para optimizar tus campañas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[...recommendations, ...findings].slice(0, 3).map((insight) => (
                  <div key={insight.id} className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                    <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                      <Lightbulb className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{insight.title}</div>
                      <div className="text-sm text-muted-foreground">{insight.recommendation || insight.description}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">{insight.module}</Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Hallazgos Tab */}
        <TabsContent value="hallazgos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hallazgos Importantes</CardTitle>
              <CardDescription>Insights detectados por IA en tus datos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {findings.map((insight) => {
                const TypeIcon = typeConfig[insight.type].icon
                return (
                  <div key={insight.id} className="p-4 rounded-lg border hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className={`h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center ${typeConfig[insight.type].color}`}>
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{insight.title}</h4>
                          <Badge className={priorityConfig[insight.priority].color}>{priorityConfig[insight.priority].label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                        {insight.recommendation && (
                          <div className="mt-2 p-2 rounded bg-muted/50">
                            <div className="text-xs font-medium text-muted-foreground mb-1">Recomendación:</div>
                            <p className="text-sm">{insight.recommendation}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            {insight.clientName}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <BarChart3 className="h-4 w-4" />
                            {insight.module}
                          </div>
                          <Badge variant={insight.status === 'nuevo' ? 'default' : 'secondary'}>
                            {insight.status === 'nuevo' ? 'Nuevo' : insight.status === 'revisado' ? 'Revisado' : insight.status === 'aplicado' ? 'Aplicado' : 'Ignorado'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleMarkInsightStatus(insight.id, 'aplicado')}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Aplicar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleMarkInsightStatus(insight.id, 'ignorado')}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Ignorar
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anomalías Tab */}
        <TabsContent value="anomalias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Anomalías Detectadas
              </CardTitle>
              <CardDescription>Métricas que se desvían significativamente de lo esperado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {anomalies.map((anomaly) => (
                  <div key={anomaly.id} className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
                          {anomaly.changePercent && anomaly.changePercent > 0 ? (
                            <TrendingUp className="h-6 w-6 text-red-600" />
                          ) : (
                            <TrendingDown className="h-6 w-6 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold">{anomaly.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{anomaly.description}</p>
                          {anomaly.metric && (
                            <div className="flex items-center gap-4 mt-2">
                              <div className="text-sm">
                                <span className="text-muted-foreground">Métrica:</span> {anomaly.metric}
                              </div>
                              {anomaly.previousValue !== undefined && (
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Anterior:</span> ${anomaly.previousValue}
                                </div>
                              )}
                              {anomaly.currentValue !== undefined && (
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Actual:</span> ${anomaly.currentValue}
                                </div>
                              )}
                              {anomaly.changePercent !== undefined && (
                                <Badge variant={anomaly.changePercent > 0 ? "destructive" : "default"}>
                                  {anomaly.changePercent > 0 ? '+' : ''}{anomaly.changePercent}%
                                </Badge>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-3">
                            <Badge variant="outline">{anomaly.clientName}</Badge>
                            <Badge variant="outline">{anomaly.module}</Badge>
                            <Badge className={priorityConfig[anomaly.priority].color}>{priorityConfig[anomaly.priority].label}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalle
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleMarkInsightStatus(anomaly.id, 'revisado')}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Marcar Revisado
                        </Button>
                      </div>
                    </div>
                    {anomaly.recommendation && (
                      <div className="mt-3 p-3 rounded bg-white dark:bg-gray-900">
                        <div className="flex items-center gap-2 text-sm font-medium mb-1">
                          <Lightbulb className="h-4 w-4 text-yellow-500" />
                          Recomendación de IA:
                        </div>
                        <p className="text-sm">{anomaly.recommendation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recomendaciones Tab */}
        <TabsContent value="recomendaciones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Recomendaciones de Optimización
              </CardTitle>
              <CardDescription>Sugerencias generadas por IA para mejorar tus resultados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="p-4 rounded-lg border">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                        <Lightbulb className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{rec.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                        {rec.recommendation && (
                          <div className="mt-2 p-2 rounded bg-yellow-50 dark:bg-yellow-950/20">
                            <p className="text-sm">{rec.recommendation}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="outline">{rec.clientName}</Badge>
                          <Badge variant="outline">{rec.module}</Badge>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" onClick={() => handleMarkInsightStatus(rec.id, 'aplicado')}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Aplicar
                        </Button>
                        <Button variant="outline" size="sm">
                          <ListTodo className="mr-2 h-4 w-4" />
                          Crear Tarea
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generador Tab */}
        <TabsContent value="generador" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openGenerator('copy')}>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-2">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Generar Copy</CardTitle>
                <CardDescription>Crea textos persuasivos para anuncios</CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openGenerator('caption')}>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-pink-100 dark:bg-pink-900 flex items-center justify-center mb-2">
                  <MessageSquare className="h-6 w-6 text-pink-600" />
                </div>
                <CardTitle className="text-lg">Generar Caption</CardTitle>
                <CardDescription>Crea captions para redes sociales</CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openGenerator('hashtags')}>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-2">
                  <Hash className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Generar Hashtags</CardTitle>
                <CardDescription>Obtén hashtags relevantes</CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openGenerator('campaign_idea')}>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center mb-2">
                  <Sparkles className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">Idea de Campaña</CardTitle>
                <CardDescription>Genera conceptos creativos</CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openGenerator('executive_summary')}>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center mb-2">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Resumen Ejecutivo</CardTitle>
                <CardDescription>Genera resúmenes para reportes</CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openGenerator('next_steps')}>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mb-2">
                  <ListTodo className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle className="text-lg">Próximos Pasos</CardTitle>
                <CardDescription>Genera plan de acción</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Generator Dialog */}
          <Dialog open={showGeneratorDialog} onOpenChange={setShowGeneratorDialog}>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Generador de Contenido IA
                </DialogTitle>
                <DialogDescription>
                  {generatorType === 'copy' && 'Genera copys persuasivos para tus anuncios'}
                  {generatorType === 'caption' && 'Genera captions atractivos para redes sociales'}
                  {generatorType === 'hashtags' && 'Obtén hashtags relevantes para tu contenido'}
                  {generatorType === 'campaign_idea' && 'Genera ideas creativas para campañas'}
                  {generatorType === 'executive_summary' && 'Genera resúmenes ejecutivos para reportes'}
                  {generatorType === 'next_steps' && 'Genera plan de próximos pasos'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Cliente</Label>
                      <Select defaultValue="client-1">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client-1">Vertex Inmobiliaria</SelectItem>
                          <SelectItem value="client-2">TechStart</SelectItem>
                          <SelectItem value="client-3">FoodDelight</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Plataforma</Label>
                      <Select defaultValue="instagram">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="google">Google Ads</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Contexto / Instrucciones</Label>
                    <Textarea 
                      placeholder="Describe el producto, servicio o contexto para generar contenido relevante..."
                      value={generatorInput}
                      onChange={(e) => setGeneratorInput(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleGenerateContent} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generar con IA
                      </>
                    )}
                  </Button>
                  {generatedContent && (
                    <div className="mt-4">
                      <Label>Contenido Generado</Label>
                      <div className="mt-2 p-4 rounded-lg bg-muted/50 relative">
                        <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-2 right-2"
                          onClick={() => navigator.clipboard.writeText(generatedContent)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" onClick={handleGenerateContent}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Regenerar
                        </Button>
                        <Button onClick={() => navigator.clipboard.writeText(generatedContent)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copiar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Tareas Tab */}
        <TabsContent value="tareas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tareas Sugeridas por IA</CardTitle>
              <CardDescription>Tareas generadas automáticamente basadas en los insights detectados</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarea</TableHead>
                    <TableHead>Cliente / Marca</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Responsable Sugerido</TableHead>
                    <TableHead>Fecha Sugerida</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ListTodo className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{task.task}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{task.clientName}</div>
                          {task.brandName && <div className="text-sm text-muted-foreground">{task.brandName}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={priorityConfig[task.priority].color}>{priorityConfig[task.priority].label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-3 w-3" />
                          </div>
                          {task.suggestedResponsible}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {task.suggestedDate}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={task.status === 'pendiente' ? 'default' : task.status === 'asignada' ? 'secondary' : 'outline'}>
                          {task.status === 'pendiente' ? 'Pendiente' : task.status === 'asignada' ? 'Asignada' : 'Completada'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <User className="mr-2 h-3 w-3" />
                            Asignar
                          </Button>
                          <Button variant="ghost" size="sm">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* AI Notice */}
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Nota sobre seguridad de IA</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Las API keys de los proveedores de IA (ChatGPT, Gemini) deben configurarse desde el backend seguro. 
                    Esta interfaz está preparada para conectarse con tu servidor que maneja las credenciales de forma segura.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
