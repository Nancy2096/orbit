"use client"

import * as React from "react"
import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"

/**
 * Hook para gestionar y persistir el ancho de las columnas de una tabla.
 * Los anchos se guardan por `storageKey` en localStorage (preferencia de UI).
 */
export function useColumnWidths(storageKey: string) {
  const [widths, setWidths] = React.useState<Record<string, number>>({})

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) setWidths(JSON.parse(saved))
    } catch {
      // ignora almacenamiento no disponible
    }
  }, [storageKey])

  const setWidth = React.useCallback(
    (key: string, width: number) => {
      setWidths((prev) => {
        const next = { ...prev }
        if (!width) {
          // width 0 => restablecer al ancho automático
          delete next[key]
        } else {
          next[key] = width
        }
        try {
          localStorage.setItem(storageKey, JSON.stringify(next))
        } catch {
          // ignora almacenamiento no disponible
        }
        return next
      })
    },
    [storageKey],
  )

  /** Estilo a aplicar en cada TableCell para fijar el ancho de la columna. */
  const getColumnStyle = React.useCallback(
    (key: string): React.CSSProperties | undefined => {
      const w = widths[key]
      if (!w) return undefined
      return { width: w, minWidth: w, maxWidth: w }
    },
    [widths],
  )

  return { widths, setWidth, getColumnStyle }
}

interface ResizableTableHeadProps {
  columnKey: string
  width?: number
  onResize: (key: string, width: number) => void
  className?: string
  children?: React.ReactNode
  minWidth?: number
}

/**
 * Cabecera de tabla con un tirador para redimensionar la columna arrastrando.
 * Doble clic en el tirador restablece el ancho automático.
 */
export function ResizableTableHead({
  columnKey,
  width,
  onResize,
  className,
  children,
  minWidth = 80,
}: ResizableTableHeadProps) {
  const thRef = React.useRef<HTMLTableCellElement>(null)
  const [resizing, setResizing] = React.useState(false)

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startWidth = thRef.current?.offsetWidth ?? width ?? 150
    setResizing(true)
    document.body.style.userSelect = "none"
    document.body.style.cursor = "col-resize"

    const handleMove = (ev: PointerEvent) => {
      const delta = ev.clientX - startX
      onResize(columnKey, Math.max(minWidth, Math.round(startWidth + delta)))
    }
    const handleUp = () => {
      setResizing(false)
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", handleUp)
    }
    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", handleUp)
  }

  const style = width ? { width, minWidth: width, maxWidth: width } : undefined

  return (
    <TableHead ref={thRef} className={cn("group/th relative pr-3", className)} style={style}>
      <span className="block truncate">{children}</span>
      <span
        role="separator"
        aria-orientation="vertical"
        aria-label={`Redimensionar columna ${typeof children === "string" ? children : columnKey}`}
        onPointerDown={handlePointerDown}
        onDoubleClick={() => onResize(columnKey, 0)}
        title="Arrastra para ajustar el ancho. Doble clic para restablecer."
        className="absolute right-0 top-0 z-10 flex h-full w-3 cursor-col-resize touch-none select-none items-center justify-center"
      >
        <span
          className={cn(
            "h-1/2 w-px bg-border transition-colors group-hover/th:bg-muted-foreground/40",
            resizing && "h-full w-0.5 bg-primary",
          )}
        />
      </span>
    </TableHead>
  )
}
