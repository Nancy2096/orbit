"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, FolderKanban, Calendar, DollarSign, Settings2, Filter, X } from "lucide-react"

interface Project {
  id: string
  project_code: string | null
  name: string
  status: string
  priority: string
  start_date: string | null
  end_date: string | null
  budget_amount: number | null
  progress_percentage: number
  account: {
    account_name: string
    client: {
      company_name: string
    } | null
    agency: {
      name: string
    } | null
  } | null
}

interface ColumnDef {
  key: string
  label: string
  visible: boolean
}

const defaultColumns: ColumnDef[] = [
  { key: "project", label: "Proyecto", visible: true },
  { key: "client_account", label: "Cliente / Cuenta", visible: true },
  { key: "dates", label: "Fechas", visible: true },
  { key: "budget", label: "Presupuesto", visible: true },
  { key: "progress", label: "Progreso", visible: true },
  { key: "priority", label: "Prioridad", visible: false },
  { key: "status", label: "Estado", visible: true },
]

interface Filters {
  status: string
  priority: string
  agency: string
  client: string
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Borrador", variant: "outline" },
  quoted: { label: "Cotizado", variant: "secondary" },
  approved: { label: "Aprobado", variant: "default" },
  in_progress: { label: "En progreso", variant: "default" },
  on_hold: { label: "Pausado", variant: "secondary" },
  completed: { label: "Completado", variant: "default" },
  cancelled: { label: "Cancelado", variant: "destructive" },
}

const priorityLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  low: { label: "Baja", variant: "outline" },
  medium: { label: "Media", variant: "secondary" },
  high: { label: "Alta", variant: "default" },
  urgent: { label: "Urgente", variant: "destructive" },
}

export default function ProjectsPage() {
  const [mounted, setMounted] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [columns, setColumns] = useState<ColumnDef[]>(defaultColumns)
  const [filters, setFilters] = useState<Filters>({
    status: "all",
    priority: "all",
    agency: "all",
    client: "all",
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
    const { data, error } = await supabase
      .from("projects")
      .select(`
        id,
        project_code,
        name,
        status,
        priority,
        start_date,
        end_date,
        budget_amount,
        progress_percentage,
        account:accounts(
          account_name,
          client:clients(company_name),
          agency:agencies(name)
        )
      `)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setProjects(data as Project[])
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar este proyecto?")) return

    const { error } = await supabase.from("projects").delete().eq("id", id)
    if (!error) {
      setProjects(projects.filter((p) => p.id !== id))
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
      priority: "all",
      agency: "all",
      client: "all",
    })
  }

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(v => v !== "" && v !== "all").length
  }, [filters])

  const uniqueAgencies = useMemo(() => {
    const set = new Set<string>()
    projects.forEach(p => {
      if (p.account?.agency?.name) set.add(p.account.agency.name)
    })
    return [...set].sort()
  }, [projects])

  const uniqueClients = useMemo(() => {
    const set = new Set<string>()
    projects.forEach(p => {
      if (p.account?.client?.company_name) set.add(p.account.client.company_name)
    })
    return [...set].sort()
  }, [projects])

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.project_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.account?.client?.company_name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = !filters.status || filters.status === "all" || p.status === filters.status
      const matchesPriority = !filters.priority || filters.priority === "all" || p.priority === filters.priority
      const matchesAgency = !filters.agency || filters.agency === "all" || p.account?.agency?.name === filters.agency
      const matchesClient = !filters.client || filters.client === "all" || p.account?.client?.company_name === filters.client

      return matchesSearch && matchesStatus && matchesPriority && matchesAgency && matchesClient
    })
  }, [projects, searchTerm, filters])

  const visibleColumns = columns.filter(col => col.visible)

  function formatDate(date: string | null) {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
  }

  function formatCurrency(amount: number | null) {
    if (!amount) return "-"
    return `$${amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
  }

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
            Gestiona todos los proyectos de tus agencias
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/projects/new">
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
                          <Label className="text-xs">Prioridad</Label>
                          <Select
                            value={filters.priority}
                            onValueChange={(value) => setFilters({ ...filters, priority: value })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Todas las prioridades" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas las prioridades</SelectItem>
                              {Object.entries(priorityLabels).map(([value, { label }]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Agencia</Label>
                          <Select
                            value={filters.agency}
                            onValueChange={(value) => setFilters({ ...filters, agency: value })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Todas las agencias" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas las agencias</SelectItem>
                              {uniqueAgencies.map((agency) => (
                                <SelectItem key={agency} value={agency}>{agency}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Cliente</Label>
                          <Select
                            value={filters.client}
                            onValueChange={(value) => setFilters({ ...filters, client: value })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Todos los clientes" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos los clientes</SelectItem>
                              {uniqueClients.map((client) => (
                                <SelectItem key={client} value={client}>{client}</SelectItem>
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
                {filters.priority && filters.priority !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Prioridad: {priorityLabels[filters.priority]?.label || filters.priority}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilters({ ...filters, priority: "all" })}
                    />
                  </Badge>
                )}
                {filters.agency && filters.agency !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Agencia: {filters.agency}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilters({ ...filters, agency: "all" })}
                    />
                  </Badge>
                )}
                {filters.client && filters.client !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Cliente: {filters.client}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilters({ ...filters, client: "all" })}
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
                  <Link href="/dashboard/projects/new">
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
                                href={`/dashboard/projects/${project.id}`}
                                className="font-medium hover:underline"
                              >
                                {project.name}
                              </Link>
                              {project.project_code && (
                                <div className="text-xs text-muted-foreground">
                                  {project.project_code}
                                </div>
                              )}
                            </div>
                          )}
                          {column.key === "client_account" && (
                            <div>
                              <div className="font-medium">
                                {project.account?.client?.company_name || "-"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {project.account?.account_name}
                              </div>
                            </div>
                          )}
                          {column.key === "dates" && (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span>{formatDate(project.start_date)}</span>
                              <span className="text-muted-foreground">-</span>
                              <span>{formatDate(project.end_date)}</span>
                            </div>
                          )}
                          {column.key === "budget" && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-muted-foreground" />
                              {formatCurrency(project.budget_amount)}
                            </div>
                          )}
                          {column.key === "progress" && (
                            <div className="w-24 space-y-1">
                              <Progress value={project.progress_percentage} className="h-2" />
                              <div className="text-xs text-muted-foreground text-right">
                                {project.progress_percentage}%
                              </div>
                            </div>
                          )}
                          {column.key === "priority" && (
                            <Badge variant={priorityLabels[project.priority]?.variant || "outline"} className="text-xs">
                              {priorityLabels[project.priority]?.label || project.priority}
                            </Badge>
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
                              <Link href={`/dashboard/projects/${project.id}`}>
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
