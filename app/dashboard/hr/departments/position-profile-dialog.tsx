"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import { Plus, Trash2, X } from "lucide-react"
import {
  ACADEMIC_LEVELS,
  emptyProfile,
  JOB_TYPES,
  PERIODICITY_OPTIONS,
  POSITION_LEVELS,
  PROFILE_STATUSES,
  type Agency,
  type Department,
  type Position,
  type PositionProfile,
  type ProfileFunction,
} from "./types"

interface PositionProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  position: Position | null
  isDuplicate?: boolean
  readOnly?: boolean
  departments: Department[]
  positions: Position[]
  agencies: Agency[]
  onSaved: () => void
}

const NONE = "__none__"

export function PositionProfileDialog({
  open,
  onOpenChange,
  position,
  isDuplicate = false,
  readOnly = false,
  departments,
  positions,
  agencies,
  onSaved,
}: PositionProfileDialogProps) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [section, setSection] = useState("s0")

  const [name, setName] = useState("")
  const [departmentId, setDepartmentId] = useState<string>(NONE)
  const [agencyId, setAgencyId] = useState<string>(NONE)
  const [level, setLevel] = useState<string>(NONE)
  const [reportsToId, setReportsToId] = useState<string>(NONE)
  const [jobType, setJobType] = useState<string>(NONE)
  const [workSchedule, setWorkSchedule] = useState("")
  const [salaryRange, setSalaryRange] = useState("")
  const [status, setStatus] = useState("draft")
  const [profile, setProfile] = useState<PositionProfile>(emptyProfile())
  const [interactInput, setInteractInput] = useState("")

  useEffect(() => {
    if (!open) return
    setSection("s0")
    setName(isDuplicate ? `${position?.name ?? ""} (copia)` : position?.name ?? "")
    setDepartmentId(position?.department_id ?? NONE)
    setAgencyId(position?.agency_id ?? NONE)
    setLevel(position?.level ?? NONE)
    setReportsToId(position?.reports_to_position_id ?? NONE)
    setJobType(position?.job_type ?? NONE)
    setWorkSchedule(position?.work_schedule ?? "")
    setSalaryRange(position?.salary_range ?? "")
    setStatus(isDuplicate ? "draft" : position?.profile_status ?? "draft")
    setProfile(position?.profile ? { ...emptyProfile(), ...position.profile } : emptyProfile())
    setInteractInput("")
  }, [open, position, isDuplicate])

  const reportsToOptions = useMemo(
    () => positions.filter((p) => p.id !== position?.id),
    [positions, position],
  )

  function patchProfile(patch: Partial<PositionProfile>) {
    setProfile((prev) => ({ ...prev, ...patch }))
  }

  function addInteract() {
    const value = interactInput.trim()
    if (!value) return
    if (profile.general.interacts_with.includes(value)) {
      setInteractInput("")
      return
    }
    patchProfile({
      general: { ...profile.general, interacts_with: [...profile.general.interacts_with, value] },
    })
    setInteractInput("")
  }

  function removeInteract(tag: string) {
    patchProfile({
      general: {
        ...profile.general,
        interacts_with: profile.general.interacts_with.filter((t) => t !== tag),
      },
    })
  }

  function addFunction() {
    patchProfile({
      functions: [...profile.functions, { responsibility: "", periodicity: "Diario", reports: "" }],
    })
  }

  function updateFunction(index: number, patch: Partial<ProfileFunction>) {
    patchProfile({
      functions: profile.functions.map((fn, i) => (i === index ? { ...fn, ...patch } : fn)),
    })
  }

  function removeFunction(index: number) {
    patchProfile({ functions: profile.functions.filter((_, i) => i !== index) })
  }

  async function handleSave() {
    if (readOnly) {
      onOpenChange(false)
      return
    }
    if (!name.trim()) {
      toast.error("El nombre del cargo es obligatorio")
      setSection("s1")
      return
    }
    setSaving(true)
    const payload = {
      name: name.trim(),
      department_id: departmentId === NONE ? null : departmentId,
      agency_id: agencyId === NONE ? null : agencyId,
      level: level === NONE ? null : level,
      reports_to_position_id: reportsToId === NONE ? null : reportsToId,
      job_type: jobType === NONE ? null : jobType,
      work_schedule: workSchedule.trim() || null,
      salary_range: salaryRange.trim() || null,
      profile_status: status,
      profile,
      description: profile.objective.trim() || null,
      is_active: true,
    }

    const shouldInsert = !position || isDuplicate
    const { error } = shouldInsert
      ? await supabase.from("positions").insert(payload)
      : await supabase.from("positions").update(payload).eq("id", position.id)

    setSaving(false)
    if (error) {
      toast.error("No se pudo guardar el perfil", { description: error.message })
      return
    }
    toast.success(shouldInsert ? "Perfil de puesto creado" : "Perfil de puesto actualizado")
    onOpenChange(false)
    onSaved()
  }

  const disabled = readOnly

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>
            {readOnly
              ? "Perfil de Cargo"
              : position && !isDuplicate
                ? "Editar Perfil de Cargo"
                : "Nuevo Perfil de Puesto"}
          </DialogTitle>
          <DialogDescription>
            Formato de Perfil de Cargo del área de Talento Humano.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={section} onValueChange={setSection} className="flex min-h-0 flex-col">
          <div className="border-b px-6 pt-3">
            <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
              <TabsTrigger value="s0">Control</TabsTrigger>
              <TabsTrigger value="s1">General</TabsTrigger>
              <TabsTrigger value="s2">Objetivo</TabsTrigger>
              <TabsTrigger value="s3">Funciones</TabsTrigger>
              <TabsTrigger value="s4">Requisitos</TabsTrigger>
              <TabsTrigger value="s5">Competencias</TabsTrigger>
            </TabsList>
          </div>

          <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
            {/* Sección 0: Control documental */}
            <TabsContent value="s0" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Código de Formato</Label>
                  <Input
                    value={profile.doc.code_format}
                    disabled={disabled}
                    onChange={(e) => patchProfile({ doc: { ...profile.doc, code_format: e.target.value } })}
                    placeholder="FOR.TH.01"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Versión</Label>
                  <Input
                    value={profile.doc.version}
                    disabled={disabled}
                    onChange={(e) => patchProfile({ doc: { ...profile.doc, version: e.target.value } })}
                    placeholder="1.0"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Fecha de Elaboración</Label>
                <Input
                  type="date"
                  value={profile.doc.elaboration_date}
                  disabled={disabled}
                  onChange={(e) => patchProfile({ doc: { ...profile.doc, elaboration_date: e.target.value } })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Elaborado por</Label>
                  <Input
                    value={profile.doc.elaborated_by}
                    disabled={disabled}
                    onChange={(e) => patchProfile({ doc: { ...profile.doc, elaborated_by: e.target.value } })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Aprobado por</Label>
                  <Input
                    value={profile.doc.approved_by}
                    disabled={disabled}
                    onChange={(e) => patchProfile({ doc: { ...profile.doc, approved_by: e.target.value } })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Estado del Perfil</Label>
                <Select value={status} onValueChange={setStatus} disabled={disabled}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFILE_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Sección 1: Información general */}
            <TabsContent value="s1" className="mt-0 space-y-4">
              <div className="grid gap-2">
                <Label>Nombre del Cargo</Label>
                <Input
                  value={name}
                  disabled={disabled}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Gerente de Talento Humano"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Área / Departamento</Label>
                  <Select value={departmentId} onValueChange={setDepartmentId} disabled={disabled}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Sin asignar</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Agencia</Label>
                  <Select value={agencyId} onValueChange={setAgencyId} disabled={disabled}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Sin agencia</SelectItem>
                      {agencies.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Nivel</Label>
                  <Select value={level} onValueChange={setLevel} disabled={disabled}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Sin definir</SelectItem>
                      {POSITION_LEVELS.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Reporta a (Jefe inmediato)</Label>
                  <Select value={reportsToId} onValueChange={setReportsToId} disabled={disabled}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Sin definir</SelectItem>
                      {reportsToOptions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Supervisa a (cargos subordinados)</Label>
                  <Input
                    value={profile.general.supervises}
                    disabled={disabled}
                    onChange={(e) =>
                      patchProfile({ general: { ...profile.general, supervises: e.target.value } })
                    }
                    placeholder="Ej. Generalista TH, Analista"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Personas a cargo (#)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={profile.general.people_in_charge}
                    disabled={disabled}
                    onChange={(e) =>
                      patchProfile({ general: { ...profile.general, people_in_charge: e.target.value } })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Áreas con las que interactúa</Label>
                {!disabled && (
                  <div className="flex gap-2">
                    <Input
                      value={interactInput}
                      onChange={(e) => setInteractInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                          e.preventDefault()
                          addInteract()
                        }
                      }}
                      placeholder="Escribe un área y presiona Enter"
                    />
                    <Button type="button" variant="outline" onClick={addInteract}>
                      Agregar
                    </Button>
                  </div>
                )}
                {profile.general.interacts_with.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {profile.general.interacts_with.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => removeInteract(tag)}
                            className="ml-1 rounded-full hover:text-destructive"
                            aria-label={`Quitar ${tag}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipo de Jornada</Label>
                  <Select value={jobType} onValueChange={setJobType} disabled={disabled}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Sin definir</SelectItem>
                      {JOB_TYPES.map((j) => (
                        <SelectItem key={j.value} value={j.value}>
                          {j.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Rango Salarial / Compensación</Label>
                  <Input
                    value={salaryRange}
                    disabled={disabled}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    placeholder="Ej. $18,000 - $24,000"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Horario Laboral</Label>
                <Input
                  value={workSchedule}
                  disabled={disabled}
                  onChange={(e) => setWorkSchedule(e.target.value)}
                  placeholder="Ej. Lunes a viernes 9:00 a.m. a 6:00 p.m."
                />
              </div>
            </TabsContent>

            {/* Sección 2: Objetivo */}
            <TabsContent value="s2" className="mt-0 space-y-2">
              <Label>Objetivo del Cargo</Label>
              <Textarea
                value={profile.objective}
                disabled={disabled}
                onChange={(e) => patchProfile({ objective: e.target.value })}
                placeholder="Describe el propósito principal del rol."
                rows={8}
              />
            </TabsContent>

            {/* Sección 3: Funciones */}
            <TabsContent value="s3" className="mt-0 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Funciones y responsabilidades del cargo.
                </p>
                {!disabled && (
                  <Button type="button" variant="outline" size="sm" onClick={addFunction}>
                    <Plus className="mr-1 h-4 w-4" />
                    Agregar función
                  </Button>
                )}
              </div>
              {profile.functions.length === 0 ? (
                <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                  No hay funciones registradas.
                </div>
              ) : (
                <div className="space-y-3">
                  {profile.functions.map((fn, index) => (
                    <div key={index} className="rounded-lg border p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Función {index + 1}
                        </span>
                        {!disabled && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => removeFunction(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-3">
                        <Textarea
                          value={fn.responsibility}
                          disabled={disabled}
                          onChange={(e) => updateFunction(index, { responsibility: e.target.value })}
                          placeholder="Responsabilidad / función principal"
                          rows={2}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Select
                            value={fn.periodicity}
                            onValueChange={(v) => updateFunction(index, { periodicity: v })}
                            disabled={disabled}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Periodicidad" />
                            </SelectTrigger>
                            <SelectContent>
                              {PERIODICITY_OPTIONS.map((p) => (
                                <SelectItem key={p} value={p}>
                                  {p}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            value={fn.reports}
                            disabled={disabled}
                            onChange={(e) => updateFunction(index, { reports: e.target.value })}
                            placeholder="Reportes y/o informes"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Sección 4: Requisitos */}
            <TabsContent value="s4" className="mt-0 space-y-4">
              <div className="grid gap-2">
                <Label>Formación Académica</Label>
                <Select
                  value={profile.requirements.academic_level || NONE}
                  onValueChange={(v) =>
                    patchProfile({
                      requirements: { ...profile.requirements, academic_level: v === NONE ? "" : v },
                    })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sin definir</SelectItem>
                    {ACADEMIC_LEVELS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Especialidad / Carreras afines</Label>
                <Input
                  value={profile.requirements.specialty}
                  disabled={disabled}
                  onChange={(e) =>
                    patchProfile({ requirements: { ...profile.requirements, specialty: e.target.value } })
                  }
                  placeholder="Ej. Psicología, Administración"
                />
              </div>
              <div className="grid gap-2">
                <Label>Experiencia Laboral requerida</Label>
                <Textarea
                  value={profile.requirements.experience}
                  disabled={disabled}
                  onChange={(e) =>
                    patchProfile({ requirements: { ...profile.requirements, experience: e.target.value } })
                  }
                  placeholder="Años y tipo de experiencia"
                  rows={2}
                />
              </div>
              <div className="grid gap-2">
                <Label>Otros Conocimientos / Herramientas</Label>
                <Textarea
                  value={profile.requirements.other_knowledge}
                  disabled={disabled}
                  onChange={(e) =>
                    patchProfile({
                      requirements: { ...profile.requirements, other_knowledge: e.target.value },
                    })
                  }
                  placeholder="Software, normativas, metodologías"
                  rows={2}
                />
              </div>
              <div className="grid gap-2">
                <Label>Idiomas y Nivel de dominio</Label>
                <Input
                  value={profile.requirements.languages}
                  disabled={disabled}
                  onChange={(e) =>
                    patchProfile({ requirements: { ...profile.requirements, languages: e.target.value } })
                  }
                  placeholder="Ej. Inglés B2"
                />
              </div>
            </TabsContent>

            {/* Sección 5: Competencias */}
            <TabsContent value="s5" className="mt-0 space-y-4">
              <div className="grid gap-2">
                <Label>Competencias Generales / Comportamentales</Label>
                <Textarea
                  value={profile.competencies.general}
                  disabled={disabled}
                  onChange={(e) =>
                    patchProfile({ competencies: { ...profile.competencies, general: e.target.value } })
                  }
                  placeholder="Liderazgo, trabajo en equipo, comunicación..."
                  rows={4}
                />
              </div>
              <div className="grid gap-2">
                <Label>Competencias Técnicas / Específicas</Label>
                <Textarea
                  value={profile.competencies.technical}
                  disabled={disabled}
                  onChange={(e) =>
                    patchProfile({ competencies: { ...profile.competencies, technical: e.target.value } })
                  }
                  placeholder="Gestión de nómina, análisis de datos, reclutamiento..."
                  rows={4}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {readOnly ? "Cerrar" : "Cancelar"}
          </Button>
          {!readOnly && (
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Spinner className="mr-2 h-4 w-4" />}
              Guardar Perfil
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
