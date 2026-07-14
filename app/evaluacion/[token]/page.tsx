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
  Brain,
  Sparkles,
  Timer,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Check,
  Keyboard,
  ListChecks,
} from "lucide-react"

interface Question {
  id: string
  question_text: string
  question_order: number
  question_type: string
  options: Array<{ value: number; label: string }>
}

interface EvaluationData {
  id: string
  evaluation_type: string
  status: string
  candidate: {
    first_name: string
    last_name: string
  }
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"]

export default function PublicEvaluationPage() {
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)

  // Fases y animación
  const [started, setStarted] = useState(false)
  const [direction, setDirection] = useState<"next" | "prev">("next")
  const [elapsed, setElapsed] = useState(0)

  const evalTypeNames: Record<string, string> = {
    psychometric: "Evaluación Psicométrica",
    personality: "Evaluación de Personalidad",
    technical: "Evaluación Técnica",
    medical: "Cuestionario Médico",
  }

  const evalTypeIntro: Record<string, string> = {
    psychometric:
      "Descubre cómo razonas y resuelves problemas. No hay presión: responde con lo primero que sientas correcto.",
    personality: "Cuéntanos cómo eres. No hay respuestas buenas o malas, solo tu forma auténtica de ser.",
    technical: "Pon a prueba tus conocimientos. Tómate tu tiempo para elegir la mejor respuesta.",
    medical: "Responde con sinceridad este breve cuestionario de salud. Tus datos son confidenciales.",
  }

  useEffect(() => {
    async function loadEvaluation() {
      try {
        const supabase = createClient()

        const { data: tokenData, error: tokenError } = await supabase
          .from("evaluation_tokens")
          .select(`
            *,
            candidate_evaluation:candidate_evaluations(
              id,
              evaluation_type,
              status,
              candidate:candidates(first_name, last_name)
            )
          `)
          .eq("token", token)
          .single()

        if (tokenError || !tokenData) {
          setError("El enlace no es válido o ha expirado.")
          setLoading(false)
          return
        }

        if (new Date(tokenData.expires_at) < new Date()) {
          setError("El enlace ha expirado. Por favor solicita uno nuevo.")
          setLoading(false)
          return
        }

        if (tokenData.used_at) {
          setError("Esta evaluación ya ha sido completada.")
          setLoading(false)
          return
        }

        const evalData = tokenData.candidate_evaluation
        if (!evalData || evalData.status === "completed") {
          setError("Esta evaluación ya ha sido completada.")
          setLoading(false)
          return
        }

        setEvaluation({
          id: evalData.id,
          evaluation_type: evalData.evaluation_type,
          status: evalData.status,
          candidate: evalData.candidate,
        })

        const { data: questionsData, error: questionsError } = await supabase
          .from("evaluation_questions")
          .select("*")
          .eq("evaluation_type", evalData.evaluation_type)
          .order("question_order", { ascending: true })

        if (questionsError) {
          setError("Error al cargar las preguntas.")
          setLoading(false)
          return
        }

        setQuestions(questionsData || [])
        setLoading(false)
      } catch (err) {
        console.error("Error loading evaluation:", err)
        setError("Error al cargar la evaluación.")
        setLoading(false)
      }
    }

    loadEvaluation()
  }, [token])

  // Cronómetro que corre durante la encuesta
  useEffect(() => {
    if (!started || completed) return
    const interval = setInterval(() => setElapsed((prev) => prev + 1), 1000)
    return () => clearInterval(interval)
  }, [started, completed])

  const handleNext = useCallback(() => {
    setDirection("next")
    setCurrentQuestion((prev) => (prev < questions.length - 1 ? prev + 1 : prev))
  }, [questions.length])

  const handlePrev = useCallback(() => {
    setDirection("prev")
    setCurrentQuestion((prev) => (prev > 0 ? prev - 1 : prev))
  }, [])

  const currentQ = questions[currentQuestion]

  const handleSelect = useCallback(
    (questionId: string, value: number) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }))
      // Auto-avance suave si no es la última pregunta
      if (currentQuestion < questions.length - 1) {
        setTimeout(() => {
          setDirection("next")
          setCurrentQuestion((prev) => (prev < questions.length - 1 ? prev + 1 : prev))
        }, 380)
      }
    },
    [currentQuestion, questions.length],
  )

  const handleSubmit = async () => {
    if (!evaluation) return

    setSubmitting(true)
    try {
      const supabase = createClient()

      const responses = Object.entries(answers).map(([questionId, value]) => ({
        candidate_evaluation_id: evaluation.id,
        question_id: questionId,
        answer_value: value,
      }))

      const { error: responsesError } = await supabase.from("evaluation_responses").insert(responses)

      if (responsesError) {
        console.error("Error saving responses:", responsesError)
        alert("Error al guardar las respuestas. Por favor intenta de nuevo.")
        setSubmitting(false)
        return
      }

      const totalQuestions = questions.length
      let correctAnswers = 0

      if (evaluation.evaluation_type === "psychometric") {
        const correctAnswerMap: Record<number, number> = { 1: 2, 2: 1, 3: 1, 4: 2, 5: 3 }
        questions.forEach((q, idx) => {
          if (answers[q.id] === correctAnswerMap[idx + 1]) correctAnswers++
        })
      } else if (evaluation.evaluation_type === "technical") {
        const correctAnswerMap: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 1, 5: 1 }
        questions.forEach((q, idx) => {
          if (answers[q.id] === correctAnswerMap[idx + 1]) correctAnswers++
        })
      } else {
        const totalValue = Object.values(answers).reduce((sum, val) => sum + val, 0)
        const maxPossible = evaluation.evaluation_type === "personality" ? totalQuestions * 5 : totalQuestions
        correctAnswers = Math.round((totalValue / maxPossible) * totalQuestions)
      }

      const score = Math.round((correctAnswers / totalQuestions) * 100)

      const { error: updateError } = await supabase
        .from("candidate_evaluations")
        .update({
          status: "completed",
          score: score,
          completed_at: new Date().toISOString(),
        })
        .eq("id", evaluation.id)

      if (updateError) {
        console.error("Error updating evaluation:", updateError)
      }

      await supabase.from("evaluation_tokens").update({ used_at: new Date().toISOString() }).eq("token", token)

      setCompleted(true)
    } catch (err) {
      console.error("Error submitting evaluation:", err)
      alert("Error al enviar la evaluación. Por favor intenta de nuevo.")
    } finally {
      setSubmitting(false)
    }
  }

  // Navegación por teclado durante las preguntas
  useEffect(() => {
    if (!started || completed || !currentQ) return
    const onKey = (e: KeyboardEvent) => {
      const opts = currentQ.options || []
      // Teclas numéricas 1-9 o letras A-F seleccionan opción
      const num = Number.parseInt(e.key, 10)
      if (!Number.isNaN(num) && num >= 1 && num <= opts.length) {
        handleSelect(currentQ.id, opts[num - 1].value)
        return
      }
      const letterIdx = OPTION_LETTERS.indexOf(e.key.toUpperCase())
      if (letterIdx >= 0 && letterIdx < opts.length) {
        handleSelect(currentQ.id, opts[letterIdx].value)
        return
      }
      if (e.key === "ArrowRight" || e.key === "Enter") handleNext()
      if (e.key === "ArrowLeft") handlePrev()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [started, completed, currentQ, handleSelect, handleNext, handlePrev])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const answeredCount = questions.filter((q) => answers[q.id] !== undefined).length

  const motivation = (() => {
    const pct = questions.length ? answeredCount / questions.length : 0
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
                Gracias por completar la evaluación. Tus respuestas se registraron correctamente.
              </p>
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="rounded-xl border bg-card px-5 py-3">
                  <div className="flex items-center justify-center gap-1.5 text-2xl font-bold tabular-nums">
                    <ListChecks className="h-5 w-5 text-primary" />
                    {questions.length}
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

  const evalType = evaluation?.evaluation_type || ""

  // ----- Pantalla de bienvenida -----
  if (!started) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
        <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Building2 className="h-7 w-7 text-primary" />
            <span className="text-lg font-bold">A4R Inmobiliaria</span>
          </div>
          <Card className="overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary to-accent" />
            <CardContent className="pt-8 pb-8 px-6 sm:px-8">
              <div className="flex flex-col items-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-medium text-accent mb-1">Hola, {evaluation?.candidate.first_name}</p>
                <h1 className="text-2xl font-bold mb-3 text-balance">
                  {evalTypeNames[evalType] || "Evaluación"}
                </h1>
                <p className="text-muted-foreground text-pretty mb-6 leading-relaxed">
                  {evalTypeIntro[evalType] || "Responde cada pregunta a tu ritmo. Puedes regresar a preguntas anteriores."}
                </p>

                <div className="grid grid-cols-3 gap-3 w-full mb-7">
                  <div className="rounded-xl border bg-card p-3">
                    <ListChecks className="h-5 w-5 text-primary mx-auto mb-1" />
                    <div className="text-lg font-bold tabular-nums">{questions.length}</div>
                    <div className="text-[11px] text-muted-foreground">Preguntas</div>
                  </div>
                  <div className="rounded-xl border bg-card p-3">
                    <Timer className="h-5 w-5 text-accent mx-auto mb-1" />
                    <div className="text-lg font-bold tabular-nums">~{Math.max(2, Math.ceil(questions.length * 0.5))}</div>
                    <div className="text-[11px] text-muted-foreground">Minutos</div>
                  </div>
                  <div className="rounded-xl border bg-card p-3">
                    <Sparkles className="h-5 w-5 text-primary mx-auto mb-1" />
                    <div className="text-lg font-bold">1×1</div>
                    <div className="text-[11px] text-muted-foreground">Una a la vez</div>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full gap-2 text-base"
                  onClick={() => setStarted(true)}
                  disabled={questions.length === 0}
                >
                  Comenzar
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Keyboard className="h-3.5 w-3.5" />
                  Tip: usa las teclas 1-{Math.min(questions.length ? questions[0].options?.length || 4 : 4, 9)} o A-D para responder rápido
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ----- Flujo de preguntas -----
  const progress = ((answeredCount) / questions.length) * 100
  const allAnswered = questions.every((q) => answers[q.id] !== undefined)
  const isLast = currentQuestion === questions.length - 1

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col">
      {/* Barra superior fija */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">A4R Inmobiliaria</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 tabular-nums">
                <Timer className="h-3.5 w-3.5" />
                {formatTime(elapsed)}
              </span>
              <span className="hidden sm:inline font-medium text-accent">{motivation}</span>
            </div>
          </div>
          {/* Progreso animado */}
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {answeredCount} de {questions.length} respondidas
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
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 items-center rounded-full bg-primary/10 px-3 text-sm font-semibold text-primary tabular-nums">
              {currentQuestion + 1}
              <span className="text-primary/50">/{questions.length}</span>
            </span>
            <span className="text-sm font-medium text-muted-foreground capitalize">
              {evalTypeNames[evalType]}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold leading-snug text-balance mb-6">
            {currentQ?.question_text}
          </h2>

          <div className="space-y-3">
            {currentQ?.options?.map((option, idx) => {
              const selected = answers[currentQ.id] === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(currentQ.id, option.value)}
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
                    {selected ? <Check className="h-5 w-5" /> : OPTION_LETTERS[idx]}
                  </span>
                  <span className="flex-1 font-medium">{option.label}</span>
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

            {/* Indicadores de pregunta */}
            <div className="hidden sm:flex items-center gap-1.5">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => {
                    setDirection(idx > currentQuestion ? "next" : "prev")
                    setCurrentQuestion(idx)
                  }}
                  aria-label={`Ir a la pregunta ${idx + 1}`}
                  className={`h-2.5 rounded-full transition-all ${
                    idx === currentQuestion
                      ? "w-6 bg-primary"
                      : answers[q.id] !== undefined
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
