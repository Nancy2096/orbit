import { NextRequest, NextResponse } from "next/server"
import {
  getPayrollActor,
  getPaidPayrollPermissions,
  loadPeriod,
  syncStaffMovement,
  type SnapshotEntry,
} from "@/lib/payroll-reconciliation-server"

export const runtime = "nodejs"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v)
const cleanReason = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 1000) : "")
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUuid(id)) return bad("Nómina inválida")
  const actor = await getPayrollActor()
  if (!actor) return bad("No autorizado", 401)
  const { service } = actor

  const [legacy, payments, audit, permissions] = await Promise.all([
    service.rpc("payroll_is_legacy", { p_period: id }),
    service
      .from("payroll_staff_payments")
      .select("staff_id, actual_payment_date, status, bank_movement_id, cancelled_at, cancel_reason")
      .eq("period_id", id),
    service
      .from("payroll_audit_log")
      .select("id, staff_id, action, reason, before, after, created_at, user:users(first_name, last_name, email)")
      .eq("period_id", id)
      .order("created_at", { ascending: false })
      .limit(300),
    getPaidPayrollPermissions(service, actor.userId),
  ])
  if (payments.error) return bad(payments.error.message, 500)

  return NextResponse.json({
    legacy: legacy.data === true,
    payments: payments.data ?? [],
    audit: audit.data ?? [],
    permissions,
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUuid(id)) return bad("Nómina inválida")
  const actor = await getPayrollActor()
  if (!actor) return bad("No autorizado", 401)
  const { service, userId } = actor

  const body = await req.json().catch(() => null)
  const action = typeof body?.action === "string" ? body.action : ""

  const period = await loadPeriod(service, id)
  if (!period) return bad("Nómina no encontrada", 404)

  try {
    switch (action) {
      // Recalcula el movimiento de un colaborador tras subir o quitar su comprobante.
      case "sync": {
        if (!isUuid(body.staffId)) return bad("Colaborador inválido")
        if (period.status !== "paid") return NextResponse.json({ skipped: true })
        const { data: legacy } = await service.rpc("payroll_is_legacy", { p_period: id })
        if (legacy === true) return NextResponse.json({ skipped: true })
        const result = await syncStaffMovement(service, period, body.staffId, userId)
        return NextResponse.json(result)
      }

      // Captura o corrige la fecha real de pago de uno o varios colaboradores.
      case "set_date": {
        const date = typeof body.date === "string" ? body.date : ""
        if (!DATE_RE.test(date) || Number.isNaN(Date.parse(date))) return bad("Fecha inválida")
        const staffIds: string[] = Array.isArray(body.staffIds) ? body.staffIds.filter(isUuid).slice(0, 500) : []
        if (staffIds.length === 0) return bad("Sin colaboradores")
        const reason = cleanReason(body.reason) || null
        const active = new Set(
          (period.entries_snapshot || []).filter((e) => !e.payment_cancelled).map((e) => e.staff_id),
        )
        const results: { staffId: string; status?: string; warning?: string | null; error?: string }[] = []
        for (const staffId of staffIds) {
          if (!active.has(staffId)) continue
          try {
            const r = await syncStaffMovement(service, period, staffId, userId, { paymentDate: date, reason })
            results.push({ staffId, status: r.status, warning: r.warning })
          } catch (e) {
            results.push({ staffId, error: e instanceof Error ? e.message : "Error" })
          }
        }
        return NextResponse.json({ results })
      }

      // Edita el renglón de un colaborador en una nómina pagada (montos recalculados aquí).
      case "edit_entry": {
        if (!isUuid(body.staffId)) return bad("Colaborador inválido")
        const reason = cleanReason(body.reason)
        if (reason.length < 5) return bad("El motivo debe tener al menos 5 caracteres")
        const old = (period.entries_snapshot || []).find((e) => e.staff_id === body.staffId)
        if (!old) return bad("El colaborador no está en esta nómina")

        const num = (v: unknown) => {
          const n = Number(v)
          return Number.isFinite(n) && n >= 0 && n < 1e9 ? Math.round(n * 100) / 100 : null
        }
        const v = body.values || {}
        const base = num(v.base_salary)
        const bonuses = num(v.bonuses)
        const commissions = num(v.commissions)
        const deductions = num(v.deductions)
        if ([base, bonuses, commissions, deductions].some((n) => n === null)) return bad("Montos inválidos")

        const cfg = period.tax_config || {}
        const rate = ((cfg.taxRate ?? 10) + (cfg.imssRate ?? 3) + (cfg.isrRate ?? 0)) / 100
        const gross = base! + bonuses! + commissions! + (Number(old.finiquito) || 0)
        const taxes = Math.round(gross * rate * 100) / 100
        const net = Math.round((gross - deductions! - (Number(old.loanDeductions) || 0) - taxes) * 100) / 100
        const newEntry: SnapshotEntry = {
          ...old,
          base_salary: base!,
          bonuses: bonuses!,
          commissions: commissions!,
          deductions: deductions!,
          gross_pay: gross,
          taxes,
          net_pay: net,
          paid_amount: null,
          paid_currency_code: null,
        }

        const { error } = await service.rpc("payroll_edit_paid_entry", {
          p_period: id,
          p_staff: body.staffId,
          p_new_entry: newEntry,
          p_reason: reason,
          p_user: userId,
        })
        if (error) return bad(error.message)

        const refreshed = await loadPeriod(service, id)
        const sync = refreshed ? await syncStaffMovement(service, refreshed, body.staffId, userId) : null
        return NextResponse.json({ entry: newEntry, sync })
      }

      case "cancel_staff": {
        if (!isUuid(body.staffId)) return bad("Colaborador inválido")
        const reason = cleanReason(body.reason)
        if (reason.length < 5) return bad("El motivo debe tener al menos 5 caracteres")
        const { data, error } = await service.rpc("payroll_cancel_staff_payment", {
          p_period: id,
          p_staff: body.staffId,
          p_reason: reason,
          p_user: userId,
        })
        if (error) return bad(error.message)
        return NextResponse.json({ released: data })
      }

      case "cancel_period": {
        const reason = cleanReason(body.reason)
        if (reason.length < 5) return bad("El motivo debe tener al menos 5 caracteres")
        const { error } = await service.rpc("payroll_cancel_period_payment", {
          p_period: id,
          p_reason: reason,
          p_user: userId,
        })
        if (error) return bad(error.message)
        return NextResponse.json({ ok: true })
      }

      default:
        return bad("Acción no válida")
    }
  } catch (e) {
    return bad(e instanceof Error ? e.message : "Error inesperado", 500)
  }
}
