-- Borra la "Agencia de prueba" y todos sus datos (nóminas, pagos, movimientos, colaboradores, cuenta).
-- Solo actúa sobre la agencia marcada con settings.is_test = true; si no la encuentra, no hace nada.
-- Todo corre en una sola transacción: si algo falla, no se borra nada.
-- Los archivos de comprobantes subidos a Vercel Blob durante las pruebas NO se borran aquí:
-- el primer SELECT lista sus URLs para borrarlos a mano si se desea.

SELECT r.file_path AS comprobante_a_borrar_en_blob
FROM payroll_payment_receipts r
JOIN payroll_periods p ON p.id = r.period_id
JOIN agencies a ON a.id = p.agency_id
WHERE a.name = 'Agencia de prueba' AND a.settings->>'is_test' = 'true';

BEGIN;

DO $$
DECLARE
  v_agency uuid;
  v_outside int;
BEGIN
  SELECT id INTO v_agency FROM agencies
  WHERE name = 'Agencia de prueba' AND settings->>'is_test' = 'true';

  IF v_agency IS NULL THEN
    RAISE NOTICE 'No existe la Agencia de prueba; no se borró nada.';
    RETURN;
  END IF;

  CREATE TEMP TABLE _t_staff ON COMMIT DROP AS SELECT id FROM staff WHERE agency_id = v_agency;
  CREATE TEMP TABLE _t_periods ON COMMIT DROP AS SELECT id FROM payroll_periods WHERE agency_id = v_agency;
  CREATE TEMP TABLE _t_accounts ON COMMIT DROP AS SELECT id FROM bank_accounts WHERE agency_id = v_agency;

  -- Seguridad: si un colaborador de prueba quedó en una nómina de otra agencia, abortar.
  SELECT count(*) INTO v_outside
  FROM payroll_details d
  WHERE d.staff_id IN (SELECT id FROM _t_staff)
    AND d.payroll_period_id NOT IN (SELECT id FROM _t_periods);
  IF v_outside > 0 THEN
    RAISE EXCEPTION 'Hay % registros de nómina de otras agencias con colaboradores de prueba. No se borró nada.', v_outside;
  END IF;

  -- Tablas que bloquean el borrado (RESTRICT / NO ACTION)
  DELETE FROM payroll_staff_payments
  WHERE period_id IN (SELECT id FROM _t_periods) OR staff_id IN (SELECT id FROM _t_staff);

  DELETE FROM payroll_audit_log
  WHERE period_id IN (SELECT id FROM _t_periods) OR staff_id IN (SELECT id FROM _t_staff);

  DELETE FROM incentives
  WHERE agency_id = v_agency
     OR staff_id IN (SELECT id FROM _t_staff)
     OR payroll_period_id IN (SELECT id FROM _t_periods);

  DELETE FROM loan_payments WHERE payroll_period_id IN (SELECT id FROM _t_periods);

  DELETE FROM bank_movements
  WHERE bank_account_id IN (SELECT id FROM _t_accounts)
     OR agency_id = v_agency
     OR staff_id IN (SELECT id FROM _t_staff);

  DELETE FROM expenses WHERE agency_id = v_agency OR bank_account_id IN (SELECT id FROM _t_accounts);
  DELETE FROM quotations WHERE agency_id = v_agency OR staff_id IN (SELECT id FROM _t_staff);
  UPDATE staff SET payroll_agency_id = NULL WHERE payroll_agency_id = v_agency AND agency_id <> v_agency;

  -- El resto cae en cascada (detalles, historial, notas, comprobantes, préstamos, bonos, comisiones, etc.)
  DELETE FROM payroll_periods WHERE id IN (SELECT id FROM _t_periods);
  DELETE FROM staff WHERE id IN (SELECT id FROM _t_staff);
  DELETE FROM bank_accounts WHERE id IN (SELECT id FROM _t_accounts);
  DELETE FROM agencies WHERE id = v_agency;

  RAISE NOTICE 'Agencia de prueba borrada con todos sus datos.';
END $$;

COMMIT;
