"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  ArrowLeft,
  Bell,
  BellOff,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Filter,
  Settings,
  Check,
  X,
  ExternalLink,
  Clock,
  Target,
  DollarSign,
  Users,
  Megaphone,
  FileText,
} from "lucide-react"
import { mockBrands } from "@/lib/marketing-intelligence/brand-mock-data"
import { mockSmartAlerts } from "@/lib/marketing-intelligence/brand-phase3-mock-data"
import type { SmartAlert, AlertType } from "@/lib/marketing-intelligence/brand-types"

const alertTypeConfig: Record<AlertType, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  critical: { icon: <AlertCircle className="h-5 w-5" />, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  risk: { icon: <AlertTriangle className="h-5 w-5" />, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  attention: { icon: <AlertTriangle className="h-5 w-5" />, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  info: { icon: <Info className="h-5 w-5" />, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  opportunity: { icon: <TrendingUp className="h-5 w-5" />, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  success: { icon: <CheckCircle className="h-5 w-5" />, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
}

const categoryIcons: Record<string, React.ReactNode> = {
  kpi: <Target className="h-4 w-4" />,
  budget: <DollarSign className="h-4 w-4" />,
  campaign: <Megaphone className="h-4 w-4" />,
  content: <FileText className="h-4 w-4" />,
  audience: <Users className="h-4 w-4" />,
}

export default function BrandAlertsPage() {
  const params = useParams()
  const brandId = params.id as string
  const brand = mockBrands.find(b => b.id === brandId)
  
  const [alerts, setAlerts] = useState(mockSmartAlerts.filter(a => a.brandId === brandId))
  const [filterType, setFilterType] = useState<string>("all")
  const [showAcknowledged, setShowAcknowledged] = useState(false)
  
  if (!brand) {
    return <div className="p-8">Marca no encontrada</div>
  }

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId 
        ? { ...a, acknowledged: true, acknowledgedAt: new Date().toISOString() }
        : a
    ))
    toast.success("Alerta marcada como leída")
  }

  const acknowledgeAll = () => {
    setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true, acknowledgedAt: new Date().toISOString() })))
    toast.success("Todas las alertas marcadas como leídas")
  }

  const filteredAlerts = alerts.filter(a => {
    if (!showAcknowledged && a.acknowledged) return false
    if (filterType !== "all" && a.type !== filterType) return false
    return true
  })

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length
  const criticalCount = alerts.filter(a => !a.acknowledged && (a.type === 'critical' || a.type === 'risk')).length

  const alertsByType = {
    critical: alerts.filter(a => !a.acknowledged && a.type === 'critical').length,
    risk: alerts.filter(a => !a.acknowledged && a.type === 'risk').length,
    attention: alerts.filter(a => !a.acknowledged && a.type === 'attention').length,
    opportunity: alerts.filter(a => !a.acknowledged && a.type === 'opportunity').length,
    info: alerts.filter(a => !a.acknowledged && a.type === 'info').length,
    success: alerts.filter(a => !a.acknowledged && a.type === 'success').length,
  }

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
              <Bell className="h-6 w-6" />
              Centro de Alertas
            </h1>
            <p className="text-muted-foreground">{brand.name} - Alertas y notificaciones inteligentes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unacknowledgedCount > 0 && (
            <Button variant="outline" onClick={acknowledgeAll}>
              <Check className="h-4 w-4 mr-2" />
              Marcar todas como leídas
            </Button>
          )}
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configurar Alertas
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-6 gap-4">
        {Object.entries(alertsByType).map(([type, count]) => {
          const config = alertTypeConfig[type as AlertType]
          return (
            <Card 
              key={type} 
              className={`cursor-pointer transition-all hover:scale-105 ${filterType === type ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setFilterType(filterType === type ? 'all' : type)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className={config.color}>{config.icon}</div>
                  <span className="text-2xl font-bold">{count}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{type}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Critical Alerts Banner */}
      {criticalCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-800">
                  {criticalCount} alerta{criticalCount > 1 ? 's' : ''} crítica{criticalCount > 1 ? 's' : ''} requiere{criticalCount > 1 ? 'n' : ''} atención inmediata
                </p>
                <p className="text-sm text-red-600">Revisa estas alertas para evitar impacto negativo en tus campañas</p>
              </div>
            </div>
            <Button variant="destructive" onClick={() => setFilterType('critical')}>
              Ver Alertas Críticas
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch 
              id="show-acknowledged"
              checked={showAcknowledged}
              onCheckedChange={setShowAcknowledged}
            />
            <Label htmlFor="show-acknowledged" className="text-sm">Mostrar leídas</Label>
          </div>
          {filterType !== 'all' && (
            <Button variant="ghost" size="sm" onClick={() => setFilterType('all')}>
              <X className="h-3 w-3 mr-1" />
              Limpiar filtro
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {filteredAlerts.length} alerta{filteredAlerts.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BellOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No hay alertas pendientes</p>
              <p className="text-muted-foreground">
                {showAcknowledged 
                  ? "No hay alertas que coincidan con los filtros seleccionados"
                  : "Todas las alertas han sido atendidas"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => {
            const config = alertTypeConfig[alert.type]
            return (
              <Card 
                key={alert.id} 
                className={`${config.border} ${alert.acknowledged ? 'opacity-60' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${config.bg}`}>
                      <div className={config.color}>{config.icon}</div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{alert.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {categoryIcons[alert.category]}
                              <span className="ml-1 capitalize">{alert.category}</span>
                            </Badge>
                            {alert.acknowledged && (
                              <Badge variant="secondary" className="text-xs">Leída</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.description}</p>
                          
                          {/* Metrics */}
                          {alert.metric && (
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="text-muted-foreground">
                                {alert.metric}: <strong className={config.color}>{alert.currentValue?.toLocaleString()}</strong>
                              </span>
                              {alert.targetValue && (
                                <span className="text-muted-foreground">
                                  Objetivo: <strong>{alert.targetValue.toLocaleString()}</strong>
                                </span>
                              )}
                              {alert.variance !== undefined && (
                                <span className={alert.variance >= 0 ? "text-green-600" : "text-red-600"}>
                                  {alert.variance >= 0 ? "+" : ""}{alert.variance.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {alert.actionUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={alert.actionUrl}>
                                {alert.actionLabel || "Ver detalles"}
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </Link>
                            </Button>
                          )}
                          {!alert.acknowledged && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(alert.createdAt).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
