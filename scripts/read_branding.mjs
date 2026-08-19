import pg from "pg"
const { Client } = pg
function strip(u) { try { const x = new URL(u); x.searchParams.delete("sslmode"); return x.toString() } catch { return u } }
const c = new Client({ connectionString: strip(process.env.POSTGRES_URL_NON_POOLING), ssl: { rejectUnauthorized: false } })
await c.connect()
const r = await c.query(`select value from system_settings where key='branding'`)
console.log(JSON.stringify(r.rows[0]?.value ?? null, null, 2))
await c.end()
