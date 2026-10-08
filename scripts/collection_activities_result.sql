-- Resultado de cada gestión de cobranza.
-- sent = enviado, skipped = omitido (EMAIL_NOTIFICATIONS_ENABLED != 'true'),
-- error = falló el envío, opened = WhatsApp abierto.
-- Las gestiones previas quedan con result = null.
alter table public.collection_activities
  add column if not exists result text
  check (result is null or result in ('sent', 'skipped', 'error', 'opened'));
