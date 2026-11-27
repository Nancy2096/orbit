-- Borra los 4 movimientos bancarios duplicados de la nómina
-- "2nda Quincena Octubre 2026" (BANREGIO pesos, Payoneer 1, Lead Bank DolarApp y Paypal).
-- Al marcar la nómina como pagada se registraron dos tandas idénticas
-- (05/11/2026 23:38:33.534 y 23:38:33.770). Se conserva la primera tanda y se
-- borra la segunda. Finanzas lo confirmó contra la conciliación bancaria.
--
-- Parte 1: vista previa (solo lectura).
-- Parte 2: corrección en una sola transacción, con validaciones que abortan
--          todo si los datos no coinciden exactamente con la vista previa.

-- =============================================================================
-- PARTE 1 · VISTA PREVIA
-- =============================================================================

-- 1a) Pares de movimientos: cuál se conserva y cuál se borra.
select b.bank_name                                       as banco,
       m.amount                                          as monto,
       m.created_at                                      as registrado,
       m.id                                              as movimiento,
       case when m.id in ('fe206088-7b75-477e-80b8-8686fb23956b',
                          '4059b381-7394-46d8-9d3b-198f76aa5ab3',
                          '65e7a5d6-774a-4071-bc9a-bfb50eafc9ff',
                          '638c1b5b-ae08-4572-8935-c65729143026')
            then 'BORRAR' else 'CONSERVAR' end           as accion
from bank_movements m
join bank_accounts b on b.id = m.bank_account_id
where m.source_type = 'payroll_period'
  and m.source_id = 'a2227b44-3c92-40d3-a81d-b575ba594c07'
order by b.bank_name, m.created_at;

-- 1b) Saldo de cada banco antes y después (mismo cálculo que Finanzas > Bancos:
--     saldo inicial + cobros + capital + movimientos bancarios).
with dup(id) as (values
  ('fe206088-7b75-477e-80b8-8686fb23956b'::uuid),
  ('4059b381-7394-46d8-9d3b-198f76aa5ab3'::uuid),
  ('65e7a5d6-774a-4071-bc9a-bfb50eafc9ff'::uuid),
  ('638c1b5b-ae08-4572-8935-c65729143026'::uuid)
), saldo as (
  select a.id, a.bank_name,
         coalesce(a.initial_balance, 0)
         + coalesce((select sum(p.amount) from payments p
                     where p.bank_account_id = a.id and p.status = 'completed'), 0)
         + coalesce((select sum(case when e.transaction_type in ('retiro','withdrawal','expense')
                                     then -e.amount else e.amount end)
                     from equity_transactions e where e.bank_account_id = a.id), 0)
         + coalesce((select sum(case when m.movement_type = 'salida' then -m.amount else m.amount end)
                     from bank_movements m where m.bank_account_id = a.id), 0) as antes,
         coalesce((select sum(m.amount) from bank_movements m
                   where m.bank_account_id = a.id and m.id in (select id from dup)), 0) as se_regresa
  from bank_accounts a
  where a.id in (select bank_account_id from bank_movements where id in (select id from dup))
)
select bank_name as banco, round(antes, 2) as saldo_antes, se_regresa,
       round(antes + se_regresa, 2) as saldo_despues
from saldo order by bank_name;

-- =============================================================================
-- PARTE 2 · CORRECCIÓN (una sola transacción)
-- =============================================================================
begin;

do $$
declare
  c_period constant uuid := 'a2227b44-3c92-40d3-a81d-b575ba594c07';
  c_user   constant uuid := '25160f77-b296-400b-ae4a-d7a7b0635b82'; -- nancy@agency4realestate.com
  c_reason constant text := 'Movimientos duplicados por doble clic al marcar la nómina como pagada, confirmados por finanzas contra la conciliación bancaria';
  c_dup    constant uuid[] := array[
    'fe206088-7b75-477e-80b8-8686fb23956b',  -- BANREGIO pesos  118,891.00
    '4059b381-7394-46d8-9d3b-198f76aa5ab3',  -- Lead Bank DolarApp  751.28
    '65e7a5d6-774a-4071-bc9a-bfb50eafc9ff',  -- Payoneer 1  1,220.51
    '638c1b5b-ae08-4572-8935-c65729143026'   -- Paypal  7,000.00
  ]::uuid[];
  v_total   int;
  v_matched int;
  v_movs    jsonb;
  v_deleted int;
  r record;
begin
  perform 1 from payroll_periods where id = c_period and status = 'paid' for update;
  if not found then raise exception 'La nómina 2nda Quincena Octubre 2026 no está pagada o no existe'; end if;

  -- Los 8 movimientos de la nómina deben seguir ahí, sin cambios.
  select count(*) into v_total from bank_movements
   where source_type = 'payroll_period' and source_id = c_period;
  if v_total <> 8 then
    raise exception 'Se esperaban 8 movimientos en la nómina y hay %', v_total;
  end if;

  -- Cada movimiento a borrar debe tener su gemelo (mismo banco, monto y tipo)
  -- que se conserva, y no estar ligado a ningún pago por colaborador.
  select count(*) into v_matched
  from bank_movements d
  where d.id = any(c_dup)
    and d.source_type = 'payroll_period' and d.source_id = c_period
    and d.category = 'nomina' and d.movement_type = 'salida'
    and not exists (select 1 from payroll_staff_payments s where s.bank_movement_id = d.id)
    and exists (select 1 from bank_movements k
                where k.source_type = 'payroll_period' and k.source_id = c_period
                  and k.id <> d.id and not (k.id = any(c_dup))
                  and k.bank_account_id = d.bank_account_id
                  and k.amount = d.amount and k.movement_type = d.movement_type
                  and k.created_at < d.created_at);
  if v_matched <> 4 then
    raise exception 'Solo % de 4 movimientos coinciden con su duplicado; no se borra nada', v_matched;
  end if;

  select jsonb_agg(to_jsonb(m) order by m.bank_account_id) into v_movs
  from bank_movements m where m.id = any(c_dup);

  -- Bitácora de nómina (un registro con los 4 movimientos completos).
  insert into payroll_audit_log (period_id, action, reason, before, after, user_id)
  values (c_period, 'duplicate_movements_removed', c_reason,
          jsonb_build_object('bank_movements', v_movs),
          jsonb_build_object('removed_ids', to_jsonb(c_dup), 'kept_movements', 4), c_user);

  -- Bitácora general (Configuración > Auditoría): un registro por movimiento.
  for r in select m.*, b.bank_name from bank_movements m
           join bank_accounts b on b.id = m.bank_account_id where m.id = any(c_dup) loop
    insert into audit_logs (agency_id, user_id, user_email, action, entity_type, entity_id,
                            entity_name, old_values, new_values)
    values (r.agency_id, c_user, 'nancy@agency4realestate.com', 'delete', 'bank_movement', r.id,
            'Pago de nómina 2nda Quincena Octubre 2026 · ' || r.bank_name,
            to_jsonb(r) - 'bank_name',
            jsonb_build_object('reason', c_reason, 'payroll_period_id', c_period));
  end loop;

  delete from bank_movements where id = any(c_dup);
  get diagnostics v_deleted = row_count;
  if v_deleted <> 4 then
    raise exception 'Se borraron % movimientos en lugar de 4; se revierte todo', v_deleted;
  end if;
end $$;

-- Verificación dentro de la misma transacción: deben quedar 4, uno por banco.
select b.bank_name as banco, count(*) as movimientos, sum(m.amount) as total
from bank_movements m join bank_accounts b on b.id = m.bank_account_id
where m.source_type = 'payroll_period' and m.source_id = 'a2227b44-3c92-40d3-a81d-b575ba594c07'
group by b.bank_name order by b.bank_name;

commit;
