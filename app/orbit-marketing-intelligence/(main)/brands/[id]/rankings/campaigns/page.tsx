"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Trophy,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Download,
  Play,
  Pause,
  CheckCircle,
  DollarSign,
  Users,
  MousePointer,
  Target,
  Medal,
} from "lucide-react"
import { KPISemaphore, TrendIndicator } from "@/components/marketing-intelligence/brands"
import { getBrandCampaigns } from "@/lib/marketing-intelligence/brand-phase3-mock-data"
import { mockBrands } from "@/lib/marketing-intelligence/brand-mock-data"
import type { CampaignPerformance } from "@/lib/marketing-intelligence/brand-types"

const statusLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: "Activa", color: "text-green-600 bg-green-100", icon: <Play className="h-3 w-3" /> },
  paused: { label: "Pausada", color: "text-amber-600 bg-amber-100", icon: <Pause className="h-3 w-3" /> },
  completed: { label: "Completada", color: "text-blue-600 bg-blue-100", icon: <CheckCircle className="h-3 w-3" /> },
  draft: { label: "Borrador", color: "text-gray-600 bg-gray-100", icon: null },
}

const channelLabels: Record<string, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  tiktok_ads: "TikTok Ads",
  linkedin_ads: "LinkedIn Ads",
}

export default function CampaignRankingsPage() {
  const params = useParams()
  const brandId = params.id as string
  
  const [searchQuery, setSearchQuery] = useState("")
  const [channelFilter, setChannelFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("leads")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  
  const brand = mockBrands.find(b => b.id === brandId)
  const campaigns = getBrandCampaigns(brandId)
  
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

  // Filter and sort campaigns
  const filteredCampaigns = campaigns
    .filter(c => {
      const matchesSearch = c.campaignName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesChannel = channelFilter === "all" || c.channel === channelFilter
      const matchesStatus = statusFilter === "all" || c.status === statusFilter
      return matchesSearch && matchesChannel && matchesStatus
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof CampaignPerformance] as number
      const bValue = b[sortBy as keyof CampaignPerformance] as number
      return sortOrder === "desc" ? bValue - aValue : aValue - bValue
    })

  // Get KPI status based on target comparison
  const getKPIStatus = (value: number, target: number, inverted: boolean = false) => {
    const ratio = value / target
    if (inverted) {
      if (ratio <= 0.8) return "excellent"
      if (ratio <= 1) return "good"
      if (ratio <= 1.2) return "warning"
      return "critical"
    }
    if (ratio >= 1.2) return "excellent"
    if (ratio >= 1) return "good"
    if (ratio >= 0.8) return "warning"
    return "critical"
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  // Summary stats
  const totalInvestment = filteredCampaigns.reduce((sum, c) => sum + c.investment, 0)
  const totalLeads = filteredCampaigns.reduce((sum, c) => sum + c.leads, 0)
  const avgCPL = totalLeads > 0 ? totalInvestment / totalLeads : 0
  const topCampaign = filteredCampaigns[0]

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
              <Trophy className="h-6 w-6 text-amber-500" />
              Ranking de Campañas
            </h1>
            <p className="text-muted-foreground">{brand.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/orbit-marketing-intelligence/brands/${brandId}/rankings/organic`}>
              Ver Orgánico
            </Link>
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inversión Total</p>
                <p className="text-xl font-bold">{formatCurrency(totalInvestment)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Leads Totales</p>
                <p className="text-xl font-bold">{totalLeads.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CPL Promedio</p>
                <p className="text-xl font-bold">${avgCPL.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-200">
                <Medal className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <p className="text-sm text-amber-700">Top Campaña</p>
                <p className="text-lg font-bold text-amber-900 truncate max-w-[150px]">
                  {topCampaign?.campaignName || "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar campaña..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los canales</SelectItem>
                  <SelectItem value="meta_ads">Meta Ads</SelectItem>
                  <SelectItem value="google_ads">Google Ads</SelectItem>
                  <SelectItem value="tiktok_ads">TikTok Ads</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activas</SelectItem>
                  <SelectItem value="paused">Pausadas</SelectItem>
                  <SelectItem value="completed">Completadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Ordenar por:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leads">Leads</SelectItem>
                  <SelectItem value="roas">ROAS</SelectItem>
                  <SelectItem value="cpl">CPL</SelectItem>
                  <SelectItem value="investment">Inversión</SelectItem>
                  <SelectItem value="sales">Ventas</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
              >
                {sortOrder === "desc" ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rankings Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Campaña</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Inversión</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">CPL</TableHead>
                <TableHead className="text-right">ROAS</TableHead>
                <TableHead className="text-right">Ventas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign, index) => {
                const status = statusLabels[campaign.status]
                const cplStatus = getKPIStatus(campaign.cpl, 100, true)
                const roasStatus = getKPIStatus(campaign.roas, 400)
                
                return (
                  <TableRow key={campaign.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? "bg-amber-100 text-amber-700" :
                        index === 1 ? "bg-gray-200 text-gray-700" :
                        index === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{campaign.campaignName}</p>
                        <p className="text-xs text-muted-foreground">{campaign.period}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {channelLabels[campaign.channel] || campaign.channel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={status.color}>
                        {status.icon}
                        <span className="ml-1">{status.label}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(campaign.investment)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold">{campaign.leads.toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span>${campaign.cpl.toFixed(2)}</span>
                        <KPISemaphore status={cplStatus} size="sm" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span>{campaign.roas.toFixed(0)}%</span>
                        <KPISemaphore status={roasStatus} size="sm" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {campaign.sales}
                    </TableCell>
                  </TableRow>
                )
              })}
              
              {filteredCampaigns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No se encontraron campañas con los filtros aplicados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
