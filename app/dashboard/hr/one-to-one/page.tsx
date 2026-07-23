"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  User,
  Trash2,
  Pencil,
} from "lucide-react"

interface Agency {
  id: string
  name: string
}

interface StaffMember {
  id: string
  first_name: string
  last_name: string
  position: string | null
  agency_id: string | null
}

interface OneToOneReport {
  id: string
  agency_id: string | null
  staff_id: string
  position_snapshot: string | null
  leader_name: string | null
  meeting_date: string
  reason: string
  reason_other: string | null
  topics: string | null
  tools_provided: string | null
  staff_commitments: string | null
  leader_commitments: string | null
  next_followup_date: string | null
  additional_notes: string | null
  created_by_name: string | null
  created_at: string
  staff?: { first_name: string; last_name: string; position: string | null } | null
}

const REASON_OPTIONS = [
  { value: "seguimiento_desempeno", label: "Seguimiento de desempeño" },
  { value: "desarrollo", label: "Desarrollo" },
  { value: "situacion_puntual", label: "Situación puntual" },
  { value: "otro", label: "Otro" },
]

const REASON_LABELS: Record<string, string> = REASON_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {},
)

const EMPTY_FORM = {
  staff_id: "",
  position_snapshot: "",
  leader_name: "",
  meeting_date: new Date().toISOString().split("T")[0],
  reason: "seguimiento_desempeno",
  reason_other: "",
  topics: "",
  tools_provided: "",
  staff_commitments: "",
  leader_commitments: "",
  next_followup_date: "",
  additional_notes: "",
}

export default function OneToOneReportsPage() {
  const supabase = createClient()

  const [agencies, setAgencies] = useState<Agency[]>([])
  const [selectedAgency, setSelectedAgency] = useState<string>("")
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [reports, setReports] = useState<OneToOneReport[]>([])
  const [loading, setLoading] = useState(true)

  const [filterStaff, setFilterStaff] = useState<string>("all")

  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  useEffect(() => {
    fetchAgencies()
  }, [])

  useEffect(() => {
    if (selectedAgency) {
      fetchStaff()
      fetchReports()
    }
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
      .select(
        `
        id, agency_id, staff_id, position_snapshot, leader_name, meeting_date,
        reason, reason_other, topics, tools_provided, staff_commitments,
        leader_commitments, next_followup_date, additional_notes, created_by_name, created_at,
        staff:staff_id(first_name, last_name, position)
      `,
      )
      .eq("agency_id", selectedAgency)
      .order("meeting_date", { ascending: false })
    setReports((data as unknown as OneToOneReport[]) || [])
    setLoading(false)
  }

  const openNew = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, meeting_date: new Date().toISOString().split("T")[0] })
    setShowDialog(true)
  }

  const openEdit = (report: OneToOneReport) => {
    setEditingId(report.id)
    setForm({
      staff_id: report.staff_id,
      position_snapshot: report.position_snapshot || "",
      leader_name: report.leader_name || "",
      meeting_date: report.meeting_date,
      reason: report.reason,
      reason_other: report.reason_other || "",
      topics: report.topics || "",
      tools_provided: report.tools_provided || "",
      staff_commitments: report.staff_commitments || "",
      leader_commitments: report.leader_commitments || "",
      next_followup_date: report.next_followup_date || "",
      additional_notes: report.additional_notes || "",
    })
    setShowDialog(true)
  }

  const onSelectStaff = (staffId: string) => {
    const member = staffList.find((s) => s.id === staffId)
    setForm((f) => ({
      ...f,
      staff_id: staffId,
      // Autocompleta el puesto con el del colaborador (editable).
      position_snapshot: f.position_snapshot || member?.position || "",
    }))
  }

  const handleSave = async () => {
    if (!form.staff_id || !form.meeting_date) {
      alert("El colaborador y la fecha de la reunión son obligatorios.")
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

    const payload = {
      agency_id: selectedAgency,
      staff_id: form.staff_id,
      position_snapshot: form.position_snapshot || null,
      leader_name: form.leader_name || null,
      meeting_date: form.meeting_date,
      reason: form.reason,
      reason_other: form.reason === "otro" ? form.reason_other || null : null,
      topics: form.topics || null,
      tools_provided: form.tools_provided || null,
      staff_commitments: form.staff_commitments || null,
      leader_commitments: form.leader_commitments || null,
      next_followup_date: form.next_followup_date || null,
      additional_notes: form.additional_notes || null,
    }

    let error
    if (editingId) {
      const res = await supabase
        .from("one_to_one_reports")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editingId)
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
    setShowDialog(false)
    fetchReports()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este reporte de reunión? Esta acción no se puede deshacer.")) return
    const { error } = await supabase.from("one_to_one_reports").delete().eq("id", id)
    if (error) {
      alert("Error al eliminar: " + error.message)
      return
    }
    fetchReports()
  }

  const filteredReports = useMemo(
    () => (filterStaff === "all" ? reports : reports.filter((r) => r.staff_id === filterStaff)),
    [reports, filterStaff],
  )

  const staffName = (r: OneToOneReport) =>
    r.staff ? `${r.staff.first_name} ${r.staff.last_name}` : "Colaborador"

  const formatDate = (value: string | null) => {
    if (!value) return "—"
    return new Date(value + "T00:00:00").toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
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
          <h1 className="text-2xl font-semibold tracking-tight">Reportes one 2 one</h1>
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
          <Button onClick={openNew}>
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
            <Card key={report.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {staffName(report)}
                    </CardTitle>
                    <CardDescription>
                      {report.position_snapshot || report.staff?.position || "Sin puesto"}
                      {report.leader_name ? ` · Líder: ${report.leader_name}` : ""}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {report.reason === "otro" && report.reason_other
                        ? report.reason_other
                        : REASON_LABELS[report.reason] || report.reason}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(report)}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(report.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarClock className="h-4 w-4" />
                    Reunión: <span className="text-foreground">{formatDate(report.meeting_date)}</span>
                  </span>
                  {report.next_followup_date && (
                    <span className="flex items-center gap-1.5">
                      <CalendarClock className="h-4 w-4" />
                      Próximo seguimiento:{" "}
                      <span className="text-foreground">{formatDate(report.next_followup_date)}</span>
                    </span>
                  )}
                </div>

                <ReportField label="Temas tratados" value={report.topics} />
                <ReportField
                  label="Herramientas o recursos proporcionados"
                  value={report.tools_provided}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <ReportField label="Compromisos del colaborador" value={report.staff_commitments} />
                  <ReportField label="Compromisos del líder / RRHH" value={report.leader_commitments} />
                </div>
                <ReportField label="Observaciones adicionales" value={report.additional_notes} />

                {report.created_by_name && (
                  <p className="pt-2 text-xs text-muted-foreground">
                    Registrado por {report.created_by_name}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Diálogo del formulario */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar reporte" : "Reporte de Reunión de Acompañamiento"}
            </DialogTitle>
            <DialogDescription>
              Completa la plantilla de la reunión de acompañamiento para el colaborador.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="meeting_date">Fecha de la reunión *</Label>
                <Input
                  id="meeting_date"
                  type="date"
                  value={form.meeting_date}
                  onChange={(e) => setForm((f) => ({ ...f, meeting_date: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Colaborador *</Label>
                <Select value={form.staff_id} onValueChange={onSelectStaff}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un colaborador" />
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
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="position_snapshot">Puesto</Label>
                <Input
                  id="position_snapshot"
                  value={form.position_snapshot}
                  onChange={(e) => setForm((f) => ({ ...f, position_snapshot: e.target.value }))}
                  placeholder="Puesto del colaborador"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="leader_name">Líder / responsable de la reunión</Label>
                <Input
                  id="leader_name"
                  value={form.leader_name}
                  onChange={(e) => setForm((f) => ({ ...f, leader_name: e.target.value }))}
                  placeholder="Nombre del líder o responsable"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Motivo del acompañamiento</Label>
              <Select
                value={form.reason}
                onValueChange={(v) => setForm((f) => ({ ...f, reason: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REASON_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.reason === "otro" && (
                <Input
                  className="mt-2"
                  value={form.reason_other}
                  onChange={(e) => setForm((f) => ({ ...f, reason_other: e.target.value }))}
                  placeholder="Especifica el motivo"
                />
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="topics">Temas tratados</Label>
              <Textarea
                id="topics"
                rows={3}
                value={form.topics}
                onChange={(e) => setForm((f) => ({ ...f, topics: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tools_provided">
                Herramientas o recursos proporcionados al colaborador
              </Label>
              <Textarea
                id="tools_provided"
                rows={3}
                placeholder="Capacitación, material, mentoría, ajuste de funciones, etc."
                value={form.tools_provided}
                onChange={(e) => setForm((f) => ({ ...f, tools_provided: e.target.value }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="staff_commitments">Compromisos del colaborador</Label>
                <Textarea
                  id="staff_commitments"
                  rows={3}
                  value={form.staff_commitments}
                  onChange={(e) => setForm((f) => ({ ...f, staff_commitments: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="leader_commitments">Compromisos del líder / RRHH</Label>
                <Textarea
                  id="leader_commitments"
                  rows={3}
                  value={form.leader_commitments}
                  onChange={(e) => setForm((f) => ({ ...f, leader_commitments: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="next_followup_date">Fecha de próximo seguimiento</Label>
                <Input
                  id="next_followup_date"
                  type="date"
                  value={form.next_followup_date}
                  onChange={(e) => setForm((f) => ({ ...f, next_followup_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="additional_notes">Observaciones adicionales</Label>
              <Textarea
                id="additional_notes"
                rows={3}
                value={form.additional_notes}
                onChange={(e) => setForm((f) => ({ ...f, additional_notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Spinner className="mr-2 h-4 w-4" />}
              {editingId ? "Guardar cambios" : "Guardar reporte"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ReportField({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap text-pretty leading-relaxed">{value}</p>
    </div>
  )
}
