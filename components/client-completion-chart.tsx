"use client"

import { UserCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { getCompletionColors, type CategoryCompletion } from "@/lib/client-completion"

// Barra compacta tipo semáforo para usar dentro de la tabla de clientes.
export function ClientCompletionBar({
  percentage,
  className,
}: {
  percentage: number
  className?: string
}) {
  const colors = getCompletionColors(percentage)

  return (
    <div className={cn("flex items-center gap-2 min-w-[120px]", className)}>
      <div
        className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Información ${percentage}% completada`}
      >
        <div
          className={cn("h-full rounded-full transition-all", colors.bar)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={cn("text-xs font-medium tabular-nums w-9 text-right", colors.text)}>
        {percentage}%
      </span>
    </div>
  )
}

// Tarjeta detallada con barra total y desglose por categoría (mismo diseño que Personal).
export function ClientCompletionDetail({
  data,
  className,
}: {
  data: CategoryCompletion[]
  className?: string
}) {
  const totalFilled = data.reduce((sum, c) => sum + c.filled, 0)
  const totalFields = data.reduce((sum, c) => sum + c.total, 0)
  const percentage = totalFields === 0 ? 0 : Math.round((totalFilled / totalFields) * 100)
  const overall = getCompletionColors(percentage)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCircle className="h-5 w-5" />
          Avance del Perfil
        </CardTitle>
        <CardDescription>Porcentaje de información completada por categoría</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {/* Total */}
          <div className="space-y-2">
            <div className="flex items-end justify-between">
              <div className="flex items-center gap-2">
                <span className={cn("h-3 w-3 rounded-full", overall.bar)} aria-hidden="true" />
                <span className="text-sm font-medium">Perfil completado</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={cn("text-2xl font-bold tabular-nums", overall.text)}>
                  {percentage}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {totalFilled}/{totalFields} campos
                </span>
              </div>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", overall.bar)}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className={cn("text-xs font-medium", overall.text)}>{overall.label}</p>
          </div>

          {/* Desglose por categoría */}
          <div className="space-y-3">
            {data.map((cat) => {
              const colors = getCompletionColors(cat.percentage)
              return (
                <div key={cat.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{cat.label}</span>
                    <span className="font-medium tabular-nums">
                      {cat.filled}/{cat.total}
                      <span className={cn("ml-2", colors.text)}>{cat.percentage}%</span>
                    </span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full transition-all", colors.bar)}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
