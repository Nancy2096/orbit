"use client"

import * as React from "react"
import useSWR from "swr"
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, Settings2 } from "lucide-react"
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

export type DataTableSortValue = string | number | Date | boolean | null | undefined

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
  /** Muestra el encabezado como botón para ordenar por esta columna. */
  sortable?: boolean
  /** Valor usado para ordenar cuando la tabla ordena por su cuenta. */
  sortValue?: (row: T) => DataTableSortValue
}

export interface DataTableSummaryRow {
  key: string
  label: string
  cells: Record<string, React.ReactNode>
}

export interface DataTableSort {
  key: string
  direction: "asc" | "desc"
}

const DEFAULT_WIDTH = 140

async function fetchCurrentUserId() {
  const { data } = await createClient().auth.getUser()
  return data.user?.id ?? null
}

interface ColumnVisibilityOptions {
  /** En `false` no hay selector de columnas: se muestran las columnas por defecto. */
  configurable?: boolean
}

/** Visibilidad de columnas guardada en el navegador, separada por usuario. */
export function useColumnVisibility<T>(
  tableId: string,
  columns: DataTableColumn<T>[],
  { configurable = true }: ColumnVisibilityOptions = {},
) {
  const { data: userId } = useSWR(configurable ? "data-table:current-user-id" : null, fetchCurrentUserId, {
    revalidateOnFocus: false,
  })
  const storageKey =
    !configurable || userId === undefined ? null : `table-columns:${tableId}:${userId ?? "anon"}`
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
      Boolean(column.pinned) ||
      ((configurable ? overrides[column.key] : undefined) ?? column.defaultVisible !== false),
    [overrides, configurable],
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
      if (!configurable || !column || column.pinned) return
      const next = { ...overrides, [key]: !isVisible(column) }
      setOverrides(next)
      persist(next)
    },
    [columns, overrides, isVisible, persist, configurable],
  )

  const reset = React.useCallback(() => {
    setOverrides({})
    persist({})
  }, [persist])

  const visibleColumns = React.useMemo(() => columns.filter(isVisible), [columns, isVisible])

  return { columns, visibleColumns, isVisible, toggle, reset, configurable }
}

export type ColumnVisibility<T> = ReturnType<typeof useColumnVisibility<T>>

export function ColumnVisibilityMenu<T>({ visibility }: { visibility: ColumnVisibility<T> }) {
  if (!visibility.configurable) return null
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

function compareSortValues(a: DataTableSortValue, b: DataTableSortValue) {
  const aEmpty = a === null || a === undefined || a === ""
  const bEmpty = b === null || b === undefined || b === ""
  if (aEmpty || bEmpty) return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1
  const av = a instanceof Date ? a.getTime() : typeof a === "boolean" ? Number(a) : a
  const bv = b instanceof Date ? b.getTime() : typeof b === "boolean" ? Number(b) : b
  if (typeof av === "number" && typeof bv === "number") return av - bv
  return String(av).localeCompare(String(bv), "es", { numeric: true, sensitivity: "base" })
}

function nextSort(current: DataTableSort | null, key: string): DataTableSort | null {
  if (current?.key !== key) return { key, direction: "asc" }
  return current.direction === "asc" ? { key, direction: "desc" } : null
}

interface DataTableProps<T> {
  ariaLabel: string
  rows: T[]
  /** Solo las columnas visibles, en orden. */
  columns: DataTableColumn<T>[]
  getRowKey: (row: T) => string
  /** Sin esta función no se dibuja la columna de acciones. */
  renderActions?: (row: T) => React.ReactNode
  widthsStorageKey: string
  /** Claves de columnas mostradas en la tarjeta en pantallas angostas. */
  mobileFieldKeys?: string[]
  /** En `false` la tabla se muestra igual en celulares, sin tarjetas. */
  mobileCards?: boolean
  /** Filas de resumen al final del cuerpo de la tabla. */
  summaryRows?: DataTableSummaryRow[]
  /** Filas de totales al pie, fijas abajo al desplazarse. */
  footerRows?: DataTableSummaryRow[]
  /**
   * Orden controlado. Si se pasa `onSortChange`, la tabla no reordena:
   * la pantalla recibe el nuevo orden y entrega `rows` ya ordenadas.
   */
  sort?: DataTableSort | null
  onSortChange?: (sort: DataTableSort | null) => void
  /** Orden inicial cuando la tabla ordena por su cuenta. */
  defaultSort?: DataTableSort | null
  /** Contenido de la fila expandida. Agrega un botón para abrirla en cada fila. */
  renderExpanded?: (row: T) => React.ReactNode
  /** Indica si una fila puede expandirse (por defecto, todas). */
  canExpand?: (row: T) => boolean
  expandedKeys?: string[]
  onExpandedChange?: (keys: string[]) => void
}

const headCell = "sticky top-0 z-20 border-b bg-card"
const bodyCell = "border-b bg-card group-hover:bg-muted"
const footCell = "sticky bottom-0 z-20 border-t bg-muted"
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
  mobileCards = true,
  summaryRows = [],
  footerRows = [],
  sort: controlledSort,
  onSortChange,
  defaultSort = null,
  renderExpanded,
  canExpand,
  expandedKeys: controlledExpanded,
  onExpandedChange,
}: DataTableProps<T>) {
  const { widths, setWidth } = useColumnWidths(widthsStorageKey)
  const widthOf = (column: DataTableColumn<T>) => widths[column.key] ?? column.width ?? DEFAULT_WIDTH

  const [internalSort, setInternalSort] = React.useState<DataTableSort | null>(defaultSort)
  const isSortControlled = onSortChange !== undefined
  const sort = isSortControlled ? (controlledSort ?? null) : internalSort
  const changeSort = (key: string) => {
    const next = nextSort(sort, key)
    if (isSortControlled) onSortChange(next)
    else setInternalSort(next)
  }

  const [internalExpanded, setInternalExpanded] = React.useState<string[]>([])
  const expanded = controlledExpanded ?? internalExpanded
  const toggleExpanded = (key: string) => {
    const next = expanded.includes(key) ? expanded.filter((k) => k !== key) : [...expanded, key]
    if (onExpandedChange) onExpandedChange(next)
    if (controlledExpanded === undefined) setInternalExpanded(next)
  }
  const isExpandable = (row: T) => Boolean(renderExpanded) && (canExpand?.(row) ?? true)

  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [viewportWidth, setViewportWidth] = React.useState<number>()
  React.useEffect(() => {
    const node = scrollRef.current
    if (!node || !renderExpanded) return
    const observer = new ResizeObserver(() => setViewportWidth(node.clientWidth))
    observer.observe(node)
    return () => observer.disconnect()
  }, [renderExpanded])

  const pinnedColumn = columns.find((c) => c.pinned) ?? columns[0]
  const orderedColumns = pinnedColumn
    ? [pinnedColumn, ...columns.filter((c) => c !== pinnedColumn)]
    : columns
  const mobileColumns = mobileFieldKeys
    .map((key) => columns.find((c) => c.key === key))
    .filter((c): c is DataTableColumn<T> => Boolean(c) && c !== pinnedColumn)
  const hasActions = Boolean(renderActions)
  const totalColumns = orderedColumns.length + 1 + (hasActions ? 1 : 0)

  const displayRows = React.useMemo(() => {
    if (isSortControlled || !sort) return rows
    const column = columns.find((c) => c.key === sort.key)
    if (!column?.sortValue) return rows
    const getValue = column.sortValue
    const factor = sort.direction === "asc" ? 1 : -1
    return rows
      .map((row, index) => ({ row, index }))
      .sort((a, b) => {
        const result = compareSortValues(getValue(a.row), getValue(b.row))
        if (result === 0) return a.index - b.index
        const emptyA = getValue(a.row) == null || getValue(a.row) === ""
        const emptyB = getValue(b.row) == null || getValue(b.row) === ""
        return emptyA || emptyB ? result : result * factor
      })
      .map(({ row }) => row)
  }, [rows, columns, sort, isSortControlled])

  const renderHeaderLabel = (column: DataTableColumn<T>) => {
    if (!column.sortable) return column.label
    const active = sort?.key === column.key
    const Icon = !active ? ArrowUpDown : sort.direction === "asc" ? ArrowUp : ArrowDown
    return (
      <button
        type="button"
        onClick={() => changeSort(column.key)}
        className={cn(
          "inline-flex max-w-full items-center gap-1 rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          column.align === "right" && "flex-row-reverse",
          active && "text-foreground",
        )}
      >
        <span className="truncate">{column.label}</span>
        <Icon className={cn("h-3.5 w-3.5 shrink-0", !active && "opacity-50")} aria-hidden="true" />
        <span className="sr-only">
          {active
            ? sort.direction === "asc"
              ? ", orden ascendente"
              : ", orden descendente"
            : ", ordenar"}
        </span>
      </button>
    )
  }

  const renderExpandButton = (row: T, key: string) => {
    if (!isExpandable(row)) return null
    const open = expanded.includes(key)
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        aria-expanded={open}
        aria-label={open ? "Ocultar detalle" : "Ver detalle"}
        onClick={() => toggleExpanded(key)}
      >
        <ChevronRight className={cn("h-4 w-4 transition-transform", open && "rotate-90")} aria-hidden="true" />
      </Button>
    )
  }

  const indexWidth = renderExpanded ? "w-20 min-w-20" : "w-12 min-w-12"
  const pinnedLeft = renderExpanded ? "left-20" : "left-12"

  const renderSummaryCells = (summary: DataTableSummaryRow, base: string, pinnedZ: string) => (
    <>
      <TableCell className={cn(base, "left-0 sticky", pinnedZ)} />
      {orderedColumns.map((column) => {
        const width = widthOf(column)
        const isPinned = column === pinnedColumn
        return (
          <TableCell
            key={column.key}
            style={{ width, minWidth: width, maxWidth: width }}
            className={cn(
              base,
              isPinned && cn("sticky", pinnedLeft, pinnedZ, pinnedEdge),
              column.align === "right" && "text-right",
            )}
          >
            <div className="truncate">{isPinned ? summary.label : summary.cells[column.key]}</div>
          </TableCell>
        )
      })}
      {hasActions && <TableCell className={cn(base, "sticky right-0", pinnedZ, actionsEdge)} />}
    </>
  )

  return (
    <>
      <div className={cn("min-w-0", mobileCards ? "hidden md:block" : "block")}>
        <div
          ref={scrollRef}
          className="relative isolate z-0 max-h-[70vh] w-full max-w-full overflow-auto rounded-md border"
        >
          <table aria-label={ariaLabel} className="w-full border-separate border-spacing-0 text-sm">
            <TableHeader className="[&_tr]:border-b-0">
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableHead scope="col" className={cn(headCell, "left-0 z-30 text-right", indexWidth)}>
                  #
                </TableHead>
                {orderedColumns.map((column) => {
                  const isPinned = column === pinnedColumn
                  const active = sort?.key === column.key
                  return (
                    <ResizableTableHead
                      key={column.key}
                      columnKey={column.key}
                      width={widthOf(column)}
                      onResize={setWidth}
                      ariaSort={
                        column.sortable
                          ? active
                            ? sort.direction === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                          : undefined
                      }
                      className={cn(
                        headCell,
                        isPinned && cn(pinnedLeft, "z-30", pinnedEdge),
                        column.align === "right" && "text-right",
                      )}
                    >
                      {renderHeaderLabel(column)}
                    </ResizableTableHead>
                  )
                })}
                {hasActions && (
                  <TableHead scope="col" className={cn(headCell, "right-0 z-30 w-14 min-w-14", actionsEdge)}>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.map((row, index) => {
                const rowKey = getRowKey(row)
                const isOpen = isExpandable(row) && expanded.includes(rowKey)
                return (
                  <React.Fragment key={rowKey}>
                    <TableRow className="group border-b-0 hover:bg-transparent">
                      <TableCell
                        className={cn(
                          bodyCell,
                          "sticky left-0 z-10 text-right text-muted-foreground tabular-nums",
                          indexWidth,
                        )}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {renderExpandButton(row, rowKey)}
                          <span>{index + 1}</span>
                        </div>
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
                              isPinned && cn("sticky z-10", pinnedLeft, pinnedEdge),
                              column.align === "right" && "text-right",
                            )}
                          >
                            <div className="truncate">{column.cell(row)}</div>
                          </TableCell>
                        )
                      })}
                      {hasActions && (
                        <TableCell
                          className={cn(bodyCell, "sticky right-0 z-10 w-14 min-w-14 text-right", actionsEdge)}
                        >
                          {renderActions?.(row)}
                        </TableCell>
                      )}
                    </TableRow>
                    {isOpen && (
                      <TableRow className="border-b-0 hover:bg-transparent">
                        <TableCell colSpan={totalColumns} className="border-b bg-muted/40 p-0">
                          <div
                            className="sticky left-0 p-3"
                            style={viewportWidth ? { width: viewportWidth } : undefined}
                          >
                            {renderExpanded?.(row)}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })}
              {summaryRows.map((summary) => (
                <TableRow key={summary.key} className="border-b-0 font-medium hover:bg-transparent">
                  {renderSummaryCells(summary, "border-b bg-muted", "z-10")}
                </TableRow>
              ))}
            </TableBody>
            {footerRows.length > 0 && (
              <tfoot>
                {footerRows.map((summary) => (
                  <TableRow key={summary.key} className="border-b-0 font-medium hover:bg-transparent">
                    {renderSummaryCells(summary, footCell, "z-30")}
                  </TableRow>
                ))}
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {mobileCards && (
        <ul aria-label={ariaLabel} className="flex flex-col gap-3 md:hidden">
          {displayRows.map((row, index) => {
            const rowKey = getRowKey(row)
            const isOpen = isExpandable(row) && expanded.includes(rowKey)
            return (
              <li key={rowKey} className="rounded-lg border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground tabular-nums">#{index + 1}</p>
                    {pinnedColumn && (
                      <div className="truncate" title={pinnedColumn.fullText?.(row) || undefined}>
                        {pinnedColumn.cell(row)}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {renderExpandButton(row, rowKey)}
                    {renderActions?.(row)}
                  </div>
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
                {isOpen && <div className="mt-3 border-t pt-3">{renderExpanded?.(row)}</div>}
              </li>
            )
          })}
          {[...summaryRows, ...footerRows].map((summary) => (
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
      )}
    </>
  )
}
