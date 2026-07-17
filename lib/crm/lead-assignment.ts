import type { SupabaseClient } from "@supabase/supabase-js"

// Métodos de asignación soportados.
export type AssignmentMethod = "round_robin" | "load_balanced" | "manual"

export interface AssignmentSettings {
  agency_id: string
  method: AssignmentMethod
  reassign_enabled: boolean
  response_time_minutes: number
}

// Configuración por defecto cuando la agencia aún no ha guardado ninguna.
export const DEFAULT_SETTINGS: Omit<AssignmentSettings, "agency_id"> = {
  method: "round_robin",
  reassign_enabled: false,
  response_time_minutes: 60,
}

// Obtiene la configuración de asignación de una agencia (o los valores por defecto).
export async function getAssignmentSettings(
  supabase: SupabaseClient,
  agencyId: string,
): Promise<AssignmentSettings> {
  const { data } = await supabase
    .from("crm_assignment_settings")
    .select("agency_id, method, reassign_enabled, response_time_minutes")
    .eq("agency_id", agencyId)
    .maybeSingle()

  if (!data) return { agency_id: agencyId, ...DEFAULT_SETTINGS }
  return data as AssignmentSettings
}

interface EligibleMember {
  id: string
  staff_id: string
  sort_order: number
  last_assigned_at: string | null
}

// Devuelve los asesores habilitados de la agencia, ordenados por su orden.
async function getEligibleMembers(
  supabase: SupabaseClient,
  agencyId: string,
): Promise<EligibleMember[]> {
  const { data } = await supabase
    .from("crm_assignment_members")
    .select("id, staff_id, sort_order, last_assigned_at")
    .eq("agency_id", agencyId)
    .eq("enabled", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })

  return (data as EligibleMember[]) ?? []
}

// Cuenta los leads activos y sin atender por asesor (para balanceo por carga).
async function getActiveLoad(
  supabase: SupabaseClient,
  agencyId: string,
  staffIds: string[],
): Promise<Record<string, number>> {
  const load: Record<string, number> = {}
  for (const id of staffIds) load[id] = 0

  const { data } = await supabase
    .from("crm_prospects")
    .select("assigned_to")
    .eq("agency_id", agencyId)
    .in("assigned_to", staffIds)
    .eq("status", "active")

  for (const row of (data as { assigned_to: string }[]) ?? []) {
    if (row.assigned_to in load) load[row.assigned_to] += 1
  }
  return load
}

/**
 * Determina el siguiente asesor a asignar según el método configurado.
 * Devuelve el staff_id elegido o null (por ejemplo, método manual o sin
 * asesores habilitados).
 */
export async function pickNextAssignee(
  supabase: SupabaseClient,
  agencyId: string,
  settings: AssignmentSettings,
  options: { excludeStaffId?: string } = {},
): Promise<string | null> {
  if (settings.method === "manual") return null

  let members = await getEligibleMembers(supabase, agencyId)
  if (options.excludeStaffId) {
    members = members.filter((m) => m.staff_id !== options.excludeStaffId)
  }
  if (members.length === 0) return null

  if (settings.method === "load_balanced") {
    const load = await getActiveLoad(
      supabase,
      agencyId,
      members.map((m) => m.staff_id),
    )
    // Menor carga primero; empata por orden definido.
    members.sort((a, b) => {
      const diff = (load[a.staff_id] ?? 0) - (load[b.staff_id] ?? 0)
      if (diff !== 0) return diff
      return a.sort_order - b.sort_order
    })
    return members[0].staff_id
  }

  // round_robin: el que lleva más tiempo sin recibir un lead (o nunca).
  members.sort((a, b) => {
    const at = a.last_assigned_at ? new Date(a.last_assigned_at).getTime() : 0
    const bt = b.last_assigned_at ? new Date(b.last_assigned_at).getTime() : 0
    if (at !== bt) return at - bt
    return a.sort_order - b.sort_order
  })
  return members[0].staff_id
}

/**
 * Asigna un prospecto a un asesor y deja registro: actualiza el prospecto
 * (assigned_to, assigned_at, reinicia attended_at), marca last_assigned_at del
 * miembro y agrega una entrada al historial.
 */
export async function assignProspect(
  supabase: SupabaseClient,
  params: {
    prospectId: string
    agencyId: string
    staffId: string
    assignedBy?: string | null
  },
): Promise<void> {
  const now = new Date().toISOString()

  await supabase
    .from("crm_prospects")
    .update({ assigned_to: params.staffId, assigned_at: now, attended_at: null })
    .eq("id", params.prospectId)

  await supabase
    .from("crm_assignment_members")
    .update({ last_assigned_at: now })
    .eq("agency_id", params.agencyId)
    .eq("staff_id", params.staffId)

  await supabase.from("crm_prospect_assignments").insert({
    prospect_id: params.prospectId,
    assigned_to: params.staffId,
    assigned_by: params.assignedBy ?? null,
    created_at: now,
  })
}
