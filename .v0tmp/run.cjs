const fs = require("fs")
const { Client } = require("pg")
;(async () => {
  const c = new Client({ connectionString: process.env.POSTGRES_URL_NON_POOLING.replace(/[?&]sslmode=[^&]*/, ""), ssl: { rejectUnauthorized: false } })
  await c.connect()
  c.on("notice", (n) => console.log("NOTICE:", n.message))
  const arg = process.argv[2]
  const sql = fs.existsSync(arg) ? fs.readFileSync(arg, "utf8") : process.argv.slice(2).join(" ")
  const readOnly = process.env.RO === "1"
  if (readOnly) await c.query("SET default_transaction_read_only = on")
  const parts = fs.existsSync(arg) ? [sql] : sql.split(";;")
  for (const q of parts) {
    if (!q.trim()) continue
    const r = await c.query(q)
    const rows = Array.isArray(r) ? r.map((x) => x.rows).filter((x) => x && x.length) : r.rows
    console.log("---", q.trim().slice(0, 80).replace(/\s+/g, " "))
    console.log(JSON.stringify(rows, null, 0).replace(/},{/g, "},\n{"))
  }
  await c.end()
})().catch((e) => { console.error("ERROR:", e.message, e.where || ""); process.exit(1) })
