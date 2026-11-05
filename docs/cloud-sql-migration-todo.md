# Cosas a rehacer en la migración a Cloud SQL

Elementos que dependen de Supabase (`auth.uid()`, rol `authenticated`, RLS con la sesión de Supabase, service role) y que no funcionarán igual en Cloud SQL.

## Permisos individuales por usuario (`scripts/user_permissions.sql`)

- [ ] **RLS de `user_permissions` y `user_permission_keys`**: las políticas usan `TO authenticated` y `auth.uid()`. En Cloud SQL no existe el rol `authenticated` ni `auth.uid()`; la lectura debe filtrarse en el servidor por el usuario de la sesión.
- [ ] **`public.user_has_permission(p_user, p_key)`**: no usa `auth.uid()` (recibe el usuario), se puede conservar tal cual. Revisar `SECURITY DEFINER` y `search_path` con el nuevo dueño de la base.
- [ ] **Trigger `trg_enforce_service_commission_edit` en `account_service_commissions`** (función `enforce_service_commission_edit`): usa `auth.uid()` para saber quién edita y lo deja pasar si es nulo (service role). En Cloud SQL hay que pasar el usuario de otra forma (por ejemplo `SET LOCAL app.user_id` en cada transacción y leerlo con `current_setting('app.user_id', true)`) o mover la validación a la API del servidor.
- [ ] **Trigger `trg_enforce_service_commissionable_edit` en `account_services`** (función `enforce_service_commissionable_edit`): mismo caso que el anterior.
- [ ] **Regla "auth.uid() nulo = proceso del sistema"**: en Cloud SQL todas las conexiones serán del servidor, así que sin un usuario explícito todo pasaría. Definir cómo distinguir procesos del sistema de acciones de usuario.
- [ ] **Escrituras desde el navegador**: la edición de cuentas (`app/dashboard/accounts/[id]/page.tsx`) escribe directo con el cliente de Supabase. En Cloud SQL debe pasar por rutas del servidor que validen `accounts.edit_commissions` antes de escribir.
- [ ] **Carga de permisos en pantalla** (`components/dashboard/permissions-provider.tsx`, `lib/user-permissions.ts`): hoy lee `user_permissions` con el cliente de Supabase y RLS. Cambiar a una ruta del servidor.
