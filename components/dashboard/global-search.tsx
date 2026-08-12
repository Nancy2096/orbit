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
  const grouped = useMemo(() => {
    const accessible = SEARCH_ITEMS.filter((item) => canAccessPath(item.url))
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
                  value={`${item.title} ${item.group} ${(item.keywords || []).join(" ")}`}
                  onSelect={() => handleSelect(item.url)}
                >
                  <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{item.title}</span>
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
