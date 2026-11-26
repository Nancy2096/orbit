"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { Ban, CalendarCheck, ScrollText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export interface StaffPayment {
  staff_id: string
  actual_payment_date: string | null
  status: "pending" | "reconciled" | "cancelled"
  bank_movement_id: string | null
  cancelled_at: string | null
  cancel_reason: string | null
}

export interface AuditRow {
  id: string
  staff_id: string | null
  action: string
  reason: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  created_at: string
  user: { first_name: string | null; last_name: string | null; email: string | null } | null
}

export interface ReconciliationData {
  legacy: boolean
  payments: StaffPayment[]
  audit: AuditRow[]
  permissions: { editPaid: boolean; cancel: boolean }
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Error")
  return res.json()
}

export function usePayrollReconciliation(periodId: string, enabled: boolean) {
  return useSWR<ReconciliationData>(enabled ? `/api/payroll/${periodId}/reconciliation` : null, fetcher)
}

export async function postReconciliation(periodId: string, payload: Record<string, unknown>) {
  const res = await fetch(`/api/payroll/${periodId}/reconciliation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || "Error")
  return data
}

export const todayInMexico = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" })

export function ReconciliationBadge({ payment }: { payment?: StaffPayment }) {
  if (payment?.status === "cancelled") return <Badge variant="destructive">Cancelado</Badge>
  if (payment?.status === "reconciled")
    return (
      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300">
        Conciliado
      </Badge>
    )
  return <Badge variant="outline">Pendiente</Badge>
}

// Diálogo que exige un motivo (mínimo 5 caracteres) antes de confirmar.
export function ReasonDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  destructive?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => Promise<void>
}) {
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  const valid = reason.trim().length >= 5

  const submit = async () => {
    if (!valid || busy) return
    setBusy(true)
    try {
      await onConfirm(reason.trim())
      setReason("")
      onOpenChange(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason-input">Motivo</Label>
          <Textarea
            id="reason-input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe por qué se hace este cambio"
            rows={3}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground">Mínimo 5 caracteres. Queda registrado en la bitácora.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={submit} disabled={!valid || busy}>
            {busy && <Spinner className="mr-2 h-4 w-4" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Barra de conciliación: aplicar la fecha real a todos y cancelar la nómina.
export function ReconciliationToolbar({
  periodId,
  data,
  activeStaffIds,
  onChanged,
}: {
  periodId: string
  data: ReconciliationData
  activeStaffIds: string[]
  onChanged: () => void | Promise<void>
}) {
  const [date, setDate] = useState("")
  const [applying, setApplying] = useState(false)
  const [reasonOpen, setReasonOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const byStaff = new Map(data.payments.map((p) => [p.staff_id, p]))
  const targets = activeStaffIds.filter((id) => byStaff.get(id)?.status !== "cancelled")
  const reconciled = targets.filter((id) => byStaff.get(id)?.status === "reconciled").length
  const needsReason = targets.some((id) => {
    const current = byStaff.get(id)?.actual_payment_date
    return current && current !== date
  })

  const apply = async (reason?: string) => {
    setApplying(true)
    try {
      const { results } = await postReconciliation(periodId, { action: "set_date", date, staffIds: targets, reason })
      const failed = (results as { error?: string }[]).filter((r) => r.error)
      const warnings = (results as { warning?: string | null }[]).filter((r) => r.warning)
      if (failed.length > 0) toast.error(`${failed.length} colaborador(es) no se actualizaron: ${failed[0].error}`)
      else toast.success("Fecha real de pago aplicada")
      if (warnings.length > 0) toast.warning(`${warnings.length} sin cuenta bancaria: ${warnings[0].warning}`)
      await onChanged()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo aplicar la fecha")
      throw e
    } finally {
      setApplying(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarCheck className="h-4 w-4" />
          Conciliación bancaria
        </CardTitle>
        <CardDescription>
          {data.legacy
            ? "Nómina pagada con el esquema anterior (un movimiento por banco). Solo se puede cancelar completa."
            : `El movimiento bancario de cada colaborador se crea solo cuando tiene comprobante y fecha real de pago. ${reconciled} de ${targets.length} conciliados.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-3">
        {!data.legacy && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="bulk-date">Fecha real de pago</Label>
              <Input
                id="bulk-date"
                type="date"
                value={date}
                max={todayInMexico()}
                onChange={(e) => setDate(e.target.value)}
                className="w-44"
              />
            </div>
            <Button
              variant="outline"
              disabled={!date || applying || targets.length === 0}
              onClick={() => (needsReason ? setReasonOpen(true) : apply().catch(() => {}))}
            >
              {applying && <Spinner className="mr-2 h-4 w-4" />}
              Aplicar a todos
            </Button>
          </>
        )}
        {data.permissions.cancel && (
          <Button variant="destructive" className="ml-auto" onClick={() => setCancelOpen(true)}>
            <Ban className="mr-2 h-4 w-4" />
            Cancelar pago de la nómina
          </Button>
        )}
      </CardContent>

      <ReasonDialog
        open={reasonOpen}
        onOpenChange={setReasonOpen}
        title="Corregir fecha real de pago"
        description="Algunos colaboradores ya tienen otra fecha capturada. Corregirla requiere permiso y un motivo."
        confirmLabel="Aplicar"
        onConfirm={(reason) => apply(reason)}
      />
      <ReasonDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        destructive
        title="Cancelar el pago de toda la nómina"
        description="Se borran sus movimientos bancarios, se regresan los saldos de préstamos, los incentivos, bonos y comisiones vuelven a aprobados y se reabren los finiquitos. La nómina queda como Cancelada."
        confirmLabel="Cancelar nómina"
        onConfirm={async (reason) => {
          try {
            await postReconciliation(periodId, { action: "cancel_period", reason })
            toast.success("Pago de la nómina cancelado")
            await onChanged()
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "No se pudo cancelar")
            throw e
          }
        }}
      />
    </Card>
  )
}

const ACTION_LABELS: Record<string, string> = {
  payment_date_set: "Fecha real capturada",
  payment_date_corrected: "Fecha real corregida",
  reconciled: "Conciliado",
  unreconciled: "Conciliación revertida",
  entry_edited: "Renglón editado",
  staff_payment_cancelled: "Pago de colaborador cancelado",
  period_payment_cancelled: "Pago de nómina cancelado",
}

const summarize = (row: AuditRow) => {
  const b = row.before || {}
  const a = row.after || {}
  if (row.action === "payment_date_set") return `Fecha: ${a.actual_payment_date ?? ""}`
  if (row.action === "payment_date_corrected") return `${b.actual_payment_date ?? ""} → ${a.actual_payment_date ?? ""}`
  if (row.action === "reconciled") return `Monto ${a.amount ?? ""} · ${a.movement_date ?? ""}`
  if (row.action === "unreconciled") return `Se borró el movimiento de ${b.amount ?? ""}`
  if (row.action === "entry_edited") return `Neto ${b.net_pay ?? ""} → ${a.net_pay ?? ""}`
  return ""
}

export function PayrollAuditLog({ audit, staffName }: { audit: AuditRow[]; staffName: (id: string) => string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="h-5 w-5" />
          Bitácora de nómina pagada
        </CardTitle>
        <CardDescription>Fechas, conciliaciones, ediciones y cancelaciones. No se puede editar ni borrar.</CardDescription>
      </CardHeader>
      <CardContent>
        {audit.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin cambios registrados.</p>
        ) : (
          <ul className="divide-y">
            {audit.map((row) => {
              const who = row.user
                ? `${row.user.first_name ?? ""} ${row.user.last_name ?? ""}`.trim() || row.user.email
                : "—"
              const detail = summarize(row)
              return (
                <li key={row.id} className="flex flex-col gap-1 py-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{ACTION_LABELS[row.action] || row.action}</Badge>
                    {row.staff_id && <span className="font-medium">{staffName(row.staff_id)}</span>}
                    {detail && <span className="text-muted-foreground">{detail}</span>}
                  </div>
                  {row.reason && <p className="text-pretty">Motivo: {row.reason}</p>}
                  <p className="text-xs text-muted-foreground">
                    {who} ·{" "}
                    {new Date(row.created_at).toLocaleString("es-MX", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
