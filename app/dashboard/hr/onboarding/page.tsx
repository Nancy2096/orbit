"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { StaffAvatar } from "@/components/staff-avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Settings, GraduationCap, ArrowRight } from "lucide-react"
import { DepartmentFilter } from "@/components/hr/department-filter"
import {
  ONBOARDING_STAGES,
  SYSTEMS_TASKS,
  AREAS_TASKS,
  FOLLOWUP_TASKS,
  SURVEY_MOMENTS,
  addDays,
  computeProcessProgress,
} from "@/lib/onboarding"

interface ProcessRow {
  id: string
  staff_id: string
  agency_id: string | null
  start_date: string
  status: string
  staff: {
    first_name: string
    last_name: string
    photo_url: string | null
    position: string | null
    department: { name: string } | null
  } | null
  agency: { name: string } | null
  percentage: number
  completedStages: number
}

interface Agency {
  id: string
  name: string
}

interface Department {
  id: string
  name: string
  agency_id: string | null
}

interface EligibleStaff {
  id: string
  first_name: string
  last_name: string
  position: string | null
  agency_id: string | null
  hire_date: string | null
  photo_url: string | null
}

export default function OnboardingPage() {
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [processes, setProcesses] = useState<ProcessRow[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [search, setSearch] = useState("")
  const [agencyFilter, setAgencyFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")

  const [showStart, setShowStart] = useState(false)
  const [eligible, setEligible] = useState<EligibleStaff[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string>("")
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadProcesses()
  }, [])

  async function loadProcesses() {
    setLoading(true)

    const [{ data: procs }, { data: agenciesData }, { data: departmentsData }] = await Promise.all([
      supabase
        .from("onboarding_processes")
        .select("id, staff_id, agency_id, start_date, status, staff:staff_id(first_name, last_name, photo_url, position, department:departments(name)), agency:agency_id(name)")
        .order("created_at", { ascending: false }),
      supabase.from("agencies").select("id, name").eq("is_active", true).order("name"),
      supabase.from("departments").select("id, name, agency_id").order("name"),
    ])

    if (agenciesData) setAgencies(agenciesData)
    if (departmentsData) setDepartments(departmentsData)

    if (!procs || procs.length === 0) {
      setProcesses([])
      setLoading(false)
      return
    }

    const ids = procs.map((p) => p.id)
    const [{ data: tasks }, { data: attempts }, { data: surveys }] = await Promise.all([
      supabase.from("onboarding_tasks").select("process_id, stage, task_key, completed").in("process_id", ids),
      supabase.from("onboarding_test_attempts").select("process_id, stage, passed").in("process_id", ids),
      supabase.from("onboarding_surveys").select("process_id, moment, status").in("process_id", ids),
    ])

    const rows: ProcessRow[] = procs.map((p) => {
      const progress = computeProcessProgress({
        tasks: (tasks || []).filter((t) => t.process_id === p.id),
        attempts: (attempts || []).filter((a) => a.process_id === p.id),
        surveys: (surveys || []).filter((s) => s.process_id === p.id),
      })
      return {
        ...(p as unknown as ProcessRow),
        percentage: progress.percentage,
        completedStages: progress.completedStages,
      }
    })

    setProcesses(rows)
    setLoading(false)
  }

  async function openStartDialog() {
    // Personal activo sin proceso de onboarding existente.
    const [{ data: staff }, { data: existing }] = await Promise.all([
      supabase
        .from("staff")
        .select("id, first_name, last_name, position, agency_id, hire_date, photo_url")
        .eq("is_active", true)
        .order("first_name"),
      supabase.from("onboarding_processes").select("staff_id"),
    ])
    const taken = new Set((existing || []).map((e) => e.staff_id))
    setEligible((staff || []).filter((s) => !taken.has(s.id)) as EligibleStaff[])
    setSelectedStaff("")
    setStartDate(new Date().toISOString().slice(0, 10))
    setShowStart(true)
  }

  async function handleStartProcess() {
    if (!selectedStaff) return
    setSaving(true)

    const staff = eligible.find((s) => s.id === selectedStaff)
    const start = startDate || new Date().toISOString().slice(0, 10)

    const { data: process, error } = await supabase
      .from("onboarding_processes")
      .insert({ staff_id: selectedStaff, agency_id: staff?.agency_id || null, start_date: start, status: "active" })
      .select()
      .single()

    if (error || !process) {
      console.error("[v0] Error creating onboarding process:", error)
      setSaving(false)
      return
    }

    // Sembrar tareas y encuestas iniciales.
    const taskRows = [
      ...SYSTEMS_TASKS.map((t, i) => ({
        process_id: process.id,
        stage: "systems",
        task_key: t.task_key,
        title: t.title,
        sort_order: i,
      })),
      ...AREAS_TASKS.map((t, i) => ({
        process_id: process.id,
        stage: "areas",
        task_key: t.task_key,
        title: t.title,
        scheduled_date: addDays(start, t.dayOffset),
        sort_order: i,
      })),
      ...FOLLOWUP_TASKS.map((t, i) => ({
        process_id: process.id,
        stage: "followup",
        task_key: t.task_key,
        title: t.title,
        scheduled_date: addDays(start, t.dayOffset),
        sort_order: i,
      })),
    ]
    const surveyRows = SURVEY_MOMENTS.map((m) => ({
      process_id: process.id,
      moment: m.moment,
      scheduled_date: addDays(start, m.dayOffset),
      status: "pending",
    }))

    await Promise.all([
      supabase.from("onboarding_tasks").insert(taskRows),
      supabase.from("onboarding_surveys").insert(surveyRows),
    ])

    setSaving(false)
    setShowStart(false)
    await loadProcesses()
  }

  const filtered = processes.filter((p) => {
    const name = `${p.staff?.first_name || ""} ${p.staff?.last_name || ""}`.toLowerCase()
    const matchesSearch = !search || name.includes(search.toLowerCase())
    const matchesAgency = agencyFilter === "all" || p.agency_id === agencyFilter
    const matchesDepartment = departmentFilter === "all" || p.staff?.department?.name === departmentFilter
    return matchesSearch && matchesAgency && matchesDepartment
  })

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Onboarding</h1>
          <p className="text-muted-foreground">
            Introducción e integración del nuevo personal durante sus primeros 90 días
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/hr/onboarding/settings">
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </Link>
          </Button>
          <Button onClick={openStartDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Iniciar Onboarding
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar colaborador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={agencyFilter}
          onValueChange={(value) => {
            setAgencyFilter(value)
            setDepartmentFilter("all")
          }}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Agencia" />
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
        <DepartmentFilter
          departments={departments}
          agencyId={agencyFilter}
          value={departmentFilter}
          onChange={setDepartmentFilter}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner className="h-8 w-8" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty>
              <EmptyMedia>
                <GraduationCap className="h-10 w-10 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>Sin procesos de onboarding</EmptyTitle>
              <EmptyDescription>
                Inicia el onboarding de un nuevo colaborador para comenzar a darle seguimiento.
              </EmptyDescription>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Link key={p.id} href={`/dashboard/hr/onboarding/${p.id}`}>
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <StaffAvatar
                      firstName={p.staff?.first_name || ""}
                      lastName={p.staff?.last_name || ""}
                      photoUrl={p.staff?.photo_url}
                      className="h-11 w-11"
                    />
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base truncate">
                        {p.staff?.first_name} {p.staff?.last_name}
                      </CardTitle>
                      <CardDescription className="truncate">
                        {p.staff?.position || "Sin puesto"}
                        {p.agency?.name ? ` · ${p.agency.name}` : ""}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Avance general</span>
                    <span className="font-medium">{p.percentage}%</span>
                  </div>
                  <Progress value={p.percentage} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {p.completedStages} de {ONBOARDING_STAGES.length} etapas
                    </span>
                    <span className="inline-flex items-center gap-1 text-primary">
                      Ver detalle <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <Badge variant="outline">
                      Ingreso: {new Date(p.start_date).toLocaleDateString("es-MX")}
                    </Badge>
                    {p.percentage === 100 ? (
                      <Badge className="border-green-500/30 bg-green-500/10 text-green-600">Completado</Badge>
                    ) : (
                      <Badge variant="secondary">Activo</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={showStart} onOpenChange={setShowStart}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar proceso de onboarding</DialogTitle>
            <DialogDescription>
              Selecciona al nuevo colaborador y su fecha de ingreso. Se generará automáticamente la agenda de
              actividades y las encuestas de satisfacción.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label>Colaborador</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {eligible.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                      No hay personal disponible sin onboarding
                    </div>
                  ) : (
                    eligible.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.first_name} {s.last_name}
                        {s.position ? ` — ${s.position}` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Fecha de ingreso</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStart(false)}>
              Cancelar
            </Button>
            <Button onClick={handleStartProcess} disabled={!selectedStaff || saving}>
              {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Iniciar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
