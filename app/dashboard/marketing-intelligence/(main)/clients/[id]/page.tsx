"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { KpiCard, KpiGrid } from "@/components/marketing-intelligence/kpi-card"
import { ChartCard, MILineChart, MIBarChart, MIDonutChart } from "@/components/marketing-intelligence/charts"
import {
  ArrowLeft,
  Building2,
  Globe,
  Mail,
  Phone,
  User,
  Users,
  Megaphone,
  DollarSign,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Edit,
  ExternalLink,
  CheckCircle,
  XCircle,
  Plug,
  ArrowUpRight,
  ArrowDownRight,
  StickyNote,
} from "lucide-react"
import { formatCurrency, formatNumber } from "@/lib/marketing-intelligence/calculations"
import { mockMIClients, mockMIBrands, mockMICampaigns, mockMIConnectors } from "@/lib/marketing-intelligence/mock-data"

export default function ClientDetailPage() {
  const params = useParams()
  const clientId = params.id as string
  
  const client = mockMIClients.find(c => c.id === clientId)
  const brands = mockMIBrands.filter(b => b.clientId === clientId)
  const campaigns = mockMICampaigns.filter(c => c.clientId === clientId)
  const activeCampaigns = campaigns.filter(c => c.status === 'activo')
  const connectors = mockMIConnectors.filter(c => c.clientId === clientId)

  if (!client) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Cliente no encontrado</h2>
          <Button asChild>
            <Link href="/dashboard/marketing-intelligence/clients">Volver a Clientes</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Calculate client metrics
  const totalInvestment = activeCampaigns.reduce((sum, c) => sum + c.spent, 0)
  const totalLeads = activeCampaigns.reduce((sum, c) => sum + c.leads, 0)
  const avgCPL = totalLeads > 0 ? totalInvestment / totalLeads : 0
  const totalConversions = activeCampaigns.reduce((sum, c) => sum + c.conversions, 0)
  const avgROAS = activeCampaigns.length > 0 
    ? activeCampaigns.reduce((sum, c) => sum + c.roas, 0) / activeCampaigns.length 
    : 0

  // Chart data
  const campaignsByPlatform = [
    { name: 'Meta', value: campaigns.filter(c => c.platform === 'meta').length, color: '#3b5998' },
    { name: 'Google', value: campaigns.filter(c => c.platform === 'google').length, color: '#4285f4' },
    { name: 'TikTok', value: campaigns.filter(c => c.platform === 'tiktok').length, color: '#000000' },
    { name: 'LinkedIn', value: campaigns.filter(c => c.platform === 'linkedin').length, color: '#0077b5' },
  ].filter(p => p.value > 0)

  const monthlyData = [
    { name: 'Ene', Inversión: 380000, Leads: 268 },
    { name: 'Feb', Inversión: 420000, Leads: 295 },
    { name: 'Mar', Inversión: 450000, Leads: 320 },
    { name: 'Abr', Inversión: 475000, Leads: 335 },
    { name: 'May', Inversión: client.monthlyInvestment, Leads: client.monthlyLeads },
  ]

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/marketing-intelligence/clients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{client.name}</h1>
              {client.status === 'activo' ? (
                <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Activo</Badge>
              ) : client.status === 'pausado' ? (
                <Badge className="bg-amber-100 text-amber-700">Pausado</Badge>
              ) : (
                <Badge variant="secondary">Inactivo</Badge>
              )}
            </div>
            <p className="text-muted-foreground">{client.industry}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {client.website && (
            <Button variant="outline" size="sm" onClick={() => window.open(client.website, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Sitio
            </Button>
          )}
          <Button size="sm" asChild>
            <Link href={`/dashboard/marketing-intelligence/clients/${clientId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Cliente
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <KpiGrid columns={5}>
        <KpiCard
          title="Inversión del Periodo"
          value={formatCurrency(totalInvestment)}
          change={8.5}
          icon={DollarSign}
          iconColor="text-emerald-600"
        />
        <KpiCard
          title="Leads Generados"
          value={formatNumber(totalLeads)}
          change={12.3}
          icon={Target}
          iconColor="text-blue-600"
        />
        <KpiCard
          title="CPL Promedio"
          value={formatCurrency(avgCPL)}
          change={-5.2}
          icon={TrendingUp}
          iconColor="text-purple-600"
          status={avgCPL < 1500 ? 'good' : 'warning'}
        />
        <KpiCard
          title="Conversiones"
          value={totalConversions.toString()}
          change={15.8}
          icon={CheckCircle}
          iconColor="text-green-600"
        />
        <KpiCard
          title="ROAS Promedio"
          value={`${avgROAS.toFixed(1)}x`}
          change={4.2}
          icon={TrendingUp}
          iconColor="text-indigo-600"
          status={avgROAS >= 3 ? 'good' : avgROAS >= 2 ? 'warning' : 'critical'}
        />
      </KpiGrid>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="brands">Marcas ({brands.length})</TabsTrigger>
          <TabsTrigger value="campaigns">Campañas ({campaigns.length})</TabsTrigger>
          <TabsTrigger value="connectors">Conectores ({connectors.length})</TabsTrigger>
          <TabsTrigger value="contacts">Contactos</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Client Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Información del Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-violet-100 text-violet-700 text-lg">
                      {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{client.name}</p>
                    <Badge variant="outline" className="mt-1">{client.type}</Badge>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{client.industry}</span>
                  </div>
                  {client.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={client.website} target="_blank" className="text-primary hover:underline">
                        {client.website.replace('https://', '')}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Account Manager: {client.accountManager}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Responsable: {client.internalResponsible}</span>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Acceso Cliente</span>
                  {client.clientAccess ? (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Activo
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactivo
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <ChartCard 
              title="Inversión vs Leads" 
              description="Evolución mensual"
              className="lg:col-span-2"
            >
              <MILineChart
                data={monthlyData}
                dataKeys={[
                  { key: 'Inversión', color: '#8b5cf6', name: 'Inversión' },
                  { key: 'Leads', color: '#10b981', name: 'Leads' }
                ]}
                height={220}
                valueFormatter={(v) => v > 1000 ? `$${(v/1000).toFixed(0)}K` : v.toString()}
              />
            </ChartCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Campañas por Plataforma" description="Distribución actual">
              <MIDonutChart data={campaignsByPlatform} height={200} />
            </ChartCard>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <StickyNote className="h-4 w-4" />
                  Notas Internas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {client.notes ? (
                  <p className="text-sm text-muted-foreground">{client.notes}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Sin notas registradas</p>
                )}
                <Button variant="outline" size="sm" className="mt-4">
                  <Edit className="h-4 w-4 mr-2" />
                  Agregar Nota
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Comparison vs Previous Period */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comparación vs Periodo Anterior</CardTitle>
              <CardDescription>Variación de métricas clave respecto al mes anterior</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                {[
                  { label: 'Inversión', current: formatCurrency(totalInvestment), change: 8.5 },
                  { label: 'Leads', current: totalLeads.toString(), change: 12.3 },
                  { label: 'CPL', current: formatCurrency(avgCPL), change: -5.2, inverse: true },
                  { label: 'Conversiones', current: totalConversions.toString(), change: 15.8 },
                  { label: 'ROAS', current: `${avgROAS.toFixed(1)}x`, change: 4.2 },
                ].map((metric) => (
                  <div key={metric.label} className="text-center p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                    <p className="text-xl font-bold">{metric.current}</p>
                    <div className={`flex items-center justify-center gap-1 text-sm ${
                      (metric.inverse ? metric.change < 0 : metric.change > 0) 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {metric.change > 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : metric.change < 0 ? (
                        <ArrowDownRight className="h-3 w-3" />
                      ) : (
                        <Minus className="h-3 w-3" />
                      )}
                      {Math.abs(metric.change)}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Brands Tab */}
        <TabsContent value="brands">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Marcas Asociadas</CardTitle>
                <CardDescription>Marcas vinculadas a este cliente</CardDescription>
              </div>
              <Button size="sm">
                <Users className="h-4 w-4 mr-2" />
                Nueva Marca
              </Button>
            </CardHeader>
            <CardContent>
              {brands.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {brands.map((brand) => (
                    <Card key={brand.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div 
                            className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: brand.colors?.[0] || '#8b5cf6' }}
                          >
                            {brand.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold">{brand.name}</p>
                            <p className="text-sm text-muted-foreground">{brand.industry}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ubicación</span>
                            <span>{brand.city}, {brand.country}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Redes Conectadas</span>
                            <Badge variant="outline">
                              {brand.socialNetworks.filter(n => n.connected).length}/{brand.socialNetworks.length}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Estado</span>
                            {brand.status === 'activo' ? (
                              <Badge className="bg-green-100 text-green-700">Activo</Badge>
                            ) : (
                              <Badge variant="secondary">Inactivo</Badge>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" className="w-full mt-4" asChild>
                          <Link href={`/dashboard/marketing-intelligence/clients/${clientId}/brands/${brand.id}`}>
                            Ver Detalle
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay marcas asociadas a este cliente</p>
                  <Button className="mt-4">Agregar Primera Marca</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campañas del Cliente</CardTitle>
              <CardDescription>Todas las campañas activas e históricas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaña</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead className="text-right">Inversión</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">CPL</TableHead>
                    <TableHead className="text-right">ROAS</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{campaign.platform}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{campaign.funnelStage}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(campaign.spent)}</TableCell>
                      <TableCell className="text-right">{campaign.leads}</TableCell>
                      <TableCell className="text-right">{formatCurrency(campaign.cpl)}</TableCell>
                      <TableCell className="text-right">{campaign.roas}x</TableCell>
                      <TableCell className="text-center">
                        {campaign.status === 'activo' ? (
                          <Badge className="bg-green-100 text-green-700">Activo</Badge>
                        ) : campaign.status === 'pausado' ? (
                          <Badge className="bg-amber-100 text-amber-700">Pausado</Badge>
                        ) : (
                          <Badge variant="secondary">{campaign.status}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Connectors Tab */}
        <TabsContent value="connectors">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Conectores del Cliente</CardTitle>
                <CardDescription>Plataformas conectadas para este cliente</CardDescription>
              </div>
              <Button size="sm" asChild>
                <Link href="/dashboard/marketing-intelligence/connectors">
                  <Plug className="h-4 w-4 mr-2" />
                  Agregar Conector
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {connectors.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {connectors.map((connector) => (
                    <Card key={connector.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                              <Plug className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">{connector.platform}</p>
                              <p className="text-xs text-muted-foreground capitalize">{connector.category}</p>
                            </div>
                          </div>
                          {connector.status === 'connected' ? (
                            <Badge className="bg-green-100 text-green-700">Conectado</Badge>
                          ) : connector.status === 'token_expired' ? (
                            <Badge className="bg-amber-100 text-amber-700">Token Expirado</Badge>
                          ) : (
                            <Badge variant="destructive">Error</Badge>
                          )}
                        </div>
                        {connector.lastSync && (
                          <p className="text-xs text-muted-foreground">
                            Última sincronización: {new Date(connector.lastSync).toLocaleString('es-MX')}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Plug className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay conectores configurados para este cliente</p>
                  <Button className="mt-4" asChild>
                    <Link href="/dashboard/marketing-intelligence/connectors">Configurar Conectores</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Contactos del Cliente</CardTitle>
                <CardDescription>Personas de contacto asignadas</CardDescription>
              </div>
              <Button size="sm">
                <User className="h-4 w-4 mr-2" />
                Agregar Contacto
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {client.contacts.map((contact) => (
                  <Card key={contact.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            {contact.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{contact.name}</p>
                            {contact.isPrimary && (
                              <Badge variant="secondary" className="text-xs">Principal</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{contact.role}</p>
                          <div className="mt-3 space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                                {contact.email}
                              </a>
                            </div>
                            {contact.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <a href={`tel:${contact.phone}`} className="hover:underline">
                                  {contact.phone}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
