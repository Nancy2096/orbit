"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Workflow,
  Loader2,
  GripVertical,
  Trash2,
  Pencil,
  MoreVertical,
  ListChecks,
  Users,
  Building2,
  ArrowUp,
  ArrowDown,
  Target,
  Play,
  Flag,
} from "lucide-react"

interface Department {
  id: string
  name: string
}

interface Position {
  id: string
  name: string
  department_id: string | null
}

interface ProcessStep {
  id?: string
  step_order: number
  title: string
  description: string
  responsible_position_id: string | null
  responsible_department_id: string | null
  estimated_duration: string
}

interface Process {
  id: string
  department_id: string | null
  name: string
  description: string | null
  objective: string | null
  start_point: string | null
  end_point: string | null
  status: string
  process_steps: ProcessStep[]
  process_departments: { department_id: string }[]
  process_positions: { position_id: string }[]
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  active: "Activo",
  archived: "Archivado",
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-amber-100 text-amber-700",
  active: "bg-green-100 text-green-700",
  archived: "bg-muted text-muted-foreground",
}

const NONE = "none"

type DurationUnit = "horas" | "días"

// La duración se guarda como texto (ej. "2 días"). Estos helpers separan y
// recomponen la cantidad y la unidad para el editor sin cambiar el esquema.
function parseDuration(value: string | null | undefined): { amount: string; unit: DurationUnit } {
  if (!value) return { amount: "", unit: "días" }
  const match = value.match(/(\d+(?:[.,]\d+)?)/)
  const amount = match ? match[1].replace(",", ".") : ""
  const unit: DurationUnit = /hora/i.test(value) ? "horas" : "días"
  return { amount, unit }
}

function buildDuration(amount: string, unit: DurationUnit): string {
  const trimmed = amount.trim()
  if (!trimmed) return ""
  return `${trimmed} ${unit}`
}

export function ProcessesModule({ agencyId }: { agencyId: string }) {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [processes, setProcesses] = useState<Process[]>([])
  const [areaFilter, setAreaFilter] = useState<string>("all")

  // Builder dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [objective, setObjective] = useState("")
  const [startPoint, setStartPoint] = useState("")
  const [endPoint, setEndPoint] = useState("")
  const [status, setStatus] = useState("draft")
  const [ownerDepartmentId, setOwnerDepartmentId] = useState<string>(NONE)
  const [involvedDepartments, setInvolvedDepartments] = useState<string[]>([])
  const [involvedPositions, setInvolvedPositions] = useState<string[]>([])
  const [steps, setSteps] = useState<ProcessStep[]>([])

  useEffect(() => {
    if (agencyId) fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agencyId])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: deps }, { data: pos }, { data: procs }] = await Promise.all([
      supabase
        .from("departments")
        .select("id, name")
        .eq("agency_id", agencyId)
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("positions")
        .select("id, name, department_id")
        .eq("agency_id", agencyId)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("processes")
        .select(
          "id, department_id, name, description, objective, start_point, end_point, status, process_steps(id, step_order, title, description, responsible_position_id, responsible_department_id, estimated_duration), process_departments(department_id), process_positions(position_id)",
        )
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false }),
    ])
    setDepartments(deps || [])
    setPositions(pos || [])
    setProcesses(
      ((procs as Process[]) || []).map((p) => ({
        ...p,
        process_steps: [...(p.process_steps || [])].sort((a, b) => a.step_order - b.step_order),
      })),
    )
    setLoading(false)
  }

  const departmentName = (id: string | null) =>
    departments.find((d) => d.id === id)?.name || "Sin área"
  const positionName = (id: string | null) => positions.find((p) => p.id === id)?.name || "—"

  const resetForm = () => {
    setEditingId(null)
    setName("")
    setDescription("")
    setObjective("")
    setStartPoint("")
    setEndPoint("")
    setStatus("draft")
    setOwnerDepartmentId(NONE)
    setInvolvedDepartments([])
    setInvolvedPositions([])
    setSteps([])
  }

  const openCreate = () => {
    resetForm()
    if (areaFilter !== "all") setOwnerDepartmentId(areaFilter)
    setDialogOpen(true)
  }

  const openEdit = (p: Process) => {
    setEditingId(p.id)
    setName(p.name)
    setDescription(p.description || "")
    setObjective(p.objective || "")
    setStartPoint(p.start_point || "")
    setEndPoint(p.end_point || "")
    setStatus(p.status)
    setOwnerDepartmentId(p.department_id || NONE)
    setInvolvedDepartments(p.process_departments.map((d) => d.department_id))
    setInvolvedPositions(p.process_positions.map((p2) => p2.position_id))
    setSteps(
      p.process_steps.map((s) => ({
        step_order: s.step_order,
        title: s.title,
        description: s.description || "",
        responsible_position_id: s.responsible_position_id,
        responsible_department_id: s.responsible_department_id,
        estimated_duration: s.estimated_duration || "",
      })),
    )
    setDialogOpen(true)
  }

  const addStep = () =>
    setSteps((prev) => [
      ...prev,
      {
        step_order: prev.length,
        title: "",
        description: "",
        responsible_position_id: null,
        responsible_department_id: ownerDepartmentId !== NONE ? ownerDepartmentId : null,
        estimated_duration: "",
      },
    ])

  const updateStep = (index: number, patch: Partial<ProcessStep>) =>
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)))

  const removeStep = (index: number) =>
    setSteps((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, step_order: i })))

  const moveStep = (index: number, dir: -1 | 1) => {
    setSteps((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next.map((s, i) => ({ ...s, step_order: i }))
    })
  }

  const toggleInvolvedDept = (id: string) =>
    setInvolvedDepartments((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const toggleInvolvedPos = (id: string) =>
    setInvolvedPositions((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const canSave = name.trim().length > 0 && !saving

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      agency_id: agencyId,
      department_id: ownerDepartmentId === NONE ? null : ownerDepartmentId,
      name: name.trim(),
      description: description.trim() || null,
      objective: objective.trim() || null,
      start_point: startPoint.trim() || null,
      end_point: endPoint.trim() || null,
      status,
      updated_at: new Date().toISOString(),
    }

    let processId = editingId
    if (editingId) {
      await supabase.from("processes").update(payload).eq("id", editingId)
    } else {
      const { data } = await supabase.from("processes").insert(payload).select("id").single()
      processId = data?.id ?? null
    }

    if (!processId) {
      setSaving(false)
      return
    }

    // Reemplazar relaciones y pasos (estrategia simple de borrar e insertar)
    await Promise.all([
      supabase.from("process_steps").delete().eq("process_id", processId),
      supabase.from("process_departments").delete().eq("process_id", processId),
      supabase.from("process_positions").delete().eq("process_id", processId),
    ])

    const inserts: Promise<unknown>[] = []
    const cleanSteps = steps.filter((s) => s.title.trim().length > 0)
    if (cleanSteps.length > 0) {
      inserts.push(
        Promise.resolve(
          supabase.from("process_steps").insert(
            cleanSteps.map((s, i) => ({
              process_id: processId,
              step_order: i,
              title: s.title.trim(),
              description: s.description.trim() || null,
              responsible_position_id: s.responsible_position_id,
              responsible_department_id: s.responsible_department_id,
              estimated_duration: s.estimated_duration.trim() || null,
            })),
          ),
        ),
      )
    }
    if (involvedDepartments.length > 0) {
      inserts.push(
        Promise.resolve(
          supabase
            .from("process_departments")
            .insert(involvedDepartments.map((department_id) => ({ process_id: processId, department_id }))),
        ),
      )
    }
    if (involvedPositions.length > 0) {
      inserts.push(
        Promise.resolve(
          supabase
            .from("process_positions")
            .insert(involvedPositions.map((position_id) => ({ process_id: processId, position_id }))),
        ),
      )
    }
    await Promise.all(inserts)

    setSaving(false)
    setDialogOpen(false)
    resetForm()
    fetchAll()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await supabase.from("processes").delete().eq("id", deleteId)
    setDeleteId(null)
    fetchAll()
  }

  // Agrupar procesos por área (dueña)
  const grouped = useMemo(() => {
    const filtered =
      areaFilter === "all"
        ? processes
        : processes.filter((p) => (p.department_id || "none") === areaFilter)
    const map = new Map<string, Process[]>()
    for (const p of filtered) {
      const key = p.department_id || "none"
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    }
    return map
  }, [processes, areaFilter])

  const positionsForDept = (deptId: string | null) =>
    deptId && deptId !== NONE ? positions.filter((p) => p.department_id === deptId) : positions

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header / acciones */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Workflow className="h-5 w-5 text-primary" aria-hidden="true" />
            Procesos por área
          </h2>
          <p className="text-sm text-muted-foreground">
            Construye los procesos de cada área y define los puestos y áreas involucradas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las áreas</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo proceso
          </Button>
        </div>
      </div>

      {processes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Workflow className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">Aún no hay procesos</p>
              <p className="text-sm text-muted-foreground">
                Crea el primer proceso para documentar cómo trabaja cada área.
              </p>
            </div>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo proceso
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([deptId, list]) => (
            <div key={deptId} className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <h3 className="font-medium">{deptId === "none" ? "Sin área" : departmentName(deptId)}</h3>
                <Badge variant="secondary">{list.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {list.map((p) => (
                  <Card
                    key={p.id}
                    className="group relative flex flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    {/* Barra de acento lateral */}
                    <div className="absolute inset-y-0 left-0 w-1.5 bg-primary" />
                    <CardHeader className="pb-3 pl-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 shadow-sm">
                            <Workflow className="h-5 w-5 text-primary" />
                          </div>
                          <CardTitle className="text-base leading-tight text-balance">{p.name}</CardTitle>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge className={STATUS_STYLES[p.status] || ""}>
                            {STATUS_LABELS[p.status] || p.status}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(p)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteId(p.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      {p.description && (
                        <p className="pl-[52px] text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                      )}
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-3 pl-5 text-sm">
                      {p.objective && (
                        <div className="flex items-start gap-2">
                          <Target className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="text-muted-foreground">{p.objective}</span>
                        </div>
                      )}
                      {(p.start_point || p.end_point) && (
                        <div className="space-y-2 rounded-md border bg-muted/30 p-2.5">
                          {p.start_point && (
                            <div className="flex items-start gap-2">
                              <Play className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                              <div>
                                <p className="text-xs font-medium text-foreground">Inicio del proceso</p>
                                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{p.start_point}</p>
                              </div>
                            </div>
                          )}
                          {p.end_point && (
                            <div className="flex items-start gap-2">
                              <Flag className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                              <div>
                                <p className="text-xs font-medium text-foreground">Fin del proceso</p>
                                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{p.end_point}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/60 p-2 text-center">
                          <ListChecks className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold text-foreground">{p.process_steps.length}</span>
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">pasos</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/60 p-2 text-center">
                          <Building2 className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold text-foreground">{p.process_departments.length}</span>
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">áreas</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/60 p-2 text-center">
                          <Users className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold text-foreground">{p.process_positions.length}</span>
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">puestos</span>
                        </div>
                      </div>
                      {p.process_steps.length > 0 && (
                        <Accordion type="single" collapsible className="mt-auto">
                          <AccordionItem value="steps" className="border-b-0">
                            <AccordionTrigger className="py-2 text-sm">Ver pasos</AccordionTrigger>
                            <AccordionContent>
                              <ol className="space-y-2">
                                {p.process_steps.map((s, i) => (
                                  <li key={s.id || i} className="rounded-md border bg-muted/40 p-2">
                                    <div className="flex items-center gap-2">
                                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                                        {i + 1}
                                      </span>
                                      <span className="font-medium">{s.title}</span>
                                    </div>
                                    {s.description && (
                                      <p className="mt-1 whitespace-pre-wrap pl-7 text-sm text-foreground">
                                        {s.description}
                                      </p>
                                    )}
                                    <div className="mt-1 flex flex-col gap-0.5 pl-7 text-xs text-muted-foreground">
                                      {s.responsible_position_id && (
                                        <span>Responsable: {positionName(s.responsible_position_id)}</span>
                                      )}
                                      {s.estimated_duration && (() => {
                                        const { amount, unit } = parseDuration(s.estimated_duration)
                                        return (
                                          <span>
                                            Duración estimada: {amount ? `${amount} ${unit}` : s.estimated_duration}
                                          </span>
                                        )
                                      })()}
                                    </div>
                                  </li>
                                ))}
                              </ol>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Builder dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar proceso" : "Nuevo proceso"}</DialogTitle>
            <DialogDescription>
              Define el proceso, sus pasos y las áreas y puestos involucrados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Datos generales */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="p-name">Nombre del proceso *</Label>
                <Input
                  id="p-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Alta de nuevo cliente"
                />
              </div>
              <div className="space-y-2">
                <Label>Área dueña</Label>
                <Select value={ownerDepartmentId} onValueChange={setOwnerDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sin área</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estatus</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="archived">Archivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="p-desc">Descripción</Label>
                <Textarea
                  id="p-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="¿En qué consiste este proceso?"
                  rows={2}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="p-obj">Objetivo</Label>
                <Textarea
                  id="p-obj"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="¿Qué se busca lograr con este proceso?"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-start">Inicio del proceso</Label>
                <Textarea
                  id="p-start"
                  value={startPoint}
                  onChange={(e) => setStartPoint(e.target.value)}
                  placeholder="¿Con qué inicia el proceso? Ej: Recepción de solicitud del cliente"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-end">Fin del proceso</Label>
                <Textarea
                  id="p-end"
                  value={endPoint}
                  onChange={(e) => setEndPoint(e.target.value)}
                  placeholder="¿Con qué termina el proceso? Ej: Cliente dado de alta y notificado"
                  rows={2}
                />
              </div>
            </div>

            <Separator />

            {/* Pasos del proceso */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="flex items-center gap-2 font-medium">
                    <ListChecks className="h-4 w-4 text-muted-foreground" />
                    Pasos del proceso
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Ordena los pasos y asigna el puesto o área responsable de cada uno.
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addStep}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar paso
                </Button>
              </div>

              {steps.length === 0 ? (
                <p className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
                  Aún no hay pasos. Agrega el primero.
                </p>
              ) : (
                <div className="space-y-3">
                  {steps.map((s, i) => (
                    <div key={i} className="rounded-lg border p-3">
                      <div className="flex items-start gap-2">
                        <div className="flex flex-col items-center gap-1 pt-1">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs font-semibold text-muted-foreground">{i + 1}</span>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex gap-2">
                            <Input
                              value={s.title}
                              onChange={(e) => updateStep(i, { title: e.target.value })}
                              placeholder={`Paso ${i + 1}: título`}
                            />
                            <div className="flex items-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => moveStep(i, -1)}
                                disabled={i === 0}
                                aria-label="Subir paso"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => moveStep(i, 1)}
                                disabled={i === steps.length - 1}
                                aria-label="Bajar paso"
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => removeStep(i)}
                                aria-label="Eliminar paso"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <Textarea
                            value={s.description}
                            onChange={(e) => updateStep(i, { description: e.target.value })}
                            placeholder="Descripción / instrucciones del paso"
                            rows={2}
                          />
                          <div className="grid gap-2 sm:grid-cols-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Área responsable</Label>
                              <Select
                                value={s.responsible_department_id || NONE}
                                onValueChange={(v) =>
                                  updateStep(i, {
                                    responsible_department_id: v === NONE ? null : v,
                                    responsible_position_id: null,
                                  })
                                }
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Área" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={NONE}>Sin área</SelectItem>
                                  {departments.map((d) => (
                                    <SelectItem key={d.id} value={d.id}>
                                      {d.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Puesto responsable</Label>
                              <Select
                                value={s.responsible_position_id || NONE}
                                onValueChange={(v) =>
                                  updateStep(i, { responsible_position_id: v === NONE ? null : v })
                                }
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Puesto" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={NONE}>Sin puesto</SelectItem>
                                  {positionsForDept(s.responsible_department_id).map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Duración estimada</Label>
                              {(() => {
                                const parsed = parseDuration(s.estimated_duration)
                                return (
                                  <div className="flex gap-2">
                                    <Input
                                      type="number"
                                      min={0}
                                      className="h-9"
                                      value={parsed.amount}
                                      onChange={(e) =>
                                        updateStep(i, {
                                          estimated_duration: buildDuration(e.target.value, parsed.unit),
                                        })
                                      }
                                      placeholder="Ej: 2"
                                    />
                                    <Select
                                      value={parsed.unit}
                                      onValueChange={(v) =>
                                        updateStep(i, {
                                          estimated_duration: buildDuration(parsed.amount, v as DurationUnit),
                                        })
                                      }
                                    >
                                      <SelectTrigger className="h-9 w-28">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="horas">Horas</SelectItem>
                                        <SelectItem value="días">Días</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Áreas y puestos involucrados */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 font-medium">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Áreas involucradas
                </h4>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                  {departments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay áreas registradas.</p>
                  ) : (
                    departments.map((d) => (
                      <label key={d.id} className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={involvedDepartments.includes(d.id)}
                          onCheckedChange={() => toggleInvolvedDept(d.id)}
                        />
                        {d.name}
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 font-medium">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Puestos involucrados
                </h4>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                  {positions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay puestos registrados.</p>
                  ) : (
                    positions.map((p) => (
                      <label key={p.id} className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={involvedPositions.includes(p.id)}
                          onCheckedChange={() => toggleInvolvedPos(p.id)}
                        />
                        <span>
                          {p.name}
                          {p.department_id && (
                            <span className="text-xs text-muted-foreground"> · {departmentName(p.department_id)}</span>
                          )}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!canSave}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Guardar cambios" : "Crear proceso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este proceso?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán también sus pasos y las relaciones de áreas y puestos. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
