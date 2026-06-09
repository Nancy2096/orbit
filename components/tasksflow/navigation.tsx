"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Kanban,
  Calendar,
  FileCheck,
  Activity,
  FileText,
  UserCog,
} from "lucide-react"

export function TaskFlowNavigation() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === "/dashboard/tasksflow") {
      return pathname === path
    }
    return pathname.startsWith(path)
  }

  const operationalModules = [
    { href: "/dashboard/tasksflow/projects", icon: FolderKanban, label: "Cuentas y Proyectos", color: "primary" },
    { href: "/dashboard/tasksflow/tasks", icon: ListTodo, label: "Tareas", color: "blue" },
    { href: "/dashboard/tasksflow/kanban", icon: Kanban, label: "Kanban", color: "violet" },
    { href: "/dashboard/tasksflow/calendar", icon: Calendar, label: "Calendario", color: "amber" },
    { href: "/dashboard/tasksflow/deliverables", icon: FileCheck, label: "Entregables", color: "emerald" },
  ]

  const adminModules = [
    { href: "/dashboard/tasksflow", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/tasksflow/workload", icon: Activity, label: "Carga de Trabajo" },
    { href: "/dashboard/tasksflow/reports", icon: FileText, label: "Reportes" },
    { href: "/dashboard/tasksflow/admin", icon: UserCog, label: "Administración" },
  ]

  // Check if current page is an operational module (hide admin tools in these pages)
  const operationalPaths = [
    "/dashboard/tasksflow/projects",
    "/dashboard/tasksflow/tasks",
    "/dashboard/tasksflow/kanban",
    "/dashboard/tasksflow/calendar",
    "/dashboard/tasksflow/deliverables",
  ]
  const isOperationalPage = operationalPaths.some(path => pathname.startsWith(path))

  const getOperationalButtonClass = (color: string, active: boolean) => {
    const colorMap: Record<string, string> = {
      primary: active 
        ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary shadow-md" 
        : "bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary",
      blue: active 
        ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600 shadow-md" 
        : "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 text-blue-600 dark:text-blue-400",
      violet: active 
        ? "bg-violet-600 text-white hover:bg-violet-700 border-violet-600 shadow-md" 
        : "bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20 text-violet-600 dark:text-violet-400",
      amber: active 
        ? "bg-amber-600 text-white hover:bg-amber-700 border-amber-600 shadow-md" 
        : "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 text-amber-600 dark:text-amber-400",
      emerald: active 
        ? "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600 shadow-md" 
        : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    }
    return colorMap[color] || colorMap.primary
  }

  return (
    <div className="space-y-4">
      {/* Operational Modules (Primary) */}
      <div className={`space-y-3 ${isOperationalPage ? 'pb-4 border-b' : ''}`}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Módulos Operativos</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="flex flex-wrap gap-2">
          {operationalModules.map((module) => {
            const active = isActive(module.href)
            return (
              <Button
                key={module.href}
                variant="ghost"
                size="sm"
                className={`border font-medium shadow-sm ${getOperationalButtonClass(module.color, active)}`}
                asChild
              >
                <Link href={module.href}>
                  <module.icon className="h-4 w-4 mr-2" />
                  {module.label}
                </Link>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Administrative Modules (Secondary) - Only show on admin pages */}
      {!isOperationalPage && (
        <div className="space-y-2 pb-4 border-b">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Herramientas Administrativas</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="flex flex-wrap gap-2">
            {adminModules.map((module) => {
              const active = isActive(module.href)
              return (
                <Button
                  key={module.href}
                  variant={active ? "default" : "ghost"}
                  size="sm"
                  asChild
                >
                  <Link href={module.href}>
                    <module.icon className="h-4 w-4 mr-2" />
                    {module.label}
                  </Link>
                </Button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
