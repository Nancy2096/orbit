-- Paso a) Folio atómico de Pago por Cuenta de Cliente (PCT) por agencia.
-- Mismo patrón que next_expense_folio / next_invoice_folio.

create table if not exists public.third_party_folio_counters (
  agency_id uuid primary key references public.agencies(id) on delete cascade,
  last_folio integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.third_party_folio_counters enable row level security;

-- Arranque: cada agencia empieza en el folio PCT más alto que existe hoy en
-- cualquier agencia (24), para que ningún folio nuevo coincida con uno existente.
insert into public.third_party_folio_counters (agency_id, last_folio)
select a.id,
       coalesce((select max(nullif(substring(payment_number from '(\d+)$'), '')::int)
                 from public.third_party_payments), 0)
from public.agencies a
on conflict (agency_id) do nothing;

create or replace function public.next_third_party_folio(p_agency_id uuid)
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_folio integer;
  v_max_existing integer;
begin
  select coalesce(max(nullif(substring(payment_number from '(\d+)$'), '')::int), 0)
    into v_max_existing
  from public.third_party_payments
  where agency_id = p_agency_id;

  insert into public.third_party_folio_counters (agency_id, last_folio)
  values (p_agency_id, greatest(1, v_max_existing + 1))
  on conflict (agency_id) do update
    set last_folio = greatest(public.third_party_folio_counters.last_folio + 1, v_max_existing + 1),
        updated_at = now()
  returning last_folio into v_folio;

  return v_folio;
end;
$function$;

revoke all on function public.next_third_party_folio(uuid) from public;
grant execute on function public.next_third_party_folio(uuid) to authenticated, service_role;
