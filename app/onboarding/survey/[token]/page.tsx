"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { CheckCircle2, AlertCircle, ClipboardList } from "lucide-react"

interface SurveyQuestion {
  key: string
  label: string
}

interface SurveyData {
  id: string
  moment: string
  status: string
  scheduled_date: string
  completed_at: string | null
}

const SCALE = [
  { value: 1, label: "Muy malo" },
  { value: 2, label: "Malo" },
  { value: 3, label: "Regular" },
  { value: 4, label: "Bueno" },
  { value: 5, label: "Excelente" },
]

const MOMENT_LABEL: Record<string, string> = {
  week1: "Encuesta de Satisfacción — Semana 1",
  day30: "Encuesta de Satisfacción — Día 30",
}

export default function PublicOnboardingSurveyPage() {
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [survey, setSurvey] = useState<SurveyData | null>(null)
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [collaboratorName, setCollaboratorName] = useState<string | null>(null)
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [comment, setComment] = useState("")
  const [done, setDone] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/onboarding/survey/${token}`)
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "No se pudo cargar la encuesta")
          return
        }
        setSurvey(data.survey)
        setQuestions(data.questions || [])
        setCollaboratorName(data.collaboratorName || null)
        if (data.survey.status === "completed") setDone(true)
      } catch {
        setError("No se pudo cargar la encuesta")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const answeredCount = Object.keys(ratings).length
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0
  const allAnswered = questions.length > 0 && answeredCount === questions.length

  async function handleSubmit() {
    if (!allAnswered) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/onboarding/survey/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses: { ratings, comment } }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "No se pudo enviar la encuesta")
        return
      }
      setDone(true)
    } catch {
      setError("No se pudo enviar la encuesta")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="font-medium">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <CardTitle>¡Gracias por tu respuesta!</CardTitle>
            <CardDescription>
              Tus comentarios nos ayudan a mejorar la experiencia de integración de cada nuevo colaborador.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <ClipboardList className="h-5 w-5" />
              <span className="text-sm font-medium">Orbit · Onboarding</span>
            </div>
            <CardTitle className="text-balance">
              {MOMENT_LABEL[survey?.moment || ""] || "Encuesta de Satisfacción"}
            </CardTitle>
            <CardDescription>
              {collaboratorName ? `Hola ${collaboratorName}, ` : ""}
              cuéntanos cómo va tu integración. Tus respuestas son confidenciales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Progress value={progress} className="h-2" />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {answeredCount}/{questions.length}
              </span>
            </div>
          </CardContent>
        </Card>

        {questions.map((q, i) => (
          <Card key={q.key}>
            <CardHeader>
              <CardTitle className="text-base font-medium text-pretty">
                {i + 1}. {q.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={ratings[q.key]?.toString() || ""}
                onValueChange={(v) => setRatings((prev) => ({ ...prev, [q.key]: Number(v) }))}
                className="grid grid-cols-1 sm:grid-cols-5 gap-2"
              >
                {SCALE.map((s) => (
                  <Label
                    key={s.value}
                    htmlFor={`${q.key}-${s.value}`}
                    className="flex flex-col items-center gap-1 rounded-lg border p-3 cursor-pointer hover:bg-accent transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem id={`${q.key}-${s.value}`} value={s.value.toString()} className="sr-only" />
                    <span className="text-lg font-semibold">{s.value}</span>
                    <span className="text-xs text-muted-foreground text-center">{s.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Comentarios adicionales (opcional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comparte cualquier sugerencia o comentario sobre tu experiencia..."
              rows={4}
            />
          </CardContent>
        </Card>

        <Button className="w-full" size="lg" disabled={!allAnswered || submitting} onClick={handleSubmit}>
          {submitting ? <Spinner className="size-4 mr-2" /> : null}
          Enviar encuesta
        </Button>
      </div>
    </div>
  )
}
