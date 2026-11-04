import { NextResponse, after } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAssignmentSettings, pickNextAssignee } from "@/lib/crm/lead-assignment"
import { reassignProspects } from "@/lib/crm/reassign-prospects"
import { requireProspectsModule } from "@/lib/crm/prospect-access"
import { notifyAdvisorAssignment, type AssignedProspectEmailData } from "@/lib/notifications/new-lead"

// Reasignación de leads no atendidos. Vercel Cron la invoca por GET según
// vercel.json; la pantalla de Equipo la invoca por POST con la sesión del usuario.
export const dynamic = "force-dynamic"

const AUTO_ACTOR = "Reasignación automática (sin atención)"

async function processStale(supabase: SupabaseClient, actor: { userId: string | null; name: string }) {
  const { data: agencies } = await supabase
    .from("crm_assignment_settings")
    .select("agency_id")
    .eq("reassign_enabled", true)

  let reassignedCount = 0
  let transferredTasks = 0
  const emailsByAdvisor = new Map<string, AssignedProspectEmailData[]>()
  const now = Date.now()

  for (const agency of agencies ?? []) {
    const settings = await getAssignmentSettings(supabase, agency.agency_id)
    const cutoff = new Date(now - settings.response_time_minutes * 60 * 1000).toISOString()

    const { data: staleLeads } = await supabase
      .from("crm_prospects")
      .select("id, assigned_to")
      .eq("agency_id", agency.agency_id)
      .eq("status", "active")
      .not("assigned_to", "is", null)
      .is("attended_at", null)
      .lt("assigned_at", cutoff)

    for (const lead of staleLeads ?? []) {
      const nextStaff = await pickNextAssignee(supabase, agency.agency_id, settings, {
        excludeStaffId: lead.assigned_to as string,
      })
      if (!nextStaff || nextStaff === lead.assigned_to) continue

      const outcome = await reassignProspects(supabase, {
        prospectIds: [lead.id as string],
        toStaffId: nextStaff,
        actorUserId: actor.userId,
        actorName: actor.name,
        resetAttended: true,
      })
      if (outcome.changed === 0) continue

      await supabase
        .from("crm_assignment_members")
        .update({ last_assigned_at: new Date().toISOString() })
        .eq("agency_id", agency.agency_id)
        .eq("staff_id", nextStaff)

      reassignedCount += outcome.changed
      transferredTasks += outcome.transferredTasks
      if (outcome.emailProspects.length > 0) {
        emailsByAdvisor.set(nextStaff, [...(emailsByAdvisor.get(nextStaff) ?? []), ...outcome.emailProspects])
      }
    }
  }

  if (emailsByAdvisor.size > 0) {
    after(async () => {
      for (const [assignedTo, prospects] of emailsByAdvisor) {
        await notifyAdvisorAssignment({ assignedTo, assignedByName: actor.name, prospects })
      }
    })
  }

  return NextResponse.json({ success: true, reassigned: reassignedCount, transferredTasks })
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  let supabase: SupabaseClient
  try {
    supabase = createAdminClient()
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
  try {
    return await processStale(supabase, { userId: null, name: AUTO_ACTOR })
  } catch (e) {
    console.error("[reassign-stale] Error:", (e as Error).message)
    return NextResponse.json({ error: "No se pudo procesar la reasignación" }, { status: 500 })
  }
}

export async function POST() {
  const access = await requireProspectsModule()
  if (access instanceof NextResponse) return access
  try {
    return await processStale(access.service, { userId: access.userId, name: `${AUTO_ACTOR}, ejecutada por ${access.userName}` })
  } catch (e) {
    console.error("[reassign-stale] Error:", (e as Error).message)
    return NextResponse.json({ error: "No se pudo procesar la reasignación" }, { status: 500 })
  }
}
