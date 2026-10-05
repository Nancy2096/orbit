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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { ACTIVITY_LABELS, AGING_BUCKETS, SUGGESTED_ACTION_LABELS } from "@/lib/collections/rules"
import {
  ACTION_STYLES,
  BUCKET_STYLES,
  formatDate,
  formatMoney,
  type CollectionRow,
} from "@/components/collections/shared"

export type RowAction = "reminder" | "promise" | "history" | "pause" | "call"

interface CollectionsTableProps {
  rows: CollectionRow[]
  onOpen: (row: CollectionRow) => void
  onAction: (row: CollectionRow, action: RowAction) => void
}

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

export function CollectionsTable({ rows, onOpen, onAction }: CollectionsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-56">Cliente / Cuenta</TableHead>
            <TableHead className="min-w-44">Monto Pendiente / Vencido</TableHead>
            <TableHead>Antigüedad</TableHead>
            <TableHead className="min-w-44">Última Gestión</TableHead>
            <TableHead className="min-w-36">Compromiso de Pago</TableHead>
            <TableHead className="min-w-48">Acción Sugerida</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.clientId}
              className="cursor-pointer"
              onClick={() => onOpen(row)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.target === e.currentTarget) onOpen(row)
              }}
              tabIndex={0}
              aria-label={`Ver detalle de cobranza de ${row.clientName}`}
            >
              <TableCell className="align-top">
                <div className="flex flex-col gap-1.5">
                  <span className="flex items-center gap-2 font-medium">
                    {row.clientName}
                    {row.servicePaused && (
                      <Badge variant="outline" className={ACTION_STYLES.service_paused}>
                        En pausa
                      </Badge>
                    )}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {row.accounts.slice(0, 3).map((name) => (
                      <Badge key={name} variant="secondary" className="font-normal">
                        {name}
                      </Badge>
                    ))}
                    {row.accounts.length > 3 && (
                      <Badge variant="secondary" className="font-normal">
                        +{row.accounts.length - 3}
                      </Badge>
                    )}
                    {row.agencyName && <span className="text-xs text-muted-foreground">{row.agencyName}</span>}
                  </div>
                </div>
              </TableCell>
              <TableCell className="align-top">
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
              </TableCell>
              <TableCell className="align-top">
                <Badge variant="outline" className={BUCKET_STYLES[row.bucket].badge}>
                  {BUCKET_BADGE[row.bucket]}
                </Badge>
                {row.maxDaysOverdue > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground tabular-nums">{row.maxDaysOverdue} días</p>
                )}
                {row.maxDaysOverdue <= 0 && row.nextDueDate && (
                  <p className="mt-1 text-xs text-muted-foreground">Vence {formatDate(row.nextDueDate, false)}</p>
                )}
              </TableCell>
              <TableCell className="align-top text-sm">
                {row.lastActivity ? (
                  <div className="flex flex-col gap-0.5">
                    <span>
                      {ACTIVITY_LABELS[row.lastActivity.type]} · {formatDate(row.lastActivity.createdAt, false)}
                    </span>
                    {row.lastActivity.note && (
                      <span className="line-clamp-1 text-xs text-muted-foreground">{row.lastActivity.note}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">Sin gestiones</span>
                )}
              </TableCell>
              <TableCell className="align-top">
                {row.promise ? (
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
                )}
              </TableCell>
              <TableCell className="align-top">
                <Badge variant="outline" className={ACTION_STYLES[row.suggestedAction]}>
                  {SUGGESTED_ACTION_LABELS[row.suggestedAction]}
                </Badge>
              </TableCell>
              <TableCell className="align-top" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
