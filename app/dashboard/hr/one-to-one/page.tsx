"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  MessagesSquare,
  Plus,
  CalendarClock,
  Clock,
  User,
  ChevronRight,
} from "lucide-react"
import {
  type Agency,
  type StaffMember,
  type OneToOneReport,
  MEETING_TYPE_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  REPORT_SELECT,
  formatLongDate,
  staffFullName,
} from "@/lib/one-to-one"
import { OneToOneNotifications } from "@/components/hr/one-to-one-notifications"

export default function OneToOneReportsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [agencies, setAgencies] = useState<Agency[]>([])
  // "all" muestra todas las agencias y es la opción por defecto.
  const [selectedAgency, setSelectedAgency] = useState<string>("all")
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [reports, setReports] = useState<OneToOneReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStaff, setFilterStaff] = useState<string>("all")

  useEffect(() => {
    fetchAgencies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchStaff()
    fetchReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgency])

  const fetchAgencies = async () => {
    const { data } = await supabase.from("agencies").select("id, name").order("name")
    if (data) setAgencies(data)
    setLoading(false)
  }

  const fetchStaff = async () => {
    let query = supabase
      .from("staff")
      .select("id, first_name, last_name, position, agency_id")
      .eq("is_active", true)
    // Con "all" se muestran todas las agencias; de lo contrario se filtra.
    if (selectedAgency !== "all") {
      query = query.or(`agency_id.eq.${selectedAgency},agency_id.is.null`)
    }
    const { data } = await query.order("first_name")
    setStaffList(data || [])
  }

  const fetchReports = async () => {
    setLoading(true)
    let query = supabase.from("one_to_one_reports").select(REPORT_SELECT)
    if (selectedAgency !== "all") {
      query = query.eq("agency_id", selectedAgency)
    }
    const { data } = await query.order("meeting_date", { ascending: false })
    setReports((data as unknown as OneToOneReport[]) || [])
    setLoading(false)
  }

  const filteredReports = useMemo(
    () => (filterStaff === "all" ? reports : reports.filter((r) => r.staff_id === filterStaff)),
    [reports, filterStaff],
  )

  // Se separan los registros del personal ACTIVO de los que tienen otro estado
  // (baja/inactivo/suspendido) para dar prioridad y orden al registro activo.
  const isActiveReport = (r: OneToOneReport) =>
    r.staff?.is_active !== false && (r.staff?.employment_status ?? "active") === "active"

  const activeReports = useMemo(
    () => filteredReports.filter(isActiveReport),
    [filteredReports],
  )
  const otherReports = useMemo(
    () => filteredReports.filter((r) => !isActiveReport(r)),
    [filteredReports],
  )

  const meetingLabel = (r: OneToOneReport) =>
    r.meeting_type === "otro" && r.meeting_type_other
      ? r.meeting_type_other
      : MEETING_TYPE_LABELS[r.meeting_type || ""] || MEETING_TYPE_LABELS[r.reason] || "1a1"

  const renderReportCard = (report: OneToOneReport) => {
    const status = report.staff?.employment_status ?? "active"
    const isActive = report.staff?.is_active !== false && status === "active"
    return (
      <Card
        key={report.id}
        role="button"
        tabIndex={0}
        onClick={() => router.push(`/dashboard/hr/one-to-one/${report.id}`)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            router.push(`/dashboard/hr/one-to-one/${report.id}`)
          }
        }}
        className="cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/30"
      >
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-4 w-4 text-muted-foreground" />
                {staffFullName(report)}
              </CardTitle>
              <CardDescription>
                {report.position_snapshot || report.staff?.position || "Sin puesto"}
                {report.leader_name ? ` · Líder: ${report.leader_name}` : ""}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {!isActive && (
                <Badge variant="outline" className="text-muted-foreground">
                  {EMPLOYMENT_STATUS_LABELS[status] || "Inactivo"}
                </Badge>
              )}
              <Badge variant="secondary">{meetingLabel(report)}</Badge>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarClock className="h-4 w-4" />
              Sesión: <span className="text-foreground">{formatLongDate(report.meeting_date)}</span>
            </span>
            {report.duration_minutes ? (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span className="text-foreground">{report.duration_minutes} min</span>
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading && agencies.length === 0) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reuniones One 2 One</h1>
          <p className="text-muted-foreground text-pretty">
            Concentra las reuniones de acompañamiento y las herramientas otorgadas al
            personal. Sección confidencial.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedAgency} onValueChange={setSelectedAgency}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar agencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las agencias</SelectItem>
              {agencies.map((agency) => (
                <SelectItem key={agency.id} value={agency.id}>
                  {agency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => router.push("/dashboard/hr/one-to-one/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Reunión 1a1
          </Button>
        </div>
      </div>

      {/* Recordatorios de reuniones por hito (1er, 2do, 3er mes) */}
      <OneToOneNotifications />

      {/* Registros de reuniones ya realizadas (separados de los recordatorios de arriba) */}
      <div className="border-t pt-4">
        <h2 className="text-lg font-semibold tracking-tight">Registros de reuniones realizadas</h2>
        <p className="text-sm text-muted-foreground">
          Historial de reuniones One 2 One ya registradas.
        </p>
      </div>

      {/* Filtro por colaborador */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Label className="text-sm text-muted-foreground sm:w-40">Filtrar por colaborador</Label>
        <Select value={filterStaff} onValueChange={setFilterStaff}>
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue placeholder="Todos los colaboradores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los colaboradores</SelectItem>
            {staffList.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.first_name} {s.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de reportes */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      ) : filteredReports.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessagesSquare className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>Sin reportes</EmptyTitle>
            <EmptyDescription>
              Aún no hay reuniones de acompañamiento para esta selección. Crea la primera
              con &quot;Nueva Reunión 1a1&quot;.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-8">
          {/* Registro del personal ACTIVO (prioridad) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Personal activo</h2>
              <Badge variant="secondary">{activeReports.length}</Badge>
            </div>
            {activeReports.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin registros de personal activo.</p>
            ) : (
              <div className="grid gap-4">
                {activeReports.map((report) => renderReportCard(report))}
              </div>
            )}
          </section>

          {/* Registro del personal con otro estado (baja/inactivo/suspendido) */}
          {otherReports.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-muted-foreground">
                  Personal con otro estado
                </h2>
                <Badge variant="outline">{otherReports.length}</Badge>
              </div>
              <div className="grid gap-4 opacity-90">
                {otherReports.map((report) => renderReportCard(report))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
