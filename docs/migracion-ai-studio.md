# Migración de Orbit a Google (Cloud Run, Cloud SQL PostgreSQL 17, Firebase Auth)

Inventario tomado el 18/11/2026 con consultas de solo lectura a la base de producción, a Vercel Blob y al código de `main`. No se modificó nada.

**Resumen**

| Elemento | Hoy | Destino |
|---|---|---|
| Hosting | Vercel (Next.js 16.2, middleware, 1 cron) | Cloud Run + Cloud Scheduler |
| Base de datos | Supabase, PostgreSQL 17.6, 54 MB, 195 tablas (146 en `public`, 22,886 registros) | Cloud SQL PostgreSQL 17 |
| Usuarios | Supabase Auth: 31 usuarios, email y contraseña, bcrypt | Firebase Auth |
| Archivos | Vercel Blob privado: 708 archivos, 785 MB. Supabase Storage: 0 archivos | Cloud Storage |
| Código | `supabase-js` en 197 archivos (139 de navegador, 58 de servidor); `supabase.auth` en 60 | Rutas de servidor + Firebase Admin SDK |

---

## Fase 1. Hosting (Vercel → Cloud Run)

### 1.1 Aplicación

- Next.js 16.2.0, React 19, App Router. Se puede contenerizar con `output: "standalone"`.
- `middleware.ts` llama a `updateSession` (`lib/supabase/middleware.ts`) en todas las rutas excepto `/api`, estáticos e imágenes. Refresca la cookie de sesión de Supabase y agrega el encabezado `x-pathname`. Hay que reescribirlo para Firebase (cookie de sesión de Firebase verificada con el Admin SDK).
- `@vercel/analytics` está en `package.json` pero no se usa en el código. Se puede quitar.
- Hay una segunda app dentro del proyecto: `app/orbit-tasksflow/` (login, recuperar contraseña, admin, catálogos, perfil). Usa la misma sesión de Supabase.

### 1.2 Crons (`vercel.json`)

| Ruta | Horario | Qué hace |
|---|---|---|
| `/api/crm/reassign-stale` | `0 6 * * *` (06:00 UTC diario, 00:00 en CDMX) | Reasigna prospectos del CRM no atendidos: los pasa a otro asesor según la configuración de asignación de la agencia, transfiere sus tareas pendientes, registra la actividad "Reasignación de asesor" y envía un correo por asesor con su lista. |

- La ruta valida `Authorization: Bearer ${CRON_SECRET}` **solo si `CRON_SECRET` existe**. Hoy esa variable no está definida, así que la ruta acepta llamadas de cualquiera.
- En Google: Cloud Scheduler con una llamada HTTP a Cloud Run, autenticada con OIDC o con `CRON_SECRET`.

### 1.3 Variables de entorno

Solo nombres, sin valores. "Código" indica cuántas veces se leen con `process.env` en el código.

| Variable | Código | Para qué sirve | En Google |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 13 | URL de Supabase para el cliente del navegador y del servidor | Se elimina |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 3 | Clave pública de Supabase (va en el navegador) | Se elimina |
| `SUPABASE_URL` | 6 | URL de Supabase en el servidor | Se elimina |
| `SUPABASE_SERVICE_ROLE_KEY` | 11 | Cliente admin (`lib/supabase/admin.ts`), salta RLS | Se reemplaza por la conexión a Cloud SQL |
| `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWT_SECRET` | 0 | Las agrega la integración de Supabase; el código no las usa | Se eliminan |
| `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` | 0 | Redirección de correos de Supabase en desarrollo; no se usa en el código | Se elimina |
| `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_PRISMA_URL`, `POSTGRES_HOST`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE` | 0 | Conexión directa a la base de Supabase. La app no las usa; solo los scripts SQL | Conexión a Cloud SQL (Secret Manager) |
| `APP_URL` | 6 | URL pública de la app para enlaces en correos | Nueva URL de Cloud Run o dominio |
| `BLOB_READ_WRITE_TOKEN` | 0 (implícita) | Token de Vercel Blob que lee `@vercel/blob` | Se reemplaza por una cuenta de servicio de Cloud Storage |
| `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | 1 c/u | Envío de correos por Gmail SMTP (`lib/email.ts`, `smtp.gmail.com`) | Se conservan (Secret Manager) |
| `EMAIL_NOTIFICATIONS_ENABLED` | 1 | Interruptor general de correos | Se conserva |
| `EMAIL_TEST_RECIPIENT` | 1 | Si existe, todos los correos se desvían a esta dirección (pruebas) | Se conserva; vacía en producción |
| `FINANCE_REPLY_TO` | 2 | Dirección de respuesta de los correos de finanzas | Se conserva |
| `COMMERCIAL_SENDER_EMAILS` | 1 | Lista de remitentes permitidos para correos comerciales | Se conserva |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | 2 c/u | OAuth de Google por usuario para Gmail y Calendar (`lib/google.ts`) | Se conservan; agregar la nueva URL de redirección |
| `GOOGLE_REDIRECT_URI` | 1 | Redirección del OAuth de Google; si falta se usa `${origin}/api/google/callback`. **No está definida** | Definirla con la URL nueva |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | 1 c/u | Inicio de sesión con Google de NextAuth (`auth.ts`), limitado a `@agency4realestate.com` | Se reemplaza por Firebase Auth (Google) |
| `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST` | 0 (implícitas) | Configuración de NextAuth | Se eliminan si NextAuth se reemplaza |
| `MAKE_WEBHOOK_URL` | 1 | Webhook de Make.com al que `/api/citas` reenvía las citas | Se conserva |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | 2 / 1 | Envío de prefacturas con Resend (`/api/pre-invoices/[id]/send`). **No están definidas**, así que ese envío falla hoy | Decidir si se usa Resend o Gmail SMTP |
| `CRON_SECRET` | 1 | Protege `/api/crm/reassign-stale`. **No está definida** | Definirla |

### 1.4 Integraciones externas

| Integración | Dónde | Qué hace | Al migrar |
|---|---|---|---|
| Gmail SMTP | `lib/email.ts` (nodemailer, `smtp.gmail.com`) | Todos los correos de notificación: CRM, bonos, incentivos, nómina, gastos, facturas | Funciona igual desde Cloud Run. Revisar el límite diario de Gmail |
| Google OAuth por usuario (Gmail y Calendar) | `lib/google.ts`, `app/api/google/{connect,callback,status,disconnect}` | Cada usuario conecta su cuenta (permisos `gmail.send`, `calendar.events`, `userinfo.email`). Los tokens se guardan en `user_google_connections` (hoy 0 conexiones) | Agregar la nueva URL de redirección en Google Cloud Console |
| NextAuth con Google | `auth.ts`, `app/api/auth/[...nextauth]` | Inicio de sesión con Google limitado al dominio, con permiso `calendar.events`. Ningún otro archivo importa `@/auth` | Confirmar si se usa; si no, eliminar. Firebase Auth puede cubrirlo |
| Google Workspace | Dominio `agency4realestate.com` | Restricción de dominio (`hd`) en NextAuth; enlaces a Drive, Docs, Meet y Calendar guardados como texto | Configurar la restricción de dominio en Firebase Auth |
| Make.com (webhook de salida) | `app/api/citas/route.ts` | Reenvía las citas a `MAKE_WEBHOOK_URL` | Sin cambios |
| Zapier | — | **No hay ninguna referencia a Zapier en el código.** El webhook de salida es de Make.com | — |
| Webhooks de entrada de leads | `app/api/crm/inbound/[token]/route.ts`, `lib/crm/inbound-lead.ts`, `app/api/crm/webhook-token` | Reciben leads (Facebook, página web) con un token por agencia (tabla `crm_inbound_webhooks`, 2 tokens) | **Hay que actualizar la URL en cada origen (Facebook, Make, página web) el día del cambio** |
| Resend | `app/api/pre-invoices/[id]/send/route.ts` | Envío de prefacturas. Sin clave configurada | Decidir antes de migrar |
| Supabase Realtime | `app/dashboard/hr/workload/page.tsx` (`.channel()`) | Escucha cambios en `staff`, `accounts`, `projects` y `project_team_members` | Cloud SQL no tiene equivalente. Cambiar a recargas periódicas (SWR) |
| `ui-avatars.com` | Varios componentes | Avatares generados cuando no hay foto | Sin cambios |

---

## Fase 2. Base de datos (Supabase → Cloud SQL PostgreSQL 17)

### 2.1 Esquemas

| Esquema | Tablas | Registros | Al migrar |
|---|---|---|---|
| `public` | 146 (109 con datos, 37 vacías) | 22,886 | Migrar todo |
| `auth` | 27 | 3,002 (31 usuarios, 31 identidades, 77 sesiones, 2,698 refresh tokens) | No se restaura como esquema activo. Se usa para exportar usuarios (fase 3) |
| `storage` | 10 | 82 (metadatos internos, 0 archivos) | No se migra |
| `realtime` | 10 | 97 | No se migra |
| `supabase_migrations` | 1 | 115 | Solo como referencia |
| `vault` | 1 | 0 | No se migra |

### 2.2 Tablas de `public` con su número de registros

Ordenadas de mayor a menor. "RLS" indica si la tabla tiene Row Level Security activado.

| Tabla | Registros | RLS |
|---|---|---|
| `crm_tasks` | 9043 | no |
| `finance_history` | 2487 | sí |
| `crm_activities` | 2222 | no |
| `role_permissions` | 1184 | no |
| `crm_prospect_assignments` | 920 | no |
| `crm_prospects` | 896 | no |
| `crm_prospect_services` | 513 | no |
| `account_services` | 467 | no |
| `invoice_items` | 420 | no |
| `expense_approval_history` | 395 | no |
| `pre_invoice_items` | 387 | no |
| `process_steps` | 380 | no |
| `permissions` | 264 | no |
| `clients` | 206 | no |
| `invoices` | 187 | no |
| `bank_movements` | 177 | sí |
| `process_positions` | 166 | no |
| `expenses` | 156 | no |
| `staff_documents` | 151 | sí |
| `pre_invoices` | 147 | no |
| `payroll_payment_receipts` | 142 | no |
| `services` | 129 | no |
| `process_departments` | 125 | no |
| `accounts` | 124 | no |
| `account_team_members` | 120 | no |
| `crm_prospect_quotations` | 102 | no |
| `notification_reads` | 102 | no |
| `payroll_history` | 98 | sí |
| `crm_appointments` | 93 | no |
| `payments` | 86 | no |
| `processes` | 84 | no |
| `commissions` | 71 | no |
| `entity_quotations` | 50 | no |
| `salary_change_logs` | 44 | sí |
| `staff` | 36 | no |
| `third_party_payments` | 36 | no |
| `leave_requests` | 34 | no |
| `positions` | 32 | no |
| `onboarding_tasks` | 30 | sí |
| `users` | 27 | no |
| `one_to_one_reports` | 26 | no |
| `training_enrollments` | 25 | no |
| `vendors` | 25 | no |
| `recognition_balances` | 21 | sí |
| `user_agencies` | 21 | no |
| `bank_accounts` | 20 | no |
| `evaluation_questions` | 20 | sí |
| `crm_pipeline_stages` | 19 | no |
| `departments` | 18 | no |
| `crm_task_templates` | 17 | no |
| `notification_types` | 17 | no |
| `recognition_point_allocations` | 16 | sí |
| `crm_lead_sources` | 15 | no |
| `referral_sources` | 14 | no |
| `evaluation_templates` | 13 | sí |
| `loan_payments` | 13 | no |
| `contract_types` | 12 | no |
| `crm_loss_reason_categories` | 12 | no |
| `recognition_categories` | 12 | sí |
| `currencies` | 10 | no |
| `evaluation_responses` | 10 | sí |
| `expense_categories` | 10 | no |
| `vendor_types` | 10 | no |
| `crm_loss_reason_submotives` | 9 | no |
| `roles` | 9 | no |
| `account_service_commissions` | 8 | no |
| `leave_types` | 8 | no |
| `payroll_periods` | 8 | no |
| `training_courses` | 8 | no |
| `projects` | 7 | no |
| `bonus_types` | 6 | no |
| `client_contacts` | 6 | no |
| `evaluation_template_schedules` | 6 | sí |
| `industries` | 6 | no |
| `invoice_status_rules` | 6 | no |
| `onboarding_surveys` | 6 | sí |
| `products` | 6 | no |
| `third_party_payment_workflow_config` | 6 | no |
| `candidate_evaluations` | 5 | sí |
| `staff_evaluations` | 5 | sí |
| `account_commissions` | 4 | no |
| `agency_commission_types` | 4 | no |
| `agency_currencies` | 4 | no |
| `holidays` | 4 | no |
| `staff_evaluation_assignments` | 4 | sí |
| `bonuses` | 3 | no |
| `invoice_emails` | 3 | no |
| `onboarding_processes` | 3 | sí |
| `agencies` | 2 | no |
| `bonus_policies` | 2 | no |
| `candidates` | 2 | sí |
| `crm_inbound_webhooks` | 2 | sí |
| `evaluation_tokens` | 2 | sí |
| `expense_folio_counters` | 2 | sí |
| `invoice_folio_counters` | 2 | sí |
| `recognition_settings` | 2 | sí |
| `third_party_folio_counters` | 2 | sí |
| `training_categories` | 2 | no |
| `user_permission_keys` | 2 | sí |
| `user_permissions` | 2 | sí |
| `collection_activities` | 1 | sí |
| `company_settings` | 1 | no |
| `crm_assignment_members` | 1 | no |
| `crm_assignment_settings` | 1 | no |
| `crm_prospect_contacts` | 1 | no |
| `loans` | 1 | no |
| `payroll_notes` | 1 | sí |
| `recognition_transactions` | 1 | sí |
| `system_settings` | 1 | sí |
| `agency_notification_emails` | 0 | sí |
| `agency_notification_settings` | 0 | sí |
| `audit_logs` | 0 | no |
| `backup_history` | 0 | no |
| `collection_client_status` | 0 | sí |
| `crm_task_manager_settings` | 0 | no |
| `equity_transactions` | 0 | no |
| `fixed_assets` | 0 | no |
| `incentives` | 0 | sí |
| `integrations` | 0 | no |
| `leave_balances` | 0 | no |
| `leave_request_history` | 0 | no |
| `notification_settings` | 0 | no |
| `onboarding_config` | 0 | sí |
| `onboarding_materials` | 0 | sí |
| `onboarding_questions` | 0 | sí |
| `onboarding_test_attempts` | 0 | sí |
| `payment_promises` | 0 | sí |
| `payroll_details` | 0 | no |
| `project_commissions` | 0 | no |
| `project_service_commissions` | 0 | no |
| `project_services` | 0 | no |
| `project_team_members` | 0 | no |
| `quotations` | 0 | no |
| `recognition_gift_cards` | 0 | no |
| `recognition_redemptions` | 0 | no |
| `recognition_rewards` | 0 | no |
| `staff_evaluation_responses` | 0 | sí |
| `staff_evaluation_tokens` | 0 | sí |
| `training_content_progress` | 0 | no |
| `training_course_content` | 0 | no |
| `training_evaluation_answers` | 0 | no |
| `training_evaluation_attempts` | 0 | no |
| `training_evaluation_questions` | 0 | no |
| `training_evaluations` | 0 | no |
| `user_google_connections` | 0 | sí |
| `vendor_contacts` | 0 | sí |

### 2.3 Extensiones

| Extensión | Versión | En Cloud SQL |
|---|---|---|
| `plpgsql` | 1.0 | Incluida |
| `pgcrypto` | 1.3 | Disponible |
| `uuid-ossp` | 1.1 | Disponible |
| `pg_stat_statements` | 1.11 | Disponible (con un flag de la instancia) |
| `supabase_vault` | 0.3.1 | **No existe.** El vault está vacío; no se usa |

No hay `pg_cron`, `pg_net`, vistas, vistas materializadas, tipos enum ni secuencias propias en `public`.

### 2.4 Funciones de PostgreSQL (19 en `public`)

`SECDEF` = `SECURITY DEFINER`. "Supabase" indica si la función usa `auth.uid()`, `auth.jwt()` o `auth.users`.

| Función | Devuelve | Supabase | Qué hace | Se llama desde |
|---|---|---|---|---|
| `next_expense_folio(p_agency_id uuid)` | integer | No | Folio consecutivo de gastos por agencia (`expense_folio_counters`) | `.rpc()` en 2 archivos |
| `peek_expense_folio(p_agency_id uuid)` | integer | No | Muestra el siguiente folio de gasto sin consumirlo | `.rpc()` en 1 archivo |
| `next_invoice_folio(p_agency_id uuid)` | integer | No | Folio consecutivo de facturas (`invoice_folio_counters`) | `.rpc()` en 3 archivos |
| `peek_invoice_folio(p_agency_id uuid)` | integer | No | Muestra el siguiente folio de factura | `.rpc()` en 1 archivo |
| `next_third_party_folio(p_agency_id uuid)` | integer | No | Folio de pagos a terceros (`third_party_folio_counters`) | `.rpc()` en 1 archivo |
| `user_has_permission(p_user uuid, p_key text)` | boolean | No | Permisos individuales (`user_permissions`); superadmin y director general siempre pasan | Triggers de comisiones |
| `enforce_service_commission_edit()` | trigger | **Sí** | Exige `accounts.edit_commissions` para tocar `account_service_commissions` | Trigger |
| `enforce_service_commissionable_edit()` | trigger | **Sí** | Exige `accounts.edit_commissions` para cambiar `account_services.is_commissionable` | Trigger |
| `finance_history_actor()` | uuid | **Sí** | Devuelve quién hizo el cambio (`auth.uid()`) para el historial de finanzas | Triggers de historial |
| `log_finance_history()` | trigger | No (usa `finance_history_actor`) | Registra altas y cambios de estado en `finance_history` | Triggers |
| `log_finance_payment()` | trigger | No (usa `finance_history_actor`) | Registra pagos en `finance_history` | Trigger |
| `log_finance_payment_delete()` | trigger | No (usa `finance_history_actor`) | Registra pagos borrados | Trigger |
| `finance_status_label(s text)` | text | No | Traduce estados a texto en español | Funciones de historial |
| `handle_new_user()` | trigger | Depende de `auth.users` | Crea el registro en `public.users` cuando se crea un usuario en `auth.users` | Trigger en `auth.users` |
| `mark_prospect_attended_on_activity()` | trigger | No | Marca un prospecto como atendido al registrar una actividad | Trigger |
| `mark_prospect_attended_on_change()` | trigger | No | Marca un prospecto como atendido al cambiarlo | Trigger |
| `set_pre_invoices_updated_at()` | trigger | No | Actualiza `updated_at` de prefacturas | Trigger |
| `sync_agency_catalogs(p_source uuid, p_target uuid)` | void | No | Copia catálogos de una agencia a otra | `.rpc()` en 1 archivo |
| `sync_agency_config(p_source uuid, p_target uuid)` | void | No | Copia configuración de una agencia a otra | `.rpc()` en 1 archivo |

El código también llama dos funciones que **no existen en la base**:
- `exec_sql`, en `app/dashboard/invoices/third-party/workflow/page.tsx`. Hoy falla. No debe recrearse: ejecutaría SQL arbitrario.
- `increment`, en `app/dashboard/hr/vacations/page.tsx`, usada dentro de un `.update()`. Hoy no hace lo esperado.

### 2.5 Triggers (12 en `public`, 1 en `auth`)

| Tabla | Trigger | Momento | Función |
|---|---|---|---|
| `auth.users` | `on_auth_user_created` | AFTER INSERT | `handle_new_user()` |
| `account_service_commissions` | `trg_enforce_service_commission_edit` | BEFORE INSERT/UPDATE/DELETE | `enforce_service_commission_edit()` |
| `account_services` | `trg_enforce_service_commissionable_edit` | BEFORE UPDATE | `enforce_service_commissionable_edit()` |
| `crm_activities` | `trg_mark_attended_on_activity` | AFTER INSERT | `mark_prospect_attended_on_activity()` |
| `crm_prospects` | `trg_mark_attended_on_change` | BEFORE UPDATE | `mark_prospect_attended_on_change()` |
| `expenses` | `trg_finance_history` | AFTER INSERT/UPDATE | `log_finance_history('expense')` |
| `invoices` | `trg_finance_history` | AFTER INSERT/UPDATE | `log_finance_history('invoice')` |
| `pre_invoices` | `trg_finance_history` | AFTER INSERT/UPDATE | `log_finance_history('pre_invoice')` |
| `pre_invoices` | `trg_pre_invoices_updated_at` | BEFORE UPDATE | `set_pre_invoices_updated_at()` |
| `third_party_payments` | `trg_finance_history` | AFTER INSERT/UPDATE | `log_finance_history('third_party_payment')` |
| `payments` | `trg_finance_history` | AFTER INSERT/UPDATE | `log_finance_payment()` |
| `payments` | `trg_finance_history_delete` | AFTER DELETE | `log_finance_payment_delete()` |

Los triggers de `storage.buckets` y `storage.objects` son internos de Supabase y no se migran.

### 2.6 Seguridad: RLS, políticas y permisos

- **44 tablas** de `public` tienen RLS activado y **102 no**.
- Hay **77 políticas** en `public` y 3 en `storage.objects`. Usan los roles `authenticated`, `anon` y `public`, que no existen en Cloud SQL.
- 4 tablas tienen políticas con `auth.uid()`: `bank_movements`, `payroll_history` (insert), `user_google_connections` y `user_permissions`.
- El rol `anon` tiene permisos sobre **145 de las 146 tablas** (todas menos `incentives`). Esto significa que hoy casi toda la base puede leerse y modificarse con la clave pública del navegador. En Cloud SQL ese riesgo desaparece si nadie se conecta desde el navegador.
- Políticas con `authenticated` (solo usuarios con sesión): `agency_notification_emails`, `agency_notification_settings`, `crm_inbound_webhooks`, `evaluation_template_schedules`, `evaluation_templates`, `finance_history`, `incentives`, `payroll_history`, `payroll_notes`, `recognition_*` (5 tablas), `salary_change_logs`, `system_settings`, `user_permission_keys`, `user_permissions`.
- Políticas abiertas a `public` (cualquiera): `candidates`, `candidate_evaluations`, `evaluation_questions`, `evaluation_responses`, `evaluation_tokens`, `onboarding_*` (7 tablas), `staff_documents`, `staff_evaluation_*` (4 tablas), `vendor_contacts`, `bank_movements`, `user_google_connections`.
- **En Cloud SQL las políticas RLS no sirven tal cual.** La app se conectará con un solo usuario de base de datos desde el servidor. Hay dos opciones:
  1. Quitar RLS y validar en las rutas del servidor (recomendado).
  2. Conservar RLS pasando el usuario con `SET LOCAL app.user_id` y reescribiendo cada política con `current_setting('app.user_id', true)`.

### 2.7 Pendientes ya anotados en `docs/cloud-sql-migration-todo.md`

**Permisos individuales (`scripts/user_permissions.sql`)**
- [ ] RLS de `user_permissions` y `user_permission_keys` (usan `TO authenticated` y `auth.uid()`). Filtrar la lectura en el servidor.
- [ ] `user_has_permission(p_user, p_key)`: se puede conservar. Revisar `SECURITY DEFINER` y `search_path` con el nuevo dueño.
- [ ] Trigger `trg_enforce_service_commission_edit` (`enforce_service_commission_edit`): usa `auth.uid()` y deja pasar si es nulo. Pasar el usuario con `SET LOCAL app.user_id` o mover la validación a la API.
- [ ] Trigger `trg_enforce_service_commissionable_edit` (`enforce_service_commissionable_edit`): mismo caso.
- [ ] Regla "auth.uid() nulo = proceso del sistema": definir cómo distinguir procesos del sistema de acciones de usuario.
- [ ] Escrituras desde el navegador en la edición de cuentas (`app/dashboard/accounts/[id]/page.tsx`): pasarlas a rutas del servidor que validen `accounts.edit_commissions`.
- [ ] Carga de permisos en pantalla (`components/dashboard/permissions-provider.tsx`, `lib/user-permissions.ts`): cambiar a una ruta del servidor.

**Incentivos (`scripts/hr_incentives.sql`)**
- [ ] Tabla `incentives` con sus llaves foráneas a `agencies`, `staff`, `users`, `currencies` y `payroll_periods`, sus `CHECK` y sus índices.
- [ ] RLS y permisos de `incentives` (política `incentives_select_authenticated`, nada para `anon`). Lectura por rutas del servidor.
- [ ] Lecturas desde el navegador en `components/hr/incentives-tab.tsx`, `app/dashboard/hr/bonuses/incentives/new/page.tsx`, `app/dashboard/hr/bonuses/incentives/[id]/page.tsx` y `app/dashboard/hr/payroll/[id]/page.tsx`.
- [ ] Sesión y service role en `lib/incentives-server.ts` (`supabase.auth.getUser()` y `createAdminClient()`), de los que dependen las rutas `app/api/incentives/**`.
- [ ] Comprobantes en Vercel Blob (`incentives/<id>/...`): si se mueven a Cloud Storage, migrar los objetos y actualizar `receipt_url` y `receipt_pathname`.

**Agregados en este inventario**
- [ ] `finance_history_actor()` usa `auth.uid()`: el historial de finanzas quedaría sin autor.
- [ ] `handle_new_user()` y su trigger en `auth.users`: la creación de `public.users` debe pasar al alta de usuarios en el servidor (con Firebase Admin).
- [ ] Llaves foráneas a `auth.users` desde `public.users` (`users_id_fkey`), `user_google_connections` y `pre_invoices.created_by`: quitarlas o apuntarlas a `public.users`.
- [ ] Supabase Realtime en la página de carga de trabajo.
- [ ] Llamadas a `exec_sql` e `increment`, que no existen.

### 2.8 Uso de `supabase-js` en el código

De 394 archivos de código (sin contar `scripts/`):

| Tipo | Archivos |
|---|---|
| **Usan el cliente de Supabase** (`@supabase/supabase-js`, `@supabase/ssr`, `lib/supabase/*`) | **197** |
| De navegador (`"use client"`) | **139** |
| De servidor | **58**: 25 rutas `app/api`, 26 en `lib/`, 6 páginas y layouts de servidor (`app/page.tsx`, `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`, `app/dashboard/agencies/page.tsx`, `app/dashboard/agencies/[id]/page.tsx`, `app/dashboard/operations/page.tsx`) y `middleware.ts` |
| Usan el cliente admin (service role) | 15 |
| Usan `supabase.auth` | **60** |
| Llaman funciones con `.rpc()` | 9 tipos de llamada (sección 2.4) |
| Usan Supabase Storage (`.storage.from`) | 0 |
| Usan Realtime (`.channel`) | 1 |

Métodos de `supabase.auth` usados:

| Método | Veces |
|---|---|
| `getUser` | 63 |
| `admin.updateUserById` | 2 |
| `admin.getUserById` | 1 |
| `admin.createUser` | 1 |
| `signInWithPassword` | 1 |
| `signUp` | 1 |
| `signOut` | 1 |
| `updateUser` | 1 |

Las 139 páginas de navegador leen y escriben directo en la base. Con Cloud SQL no hay API pública de la base, así que **cada una de esas consultas debe pasar a una ruta del servidor o a un Server Action**. Es el trabajo más grande de la migración.

---

## Fase 3. Usuarios (Supabase Auth → Firebase Auth)

| Dato | Valor |
|---|---|
| Usuarios en `auth.users` | **31** (todos confirmados, ninguno borrado ni bloqueado, ninguno anónimo) |
| Proveedor | `email` en los 31 (email y contraseña). Sin Google, SSO ni MFA |
| Algoritmo de contraseña | **bcrypt**, prefijo `$2a$`, costo 10, en los 31 |
| Usuarios en `public.users` | 27 |
| En `auth.users` sin registro en `public.users` | 4 (revisar antes de migrar) |
| En `public.users` sin usuario en `auth` | 0 |
| Sesiones activas | 77 (se pierden al migrar) |

- Firebase Auth importa contraseñas bcrypt sin pedir que se restablezcan (`firebase auth:import --hash-algo=BCRYPT`). Los usuarios conservan su contraseña.
- **Conservar el mismo `uid`**: importar cada usuario con el `id` de Supabase como `uid` de Firebase. Así no hay que cambiar `public.users.id` ni las llaves foráneas que apuntan a usuarios.
- Inicio de sesión: `app/auth/login` y `app/orbit-tasksflow/login` usan `signInWithPassword`. Recuperación de contraseña: `app/orbit-tasksflow/forgot-password`. Alta de usuarios por administrador: `app/api/admin/users` y `app/api/admin/users/[id]/credentials` con `auth.admin.*`.
- Todos los usuarios deberán iniciar sesión de nuevo el día del cambio.

---

## Fase 4. Archivos (Vercel Blob → Cloud Storage)

### 4.1 Vercel Blob (todo privado)

**708 archivos, 785.1 MB.** Se sirven con `/api/file` (y `/api/blob/image`) usando la sesión del usuario.

| Carpeta | Archivos | Tamaño | Tabla y columna donde se guarda la URL o ruta |
|---|---|---|---|
| `quotations/` | 152 | 570.42 MB | `crm_prospect_quotations.file_url` (102, URL de Blob), `entity_quotations.url` (50: 23 URL de Blob, 27 `/api/file?pathname=`), y `accounts.quotation_url`, `projects.quotation_url`, `quotations.file_url` (vacías) |
| `staff/` | 158 | 93.99 MB | `staff_documents.file_url` (151, URL de Blob) |
| `payroll-receipts/` | 148 | 26.00 MB | `payroll_payment_receipts.file_path` (142, ruta `payroll-receipts/...`) |
| `expense-receipts/` | 56 | 26.19 MB | `expenses.receipt_url` (44, ruta `expense-receipts/...`), `expenses.payment_receipt_url`, `invoices.payment_receipt_url`, `third_party_payments.receipt_url` (vacías) |
| `staff-photos/` | 59 | 25.37 MB | `staff.photo_url` (25) y `users.avatar_url` (24), URL de Blob |
| `activities/` | 98 | 18.94 MB | `crm_activities.attachment_url` (97, URL de Blob) |
| `bonuses/` | 6 | 11.40 MB | `bonuses.certificate_url` (2) y `bonuses.presentation_url` (2), URL de Blob |
| `contracts/` | 18 | 10.99 MB | `clients.contract_url` (18, `/api/file?pathname=contracts/...`) |
| `system/` | 9 | 1.70 MB | Sin referencia directa en tablas (`company_settings.favicon_url` y `backup_history.file_url` están vacías) |
| `logos/` | 4 | 0.08 MB | `agencies.logo_url` (2) y `company_settings.logo_url` (1), ruta `logos/...` |
| `incentives/` | 0 | 0 | `incentives.receipt_url` y `receipt_pathname` (todavía no hay comprobantes) |

- Hay **tres formatos** guardados: URL completa de Blob, `/api/file?pathname=...` y ruta sola (`carpeta/archivo`).
- Varios archivos de Blob no tienen registro en ninguna tabla (708 archivos contra unos 660 registros con archivo). Pueden ser huérfanos de reemplazos o borrados.
- Al migrar: copiar los objetos a Cloud Storage **conservando la misma ruta**. Después, cambiar `/api/file` para leer de Cloud Storage y reescribir con SQL las URL completas de Blob (unos 430 registros) a la ruta sola. Las rutas solas y `/api/file?pathname=` no necesitan cambios.

### 4.2 Supabase Storage

- Un bucket: `training-certificates` (público), con **0 archivos**. No hay nada que migrar.
- El código no usa `.storage.from()`.
- `training_enrollments.certificate_url` está vacía.

### 4.3 URL externas (no se migran)

- `training_courses.content_url` (6, cursos de edutin.com).
- `process_steps.resource_url` (3, Google Drive, Docs y Gemini).
- `bonuses.videocall_url` (2).

---

## Fase 5. Cambio final

1. Congelar cambios: aviso a usuarios y modo de solo lectura o ventana sin uso (de noche).
2. Respaldo final con `pg_dump` (formato custom) y verificación: 195 tablas y 31 usuarios en `auth.users`.
3. Restaurar `public` en Cloud SQL con `pg_restore --no-owner --no-acl`. Crear las funciones y triggers adaptados (sin `auth.uid()`) y quitar las llaves foráneas a `auth.users`.
4. Comparar el número de registros por tabla contra la sección 2.2.
5. Importar los 31 usuarios a Firebase Auth con bcrypt y el mismo `uid`.
6. Copia final de Blob a Cloud Storage (solo los archivos nuevos desde la copia inicial) y reescritura de URL.
7. Desplegar en Cloud Run con las variables nuevas (Secret Manager) y crear el job de Cloud Scheduler para `/api/crm/reassign-stale` con `CRON_SECRET`.
8. Actualizar las URL externas:
   - Redirecciones de OAuth en Google Cloud Console.
   - Webhooks de leads en Facebook, Make y la página web (`/api/crm/inbound/<token>`).
   - `APP_URL`.
   - El DNS del dominio.
9. Pruebas de humo: inicio de sesión, crear prospecto, lead de entrada, subir y ver archivo, folios de gasto y factura, nómina, correos.
10. Mantener Supabase y Vercel en solo lectura unas semanas como respaldo antes de darlos de baja.

---

## Riesgos (de mayor a menor)

1. **139 páginas de navegador consultan la base directamente con `supabase-js`.** Cloud SQL no tiene una API pública equivalente, así que cada lectura y escritura debe pasar a rutas del servidor. Es el trabajo más grande y donde es más fácil olvidar algo. Mitigación: migrar por módulos y usar una capa de datos común en el servidor.
2. **Permisos.** Hoy casi todo depende de la pantalla y de RLS de Supabase, y `anon` tiene acceso a 145 tablas. Al mover las consultas al servidor hay que validar permisos en cada ruta. Si no, cualquier usuario con sesión podría hacer todo.
3. **Sesión e identidad.** `supabase.auth` se usa en 60 archivos (63 llamadas a `getUser`), además de `middleware.ts`, NextAuth y 3 funciones de base (`auth.uid()`). Si se olvida una, esa ruta queda abierta o falla. Los triggers de comisiones y del historial de finanzas perderían el autor.
4. **Usuarios.** La importación a Firebase debe conservar el `uid` y el hash bcrypt. Si no, cambian los `id` y se rompen las llaves foráneas a usuarios en todo el sistema, o los usuarios tendrían que restablecer su contraseña. Además, hay 4 usuarios de `auth` sin registro en `public.users`.
5. **Archivos.** 785 MB en tres formatos de URL. `quotations/` pesa 570 MB. Si se reescriben mal, se rompen cotizaciones, documentos de personal y comprobantes de nómina. Hay archivos huérfanos que conviene decidir si se migran.
6. **Webhooks de entrada.** Si no se actualizan las URL en Facebook, Make y la página web el mismo día, **se pierden leads** sin que nadie se entere. Conviene dejar Vercel redirigiendo esas rutas unas semanas.
7. **Folios consecutivos.** `next_expense_folio`, `next_invoice_folio` y `next_third_party_folio` dependen de las tablas `*_folio_counters`. Si se escribe en las dos bases durante el cambio, se duplican folios de facturas.
8. **Cron sin protección y variables faltantes.** Faltan `CRON_SECRET`, `RESEND_API_KEY` y `GOOGLE_REDIRECT_URI`. Hay que definirlas en Google y no copiar el problema.
9. **Funciones inexistentes.** `exec_sql` e `increment` se llaman desde el código y no existen. No recrear `exec_sql`.
10. **Realtime.** La carga de trabajo de RRHH deja de actualizarse en vivo; hay que cambiarla a recargas periódicas.
11. **Correos.** Gmail SMTP tiene límites diarios de envío. Los correos de prueba se desvían si `EMAIL_TEST_RECIPIENT` queda definida en producción.
