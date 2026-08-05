import type { SupabaseClient } from "@supabase/supabase-js"

export interface CrmTaskTemplate {
  id: string
  title: string
  description: string | null
  task_type: string
  priority: string | null
  order_index: number
  offset_days: number
  offset_minutes: number
  requires_manager: boolean
  is_active: boolean
}

interface ApplyTemplatesArgs {
  prospectId: string
  agencyId: string | null
  /** Asesor asignado al prospecto (staff id). */
  assignedTo: string | null
  /** Fecha/hora en que se registró el prospecto (ISO). */
  registeredAt: string
  /** Usuario que dispara la carga (para created_by). */
  createdBy?: string | null
}

/**
 * Carga las tareas predefinidas (globales) en un prospecto.
 *
 * - Calcula la fecha límite de cada tarea a partir del registro del prospecto
 *   más su desfase en días y minutos configurado en la plantilla.
 * - Las tareas marcadas como "requiere gerente" se asignan al gerente configurado
 *   para la agencia del prospecto (crm_task_manager_settings); el resto al asesor.
 * - Es idempotente: no vuelve a crear una tarea de una plantilla que ya exista
 *   para el prospecto (se apoya en crm_tasks.template_id).
 *
 * Devuelve la cantidad de tareas creadas.
 */
export async function applyTaskTemplatesToProspect(
  supabase: SupabaseClient,
  { prospectId, agencyId, assignedTo, registeredAt, createdBy = null }: ApplyTemplatesArgs,
): Promise<number> {
  // 1) Plantillas activas ordenadas por el orden en que deben hacerse.
  const { data: templates, error: templatesError } = await supabase
    .from("crm_task_templates")
    .select("*")
    .eq("is_active", true)
    .order("order_index", { ascending: true })

  if (templatesError) {
    console.error("[v0] Error fetching task templates:", templatesError)
    throw templatesError
  }
  if (!templates || templates.length === 0) return 0

  // 2) Gerente configurado para la agencia (para tareas que requieren su ayuda).
  let managerStaffId: string | null = null
  if (agencyId) {
    const { data: managerRow } = await supabase
      .from("crm_task_manager_settings")
      .select("manager_staff_id")
      .eq("agency_id", agencyId)
      .maybeSingle()
    managerStaffId = managerRow?.manager_staff_id ?? null
  }

  // 3) Evitar duplicados: plantillas ya cargadas en este prospecto.
  const { data: existing } = await supabase
    .from("crm_tasks")
    .select("template_id")
    .eq("prospect_id", prospectId)
    .not("template_id", "is", null)

  const alreadyLoaded = new Set((existing || []).map((t: { template_id: string }) => t.template_id))

  const base = new Date(registeredAt).getTime()

  const rows = (templates as CrmTaskTemplate[])
    .filter((tpl) => !alreadyLoaded.has(tpl.id))
    .map((tpl) => {
      const dueMs = base + tpl.offset_days * 24 * 60 * 60 * 1000 + tpl.offset_minutes * 60 * 1000
      const assignee = tpl.requires_manager ? managerStaffId : assignedTo
      return {
        prospect_id: prospectId,
        agency_id: agencyId,
        title: tpl.title,
        description: tpl.description,
        task_type: tpl.task_type,
        priority: tpl.priority || "medium",
        due_date: new Date(dueMs).toISOString(),
        assigned_to: assignee,
        template_id: tpl.id,
        created_by: createdBy,
        is_completed: false,
      }
    })

  if (rows.length === 0) return 0

  const { error: insertError } = await supabase.from("crm_tasks").insert(rows)
  if (insertError) {
    console.error("[v0] Error inserting predefined tasks:", insertError)
    throw insertError
  }

  return rows.length
}

/**
 * Orden de etapa hasta el cual las tareas automáticas siguen activas.
 * Etapa 1 (Prospecto) y Etapa 2 (Intento de Contacto) => tareas activas.
 * Al salir de la etapa 2 (sort_order > 2) => las tareas automáticas se pausan.
 */
export const AUTO_TASKS_ACTIVE_MAX_STAGE_ORDER = 2

/**
 * Pausa o reanuda las tareas automáticas (las que provienen de una plantilla)
 * de un prospecto según la etapa a la que se mueve.
 *
 * - Si la nueva etapa tiene sort_order <= 2 (Prospecto o Intento de Contacto),
 *   las tareas automáticas pendientes se reanudan (is_paused = false).
 * - Si la nueva etapa tiene sort_order > 2, las tareas automáticas pendientes
 *   se pausan (is_paused = true), deteniendo el flujo automático.
 *
 * Solo afecta tareas con template_id (automáticas) y que no estén completadas.
 * Las tareas creadas manualmente nunca se tocan.
 */
export async function syncAutomaticTasksWithStage(
  supabase: SupabaseClient,
  prospectId: string,
  newStageId: string | null,
): Promise<void> {
  if (!prospectId) return

  let sortOrder = 0
  if (newStageId) {
    const { data: stage } = await supabase
      .from("crm_pipeline_stages")
      .select("sort_order")
      .eq("id", newStageId)
      .maybeSingle()
    sortOrder = stage?.sort_order ?? 0
  }

  const shouldPause = sortOrder > AUTO_TASKS_ACTIVE_MAX_STAGE_ORDER

  const { error } = await supabase
    .from("crm_tasks")
    .update({ is_paused: shouldPause })
    .eq("prospect_id", prospectId)
    .not("template_id", "is", null)
    .eq("is_completed", false)

  if (error) {
    console.error("[v0] Error syncing automatic tasks with stage:", error)
  }
}
