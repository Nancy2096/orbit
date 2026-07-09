"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ShieldCheck } from "lucide-react"

interface Authorizer {
  id: string
  first_name: string | null
  last_name: string | null
  role_name: string
}

// Etiquetas legibles para los roles que pueden autorizar préstamos.
const roleLabels: Record<string, string> = {
  superadmin: "Super Administrador",
  direccion_general: "Dirección General",
}

/**
 * Muestra quién debe autorizar un préstamo (Super Administrador o Dirección General).
 * Se usa tanto al crear como al revisar una solicitud.
 */
export function LoanAuthorizers({ compact = false }: { compact?: boolean }) {
  const supabase = createClient()
  const [authorizers, setAuthorizers] = useState<Authorizer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      const { data } = await supabase
        .from("users")
        .select("id, first_name, last_name, role:roles!inner(name)")
        .eq("is_active", true)
        .in("role.name", ["superadmin", "direccion_general"])

      if (!active) return

      const mapped: Authorizer[] = (data ?? []).map((u: any) => {
        const role = Array.isArray(u.role) ? u.role[0] : u.role
        return {
          id: u.id,
          first_name: u.first_name,
          last_name: u.last_name,
          role_name: role?.name ?? "",
        }
      })
      // Orden: Super Administrador primero, luego Dirección General.
      mapped.sort((a, b) =>
        a.role_name === b.role_name ? 0 : a.role_name === "superadmin" ? -1 : 1,
      )
      setAuthorizers(mapped)
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
  }, [supabase])

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium">Solicitar autorización:</p>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando autorizadores...</p>
      ) : authorizers.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay un Super Administrador o Dirección General configurado para autorizar.
        </p>
      ) : (
        <ul className="space-y-2">
          {authorizers.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 rounded-md border p-2">
              <span className="text-sm font-medium">
                {a.first_name} {a.last_name}
              </span>
              <span className="text-xs text-muted-foreground">
                {roleLabels[a.role_name] || a.role_name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
