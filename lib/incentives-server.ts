import "server-only"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendEmail } from "@/lib/email"
import { isIncentiveAuthorizer } from "@/lib/incentives"
import { buildIncentiveNotification, type IncentiveEvent } from "@/lib/notifications/incentive"

export interface IncentiveActor {
  userId: string
  roleName: string | null
  isAuthorizer: boolean
  service: ReturnType<typeof createAdminClient>
}

export async function getIncentiveActor(): Promise<IncentiveActor | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const service = createAdminClient()
  const { data: row } = await service
    .from("users")
    .select("is_active, role:roles(name)")
    .eq("id", user.id)
    .maybeSingle()
  if (!row || row.is_active === false) return null

  const role = Array.isArray(row.role) ? row.role[0] : row.role
  const roleName = (role as { name?: string } | null)?.name ?? null
  return { userId: user.id, roleName, isAuthorizer: isIncentiveAuthorizer(roleName), service }
}

export async function notifyIncentive(id: string, event: IncentiveEvent): Promise<void> {
  try {
    const built = await buildIncentiveNotification(id, event)
    if (!built) {
      console.warn(`[incentives] Sin destinatarios para el evento "${event}" del incentivo ${id}`)
      return
    }
    await sendEmail({ to: built.to, subject: built.subject, html: built.html })
  } catch (error) {
    console.error(`[incentives] No se pudo enviar el correo "${event}" del incentivo ${id}:`, error)
  }
}
