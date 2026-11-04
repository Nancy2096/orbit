import { NextResponse, after } from "next/server"
import { getUserAgencyIds, requireProspectsModule } from "@/lib/crm/prospect-access"
import {
  PROSPECT_EMAIL_SELECT,
  isSelfAssignment,
  reassignProspects,
  toEmailProspect,
} from "@/lib/crm/reassign-prospects"
import { notifyAdvisorAssignment } from "@/lib/notifications/new-lead"

const UUID = /^[0-9a-f-]{36}$/i
const MAX_PROSPECTS = 500

/**
 * Cambia el asesor de uno o varios prospectos (detalle, lista y asignación
 * masiva). Con mode "initial" solo avisa por correo de la asignación hecha al
 * crear el prospecto. El correo se envía después de responder y nunca impide
 * que se guarde la asignación.
 */
export async function POST(request: Request) {
  const access = await requireProspectsModule()
  if (access instanceof NextResponse) return access

  let body: { prospectIds?: unknown; toStaffId?: unknown; mode?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
  }

  const prospectIds = Array.isArray(body.prospectIds)
    ? [...new Set(body.prospectIds.filter((id): id is string => typeof id === "string" && UUID.test(id)))]
    : []
  const toStaffId = typeof body.toStaffId === "string" && UUID.test(body.toStaffId) ? body.toStaffId : null
  const isInitial = body.mode === "initial"

  if (prospectIds.length === 0) return NextResponse.json({ error: "Selecciona al menos un prospecto" }, { status: 400 })
  if (prospectIds.length > MAX_PROSPECTS) {
    return NextResponse.json({ error: `Máximo ${MAX_PROSPECTS} prospectos por operación` }, { status: 400 })
  }
  if (body.toStaffId != null && !toStaffId) return NextResponse.json({ error: "Asesor inválido" }, { status: 400 })

  const { service, userId, userName, allAgencies } = access

  const { data: prospects } = await service.from("crm_prospects").select(PROSPECT_EMAIL_SELECT).in("id", prospectIds)
  if (!prospects || prospects.length !== prospectIds.length) {
    return NextResponse.json({ error: "Algún prospecto no existe" }, { status: 404 })
  }
  if (!allAgencies) {
    const agencyIds = await getUserAgencyIds(service, userId)
    if (prospects.some((p) => !p.agency_id || !agencyIds.has(p.agency_id as string))) {
      return NextResponse.json({ error: "No tienes acceso a la agencia de algún prospecto" }, { status: 403 })
    }
  }

  if (toStaffId) {
    const { data: staff } = await service.from("staff").select("id, is_active").eq("id", toStaffId).maybeSingle()
    if (!staff || staff.is_active === false) return NextResponse.json({ error: "El asesor no existe o está inactivo" }, { status: 400 })
  }

  if (isInitial) {
    if (!toStaffId) return NextResponse.json({ success: true, notified: 0 })
    const recent = Date.now() - 15 * 60 * 1000
    const eligible = prospects.filter(
      (p) => p.assigned_to === toStaffId && new Date(p.created_at as string).getTime() >= recent,
    )
    if (eligible.length > 0 && !(await isSelfAssignment(service, toStaffId, userId))) {
      const emailProspects = eligible.map((p) => toEmailProspect(p as unknown as Parameters<typeof toEmailProspect>[0]))
      after(() => notifyAdvisorAssignment({ assignedTo: toStaffId, assignedByName: userName, prospects: emailProspects }))
      return NextResponse.json({ success: true, notified: eligible.length })
    }
    return NextResponse.json({ success: true, notified: 0 })
  }

  try {
    const outcome = await reassignProspects(service, {
      prospectIds,
      toStaffId,
      actorUserId: userId,
      actorName: userName,
    })
    if (toStaffId && outcome.emailProspects.length > 0) {
      const emailProspects = outcome.emailProspects
      after(() => notifyAdvisorAssignment({ assignedTo: toStaffId, assignedByName: userName, prospects: emailProspects }))
    }
    return NextResponse.json({
      success: true,
      changed: outcome.changed,
      transferredTasks: outcome.transferredTasks,
    })
  } catch (e) {
    console.error("[reassign] Error al reasignar prospectos:", (e as Error).message)
    return NextResponse.json({ error: "No se pudo reasignar" }, { status: 500 })
  }
}
