"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
  BarChart3,
  Megaphone,
  Share2,
  Calendar,
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
  Layers,
  CalendarRange,
  Tag,
} from "lucide-react"
import { mockMIClients } from "@/lib/marketing-intelligence/mock-data"
import { useOMIFilters, OMIFiltersProvider, PeriodType } from "@/contexts/omi-filters-context"

interface OMILayoutProps {
  children: React.ReactNode
}

const mainNavItems = [
  { title: "Dashboard General", href: "/orbit-marketing-intelligence", icon: LayoutDashboard, phase: 1 },
  { title: "Clientes", href: "/orbit-marketing-intelligence/clients", icon: Building2, phase: 1 },
  { title: "Marcas y Proyectos", href: "/orbit-marketing-intelligence/brands", icon: Tag, phase: 1 },
  { title: "Conectores", href: "/orbit-marketing-intelligence/connectors", icon: Plug, phase: 1 },
  { title: "Campañas Pagadas", href: "/orbit-marketing-intelligence/campaigns", icon: Megaphone, phase: 1 },
  { title: "Redes Orgánicas", href: "/orbit-marketing-intelligence/social", icon: Share2, phase: 2 },
  { title: "Calendario", href: "/orbit-marketing-intelligence/calendario", icon: Calendar, phase: 2 },
  { title: "Inbox Unificado", href: "/orbit-marketing-intelligence/inbox", icon: Inbox, phase: 2 },
  { title: "Leads y CRM", href: "/orbit-marketing-intelligence/leads", icon: Users, phase: 1 },
  { title: "SEO", href: "/orbit-marketing-intelligence/seo", icon: Search, phase: 2 },
  { title: "Competidores", href: "/orbit-marketing-intelligence/competitors", icon: Trophy, phase: 2 },
  { title: "Smartlinks", href: "/orbit-marketing-intelligence/smartlinks", icon: Link2, phase: 2 },
]

const adminNavItems = [
  { title: "Reportes Automáticos", href: "/orbit-marketing-intelligence/reportes", icon: FileText, phase: 3 },
  { title: "IA e Insights", href: "/orbit-marketing-intelligence/ia-insights", icon: Sparkles, phase: 3 },
  { title: "Alertas", href: "/orbit-marketing-intelligence/alertas", icon: Bell, phase: 3 },
  { title: "Usuarios y Permisos", href: "/orbit-marketing-intelligence/usuarios", icon: Shield, phase: 3 },
  { title: "Bitácora", href: "/orbit-marketing-intelligence/bitacora", icon: History, phase: 3 },
  { title: "Configuración", href: "/orbit-marketing-intelligence/configuracion", icon: Settings, phase: 3 },
]

const PROFILE_STORAGE_KEY = "orbit-mi-profile"
const USER_ROLE_STORAGE_KEY = "orbit-mi-user-role"

const defaultProfile = {
  name: "María García",
  email: "maria.garcia@empresa.com",
  role: "admin",
}

export function OMILayout({ children }: OMILayoutProps) {
  return (
    <OMIFiltersProvider>
      <OMILayoutContent>{children}</OMILayoutContent>
    </OMIFiltersProvider>
  )
}

function OMILayoutContent({ children }: OMILayoutProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [userProfile, setUserProfile] = useState(defaultProfile)
  const [searchQuery, setSearchQuery] = useState("")
  const [customDateOpen, setCustomDateOpen] = useState(false)
  
  const {
    selectedClient,
    setSelectedClient,
    selectedBrand,
    setSelectedBrand,
    selectedPeriod,
    setSelectedPeriod,
    customDateRange,
    setCustomDateRange,
    filteredBrands,
  } = useOMIFilters()

  // Cargar perfil del localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY)
    const savedRole = localStorage.getItem(USER_ROLE_STORAGE_KEY)
    
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile)
        setUserProfile(prev => ({
          ...prev,
          name: profile.name || prev.name,
          email: profile.email || prev.email,
        }))
      } catch (e) {
        console.error("Error loading profile:", e)
      }
    }
    
    if (savedRole) {
      setUserProfile(prev => ({ ...prev, role: savedRole }))
    }
  }, [])

  // Obtener iniciales del nombre
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const isAdmin = userProfile.role === "admin"

  const handlePeriodChange = (value: string) => {
    if (value === "custom") {
      setCustomDateOpen(true)
    }
    setSelectedPeriod(value as PeriodType)
  }

  const getPeriodDisplayValue = () => {
    if (selectedPeriod === "custom" && customDateRange.from && customDateRange.to) {
      return `${format(customDateRange.from, "dd MMM", { locale: es })} - ${format(customDateRange.to, "dd MMM", { locale: es })}`
    }
    return selectedPeriod
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r bg-card transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b px-3">
          {!isCollapsed ? (
            <Link href="/orbit-marketing-intelligence" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm">Orbit</span>
                <span className="text-[10px] text-muted-foreground -mt-0.5">Marketing Intelligence</span>
              </div>
            </Link>
          ) : (
            <Link href="/orbit-marketing-intelligence" className="mx-auto">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
            </Link>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <TooltipProvider delayDuration={0}>
            <nav className="space-y-1 px-2">
              {!isCollapsed && (
                <span className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Principal
                </span>
              )}
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== "/orbit-marketing-intelligence" && pathname.startsWith(item.href))
                const isDisabled = item.phase > 3
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={isDisabled ? "#" : item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          isCollapsed && "justify-center px-2",
                          isDisabled && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={(e) => isDisabled && e.preventDefault()}
                        title={isCollapsed ? item.title : undefined}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right">
                        <p>{item.title}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                )
              })}

              <Separator className="my-3" />

              {!isCollapsed && (
                <span className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Administración
                </span>
              )}
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                const isDisabled = item.phase > 3
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={isDisabled ? "#" : item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          isCollapsed && "justify-center px-2",
                          isDisabled && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={(e) => isDisabled && e.preventDefault()}
                        title={isCollapsed ? item.title : undefined}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right">
                        <p>{item.title}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                )
              })}
            </nav>
          </TooltipProvider>
        </ScrollArea>

        {/* Collapse Button */}
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Colapsar</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-14 items-center justify-between border-b bg-card px-4">
          {/* Global Selectors */}
          <div className="flex items-center gap-3">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-[180px] h-9">
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
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Todas las marcas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las marcas</SelectItem>
                {filteredBrands.map(brand => (
                  <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover open={customDateOpen} onOpenChange={setCustomDateOpen}>
              <PopoverTrigger asChild>
                <div className="flex items-center gap-2">
                  <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                    <SelectTrigger className="w-[180px] h-9">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue>
                        {selectedPeriod === "custom" && customDateRange.from && customDateRange.to
                          ? `${format(customDateRange.from, "dd/MM/yy")} - ${format(customDateRange.to, "dd/MM/yy")}`
                          : selectedPeriod === "7d" ? "Últimos 7 días"
                          : selectedPeriod === "14d" ? "Últimos 14 días"
                          : selectedPeriod === "30d" ? "Últimos 30 días"
                          : selectedPeriod === "90d" ? "Últimos 90 días"
                          : selectedPeriod === "mtd" ? "Mes actual"
                          : selectedPeriod === "qtd" ? "Trimestre actual"
                          : selectedPeriod === "ytd" ? "Año actual"
                          : selectedPeriod === "custom" ? "Personalizado"
                          : "Periodo"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Últimos 7 días</SelectItem>
                      <SelectItem value="14d">Últimos 14 días</SelectItem>
                      <SelectItem value="30d">Últimos 30 días</SelectItem>
                      <SelectItem value="90d">Últimos 90 días</SelectItem>
                      <SelectItem value="mtd">Mes actual</SelectItem>
                      <SelectItem value="qtd">Trimestre actual</SelectItem>
                      <SelectItem value="ytd">Año actual</SelectItem>
                      <Separator className="my-1" />
                      <SelectItem value="custom">
                        <div className="flex items-center gap-2">
                          <CalendarRange className="h-4 w-4" />
                          Personalizado...
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Seleccionar rango de fechas</h4>
                    <p className="text-xs text-muted-foreground">Elige las fechas de inicio y fin</p>
                  </div>
                  <CalendarComponent
                    mode="range"
                    selected={{ from: customDateRange.from, to: customDateRange.to }}
                    onSelect={(range) => setCustomDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                    locale={es}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCustomDateOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => setCustomDateOpen(false)}
                      disabled={!customDateRange.from || !customDateRange.to}
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar..."
                className="w-56 pl-8 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                3
              </Badge>
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 pl-2 pr-3">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback className="text-xs">{getInitials(userProfile.name)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{userProfile.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/orbit-marketing-intelligence/perfil" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orbit-marketing-intelligence/configuracion" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center">
                        <Layers className="mr-2 h-4 w-4" />
                        Ir al Sistema Principal
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/orbit-marketing-intelligence/login" className="flex items-center text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </Link>
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
