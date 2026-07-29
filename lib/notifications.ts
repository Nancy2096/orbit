import { createClient } from "@/lib/supabase/client"

export type NotificationType = "course" | "expense" | "leave" | "bonus"

export interface AppNotification {
  /** Clave estable y única para persistir el estado de "leído". */
  key: string
  type: NotificationType
  title: string
  description: string
  href: string
  createdAt: string
  read: boolean
}

/** Resultado de la carga de notificaciones del usuario actual. */
export interface NotificationsResult {
  notifications: AppNotification[]
  unreadCount: number
  userId: string | null
}

function formatCurrency(amount: number | null | undefined) {
  if (amount == null) return ""
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(amount)
}

/**
 * Deriva las notificaciones del usuario autenticado a partir de datos reales:
 * - Cursos OBLIGATORIOS asignados que aún no ha completado.
 * - Gastos pendientes de validar (donde el usuario es aprobador).
 * - Bonos pendientes de aprobar (donde el usuario es el jefe directo).
 * - Días libres pendientes de aprobar (donde el usuario es aprobador).
 *
 * El estado de "leído" se persiste en la tabla notification_reads por usuario.
 */
export async function fetchNotifications(): Promise<NotificationsResult> {
  const supabase = createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return { notifications: [], unreadCount: 0, userId: null }
  }

  // Ficha de personal vinculada al usuario (por user_id y, como respaldo, email).
  let staffId: string | null = null
  const { data: staffByUser } = await supabase
    .from("staff")
    .select("id, email")
    .eq("user_id", authUser.id)
    .maybeSingle()

  if (staffByUser) {
    staffId = staffByUser.id
  } else if (authUser.email) {
    const { data: staffByEmail } = await supabase
      .from("staff")
      .select("id")
      .ilike("email", authUser.email)
      .limit(1)
    staffId = staffByEmail?.[0]?.id ?? null
  }

  const notifications: AppNotification[] = []

  if (staffId) {
    // IDs del personal que le reporta directamente (para bonos pendientes de jefe).
    const { data: reports } = await supabase
      .from("staff")
      .select("id")
      .eq("reports_to_id", staffId)
    const reportIds = (reports ?? []).map((r) => r.id)

    const [coursesRes, expensesRes, leavesRes, bonusesRes] = await Promise.all([
      // Cursos obligatorios asignados y no completados.
      supabase
        .from("training_enrollments")
        .select("id, created_at, status, course:training_courses!inner(id, title, is_mandatory)")
        .eq("staff_id", staffId)
        .eq("course.is_mandatory", true)
        .neq("status", "completed"),
      // Gastos por validar (usuario aprobador).
      supabase
        .from("expenses")
        .select("id, created_at, vendor_name, description, total_amount")
        .eq("approver_id", staffId)
        .eq("approval_status", "pending"),
      // Días libres por aprobar (usuario aprobador).
      supabase
        .from("leave_requests")
        .select("id, created_at, start_date, end_date, total_days, staff:staff!leave_requests_staff_id_fkey(first_name, last_name)")
        .eq("approver_id", staffId)
        .eq("status", "pending"),
      // Bonos pendientes de aprobación del jefe directo.
      reportIds.length > 0
        ? supabase
            .from("bonuses")
            .select("id, created_at, amount, bonus_type, description, staff:staff!bonuses_staff_id_fkey(first_name, last_name)")
            .in("staff_id", reportIds)
            .eq("workflow_stage", "pending_manager")
        : Promise.resolve({ data: [] as any[] }),
    ])

    for (const e of coursesRes.data ?? []) {
      const course = Array.isArray(e.course) ? e.course[0] : e.course
      notifications.push({
        key: `course:${e.id}`,
        type: "course",
        title: "Curso esencial asignado",
        description: `Se te asignó el curso obligatorio "${course?.title ?? "Curso"}". Es esencial, no optativo.`,
        href: "/dashboard/hr/training",
        createdAt: e.created_at ?? new Date().toISOString(),
        read: false,
      })
    }

    for (const x of expensesRes.data ?? []) {
      notifications.push({
        key: `expense:${x.id}`,
        type: "expense",
        title: "Gasto por validar",
        description: `${x.vendor_name || x.description || "Gasto"}${
          x.total_amount != null ? ` · ${formatCurrency(x.total_amount)}` : ""
        }`,
        href: "/dashboard/expenses",
        createdAt: x.created_at ?? new Date().toISOString(),
        read: false,
      })
    }

    for (const l of leavesRes.data ?? []) {
      const s = Array.isArray(l.staff) ? l.staff[0] : l.staff
      const who = s ? `${s.first_name} ${s.last_name}` : "Un colaborador"
      notifications.push({
        key: `leave:${l.id}`,
        type: "leave",
        title: "Día libre por aprobar",
        description: `${who} solicitó ${l.total_days ?? ""} día(s) libre(s).`,
        href: "/dashboard/hr/leave-requests",
        createdAt: l.created_at ?? new Date().toISOString(),
        read: false,
      })
    }

    for (const b of bonusesRes.data ?? []) {
      const s = Array.isArray(b.staff) ? b.staff[0] : b.staff
      const who = s ? `${s.first_name} ${s.last_name}` : "Un colaborador"
      notifications.push({
        key: `bonus:${b.id}`,
        type: "bonus",
        title: "Bono por aprobar",
        description: `${who} · ${b.description || b.bonus_type || "Bono"}${
          b.amount != null ? ` · ${formatCurrency(b.amount)}` : ""
        }`,
        href: `/dashboard/hr/bonuses/${b.id}`,
        createdAt: b.created_at ?? new Date().toISOString(),
        read: false,
      })
    }
  }

  // Estado de "leído" persistido por usuario.
  const { data: reads } = await supabase
    .from("notification_reads")
    .select("notification_key")
    .eq("user_id", authUser.id)
  const readKeys = new Set((reads ?? []).map((r) => r.notification_key))

  for (const n of notifications) {
    n.read = readKeys.has(n.key)
  }

  notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    userId: authUser.id,
  }
}

/** Marca una notificación como leída para el usuario indicado. */
export async function markNotificationRead(userId: string, key: string) {
  const supabase = createClient()
  await supabase
    .from("notification_reads")
    .upsert({ user_id: userId, notification_key: key }, { onConflict: "user_id,notification_key" })
}

/** Marca todas las notificaciones dadas como leídas. */
export async function markAllNotificationsRead(userId: string, keys: string[]) {
  if (keys.length === 0) return
  const supabase = createClient()
  await supabase
    .from("notification_reads")
    .upsert(
      keys.map((key) => ({ user_id: userId, notification_key: key })),
      { onConflict: "user_id,notification_key" },
    )
}
