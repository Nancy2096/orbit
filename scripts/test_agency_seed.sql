-- Agencia de prueba para probar la conciliación de nómina.
-- Idempotente: se puede ejecutar varias veces sin duplicar datos.
-- Se borra por completo con scripts/test_agency_cleanup.sql
-- No toca A4R ni MKTnDigital: todo queda bajo una agencia nueva marcada con settings.is_test = true.

DO $$
DECLARE
  v_agency uuid;
  v_mxn uuid;
BEGIN
  SELECT id INTO v_mxn FROM currencies WHERE code = 'MXN';
  IF v_mxn IS NULL THEN
    RAISE EXCEPTION 'No existe la moneda MXN';
  END IF;

  SELECT id INTO v_agency FROM agencies WHERE name = 'Agencia de prueba';
  IF v_agency IS NULL THEN
    INSERT INTO agencies (name, legal_name, currency, is_active, settings)
    VALUES ('Agencia de prueba', 'Agencia de prueba (solo pruebas)', 'MXN', true, '{"is_test": true}'::jsonb)
    RETURNING id INTO v_agency;
  ELSIF COALESCE((SELECT settings->>'is_test' FROM agencies WHERE id = v_agency), '') <> 'true' THEN
    RAISE EXCEPTION 'Ya existe una agencia llamada "Agencia de prueba" que no está marcada como prueba. No se modificó nada.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM agency_currencies WHERE agency_id = v_agency AND currency_id = v_mxn) THEN
    INSERT INTO agency_currencies (agency_id, currency_id, is_default, exchange_rate)
    VALUES (v_agency, v_mxn, true, 1);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM bank_accounts WHERE agency_id = v_agency) THEN
    INSERT INTO bank_accounts (
      agency_id, currency_id, bank_name, account_name, account_number,
      account_type, is_primary, is_active, initial_balance, current_balance, notes
    ) VALUES (
      v_agency, v_mxn, 'Banco Prueba', 'Cuenta de prueba nómina', '0000000000',
      'checking', true, true, 100000, 100000,
      'Cuenta de prueba. Se borra con scripts/test_agency_cleanup.sql'
    );
  END IF;

  INSERT INTO staff (
    agency_id, currency_id, first_name, last_name, email, position,
    monthly_salary, payment_frequency, contract_type, employment_status,
    hire_date, payroll_bank_name
  )
  SELECT v_agency, v_mxn, s.first_name, s.last_name, s.email, 'Colaborador de prueba',
         s.salary, 'biweekly', 'full_time', 'active',
         CURRENT_DATE - 60, 'Banco Prueba'
  FROM (VALUES
    ('Prueba', 'Uno', 'prueba.uno@orbit-prueba.test', 10000::numeric),
    ('Prueba', 'Dos', 'prueba.dos@orbit-prueba.test', 12000::numeric)
  ) AS s(first_name, last_name, email, salary)
  WHERE NOT EXISTS (SELECT 1 FROM staff st WHERE st.email = s.email);

  RAISE NOTICE 'Agencia de prueba lista: %', v_agency;
END $$;
