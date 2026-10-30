import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { getModulesForPath } from "@/lib/permission-access"

export type ZapAssigneeFailure = "not_found" | "inactive" | "no_access"

export type ZapAssigneeResult =
  | { ok: true; staffId: string; name: string }
  | { ok: false; reason: ZapAssigneeFailure; detail: string }

export const ZAP_FAILURE_LABEL: Record<ZapAssigneeFailure, string> = {
  not_found: "correo no encontrado",
  inactive: "usuario inactivo",
  no_access: "sin acceso",
}

interface StaffRow {
  id: string
  user_id: string | null
  first_name: string | null
  last_name: string | null
  is_active: boolean | null
}

export function normalizeAssigneeEmail(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase()
}

// Escapa comodines de ILIKE para que la comparación sea exacta (sin distinguir mayúsculas).
function exactILike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`)
}

function staffName(staff: Pick<StaffRow, "first_name" | "last_name">): string {
  return `${staff.first_name ?? ""} ${staff.last_name ?? ""}`.trim() || "Asesor"
}

/**
 * Resuelve el asesor indicado por el Zap (`assigned_to_email`).
 * Busca primero en `users.email` y, si no coincide, en el correo de `staff`
 * (email o agency_email). Solo es válido si el usuario está activo, tiene el
 * módulo de Prospectos y acceso a la agencia del token.
 */
export async function resolveZapAssignee(
  supabase: SupabaseClient,
  agencyId: string,
  rawEmail: string,
): Promise<ZapAssigneeResult> {
  const email = normalizeAssigneeEmail(rawEmail)
  if (!email || !email.includes("@")) {
    return { ok: false, reason: "not_found", detail: `correo no encontrado (${rawEmail || "vacío"})` }
  }
  const pattern = exactILike(email)

  let userId: string | null = null
  let staff: StaffRow | null = null

  const { data: userMatch } = await supabase.from("users").select("id").ilike("email", pattern).limit(1).maybeSingle()
  if (userMatch) {
    userId = userMatch.id as string
    const { data: staffRows } = await supabase
      .from("staff")
      .select("id, user_id, first_name, last_name, is_active, agency_id")
      .eq("user_id", userId)
    const rows = (staffRows ?? []) as (StaffRow & { agency_id: string | null })[]
    staff = rows.find((r) => r.agency_id === agencyId) ?? rows[0] ?? null
  } else {
    const { data: staffRows } = await supabase
      .from("staff")
      .select("id, user_id, first_name, last_name, is_active, agency_id")
      .or(`email.ilike.${pattern},agency_email.ilike.${pattern}`)
    const rows = (staffRows ?? []) as (StaffRow & { agency_id: string | null })[]
    staff = rows.find((r) => r.agency_id === agencyId) ?? rows[0] ?? null
    userId = staff?.user_id ?? null
  }

  if (!staff) {
    return { ok: false, reason: "not_found", detail: `correo no encontrado (${email})` }
  }
  const name = staffName(staff)

  if (!userId) {
    return { ok: false, reason: "inactive", detail: `usuario inactivo: ${name} no tiene usuario en Orbit` }
  }

  const { data: user } = await supabase
    .from("users")
    .select("id, is_active, is_global_access, role_id, role:roles(name)")
    .eq("id", userId)
    .maybeSingle()

  if (!user) {
    return { ok: false, reason: "inactive", detail: `usuario inactivo: ${name} no tiene usuario en Orbit` }
  }
  if (user.is_active === false || staff.is_active === false) {
    return { ok: false, reason: "inactive", detail: `usuario inactivo: ${name}` }
  }

  const role = Array.isArray(user.role) ? user.role[0] : user.role
  const isSuperadmin = (role as { name?: string } | null)?.name === "superadmin"

  let hasModule = isSuperadmin
  if (!hasModule && user.role_id) {
    const requiredModules = getModulesForPath("/dashboard/crm/prospects") ?? []
    const { data: rolePerms } = await supabase
      .from("role_permissions")
      .select("permission:permissions(module)")
      .eq("role_id", user.role_id)
    hasModule = (rolePerms ?? []).some((row) => {
      const perm = Array.isArray(row.permission) ? row.permission[0] : row.permission
      const moduleName = (perm as { module?: string } | null)?.module
      return !!moduleName && requiredModules.includes(moduleName)
    })
  }
  if (!hasModule) {
    return { ok: false, reason: "no_access", detail: `sin acceso: ${name} no tiene el módulo de Prospectos` }
  }

  if (!isSuperadmin && user.is_global_access !== true) {
    const { data: link } = await supabase
      .from("user_agencies")
      .select("agency_id")
      .eq("user_id", userId)
      .eq("agency_id", agencyId)
      .maybeSingle()
    if (!link) {
      return { ok: false, reason: "no_access", detail: `sin acceso: ${name} no tiene acceso a la agencia` }
    }
  }

  return { ok: true, staffId: staff.id, name }
}

export async function getStaffName(supabase: SupabaseClient, staffId: string): Promise<string> {
  const { data } = await supabase.from("staff").select("first_name, last_name").eq("id", staffId).maybeSingle()
  return data ? staffName(data as StaffRow) : "Asesor"
}
