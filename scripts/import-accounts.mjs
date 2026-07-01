import { readFileSync } from "fs"
import { createClient } from "@supabase/supabase-js"

const DRY_RUN = process.argv.includes("--dry-run")
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error("Missing Supabase env vars")
const supabase = createClient(url, key, { auth: { persistSession: false } })

const rows = JSON.parse(readFileSync("/tmp/accounts_rows.json", "utf8"))

const norm = (s) => String(s ?? "").toLowerCase().replace(/\s+/g, " ").trim()
const compact = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")

// Fetch lookups
const [{ data: agencies }, { data: currencies }, { data: clients }, { data: staff }, { data: banks }] =
  await Promise.all([
    supabase.from("agencies").select("id, name"),
    supabase.from("currencies").select("id, code"),
    supabase.from("clients").select("id, company_name, tax_id, agency_id"),
    supabase.from("staff").select("id, email"),
    supabase.from("bank_accounts").select("id, account_name, agency_id"),
  ])

const agencyByName = new Map(agencies.map((a) => [norm(a.name), a.id]))
const currencyByCode = new Map(currencies.map((c) => [norm(c.code), c.id]))
// Alias: "MXP" es el código antiguo del peso mexicano; en la BD está como "MXN".
if (currencyByCode.has("mxn")) currencyByCode.set("mxp", currencyByCode.get("mxn"))
const staffByEmail = new Map(staff.filter((s) => s.email).map((s) => [norm(s.email), s.id]))

const clientByNameAgency = new Map()
const clientByNameGlobal = new Map()
const clientByCompactGlobal = new Map()
const clientByTax = new Map()
for (const c of clients) {
  clientByNameAgency.set(`${c.agency_id}:${norm(c.company_name)}`, c.id)
  if (!clientByNameGlobal.has(norm(c.company_name))) clientByNameGlobal.set(norm(c.company_name), c.id)
  if (!clientByCompactGlobal.has(compact(c.company_name))) clientByCompactGlobal.set(compact(c.company_name), c.id)
  if (c.tax_id) clientByTax.set(String(c.tax_id).toUpperCase(), c.id)
}
const bankByNameAgency = new Map()
const bankByNameGlobal = new Map()
for (const b of banks) {
  bankByNameAgency.set(`${b.agency_id}:${norm(b.account_name)}`, b.id)
  if (!bankByNameGlobal.has(norm(b.account_name))) bankByNameGlobal.set(norm(b.account_name), b.id)
}

const resolveClient = (agencyId, name, tax) =>
  (agencyId && clientByNameAgency.get(`${agencyId}:${norm(name)}`)) ||
  clientByNameGlobal.get(norm(name)) ||
  (tax ? clientByTax.get(String(tax).toUpperCase()) : undefined) ||
  clientByCompactGlobal.get(compact(name))

const roleMap = {
  account_manager_email: "account_manager_id",
  sales_advisor_email: "sales_advisor_id",
  tech_manager_email: "tech_manager_id",
  tech_coordinator_email: "tech_coordinator_id",
  strategy_manager_email: "strategy_manager_id",
  strategy_coordinator_email: "strategy_coordinator_id",
  creative_manager_email: "creative_manager_id",
  creative_coordinator_email: "creative_coordinator_id",
}

const toNum = (v) => {
  if (v === undefined || v === null || String(v).trim() === "") return null
  const n = Number(String(v).replace(/[^0-9.\-]/g, ""))
  return Number.isFinite(n) ? n : null
}
const toDate = (v) => {
  if (!v) return null
  const s = String(v).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const d = new Date(s)
  return isNaN(d) ? null : d.toISOString().slice(0, 10)
}

const warnings = []
const records = []
rows.forEach((r, idx) => {
  const line = idx + 2
  const agencyId = agencyByName.get(norm(r.agency_name))
  if (!agencyId) { warnings.push(`Fila ${line}: agencia no encontrada "${r.agency_name}"`); return }
  const clientId = resolveClient(agencyId, r.client_company_name, r.client_tax_id)
  if (!clientId) { warnings.push(`Fila ${line}: cliente no encontrado "${r.client_company_name}"`); return }
  if (!r.account_name) { warnings.push(`Fila ${line}: falta account_name`); return }

  const rec = {
    agency_id: agencyId,
    client_id: clientId,
    account_name: r.account_name,
    account_code: r.account_code || null,
    account_type: ["project", "retainer", "mixed"].includes(norm(r.account_type)) ? norm(r.account_type) : "project",
    status: ["active", "inactive", "on_hold", "closed"].includes(norm(r.status)) ? norm(r.status) : "active",
    retainer_amount: toNum(r.retainer_amount),
    payment_terms: toNum(r.payment_terms) ?? 30,
    discount_percentage: toNum(r.discount_percentage) ?? 0,
    notes: r.notes || null,
    contract_start_date: toDate(r.contract_start_date),
    contract_end_date: toDate(r.contract_end_date),
  }

  if (r.currency_code) {
    const cid = currencyByCode.get(norm(r.currency_code))
    if (cid) rec.retainer_currency_id = cid
    else warnings.push(`Fila ${line}: moneda no encontrada "${r.currency_code}" (se omite)`)
  }
  if (r.bank_account_name) {
    const bid = bankByNameAgency.get(`${agencyId}:${norm(r.bank_account_name)}`) || bankByNameGlobal.get(norm(r.bank_account_name))
    if (bid) rec.bank_account_id = bid
    else warnings.push(`Fila ${line}: banco no encontrado "${r.bank_account_name}" (se omite)`)
  }
  for (const [emailKey, idCol] of Object.entries(roleMap)) {
    const email = r[emailKey]
    if (!email) continue
    const sid = staffByEmail.get(norm(email))
    if (sid) rec[idCol] = sid
    else warnings.push(`Fila ${line}: staff no encontrado "${email}" para ${idCol} (se omite)`)
  }
  records.push({ line, rec })
})

console.log(`\n=== RESUMEN ===`)
console.log(`Filas en archivo: ${rows.length}`)
console.log(`Registros listos para insertar: ${records.length}`)
console.log(`Advertencias: ${warnings.length}`)
if (warnings.length) console.log("\n--- ADVERTENCIAS ---\n" + warnings.join("\n"))

if (DRY_RUN) {
  console.log("\n[DRY RUN] No se insertó nada. Ejemplo de registro:")
  console.log(JSON.stringify(records[0]?.rec, null, 2))
  process.exit(0)
}

// Insert (skip duplicates by account_code within agency, or account_name+client)
let inserted = 0, skipped = 0, failed = 0
for (const { line, rec } of records) {
  let dupQ = supabase.from("accounts").select("id").eq("agency_id", rec.agency_id)
  if (rec.account_code) dupQ = dupQ.eq("account_code", rec.account_code)
  else dupQ = dupQ.eq("client_id", rec.client_id).eq("account_name", rec.account_name)
  const { data: existing } = await dupQ.limit(1)
  if (existing && existing.length) { skipped++; continue }

  const { error } = await supabase.from("accounts").insert(rec)
  if (error) { failed++; console.log(`Fila ${line} ERROR: ${error.message}`) }
  else inserted++
}
console.log(`\n=== INSERCIÓN COMPLETA ===`)
console.log(`Insertados: ${inserted} | Omitidos (duplicados): ${skipped} | Fallidos: ${failed}`)
