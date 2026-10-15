/**
 * Idempotent migration: payroll_history (audit log for payroll periods).
 *
 * - Append-only: RLS allows SELECT and INSERT only; no UPDATE/DELETE policies.
 * - user_id defaults to auth.uid() and is forced to match it on insert, so the
 *   actor cannot be spoofed from the client.
 * - created_at is set by the database (server time).
 *
 * Run with:
 *   node --env-file-if-exists=/vercel/share/.env.project scripts/create_payroll_history.mjs
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
  await client.query(`
    create table if not exists public.payroll_history (
      id uuid primary key default gen_random_uuid(),
      payroll_period_id uuid not null references public.payroll_periods(id) on delete cascade,
      action text not null,
      description text not null,
      details jsonb,
      user_id uuid default auth.uid() references public.users(id) on delete set null,
      created_at timestamptz not null default now()
    )
  `)
  await client.query(`
    create index if not exists payroll_history_period_created_idx
      on public.payroll_history (payroll_period_id, created_at desc)
  `)
  await client.query(`alter table public.payroll_history enable row level security`)
  await client.query(`drop policy if exists payroll_history_select on public.payroll_history`)
  await client.query(`drop policy if exists payroll_history_insert on public.payroll_history`)
  await client.query(`
    create policy payroll_history_select on public.payroll_history
      for select to authenticated using (true)
  `)
  await client.query(`
    create policy payroll_history_insert on public.payroll_history
      for insert to authenticated with check (user_id = auth.uid())
  `)
  await client.query("commit")
  const { rows } = await client.query(
    `select polname, polcmd from pg_policy where polrelid = 'public.payroll_history'::regclass`,
  )
  console.log("[v0] payroll_history ready. Policies:", JSON.stringify(rows))
} catch (error) {
  await client.query("rollback")
  console.error("[v0] Migration failed:", error.message)
  process.exitCode = 1
} finally {
  await client.end()
}
