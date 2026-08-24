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
  /** Evento base del vencimiento: "registro" (registro del prospecto) o "cotizacion" (envío de cotización). */
  timing_anchor: string | null
  /** Desfase en días respecto al envío de la cotización (cuando timing_anchor = "cotizacion"). */
  offset_days_quote: number
  /** Desfase en minutos respecto al envío de la cotización (cuando timing_anchor = "cotizacion"). */
  offset_minutes_quote: number
  requires_manager: boolean
  requires_director: boolean
  /** Gerente comercial asignado cuando requires_manager está activo. */
  manager_staff_id: string | null
  /** Director general asignado cuando requires_director está activo. */
  director_staff_id: string | null
  /**
   * Nombres de etapas del pipeline donde debe mostrarse esta tarea.
   * Arreglo vacío o nulo = se muestra en todas las etapas.
   */
  pipeline_stages: string[] | null
  is_active: boolean
  whatsapp_message?: string | null
  email_subject?: string | null
  email_message?: string | null
}

interface ApplyTemplatesArgs {
  prospectId: string
  agencyId: string | null
  /** Asesor asignado al prospecto (staff id). */
  assignedTo: string | null
  /** Fecha/hora en que se registró el prospecto (ISO). */
  registeredAt: string
  /** Etapa actual del prospecto (id). Determina qué plantillas aplican según pipeline_stages. */
  stageId?: string | null
  /** Usuario que dispara la carga (para created_by). */
  createdBy?: string | null
}

/**
 * Indica si una plantilla aplica a una etapa dada.
 * - Sin etapas configuradas (vacío/nulo) => aplica a todas las etapas.
 * - Con etapas configuradas => aplica solo si la etapa actual está en la lista.
 */
function templateAppliesToStage(pipelineStages: string[] | null | undefined, stageName: string | null): boolean {
  const list = pipelineStages || []
  if (list.length === 0) return true
  return stageName != null && list.includes(stageName)
}

/**
 * Carga las tareas predefinidas (globales) en un prospecto, filtrando por la
 * etapa del pipeline en la que se encuentra el prospecto.
 *
 * - Solo se generan las tareas cuyas etapas configuradas ("Ajustar Tareas")
 *   incluyan la etapa actual del prospecto. Las plantillas sin etapas se aplican
 *   en todas las etapas.
 * - La fecha límite se calcula según el evento base de la plantilla: registro del
 *   prospecto (por defecto) o envío de la cotización (última cotización cargada).
 * - Las tareas marcadas como "requiere gerente"/"requiere director" se asignan a
 *   los responsables definidos; si no requiere ninguno, se asignan al asesor.
 * - Es idempotente: no vuelve a crear una tarea de una plantilla que ya exista
 *   para el prospecto (se apoya en crm_tasks.template_id + assigned_to).
 *
 * Como se ejecuta al registrar el prospecto, al abrir su detalle y en cada cambio
 * de etapa, las tareas van apareciendo en los prospectos (nuevos y pasados) a
 * medida que entran en las etapas configuradas.
 *
 * Devuelve la cantidad de tareas creadas.
 */
export async function applyTaskTemplatesToProspect(
  supabase: SupabaseClient,
  { prospectId, agencyId, assignedTo, registeredAt, stageId = null, createdBy = null }: ApplyTemplatesArgs,
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

  // 2) Nombre de la etapa actual del prospecto (para filtrar por pipeline_stages).
  let currentStageName: string | null = null
  if (stageId) {
    const { data: stage } = await supabase
      .from("crm_pipeline_stages")
      .select("name")
      .eq("id", stageId)
      .maybeSingle()
    currentStageName = stage?.name ?? null
  }

  // 3) Solo las plantillas que aplican a la etapa actual del prospecto.
  const applicableTemplates = (templates as CrmTaskTemplate[]).filter((tpl) =>
    templateAppliesToStage(tpl.pipeline_stages, currentStageName),
  )
  if (applicableTemplates.length === 0) return 0

  // 4) Gerente configurado para la agencia (para tareas que requieren su ayuda).
  let managerStaffId: string | null = null
  if (agencyId) {
    const { data: managerRow } = await supabase
      .from("crm_task_manager_settings")
      .select("manager_staff_id")
      .eq("agency_id", agencyId)
      .maybeSingle()
    managerStaffId = managerRow?.manager_staff_id ?? null
  }

  // 5) Base para tareas ancladas al envío de la cotización: fecha de la última
  //    cotización cargada del prospecto. Solo se consulta si alguna plantilla lo necesita.
  let quoteBaseMs: number | null = null
  const needsQuoteAnchor = applicableTemplates.some((tpl) => tpl.timing_anchor === "cotizacion")
  if (needsQuoteAnchor) {
    const { data: lastQuote } = await supabase
      .from("crm_prospect_quotations")
      .select("created_at")
      .eq("prospect_id", prospectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (lastQuote?.created_at) quoteBaseMs = new Date(lastQuote.created_at).getTime()
  }

  // 6) Evitar duplicados: pares plantilla+asignado ya cargados en este prospecto.
  const { data: existing } = await supabase
    .from("crm_tasks")
    .select("template_id, assigned_to")
    .eq("prospect_id", prospectId)
    .not("template_id", "is", null)

  const alreadyLoaded = new Set(
    (existing || []).map((t: { template_id: string; assigned_to: string | null }) => `${t.template_id}:${t.assigned_to ?? ""}`),
  )

  const registeredMs = new Date(registeredAt).getTime()

  const rows = applicableTemplates.flatMap((tpl) => {
    // La fecha límite depende del evento base configurado en la plantilla.
    let baseMs = registeredMs
    let offsetDays = tpl.offset_days
    let offsetMinutes = tpl.offset_minutes
    if (tpl.timing_anchor === "cotizacion") {
      // Si aún no hay cotización cargada, se usa el registro como respaldo.
      baseMs = quoteBaseMs ?? registeredMs
      offsetDays = tpl.offset_days_quote ?? 0
      offsetMinutes = tpl.offset_minutes_quote ?? 0
    }
    const dueMs = baseMs + offsetDays * 24 * 60 * 60 * 1000 + offsetMinutes * 60 * 1000
    const dueDate = new Date(dueMs).toISOString()

    // Determinar los responsables de esta plantilla. Puede haber más de uno
    // cuando la tarea requiere apoyo del gerente y del director a la vez.
    const assignees: string[] = []
    if (tpl.requires_manager) {
      const mgr = tpl.manager_staff_id ?? managerStaffId
      if (mgr) assignees.push(mgr)
    }
    if (tpl.requires_director && tpl.director_staff_id) {
      assignees.push(tpl.director_staff_id)
    }
    // Si no requiere apoyo de nadie, la tarea es para el asesor del prospecto.
    if (assignees.length === 0 && assignedTo) {
      assignees.push(assignedTo)
    }

    return assignees
      .filter((assignee) => !alreadyLoaded.has(`${tpl.id}:${assignee}`))
      .map((assignee) => ({
        prospect_id: prospectId,
        agency_id: agencyId,
        title: tpl.title,
        description: tpl.description,
        task_type: tpl.task_type,
        priority: tpl.priority || "medium",
        due_date: dueDate,
        assigned_to: assignee,
        template_id: tpl.id,
        created_by: createdBy,
        is_completed: false,
        whatsapp_message: tpl.whatsapp_message ?? null,
        email_subject: tpl.email_subject ?? null,
        email_message: tpl.email_message ?? null,
      }))
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
 * Pausa o reanuda las tareas automáticas (las que provienen de una plantilla)
 * de un prospecto según la etapa a la que se mueve, respetando las etapas
 * configuradas en cada plantilla ("Ajustar Tareas").
 *
 * - Una tarea automática permanece activa (is_paused = false) mientras el
 *   prospecto está en una de las etapas configuradas para su plantilla.
 * - Si el prospecto sale de esas etapas, la tarea se pausa (is_paused = true).
 * - Las plantillas sin etapas configuradas aplican a todas las etapas, por lo
 *   que sus tareas nunca se pausan por este criterio.
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

  // Nombre de la etapa destino.
  let stageName: string | null = null
  if (newStageId) {
    const { data: stage } = await supabase
      .from("crm_pipeline_stages")
      .select("name")
      .eq("id", newStageId)
      .maybeSingle()
    stageName = stage?.name ?? null
  }

  // Plantillas activas con sus etapas configuradas.
  const { data: templates, error: templatesError } = await supabase
    .from("crm_task_templates")
    .select("id, pipeline_stages")
    .eq("is_active", true)

  if (templatesError) {
    console.error("[v0] Error fetching task templates for stage sync:", templatesError)
    return
  }

  const activeTemplateIds: string[] = []
  const pausedTemplateIds: string[] = []
  for (const tpl of (templates || []) as { id: string; pipeline_stages: string[] | null }[]) {
    if (templateAppliesToStage(tpl.pipeline_stages, stageName)) {
      activeTemplateIds.push(tpl.id)
    } else {
      pausedTemplateIds.push(tpl.id)
    }
  }

  // Reanudar las tareas cuyas plantillas aplican a la etapa actual.
  if (activeTemplateIds.length > 0) {
    const { error } = await supabase
      .from("crm_tasks")
      .update({ is_paused: false })
      .eq("prospect_id", prospectId)
      .eq("is_completed", false)
      .in("template_id", activeTemplateIds)
    if (error) console.error("[v0] Error resuming automatic tasks:", error)
  }

  // Pausar las tareas cuyas plantillas no aplican a la etapa actual.
  if (pausedTemplateIds.length > 0) {
    const { error } = await supabase
      .from("crm_tasks")
      .update({ is_paused: true })
      .eq("prospect_id", prospectId)
      .eq("is_completed", false)
      .in("template_id", pausedTemplateIds)
    if (error) console.error("[v0] Error pausing automatic tasks:", error)
  }
}
