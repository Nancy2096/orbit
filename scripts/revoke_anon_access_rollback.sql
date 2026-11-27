-- Revierte scripts/revoke_anon_access.sql: devuelve a anon (y a PUBLIC en
-- funciones) exactamente los permisos de la última foto en ops_backup.anon_acl_snapshot.

BEGIN;

DO $$
DECLARE
  snap timestamptz;
  r record;
BEGIN
  SELECT max(taken_at) INTO snap FROM ops_backup.anon_acl_snapshot;
  IF snap IS NULL THEN
    RAISE EXCEPTION 'No hay foto de permisos en ops_backup.anon_acl_snapshot';
  END IF;

  -- Quitar los permisos mínimos (incluidos los de columnas) antes de restaurar
  FOR r IN SELECT identity, kind FROM ops_backup.anon_acl_snapshot WHERE taken_at = snap LOOP
    IF r.kind = 'function' THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', r.identity);
    ELSIF r.kind = 'sequence' THEN
      EXECUTE format('REVOKE ALL ON SEQUENCE %s FROM anon', r.identity);
    ELSE
      EXECUTE format('REVOKE ALL ON TABLE %s FROM anon', r.identity);
    END IF;
  END LOOP;

  FOR r IN
    SELECT s.kind, s.identity, a.privilege_type,
           CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE 'anon' END AS grantee
    FROM ops_backup.anon_acl_snapshot s
    CROSS JOIN LATERAL aclexplode(s.acl) a
    WHERE s.taken_at = snap
      AND (a.grantee = 'anon'::regrole OR (a.grantee = 0 AND s.kind = 'function'))
  LOOP
    EXECUTE format('GRANT %s ON %s %s TO %s',
      r.privilege_type,
      CASE r.kind WHEN 'function' THEN 'FUNCTION' WHEN 'sequence' THEN 'SEQUENCE' ELSE 'TABLE' END,
      r.identity, r.grantee);
  END LOOP;
END $$;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public  GRANT ALL ON TABLES    TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public  GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public  GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES    TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT EXECUTE ON FUNCTIONS TO PUBLIC;

NOTIFY pgrst, 'reload schema';

COMMIT;
