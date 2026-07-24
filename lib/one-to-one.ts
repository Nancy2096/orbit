export interface Agency {
  id: string
  name: string
}

export interface StaffMember {
  id: string
  first_name: string
  last_name: string
  position: string | null
  agency_id: string | null
}

export interface ActionItem {
  action: string
  responsible: string
  due_date: string
}

export interface OneToOneReport {
  id: string
  agency_id: string | null
  staff_id: string
  position_snapshot: string | null
  leader_name: string | null
  meeting_date: string
  duration_minutes: number | null
  meeting_type: string | null
  meeting_type_other: string | null
  reason: string
  reason_other: string | null
  // Pulse check
  satisfaction_level: number | null
  motivators_stressors: string | null
  // Achievements
  achievements: string | null
  positive_feedback: string | null
  // Challenges
  bottlenecks: string | null
  constructive_feedback: string | null
  // Development
  learning_interests: string | null
  career_projection: string | null
  // Tools & resources
  equipment_evaluation: string | null
  information_accessibility: string | null
  team_support: string | null
  work_techniques: string | null
  // Action plan
  action_items: ActionItem[] | null
  // Private HR notes
  private_notes: string | null
  turnover_risk: string | null
  nonverbal_observations: string | null
  // Legacy / misc
  topics: string | null
  tools_provided: string | null
  staff_commitments: string | null
  leader_commitments: string | null
  next_followup_date: string | null
  additional_notes: string | null
  created_by_name: string | null
  created_at: string
  staff?: { first_name: string; last_name: string; position: string | null } | null
}

export const MEETING_TYPE_OPTIONS = [
  { value: "check_in_mensual", label: "Check-in mensual" },
  { value: "seguimiento_desempeno", label: "Seguimiento de desempeño" },
  { value: "onboarding", label: "Onboarding" },
  { value: "offboarding", label: "Offboarding" },
  { value: "desarrollo", label: "Desarrollo" },
  { value: "situacion_puntual", label: "Situación puntual" },
  { value: "otro", label: "Otro" },
]

export const MEETING_TYPE_LABELS: Record<string, string> = MEETING_TYPE_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {},
)

export const TURNOVER_RISK_OPTIONS = [
  { value: "bajo", label: "Bajo" },
  { value: "medio", label: "Medio" },
  { value: "alto", label: "Alto" },
]

export const SATISFACTION_LABELS: Record<number, string> = {
  1: "Muy baja",
  2: "Baja",
  3: "Neutral",
  4: "Buena",
  5: "Excelente",
}

export const TODAY = () => new Date().toISOString().split("T")[0]

export function staffFullName(r: Pick<OneToOneReport, "staff">): string {
  return r.staff ? `${r.staff.first_name} ${r.staff.last_name}` : "Colaborador"
}

export function formatLongDate(value: string | null): string {
  if (!value) return "—"
  return new Date(value + "T00:00:00").toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export const REPORT_SELECT = `
  id, agency_id, staff_id, position_snapshot, leader_name, meeting_date,
  duration_minutes, meeting_type, meeting_type_other, reason, reason_other,
  satisfaction_level, motivators_stressors, achievements, positive_feedback,
  bottlenecks, constructive_feedback, learning_interests, career_projection,
  equipment_evaluation, information_accessibility, team_support, work_techniques,
  action_items, private_notes, turnover_risk, nonverbal_observations,
  topics, tools_provided, staff_commitments, leader_commitments,
  next_followup_date, additional_notes, created_by_name, created_at,
  staff:staff_id(first_name, last_name, position)
`
