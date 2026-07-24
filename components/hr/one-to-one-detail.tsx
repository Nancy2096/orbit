"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  CalendarClock,
  Clock,
  UserRound,
  HeartPulse,
  Trophy,
  AlertTriangle,
  GraduationCap,
  Wrench,
  ClipboardList,
  Lock,
  FileWarning,
} from "lucide-react"
import {
  type OneToOneReport,
  MEETING_TYPE_LABELS,
  SATISFACTION_LABELS,
  formatLongDate,
  staffFullName,
  REPORT_SELECT,
} from "@/lib/one-to-one"

const RISK_STYLES: Record<string, string> = {
  bajo: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  medio: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  alto: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
}

export function OneToOneDetail({ reportId }: { reportId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [report, setReport] = useState<OneToOneReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchReport = async () => {
      const { data } = await supabase
        .from("one_to_one_reports")
        .select(REPORT_SELECT)
        .eq("id", reportId)
        .single()
      setReport(data as unknown as OneToOneReport | null)
      setLoading(false)
    }
    fetchReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId])

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este reporte de reunión? Esta acción no se puede deshacer.")) return
    setDeleting(true)
    const { error } = await supabase.from("one_to_one_reports").delete().eq("id", reportId)
    if (error) {
      setDeleting(false)
      alert("Error al eliminar: " + error.message)
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

  if (!report) {
    return (
      <div className="p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileWarning className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>Reporte no encontrado</EmptyTitle>
            <EmptyDescription>
              El reporte que buscas no existe o fue eliminado.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => router.push("/dashboard/hr/one-to-one")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la lista
          </Button>
        </Empty>
      </div>
    )
  }

  const meetingTypeLabel =
    report.meeting_type === "otro" && report.meeting_type_other
      ? report.meeting_type_other
      : MEETING_TYPE_LABELS[report.meeting_type || ""] ||
        MEETING_TYPE_LABELS[report.reason] ||
        "1a1"

  const actionItems = Array.isArray(report.action_items) ? report.action_items : []
  const initials = report.staff
    ? `${report.staff.first_name?.[0] || ""}${report.staff.last_name?.[0] || ""}`.toUpperCase()
    : "?"

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 pb-16">
      {/* Top actions */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/hr/one-to-one")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/hr/one-to-one/${reportId}/edit`)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4 text-destructive" />
            )}
            Eliminar
          </Button>
        </div>
      </div>

      {/* Report header */}
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/40 px-6 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Reporte de reunión de acompañamiento
          </p>
        </div>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                {initials}
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-balance">
                  {staffFullName(report)}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {report.position_snapshot || report.staff?.position || "Sin puesto"}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="w-fit text-sm">
              {meetingTypeLabel}
            </Badge>
          </div>

          <div className="mt-5 grid gap-4 border-t pt-5 sm:grid-cols-3">
            <InfoItem
              icon={<CalendarClock className="h-4 w-4" />}
              label="Fecha de la sesión"
              value={formatLongDate(report.meeting_date)}
            />
            <InfoItem
              icon={<Clock className="h-4 w-4" />}
              label="Duración"
              value={report.duration_minutes ? `${report.duration_minutes} min` : "—"}
            />
            <InfoItem
              icon={<UserRound className="h-4 w-4" />}
              label="Líder / Facilitador de RH"
              value={report.leader_name || "—"}
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Pulse check */}
      <Section icon={<HeartPulse className="h-5 w-5" />} step={2} title="Estado de ánimo y clima laboral">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              Nivel de satisfacción / energía
            </p>
            {report.satisfaction_level ? (
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className={`h-2.5 w-8 rounded-full ${
                        n <= (report.satisfaction_level || 0) ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">
                  {report.satisfaction_level}/5 · {SATISFACTION_LABELS[report.satisfaction_level]}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin registrar</p>
            )}
          </div>
          <Field label="Principales motivadores o estresores" value={report.motivators_stressors} />
        </div>
      </Section>

      {/* 3. Achievements */}
      <Section icon={<Trophy className="h-5 w-5" />} step={3} title="Logros y avances">
        <Field label="Puntos destacados" value={report.achievements} />
        <Field label="Feedback positivo" value={report.positive_feedback} />
      </Section>

      {/* 4. Challenges */}
      <Section
        icon={<AlertTriangle className="h-5 w-5" />}
        step={4}
        title="Desafíos, bloqueos y áreas de mejora"
      >
        <Field label="Cuellos de botella" value={report.bottlenecks} />
        <Field label="Feedback constructivo" value={report.constructive_feedback} />
      </Section>

      {/* 5. Development */}
      <Section
        icon={<GraduationCap className="h-5 w-5" />}
        step={5}
        title="Desarrollo profesional y expectativas"
      >
        <Field label="Intereses de aprendizaje" value={report.learning_interests} />
        <Field label="Proyección" value={report.career_projection} />
      </Section>

      {/* 6. Tools */}
      <Section
        icon={<Wrench className="h-5 w-5" />}
        step={6}
        title="Herramientas y recursos proporcionados"
      >
        <Field label="Evaluación del equipo de trabajo" value={report.equipment_evaluation} />
        <Field label="Accesibilidad a la información" value={report.information_accessibility} />
        <Field label="Apoyo del equipo / líder" value={report.team_support} />
        <Field label="Técnicas de trabajo" value={report.work_techniques} />
      </Section>

      {/* 7. Action plan */}
      <Section
        icon={<ClipboardList className="h-5 w-5" />}
        step={7}
        title="Acuerdos y plan de acción"
      >
        {actionItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin compromisos registrados.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Acción / Compromiso</th>
                  <th className="px-4 py-2.5 font-medium">Responsable</th>
                  <th className="px-4 py-2.5 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {actionItems.map((item, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-3">{item.action || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.responsible || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.due_date ? formatLongDate(item.due_date) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* 8. Private HR notes */}
      {(report.turnover_risk || report.nonverbal_observations || report.private_notes) && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
                <Lock className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">
                Notas privadas de RH
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  Confidencial
                </span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.turnover_risk && (
              <div>
                <p className="mb-1.5 text-sm font-medium text-muted-foreground">
                  Riesgo de fuga de talento
                </p>
                <Badge
                  variant="outline"
                  className={RISK_STYLES[report.turnover_risk] || ""}
                >
                  {report.turnover_risk.charAt(0).toUpperCase() + report.turnover_risk.slice(1)}
                </Badge>
              </div>
            )}
            <Field
              label="Observaciones de lenguaje no verbal / dinámicas de equipo"
              value={report.nonverbal_observations}
            />
            <Field label="Notas adicionales confidenciales" value={report.private_notes} />
          </CardContent>
        </Card>
      )}

      {report.created_by_name && (
        <p className="text-center text-xs text-muted-foreground">
          Reporte creado por {report.created_by_name}
        </p>
      )}
    </div>
  )
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

function Section({
  icon,
  step,
  title,
  children,
}: {
  icon: React.ReactNode
  step: number
  title: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <CardTitle className="text-base">
            <span className="mr-2 text-muted-foreground">{step}.</span>
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium text-muted-foreground">{label}</p>
      {value ? (
        <p className="whitespace-pre-line text-sm leading-relaxed">{value}</p>
      ) : (
        <p className="text-sm text-muted-foreground/70">—</p>
      )}
    </div>
  )
}
