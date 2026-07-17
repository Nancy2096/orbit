import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAssignmentSettings, pickNextAssignee, assignProspect } from "@/lib/crm/lead-assignment"

// Cron de reasignación de leads no atendidos. Vercel lo invoca según la
// programación de vercel.json. Recorre las agencias con reasignación activada y
// reasigna los prospectos cuyo asesor no los atendió dentro del tiempo tolerado.
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  // Autorización: Vercel Cron envía el header con CRON_SECRET si está definido.
  const secret = process.env.CRON_SECRET
  if (secret) {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
  }

  let supabase
  try {
    supabase = createAdminClient()
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }

  // Agencias con reasignación por tiempo activada.
  const { data: agencies } = await supabase
    .from("crm_assignment_settings")
    .select("agency_id, method, reassign_enabled, response_time_minutes")
    .eq("reassign_enabled", true)

  let reassignedCount = 0
  const now = Date.now()

  for (const agency of agencies ?? []) {
    const settings = await getAssignmentSettings(supabase, agency.agency_id)
    const thresholdMs = settings.response_time_minutes * 60 * 1000
    const cutoff = new Date(now - thresholdMs).toISOString()

    // Leads activos, asignados, no atendidos y cuya asignación superó el umbral.
    const { data: staleLeads } = await supabase
      .from("crm_prospects")
      .select("id, assigned_to, assigned_at")
      .eq("agency_id", agency.agency_id)
      .eq("status", "active")
      .not("assigned_to", "is", null)
      .is("attended_at", null)
      .lt("assigned_at", cutoff)

    for (const lead of staleLeads ?? []) {
      // Elegir otro asesor distinto al actual.
      const nextStaff = await pickNextAssignee(supabase, agency.agency_id, settings, {
        excludeStaffId: lead.assigned_to as string,
      })
      if (!nextStaff || nextStaff === lead.assigned_to) continue

      await assignProspect(supabase, {
        prospectId: lead.id as string,
        agencyId: agency.agency_id,
        staffId: nextStaff,
        assignedBy: null,
      })
      reassignedCount += 1
    }
  }

  return NextResponse.json({ success: true, reassigned: reassignedCount })
}
