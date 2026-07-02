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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Briefcase, FolderKanban, Settings2, Filter, X } from "lucide-react"

interface Account {
  id: string
  account_name: string
  account_type: string
  retainer_amount: number | null
  payment_terms: number
  discount_percentage: number
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
  { key: "account_name", label: "Cuenta", visible: true },
  { key: "client", label: "Cliente", visible: true },
  { key: "country", label: "País", visible: true },
  { key: "state", label: "Estado (Ubicación)", visible: true },
  { key: "agency", label: "Agencia", visible: true },
  { key: "total_contracted", label: "Total Contratado", visible: true },
  { key: "currency_code", label: "Moneda", visible: true },
  { key: "payment_terms", label: "Términos", visible: false },
  { key: "discount", label: "Descuento", visible: false },
  { key: "status", label: "Estado", visible: true },
]

interface Filters {
  status: string
  agency_id: string
  account_type: string
  client_id: string
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Activa", variant: "default" },
  inactive: { label: "Inactiva", variant: "secondary" },
  on_hold: { label: "En pausa", variant: "outline" },
  closed: { label: "Cerrada", variant: "destructive" },
}

const typeLabels: Record<string, string> = {
  project: "Por proyecto",
  retainer: "Retainer",
  mixed: "Mixta",
}

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

export default function AccountsPage() {
  const [mounted, setMounted] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [columns, setColumns] = useState<ColumnDef[]>(defaultColumns)
  const [filters, setFilters] = useState<Filters>({
    status: "all",
    agency_id: "all",
    account_type: "all",
    client_id: "all",
  })
  const [showFilters, setShowFilters] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchAccounts()
    }
  }, [mounted])

  async function fetchAccounts() {
    setLoading(true)
    
    // First, get accounts with basic relations.
    // Cuentas solo muestra cuentas tipo "retainer"; las cuentas tipo "project"
    // se administran en la sección Proyectos.
    const { data, error } = await supabase
      .from("accounts")
      .select(`
        id,
        account_name,
        account_type,
        retainer_amount,
        payment_terms,
        discount_percentage,
        status,
        client_id,
        agency_id,
        account_manager_id,
        retainer_currency_id
      `)
      .eq("account_type", "retainer")
      .order("account_name", { ascending: true })

    if (error) {
      setLoading(false)
      return
    }

    if (!data || data.length === 0) {
      setAccounts([])
      setLoading(false)
      return
    }

    // Get related data
    const clientIds = [...new Set(data.map(a => a.client_id).filter(Boolean))]
    const agencyIds = [...new Set(data.map(a => a.agency_id).filter(Boolean))]

    const accountIds = data.map(a => a.id)

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

    const clientsMap = new Map((clientsRes.data || []).map(c => [c.id, c]))
    const agenciesMap = new Map((agenciesRes.data || []).map(a => [a.id, a]))
    const currenciesMap = new Map((currenciesRes.data || []).map((c: { id: string; code: string }) => [c.id, c.code]))

    // Sum contracted services (total contratado) per account
    const totalsMap = new Map<string, number>()
    ;(servicesRes.data || []).forEach((s: { account_id: string; final_price: number | null }) => {
      totalsMap.set(s.account_id, (totalsMap.get(s.account_id) || 0) + (Number(s.final_price) || 0))
    })

    // Map data to expected interface
    const mappedData = data.map(account => ({
      ...account,
      total_contracted: totalsMap.get(account.id) || 0,
      currency_code: account.retainer_currency_id ? (currenciesMap.get(account.retainer_currency_id) || "—") : "—",
      client: account.client_id ? clientsMap.get(account.client_id) || null : null,
      agency: account.agency_id ? agenciesMap.get(account.agency_id) || null : null,
    }))

    setAccounts(mappedData as Account[])
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar esta cuenta? Se eliminarán todos los proyectos asociados.")) return

    const { error } = await supabase.from("accounts").delete().eq("id", id)
    if (!error) {
      setAccounts(accounts.filter((a) => a.id !== id))
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
      account_type: "all",
      client_id: "all",
    })
  }

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(v => v !== "" && v !== "all").length
  }, [filters])

  // Unique agencies and clients derived from the loaded accounts
  const uniqueAgencies = useMemo(() => {
    const map = new Map<string, string>()
    accounts.forEach(a => {
      if (a.agency_id && a.agency?.name) map.set(a.agency_id, a.agency.name)
    })
    return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [accounts])

  const uniqueClients = useMemo(() => {
    const map = new Map<string, string>()
    accounts.forEach(a => {
      if (a.client_id && a.client?.company_name) map.set(a.client_id, a.client.company_name)
    })
    return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [accounts])

  const uniqueTypes = useMemo(() => {
    return [...new Set(accounts.map(a => a.account_type).filter(Boolean))].sort()
  }, [accounts])

  const filteredAccounts = useMemo(() => {
    return accounts.filter((a) => {
      const matchesSearch =
        a.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.client?.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.agency?.name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = !filters.status || filters.status === "all" || a.status === filters.status
      const matchesAgency = !filters.agency_id || filters.agency_id === "all" || a.agency_id === filters.agency_id
      const matchesType = !filters.account_type || filters.account_type === "all" || a.account_type === filters.account_type
      const matchesClient = !filters.client_id || filters.client_id === "all" || a.client_id === filters.client_id

      return matchesSearch && matchesStatus && matchesAgency && matchesType && matchesClient
    })
  }, [accounts, searchTerm, filters])

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
          <h1 className="text-2xl font-bold text-foreground">Cuentas</h1>
          <p className="text-muted-foreground">
            Gestiona las relaciones comerciales entre clientes y agencias
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/accounts/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cuenta
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Lista de Cuentas</CardTitle>
                <CardDescription>
                  {filteredAccounts.length} de {accounts.length} cuenta{accounts.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cuenta, cliente o agencia..."
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
                              <SelectItem value="active">Activa</SelectItem>
                              <SelectItem value="inactive">Inactiva</SelectItem>
                              <SelectItem value="on_hold">En pausa</SelectItem>
                              <SelectItem value="closed">Cerrada</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Tipo</Label>
                          <Select
                            value={filters.account_type}
                            onValueChange={(value) => setFilters({ ...filters, account_type: value })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Todos los tipos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos los tipos</SelectItem>
                              {uniqueTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {typeLabels[type] || type}
                                </SelectItem>
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
                                <SelectItem key={agency.id} value={agency.id}>
                                  {agency.name}
                                </SelectItem>
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
                                <SelectItem key={client.id} value={client.id}>
                                  {client.name}
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
                {filters.account_type && filters.account_type !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Tipo: {typeLabels[filters.account_type] || filters.account_type}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilters({ ...filters, account_type: "all" })}
                    />
                  </Badge>
                )}
                {filters.agency_id && filters.agency_id !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Agencia: {uniqueAgencies.find(a => a.id === filters.agency_id)?.name}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilters({ ...filters, agency_id: "all" })}
                    />
                  </Badge>
                )}
                {filters.client_id && filters.client_id !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Cliente: {uniqueClients.find(c => c.id === filters.client_id)?.name}
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
          ) : filteredAccounts.length === 0 ? (
            <Empty>
              <EmptyMedia variant="icon">
                <Briefcase className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No hay cuentas</EmptyTitle>
              <EmptyDescription>
                {searchTerm || activeFiltersCount > 0
                  ? "No se encontraron resultados para tu búsqueda"
                  : "Comienza creando tu primera cuenta"}
              </EmptyDescription>
              {!searchTerm && activeFiltersCount === 0 && (
                <Button asChild>
                  <Link href="/dashboard/accounts/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Cuenta
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
                  {filteredAccounts.map((account, index) => (
                    <TableRow key={account.id}>
                      <TableCell className="text-right text-sm text-muted-foreground tabular-nums">
                        {index + 1}
                      </TableCell>
                      {visibleColumns.map((column) => (
                        <TableCell key={column.key}>
                          {column.key === "account_name" && (
                            <Link
                              href={`/dashboard/accounts/${account.id}`}
                              className="font-medium hover:underline"
                            >
                              {account.account_name}
                            </Link>
                          )}
                          {column.key === "client" && (
                            <div className="font-medium">
                              {account.client?.company_name || "-"}
                            </div>
                          )}
                          {column.key === "country" && (
                            <div className="text-sm">
                              {formatCountry(account.client?.country)}
                            </div>
                          )}
                          {column.key === "state" && (
                            <div className="text-sm">
                              {account.client?.state || "-"}
                            </div>
                          )}
                          {column.key === "agency" && (
                            <div className="text-sm">
                              {account.agency?.name || "-"}
                            </div>
                          )}
                          {column.key === "total_contracted" && (
                            <div className="text-sm font-medium tabular-nums">
                              ${account.total_contracted.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                          {column.key === "currency_code" && (
                            <div className="text-sm">
                              {account.currency_code}
                            </div>
                          )}
                          {column.key === "payment_terms" && (
                            <div className="text-sm">{account.payment_terms} días</div>
                          )}
                          {column.key === "discount" && (
                            <div className="text-sm">
                              {account.discount_percentage > 0 ? `${account.discount_percentage}%` : "-"}
                            </div>
                          )}
                          {column.key === "status" && (
                            <Badge variant={statusLabels[account.status]?.variant || "outline"}>
                              {statusLabels[account.status]?.label || account.status}
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
                              <Link href={`/dashboard/accounts/${account.id}`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/projects?account=${account.id}`}>
                                <FolderKanban className="mr-2 h-4 w-4" />
                                Ver proyectos
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(account.id)}
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
