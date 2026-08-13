"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  LayoutDashboard,
  FolderKanban,
  Briefcase,
  ListTodo,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Rss,
  ClipboardList,
  Bell,
  Search,
  Moon,
  Sun,
  Shield,
  History,
  FileText,
  MessageSquare,
  Clock,
  Layers,
  Wrench,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const mainNavItems = [
  { title: "Dashboard", href: "/orbit-tasksflow", icon: LayoutDashboard },
  { title: "Tareas", href: "/orbit-tasksflow/tasks", icon: ListTodo },
]

const sidebarProjects = [
  { id: "1", name: "Campaña Leads Q2", client: "Desarrolladora Horizonte" },
  { id: "2", name: "Landing Torre Central", client: "Torre Central Living" },
  { id: "3", name: "Branding Residencial", client: "Residencial Bosques" },
  { id: "4", name: "SEO Mensual Mayo", client: "Grupo Inmobiliario Altiva" },
  { id: "5", name: "Renders 3D", client: "Nova Arquitectura" },
  { id: "6", name: "Campaña Meta Ads Abril", client: "Desarrolladora Horizonte" },
]

const adminNavItems = [
  { title: "Administración", href: "/orbit-tasksflow/admin", icon: Wrench },
  { title: "Usuarios", href: "/orbit-tasksflow/users", icon: Users },
  { title: "Configuración", href: "/orbit-tasksflow/settings", icon: Settings },
]

const PROFILE_STORAGE_KEY = "orbit-tasksflow-profile"
const USER_ROLE_STORAGE_KEY = "orbit-tasksflow-user-role"

const defaultProfile = {
  name: "María García",
  email: "maria.garcia@empresa.com",
  role: "admin",
}

export function OrbitTasksFlowLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [userProfile, setUserProfile] = useState(defaultProfile)

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

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r bg-card transition-all duration-300",
          isCollapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b px-3">
          {!isCollapsed ? (
            <Link href="/orbit-tasksflow" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm">Orbit</span>
                <span className="text-[10px] text-muted-foreground -mt-0.5">TasksFlow</span>
              </div>
            </Link>
          ) : (
            <Link href="/orbit-tasksflow" className="mx-auto">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                <Layers className="h-5 w-5 text-white" />
              </div>
            </Link>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="space-y-1 px-2">
            {!isCollapsed && (
              <span className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Principal
              </span>
            )}
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/orbit-tasksflow" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    isCollapsed && "justify-center px-2"
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              )
            })}

            <Separator className="my-3" />

            {!isCollapsed ? (
              <Link
                href="/orbit-tasksflow/projects"
                className={cn(
                  "flex items-center justify-between px-2 py-1 group",
                )}
              >
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                  Cuentas y Proyectos
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            ) : (
              <Link
                href="/orbit-tasksflow/projects"
                className="flex justify-center rounded-lg px-2 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                title="Cuentas y Proyectos"
              >
                <FolderKanban className="h-4 w-4" />
              </Link>
            )}

            {sidebarProjects.map((project) => {
              const href = `/orbit-tasksflow/projects/${project.id}`
              const isActive = pathname === href
              return (
                <Link
                  key={project.id}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    isCollapsed && "justify-center px-2"
                  )}
                  title={isCollapsed ? `${project.name} · ${project.client}` : undefined}
                >
                  {isCollapsed ? (
                    <Briefcase className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <>
                      <Briefcase className="h-4 w-4 flex-shrink-0" />
                      <span className="flex flex-col min-w-0">
                        <span className="truncate leading-tight">{project.name}</span>
                        <span className="truncate text-[11px] text-muted-foreground leading-tight">
                          {project.client}
                        </span>
                      </span>
                    </>
                  )}
                </Link>
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
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    isCollapsed && "justify-center px-2"
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              )
            })}
          </nav>
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
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar tareas, proyectos..."
                className="w-64 pl-8 h-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
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
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{userProfile.name}</span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/orbit-tasksflow/profile" className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orbit-tasksflow/settings" className="flex items-center">
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
                  <Link href="/orbit-tasksflow/login" className="flex items-center text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  )
}
