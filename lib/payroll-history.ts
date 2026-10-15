import { mutate } from "swr"
import type { createClient } from "@/lib/supabase/client"

type SupabaseBrowserClient = ReturnType<typeof createClient>

export type PayrollHistoryAction =
  | "period_created"
  | "period_edited"
  | "config_updated"
  | "calculated"
  | "modify_enabled"
  | "entry_edited"
  | "approved"
  | "paid"
  | "usd_corrected"
  | "receipt_attached"
  | "receipt_removed"
  | "note_added"
  | "note_edited"
  | "note_deleted"
  | "exported"

export const payrollHistoryKey = (periodId: string) => ["payroll-history", periodId] as const

/**
 * Registra un movimiento en el histórico de la nómina. El usuario (auth.uid())
 * y la fecha/hora los asigna la base de datos. Nunca interrumpe la acción
 * principal: si falla, solo se reporta en consola.
 */
export async function logPayrollHistory(
  supabase: SupabaseBrowserClient,
  periodId: string,
  action: PayrollHistoryAction,
  description: string,
  details?: Record<string, unknown>,
) {
  const { error } = await supabase.from("payroll_history").insert({
    payroll_period_id: periodId,
    action,
    description,
    details: details ?? null,
  })
  if (error) {
    console.error("Error logging payroll history:", error)
    return
  }
  mutate(payrollHistoryKey(periodId))
}
