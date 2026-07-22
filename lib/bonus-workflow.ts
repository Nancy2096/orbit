import { createClient } from "@/lib/supabase/client"

// Etapas del flujo de bono por capacitación (4 pasos)
export const BONUS_STAGES = {
  PENDING_MANAGER: "pending_manager", // Paso 2: espera autorización del jefe/dirección
  PENDING_EVIDENCE: "pending_evidence", // Paso 3: testigos (certificado, presentación, videollamada)
  PENDING_PAYMENT: "pending_payment", // Paso 4: espera autorización de pago (Dir. Operaciones)
  PAID: "paid", // Pagado / completado
  REJECTED: "rejected", // Rechazado en cualquier autorización
  LEGACY: "legacy", // Bonos previos al flujo (compatibilidad)
} as const

export type BonusStage = (typeof BONUS_STAGES)[keyof typeof BONUS_STAGES]

export const STAGE_LABELS: Record<string, string> = {
  pending_manager: "Pendiente de autorización",
  pending_evidence: "Pendiente de evidencia",
  pending_payment: "Pendiente de pago",
  paid: "Pagado",
  rejected: "Rechazado",
  legacy: "Registrado",
}

export const STAGE_BADGE_STYLES: Record<string, string> = {
  pending_manager: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  pending_evidence: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  pending_payment: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  legacy: "bg-muted text-muted-foreground",
}

// Los 4 pasos del flujo, en orden. `stageIndexForStep` mapea la etapa actual
// al índice del paso activo (0-based) para el stepper visual.
export const BONUS_STEPS = [
  { key: "register", label: "Registro" },
  { key: "authorization", label: "Autorización" },
  { key: "evidence", label: "Testigos" },
  { key: "payment", label: "Autorización de pago" },
] as const

// Devuelve el índice del paso activo según la etapa del flujo.
export function activeStepIndex(stage: string): number {
  switch (stage) {
    case BONUS_STAGES.PENDING_MANAGER:
      return 1
    case BONUS_STAGES.PENDING_EVIDENCE:
      return 2
    case BONUS_STAGES.PENDING_PAYMENT:
      return 3
    case BONUS_STAGES.PAID:
      return 4
    default:
      return 1
  }
}

export interface CurrentUserInfo {
  userId: string
  staffId: string | null
  fullName: string
  positionName: string | null
  positionLevel: string | null // 'director' | 'manager' | 'senior' | 'mid' | ...
  roleName: string | null // 'superadmin' | 'direccion_general' | 'rrhh' | ...
  isGlobalAccess: boolean
  isManagerOrAbove: boolean
  isOperationsDirector: boolean
}

// Obtiene el usuario logueado, su registro de staff y el nivel de su puesto.
// Se usa para: (1) precargar al solicitante, (2) decidir qué autorizaciones
// puede realizar en el flujo.
export async function getCurrentUserInfo(): Promise<CurrentUserInfo | null> {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return null

  const { data: userRow } = await supabase
    .from("users")
    .select("id, email, first_name, last_name, is_global_access, role:roles(name, level)")
    .eq("id", authUser.id)
    .maybeSingle()

  const { data: staffRow } = await supabase
    .from("staff")
    .select("id, first_name, last_name, position:positions(name, level)")
    .eq("user_id", authUser.id)
    .maybeSingle()

  const role = Array.isArray(userRow?.role) ? userRow?.role[0] : userRow?.role
  const position = Array.isArray(staffRow?.position) ? staffRow?.position[0] : staffRow?.position

  const fullName =
    [staffRow?.first_name, staffRow?.last_name].filter(Boolean).join(" ") ||
    [userRow?.first_name, userRow?.last_name].filter(Boolean).join(" ") ||
    userRow?.email ||
    authUser.email ||
    "Usuario"

  const positionLevel = position?.level ?? null
  const positionName = position?.name ?? null
  const roleName = role?.name ?? null

  // Un usuario es "jefe o superior" si su puesto es manager/director, o si su
  // rol es admin/superadmin, o tiene acceso global.
  const isManagerOrAbove =
    positionLevel === "manager" ||
    positionLevel === "director" ||
    roleName === "superadmin" ||
    roleName === "admin" ||
    userRow?.is_global_access === true

  // Dirección de Operaciones: puesto de nivel director cuyo nombre menciona "operaciones",
  // o superadmin/acceso global (para no bloquear la administración).
  const isOperationsDirector =
    (positionLevel === "director" && /operac/i.test(positionName || "")) ||
    roleName === "superadmin" ||
    userRow?.is_global_access === true

  return {
    userId: authUser.id,
    staffId: staffRow?.id ?? null,
    fullName,
    positionName,
    positionLevel,
    roleName,
    isGlobalAccess: userRow?.is_global_access === true,
    isManagerOrAbove,
    isOperationsDirector,
  }
}

// Roles autorizados para modificar las políticas de bonos:
// Recursos Humanos, Dirección General o Super administrador.
const BONUS_POLICY_ROLES = ["rrhh", "direccion_general", "superadmin"]

export function canManageBonusPolicy(user: CurrentUserInfo | null): boolean {
  if (!user) return false
  if (user.isGlobalAccess) return true
  return user.roleName != null && BONUS_POLICY_ROLES.includes(user.roleName)
}
