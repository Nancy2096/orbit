-- Transfiere al asesor actual del prospecto las tareas pendientes cuyo dueño es otro
-- (o está vacío), excepto las de plantillas que requieren gerente o director.
-- NO EJECUTAR sin confirmación. Correr primero la VISTA PREVIA.

-- VISTA PREVIA
WITH mgr AS (
  SELECT id FROM crm_task_templates WHERE requires_manager OR requires_director
), target AS (
  SELECT t.id AS task_id, t.title, t.due_date, t.assigned_to AS from_staff,
         p.id AS prospect_id, p.contact_name, p.assigned_to AS to_staff
  FROM crm_tasks t
  JOIN crm_prospects p ON p.id = t.prospect_id
  WHERE t.is_completed = false
    AND p.assigned_to IS NOT NULL
    AND t.assigned_to IS DISTINCT FROM p.assigned_to
    AND (t.template_id IS NULL OR t.template_id NOT IN (SELECT id FROM mgr))
)
SELECT tg.contact_name,
       coalesce(sf.first_name || ' ' || sf.last_name, '(sin asignar)') AS dueno_actual,
       st.first_name || ' ' || st.last_name AS asesor_prospecto,
       count(*) AS tareas
FROM target tg
LEFT JOIN staff sf ON sf.id = tg.from_staff
JOIN staff st ON st.id = tg.to_staff
GROUP BY 1, 2, 3
ORDER BY 2, 3, 1;
-- Esperado hoy: 79 tareas en 10 prospectos.

-- EJECUCIÓN
BEGIN;

CREATE TEMP TABLE _transfer ON COMMIT DROP AS
SELECT t.id AS task_id, t.assigned_to AS from_staff, p.id AS prospect_id,
       p.agency_id, p.assigned_to AS to_staff
FROM crm_tasks t
JOIN crm_prospects p ON p.id = t.prospect_id
WHERE t.is_completed = false
  AND p.assigned_to IS NOT NULL
  AND t.assigned_to IS DISTINCT FROM p.assigned_to
  AND (t.template_id IS NULL OR t.template_id NOT IN (
        SELECT id FROM crm_task_templates WHERE requires_manager OR requires_director));

UPDATE crm_tasks t
SET assigned_to = x.to_staff, updated_at = now()
FROM _transfer x
WHERE t.id = x.task_id;

INSERT INTO crm_activities (agency_id, prospect_id, activity_type, subject, description,
                            activity_date, is_completed, completed_at, created_by)
SELECT x.agency_id, x.prospect_id, 'note', 'Transferencia de tareas al asesor actual',
       count(*) || CASE WHEN count(*) = 1 THEN ' tarea pendiente transferida' ELSE ' tareas pendientes transferidas' END
       || ' a ' || st.first_name || ' ' || st.last_name
       || ' (antes: ' || string_agg(DISTINCT coalesce(sf.first_name || ' ' || sf.last_name, 'sin asignar'), ', ') || ')',
       now(), true, now(), NULL
FROM _transfer x
JOIN staff st ON st.id = x.to_staff
LEFT JOIN staff sf ON sf.id = x.from_staff
GROUP BY x.agency_id, x.prospect_id, st.first_name, st.last_name;

-- Verificación: debe dar 0
SELECT count(*) FROM crm_tasks t
JOIN crm_prospects p ON p.id = t.prospect_id
WHERE t.is_completed = false AND p.assigned_to IS NOT NULL
  AND t.assigned_to IS DISTINCT FROM p.assigned_to
  AND (t.template_id IS NULL OR t.template_id NOT IN (
        SELECT id FROM crm_task_templates WHERE requires_manager OR requires_director));

ROLLBACK; -- cambiar a COMMIT solo con confirmación
