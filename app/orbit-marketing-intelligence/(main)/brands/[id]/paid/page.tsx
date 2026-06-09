"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Download,
  Sparkles,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  MousePointer,
  Eye,
  Target,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
} from "lucide-react"
import { Facebook, Chrome, Smartphone, Linkedin } from "lucide-react"
import { mockBrands, mockBuyerPersonas } from "@/lib/marketing-intelligence/brand-mock-data"
import { mockPaidCampaigns } from "@/lib/marketing-intelligence/brand-phase2-mock-data"
import { PaidCampaign, CampaignObjective, AdPlatform, FunnelStage } from "@/lib/marketing-intelligence/brand-phase2-types"
import { CampaignTree } from "@/components/marketing-intelligence/brands"
import { formatCurrency, formatNumber } from "@/lib/marketing-intelligence/calculations"

// Platform icons
const platformIcons: Record<string, React.ReactNode> = {
  meta: <Facebook className="h-4 w-4 text-blue-600" />,
  google: <Chrome className="h-4 w-4 text-red-500" />,
  tiktok: <Smartphone className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4 text-blue-700" />,
}

const platformLabels: Record<string, string> = {
  meta: 'Meta Ads',
  google: 'Google Ads',
  tiktok: 'TikTok Ads',
  linkedin: 'LinkedIn Ads',
}

const objectiveLabels: Record<CampaignObjective, string> = {
  awareness: 'Awareness',
  reach: 'Alcance',
  traffic: 'Tráfico',
  engagement: 'Engagement',
  leads: 'Leads',
  conversions: 'Conversiones',
  sales: 'Ventas',
  app_installs: 'Instalaciones',
  video_views: 'Video Views',
  messages: 'Mensajes',
}

export default function BrandPaidPage() {
  const params = useParams()
  const brandId = params.id as string

  const brand = mockBrands.find(b => b.id === brandId)
  const personas = mockBuyerPersonas.filter(p => p.brandId === brandId || p.brandId === 'brand-1')
  
  const [campaigns, setCampaigns] = useState<PaidCampaign[]>(
    mockPaidCampaigns.filter(c => c.brandId === brandId || c.brandId === 'brand-1')
  )
  const [filterPlatform, setFilterPlatform] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    platform: "meta" as AdPlatform,
    objective: "leads" as CampaignObjective,
    budget: "",
    funnelStage: "conversion" as FunnelStage,
  })

  if (!brand) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Marca no encontrada</p>
      </div>
    )
  }

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesPlatform = filterPlatform === "all" || campaign.platform === filterPlatform
    const matchesStatus = filterStatus === "all" || campaign.status === filterStatus
    return matchesPlatform && matchesStatus
  })

  // Aggregate stats
  const stats = campaigns.reduce((acc, campaign) => {
    if (campaign.metrics) {
      acc.totalBudget += campaign.budget
      acc.totalSpent += campaign.metrics.spend
      acc.totalLeads += campaign.metrics.leads
      acc.totalConversions += campaign.metrics.conversions
      acc.totalReach += campaign.metrics.reach
      acc.totalClicks += campaign.metrics.clicks
    }
    return acc
  }, {
    totalBudget: 0,
    totalSpent: 0,
    totalLeads: 0,
    totalConversions: 0,
    totalReach: 0,
    totalClicks: 0,
  })

  const avgCPL = stats.totalLeads > 0 ? stats.totalSpent / stats.totalLeads : 0
  const avgCTR = stats.totalReach > 0 ? (stats.totalClicks / stats.totalReach) * 100 : 0

  const handleCreateCampaign = () => {
    if (!newCampaign.name || !newCampaign.budget) {
      toast.error("Nombre y presupuesto son requeridos")
      return
    }

    const campaign: PaidCampaign = {
      id: `campaign-${Date.now()}`,
      brandId,
      name: newCampaign.name,
      platform: newCampaign.platform,
      objective: newCampaign.objective,
      status: 'draft',
      budget: parseFloat(newCampaign.budget),
      budgetType: 'lifetime',
      startDate: new Date().toISOString().split('T')[0],
      funnelStage: newCampaign.funnelStage,
      adSets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setCampaigns(prev => [campaign, ...prev])
    setCreateDialogOpen(false)
    setNewCampaign({
      name: "",
      platform: "meta",
      objective: "leads",
      budget: "",
      funnelStage: "conversion",
    })
    toast.success("Campaña creada exitosamente")
  }

  // Platform distribution
  const platformDistribution = campaigns.reduce((acc, campaign) => {
    if (!acc[campaign.platform]) {
      acc[campaign.platform] = { budget: 0, spent: 0, count: 0 }
    }
    acc[campaign.platform].budget += campaign.budget
    acc[campaign.platform].spent += campaign.metrics?.spend || 0
    acc[campaign.platform].count++
    return acc
  }, {} as Record<string, { budget: number; spent: number; count: number }>)

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
            <h1 className="text-2xl font-bold">Pauta y Campañas Pagadas</h1>
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
            Generar Segmentación
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Campaña
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nueva Campaña</DialogTitle>
                <DialogDescription>
                  Configura los detalles básicos de tu campaña publicitaria
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Nombre de la Campaña *</Label>
                  <Input
                    placeholder="Ej: Generación de Leads - Marzo"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Plataforma</Label>
                    <Select
                      value={newCampaign.platform}
                      onValueChange={(v) => setNewCampaign(prev => ({ ...prev, platform: v as AdPlatform }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meta">Meta Ads</SelectItem>
                        <SelectItem value="google">Google Ads</SelectItem>
                        <SelectItem value="tiktok">TikTok Ads</SelectItem>
                        <SelectItem value="linkedin">LinkedIn Ads</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Objetivo</Label>
                    <Select
                      value={newCampaign.objective}
                      onValueChange={(v) => setNewCampaign(prev => ({ ...prev, objective: v as CampaignObjective }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="awareness">Awareness</SelectItem>
                        <SelectItem value="reach">Alcance</SelectItem>
                        <SelectItem value="traffic">Tráfico</SelectItem>
                        <SelectItem value="leads">Leads</SelectItem>
                        <SelectItem value="conversions">Conversiones</SelectItem>
                        <SelectItem value="sales">Ventas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Presupuesto Total (MXN) *</Label>
                    <Input
                      type="number"
                      placeholder="100000"
                      value={newCampaign.budget}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, budget: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Etapa del Funnel</Label>
                    <Select
                      value={newCampaign.funnelStage}
                      onValueChange={(v) => setNewCampaign(prev => ({ ...prev, funnelStage: v as FunnelStage }))}
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
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateCampaign}>Crear Campaña</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Presupuesto Total</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalBudget)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Gastado</span>
                <span>{Math.round((stats.totalSpent / stats.totalBudget) * 100)}%</span>
              </div>
              <Progress value={(stats.totalSpent / stats.totalBudget) * 100} className="h-1.5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Leads Generados</p>
                <p className="text-2xl font-bold">{formatNumber(stats.totalLeads)}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              CPL Promedio: <span className="font-medium text-foreground">{formatCurrency(avgCPL)}</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alcance Total</p>
                <p className="text-2xl font-bold">{formatNumber(stats.totalReach)}</p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              CTR Promedio: <span className="font-medium text-foreground">{avgCTR.toFixed(2)}%</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversiones</p>
                <p className="text-2xl font-bold">{formatNumber(stats.totalConversions)}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              CPA: <span className="font-medium text-foreground">
                {stats.totalConversions > 0 ? formatCurrency(stats.totalSpent / stats.totalConversions) : '-'}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Distribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Distribución por Plataforma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {Object.entries(platformDistribution).map(([platform, data]) => (
              <div key={platform} className="flex items-center gap-3 p-3 rounded-lg border">
                {platformIcons[platform]}
                <div className="flex-1">
                  <p className="font-medium text-sm">{platformLabels[platform]}</p>
                  <p className="text-xs text-muted-foreground">{data.count} campañas</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{formatCurrency(data.spent)}</p>
                  <p className="text-xs text-muted-foreground">de {formatCurrency(data.budget)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={filterPlatform} onValueChange={setFilterPlatform}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Plataforma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las plataformas</SelectItem>
            <SelectItem value="meta">Meta Ads</SelectItem>
            <SelectItem value="google">Google Ads</SelectItem>
            <SelectItem value="tiktok">TikTok Ads</SelectItem>
            <SelectItem value="linkedin">LinkedIn Ads</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="draft">Borrador</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="paused">Pausadas</SelectItem>
            <SelectItem value="completed">Completadas</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="ml-auto">
          {filteredCampaigns.length} campañas
        </Badge>
      </div>

      {/* Campaign Tree */}
      <CampaignTree campaigns={filteredCampaigns} />

      {/* KPI Targets Alert */}
      {campaigns.some(c => c.metrics && c.targetKPIs?.cpl && c.metrics.cpl > c.targetKPIs.cpl.max) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Alerta de KPIs</p>
                <p className="text-sm text-amber-700 mt-1">
                  Algunas campañas tienen CPL por encima del máximo establecido. Revisa las segmentaciones y creativos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
