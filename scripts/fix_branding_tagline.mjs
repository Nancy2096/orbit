import pg from "pg"
const { Client } = pg
function strip(u) { try { const x = new URL(u); x.searchParams.delete("sslmode"); return x.toString() } catch { return u } }
const c = new Client({ connectionString: strip(process.env.POSTGRES_URL_NON_POOLING), ssl: { rejectUnauthorized: false } })
await c.connect()

const { rows } = await c.query(`select value from system_settings where key='branding'`)
const value = rows[0]?.value
if (!value) {
  console.error("[v0] No branding row found. Aborting.")
  process.exit(1)
}

const before = value.tagline
if (before !== "Sistema Integral Adminstrativo") {
  console.log(`[v0] Tagline actual: "${before}". No coincide con el typo esperado; no se aplica cambio.`)
  await c.end()
  process.exit(0)
}

value.tagline = "Sistema Integral Administrativo"
await c.query(`update system_settings set value=$1 where key='branding'`, [value])
console.log(`[v0] Tagline corregido: "${before}" -> "${value.tagline}"`)
await c.end()
