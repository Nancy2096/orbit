"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  buildPayrollBreakdownItems,
  sumBreakdown,
  type PayrollBreakdown,
  type PayrollBreakdownItem,
} from "@/lib/payroll-bank-breakdown"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"

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
  total_net: number
  entries_snapshot: SnapshotEntry[] | null
}

interface PeriodMovement {
  id: string
  amount: number
  bank_name: string
  currency_code: string
}

export interface PayrollMovementTarget {
  movementId: string
  movementDate: string | null
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
  `${new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0)} ${code || "MXN"}`

const fmtDay = (v: string) => new Date(v + "T00:00:00").toLocaleDateString("es-MX")

const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null)

export function PayrollMovementDialog({
  target,
  onOpenChange,
}: {
  target: PayrollMovementTarget | null
  onOpenChange: (open: boolean) => void
}) {
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState<PeriodInfo | null>(null)
  const [stored, setStored] = useState<PayrollBreakdown | null>(null)
  const [periodMovements, setPeriodMovements] = useState<PeriodMovement[]>([])
  const [codeById, setCodeById] = useState<Map<string, string>>(new Map())
  const [currentBankByStaff, setCurrentBankByStaff] = useState<Map<string, string | null>>(new Map())

  const movementId = target?.movementId
  const periodId = target?.periodId

  useEffect(() => {
    if (!movementId || !periodId) return
    let cancelled = false
    const supabase = createClient()
    setLoading(true)
    ;(async () => {
      const [{ data: p }, { data: currencies }, { data: mv }, { data: siblings }] = await Promise.all([
        supabase
          .from("payroll_periods")
          .select("id, period_name, start_date, end_date, status, total_net, entries_snapshot")
          .eq("id", periodId)
          .maybeSingle(),
        supabase.from("currencies").select("id, code"),
        supabase.from("bank_movements").select("breakdown").eq("id", movementId).maybeSingle(),
        supabase
          .from("bank_movements")
          .select("id, amount, bank_account:bank_accounts(bank_name, currency:currencies(code))")
          .eq("source_type", "payroll_period")
          .eq("source_id", periodId),
      ])
      const info = (p as PeriodInfo | null) ?? null
      const ids = Array.from(new Set((info?.entries_snapshot || []).map((e) => e.staff_id).filter(Boolean)))
      let bankMap = new Map<string, string | null>()
      if (ids.length > 0) {
        const { data: staffRows } = await supabase.from("staff").select("id, payroll_bank_name").in("id", ids)
        bankMap = new Map(
          (staffRows || []).map((r: { id: string; payroll_bank_name: string | null }) => [r.id, r.payroll_bank_name]),
        )
      }
      if (cancelled) return
      setPeriod(info)
      setStored(((mv as { breakdown: PayrollBreakdown | null } | null)?.breakdown as PayrollBreakdown | null) ?? null)
      setPeriodMovements(
        (siblings || []).map((m: any) => {
          const acct = one<any>(m.bank_account)
          const cur = one<any>(acct?.currency)
          return {
            id: m.id,
            amount: Number(m.amount) || 0,
            bank_name: String(acct?.bank_name || "").trim(),
            currency_code: cur?.code || "MXN",
          }
        }),
      )
      setCodeById(new Map((currencies || []).map((c: { id: string; code: string }) => [c.id, c.code])))
      setCurrentBankByStaff(bankMap)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [movementId, periodId])

  const bankCode = target?.bankCurrencyCode || "MXN"

  // Detalle guardado al registrar la salida; si el movimiento es anterior a
  // ese registro se reconstruye desde la nómina guardada del periodo.
  const { items, source } = useMemo((): { items: PayrollBreakdownItem[]; source: PayrollBreakdown["source"] | null } => {
    if (stored?.items?.length) return { items: stored.items, source: stored.source }
    if (!period?.entries_snapshot?.length || !target) return { items: [], source: null }
    const toCode = (id: string | null | undefined) => (id ? codeById.get(id) || "MXN" : "MXN")
    const bankKey = target.bankName.trim().toLowerCase()
    const inBank = period.entries_snapshot.filter(
      (e) => (e.staff?.payroll_bank_name ?? currentBankByStaff.get(e.staff_id) ?? "").trim().toLowerCase() === bankKey,
    )
    return { items: buildPayrollBreakdownItems(inBank, bankCode, toCode), source: "reconstruido" }
  }, [stored, period, target, codeById, currentBankByStaff, bankCode])

  const itemsTotal = sumBreakdown(items)
  const movementAmount = target?.movementAmount ?? 0
  const difference = Math.round((movementAmount - itemsTotal) * 100) / 100
  const hasDifference = items.length > 0 && Math.abs(difference) >= 0.01

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Integración de la salida · {target?.bankName}</DialogTitle>
          <DialogDescription>
            {period ? `${period.period_name} · ` : ""}
            {target?.movementDate ? `Salida del ${fmtDay(target.movementDate)}` : "Salida de banco por nómina"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-6 w-6" />
          </div>
        ) : !period ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No se encontró el periodo de nómina.</p>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Salida registrada en el banco</p>
                <p className="text-lg font-semibold text-red-600">{money(movementAmount, bankCode)}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Suma del detalle</p>
                <p className="text-lg font-semibold">{money(itemsTotal, bankCode)}</p>
                <p className="text-xs text-muted-foreground">{items.length} colaborador(es)</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Origen del detalle</p>
                <div className="mt-1">
                  {source === "registro" ? (
                    <Badge>Guardado al pagar</Badge>
                  ) : source === "reconstruido" ? (
                    <Badge variant="secondary">Reconstruido de la nómina</Badge>
                  ) : (
                    <Badge variant="outline">Sin detalle</Badge>
                  )}
                </div>
              </div>
            </div>

            {hasDifference && (
              <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p>
                  La salida del banco y la suma de colaboradores difieren por {money(difference, bankCode)}. Este
                  movimiento se registró antes de guardar el detalle y la nómina cambió después del pago (banco de algún
                  colaborador o montos), por lo que la diferencia no se puede asignar a una persona.
                </p>
              </div>
            )}

            {items.length === 0 ? (
              <p className="rounded-md border py-6 text-center text-sm text-muted-foreground">
                Esta salida se registró sin el detalle por colaborador y la nómina del periodo no tiene la información
                guardada, por lo que no se puede desglosar.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead className="text-right">Neto nómina</TableHead>
                      <TableHead className="text-right">Tipo de cambio</TableHead>
                      <TableHead className="text-right">Salida del banco</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((i) => (
                      <TableRow key={i.staff_id}>
                        <TableCell className="whitespace-nowrap font-medium">{i.name}</TableCell>
                        <TableCell className="whitespace-nowrap text-right">{money(i.net_pay)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {i.rate > 0 ? i.rate.toFixed(4) : "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-semibold">
                          {money(i.amount, bankCode)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {hasDifference && (
                      <TableRow className="bg-amber-50/60">
                        <TableCell colSpan={3} className="text-amber-900">
                          Diferencia sin asignar
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-semibold text-amber-900">
                          {money(difference, bankCode)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-semibold">Total salida</TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        {money(items.reduce((s, i) => s + i.net_pay, 0))}
                      </TableCell>
                      <TableCell />
                      <TableCell className="whitespace-nowrap text-right font-semibold">
                        {money(movementAmount, bankCode)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )}

            {periodMovements.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">Salidas de bancos de esta nómina</h3>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Banco</TableHead>
                        <TableHead className="text-right">Salida</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {periodMovements.map((m) => (
                        <TableRow key={m.id} className={m.id === target?.movementId ? "bg-muted/60" : undefined}>
                          <TableCell className="font-medium">{m.bank_name || "—"}</TableCell>
                          <TableCell className="whitespace-nowrap text-right">
                            {money(m.amount, m.currency_code)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground">
                  Neto total de la nómina: {money(period.total_net)} · {STATUS_LABELS[period.status] || period.status} ·{" "}
                  {fmtDay(period.start_date)} – {fmtDay(period.end_date)}
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/hr/payroll/${period.id}`}>
                  <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                  Abrir periodo de nómina
                </Link>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
