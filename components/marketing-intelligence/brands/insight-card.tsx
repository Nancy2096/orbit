"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  TrendingUp, 
  TrendingDown,
  Lightbulb,
  AlertTriangle,
  Target,
  Sparkles,
  Zap,
  BarChart3,
  ExternalLink,
  Check,
  Clock,
  ChevronRight,
} from "lucide-react"
import type { AIInsight, InsightType, InsightImpact } from "@/lib/marketing-intelligence/brand-types"

interface InsightCardProps {
  insight: AIInsight
  onAcknowledge?: (id: string) => void
  onAction?: (id: string) => void
  compact?: boolean
  className?: string
}

const insightConfig: Record<InsightType, { 
  icon: React.ReactNode
  color: string
  bgColor: string
  borderColor: string
  label: string
}> = {
  trend: {
    icon: <TrendingUp className="h-5 w-5" />,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    label: "Tendencia",
  },
  opportunity: {
    icon: <Sparkles className="h-5 w-5" />,
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    label: "Oportunidad",
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    label: "Advertencia",
  },
  recommendation: {
    icon: <Lightbulb className="h-5 w-5" />,
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    label: "Recomendación",
  },
  anomaly: {
    icon: <Zap className="h-5 w-5" />,
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    label: "Anomalía",
  },
  pattern: {
    icon: <BarChart3 className="h-5 w-5" />,
    color: "text-indigo-700",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    label: "Patrón",
  },
}

const impactConfig: Record<InsightImpact, { label: string; color: string; bgColor: string }> = {
  high: { label: "Alto impacto", color: "text-red-700", bgColor: "bg-red-100" },
  medium: { label: "Impacto medio", color: "text-amber-700", bgColor: "bg-amber-100" },
  low: { label: "Bajo impacto", color: "text-green-700", bgColor: "bg-green-100" },
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

export function InsightCard({ insight, onAcknowledge, onAction, compact = false, className }: InsightCardProps) {
  const config = insightConfig[insight.type]
  const impact = impactConfig[insight.impact]

  if (compact) {
    return (
      <div 
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50",
          config.borderColor,
          insight.acknowledged && "opacity-60",
          className
        )}
      >
        <div className={cn("mt-0.5 p-1.5 rounded-lg", config.bgColor, config.color)}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium line-clamp-1">{insight.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{insight.finding}</p>
        </div>
        <Badge variant="outline" className={cn("text-xs shrink-0", impact.color)}>
          {insight.impact === "high" ? "!" : insight.impact === "medium" ? "~" : "-"}
        </Badge>
      </div>
    )
  }

  return (
    <Card className={cn("overflow-hidden", insight.acknowledged && "opacity-60", className)}>
      <div className={cn("h-1", config.bgColor)} />
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg shrink-0", config.bgColor, config.color)}>
            {config.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className={cn("text-xs", config.color, config.borderColor)}>
                {config.label}
              </Badge>
              <Badge variant="secondary" className={cn("text-xs", impact.color, impact.bgColor)}>
                {impact.label}
              </Badge>
              {insight.gemAgent && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Sparkles className="h-3 w-3" />
                  {insight.gemAgent}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(insight.createdAt)}
              </span>
            </div>
            
            {/* Title */}
            <h4 className="font-semibold mb-2">{insight.title}</h4>
            
            {/* Finding */}
            <p className="text-sm text-muted-foreground mb-3">{insight.finding}</p>
            
            {/* Evidence */}
            <div className="p-3 bg-muted/50 rounded-lg mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Evidencia:</p>
              <p className="text-sm">{insight.evidence}</p>
              
              {/* Metric highlight */}
              {insight.metric && insight.metricValue !== undefined && (
                <div className="flex items-center gap-4 mt-2 pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">{insight.metric}</p>
                    <p className="font-bold text-lg">{insight.metricValue.toLocaleString()}</p>
                  </div>
                  {insight.metricChange !== undefined && (
                    <div className={cn(
                      "flex items-center gap-1 font-medium",
                      insight.metricChange > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {insight.metricChange > 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {insight.metricChange > 0 ? "+" : ""}{insight.metricChange}%
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Recommendation */}
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 mb-3">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-primary" />
                <p className="text-xs font-medium text-primary">Recomendación</p>
              </div>
              <p className="text-sm">{insight.recommendation}</p>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              {insight.actionUrl && (
                <Button size="sm" asChild>
                  <a href={insight.actionUrl}>
                    {insight.action}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </a>
                </Button>
              )}
              {!insight.acknowledged && onAcknowledge && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onAcknowledge(insight.id)}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Entendido
                </Button>
              )}
            </div>
            
            {/* Data source */}
            <p className="text-xs text-muted-foreground mt-3">
              Fuente: {insight.dataSource}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Insights summary for dashboard
interface InsightsSummaryProps {
  insights: AIInsight[]
  className?: string
}

export function InsightsSummary({ insights, className }: InsightsSummaryProps) {
  const unacknowledged = insights.filter(i => !i.acknowledged)
  const highImpact = unacknowledged.filter(i => i.impact === "high")
  const opportunities = unacknowledged.filter(i => i.type === "opportunity")
  const warnings = unacknowledged.filter(i => i.type === "warning" || i.type === "anomaly")

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center gap-1">
        <Sparkles className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{unacknowledged.length} insights</span>
      </div>
      {highImpact.length > 0 && (
        <Badge variant="destructive" className="text-xs">
          {highImpact.length} alto impacto
        </Badge>
      )}
      {opportunities.length > 0 && (
        <Badge variant="outline" className="text-xs border-purple-300 bg-purple-50 text-purple-700">
          {opportunities.length} oportunidades
        </Badge>
      )}
      {warnings.length > 0 && (
        <Badge variant="outline" className="text-xs border-amber-300 bg-amber-50 text-amber-700">
          {warnings.length} alertas
        </Badge>
      )}
    </div>
  )
}
