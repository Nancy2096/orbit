"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { FolderTree, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react"

interface AgencyOption {
  id: string
  name: string
}

interface CategoryRow {
  id: string
  name: string
  description: string | null
  expense_type: string
  agency_id: string | null
  is_active: boolean
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
 * Botón + diálogo autónomo para gestionar categorías de gastos desde el
 * Dashboard Financiero. Muestra las categorías registradas y permite crear,
 * editar y eliminar. Opera sobre `expense_categories` (agency_id nulo = global).
 */
export function NewCategoryButton({ onCreated }: { onCreated?: () => void }) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [agencies, setAgencies] = useState<AgencyOption[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [form, setForm] = useState(emptyForm)
  // Vista del diálogo: "list" (categorías registradas) o "form" (crear/editar).
  const [view, setView] = useState<"list" | "form">("list")
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("expense_categories")
      .select("id, name, description, expense_type, agency_id, is_active")
      .order("name")
    if (error) console.error("[v0] Error loading categories:", error)
    setCategories((data as CategoryRow[]) || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    if (!open) return
    // Cargar agencias y categorías al abrir el diálogo.
    supabase
      .from("agencies")
      .select("id, name")
      .order("name")
      .then(({ data }) => {
        if (data) setAgencies(data as AgencyOption[])
      })
    fetchCategories()
  }, [open, supabase, fetchCategories])

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setView("form")
  }

  const openEdit = (category: CategoryRow) => {
    setForm({
      name: category.name,
      description: category.description || "",
      expense_type: category.expense_type,
      agency_id: category.agency_id || "",
    })
    setEditingId(category.id)
    setView("form")
  }

  const handleSave = async () => {
    if (!form.name) return
    setSaving(true)
    const payload = {
      name: form.name,
      description: form.description || null,
      expense_type: form.expense_type,
      agency_id: form.agency_id || null,
    }
    const { error } = editingId
      ? await supabase.from("expense_categories").update(payload).eq("id", editingId)
      : await supabase.from("expense_categories").insert({ ...payload, is_active: true })
    if (error) console.error("[v0] Error saving category:", error)
    setSaving(false)
    setForm(emptyForm)
    setEditingId(null)
    setView("list")
    await fetchCategories()
    onCreated?.()
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("expense_categories").delete().eq("id", id)
    if (error) console.error("[v0] Error deleting category:", error)
    await fetchCategories()
    onCreated?.()
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setView("list")
          setOpen(true)
        }}
      >
        <FolderTree className="mr-2 h-4 w-4" />
        Categorías
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          {view === "list" ? (
            <>
              <DialogHeader>
                <DialogTitle>Categorías</DialogTitle>
                <DialogDescription>Categorías registradas para organizar tus gastos</DialogDescription>
              </DialogHeader>

              <div className="flex justify-end">
                <Button size="sm" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Categoría
                </Button>
              </div>

              <div className="max-h-[55vh] overflow-y-auto rounded-lg border">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner className="h-6 w-6" />
                  </div>
                ) : categories.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FolderTree className="h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="font-medium">No hay categorías</p>
                    <p className="text-sm text-muted-foreground mt-1">Crea una categoría para empezar</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="w-[90px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell className="text-muted-foreground">{category.description || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {expenseTypes.find((t) => t.value === category.expense_type)?.label ||
                                category.expense_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
                <DialogDescription>
                  {editingId
                    ? "Modifica los datos de la categoría"
                    : "Crea una categoría para organizar tus gastos"}
                </DialogDescription>
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
                <Button variant="outline" onClick={() => setView("list")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver
                </Button>
                <Button onClick={handleSave} disabled={saving || !form.name}>
                  {saving && <Spinner className="mr-2 h-4 w-4" />}
                  {editingId ? "Guardar Cambios" : "Crear Categoría"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
