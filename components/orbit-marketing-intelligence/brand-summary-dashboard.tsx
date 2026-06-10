"use client"

import type { ReactNode } from "react"
import { useMemo } from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowRight, Inbox } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useOMIFilters } from "@/contexts/omi-filters-context"

export interface SummaryKPI {
  label: string
  value: string
  icon?: LucideIcon
  hint?: string
}

export interface SummaryColumn {
  key: string
  label: string
  align?: "left" | "right" | "center"
}

export interface SummaryRow {
  brandId: string
  brandName: string
  clientId: string
  clientName: string
  cells: Record<string, ReactNode>
}

interface BrandSummaryDashboardProps {
  title: string
  description: string
  icon: LucideIcon
  detailLabel: string
  detailHref: (brandId: string) => string
  kpis: SummaryKPI[]
  columns: SummaryColumn[]
  rows: SummaryRow[]
  emptyHint?: string
}

export function BrandSummaryDashboard({
  title,
  description,
  icon: TitleIcon,
  detailLabel,
  detailHref,
  kpis,
  columns,
  rows,
  emptyHint = "No hay marcas que coincidan con los filtros seleccionados.",
}: BrandSummaryDashboardProps) {
  const { selectedClient, selectedBrand } = useOMIFilters()

  const visibleRows = useMemo(() => {
    return rows.filter((row) => {
      if (selectedClient !== "all" && row.clientId !== selectedClient) return false
      if (selectedBrand !== "all" && row.brandId !== selectedBrand) return false
      return true
    })
  }, [rows, selectedClient, selectedBrand])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <TitleIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>

      {/* Aggregate KPIs */}
      {kpis.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => {
            const KpiIcon = kpi.icon
            return (
              <Card key={kpi.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{kpi.label}</p>
                      <p className="text-2xl font-bold">{kpi.value}</p>
                      {kpi.hint && (
                        <p className="text-xs text-muted-foreground mt-1">{kpi.hint}</p>
                      )}
                    </div>
                    {KpiIcon && (
                      <div className="p-2 bg-muted rounded-lg">
                        <KpiIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Per-brand summary table */}
      <Card>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="font-semibold">Resumen por marca</h2>
            <p className="text-sm text-muted-foreground">
              {visibleRows.length} {visibleRows.length === 1 ? "marca" : "marcas"} · haz clic en
              {" "}&quot;{detailLabel}&quot; para ver el detalle
            </p>
          </div>
        </div>

        {visibleRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{emptyHint}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marca</TableHead>
                <TableHead>Cliente</TableHead>
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                        ? "text-center"
                        : undefined
                    }
                  >
                    {col.label}
                  </TableHead>
                ))}
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((row) => (
                <TableRow key={row.brandId}>
                  <TableCell>
                    <Link
                      href={detailHref(row.brandId)}
                      className="font-medium hover:underline"
                    >
                      {row.brandName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.clientName}</TableCell>
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={
                        col.align === "right"
                          ? "text-right tabular-nums"
                          : col.align === "center"
                          ? "text-center"
                          : undefined
                      }
                    >
                      {row.cells[col.key] ?? "—"}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={detailHref(row.brandId)}>
                        {detailLabel}
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
