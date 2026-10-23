"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getEntryPayment } from "@/lib/payroll-currency"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface SnapshotEntry {
  staff_id: string
  staff: {
    first_name?: string
    last_name?: string
    payroll_bank_name?: string | null
    payroll_payment_currency_id?: string | null
    currency_id?: string | null
    payroll_exchange_rate?: number | string | null
  }
  base_salary: number
  bonuses: number
  commissions: number
  finiquito?: number
  loanDeductions?: number
  deductions: number
  taxes: number
  gross_pay: number
  net_pay: number
  paid_currency_code?: string | null
  paid_amount?: number | null
}

interface PeriodInfo {
  id: string
  period_name: string
  start_date: string
  end_date: string
  status: string
  total_gross: number
  total_net: number
  entries_snapshot: SnapshotEntry[] | null
}

export interface PayrollMovementTarget {
  periodId: string
  bankName: string
  bankCurrencyCode: string
  movementAmount: number
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  calculating: "Calculada",
  approved: "Aprobada",
  paid: "Pagada",
  cancelled: "Cancelada",
}

const money = (n: number, code = "MXN") =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: code || "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n) || 0)

const fmtDay = (v: string) => new Date(v + "T00:00:00").toLocaleDateString("es-MX")

export function PayrollMovementDialog({
  target,
  onOpenChange,
}: {
  target: PayrollMovementTarget | null
  onOpenChange: (open: boolean) => void
}) {
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState<PeriodInfo | null>(null)
  const [codeById, setCodeById] = useState<Map<string, string>>(new Map())
  const [currentBankByStaff, setCurrentBankByStaff] = useState<Map<string, string | null>>(new Map())
  const [showAll, setShowAll] = useState(false)

  const periodId = target?.periodId

  useEffect(() => {
    if (!periodId) return
    let cancelled = false
    const supabase = createClient()
    setLoading(true)
    setShowAll(false)
    ;(async () => {
      const [{ data: p }, { data: currencies }] = await Promise.all([
        supabase
          .from("payroll_periods")
          .select("id, period_name, start_date, end_date, status, total_gross, total_net, entries_snapshot")
          .eq("id", periodId)
          .maybeSingle(),
        supabase.from("currencies").select("id, code"),
      ])
      const info = (p as PeriodInfo | null) ?? null
      // Los snapshots antiguos pueden no traer el banco de origen; se completa
      // con el valor actual del colaborador (igual que en el detalle de nómina).
      const ids = Array.from(new Set((info?.entries_snapshot || []).map((e) => e.staff_id).filter(Boolean)))
      let bankMap = new Map<string, string | null>()
      if (ids.length > 0) {
        const { data: staffRows } = await supabase.from("staff").select("id, payroll_bank_name").in("id", ids)
        bankMap = new Map((staffRows || []).map((r: { id: string; payroll_bank_name: string | null }) => [r.id, r.payroll_bank_name]))
      }
      if (cancelled) return
      setPeriod(info)
      setCodeById(new Map((currencies || []).map((c: { id: string; code: string }) => [c.id, c.code])))
      setCurrentBankByStaff(bankMap)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [periodId])

  const toCode = (id: string | null | undefined) => (id ? codeById.get(id) || "MXN" : "MXN")

  const rows = useMemo(() => {
    if (!period?.entries_snapshot || !target) return []
    const bankCode = target.bankCurrencyCode || "MXN"
    return period.entries_snapshot
      .filter((e) => (Number(e.net_pay) || 0) > 0)
      .map((e) => {
        const bankName = (e.staff?.payroll_bank_name ?? currentBankByStaff.get(e.staff_id) ?? "").trim()
        const pay = getEntryPayment(e, toCode)
        // Mismo criterio con el que se registró la salida del banco.
        const bankAmount =
          pay.code === bankCode ? pay.amount : bankCode === "MXN" ? Number(e.net_pay) || 0 : pay.amount
        return {
          entry: e,
          name: `${e.staff?.first_name ?? ""} ${e.staff?.last_name ?? ""}`.trim() || "Colaborador",
          bankName,
          inThisBank: bankName.toLowerCase() === target.bankName.trim().toLowerCase(),
          pay,
          bankAmount,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name, "es"))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, target, currentBankByStaff, codeById])

  const visible = showAll ? rows : rows.filter((r) => r.inThisBank)
  const sum = (fn: (r: (typeof rows)[number]) => number) => visible.reduce((s, r) => s + (Number(fn(r)) || 0), 0)
  const bankTotal = rows.filter((r) => r.inThisBank).reduce((s, r) => s + r.bankAmount, 0)
  const bankCode = target?.bankCurrencyCode || "MXN"
  const difference = Math.round(((target?.movementAmount ?? 0) - bankTotal) * 100) / 100

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Integración de nómina{period ? ` · ${period.period_name}` : ""}</DialogTitle>
          <DialogDescription>
            Detalle de los colaboradores que integran la salida de {target?.bankName}.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-6 w-6" />
          </div>
        ) : !period ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No se encontró el periodo de nómina.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Periodo</p>
                <p className="text-sm font-medium">
                  {fmtDay(period.start_date)} – {fmtDay(period.end_date)}
                </p>
                <Badge variant="secondary" className="mt-1">
                  {STATUS_LABELS[period.status] || period.status}
                </Badge>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Salida registrada en {target?.bankName}</p>
                <p className="text-lg font-semibold text-red-600">{money(target?.movementAmount ?? 0, bankCode)}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Suma de colaboradores de este banco</p>
                <p className="text-lg font-semibold">{money(bankTotal, bankCode)}</p>
                {Math.abs(difference) >= 0.01 && (
                  <p className="text-xs text-amber-600">Diferencia: {money(difference, bankCode)}</p>
                )}
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Nómina completa (neto)</p>
                <p className="text-lg font-semibold">{money(period.total_net)}</p>
                <p className="text-xs text-muted-foreground">Bruto {money(period.total_gross)}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Switch id="show-all-payroll" checked={showAll} onCheckedChange={setShowAll} />
                <Label htmlFor="show-all-payroll">Ver toda la nómina (todos los bancos)</Label>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/hr/payroll/${period.id}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir periodo de nómina
                </Link>
              </Button>
            </div>

            {visible.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No hay colaboradores con este banco de origen en el periodo.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      {showAll && <TableHead>Banco origen</TableHead>}
                      <TableHead className="text-right">Sueldo base</TableHead>
                      <TableHead className="text-right">Comisiones</TableHead>
                      <TableHead className="text-right">Bonos</TableHead>
                      <TableHead className="text-right">Finiquito</TableHead>
                      <TableHead className="text-right">Bruto</TableHead>
                      <TableHead className="text-right">Deducciones</TableHead>
                      <TableHead className="text-right">Préstamos</TableHead>
                      <TableHead className="text-right">Impuestos</TableHead>
                      <TableHead className="text-right">Neto (MXN)</TableHead>
                      <TableHead className="text-right">Salida del banco</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map((r) => (
                      <TableRow key={r.entry.staff_id} className={showAll && r.inThisBank ? "bg-muted/50" : undefined}>
                        <TableCell className="whitespace-nowrap font-medium">{r.name}</TableCell>
                        {showAll && <TableCell className="whitespace-nowrap">{r.bankName || "—"}</TableCell>}
                        <TableCell className="text-right">{money(r.entry.base_salary)}</TableCell>
                        <TableCell className="text-right">{money(r.entry.commissions)}</TableCell>
                        <TableCell className="text-right">{money(r.entry.bonuses)}</TableCell>
                        <TableCell className="text-right">{money(r.entry.finiquito ?? 0)}</TableCell>
                        <TableCell className="text-right">{money(r.entry.gross_pay)}</TableCell>
                        <TableCell className="text-right">{money(r.entry.deductions)}</TableCell>
                        <TableCell className="text-right">{money(r.entry.loanDeductions ?? 0)}</TableCell>
                        <TableCell className="text-right">{money(r.entry.taxes)}</TableCell>
                        <TableCell className="text-right font-medium">{money(r.entry.net_pay)}</TableCell>
                        <TableCell className="whitespace-nowrap text-right font-semibold">
                          {showAll && !r.inThisBank
                            ? money(r.pay.amount, r.pay.code)
                            : money(r.bankAmount, bankCode)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-semibold">Total ({visible.length})</TableCell>
                      {showAll && <TableCell />}
                      <TableCell className="text-right">{money(sum((r) => r.entry.base_salary))}</TableCell>
                      <TableCell className="text-right">{money(sum((r) => r.entry.commissions))}</TableCell>
                      <TableCell className="text-right">{money(sum((r) => r.entry.bonuses))}</TableCell>
                      <TableCell className="text-right">{money(sum((r) => r.entry.finiquito ?? 0))}</TableCell>
                      <TableCell className="text-right">{money(sum((r) => r.entry.gross_pay))}</TableCell>
                      <TableCell className="text-right">{money(sum((r) => r.entry.deductions))}</TableCell>
                      <TableCell className="text-right">{money(sum((r) => r.entry.loanDeductions ?? 0))}</TableCell>
                      <TableCell className="text-right">{money(sum((r) => r.entry.taxes))}</TableCell>
                      <TableCell className="text-right font-semibold">{money(sum((r) => r.entry.net_pay))}</TableCell>
                      <TableCell className="whitespace-nowrap text-right font-semibold">
                        {showAll ? "—" : money(bankTotal, bankCode)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
