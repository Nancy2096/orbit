"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, FolderKanban, Settings2, Filter, X } from "lucide-react"

// Los proyectos son cuentas con account_type = "project".
interface ProjectAccount {
  id: string
  account_name: string
  account_code: string | null
  account_type: string
  status: string
  client_id: string | null
  agency_id: string | null
  account_manager_id: string | null
  total_contracted: number
  currency_code: string
  client: {
    company_name: string
    country: string | null
    state: string | null
  } | null
  agency: {
    name: string
  } | null
}

interface ColumnDef {
  key: string
  label: string
  visible: boolean
}

const defaultColumns: ColumnDef[] = [
  { key: "project", label: "Proyecto", visible: true },
  { key: "client", label: "Cliente", visible: true },
  { key: "country", label: "País", visible: true },
  { key: "state", label: "Estado (Ubicación)", visible: true },
  { key: "agency", label: "Agencia", visible: true },
  { key: "total_contracted", label: "Total Contratado", visible: true },
  { key: "currency_code", label: "Moneda", visible: true },
  { key: "status", label: "Estado", visible: true },
]

const countryLabels: Record<string, string> = {
  MX: "México",
  US: "Estados Unidos",
  USA: "Estados Unidos",
  CA: "Canadá",
  ES: "España",
  AR: "Argentina",
  CO: "Colombia",
  CL: "Chile",
  PE: "Perú",
}

function formatCountry(code: string | null | undefined) {
  if (!code) return "-"
  return countryLabels[code.toUpperCase()] || code
}

interface Filters {
  status: string
  agency_id: string
  client_id: string
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Activa", variant: "default" },
  inactive: { label: "Inactiva", variant: "secondary" },
  on_hold: { label: "En pausa", variant: "outline" },
  closed: { label: "Cerrada", variant: "destructive" },
}

export default function ProjectsPage() {
  const [mounted, setMounted] = useState(false)
  const [projects, setProjects] = useState<ProjectAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [columns, setColumns] = useState<ColumnDef[]>(defaultColumns)
  const [filters, setFilters] = useState<Filters>({
    status: "all",
    agency_id: "all",
    client_id: "all",
  })
  const [showFilters, setShowFilters] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchProjects()
    }
  }, [mounted])

  async function fetchProjects() {
    setLoading(true)

    // Proyectos = cuentas tipo "project".
    const { data, error } = await supabase
      .from("accounts")
      .select(`
        id,
        account_name,
        account_code,
        account_type,
        status,
        client_id,
        agency_id,
        account_manager_id,
        retainer_currency_id
      `)
      .eq("account_type", "project")
      .order("account_name", { ascending: true })

    if (error) {
      setLoading(false)
      return
    }

    if (!data || data.length === 0) {
      setProjects([])
      setLoading(false)
      return
    }

    // Get related data
    const clientIds = [...new Set(data.map((a) => a.client_id).filter(Boolean))]
    const agencyIds = [...new Set(data.map((a) => a.agency_id).filter(Boolean))]

    const accountIds = data.map((a) => a.id)

    const [clientsRes, agenciesRes, servicesRes, currenciesRes] = await Promise.all([
      clientIds.length > 0
        ? supabase.from("clients").select("id, company_name, country, state").in("id", clientIds)
        : { data: [] },
      agencyIds.length > 0
        ? supabase.from("agencies").select("id, name").in("id", agencyIds)
        : { data: [] },
      accountIds.length > 0
        ? supabase.from("account_services").select("account_id, final_price").eq("is_active", true).in("account_id", accountIds)
        : { data: [] },
      supabase.from("currencies").select("id, code"),
    ])

    const clientsMap = new Map((clientsRes.data || []).map((c) => [c.id, c]))
    const agenciesMap = new Map((agenciesRes.data || []).map((a) => [a.id, a]))
    const currenciesMap = new Map((currenciesRes.data || []).map((c: { id: string; code: string }) => [c.id, c.code]))

    // Sum contracted services (total contratado) per project
    const totalsMap = new Map<string, number>()
    ;(servicesRes.data || []).forEach((s: { account_id: string; final_price: number | null }) => {
      totalsMap.set(s.account_id, (totalsMap.get(s.account_id) || 0) + (Number(s.final_price) || 0))
    })

    const mappedData = data.map((account) => ({
      ...account,
      total_contracted: totalsMap.get(account.id) || 0,
      currency_code: account.retainer_currency_id ? (currenciesMap.get(account.retainer_currency_id) || "—") : "—",
      client: account.client_id ? clientsMap.get(account.client_id) || null : null,
      agency: account.agency_id ? agenciesMap.get(account.agency_id) || null : null,
    }))

    setProjects(mappedData as ProjectAccount[])
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar este proyecto?")) return

    const { error } = await supabase.from("accounts").delete().eq("id", id)
    if (!error) {
      setProjects(projects.filter((p) => p.id !== id))
    }
  }

  function toggleColumn(key: string) {
    setColumns(columns.map((col) => (col.key === key ? { ...col, visible: !col.visible } : col)))
  }

  function clearFilters() {
    setFilters({
      status: "all",
      agency_id: "all",
      client_id: "all",
    })
  }

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter((v) => v !== "" && v !== "all").length
  }, [filters])

  const uniqueAgencies = useMemo(() => {
    const map = new Map<string, string>()
    projects.forEach((p) => {
      if (p.agency_id && p.agency?.name) map.set(p.agency_id, p.agency.name)
    })
    return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [projects])

  const uniqueClients = useMemo(() => {
    const map = new Map<string, string>()
    projects.forEach((p) => {
      if (p.client_id && p.client?.company_name) map.set(p.client_id, p.client.company_name)
    })
    return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [projects])

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.account_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.client?.company_name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = !filters.status || filters.status === "all" || p.status === filters.status
      const matchesAgency = !filters.agency_id || filters.agency_id === "all" || p.agency_id === filters.agency_id
      const matchesClient = !filters.client_id || filters.client_id === "all" || p.client_id === filters.client_id

      return matchesSearch && matchesStatus && matchesAgency && matchesClient
    })
  }, [projects, searchTerm, filters])

  const visibleColumns = columns.filter((col) => col.visible)

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
          <h1 className="text-2xl font-bold text-foreground">Proyectos</h1>
          <p className="text-muted-foreground">
            Cuentas por proyecto de tus agencias
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/accounts/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proyecto
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Lista de Proyectos</CardTitle>
                <CardDescription>
                  {filteredProjects.length} de {projects.length} proyecto{projects.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o cliente..."
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
                              {Object.entries(statusLabels).map(([value, { label }]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
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
                              {uniqueAgencies.map((agency) => (
                                <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Cliente</Label>
                          <Select
                            value={filters.client_id}
                            onValueChange={(value) => setFilters({ ...filters, client_id: value })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Todos los clientes" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos los clientes</SelectItem>
                              {uniqueClients.map((client) => (
                                <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
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
                    Agencia: {uniqueAgencies.find((a) => a.id === filters.agency_id)?.name || filters.agency_id}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilters({ ...filters, agency_id: "all" })}
                    />
                  </Badge>
                )}
                {filters.client_id && filters.client_id !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Cliente: {uniqueClients.find((c) => c.id === filters.client_id)?.name || filters.client_id}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilters({ ...filters, client_id: "all" })}
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
          ) : filteredProjects.length === 0 ? (
            <Empty>
              <EmptyMedia variant="icon">
                <FolderKanban className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No hay proyectos</EmptyTitle>
              <EmptyDescription>
                {searchTerm || activeFiltersCount > 0
                  ? "No se encontraron resultados para tu búsqueda"
                  : "Comienza creando tu primer proyecto"}
              </EmptyDescription>
              {!searchTerm && activeFiltersCount === 0 && (
                <Button asChild>
                  <Link href="/dashboard/accounts/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Proyecto
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
                  {filteredProjects.map((project, index) => (
                    <TableRow key={project.id}>
                      <TableCell className="text-right text-sm text-muted-foreground tabular-nums">
                        {index + 1}
                      </TableCell>
                      {visibleColumns.map((column) => (
                        <TableCell key={column.key}>
                          {column.key === "project" && (
                            <div>
                              <Link
                                href={`/dashboard/accounts/${project.id}`}
                                className="font-medium hover:underline"
                              >
                                {project.account_name}
                              </Link>
                              {project.account_code && (
                                <div className="text-xs text-muted-foreground">
                                  {project.account_code}
                                </div>
                              )}
                            </div>
                          )}
                          {column.key === "client" && (
                            <span className="text-sm">
                              {project.client?.company_name || "-"}
                            </span>
                          )}
                          {column.key === "country" && (
                            <span className="text-sm">
                              {formatCountry(project.client?.country)}
                            </span>
                          )}
                          {column.key === "state" && (
                            <span className="text-sm">
                              {project.client?.state || "-"}
                            </span>
                          )}
                          {column.key === "agency" && (
                            <span className="text-sm">
                              {project.agency?.name || "-"}
                            </span>
                          )}
                          {column.key === "total_contracted" && (
                            <span className="text-sm font-medium tabular-nums">
                              ${project.total_contracted.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          )}
                          {column.key === "currency_code" && (
                            <span className="text-sm">{project.currency_code}</span>
                          )}
                          {column.key === "status" && (
                            <Badge variant={statusLabels[project.status]?.variant || "outline"}>
                              {statusLabels[project.status]?.label || project.status}
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
                              <Link href={`/dashboard/accounts/${project.id}`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(project.id)}
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
