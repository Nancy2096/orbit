"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: LucideIcon
  iconColor?: string
  status?: 'good' | 'warning' | 'critical'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function KpiCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = "text-primary",
  status,
  size = 'md',
  className
}: KpiCardProps) {
  const statusColors = {
    good: 'border-l-green-500',
    warning: 'border-l-amber-500',
    critical: 'border-l-red-500'
  }

  const getTrendIcon = () => {
    if (change === undefined) return null
    if (change > 0) return <TrendingUp className="h-3 w-3" />
    if (change < 0) return <TrendingDown className="h-3 w-3" />
    return <Minus className="h-3 w-3" />
  }

  const getTrendColor = () => {
    if (change === undefined) return 'text-muted-foreground'
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-muted-foreground'
  }

  return (
    <Card className={cn(
      "relative overflow-hidden",
      status && `border-l-4 ${statusColors[status]}`,
      className
    )}>
      <CardHeader className={cn(
        "flex flex-row items-center justify-between space-y-0",
        size === 'sm' ? 'pb-1 pt-3 px-3' : 'pb-2'
      )}>
        <CardTitle className={cn(
          "font-medium text-muted-foreground",
          size === 'sm' ? 'text-xs' : 'text-sm'
        )}>
          {title}
        </CardTitle>
        {Icon && (
          <Icon className={cn(
            iconColor,
            size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
          )} />
        )}
      </CardHeader>
      <CardContent className={size === 'sm' ? 'pb-3 px-3' : ''}>
        <div className={cn(
          "font-bold",
          size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-4xl' : 'text-2xl'
        )}>
          {value}
        </div>
        {(change !== undefined || changeLabel) && (
          <p className={cn(
            "flex items-center gap-1 mt-1",
            getTrendColor(),
            size === 'sm' ? 'text-[10px]' : 'text-xs'
          )}>
            {getTrendIcon()}
            {change !== undefined && (
              <span>{change > 0 ? '+' : ''}{change}%</span>
            )}
            {changeLabel && (
              <span className="text-muted-foreground ml-1">{changeLabel}</span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

interface KpiGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4 | 5 | 6
  className?: string
}

export function KpiGrid({ children, columns = 4, className }: KpiGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  }

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  )
}
