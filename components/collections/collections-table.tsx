"use client"

import { CalendarCheck, FileText, MoreHorizontal, PauseCircle, Phone, PlayCircle, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DataTable, type ColumnVisibility, type DataTableColumn } from "@/components/data-table"
import { cn } from "@/lib/utils"
import { AGING_BUCKETS, SUGGESTED_ACTION_LABELS, activityLabel } from "@/lib/collections/rules"
import {
  ACTION_STYLES,
  BUCKET_STYLES,
  formatDate,
  formatMoney,
  type CollectionRow,
} from "@/components/collections/shared"

export type RowAction = "reminder" | "promise" | "history" | "pause" | "call"

const BUCKET_BADGE = Object.fromEntries(AGING_BUCKETS.map((b) => [b.key, b.badge]))

function MoneyLines({ values, className }: { values: Record<string, number>; className?: string }) {
  const entries = Object.entries(values)
  if (entries.length === 0) return <span className="text-muted-foreground">—</span>
  return (
    <span className={cn("flex flex-col", className)}>
      {entries.map(([code, amount]) => (
        <span key={code} className="tabular-nums">
          {formatMoney(amount, code)}
        </span>
      ))}
    </span>
  )
}

export function buildCollectionsColumns(onOpen: (row: CollectionRow) => void): DataTableColumn<CollectionRow>[] {
  return [
    {
      key: "client",
      label: "Cliente / Cuenta",
      pinned: true,
      width: 240,
      fullText: (row) => [row.clientName, ...row.accounts, row.agencyName].filter(Boolean).join(" · "),
      cell: (row) => (
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onOpen(row)}
              className="truncate text-left font-medium text-primary underline-offset-4 hover:underline"
              aria-label={`Ver detalle de cobranza de ${row.clientName}`}
            >
              {row.clientName}
            </button>
            {row.servicePaused && (
              <Badge variant="outline" className={cn("shrink-0", ACTION_STYLES.service_paused)}>
                En pausa
              </Badge>
            )}
          </span>
          <div className="flex min-w-0 flex-wrap gap-1">
            {row.accounts.slice(0, 2).map((name) => (
              <Badge key={name} variant="secondary" className="max-w-full truncate font-normal">
                {name}
              </Badge>
            ))}
            {row.accounts.length > 2 && (
              <Badge variant="secondary" className="font-normal">
                +{row.accounts.length - 2}
              </Badge>
            )}
          </div>
          {row.agencyName && <span className="truncate text-xs text-muted-foreground">{row.agencyName}</span>}
        </div>
      ),
    },
    {
      key: "amount",
      label: "Monto Pendiente / Vencido",
      width: 180,
      cell: (row) => (
        <div className="flex flex-col gap-1 text-sm">
          <MoneyLines values={row.pendingByCurrency} className="font-medium" />
          {Object.keys(row.overdueByCurrency).length > 0 && (
            <span className="flex flex-col text-xs text-red-600 dark:text-red-400">
              {Object.entries(row.overdueByCurrency).map(([code, amount]) => (
                <span key={code} className="tabular-nums">
                  Vencido {formatMoney(amount, code)}
                </span>
              ))}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {row.invoiceCount} factura{row.invoiceCount === 1 ? "" : "s"}
          </span>
        </div>
      ),
    },
    {
      key: "aging",
      label: "Antigüedad",
      width: 130,
      cell: (row) => (
        <div>
          <Badge variant="outline" className={BUCKET_STYLES[row.bucket].badge}>
            {BUCKET_BADGE[row.bucket]}
          </Badge>
          {row.maxDaysOverdue > 0 && (
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">{row.maxDaysOverdue} días</p>
          )}
          {row.maxDaysOverdue <= 0 && row.nextDueDate && (
            <p className="mt-1 text-xs text-muted-foreground">Vence {formatDate(row.nextDueDate, false)}</p>
          )}
        </div>
      ),
    },
    {
      key: "suggested",
      label: "Acción Sugerida",
      width: 180,
      cell: (row) => (
        <Badge variant="outline" className={ACTION_STYLES[row.suggestedAction]}>
          {SUGGESTED_ACTION_LABELS[row.suggestedAction]}
        </Badge>
      ),
    },
    {
      key: "promise",
      label: "Compromiso de Pago",
      width: 170,
      cell: (row) =>
        row.promise ? (
          <div className="flex flex-col gap-1">
            <Badge
              variant="outline"
              className={row.promise.isBroken ? BUCKET_STYLES.d60_plus.badge : ACTION_STYLES.follow_promise}
            >
              {row.promise.isBroken ? "Incumplida" : "Promesa"}: {formatDate(row.promise.promisedDate, false)}
            </Badge>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatMoney(row.promise.amount, row.promise.currency)}
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Sin compromiso</span>
        ),
    },
    {
      key: "lastActivity",
      label: "Última Gestión",
      width: 200,
      fullText: (row) =>
        row.lastActivity
          ? [
              `${activityLabel(row.lastActivity.type, row.lastActivity.result)} · ${formatDate(row.lastActivity.createdAt, false)}`,
              row.lastActivity.note,
            ]
              .filter(Boolean)
              .join(" — ")
          : null,
      cell: (row) =>
        row.lastActivity ? (
          <div className="flex min-w-0 flex-col gap-0.5 text-sm">
            <span className="truncate">
              {activityLabel(row.lastActivity.type, row.lastActivity.result)} ·{" "}
              {formatDate(row.lastActivity.createdAt, false)}
            </span>
            {row.lastActivity.note && (
              <span className="truncate text-xs text-muted-foreground">{row.lastActivity.note}</span>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Sin gestiones</span>
        ),
    },
  ]
}

interface CollectionsTableProps {
  rows: CollectionRow[]
  visibility: ColumnVisibility<CollectionRow>
  onAction: (row: CollectionRow, action: RowAction) => void
}

export function CollectionsTable({ rows, visibility, onAction }: CollectionsTableProps) {
  const renderActions = (row: CollectionRow) => (
    <div className="flex items-center justify-end gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={() => onAction(row, "reminder")}>
            <Send />
            <span className="sr-only">Enviar recordatorio a {row.clientName}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Enviar recordatorio</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={() => onAction(row, "promise")}>
            <CalendarCheck />
            <span className="sr-only">Registrar compromiso de {row.clientName}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Registrar compromiso de pago</TooltipContent>
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal />
            <span className="sr-only">Más acciones para {row.clientName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onAction(row, "history")}>
            <FileText />
            Ver historial financiero
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onAction(row, "call")}>
            <Phone />
            Registrar nota de llamada
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => onAction(row, "pause")}
            className={row.servicePaused ? undefined : "text-destructive focus:text-destructive"}
          >
            {row.servicePaused ? <PlayCircle /> : <PauseCircle />}
            {row.servicePaused ? "Reactivar servicio" : "Pausar servicio"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  return (
    <DataTable
      ariaLabel="Gestión de cobranza"
      rows={rows}
      columns={visibility.visibleColumns}
      getRowKey={(row) => row.clientId}
      renderActions={renderActions}
      widthsStorageKey="collections-column-widths"
      mobileFieldKeys={["amount", "aging", "suggested"]}
    />
  )
}
