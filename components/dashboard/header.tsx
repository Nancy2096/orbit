"use client"

import React from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePathname } from "next/navigation"
import type { User } from "@/lib/types"

interface DashboardHeaderProps {
  user: User | null
}

const pathNames: Record<string, string> = {
  dashboard: "Dashboard",
  agencies: "Agencias",
  users: "Usuarios",
  roles: "Roles y Permisos",
  clients: "Clientes",
  projects: "Proyectos",
  invoices: "Facturas y Pagos",
  payments: "Bancos e Ingresos",
  expenses: "Gastos",
  profitability: "Rentabilidad",
  settings: "Configuración",
  profile: "Mi Perfil",
  new: "Nuevo",
  edit: "Editar",
  crm: "CRM",
  pipeline: "Pipeline",
  prospects: "Prospectos",
  tasks: "Tareas",
  metrics: "Métricas",
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/")
    const isLast = index === segments.length - 1
    const label = pathNames[segment] || segment

    return { href, label, isLast }
  })

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="ml-auto flex items-center gap-4">
        {user?.role && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
            {user.role.display_name}
          </span>
        )}
      </div>
    </header>
  )
}
