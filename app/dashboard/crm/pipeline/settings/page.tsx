"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
  Settings2,
  Trophy,
  XCircle,
  ArrowUp,
  ArrowDown
} from "lucide-react"

interface PipelineStage {
  id: string
  name: string
  color: string | null
  sort_order: number
  is_won: boolean
  is_lost: boolean
  is_active: boolean
}

const STAGE_COLORS = [
  { name: "Gris", value: "#6b7280" },
  { name: "Azul", value: "#3b82f6" },
  { name: "Verde", value: "#22c55e" },
  { name: "Amarillo", value: "#eab308" },
  { name: "Naranja", value: "#f97316" },
  { name: "Rojo", value: "#ef4444" },
  { name: "Morado", value: "#a855f7" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Cyan", value: "#06b6d4" },
]

export default function PipelineSettingsPage() {
  const { selectedAgencyId, selectedAgency, loading: agencyLoading } = useAgency()
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null)
  const [stageToDelete, setStageToDelete] = useState<PipelineStage | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    color: "#3b82f6",
    is_won: false,
    is_lost: false,
  })
  const supabase = createClient()

  useEffect(() => {
    if (selectedAgencyId) {
      fetchStages()
    } else {
      setLoading(false)
      setStages([])
    }
  }, [selectedAgencyId])

  async function fetchStages() {
    setLoading(true)
    const { data, error } = await supabase
      .from("crm_pipeline_stages")
      .select("*")
      .eq("agency_id", selectedAgencyId)
      .order("sort_order", { ascending: true })

    if (error) {
      console.error("Error fetching stages:", error)
      toast.error("Error al cargar las etapas")
    } else {
      setStages(data || [])
    }
    setLoading(false)
  }

  function openCreateDialog() {
    setEditingStage(null)
    setFormData({
      name: "",
      color: "#3b82f6",
      is_won: false,
      is_lost: false,
    })
    setDialogOpen(true)
  }

  function openEditDialog(stage: PipelineStage) {
    setEditingStage(stage)
    setFormData({
      name: stage.name,
      color: stage.color || "#3b82f6",
      is_won: stage.is_won,
      is_lost: stage.is_lost,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast.error("El nombre es requerido")
      return
    }

    if (formData.is_won && formData.is_lost) {
      toast.error("Una etapa no puede ser ganada y perdida al mismo tiempo")
      return
    }

    setSaving(true)

    try {
      if (editingStage) {
        // Update existing stage
        const { error } = await supabase
          .from("crm_pipeline_stages")
          .update({
            name: formData.name,
            color: formData.color,
            is_won: formData.is_won,
            is_lost: formData.is_lost,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingStage.id)

        if (error) throw error
        toast.success("Etapa actualizada correctamente")
      } else {
        // Create new stage
        const maxOrder = stages.length > 0 ? Math.max(...stages.map(s => s.sort_order)) : 0
        
        const { error } = await supabase
          .from("crm_pipeline_stages")
          .insert({
            agency_id: selectedAgencyId,
            name: formData.name,
            color: formData.color,
            sort_order: maxOrder + 1,
            is_won: formData.is_won,
            is_lost: formData.is_lost,
            is_active: true,
          })

        if (error) throw error
        toast.success("Etapa creada correctamente")
      }

      setDialogOpen(false)
      fetchStages()
    } catch (error) {
      console.error("Error saving stage:", error)
      toast.error("Error al guardar la etapa")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!stageToDelete) return

    try {
      const { error } = await supabase
        .from("crm_pipeline_stages")
        .delete()
        .eq("id", stageToDelete.id)

      if (error) throw error
      
      toast.success("Etapa eliminada correctamente")
      setDeleteDialogOpen(false)
      setStageToDelete(null)
      fetchStages()
    } catch (error) {
      console.error("Error deleting stage:", error)
      toast.error("Error al eliminar la etapa. Puede que tenga prospectos asociados.")
    }
  }

  async function moveStage(stage: PipelineStage, direction: "up" | "down") {
    const currentIndex = stages.findIndex(s => s.id === stage.id)
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1

    if (newIndex < 0 || newIndex >= stages.length) return

    const otherStage = stages[newIndex]
    
    try {
      // Swap sort_order values
      await Promise.all([
        supabase
          .from("crm_pipeline_stages")
          .update({ sort_order: otherStage.sort_order })
          .eq("id", stage.id),
        supabase
          .from("crm_pipeline_stages")
          .update({ sort_order: stage.sort_order })
          .eq("id", otherStage.id),
      ])

      fetchStages()
    } catch (error) {
      console.error("Error moving stage:", error)
      toast.error("Error al reordenar la etapa")
    }
  }

  async function toggleStageActive(stage: PipelineStage) {
    try {
      const { error } = await supabase
        .from("crm_pipeline_stages")
        .update({ 
          is_active: !stage.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", stage.id)

      if (error) throw error
      
      toast.success(stage.is_active ? "Etapa desactivada" : "Etapa activada")
      fetchStages()
    } catch (error) {
      console.error("Error toggling stage:", error)
      toast.error("Error al cambiar el estado de la etapa")
    }
  }

  if (agencyLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!selectedAgencyId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Settings2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Selecciona una Agencia</h2>
        <p className="text-muted-foreground max-w-md">
          Para configurar las etapas del pipeline, primero selecciona una agencia en el selector de arriba.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/crm/pipeline">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configuracion del Pipeline</h1>
            <p className="text-muted-foreground">
              Define las etapas del proceso comercial para {selectedAgency?.name}
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Etapa
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : stages.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty>
              <EmptyMedia>
                <Settings2 className="h-12 w-12" />
              </EmptyMedia>
              <EmptyTitle>No hay etapas configuradas</EmptyTitle>
              <EmptyDescription>
                Crea las etapas del pipeline para organizar tus prospectos
              </EmptyDescription>
              <Button onClick={openCreateDialog} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Crear Primera Etapa
              </Button>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Etapas del Pipeline</CardTitle>
            <CardDescription>
              Arrastra las etapas para reordenarlas o usa las flechas para cambiar el orden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stages.map((stage, index) => (
                <div
                  key={stage.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${
                    stage.is_active ? "bg-background" : "bg-muted/50 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GripVertical className="h-5 w-5" />
                    <span className="text-sm font-mono w-6">{index + 1}</span>
                  </div>
                  
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: stage.color || "#6b7280" }}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{stage.name}</span>
                      {stage.is_won && (
                        <Badge variant="default" className="bg-green-500 text-white">
                          <Trophy className="h-3 w-3 mr-1" />
                          Ganado
                        </Badge>
                      )}
                      {stage.is_lost && (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Perdido
                        </Badge>
                      )}
                      {!stage.is_active && (
                        <Badge variant="secondary">Inactiva</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveStage(stage, "up")}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveStage(stage, "down")}
                      disabled={index === stages.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={stage.is_active}
                      onCheckedChange={() => toggleStageActive(stage)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(stage)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setStageToDelete(stage)
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

      {/* Dialog para crear/editar etapa */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStage ? "Editar Etapa" : "Nueva Etapa"}
            </DialogTitle>
            <DialogDescription>
              {editingStage 
                ? "Modifica los detalles de la etapa del pipeline"
                : "Crea una nueva etapa para el pipeline de ventas"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la etapa *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Contacto Inicial, Propuesta Enviada..."
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {STAGE_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color.value 
                        ? "border-foreground scale-110" 
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Marca una etapa como final para indicar el resultado del proceso:
              </p>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_won" className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-green-500" />
                    Etapa Ganada
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Los prospectos en esta etapa se consideran clientes ganados
                  </p>
                </div>
                <Switch
                  id="is_won"
                  checked={formData.is_won}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    is_won: checked,
                    is_lost: checked ? false : formData.is_lost
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_lost" className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    Etapa Perdida
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Los prospectos en esta etapa se consideran oportunidades perdidas
                  </p>
                </div>
                <Switch
                  id="is_lost"
                  checked={formData.is_lost}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    is_lost: checked,
                    is_won: checked ? false : formData.is_won
                  })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Spinner className="mr-2 h-4 w-4" />}
              {editingStage ? "Guardar Cambios" : "Crear Etapa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmacion de eliminacion */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Etapa</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estas seguro de eliminar la etapa "{stageToDelete?.name}"? 
              Esta accion no se puede deshacer. Los prospectos en esta etapa 
              quedaran sin etapa asignada.
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
