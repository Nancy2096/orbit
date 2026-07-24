"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  UserRound,
  HeartPulse,
  Trophy,
  AlertTriangle,
  GraduationCap,
  Wrench,
  ClipboardList,
  Lock,
} from "lucide-react"
import {
  type Agency,
  type StaffMember,
  type ActionItem,
  MEETING_TYPE_OPTIONS,
  TURNOVER_RISK_OPTIONS,
  SATISFACTION_LABELS,
  TODAY,
  REPORT_SELECT,
  type OneToOneReport,
} from "@/lib/one-to-one"

interface Props {
  reportId?: string
}

interface FormState {
  agency_id: string
  staff_id: string
  position_snapshot: string
  leader_name: string
  meeting_date: string
  duration_minutes: string
  meeting_type: string
  meeting_type_other: string
  satisfaction_level: number | null
  motivators_stressors: string
  achievements: string
  positive_feedback: string
  bottlenecks: string
  constructive_feedback: string
  learning_interests: string
  career_projection: string
  equipment_evaluation: string
  information_accessibility: string
  team_support: string
  work_techniques: string
  action_items: ActionItem[]
  private_notes: string
  turnover_risk: string
  nonverbal_observations: string
}

const EMPTY: FormState = {
  agency_id: "",
  staff_id: "",
  position_snapshot: "",
  leader_name: "",
  meeting_date: TODAY(),
  duration_minutes: "",
  meeting_type: "check_in_mensual",
  meeting_type_other: "",
  satisfaction_level: null,
  motivators_stressors: "",
  achievements: "",
  positive_feedback: "",
  bottlenecks: "",
  constructive_feedback: "",
  learning_interests: "",
  career_projection: "",
  equipment_evaluation: "",
  information_accessibility: "",
  team_support: "",
  work_techniques: "",
  action_items: [],
  private_notes: "",
  turnover_risk: "",
  nonverbal_observations: "",
}

export function OneToOneForm({ reportId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [form, setForm] = useState<FormState>({ ...EMPTY })

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  // Load agencies + existing report (edit)
  useEffect(() => {
    const init = async () => {
      const { data: agencyData } = await supabase.from("agencies").select("id, name").order("name")
      const list = agencyData || []
      setAgencies(list)

      if (reportId) {
        const { data } = await supabase
          .from("one_to_one_reports")
          .select(REPORT_SELECT)
          .eq("id", reportId)
          .single()
        const r = data as unknown as OneToOneReport | null
        if (r) {
          setForm({
            agency_id: r.agency_id || "",
            staff_id: r.staff_id,
            position_snapshot: r.position_snapshot || "",
            leader_name: r.leader_name || "",
            meeting_date: r.meeting_date,
            duration_minutes: r.duration_minutes != null ? String(r.duration_minutes) : "",
            meeting_type: r.meeting_type || "check_in_mensual",
            meeting_type_other: r.meeting_type_other || "",
            satisfaction_level: r.satisfaction_level ?? null,
            motivators_stressors: r.motivators_stressors || "",
            achievements: r.achievements || "",
            positive_feedback: r.positive_feedback || "",
            bottlenecks: r.bottlenecks || "",
            constructive_feedback: r.constructive_feedback || "",
            learning_interests: r.learning_interests || "",
            career_projection: r.career_projection || "",
            equipment_evaluation: r.equipment_evaluation || "",
            information_accessibility: r.information_accessibility || "",
            team_support: r.team_support || "",
            work_techniques: r.work_techniques || "",
            action_items: Array.isArray(r.action_items) ? r.action_items : [],
            private_notes: r.private_notes || "",
            turnover_risk: r.turnover_risk || "",
            nonverbal_observations: r.nonverbal_observations || "",
          })
        }
      } else if (list.length > 0) {
        set("agency_id", list[0].id)
      }
      setLoading(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId])

  // Load staff whenever agency changes
  useEffect(() => {
    if (!form.agency_id) return
    const fetchStaff = async () => {
      const { data } = await supabase
        .from("staff")
        .select("id, first_name, last_name, position, agency_id")
        .or(`agency_id.eq.${form.agency_id},agency_id.is.null`)
        .eq("is_active", true)
        .order("first_name")
      setStaffList(data || [])
    }
    fetchStaff()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.agency_id])

  const onSelectStaff = (staffId: string) => {
    const member = staffList.find((s) => s.id === staffId)
    setForm((f) => ({
      ...f,
      staff_id: staffId,
      position_snapshot: f.position_snapshot || member?.position || "",
    }))
  }

  const addActionItem = () =>
    set("action_items", [...form.action_items, { action: "", responsible: "", due_date: "" }])

  const updateActionItem = (index: number, key: keyof ActionItem, value: string) =>
    set(
      "action_items",
      form.action_items.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    )

  const removeActionItem = (index: number) =>
    set(
      "action_items",
      form.action_items.filter((_, i) => i !== index),
    )

  const handleSave = async () => {
    if (!form.agency_id || !form.staff_id || !form.meeting_date) {
      alert("La agencia, el colaborador y la fecha de la sesión son obligatorios.")
      return
    }
    setSaving(true)

    const { data: authData } = await supabase.auth.getUser()
    let createdByName: string | null = null
    if (authData?.user?.id) {
      const { data: userRow } = await supabase
        .from("users")
        .select("first_name, last_name")
        .eq("id", authData.user.id)
        .single()
      if (userRow) createdByName = `${userRow.first_name || ""} ${userRow.last_name || ""}`.trim()
    }

    const cleanItems = form.action_items.filter(
      (i) => i.action.trim() || i.responsible.trim() || i.due_date.trim(),
    )

    const payload = {
      agency_id: form.agency_id,
      staff_id: form.staff_id,
      position_snapshot: form.position_snapshot || null,
      leader_name: form.leader_name || null,
      meeting_date: form.meeting_date,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
      meeting_type: form.meeting_type,
      meeting_type_other: form.meeting_type === "otro" ? form.meeting_type_other || null : null,
      reason: form.meeting_type, // keep legacy NOT NULL column in sync
      satisfaction_level: form.satisfaction_level,
      motivators_stressors: form.motivators_stressors || null,
      achievements: form.achievements || null,
      positive_feedback: form.positive_feedback || null,
      bottlenecks: form.bottlenecks || null,
      constructive_feedback: form.constructive_feedback || null,
      learning_interests: form.learning_interests || null,
      career_projection: form.career_projection || null,
      equipment_evaluation: form.equipment_evaluation || null,
      information_accessibility: form.information_accessibility || null,
      team_support: form.team_support || null,
      work_techniques: form.work_techniques || null,
      action_items: cleanItems,
      private_notes: form.private_notes || null,
      turnover_risk: form.turnover_risk || null,
      nonverbal_observations: form.nonverbal_observations || null,
    }

    let error
    if (reportId) {
      const res = await supabase
        .from("one_to_one_reports")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", reportId)
      error = res.error
    } else {
      const res = await supabase.from("one_to_one_reports").insert({
        ...payload,
        created_by: authData?.user?.id || null,
        created_by_name: createdByName,
      })
      error = res.error
    }

    setSaving(false)
    if (error) {
      alert("Error al guardar el reporte: " + error.message)
      return
    }
    router.push("/dashboard/hr/one-to-one")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Volver">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-balance">
              {reportId ? "Editar reporte 1a1" : "Nuevo reporte 1a1"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Reporte de reunión de acompañamiento
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="shrink-0">
          {saving ? <Spinner className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar reporte
        </Button>
      </div>

      {/* 1. Datos generales */}
      <SectionCard
        icon={<UserRound className="h-5 w-5" />}
        step={1}
        title="Datos generales de la sesión"
        description="Información base de la reunión de acompañamiento"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {!reportId && (
            <div className="space-y-2">
              <Label>Agencia *</Label>
              <Select value={form.agency_id} onValueChange={(v) => set("agency_id", v)}>
                <SelectTrigger>
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
          )}
          <div className="space-y-2">
            <Label>Colaborador *</Label>
            <Select value={form.staff_id} onValueChange={onSelectStaff}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona colaborador" />
              </SelectTrigger>
              <SelectContent>
                {staffList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.first_name} {s.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Puesto</Label>
            <Input
              value={form.position_snapshot}
              onChange={(e) => set("position_snapshot", e.target.value)}
              placeholder="Puesto del colaborador"
            />
          </div>
          <div className="space-y-2">
            <Label>Líder / Facilitador de RH</Label>
            <Input
              value={form.leader_name}
              onChange={(e) => set("leader_name", e.target.value)}
              placeholder="Quien conduce o acompaña la sesión"
            />
          </div>
          <div className="space-y-2">
            <Label>Fecha de la sesión *</Label>
            <Input
              type="date"
              value={form.meeting_date}
              onChange={(e) => set("meeting_date", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Duración (minutos)</Label>
            <Input
              type="number"
              min={0}
              value={form.duration_minutes}
              onChange={(e) => set("duration_minutes", e.target.value)}
              placeholder="Ej: 45"
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo de 1a1</Label>
            <Select value={form.meeting_type} onValueChange={(v) => set("meeting_type", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEETING_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.meeting_type === "otro" && (
            <div className="space-y-2">
              <Label>Especifica el tipo</Label>
              <Input
                value={form.meeting_type_other}
                onChange={(e) => set("meeting_type_other", e.target.value)}
                placeholder="Describe la situación"
              />
            </div>
          )}
        </div>
      </SectionCard>

      {/* 2. Pulse check */}
      <SectionCard
        icon={<HeartPulse className="h-5 w-5" />}
        step={2}
        title="Estado de ánimo y clima laboral"
        description="Pulse check del colaborador"
      >
        <div className="space-y-2">
          <Label>Nivel de satisfacción / energía</Label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => set("satisfaction_level", form.satisfaction_level === n ? null : n)}
                className={`flex min-w-[92px] flex-col items-center rounded-lg border px-3 py-2 text-sm transition-colors ${
                  form.satisfaction_level === n
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted/30 hover:bg-muted"
                }`}
              >
                <span className="text-base font-semibold">{n}</span>
                <span className="text-xs">{SATISFACTION_LABELS[n]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Principales motivadores o estresores</Label>
          <Textarea
            value={form.motivators_stressors}
            onChange={(e) => set("motivators_stressors", e.target.value)}
            placeholder="Qué le genera entusiasmo o frustración: carga de trabajo, relaciones con el equipo, balance vida-trabajo..."
            rows={3}
          />
        </div>
      </SectionCard>

      {/* 3. Achievements */}
      <SectionCard
        icon={<Trophy className="h-5 w-5" />}
        step={3}
        title="Logros y avances"
        description="Reconocimiento de éxitos recientes"
      >
        <div className="space-y-2">
          <Label>Puntos destacados</Label>
          <Textarea
            value={form.achievements}
            onChange={(e) => set("achievements", e.target.value)}
            placeholder="Éxitos recientes, metas alcanzadas o proyectos entregados desde la última reunión"
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Feedback positivo</Label>
          <Textarea
            value={form.positive_feedback}
            onChange={(e) => set("positive_feedback", e.target.value)}
            placeholder="Reconocimiento expresado por el líder o RH hacia el colaborador"
            rows={3}
          />
        </div>
      </SectionCard>

      {/* 4. Challenges */}
      <SectionCard
        icon={<AlertTriangle className="h-5 w-5" />}
        step={4}
        title="Desafíos, bloqueos y áreas de mejora"
        description="Obstáculos y feedback constructivo"
      >
        <div className="space-y-2">
          <Label>Cuellos de botella</Label>
          <Textarea
            value={form.bottlenecks}
            onChange={(e) => set("bottlenecks", e.target.value)}
            placeholder="Obstáculos para cumplir objetivos: falta de recursos, comunicación con otras áreas, herramientas..."
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Feedback constructivo</Label>
          <Textarea
            value={form.constructive_feedback}
            onChange={(e) => set("constructive_feedback", e.target.value)}
            placeholder="Temas de desempeño, comportamiento o habilidades a pulir/corregir"
            rows={3}
          />
        </div>
      </SectionCard>

      {/* 5. Development */}
      <SectionCard
        icon={<GraduationCap className="h-5 w-5" />}
        step={5}
        title="Desarrollo profesional y expectativas"
        description="Intereses de aprendizaje y proyección"
      >
        <div className="space-y-2">
          <Label>Intereses de aprendizaje</Label>
          <Textarea
            value={form.learning_interests}
            onChange={(e) => set("learning_interests", e.target.value)}
            placeholder="Capacitaciones, cursos o habilidades que el colaborador desea desarrollar"
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Proyección</Label>
          <Textarea
            value={form.career_projection}
            onChange={(e) => set("career_projection", e.target.value)}
            placeholder="Aspiraciones a mediano/largo plazo dentro de la compañía"
            rows={3}
          />
        </div>
      </SectionCard>

      {/* 6. Tools & resources */}
      <SectionCard
        icon={<Wrench className="h-5 w-5" />}
        step={6}
        title="Herramientas y recursos proporcionados"
        description="Evaluación del equipo de trabajo y apoyo"
      >
        <div className="space-y-2">
          <Label>Evaluación del equipo de trabajo</Label>
          <Textarea
            value={form.equipment_evaluation}
            onChange={(e) => set("equipment_evaluation", e.target.value)}
            placeholder="¿Cuenta con el hardware, software o licencias adecuadas para su función?"
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label>Accesibilidad a la información</Label>
          <Textarea
            value={form.information_accessibility}
            onChange={(e) => set("information_accessibility", e.target.value)}
            placeholder="¿Tiene la documentación, accesos, metodologías o capacitación previa necesarios?"
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label>Apoyo del equipo / líder</Label>
          <Textarea
            value={form.team_support}
            onChange={(e) => set("team_support", e.target.value)}
            placeholder="¿Requiere ayuda técnica o acompañamiento de un mentor?"
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label>Técnicas de trabajo</Label>
          <Textarea
            value={form.work_techniques}
            onChange={(e) => set("work_techniques", e.target.value)}
            placeholder="Administración de tiempos, servicio al cliente, manejo de objeciones, control de estrés..."
            rows={2}
          />
        </div>
      </SectionCard>

      {/* 7. Action plan */}
      <SectionCard
        icon={<ClipboardList className="h-5 w-5" />}
        step={7}
        title="Acuerdos y plan de acción"
        description="Un reporte sin accionables es solo una charla de café"
      >
        <div className="space-y-3">
          {form.action_items.length > 0 && (
            <div className="hidden gap-3 px-1 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[1fr_180px_150px_40px]">
              <span>Acción / Compromiso</span>
              <span>Responsable</span>
              <span>Fecha compromiso</span>
              <span />
            </div>
          )}
          {form.action_items.map((item, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-[1fr_180px_150px_40px] sm:items-center sm:border-0 sm:bg-transparent sm:p-0"
            >
              <Input
                value={item.action}
                onChange={(e) => updateActionItem(index, "action", e.target.value)}
                placeholder="Ej: Enviar propuesta para curso de Excel avanzado"
              />
              <Input
                value={item.responsible}
                onChange={(e) => updateActionItem(index, "responsible", e.target.value)}
                placeholder="Responsable"
              />
              <Input
                type="date"
                value={item.due_date}
                onChange={(e) => updateActionItem(index, "due_date", e.target.value)}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeActionItem(index)}
                aria-label="Eliminar compromiso"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addActionItem}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar compromiso
          </Button>
        </div>
      </SectionCard>

      {/* 8. Private HR notes */}
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Notas privadas de RH / Observaciones</CardTitle>
              <CardDescription>Confidencial — uso interno de Recursos Humanos</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Riesgo de fuga de talento (turnover)</Label>
            <Select
              value={form.turnover_risk || "none"}
              onValueChange={(v) => set("turnover_risk", v === "none" ? "" : v)}
            >
              <SelectTrigger className="sm:max-w-xs">
                <SelectValue placeholder="Sin evaluar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin evaluar</SelectItem>
                {TURNOVER_RISK_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Observaciones de lenguaje no verbal / dinámicas de equipo</Label>
            <Textarea
              value={form.nonverbal_observations}
              onChange={(e) => set("nonverbal_observations", e.target.value)}
              placeholder="Aspectos a monitorear discretamente"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Notas adicionales confidenciales</Label>
            <Textarea
              value={form.private_notes}
              onChange={(e) => set("private_notes", e.target.value)}
              placeholder="Notas privadas de RH"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Spinner className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar reporte
        </Button>
      </div>
    </div>
  )
}

function SectionCard({
  icon,
  step,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  step: number
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <CardTitle className="text-base">
              <span className="mr-2 text-muted-foreground">{step}.</span>
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}
