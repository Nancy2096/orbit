// Mapa de rutas del panel a sus módulos de permiso correspondientes.
// Se usa tanto para filtrar el menú lateral como para proteger el acceso por URL.

// Cada entrada es [prefijoDeRuta, módulos]. Si el rol tiene CUALQUIERA de los
// módulos listados, se concede acceso (esto cubre variantes con alcance como
// staff_own / staff_all / staff_subordinates). El match se hace por prefijo con
// límite de segmento, eligiendo SIEMPRE el prefijo más específico (más largo).
const PATH_MODULE_ENTRIES: [string, string[]][] = [
  // Gestión
  ["/dashboard/agencies", ["agencies"]],
  ["/dashboard/users", ["users"]],
  ["/dashboard/roles", ["roles"]],

  // Operaciones
  ["/dashboard/operations", ["accounts", "projects", "clients"]],
  ["/dashboard/clients", ["clients"]],
  ["/dashboard/accounts", ["accounts"]],
  ["/dashboard/projects", ["projects"]],
  ["/dashboard/services", ["services"]],

  // Recursos Humanos (las rutas más específicas van primero por claridad)
  ["/dashboard/hr/staff", ["staff", "staff_all", "staff_own", "staff_subordinates"]],
  ["/dashboard/hr/onboarding", ["staff", "staff_all", "staff_own", "staff_subordinates"]],
  ["/dashboard/hr/organigrama", ["organigrama"]],
  ["/dashboard/hr/workload", ["workload"]],
  ["/dashboard/hr/evaluations", ["staff", "staff_all", "staff_own", "staff_subordinates"]],
  ["/dashboard/hr/salaries", ["payroll", "payroll_all", "staff", "staff_all"]],
  ["/dashboard/hr/payroll", ["payroll", "payroll_all", "payroll_own", "payroll_subordinates"]],
  ["/dashboard/hr/bonuses", ["bonuses", "bonuses_all", "bonuses_own", "bonuses_subordinates"]],
  ["/dashboard/hr/loans", ["loans", "loans_all", "loans_own", "loans_subordinates"]],
  ["/dashboard/hr/recognitions", ["recognitions"]],
  ["/dashboard/hr/training", ["training"]],
  ["/dashboard/hr/leave-requests", ["vacations"]],
  ["/dashboard/hr/vacations", ["vacations"]],
  ["/dashboard/hr/commissions", ["commissions"]],
  ["/dashboard/hr", ["staff", "staff_all", "staff_own", "staff_subordinates"]],

  // Finanzas
  ["/dashboard/finance/reports", ["finance_reports"]],
  ["/dashboard/finance/client-reports", ["client_reports"]],
  ["/dashboard/finance", ["finance"]],
  ["/dashboard/pre-invoices", ["invoices", "invoices_third_party", "invoices_workflow"]],
  ["/dashboard/invoices", ["invoices", "invoices_third_party", "invoices_workflow"]],
  ["/dashboard/payments", ["payments"]],
  ["/dashboard/expenses", ["expenses"]],
  ["/dashboard/vendors", ["vendors", "vendors_types"]],
  ["/dashboard/profitability", ["profitability"]],

  // CRM
  ["/dashboard/crm/pipeline", ["crm_pipeline"]],
  ["/dashboard/crm/prospects", ["crm_prospects"]],
  ["/dashboard/crm/tasks", ["crm_tasks"]],
  ["/dashboard/crm/calendar", ["crm_tasks"]],
  ["/dashboard/crm/metrics", ["crm_metrics"]],
  ["/dashboard/crm/integrations", ["settings"]],
  ["/dashboard/crm", ["crm_dashboard"]],

  // Configuración
  ["/dashboard/import-export", ["import_export"]],
  ["/dashboard/settings", ["settings"]],
]

// Rutas siempre accesibles para cualquier usuario autenticado.
const ALWAYS_ALLOWED = ["/dashboard", "/dashboard/profile"]

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + "/")
}

// Devuelve los módulos válidos para una ruta, o null si no está mapeada
// (las rutas no mapeadas se permiten por defecto para no bloquear vistas nuevas).
export function getModulesForPath(pathname: string): string[] | null {
  let best: { prefix: string; modules: string[] } | null = null
  for (const [prefix, modules] of PATH_MODULE_ENTRIES) {
    if (matchesPrefix(pathname, prefix)) {
      if (!best || prefix.length > best.prefix.length) {
        best = { prefix, modules }
      }
    }
  }
  return best?.modules ?? null
}

export function isAlwaysAllowed(pathname: string): boolean {
  if (pathname === "/dashboard") return true
  return ALWAYS_ALLOWED.some((p) => p !== "/dashboard" && matchesPrefix(pathname, p))
}
