-- =============================================
-- SISTEMA DE GESTION MULTIAGENCIA
-- Script 002: Seed Roles and Permissions
-- =============================================

-- =============================================
-- INSERT PERMISSIONS
-- =============================================
INSERT INTO public.permissions (module, action, description) VALUES
-- Agencies
('agencies', 'create', 'Crear agencias'),
('agencies', 'read', 'Ver agencias'),
('agencies', 'update', 'Editar agencias'),
('agencies', 'delete', 'Eliminar agencias'),
-- Users
('users', 'create', 'Crear usuarios'),
('users', 'read', 'Ver usuarios'),
('users', 'update', 'Editar usuarios'),
('users', 'delete', 'Eliminar usuarios'),
('users', 'assign_role', 'Asignar roles'),
-- Roles
('roles', 'create', 'Crear roles'),
('roles', 'read', 'Ver roles'),
('roles', 'update', 'Editar roles'),
('roles', 'delete', 'Eliminar roles'),
-- Clients
('clients', 'create', 'Crear clientes'),
('clients', 'read', 'Ver clientes'),
('clients', 'update', 'Editar clientes'),
('clients', 'delete', 'Eliminar clientes'),
-- Projects
('projects', 'create', 'Crear proyectos'),
('projects', 'read', 'Ver proyectos'),
('projects', 'update', 'Editar proyectos'),
('projects', 'delete', 'Eliminar proyectos'),
('projects', 'assign_team', 'Asignar equipo'),
('projects', 'close', 'Cerrar proyectos'),
-- Staff
('staff', 'create', 'Crear staff'),
('staff', 'read', 'Ver staff'),
('staff', 'update', 'Editar staff'),
('staff', 'delete', 'Eliminar staff'),
('staff', 'read_salary', 'Ver salarios'),
-- Finance
('finance', 'read_global', 'Ver finanzas globales'),
('finance', 'read_agency', 'Ver finanzas de agencia'),
('finance', 'create_invoice', 'Crear facturas'),
('finance', 'manage_payments', 'Gestionar pagos'),
('finance', 'approve_expenses', 'Aprobar gastos'),
-- Payroll
('payroll', 'read', 'Ver nomina'),
('payroll', 'process', 'Procesar nomina'),
('payroll', 'approve', 'Aprobar nomina'),
-- Commissions
('commissions', 'read', 'Ver comisiones'),
('commissions', 'configure', 'Configurar comisiones'),
('commissions', 'approve', 'Aprobar comisiones'),
-- Reports
('reports', 'read_global', 'Ver reportes globales'),
('reports', 'read_agency', 'Ver reportes de agencia'),
('reports', 'export', 'Exportar datos'),
-- Audit
('audit', 'read', 'Ver logs de auditoria'),
-- Settings
('settings', 'manage', 'Gestionar configuracion del sistema')
ON CONFLICT (module, action) DO NOTHING;

-- =============================================
-- INSERT SYSTEM ROLES
-- =============================================
INSERT INTO public.roles (name, display_name, description, level, is_system, permissions) VALUES
('superadmin', 'Super Administrador', 'Acceso total al sistema. Configuracion y administracion tecnica.', 0, true, 
 '{"full_access": true}'
),
('direccion_general', 'Direccion General', 'Vision ejecutiva consolidada del grupo empresarial.', 0, true,
 '{"view_all_agencies": true, "view_all_reports": true, "view_all_finance": true}'
),
('direccion_agencia', 'Direccion de Agencia', 'Gestion integral de una unidad de negocio especifica.', 1, true,
 '{"manage_agency": true, "view_agency_finance": true, "approve_expenses": true}'
),
('operaciones', 'Operaciones', 'Coordinacion de la ejecucion de proyectos y recursos.', 1, true,
 '{"manage_projects": true, "assign_resources": true, "view_project_costs": true}'
),
('comercial', 'Comercial', 'Gestion de relaciones comerciales y desarrollo de negocio.', 1, true,
 '{"manage_clients": true, "create_projects": true, "view_sales": true}'
),
('finanzas', 'Finanzas / Administracion', 'Control financiero, facturacion, cobranza y pagos.', 1, true,
 '{"manage_finance": true, "process_payroll": true, "approve_expenses": true}'
),
('rrhh', 'Recursos Humanos', 'Gestion del talento, nomina y desarrollo organizacional.', 1, true,
 '{"manage_staff": true, "process_payroll": true, "view_salaries": true}'
),
('lider_cuenta', 'Lider de Cuenta', 'Gestion directa de clientes y proyectos asignados.', 2, true,
 '{"manage_assigned_clients": true, "manage_assigned_projects": true}'
),
('staff_operativo', 'Staff Operativo', 'Ejecucion de tareas y entregables en proyectos.', 2, true,
 '{"view_assigned_projects": true, "update_deliverables": true}'
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  level = EXCLUDED.level,
  permissions = EXCLUDED.permissions;

-- =============================================
-- ASSIGN PERMISSIONS TO ROLES
-- =============================================

-- Helper function to assign permissions
DO $$
DECLARE
  v_superadmin_id UUID;
  v_direccion_general_id UUID;
  v_direccion_agencia_id UUID;
  v_operaciones_id UUID;
  v_comercial_id UUID;
  v_finanzas_id UUID;
  v_rrhh_id UUID;
  v_lider_cuenta_id UUID;
  v_staff_operativo_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO v_superadmin_id FROM public.roles WHERE name = 'superadmin';
  SELECT id INTO v_direccion_general_id FROM public.roles WHERE name = 'direccion_general';
  SELECT id INTO v_direccion_agencia_id FROM public.roles WHERE name = 'direccion_agencia';
  SELECT id INTO v_operaciones_id FROM public.roles WHERE name = 'operaciones';
  SELECT id INTO v_comercial_id FROM public.roles WHERE name = 'comercial';
  SELECT id INTO v_finanzas_id FROM public.roles WHERE name = 'finanzas';
  SELECT id INTO v_rrhh_id FROM public.roles WHERE name = 'rrhh';
  SELECT id INTO v_lider_cuenta_id FROM public.roles WHERE name = 'lider_cuenta';
  SELECT id INTO v_staff_operativo_id FROM public.roles WHERE name = 'staff_operativo';

  -- Superadmin: ALL permissions with 'all' scope
  INSERT INTO public.role_permissions (role_id, permission_id, scope)
  SELECT v_superadmin_id, id, 'all' FROM public.permissions
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Direccion General: Read permissions with 'all' scope
  INSERT INTO public.role_permissions (role_id, permission_id, scope)
  SELECT v_direccion_general_id, id, 'all' FROM public.permissions 
  WHERE action = 'read' OR module IN ('reports', 'audit')
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Direccion Agencia: Full control within agency
  INSERT INTO public.role_permissions (role_id, permission_id, scope)
  SELECT v_direccion_agencia_id, id, 'agency' FROM public.permissions
  WHERE module NOT IN ('settings') OR action = 'read'
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Operaciones: Projects, Staff assignments
  INSERT INTO public.role_permissions (role_id, permission_id, scope)
  SELECT v_operaciones_id, id, 'agency' FROM public.permissions
  WHERE module IN ('projects', 'staff') AND action IN ('read', 'update', 'assign_team')
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  
  INSERT INTO public.role_permissions (role_id, permission_id, scope)
  SELECT v_operaciones_id, id, 'agency' FROM public.permissions
  WHERE module = 'clients' AND action = 'read'
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Comercial: Clients and Projects
  INSERT INTO public.role_permissions (role_id, permission_id, scope)
  SELECT v_comercial_id, id, 'agency' FROM public.permissions
  WHERE module IN ('clients') OR (module = 'projects' AND action IN ('create', 'read', 'update'))
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Finanzas: All finance related
  INSERT INTO public.role_permissions (role_id, permission_id, scope)
  SELECT v_finanzas_id, id, 'agency' FROM public.permissions
  WHERE module IN ('finance', 'payroll', 'commissions') OR (module = 'reports' AND action != 'read_global')
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- RRHH: Staff and Payroll
  INSERT INTO public.role_permissions (role_id, permission_id, scope)
  SELECT v_rrhh_id, id, 'agency' FROM public.permissions
  WHERE module IN ('staff', 'payroll') OR (module = 'users' AND action IN ('create', 'read', 'update'))
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Lider de Cuenta: Assigned clients and projects
  INSERT INTO public.role_permissions (role_id, permission_id, scope)
  SELECT v_lider_cuenta_id, id, 'own' FROM public.permissions
  WHERE (module = 'clients' AND action IN ('read', 'update')) OR 
        (module = 'projects' AND action IN ('read', 'update'))
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Staff Operativo: View assigned projects only
  INSERT INTO public.role_permissions (role_id, permission_id, scope)
  SELECT v_staff_operativo_id, id, 'own' FROM public.permissions
  WHERE module = 'projects' AND action = 'read'
  ON CONFLICT (role_id, permission_id) DO NOTHING;

END $$;
