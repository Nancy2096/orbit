"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Building2, Mail, Globe, Settings2, Filter, X } from "lucide-react"

interface Client {
  id: string
  company_name: string
  legal_name: string | null
  tax_id: string | null
  website: string | null
  primary_contact_name: string | null
  primary_contact_email: string | null
  primary_contact_phone: string | null
  city: string | null
  state: string | null
  country: string | null
  payment_terms: number
  status: string
  agency_id: string | null
  industry_id: string | null
  referral_source_id: string | null
  created_at: string
  agency?: { name: string } | null
  industry?: { name: string } | null
  referral_source?: { name: string } | null
}

interface ColumnDef {
  key: string
  label: string
  visible: boolean
  filterable: boolean
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  prospect: { label: "Prospecto", variant: "outline" },
  active: { label: "Activo", variant: "default" },
  inactive: { label: "Inactivo", variant: "secondary" },
  suspended: { label: "Suspendido", variant: "destructive" },
}

const defaultColumns: ColumnDef[] = [
  { key: "company_name", label: "Empresa", visible: true, filterable: true },
  { key: "legal_name", label: "Razón Social", visible: false, filterable: true },
  { key: "tax_id", label: "RFC", visible: false, filterable: true },
  { key: "agency", label: "Agencia", visible: true, filterable: true },
  { key: "contact", label: "Contacto", visible: true, filterable: true },
  { key: "phone", label: "Teléfono", visible: false, filterable: true },
  { key: "industry", label: "Industria", visible: true, filterable: true },
  { key: "referral_source", label: "Fuente", visible: false, filterable: true },
  { key: "location", label: "Ubicación", visible: true, filterable: true },
  { key: "payment_terms", label: "Términos", visible: true, filterable: false },
  { key: "status", label: "Estado", visible: true, filterable: true },
]

interface Filters {
  status: string
  agency_id: string
  industry_id: string
  referral_source_id: string
  city: string
}

export default function ClientsPage() {
  const [mounted, setMounted] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [columns, setColumns] = useState<ColumnDef[]>(defaultColumns)
  const [filters, setFilters] = useState<Filters>({
    status: "all",
    agency_id: "all",
    industry_id: "all",
    referral_source_id: "all",
    city: "all",
  })
  const [showFilters, setShowFilters] = useState(false)
  
  // Catalogs for filters
  const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([])
  const [industries, setIndustries] = useState<{ id: string; name: string }[]>([])
  const [referralSources, setReferralSources] = useState<{ id: string; name: string }[]>([])
  
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchClients()
      fetchCatalogs()
    }
  }, [mounted])

  async function fetchClients() {
    setLoading(true)
    const { data, error } = await supabase
      .from("clients")
      .select(`
        *,
        agency:agencies(name),
        industry:industries(name),
        referral_source:referral_sources(name)
      `)
      .order("company_name", { ascending: true })

    if (!error && data) {
      setClients(data)
    }
    setLoading(false)
  }

  async function fetchCatalogs() {
    const [agenciesRes, industriesRes, sourcesRes] = await Promise.all([
      supabase.from("agencies").select("id, name").eq("is_active", true).order("name"),
      supabase.from("industries").select("id, name").eq("is_active", true).order("name"),
      supabase.from("referral_sources").select("id, name").eq("is_active", true).order("name"),
    ])
    if (agenciesRes.data) setAgencies(agenciesRes.data)
    if (industriesRes.data) setIndustries(industriesRes.data)
    if (sourcesRes.data) setReferralSources(sourcesRes.data)
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar este cliente? Se eliminarán todas sus cuentas y proyectos asociados.")) return

    const { error } = await supabase.from("clients").delete().eq("id", id)
    if (!error) {
      setClients(clients.filter((c) => c.id !== id))
    }
  }

  function toggleColumn(key: string) {
    setColumns(columns.map(col => 
      col.key === key ? { ...col, visible: !col.visible } : col
    ))
  }

  function clearFilters() {
    setFilters({
      status: "all",
      agency_id: "all",
      industry_id: "all",
      referral_source_id: "all",
      city: "all",
    })
  }

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(v => v !== "" && v !== "all").length
  }, [filters])

  // Get unique cities for filter
  const uniqueCities = useMemo(() => {
    const cities = clients
      .map(c => c.city)
      .filter((city): city is string => !!city)
    return [...new Set(cities)].sort()
  }, [clients])

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      // Text search
      const matchesSearch = 
        c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.legal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.primary_contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.primary_contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.tax_id?.toLowerCase().includes(searchTerm.toLowerCase())

      // Column filters (use "all" as the "show all" value)
      const matchesStatus = !filters.status || filters.status === "all" || c.status === filters.status
      const matchesAgency = !filters.agency_id || filters.agency_id === "all" || c.agency_id === filters.agency_id
      const matchesIndustry = !filters.industry_id || filters.industry_id === "all" || c.industry_id === filters.industry_id
      const matchesSource = !filters.referral_source_id || filters.referral_source_id === "all" || c.referral_source_id === filters.referral_source_id
      const matchesCity = !filters.city || filters.city === "all" || c.city === filters.city

      return matchesSearch && matchesStatus && matchesAgency && matchesIndustry && matchesSource && matchesCity
    })
  }, [clients, searchTerm, filters])

  const visibleColumns = columns.filter(col => col.visible)

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona tu cartera de clientes y sus datos de contacto
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/clients/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Lista de Clientes</CardTitle>
                <CardDescription>
                  {filteredClients.length} de {clients.length} cliente{clients.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filter button */}
                <Popover open={showFilters} onOpenChange={setShowFilters}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="relative">
                      <Filter className="h-4 w-4" />
                      {activeFiltersCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                          {activeFiltersCount}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Filtros</h4>
                        {activeFiltersCount > 0 && (
                          <Button variant="ghost" size="sm" onClick={clearFilters}>
                            <X className="mr-1 h-3 w-3" />
                            Limpiar
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Estado</Label>
                          <Select
                            value={filters.status}
                            onValueChange={(value) => setFilters({ ...filters, status: value })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Todos los estados" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos los estados</SelectItem>
                              <SelectItem value="prospect">Prospecto</SelectItem>
                              <SelectItem value="active">Activo</SelectItem>
                              <SelectItem value="inactive">Inactivo</SelectItem>
                              <SelectItem value="suspended">Suspendido</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Agencia</Label>
                          <Select
                            value={filters.agency_id}
                            onValueChange={(value) => setFilters({ ...filters, agency_id: value })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Todas las agencias" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas las agencias</SelectItem>
                              {agencies.map((agency) => (
                                <SelectItem key={agency.id} value={agency.id}>
                                  {agency.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Industria</Label>
                          <Select
                            value={filters.industry_id}
                            onValueChange={(value) => setFilters({ ...filters, industry_id: value })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Todas las industrias" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas las industrias</SelectItem>
                              {industries.map((ind) => (
                                <SelectItem key={ind.id} value={ind.id}>
                                  {ind.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Fuente</Label>
                          <Select
                            value={filters.referral_source_id}
                            onValueChange={(value) => setFilters({ ...filters, referral_source_id: value })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Todas las fuentes" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas las fuentes</SelectItem>
                              {referralSources.map((src) => (
                                <SelectItem key={src.id} value={src.id}>
                                  {src.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Ciudad</Label>
                          <Select
                            value={filters.city}
                            onValueChange={(value) => setFilters({ ...filters, city: value })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Todas las ciudades" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas las ciudades</SelectItem>
                              {uniqueCities.map((city) => (
                                <SelectItem key={city} value={city}>
                                  {city}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Column visibility */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {columns.map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.key}
                        checked={column.visible}
                        onCheckedChange={() => toggleColumn(column.key)}
                      >
                        {column.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Active filters badges */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.status && filters.status !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Estado: {statusLabels[filters.status]?.label || filters.status}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setFilters({ ...filters, status: "all" })}
                    />
                  </Badge>
                )}
                {filters.agency_id && filters.agency_id !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Agencia: {agencies.find(a => a.id === filters.agency_id)?.name}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setFilters({ ...filters, agency_id: "all" })}
                    />
                  </Badge>
                )}
                {filters.industry_id && filters.industry_id !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Industria: {industries.find(i => i.id === filters.industry_id)?.name}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setFilters({ ...filters, industry_id: "all" })}
                    />
                  </Badge>
                )}
                {filters.referral_source_id && filters.referral_source_id !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Fuente: {referralSources.find(s => s.id === filters.referral_source_id)?.name}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setFilters({ ...filters, referral_source_id: "all" })}
                    />
                  </Badge>
                )}
                {filters.city && filters.city !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Ciudad: {filters.city}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setFilters({ ...filters, city: "all" })}
                    />
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner className="h-8 w-8" />
            </div>
          ) : filteredClients.length === 0 ? (
            <Empty>
              <EmptyMedia variant="icon">
                <Building2 className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No hay clientes</EmptyTitle>
              <EmptyDescription>
                {searchTerm || activeFiltersCount > 0 
                  ? "No se encontraron resultados para tu búsqueda" 
                  : "Comienza agregando tu primer cliente"}
              </EmptyDescription>
              {!searchTerm && activeFiltersCount === 0 && (
                <Button asChild>
                  <Link href="/dashboard/clients/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Cliente
                  </Link>
                </Button>
              )}
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-right">#</TableHead>
                    {visibleColumns.map((column) => (
                      <TableHead key={column.key}>{column.label}</TableHead>
                    ))}
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client, index) => (
                    <TableRow key={client.id}>
                      <TableCell className="text-right text-sm text-muted-foreground tabular-nums">
                        {index + 1}
                      </TableCell>
                      {visibleColumns.map((column) => (
                        <TableCell key={column.key}>
                          {column.key === "company_name" && (
                            <div>
                              <Link 
                                href={`/dashboard/clients/${client.id}`}
                                className="font-medium hover:underline"
                              >
                                {client.company_name}
                              </Link>
                            </div>
                          )}
                          {column.key === "legal_name" && (
                            <div className="text-sm">{client.legal_name || "-"}</div>
                          )}
                          {column.key === "tax_id" && (
                            <div className="text-sm font-mono">{client.tax_id || "-"}</div>
                          )}
                          {column.key === "agency" && (
                            <div className="text-sm">{client.agency?.name || "-"}</div>
                          )}
                          {column.key === "contact" && (
                            <div className="space-y-1">
                              {client.primary_contact_name && (
                                <div className="text-sm font-medium">{client.primary_contact_name}</div>
                              )}
                              {client.primary_contact_email && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  {client.primary_contact_email}
                                </div>
                              )}
                            </div>
                          )}
                          {column.key === "phone" && (
                            <div className="text-sm">{client.primary_contact_phone || "-"}</div>
                          )}
                          {column.key === "industry" && (
                            <>
                              {client.industry?.name ? (
                                <Badge variant="outline">{client.industry.name}</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </>
                          )}
                          {column.key === "referral_source" && (
                            <div className="text-sm">{client.referral_source?.name || "-"}</div>
                          )}
                          {column.key === "location" && (
                            <div className="text-sm">
                              {[client.city, client.state, client.country].filter(Boolean).join(", ") || "-"}
                            </div>
                          )}
                          {column.key === "payment_terms" && (
                            <div className="text-sm">{client.payment_terms} días</div>
                          )}
                          {column.key === "status" && (
                            <Badge variant={statusLabels[client.status]?.variant || "outline"}>
                              {statusLabels[client.status]?.label || client.status}
                            </Badge>
                          )}
                        </TableCell>
                      ))}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/clients/${client.id}`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            {client.website && (
                              <DropdownMenuItem asChild>
                                <a href={client.website} target="_blank" rel="noopener noreferrer">
                                  <Globe className="mr-2 h-4 w-4" />
                                  Sitio web
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(client.id)}
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
        </CardContent>
      </Card>
    </div>
  )
}
