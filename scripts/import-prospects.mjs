import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"

const DRY_RUN = process.argv.includes("--dry-run")
const AGENCY_ID = "aba32668-2ef8-4233-b89c-2f02f84659c2" // Agency 4 Real Estate (A4R)

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const rows = JSON.parse(readFileSync("/tmp/prospects_clean.json", "utf8"))

// ---- Normalizadores ----
const stripAccents = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
const norm = (s) => stripAccents(String(s ?? "").toLowerCase()).replace(/[_\s]+/g, " ").trim()

// ---- Lookups (resueltos con las consultas previas) ----
// Etapas: se prefiere la de A4R; los nombres se normalizan sin acentos.
const stageMap = new Map([
  ["propuesta enviada", "eb957e79-40da-4094-8f05-0251b93cecb9"],
  ["enviada", "eb957e79-40da-4094-8f05-0251b93cecb9"],
  ["intento de contacto", "6c41ed58-c6a4-492f-b7ca-2d8620571c14"],
  ["prospecto", "260c412f-5e95-42b5-9910-8759f8ca5815"],
  ["ganada", "21bc817c-0c4c-49ef-b797-981f77805ce7"],
  ["ganado", "21bc817c-0c4c-49ef-b797-981f77805ce7"],
  ["negociacion", "1119f974-7e61-46b0-84fe-d3352c4f4211"],
  ["cita agendada", "0d3834d5-a596-4518-97dd-159bed78e1a6"],
  ["en seguimiento", "c00be1eb-bcea-429e-9280-4107f3e3a9d2"],
  ["no interesado", "5502f523-c39c-474a-9a0a-8b7ee759fff0"],
  ["no contactado", "bdfce30f-7c2a-4cc3-a301-66bb175bd871"],
  ["perdido", "1d40e6c8-9f01-49ce-9d2c-e48d2a5a5550"],
])

const sourceMap = new Map([
  ["instagram", "8d1c19b8-087c-4023-a3b8-f226a8a9ad4b"],
  ["facebook", "a6e6699c-0184-45ef-bad6-9f690a16c26d"],
  ["sitio web", "5cd065ba-a4bb-4ac4-8be7-1de150c226d7"],
  ["chatgpt", "4f8f0037-209c-4dfb-a7db-4cc561d15ed6"],
  ["referido", "aa43a022-706b-4927-81ff-42bc7f30cb79"],
  ["referidos", "aa43a022-706b-4927-81ff-42bc7f30cb79"],
  ["whatsapp", "d47dbedd-0ae6-43fe-a8bb-96fb2b3ed518"],
])

const currencyMap = new Map([
  ["mxn", "206e16f8-8c03-445f-a1b7-8049375abca8"],
  ["usd", "3f830714-fa0a-45a8-a828-5f1d7e761a8f"],
])

const staffMap = new Map([
  ["paulinam@agency4realestate.com", "9eb76d7c-e9e4-4fde-b21a-7125d587f9b6"],
  ["heidy.bernal@agency4realestate.com", "0196feab-ea27-4577-97e9-65777425fb2f"],
])

const statusMap = new Map([
  ["activo", "active"],
  ["active", "active"],
  ["perdido", "lost"],
  ["lost", "lost"],
  ["ganado", "won"],
  ["ganada", "won"],
  ["won", "won"],
])

// Convierte serial de Excel (días desde 1899-12-30) a fecha ISO YYYY-MM-DD.
function excelToISO(v) {
  const n = Number(v)
  if (!isFinite(n) || n <= 0) return null
  const ms = Math.round((n - 25569) * 86400 * 1000)
  const d = new Date(ms)
  if (isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

// Parsea el valor estimado. Puede venir como número o como rango de texto
// ("450 a 600", "Más de 1,000", con sufijo "usd" y variantes con guiones bajos).
// Devuelve un número representativo (punto medio del rango) o null.
function parseEstimatedValue(raw) {
  if (raw === undefined || raw === null || raw === "") return null
  const s = norm(raw)
  // número directo
  const direct = Number(String(raw).replace(/,/g, ""))
  if (isFinite(direct) && /^[\d.,]+$/.test(String(raw).trim())) return direct
  // extrae todos los números del texto
  const nums = (s.match(/[\d,]+/g) || []).map((x) => Number(x.replace(/,/g, ""))).filter((x) => isFinite(x))
  if (nums.length === 0) return null
  if (/mas de/.test(s)) return nums[nums.length - 1]
  if (nums.length >= 2) return Math.round((nums[0] + nums[1]) / 2)
  return nums[0]
}

// Límites de longitud (varchar) en crm_prospects. Se truncan para evitar overflow.
const maxLen = {
  status: 20,
  contact_phone: 50,
  state_province: 100,
  country: 100,
  contact_position: 100,
  company_name: 255,
  contact_name: 255,
  contact_email: 255,
  social_instagram: 500,
  social_linkedin: 500,
  social_twitter: 500,
  social_facebook: 500,
  website: 500,
}
const clamp = (rec) => {
  for (const [k, len] of Object.entries(maxLen)) {
    if (typeof rec[k] === "string" && rec[k].length > len) rec[k] = rec[k].slice(0, len)
  }
  return rec
}

const warnings = []
const skipped = []
const records = []

for (let i = 0; i < rows.length; i++) {
  const r = rows[i]
  const line = i + 1
  const contactName = String(r.contact_name ?? "").trim()
  if (!contactName) {
    skipped.push({ line, reason: "sin contact_name" })
    continue
  }

  const rec = {
    agency_id: AGENCY_ID,
    contact_name: contactName,
    company_name: r.company_name ? String(r.company_name).trim() : null,
    contact_email: r.contact_email ? String(r.contact_email).trim() : null,
    contact_phone: r.contact_phone ? String(r.contact_phone).trim() : null,
    contact_position: r.contact_position ? String(r.contact_position).trim() : null,
    status: "active",
  }

  // Etapa
  if (r.stage_name) {
    const id = stageMap.get(norm(r.stage_name))
    if (id) rec.stage_id = id
    else warnings.push(`Línea ${line}: etapa no encontrada "${r.stage_name}"`)
  }
  // Fuente
  if (r.source_name) {
    const id = sourceMap.get(norm(r.source_name))
    if (id) rec.source_id = id
    else warnings.push(`Línea ${line}: fuente no encontrada "${r.source_name}"`)
  }
  // Moneda (default MXN)
  const curId = currencyMap.get(norm(r.currency_code || "MXN"))
  rec.currency_id = curId || currencyMap.get("mxn")
  // Ejecutivo asignado
  if (r.assigned_to_email) {
    const id = staffMap.get(String(r.assigned_to_email).toLowerCase().trim())
    if (id) rec.assigned_to = id
    else warnings.push(`Línea ${line}: staff no encontrado "${r.assigned_to_email}"`)
  }
  // Estado
  if (r.status) {
    const st = statusMap.get(norm(r.status))
    if (st) rec.status = st
    else warnings.push(`Línea ${line}: estado desconocido "${r.status}" (se usa active)`)
  }
  // Probabilidad
  if (r.probability !== undefined && r.probability !== "") {
    const p = Math.round(Number(r.probability))
    if (isFinite(p)) rec.probability = Math.max(0, Math.min(100, p))
  }
  // Fecha esperada de cierre
  if (r.expected_close_date) {
    const iso = excelToISO(r.expected_close_date)
    if (iso) rec.expected_close_date = iso
  }
  // Valor estimado (+ preservar texto original en notes)
  const notesParts = []
  if (r.estimated_value !== undefined && r.estimated_value !== "") {
    const val = parseEstimatedValue(r.estimated_value)
    if (val !== null) rec.estimated_value = val
    if (isNaN(Number(String(r.estimated_value).replace(/,/g, ""))))
      notesParts.push(`Valor estimado (texto): ${r.estimated_value}`)
  }
  if (r.description) rec.description = String(r.description).trim()
  if (r.lost_reason) rec.lost_reason = String(r.lost_reason).trim()
  if (r.notes) notesParts.push(String(r.notes).trim())
  if (notesParts.length) rec.notes = notesParts.join(" | ")

  records.push(clamp(rec))
}

console.log("=== RESUMEN PROSPECTOS ===")
console.log("Filas en archivo:", rows.length)
console.log("Registros listos:", records.length)
console.log("Omitidos:", skipped.length, JSON.stringify(skipped.slice(0, 10)))
console.log("Advertencias:", warnings.length)
warnings.slice(0, 30).forEach((w) => console.log("  -", w))
console.log("EJEMPLO REGISTRO 0:", JSON.stringify(records[0], null, 2))

if (DRY_RUN) {
  console.log("\n(DRY RUN — no se insertó nada)")
  process.exit(0)
}

// Inserción por lotes. SKIP permite reanudar sin duplicar lo ya insertado.
const skipArg = process.argv.find((a) => a.startsWith("--skip="))
const SKIP = skipArg ? Number(skipArg.split("=")[1]) : 0
let inserted = 0
const batchSize = 100
for (let i = SKIP; i < records.length; i += batchSize) {
  const batch = records.slice(i, i + batchSize)
  const { data, error } = await supabase.from("crm_prospects").insert(batch).select("id")
  if (error) {
    console.error(`ERROR en lote ${i / batchSize + 1}:`, error.message)
    process.exit(1)
  }
  inserted += data.length
  console.log(`Lote ${i / batchSize + 1}: insertados ${data.length} (acumulado ${inserted})`)
}
console.log("\nINSERCIÓN COMPLETA. Total insertados:", inserted)
