import "server-only"

import { NextResponse } from "next/server"
import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { getModulesForPath } from "@/lib/permission-access"

export interface ProspectRecord {
  id: string
  agency_id: string | null
  company_name: string | null
  contact_name: string
  contact_email: string | null
  contact_phone: string | null
  assigned_to: string | null
}

export interface ProspectAccess {
  userId: string
  userEmail: string | null
  senderName: string
  agencyName: string
  /** Responsable del prospecto o rol con permiso para enviar correo por cualquier prospecto de sus agencias. */
  canSendEmail: boolean
  service: SupabaseClient
  prospect: ProspectRecord
}

// Roles que, además del responsable (assigned_to), pueden enviar correo por cualquier
// prospecto de las agencias a las que tienen acceso.
const EMAIL_SENDER_ROLES = ["superadmin", "direccion_general", "comercial"]

export function senderDisplayName(senderName: string, agencyName: string): string {
  return [senderName, agencyName].filter((part) => part.trim()).join(" · ") || "Orbit"
}

// Mismo criterio que el resto de módulos: superadmin tiene acceso total; el resto
// necesita el módulo de Prospectos y acceso a la agencia del prospecto
// (is_global_access amplía el alcance a todas las agencias).
export async function requireProspectAccess(prospectId: string): Promise<ProspectAccess | NextResponse> {
  if (!/^[0-9a-f-]{36}$/i.test(prospectId)) {
    return NextResponse.json({ error: "Prospecto inválido" }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const service = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })

  const { data: userRow } = await service
    .from("users")
    .select("role_id, is_global_access, is_active, email, first_name, last_name, role:roles(name)")
    .eq("id", user.id)
    .maybeSingle()

  const forbidden = NextResponse.json({ error: "No tienes permiso para usar Prospectos" }, { status: 403 })
  if (!userRow || userRow.is_active === false) return forbidden

  const role = Array.isArray(userRow.role) ? userRow.role[0] : userRow.role
  const roleName = (role as { name?: string } | null)?.name ?? ""
  const isSuperadmin = roleName === "superadmin"

  let hasModule = isSuperadmin
  if (!hasModule && userRow.role_id) {
    const requiredModules = getModulesForPath("/dashboard/crm/prospects") ?? []
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

  const { data: prospect } = await service
    .from("crm_prospects")
    .select("id, agency_id, company_name, contact_name, contact_email, contact_phone, assigned_to")
    .eq("id", prospectId)
    .maybeSingle()
  if (!prospect) return NextResponse.json({ error: "Prospecto no encontrado" }, { status: 404 })

  const allAgencies = isSuperadmin || userRow.is_global_access === true
  if (!allAgencies) {
    if (!prospect.agency_id) return NextResponse.json({ error: "No tienes acceso a este prospecto" }, { status: 403 })
    const { data: link } = await service
      .from("user_agencies")
      .select("agency_id")
      .eq("user_id", user.id)
      .eq("agency_id", prospect.agency_id)
      .maybeSingle()
    if (!link) return NextResponse.json({ error: "No tienes acceso a la agencia de este prospecto" }, { status: 403 })
  }

  const senderName = [userRow.first_name, userRow.last_name].filter(Boolean).join(" ").trim()

  let agencyName = ""
  if (prospect.agency_id) {
    const { data: agency } = await service.from("agencies").select("name").eq("id", prospect.agency_id).maybeSingle()
    agencyName = (agency?.name as string | null)?.trim() || ""
  }

  return {
    userId: user.id,
    userEmail: (userRow.email as string | null) || user.email || null,
    senderName,
    agencyName,
    canSendEmail: prospect.assigned_to === user.id || EMAIL_SENDER_ROLES.includes(roleName),
    service,
    prospect: prospect as ProspectRecord,
  }
}
