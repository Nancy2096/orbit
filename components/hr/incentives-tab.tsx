"use client"

import Link from "next/link"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Eye, FileText, Plus, Trophy } from "lucide-react"
import {
  INCENTIVE_STATUS_LABELS,
  INCENTIVE_STATUS_STYLES,
  INCENTIVE_TYPE_LABELS,
  formatDateOnly,
  formatIncentiveAmount,
  receiptFileUrl,
  type IncentiveStatus,
} from "@/lib/incentives"

interface IncentiveListRow {
  id: string
  incentive_number: string | null
  incentive_type: string
  amount: number
  status: IncentiveStatus
  request_date: string
  pay_in_payroll_date: string | null
  receipt_pathname: string | null
  receipt_filename: string | null
  staff: { first_name: string | null; last_name: string | null } | null
  currency: { code: string | null } | null
}

async function fetchIncentives([, agencyId]: [string, string]): Promise<IncentiveListRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("incentives")
    .select(
      "id, incentive_number, incentive_type, amount, status, request_date, pay_in_payroll_date, receipt_pathname, receipt_filename, staff:staff_id(first_name, last_name), currency:currency_id(code)",
    )
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data || []) as unknown as IncentiveListRow[]
}

export function IncentivesTab({ agencyId }: { agencyId: string | null }) {
  const { data, error, isLoading } = useSWR(agencyId ? ["incentives", agencyId] : null, fetchIncentives)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Incentivos</h2>
          <p className="text-sm text-muted-foreground">
            Se suman a la columna Bonos de la nómina indicada en cuanto se aprueban.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/hr/bonuses/incentives/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo incentivo
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : error ? (
        <p className="py-8 text-center text-sm text-destructive">No se pudieron cargar los incentivos.</p>
      ) : !data || data.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <Trophy />
          </EmptyMedia>
          <EmptyTitle>Sin incentivos</EmptyTitle>
          <EmptyDescription>Registra el primero con el botón Nuevo incentivo.</EmptyDescription>
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Nómina de</TableHead>
                <TableHead>Comprobante</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => {
                const name = `${row.staff?.first_name ?? ""} ${row.staff?.last_name ?? ""}`.trim() || "—"
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{name}</div>
                      {row.incentive_number && (
                        <div className="text-xs text-muted-foreground">{row.incentive_number}</div>
                      )}
                    </TableCell>
                    <TableCell>{INCENTIVE_TYPE_LABELS[row.incentive_type] ?? row.incentive_type}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatIncentiveAmount(Number(row.amount), row.currency?.code)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border-0 ${INCENTIVE_STATUS_STYLES[row.status]}`}>
                        {INCENTIVE_STATUS_LABELS[row.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateOnly(row.request_date)}</TableCell>
                    <TableCell>{formatDateOnly(row.pay_in_payroll_date)}</TableCell>
                    <TableCell>
                      {row.receipt_pathname ? (
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <a href={receiptFileUrl(row.receipt_pathname)} target="_blank" rel="noreferrer">
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">Ver comprobante</span>
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <a href={receiptFileUrl(row.receipt_pathname, { filename: row.receipt_filename })}>
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Descargar comprobante</span>
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {row.status === "approved" || row.status === "paid" ? "Pendiente" : "—"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/hr/bonuses/incentives/${row.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver detalle</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
