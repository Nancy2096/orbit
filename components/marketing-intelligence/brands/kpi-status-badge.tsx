"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle, XCircle, Sparkles } from "lucide-react"
import type { KPIStatus } from "@/lib/marketing-intelligence/brand-types"

interface KPIStatusBadgeProps {
  status: KPIStatus
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

const statusConfig: Record<KPIStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  excellent: {
    label: "Excelente",
    color: "text-emerald-700",
    bgColor: "bg-emerald-100 border-emerald-200",
    icon: <Sparkles className="h-3 w-3" />,
  },
  good: {
    label: "Bueno",
    color: "text-green-700",
    bgColor: "bg-green-100 border-green-200",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  warning: {
    label: "Atención",
    color: "text-amber-700",
    bgColor: "bg-amber-100 border-amber-200",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  critical: {
    label: "Crítico",
    color: "text-red-700",
    bgColor: "bg-red-100 border-red-200",
    icon: <XCircle className="h-3 w-3" />,
  },
}

export function KPIStatusBadge({ status, showLabel = true, size = "md", className }: KPIStatusBadgeProps) {
  const config = statusConfig[status]
  
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
    lg: "text-sm px-3 py-1.5",
  }

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "flex items-center gap-1 font-medium border",
        config.bgColor,
        config.color,
        sizeClasses[size],
        className
      )}
    >
      {config.icon}
      {showLabel && config.label}
    </Badge>
  )
}

// Semáforo visual circular
interface KPISemaphoreProps {
  status: KPIStatus
  size?: "sm" | "md" | "lg"
  pulse?: boolean
  className?: string
}

const semaphoreColors: Record<KPIStatus, string> = {
  excellent: "bg-emerald-500",
  good: "bg-green-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
}

export function KPISemaphore({ status, size = "md", pulse = false, className }: KPISemaphoreProps) {
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  }

  return (
    <div className={cn("relative", className)}>
      <div 
        className={cn(
          "rounded-full",
          semaphoreColors[status],
          sizeClasses[size],
          pulse && status === "critical" && "animate-pulse"
        )}
      />
      {pulse && status === "critical" && (
        <div 
          className={cn(
            "absolute inset-0 rounded-full animate-ping opacity-75",
            semaphoreColors[status],
            sizeClasses[size]
          )}
        />
      )}
    </div>
  )
}

// Trend indicator
interface TrendIndicatorProps {
  trend: "up" | "down" | "stable"
  value?: number
  inverted?: boolean // For metrics where down is good (like CPL)
  size?: "sm" | "md" | "lg"
  className?: string
}

export function TrendIndicator({ trend, value, inverted = false, size = "md", className }: TrendIndicatorProps) {
  const isPositive = inverted ? trend === "down" : trend === "up"
  const isNegative = inverted ? trend === "up" : trend === "down"
  
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  return (
    <span 
      className={cn(
        "flex items-center gap-0.5 font-medium",
        isPositive && "text-green-600",
        isNegative && "text-red-600",
        trend === "stable" && "text-muted-foreground",
        sizeClasses[size],
        className
      )}
    >
      {trend === "up" && <TrendingUp className={iconSizes[size]} />}
      {trend === "down" && <TrendingDown className={iconSizes[size]} />}
      {trend === "stable" && <Minus className={iconSizes[size]} />}
      {value !== undefined && (
        <span>{value > 0 ? "+" : ""}{value.toFixed(1)}%</span>
      )}
    </span>
  )
}

// KPI Card with full semáforo display
interface AdvancedKPICardProps {
  name: string
  code: string
  value: number
  target: number
  min: number
  max: number
  status: KPIStatus
  variance: number
  trend: "up" | "down" | "stable"
  unit: "currency" | "percentage" | "number"
  inverted?: boolean
  className?: string
}

export function AdvancedKPICard({
  name,
  code,
  value,
  target,
  min,
  max,
  status,
  variance,
  trend,
  unit,
  inverted = false,
  className,
}: AdvancedKPICardProps) {
  const formatValue = (val: number) => {
    if (unit === "currency") return `$${val.toLocaleString()}`
    if (unit === "percentage") return `${val.toFixed(1)}%`
    return val.toLocaleString()
  }

  // Calculate position on the range bar (0-100%)
  const rangePosition = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
  const targetPosition = Math.min(100, Math.max(0, ((target - min) / (max - min)) * 100))

  return (
    <div className={cn("p-4 rounded-lg border bg-card", className)}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm text-muted-foreground">{name}</p>
          <p className="text-2xl font-bold">{formatValue(value)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <KPISemaphore status={status} size="md" pulse={status === "critical"} />
          <TrendIndicator trend={trend} value={variance} inverted={inverted} size="sm" />
        </div>
      </div>
      
      {/* Range bar */}
      <div className="mt-3">
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          {/* Gradient background showing range zones */}
          <div className="absolute inset-0 flex">
            <div className="flex-1 bg-red-200" />
            <div className="flex-1 bg-amber-200" />
            <div className="flex-1 bg-green-200" />
            <div className="flex-1 bg-emerald-200" />
          </div>
          
          {/* Target marker */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-foreground/50"
            style={{ left: `${targetPosition}%` }}
          />
          
          {/* Current value marker */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-background shadow-md"
            style={{ 
              left: `${rangePosition}%`,
              transform: `translateX(-50%) translateY(-50%)`,
              backgroundColor: semaphoreColors[status].replace("bg-", ""),
            }}
          >
            <div className={cn("h-full w-full rounded-full", semaphoreColors[status])} />
          </div>
        </div>
        
        {/* Range labels */}
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>{formatValue(min)}</span>
          <span className="font-medium">Obj: {formatValue(target)}</span>
          <span>{formatValue(max)}</span>
        </div>
      </div>
    </div>
  )
}
