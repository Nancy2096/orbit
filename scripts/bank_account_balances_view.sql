-- Saldo oficial de cada cuenta bancaria, con la fórmula de Finanzas > Bancos:
--   saldo inicial + cobros completados + capital + movimientos bancarios.
-- Capital: las aportaciones (capital_contribution) suman; cualquier otro tipo resta.
-- Movimientos: 'ingreso' suma; 'salida' resta.
-- bank_accounts.current_balance deja de usarse en la app; se retirará más adelante.

create or replace view public.bank_account_balances
with (security_invoker = true) as
select
  b.id                                   as bank_account_id,
  b.agency_id,
  coalesce(b.initial_balance, 0)::numeric as initial_balance,
  coalesce(p.total, 0)::numeric          as payments_total,
  coalesce(e.total, 0)::numeric          as capital_total,
  coalesce(m.total, 0)::numeric          as movements_total,
  (coalesce(b.initial_balance, 0) + coalesce(p.total, 0)
   + coalesce(e.total, 0) + coalesce(m.total, 0))::numeric as balance
from public.bank_accounts b
left join (
  select bank_account_id, sum(amount) as total
  from public.payments
  where status = 'completed' and bank_account_id is not null
  group by bank_account_id
) p on p.bank_account_id = b.id
left join (
  select bank_account_id,
         sum(case when transaction_type = 'capital_contribution' then amount else -amount end) as total
  from public.equity_transactions
  where bank_account_id is not null
  group by bank_account_id
) e on e.bank_account_id = b.id
left join (
  select bank_account_id,
         sum(case when movement_type = 'ingreso' then amount else -amount end) as total
  from public.bank_movements
  where bank_account_id is not null
  group by bank_account_id
) m on m.bank_account_id = b.id;

revoke all on public.bank_account_balances from anon, public;
grant select on public.bank_account_balances to authenticated, service_role;
