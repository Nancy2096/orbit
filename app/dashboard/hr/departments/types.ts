export interface Agency {
  id: string
  name: string
}

export interface StaffMini {
  id: string
  first_name: string
  last_name: string
  photo_url: string | null
  department_id: string | null
  position_id: string | null
  is_active: boolean | null
}

export interface Department {
  id: string
  agency_id: string | null
  name: string
  description: string | null
  is_active: boolean
  sort_order: number | null
  code: string | null
  cost_center: string | null
  leader_staff_id: string | null
}

export interface ProfileFunction {
  responsibility: string
  periodicity: string
  reports: string
}

export interface PositionProfile {
  doc: {
    code_format: string
    version: string
    elaboration_date: string
    elaborated_by: string
    approved_by: string
  }
  general: {
    people_in_charge: string
    supervises: string
    interacts_with: string[]
  }
  objective: string
  functions: ProfileFunction[]
  requirements: {
    academic_level: string
    specialty: string
    experience: string
    other_knowledge: string
    languages: string
  }
  competencies: {
    general: string
    technical: string
  }
}

export interface Position {
  id: string
  agency_id: string | null
  department_id: string | null
  name: string
  description: string | null
  level: string | null
  is_active: boolean
  reports_to_position_id: string | null
  headcount_target: number | null
  job_type: string | null
  work_schedule: string | null
  salary_range: string | null
  profile_status: string | null
  profile: PositionProfile | null
}

export const POSITION_LEVELS = [
  { value: "directivo", label: "Directivo" },
  { value: "coordinacion", label: "Coordinación" },
  { value: "operativo", label: "Operativo" },
] as const

export const JOB_TYPES = [
  { value: "fulltime", label: "Fulltime" },
  { value: "parttime", label: "Parttime" },
  { value: "freelance", label: "Freelance" },
] as const

export const PROFILE_STATUSES = [
  { value: "draft", label: "Borrador", badge: "secondary" as const },
  { value: "review", label: "En Revisión", badge: "outline" as const },
  { value: "approved", label: "Aprobado", badge: "default" as const },
] as const

export const PERIODICITY_OPTIONS = [
  "Diario",
  "Semanal",
  "Mensual",
  "Semestral",
  "Anual",
  "Según necesidad",
  "Ocasional",
] as const

export const ACADEMIC_LEVELS = [
  "Técnico",
  "Tecnólogo",
  "Profesional",
  "Especialista",
  "Magíster",
] as const

export function emptyProfile(): PositionProfile {
  return {
    doc: {
      code_format: "FOR.TH.01",
      version: "1.0",
      elaboration_date: "",
      elaborated_by: "",
      approved_by: "",
    },
    general: {
      people_in_charge: "0",
      supervises: "",
      interacts_with: [],
    },
    objective: "",
    functions: [],
    requirements: {
      academic_level: "",
      specialty: "",
      experience: "",
      other_knowledge: "",
      languages: "",
    },
    competencies: {
      general: "",
      technical: "",
    },
  }
}

export function levelLabel(value: string | null | undefined) {
  return POSITION_LEVELS.find((l) => l.value === value)?.label ?? "—"
}

export function jobTypeLabel(value: string | null | undefined) {
  return JOB_TYPES.find((j) => j.value === value)?.label ?? "—"
}

export function profileStatusMeta(value: string | null | undefined) {
  return PROFILE_STATUSES.find((s) => s.value === value) ?? PROFILE_STATUSES[0]
}
