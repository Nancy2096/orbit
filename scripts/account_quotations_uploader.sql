-- Cotizaciones de cuentas: registrar quién subió cada archivo.
-- Solo agrega columnas opcionales; los registros existentes quedan con NULL.

BEGIN;

ALTER TABLE public.entity_quotations
  ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS uploaded_by_name text;

CREATE INDEX IF NOT EXISTS idx_entity_quotations_owner
  ON public.entity_quotations (owner_type, owner_id, uploaded_at DESC);

COMMIT;
