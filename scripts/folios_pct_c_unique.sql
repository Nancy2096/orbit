-- Paso c) Restricciones únicas por agencia y folio. Ejecutar solo después del paso b.
-- invoices ya tiene UNIQUE (agency_id, invoice_number).

-- Debe regresar 0 filas antes de continuar.
select 'PCT' tipo, agency_id, payment_number folio, count(*)
from public.third_party_payments group by 1, 2, 3 having count(*) > 1
union all
select 'GAS', agency_id, expense_number, count(*)
from public.expenses where expense_number is not null group by 1, 2, 3 having count(*) > 1;

alter table public.third_party_payments
  add constraint third_party_payments_agency_id_payment_number_key unique (agency_id, payment_number);

alter table public.expenses
  add constraint expenses_agency_id_expense_number_key unique (agency_id, expense_number);
