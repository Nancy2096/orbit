-- Asignación automática de la agencia A4R: round_robin con Heidy Bernal como única asesora habilitada.
BEGIN;

UPDATE crm_assignment_settings
   SET method = 'round_robin'
 WHERE agency_id = 'aba32668-2ef8-4233-b89c-2f02f84659c2';

INSERT INTO crm_assignment_settings (agency_id, method)
SELECT 'aba32668-2ef8-4233-b89c-2f02f84659c2', 'round_robin'
 WHERE NOT EXISTS (
   SELECT 1 FROM crm_assignment_settings WHERE agency_id = 'aba32668-2ef8-4233-b89c-2f02f84659c2'
 );

UPDATE crm_assignment_members
   SET enabled = (staff_id = '0196feab-ea27-4577-97e9-65777425fb2f')
 WHERE agency_id = 'aba32668-2ef8-4233-b89c-2f02f84659c2';

INSERT INTO crm_assignment_members (agency_id, staff_id, enabled, sort_order)
SELECT 'aba32668-2ef8-4233-b89c-2f02f84659c2', '0196feab-ea27-4577-97e9-65777425fb2f', true, 0
 WHERE NOT EXISTS (
   SELECT 1 FROM crm_assignment_members
    WHERE agency_id = 'aba32668-2ef8-4233-b89c-2f02f84659c2'
      AND staff_id = '0196feab-ea27-4577-97e9-65777425fb2f'
 );

COMMIT;
