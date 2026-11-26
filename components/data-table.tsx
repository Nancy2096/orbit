"use client"

import * as React from "react"
import useSWR from "swr"
import { Settings2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ResizableTableHead, useColumnWidths } from "@/components/resizable-table-head"
import { cn } from "@/lib/utils"

export interface DataTableColumn<T> {
  key: string
  label: string
  /** Ancho por defecto en px; el texto que no cabe se recorta con "…". */
  width?: number
  /** Columna fija a la izquierda (junto a "#"). Siempre visible. */
  pinned?: boolean
  defaultVisible?: boolean
  align?: "left" | "right"
  cell: (row: T) => React.ReactNode
  /** Texto completo que se muestra al pasar el mouse sobre la celda. */
  fullText?: (row: T) => string | null | undefined
}

export interface DataTableSummaryRow {
  key: string
  label: string
  cells: Record<string, React.ReactNode>
}

const DEFAULT_WIDTH = 140

async function fetchCurrentUserId() {
  const { data } = await createClient().auth.getUser()
  return data.user?.id ?? null
}

/** Visibilidad de columnas guardada en el navegador, separada por usuario. */
export function useColumnVisibility<T>(tableId: string, columns: DataTableColumn<T>[]) {
  const { data: userId } = useSWR("data-table:current-user-id", fetchCurrentUserId, {
    revalidateOnFocus: false,
  })
  const storageKey = userId === undefined ? null : `table-columns:${tableId}:${userId ?? "anon"}`
  const [overrides, setOverrides] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    if (!storageKey) return
    try {
      const saved = localStorage.getItem(storageKey)
      setOverrides(saved ? JSON.parse(saved) : {})
    } catch {
      setOverrides({})
    }
  }, [storageKey])

  const isVisible = React.useCallback(
    (column: DataTableColumn<T>) =>
      Boolean(column.pinned) || (overrides[column.key] ?? column.defaultVisible !== false),
    [overrides],
  )

  const persist = React.useCallback(
    (next: Record<string, boolean>) => {
      if (!storageKey) return
      try {
        localStorage.setItem(storageKey, JSON.stringify(next))
      } catch {
        // almacenamiento no disponible
      }
    },
    [storageKey],
  )

  const toggle = React.useCallback(
    (key: string) => {
      const column = columns.find((c) => c.key === key)
      if (!column || column.pinned) return
      const next = { ...overrides, [key]: !isVisible(column) }
      setOverrides(next)
      persist(next)
    },
    [columns, overrides, isVisible, persist],
  )

  const reset = React.useCallback(() => {
    setOverrides({})
    persist({})
  }, [persist])

  const visibleColumns = React.useMemo(() => columns.filter(isVisible), [columns, isVisible])

  return { columns, visibleColumns, isVisible, toggle, reset }
}

type ColumnVisibility<T> = ReturnType<typeof useColumnVisibility<T>>

export function ColumnVisibilityMenu<T>({ visibility }: { visibility: ColumnVisibility<T> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Elegir columnas">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {visibility.columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.key}
            checked={visibility.isVisible(column)}
            disabled={column.pinned}
            onCheckedChange={() => visibility.toggle(column.key)}
            onSelect={(e) => e.preventDefault()}
          >
            {column.label}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={visibility.reset}>Restablecer columnas</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface DataTableProps<T> {
  ariaLabel: string
  rows: T[]
  /** Solo las columnas visibles, en orden. */
  columns: DataTableColumn<T>[]
  getRowKey: (row: T) => string
  renderActions: (row: T) => React.ReactNode
  widthsStorageKey: string
  /** Claves de columnas mostradas en la tarjeta en pantallas angostas. */
  mobileFieldKeys?: string[]
  summaryRows?: DataTableSummaryRow[]
}

const headCell = "sticky top-0 z-20 border-b bg-card"
const bodyCell = "border-b bg-card group-hover:bg-muted"
const pinnedEdge = "shadow-[inset_-1px_0_0_var(--border)]"
const actionsEdge = "shadow-[inset_1px_0_0_var(--border)]"

export function DataTable<T>({
  ariaLabel,
  rows,
  columns,
  getRowKey,
  renderActions,
  widthsStorageKey,
  mobileFieldKeys = [],
  summaryRows = [],
}: DataTableProps<T>) {
  const { widths, setWidth } = useColumnWidths(widthsStorageKey)
  const widthOf = (column: DataTableColumn<T>) => widths[column.key] ?? column.width ?? DEFAULT_WIDTH

  const pinnedColumn = columns.find((c) => c.pinned) ?? columns[0]
  const orderedColumns = pinnedColumn
    ? [pinnedColumn, ...columns.filter((c) => c !== pinnedColumn)]
    : columns
  const mobileColumns = mobileFieldKeys
    .map((key) => columns.find((c) => c.key === key))
    .filter((c): c is DataTableColumn<T> => Boolean(c) && c !== pinnedColumn)

  return (
    <>
      <div className="hidden min-w-0 md:block">
        <div className="relative isolate z-0 max-h-[70vh] w-full max-w-full overflow-auto rounded-md border">
          <table aria-label={ariaLabel} className="w-full border-separate border-spacing-0 text-sm">
            <TableHeader className="[&_tr]:border-b-0">
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableHead scope="col" className={cn(headCell, "left-0 z-30 w-12 min-w-12 text-right")}>
                  #
                </TableHead>
                {orderedColumns.map((column) => {
                  const isPinned = column === pinnedColumn
                  return (
                    <ResizableTableHead
                      key={column.key}
                      columnKey={column.key}
                      width={widthOf(column)}
                      onResize={setWidth}
                      className={cn(
                        headCell,
                        isPinned && cn("left-12 z-30", pinnedEdge),
                        column.align === "right" && "text-right",
                      )}
                    >
                      {column.label}
                    </ResizableTableHead>
                  )
                })}
                <TableHead scope="col" className={cn(headCell, "right-0 z-30 w-14 min-w-14", actionsEdge)}>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={getRowKey(row)} className="group border-b-0 hover:bg-transparent">
                  <TableCell
                    className={cn(bodyCell, "sticky left-0 z-10 w-12 min-w-12 text-right text-muted-foreground tabular-nums")}
                  >
                    {index + 1}
                  </TableCell>
                  {orderedColumns.map((column) => {
                    const width = widthOf(column)
                    const isPinned = column === pinnedColumn
                    return (
                      <TableCell
                        key={column.key}
                        style={{ width, minWidth: width, maxWidth: width }}
                        title={column.fullText?.(row) || undefined}
                        className={cn(
                          bodyCell,
                          isPinned && cn("sticky left-12 z-10", pinnedEdge),
                          column.align === "right" && "text-right",
                        )}
                      >
                        <div className="truncate">{column.cell(row)}</div>
                      </TableCell>
                    )
                  })}
                  <TableCell className={cn(bodyCell, "sticky right-0 z-10 w-14 min-w-14 text-right", actionsEdge)}>
                    {renderActions(row)}
                  </TableCell>
                </TableRow>
              ))}
              {summaryRows.map((summary) => (
                <TableRow key={summary.key} className="border-b-0 font-medium hover:bg-transparent">
                  <TableCell className="sticky left-0 z-10 border-b bg-muted" />
                  {orderedColumns.map((column) => {
                    const width = widthOf(column)
                    const isPinned = column === pinnedColumn
                    return (
                      <TableCell
                        key={column.key}
                        style={{ width, minWidth: width, maxWidth: width }}
                        className={cn(
                          "border-b bg-muted",
                          isPinned && cn("sticky left-12 z-10", pinnedEdge),
                          column.align === "right" && "text-right",
                        )}
                      >
                        <div className="truncate">{isPinned ? summary.label : summary.cells[column.key]}</div>
                      </TableCell>
                    )
                  })}
                  <TableCell className={cn("sticky right-0 z-10 border-b bg-muted", actionsEdge)} />
                </TableRow>
              ))}
            </TableBody>
          </table>
        </div>
      </div>

      <ul aria-label={ariaLabel} className="flex flex-col gap-3 md:hidden">
        {rows.map((row, index) => (
          <li key={getRowKey(row)} className="rounded-lg border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground tabular-nums">#{index + 1}</p>
                {pinnedColumn && (
                  <div className="truncate" title={pinnedColumn.fullText?.(row) || undefined}>
                    {pinnedColumn.cell(row)}
                  </div>
                )}
              </div>
              <div className="shrink-0">{renderActions(row)}</div>
            </div>
            {mobileColumns.length > 0 && (
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                {mobileColumns.map((column) => (
                  <div key={column.key} className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{column.label}</dt>
                    <dd className="truncate" title={column.fullText?.(row) || undefined}>
                      {column.cell(row)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </li>
        ))}
        {summaryRows.map((summary) => (
          <li
            key={summary.key}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted p-3 text-sm font-medium"
          >
            <span>{summary.label}</span>
            <span className="flex items-center gap-2">
              {Object.entries(summary.cells).map(([key, value]) => (
                <span key={key}>{value}</span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}
