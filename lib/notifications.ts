import { createClient } from "@/lib/supabase/client"

export type NotificationType = "course" | "expense" | "leave" | "bonus" | "one2one"

/**
 * Hitos de reuniones One 2 One en función del día que la persona inició a
 * trabajar (hire_date). Al cumplir cada mes se genera una notificación para el
 * líder y para el colaborador. meetingType coincide con los tipos de 1a1.
 */
const ONE2ONE_MILESTONES: { months: number; meetingType: string; label: string }[] = [
  { months: 1, meetingType: "primer_mes", label: "1er mes" },
  { months: 2, meetingType: "segundo_mes", label: "2do mes" },
  { months: 3, meetingType: "tercer_mes", label: "3er mes" },
]

/** Suma meses a una fecha (base) y devuelve el resultado. */
function addMonths(dateStr: string, months: number): Date {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return d
}

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
    // Ficha propia (para calcular hitos One 2 One a partir de la fecha de ingreso).
    const { data: selfStaff } = await supabase
      .from("staff")
      .select("id, first_name, last_name, hire_date")
      .eq("id", staffId)
      .maybeSingle()

    // Personal que le reporta directamente (para bonos pendientes y One 2 One de líder).
    const { data: reports } = await supabase
      .from("staff")
      .select("id, first_name, last_name, hire_date")
      .eq("reports_to_id", staffId)
      .eq("is_active", true)
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

    // Recordatorios de reuniones One 2 One por hito (1er, 2do y 3er mes desde
    // la fecha de ingreso). Se generan tanto para el colaborador como para su líder.
    const monitoredStaff = [
      ...(selfStaff ? [{ ...selfStaff, isSelf: true }] : []),
      ...(reports ?? []).map((r) => ({ ...r, isSelf: false })),
    ].filter((s) => s.hire_date)

    if (monitoredStaff.length > 0) {
      // Reuniones One 2 One ya registradas para esos colaboradores en los hitos mensuales.
      const monitoredIds = monitoredStaff.map((s) => s.id)
      const milestoneTypes = ONE2ONE_MILESTONES.map((m) => m.meetingType)
      const { data: doneMeetings } = await supabase
        .from("one_to_one_reports")
        .select("staff_id, meeting_type")
        .in("staff_id", monitoredIds)
        .in("meeting_type", milestoneTypes)
      const doneKeys = new Set((doneMeetings ?? []).map((m) => `${m.staff_id}:${m.meeting_type}`))

      const now = Date.now()
      for (const s of monitoredStaff) {
        for (const milestone of ONE2ONE_MILESTONES) {
          const dueDate = addMonths(s.hire_date as string, milestone.months)
          // Solo cuando el hito ya venció y aún no se registró la reunión.
          if (now < dueDate.getTime()) continue
          if (doneKeys.has(`${s.id}:${milestone.meetingType}`)) continue

          if (s.isSelf) {
            notifications.push({
              key: `one2one:self:${s.id}:${milestone.meetingType}`,
              type: "one2one",
              title: `Reunión One 2 One de ${milestone.label}`,
              description: `Cumpliste ${milestone.label} en la empresa. Agenda tu reunión One 2 One con tu líder.`,
              href: "/dashboard/hr/one-to-one",
              createdAt: dueDate.toISOString(),
              read: false,
            })
          } else {
            notifications.push({
              key: `one2one:lead:${s.id}:${milestone.meetingType}`,
              type: "one2one",
              title: `Reunión One 2 One de ${milestone.label}`,
              description: `${s.first_name} ${s.last_name} cumplió ${milestone.label}. Realiza su reunión One 2 One.`,
              href: "/dashboard/hr/one-to-one",
              createdAt: dueDate.toISOString(),
              read: false,
            })
          }
        }
      }
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
