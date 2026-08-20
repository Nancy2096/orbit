import pg from "pg"
const { Client } = pg
function strip(u) { try { const x = new URL(u); x.searchParams.delete("sslmode"); return x.toString() } catch { return u } }
const c = new Client({ connectionString: strip(process.env.POSTGRES_URL_NON_POOLING), ssl: { rejectUnauthorized: false } })
await c.connect()

// 1) Catalog tables (idempotent)
await c.query(`
  create table if not exists crm_loss_reason_categories (
    id uuid primary key default gen_random_uuid(),
    agency_id uuid not null references agencies(id) on delete cascade,
    name text not null,
    sort_order integer not null default 0,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );
`)
await c.query(`
  create table if not exists crm_loss_reason_submotives (
    id uuid primary key default gen_random_uuid(),
    agency_id uuid not null references agencies(id) on delete cascade,
    category_id uuid not null references crm_loss_reason_categories(id) on delete cascade,
    name text not null,
    sort_order integer not null default 0,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );
`)
await c.query(`create index if not exists idx_loss_cat_agency on crm_loss_reason_categories(agency_id);`)
await c.query(`create index if not exists idx_loss_sub_category on crm_loss_reason_submotives(category_id);`)
await c.query(`create index if not exists idx_loss_sub_agency on crm_loss_reason_submotives(agency_id);`)

// 2) Prospect columns (idempotent)
await c.query(`alter table crm_prospects add column if not exists loss_reason_category_id uuid references crm_loss_reason_categories(id) on delete set null;`)
await c.query(`alter table crm_prospects add column if not exists loss_reason_submotive_id uuid references crm_loss_reason_submotives(id) on delete set null;`)
await c.query(`alter table crm_prospects add column if not exists loss_future_action text;`)
await c.query(`alter table crm_prospects add column if not exists loss_recontact_date date;`)
await c.query(`alter table crm_prospects add column if not exists loss_notes text;`)

// 3) Seed defaults per agency (only for agencies that have no categories yet)
const seed = [
  { name: "Precio elevado", subs: [] },
  { name: "Eligió a la competencia", subs: ["Competidor X", "Competidor Y", "Solución interna"] },
  { name: "Falta de funcionalidad / característica", subs: ["Módulo A", "Integración B", "Desempeño"] },
  { name: "Sin presupuesto disponible", subs: [] },
  { name: "Mal momento / Prioridades cambiaron", subs: [] },
  { name: "Sin respuesta / Prospecto inactivo", subs: [] },
]

const agencies = await c.query(`select id, name from agencies order by name`)
let seeded = 0
for (const ag of agencies.rows) {
  const existing = await c.query(`select count(*)::int as n from crm_loss_reason_categories where agency_id=$1`, [ag.id])
  if (existing.rows[0].n > 0) continue
  for (let i = 0; i < seed.length; i++) {
    const cat = seed[i]
    const catRes = await c.query(
      `insert into crm_loss_reason_categories (agency_id, name, sort_order) values ($1,$2,$3) returning id`,
      [ag.id, cat.name, i]
    )
    const catId = catRes.rows[0].id
    for (let j = 0; j < cat.subs.length; j++) {
      await c.query(
        `insert into crm_loss_reason_submotives (agency_id, category_id, name, sort_order) values ($1,$2,$3,$4)`,
        [ag.id, catId, cat.subs[j], j]
      )
    }
  }
  seeded++
  console.log(`Seeded loss reasons for agency: ${ag.name}`)
}

console.log(`\nDone. Agencies total: ${agencies.rows.length}, newly seeded: ${seeded}`)
await c.end()
