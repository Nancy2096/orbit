-- Quita la tabla client_quotations (las cotizaciones viven en Cuentas).
-- Verificado el 26/11/2026: 0 registros, ninguna llave foránea la referencia.
-- Falla a propósito si alguien subió una cotización desde entonces.

BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.client_quotations) THEN
    RAISE EXCEPTION 'client_quotations tiene registros; no se borra';
  END IF;
END $$;

DROP TABLE public.client_quotations;

COMMIT;
