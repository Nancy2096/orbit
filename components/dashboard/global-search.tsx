"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { usePermissions } from "@/components/dashboard/permissions-provider"

// Catálogo de secciones buscables del sistema PRINCIPAL de Orbit.
// No incluye Orbit TasksFlow ni Orbit Marketing Intelligence (tienen su propio
// layout y buscador). Cada entrada tiene palabras clave/sinónimos para mejorar
// las coincidencias al escribir.
interface SearchItem {
  title: string
  url: string
  group: string
  // Sección padre a la que pertenece una subsección/pestaña (ej. "Capacitación").
  parent?: string
  keywords?: string[]
}

const SEARCH_ITEMS: SearchItem[] = [
  // Principal
  { title: "Dashboard", url: "/dashboard", group: "Principal", keywords: ["inicio", "home", "panel", "resumen"] },

  // Administración
  { title: "Agencias", url: "/dashboard/agencies", group: "Administración", keywords: ["agencia", "empresas"] },
  { title: "Usuarios", url: "/dashboard/users", group: "Administración", keywords: ["usuario", "cuentas", "personas"] },
  { title: "Roles y Permisos", url: "/dashboard/roles", group: "Administración", keywords: ["roles", "permisos", "accesos", "seguridad"] },

  // Operaciones
  { title: "Dashboard de Operaciones", url: "/dashboard/operations", group: "Operaciones", keywords: ["operaciones", "resumen"] },
  { title: "Clientes", url: "/dashboard/clients", group: "Operaciones", keywords: ["cliente", "empresas"] },
  { title: "Cuentas", url: "/dashboard/accounts", group: "Operaciones", keywords: ["cuenta"] },
  { title: "Proyectos", url: "/dashboard/projects", group: "Operaciones", keywords: ["proyecto"] },
  { title: "Servicios", url: "/dashboard/services", group: "Operaciones", keywords: ["servicio", "catalogo"] },

  // Recursos Humanos
  { title: "Dashboard RH", url: "/dashboard/hr", group: "Recursos Humanos", keywords: ["rrhh", "recursos humanos", "rh"] },
  { title: "Sueldos y Salarios", url: "/dashboard/hr/salaries", group: "Recursos Humanos", keywords: ["sueldo", "salario"] },
  { title: "Personal", url: "/dashboard/hr/staff", group: "Recursos Humanos", keywords: ["empleados", "staff", "colaboradores"] },
  { title: "Onboarding", url: "/dashboard/hr/onboarding", group: "Recursos Humanos", keywords: ["ingreso", "alta"] },
  { title: "Organigrama", url: "/dashboard/hr/organigrama", group: "Recursos Humanos", keywords: ["estructura", "jerarquia"] },
  { title: "Cargas de Trabajo", url: "/dashboard/hr/workload", group: "Recursos Humanos", keywords: ["carga", "trabajo"] },
  { title: "Evaluaciones", url: "/dashboard/hr/evaluations", group: "Recursos Humanos", keywords: ["evaluacion", "desempeño"] },
  { title: "Nómina", url: "/dashboard/hr/payroll", group: "Recursos Humanos", keywords: ["nomina", "pago"] },
  { title: "Bonos", url: "/dashboard/hr/bonuses", group: "Recursos Humanos", keywords: ["bono", "incentivo"] },
  { title: "Préstamos", url: "/dashboard/hr/loans", group: "Recursos Humanos", keywords: ["prestamo", "credito"] },
  { title: "Reconocimientos", url: "/dashboard/hr/recognitions", group: "Recursos Humanos", keywords: ["reconocimiento", "premio"] },
  { title: "Reuniones One 2 One", url: "/dashboard/hr/one-to-one", group: "Recursos Humanos", keywords: ["one to one", "1a1", "reunion"] },
  { title: "Capacitación", url: "/dashboard/hr/training", group: "Recursos Humanos", keywords: ["capacitacion", "curso", "entrenamiento"] },
  { title: "Solicitud de Permisos", url: "/dashboard/hr/vacations", group: "Recursos Humanos", keywords: ["vacaciones", "permiso", "ausencia"] },
  { title: "Calendario RH", url: "/dashboard/hr/calendar", group: "Recursos Humanos", keywords: ["calendario", "agenda"] },

  // Comercial
  { title: "Dashboard CRM", url: "/dashboard/crm", group: "Comercial", keywords: ["crm", "comercial", "ventas"] },
  { title: "Pipeline", url: "/dashboard/crm/pipeline", group: "Comercial", keywords: ["pipeline", "embudo", "oportunidades"] },
  { title: "Prospectos", url: "/dashboard/crm/prospects", group: "Comercial", keywords: ["prospecto", "lead", "contacto"] },
  { title: "Equipo Comercial", url: "/dashboard/crm/team", group: "Comercial", keywords: ["equipo", "asesores", "vendedores"] },
  { title: "Tareas", url: "/dashboard/crm/tasks", group: "Comercial", keywords: ["tarea", "pendientes"] },
  { title: "Calendario Comercial", url: "/dashboard/crm/calendar", group: "Comercial", keywords: ["calendario", "agenda", "citas"] },
  { title: "Métricas", url: "/dashboard/crm/metrics", group: "Comercial", keywords: ["metricas", "kpi", "indicadores"] },
  { title: "Integraciones", url: "/dashboard/crm/integrations", group: "Comercial", keywords: ["integracion", "conexiones"] },
  { title: "Comisiones Citas", url: "/dashboard/hr/commissions", group: "Comercial", keywords: ["comision", "citas"] },
  { title: "Comisiones Clientes", url: "/dashboard/commercial/client-commissions", group: "Comercial", keywords: ["comision", "clientes"] },

  // Finanzas
  { title: "Dashboard Financiero", url: "/dashboard/finance", group: "Finanzas", keywords: ["finanzas", "financiero"] },
  { title: "Pre-Facturas", url: "/dashboard/pre-invoices", group: "Finanzas", keywords: ["prefactura", "pre factura", "prefacturas"] },
  { title: "Facturas y Pagos", url: "/dashboard/invoices", group: "Finanzas", keywords: ["factura", "pago", "cobros"] },
  { title: "Bancos e Ingresos", url: "/dashboard/payments", group: "Finanzas", keywords: ["banco", "ingreso", "deposito"] },
  { title: "Gastos", url: "/dashboard/expenses", group: "Finanzas", keywords: ["gasto", "egreso"] },
  { title: "Proveedores", url: "/dashboard/vendors", group: "Finanzas", keywords: ["proveedor", "vendor"] },
  { title: "Rentabilidad", url: "/dashboard/profitability", group: "Finanzas", keywords: ["rentabilidad", "margen", "utilidad"] },
  { title: "Informes Financieros", url: "/dashboard/finance/reports", group: "Finanzas", keywords: ["informe", "reporte", "financiero"] },
  { title: "Informes de Clientes", url: "/dashboard/finance/client-reports", group: "Finanzas", keywords: ["informe", "reporte", "clientes"] },

  // Configuración
  { title: "Importar / Exportar", url: "/dashboard/import-export", group: "Configuración", keywords: ["importar", "exportar", "datos", "csv", "excel"] },
  { title: "Configuración", url: "/dashboard/settings", group: "Configuración", keywords: ["configuracion", "ajustes", "settings"] },
  { title: "Mi Perfil", url: "/dashboard/profile", group: "Configuración", keywords: ["perfil", "cuenta", "usuario"] },

  // ---- Subsecciones (pestañas internas de cada página) ----
  // Administración › Roles y Permisos
  { title: "Roles", url: "/dashboard/roles?tab=roles", group: "Administración", parent: "Roles y Permisos" },
  { title: "Permisos", url: "/dashboard/roles?tab=permissions", group: "Administración", parent: "Roles y Permisos" },
  { title: "Matriz de Permisos", url: "/dashboard/roles?tab=matrix", group: "Administración", parent: "Roles y Permisos", keywords: ["matriz"] },

  // Recursos Humanos › Organigrama
  { title: "Vista Jerárquica", url: "/dashboard/hr/organigrama?view=jerarquica", group: "Recursos Humanos", parent: "Organigrama", keywords: ["jerarquia"] },
  { title: "Vista Tarjetas", url: "/dashboard/hr/organigrama?view=tarjetas", group: "Recursos Humanos", parent: "Organigrama", keywords: ["tarjetas"] },
  { title: "Vista Lista", url: "/dashboard/hr/organigrama?view=lista", group: "Recursos Humanos", parent: "Organigrama", keywords: ["lista"] },

  // Recursos Humanos › Cargas de Trabajo
  { title: "Cargas de Trabajo", url: "/dashboard/hr/workload?tab=cargas", group: "Recursos Humanos", parent: "Cargas de Trabajo" },
  { title: "Vista de Lista", url: "/dashboard/hr/workload?tab=lista", group: "Recursos Humanos", parent: "Cargas de Trabajo", keywords: ["lista"] },

  // Recursos Humanos › Evaluaciones
  { title: "Selección", url: "/dashboard/hr/evaluations?tab=selection", group: "Recursos Humanos", parent: "Evaluaciones", keywords: ["seleccion"] },
  { title: "Permanencia", url: "/dashboard/hr/evaluations?tab=permanence", group: "Recursos Humanos", parent: "Evaluaciones" },
  { title: "Objetivos", url: "/dashboard/hr/evaluations?tab=objectives", group: "Recursos Humanos", parent: "Evaluaciones" },
  { title: "Onboarding", url: "/dashboard/hr/evaluations?tab=onboarding", group: "Recursos Humanos", parent: "Evaluaciones" },
  { title: "Dashboard de Evaluaciones", url: "/dashboard/hr/evaluations?tab=dashboard", group: "Recursos Humanos", parent: "Evaluaciones" },
  { title: "Nine Box", url: "/dashboard/hr/evaluations?tab=ninebox", group: "Recursos Humanos", parent: "Evaluaciones", keywords: ["9 box", "ninebox"] },
  { title: "Clima", url: "/dashboard/hr/evaluations?tab=climate", group: "Recursos Humanos", parent: "Evaluaciones", keywords: ["clima laboral"] },

  // Recursos Humanos › Bonos
  { title: "Bonos de Capacitación", url: "/dashboard/hr/bonuses?tab=training", group: "Recursos Humanos", parent: "Bonos", keywords: ["capacitacion"] },
  { title: "Bono fin de año", url: "/dashboard/hr/bonuses?tab=year_end", group: "Recursos Humanos", parent: "Bonos", keywords: ["aguinaldo", "fin de año"] },
  { title: "Bonos por Personal", url: "/dashboard/hr/bonuses?tab=staff", group: "Recursos Humanos", parent: "Bonos", keywords: ["personal"] },

  // Recursos Humanos › Capacitación
  { title: "Cursos", url: "/dashboard/hr/training?tab=courses", group: "Recursos Humanos", parent: "Capacitación", keywords: ["curso"] },
  { title: "Categorías", url: "/dashboard/hr/training?tab=categories", group: "Recursos Humanos", parent: "Capacitación", keywords: ["categoria"] },
  { title: "Contenido", url: "/dashboard/hr/training?tab=content", group: "Recursos Humanos", parent: "Capacitación" },
  { title: "Evaluaciones / Certificados", url: "/dashboard/hr/training?tab=evaluations", group: "Recursos Humanos", parent: "Capacitación", keywords: ["certificado", "examen"] },
  { title: "Procesos", url: "/dashboard/hr/training?tab=processes", group: "Recursos Humanos", parent: "Capacitación", keywords: ["proceso"] },
  { title: "Equipo", url: "/dashboard/hr/training?tab=team", group: "Recursos Humanos", parent: "Capacitación", keywords: ["equipo"] },

  // Recursos Humanos › Solicitud de Permisos
  { title: "Solicitudes", url: "/dashboard/hr/vacations?tab=solicitudes", group: "Recursos Humanos", parent: "Solicitud de Permisos" },
  { title: "Aprobar", url: "/dashboard/hr/vacations?tab=aprobar", group: "Recursos Humanos", parent: "Solicitud de Permisos", keywords: ["aprobacion"] },
  { title: "Mi Equipo", url: "/dashboard/hr/vacations?tab=equipo", group: "Recursos Humanos", parent: "Solicitud de Permisos" },
  { title: "Calendario de Permisos", url: "/dashboard/hr/vacations?tab=calendario", group: "Recursos Humanos", parent: "Solicitud de Permisos" },

  // Recursos Humanos › Sueldos y Salarios
  { title: "Compensación actual", url: "/dashboard/hr/salaries?tab=current", group: "Recursos Humanos", parent: "Sueldos y Salarios", keywords: ["compensacion"] },
  { title: "Evolución en el tiempo", url: "/dashboard/hr/salaries?tab=evolution", group: "Recursos Humanos", parent: "Sueldos y Salarios", keywords: ["evolucion", "historial"] },

  // Comercial › Métricas
  { title: "Pipeline", url: "/dashboard/crm/metrics?tab=pipeline", group: "Comercial", parent: "Métricas", keywords: ["embudo"] },
  { title: "Métricas por Asesores", url: "/dashboard/crm/metrics?tab=asesores", group: "Comercial", parent: "Métricas", keywords: ["asesores"] },
  { title: "Métricas por Fuentes", url: "/dashboard/crm/metrics?tab=medios", group: "Comercial", parent: "Métricas", keywords: ["medios", "fuentes"] },
  { title: "Pérdidas", url: "/dashboard/crm/metrics?tab=perdidas", group: "Comercial", parent: "Métricas", keywords: ["perdidas"] },

  // Comercial › Integraciones
  { title: "Comunicación", url: "/dashboard/crm/integrations?tab=communication", group: "Comercial", parent: "Integraciones", keywords: ["comunicacion"] },
  { title: "Publicidad", url: "/dashboard/crm/integrations?tab=advertising", group: "Comercial", parent: "Integraciones", keywords: ["ads", "anuncios"] },

  // Finanzas › Gastos
  { title: "Gastos", url: "/dashboard/expenses?tab=expenses", group: "Finanzas", parent: "Gastos" },
  { title: "Categorías de Gastos", url: "/dashboard/expenses?tab=categories", group: "Finanzas", parent: "Gastos", keywords: ["categoria"] },

  // Finanzas › Informes Financieros
  { title: "Balance General", url: "/dashboard/finance/reports?tab=balance", group: "Finanzas", parent: "Informes Financieros", keywords: ["balance"] },
  { title: "Estado de Resultados", url: "/dashboard/finance/reports?tab=income", group: "Finanzas", parent: "Informes Financieros", keywords: ["resultados", "ingresos"] },
  { title: "Flujo de Efectivo", url: "/dashboard/finance/reports?tab=cashflow", group: "Finanzas", parent: "Informes Financieros", keywords: ["flujo", "cash flow"] },
  { title: "Cambios en Patrimonio", url: "/dashboard/finance/reports?tab=equity", group: "Finanzas", parent: "Informes Financieros", keywords: ["patrimonio"] },
  { title: "EBITDA", url: "/dashboard/finance/reports?tab=ebitda", group: "Finanzas", parent: "Informes Financieros" },

  // Finanzas › Informes de Clientes
  { title: "Resumen de Cliente", url: "/dashboard/finance/client-reports?tab=overview", group: "Finanzas", parent: "Informes de Clientes", keywords: ["resumen"] },
  { title: "Facturas del Cliente", url: "/dashboard/finance/client-reports?tab=invoices", group: "Finanzas", parent: "Informes de Clientes", keywords: ["facturas"] },
  { title: "Pagos del Cliente", url: "/dashboard/finance/client-reports?tab=payments", group: "Finanzas", parent: "Informes de Clientes", keywords: ["pagos"] },
  { title: "Gastos del Cliente", url: "/dashboard/finance/client-reports?tab=expenses", group: "Finanzas", parent: "Informes de Clientes", keywords: ["gastos"] },
  { title: "Gráficas del Cliente", url: "/dashboard/finance/client-reports?tab=charts", group: "Finanzas", parent: "Informes de Clientes", keywords: ["graficas"] },

  // Configuración › Importar / Exportar
  { title: "Exportar", url: "/dashboard/import-export?tab=export", group: "Configuración", parent: "Importar / Exportar", keywords: ["exportar"] },
  { title: "Importar", url: "/dashboard/import-export?tab=import", group: "Configuración", parent: "Importar / Exportar", keywords: ["importar"] },

  // Configuración › Configuración
  { title: "Sistema", url: "/dashboard/settings?tab=system", group: "Configuración", parent: "Configuración", keywords: ["sistema"] },
  { title: "Ajustes Generales", url: "/dashboard/settings?tab=general", group: "Configuración", parent: "Configuración", keywords: ["general"] },
  { title: "Integraciones del Sistema", url: "/dashboard/settings?tab=integrations", group: "Configuración", parent: "Configuración", keywords: ["integraciones"] },
  { title: "Auditoría", url: "/dashboard/settings?tab=audit", group: "Configuración", parent: "Configuración", keywords: ["auditoria", "logs"] },
  { title: "Backup", url: "/dashboard/settings?tab=backup", group: "Configuración", parent: "Configuración", keywords: ["respaldo", "backup"] },

  // Configuración › Mi Perfil
  { title: "Perfil General", url: "/dashboard/profile?tab=general", group: "Configuración", parent: "Mi Perfil" },
  { title: "Datos Personales", url: "/dashboard/profile?tab=personal", group: "Configuración", parent: "Mi Perfil", keywords: ["personales"] },
  { title: "Seguridad", url: "/dashboard/profile?tab=security", group: "Configuración", parent: "Mi Perfil", keywords: ["contraseña", "password"] },
  { title: "Información", url: "/dashboard/profile?tab=info", group: "Configuración", parent: "Mi Perfil" },
  { title: "Notificaciones", url: "/dashboard/profile?tab=notifications", group: "Configuración", parent: "Mi Perfil", keywords: ["notificaciones"] },
]

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { canAccessPath } = usePermissions()

  // Atajo de teclado: Cmd/Ctrl + K abre el buscador.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Solo muestra las secciones a las que el usuario tiene acceso, agrupadas.
  // Se evalúa el permiso sobre la ruta base (sin el query string ?tab=...).
  const grouped = useMemo(() => {
    const accessible = SEARCH_ITEMS.filter((item) => canAccessPath(item.url.split("?")[0]))
    const groups = new Map<string, SearchItem[]>()
    for (const item of accessible) {
      if (!groups.has(item.group)) groups.set(item.group, [])
      groups.get(item.group)!.push(item)
    }
    return Array.from(groups.entries())
  }, [canAccessPath])

  const handleSelect = (url: string) => {
    setOpen(false)
    router.push(url)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Buscar en Orbit"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Buscar...</span>
        <kbd className="ml-2 hidden items-center gap-0.5 rounded border bg-background px-1.5 font-mono text-[10px] text-muted-foreground md:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Buscar en Orbit"
        description="Busca secciones y páginas dentro del sistema"
      >
        <CommandInput placeholder="Buscar secciones, páginas..." />
        <CommandList>
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          {grouped.map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map((item) => (
                <CommandItem
                  key={item.url}
                  value={`${item.title} ${item.parent || ""} ${item.group} ${(item.keywords || []).join(" ")}`}
                  onSelect={() => handleSelect(item.url)}
                >
                  <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>
                    {item.parent && (
                      <span className="text-muted-foreground">{item.parent} › </span>
                    )}
                    {item.title}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">{item.group}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}
