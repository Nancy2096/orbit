"use client"

import { useState, useEffect, useMemo } from "react"
import { usePersistentState } from "@/hooks/use-persistent-state"
import useSWR from "swr"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ColumnVisibilityMenu, DataTable, useColumnVisibility, type DataTableColumn } from "@/components/data-table"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Building2, Mail, Globe, Filter, X, ChevronDown, ChevronRight } from "lucide-react"
import { ClientCompletionBar } from "@/components/client-completion-chart"
import { getClientOverallCompletion, type ClientLike } from "@/lib/client-completion"

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
  contract_url?: string | null
  agency?: { name: string } | null
  industry?: { name: string } | null
  referral_source?: { name: string } | null
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  prospect: { label: "Prospecto", variant: "outline" },
  active: { label: "Activo", variant: "outline", className: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100" },
  inactive: { label: "Inactivo", variant: "outline", className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100" },
  suspended: { label: "Suspendido", variant: "outline", className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100" },
}

function formatClientLocation(client: Client) {
  return [client.city, client.state, client.country].filter(Boolean).join(", ") || "-"
}

const yesBadge = (
  <Badge variant="outline" className="border-green-200 bg-green-100 text-green-700 hover:bg-green-100">
    Sí
  </Badge>
)
const noBadge = (
  <Badge variant="outline" className="border-red-200 bg-red-100 text-red-700 hover:bg-red-100">
    No
  </Badge>
)

const clientColumns: DataTableColumn<Client>[] = [
  {
    key: "company_name",
    label: "Empresa",
    pinned: true,
    width: 240,
    fullText: (c) => c.company_name,
    cell: (c) => (
      <Link href={`/dashboard/clients/${c.id}`} className="font-medium hover:underline">
        {c.company_name}
      </Link>
    ),
  },
  {
    key: "contract",
    label: "Contrato",
    width: 100,
    cell: (c) => (hasContract(c) ? yesBadge : noBadge),
  },
  {
    key: "status",
    label: "Estado",
    width: 120,
    cell: (c) => (
      <Badge variant={statusLabels[c.status]?.variant || "outline"} className={statusLabels[c.status]?.className}>
        {statusLabels[c.status]?.label || c.status}
      </Badge>
    ),
  },
  {
    key: "completion",
    label: "Avance",
    width: 150,
    cell: (c) => <ClientCompletionBar percentage={getClientOverallCompletion(c as unknown as ClientLike)} />,
  },
  {
    key: "contact",
    label: "Contacto",
    width: 220,
    fullText: (c) => [c.primary_contact_name, c.primary_contact_email].filter(Boolean).join(" · "),
    cell: (c) =>
      c.primary_contact_name || c.primary_contact_email ? (
        <div className="space-y-1">
          {c.primary_contact_name && <div className="truncate font-medium">{c.primary_contact_name}</div>}
          {c.primary_contact_email && (
            <div className="flex min-w-0 items-center gap-1 text-muted-foreground">
              <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{c.primary_contact_email}</span>
            </div>
          )}
        </div>
      ) : (
        "-"
      ),
  },
  {
    key: "agency",
    label: "Agencia",
    width: 160,
    fullText: (c) => c.agency?.name,
    cell: (c) => c.agency?.name || "-",
  },
  {
    key: "industry",
    label: "Industria",
    width: 160,
    fullText: (c) => c.industry?.name,
    cell: (c) =>
      c.industry?.name ? (
        <Badge variant="outline" className="max-w-full">
          <span className="truncate">{c.industry.name}</span>
        </Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
  },
  {
    key: "location",
    label: "Ubicación",
    width: 200,
    fullText: formatClientLocation,
    cell: formatClientLocation,
  },
  {
    key: "payment_terms",
    label: "Términos",
    width: 100,
    cell: (c) => `${c.payment_terms} días`,
  },
  {
    key: "legal_name",
    label: "Razón social",
    width: 200,
    defaultVisible: false,
    fullText: (c) => c.legal_name,
    cell: (c) => c.legal_name || "-",
  },
  {
    key: "tax_id",
    label: "RFC",
    width: 140,
    defaultVisible: false,
    cell: (c) => <span className="font-mono">{c.tax_id || "-"}</span>,
  },
  {
    key: "phone",
    label: "Teléfono",
    width: 140,
    defaultVisible: false,
    cell: (c) => c.primary_contact_phone || "-",
  },
  {
    key: "referral_source",
    label: "Fuente",
    width: 150,
    defaultVisible: false,
    fullText: (c) => c.referral_source?.name,
    cell: (c) => c.referral_source?.name || "-",
  },
]

const clientMobileFields = ["contract", "status", "completion", "contact", "location"]

interface Filters {
  status: string
  agency_id: string
  industry_id: string
  referral_source_id: string
  city: string
  contract?: "all" | "yes" | "no"
}

function hasContract(client: Client): boolean {
  return Boolean(client.contract_url?.trim())
}

export default function ClientsPage() {
  const [mounted, setMounted] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = usePersistentState("clients:searchTerm", "")
  const columnVisibility = useColumnVisibility("clients", clientColumns)
  const [filters, setFilters] = usePersistentState<Filters>("clients:filters", {
    status: "all",
    agency_id: "all",
    industry_id: "all",
    referral_source_id: "all",
    city: "all",
    contract: "all",
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  
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

  function clearFilters() {
    setFilters({
      status: "all",
      agency_id: "all",
      industry_id: "all",
      referral_source_id: "all",
      city: "all",
      contract: "all",
    })
  }

  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(
      ([key, v]) => key !== "quotation" && v !== "" && v !== "all",
    ).length
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
      const withContract = hasContract(c)
      const matchesContract =
        !filters.contract ||
        filters.contract === "all" ||
        (filters.contract === "yes" ? withContract : !withContract)

      return matchesSearch && matchesStatus && matchesAgency && matchesIndustry && matchesSource && matchesCity && matchesContract
    })
  }, [clients, searchTerm, filters])

  const contractSummary = useMemo(() => {
    const withContract = filteredClients.filter(hasContract).length
    return { withContract, withoutContract: filteredClients.length - withContract }
  }, [filteredClients])

  const activeClients = useMemo(
    () => filteredClients.filter((c) => c.status === "active"),
    [filteredClients],
  )
  const inactiveClients = useMemo(
    () => filteredClients.filter((c) => c.status !== "active"),
    [filteredClients],
  )

  function renderClientActions(client: Client) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Acciones de ${client.company_name}`}>
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
          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(client.id)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  function renderClientsTable(rows: Client[], ariaLabel: string) {
    return (
      <DataTable
        ariaLabel={ariaLabel}
        rows={rows}
        columns={columnVisibility.visibleColumns}
        getRowKey={(c) => c.id}
        renderActions={renderClientActions}
        widthsStorageKey="clients-column-widths"
        mobileFieldKeys={clientMobileFields}
      />
    )
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
                {!loading && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm" aria-live="polite">
                    <Badge variant="outline" className="border-green-200 bg-green-100 text-green-700 hover:bg-green-100 tabular-nums">
                      Con contrato: {contractSummary.withContract}
                    </Badge>
                    <Badge variant="outline" className="border-red-200 bg-red-100 text-red-700 hover:bg-red-100 tabular-nums">
                      Sin contrato: {contractSummary.withoutContract}
                    </Badge>
                  </div>
                )}
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

                        <div className="space-y-1.5">
                          <Label className="text-xs">Contrato</Label>
                          <Select
                            value={filters.contract ?? "all"}
                            onValueChange={(value) =>
                              setFilters({ ...filters, contract: value as Filters["contract"] })
                            }
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="yes">Con contrato</SelectItem>
                              <SelectItem value="no">Sin contrato</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Column visibility */}
                <ColumnVisibilityMenu visibility={columnVisibility} />
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
                {filters.contract && filters.contract !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {filters.contract === "yes" ? "Con contrato" : "Sin contrato"}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilters({ ...filters, contract: "all" })}
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
            <div className="space-y-8">
              {/* Clientes activos */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Clientes activos</h3>
                  <Badge variant="secondary" className="tabular-nums">{activeClients.length}</Badge>
                </div>
                {activeClients.length > 0 ? (
                  renderClientsTable(activeClients, "Clientes activos")
                ) : (
                  <p className="py-4 text-sm text-muted-foreground">No hay clientes activos.</p>
                )}
              </div>

              {/* Clientes inactivos */}
              <div className="space-y-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 h-8 gap-2 px-2"
                  onClick={() => setShowInactive((v) => !v)}
                >
                  {showInactive ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="text-sm font-semibold">Clientes inactivos</span>
                  <Badge variant="secondary" className="tabular-nums">{inactiveClients.length}</Badge>
                </Button>
                {showInactive &&
                  (inactiveClients.length > 0 ? (
                    renderClientsTable(inactiveClients, "Clientes inactivos")
                  ) : (
                    <p className="py-4 text-sm text-muted-foreground">No hay clientes inactivos.</p>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
