-- Paso b) Corregir PCT duplicados. Requiere el paso a.
-- Se conserva el folio del registro más antiguo; el más reciente recibe uno nuevo.
-- Hoy solo hay un caso (A4R · IngeSaenz · PCT-2026-00009):
--   conserva: 06f8769c-a4bc-402e-b610-952a39941463 (29/09 04:26, $2,905.58, FAC-2026-00125, GAS-2026-00064)
--   cambia:   ec6f9b38-5df6-4bc0-a4be-fdde144ada3e (29/09 04:27, $2,841.59, FAC-2026-00122, GAS-2026-00062)
-- También se actualiza el texto "PCT-2026-00009" en las notas de su factura y su gasto.

-- 1. Vista previa (solo lectura): lista exacta de cambios.
with ranked as (
  select id, agency_id, payment_number, created_at,
         row_number() over (partition by agency_id, payment_number order by created_at, id) rn
  from public.third_party_payments
)
select r.id, r.payment_number as folio_actual, r.created_at,
       i.invoice_number as factura, e.expense_number as gasto
from ranked r
left join public.invoices i on i.third_party_payment_id = r.id
left join public.expenses e on e.third_party_payment_id = r.id
where r.rn > 1
order by r.payment_number, r.created_at;

-- 2. Corrección (en una transacción).
begin;

create temporary table pct_renames on commit drop as
with ranked as (
  select id, agency_id, payment_number,
         row_number() over (partition by agency_id, payment_number order by created_at, id) rn
  from public.third_party_payments
)
select id, agency_id, payment_number as old_number, null::text as new_number
from ranked
where rn > 1;

update pct_renames
set new_number = 'PCT-' || split_part(old_number, '-', 2) || '-'
                 || lpad(public.next_third_party_folio(agency_id)::text, 5, '0');

update public.third_party_payments t
set payment_number = r.new_number, updated_at = now()
from pct_renames r
where t.id = r.id;

update public.invoices i
set notes = replace(i.notes, r.old_number, r.new_number), updated_at = now()
from pct_renames r
where i.third_party_payment_id = r.id and position(r.old_number in i.notes) > 0;

update public.expenses e
set notes = replace(e.notes, r.old_number, r.new_number), updated_at = now()
from pct_renames r
where e.third_party_payment_id = r.id and position(r.old_number in e.notes) > 0;

-- Si queda algún duplicado, se aborta toda la transacción.
do $$
begin
  if exists (
    select 1 from public.third_party_payments
    group by agency_id, payment_number having count(*) > 1
  ) then
    raise exception 'Siguen existiendo folios PCT duplicados';
  end if;
end $$;

select * from pct_renames;

commit;
