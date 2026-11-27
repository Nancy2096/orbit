-- Quita al rol anon (clave pública, sin sesión) el acceso a public y storage.
-- Solo conserva lo que usan las páginas públicas con token:
--   /evaluacion/[token], /evaluacion-360/[token] y /api/onboarding/survey/[token].
-- Reversible con scripts/revoke_anon_access_rollback.sql (usa la foto de permisos
-- que se guarda en ops_backup.anon_acl_snapshot antes de cambiar nada).

BEGIN;

-- 1) Foto de los permisos actuales (esquema no expuesto por la API)
CREATE SCHEMA IF NOT EXISTS ops_backup;
REVOKE ALL ON SCHEMA ops_backup FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS ops_backup.anon_acl_snapshot (
  taken_at   timestamptz NOT NULL,
  kind       text        NOT NULL,
  identity   text        NOT NULL,
  acl        aclitem[]
);

INSERT INTO ops_backup.anon_acl_snapshot (taken_at, kind, identity, acl)
SELECT now(), CASE c.relkind WHEN 'S' THEN 'sequence' ELSE 'table' END,
       format('%I.%I', n.nspname, c.relname), c.relacl
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname IN ('public', 'storage') AND c.relkind IN ('r', 'v', 'm', 'p', 'f', 'S')
UNION ALL
SELECT now(), 'function', p.oid::regprocedure::text, p.proacl
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname IN ('public', 'storage')
  AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e');

-- 2) Quitar todo a anon en public
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- anon también ejecuta funciones a través de PUBLIC. authenticated y service_role
-- ya tienen permiso explícito, así que quitar PUBLIC solo afecta a anon.
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', f.sig);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', f.sig);
  END LOOP;
END $$;

-- 3) Quitar todo a anon en storage (la app no usa Supabase Storage; usa Vercel Blob)
REVOKE ALL ON ALL TABLES    IN SCHEMA storage FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA storage FROM anon;

-- 4) Que lo que se cree después no le dé acceso a anon
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public  REVOKE ALL ON TABLES    FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public  REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public  REVOKE ALL ON FUNCTIONS FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage REVOKE ALL ON TABLES    FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage REVOKE ALL ON FUNCTIONS FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- 5) Lo estrictamente necesario para las páginas públicas con token
-- /evaluacion/[token] (evaluación de candidatos, cliente del navegador)
GRANT SELECT, UPDATE ON public.evaluation_tokens     TO anon;
GRANT SELECT, UPDATE ON public.candidate_evaluations TO anon;
GRANT SELECT         ON public.evaluation_questions  TO anon;
GRANT INSERT         ON public.evaluation_responses  TO anon;
GRANT SELECT (id, first_name, last_name) ON public.candidates TO anon;

-- /evaluacion-360/[token] (evaluación 360, cliente del navegador)
GRANT SELECT, UPDATE ON public.staff_evaluation_tokens      TO anon;
GRANT SELECT, UPDATE ON public.staff_evaluation_assignments TO anon;
GRANT SELECT, UPDATE ON public.staff_evaluations            TO anon;
GRANT INSERT         ON public.staff_evaluation_responses   TO anon;
GRANT SELECT (id, first_name, last_name, position, agency_id, department_id) ON public.staff TO anon;
GRANT SELECT (id, name) ON public.agencies    TO anon;
GRANT SELECT (id, name) ON public.departments TO anon;

-- /api/onboarding/survey/[token] (ruta del servidor con la clave anon, sin sesión)
GRANT SELECT, UPDATE ON public.onboarding_surveys TO anon;
GRANT SELECT (id, staff_id) ON public.onboarding_processes TO anon;

-- 6) Verificación: lo que anon todavía puede tocar
SELECT 'tabla' AS tipo, c.relname AS objeto,
       concat_ws(', ',
         CASE WHEN has_table_privilege('anon', c.oid, 'SELECT') THEN 'SELECT' END,
         CASE WHEN has_table_privilege('anon', c.oid, 'INSERT') THEN 'INSERT' END,
         CASE WHEN has_table_privilege('anon', c.oid, 'UPDATE') THEN 'UPDATE' END,
         CASE WHEN has_table_privilege('anon', c.oid, 'DELETE') THEN 'DELETE' END,
         CASE WHEN has_any_column_privilege('anon', c.oid, 'SELECT')
               AND NOT has_table_privilege('anon', c.oid, 'SELECT') THEN 'SELECT (columnas)' END
       ) AS permisos
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname IN ('public', 'storage') AND c.relkind IN ('r', 'v', 'm', 'p')
  AND (has_any_column_privilege('anon', c.oid, 'SELECT, INSERT, UPDATE')
       OR has_table_privilege('anon', c.oid, 'DELETE'))
UNION ALL
SELECT 'funcion', p.proname, 'EXECUTE'
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND has_function_privilege('anon', p.oid, 'EXECUTE')
  AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
ORDER BY 1, 2;

NOTIFY pgrst, 'reload schema';

COMMIT;
