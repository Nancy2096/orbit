/**
 * Idempotent migration: finance_history (audit log for pre-invoices, invoices,
 * third-party payments and expenses).
 *
 * - Rows are written by database triggers (SECURITY DEFINER), so every change is
 *   captured regardless of which screen or API performed it.
 * - The actor is auth.uid() of the request; the timestamp is server time.
 * - Append-only for clients: RLS allows SELECT only.
 * - Existing records get a reconstructed history (details.backfilled = true).
 *
 * Run with:
 *   node --env-file-if-exists=/vercel/share/.env.project scripts/create_finance_history.mjs
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

const SQL = `
create table if not exists public.finance_history (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('pre_invoice','invoice','third_party_payment','expense')),
  entity_id uuid not null,
  action text not null,
  description text not null,
  details jsonb,
  user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists finance_history_entity_idx
  on public.finance_history (entity_type, entity_id, created_at desc);

alter table public.finance_history enable row level security;
drop policy if exists finance_history_select on public.finance_history;
create policy finance_history_select on public.finance_history for select to authenticated using (true);

create or replace function public.finance_status_label(s text) returns text
language sql immutable as $f$
  select case lower(coalesce(s,''))
    when 'draft' then 'Borrador' when 'pending' then 'Pendiente' when 'validated' then 'Validado'
    when 'approved' then 'Aprobado' when 'rejected' then 'Rechazado' when 'invoiced' then 'Facturado'
    when 'paid' then 'Pagado' when 'cancelled' then 'Cancelado' when 'sent' then 'Enviado'
    when 'partial' then 'Pago parcial' when 'overdue' then 'Vencido' when 'submitted' then 'Enviado a aprobación'
    when '' then '—' else s end
$f$;

create or replace function public.finance_history_actor() returns uuid
language plpgsql stable security definer set search_path = public as $f$
declare v uuid := auth.uid();
begin
  if v is not null and exists (select 1 from users where id = v) then return v; end if;
  return null;
end $f$;

create or replace function public.log_finance_history() returns trigger
language plpgsql security definer set search_path = public as $f$
declare
  v_type text := TG_ARGV[0];
  v_uid uuid := finance_history_actor();
  v_new jsonb := to_jsonb(NEW);
  v_old jsonb;
  v_changes jsonb := '[]'::jsonb;
  v_key text;
  v_ignored text[] := array['id','created_at','updated_at','created_by','agency_id'];
  v_from text; v_to text;
begin
  if TG_OP = 'INSERT' then
    insert into finance_history(entity_type, entity_id, action, description, details, user_id)
    values (v_type, NEW.id, 'created', 'Registro creado',
      jsonb_build_object('status', v_new->>'status'), v_uid);
    return NEW;
  end if;

  v_old := to_jsonb(OLD);

  if (v_new->>'status') is distinct from (v_old->>'status') then
    insert into finance_history(entity_type, entity_id, action, description, details, user_id)
    values (v_type, NEW.id, 'status_changed',
      'Cambio de estado: ' || finance_status_label(v_old->>'status') || ' → ' || finance_status_label(v_new->>'status'),
      jsonb_build_object('from', v_old->>'status', 'to', v_new->>'status'), v_uid);
  end if;

  if v_type = 'expense' and (v_new->>'approval_status') is distinct from (v_old->>'approval_status') then
    insert into finance_history(entity_type, entity_id, action, description, details, user_id)
    values (v_type, NEW.id, 'approval_changed',
      'Aprobación: ' || finance_status_label(v_old->>'approval_status') || ' → ' || finance_status_label(v_new->>'approval_status'),
      jsonb_build_object('from', v_old->>'approval_status', 'to', v_new->>'approval_status',
        'reason', v_new->>'rejection_reason'), v_uid);
  end if;

  if v_type = 'invoice' and (v_new->>'email_sent_count') is distinct from (v_old->>'email_sent_count') then
    insert into finance_history(entity_type, entity_id, action, description, details, user_id)
    values (v_type, NEW.id, 'email_sent',
      'Factura enviada por correo' || coalesce(' a ' || (v_new->>'email_last_sent_to'), ''), null, v_uid);
  end if;

  if v_type = 'pre_invoice' and (v_new->>'sent_at') is distinct from (v_old->>'sent_at') and (v_new->>'sent_at') is not null then
    insert into finance_history(entity_type, entity_id, action, description, details, user_id)
    values (v_type, NEW.id, 'email_sent',
      'Prefactura enviada por correo' || coalesce(' a ' || (v_new->>'sent_to'), ''), null, v_uid);
  end if;

  for v_key in select jsonb_object_keys(v_new) loop
    continue when v_key = any(v_ignored)
      or v_key in ('status','approval_status','email_sent_count','email_sent_at','email_last_sent_to','sent_at','sent_to');
    if (v_new->v_key) is distinct from (v_old->v_key) then
      v_from := left(v_old->>v_key, 200);
      v_to := left(v_new->>v_key, 200);
      v_changes := v_changes || jsonb_build_array(jsonb_build_object('field', v_key, 'from', v_from, 'to', v_to));
    end if;
  end loop;

  if jsonb_array_length(v_changes) > 0 then
    insert into finance_history(entity_type, entity_id, action, description, details, user_id)
    values (v_type, NEW.id, 'edited', 'Información actualizada', jsonb_build_object('changes', v_changes), v_uid);
  end if;

  return NEW;
end $f$;

create or replace function public.log_finance_payment() returns trigger
language plpgsql security definer set search_path = public as $f$
begin
  if NEW.invoice_id is null then return NEW; end if;
  insert into finance_history(entity_type, entity_id, action, description, details, user_id)
  values ('invoice', NEW.invoice_id,
    case when TG_OP = 'INSERT' then 'payment_registered' else 'payment_updated' end,
    case when TG_OP = 'INSERT' then 'Pago registrado' else 'Pago modificado' end
      || ' por $' || to_char(coalesce(NEW.amount,0), 'FM999,999,999,990.00')
      || coalesce(' (' || NEW.payment_number || ')', ''),
    jsonb_build_object('payment_id', NEW.id, 'amount', NEW.amount, 'payment_date', NEW.payment_date,
      'reference', NEW.reference_number), finance_history_actor());
  return NEW;
end $f$;

create or replace function public.log_finance_payment_delete() returns trigger
language plpgsql security definer set search_path = public as $f$
begin
  if OLD.invoice_id is null then return OLD; end if;
  insert into finance_history(entity_type, entity_id, action, description, details, user_id)
  values ('invoice', OLD.invoice_id, 'payment_deleted',
    'Pago eliminado por $' || to_char(coalesce(OLD.amount,0), 'FM999,999,999,990.00'),
    jsonb_build_object('payment_id', OLD.id, 'amount', OLD.amount), finance_history_actor());
  return OLD;
end $f$;

drop trigger if exists trg_finance_history on public.pre_invoices;
create trigger trg_finance_history after insert or update on public.pre_invoices
  for each row execute function public.log_finance_history('pre_invoice');
drop trigger if exists trg_finance_history on public.invoices;
create trigger trg_finance_history after insert or update on public.invoices
  for each row execute function public.log_finance_history('invoice');
drop trigger if exists trg_finance_history on public.third_party_payments;
create trigger trg_finance_history after insert or update on public.third_party_payments
  for each row execute function public.log_finance_history('third_party_payment');
drop trigger if exists trg_finance_history on public.expenses;
create trigger trg_finance_history after insert or update on public.expenses
  for each row execute function public.log_finance_history('expense');
drop trigger if exists trg_finance_history on public.payments;
create trigger trg_finance_history after insert or update on public.payments
  for each row execute function public.log_finance_payment();
drop trigger if exists trg_finance_history_delete on public.payments;
create trigger trg_finance_history_delete after delete on public.payments
  for each row execute function public.log_finance_payment_delete();
`

// Reconstructs history for records that existed before the triggers.
const BACKFILL = `
with resolve as (
  select id as any_id, id as user_id from users
  union all
  select s.id, s.user_id from staff s where s.user_id is not null and s.user_id in (select id from users)
),
events as (
  select 'pre_invoice' t, p.id, 'created' a, 'Registro creado' d, p.created_at at_, p.created_by actor from pre_invoices p
  union all
  select 'pre_invoice', p.id, 'invoiced', 'Factura generada a partir de la prefactura', i.created_at, i.created_by
    from pre_invoices p join invoices i on i.id = p.invoice_id
  union all
  select 'pre_invoice', p.id, 'email_sent', 'Prefactura enviada por correo' || coalesce(' a ' || p.sent_to, ''), p.sent_at, null
    from pre_invoices p where p.sent_at is not null
  union all
  select 'invoice', i.id, 'created', 'Registro creado', i.created_at, i.created_by from invoices i
  union all
  select 'invoice', i.id, 'email_sent', 'Factura enviada por correo' || coalesce(' a ' || i.email_last_sent_to, ''), i.email_sent_at, null
    from invoices i where i.email_sent_at is not null
  union all
  select 'invoice', pm.invoice_id, 'payment_registered',
    'Pago registrado por $' || to_char(coalesce(pm.amount,0), 'FM999,999,999,990.00') || coalesce(' (' || pm.payment_number || ')', ''),
    pm.created_at, pm.created_by from payments pm where pm.invoice_id is not null
  union all
  select 'third_party_payment', t.id, 'created', 'Registro creado', t.created_at, t.created_by from third_party_payments t
  union all
  select 'third_party_payment', t.id, 'status_changed', 'Cambio de estado: → Validado', t.validated_at, t.validated_by
    from third_party_payments t where t.validated_at is not null
  union all
  select 'third_party_payment', t.id, 'status_changed', 'Cambio de estado: → Rechazado' || coalesce(' (' || t.rejection_reason || ')', ''), t.rejected_at, t.rejected_by
    from third_party_payments t where t.rejected_at is not null
  union all
  select 'third_party_payment', t.id, 'invoiced', 'Factura generada', i.created_at, i.created_by
    from third_party_payments t join invoices i on i.id = t.invoice_id
  union all
  select 'expense', e.id, 'created', 'Registro creado', e.created_at, coalesce(e.created_by, e.requested_by_id) from expenses e
  union all
  select 'expense', h.expense_id,
    case h.action when 'approved' then 'approval_changed' when 'rejected' then 'approval_changed' else 'submitted' end,
    case h.action when 'approved' then 'Gasto aprobado' when 'rejected' then 'Gasto rechazado'
      when 'submitted' then 'Enviado a aprobación' else h.action end || coalesce(': ' || nullif(h.comments,''), ''),
    h.created_at, h.performed_by_id from expense_approval_history h
  union all
  select 'expense', e.id, 'status_changed', 'Gasto pagado', e.paid_at, null from expenses e where e.paid_at is not null
)
insert into finance_history(entity_type, entity_id, action, description, details, user_id, created_at)
select ev.t, ev.id, ev.a, ev.d, jsonb_build_object('backfilled', true),
  (select r.user_id from resolve r where r.any_id = ev.actor limit 1), ev.at_
from events ev
where ev.at_ is not null and ev.id is not null
  and not exists (
    select 1 from finance_history fh
    where fh.entity_type = ev.t and fh.entity_id = ev.id and fh.details->>'backfilled' = 'true'
  )
`

await client.connect()
try {
  await client.query("begin")
  await client.query(SQL)
  const { rowCount } = await client.query(BACKFILL)
  await client.query("commit")
  const { rows } = await client.query(
    "select entity_type, count(*)::int n, count(user_id)::int with_user from finance_history group by entity_type order by 1",
  )
  console.log("[v0] finance_history ready. Backfilled rows:", rowCount, JSON.stringify(rows))
} catch (error) {
  await client.query("rollback")
  console.error("[v0] Migration failed:", error.message)
  process.exitCode = 1
} finally {
  await client.end()
}
