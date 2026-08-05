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
  is_active: boolean
}

interface StaffMember {
  id: string
  first_name: string
  last_name: string
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
  const [managerStaffId, setManagerStaffId] = useState<string>("")
  const [savingManager, setSavingManager] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
    if (selectedAgencyId) {
      fetchManagerSettings()
      fetchStaff()
    } else {
      setStaff([])
      setManagerStaffId("")
    }
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
    const { data } = await supabase
      .from("staff")
      .select("id, first_name, last_name")
      .eq("agency_id", selectedAgencyId)
      .eq("is_active", true)
      .order("first_name")
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
        <DialogContent>
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

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="space-y-0.5">
                <Label htmlFor="requires_manager" className="flex items-center gap-2">
                  <UserCog className="h-4 w-4 text-blue-500" />
                  Requiere apoyo del gerente
                </Label>
                <p className="text-sm text-muted-foreground">
                  Esta tarea se asignará al gerente en lugar del asesor
                </p>
              </div>
              <Switch
                id="requires_manager"
                checked={formData.requires_manager}
                onCheckedChange={(checked) => setFormData({ ...formData, requires_manager: checked })}
              />
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
