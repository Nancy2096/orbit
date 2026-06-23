// Lógica compartida del módulo de Onboarding (introducción de nuevo personal durante 90 días).

export type OnboardingStageKey =
  | "systems"
  | "induction"
  | "training"
  | "areas"
  | "followup"
  | "evaluation"

export interface OnboardingStageMeta {
  key: OnboardingStageKey
  order: number
  title: string
  description: string
}

export const ONBOARDING_STAGES: OnboardingStageMeta[] = [
  {
    key: "systems",
    order: 1,
    title: "Alta en sistemas",
    description: "Alta del colaborador en Orbit, asignación de roles y permisos, y avance del perfil.",
  },
  {
    key: "induction",
    order: 2,
    title: "Inducción institucional",
    description: "Presentaciones de cómo trabajamos y test de comprensión.",
  },
  {
    key: "training",
    order: 3,
    title: "Formación de procesos",
    description: "Presentaciones de procesos y test de comprensión.",
  },
  {
    key: "areas",
    order: 4,
    title: "Acercamiento con áreas",
    description: "Agenda de 5 días de presentación con las distintas áreas.",
  },
  {
    key: "followup",
    order: 5,
    title: "Seguimiento 15-30-60 días",
    description: "Reuniones de seguimiento con Recursos Humanos.",
  },
  {
    key: "evaluation",
    order: 6,
    title: "Evaluación final (90 días)",
    description: "Encuestas de satisfacción de onboarding (semana 1 y día 30).",
  },
]

export function getStageMeta(key: string): OnboardingStageMeta | undefined {
  return ONBOARDING_STAGES.find((s) => s.key === key)
}

// Tareas tipo checkmark de la etapa 1 (Alta en sistemas).
export const SYSTEMS_TASKS: { task_key: string; title: string }[] = [
  { task_key: "alta_orbit", title: "Dar de alta en Orbit como usuario" },
  { task_key: "roles_permisos", title: "Asignar Roles y Permisos" },
]

// Etapa 4: agenda de 5 días. dayOffset es relativo a la fecha de ingreso.
export const AREAS_TASKS: { task_key: string; title: string; dayOffset: number }[] = [
  { task_key: "dia_1", title: "Día 1 — Bienvenida e inducción institucional (RRHH / Dirección)", dayOffset: 0 },
  { task_key: "dia_2", title: "Día 2 — Acercamiento con área Comercial", dayOffset: 1 },
  { task_key: "dia_3", title: "Día 3 — Acercamiento con Estrategia, Marketing, Diseño y Tecnología", dayOffset: 2 },
  { task_key: "dia_4", title: "Día 4 — Acercamiento con Administración", dayOffset: 3 },
  { task_key: "dia_5", title: "Día 5 — Presentación formal al equipo completo de ambas agencias", dayOffset: 4 },
]

// Etapa 5: seguimientos 15-30-60 días.
export const FOLLOWUP_TASKS: { task_key: string; title: string; dayOffset: number }[] = [
  { task_key: "seg_15", title: "Seguimiento 15 — Reunión con RH", dayOffset: 15 },
  { task_key: "seg_30", title: "Seguimiento 30 — Reunión con RH", dayOffset: 30 },
  { task_key: "seg_60", title: "Seguimiento 60 — Reunión con RH", dayOffset: 60 },
]

// Etapa 6: encuestas de satisfacción.
export const SURVEY_MOMENTS: {
  moment: string
  title: string
  description: string
  dayOffset: number
}[] = [
  {
    moment: "week1",
    title: "Momento 1 — Semana 1",
    description: "Evalúa la experiencia de la primera semana. Se activa a los 7 días del ingreso.",
    dayOffset: 7,
  },
  {
    moment: "day30",
    title: "Momento 2 — Día 30",
    description: "Evalúa adaptación, integración al equipo y claridad del rol. Se activa a los 30 días.",
    dayOffset: 30,
  },
]

// Preguntas de las encuestas de satisfacción (escala 1-5 + comentario).
export const SURVEY_QUESTIONS: { key: string; label: string }[] = [
  { key: "welcome", label: "¿Qué tan bien te sentiste recibido/a por el equipo?" },
  { key: "clarity", label: "¿Qué tan clara fue la información sobre tu rol y responsabilidades?" },
  { key: "tools", label: "¿Qué tan preparado/a te sientes con las herramientas y accesos?" },
  { key: "support", label: "¿Qué tan acompañado/a te has sentido por tu líder y RRHH?" },
  { key: "overall", label: "En general, ¿cómo calificarías tu experiencia de integración?" },
]

export function addDays(date: string | Date, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export const DEFAULT_PASS_THRESHOLD = 80

// Estado de cada etapa: completed, in-progress, pending.
export type StageStatus = "completed" | "in-progress" | "pending"

// Datos mínimos para calcular el avance de un proceso.
export interface ProcessProgressInput {
  tasks: { stage: string; task_key: string; completed: boolean }[]
  attempts: { stage: string; passed: boolean }[]
  surveys: { moment: string; status: string }[]
}

export interface ProcessProgress {
  stages: Record<OnboardingStageKey, StageStatus>
  completedStages: number
  totalStages: number
  percentage: number
}

export function computeProcessProgress(input: ProcessProgressInput): ProcessProgress {
  const { tasks, attempts, surveys } = input

  const tasksByStage = (stage: string) => tasks.filter((t) => t.stage === stage)
  const stagePassed = (stage: string) => attempts.some((a) => a.stage === stage && a.passed)

  function taskStageStatus(stage: string, expectedCount: number): StageStatus {
    const items = tasksByStage(stage)
    if (items.length === 0) return "pending"
    const done = items.filter((t) => t.completed).length
    if (done >= expectedCount && done === items.length) return "completed"
    if (done > 0) return "in-progress"
    return "pending"
  }

  const systems = taskStageStatus("systems", SYSTEMS_TASKS.length)
  const induction: StageStatus = stagePassed("induction") ? "completed" : "pending"
  const training: StageStatus = stagePassed("training") ? "completed" : "pending"
  const areas = taskStageStatus("areas", AREAS_TASKS.length)
  const followup = taskStageStatus("followup", FOLLOWUP_TASKS.length)

  const completedSurveys = surveys.filter((s) => s.status === "completed").length
  let evaluation: StageStatus = "pending"
  if (surveys.length > 0 && completedSurveys === surveys.length) evaluation = "completed"
  else if (completedSurveys > 0) evaluation = "in-progress"

  const stages: Record<OnboardingStageKey, StageStatus> = {
    systems,
    induction,
    training,
    areas,
    followup,
    evaluation,
  }

  const totalStages = ONBOARDING_STAGES.length
  const completedStages = Object.values(stages).filter((s) => s === "completed").length

  return {
    stages,
    completedStages,
    totalStages,
    percentage: Math.round((completedStages / totalStages) * 100),
  }
}

export function stageStatusColors(status: StageStatus): { bar: string; badge: string; label: string } {
  switch (status) {
    case "completed":
      return { bar: "bg-green-500", badge: "border-green-500/30 bg-green-500/10 text-green-600", label: "Completado" }
    case "in-progress":
      return { bar: "bg-amber-500", badge: "border-amber-500/30 bg-amber-500/10 text-amber-600", label: "En progreso" }
    default:
      return { bar: "bg-muted-foreground/30", badge: "border-border bg-muted text-muted-foreground", label: "Pendiente" }
  }
}
