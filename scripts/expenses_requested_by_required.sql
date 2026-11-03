-- Solicitante obligatorio en gastos (expenses.requested_by_id).
-- NO EJECUTAR sin confirmación. Ejecutar por pasos y en este orden.

-- =====================================================================
-- PASO 0. Permitir la acción "requester_changed" en el historial de
-- aprobación (cambio de solicitante por superadmin o finanzas).
-- =====================================================================
ALTER TABLE expense_approval_history DROP CONSTRAINT expense_approval_history_action_check;
ALTER TABLE expense_approval_history ADD CONSTRAINT expense_approval_history_action_check
  CHECK (action IN ('submitted', 'approved', 'rejected', 'cancelled', 'resubmitted', 'requester_changed'));

-- =====================================================================
-- PASO 1. Llenar los 19 gastos de Pago por Cuenta de Cliente sin solicitante.
-- =====================================================================
BEGIN;

-- 1a. 16 gastos: el creador del pago (third_party_payments.created_by).
UPDATE expenses e
SET requested_by_id = p.created_by
FROM third_party_payments p
JOIN staff s ON s.id = p.created_by
WHERE p.id = e.third_party_payment_id
  AND e.requested_by_id IS NULL;
-- Esperado: UPDATE 16

-- 1b. 3 gastos sin creador en el pago ni en la factura: Nancy Lizbeth Hernandez Escamilla.
UPDATE expenses
SET requested_by_id = 'fd74de42-6a16-439f-900f-360f0820be60'
WHERE requested_by_id IS NULL
  AND expense_number IN ('GAS-2026-00022', 'GAS-2026-00070', 'GAS-2026-00071');
-- Esperado: UPDATE 3

-- Verificación: debe devolver 0. Si no, ROLLBACK.
SELECT count(*) AS sin_solicitante FROM expenses WHERE requested_by_id IS NULL;

COMMIT;

-- =====================================================================
-- PASO 2. Restricción NOT NULL (sustituye al trigger propuesto antes).
-- Solo con 0 gastos sin solicitante.
-- =====================================================================
ALTER TABLE expenses ALTER COLUMN requested_by_id SET NOT NULL;
