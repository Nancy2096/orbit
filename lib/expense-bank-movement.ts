import type { SupabaseClient } from "@supabase/supabase-js"

export const EXPENSE_MOVEMENT_SOURCE = "expense"
export const EXPENSE_MOVEMENT_CATEGORY = "gasto"

/**
 * Mantiene la salida bancaria de un gasto alineada con su estado.
 * El saldo de cada banco se calcula a partir de `bank_movements`, así que un
 * gasto pagado solo afecta al banco si tiene su movimiento de salida aquí.
 *  - Pagado con banco de salida: crea o actualiza la salida.
 *  - Cualquier otro estado: elimina la salida si existía.
 */
export async function syncExpenseBankMovement(supabase: SupabaseClient, expenseId: string) {
  const { data: expense, error } = await supabase
    .from("expenses")
    .select(
      "id, status, bank_account_id, total_amount, payment_date, expense_number, description, bank_account:bank_accounts(agency_id)",
    )
    .eq("id", expenseId)
    .maybeSingle()

  if (error) throw error

  const { data: existing } = await supabase
    .from("bank_movements")
    .select("id")
    .eq("source_type", EXPENSE_MOVEMENT_SOURCE)
    .eq("source_id", expenseId)

  const existingIds = (existing || []).map((m: { id: string }) => m.id)

  if (!expense || expense.status !== "paid" || !expense.bank_account_id) {
    if (existingIds.length > 0) {
      const { error: delError } = await supabase.from("bank_movements").delete().in("id", existingIds)
      if (delError) throw delError
    }
    return
  }

  const bank = Array.isArray(expense.bank_account) ? expense.bank_account[0] : expense.bank_account
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const movement = {
    bank_account_id: expense.bank_account_id,
    agency_id: (bank as { agency_id?: string } | null)?.agency_id ?? null,
    movement_type: "salida",
    category: EXPENSE_MOVEMENT_CATEGORY,
    amount: Math.abs(Number(expense.total_amount || 0)),
    description: `Pago de gasto ${expense.expense_number || ""} · ${expense.description || ""}`.trim(),
    reference: expense.expense_number || null,
    movement_date: String(expense.payment_date || new Date().toISOString()).slice(0, 10),
    source_type: EXPENSE_MOVEMENT_SOURCE,
    source_id: expense.id,
  }

  if (existingIds.length > 0) {
    const [keepId, ...duplicates] = existingIds
    const { error: updError } = await supabase.from("bank_movements").update(movement).eq("id", keepId)
    if (updError) throw updError
    if (duplicates.length > 0) await supabase.from("bank_movements").delete().in("id", duplicates)
    return
  }

  const { error: insError } = await supabase
    .from("bank_movements")
    .insert({ ...movement, created_by: user?.id ?? null })
  if (insError) throw insError
}
