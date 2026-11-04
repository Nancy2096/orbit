import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { AssignedProspectEmailData } from "@/lib/notifications/new-lead"

export interface ReassignOptions {
  prospectIds: string[]
  toStaffId: string | null
  /** Usuario que hace el cambio; null para procesos automáticos. */
  actorUserId: string | null
  actorName: string
  /** Reinicia attended_at (reasignación automática por falta de atención). */
  resetAttended?: boolean
}

export interface ReassignOutcome {
  changed: number
  transferredTasks: number
  /** Prospectos para el correo; vacío si no aplica (sin asesor o autoasignación). */
  emailProspects: AssignedProspectEmailData[]
}

interface ProspectRow {
  id: string
  agency_id: string | null
  assigned_to: string | null
  contact_name: string
  company_name: string | null
  contact_phone: string | null
  contact_email: string | null
  stage: { name: string | null } | { name: string | null }[] | null
  source: { name: string | null } | { name: string | null }[] | null
}

const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v)

function staffName(s: { first_name: string | null; last_name: string | null } | undefined): string {
  return s ? [s.first_name, s.last_name].filter(Boolean).join(" ").trim() || "Sin nombre" : "Sin asignar"
}

/** Prospecto en el formato del correo de asignación. */
export function toEmailProspect(p: ProspectRow): AssignedProspectEmailData {
  return {
    id: p.id,
    contactName: p.contact_name,
    companyName: p.company_name,
    contactPhone: p.contact_phone,
    contactEmail: p.contact_email,
    stageName: one(p.stage)?.name ?? null,
    sourceName: one(p.source)?.name ?? null,
  }
}

export const PROSPECT_EMAIL_SELECT =
  "id, agency_id, assigned_to, contact_name, company_name, contact_phone, contact_email, created_at, stage:crm_pipeline_stages(name), source:crm_lead_sources(name)"

/** ¿El staff pertenece al usuario que hace el cambio? (autoasignación). */
export async function isSelfAssignment(
  service: SupabaseClient,
  toStaffId: string | null,
  actorUserId: string | null,
): Promise<boolean> {
  if (!toStaffId || !actorUserId) return false
  const { data } = await service.from("staff").select("user_id").eq("id", toStaffId).maybeSingle()
  return data?.user_id === actorUserId
}

/**
 * Cambia el asesor de los prospectos. Por cada prospecto que cambia:
 * - actualiza assigned_to / assigned_at,
 * - pasa al nuevo asesor sus tareas pendientes asignadas al asesor anterior,
 *   excepto las de plantillas que requieren gerente o director,
 * - registra el historial de asignación y una actividad en el prospecto.
 */
export async function reassignProspects(service: SupabaseClient, opts: ReassignOptions): Promise<ReassignOutcome> {
  const outcome: ReassignOutcome = { changed: 0, transferredTasks: 0, emailProspects: [] }
  if (opts.prospectIds.length === 0) return outcome

  const { data: prospectsData, error } = await service
    .from("crm_prospects")
    .select(PROSPECT_EMAIL_SELECT)
    .in("id", opts.prospectIds)
  if (error) throw new Error(error.message)
  const prospects = (prospectsData ?? []) as unknown as ProspectRow[]

  const { data: managerTemplates } = await service
    .from("crm_task_templates")
    .select("id")
    .or("requires_manager.eq.true,requires_director.eq.true")
  const managerTemplateIds = new Set((managerTemplates ?? []).map((t) => t.id as string))

  const staffIds = [...new Set([opts.toStaffId, ...prospects.map((p) => p.assigned_to)].filter((x): x is string => !!x))]
  const { data: staffRows } = staffIds.length
    ? await service.from("staff").select("id, first_name, last_name").in("id", staffIds)
    : { data: [] as { id: string; first_name: string | null; last_name: string | null }[] }
  const staffById = new Map((staffRows ?? []).map((s) => [s.id as string, s]))
  const toName = opts.toStaffId ? staffName(staffById.get(opts.toStaffId)) : "Sin asignar"

  const now = new Date().toISOString()
  const changedProspects: ProspectRow[] = []

  for (const p of prospects) {
    if (p.assigned_to === opts.toStaffId) continue

    const update: Record<string, unknown> = {
      assigned_to: opts.toStaffId,
      assigned_at: opts.toStaffId ? now : null,
      updated_at: now,
    }
    if (opts.resetAttended) update.attended_at = null
    const { error: updErr } = await service.from("crm_prospects").update(update).eq("id", p.id)
    if (updErr) throw new Error(updErr.message)

    let transferred = 0
    if (p.assigned_to && opts.toStaffId) {
      const { data: pending } = await service
        .from("crm_tasks")
        .select("id, template_id")
        .eq("prospect_id", p.id)
        .eq("assigned_to", p.assigned_to)
        .eq("is_completed", false)
      const ids = (pending ?? [])
        .filter((t) => !t.template_id || !managerTemplateIds.has(t.template_id as string))
        .map((t) => t.id as string)
      if (ids.length > 0) {
        const { error: taskErr } = await service
          .from("crm_tasks")
          .update({ assigned_to: opts.toStaffId, updated_at: now })
          .in("id", ids)
        if (taskErr) console.error("[reassign] No se pudieron transferir tareas:", taskErr.message)
        else transferred = ids.length
      }
    }

    if (opts.toStaffId) {
      await service.from("crm_prospect_assignments").insert({
        prospect_id: p.id,
        assigned_to: opts.toStaffId,
        assigned_by: opts.actorUserId,
        created_at: now,
      })
    }

    const fromName = p.assigned_to ? staffName(staffById.get(p.assigned_to)) : "Sin asignar"
    const tasksLabel = transferred === 1 ? "1 tarea transferida" : `${transferred} tareas transferidas`
    await service.from("crm_activities").insert({
      agency_id: p.agency_id,
      prospect_id: p.id,
      activity_type: "note",
      subject: "Reasignación de asesor",
      description: `Reasignado de ${fromName} a ${toName} por ${opts.actorName || "Orbit"}, ${tasksLabel}`,
      activity_date: now,
      is_completed: true,
      completed_at: now,
      created_by: opts.actorUserId,
    })

    outcome.changed += 1
    outcome.transferredTasks += transferred
    changedProspects.push(p)
  }

  if (opts.toStaffId && !(await isSelfAssignment(service, opts.toStaffId, opts.actorUserId))) {
    outcome.emailProspects = changedProspects.map(toEmailProspect)
  }
  return outcome
}
