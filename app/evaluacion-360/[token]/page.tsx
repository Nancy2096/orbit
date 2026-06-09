"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, AlertCircle, Clock, Building2, User } from "lucide-react"

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

export default function StaffEvaluationPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assignment, setAssignment] = useState<AssignmentData | null>(null)
  const [template, setTemplate] = useState<typeof evaluationTemplates[0] | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [comments, setComments] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    async function loadEvaluation() {
      try {
        const supabase = createClient()

        // Verify token
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

        // Check expiration
        if (new Date(tokenData.expires_at) < new Date()) {
          setError("Este enlace ha expirado")
          setLoading(false)
          return
        }

        // Check if already used
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
        
        let foundTemplate = evaluationTemplates.find(t => t.id === mappedTemplateId)
        if (!foundTemplate) {
          // Fallback by evaluation type
          const typeMap: Record<string, string> = {
            "360": "360-complete",
            "kpis": "kpis-eval",
            "competencies": "competencies-eval",
            "potential": "potential-eval",
          }
          foundTemplate = evaluationTemplates.find(t => t.id === typeMap[evalType])
        }
        if (!foundTemplate) {
          foundTemplate = evaluationTemplates.find(t => t.type === evalType)
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

  const handleSubmit = async () => {
    if (!assignment || !template) return

    // Verify all questions answered
    if (Object.keys(answers).length < template.questions.length) {
      alert("Por favor responde todas las preguntas antes de enviar")
      return
    }

    setSubmitting(true)

    try {
      const supabase = createClient()

      // Save responses
      const responses = Object.entries(answers).map(([questionIndex, value]) => ({
        assignment_id: assignment.id,
        question_index: parseInt(questionIndex),
        answer_value: value,
      }))

      const { error: responsesError } = await supabase
        .from("staff_evaluation_responses")
        .insert(responses)

      if (responsesError) {
        console.error("Error saving responses:", responsesError)
        alert("Error al guardar las respuestas")
        setSubmitting(false)
        return
      }

      // Calculate score
      const totalValue = Object.values(answers).reduce((sum, val) => sum + val, 0)
      const maxPossible = template.questions.length * 5
      const score = Math.round((totalValue / maxPossible) * 100)

      // Update assignment
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

      // Mark token as used
      await supabase
        .from("staff_evaluation_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("token", token)

      // Check if all assignments are completed to update main evaluation
      const { data: allAssignments } = await supabase
        .from("staff_evaluation_assignments")
        .select("status, score")
        .eq("staff_evaluation_id", assignment.staff_evaluation_id)

      if (allAssignments && allAssignments.every(a => a.status === "completed")) {
        const avgScore = Math.round(
          allAssignments.reduce((sum, a) => sum + (a.score || 0), 0) / allAssignments.length
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando evaluación...</p>
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
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error</h2>
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
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Evaluación Completada</h2>
              <p className="text-muted-foreground">
                Gracias por completar la evaluación. Tu retroalimentación es muy valiosa.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!assignment || !template) return null

  const staff = assignment.staff_evaluations.staff
  const progress = (Object.keys(answers).length / template.questions.length) * 100
  const currentQ = template.questions[currentQuestion]

  const evaluatorTypeLabels: Record<string, string> = {
    self: "Autoevaluación",
    supervisor: "Evaluación de Supervisor",
    peer: "Evaluación de Par",
    subordinate: "Evaluación de Subordinado",
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Building2 className="h-4 w-4" />
              <span>{staff.agency_rel?.name || "Sin agencia"}</span>
              <span>•</span>
              <span>{staff.department_rel?.name || "Sin departamento"}</span>
            </div>
            <CardTitle>{template.name}</CardTitle>
            <CardDescription>
              <div className="flex items-center gap-2 mt-2">
                <User className="h-4 w-4" />
                <span>
                  Evaluando a: <strong>{staff.first_name} {staff.last_name}</strong>
                  {staff.position && ` - ${staff.position}`}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-primary">
                <Clock className="h-4 w-4" />
                <span>{evaluatorTypeLabels[assignment.evaluator_type]}</span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso</span>
                <span>{Object.keys(answers).length} de {template.questions.length} preguntas</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {currentQ.category}
              </span>
              <span className="text-sm font-medium">
                Pregunta {currentQuestion + 1} de {template.questions.length}
              </span>
            </div>
            <CardTitle className="text-lg mt-2">
              {currentQ.text}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[currentQuestion]?.toString() || ""}
              onValueChange={(value) => {
                setAnswers(prev => ({ ...prev, [currentQuestion]: parseInt(value) }))
              }}
              className="space-y-3"
            >
              {template.scale.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                    answers[currentQuestion] === option.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion]: option.value }))}
                >
                  <RadioGroupItem value={option.value.toString()} id={`option-${option.value}`} />
                  <Label htmlFor={`option-${option.value}`} className="flex-1 cursor-pointer font-normal">
                    <span className="font-medium mr-2">{option.value}.</span>
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Question Navigation */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {template.questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestion(idx)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    idx === currentQuestion
                      ? "bg-primary text-primary-foreground"
                      : answers[idx] !== undefined
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation and Submit */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
          >
            Anterior
          </Button>
          
          <div className="flex gap-2">
            {currentQuestion < template.questions.length - 1 ? (
              <Button
                onClick={() => setCurrentQuestion(prev => prev + 1)}
                disabled={answers[currentQuestion] === undefined}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={Object.keys(answers).length < template.questions.length || submitting}
              >
                {submitting ? "Enviando..." : "Finalizar Evaluación"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
