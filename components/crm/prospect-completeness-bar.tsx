import { cn } from "@/lib/utils"
import { getCompletenessColor, getProspectCompleteness } from "@/lib/prospect-completeness"

interface ProspectCompletenessBarProps {
  prospect: Record<string, unknown>
  className?: string
  barClassName?: string
  showCount?: boolean
}

export function ProspectCompletenessBar({
  prospect,
  className,
  barClassName,
  showCount = false,
}: ProspectCompletenessBarProps) {
  const { filled, total, percent } = getProspectCompleteness(prospect)

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Información completada: ${percent}%`}
        className={cn("h-2 w-20 overflow-hidden rounded-full bg-muted", barClassName)}
      >
        <div
          className={cn("h-full rounded-full transition-all", getCompletenessColor(percent))}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-sm font-medium tabular-nums">{percent}%</span>
      {showCount && (
        <span className="text-xs text-muted-foreground tabular-nums">
          ({filled} de {total} campos)
        </span>
      )}
    </div>
  )
}
