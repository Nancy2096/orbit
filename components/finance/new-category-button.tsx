"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { FolderTree } from "lucide-react"

interface AgencyOption {
  id: string
  name: string
}

const expenseTypes = [
  { value: "fixed", label: "Fijo" },
  { value: "variable", label: "Variable" },
  { value: "operational", label: "Operativo" },
]

const emptyForm = {
  name: "",
  description: "",
  expense_type: "variable",
  agency_id: "",
}

/**
 * Botón + diálogo autónomo para crear una categoría de gastos.
 * Inserta en `expense_categories` (agency_id nulo = categoría global).
 * Se movió aquí desde la página de Gastos para vivir en el Dashboard Financiero.
 */
export function NewCategoryButton({ onCreated }: { onCreated?: () => void }) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [agencies, setAgencies] = useState<AgencyOption[]>([])
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (!open) return
    // Cargar agencias sólo al abrir el diálogo.
    supabase
      .from("agencies")
      .select("id, name")
      .order("name")
      .then(({ data }) => {
        if (data) setAgencies(data as AgencyOption[])
      })
  }, [open, supabase])

  const handleSave = async () => {
    if (!form.name) return
    setSaving(true)
    const { error } = await supabase.from("expense_categories").insert({
      name: form.name,
      description: form.description || null,
      expense_type: form.expense_type,
      agency_id: form.agency_id || null,
      is_active: true,
    })
    if (error) console.error("[v0] Error creating category:", error)
    setSaving(false)
    setOpen(false)
    setForm(emptyForm)
    onCreated?.()
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setForm(emptyForm)
          setOpen(true)
        }}
      >
        <FolderTree className="mr-2 h-4 w-4" />
        Nueva Categoría
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Categoría</DialogTitle>
            <DialogDescription>Crea una categoría para organizar tus gastos</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nombre de la categoría"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descripción de la categoría..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Gasto *</Label>
              <Select
                value={form.expense_type}
                onValueChange={(value) => setForm({ ...form, expense_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo de gasto" />
                </SelectTrigger>
                <SelectContent>
                  {expenseTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Agencia (opcional)</Label>
              <Select
                value={form.agency_id || "global"}
                onValueChange={(value) => setForm({ ...form, agency_id: value === "global" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Global (todas las agencias)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  {agencies.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id}>
                      {agency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>
              {saving && <Spinner className="mr-2 h-4 w-4" />}
              Crear Categoría
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
