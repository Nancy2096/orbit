"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Clock, AlertCircle, Building2 } from "lucide-react"

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

export default function PublicEvaluationPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)

  const evalTypeNames: Record<string, string> = {
    psychometric: "Evaluación Psicométrica",
    personality: "Evaluación de Personalidad",
    technical: "Evaluación Técnica",
    medical: "Cuestionario Médico",
  }

  useEffect(() => {
    async function loadEvaluation() {
      try {
        const supabase = createClient()

        // Verify token and get evaluation data
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

        // Check if token is expired
        if (new Date(tokenData.expires_at) < new Date()) {
          setError("El enlace ha expirado. Por favor solicita uno nuevo.")
          setLoading(false)
          return
        }

        // Check if already used
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

        // Load questions for this evaluation type
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

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!evaluation) return

    setSubmitting(true)
    try {
      const supabase = createClient()

      // Save all responses
      const responses = Object.entries(answers).map(([questionId, value]) => ({
        candidate_evaluation_id: evaluation.id,
        question_id: questionId,
        answer_value: value,
      }))

      const { error: responsesError } = await supabase
        .from("evaluation_responses")
        .insert(responses)

      if (responsesError) {
        console.error("Error saving responses:", responsesError)
        alert("Error al guardar las respuestas. Por favor intenta de nuevo.")
        setSubmitting(false)
        return
      }

      // Calculate score
      const totalQuestions = questions.length
      let correctAnswers = 0
      
      // For psychometric and technical, check correct answers
      // For personality and medical, calculate average
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
        // For personality/medical, use average of values
        const totalValue = Object.values(answers).reduce((sum, val) => sum + val, 0)
        const maxPossible = evaluation.evaluation_type === "personality" ? totalQuestions * 5 : totalQuestions
        correctAnswers = Math.round((totalValue / maxPossible) * totalQuestions)
      }

      const score = Math.round((correctAnswers / totalQuestions) * 100)

      // Update evaluation status and score
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

      // Mark token as used
      await supabase
        .from("evaluation_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("token", token)

      setCompleted(true)
    } catch (err) {
      console.error("Error submitting evaluation:", err)
      alert("Error al enviar la evaluación. Por favor intenta de nuevo.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando evaluación...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Evaluación Completada</h2>
              <p className="text-muted-foreground mb-6">
                Gracias por completar la evaluación. Tus respuestas han sido registradas correctamente.
              </p>
              <p className="text-sm text-muted-foreground">
                Puedes cerrar esta ventana.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQ = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100
  const allAnswered = questions.every((q) => answers[q.id] !== undefined)

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">A4R Inmobiliaria</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {evalTypeNames[evaluation?.evaluation_type || ""] || "Evaluación"}
          </h1>
          <p className="text-muted-foreground">
            Candidato: {evaluation?.candidate.first_name} {evaluation?.candidate.last_name}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium">
              {currentQuestion + 1} de {questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pregunta {currentQuestion + 1}
            </CardDescription>
            <CardTitle className="text-lg">{currentQ?.question_text}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[currentQ?.id]?.toString() || ""}
              onValueChange={(value) => handleAnswer(currentQ?.id, parseInt(value))}
              className="space-y-3"
            >
              {currentQ?.options?.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    answers[currentQ?.id] === option.value
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <RadioGroupItem value={option.value.toString()} id={`option-${option.value}`} />
                  <Label htmlFor={`option-${option.value}`} className="flex-1 cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentQuestion === 0}
          >
            Anterior
          </Button>

          {currentQuestion < questions.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={answers[currentQ?.id] === undefined}
            >
              Siguiente
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
            >
              {submitting ? "Enviando..." : "Enviar Evaluación"}
            </Button>
          )}
        </div>

        {/* Question indicators */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestion(idx)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                idx === currentQuestion
                  ? "bg-primary text-primary-foreground"
                  : answers[q.id] !== undefined
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
