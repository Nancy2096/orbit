"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import {
  ArrowLeft,
  Share2,
  Plus,
  Settings,
  RefreshCw,
  ExternalLink,
  Unplug,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Users,
  TrendingUp,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Chrome,
  Globe,
} from "lucide-react"
import { mockBrands } from "@/lib/marketing-intelligence/brand-mock-data"
import { mockSocialConnections, mockPublishingErrors } from "@/lib/marketing-intelligence/brand-phase2-mock-data"

export default function SocialPage() {
  const params = useParams()
  const brandId = params.id as string
  const brand = mockBrands.find(b => b.id === brandId)
  
  const [connectOpen, setConnectOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<string>("")
  
  const brandConnections = mockSocialConnections.filter(c => c.brandId === brandId)
  const brandErrors = mockPublishingErrors.filter(e => e.brandId === brandId)

  const platformIcons: Record<string, React.ReactNode> = {
    instagram: <Instagram className="h-5 w-5" />,
    facebook: <Facebook className="h-5 w-5" />,
    tiktok: <Globe className="h-5 w-5" />,
    youtube: <Youtube className="h-5 w-5" />,
    linkedin: <Linkedin className="h-5 w-5" />,
    twitter: <span className="font-bold text-lg">X</span>,
    whatsapp: <Globe className="h-5 w-5" />,
  }

  const platformColors: Record<string, { bg: string; text: string }> = {
    instagram: { bg: "bg-gradient-to-br from-purple-500 to-pink-500", text: "text-white" },
    facebook: { bg: "bg-blue-600", text: "text-white" },
    tiktok: { bg: "bg-gray-900", text: "text-white" },
    youtube: { bg: "bg-red-600", text: "text-white" },
    linkedin: { bg: "bg-blue-700", text: "text-white" },
    twitter: { bg: "bg-gray-900", text: "text-white" },
    whatsapp: { bg: "bg-green-500", text: "text-white" },
  }

  const platformLabels: Record<string, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    youtube: "YouTube",
    linkedin: "LinkedIn",
    twitter: "X (Twitter)",
    whatsapp: "WhatsApp Business",
  }

  const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    connected: { 
      icon: <CheckCircle2 className="h-4 w-4" />, 
      label: "Conectado", 
      color: "bg-green-100 text-green-700" 
    },
    disconnected: { 
      icon: <XCircle className="h-4 w-4" />, 
      label: "Desconectado", 
      color: "bg-gray-100 text-gray-700" 
    },
    error: { 
      icon: <AlertTriangle className="h-4 w-4" />, 
      label: "Error", 
      color: "bg-red-100 text-red-700" 
    },
    expiring: { 
      icon: <Clock className="h-4 w-4" />, 
      label: "Por expirar", 
      color: "bg-amber-100 text-amber-700" 
    },
  }

  const handleConnect = (platform: string) => {
    toast.success(`Conectando con ${platformLabels[platform]}...`)
    setConnectOpen(false)
  }

  const handleDisconnect = (connectionId: string) => {
    toast.success("Cuenta desconectada")
  }

  const handleRefresh = (connectionId: string) => {
    toast.success("Actualizando conexión...")
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (!brand) {
    return (
      <div className="p-8">
        <p>Marca no encontrada</p>
      </div>
    )
  }

  const connectedCount = brandConnections.filter(c => c.status === 'connected').length
  const totalFollowers = brandConnections.reduce((sum, c) => sum + (c.followers || 0), 0)

  return (
    <div className="flex flex-col gap-6 p-6">
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
              <Share2 className="h-6 w-6 text-blue-600" />
              Conexiones Sociales
            </h1>
            <p className="text-muted-foreground">{brand.name} - Gestión de redes sociales</p>
          </div>
        </div>
        
        <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Conectar Red
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Conectar Red Social</DialogTitle>
              <DialogDescription>
                Selecciona la plataforma que deseas conectar
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-3 py-4">
              {Object.entries(platformLabels).map(([key, label]) => {
                const isConnected = brandConnections.some(c => c.platform === key && c.status === 'connected')
                return (
                  <button
                    key={key}
                    onClick={() => !isConnected && handleConnect(key)}
                    disabled={isConnected}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                      isConnected 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-muted cursor-pointer'
                    }`}
                  >
                    <div className={`p-3 rounded-lg ${platformColors[key].bg}`}>
                      <span className={platformColors[key].text}>
                        {platformIcons[key]}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{label}</p>
                      {isConnected && (
                        <p className="text-sm text-muted-foreground">Ya conectado</p>
                      )}
                    </div>
                    {isConnected ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <ExternalLink className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                )
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Share2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{brandConnections.length}</p>
                <p className="text-sm text-muted-foreground">Redes Totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
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
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(totalFollowers)}</p>
                <p className="text-sm text-muted-foreground">Seguidores Totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{brandErrors.length}</p>
                <p className="text-sm text-muted-foreground">Errores Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Cuentas Conectadas</CardTitle>
          <CardDescription>
            Administra las conexiones de redes sociales de esta marca
          </CardDescription>
        </CardHeader>
        <CardContent>
          {brandConnections.length === 0 ? (
            <div className="text-center py-8">
              <Share2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay redes conectadas</h3>
              <p className="text-muted-foreground mb-4">
                Conecta las redes sociales de la marca para publicar contenido
              </p>
              <Button onClick={() => setConnectOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Conectar Primera Red
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {brandConnections.map((connection) => (
                <Card key={connection.id} className="overflow-hidden">
                  <div className="flex">
                    {/* Platform Sidebar */}
                    <div className={`w-16 flex items-center justify-center ${platformColors[connection.platform].bg}`}>
                      <span className={platformColors[connection.platform].text}>
                        {platformIcons[connection.platform]}
                      </span>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{connection.accountName}</h4>
                          <p className="text-sm text-muted-foreground">
                            @{connection.username}
                          </p>
                        </div>
                        <Badge className={statusConfig[connection.status].color}>
                          {statusConfig[connection.status].icon}
                          <span className="ml-1">{statusConfig[connection.status].label}</span>
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{formatNumber(connection.followers || 0)}</span>
                        </div>
                        {connection.engagement && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span>{connection.engagement}% ER</span>
                          </div>
                        )}
                        {connection.lastSync && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Sync: {new Date(connection.lastSync).toLocaleDateString('es-MX')}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRefresh(connection.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Actualizar
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Perfil
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Settings className="h-4 w-4 mr-2" />
                              Configuración
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDisconnect(connection.id)}
                              className="text-red-600"
                            >
                              <Unplug className="h-4 w-4 mr-2" />
                              Desconectar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Publication Errors */}
      {brandErrors.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Errores de Publicación
            </CardTitle>
            <CardDescription>
              Publicaciones que no se pudieron completar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {brandErrors.map((error) => (
                <div 
                  key={error.id} 
                  className="flex items-center gap-4 p-4 rounded-lg bg-red-50 border border-red-100"
                >
                  <div className={`p-2 rounded-lg ${platformColors[error.platform]?.bg || 'bg-gray-500'}`}>
                    <span className="text-white">
                      {platformIcons[error.platform] || <Globe className="h-5 w-5" />}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{error.contentTitle}</p>
                    <p className="text-sm text-red-600">{error.errorMessage}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(error.failedAt).toLocaleString('es-MX')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Reintentar
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permissions Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Permisos Requeridos</p>
              <p className="text-sm text-blue-700 mt-1">
                Para publicar contenido automáticamente, asegúrate de que cada cuenta tenga los permisos de publicación activados.
                Algunas plataformas requieren verificación adicional para acceso a la API.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
