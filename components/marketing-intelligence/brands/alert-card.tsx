"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  XCircle, 
  Sparkles, 
  CheckCircle2,
  ExternalLink,
  X,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import type { SmartAlert, AlertType } from "@/lib/marketing-intelligence/brand-types"

interface AlertCardProps {
  alert: SmartAlert
  onAcknowledge?: (id: string) => void
  onDismiss?: (id: string) => void
  compact?: boolean
  className?: string
}

const alertConfig: Record<AlertType, { 
  icon: React.ReactNode
  color: string
  bgColor: string
  borderColor: string
  label: string
}> = {
  critical: {
    icon: <XCircle className="h-5 w-5" />,
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    label: "Crítico",
  },
  risk: {
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    label: "Riesgo",
  },
  attention: {
    icon: <AlertCircle className="h-5 w-5" />,
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    label: "Atención",
  },
  info: {
    icon: <Info className="h-5 w-5" />,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    label: "Info",
  },
  opportunity: {
    icon: <Sparkles className="h-5 w-5" />,
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    label: "Oportunidad",
  },
  success: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    label: "Éxito",
  },
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) return "Hace menos de 1 hora"
  if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? "s" : ""}`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? "s" : ""}`
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" })
}

export function AlertCard({ alert, onAcknowledge, onDismiss, compact = false, className }: AlertCardProps) {
  const config = alertConfig[alert.type]
  
  if (compact) {
    return (
      <div 
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border",
          config.bgColor,
          config.borderColor,
          alert.acknowledged && "opacity-60",
          className
        )}
      >
        <div className={config.color}>{config.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{alert.title}</p>
          <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
        </div>
        {alert.actionUrl && (
          <Button variant="ghost" size="sm" asChild>
            <a href={alert.actionUrl}>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className={cn(config.bgColor, config.borderColor, "border", alert.acknowledged && "opacity-60", className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("mt-0.5", config.color)}>{config.icon}</div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={cn("text-xs", config.color, config.borderColor)}>
                {config.label}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {alert.category}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(alert.createdAt)}
              </span>
            </div>
            
            <h4 className="font-medium mb-1">{alert.title}</h4>
            <p className="text-sm text-muted-foreground mb-3">{alert.description}</p>
            
            {/* Metric info */}
            {alert.metric && alert.currentValue !== undefined && (
              <div className="flex items-center gap-4 mb-3 p-2 bg-background/50 rounded">
                <div>
                  <p className="text-xs text-muted-foreground">{alert.metric}</p>
                  <p className="font-semibold">{alert.currentValue.toLocaleString()}</p>
                </div>
                {alert.targetValue !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">Objetivo</p>
                    <p className="font-semibold">{alert.targetValue.toLocaleString()}</p>
                  </div>
                )}
                {alert.variance !== undefined && (
                  <div className="flex items-center gap-1">
                    {alert.variance > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={cn(
                      "font-medium",
                      alert.variance > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {alert.variance > 0 ? "+" : ""}{alert.variance}%
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              {alert.actionUrl && (
                <Button size="sm" variant="default" asChild>
                  <a href={alert.actionUrl}>
                    {alert.actionLabel || "Ver detalles"}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              )}
              {!alert.acknowledged && onAcknowledge && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onAcknowledge(alert.id)}
                >
                  Marcar como vista
                </Button>
              )}
            </div>
          </div>
          
          {onDismiss && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => onDismiss(alert.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Alert summary badge for showing counts
interface AlertSummaryProps {
  alerts: SmartAlert[]
  className?: string
}

export function AlertSummary({ alerts, className }: AlertSummaryProps) {
  const unacknowledged = alerts.filter(a => !a.acknowledged)
  const critical = unacknowledged.filter(a => a.type === "critical" || a.type === "risk")
  const attention = unacknowledged.filter(a => a.type === "attention")
  const opportunities = unacknowledged.filter(a => a.type === "opportunity")

  if (unacknowledged.length === 0) return null

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {critical.length > 0 && (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          {critical.length}
        </Badge>
      )}
      {attention.length > 0 && (
        <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-700">
          <AlertCircle className="h-3 w-3" />
          {attention.length}
        </Badge>
      )}
      {opportunities.length > 0 && (
        <Badge variant="outline" className="gap-1 border-purple-300 bg-purple-50 text-purple-700">
          <Sparkles className="h-3 w-3" />
          {opportunities.length}
        </Badge>
      )}
    </div>
  )
}
