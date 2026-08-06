"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { toast } from "sonner"
import { useAgency } from "@/contexts/agency-context"
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ListChecks,
  ArrowUp,
  ArrowDown,
  UserCog,
  Clock,
  MessageSquareText,
} from "lucide-react"

interface TaskTemplate {
  id: string
  title: string
  description: string | null
  task_type: string
  priority: string | null
  order_index: number
  offset_days: number
  offset_minutes: number
  requires_manager: boolean
  requires_director: boolean
  manager_staff_id: string | null
  director_staff_id: string | null
  is_active: boolean
  whatsapp_message: string | null
  email_subject: string | null
  email_message: string | null
}

interface StaffMember {
  id: string
  first_name: string
  last_name: string
  position: string | null
  is_global: boolean | null
}

// Puestos de mayor jerarquía elegibles como Director General.
// Se detectan por palabra clave para no depender de un texto exacto.
const LEADERSHIP_KEYWORDS = ["director", "directora"]

function isLeadershipPosition(position: string | null): boolean {
  if (!position) return false
  const p = position.toLowerCase()
  return LEADERSHIP_KEYWORDS.some((kw) => p.includes(kw))
}

const TASK_TYPES = [
  { value: "call", label: "Llamada" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Reunión" },
  { value: "follow_up", label: "Seguimiento" },
  { value: "presentation", label: "Presentación" },
  { value: "negotiation", label: "Negociación" },
  { value: "other", label: "Otro" },
]

const PRIORITIES = [
  { value: "high", label: "Alta" },
  { value: "medium", label: "Media" },
  { value: "low", label: "Baja" },
]

const emptyForm = {
  title: "",
  description: "",
  task_type: "call",
  priority: "medium",
  offset_days: 0,
  offset_minutes: 0,
  requires_manager: false,
  requires_director: false,
  manager_staff_id: "",
  director_staff_id: "",
  whatsapp_message: "",
  email_subject: "",
  email_message: "",
}

export default function TaskSettingsPage() {
  const { selectedAgencyId, selectedAgency } = useAgency()
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TaskTemplate | null>(null)
  const [toDelete, setToDelete] = useState<TaskTemplate | null>(null)
  const [formData, setFormData] = useState(emptyForm)

  // Gerente por agencia
  const [staff, setStaff] = useState<StaffMember[]>([])

  // Para el Director General solo se ofrecen los puestos de mayor jerarquía
  // (directores). El personal global ya viene incluido desde fetchStaff. Se
  // conserva visible el director ya seleccionado aunque no cumpla el filtro.
  const directorStaff = staff.filter(
    (s) => isLeadershipPosition(s.position) || s.id === formData.director_staff_id,
  )
  const [managerStaffId, setManagerStaffId] = useState<string>("")
  const [savingManager, setSavingManager] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchTemplates()
    fetchStaff()
  }, [])

  useEffect(() => {
    if (selectedAgencyId) {
      fetchManagerSettings()
    } else {
      setManagerStaffId("")
    }
    fetchStaff()
  }, [selectedAgencyId])

  async function fetchTemplates() {
    setLoading(true)
    const { data, error } = await supabase
      .from("crm_task_templates")
      .select("*")
      .order("order_index", { ascending: true })

    if (error) {
      console.error("Error fetching task templates:", error)
      toast.error("Error al cargar las tareas predefinidas")
    } else {
      setTemplates(data || [])
    }
    setLoading(false)
  }

  async function fetchStaff() {
    // Las plantillas son globales, así que el personal disponible para asignar
    // gerente/director se filtra por agencia solo cuando hay una seleccionada.
    // Siempre se incluye al personal global (is_global) y al asignado a la
    // agencia vía agency_ids, para que aparezcan puestos como el Director General.
    let query = supabase
      .from("staff")
      .select("id, first_name, last_name, position, is_global")
      .eq("is_active", true)
      .order("first_name")
    if (selectedAgencyId) {
      query = query.or(
        `agency_id.eq.${selectedAgencyId},is_global.eq.true,agency_ids.cs.{${selectedAgencyId}}`,
      )
    }
    const { data } = await query
    setStaff(data || [])
  }

  async function fetchManagerSettings() {
    const { data } = await supabase
      .from("crm_task_manager_settings")
      .select("manager_staff_id")
      .eq("agency_id", selectedAgencyId)
      .maybeSingle()
    setManagerStaffId(data?.manager_staff_id || "")
  }

  async function saveManager(staffId: string) {
    if (!selectedAgencyId) return
    setSavingManager(true)
    setManagerStaffId(staffId)
    const { error } = await supabase.from("crm_task_manager_settings").upsert(
      {
        agency_id: selectedAgencyId,
        manager_staff_id: staffId || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "agency_id" },
    )
    if (error) {
      console.error("Error saving manager:", error)
      toast.error("Error al guardar el gerente")
    } else {
      toast.success("Gerente actualizado")
    }
    setSavingManager(false)
  }

  function openCreateDialog() {
    setEditing(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  function openEditDialog(tpl: TaskTemplate) {
    setEditing(tpl)
    setFormData({
      title: tpl.title,
      description: tpl.description || "",
      task_type: tpl.task_type,
      priority: tpl.priority || "medium",
      offset_days: tpl.offset_days,
      offset_minutes: tpl.offset_minutes,
      requires_manager: tpl.requires_manager,
      requires_director: tpl.requires_director ?? false,
      manager_staff_id: tpl.manager_staff_id || "",
      director_staff_id: tpl.director_staff_id || "",
      whatsapp_message: tpl.whatsapp_message || "",
      email_subject: tpl.email_subject || "",
      email_message: tpl.email_message || "",
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!formData.title.trim()) {
      toast.error("El título es requerido")
      return
    }
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase
          .from("crm_task_templates")
          .update({
            title: formData.title,
            description: formData.description || null,
            task_type: formData.task_type,
            priority: formData.priority,
            offset_days: formData.offset_days,
            offset_minutes: formData.offset_minutes,
            requires_manager: formData.requires_manager,
            requires_director: formData.requires_director,
            manager_staff_id: formData.requires_manager ? formData.manager_staff_id || null : null,
            director_staff_id: formData.requires_director ? formData.director_staff_id || null : null,
            whatsapp_message: formData.whatsapp_message || null,
            email_subject: formData.email_subject || null,
            email_message: formData.email_message || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editing.id)
        if (error) throw error
        toast.success("Tarea predefinida actualizada")
      } else {
        const maxOrder = templates.length > 0 ? Math.max(...templates.map((t) => t.order_index)) : 0
        const { error } = await supabase.from("crm_task_templates").insert({
          title: formData.title,
          description: formData.description || null,
          task_type: formData.task_type,
          priority: formData.priority,
          offset_days: formData.offset_days,
          offset_minutes: formData.offset_minutes,
          requires_manager: formData.requires_manager,
          requires_director: formData.requires_director,
          manager_staff_id: formData.requires_manager ? formData.manager_staff_id || null : null,
          director_staff_id: formData.requires_director ? formData.director_staff_id || null : null,
          whatsapp_message: formData.whatsapp_message || null,
          email_subject: formData.email_subject || null,
          email_message: formData.email_message || null,
          order_index: maxOrder + 1,
          is_active: true,
        })
        if (error) throw error
        toast.success("Tarea predefinida creada")
      }
      setDialogOpen(false)
      fetchTemplates()
    } catch (error) {
      console.error("Error saving template:", error)
      toast.error("Error al guardar la tarea predefinida")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!toDelete) return
    try {
      const { error } = await supabase.from("crm_task_templates").delete().eq("id", toDelete.id)
      if (error) throw error
      toast.success("Tarea predefinida eliminada")
      setDeleteDialogOpen(false)
      setToDelete(null)
      fetchTemplates()
    } catch (error) {
      console.error("Error deleting template:", error)
      toast.error("Error al eliminar la tarea predefinida")
    }
  }

  async function moveTemplate(tpl: TaskTemplate, direction: "up" | "down") {
    const currentIndex = templates.findIndex((t) => t.id === tpl.id)
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= templates.length) return
    const other = templates[newIndex]
    try {
      await Promise.all([
        supabase.from("crm_task_templates").update({ order_index: other.order_index }).eq("id", tpl.id),
        supabase.from("crm_task_templates").update({ order_index: tpl.order_index }).eq("id", other.id),
      ])
      fetchTemplates()
    } catch (error) {
      console.error("Error moving template:", error)
      toast.error("Error al reordenar la tarea")
    }
  }

  async function toggleActive(tpl: TaskTemplate) {
    try {
      const { error } = await supabase
        .from("crm_task_templates")
        .update({ is_active: !tpl.is_active, updated_at: new Date().toISOString() })
        .eq("id", tpl.id)
      if (error) throw error
      toast.success(tpl.is_active ? "Tarea desactivada" : "Tarea activada")
      fetchTemplates()
    } catch (error) {
      console.error("Error toggling template:", error)
      toast.error("Error al cambiar el estado")
    }
  }

  const offsetLabel = (days: number, minutes: number) => {
    if (days === 0 && minutes === 0) return "Al registrar el prospecto"
    const parts: string[] = []
    if (days > 0) parts.push(`${days} día${days === 1 ? "" : "s"}`)
    if (minutes > 0) parts.push(`${minutes} min`)
    return `${parts.join(" y ")} después del registro`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/crm">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ajustar Tareas</h1>
            <p className="text-muted-foreground text-pretty">
              Define las tareas predefinidas y el orden en que cada asesor debe realizarlas en sus prospectos
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Tarea
        </Button>
      </div>

      {/* Gerente por agencia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCog className="h-4 w-4" />
            Gerente para tareas de apoyo
          </CardTitle>
          <CardDescription>
            Las tareas marcadas como &quot;Requiere apoyo del gerente&quot; se asignarán a esta persona
            {selectedAgency ? ` en ${selectedAgency.name}` : ""}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedAgencyId ? (
            <p className="text-sm text-muted-foreground">
              Selecciona una agencia en el selector superior para asignar su gerente.
            </p>
          ) : (
            <div className="flex items-center gap-3 max-w-md">
              <Select value={managerStaffId} onValueChange={saveManager} disabled={savingManager}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un gerente" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {`${s.first_name} ${s.last_name}`.trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {savingManager && <Spinner className="h-4 w-4" />}
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty>
              <EmptyMedia>
                <ListChecks className="h-12 w-12" />
              </EmptyMedia>
              <EmptyTitle>No hay tareas predefinidas</EmptyTitle>
              <EmptyDescription>
                Crea las tareas que se cargarán automáticamente en cada prospecto nuevo
              </EmptyDescription>
              <Button onClick={openCreateDialog} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Crear Primera Tarea
              </Button>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Tareas Predefinidas</CardTitle>
            <CardDescription>
              Se cargan automáticamente, en este orden, en cada prospecto nuevo. Usa las flechas para reordenarlas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {templates.map((tpl, index) => (
                <div
                  key={tpl.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${
                    tpl.is_active ? "bg-background" : "bg-muted/50 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GripVertical className="h-5 w-5" />
                    <span className="text-sm font-mono w-6">{index + 1}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium truncate">{tpl.title}</span>
                      <Badge variant="secondary">
                        {TASK_TYPES.find((t) => t.value === tpl.task_type)?.label || tpl.task_type}
                      </Badge>
                      {tpl.requires_manager && (
                        <Badge className="bg-blue-500 text-white">
                          <UserCog className="h-3 w-3 mr-1" />
                          Gerente
                        </Badge>
                      )}
                      {tpl.requires_director && (
                        <Badge className="bg-purple-500 text-white">
                          <UserCog className="h-3 w-3 mr-1" />
                          Director
                        </Badge>
                      )}
                      {!tpl.is_active && <Badge variant="outline">Inactiva</Badge>}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {offsetLabel(tpl.offset_days, tpl.offset_minutes)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveTemplate(tpl, "up")}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveTemplate(tpl, "down")}
                      disabled={index === templates.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch checked={tpl.is_active} onCheckedChange={() => toggleActive(tpl)} />
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(tpl)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setToDelete(tpl)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog crear/editar tarea predefinida */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Tarea Predefinida" : "Nueva Tarea Predefinida"}</DialogTitle>
            <DialogDescription>
              Configura la tarea y cuándo debe realizarse respecto al registro del prospecto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Primera llamada de contacto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Instrucciones para el asesor..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de tarea</Label>
                <Select
                  value={formData.task_type}
                  onValueChange={(v) => setFormData({ ...formData, task_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t">
              <Label className="flex items-center gap-2">
                <MessageSquareText className="h-4 w-4 text-emerald-600" />
                Mensaje de la tarea
              </Label>

              <div className="space-y-2">
                <Label htmlFor="whatsapp_message" className="text-xs text-muted-foreground">
                  Mensaje de WhatsApp
                </Label>
                <Textarea
                  id="whatsapp_message"
                  value={formData.whatsapp_message}
                  onChange={(e) => setFormData({ ...formData, whatsapp_message: e.target.value })}
                  placeholder="Escribe el mensaje que el asesor enviará por WhatsApp..."
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_subject" className="text-xs text-muted-foreground">
                  Asunto del correo
                </Label>
                <Input
                  id="email_subject"
                  value={formData.email_subject}
                  onChange={(e) => setFormData({ ...formData, email_subject: e.target.value })}
                  placeholder="Ej: Seguimiento a tu solicitud"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_message" className="text-xs text-muted-foreground">
                  Cuerpo del correo
                </Label>
                <Textarea
                  id="email_message"
                  value={formData.email_message}
                  onChange={(e) => setFormData({ ...formData, email_message: e.target.value })}
                  placeholder="Escribe el contenido del correo electrónico..."
                  rows={6}
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                ¿Cuándo debe realizarse? (respecto al registro del prospecto)
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="offset_days" className="text-xs text-muted-foreground">
                    Días después
                  </Label>
                  <Input
                    id="offset_days"
                    type="number"
                    min={0}
                    value={formData.offset_days}
                    onChange={(e) =>
                      setFormData({ ...formData, offset_days: Math.max(0, parseInt(e.target.value) || 0) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offset_minutes" className="text-xs text-muted-foreground">
                    Minutos después
                  </Label>
                  <Input
                    id="offset_minutes"
                    type="number"
                    min={0}
                    value={formData.offset_minutes}
                    onChange={(e) =>
                      setFormData({ ...formData, offset_minutes: Math.max(0, parseInt(e.target.value) || 0) })
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{offsetLabel(formData.offset_days, formData.offset_minutes)}</p>
            </div>

            {/* Apoyo del gerente comercial */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="requires_manager" className="flex items-center gap-2">
                    <UserCog className="h-4 w-4 text-blue-500" />
                    Requiere apoyo del gerente
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Se generará una tarea para el gerente comercial seleccionado
                  </p>
                </div>
                <Switch
                  id="requires_manager"
                  checked={formData.requires_manager}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      requires_manager: checked,
                      manager_staff_id: checked ? formData.manager_staff_id : "",
                    })
                  }
                />
              </div>
              {formData.requires_manager && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="manager_staff_id" className="text-xs text-muted-foreground">
                    Gerente comercial
                  </Label>
                  <Select
                    value={formData.manager_staff_id}
                    onValueChange={(value) => setFormData({ ...formData, manager_staff_id: value })}
                  >
                    <SelectTrigger id="manager_staff_id">
                      <SelectValue placeholder="Selecciona un gerente" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.first_name} {s.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {staff.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No hay personal disponible{selectedAgency ? ` en ${selectedAgency.name}` : ""}.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Apoyo del director general */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="requires_director" className="flex items-center gap-2">
                    <UserCog className="h-4 w-4 text-purple-500" />
                    Requiere apoyo del Director General
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Se generará una tarea pendiente para el director general seleccionado
                  </p>
                </div>
                <Switch
                  id="requires_director"
                  checked={formData.requires_director}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      requires_director: checked,
                      director_staff_id: checked ? formData.director_staff_id : "",
                    })
                  }
                />
              </div>
              {formData.requires_director && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="director_staff_id" className="text-xs text-muted-foreground">
                    Director General
                  </Label>
                  <Select
                    value={formData.director_staff_id}
                    onValueChange={(value) => setFormData({ ...formData, director_staff_id: value })}
                  >
                    <SelectTrigger id="director_staff_id">
                      <SelectValue placeholder="Selecciona un director" />
                    </SelectTrigger>
                    <SelectContent>
                      {directorStaff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.first_name} {s.last_name}
                          {s.position ? ` — ${s.position}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {directorStaff.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No hay puestos de dirección disponibles{selectedAgency ? ` en ${selectedAgency.name}` : ""}.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Spinner className="mr-2 h-4 w-4" />}
              {editing ? "Guardar Cambios" : "Crear Tarea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Tarea Predefinida</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que deseas eliminar &quot;{toDelete?.title}&quot;? Esto no afecta las tareas ya creadas en
              prospectos, solo dejará de cargarse en nuevos prospectos.
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
