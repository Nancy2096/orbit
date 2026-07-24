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
  REPORT_SELECT,
  formatLongDate,
  staffFullName,
} from "@/lib/one-to-one"

export default function OneToOneReportsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [agencies, setAgencies] = useState<Agency[]>([])
  const [selectedAgency, setSelectedAgency] = useState<string>("")
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [reports, setReports] = useState<OneToOneReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStaff, setFilterStaff] = useState<string>("all")

  useEffect(() => {
    fetchAgencies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedAgency) {
      fetchStaff()
      fetchReports()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgency])

  const fetchAgencies = async () => {
    const { data } = await supabase.from("agencies").select("id, name").order("name")
    if (data && data.length > 0) {
      setAgencies(data)
      setSelectedAgency(data[0].id)
    }
    setLoading(false)
  }

  const fetchStaff = async () => {
    const { data } = await supabase
      .from("staff")
      .select("id, first_name, last_name, position, agency_id")
      .or(`agency_id.eq.${selectedAgency},agency_id.is.null`)
      .eq("is_active", true)
      .order("first_name")
    setStaffList(data || [])
  }

  const fetchReports = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("one_to_one_reports")
      .select(REPORT_SELECT)
      .eq("agency_id", selectedAgency)
      .order("meeting_date", { ascending: false })
    setReports((data as unknown as OneToOneReport[]) || [])
    setLoading(false)
  }

  const filteredReports = useMemo(
    () => (filterStaff === "all" ? reports : reports.filter((r) => r.staff_id === filterStaff)),
    [reports, filterStaff],
  )

  const meetingLabel = (r: OneToOneReport) =>
    r.meeting_type === "otro" && r.meeting_type_other
      ? r.meeting_type_other
      : MEETING_TYPE_LABELS[r.meeting_type || ""] || MEETING_TYPE_LABELS[r.reason] || "1a1"

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
          <h1 className="text-2xl font-semibold tracking-tight">Reportes One 2 One</h1>
          <p className="text-muted-foreground text-pretty">
            Concentra los reportes de las reuniones de acompañamiento y las herramientas otorgadas al
            personal. Sección confidencial.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedAgency} onValueChange={setSelectedAgency}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar agencia" />
            </SelectTrigger>
            <SelectContent>
              {agencies.map((agency) => (
                <SelectItem key={agency.id} value={agency.id}>
                  {agency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => router.push("/dashboard/hr/one-to-one/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo reporte
          </Button>
        </div>
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
              Aún no hay reportes de reuniones de acompañamiento para esta selección. Crea el primero
              con &quot;Nuevo reporte&quot;.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4">
          {filteredReports.map((report) => (
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
          ))}
        </div>
      )}
    </div>
  )
}
