import "server-only"

import { NextResponse } from "next/server"
import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { getModulesForPath } from "@/lib/permission-access"

export interface CollectionsAccess {
  userId: string
  service: SupabaseClient
  allAgencies: boolean
  agencyIds: Set<string>
  canAccessAgency: (agencyId: string | null | undefined) => boolean
}

// Mismo criterio que Facturas y Pagos: superadmin tiene acceso total; el resto
// necesita alguno de los módulos de /dashboard/collections. is_global_access solo
// amplía el alcance a todas las agencias, no otorga módulos.
export async function requireCollectionsAccess(): Promise<CollectionsAccess | NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const { data: userRow } = await service
    .from("users")
    .select("role_id, is_global_access, is_active, role:roles(name)")
    .eq("id", user.id)
    .maybeSingle()

  const forbidden = NextResponse.json(
    { error: "No tienes permiso para usar Gestión de Cobranza" },
    { status: 403 },
  )
  if (!userRow || userRow.is_active === false) return forbidden

  const role = Array.isArray(userRow.role) ? userRow.role[0] : userRow.role
  const isSuperadmin = (role as { name?: string } | null)?.name === "superadmin"

  let hasModule = isSuperadmin
  if (!hasModule && userRow.role_id) {
    const requiredModules = getModulesForPath("/dashboard/collections") ?? []
    const { data: rolePerms } = await service
      .from("role_permissions")
      .select("permission:permissions(module)")
      .eq("role_id", userRow.role_id)
    hasModule = (rolePerms ?? []).some((row) => {
      const perm = Array.isArray(row.permission) ? row.permission[0] : row.permission
      const moduleName = (perm as { module?: string } | null)?.module
      return !!moduleName && requiredModules.includes(moduleName)
    })
  }
  if (!hasModule) return forbidden

  const allAgencies = isSuperadmin || userRow.is_global_access === true
  let agencyIds = new Set<string>()
  if (!allAgencies) {
    const { data: links } = await service.from("user_agencies").select("agency_id").eq("user_id", user.id)
    agencyIds = new Set((links ?? []).map((l) => l.agency_id as string))
  }

  return {
    userId: user.id,
    service,
    allAgencies,
    agencyIds,
    canAccessAgency: (agencyId) => !!agencyId && (allAgencies || agencyIds.has(agencyId)),
  }
}

// Carga el cliente y verifica que el usuario tenga acceso a su agencia.
export async function loadAccessibleClient(access: CollectionsAccess, clientId: unknown) {
  if (typeof clientId !== "string" || !/^[0-9a-f-]{36}$/i.test(clientId)) {
    return { error: NextResponse.json({ error: "Cliente inválido" }, { status: 400 }) }
  }
  const { data: client } = await access.service
    .from("clients")
    .select("id, agency_id, company_name, legal_name, billing_email, primary_contact_name, primary_contact_email, primary_contact_phone")
    .eq("id", clientId)
    .maybeSingle()
  if (!client) return { error: NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 }) }
  if (!access.canAccessAgency(client.agency_id)) {
    return { error: NextResponse.json({ error: "No tienes acceso a la agencia de este cliente" }, { status: 403 }) }
  }
  return { client }
}
