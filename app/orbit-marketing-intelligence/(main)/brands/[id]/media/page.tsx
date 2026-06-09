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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Plug,
  RefreshCw,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Settings,
  Clock,
  Wifi,
  WifiOff,
  BarChart3,
  ExternalLink,
  Facebook,
  Chrome,
  Instagram,
  Smartphone,
  Linkedin,
  Youtube,
  Database,
  MessageCircle,
} from "lucide-react"
import { MediaConnectionCard } from "@/components/marketing-intelligence/brands/media-connection-card"
import { getBrandMediaConnections } from "@/lib/marketing-intelligence/brand-phase3-mock-data"
import { mockBrands } from "@/lib/marketing-intelligence/brand-mock-data"
import type { MediaConnection, MediaType } from "@/lib/marketing-intelligence/brand-types"

// Available integrations to connect
const availableIntegrations: { type: MediaType; category: string }[] = [
  // Paid Ads
  { type: "meta_ads", category: "paid" },
  { type: "google_ads", category: "paid" },
  { type: "tiktok_ads", category: "paid" },
  { type: "linkedin_ads", category: "paid" },
  // Organic Social
  { type: "instagram", category: "organic" },
  { type: "facebook", category: "organic" },
  { type: "tiktok", category: "organic" },
  { type: "youtube", category: "organic" },
  { type: "linkedin", category: "organic" },
  // Analytics
  { type: "google_analytics", category: "analytics" },
  { type: "google_search_console", category: "analytics" },
  // CRM
  { type: "hubspot", category: "crm" },
  { type: "salesforce", category: "crm" },
  { type: "whatsapp_business", category: "crm" },
]

const categoryLabels: Record<string, string> = {
  paid: "Publicidad Pagada",
  organic: "Redes Orgánicas",
  analytics: "Analytics",
  crm: "CRM y Comunicación",
}

const mediaNames: Record<MediaType, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  tiktok_ads: "TikTok Ads",
  linkedin_ads: "LinkedIn Ads",
  twitter_ads: "X Ads",
  meta_organic: "Meta Organic",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  google_analytics: "Google Analytics",
  google_search_console: "Search Console",
  hubspot: "HubSpot",
  salesforce: "Salesforce",
  whatsapp_business: "WhatsApp Business",
  mailchimp: "Mailchimp",
  activecampaign: "ActiveCampaign",
}

export default function BrandMediaPage() {
  const params = useParams()
  const brandId = params.id as string
  
  const [connections, setConnections] = useState<MediaConnection[]>(() => 
    getBrandMediaConnections(brandId)
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [connectDialogOpen, setConnectDialogOpen] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<MediaType | null>(null)
  
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

  const connectedCount = connections.filter(c => c.status === "connected").length
  const errorCount = connections.filter(c => c.status === "error").length
  const syncingCount = connections.filter(c => c.status === "syncing").length

  const filteredConnections = connections.filter(c => {
    const matchesSearch = mediaNames[c.type].toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.accountName?.toLowerCase().includes(searchQuery.toLowerCase()))
    
    if (activeTab === "all") return matchesSearch
    if (activeTab === "connected") return matchesSearch && c.status === "connected"
    if (activeTab === "errors") return matchesSearch && c.status === "error"
    if (activeTab === "disconnected") return matchesSearch && c.status === "disconnected"
    return matchesSearch
  })

  const handleSync = (connectionId: string) => {
    setConnections(prev => prev.map(c => 
      c.id === connectionId ? { ...c, status: "syncing" as const } : c
    ))
    
    setTimeout(() => {
      setConnections(prev => prev.map(c => 
        c.id === connectionId ? { ...c, status: "connected" as const, lastSync: new Date().toISOString() } : c
      ))
      toast.success("Sincronización completada")
    }, 2000)
  }

  const handleConnect = (type: MediaType) => {
    setSelectedIntegration(type)
    setConnectDialogOpen(true)
  }

  const handleConfirmConnect = () => {
    if (!selectedIntegration) return
    
    const existingIndex = connections.findIndex(c => c.type === selectedIntegration)
    
    if (existingIndex >= 0) {
      setConnections(prev => prev.map((c, i) => 
        i === existingIndex ? { 
          ...c, 
          status: "connected" as const, 
          accountName: `Cuenta de ${brand.name}`,
          lastSync: new Date().toISOString(),
          errors: undefined,
        } : c
      ))
    } else {
      const newConnection: MediaConnection = {
        id: `mc_${Date.now()}`,
        brandId,
        type: selectedIntegration,
        name: mediaNames[selectedIntegration],
        status: "connected",
        accountName: `Cuenta de ${brand.name}`,
        lastSync: new Date().toISOString(),
        metrics: ["impressions", "reach", "engagement"],
        permissions: ["read"],
        connectedAt: new Date().toISOString(),
      }
      setConnections(prev => [...prev, newConnection])
    }
    
    toast.success(`${mediaNames[selectedIntegration]} conectado exitosamente`)
    setConnectDialogOpen(false)
    setSelectedIntegration(null)
  }

  const handleDisconnect = (connectionId: string) => {
    setConnections(prev => prev.map(c => 
      c.id === connectionId ? { 
        ...c, 
        status: "disconnected" as const,
        accountName: undefined,
        lastSync: undefined,
      } : c
    ))
    toast.success("Conexión eliminada")
  }

  const handleSyncAll = () => {
    const connectedIds = connections.filter(c => c.status === "connected").map(c => c.id)
    
    setConnections(prev => prev.map(c => 
      connectedIds.includes(c.id) ? { ...c, status: "syncing" as const } : c
    ))
    
    setTimeout(() => {
      setConnections(prev => prev.map(c => 
        connectedIds.includes(c.id) ? { ...c, status: "connected" as const, lastSync: new Date().toISOString() } : c
      ))
      toast.success(`${connectedIds.length} conexiones sincronizadas`)
    }, 3000)
  }

  // Group available integrations by category
  const integrationsByCategory = availableIntegrations.reduce((acc, int) => {
    if (!acc[int.category]) acc[int.category] = []
    acc[int.category].push(int.type)
    return acc
  }, {} as Record<string, MediaType[]>)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/orbit-marketing-intelligence/brands/${brandId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Plug className="h-6 w-6 text-primary" />
              Conexiones de Medios
            </h1>
            <p className="text-muted-foreground">{brand.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSyncAll} disabled={connectedCount === 0}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sincronizar Todo
          </Button>
          <Button onClick={() => setConnectDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Conexión
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{connectedCount}</p>
                <p className="text-sm text-muted-foreground">Conectadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{errorCount}</p>
                <p className="text-sm text-muted-foreground">Con errores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <RefreshCw className={`h-5 w-5 text-blue-600 ${syncingCount > 0 ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{syncingCount}</p>
                <p className="text-sm text-muted-foreground">Sincronizando</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{availableIntegrations.length}</p>
                <p className="text-sm text-muted-foreground">Disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              Todas ({connections.length})
            </TabsTrigger>
            <TabsTrigger value="connected">
              Conectadas ({connectedCount})
            </TabsTrigger>
            <TabsTrigger value="errors" className="gap-1">
              Errores
              {errorCount > 0 && (
                <Badge variant="destructive" className="h-5 w-5 p-0 text-xs rounded-full">
                  {errorCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="disconnected">
              Desconectadas
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar conexión..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Connections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredConnections.map(connection => (
          <MediaConnectionCard
            key={connection.id}
            connection={connection}
            onSync={() => handleSync(connection.id)}
            onConnect={() => handleConnect(connection.type)}
            onDisconnect={() => handleDisconnect(connection.id)}
            onSettings={() => toast.info("Configuración próximamente")}
          />
        ))}
        
        {filteredConnections.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <WifiOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No hay conexiones</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery 
                ? "No se encontraron conexiones que coincidan con tu búsqueda"
                : "Comienza conectando tus primeras plataformas de marketing"
              }
            </p>
            <Button onClick={() => setConnectDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Conexión
            </Button>
          </div>
        )}
      </div>

      {/* Connect Dialog */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conectar Nueva Plataforma</DialogTitle>
            <DialogDescription>
              Selecciona la plataforma que deseas conectar para sincronizar datos automáticamente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {Object.entries(integrationsByCategory).map(([category, types]) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  {categoryLabels[category]}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {types.map(type => {
                    const isConnected = connections.some(c => c.type === type && c.status === "connected")
                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedIntegration(type)}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          selectedIntegration === type 
                            ? "border-primary bg-primary/5" 
                            : "hover:bg-muted"
                        } ${isConnected ? "opacity-50" : ""}`}
                        disabled={isConnected}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {type.includes("facebook") || type.includes("meta") ? <Facebook className="h-5 w-5" /> :
                             type.includes("google") ? <Chrome className="h-5 w-5" /> :
                             type.includes("instagram") ? <Instagram className="h-5 w-5" /> :
                             type.includes("tiktok") ? <Smartphone className="h-5 w-5" /> :
                             type.includes("linkedin") ? <Linkedin className="h-5 w-5" /> :
                             type.includes("youtube") ? <Youtube className="h-5 w-5" /> :
                             type.includes("hubspot") ? <Database className="h-5 w-5" /> :
                             type.includes("whatsapp") ? <MessageCircle className="h-5 w-5" /> :
                             <Plug className="h-5 w-5" />}
                          </span>
                          <span className="text-sm font-medium">{mediaNames[type]}</span>
                        </div>
                        {isConnected && (
                          <Badge variant="secondary" className="text-xs mt-2">
                            Ya conectado
                          </Badge>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmConnect} disabled={!selectedIntegration}>
              <Wifi className="h-4 w-4 mr-2" />
              Conectar {selectedIntegration && mediaNames[selectedIntegration]}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
