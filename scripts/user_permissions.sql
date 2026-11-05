-- Permisos individuales por usuario (complemento de los permisos por rol).
-- NO EJECUTADO. Ejecutar completo dentro de la transacción.
BEGIN;

-- PASO 1: catálogo de claves
CREATE TABLE IF NOT EXISTS public.user_permission_keys (
  key         text PRIMARY KEY,
  description text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.user_permission_keys (key, description) VALUES
  ('accounts.edit',             'Editar cuentas en Operaciones > Cuentas'),
  ('accounts.edit_commissions', 'Editar comisiones por servicio de una cuenta')
ON CONFLICT (key) DO NOTHING;

-- PASO 2: permisos otorgados por usuario, con quién y cuándo los otorgó/revocó
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES public.user_permission_keys(key),
  granted_by     uuid REFERENCES public.users(id),
  granted_at     timestamptz NOT NULL DEFAULT now(),
  revoked_by     uuid REFERENCES public.users(id),
  revoked_at     timestamptz,
  notes          text
);

-- Un solo permiso activo por usuario y clave; los revocados quedan como historial.
CREATE UNIQUE INDEX IF NOT EXISTS user_permissions_active_uniq
  ON public.user_permissions (user_id, permission_key) WHERE revoked_at IS NULL;

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permission_keys ENABLE ROW LEVEL SECURITY;

-- Cada usuario lee sus propios permisos; superadmin lee todos.
-- Sin políticas de escritura: solo se otorgan desde SQL o el servidor (service role).
DROP POLICY IF EXISTS user_permissions_select ON public.user_permissions;
CREATE POLICY user_permissions_select ON public.user_permissions FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON r.id = u.role_id
               WHERE u.id = auth.uid() AND r.name = 'superadmin')
  );

DROP POLICY IF EXISTS user_permission_keys_select ON public.user_permission_keys;
CREATE POLICY user_permission_keys_select ON public.user_permission_keys FOR SELECT TO authenticated
  USING (true);

-- PASO 3: funciones de validación
-- Superadmin y Director General siempre pasan; los demás, si tienen la clave activa.
CREATE OR REPLACE FUNCTION public.user_has_permission(p_user uuid, p_key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
           SELECT 1 FROM users u JOIN roles r ON r.id = u.role_id
           WHERE u.id = p_user AND r.name IN ('superadmin', 'direccion_general'))
      OR EXISTS (
           SELECT 1 FROM user_permissions up
           WHERE up.user_id = p_user AND up.permission_key = p_key AND up.revoked_at IS NULL)
$$;

-- Editar cuenta: lo de siempre (permiso de rol accounts.update, o projects.update
-- si es proyecto) más la clave individual accounts.edit.
CREATE OR REPLACE FUNCTION public.can_edit_account(p_user uuid, p_account_type text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.user_has_permission(p_user, 'accounts.edit')
      OR EXISTS (
           SELECT 1 FROM users u
           JOIN role_permissions rp ON rp.role_id = u.role_id
           JOIN permissions p ON p.id = rp.permission_id
           WHERE u.id = p_user AND p.action = 'update'
             AND (p.module = 'accounts' OR (p.module = 'projects' AND p_account_type = 'project')))
$$;

-- PASO 4: validación en el servidor (base de datos).
-- auth.uid() nulo = proceso del sistema / service role: se permite.
-- pg_trigger_depth() > 1 = borrado en cascada (p. ej. al borrar la cuenta): se permite.
CREATE OR REPLACE FUNCTION public.enforce_account_edit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
  IF NOT public.can_edit_account(auth.uid(), OLD.account_type) THEN
    RAISE EXCEPTION 'No tienes permiso para editar esta cuenta (accounts.edit)'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enforce_account_edit ON public.accounts;
CREATE TRIGGER trg_enforce_account_edit BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_account_edit();

CREATE OR REPLACE FUNCTION public.enforce_service_commission_edit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR pg_trigger_depth() > 1 THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  IF NOT public.user_has_permission(auth.uid(), 'accounts.edit_commissions') THEN
    RAISE EXCEPTION 'No tienes permiso para editar comisiones por servicio (accounts.edit_commissions)'
      USING ERRCODE = '42501';
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_enforce_service_commission_edit ON public.account_service_commissions;
CREATE TRIGGER trg_enforce_service_commission_edit
  BEFORE INSERT OR UPDATE OR DELETE ON public.account_service_commissions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_service_commission_edit();

-- Marcar/desmarcar un servicio como comisionable también es parte de las comisiones.
CREATE OR REPLACE FUNCTION public.enforce_service_commissionable_edit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
  IF NEW.is_commissionable IS DISTINCT FROM OLD.is_commissionable
     AND NOT public.user_has_permission(auth.uid(), 'accounts.edit_commissions') THEN
    RAISE EXCEPTION 'No tienes permiso para cambiar si un servicio es comisionable (accounts.edit_commissions)'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enforce_service_commissionable_edit ON public.account_services;
CREATE TRIGGER trg_enforce_service_commissionable_edit BEFORE UPDATE ON public.account_services
  FOR EACH ROW EXECUTE FUNCTION public.enforce_service_commissionable_edit();

-- PASO 5: otorgar las dos claves a Antonio Lara, registradas como otorgadas por Nancy Hernandez.
INSERT INTO public.user_permissions (user_id, permission_key, granted_by, notes)
SELECT a.id, k.key, g.id, 'Edición completa de cuentas, incluidas comisiones por servicio'
FROM public.users a
CROSS JOIN (VALUES ('accounts.edit'), ('accounts.edit_commissions')) AS k(key)
JOIN public.users g ON lower(g.email) = 'nancy@agency4realestate.com'
WHERE lower(a.email) = 'antonio@agency4realestate.com'
ON CONFLICT DO NOTHING;

-- Verificación
SELECT u.email, up.permission_key, gb.email AS granted_by, up.granted_at
FROM public.user_permissions up
JOIN public.users u ON u.id = up.user_id
LEFT JOIN public.users gb ON gb.id = up.granted_by
WHERE up.revoked_at IS NULL
ORDER BY u.email, up.permission_key;

COMMIT;

-- Revocar más adelante (deja historial):
-- UPDATE public.user_permissions SET revoked_at = now(), revoked_by = '<id de quien revoca>'
-- WHERE user_id = '<id>' AND permission_key = 'accounts.edit_commissions' AND revoked_at IS NULL;
