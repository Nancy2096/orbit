const fs = require("fs")
const { createClient } = require("@supabase/supabase-js")
;(async () => {
  const out = {}
  try {
    const s = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const row = await s.from("third_party_payments").select("*").limit(1)
    out.cols = row.data && row.data[0] ? Object.keys(row.data[0]) : row.error
    for (const t of ["third_party_payment_history", "third_party_status_history", "third_party_payments_history"]) {
      const r = await s.from(t).select("*").limit(1)
      out[t] = r.error ? r.error.message : r.data && r.data[0] ? Object.keys(r.data[0]) : "exists (empty)"
    }
    const paid = await s.from("third_party_payments").select("id", { count: "exact", head: true }).eq("status", "paid")
    out.paidCount = paid.count
    const exp = await s.from("expenses").select("id, expense_number, payment_date").eq("status", "paid").limit(5000)
    const mov = await s.from("bank_movements").select("source_id, movement_date").eq("source_type", "expense").limit(5000)
    const byId = new Map((mov.data || []).map((m) => [m.source_id, m.movement_date]))
    out.expensePaid = (exp.data || []).length
    out.withMovement = (exp.data || []).filter((e) => byId.has(e.id)).length
    out.mismatch = (exp.data || [])
      .filter((e) => byId.has(e.id) && String(byId.get(e.id)).slice(0, 10) !== String(e.payment_date || "").slice(0, 10))
      .map((e) => ({ n: e.expense_number, pd: e.payment_date, md: byId.get(e.id) }))
  } catch (e) {
    out.error = String(e && e.message)
  } finally {
    fs.writeFileSync("/tmp/q.json", JSON.stringify(out, null, 1))
  }
})()
