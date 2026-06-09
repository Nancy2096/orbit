"use client"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertCircle, CheckCircle2, TrendingDown, TrendingUp, Minus } from "lucide-react"
import type { KPIRange } from "@/lib/marketing-intelligence/brand-types"

interface KPIRangeInputProps {
  kpi: KPIRange
  onChange: (kpi: KPIRange) => void
  showCurrentValue?: boolean
  className?: string
}

export function KPIRangeInput({ 
  kpi, 
  onChange, 
  showCurrentValue = true,
  className 
}: KPIRangeInputProps) {
  const formatValue = (value: number | undefined) => {
    if (value === undefined) return '-'
    switch (kpi.unit) {
      case 'currency':
        return `$${value.toLocaleString()}`
      case 'percentage':
        return `${value}%`
      default:
        return value.toString()
    }
  }

  const getStatus = (): 'green' | 'yellow' | 'red' | undefined => {
    if (kpi.currentValue === undefined) return undefined
    if (kpi.currentValue <= kpi.maxValue && kpi.currentValue >= kpi.minValue) return 'green'
    if (kpi.currentValue > kpi.maxValue) return 'red'
    if (kpi.currentValue < kpi.minValue) return 'yellow'
    return undefined
  }

  const status = kpi.status || getStatus()

  const statusColors = {
    green: 'bg-green-100 text-green-700 border-green-200',
    yellow: 'bg-amber-100 text-amber-700 border-amber-200',
    red: 'bg-red-100 text-red-700 border-red-200'
  }

  const statusIcons = {
    green: CheckCircle2,
    yellow: Minus,
    red: AlertCircle
  }

  const StatusIcon = status ? statusIcons[status] : null

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{kpi.name}</Label>
        <Badge variant="outline" className="text-xs font-mono">{kpi.code}</Badge>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {kpi.unit === 'currency' ? '$' : ''}
            </span>
            <Input
              type="number"
              value={kpi.minValue}
              onChange={(e) => onChange({ ...kpi, minValue: parseFloat(e.target.value) || 0 })}
              className={cn(
                "h-9 text-sm",
                kpi.unit === 'currency' && "pl-5"
              )}
              placeholder="Mín"
            />
            {kpi.unit === 'percentage' && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
            )}
          </div>
          
          <span className="text-muted-foreground text-sm">-</span>
          
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {kpi.unit === 'currency' ? '$' : ''}
            </span>
            <Input
              type="number"
              value={kpi.maxValue}
              onChange={(e) => onChange({ ...kpi, maxValue: parseFloat(e.target.value) || 0 })}
              className={cn(
                "h-9 text-sm",
                kpi.unit === 'currency' && "pl-5"
              )}
              placeholder="Máx"
            />
            {kpi.unit === 'percentage' && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
            )}
          </div>
        </div>
        
        {showCurrentValue && kpi.currentValue !== undefined && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "min-w-[70px] justify-center gap-1",
                    status && statusColors[status]
                  )}
                >
                  {StatusIcon && <StatusIcon className="h-3 w-3" />}
                  {formatValue(kpi.currentValue)}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Valor actual: {formatValue(kpi.currentValue)}</p>
                <p className="text-xs text-muted-foreground">
                  Rango objetivo: {formatValue(kpi.minValue)} - {formatValue(kpi.maxValue)}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  )
}

// KPI Status indicator (traffic light)
interface KPIStatusIndicatorProps {
  status: 'green' | 'yellow' | 'red'
  label?: string
  value?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function KPIStatusIndicator({ 
  status, 
  label, 
  value,
  size = 'md',
  className 
}: KPIStatusIndicatorProps) {
  const colors = {
    green: 'bg-green-500',
    yellow: 'bg-amber-500',
    red: 'bg-red-500'
  }

  const sizes = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("rounded-full", colors[status], sizes[size])} />
      {label && <span className="text-sm">{label}</span>}
      {value && <span className="text-sm font-medium">{value}</span>}
    </div>
  )
}

// KPI Summary Card
interface KPISummaryProps {
  kpis: KPIRange[]
  className?: string
}

export function KPISummary({ kpis, className }: KPISummaryProps) {
  const greenCount = kpis.filter(k => k.status === 'green').length
  const yellowCount = kpis.filter(k => k.status === 'yellow').length
  const redCount = kpis.filter(k => k.status === 'red').length
  const total = kpis.length

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded-full bg-green-500" />
        <span className="text-sm">{greenCount}/{total}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded-full bg-amber-500" />
        <span className="text-sm">{yellowCount}/{total}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded-full bg-red-500" />
        <span className="text-sm">{redCount}/{total}</span>
      </div>
    </div>
  )
}
