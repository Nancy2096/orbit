"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"

interface BrandProgressCardProps {
  title: string
  description?: string
  progress: number
  href?: string
  icon?: React.ReactNode
  missingItems?: string[]
  className?: string
}

export function BrandProgressCard({
  title,
  description,
  progress,
  href,
  icon,
  missingItems = [],
  className
}: BrandProgressCardProps) {
  const isComplete = progress >= 100
  const isLow = progress < 50
  const isMedium = progress >= 50 && progress < 80
  
  const progressColor = isComplete 
    ? 'bg-green-500' 
    : isLow 
      ? 'bg-red-500' 
      : isMedium 
        ? 'bg-amber-500' 
        : 'bg-blue-500'

  const content = (
    <Card className={cn(
      "transition-all hover:shadow-md",
      href && "cursor-pointer hover:border-primary/50",
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <div className="text-muted-foreground">{icon}</div>}
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isComplete ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : missingItems.length > 0 ? (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            ) : null}
            <Badge 
              variant={isComplete ? "default" : "secondary"}
              className={cn(
                "text-xs",
                isComplete && "bg-green-500 hover:bg-green-600"
              )}
            >
              {progress}%
            </Badge>
          </div>
        </div>
        {description && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={progress} className="h-2" indicatorClassName={progressColor} />
        
        {missingItems.length > 0 && progress < 100 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Falta completar:</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {missingItems.slice(0, 3).map((item, i) => (
                <li key={i} className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-amber-500" />
                  {item}
                </li>
              ))}
              {missingItems.length > 3 && (
                <li className="text-muted-foreground/70">
                  +{missingItems.length - 3} más
                </li>
              )}
            </ul>
          </div>
        )}
        
        {href && (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              {isComplete ? 'Ver detalles' : 'Completar'}
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  
  return content
}

// Grid container for progress cards
interface BrandProgressGridProps {
  children: React.ReactNode
  className?: string
}

export function BrandProgressGrid({ children, className }: BrandProgressGridProps) {
  return (
    <div className={cn(
      "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
      className
    )}>
      {children}
    </div>
  )
}
