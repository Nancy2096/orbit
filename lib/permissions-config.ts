// Configuración compartida de permisos (categorías de secciones, etiquetas de módulos y acciones).
// Usada tanto por la lista de Roles como por la vista completa de Gestión de Permisos.

export interface SectionCategory {
  label: string
  icon: string
  modules: string[]
}

// Categorias de secciones basadas en el menu lateral del dashboard
export const sectionCategories: Record<string, SectionCategory> = {
  administracion: {
    label: "Administracion",
    icon: "building",
    modules: ["agencies", "users", "roles", "import_export"],
  },
  operaciones: {
    label: "Operaciones",
    icon: "briefcase",
    modules: ["clients", "accounts", "projects"],
  },
  comercial: {
    label: "Comercial",
    icon: "target",
    modules: [
      "crm_dashboard",
      "crm_pipeline",
      "crm_prospects",
      "crm_tasks",
      "crm_metrics",
      "crm_lead_sources",
      "crm_reassign",
      "services",
      "commissions",
    ],
  },
  recursos_humanos: {
    label: "Recursos Humanos",
    icon: "users",
    modules: [
      "staff_own",
      "staff_subordinates",
      "staff_all",
      "organigrama",
      "workload",
      "payroll_own",
      "payroll_subordinates",
      "payroll_all",
      "bonuses_own",
      "bonuses_subordinates",
      "bonuses_all",
      "loans_own",
      "loans_subordinates",
      "loans_all",
      "recognitions",
      "training",
      "vacations",
    ],
  },
  finanzas: {
    label: "Finanzas",
    icon: "dollar",
    modules: [
      "invoices",
      "invoices_workflow",
      "invoices_third_party",
      "payments",
      "expenses",
      "vendors",
      "vendors_types",
      "profitability",
      "finance_reports",
      "client_reports",
    ],
  },
  configuracion: {
    label: "Configuracion",
    icon: "cog",
    modules: ["dashboard", "settings", "profile"],
  },
}

export const moduleLabels: Record<string, string> = {
  // Administracion
  agencies: "Agencias",
  users: "Usuarios",
  roles: "Roles y Permisos",
  import_export: "Importar/Exportar",

  // Operaciones
  clients: "Clientes y Marcas",
  accounts: "Cuentas",
  projects: "Proyectos",

  // Comercial (CRM)
  crm_dashboard: "Dashboard CRM",
  crm_pipeline: "Pipeline de Ventas",
  crm_prospects: "Prospectos",
  crm_tasks: "Tareas CRM",
  crm_metrics: "Metricas CRM",
  crm_lead_sources: "Fuentes de Leads",
  crm_reassign: "Reasignacion de Prospectos",
  services: "Servicios",
  commissions: "Comisiones de Ventas",

  // Recursos Humanos - Personal
  staff_own: "Mi Informacion Personal",
  staff_subordinates: "Personal de Subordinados",
  staff_all: "Todo el Personal",
  organigrama: "Organigrama",
  workload: "Cargas de Trabajo",

  // Recursos Humanos - Nomina y Compensaciones
  payroll_own: "Mi Nomina",
  payroll_subordinates: "Nomina de Subordinados",
  payroll_all: "Toda la Nomina",
  bonuses_own: "Mis Bonos",
  bonuses_subordinates: "Bonos de Subordinados",
  bonuses_all: "Todos los Bonos",
  loans_own: "Mis Prestamos",
  loans_subordinates: "Prestamos de Subordinados",
  loans_all: "Todos los Prestamos",

  // Recursos Humanos - Otros
  recognitions: "Reconocimientos",
  training: "Capacitacion",
  vacations: "Solicitud de Permisos",

  // Finanzas
  invoices: "Facturas y Pagos",
  invoices_workflow: "Flujo de Facturas",
  invoices_third_party: "Facturas de Terceros",
  payments: "Bancos e Ingresos",
  expenses: "Gastos",
  vendors: "Proveedores",
  vendors_types: "Tipos de Proveedores",
  profitability: "Rentabilidad",
  finance_reports: "Informes Financieros",
  client_reports: "Informes de Clientes",

  // Configuracion
  dashboard: "Dashboard Principal",
  settings: "Configuracion General",
  profile: "Mi Perfil",
}

export const actionLabels: Record<string, string> = {
  // Acciones basicas CRUD
  create: "Crear",
  read: "Ver",
  update: "Editar",
  delete: "Eliminar",

  // Acciones de aprobacion
  approve: "Aprobar",
  reject: "Rechazar",

  // Acciones de asignacion
  assign: "Asignar",
  assign_role: "Asignar Rol",
  assign_team: "Asignar Equipo",
  reassign: "Reasignar",

  // Acciones de visualizacion
  read_own: "Ver Propios",
  read_subordinates: "Ver Subordinados",
  read_all: "Ver Todos",
  read_salary: "Ver Salarios",
  read_sensitive: "Ver Datos Sensibles",
  view_budget: "Ver Presupuesto",

  // Acciones de gestion
  manage: "Gestionar",
  manage_roles: "Gestionar Roles",
  manage_agencies: "Gestionar Agencias",
  manage_permissions: "Gestionar Permisos",
  manage_contacts: "Gestionar Contactos",
  manage_brands: "Gestionar Marcas y Proyectos",
  manage_tasks: "Gestionar Tareas",
  manage_team: "Gestionar Equipo",
  manage_budget: "Gestionar Presupuesto",
  manage_types: "Gestionar Tipos",
  manage_workflow: "Gestionar Flujo de Trabajo",
  manage_stages: "Gestionar Etapas",

  // Acciones comerciales
  convert_to_client: "Convertir a Cliente",
  move_stage: "Mover de Etapa",
  add_activity: "Agregar Actividad",
  manage_placements: "Gestionar Pautas",
  manage_creatives: "Gestionar Creativos",
  manage_catalogs: "Gestionar Catálogos",
  manage_documents: "Gestionar Documentos",
  manage_payments: "Gestionar Pagos",

  // Acciones financieras
  create_invoice: "Crear Facturas",
  approve_expenses: "Aprobar Gastos",
  cancel: "Cancelar",
  send: "Enviar",
  change_status: "Cambiar Estado",
  validate_invoice: "Validar Factura",
  register_payment: "Registrar Pago",

  // Acciones de procesamiento
  process: "Procesar",
  configure: "Configurar",
  export: "Exportar",
  close: "Cerrar",

  // Organigrama
  view_organigrama: "Ver Organigrama",
}

export const categoryIconKey: Record<string, string> = {
  administracion: "building",
  operaciones: "briefcase",
  comercial: "target",
  recursos_humanos: "users",
  finanzas: "dollar",
  configuracion: "cog",
}

export function getScopeLabel(scope: string): string {
  switch (scope) {
    case "global":
    case "all":
      return "Global"
    case "agency":
      return "Por Agencia"
    case "project":
      return "Por Proyecto"
    case "own":
      return "Propios"
    case "none":
      return "Sin acceso"
    default:
      return scope
  }
}

export function getModuleCategory(module: string): string {
  for (const [category, data] of Object.entries(sectionCategories)) {
    if (data.modules.includes(module)) {
      return category
    }
  }
  return "otros"
}
