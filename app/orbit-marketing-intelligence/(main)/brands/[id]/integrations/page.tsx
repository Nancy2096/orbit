"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import {
  ArrowLeft,
  Plug,
  Settings,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Link2,
  Database,
  BarChart3,
  Users,
  Mail,
  MessageSquare,
  Loader2,
  BarChart2,
} from "lucide-react"
import { mockBrands } from "@/lib/marketing-intelligence/brand-mock-data"

// Integration configurations
const integrations = [
  {
    id: 'looker',
    name: 'Looker Studio',
    description: 'Conecta dashboards personalizados',
    category: 'analytics',
    icon: <BarChart3 className="h-6 w-6" />,
    color: '#4285F4',
    fields: ['Report ID', 'Data Source ID']
  },
  {
    id: 'google_analytics',
    name: 'Google Analytics 4',
    description: 'Métricas de sitio web y conversiones',
    category: 'analytics',
    icon: <BarChart2 className="h-6 w-6" />,
    color: '#F9AB00',
    fields: ['Property ID', 'Stream ID']
  },
  {
    id: 'hubspot',
    name: 'HubSpot CRM',
    description: 'Sincroniza leads y oportunidades',
    category: 'crm',
    icon: <Database className="h-6 w-6" />,
    color: '#FF7A59',
    fields: ['Portal ID', 'API Key']
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Integración con tu CRM empresarial',
    category: 'crm',
    icon: <Database className="h-6 w-6" />,
    color: '#00A1E0',
    fields: ['Instance URL', 'Access Token']
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing y automatizaciones',
    category: 'email',
    icon: <MailIcon className="h-6 w-6" />,
    color: '#FFE01B',
    fields: ['API Key', 'Server Prefix']
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Mensajería y atención al cliente',
    category: 'messaging',
    icon: <MessageSquare className="h-6 w-6" />,
    color: '#25D366',
    fields: ['Phone Number ID', 'Access Token']
  },
]

// Mock connected integrations
const mockConnectedIntegrations: Record<string, { status: 'connected' | 'error' | 'syncing'; lastSync?: string }> = {
  'google_analytics': { status: 'connected', lastSync: '2024-04-01T10:30:00Z' },
  'hubspot': { status: 'syncing', lastSync: '2024-04-01T09:00:00Z' },
}

export default function BrandIntegrationsPage() {
  const params = useParams()
  const brandId = params.id as string
  const brand = mockBrands.find(b => b.id === brandId)
  
  const [connectedIntegrations, setConnectedIntegrations] = useState(mockConnectedIntegrations)
  const [configuringId, setConfiguringId] = useState<string | null>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  
  if (!brand) {
    return <div className="p-8">Marca no encontrada</div>
  }

  const handleConnect = async (integrationId: string) => {
    setConfiguringId(integrationId)
    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 2000))
    setConnectedIntegrations(prev => ({
      ...prev,
      [integrationId]: { status: 'connected', lastSync: new Date().toISOString() }
    }))
    setConfiguringId(null)
    toast.success("Integración conectada exitosamente")
  }

  const handleDisconnect = (integrationId: string) => {
    setConnectedIntegrations(prev => {
      const newState = { ...prev }
      delete newState[integrationId]
      return newState
    })
    toast.success("Integración desconectada")
  }

  const handleSync = async (integrationId: string) => {
    setSyncingId(integrationId)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setConnectedIntegrations(prev => ({
      ...prev,
      [integrationId]: { ...prev[integrationId], status: 'connected', lastSync: new Date().toISOString() }
    }))
    setSyncingId(null)
    toast.success("Sincronización completada")
  }

  const categories = [
    { id: 'all', label: 'Todas' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'crm', label: 'CRM' },
    { id: 'email', label: 'Email' },
    { id: 'messaging', label: 'Mensajería' },
  ]

  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredIntegrations = selectedCategory === 'all' 
    ? integrations 
    : integrations.filter(i => i.category === selectedCategory)

  const connectedCount = Object.keys(connectedIntegrations).length

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
              <Plug className="h-6 w-6" />
              Integraciones
            </h1>
            <p className="text-muted-foreground">{brand.name} - Conecta tus herramientas externas</p>
          </div>
        </div>
        <Badge variant="outline" className="text-base px-4 py-2">
          {connectedCount} conectadas
        </Badge>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2">
        {categories.map(cat => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-2 gap-6">
        {filteredIntegrations.map((integration) => {
          const connection = connectedIntegrations[integration.id]
          const isConnected = !!connection
          const isConfiguring = configuringId === integration.id
          const isSyncing = syncingId === integration.id

          return (
            <Card key={integration.id} className={isConnected ? 'border-green-200' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${integration.color}20`, color: integration.color }}
                    >
                      {integration.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {integration.name}
                        {isConnected && (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Conectado
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{integration.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isConnected ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Última sincronización:</span>
                      <span>
                        {connection.lastSync 
                          ? new Date(connection.lastSync).toLocaleString('es-MX')
                          : 'Nunca'}
                      </span>
                    </div>
                    
                    {connection.status === 'error' && (
                      <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
                        <AlertCircle className="h-4 w-4" />
                        Error de conexión. Verifica tus credenciales.
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSync(integration.id)}
                        disabled={isSyncing}
                      >
                        {isSyncing ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Sincronizar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDisconnect(integration.id)}
                      >
                        Desconectar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {integration.fields.map((field, index) => (
                        <div key={field} className="space-y-1">
                          <Label className="text-xs">{field}</Label>
                          <Input placeholder={`Ingresa ${field.toLowerCase()}`} />
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      className="w-full"
                      onClick={() => handleConnect(integration.id)}
                      disabled={isConfiguring}
                    >
                      {isConfiguring ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Conectando...
                        </>
                      ) : (
                        <>
                          <Link2 className="h-4 w-4 mr-2" />
                          Conectar
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Sincronización</CardTitle>
          <CardDescription>Ajusta la frecuencia de actualización de datos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sincronización automática</p>
                <p className="text-sm text-muted-foreground">Actualizar datos cada hora</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notificar errores</p>
                <p className="text-sm text-muted-foreground">Recibir alertas por email</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
