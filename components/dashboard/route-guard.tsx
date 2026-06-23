"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ShieldAlert, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/components/dashboard/permissions-provider"

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { loading, canAccessPath } = usePermissions()

  // Mientras carga el perfil/permisos mostramos un loader para no exponer
  // contenido restringido antes de validar el acceso.
  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!canAccessPath(pathname)) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">Acceso restringido</h1>
          <p className="max-w-md text-pretty text-sm text-muted-foreground">
            No cuentas con los permisos necesarios para ver esta sección. Si crees que es un error,
            contacta a tu administrador.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">Volver al inicio</Link>
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
