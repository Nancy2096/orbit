"use client"

import { cn } from "@/lib/utils"
import {
  calculateProfileCompletion,
  getCompletionColors,
  type StaffProfileFields,
  type DocumentCompletionInfo,
} from "@/lib/staff-profile-completion"

// Barra compacta tipo semáforo para usar dentro de la tabla de personal.
export function ProfileCompletionBar({
  staff,
  className,
}: {
  staff: StaffProfileFields | null | undefined
  className?: string
}) {
  const { percentage } = calculateProfileCompletion(staff)
  const colors = getCompletionColors(percentage)

  return (
    <div className={cn("flex items-center gap-2 min-w-[140px]", className)}>
      <div
        className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Perfil ${percentage}% completado`}
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

// Tarjeta detallada con barra total y desglose por categoría (gráfica de barras).
export function ProfileCompletionDetail({
  staff,
  documentInfo,
  className,
}: {
  staff: StaffProfileFields | null | undefined
  documentInfo?: DocumentCompletionInfo
  className?: string
}) {
  const completion = calculateProfileCompletion(staff, documentInfo)
  const overall = getCompletionColors(completion.percentage)

  return (
    <div className={cn("space-y-5", className)}>
      {/* Total */}
      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("h-3 w-3 rounded-full", overall.bar)} aria-hidden="true" />
            <span className="text-sm font-medium">Perfil completado</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn("text-2xl font-bold tabular-nums", overall.text)}>
              {completion.percentage}%
            </span>
            <span className="text-xs text-muted-foreground">
              {completion.filled}/{completion.total} campos
            </span>
          </div>
        </div>
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", overall.bar)}
            style={{ width: `${completion.percentage}%` }}
          />
        </div>
        <p className={cn("text-xs font-medium", overall.text)}>{overall.label}</p>
      </div>

      {/* Desglose por categoría */}
      <div className="space-y-3">
        {completion.categories.map((cat) => {
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
  )
}
