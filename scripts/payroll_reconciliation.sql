-- Conciliación bancaria de nómina por colaborador, edición y cancelación de
-- nóminas pagadas con bitácora. No modifica ningún registro existente: solo
-- crea tablas, columnas, índices y funciones nuevas.
begin;

-- 1) Pago por colaborador dentro de una nómina ---------------------------------
create table if not exists public.payroll_staff_payments (
  id                  uuid primary key default gen_random_uuid(),
  period_id           uuid not null references public.payroll_periods(id) on delete restrict,
  staff_id            uuid not null references public.staff(id) on delete restrict,
  actual_payment_date date,
  status              text not null default 'pending'
                      check (status in ('pending', 'reconciled', 'cancelled')),
  -- Movimiento bancario que descuenta el saldo. RESTRICT impide borrarlo por
  -- fuera de las funciones de abajo (evita descuadres).
  bank_movement_id    uuid unique references public.bank_movements(id) on delete restrict,
  cancelled_at        timestamptz,
  cancelled_by        uuid references public.users(id),
  cancel_reason       text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  updated_by          uuid references public.users(id),
  unique (period_id, staff_id),
  constraint psp_reconciled_has_movement
    check (status <> 'reconciled' or (bank_movement_id is not null and actual_payment_date is not null)),
  constraint psp_cancelled_has_data
    check (status <> 'cancelled' or (cancelled_at is not null and cancel_reason is not null and bank_movement_id is null))
);

create index if not exists payroll_staff_payments_period_idx on public.payroll_staff_payments(period_id);

-- Sin fechas futuras (zona horaria de la operación).
create or replace function public.payroll_staff_payments_check_date()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.actual_payment_date is not null
     and new.actual_payment_date > (now() at time zone 'America/Mexico_City')::date then
    raise exception 'La fecha real de pago no puede ser futura' using errcode = '22007';
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists payroll_staff_payments_check_date on public.payroll_staff_payments;
create trigger payroll_staff_payments_check_date
  before insert or update on public.payroll_staff_payments
  for each row execute function public.payroll_staff_payments_check_date();

alter table public.payroll_staff_payments enable row level security;
drop policy if exists payroll_staff_payments_select on public.payroll_staff_payments;
create policy payroll_staff_payments_select on public.payroll_staff_payments
  for select to authenticated using (true);
-- Sin políticas de escritura: solo las funciones de abajo (service role) escriben.

-- 2) Movimientos bancarios ligados al colaborador ---------------------------------
alter table public.bank_movements
  add column if not exists staff_id uuid references public.staff(id) on delete set null;

-- Un solo movimiento por pago de colaborador.
create unique index if not exists bank_movements_payroll_staff_unique
  on public.bank_movements(source_id) where source_type = 'payroll_staff_payment';

-- 3) Bitácora de cambios a nóminas pagadas (solo se agrega, nunca se edita) -------
create table if not exists public.payroll_audit_log (
  id         uuid primary key default gen_random_uuid(),
  period_id  uuid not null references public.payroll_periods(id) on delete restrict,
  staff_id   uuid references public.staff(id) on delete set null,
  action     text not null check (action in (
               'payment_date_set', 'payment_date_corrected', 'reconciled', 'unreconciled',
               'entry_edited', 'staff_payment_cancelled', 'period_payment_cancelled')),
  reason     text,
  before     jsonb,
  after      jsonb,
  user_id    uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  constraint payroll_audit_reason_required check (
    action in ('payment_date_set', 'reconciled', 'unreconciled')
    or length(btrim(coalesce(reason, ''))) >= 5)
);

create index if not exists payroll_audit_log_period_idx on public.payroll_audit_log(period_id, created_at desc);

create or replace function public.payroll_audit_log_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'La bitácora de nómina no se puede modificar ni borrar';
end $$;

drop trigger if exists payroll_audit_log_immutable on public.payroll_audit_log;
create trigger payroll_audit_log_immutable
  before update or delete on public.payroll_audit_log
  for each row execute function public.payroll_audit_log_immutable();

alter table public.payroll_audit_log enable row level security;
drop policy if exists payroll_audit_log_select on public.payroll_audit_log;
create policy payroll_audit_log_select on public.payroll_audit_log
  for select to authenticated using (true);

-- 4) Permiso: solo superadmin o quien tenga la clave (NO incluye direccion_general,
--    a diferencia de user_has_permission).
create or replace function public.can_manage_paid_payroll(p_user uuid, p_key text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
           select 1 from users u join roles r on r.id = u.role_id
           where u.id = p_user and r.name = 'superadmin' and coalesce(u.is_active, true))
      or exists (
           select 1 from user_permissions up
           where up.user_id = p_user and up.permission_key = p_key and up.revoked_at is null)
$$;

-- Nómina pagada con el esquema anterior (un movimiento agrupado por banco).
create or replace function public.payroll_is_legacy(p_period uuid)
returns boolean language sql stable set search_path = public as $$
  select exists (select 1 from bank_movements
                 where source_type = 'payroll_period' and source_id = p_period)
$$;

-- Recalcula los totales del periodo sin los colaboradores cancelados.
create or replace function public._payroll_recompute_totals(p_period uuid)
returns void language plpgsql set search_path = public as $$
begin
  update payroll_periods p set
    total_gross = coalesce(t.gross, 0),
    total_deductions = coalesce(t.ded, 0),
    total_net = coalesce(t.net, 0),
    updated_at = now()
  from (
    select sum((e->>'gross_pay')::numeric) gross,
           sum(coalesce((e->>'deductions')::numeric, 0) + coalesce((e->>'loanDeductions')::numeric, 0)
               + coalesce((e->>'taxes')::numeric, 0)) ded,
           sum((e->>'net_pay')::numeric) net
    from payroll_periods pp, jsonb_array_elements(coalesce(pp.entries_snapshot, '[]')) e
    where pp.id = p_period and coalesce((e->>'payment_cancelled')::boolean, false) = false
  ) t
  where p.id = p_period;
end $$;

-- 5) Crea, reemplaza o revierte el movimiento bancario de UN colaborador ---------
-- El monto, banco y desglose (con conversión de moneda) los calcula la app; la
-- regla "solo con comprobante y fecha real" se valida aquí y no se puede saltar.
create or replace function public.payroll_sync_staff_movement(
  p_period uuid, p_staff uuid, p_user uuid,
  p_payment_date date default null,      -- null = conservar la fecha actual
  p_bank_account_id uuid default null,
  p_amount numeric default null,
  p_breakdown jsonb default null,
  p_description text default null,
  p_reason text default null             -- obligatorio al corregir una fecha ya capturada
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_period payroll_periods%rowtype;
  v_pay payroll_staff_payments%rowtype;
  v_has_receipt boolean;
  v_old_mov bank_movements%rowtype;
  v_new_mov uuid;
  v_agency uuid;
begin
  select * into v_period from payroll_periods where id = p_period for update;
  if not found then raise exception 'Nómina no encontrada'; end if;
  if v_period.status <> 'paid' then raise exception 'La nómina no está pagada'; end if;
  if payroll_is_legacy(p_period) then
    raise exception 'Nómina pagada con el esquema anterior: no se concilia por colaborador';
  end if;

  insert into payroll_staff_payments (period_id, staff_id, updated_by)
  values (p_period, p_staff, p_user)
  on conflict (period_id, staff_id) do nothing;
  select * into v_pay from payroll_staff_payments
   where period_id = p_period and staff_id = p_staff for update;
  if v_pay.status = 'cancelled' then raise exception 'El pago de este colaborador está cancelado'; end if;

  -- Fecha real de pago
  if p_payment_date is not null and p_payment_date is distinct from v_pay.actual_payment_date then
    if v_pay.actual_payment_date is not null then
      if not can_manage_paid_payroll(p_user, 'payroll.edit_paid') then
        raise exception 'Sin permiso para corregir la fecha de una nómina pagada';
      end if;
      insert into payroll_audit_log (period_id, staff_id, action, reason, before, after, user_id)
      values (p_period, p_staff, 'payment_date_corrected', p_reason,
              jsonb_build_object('actual_payment_date', v_pay.actual_payment_date),
              jsonb_build_object('actual_payment_date', p_payment_date), p_user);
    else
      insert into payroll_audit_log (period_id, staff_id, action, after, user_id)
      values (p_period, p_staff, 'payment_date_set',
              jsonb_build_object('actual_payment_date', p_payment_date), p_user);
    end if;
    update payroll_staff_payments set actual_payment_date = p_payment_date, updated_by = p_user
     where id = v_pay.id returning * into v_pay;
  end if;

  select exists (select 1 from payroll_payment_receipts where period_id = p_period and staff_id = p_staff)
    into v_has_receipt;

  -- Quitar el movimiento anterior (se vuelve a crear si aplica).
  if v_pay.bank_movement_id is not null then
    select * into v_old_mov from bank_movements where id = v_pay.bank_movement_id;
    update payroll_staff_payments set bank_movement_id = null, status = 'pending', updated_by = p_user
     where id = v_pay.id;
    delete from bank_movements where id = v_old_mov.id;
  end if;

  if v_has_receipt and v_pay.actual_payment_date is not null
     and p_bank_account_id is not null and coalesce(p_amount, 0) > 0 then
    select agency_id into v_agency from bank_accounts where id = p_bank_account_id and is_active;
    if not found then raise exception 'Cuenta bancaria no encontrada o inactiva'; end if;

    insert into bank_movements (bank_account_id, agency_id, movement_type, category, amount, description,
                                reference, movement_date, source_type, source_id, staff_id, created_by, breakdown)
    values (p_bank_account_id, v_agency, 'salida', 'nomina', round(p_amount, 2),
            coalesce(p_description, 'Pago de nómina ' || v_period.period_name), v_period.period_name,
            v_pay.actual_payment_date, 'payroll_staff_payment', v_pay.id, p_staff, p_user, p_breakdown)
    returning id into v_new_mov;

    update payroll_staff_payments set bank_movement_id = v_new_mov, status = 'reconciled', updated_by = p_user
     where id = v_pay.id;

    if v_old_mov.id is null then
      insert into payroll_audit_log (period_id, staff_id, action, after, user_id)
      values (p_period, p_staff, 'reconciled',
              jsonb_build_object('bank_account_id', p_bank_account_id, 'amount', round(p_amount, 2),
                                 'movement_date', v_pay.actual_payment_date), p_user);
    end if;
    return jsonb_build_object('status', 'reconciled', 'movement_id', v_new_mov);
  end if;

  if v_old_mov.id is not null then
    insert into payroll_audit_log (period_id, staff_id, action, before, user_id)
    values (p_period, p_staff, 'unreconciled', to_jsonb(v_old_mov), p_user);
  end if;
  return jsonb_build_object('status', 'pending', 'movement_id', null);
end $$;

-- 6) Editar el renglón de un colaborador en una nómina pagada -------------------
create or replace function public.payroll_edit_paid_entry(
  p_period uuid, p_staff uuid, p_new_entry jsonb, p_reason text, p_user uuid
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_period payroll_periods%rowtype;
  v_idx int;
  v_old jsonb;
begin
  if not can_manage_paid_payroll(p_user, 'payroll.edit_paid') then
    raise exception 'Sin permiso para editar nóminas pagadas';
  end if;
  select * into v_period from payroll_periods where id = p_period for update;
  if v_period.status <> 'paid' then raise exception 'La nómina no está pagada'; end if;
  if payroll_is_legacy(p_period) then
    raise exception 'Nómina pagada con el esquema anterior: no se edita por colaborador';
  end if;
  if exists (select 1 from payroll_staff_payments where period_id = p_period and staff_id = p_staff
             and status = 'cancelled') then
    raise exception 'El pago de este colaborador está cancelado';
  end if;

  select ord - 1, e into v_idx, v_old
  from jsonb_array_elements(v_period.entries_snapshot) with ordinality as x(e, ord)
  where (e->>'staff_id')::uuid = p_staff;
  if v_idx is null then raise exception 'El colaborador no está en esta nómina'; end if;
  if (p_new_entry->>'staff_id')::uuid is distinct from p_staff then
    raise exception 'El renglón no corresponde al colaborador';
  end if;

  update payroll_periods
     set entries_snapshot = jsonb_set(entries_snapshot, array[v_idx::text], p_new_entry)
   where id = p_period;
  perform _payroll_recompute_totals(p_period);

  insert into payroll_audit_log (period_id, staff_id, action, reason, before, after, user_id)
  values (p_period, p_staff, 'entry_edited', p_reason, v_old, p_new_entry, p_user);
end $$;

-- 7) Liberar lo que pagó la nómina para un colaborador (uso interno) ------------
create or replace function public._payroll_release_staff_items(p_period uuid, p_staff uuid)
returns jsonb language plpgsql set search_path = public as $$
declare
  v_entry jsonb;
  v_bonus uuid[];
  v_comm uuid[];
  v_inc uuid[];
  v_loans jsonb;
  v_fin boolean;
  r record;
begin
  select e into v_entry
  from payroll_periods p, jsonb_array_elements(p.entries_snapshot) e
  where p.id = p_period and (e->>'staff_id')::uuid = p_staff;

  select coalesce(array_agg((b->>'id')::uuid), '{}') into v_bonus
  from jsonb_array_elements(coalesce(v_entry->'bonusItems', '[]')) b
  where coalesce(b->>'source', '') <> 'incentive';
  select coalesce(array_agg((c->>'id')::uuid), '{}') into v_comm
  from jsonb_array_elements(coalesce(v_entry->'commissionItems', '[]')) c;

  update bonuses set status = 'approved', paid_at = null, workflow_stage = 'authorized', updated_at = now()
   where id = any(v_bonus) and status = 'paid';
  update commissions set status = 'approved', paid_at = null, updated_at = now()
   where id = any(v_comm) and status = 'paid';
  with u as (
    update incentives set status = 'approved', paid_at = null, payroll_period_id = null, updated_at = now()
     where payroll_period_id = p_period and staff_id = p_staff and status = 'paid'
    returning id)
  select coalesce(array_agg(id), '{}') into v_inc from u;

  -- Pagos de préstamo registrados por esta nómina: se borran y se regresa el saldo.
  select coalesce(jsonb_agg(to_jsonb(lp)), '[]') into v_loans
  from loan_payments lp join loans l on l.id = lp.loan_id
  where lp.payroll_period_id = p_period and l.staff_id = p_staff;
  for r in select lp.id, lp.loan_id, lp.amount from loan_payments lp join loans l on l.id = lp.loan_id
           where lp.payroll_period_id = p_period and l.staff_id = p_staff loop
    delete from loan_payments where id = r.id;
    update loans set
      payments_made = greatest(0, coalesce(payments_made, 0) - 1),
      amount_paid = greatest(0, coalesce(amount_paid, 0) - r.amount),
      remaining_balance = least(coalesce(total_amount, 0),
                                coalesce(total_amount, 0) - greatest(0, coalesce(amount_paid, 0) - r.amount)),
      status = 'active',
      updated_at = now()
    where id = r.loan_id;
  end loop;

  v_fin := coalesce((v_entry->>'finiquito')::numeric, 0) > 0;
  if v_fin then update staff set finiquito_paid_at = null where id = p_staff; end if;

  return jsonb_build_object('bonuses', to_jsonb(v_bonus), 'commissions', to_jsonb(v_comm),
                            'incentives', to_jsonb(v_inc), 'loan_payments', v_loans,
                            'finiquito_reopened', v_fin);
end $$;

-- 8) Cancelar el pago de UN colaborador ---------------------------------------
create or replace function public.payroll_cancel_staff_payment(
  p_period uuid, p_staff uuid, p_reason text, p_user uuid
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_period payroll_periods%rowtype;
  v_pay payroll_staff_payments%rowtype;
  v_mov jsonb;
  v_released jsonb;
  v_idx int;
begin
  if not can_manage_paid_payroll(p_user, 'payroll.cancel') then
    raise exception 'Sin permiso para cancelar pagos de nómina';
  end if;
  select * into v_period from payroll_periods where id = p_period for update;
  if v_period.status <> 'paid' then raise exception 'La nómina no está pagada'; end if;
  if payroll_is_legacy(p_period) then
    raise exception 'Nómina pagada con el esquema anterior: solo se puede cancelar completa';
  end if;

  select ord - 1 into v_idx
  from jsonb_array_elements(v_period.entries_snapshot) with ordinality as x(e, ord)
  where (e->>'staff_id')::uuid = p_staff;
  if v_idx is null then raise exception 'El colaborador no está en esta nómina'; end if;

  insert into payroll_staff_payments (period_id, staff_id, updated_by)
  values (p_period, p_staff, p_user) on conflict (period_id, staff_id) do nothing;
  select * into v_pay from payroll_staff_payments where period_id = p_period and staff_id = p_staff for update;
  if v_pay.status = 'cancelled' then raise exception 'Este pago ya está cancelado'; end if;

  if v_pay.bank_movement_id is not null then
    select to_jsonb(m) into v_mov from bank_movements m where id = v_pay.bank_movement_id;
    update payroll_staff_payments set bank_movement_id = null where id = v_pay.id;
    delete from bank_movements where id = v_pay.bank_movement_id;
  end if;

  v_released := _payroll_release_staff_items(p_period, p_staff);

  update payroll_staff_payments set status = 'cancelled', cancelled_at = now(), cancelled_by = p_user,
         cancel_reason = p_reason, updated_by = p_user where id = v_pay.id;
  update payroll_periods
     set entries_snapshot = jsonb_set(entries_snapshot, array[v_idx::text, 'payment_cancelled'], 'true')
   where id = p_period;
  perform _payroll_recompute_totals(p_period);

  insert into payroll_audit_log (period_id, staff_id, action, reason, before, after, user_id)
  values (p_period, p_staff, 'staff_payment_cancelled', p_reason,
          jsonb_build_object('payment', to_jsonb(v_pay), 'bank_movement', v_mov),
          jsonb_build_object('released', v_released), p_user);
  return v_released;
end $$;

-- 9) Cancelar el pago de TODA la nómina (también las del esquema anterior) -------
create or replace function public.payroll_cancel_period_payment(
  p_period uuid, p_reason text, p_user uuid
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_period payroll_periods%rowtype;
  v_movs jsonb;
  v_released jsonb := '[]';
  e jsonb;
  v_staff uuid;
begin
  if not can_manage_paid_payroll(p_user, 'payroll.cancel') then
    raise exception 'Sin permiso para cancelar pagos de nómina';
  end if;
  select * into v_period from payroll_periods where id = p_period for update;
  if v_period.status <> 'paid' then raise exception 'La nómina no está pagada'; end if;

  -- Todos los movimientos bancarios de la nómina (agrupados o por colaborador).
  select coalesce(jsonb_agg(to_jsonb(m)), '[]') into v_movs from bank_movements m
  where (m.source_type = 'payroll_period' and m.source_id = p_period)
     or (m.source_type = 'payroll_staff_payment'
         and m.source_id in (select id from payroll_staff_payments where period_id = p_period));
  update payroll_staff_payments set bank_movement_id = null where period_id = p_period;
  delete from bank_movements m
  where (m.source_type = 'payroll_period' and m.source_id = p_period)
     or (m.source_type = 'payroll_staff_payment'
         and m.source_id in (select id from payroll_staff_payments where period_id = p_period));

  for e in select x from jsonb_array_elements(coalesce(v_period.entries_snapshot, '[]')) x loop
    v_staff := (e->>'staff_id')::uuid;
    if coalesce((e->>'payment_cancelled')::boolean, false) then continue; end if;
    v_released := v_released || jsonb_build_object('staff_id', v_staff,
                                                    'released', _payroll_release_staff_items(p_period, v_staff));
    insert into payroll_staff_payments (period_id, staff_id, status, cancelled_at, cancelled_by, cancel_reason, updated_by)
    values (p_period, v_staff, 'cancelled', now(), p_user, p_reason, p_user)
    on conflict (period_id, staff_id) do update
      set status = 'cancelled', cancelled_at = now(), cancelled_by = p_user,
          cancel_reason = p_reason, bank_movement_id = null, updated_by = p_user;
  end loop;

  -- Nóminas sin snapshot (las más antiguas): liberar préstamos e incentivos del periodo.
  if jsonb_array_length(coalesce(v_period.entries_snapshot, '[]')) = 0 then
    for v_staff in select distinct l.staff_id from loan_payments lp join loans l on l.id = lp.loan_id
                   where lp.payroll_period_id = p_period
                   union select staff_id from incentives where payroll_period_id = p_period loop
      v_released := v_released || jsonb_build_object('staff_id', v_staff,
                                                      'released', _payroll_release_staff_items(p_period, v_staff));
    end loop;
  end if;

  update payroll_periods set status = 'cancelled', updated_at = now() where id = p_period;

  insert into payroll_audit_log (period_id, action, reason, before, after, user_id)
  values (p_period, 'period_payment_cancelled', p_reason,
          jsonb_build_object('status', v_period.status, 'total_net', v_period.total_net, 'bank_movements', v_movs),
          jsonb_build_object('status', 'cancelled', 'released', v_released), p_user);
end $$;

-- Solo el servidor (service role) puede ejecutar las funciones que escriben.
revoke all on function public.payroll_sync_staff_movement(uuid, uuid, uuid, date, uuid, numeric, jsonb, text, text) from public, anon, authenticated;
revoke all on function public.payroll_edit_paid_entry(uuid, uuid, jsonb, text, uuid) from public, anon, authenticated;
revoke all on function public.payroll_cancel_staff_payment(uuid, uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.payroll_cancel_period_payment(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public._payroll_release_staff_items(uuid, uuid) from public, anon, authenticated;
revoke all on function public._payroll_recompute_totals(uuid) from public, anon, authenticated;
grant execute on function public.payroll_sync_staff_movement(uuid, uuid, uuid, date, uuid, numeric, jsonb, text, text) to service_role;
grant execute on function public.payroll_edit_paid_entry(uuid, uuid, jsonb, text, uuid) to service_role;
grant execute on function public.payroll_cancel_staff_payment(uuid, uuid, text, uuid) to service_role;
grant execute on function public.payroll_cancel_period_payment(uuid, text, uuid) to service_role;
grant execute on function public.can_manage_paid_payroll(uuid, text) to authenticated, service_role;

commit;
