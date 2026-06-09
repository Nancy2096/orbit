"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Truck, Filter, Settings2, Building2, Phone, Mail, X, Tag } from "lucide-react"
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

interface Vendor {
  id: string
  name: string
  legal_name: string | null
  tax_id: string | null
  vendor_type: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  city: string | null
  is_active: boolean
  agency: { name: string } | null
}

const vendorTypeLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  general: { label: "General", variant: "secondary" },
  freelancer: { label: "Freelancer", variant: "default" },
  contractor: { label: "Contratista", variant: "default" },
  supplier: { label: "Proveedor", variant: "secondary" },
  service_provider: { label: "Servicios", variant: "outline" },
  media: { label: "Medios", variant: "default" },
  technology: { label: "Tecnología", variant: "default" },
  other: { label: "Otro", variant: "secondary" },
}

type ColumnKey = "name" | "legal_name" | "tax_id" | "vendor_type" | "contact" | "phone" | "email" | "city" | "agency" | "status"

const allColumns: { key: ColumnKey; label: string }[] = [
  { key: "name", label: "Nombre" },
  { key: "legal_name", label: "Razón Social" },
  { key: "tax_id", label: "RFC" },
  { key: "vendor_type", label: "Tipo" },
  { key: "contact", label: "Contacto" },
  { key: "phone", label: "Teléfono" },
  { key: "email", label: "Email" },
  { key: "city", label: "Ciudad" },
  { key: "agency", label: "Agencia" },
  { key: "status", label: "Estado" },
]

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([])
  
  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>([
    "name", "vendor_type", "contact", "phone", "city", "agency", "status"
  ])
  
  // Filters
  const [filters, setFilters] = useState({
    status: "all",
    vendor_type: "all",
    agency_id: "all",
  })

  const supabase = createClient()

  useEffect(() => {
    fetchVendors()
    fetchAgencies()
  }, [])

  async function fetchVendors() {
    setLoading(true)
    const { data, error } = await supabase
      .from("vendors")
      .select(`
        id,
        name,
        legal_name,
        tax_id,
        vendor_type,
        contact_name,
        contact_email,
        contact_phone,
        city,
        is_active,
        agency_id,
        agencies(name)
      `)
      .order("name", { ascending: true })

    if (!error && data) {
      const mappedData = data.map((v: Record<string, unknown>) => ({
        ...v,
        agency: v.agencies,
      }))
      setVendors(mappedData as Vendor[])
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

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    const { error } = await supabase.from("vendors").delete().eq("id", deleteId)
    if (!error) {
      setVendors(vendors.filter((v) => v.id !== deleteId))
    }
    setDeleting(false)
    setDeleteId(null)
  }

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(v => v !== "all").length
  }, [filters])

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchesSearch =
        !search ||
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.legal_name?.toLowerCase().includes(search.toLowerCase()) ||
        v.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
        v.tax_id?.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = filters.status === "all" || 
        (filters.status === "active" ? v.is_active : !v.is_active)
      const matchesType = filters.vendor_type === "all" || v.vendor_type === filters.vendor_type
      const matchesAgency = filters.agency_id === "all" || (v as Record<string, unknown>).agency_id === filters.agency_id

      return matchesSearch && matchesStatus && matchesType && matchesAgency
    })
  }, [vendors, search, filters])

  function toggleColumn(key: ColumnKey) {
    setVisibleColumns(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    )
  }

  function clearFilters() {
    setFilters({
      status: "all",
      vendor_type: "all",
      agency_id: "all",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-muted-foreground">Gestiona los proveedores de tus agencias</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/vendors/types">
              <Tag className="mr-2 h-4 w-4" />
              Tipos de Proveedores
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/vendors/new">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proveedor
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Proveedores</CardTitle>
          <CardDescription>
            {filteredVendors.length} proveedor{filteredVendors.length !== 1 ? "es" : ""} encontrado{filteredVendors.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and filters */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar proveedores..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                {/* Column visibility */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings2 className="h-4 w-4 mr-2" />
                      Columnas
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="end">
                    <div className="space-y-2">
                      <p className="font-medium text-sm">Columnas visibles</p>
                      {allColumns.map((col) => (
                        <div key={col.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`col-${col.key}`}
                            checked={visibleColumns.includes(col.key)}
                            onCheckedChange={() => toggleColumn(col.key)}
                          />
                          <label
                            htmlFor={`col-${col.key}`}
                            className="text-sm cursor-pointer"
                          >
                            {col.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Filters */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="relative">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros
                      {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">Filtros</p>
                        {activeFiltersCount > 0 && (
                          <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Limpiar
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Estado</label>
                        <Select
                          value={filters.status}
                          onValueChange={(value) => setFilters({ ...filters, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="active">Activos</SelectItem>
                            <SelectItem value="inactive">Inactivos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tipo</label>
                        <Select
                          value={filters.vendor_type}
                          onValueChange={(value) => setFilters({ ...filters, vendor_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos los tipos</SelectItem>
                            {Object.entries(vendorTypeLabels).map(([key, { label }]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Agencia</label>
                        <Select
                          value={filters.agency_id}
                          onValueChange={(value) => setFilters({ ...filters, agency_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas las agencias</SelectItem>
                            {agencies.map((agency) => (
                              <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Active filter badges */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.status !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Estado: {filters.status === "active" ? "Activo" : "Inactivo"}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters({ ...filters, status: "all" })} />
                  </Badge>
                )}
                {filters.vendor_type !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Tipo: {vendorTypeLabels[filters.vendor_type]?.label}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters({ ...filters, vendor_type: "all" })} />
                  </Badge>
                )}
                {filters.agency_id !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Agencia: {agencies.find(a => a.id === filters.agency_id)?.name}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters({ ...filters, agency_id: "all" })} />
                  </Badge>
                )}
              </div>
            )}

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="h-8 w-8" />
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Truck className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No hay proveedores</h3>
                <p className="text-muted-foreground mb-4">
                  {search || activeFiltersCount > 0
                    ? "No se encontraron proveedores con los filtros aplicados"
                    : "Comienza agregando tu primer proveedor"}
                </p>
                {!search && activeFiltersCount === 0 && (
                  <Button asChild>
                    <Link href="/dashboard/vendors/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Nuevo Proveedor
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {visibleColumns.includes("name") && <TableHead>Nombre</TableHead>}
                      {visibleColumns.includes("legal_name") && <TableHead>Razón Social</TableHead>}
                      {visibleColumns.includes("tax_id") && <TableHead>RFC</TableHead>}
                      {visibleColumns.includes("vendor_type") && <TableHead>Tipo</TableHead>}
                      {visibleColumns.includes("contact") && <TableHead>Contacto</TableHead>}
                      {visibleColumns.includes("phone") && <TableHead>Teléfono</TableHead>}
                      {visibleColumns.includes("email") && <TableHead>Email</TableHead>}
                      {visibleColumns.includes("city") && <TableHead>Ciudad</TableHead>}
                      {visibleColumns.includes("agency") && <TableHead>Agencia</TableHead>}
                      {visibleColumns.includes("status") && <TableHead>Estado</TableHead>}
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        {visibleColumns.includes("name") && (
                          <TableCell>
                            <Link
                              href={`/dashboard/vendors/${vendor.id}`}
                              className="font-medium hover:underline flex items-center gap-2"
                            >
                              <Truck className="h-4 w-4 text-muted-foreground" />
                              {vendor.name}
                            </Link>
                          </TableCell>
                        )}
                        {visibleColumns.includes("legal_name") && (
                          <TableCell className="text-muted-foreground">{vendor.legal_name || "-"}</TableCell>
                        )}
                        {visibleColumns.includes("tax_id") && (
                          <TableCell className="font-mono text-sm">{vendor.tax_id || "-"}</TableCell>
                        )}
                        {visibleColumns.includes("vendor_type") && (
                          <TableCell>
                            <Badge variant={vendorTypeLabels[vendor.vendor_type]?.variant || "secondary"}>
                              {vendorTypeLabels[vendor.vendor_type]?.label || vendor.vendor_type}
                            </Badge>
                          </TableCell>
                        )}
                        {visibleColumns.includes("contact") && (
                          <TableCell>{vendor.contact_name || "-"}</TableCell>
                        )}
                        {visibleColumns.includes("phone") && (
                          <TableCell>
                            {vendor.contact_phone ? (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {vendor.contact_phone}
                              </span>
                            ) : "-"}
                          </TableCell>
                        )}
                        {visibleColumns.includes("email") && (
                          <TableCell>
                            {vendor.contact_email ? (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {vendor.contact_email}
                              </span>
                            ) : "-"}
                          </TableCell>
                        )}
                        {visibleColumns.includes("city") && (
                          <TableCell>{vendor.city || "-"}</TableCell>
                        )}
                        {visibleColumns.includes("agency") && (
                          <TableCell>
                            {vendor.agency ? (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {vendor.agency.name}
                              </span>
                            ) : "-"}
                          </TableCell>
                        )}
                        {visibleColumns.includes("status") && (
                          <TableCell>
                            <Badge variant={vendor.is_active ? "default" : "secondary"}>
                              {vendor.is_active ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/vendors/${vendor.id}`}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteId(vendor.id)}
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar proveedor</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El proveedor será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Spinner className="h-4 w-4 mr-2" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
