"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import { Spinner } from "@/components/ui/spinner"
import type { Agency, Department, StaffMini } from "./types"

interface DepartmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  department: Department | null
  agencies: Agency[]
  staff: StaffMini[]
  onSaved: () => void
}

const NONE = "__none__"

export function DepartmentDialog({
  open,
  onOpenChange,
  department,
  agencies,
  staff,
  onSaved,
}: DepartmentDialogProps) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [costCenter, setCostCenter] = useState("")
  const [description, setDescription] = useState("")
  const [agencyId, setAgencyId] = useState<string>(NONE)
  const [leaderId, setLeaderId] = useState<string>(NONE)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (open) {
      setName(department?.name ?? "")
      setCode(department?.code ?? "")
      setCostCenter(department?.cost_center ?? "")
      setDescription(department?.description ?? "")
      setAgencyId(department?.agency_id ?? NONE)
      setLeaderId(department?.leader_staff_id ?? NONE)
      setIsActive(department?.is_active ?? true)
    }
  }, [open, department])

  async function handleSave() {
    if (!name.trim()) {
      toast.error("El nombre del departamento es obligatorio")
      return
    }
    setSaving(true)
    const payload = {
      name: name.trim(),
      code: code.trim() || null,
      cost_center: costCenter.trim() || null,
      description: description.trim() || null,
      agency_id: agencyId === NONE ? null : agencyId,
      leader_staff_id: leaderId === NONE ? null : leaderId,
      is_active: isActive,
    }

    const { error } = department
      ? await supabase.from("departments").update(payload).eq("id", department.id)
      : await supabase.from("departments").insert(payload)

    setSaving(false)
    if (error) {
      toast.error("No se pudo guardar el departamento", { description: error.message })
      return
    }
    toast.success(department ? "Departamento actualizado" : "Departamento creado")
    onOpenChange(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{department ? "Editar Departamento" : "Crear Departamento"}</DialogTitle>
          <DialogDescription>
            Define la información general del departamento y su responsable.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="dept-name">Nombre del Departamento</Label>
            <Input
              id="dept-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Talento Humano"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dept-code">Código</Label>
              <Input
                id="dept-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ej. TH"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dept-cc">Centro de Costos</Label>
              <Input
                id="dept-cc"
                value={costCenter}
                onChange={(e) => setCostCenter(e.target.value)}
                placeholder="Ej. CC-100"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Agencia</Label>
            <Select value={agencyId} onValueChange={setAgencyId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una agencia" />
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

          <div className="grid gap-2">
            <Label>Líder / Gerente responsable</Label>
            <Select value={leaderId} onValueChange={setLeaderId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un responsable" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sin asignar</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.first_name} {s.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dept-desc">Descripción</Label>
            <Textarea
              id="dept-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Propósito del departamento"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Departamento activo</p>
              <p className="text-xs text-muted-foreground">
                Los inactivos no aparecen en asignaciones nuevas.
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Spinner className="mr-2 h-4 w-4" />}
            {department ? "Guardar cambios" : "Crear Departamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
