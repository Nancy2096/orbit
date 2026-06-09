"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Users,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Eye,
  MousePointer,
  UserPlus,
  Calendar,
  Filter,
  Download,
} from "lucide-react"
import { mockBrands, mockBuyerPersonas } from "@/lib/marketing-intelligence/brand-mock-data"
import { mockCampaignPerformance } from "@/lib/marketing-intelligence/brand-phase3-mock-data"
import { ChartCard, MIBarChart, MIDonutChart } from "@/components/marketing-intelligence/charts"

export default function BrandPerformancePage() {
  const params = useParams()
  const brandId = params.id as string
  const brand = mockBrands.find(b => b.id === brandId)
  const personas = mockBuyerPersonas.filter(p => p.brandId === brandId)
  const campaigns = mockCampaignPerformance.filter(c => c.brandId === brandId)
  
  const [selectedPersona, setSelectedPersona] = useState<string>("all")
  const [selectedChannel, setSelectedChannel] = useState<string>("all")
  const [period, setPeriod] = useState("month")
  
  if (!brand) {
    return <div className="p-8">Marca no encontrada</div>
  }

  // Calculate persona performance
  const personaPerformance = personas.map(persona => {
    const personaCampaigns = campaigns.filter(c => c.buyerPersonaId === persona.id)
    const totalInvestment = personaCampaigns.reduce((sum, c) => sum + c.investment, 0)
    const totalLeads = personaCampaigns.reduce((sum, c) => sum + c.leads, 0)
    const totalConversions = personaCampaigns.reduce((sum, c) => sum + c.conversions, 0)
    const avgCPL = totalLeads > 0 ? totalInvestment / totalLeads : 0
    const avgROAS = personaCampaigns.length > 0 
      ? personaCampaigns.reduce((sum, c) => sum + c.roas, 0) / personaCampaigns.length 
      : 0
    
    return {
      ...persona,
      investment: totalInvestment,
      leads: totalLeads,
      conversions: totalConversions,
      cpl: avgCPL,
      roas: avgROAS,
      campaigns: personaCampaigns.length
    }
  })

  // Calculate channel performance
  const channels = ['meta_ads', 'google_ads', 'tiktok_ads', 'instagram', 'facebook']
  const channelPerformance = channels.map(channel => {
    const channelCampaigns = campaigns.filter(c => c.channel === channel)
    const totalInvestment = channelCampaigns.reduce((sum, c) => sum + c.investment, 0)
    const totalLeads = channelCampaigns.reduce((sum, c) => sum + c.leads, 0)
    const totalImpressions = channelCampaigns.reduce((sum, c) => sum + c.impressions, 0)
    const totalClicks = channelCampaigns.reduce((sum, c) => sum + c.clicks, 0)
    const avgCPL = totalLeads > 0 ? totalInvestment / totalLeads : 0
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    const avgROAS = channelCampaigns.length > 0 
      ? channelCampaigns.reduce((sum, c) => sum + c.roas, 0) / channelCampaigns.length 
      : 0
    
    return {
      channel,
      name: channel === 'meta_ads' ? 'Meta Ads' : 
            channel === 'google_ads' ? 'Google Ads' :
            channel === 'tiktok_ads' ? 'TikTok Ads' :
            channel === 'instagram' ? 'Instagram' : 'Facebook',
      investment: totalInvestment,
      leads: totalLeads,
      impressions: totalImpressions,
      clicks: totalClicks,
      cpl: avgCPL,
      ctr: avgCTR,
      roas: avgROAS,
      campaigns: channelCampaigns.length
    }
  }).filter(c => c.campaigns > 0)

  // Funnel performance
  const funnelData = [
    { name: 'Awareness', value: campaigns.filter(c => c.funnelStage === 'awareness').length },
    { name: 'Consideration', value: campaigns.filter(c => c.funnelStage === 'consideration').length },
    { name: 'Conversion', value: campaigns.filter(c => c.funnelStage === 'conversion').length },
    { name: 'Retention', value: campaigns.filter(c => c.funnelStage === 'retention').length },
  ]

  const channelChartData = channelPerformance.map(c => ({
    name: c.name,
    value: c.investment
  }))

  return (
    <div className="flex-1 space-y-6 p-6">
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
              <BarChart3 className="h-6 w-6" />
              Performance por Segmento
            </h1>
            <p className="text-muted-foreground">{brand.name} - Análisis de rendimiento por persona y canal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="personas" className="space-y-6">
        <TabsList>
          <TabsTrigger value="personas">Por Buyer Persona</TabsTrigger>
          <TabsTrigger value="channels">Por Canal</TabsTrigger>
          <TabsTrigger value="funnel">Por Etapa del Funnel</TabsTrigger>
        </TabsList>

        {/* By Persona */}
        <TabsContent value="personas" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {personaPerformance.map((persona) => (
              <Card key={persona.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{persona.name}</CardTitle>
                        <CardDescription>{persona.age || persona.ageRange || 'N/A'} años - {persona.location}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">{persona.campaigns} campañas</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">${(persona.investment / 1000).toFixed(0)}k</p>
                      <p className="text-xs text-muted-foreground">Inversión</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{persona.leads}</p>
                      <p className="text-xs text-muted-foreground">Leads</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">${persona.cpl.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">CPL</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{persona.roas.toFixed(1)}x</p>
                      <p className="text-xs text-muted-foreground">ROAS</p>
                    </div>
                  </div>
                  
                  {/* Efficiency Bar */}
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Eficiencia vs objetivo</span>
                      <span className="font-medium">{Math.min(100, (persona.roas / 3) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={Math.min(100, (persona.roas / 3) * 100)} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* By Channel */}
        <TabsContent value="channels" className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Inversión por Canal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {channelPerformance.map((channel, index) => {
                    const maxInvestment = Math.max(...channelPerformance.map(c => c.investment))
                    const percentage = (channel.investment / maxInvestment) * 100
                    return (
                      <div key={channel.channel} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{channel.name}</span>
                          <span className="text-sm text-muted-foreground">
                            ${(channel.investment / 1000).toFixed(0)}k
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Progress value={percentage} className="h-3 flex-1" />
                          <div className="flex items-center gap-2 text-sm w-32">
                            <span className="text-muted-foreground">ROAS:</span>
                            <span className={channel.roas >= 3 ? "text-green-600 font-medium" : channel.roas >= 2 ? "text-amber-600 font-medium" : "text-red-600 font-medium"}>
                              {channel.roas.toFixed(1)}x
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución</CardTitle>
              </CardHeader>
              <CardContent>
                <MIDonutChart data={channelChartData} height={200} />
              </CardContent>
            </Card>
          </div>

          {/* Channel Metrics Table */}
          <Card>
            <CardHeader>
              <CardTitle>Métricas por Canal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Canal</th>
                      <th className="text-right p-3">Campañas</th>
                      <th className="text-right p-3">Inversión</th>
                      <th className="text-right p-3">Impresiones</th>
                      <th className="text-right p-3">Clicks</th>
                      <th className="text-right p-3">CTR</th>
                      <th className="text-right p-3">Leads</th>
                      <th className="text-right p-3">CPL</th>
                      <th className="text-right p-3">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelPerformance.map((channel) => (
                      <tr key={channel.channel} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium">{channel.name}</td>
                        <td className="text-right p-3">{channel.campaigns}</td>
                        <td className="text-right p-3">${channel.investment.toLocaleString()}</td>
                        <td className="text-right p-3">{channel.impressions.toLocaleString()}</td>
                        <td className="text-right p-3">{channel.clicks.toLocaleString()}</td>
                        <td className="text-right p-3">{channel.ctr.toFixed(2)}%</td>
                        <td className="text-right p-3">{channel.leads}</td>
                        <td className="text-right p-3">${channel.cpl.toFixed(2)}</td>
                        <td className="text-right p-3">
                          <Badge variant={channel.roas >= 3 ? "default" : channel.roas >= 2 ? "secondary" : "destructive"}>
                            {channel.roas.toFixed(1)}x
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Funnel Stage */}
        <TabsContent value="funnel" className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {funnelData.map((stage, index) => (
              <Card key={stage.name} className={index === 0 ? 'border-blue-200 bg-blue-50/50' : 
                index === 1 ? 'border-purple-200 bg-purple-50/50' :
                index === 2 ? 'border-green-200 bg-green-50/50' : 'border-amber-200 bg-amber-50/50'}>
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-lg mb-2">{stage.name}</h3>
                  <p className="text-4xl font-bold">{stage.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">campañas</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Flujo del Funnel</CardTitle>
              <CardDescription>Visualización del recorrido del cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-8">
                {funnelData.map((stage, index) => (
                  <div key={stage.name} className="flex items-center">
                    <div className="text-center">
                      <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-xl font-bold ${
                        index === 0 ? 'bg-blue-500' :
                        index === 1 ? 'bg-purple-500' :
                        index === 2 ? 'bg-green-500' : 'bg-amber-500'
                      }`}>
                        {stage.value}
                      </div>
                      <p className="mt-2 font-medium">{stage.name}</p>
                    </div>
                    {index < funnelData.length - 1 && (
                      <div className="w-16 h-1 bg-muted mx-2" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
