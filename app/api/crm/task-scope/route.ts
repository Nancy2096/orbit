import { NextResponse } from "next/server"
import { requireProspectsModule } from "@/lib/crm/prospect-access"

const TEAM_ROLES = ["superadmin", "direccion_general"]
const MANAGER_LEVELS = ["manager", "director"]

/**
 * Indica de quién puede ver tareas el usuario en Calendario y Tareas:
 * superadmin, direccion_general y comercial con puesto de gerente ven al equipo;
 * el resto solo sus propias tareas.
 */
export async function GET() {
  const access = await requireProspectsModule()
  if (access instanceof NextResponse) return access
  const { service, userId, roleName } = access

  const { data: staffRows } = await service.from("staff").select("id, position_id").eq("user_id", userId)

  const staffIds = (staffRows ?? []).map((s) => s.id as string)
  const positionIds = (staffRows ?? []).map((s) => s.position_id as string | null).filter((x): x is string => !!x)
  let isManager = false
  if (positionIds.length > 0) {
    const { data: positions } = await service.from("positions").select("level").in("id", positionIds)
    isManager = (positions ?? []).some((p) => MANAGER_LEVELS.includes((p.level as string | null) ?? ""))
  }

  const canSeeTeam = TEAM_ROLES.includes(roleName) || (roleName === "comercial" && isManager)

  return NextResponse.json({ userId, staffIds, canSeeTeam })
}
