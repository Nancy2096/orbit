"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ChevronRight, Lock, Info } from "lucide-react"
import Link from "next/link"

interface MissingInfoItem {
  label: string
  priority: 'high' | 'medium' | 'low'
  section?: string
  actionUrl?: string
}

interface MissingInfoPanelProps {
  title?: string
  description?: string
  items: MissingInfoItem[]
  maxItems?: number
  className?: string
}

export function MissingInfoPanel({
  title = "Información faltante",
  description,
  items,
  maxItems = 5,
  className
}: MissingInfoPanelProps) {
  if (items.length === 0) return null

  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const sortedItems = [...items].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  const displayItems = sortedItems.slice(0, maxItems)
  const remainingCount = items.length - maxItems

  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200'
  }

  const priorityLabels = {
    high: 'Crítico',
    medium: 'Importante',
    low: 'Opcional'
  }

  return (
    <Card className={cn("border-amber-200 bg-amber-50/50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <CardTitle className="text-sm font-medium text-amber-900">{title}</CardTitle>
        </div>
        {description && (
          <CardDescription className="text-amber-700/80">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {displayItems.map((item, index) => (
          <div 
            key={index}
            className="flex items-center justify-between gap-2 p-2 rounded-md bg-white/60"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Badge 
                variant="outline" 
                className={cn("text-xs shrink-0", priorityColors[item.priority])}
              >
                {priorityLabels[item.priority]}
              </Badge>
              <span className="text-sm truncate">{item.label}</span>
              {item.section && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  ({item.section})
                </span>
              )}
            </div>
            {item.actionUrl && (
              <Button variant="ghost" size="sm" className="h-7 shrink-0" asChild>
                <Link href={item.actionUrl}>
                  Completar
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        ))}
        
        {remainingCount > 0 && (
          <p className="text-xs text-amber-700/70 pt-1">
            +{remainingCount} elementos más por completar
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Blocking alert for features that require prerequisites
interface BlockingAlertProps {
  feature: string
  reason: string
  missingPrerequisites: string[]
  actionLabel?: string
  actionUrl?: string
  className?: string
}

export function BlockingAlert({
  feature,
  reason,
  missingPrerequisites,
  actionLabel = "Completar requisitos",
  actionUrl,
  className
}: BlockingAlertProps) {
  return (
    <Card className={cn("border-red-200 bg-red-50/50", className)}>
      <CardContent className="py-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="p-3 rounded-full bg-red-100">
            <Lock className="h-6 w-6 text-red-600" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-red-900">{feature} bloqueado</h3>
            <p className="text-sm text-red-700/80">{reason}</p>
          </div>
          
          {missingPrerequisites.length > 0 && (
            <div className="w-full max-w-md space-y-2">
              <p className="text-xs font-medium text-red-800">Requisitos pendientes:</p>
              <ul className="text-sm text-red-700/80 space-y-1">
                {missingPrerequisites.map((prereq, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    {prereq}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {actionUrl && (
            <Button variant="destructive" size="sm" asChild>
              <Link href={actionUrl}>
                {actionLabel}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Info tip component
interface InfoTipProps {
  children: React.ReactNode
  className?: string
}

export function InfoTip({ children, className }: InfoTipProps) {
  return (
    <div className={cn(
      "flex items-start gap-2 p-3 rounded-md bg-blue-50 border border-blue-200 text-sm text-blue-800",
      className
    )}>
      <Info className="h-4 w-4 shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  )
}
