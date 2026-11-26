-- Otorga payroll.edit_paid y payroll.cancel a Enrique Guzmán y Antonio Lara, registradas como otorgadas por Nancy Hernandez.
-- Idempotente: no duplica permisos activos.
-- Si finanzas decide otros nombres de clave, cámbialos aquí y en lib/payroll-reconciliation-server.ts.

DO $$
DECLARE
  v_granter uuid;
BEGIN
  SELECT id INTO v_granter FROM users WHERE email = 'nancy@agency4realestate.com';
  IF v_granter IS NULL THEN
    RAISE EXCEPTION 'No se encontró a Nancy Hernandez';
  END IF;

  INSERT INTO user_permissions (user_id, permission_key, granted_by, notes)
  SELECT u.id, k.key, v_granter, 'Conciliación de nómina pagada'
  FROM users u
  CROSS JOIN (VALUES ('payroll.edit_paid'), ('payroll.cancel')) AS k(key)
  WHERE u.email IN ('enrique@agency4realestate.com', 'antonio@agency4realestate.com')
    AND NOT EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = u.id AND up.permission_key = k.key AND up.revoked_at IS NULL
    );
END $$;
