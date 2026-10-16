/**
 * Idempotent migration: link invoices and expenses to the "Pago por cuenta de
 * cliente" (third_party_payments) record that generated them.
 *
 * - Adds invoices.third_party_payment_id and expenses.third_party_payment_id.
 * - Backfills existing invoices via third_party_payments.invoice_id and existing
 *   expenses via the "Referencia: <payment_number>" line stored in notes.
 *
 * Run with:
 *   node --env-file-if-exists=/vercel/share/.env.project scripts/add_third_party_flag.mjs
 */
import pg from "pg"

const raw = process.env.POSTGRES_URL_NON_POOLING
if (!raw) {
  console.error("[v0] POSTGRES_URL_NON_POOLING is not set. Aborting.")
  process.exit(1)
}
const url = new URL(raw)
url.searchParams.delete("sslmode")

const client = new pg.Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } })

await client.connect()
try {
  await client.query("begin")
  for (const table of ["invoices", "expenses"]) {
    await client.query(`
      alter table public.${table}
      add column if not exists third_party_payment_id uuid
        references public.third_party_payments(id) on delete set null
    `)
    await client.query(
      `create index if not exists ${table}_third_party_payment_id_idx on public.${table}(third_party_payment_id)`,
    )
  }

  const inv = await client.query(`
    update public.invoices i
    set third_party_payment_id = t.id
    from public.third_party_payments t
    where t.invoice_id = i.id and i.third_party_payment_id is null
  `)
  const exp = await client.query(`
    update public.expenses e
    set third_party_payment_id = t.id
    from public.third_party_payments t
    where e.third_party_payment_id is null
      and e.notes ilike '%Referencia: ' || t.payment_number || '%'
  `)
  await client.query("commit")
  console.log(`[v0] Backfilled invoices: ${inv.rowCount}, expenses: ${exp.rowCount}`)
} catch (err) {
  await client.query("rollback")
  console.error("[v0] Migration failed:", err)
  process.exit(1)
} finally {
  await client.end()
}
