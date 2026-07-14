"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  Users,
  Timer,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Check,
  Keyboard,
  ListChecks,
  Sparkles,
  Star,
} from "lucide-react"

// Evaluation templates (same as in evaluations page)
const evaluationTemplates = [
  {
    id: "360-complete",
    name: "Evaluación 360° Completa",
    type: "360",
    questions: [
      { text: "Demuestra conocimiento técnico en su área", category: "Competencias Técnicas" },
      { text: "Aplica las mejores prácticas en su trabajo", category: "Competencias Técnicas" },
      { text: "Se mantiene actualizado en su campo", category: "Competencias Técnicas" },
      { text: "Resuelve problemas técnicos de manera efectiva", category: "Competencias Técnicas" },
      { text: "Comunica ideas de manera clara y efectiva", category: "Comunicación" },
      { text: "Escucha activamente a los demás", category: "Comunicación" },
      { text: "Proporciona retroalimentación constructiva", category: "Comunicación" },
      { text: "Se expresa de manera profesional", category: "Comunicación" },
      { text: "Colabora efectivamente con el equipo", category: "Trabajo en Equipo" },
      { text: "Apoya a sus compañeros cuando lo necesitan", category: "Trabajo en Equipo" },
      { text: "Contribuye positivamente al ambiente laboral", category: "Trabajo en Equipo" },
      { text: "Comparte conocimientos con el equipo", category: "Trabajo en Equipo" },
      { text: "Toma decisiones acertadas", category: "Liderazgo" },
      { text: "Motiva e inspira a otros", category: "Liderazgo" },
      { text: "Delega tareas de manera efectiva", category: "Liderazgo" },
      { text: "Asume responsabilidad por sus acciones", category: "Liderazgo" },
      { text: "Cumple con los plazos establecidos", category: "Resultados" },
      { text: "Alcanza los objetivos propuestos", category: "Resultados" },
      { text: "Mantiene altos estándares de calidad", category: "Resultados" },
      { text: "Busca mejorar continuamente", category: "Resultados" },
    ],
    scale: [
      { value: 1, label: "Muy por debajo de lo esperado" },
      { value: 2, label: "Por debajo de lo esperado" },
      { value: 3, label: "Cumple lo esperado" },
      { value: 4, label: "Supera lo esperado" },
      { value: 5, label: "Excepcional" },
    ],
  },
  {
    id: "kpis-eval",
    name: "Evaluación de KPIs",
    type: "kpis",
    questions: [
      { text: "Cumplimiento de metas de ventas/producción", category: "Resultados" },
      { text: "Calidad del trabajo entregado", category: "Calidad" },
      { text: "Puntualidad en entregas", category: "Tiempo" },
      { text: "Eficiencia en el uso de recursos", category: "Eficiencia" },
      { text: "Satisfacción del cliente interno/externo", category: "Servicio" },
      { text: "Cumplimiento de procesos y procedimientos", category: "Cumplimiento" },
      { text: "Iniciativas de mejora implementadas", category: "Innovación" },
      { text: "Reducción de errores o retrabajos", category: "Calidad" },
      { text: "Colaboración con otros departamentos", category: "Colaboración" },
      { text: "Cumplimiento de presupuesto asignado", category: "Finanzas" },
    ],
    scale: [
      { value: 1, label: "0-20% cumplimiento" },
      { value: 2, label: "21-40% cumplimiento" },
      { value: 3, label: "41-60% cumplimiento" },
      { value: 4, label: "61-80% cumplimiento" },
      { value: 5, label: "81-100% cumplimiento" },
    ],
  },
  {
    id: "competencies-eval",
    name: "Evaluación de Competencias",
    type: "competencies",
    questions: [
      { text: "Orientación a resultados", category: "Core" },
      { text: "Trabajo en equipo", category: "Core" },
      { text: "Comunicación efectiva", category: "Core" },
      { text: "Adaptabilidad al cambio", category: "Core" },
      { text: "Pensamiento analítico", category: "Funcional" },
      { text: "Planificación y organización", category: "Funcional" },
      { text: "Toma de decisiones", category: "Funcional" },
      { text: "Gestión del tiempo", category: "Funcional" },
      { text: "Liderazgo", category: "Gerencial" },
      { text: "Desarrollo de personas", category: "Gerencial" },
      { text: "Visión estratégica", category: "Gerencial" },
      { text: "Negociación", category: "Gerencial" },
    ],
    scale: [
      { value: 1, label: "No desarrollada" },
      { value: 2, label: "En desarrollo" },
      { value: 3, label: "Competente" },
      { value: 4, label: "Avanzado" },
      { value: 5, label: "Experto" },
    ],
  },
  {
    id: "potential-eval",
    name: "Evaluación de Potencial",
    type: "potential",
    questions: [
      { text: "Capacidad de aprendizaje rápido", category: "Aprendizaje" },
      { text: "Curiosidad intelectual", category: "Aprendizaje" },
      { text: "Ambición profesional saludable", category: "Motivación" },
      { text: "Compromiso con la organización", category: "Motivación" },
      { text: "Capacidad para asumir mayores responsabilidades", category: "Crecimiento" },
      { text: "Habilidad para manejar complejidad", category: "Crecimiento" },
      { text: "Resiliencia ante la adversidad", category: "Carácter" },
      { text: "Integridad y ética profesional", category: "Carácter" },
      { text: "Influencia positiva en otros", category: "Impacto" },
      { text: "Visión de futuro", category: "Impacto" },
    ],
    scale: [
      { value: 1, label: "Bajo potencial" },
      { value: 2, label: "Potencial limitado" },
      { value: 3, label: "Potencial moderado" },
      { value: 4, label: "Alto potencial" },
      { value: 5, label: "Potencial excepcional" },
    ],
  },
]

interface AssignmentData {
  id: string
  evaluator_type: string
  evaluator_name: string | null
  status: string
  staff_evaluation_id: string
  staff_evaluations: {
    id: string
    evaluation_type: string
    template_id: string | null
    staff: {
      id: string
      first_name: string
      last_name: string
      position: string | null
      agency_rel: { name: string } | null
      department_rel: { name: string } | null
    }
  }
}

const evaluatorTypeLabels: Record<string, string> = {
  self: "Autoevaluación",
  supervisor: "Evaluación de Supervisor",
  peer: "Evaluación de Par",
  subordinate: "Evaluación de Subordinado",
}

const evaluatorTypeIntro: Record<string, string> = {
  self: "Reflexiona sobre tu propio desempeño. Sé honesto contigo mismo: esto impulsa tu crecimiento.",
  supervisor: "Tu perspectiva como líder es clave. Evalúa el desempeño observado con objetividad.",
  peer: "Tu opinión como compañero aporta una mirada valiosa. Responde según tu experiencia trabajando en equipo.",
  subordinate: "Tu retroalimentación ayuda a mejorar el liderazgo. Tus respuestas son confidenciales.",
}

export default function StaffEvaluationPage() {
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assignment, setAssignment] = useState<AssignmentData | null>(null)
  const [template, setTemplate] = useState<(typeof evaluationTemplates)[0] | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)

  // Fases y animación
  const [started, setStarted] = useState(false)
  const [direction, setDirection] = useState<"next" | "prev">("next")
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    async function loadEvaluation() {
      try {
        const supabase = createClient()

        const { data: tokenData, error: tokenError } = await supabase
          .from("staff_evaluation_tokens")
          .select(`
            *,
            assignment:staff_evaluation_assignments(
              id,
              evaluator_type,
              evaluator_name,
              status,
              staff_evaluation_id,
              staff_evaluations(
                id,
                evaluation_type,
                template_id,
                staff(
                  id,
                  first_name,
                  last_name,
                  position,
                  agency_rel:agencies(name),
                  department_rel:departments(name)
                )
              )
            )
          `)
          .eq("token", token)
          .single()

        if (tokenError || !tokenData) {
          setError("Enlace no válido o expirado")
          setLoading(false)
          return
        }

        if (new Date(tokenData.expires_at) < new Date()) {
          setError("Este enlace ha expirado")
          setLoading(false)
          return
        }

        if (tokenData.used_at) {
          setError("Esta evaluación ya fue completada")
          setLoading(false)
          return
        }

        const assignmentData = tokenData.assignment as AssignmentData
        setAssignment(assignmentData)

        // Find template
        const evalType = assignmentData.staff_evaluations.evaluation_type
        const templateId = assignmentData.staff_evaluations.template_id

        // Map system template IDs to local templates
        const templateIdMap: Record<string, string> = {
          "tpl-4": "360-complete", // Evaluación 360° Completa
          "tpl-5": "360-complete", // Clima Laboral -> use 360
          "tpl-6": "competencies-eval", // Evaluación por Competencias
        }

        const mappedTemplateId = templateId ? templateIdMap[templateId] || templateId : null

        let foundTemplate = evaluationTemplates.find((t) => t.id === mappedTemplateId)
        if (!foundTemplate) {
          const typeMap: Record<string, string> = {
            "360": "360-complete",
            kpis: "kpis-eval",
            competencies: "competencies-eval",
            potential: "potential-eval",
          }
          foundTemplate = evaluationTemplates.find((t) => t.id === typeMap[evalType])
        }
        if (!foundTemplate) {
          foundTemplate = evaluationTemplates.find((t) => t.type === evalType)
        }

        if (!foundTemplate) {
          setError("Plantilla de evaluación no encontrada")
          setLoading(false)
          return
        }

        setTemplate(foundTemplate)

        // Mark as in progress if pending
        if (assignmentData.status === "pending") {
          await supabase
            .from("staff_evaluation_assignments")
            .update({ status: "in_progress", started_at: new Date().toISOString() })
            .eq("id", assignmentData.id)
        }

        setLoading(false)
      } catch (err) {
        console.error("Error loading evaluation:", err)
        setError("Error al cargar la evaluación")
        setLoading(false)
      }
    }

    loadEvaluation()
  }, [token])

  // Cronómetro
  useEffect(() => {
    if (!started || completed) return
    const interval = setInterval(() => setElapsed((prev) => prev + 1), 1000)
    return () => clearInterval(interval)
  }, [started, completed])

  const questionsLen = template?.questions.length ?? 0

  const handleNext = useCallback(() => {
    setDirection("next")
    setCurrentQuestion((prev) => (prev < questionsLen - 1 ? prev + 1 : prev))
  }, [questionsLen])

  const handlePrev = useCallback(() => {
    setDirection("prev")
    setCurrentQuestion((prev) => (prev > 0 ? prev - 1 : prev))
  }, [])

  const handleSelect = useCallback(
    (index: number, value: number) => {
      setAnswers((prev) => ({ ...prev, [index]: value }))
      if (index < questionsLen - 1) {
        setTimeout(() => {
          setDirection("next")
          setCurrentQuestion((prev) => (prev < questionsLen - 1 ? prev + 1 : prev))
        }, 380)
      }
    },
    [questionsLen],
  )

  const handleSubmit = async () => {
    if (!assignment || !template) return

    if (Object.keys(answers).length < template.questions.length) {
      alert("Por favor responde todas las preguntas antes de enviar")
      return
    }

    setSubmitting(true)

    try {
      const supabase = createClient()

      const responses = Object.entries(answers).map(([questionIndex, value]) => ({
        assignment_id: assignment.id,
        question_index: parseInt(questionIndex),
        answer_value: value,
      }))

      const { error: responsesError } = await supabase.from("staff_evaluation_responses").insert(responses)

      if (responsesError) {
        console.error("Error saving responses:", responsesError)
        alert("Error al guardar las respuestas")
        setSubmitting(false)
        return
      }

      const totalValue = Object.values(answers).reduce((sum, val) => sum + val, 0)
      const maxPossible = template.questions.length * 5
      const score = Math.round((totalValue / maxPossible) * 100)

      const { error: assignmentError } = await supabase
        .from("staff_evaluation_assignments")
        .update({
          status: "completed",
          score: score,
          completed_at: new Date().toISOString(),
        })
        .eq("id", assignment.id)

      if (assignmentError) {
        console.error("Error updating assignment:", assignmentError)
      }

      await supabase
        .from("staff_evaluation_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("token", token)

      const { data: allAssignments } = await supabase
        .from("staff_evaluation_assignments")
        .select("status, score")
        .eq("staff_evaluation_id", assignment.staff_evaluation_id)

      if (allAssignments && allAssignments.every((a) => a.status === "completed")) {
        const avgScore = Math.round(
          allAssignments.reduce((sum, a) => sum + (a.score || 0), 0) / allAssignments.length,
        )

        await supabase
          .from("staff_evaluations")
          .update({
            status: "completed",
            score: avgScore,
            completed_at: new Date().toISOString(),
          })
          .eq("id", assignment.staff_evaluation_id)
      }

      setCompleted(true)
    } catch (err) {
      console.error("Error submitting evaluation:", err)
      alert("Error al enviar la evaluación")
    } finally {
      setSubmitting(false)
    }
  }

  const currentQ = template?.questions[currentQuestion]

  // Navegación por teclado
  useEffect(() => {
    if (!started || completed || !template || !currentQ) return
    const onKey = (e: KeyboardEvent) => {
      const num = Number.parseInt(e.key, 10)
      if (!Number.isNaN(num) && num >= 1 && num <= template.scale.length) {
        handleSelect(currentQuestion, template.scale[num - 1].value)
        return
      }
      if (e.key === "ArrowRight" || e.key === "Enter") handleNext()
      if (e.key === "ArrowLeft") handlePrev()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [started, completed, template, currentQ, currentQuestion, handleSelect, handleNext, handlePrev])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const answeredCount = Object.keys(answers).length

  const motivation = (() => {
    const pct = questionsLen ? answeredCount / questionsLen : 0
    if (pct === 0) return "¡Comencemos!"
    if (pct < 0.34) return "Vas muy bien, sigue así"
    if (pct < 0.67) return "¡A mitad de camino!"
    if (pct < 1) return "Casi terminas, ánimo"
    return "¡Todo listo para enviar!"
  })()

  // ----- Estados de carga / error -----
  if (loading) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando evaluación...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">No se puede acceder</h2>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
        <Card className="max-w-md w-full overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary to-accent" />
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-accent/15 animate-ping" />
                <span className="absolute inset-2 rounded-full bg-accent/10" />
                <CheckCircle2 className="relative h-16 w-16 text-accent animate-in zoom-in duration-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                ¡Evaluación Completada!
              </h2>
              <p className="text-muted-foreground mb-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
                Gracias por tu retroalimentación. Tus respuestas se registraron correctamente y son muy valiosas.
              </p>
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="rounded-xl border bg-card px-5 py-3">
                  <div className="flex items-center justify-center gap-1.5 text-2xl font-bold tabular-nums">
                    <ListChecks className="h-5 w-5 text-primary" />
                    {questionsLen}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Respuestas</p>
                </div>
                <div className="rounded-xl border bg-card px-5 py-3">
                  <div className="flex items-center justify-center gap-1.5 text-2xl font-bold tabular-nums">
                    <Timer className="h-5 w-5 text-accent" />
                    {formatTime(elapsed)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Tiempo</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Puedes cerrar esta ventana.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!assignment || !template) return null

  const staff = assignment.staff_evaluations.staff
  const evaluatorLabel = evaluatorTypeLabels[assignment.evaluator_type] || "Evaluación"

  // ----- Pantalla de bienvenida -----
  if (!started) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
        <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-base font-bold">{staff.agency_rel?.name || "A4R Inmobiliaria"}</span>
          </div>
          <Card className="overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary to-accent" />
            <CardContent className="pt-8 pb-8 px-6 sm:px-8">
              <div className="flex flex-col items-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  <Star className="h-3.5 w-3.5" />
                  {evaluatorLabel}
                </span>
                <h1 className="text-2xl font-bold mb-2 text-balance">{template.name}</h1>

                {/* Persona evaluada */}
                <div className="mb-4 flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {staff.first_name?.[0]}
                    {staff.last_name?.[0]}
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Evaluando a</p>
                    <p className="font-semibold leading-tight">
                      {staff.first_name} {staff.last_name}
                    </p>
                    {staff.position && <p className="text-xs text-muted-foreground">{staff.position}</p>}
                  </div>
                </div>

                <p className="text-muted-foreground text-pretty mb-6 leading-relaxed">
                  {evaluatorTypeIntro[assignment.evaluator_type] ||
                    "Responde cada afirmación según tu experiencia. Puedes regresar a preguntas anteriores."}
                </p>

                <div className="grid grid-cols-3 gap-3 w-full mb-7">
                  <div className="rounded-xl border bg-card p-3">
                    <ListChecks className="h-5 w-5 text-primary mx-auto mb-1" />
                    <div className="text-lg font-bold tabular-nums">{questionsLen}</div>
                    <div className="text-[11px] text-muted-foreground">Preguntas</div>
                  </div>
                  <div className="rounded-xl border bg-card p-3">
                    <Timer className="h-5 w-5 text-accent mx-auto mb-1" />
                    <div className="text-lg font-bold tabular-nums">~{Math.max(2, Math.ceil(questionsLen * 0.4))}</div>
                    <div className="text-[11px] text-muted-foreground">Minutos</div>
                  </div>
                  <div className="rounded-xl border bg-card p-3">
                    <Sparkles className="h-5 w-5 text-primary mx-auto mb-1" />
                    <div className="text-lg font-bold">1×1</div>
                    <div className="text-[11px] text-muted-foreground">Una a la vez</div>
                  </div>
                </div>

                <Button size="lg" className="w-full gap-2 text-base" onClick={() => setStarted(true)}>
                  Comenzar
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Keyboard className="h-3.5 w-3.5" />
                  Tip: usa las teclas 1-{template.scale.length} para calificar rápido
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ----- Flujo de preguntas -----
  const progress = (answeredCount / questionsLen) * 100
  const allAnswered = Object.keys(answers).length >= questionsLen
  const isLast = currentQuestion === questionsLen - 1

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col">
      {/* Barra superior fija */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <User className="h-5 w-5 shrink-0 text-primary" />
              <span className="truncate text-sm font-semibold">
                {staff.first_name} {staff.last_name}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 tabular-nums">
                <Timer className="h-3.5 w-3.5" />
                {formatTime(elapsed)}
              </span>
              <span className="hidden sm:inline font-medium text-accent">{motivation}</span>
            </div>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {answeredCount} de {questionsLen} respondidas
            </span>
            <span className="tabular-nums">{Math.round(progress)}%</span>
          </div>
        </div>
      </header>

      {/* Contenido de la pregunta */}
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
        <div
          key={currentQuestion}
          className={`animate-in fade-in duration-300 ${
            direction === "next" ? "slide-in-from-right-8" : "slide-in-from-left-8"
          }`}
        >
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="flex h-8 items-center rounded-full bg-primary/10 px-3 text-sm font-semibold text-primary tabular-nums">
              {currentQuestion + 1}
              <span className="text-primary/50">/{questionsLen}</span>
            </span>
            {currentQ?.category && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                <Sparkles className="h-3 w-3" />
                {currentQ.category}
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold leading-snug text-balance mb-6">{currentQ?.text}</h2>

          <div className="space-y-2.5">
            {template.scale.map((option) => {
              const selected = answers[currentQuestion] === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(currentQuestion, option.value)}
                  className={`group flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                    selected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    }`}
                  >
                    {selected ? <Check className="h-5 w-5" /> : option.value}
                  </span>
                  <span className="flex-1 font-medium">{option.label}</span>
                  {/* Indicador de escala con estrellas */}
                  <span className="hidden shrink-0 items-center gap-0.5 sm:flex">
                    {Array.from({ length: template.scale.length }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < option.value
                            ? selected
                              ? "fill-primary text-primary"
                              : "fill-muted-foreground/30 text-muted-foreground/30 group-hover:fill-primary/40 group-hover:text-primary/40"
                            : "text-transparent"
                        }`}
                      />
                    ))}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </main>

      {/* Navegación inferior fija */}
      <footer className="sticky bottom-0 border-t bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={handlePrev} disabled={currentQuestion === 0} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </Button>

            <div className="hidden sm:flex items-center gap-1.5">
              {template.questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDirection(idx > currentQuestion ? "next" : "prev")
                    setCurrentQuestion(idx)
                  }}
                  aria-label={`Ir a la pregunta ${idx + 1}`}
                  className={`h-2.5 rounded-full transition-all ${
                    idx === currentQuestion
                      ? "w-6 bg-primary"
                      : answers[idx] !== undefined
                        ? "w-2.5 bg-accent"
                        : "w-2.5 bg-muted-foreground/25 hover:bg-muted-foreground/40"
                  }`}
                />
              ))}
            </div>

            {isLast ? (
              <Button
                onClick={handleSubmit}
                disabled={!allAnswered || submitting}
                className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {submitting ? (
                  "Enviando..."
                ) : (
                  <>
                    <Trophy className="h-4 w-4" />
                    Enviar
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleNext} className="gap-1.5">
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
