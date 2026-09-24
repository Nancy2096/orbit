import "server-only"

import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

/**
 * Cliente con service role (sin sesión ni cookies) para poder leer la tabla
 * `users` y, si hace falta, `auth.users`. Se crea uno nuevo por invocación
 * para no compartir estado entre requests (importante con Fluid compute).
 */
function createAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error("[notify:recipients] Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.")
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

interface StaffEmailRow {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  user_id: string | null
}

function fullName(staff: Pick<StaffEmailRow, "first_name" | "last_name">): string {
  return `${staff.first_name ?? ""} ${staff.last_name ?? ""}`.trim() || "Empleado"
}

/**
 * Resuelve el email de notificación de un empleado.
 *
 * Prioridad:
 *  1. Email del usuario vinculado (`users` por `staff.user_id`).
 *  2. Si `users` no tiene email, el de `auth.users`.
 *  3. Solo si el staff NO tiene usuario vinculado, se usa `staff.email` como
 *     respaldo (con `console.warn` indicando el nombre).
 *
 * Devuelve `null` si no se pudo determinar ningún email.
 *
 * Este helper es reutilizable para otras notificaciones (bonos, gastos).
 */
export async function getNotificationEmail(staffId: string): Promise<string | null> {
  if (!staffId) return null

  const supabase = createAdminClient()

  const { data: staff, error } = await supabase
    .from("staff")
    .select("id, first_name, last_name, email, user_id")
    .eq("id", staffId)
    .single<StaffEmailRow>()

  if (error || !staff) {
    if (error) console.error(`[notify:recipients] No se pudo obtener el staff ${staffId}:`, error.message)
    return null
  }

  // Staff con usuario vinculado: usar el email del usuario (users -> auth.users).
  if (staff.user_id) {
    const { data: user } = await supabase
      .from("users")
      .select("email")
      .eq("id", staff.user_id)
      .maybeSingle<{ email: string | null }>()

    const usersEmail = user?.email?.trim()
    if (usersEmail) return usersEmail

    // users sin email: recurrir a auth.users.
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(staff.user_id)
    if (authError) {
      console.error(
        `[notify:recipients] No se pudo leer auth.users para ${fullName(staff)} (${staff.user_id}):`,
        authError.message,
      )
    }
    const authEmail = authData?.user?.email?.trim()
    if (authEmail) return authEmail

    console.warn(
      `[notify:recipients] El usuario vinculado de ${fullName(staff)} (${staff.user_id}) no tiene email en users ni auth.users.`,
    )
    return null
  }

  // Sin usuario vinculado: respaldo con staff.email.
  const fallback = staff.email?.trim()
  if (fallback) {
    console.warn(
      `[notify:recipients] ${fullName(staff)} no tiene usuario vinculado; usando staff.email como respaldo.`,
    )
    return fallback
  }

  console.warn(`[notify:recipients] ${fullName(staff)} no tiene usuario vinculado ni staff.email.`)
  return null
}
