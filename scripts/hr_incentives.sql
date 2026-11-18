-- Incentivos (Recursos Humanos > Bonos > Incentivos).
-- Flujo: pending -> approved | rejected; approved -> paid (al pagar la nómina).
-- Las escrituras pasan por rutas del servidor (service role); el navegador solo lee.

BEGIN;

CREATE TABLE IF NOT EXISTS public.incentives (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incentive_number     varchar(20) UNIQUE,
  agency_id            uuid NOT NULL REFERENCES public.agencies(id),
  staff_id             uuid NOT NULL REFERENCES public.staff(id) ON DELETE RESTRICT,
  incentive_type       varchar(40) NOT NULL DEFAULT 'performance',
  request_date         date NOT NULL DEFAULT current_date,
  description          text,
  notes                text,
  amount               numeric(14,2) NOT NULL CHECK (amount > 0),
  currency_id          uuid REFERENCES public.currencies(id),
  pay_in_payroll_date  date,
  status               varchar(20) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),

  created_by           uuid REFERENCES public.users(id),
  created_at           timestamptz NOT NULL DEFAULT now(),
  approved_by          uuid REFERENCES public.users(id),
  approved_at          timestamptz,
  rejected_by          uuid REFERENCES public.users(id),
  rejected_at          timestamptz,
  rejection_reason     text,

  receipt_url          text,
  receipt_pathname     text,
  receipt_filename     text,
  receipt_content_type text,
  receipt_uploaded_by  uuid REFERENCES public.users(id),
  receipt_uploaded_at  timestamptz,

  paid_at              timestamptz,
  payroll_period_id    uuid REFERENCES public.payroll_periods(id),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT incentives_approved_has_data CHECK (
    status NOT IN ('approved', 'paid')
    OR (approved_by IS NOT NULL AND approved_at IS NOT NULL AND pay_in_payroll_date IS NOT NULL)
  ),
  CONSTRAINT incentives_rejected_has_data CHECK (
    status <> 'rejected' OR (rejected_by IS NOT NULL AND rejected_at IS NOT NULL)
  ),
  CONSTRAINT incentives_paid_has_period CHECK (
    status <> 'paid' OR (paid_at IS NOT NULL AND payroll_period_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS incentives_agency_idx ON public.incentives (agency_id, created_at DESC);
CREATE INDEX IF NOT EXISTS incentives_staff_status_idx ON public.incentives (staff_id, status);
CREATE INDEX IF NOT EXISTS incentives_pay_date_idx ON public.incentives (pay_in_payroll_date) WHERE status IN ('approved', 'paid');
CREATE INDEX IF NOT EXISTS incentives_period_idx ON public.incentives (payroll_period_id);

-- Lectura para usuarios con sesión; nada de escritura desde el navegador.
ALTER TABLE public.incentives ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.incentives FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.incentives FROM authenticated;
GRANT SELECT ON public.incentives TO authenticated;

DROP POLICY IF EXISTS incentives_select_authenticated ON public.incentives;
CREATE POLICY incentives_select_authenticated ON public.incentives
  FOR SELECT TO authenticated USING (true);

COMMIT;

-- Verificación
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'incentives'
ORDER BY ordinal_position;

SELECT grantee, string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'incentives' AND grantee IN ('anon', 'authenticated')
GROUP BY grantee;
