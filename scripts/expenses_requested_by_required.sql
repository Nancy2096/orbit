-- Solicitante obligatorio en gastos (expenses.requested_by_id).
-- NO EJECUTAR sin confirmación. Ejecutar por pasos y en este orden.

-- =====================================================================
-- PASO 1. Llenar gastos de Pago por Cuenta de Cliente con el creador del pago.
-- Afecta 16 gastos (todos PCT con third_party_payments.created_by).
-- =====================================================================
BEGIN;

-- Vista previa: debe devolver 16 filas.
SELECT e.expense_number, p.payment_number, p.created_by AS nuevo_solicitante
FROM expenses e
JOIN third_party_payments p ON p.id = e.third_party_payment_id
JOIN staff s ON s.id = p.created_by
WHERE e.requested_by_id IS NULL;

UPDATE expenses e
SET requested_by_id = p.created_by
FROM third_party_payments p
JOIN staff s ON s.id = p.created_by
WHERE p.id = e.third_party_payment_id
  AND e.requested_by_id IS NULL;
-- Esperado: UPDATE 16

COMMIT;

-- =====================================================================
-- PASO 1b. Los 3 gastos cuyo pago y factura no tienen creador
-- (GAS-2026-00022 / PCT-2026-00001, GAS-2026-00070 / PCT-2026-00005,
--  GAS-2026-00071 / PCT-2026-00004). Requiere que indiques el solicitante.
-- Reemplaza :staff_id por el id de personal elegido.
-- =====================================================================
-- UPDATE expenses SET requested_by_id = ':staff_id'
-- WHERE requested_by_id IS NULL
--   AND expense_number IN ('GAS-2026-00022', 'GAS-2026-00070', 'GAS-2026-00071');

-- Verificación: debe devolver 0.
SELECT count(*) AS sin_solicitante FROM expenses WHERE requested_by_id IS NULL;

-- =====================================================================
-- PASO 2. Rechazo en el servidor (base de datos) con mensaje claro.
-- Los gastos se guardan directamente desde el navegador con Supabase,
-- por lo que la base es la única capa de servidor que lo puede garantizar.
-- Ejecutar solo cuando el PASO 1 deje 0 gastos sin solicitante.
-- =====================================================================
CREATE OR REPLACE FUNCTION expenses_require_requester()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.requested_by_id IS NULL THEN
    RAISE EXCEPTION 'El solicitante del gasto es obligatorio (requested_by_id).'
      USING ERRCODE = 'not_null_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_expenses_require_requester ON expenses;
CREATE TRIGGER trg_expenses_require_requester
BEFORE INSERT OR UPDATE ON expenses
FOR EACH ROW EXECUTE FUNCTION expenses_require_requester();

-- =====================================================================
-- PASO 3. Restricción NOT NULL. Solo después de PASO 1 (0 pendientes)
-- y con tu confirmación explícita.
-- =====================================================================
-- ALTER TABLE expenses ALTER COLUMN requested_by_id SET NOT NULL;
