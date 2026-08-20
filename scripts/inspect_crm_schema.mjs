import pg from "pg"
const { Client } = pg
function strip(u){try{const x=new URL(u);x.searchParams.delete("sslmode");return x.toString()}catch{return u}}
const c = new Client({ connectionString: strip(process.env.POSTGRES_URL_NON_POOLING), ssl: { rejectUnauthorized: false } })
await c.connect()

// Columns of crm_prospects
const cols = await c.query(`select column_name, data_type from information_schema.columns
  where table_schema='public' and table_name='crm_prospects' order by ordinal_position`)
console.log("crm_prospects columns:\n", cols.rows.map(r => `${r.column_name} (${r.data_type})`).join("\n "))

// crm_tasks columns
const t = await c.query(`select column_name, data_type from information_schema.columns
  where table_schema='public' and table_name='crm_tasks' order by ordinal_position`)
console.log("\ncrm_tasks columns:\n", t.rows.map(r => `${r.column_name} (${r.data_type})`).join("\n "))

// Any existing loss reason tables
const tbls = await c.query(`select table_name from information_schema.tables
  where table_schema='public' and (table_name ilike '%loss%' or table_name ilike '%razon%' or table_name ilike '%reason%') order by table_name`)
console.log("\nloss/reason tables:", tbls.rows.map(r => r.table_name))

await c.end()
