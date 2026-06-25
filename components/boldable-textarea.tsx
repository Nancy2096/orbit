"use client"

import { useRef } from "react"
import { Bold } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type BoldableTextareaProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  className?: string
  id?: string
}

// Textarea con un botón "B" que envuelve el texto seleccionado en **negritas**.
// Si no hay selección, inserta marcadores para que el usuario escriba dentro.
export function BoldableTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
  id,
}: BoldableTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const applyBold = () => {
    const el = ref.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.slice(start, end)

    if (selected.length > 0) {
      const next = `${value.slice(0, start)}**${selected}**${value.slice(end)}`
      onChange(next)
      // Reposiciona el cursor después de aplicar.
      requestAnimationFrame(() => {
        el.focus()
        el.setSelectionRange(start + 2, end + 2)
      })
    } else {
      const next = `${value.slice(0, start)}****${value.slice(start)}`
      onChange(next)
      requestAnimationFrame(() => {
        el.focus()
        el.setSelectionRange(start + 2, start + 2)
      })
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2 text-xs font-semibold"
          onClick={applyBold}
        >
          <Bold className="h-3.5 w-3.5" />
          Negritas
        </Button>
        <span className="text-xs text-muted-foreground">
          Selecciona texto y pulsa Negritas para resaltarlo
        </span>
      </div>
      <Textarea
        id={id}
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn("resize-none", className)}
      />
    </div>
  )
}
