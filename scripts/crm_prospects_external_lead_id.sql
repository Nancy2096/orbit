-- ID del lead en la plataforma de origen (Meta, Google, Zapier) para evitar duplicados.
ALTER TABLE public.crm_prospects
  ADD COLUMN IF NOT EXISTS external_lead_id text;

CREATE UNIQUE INDEX IF NOT EXISTS crm_prospects_agency_external_lead_id_key
  ON public.crm_prospects (agency_id, external_lead_id)
  WHERE external_lead_id IS NOT NULL;
