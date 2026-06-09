"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckCircle2, AlertCircle, XCircle, Clock } from "lucide-react"

interface QualityScoreBadgeProps {
  score: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function QualityScoreBadge({ 
  score, 
  showLabel = true, 
  size = 'md',
  className 
}: QualityScoreBadgeProps) {
  const getScoreLevel = (score: number) => {
    if (score >= 80) return { level: 'high', label: 'Excelente', color: 'bg-green-500 text-white', icon: CheckCircle2 }
    if (score >= 60) return { level: 'medium', label: 'Bueno', color: 'bg-blue-500 text-white', icon: CheckCircle2 }
    if (score >= 40) return { level: 'low', label: 'Regular', color: 'bg-amber-500 text-white', icon: AlertCircle }
    return { level: 'critical', label: 'Incompleto', color: 'bg-red-500 text-white', icon: XCircle }
  }

  const { label, color, icon: Icon } = getScoreLevel(score)
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  }
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            className={cn(
              "font-semibold gap-1.5 cursor-help",
              color,
              sizeClasses[size],
              className
            )}
          >
            <Icon className={iconSizes[size]} />
            {score}%
            {showLabel && <span className="hidden sm:inline">- {label}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Quality Score: {score}% ({label})</p>
          <p className="text-xs text-muted-foreground">
            {score < 70 && 'Completa más información para mejorar el score'}
            {score >= 70 && score < 90 && 'Buen progreso, sigue completando detalles'}
            {score >= 90 && 'Excelente nivel de completitud'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Circular progress indicator for quality score
interface QualityScoreCircleProps {
  score: number
  size?: number
  strokeWidth?: number
  className?: string
}

export function QualityScoreCircle({ 
  score, 
  size = 80, 
  strokeWidth = 8,
  className 
}: QualityScoreCircleProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference

  const getColor = (score: number) => {
    if (score >= 80) return '#22c55e' // green-500
    if (score >= 60) return '#3b82f6' // blue-500
    if (score >= 40) return '#f59e0b' // amber-500
    return '#ef4444' // red-500
  }

  const color = getColor(score)

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{score}</span>
        <span className="text-xs text-muted-foreground">Quality</span>
      </div>
    </div>
  )
}

// Approval status badge
interface ApprovalBadgeProps {
  status: 'borrador' | 'en_revision' | 'aprobado' | 'rechazado' | 'archivado'
  showIcon?: boolean
  className?: string
}

export function ApprovalBadge({ status, showIcon = true, className }: ApprovalBadgeProps) {
  const statusConfig = {
    borrador: { label: 'Borrador', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Clock },
    en_revision: { label: 'En revisión', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertCircle },
    aprobado: { label: 'Aprobado', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
    rechazado: { label: 'Rechazado', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
    archivado: { label: 'Archivado', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: Clock },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant="outline" className={cn("font-medium gap-1.5", config.color, className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  )
}
