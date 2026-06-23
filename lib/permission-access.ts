// Mapa de rutas del panel a su módulo de permiso correspondiente.
// Se usa tanto para filtrar el menú lateral como para proteger el acceso por URL.

// Cada entrada es [prefijoDeRuta, módulo]. El match se hace por prefijo con
// límite de segmento, eligiendo SIEMPRE el prefijo más específico (más largo).
const PATH_MODULE_ENTRIES: [string, string][] = [
  // Gestión
  ["/dashboard/agencies", "agencies"],
  ["/dashboard/users", "users"],
  ["/dashboard/roles", "roles"],

  // Operaciones
  ["/dashboard/clients", "clients"],
  ["/dashboard/accounts", "accounts"],
  ["/dashboard/projects", "projects"],
  ["/dashboard/services", "services"],

  // Recursos Humanos (las rutas más específicas van primero por claridad)
  ["/dashboard/hr/staff", "staff"],
  ["/dashboard/hr/onboarding", "staff"],
  ["/dashboard/hr/organigrama", "organigrama"],
  ["/dashboard/hr/workload", "workload"],
  ["/dashboard/hr/evaluations", "staff"],
  ["/dashboard/hr/payroll", "payroll"],
  ["/dashboard/hr/bonuses", "bonuses"],
  ["/dashboard/hr/loans", "loans"],
  ["/dashboard/hr/recognitions", "recognitions"],
  ["/dashboard/hr/training", "training"],
  ["/dashboard/hr/vacations", "vacations"],
  ["/dashboard/hr/commissions", "commissions"],
  ["/dashboard/hr", "staff"],

  // Finanzas
  ["/dashboard/finance/reports", "finance_reports"],
  ["/dashboard/finance/client-reports", "client_reports"],
  ["/dashboard/finance", "finance"],
  ["/dashboard/invoices", "invoices"],
  ["/dashboard/payments", "payments"],
  ["/dashboard/expenses", "expenses"],
  ["/dashboard/vendors", "vendors"],
  ["/dashboard/profitability", "profitability"],

  // CRM
  ["/dashboard/crm/pipeline", "crm_pipeline"],
  ["/dashboard/crm/prospects", "crm_prospects"],
  ["/dashboard/crm/tasks", "crm_tasks"],
  ["/dashboard/crm/calendar", "crm_tasks"],
  ["/dashboard/crm/metrics", "crm_metrics"],
  ["/dashboard/crm/integrations", "settings"],
  ["/dashboard/crm", "crm_dashboard"],

  // Configuración
  ["/dashboard/import-export", "import_export"],
  ["/dashboard/settings", "settings"],
]

// Rutas siempre accesibles para cualquier usuario autenticado.
const ALWAYS_ALLOWED = ["/dashboard", "/dashboard/profile"]

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + "/")
}

// Devuelve el módulo requerido para una ruta, o null si no está mapeada
// (las rutas no mapeadas se permiten por defecto para no bloquear vistas nuevas).
export function getModuleForPath(pathname: string): string | null {
  let best: { prefix: string; module: string } | null = null
  for (const [prefix, module] of PATH_MODULE_ENTRIES) {
    if (matchesPrefix(pathname, prefix)) {
      if (!best || prefix.length > best.prefix.length) {
        best = { prefix, module }
      }
    }
  }
  return best?.module ?? null
}

export function isAlwaysAllowed(pathname: string): boolean {
  if (pathname === "/dashboard") return true
  return ALWAYS_ALLOWED.some((p) => p !== "/dashboard" && matchesPrefix(pathname, p))
}
