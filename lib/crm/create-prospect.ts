import type { SupabaseClient } from "@supabase/supabase-js"
import { applyTaskTemplatesToProspect } from "@/lib/crm-task-templates"
import { assignProspect, getAssignmentSettings, pickNextAssignee } from "@/lib/crm/lead-assignment"

export interface CreateProspectInput {
  agencyId: string
  contactName: string
  contactEmail?: string | null
  contactPhone?: string | null
  companyName?: string | null
  notes?: string | null
  stageId?: string | null
  sourceId?: string | null
  externalLeadId?: string | null
  createdBy?: string | null
  /**
   * Asesor a asignar. "auto" usa la configuración de asignación de la agencia
   * (round robin / balanceo); null deja el prospecto sin asesor.
   */
  assignTo: string | "auto" | null
  /** Quién hizo la asignación (para el historial). */
  assignedBy?: string | null
}

export interface CreateProspectResult {
  prospectId: string
  assignedTo: string | null
  tasksCreated: number
}

// PostgREST/Postgres responden con estos códigos cuando la columna no existe
// (por ejemplo, antes de aplicar la migración de external_lead_id).
function isMissingColumnError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === "42703" || error.code === "PGRST204" || /external_lead_id/.test(error.message || "")
}

/**
 * Crea un prospecto con el mismo flujo que la pantalla de alta:
 * 1) inserta el prospecto, 2) asigna asesor (y registra el historial),
 * 3) genera las tareas iniciales con applyTaskTemplatesToProspect, ya con el
 * asesor definitivo para que las tareas le lleguen a él.
 *
 * La asignación y las tareas nunca hacen fallar la creación: si fallan se
 * registra el error y el prospecto queda creado.
 */
export async function createProspect(
  supabase: SupabaseClient,
  input: CreateProspectInput,
): Promise<CreateProspectResult> {
  const row: Record<string, unknown> = {
    agency_id: input.agencyId,
    contact_name: input.contactName,
    contact_email: input.contactEmail || null,
    contact_phone: input.contactPhone || null,
    company_name: input.companyName || null,
    stage_id: input.stageId ?? null,
    source_id: input.sourceId ?? null,
    notes: input.notes || null,
    status: "active",
    created_by: input.createdBy ?? null,
  }
  if (input.externalLeadId) row.external_lead_id = input.externalLeadId

  let { data: prospect, error } = await supabase
    .from("crm_prospects")
    .insert(row)
    .select("id, created_at")
    .single()

  if (error && input.externalLeadId && isMissingColumnError(error)) {
    console.warn("[crm:create-prospect] external_lead_id no existe aún; se crea sin ese campo.")
    delete row.external_lead_id
    ;({ data: prospect, error } = await supabase.from("crm_prospects").insert(row).select("id, created_at").single())
  }

  if (error || !prospect) {
    throw new Error(error?.message || "No se pudo crear el prospecto")
  }

  const prospectId = prospect.id as string
  const registeredAt = (prospect.created_at as string) || new Date().toISOString()

  let assignedTo: string | null = null
  try {
    const staffId =
      input.assignTo === "auto"
        ? await pickNextAssignee(supabase, input.agencyId, await getAssignmentSettings(supabase, input.agencyId))
        : input.assignTo
    if (staffId) {
      await assignProspect(supabase, {
        prospectId,
        agencyId: input.agencyId,
        staffId,
        assignedBy: input.assignedBy ?? null,
      })
      assignedTo = staffId
    }
  } catch (e) {
    console.error("[crm:create-prospect] Error asignando asesor:", (e as Error).message)
  }

  let tasksCreated = 0
  try {
    tasksCreated = await applyTaskTemplatesToProspect(supabase, {
      prospectId,
      agencyId: input.agencyId,
      assignedTo,
      registeredAt,
      stageId: input.stageId ?? null,
      createdBy: input.createdBy ?? null,
    })
  } catch (e) {
    console.error("[crm:create-prospect] Error generando tareas iniciales:", (e as Error).message)
  }

  return { prospectId, assignedTo, tasksCreated }
}
