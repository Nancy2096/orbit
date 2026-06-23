"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { getModulesForPath, isAlwaysAllowed } from "@/lib/permission-access"

interface PermissionsContextValue {
  loading: boolean
  fullAccess: boolean
  modules: Set<string>
  roleName: string | null
  // ¿El usuario tiene acceso al módulo indicado?
  hasModule: (module: string | null | undefined) => boolean
  // ¿El usuario tiene CUALQUIERA de los módulos indicados?
  hasAnyModule: (modules: string[] | null | undefined) => boolean
  // ¿El usuario puede acceder a la ruta indicada?
  canAccessPath: (pathname: string) => boolean
}

const PermissionsContext = createContext<PermissionsContextValue>({
  loading: true,
  fullAccess: false,
  modules: new Set(),
  roleName: null,
  hasModule: () => false,
  hasAnyModule: () => false,
  canAccessPath: () => false,
})

export function usePermissions() {
  return useContext(PermissionsContext)
}

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [fullAccess, setFullAccess] = useState(false)
  const [modules, setModules] = useState<Set<string>>(new Set())
  const [roleName, setRoleName] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadPermissions() {
      const supabase = createClient()

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        if (active) setLoading(false)
        return
      }

      // Perfil del usuario con su rol
      const { data: userData } = await supabase
        .from("users")
        .select("id, role_id, is_global_access, role:roles(name, level)")
        .eq("id", authUser.id)
        .single()

      if (!active) return

      const role = Array.isArray(userData?.role) ? userData?.role[0] : userData?.role
      const name = role?.name ?? null
      setRoleName(name)

      // Acceso total: superadministrador o usuario con acceso global explícito.
      const isFull = name === "superadmin" || userData?.is_global_access === true
      if (isFull) {
        setFullAccess(true)
        setLoading(false)
        return
      }

      // Para el resto, se calculan los módulos otorgados por su rol.
      if (userData?.role_id) {
        const { data: rolePerms } = await supabase
          .from("role_permissions")
          .select("permission:permissions(module)")
          .eq("role_id", userData.role_id)

        if (!active) return

        const set = new Set<string>()
        for (const row of rolePerms ?? []) {
          const perm = Array.isArray(row.permission) ? row.permission[0] : row.permission
          if (perm?.module) set.add(perm.module)
        }
        setModules(set)
      }

      setLoading(false)
    }

    loadPermissions()
    return () => {
      active = false
    }
  }, [])

  const hasModule = useCallback(
    (module: string | null | undefined) => {
      if (fullAccess) return true
      if (!module) return true
      return modules.has(module)
    },
    [fullAccess, modules],
  )

  const hasAnyModule = useCallback(
    (mods: string[] | null | undefined) => {
      if (fullAccess) return true
      // Sin módulos requeridos (ruta no mapeada) se permite por defecto.
      if (!mods || mods.length === 0) return true
      return mods.some((m) => modules.has(m))
    },
    [fullAccess, modules],
  )

  const canAccessPath = useCallback(
    (pathname: string) => {
      if (fullAccess) return true
      if (isAlwaysAllowed(pathname)) return true
      const mods = getModulesForPath(pathname)
      // Rutas sin módulo mapeado se permiten por defecto.
      if (!mods || mods.length === 0) return true
      return mods.some((m) => modules.has(m))
    },
    [fullAccess, modules],
  )

  return (
    <PermissionsContext.Provider
      value={{ loading, fullAccess, modules, roleName, hasModule, hasAnyModule, canAccessPath }}
    >
      {children}
    </PermissionsContext.Provider>
  )
}
