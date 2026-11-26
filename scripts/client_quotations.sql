-- Cotizaciones del cliente (Operaciones > Clientes > Editar Cliente > Cotización).
-- Solo crea objetos nuevos: no modifica ni borra datos existentes.
-- Las cotizaciones del prospecto de origen NO se copian: se leen de
-- crm_prospect_quotations a través de crm_prospects.converted_to_client_id.

BEGIN;

CREATE TABLE IF NOT EXISTS public.client_quotations (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         uuid        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  file_url          text        NOT NULL,          -- /api/file?pathname=client-quotations/<client_id>/...
  file_name         text        NOT NULL,
  file_size         bigint,
  mime_type         text,
  uploaded_by       uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  uploaded_by_name  text,                          -- nombre al momento de subir (se conserva si el usuario se borra)
  uploaded_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT client_quotations_file_name_not_blank CHECK (length(btrim(file_name)) > 0),
  CONSTRAINT client_quotations_file_size_positive  CHECK (file_size IS NULL OR file_size > 0)
);

CREATE INDEX IF NOT EXISTS idx_client_quotations_client
  ON public.client_quotations (client_id, uploaded_at DESC);

-- Acceso solo desde rutas del servidor (service role). Sin políticas:
-- el navegador (anon/authenticated) no puede leer ni escribir directamente.
ALTER TABLE public.client_quotations ENABLE ROW LEVEL SECURITY;

-- Índice para encontrar rápido el cliente creado desde un prospecto.
CREATE INDEX IF NOT EXISTS idx_crm_prospects_converted_client
  ON public.crm_prospects (converted_to_client_id)
  WHERE converted_to_client_id IS NOT NULL;

COMMENT ON TABLE public.client_quotations IS
  'Cotizaciones subidas directamente al cliente. Las del prospecto de origen se leen de crm_prospect_quotations.';

COMMIT;

-- Verificación (después de ejecutar):
-- SELECT column_name, data_type FROM information_schema.columns
--  WHERE table_schema = 'public' AND table_name = 'client_quotations' ORDER BY ordinal_position;
-- SELECT relrowsecurity FROM pg_class WHERE oid = 'public.client_quotations'::regclass;
