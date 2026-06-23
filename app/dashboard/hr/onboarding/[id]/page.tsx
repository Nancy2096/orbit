"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { StaffAvatar } from "@/components/staff-avatar"
import { ProfileCompletionDetail } from "@/components/hr/profile-completion"
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  Download,
  ClipboardCheck,
  Copy,
  Send,
  CalendarDays,
} from "lucide-react"
import {
  ONBOARDING_STAGES,
  SURVEY_MOMENTS,
  SURVEY_QUESTIONS,
  computeProcessProgress,
  stageStatusColors,
  DEFAULT_PASS_THRESHOLD,
  type OnboardingStageKey,
} from "@/lib/onboarding"

interface TaskRow {
  id: string
  stage: string
  task_key: string
  title: string
  scheduled_date: string | null
  completed: boolean
}
interface AttemptRow {
  id: string
  stage: string
  score: number
  total: number
  correct: number
  passed: boolean
  created_at: string
}
interface SurveyRow {
  id: string
  moment: string
  token: string
  scheduled_date: string
  status: string
  sent_at: string | null
  completed_at: string | null
  responses: Record<string, unknown> | null
}
interface MaterialRow {
  id: string
  agency_id: string | null
  stage: string
  title: string
  file_url: string
  file_name: string
}
interface QuestionRow {
  id: string
  agency_id: string | null
  stage: string
  question: string
  options: string[]
  correct_index: number
}

export default function OnboardingDetailPage() {
  const supabase = createClient()
  const params = useParams()
  const router = useRouter()
  const processId = params.id as string

  const [loading, setLoading] = useState(true)
  const [process, setProcess] = useState<any>(null)
  const [staff, setStaff] = useState<any>(null)
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [attempts, setAttempts] = useState<AttemptRow[]>([])
  const [surveys, setSurveys] = useState<SurveyRow[]>([])
  const [materials, setMaterials] = useState<MaterialRow[]>([])
  const [questions, setQuestions] = useState<QuestionRow[]>([])
  const [induThreshold, setInduThreshold] = useState(DEFAULT_PASS_THRESHOLD)
  const [trainThreshold, setTrainThreshold] = useState(DEFAULT_PASS_THRESHOLD)

  // Test dialog state
  const [testStage, setTestStage] = useState<"induction" | "training" | null>(null)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: proc } = await supabase
      .from("onboarding_processes")
      .select("*, staff:staff_id(*), agency:agency_id(name)")
      .eq("id", processId)
      .single()

    if (!proc) {
      setLoading(false)
      return
    }
    setProcess(proc)
    setStaff(proc.staff)

    const agencyId = proc.agency_id

    const [{ data: t }, { data: a }, { data: s }, { data: m }, { data: q }, { data: cfg }] = await Promise.all([
      supabase.from("onboarding_tasks").select("*").eq("process_id", processId).order("sort_order"),
      supabase.from("onboarding_test_attempts").select("*").eq("process_id", processId).order("created_at", { ascending: false }),
      supabase.from("onboarding_surveys").select("*").eq("process_id", processId),
      supabase.from("onboarding_materials").select("*").in("stage", ["induction", "training"]),
      supabase.from("onboarding_questions").select("*").in("stage", ["induction", "training"]),
      agencyId ? supabase.from("onboarding_config").select("*").eq("agency_id", agencyId).maybeSingle() : Promise.resolve({ data: null }),
    ])

    setTasks((t || []) as TaskRow[])
    setAttempts((a || []) as AttemptRow[])
    setSurveys((s || []) as SurveyRow[])
    // Materiales/preguntas de la agencia del colaborador o globales (sin agencia).
    setMaterials(((m || []) as MaterialRow[]).filter((x) => x.agency_id === agencyId || x.agency_id === null))
    setQuestions(((q || []) as QuestionRow[]).filter((x) => x.agency_id === agencyId || x.agency_id === null))
    if (cfg && (cfg as any).data !== null) {
      const c = (cfg as any).data || cfg
      if (c?.induction_pass_threshold) setInduThreshold(c.induction_pass_threshold)
      if (c?.training_pass_threshold) setTrainThreshold(c.training_pass_threshold)
    }
    setLoading(false)
  }, [processId, supabase])

  useEffect(() => {
    load()
  }, [load])

  const progress = computeProcessProgress({ tasks, attempts, surveys })

  async function toggleTask(task: TaskRow, completed: boolean) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed } : t)))
    const { error } = await supabase
      .from("onboarding_tasks")
      .update({ completed, completed_at: completed ? new Date().toISOString() : null })
      .eq("id", task.id)
    if (error) {
      toast.error("No se pudo actualizar la tarea")
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: !completed } : t)))
    }
  }

  async function updateTaskDate(task: TaskRow, date: string) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, scheduled_date: date } : t)))
    await supabase.from("onboarding_tasks").update({ scheduled_date: date || null }).eq("id", task.id)
  }

  function openTest(stage: "induction" | "training") {
    setAnswers({})
    setTestStage(stage)
  }

  async function submitTest() {
    if (!testStage) return
    const stageQuestions = questions.filter((q) => q.stage === testStage)
    if (stageQuestions.length === 0) return
    setSubmitting(true)

    let correct = 0
    stageQuestions.forEach((q) => {
      if (answers[q.id] === q.correct_index) correct++
    })
    const total = stageQuestions.length
    const score = Math.round((correct / total) * 100)
    const threshold = testStage === "induction" ? induThreshold : trainThreshold
    const passed = score >= threshold

    const { error } = await supabase.from("onboarding_test_attempts").insert({
      process_id: processId,
      stage: testStage,
      score,
      total,
      correct,
      passed,
      answers,
    })
    setSubmitting(false)
    if (error) {
      toast.error("No se pudo registrar el test")
      return
    }
    if (passed) toast.success(`Test aprobado con ${score}%`)
    else toast.error(`Test no aprobado (${score}%). Mínimo: ${threshold}%`)
    setTestStage(null)
    await load()
  }

  function copySurveyLink(survey: SurveyRow) {
    const url = `${window.location.origin}/onboarding/survey/${survey.token}`
    navigator.clipboard.writeText(url)
    toast.success("Link de encuesta copiado")
  }

  async function markSurveySent(survey: SurveyRow) {
    await supabase.from("onboarding_surveys").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", survey.id)
    toast.success("Encuesta marcada como enviada")
    await load()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!process) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/hr/onboarding">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Link>
        </Button>
        <p className="text-muted-foreground">Proceso de onboarding no encontrado.</p>
      </div>
    )
  }

  const startDate = new Date(process.start_date)
  const today = new Date()
  const dayCount = Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / 86400000))

  const lastAttempt = (stage: string) => attempts.find((a) => a.stage === stage)

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/hr/onboarding">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Onboarding
        </Link>
      </Button>

      {/* Encabezado */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <StaffAvatar
                firstName={staff?.first_name || ""}
                lastName={staff?.last_name || ""}
                photoUrl={staff?.photo_url}
                className="h-16 w-16"
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {staff?.first_name} {staff?.last_name}
                </h1>
                <p className="text-muted-foreground">
                  {staff?.position || "Sin puesto"}
                  {process.agency?.name ? ` · ${process.agency.name}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    <CalendarDays className="mr-1 h-3 w-3" />
                    Ingreso: {startDate.toLocaleDateString("es-MX")}
                  </Badge>
                  <Badge variant="secondary">Día {dayCount} de 90</Badge>
                </div>
              </div>
            </div>
            <div className="w-full md:w-72 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Avance general</span>
                <span className="font-bold">{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {progress.completedStages} de {progress.totalStages} etapas completadas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Etapas */}
      <Accordion type="multiple" defaultValue={["systems"]} className="space-y-3">
        {ONBOARDING_STAGES.map((stage) => {
          const status = progress.stages[stage.key as OnboardingStageKey]
          const colors = stageStatusColors(status)
          return (
            <AccordionItem key={stage.key} value={stage.key} className="rounded-lg border bg-card px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-1 items-center gap-3 pr-3 text-left">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      status === "completed"
                        ? "bg-green-500 text-white"
                        : status === "in-progress"
                          ? "bg-amber-500 text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {status === "completed" ? <CheckCircle2 className="h-5 w-5" /> : stage.order}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{stage.title}</p>
                    <p className="text-sm text-muted-foreground font-normal">{stage.description}</p>
                  </div>
                  <Badge variant="outline" className={colors.badge}>
                    {colors.label}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                {stage.key === "systems" && (
                  <SystemsStage
                    tasks={tasks.filter((t) => t.stage === "systems")}
                    staff={staff}
                    onToggle={toggleTask}
                  />
                )}
                {(stage.key === "induction" || stage.key === "training") && (
                  <TestStage
                    stageKey={stage.key}
                    materials={materials.filter((m) => m.stage === stage.key)}
                    questions={questions.filter((q) => q.stage === stage.key)}
                    attempt={lastAttempt(stage.key)}
                    threshold={stage.key === "induction" ? induThreshold : trainThreshold}
                    onStartTest={() => openTest(stage.key as "induction" | "training")}
                  />
                )}
                {(stage.key === "areas" || stage.key === "followup") && (
                  <CalendarStage
                    tasks={tasks.filter((t) => t.stage === stage.key)}
                    onToggle={toggleTask}
                    onDateChange={updateTaskDate}
                  />
                )}
                {stage.key === "evaluation" && (
                  <EvaluationStage
                    surveys={surveys}
                    onCopy={copySurveyLink}
                    onMarkSent={markSurveySent}
                  />
                )}
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      {/* Test dialog */}
      <Dialog open={testStage !== null} onOpenChange={(o) => !o && setTestStage(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Test de {testStage === "induction" ? "Inducción institucional" : "Formación de procesos"}
            </DialogTitle>
            <DialogDescription>
              Responde todas las preguntas. Se requiere {testStage === "induction" ? induThreshold : trainThreshold}% para
              aprobar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {testStage &&
              questions
                .filter((q) => q.stage === testStage)
                .map((q, idx) => (
                  <div key={q.id} className="space-y-2">
                    <p className="text-sm font-medium">
                      {idx + 1}. {q.question}
                    </p>
                    <RadioGroup
                      value={answers[q.id]?.toString() ?? ""}
                      onValueChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: parseInt(v) }))}
                    >
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <RadioGroupItem value={oi.toString()} id={`${q.id}-${oi}`} />
                          <Label htmlFor={`${q.id}-${oi}`} className="font-normal">
                            {opt}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestStage(null)}>
              Cancelar
            </Button>
            <Button
              onClick={submitTest}
              disabled={
                submitting ||
                !testStage ||
                questions.filter((q) => q.stage === testStage).some((q) => answers[q.id] === undefined)
              }
            >
              {submitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Enviar test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------- Etapa 1: Alta en sistemas ----------
function SystemsStage({
  tasks,
  staff,
  onToggle,
}: {
  tasks: TaskRow[]
  staff: any
  onToggle: (t: TaskRow, c: boolean) => void
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        {tasks.map((task) => {
          const link =
            task.task_key === "alta_orbit"
              ? "/dashboard/hr/staff/new"
              : staff?.id
                ? `/dashboard/hr/staff/${staff.id}`
                : null
          const linkLabel = task.task_key === "alta_orbit" ? "Dar de alta" : "Asignar"
          return (
            <div key={task.id} className="flex items-center gap-3 rounded-lg border p-3">
              <Checkbox
                checked={task.completed}
                onCheckedChange={(c) => onToggle(task, c === true)}
                aria-label={task.title}
              />
              <span className={`flex-1 text-sm ${task.completed ? "text-muted-foreground line-through" : ""}`}>
                {task.title}
              </span>
              {link && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={link}>
                    {linkLabel} <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>
          )
        })}
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Avance del perfil</CardTitle>
          <CardDescription>Información capturada del colaborador</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileCompletionDetail staff={staff} />
        </CardContent>
      </Card>
    </div>
  )
}

// ---------- Etapas 2 y 3: Presentaciones + Test ----------
function TestStage({
  stageKey,
  materials,
  questions,
  attempt,
  threshold,
  onStartTest,
}: {
  stageKey: string
  materials: MaterialRow[]
  questions: QuestionRow[]
  attempt: AttemptRow | undefined
  threshold: number
  onStartTest: () => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium">Presentaciones</p>
        {materials.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay presentaciones cargadas.{" "}
            <Link href="/dashboard/hr/onboarding/settings" className="text-primary underline">
              Súbelas en Configuración
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-2">
            {materials.map((m) => (
              <a
                key={m.id}
                href={m.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <FileText className="h-5 w-5 text-primary" />
                <span className="flex-1 text-sm">{m.title}</span>
                <Download className="h-4 w-4 text-muted-foreground" />
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Test de comprensión</p>
            <p className="text-sm text-muted-foreground">
              {questions.length} pregunta{questions.length === 1 ? "" : "s"} · aprobación mínima {threshold}%
            </p>
          </div>
          {attempt?.passed ? (
            <Badge className="border-green-500/30 bg-green-500/10 text-green-600">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Aprobado {attempt.score}%
            </Badge>
          ) : attempt ? (
            <Badge variant="destructive">No aprobado {attempt.score}%</Badge>
          ) : (
            <Badge variant="secondary">Pendiente</Badge>
          )}
        </div>
        <div className="mt-3">
          <Button size="sm" onClick={onStartTest} disabled={questions.length === 0}>
            <ClipboardCheck className="mr-2 h-4 w-4" />
            {attempt ? "Reintentar test" : "Realizar test"}
          </Button>
          {questions.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Agrega preguntas en{" "}
              <Link href="/dashboard/hr/onboarding/settings" className="text-primary underline">
                Configuración
              </Link>{" "}
              para habilitar el test.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------- Etapas 4 y 5: Calendario / checkmarks ----------
function CalendarStage({
  tasks,
  onToggle,
  onDateChange,
}: {
  tasks: TaskRow[]
  onToggle: (t: TaskRow, c: boolean) => void
  onDateChange: (t: TaskRow, date: string) => void
}) {
  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div key={task.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center">
          <Checkbox
            checked={task.completed}
            onCheckedChange={(c) => onToggle(task, c === true)}
            aria-label={task.title}
          />
          <span className={`flex-1 text-sm ${task.completed ? "text-muted-foreground line-through" : ""}`}>
            {task.title}
          </span>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={task.scheduled_date || ""}
              onChange={(e) => onDateChange(task, e.target.value)}
              className="h-8 w-auto"
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------- Etapa 6: Encuestas de satisfacción ----------
function EvaluationStage({
  surveys,
  onCopy,
  onMarkSent,
}: {
  surveys: SurveyRow[]
  onCopy: (s: SurveyRow) => void
  onMarkSent: (s: SurveyRow) => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  return (
    <div className="space-y-3">
      {SURVEY_MOMENTS.map((moment) => {
        const survey = surveys.find((s) => s.moment === moment.moment)
        if (!survey) return null
        const isActive = today >= survey.scheduled_date
        const completed = survey.status === "completed"
        return (
          <div key={moment.moment} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{moment.title}</p>
                <p className="text-sm text-muted-foreground">{moment.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Programada: {new Date(survey.scheduled_date).toLocaleDateString("es-MX")}
                </p>
              </div>
              {completed ? (
                <Badge className="border-green-500/30 bg-green-500/10 text-green-600">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Completada
                </Badge>
              ) : isActive ? (
                <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-600">Activa</Badge>
              ) : (
                <Badge variant="secondary">Programada</Badge>
              )}
            </div>

            {!completed && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => onCopy(survey)}>
                  <Copy className="mr-2 h-4 w-4" /> Copiar link
                </Button>
                <Button size="sm" variant="outline" onClick={() => onMarkSent(survey)}>
                  <Send className="mr-2 h-4 w-4" /> Marcar enviada
                </Button>
                {survey.status === "sent" && <span className="text-xs text-muted-foreground">Enviada</span>}
              </div>
            )}

            {completed && survey.responses && (
              <div className="mt-3 space-y-1.5 border-t pt-3">
                {SURVEY_QUESTIONS.map((q) => {
                  const val = (survey.responses as Record<string, unknown>)?.[q.key]
                  if (val === undefined || val === null || val === "") return null
                  return (
                    <div key={q.key} className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{q.label}</span>
                      <span className="font-medium">{String(val)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
