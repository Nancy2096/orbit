"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { ArrowLeft, Plus, Search, MoreHorizontal, Pencil, Trash2, Tag, Building2 } from "lucide-react"

interface VendorType {
  id: string
  code: string
  name: string
  description: string | null
  is_active: boolean
  agency_id: string | null
  agency?: { name: string } | null
}

interface Agency {
  id: string
  name: string
}

export default function VendorTypesPage() {
  const [vendorTypes, setVendorTypes] = useState<VendorType[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [editingType, setEditingType] = useState<VendorType | null>(null)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    agency_id: "",
    is_active: true,
  })

  const supabase = createClient()

  useEffect(() => {
    fetchVendorTypes()
    fetchAgencies()
  }, [])

  async function fetchVendorTypes() {
    setLoading(true)
    const { data, error } = await supabase
      .from("vendor_types")
      .select(`
        id,
        code,
        name,
        description,
        is_active,
        agency_id,
        agencies(name)
      `)
      .order("name", { ascending: true })

    if (!error && data) {
      const mappedData = data.map((vt: Record<string, unknown>) => ({
        ...vt,
        agency: vt.agencies,
      }))
      setVendorTypes(mappedData as VendorType[])
    }
    setLoading(false)
  }

  async function fetchAgencies() {
    const { data } = await supabase
      .from("agencies")
      .select("id, name")
      .eq("is_active", true)
      .order("name")
    if (data) setAgencies(data)
  }

  function handleNew() {
    setEditingType(null)
    setFormData({
      code: "",
      name: "",
      description: "",
      agency_id: "",
      is_active: true,
    })
    setShowDialog(true)
  }

  function handleEdit(vendorType: VendorType) {
    setEditingType(vendorType)
    setFormData({
      code: vendorType.code,
      name: vendorType.name,
      description: vendorType.description || "",
      agency_id: vendorType.agency_id || "",
      is_active: vendorType.is_active,
    })
    setShowDialog(true)
  }

  async function handleSave() {
    if (!formData.code.trim() || !formData.name.trim()) return

    setSaving(true)

    if (editingType) {
      const { error } = await supabase
        .from("vendor_types")
        .update({
          code: formData.code,
          name: formData.name,
          description: formData.description || null,
          agency_id: formData.agency_id || null,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingType.id)

      if (!error) {
        await fetchVendorTypes()
        setShowDialog(false)
      }
    } else {
      const { error } = await supabase
        .from("vendor_types")
        .insert({
          code: formData.code,
          name: formData.name,
          description: formData.description || null,
          agency_id: formData.agency_id || null,
          is_active: formData.is_active,
        })

      if (!error) {
        await fetchVendorTypes()
        setShowDialog(false)
      }
    }

    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    
    const { error } = await supabase.from("vendor_types").delete().eq("id", deleteId)
    
    if (!error) {
      setVendorTypes(vendorTypes.filter((vt) => vt.id !== deleteId))
    }
    
    setDeleting(false)
    setDeleteId(null)
  }

  const filteredTypes = useMemo(() => {
    return vendorTypes.filter((vt) => {
      const matchesSearch =
        !search ||
        vt.name.toLowerCase().includes(search.toLowerCase()) ||
        vt.code.toLowerCase().includes(search.toLowerCase()) ||
        vt.description?.toLowerCase().includes(search.toLowerCase())
      return matchesSearch
    })
  }, [vendorTypes, search])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/vendors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tipos de Proveedores</h1>
            <p className="text-muted-foreground">Administra el catálogo de tipos de proveedores</p>
          </div>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Tipo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Tipos</CardTitle>
          <CardDescription>
            {filteredTypes.length} tipo{filteredTypes.length !== 1 ? "s" : ""} de proveedor encontrado{filteredTypes.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar tipos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="h-8 w-8" />
              </div>
            ) : filteredTypes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Tag className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No hay tipos de proveedores</h3>
                <p className="text-muted-foreground mb-4">
                  {search ? "No se encontraron tipos con ese criterio" : "Comienza creando tu primer tipo"}
                </p>
                {!search && (
                  <Button onClick={handleNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Tipo
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Agencia</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTypes.map((vendorType) => (
                      <TableRow key={vendorType.id}>
                        <TableCell className="font-mono font-medium">{vendorType.code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{vendorType.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">
                          {vendorType.description || "-"}
                        </TableCell>
                        <TableCell>
                          {vendorType.agency ? (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {vendorType.agency.name}
                            </span>
                          ) : (
                            <Badge variant="outline">Global</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={vendorType.is_active ? "default" : "secondary"}>
                            {vendorType.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(vendorType)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteId(vendorType.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingType ? "Editar Tipo de Proveedor" : "Nuevo Tipo de Proveedor"}</DialogTitle>
            <DialogDescription>
              {editingType
                ? "Modifica los datos del tipo de proveedor"
                : "Completa los datos para crear un nuevo tipo"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ej: freelancer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Freelancer"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del tipo de proveedor..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agency_id">Agencia (opcional)</Label>
              <Select
                value={formData.agency_id || "global"}
                onValueChange={(value) => setFormData({ ...formData, agency_id: value === "global" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Global (todas las agencias)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global (todas las agencias)</SelectItem>
                  {agencies.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Activo</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.code.trim() || !formData.name.trim()}>
              {saving && <Spinner className="mr-2 h-4 w-4" />}
              {editingType ? "Guardar Cambios" : "Crear Tipo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar tipo de proveedor</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El tipo será eliminado permanentemente.
              Los proveedores que usen este tipo quedarán sin tipo asignado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Spinner className="h-4 w-4 mr-2" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
