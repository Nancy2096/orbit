"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, FileText, Trash2, Plus, Save, CheckCircle2 } from "lucide-react"
import { DEFAULT_PASS_THRESHOLD } from "@/lib/onboarding"

interface Agency {
  id: string
  name: string
}
interface Material {
  id: string
  stage: string
  title: string
  file_url: string
  file_name: string
}
interface Question {
  id: string
  stage: string
  question: string
  options: string[]
  correct_index: number
}

const TEST_STAGES = [
  { key: "induction", label: "Inducción institucional" },
  { key: "training", label: "Formación de procesos" },
] as const

export default function OnboardingSettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [agencyId, setAgencyId] = useState<string>("")
  const [materials, setMaterials] = useState<Material[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [induThreshold, setInduThreshold] = useState(DEFAULT_PASS_THRESHOLD)
  const [trainThreshold, setTrainThreshold] = useState(DEFAULT_PASS_THRESHOLD)
  const [savingConfig, setSavingConfig] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from("agencies").select("id, name").order("name")
      setAgencies((data || []) as Agency[])
      if (data && data.length > 0) setAgencyId(data[0].id)
      setLoading(false)
    })()
  }, [])

  const loadAgencyData = useCallback(async () => {
    if (!agencyId) return
    const [{ data: m }, { data: q }, { data: cfg }] = await Promise.all([
      supabase.from("onboarding_materials").select("*").eq("agency_id", agencyId).order("created_at"),
      supabase.from("onboarding_questions").select("*").eq("agency_id", agencyId).order("sort_order"),
      supabase.from("onboarding_config").select("*").eq("agency_id", agencyId).maybeSingle(),
    ])
    setMaterials((m || []) as Material[])
    setQuestions((q || []) as Question[])
    setInduThreshold((cfg as any)?.induction_pass_threshold ?? DEFAULT_PASS_THRESHOLD)
    setTrainThreshold((cfg as any)?.training_pass_threshold ?? DEFAULT_PASS_THRESHOLD)
  }, [agencyId, supabase])

  useEffect(() => {
    loadAgencyData()
  }, [loadAgencyData])

  async function saveConfig() {
    if (!agencyId) return
    setSavingConfig(true)
    const { error } = await supabase
      .from("onboarding_config")
      .upsert(
        {
          agency_id: agencyId,
          induction_pass_threshold: induThreshold,
          training_pass_threshold: trainThreshold,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "agency_id" },
      )
    setSavingConfig(false)
    if (error) toast.error("No se pudo guardar la configuración")
    else toast.success("Configuración guardada")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/hr/onboarding">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Onboarding
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración de Onboarding</h1>
          <p className="text-muted-foreground">
            Presentaciones, tests y umbrales de aprobación por agencia
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Agencia:</Label>
          <Select value={agencyId} onValueChange={setAgencyId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Selecciona agencia" />
            </SelectTrigger>
            <SelectContent>
              {agencies.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Umbrales de aprobación</CardTitle>
          <CardDescription>Porcentaje mínimo para aprobar cada test</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="grid gap-2">
              <Label>Inducción institucional (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={induThreshold}
                onChange={(e) => setInduThreshold(Number(e.target.value))}
                className="w-32"
              />
            </div>
            <div className="grid gap-2">
              <Label>Formación de procesos (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={trainThreshold}
                onChange={(e) => setTrainThreshold(Number(e.target.value))}
                className="w-32"
              />
            </div>
            <Button onClick={saveConfig} disabled={savingConfig}>
              {savingConfig ? <Spinner className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="induction">
        <TabsList>
          {TEST_STAGES.map((s) => (
            <TabsTrigger key={s.key} value={s.key}>
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TEST_STAGES.map((s) => (
          <TabsContent key={s.key} value={s.key} className="space-y-6 pt-4">
            <MaterialsManager
              agencyId={agencyId}
              stage={s.key}
              materials={materials.filter((m) => m.stage === s.key)}
              onChange={loadAgencyData}
            />
            <QuestionsManager
              agencyId={agencyId}
              stage={s.key}
              questions={questions.filter((q) => q.stage === s.key)}
              onChange={loadAgencyData}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function MaterialsManager({
  agencyId,
  stage,
  materials,
  onChange,
}: {
  agencyId: string
  stage: string
  materials: Material[]
  onChange: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    fd.append("agencyId", agencyId)
    fd.append("stage", stage)
    fd.append("title", file.name)
    const res = await fetch("/api/onboarding/materials", { method: "POST", body: fd })
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ""
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || "Error al subir la presentación")
      return
    }
    toast.success("Presentación subida")
    onChange()
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar esta presentación?")) return
    const res = await fetch(`/api/onboarding/materials?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Presentación eliminada")
      onChange()
    } else {
      toast.error("No se pudo eliminar")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Presentaciones</CardTitle>
        <CardDescription>Sube una o varias presentaciones (PDF, PPT, PPTX o imágenes, máx. 25MB)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.ppt,.pptx,image/png,image/jpeg,application/pdf"
          className="hidden"
          onChange={handleFile}
        />
        <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading || !agencyId}>
          {uploading ? <Spinner className="mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
          Subir presentación
        </Button>

        {materials.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay presentaciones para esta etapa.</p>
        ) : (
          <div className="space-y-2">
            {materials.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-lg border p-3">
                <FileText className="h-5 w-5 text-primary" />
                <a
                  href={m.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm hover:underline"
                >
                  {m.title}
                </a>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(m.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface DraftQuestion {
  question: string
  options: string[]
  correct_index: number
}

function QuestionsManager({
  agencyId,
  stage,
  questions,
  onChange,
}: {
  agencyId: string
  stage: string
  questions: Question[]
  onChange: () => void
}) {
  const supabase = createClient()
  const [draft, setDraft] = useState<DraftQuestion>({ question: "", options: ["", "", "", ""], correct_index: 0 })
  const [saving, setSaving] = useState(false)

  async function addQuestion() {
    if (!draft.question.trim()) {
      toast.error("Escribe la pregunta")
      return
    }
    const cleanOptions = draft.options.map((o) => o.trim()).filter((o) => o.length > 0)
    if (cleanOptions.length < 2) {
      toast.error("Agrega al menos 2 opciones")
      return
    }
    const correct = Math.min(draft.correct_index, cleanOptions.length - 1)
    setSaving(true)
    const { error } = await supabase.from("onboarding_questions").insert({
      agency_id: agencyId,
      stage,
      question: draft.question.trim(),
      options: cleanOptions,
      correct_index: correct,
      sort_order: questions.length,
    })
    setSaving(false)
    if (error) {
      toast.error("No se pudo guardar la pregunta")
      return
    }
    setDraft({ question: "", options: ["", "", "", ""], correct_index: 0 })
    toast.success("Pregunta agregada")
    onChange()
  }

  async function removeQuestion(id: string) {
    const { error } = await supabase.from("onboarding_questions").delete().eq("id", id)
    if (!error) {
      toast.success("Pregunta eliminada")
      onChange()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preguntas del test</CardTitle>
        <CardDescription>Define las preguntas de opción múltiple y marca la respuesta correcta</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {questions.length > 0 && (
          <div className="space-y-2">
            {questions.map((q, idx) => (
              <div key={q.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium">
                    {idx + 1}. {q.question}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeQuestion(q.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <ul className="mt-2 space-y-1">
                  {q.options.map((opt, oi) => (
                    <li
                      key={oi}
                      className={`flex items-center gap-2 text-sm ${
                        oi === q.correct_index ? "text-green-600 font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {oi === q.correct_index ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <span className="h-3.5 w-3.5 rounded-full border" />
                      )}
                      {opt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Nueva pregunta */}
        <div className="space-y-3 rounded-lg border border-dashed p-4">
          <div className="grid gap-2">
            <Label>Nueva pregunta</Label>
            <Input
              value={draft.question}
              onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
              placeholder="Escribe la pregunta"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Opciones (marca la correcta con el botón de la izquierda)
            </Label>
            {draft.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={draft.correct_index === oi ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setDraft((d) => ({ ...d, correct_index: oi }))}
                  aria-label="Marcar como correcta"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
                <Input
                  value={opt}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, options: d.options.map((o, i) => (i === oi ? e.target.value : o)) }))
                  }
                  placeholder={`Opción ${oi + 1}`}
                />
              </div>
            ))}
          </div>
          <Button onClick={addQuestion} disabled={saving || !agencyId} size="sm">
            {saving ? <Spinner className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            Agregar pregunta
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
