"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  ArrowLeft,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Zap,
  BarChart3,
  Search,
  Filter,
  RefreshCw,
  Check,
  Clock,
  Target,
} from "lucide-react"
import { InsightCard } from "@/components/marketing-intelligence/brands"
import { getBrandInsights } from "@/lib/marketing-intelligence/brand-phase3-mock-data"
import { mockBrands } from "@/lib/marketing-intelligence/brand-mock-data"
import type { AIInsight, InsightType, InsightImpact } from "@/lib/marketing-intelligence/brand-types"

const insightTypeLabels: Record<InsightType, { label: string; icon: React.ReactNode }> = {
  trend: { label: "Tendencia", icon: <TrendingUp className="h-4 w-4" /> },
  opportunity: { label: "Oportunidad", icon: <Sparkles className="h-4 w-4" /> },
  warning: { label: "Advertencia", icon: <AlertTriangle className="h-4 w-4" /> },
  recommendation: { label: "Recomendación", icon: <Lightbulb className="h-4 w-4" /> },
  anomaly: { label: "Anomalía", icon: <Zap className="h-4 w-4" /> },
  pattern: { label: "Patrón", icon: <BarChart3 className="h-4 w-4" /> },
}

export default function BrandInsightsPage() {
  const params = useParams()
  const brandId = params.id as string
  
  const [insights, setInsights] = useState<AIInsight[]>(() => getBrandInsights(brandId))
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [impactFilter, setImpactFilter] = useState<InsightImpact | "all">("all")
  const [isGenerating, setIsGenerating] = useState(false)
  
  const brand = mockBrands.find(b => b.id === brandId)
  
  if (!brand) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Marca no encontrada</p>
        <Button variant="link" asChild>
          <Link href="/orbit-marketing-intelligence/brands">Volver a marcas</Link>
        </Button>
      </div>
    )
  }

  const handleAcknowledge = (id: string) => {
    setInsights(prev => prev.map(i => 
      i.id === id ? { ...i, acknowledged: true } : i
    ))
    toast.success("Insight marcado como visto")
  }

  const handleGenerateInsights = () => {
    setIsGenerating(true)
    setTimeout(() => {
      const newInsight: AIInsight = {
        id: `ins_${Date.now()}`,
        brandId,
        type: "recommendation",
        title: "Nueva oportunidad detectada en Stories",
        finding: "El formato Stories tiene 40% menos saturación que Reels pero igual alcance en tu audiencia.",
        evidence: "Análisis comparativo de 15 Stories vs 15 Reels en los últimos 30 días.",
        metric: "reach_per_content",
        metricValue: 28000,
        impact: "medium",
        recommendation: "Incrementar frecuencia de Stories a 3 por día para maximizar alcance con menor esfuerzo.",
        priority: 3,
        action: "Actualizar calendario de contenido",
        dataSource: "Instagram Insights",
        gemAgent: "content-optimizer",
        createdAt: new Date().toISOString(),
        acknowledged: false,
      }
      setInsights(prev => [newInsight, ...prev])
      setIsGenerating(false)
      toast.success("Nuevos insights generados")
    }, 2500)
  }

  // Filter insights
  const filteredInsights = insights.filter(i => {
    const matchesSearch = i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.finding.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === "all" || i.type === activeTab
    const matchesImpact = impactFilter === "all" || i.impact === impactFilter
    return matchesSearch && matchesTab && matchesImpact
  })

  // Stats
  const unacknowledged = insights.filter(i => !i.acknowledged)
  const highImpact = unacknowledged.filter(i => i.impact === "high")
  const opportunities = insights.filter(i => i.type === "opportunity")
  const warnings = insights.filter(i => i.type === "warning" || i.type === "anomaly")

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/orbit-marketing-intelligence/brands/${brandId}/analytics`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-500" />
              Insights de IA
            </h1>
            <p className="text-muted-foreground">{brand.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/orbit-marketing-intelligence/brands/${brandId}/alerts`}>
              Ver Alertas
            </Link>
          </Button>
          <Button onClick={handleGenerateInsights} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generar Insights
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unacknowledged.length}</p>
                <p className="text-sm text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <Target className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{highImpact.length}</p>
                <p className="text-sm text-muted-foreground">Alto Impacto</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Lightbulb className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{opportunities.length}</p>
                <p className="text-sm text-muted-foreground">Oportunidades</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{warnings.length}</p>
                <p className="text-sm text-muted-foreground">Alertas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              Todos ({insights.length})
            </TabsTrigger>
            <TabsTrigger value="opportunity">
              Oportunidades
            </TabsTrigger>
            <TabsTrigger value="warning">
              Advertencias
            </TabsTrigger>
            <TabsTrigger value="trend">
              Tendencias
            </TabsTrigger>
            <TabsTrigger value="recommendation">
              Recomendaciones
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar insights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              variant={impactFilter === "all" ? "secondary" : "ghost"} 
              size="sm"
              onClick={() => setImpactFilter("all")}
            >
              Todos
            </Button>
            <Button 
              variant={impactFilter === "high" ? "secondary" : "ghost"} 
              size="sm"
              onClick={() => setImpactFilter("high")}
            >
              Alto
            </Button>
            <Button 
              variant={impactFilter === "medium" ? "secondary" : "ghost"} 
              size="sm"
              onClick={() => setImpactFilter("medium")}
            >
              Medio
            </Button>
            <Button 
              variant={impactFilter === "low" ? "secondary" : "ghost"} 
              size="sm"
              onClick={() => setImpactFilter("low")}
            >
              Bajo
            </Button>
          </div>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {filteredInsights.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No hay insights disponibles</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery 
                  ? "No se encontraron insights con tu búsqueda"
                  : "Genera nuevos insights para obtener recomendaciones"
                }
              </p>
              <Button onClick={handleGenerateInsights} disabled={isGenerating}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generar Insights
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredInsights.map(insight => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onAcknowledge={handleAcknowledge}
            />
          ))
        )}
      </div>
    </div>
  )
}
