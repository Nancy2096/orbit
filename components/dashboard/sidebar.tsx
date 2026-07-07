"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSystemBranding } from "@/hooks/use-system-branding"
import { usePermissions } from "@/components/dashboard/permissions-provider"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Building2,
  ChevronUp,
  ChevronDown,
  LayoutDashboard,
  Users,
  Briefcase,
  FolderKanban,
  CreditCard,
  Receipt,
  DollarSign,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  UserCircle,
  UserCog,
  Layers,
  ClipboardList,
  Wallet,
  BadgePercent,
  Gift,
  HandCoins,
  FileBarChart,
  Truck,
  Activity,
  Award,
  GraduationCap,
  CalendarDays,
  Network,
  Target,
  UserPlus,
  Kanban,
  ListTodo,
  TrendingUp,
  FileUp,
  FileDown,
  ClipboardCheck,
  Brain,
  PanelLeftClose,
  PanelLeft,
  Plug,
} from "lucide-react"
import type { User } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface DashboardSidebarProps {
  user: User | null
}

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
]

const managementNavItems = [
  {
    title: "Agencias",
    url: "/dashboard/agencies",
    icon: Building2,
  },
  {
    title: "Usuarios",
    url: "/dashboard/users",
    icon: Users,
  },
  {
    title: "Roles y Permisos",
    url: "/dashboard/roles",
    icon: Shield,
  },
]

const operationsNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard/operations",
    icon: BarChart3,
  },
  {
    title: "Clientes",
    url: "/dashboard/clients",
    icon: Briefcase,
  },
  {
    title: "Cuentas",
    url: "/dashboard/accounts",
    icon: Layers,
  },
  {
    title: "Proyectos",
    url: "/dashboard/projects",
    icon: FolderKanban,
  },
]

const hrNavItems = [
  {
    title: "Dashboard RH",
    url: "/dashboard/hr",
    icon: LayoutDashboard,
  },
  {
    title: "Personal",
    url: "/dashboard/hr/staff",
    icon: UserCog,
  },
  {
    title: "Onboarding",
    url: "/dashboard/hr/onboarding",
    icon: UserPlus,
  },
  {
    title: "Organigrama",
    url: "/dashboard/hr/organigrama",
    icon: Network,
  },
  {
    title: "Cargas de Trabajo",
    url: "/dashboard/hr/workload",
    icon: Activity,
  },
  {
    title: "Evaluaciones",
    url: "/dashboard/hr/evaluations",
    icon: ClipboardCheck,
  },
  {
    title: "Nómina",
    url: "/dashboard/hr/payroll",
    icon: Wallet,
  },
  {
    title: "Bonos",
    url: "/dashboard/hr/bonuses",
    icon: Gift,
  },
  {
    title: "Préstamos",
    url: "/dashboard/hr/loans",
    icon: HandCoins,
  },
  {
    title: "Reconocimientos",
    url: "/dashboard/hr/recognitions",
    icon: Award,
  },
  {
    title: "Capacitación",
    url: "/dashboard/hr/training",
    icon: GraduationCap,
  },
  {
    title: "Solicitud Permisos",
    url: "/dashboard/hr/vacations",
    icon: CalendarDays,
  },
  {
    title: "Calendario",
    url: "/dashboard/hr/calendar",
    icon: CalendarDays,
  },
]

const financeNavItems = [
  {
    title: "Dashboard Financiero",
    url: "/dashboard/finance",
    icon: BarChart3,
  },
  {
    title: "Pre-Facturas",
    url: "/dashboard/pre-invoices",
    icon: ClipboardList,
  },
  {
    title: "Facturas y Pagos",
    url: "/dashboard/invoices",
    icon: Receipt,
  },
  {
    title: "Bancos e Ingresos",
    url: "/dashboard/payments",
    icon: CreditCard,
  },
  {
    title: "Gastos",
    url: "/dashboard/expenses",
    icon: DollarSign,
  },
  {
    title: "Proveedores",
    url: "/dashboard/vendors",
    icon: Truck,
  },
  {
    title: "Rentabilidad",
    url: "/dashboard/profitability",
    icon: BarChart3,
  },
  {
    title: "Informes Financieros",
    url: "/dashboard/finance/reports",
    icon: FileBarChart,
  },
  {
    title: "Informes Clientes",
    url: "/dashboard/finance/client-reports",
    icon: Users,
  },
]

const crmNavItems = [
  {
    title: "Dashboard CRM",
    url: "/dashboard/crm",
    icon: Target,
  },
  {
    title: "Pipeline",
    url: "/dashboard/crm/pipeline",
    icon: Kanban,
  },
  {
    title: "Prospectos",
    url: "/dashboard/crm/prospects",
    icon: UserPlus,
  },
  {
    title: "Tareas",
    url: "/dashboard/crm/tasks",
    icon: ListTodo,
  },
  {
    title: "Calendario",
    url: "/dashboard/crm/calendar",
    icon: CalendarDays,
  },
  {
    title: "Métricas",
    url: "/dashboard/crm/metrics",
    icon: TrendingUp,
  },
  {
    title: "Integraciones",
    url: "/dashboard/crm/integrations",
    icon: Plug,
  },
  {
    title: "Servicios",
    url: "/dashboard/services",
    icon: ClipboardList,
  },
  {
    title: "Comisiones",
    url: "/dashboard/hr/commissions",
    icon: BadgePercent,
  },
]

const settingsNavItems = [
  {
    title: "Importar / Exportar",
    url: "/dashboard/import-export",
    icon: FileUp,
  },
  {
    title: "Configuración",
    url: "/dashboard/settings",
    icon: Settings,
  },
]

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { branding, getLogoUrl } = useSystemBranding()
  const { state, toggleSidebar } = useSidebar()
  const { canAccessPath } = usePermissions()

  // Filtra los items de navegación según los permisos del rol del usuario.
  // Usa canAccessPath para que el menú coincida exactamente con las rutas a
  // las que el usuario realmente puede entrar (deniega por defecto).
  const filterNav = <T extends { url: string }>(items: T[]): T[] =>
    items.filter((item) => canAccessPath(item.url))

  const filteredMainNavItems = filterNav(mainNavItems)
  const filteredManagementNavItems = filterNav(managementNavItems)
  const filteredOperationsNavItems = filterNav(operationsNavItems)
  const filteredHrNavItems = filterNav(hrNavItems)
  const filteredCrmNavItems = filterNav(crmNavItems)
  const filteredFinanceNavItems = filterNav(financeNavItems)
  const filteredSettingsNavItems = filterNav(settingsNavItems)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    administracion: true,
    operaciones: true,
    rrhh: true,
    comercial: true,
    finanzas: true,
    configuracion: true,
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }
  // Generar URL de avatar a través del endpoint proxy para blobs privados
  const avatarImageUrl = user?.avatar_url 
    ? user.avatar_url.includes('.private.blob.vercel-storage.com')
      ? `/api/blob/image?url=${encodeURIComponent(user.avatar_url)}`
      : user.avatar_url
    : null

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const getUserInitials = () => {
    if (!user) return "U"
    const first = user.first_name?.[0] || ""
    const last = user.last_name?.[0] || ""
    return (first + last).toUpperCase() || user.email[0].toUpperCase()
  }

  const getUserDisplayName = () => {
    if (!user) return "Usuario"
    if (user.first_name || user.last_name) {
      return `${user.first_name || ""} ${user.last_name || ""}`.trim()
    }
    return user.email
  }

  // Estilo dinámico del sidebar basado en la configuración del sistema
  const sidebarStyle = branding.sidebar_color ? {
    '--sidebar-custom-bg': branding.sidebar_color,
    backgroundColor: branding.sidebar_color,
  } as React.CSSProperties : {}

  const isSuperAdmin = user?.role?.name === "superadmin" || user?.role?.display_name === "Super Administrador"

  return (
    <Sidebar collapsible="icon" style={sidebarStyle}>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-between px-2 py-3">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden">
            {branding.logo_url ? (
              <div className="w-9 h-9 rounded-lg overflow-hidden bg-sidebar-primary/10 flex items-center justify-center flex-shrink-0">
                <img 
                  src={getLogoUrl(branding.logo_url) || ""} 
                  alt={branding.system_name}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground flex-shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{branding.system_name}</span>
              <span className="text-xs text-sidebar-foreground/60">{branding.tagline}</span>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors group-data-[collapsible=icon]:mx-auto"
            title={state === 'expanded' ? 'Colapsar menú' : 'Expandir menú'}
          >
            {state === 'expanded' ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredManagementNavItems.length > 0 && (
        <SidebarGroup>
          <button 
            onClick={() => toggleSection('administracion')}
            className="flex items-center justify-between w-full px-2 py-1.5 text-sm font-semibold text-sidebar-foreground hover:text-sidebar-foreground/80 transition-colors group-data-[collapsible=icon]:hidden"
          >
            <span>Administración</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedSections.administracion ? '' : '-rotate-90'}`} />
          </button>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:flex hidden">Administración</SidebarGroupLabel>
          {expandedSections.administracion && (
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredManagementNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url || pathname.startsWith(item.url + "/")}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
        )}

        {filteredOperationsNavItems.length > 0 && (
        <SidebarGroup>
          <button 
            onClick={() => toggleSection('operaciones')}
            className="flex items-center justify-between w-full px-2 py-1.5 text-sm font-semibold text-sidebar-foreground hover:text-sidebar-foreground/80 transition-colors group-data-[collapsible=icon]:hidden"
          >
            <span>Operaciones</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedSections.operaciones ? '' : '-rotate-90'}`} />
          </button>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:flex hidden">Operaciones</SidebarGroupLabel>
          {expandedSections.operaciones && (
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredOperationsNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url || pathname.startsWith(item.url + "/")}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
        )}

        {filteredHrNavItems.length > 0 && (
        <SidebarGroup>
          <button 
            onClick={() => toggleSection('rrhh')}
            className="flex items-center justify-between w-full px-2 py-1.5 text-sm font-semibold text-sidebar-foreground hover:text-sidebar-foreground/80 transition-colors group-data-[collapsible=icon]:hidden"
          >
            <span>Recursos Humanos</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedSections.rrhh ? '' : '-rotate-90'}`} />
          </button>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:flex hidden">Recursos Humanos</SidebarGroupLabel>
          {expandedSections.rrhh && (
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredHrNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.url === "/dashboard/hr" 
                        ? pathname === "/dashboard/hr" 
                        : pathname === item.url || pathname.startsWith(item.url + "/")}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
        )}

        {filteredCrmNavItems.length > 0 && (
        <SidebarGroup>
          <button 
            onClick={() => toggleSection('comercial')}
            className="flex items-center justify-between w-full px-2 py-1.5 text-sm font-semibold text-sidebar-foreground hover:text-sidebar-foreground/80 transition-colors group-data-[collapsible=icon]:hidden"
          >
            <span>Comercial</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedSections.comercial ? '' : '-rotate-90'}`} />
          </button>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:flex hidden">Comercial</SidebarGroupLabel>
          {expandedSections.comercial && (
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredCrmNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url || pathname.startsWith(item.url + "/")}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
        )}

        {filteredFinanceNavItems.length > 0 && (
        <SidebarGroup>
          <button 
            onClick={() => toggleSection('finanzas')}
            className="flex items-center justify-between w-full px-2 py-1.5 text-sm font-semibold text-sidebar-foreground hover:text-sidebar-foreground/80 transition-colors group-data-[collapsible=icon]:hidden"
          >
            <span>Finanzas</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedSections.finanzas ? '' : '-rotate-90'}`} />
          </button>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:flex hidden">Finanzas</SidebarGroupLabel>
          {expandedSections.finanzas && (
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredFinanceNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url || pathname.startsWith(item.url + "/")}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
        )}

        {filteredSettingsNavItems.length > 0 && (
        <SidebarGroup>
          <button 
            onClick={() => toggleSection('configuracion')}
            className="flex items-center justify-between w-full px-2 py-1.5 text-sm font-semibold text-sidebar-foreground hover:text-sidebar-foreground/80 transition-colors group-data-[collapsible=icon]:hidden"
          >
            <span>Configuración</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedSections.configuracion ? '' : '-rotate-90'}`} />
          </button>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:flex hidden">Configuración</SidebarGroupLabel>
          {expandedSections.configuracion && (
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredSettingsNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarImageUrl || undefined} alt={getUserDisplayName()} />
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{getUserDisplayName()}</span>
                    <span className="truncate text-xs text-sidebar-foreground/60">
                      {user?.role?.display_name || "Sin rol"}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="cursor-pointer">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Mi Perfil
                  </Link>
                </DropdownMenuItem>
                {isSuperAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/orbit-tasksflow" className="cursor-pointer">
                        <ListTodo className="mr-2 h-4 w-4" />
                        Orbit TasksFlow
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orbit-marketing-intelligence" className="cursor-pointer">
                        <Brain className="mr-2 h-4 w-4" />
                        Orbit Marketing Intelligence
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
