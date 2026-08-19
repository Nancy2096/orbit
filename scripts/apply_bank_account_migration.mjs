/**
 * Idempotent migration runner for bank_account_id on accounts & projects.
 *
 * - Connects via POSTGRES_URL_NON_POOLING (direct, non-pooled — required for DDL).
 * - Verifies current state first, then applies ONLY the missing pieces.
 * - Safe to run multiple times.
 *
 * Run with:
 *   node --env-file-if-exists=/vercel/share/.env.project scripts/apply_bank_account_migration.mjs
 */
import pg from "pg"

const { Client } = pg

const rawConnectionString = process.env.POSTGRES_URL_NON_POOLING
if (!rawConnectionString) {
  console.error("[v0] POSTGRES_URL_NON_POOLING is not set. Aborting.")
  process.exit(1)
}

// Strip sslmode from the URL so it can't override our ssl config below.
// (Newer pg maps sslmode=require to verify-full, which rejects self-signed chains.)
function stripSslMode(url) {
  try {
    const u = new URL(url)
    u.searchParams.delete("sslmode")
    return u.toString()
  } catch {
    return url
  }
}

const client = new Client({
  connectionString: stripSslMode(rawConnectionString),
  ssl: { rejectUnauthorized: false },
})

async function columnExists(table, column) {
  const { rows } = await client.query(
    `select 1 from information_schema.columns
     where table_schema = 'public' and table_name = $1 and column_name = $2`,
    [table, column],
  )
  return rows.length > 0
}

async function tableExists(table) {
  const { rows } = await client.query(
    `select 1 from information_schema.tables
     where table_schema = 'public' and table_name = $1`,
    [table],
  )
  return rows.length > 0
}

async function indexExists(index) {
  const { rows } = await client.query(
    `select 1 from pg_indexes where schemaname = 'public' and indexname = $1`,
    [index],
  )
  return rows.length > 0
}

async function main() {
  await client.connect()
  console.log("[v0] Connected to database (non-pooling).")

  // 1) Verify prerequisite table for the FK.
  const hasBankAccounts = await tableExists("bank_accounts")
  console.log(`[v0] bank_accounts table exists: ${hasBankAccounts}`)

  const targets = ["accounts", "projects"]

  for (const table of targets) {
    const exists = await tableExists(table)
    if (!exists) {
      console.log(`[v0] SKIP: table "${table}" does not exist.`)
      continue
    }

    // 2) Add column if missing.
    const hasColumn = await columnExists(table, "bank_account_id")
    if (hasColumn) {
      console.log(`[v0] OK: ${table}.bank_account_id already exists — nothing to add.`)
    } else {
      const fk = hasBankAccounts
        ? " REFERENCES bank_accounts(id) ON DELETE SET NULL"
        : ""
      await client.query(
        `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS bank_account_id UUID${fk};`,
      )
      console.log(
        `[v0] ADDED: ${table}.bank_account_id${hasBankAccounts ? " (with FK to bank_accounts)" : " (no FK — bank_accounts missing)"}.`,
      )
    }

    // 3) Create index if missing.
    const indexName = `idx_${table}_bank_account_id`
    if (await indexExists(indexName)) {
      console.log(`[v0] OK: index ${indexName} already exists.`)
    } else {
      await client.query(
        `CREATE INDEX IF NOT EXISTS ${indexName} ON ${table}(bank_account_id);`,
      )
      console.log(`[v0] ADDED: index ${indexName}.`)
    }
  }

  console.log("[v0] Migration complete.")
  await client.end()
}

main().catch(async (err) => {
  console.error("[v0] Migration failed:", err.message)
  try {
    await client.end()
  } catch {}
  process.exit(1)
})
