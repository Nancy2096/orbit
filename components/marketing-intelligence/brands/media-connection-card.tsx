"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  ExternalLink,
  Settings,
  Unplug,
  Clock,
  Wifi,
  WifiOff,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Chrome,
  MessageCircle,
  Mail,
  Database,
  Smartphone,
} from "lucide-react"
import type { MediaConnection, MediaType } from "@/lib/marketing-intelligence/brand-types"

interface MediaConnectionCardProps {
  connection: MediaConnection
  onConnect?: () => void
  onDisconnect?: () => void
  onSync?: () => void
  onSettings?: () => void
  compact?: boolean
  className?: string
}

const mediaConfig: Record<MediaType, { 
  name: string
  icon: React.ReactNode
  color: string
  bgColor: string
}> = {
  meta_ads: {
    name: "Meta Ads",
    icon: <Facebook className="h-5 w-5" />,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  google_ads: {
    name: "Google Ads",
    icon: <Chrome className="h-5 w-5" />,
    color: "text-red-500",
    bgColor: "bg-red-100",
  },
  tiktok_ads: {
    name: "TikTok Ads",
    icon: <Smartphone className="h-5 w-5" />,
    color: "text-gray-900",
    bgColor: "bg-gray-100",
  },
  linkedin_ads: {
    name: "LinkedIn Ads",
    icon: <Linkedin className="h-5 w-5" />,
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  twitter_ads: {
    name: "X Ads",
    icon: <span className="font-bold text-lg">X</span>,
    color: "text-gray-900",
    bgColor: "bg-gray-100",
  },
  meta_organic: {
    name: "Meta Organic",
    icon: <Facebook className="h-5 w-5" />,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  instagram: {
    name: "Instagram",
    icon: <Instagram className="h-5 w-5" />,
    color: "text-pink-600",
    bgColor: "bg-pink-100",
  },
  facebook: {
    name: "Facebook",
    icon: <Facebook className="h-5 w-5" />,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  tiktok: {
    name: "TikTok",
    icon: <Smartphone className="h-5 w-5" />,
    color: "text-gray-900",
    bgColor: "bg-gray-100",
  },
  youtube: {
    name: "YouTube",
    icon: <Youtube className="h-5 w-5" />,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  linkedin: {
    name: "LinkedIn",
    icon: <Linkedin className="h-5 w-5" />,
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  google_analytics: {
    name: "Google Analytics",
    icon: <Chrome className="h-5 w-5" />,
    color: "text-orange-500",
    bgColor: "bg-orange-100",
  },
  google_search_console: {
    name: "Search Console",
    icon: <Chrome className="h-5 w-5" />,
    color: "text-blue-500",
    bgColor: "bg-blue-100",
  },
  hubspot: {
    name: "HubSpot",
    icon: <Database className="h-5 w-5" />,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  salesforce: {
    name: "Salesforce",
    icon: <Database className="h-5 w-5" />,
    color: "text-blue-500",
    bgColor: "bg-blue-100",
  },
  whatsapp_business: {
    name: "WhatsApp Business",
    icon: <MessageCircle className="h-5 w-5" />,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  mailchimp: {
    name: "Mailchimp",
    icon: <Mail className="h-5 w-5" />,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
  activecampaign: {
    name: "ActiveCampaign",
    icon: <span className="font-bold">AC</span>,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
}

const statusConfig = {
  connected: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: "Conectado",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  disconnected: {
    icon: <WifiOff className="h-4 w-4" />,
    label: "Desconectado",
    color: "text-gray-500",
    bgColor: "bg-gray-100",
  },
  error: {
    icon: <XCircle className="h-4 w-4" />,
    label: "Error",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  syncing: {
    icon: <RefreshCw className="h-4 w-4 animate-spin" />,
    label: "Sincronizando",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
}

function formatLastSync(dateString?: string): string {
  if (!dateString) return "Nunca"
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `Hace ${diffInHours}h`
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" })
}

export function MediaConnectionCard({ 
  connection, 
  onConnect, 
  onDisconnect, 
  onSync, 
  onSettings,
  compact = false, 
  className 
}: MediaConnectionCardProps) {
  const media = mediaConfig[connection.type]
  const status = statusConfig[connection.status]

  if (compact) {
    return (
      <div 
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border bg-card",
          connection.status === "error" && "border-red-200",
          className
        )}
      >
        <div className={cn("p-2 rounded-lg", media.bgColor, media.color)}>
          {media.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{media.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {connection.accountName || "No conectado"}
          </p>
        </div>
        <Badge 
          variant="outline" 
          className={cn("text-xs gap-1", status.color, status.bgColor)}
        >
          {status.icon}
          {status.label}
        </Badge>
      </div>
    )
  }

  return (
    <Card className={cn(
      connection.status === "error" && "border-red-200",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn("p-3 rounded-xl", media.bgColor, media.color)}>
            {media.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">{media.name}</h4>
              <Badge 
                variant="outline" 
                className={cn("text-xs gap-1", status.color, status.bgColor)}
              >
                {status.icon}
                {status.label}
              </Badge>
            </div>
            
            {/* Account info */}
            {connection.status === "connected" ? (
              <>
                <p className="text-sm text-muted-foreground mb-2">
                  {connection.accountName}
                </p>
                
                {/* Metrics available */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {connection.metrics.slice(0, 4).map(metric => (
                    <Badge key={metric} variant="secondary" className="text-xs">
                      {metric}
                    </Badge>
                  ))}
                  {connection.metrics.length > 4 && (
                    <Badge variant="secondary" className="text-xs">
                      +{connection.metrics.length - 4}
                    </Badge>
                  )}
                </div>
                
                {/* Last sync */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Última sync: {formatLastSync(connection.lastSync)}
                  </span>
                </div>
              </>
            ) : connection.status === "error" ? (
              <div className="p-2 bg-red-50 rounded text-sm text-red-700 mb-3">
                {connection.errors?.[0] || "Error de conexión"}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-3">
                Conecta tu cuenta para sincronizar datos
              </p>
            )}
            
            {/* Actions */}
            <div className="flex items-center gap-2 mt-3">
              {connection.status === "connected" ? (
                <>
                  <Button size="sm" variant="outline" onClick={onSync}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Sincronizar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onSettings}>
                    <Settings className="h-3 w-3 mr-1" />
                    Configurar
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={onDisconnect}>
                    <Unplug className="h-3 w-3 mr-1" />
                    Desconectar
                  </Button>
                </>
              ) : connection.status === "error" ? (
                <>
                  <Button size="sm" onClick={onConnect}>
                    Reconectar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onSettings}>
                    <Settings className="h-3 w-3 mr-1" />
                    Ver error
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={onConnect}>
                  <Wifi className="h-3 w-3 mr-1" />
                  Conectar
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Media connections summary panel
interface MediaConnectionsPanelProps {
  connections: MediaConnection[]
  className?: string
}

export function MediaConnectionsPanel({ connections, className }: MediaConnectionsPanelProps) {
  const connected = connections.filter(c => c.status === "connected")
  const errors = connections.filter(c => c.status === "error")
  const disconnected = connections.filter(c => c.status === "disconnected")

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Conexiones de Medios</CardTitle>
          <div className="flex items-center gap-2">
            {connected.length > 0 && (
              <Badge variant="outline" className="text-xs gap-1 text-green-600 bg-green-50">
                <CheckCircle2 className="h-3 w-3" />
                {connected.length} activas
              </Badge>
            )}
            {errors.length > 0 && (
              <Badge variant="destructive" className="text-xs gap-1">
                <XCircle className="h-3 w-3" />
                {errors.length} errores
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2">
        {connections.map(connection => (
          <MediaConnectionCard 
            key={connection.id} 
            connection={connection} 
            compact 
          />
        ))}
      </CardContent>
    </Card>
  )
}
