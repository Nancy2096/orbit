-- Fecha real del reembolso del cliente en Pago por Cuenta de Cliente.
-- Los registros ya reembolsados quedan sin fecha (NULL); no se rellena nada.
alter table public.third_party_payments
  add column if not exists reimbursed_at date;

comment on column public.third_party_payments.reimbursed_at is
  'Fecha (America/Mexico_City) en que el cliente reembolsó el pago. Se captura al pasar a Reembolsado (status = paid).';
