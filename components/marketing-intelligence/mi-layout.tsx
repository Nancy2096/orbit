"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  LayoutDashboard,
  Building2,
  Plug,
  Database,
  BarChart3,
  Megaphone,
  Share2,
  Calendar,
  CheckSquare,
  Inbox,
  Users,
  Search,
  Trophy,
  Link2,
  FileText,
  Sparkles,
  Bell,
  Settings,
  Shield,
  History,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  LogOut,
  User,
  HelpCircle,
  Lock,
  ArrowLeft,
} from "lucide-react"
import { useTheme } from "next-themes"
import { mockMIClients, mockMIBrands } from "@/lib/marketing-intelligence/mock-data"

interface MILayoutProps {
  children: React.ReactNode
}

const mainNavItems = [
  { title: "Dashboard General", href: "/dashboard/marketing-intelligence", icon: LayoutDashboard, phase: 1 },
  { title: "Clientes y Marcas", href: "/dashboard/marketing-intelligence/clients", icon: Building2, phase: 1 },
  { title: "Conectores", href: "/dashboard/marketing-intelligence/connectors", icon: Plug, phase: 1 },
  { title: "Data Warehouse", href: "/dashboard/marketing-intelligence/data-warehouse", icon: Database, phase: 1 },
  { title: "Dashboards", href: "/dashboard/marketing-intelligence/dashboards", icon: BarChart3, phase: 1 },
  { title: "Campañas Pagadas", href: "/dashboard/marketing-intelligence/campaigns", icon: Megaphone, phase: 1 },
  { title: "Redes Orgánicas", href: "/dashboard/marketing-intelligence/social", icon: Share2, phase: 2 },
  { title: "Calendario", href: "/dashboard/marketing-intelligence/calendario", icon: Calendar, phase: 2 },
  { title: "Aprobaciones", href: "/dashboard/marketing-intelligence/aprobaciones", icon: CheckSquare, phase: 2 },
  { title: "Inbox Unificado", href: "/dashboard/marketing-intelligence/inbox", icon: Inbox, phase: 2 },
  { title: "Leads y CRM", href: "/dashboard/marketing-intelligence/leads", icon: Users, phase: 1 },
  { title: "SEO", href: "/dashboard/marketing-intelligence/seo", icon: Search, phase: 2 },
  { title: "Competidores", href: "/dashboard/marketing-intelligence/competitors", icon: Trophy, phase: 2 },
  { title: "Smartlinks", href: "/dashboard/marketing-intelligence/smartlinks", icon: Link2, phase: 2 },
  { title: "Reportes Automáticos", href: "/dashboard/marketing-intelligence/reportes", icon: FileText, phase: 3 },
  { title: "IA e Insights", href: "/dashboard/marketing-intelligence/ia-insights", icon: Sparkles, phase: 3 },
  { title: "Alertas", href: "/dashboard/marketing-intelligence/alertas", icon: Bell, phase: 3 },
  { title: "Usuarios y Permisos", href: "/dashboard/marketing-intelligence/usuarios", icon: Shield, phase: 3 },
  { title: "Bitácora", href: "/dashboard/marketing-intelligence/bitacora", icon: History, phase: 3 },
  { title: "Configuración", href: "/dashboard/marketing-intelligence/configuracion", icon: Settings, phase: 3 },
]

export function MILayout({ children }: MILayoutProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [selectedClient, setSelectedClient] = useState<string>("all")
  const [selectedBrand, setSelectedBrand] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("30d")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredBrands = selectedClient === "all" 
    ? mockMIBrands 
    : mockMIBrands.filter(b => b.clientId === selectedClient)

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "flex flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!collapsed && (
            <Link href="/dashboard/marketing-intelligence" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold">Orbit</span>
                <span className="text-[10px] text-muted-foreground">Marketing Intelligence</span>
              </div>
            </Link>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <TooltipProvider delayDuration={0}>
            <ul className="space-y-1 px-2">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard/marketing-intelligence" && pathname.startsWith(item.href) && item.href !== "#")
                const isDisabled = item.phase > 3

                return (
                  <li key={item.title}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={isDisabled ? "#" : item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                            isActive 
                              ? "bg-primary text-primary-foreground" 
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            isDisabled && "opacity-50 cursor-not-allowed"
                          )}
                          onClick={(e) => isDisabled && e.preventDefault()}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && (
                            <span className="truncate">{item.title}</span>
                          )}
                          {!collapsed && isDisabled && (
                            <Badge variant="outline" className="ml-auto text-[9px] px-1 py-0">
                              Fase {item.phase}
                            </Badge>
                          )}
                        </Link>
                      </TooltipTrigger>
                      {collapsed && (
                        <TooltipContent side="right">
                          <p>{item.title}</p>
                          {isDisabled && <p className="text-xs text-muted-foreground">Disponible en Fase {item.phase}</p>}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </li>
                )
              })}
            </ul>
          </TooltipProvider>
        </nav>

        {/* Back to Orbit */}
        <div className="border-t p-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/dashboard"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                )}
              >
                <ArrowLeft className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Volver a Orbit</span>}
              </Link>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">
                <p>Volver a Orbit</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          {/* Global Selectors */}
          <div className="flex items-center gap-4">
            <Select value={selectedClient} onValueChange={(v) => { setSelectedClient(v); setSelectedBrand("all") }}>
              <SelectTrigger className="w-[200px]">
                <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Todos los clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clientes</SelectItem>
                {mockMIClients.map(client => (
                  <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todas las marcas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las marcas</SelectItem>
                {filteredBrands.map(brand => (
                  <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[150px]">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 días</SelectItem>
                <SelectItem value="14d">Últimos 14 días</SelectItem>
                <SelectItem value="30d">Últimos 30 días</SelectItem>
                <SelectItem value="90d">Últimos 90 días</SelectItem>
                <SelectItem value="mtd">Mes actual</SelectItem>
                <SelectItem value="qtd">Trimestre actual</SelectItem>
                <SelectItem value="ytd">Año actual</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Buscar..." 
                className="w-[250px] pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                    3
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex flex-col items-start gap-1">
                  <span className="font-medium">Token expirado</span>
                  <span className="text-xs text-muted-foreground">LinkedIn Ads requiere reconexión</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1">
                  <span className="font-medium">CPL alto detectado</span>
                  <span className="text-xs text-muted-foreground">Campaña Vista Norte +15% vs objetivo</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1">
                  <span className="font-medium">Error de conexión</span>
                  <span className="text-xs text-muted-foreground">Mailchimp no sincroniza desde hace 8 días</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback>MG</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">María García</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Ayuda
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
