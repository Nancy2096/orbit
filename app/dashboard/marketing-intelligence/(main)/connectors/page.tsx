"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Search,
  Plus,
  Plug,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Settings,
  Trash2,
  Play,
  Pause,
  Eye,
  FileText,
  Zap,
  Database,
  BarChart3,
  ShoppingCart,
  Mail,
  Globe,
  Link2,
  ArrowRight,
  Building2,
  Users,
  Loader2,
} from "lucide-react"
import { mockMIConnectors, mockMIClients, mockMIBrands } from "@/lib/marketing-intelligence/mock-data"

// Icons for platforms
const platformIcons: Record<string, React.ReactNode> = {
  facebook: <div className="h-5 w-5 rounded bg-[#1877F2] flex items-center justify-center text-white text-xs font-bold">f</div>,
  instagram: <div className="h-5 w-5 rounded bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] flex items-center justify-center text-white text-xs font-bold">IG</div>,
  google: <div className="h-5 w-5 rounded bg-white border flex items-center justify-center text-xs font-bold text-blue-500">G</div>,
  tiktok: <div className="h-5 w-5 rounded bg-black flex items-center justify-center text-white text-xs font-bold">TT</div>,
  linkedin: <div className="h-5 w-5 rounded bg-[#0A66C2] flex items-center justify-center text-white text-xs font-bold">in</div>,
  twitter: <div className="h-5 w-5 rounded bg-black flex items-center justify-center text-white text-xs font-bold">X</div>,
  youtube: <div className="h-5 w-5 rounded bg-[#FF0000] flex items-center justify-center text-white text-xs font-bold">YT</div>,
  analytics: <div className="h-5 w-5 rounded bg-[#F9AB00] flex items-center justify-center text-white text-xs font-bold">GA</div>,
  search: <div className="h-5 w-5 rounded bg-[#4285F4] flex items-center justify-center text-white text-xs font-bold">SC</div>,
  hubspot: <div className="h-5 w-5 rounded bg-[#FF7A59] flex items-center justify-center text-white text-xs font-bold">HS</div>,
  salesforce: <div className="h-5 w-5 rounded bg-[#00A1E0] flex items-center justify-center text-white text-xs font-bold">SF</div>,
  shopify: <div className="h-5 w-5 rounded bg-[#96BF48] flex items-center justify-center text-white text-xs font-bold">S</div>,
  mailchimp: <div className="h-5 w-5 rounded bg-[#FFE01B] flex items-center justify-center text-black text-xs font-bold">MC</div>,
  sheets: <div className="h-5 w-5 rounded bg-[#0F9D58] flex items-center justify-center text-white text-xs font-bold">SH</div>,
  bigquery: <div className="h-5 w-5 rounded bg-[#4285F4] flex items-center justify-center text-white text-xs font-bold">BQ</div>,
  api: <div className="h-5 w-5 rounded bg-gray-800 flex items-center justify-center text-white text-xs font-bold">API</div>,
}

const categoryLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  ads: { label: 'Publicidad', icon: <Zap className="h-4 w-4" /> },
  social: { label: 'Redes Sociales', icon: <Users className="h-4 w-4" /> },
  web: { label: 'Web Analytics', icon: <Globe className="h-4 w-4" /> },
  seo: { label: 'SEO', icon: <Search className="h-4 w-4" /> },
  crm: { label: 'CRM', icon: <Building2 className="h-4 w-4" /> },
  ecommerce: { label: 'Ecommerce', icon: <ShoppingCart className="h-4 w-4" /> },
  email: { label: 'Email Marketing', icon: <Mail className="h-4 w-4" /> },
  bi: { label: 'Business Intelligence', icon: <BarChart3 className="h-4 w-4" /> },
  warehouse: { label: 'Data Warehouse', icon: <Database className="h-4 w-4" /> },
  api: { label: 'API Personalizada', icon: <Link2 className="h-4 w-4" /> },
}

export default function MIConnectorsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [connectStep, setConnectStep] = useState(1)
  const [selectedConnector, setSelectedConnector] = useState<typeof mockMIConnectors[0] | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  const filteredConnectors = mockMIConnectors.filter(connector => {
    const matchesSearch = connector.platform.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || connector.status === statusFilter
    const matchesCategory = categoryFilter === "all" || connector.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const connectedCount = mockMIConnectors.filter(c => c.status === 'connected').length
  const errorCount = mockMIConnectors.filter(c => c.status === 'error' || c.status === 'token_expired').length
  const pendingCount = mockMIConnectors.filter(c => c.status === 'pending').length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Conectado</Badge>
      case 'disconnected':
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Desconectado</Badge>
      case 'token_expired':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100"><Clock className="h-3 w-3 mr-1" />Token Expirado</Badge>
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Error</Badge>
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleStartConnect = (connector: typeof mockMIConnectors[0]) => {
    setSelectedConnector(connector)
    setConnectStep(1)
    setShowConnectDialog(true)
  }

  const handleNextStep = () => {
    if (connectStep < 7) {
      if (connectStep === 4) {
        setIsConnecting(true)
        setTimeout(() => {
          setIsConnecting(false)
          setConnectStep(connectStep + 1)
        }, 2000)
      } else {
        setConnectStep(connectStep + 1)
      }
    } else {
      setShowConnectDialog(false)
      setConnectStep(1)
      setSelectedConnector(null)
    }
  }

  const groupedConnectors = filteredConnectors.reduce((acc, connector) => {
    const category = connector.category
    if (!acc[category]) acc[category] = []
    acc[category].push(connector)
    return acc
  }, {} as Record<string, typeof mockMIConnectors>)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Conectores</h1>
          <p className="text-muted-foreground">Gestiona las conexiones con plataformas de marketing</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Conexión
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{connectedCount}</p>
                <p className="text-sm text-muted-foreground">Conectados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{errorCount}</p>
                <p className="text-sm text-muted-foreground">Con Errores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <Plug className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockMIConnectors.length}</p>
                <p className="text-sm text-muted-foreground">Total Disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar conectores..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="connected">Conectado</SelectItem>
                <SelectItem value="disconnected">Desconectado</SelectItem>
                <SelectItem value="token_expired">Token Expirado</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {Object.entries(categoryLabels).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Connectors Grid */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos ({filteredConnectors.length})</TabsTrigger>
          <TabsTrigger value="connected">Conectados ({connectedCount})</TabsTrigger>
          <TabsTrigger value="issues">Con Problemas ({errorCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {Object.entries(groupedConnectors).map(([category, connectors]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-4">
                {categoryLabels[category]?.icon}
                <h3 className="font-semibold">{categoryLabels[category]?.label || category}</h3>
                <Badge variant="secondary" className="ml-2">{connectors.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {connectors.map((connector) => (
                  <Card key={connector.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {platformIcons[connector.icon] || <Plug className="h-5 w-5" />}
                          <div>
                            <p className="font-medium text-sm">{connector.platform}</p>
                            <p className="text-xs text-muted-foreground capitalize">{categoryLabels[connector.category]?.label}</p>
                          </div>
                        </div>
                        {getStatusBadge(connector.status)}
                      </div>

                      {connector.clientId && (
                        <div className="mb-3 text-xs text-muted-foreground">
                          <span className="font-medium">Cliente:</span> {mockMIClients.find(c => c.id === connector.clientId)?.name}
                        </div>
                      )}

                      {connector.lastSync && (
                        <div className="mb-3 text-xs text-muted-foreground">
                          <span className="font-medium">Última sync:</span> {new Date(connector.lastSync).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      )}

                      {connector.availableMetrics.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-muted-foreground mb-1">Métricas disponibles:</p>
                          <div className="flex flex-wrap gap-1">
                            {connector.availableMetrics.slice(0, 3).map((metric) => (
                              <Badge key={metric} variant="outline" className="text-[10px]">{metric}</Badge>
                            ))}
                            {connector.availableMetrics.length > 3 && (
                              <Badge variant="outline" className="text-[10px]">+{connector.availableMetrics.length - 3}</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {connector.status === 'connected' ? (
                          <>
                            <Button variant="outline" size="sm" className="flex-1">
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Sincronizar
                            </Button>
                            <Button variant="outline" size="sm">
                              <Settings className="h-3 w-3" />
                            </Button>
                          </>
                        ) : connector.status === 'token_expired' || connector.status === 'error' ? (
                          <Button variant="outline" size="sm" className="flex-1 text-amber-600" onClick={() => handleStartConnect(connector)}>
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Reconectar
                          </Button>
                        ) : (
                          <Button size="sm" className="flex-1" onClick={() => handleStartConnect(connector)}>
                            <Plug className="h-3 w-3 mr-1" />
                            Conectar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="connected">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mockMIConnectors.filter(c => c.status === 'connected').map((connector) => (
              <Card key={connector.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {platformIcons[connector.icon] || <Plug className="h-5 w-5" />}
                      <div>
                        <p className="font-medium text-sm">{connector.platform}</p>
                        <p className="text-xs text-muted-foreground">{categoryLabels[connector.category]?.label}</p>
                      </div>
                    </div>
                    {getStatusBadge(connector.status)}
                  </div>
                  {connector.lastSync && (
                    <p className="text-xs text-muted-foreground mb-4">
                      Última sync: {new Date(connector.lastSync).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Sincronizar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="issues">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockMIConnectors.filter(c => c.status === 'error' || c.status === 'token_expired').map((connector) => (
              <Card key={connector.id} className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {platformIcons[connector.icon] || <Plug className="h-5 w-5" />}
                      <div>
                        <p className="font-medium">{connector.platform}</p>
                        <p className="text-sm text-muted-foreground">{categoryLabels[connector.category]?.label}</p>
                      </div>
                    </div>
                    {getStatusBadge(connector.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {connector.status === 'token_expired' 
                      ? 'El token de acceso ha expirado. Reconecta para continuar sincronizando datos.'
                      : 'Error de conexión detectado. Verifica la configuración e intenta de nuevo.'}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => handleStartConnect(connector)}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reconectar
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Connect Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedConnector && platformIcons[selectedConnector.icon]}
              Conectar {selectedConnector?.platform}
            </DialogTitle>
            <DialogDescription>
              Sigue los pasos para conectar tu cuenta de {selectedConnector?.platform}
            </DialogDescription>
          </DialogHeader>

          {/* Progress */}
          <div className="py-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Paso {connectStep} de 7</span>
              <span>{Math.round((connectStep / 7) * 100)}%</span>
            </div>
            <Progress value={(connectStep / 7) * 100} className="h-2" />
          </div>

          <div className="py-4">
            {connectStep === 1 && (
              <div className="space-y-4">
                <h4 className="font-medium">1. Selecciona el Cliente</h4>
                <p className="text-sm text-muted-foreground">Elige el cliente al que deseas vincular esta conexión.</p>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockMIClients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {connectStep === 2 && (
              <div className="space-y-4">
                <h4 className="font-medium">2. Selecciona la Marca</h4>
                <p className="text-sm text-muted-foreground">Elige la marca específica para esta conexión.</p>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockMIBrands.map(brand => (
                      <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {connectStep === 3 && (
              <div className="space-y-4">
                <h4 className="font-medium">3. Selecciona la Plataforma</h4>
                <p className="text-sm text-muted-foreground">Confirma la plataforma a conectar.</p>
                <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                  {selectedConnector && platformIcons[selectedConnector.icon]}
                  <div>
                    <p className="font-medium">{selectedConnector?.platform}</p>
                    <p className="text-sm text-muted-foreground">{categoryLabels[selectedConnector?.category || '']?.label}</p>
                  </div>
                  <Badge className="ml-auto">Seleccionado</Badge>
                </div>
              </div>
            )}

            {connectStep === 4 && (
              <div className="space-y-4">
                <h4 className="font-medium">4. Autorizar Conexión</h4>
                <p className="text-sm text-muted-foreground">
                  Al hacer clic en Autorizar, serás redirigido a {selectedConnector?.platform} para autorizar el acceso.
                </p>
                <div className="p-6 border rounded-lg text-center bg-muted/30">
                  {isConnecting ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm">Conectando con {selectedConnector?.platform}...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        {selectedConnector && platformIcons[selectedConnector.icon]}
                      </div>
                      <p className="text-sm">Listo para autorizar</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Nota: Los tokens y credenciales serán almacenados de forma segura en el backend.
                </p>
              </div>
            )}

            {connectStep === 5 && (
              <div className="space-y-4">
                <h4 className="font-medium">5. Seleccionar Cuentas</h4>
                <p className="text-sm text-muted-foreground">Selecciona las cuentas a las que deseas acceder.</p>
                <div className="space-y-2">
                  {['Cuenta Principal - ID: 12345678', 'Cuenta Secundaria - ID: 87654321'].map((account, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <input type="checkbox" className="h-4 w-4" defaultChecked={i === 0} />
                      <span className="text-sm">{account}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {connectStep === 6 && (
              <div className="space-y-4">
                <h4 className="font-medium">6. Mapear Campos</h4>
                <p className="text-sm text-muted-foreground">Configura cómo se mapean los campos de la plataforma.</p>
                <div className="space-y-3">
                  {[
                    { source: 'spend', target: 'Inversión' },
                    { source: 'clicks', target: 'Clics' },
                    { source: 'impressions', target: 'Impresiones' },
                    { source: 'leads', target: 'Leads' },
                  ].map((mapping) => (
                    <div key={mapping.source} className="flex items-center gap-4">
                      <div className="flex-1 p-2 border rounded text-sm bg-muted/50">{mapping.source}</div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Select defaultValue={mapping.target}>
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={mapping.target}>{mapping.target}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {connectStep === 7 && (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="font-medium text-lg mb-2">¡Conexión Exitosa!</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedConnector?.platform} se ha conectado correctamente. Los datos comenzarán a sincronizarse automáticamente.
                  </p>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">Próxima sincronización</p>
                    <p className="text-xs text-muted-foreground">En 1 hora</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Activo</Badge>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {connectStep > 1 && connectStep < 7 && (
              <Button variant="outline" onClick={() => setConnectStep(connectStep - 1)} disabled={isConnecting}>
                Atrás
              </Button>
            )}
            <Button onClick={handleNextStep} disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : connectStep === 4 ? (
                'Autorizar'
              ) : connectStep === 7 ? (
                'Finalizar'
              ) : (
                'Siguiente'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
