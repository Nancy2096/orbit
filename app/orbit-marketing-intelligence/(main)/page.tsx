"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { KpiCard, KpiGrid } from "@/components/marketing-intelligence/kpi-card"
import { ChartCard, MILineChart, MIBarChart, MIPieChart, MIDonutChart } from "@/components/marketing-intelligence/charts"
import { 
  Users, 
  Building2, 
  Megaphone, 
  Plug, 
  DollarSign, 
  Target, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MousePointerClick,
  Percent,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Filter,
} from "lucide-react"
import { formatCurrency, formatNumber } from "@/lib/marketing-intelligence/calculations"
import { 
  mockMIGlobalMetrics, 
  mockMIMonthlyData, 
  mockMIPlatformData,
  mockMIFunnelData,
  mockMITopClients,
  mockMIBottomClients,
  mockMICampaigns,
  mockMIConnectors,
  mockMIClients,
  mockMIBrands
} from "@/lib/marketing-intelligence/mock-data"
import { useOMIFilters } from "@/contexts/omi-filters-context"

export default function MIDashboardPage() {
  const { 
    selectedClient, 
    selectedBrand, 
    selectedPeriod, 
    getClientName, 
    getBrandName,
    getPeriodLabel 
  } = useOMIFilters()

  // Filter metrics based on selected client/brand
  const filteredData = useMemo(() => {
    // In a real app, this would filter actual data from the API
    // For demo, we'll show modified metrics based on selection
    let multiplier = 1
    
    if (selectedClient !== "all") {
      // When a specific client is selected, show proportional data
      const clientIndex = mockMIClients.findIndex(c => c.id === selectedClient)
      multiplier = clientIndex >= 0 ? 0.15 + (clientIndex * 0.1) : 0.25
    }
    
    if (selectedBrand !== "all") {
      // Further reduce for specific brand
      multiplier *= 0.4
    }

    return {
      metrics: {
        ...mockMIGlobalMetrics,
        totalInvestment: mockMIGlobalMetrics.totalInvestment * multiplier,
        totalLeads: Math.round(mockMIGlobalMetrics.totalLeads * multiplier),
        avgCPL: mockMIGlobalMetrics.avgCPL * (1 + (Math.random() * 0.2 - 0.1)),
        totalClients: selectedClient === "all" ? mockMIGlobalMetrics.totalClients : 1,
        totalBrands: selectedBrand === "all" 
          ? (selectedClient === "all" ? mockMIGlobalMetrics.totalBrands : Math.ceil(mockMIGlobalMetrics.totalBrands * 0.3))
          : 1,
      },
      monthlyData: mockMIMonthlyData.map(d => ({
        ...d,
        investment: d.investment * multiplier,
        leads: Math.round(d.leads * multiplier),
      })),
      campaigns: selectedClient === "all" 
        ? mockMICampaigns 
        : mockMICampaigns.filter((_, i) => i % 3 === 0),
    }
  }, [selectedClient, selectedBrand])

  const metrics = filteredData.metrics

  const connectorStatusData = [
    { name: 'Conectados', value: mockMIConnectors.filter(c => c.status === 'connected').length, color: '#10b981' },
    { name: 'Desconectados', value: mockMIConnectors.filter(c => c.status === 'disconnected').length, color: '#6b7280' },
    { name: 'Token Expirado', value: mockMIConnectors.filter(c => c.status === 'token_expired').length, color: '#f59e0b' },
    { name: 'Error', value: mockMIConnectors.filter(c => c.status === 'error').length, color: '#ef4444' },
  ]

  const investmentChartData = filteredData.monthlyData.map(d => ({
    name: d.month,
    Inversión: d.investment / 1000000
  }))

  const leadsChartData = filteredData.monthlyData.map(d => ({
    name: d.month,
    Leads: d.leads
  }))

  const cplChartData = filteredData.monthlyData.map(d => ({
    name: d.month,
    CPL: d.cpl
  }))

  const roasChartData = filteredData.monthlyData.map(d => ({
    name: d.month,
    ROAS: d.roas
  }))

  const platformInvestmentData = mockMIPlatformData.map(p => ({
    name: p.platform.replace(' Ads', ''),
    Inversión: p.investment / 1000000
  }))

  const platformLeadsData = mockMIPlatformData.map(p => ({
    name: p.platform.replace(' Ads', ''),
    Leads: p.leads
  }))

  const funnelData = mockMIFunnelData.map(f => ({
    name: f.stage,
    value: f.campaigns,
    color: f.stage === 'Awareness' ? '#8b5cf6' : 
           f.stage === 'Engagement' ? '#3b82f6' : 
           f.stage === 'Leads' ? '#10b981' : 
           f.stage === 'Conversiones' ? '#f59e0b' : '#ef4444'
  }))

  // Campaigns with issues
  const campaignsWithIssues = mockMICampaigns.filter(c => 
    c.alerts.length > 0 || c.cpl > 1500 || c.ctr < 1.0
  )

  // Top performing campaigns
  const topCampaigns = [...mockMICampaigns]
    .filter(c => c.status === 'activo')
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 5)

  // Connectors with errors
  const connectorsWithErrors = mockMIConnectors.filter(c => 
    c.status === 'error' || c.status === 'token_expired'
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard General de Agencia</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">Vista consolidada de todas las métricas de marketing</p>
            {(selectedClient !== "all" || selectedBrand !== "all") && (
              <div className="flex items-center gap-1.5 ml-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filtrado por:</span>
                {selectedClient !== "all" && (
                  <Badge variant="secondary" className="text-xs">{getClientName(selectedClient)}</Badge>
                )}
                {selectedBrand !== "all" && (
                  <Badge variant="secondary" className="text-xs">{getBrandName(selectedBrand)}</Badge>
                )}
                <Badge variant="outline" className="text-xs">{getPeriodLabel()}</Badge>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Datos actualizados hace 5 min
          </Badge>
          <Button variant="outline" size="sm">Exportar</Button>
        </div>
      </div>

      {/* Main KPIs */}
      <KpiGrid columns={5}>
        <KpiCard
          title="Clientes Activos"
          value={String(metrics.totalClients)}
          change={12}
          changeLabel="vs mes anterior"
          icon={Building2}
          iconColor="text-violet-600"
        />
        <KpiCard
          title="Marcas Activas"
          value={String(metrics.totalBrands)}
          change={8}
          changeLabel="vs mes anterior"
          icon={Users}
          iconColor="text-blue-600"
        />
        <KpiCard
          title="Campañas Activas"
          value="53"
          change={5}
          changeLabel="vs mes anterior"
          icon={Megaphone}
          iconColor="text-green-600"
        />
        <KpiCard
          title="Plataformas Conectadas"
          value={metrics.connectedAccounts.toString()}
          icon={Plug}
          iconColor="text-amber-600"
          status={metrics.errorAccounts > 0 ? 'warning' : 'good'}
        />
        <KpiCard
          title="Alertas Críticas"
          value={metrics.criticalAlerts.toString()}
          icon={AlertTriangle}
          iconColor="text-red-600"
          status={metrics.criticalAlerts > 0 ? 'critical' : 'good'}
        />
      </KpiGrid>

      {/* Financial KPIs */}
      <KpiGrid columns={5}>
        <KpiCard
          title="Inversión Total"
          value={formatCurrency(metrics.totalInvestment)}
          change={8.5}
          changeLabel="vs mes anterior"
          icon={DollarSign}
          iconColor="text-emerald-600"
        />
        <KpiCard
          title="Leads Generados"
          value={formatNumber(metrics.totalLeads)}
          change={12.3}
          changeLabel="vs mes anterior"
          icon={Target}
          iconColor="text-blue-600"
        />
        <KpiCard
          title="CPL Promedio"
          value={formatCurrency(metrics.avgCPL)}
          change={-5.2}
          changeLabel="vs mes anterior"
          icon={Wallet}
          iconColor="text-purple-600"
          status={metrics.avgCPL < 1500 ? 'good' : 'warning'}
        />
        <KpiCard
          title="Conversiones"
          value={formatNumber(metrics.totalConversions)}
          change={15.8}
          changeLabel="vs mes anterior"
          icon={CheckCircle}
          iconColor="text-green-600"
        />
        <KpiCard
          title="ROAS Promedio"
          value={`${metrics.avgROAS}x`}
          change={4.2}
          changeLabel="vs mes anterior"
          icon={TrendingUp}
          iconColor="text-indigo-600"
          status={metrics.avgROAS >= 3 ? 'good' : metrics.avgROAS >= 2 ? 'warning' : 'critical'}
        />
      </KpiGrid>

      {/* Secondary KPIs */}
      <KpiGrid columns={6}>
        <KpiCard
          title="CTR Promedio"
          value={`${metrics.avgCTR}%`}
          change={3.1}
          icon={MousePointerClick}
          size="sm"
        />
        <KpiCard
          title="CPC Promedio"
          value={formatCurrency(metrics.avgCPC)}
          change={-2.4}
          icon={DollarSign}
          size="sm"
        />
        <KpiCard
          title="CPM Promedio"
          value={formatCurrency(metrics.avgCPM)}
          change={1.8}
          icon={Eye}
          size="sm"
        />
        <KpiCard
          title="CPA Promedio"
          value={formatCurrency(metrics.avgCPA)}
          change={-8.5}
          icon={Target}
          size="sm"
        />
        <KpiCard
          title="Alcance Total"
          value={formatNumber(metrics.totalReach)}
          change={18.2}
          icon={Users}
          size="sm"
        />
        <KpiCard
          title="Impresiones Totales"
          value={formatNumber(metrics.totalImpressions)}
          change={22.4}
          icon={Eye}
          size="sm"
        />
      </KpiGrid>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Inversión por Mes" description="Evolución mensual de la inversión publicitaria (millones MXN)">
          <MILineChart
            data={investmentChartData}
            dataKeys={[{ key: 'Inversión', color: '#8b5cf6', name: 'Inversión (M)' }]}
            height={280}
            valueFormatter={(v) => `$${v.toFixed(1)}M`}
          />
        </ChartCard>
        <ChartCard title="Leads por Mes" description="Evolución mensual de leads generados">
          <MILineChart
            data={leadsChartData}
            dataKeys={[{ key: 'Leads', color: '#10b981' }]}
            height={280}
          />
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="CPL por Mes" description="Evolución del costo por lead (MXN)">
          <MILineChart
            data={cplChartData}
            dataKeys={[{ key: 'CPL', color: '#f59e0b' }]}
            height={280}
            valueFormatter={(v) => `$${v.toLocaleString()}`}
          />
        </ChartCard>
        <ChartCard title="ROAS por Mes" description="Retorno sobre inversión publicitaria">
          <MILineChart
            data={roasChartData}
            dataKeys={[{ key: 'ROAS', color: '#3b82f6' }]}
            height={280}
            valueFormatter={(v) => `${v}x`}
          />
        </ChartCard>
      </div>

      {/* Charts Row 3 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Inversión por Plataforma" description="Distribución de inversión (millones MXN)">
          <MIBarChart
            data={platformInvestmentData}
            dataKeys={[{ key: 'Inversión', color: '#8b5cf6' }]}
            height={250}
            valueFormatter={(v) => `$${v.toFixed(1)}M`}
          />
        </ChartCard>
        <ChartCard title="Leads por Plataforma" description="Distribución de leads generados">
          <MIBarChart
            data={platformLeadsData}
            dataKeys={[{ key: 'Leads', color: '#10b981' }]}
            height={250}
          />
        </ChartCard>
        <ChartCard title="Campañas por Etapa del Funnel" description="Distribución de campañas activas">
          <MIDonutChart
            data={funnelData}
            height={250}
          />
        </ChartCard>
      </div>

      {/* Connector Status */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Estado de Conectores" description="Resumen de conexiones activas">
          <MIPieChart
            data={connectorStatusData}
            height={200}
          />
        </ChartCard>

        {/* Quick Alerts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Alertas y Cuentas con Error</CardTitle>
            <CardDescription>Conexiones que requieren atención inmediata</CardDescription>
          </CardHeader>
          <CardContent>
            {connectorsWithErrors.length > 0 ? (
              <div className="space-y-3">
                {connectorsWithErrors.map(connector => (
                  <div 
                    key={connector.id} 
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {connector.status === 'error' ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-500" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{connector.platform}</p>
                        <p className="text-xs text-muted-foreground">
                          {connector.status === 'error' ? 'Error de conexión' : 'Token expirado'}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Reconectar</Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[150px] text-muted-foreground">
                <div className="text-center">
                  <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-500" />
                  <p>Todas las conexiones funcionando correctamente</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <Tabs defaultValue="top" className="space-y-4">
        <TabsList>
          <TabsTrigger value="top">Clientes con Mejor Desempeño</TabsTrigger>
          <TabsTrigger value="bottom">Clientes con Bajo Desempeño</TabsTrigger>
          <TabsTrigger value="campaigns-top">Campañas Ganadoras</TabsTrigger>
          <TabsTrigger value="campaigns-issues">Campañas con Problemas</TabsTrigger>
        </TabsList>

        <TabsContent value="top">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Clientes con Mejor Desempeño</CardTitle>
              <CardDescription>Top 3 clientes por eficiencia de inversión</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">CPL</TableHead>
                    <TableHead className="text-right">ROAS</TableHead>
                    <TableHead className="text-right">Tendencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockMITopClients.map((client, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell className="text-right">{client.leads.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{formatCurrency(client.cpl)}</TableCell>
                      <TableCell className="text-right">{client.roas}x</TableCell>
                      <TableCell className="text-right">
                        {client.trend === 'up' && <ArrowUpRight className="h-4 w-4 text-green-500 inline" />}
                        {client.trend === 'down' && <ArrowDownRight className="h-4 w-4 text-red-500 inline" />}
                        {client.trend === 'stable' && <Minus className="h-4 w-4 text-muted-foreground inline" />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bottom">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Clientes con Bajo Desempeño</CardTitle>
              <CardDescription>Clientes que requieren atención</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">CPL</TableHead>
                    <TableHead className="text-right">ROAS</TableHead>
                    <TableHead className="text-right">Tendencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockMIBottomClients.map((client, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell className="text-right">{client.leads.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{formatCurrency(client.cpl)}</TableCell>
                      <TableCell className="text-right">{client.roas}x</TableCell>
                      <TableCell className="text-right">
                        {client.trend === 'up' && <ArrowUpRight className="h-4 w-4 text-green-500 inline" />}
                        {client.trend === 'down' && <ArrowDownRight className="h-4 w-4 text-red-500 inline" />}
                        {client.trend === 'stable' && <Minus className="h-4 w-4 text-muted-foreground inline" />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns-top">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campañas Ganadoras</CardTitle>
              <CardDescription>Top 5 campañas por ROAS</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaña</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead className="text-right">Inversión</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">CPL</TableHead>
                    <TableHead className="text-right">ROAS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{campaign.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{campaign.platform}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(campaign.spent)}</TableCell>
                      <TableCell className="text-right">{campaign.leads}</TableCell>
                      <TableCell className="text-right">{formatCurrency(campaign.cpl)}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">{campaign.roas}x</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns-issues">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campañas con Problemas</CardTitle>
              <CardDescription>Campañas que requieren optimización</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaña</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">CPL</TableHead>
                    <TableHead>Alertas</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaignsWithIssues.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{campaign.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{campaign.platform}</Badge>
                      </TableCell>
                      <TableCell className={`text-right ${campaign.ctr < 1.0 ? 'text-red-600' : ''}`}>
                        {campaign.ctr}%
                      </TableCell>
                      <TableCell className={`text-right ${campaign.cpl > 1500 ? 'text-amber-600' : ''}`}>
                        {formatCurrency(campaign.cpl)}
                      </TableCell>
                      <TableCell>
                        {campaign.alerts.length > 0 ? (
                          <Badge variant="destructive" className="text-xs">
                            {campaign.alerts.length} alerta{campaign.alerts.length > 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Métricas bajas
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Ver</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
