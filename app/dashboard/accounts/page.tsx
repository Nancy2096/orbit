"use client"

import { useState, useEffect, useMemo } from "react"
import { usePersistentState } from "@/hooks/use-persistent-state"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Briefcase, FolderKanban, Filter, X, ChevronDown, ChevronRight, Copy } from "lucide-react"

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
  has_quotation: boolean
  client: {
    company_name: string
    country: string | null
    state: string | null
  } | null
  agency: {
    name: string
  } | null
}

interface Filters {
  status: string
  agency_id: string
  account_type: string
  client_id: string
  quotation?: "all" | "yes" | "no"
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  active: { label: "Activa", variant: "outline", className: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100" },
  inactive: { label: "Inactiva", variant: "outline", className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100" },
  on_hold: { label: "En pausa", variant: "outline", className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100" },
  closed: { label: "Cerrada", variant: "outline", className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100" },
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

function formatLocation(client: Account["client"]) {
  const parts = [client?.state, client?.country ? formatCountry(client.country) : null].filter(Boolean)
  return parts.length > 0 ? parts.join(", ") : "-"
}

function formatMoney(value: number) {
  return `$${value.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const accountColumns: DataTableColumn<Account>[] = [
  {
    key: "account_name",
    label: "Cuenta",
    pinned: true,
    width: 240,
    fullText: (a) => a.account_name,
    cell: (a) => (
      <Link href={`/dashboard/accounts/${a.id}`} className="font-medium hover:underline">
        {a.account_name}
      </Link>
    ),
  },
  {
    key: "client",
    label: "Cliente",
    width: 200,
    fullText: (a) => a.client?.company_name,
    cell: (a) => <span className="font-medium">{a.client?.company_name || "-"}</span>,
  },
  {
    key: "quotation",
    label: "Cotización",
    width: 110,
    cell: (a) =>
      a.has_quotation ? (
        <Badge variant="outline" className="border-green-200 bg-green-100 text-green-700 hover:bg-green-100">
          Sí
        </Badge>
      ) : (
        <Badge variant="outline" className="border-red-200 bg-red-100 text-red-700 hover:bg-red-100">
          No
        </Badge>
      ),
  },
  {
    key: "total_contracted",
    label: "Total contratado",
    width: 150,
    align: "right",
    cell: (a) => <span className="font-medium tabular-nums">{formatMoney(a.total_contracted ?? 0)}</span>,
  },
  {
    key: "currency_code",
    label: "Moneda",
    width: 90,
    cell: (a) => a.currency_code,
  },
  {
    key: "status",
    label: "Estado",
    width: 110,
    cell: (a) => (
      <Badge variant={statusLabels[a.status]?.variant || "outline"} className={statusLabels[a.status]?.className}>
        {statusLabels[a.status]?.label || a.status}
      </Badge>
    ),
  },
  {
    key: "payment_terms",
    label: "Términos",
    width: 100,
    defaultVisible: false,
    cell: (a) => `${a.payment_terms} días`,
  },
  {
    key: "discount",
    label: "Descuento",
    width: 100,
    defaultVisible: false,
    cell: (a) => (a.discount_percentage > 0 ? `${a.discount_percentage}%` : "-"),
  },
  {
    key: "location",
    label: "Ubicación",
    width: 180,
    fullText: (a) => formatLocation(a.client),
    cell: (a) => formatLocation(a.client),
  },
  {
    key: "agency",
    label: "Agencia",
    width: 160,
    fullText: (a) => a.agency?.name,
    cell: (a) => a.agency?.name || "-",
  },
]

const accountMobileFields = ["client", "quotation", "total_contracted", "currency_code", "status", "location"]

export default function AccountsPage() {
  const [mounted, setMounted] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = usePersistentState("accounts:searchTerm", "")
  const columnVisibility = useColumnVisibility("accounts", accountColumns)
  const [filters, setFilters] = usePersistentState<Filters>("accounts:filters", {
    status: "all",
    agency_id: "all",
    account_type: "all",
    client_id: "all",
    quotation: "all",
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
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

    const [clientsRes, agenciesRes, servicesRes, currenciesRes, quotationsRes] = await Promise.all([
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
      accountIds.length > 0
        ? supabase.from("entity_quotations").select("owner_id").eq("owner_type", "account").in("owner_id", accountIds)
        : { data: [] },
    ])

    const accountsWithQuotation = new Set(
      (quotationsRes.data || []).map((q: { owner_id: string }) => q.owner_id),
    )
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
      has_quotation: accountsWithQuotation.has(account.id),
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

  async function handleDuplicate(id: string) {
    if (!confirm("¿Duplicar esta cuenta? Se creará una copia con los mismos datos.")) return

    // Traer la fila completa de la cuenta
    const { data: original, error: fetchError } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !original) {
      alert("No se pudo duplicar la cuenta.")
      return
    }

    // Quitar campos que no deben copiarse y ajustar el nombre
    const {
      id: _omitId,
      created_at: _omitCreated,
      updated_at: _omitUpdated,
      account_code: _omitCode,
      ...rest
    } = original as Record<string, unknown>
    const insertPayload = {
      ...rest,
      account_code: null,
      account_name: `${original.account_name} (copia)`,
    }

    const { error: insertError } = await supabase.from("accounts").insert(insertPayload)
    if (insertError) {
      alert("No se pudo duplicar la cuenta.")
      return
    }

    await fetchAccounts()
  }

  function clearFilters() {
    setFilters({
      status: "all",
      agency_id: "all",
      account_type: "all",
      client_id: "all",
      quotation: "all",
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
      const term = searchTerm.toLowerCase()
      const matchesSearch =
        (a.account_name?.toLowerCase().includes(term) ?? false) ||
        (a.client?.company_name?.toLowerCase().includes(term) ?? false) ||
        (a.agency?.name?.toLowerCase().includes(term) ?? false)

      const matchesStatus = !filters.status || filters.status === "all" || a.status === filters.status
      const matchesAgency = !filters.agency_id || filters.agency_id === "all" || a.agency_id === filters.agency_id
      const matchesType = !filters.account_type || filters.account_type === "all" || a.account_type === filters.account_type
      const matchesClient = !filters.client_id || filters.client_id === "all" || a.client_id === filters.client_id

      const matchesQuotation =
        !filters.quotation ||
        filters.quotation === "all" ||
        (filters.quotation === "yes" ? a.has_quotation : !a.has_quotation)

      return matchesSearch && matchesStatus && matchesAgency && matchesType && matchesClient && matchesQuotation
    })
  }, [accounts, searchTerm, filters])

  const quotationSummary = useMemo(() => {
    const withQuotation = filteredAccounts.filter((a) => a.has_quotation).length
    return { withQuotation, withoutQuotation: filteredAccounts.length - withQuotation }
  }, [filteredAccounts])

  function computeTotals(rows: Account[]) {
    const map = new Map<string, number>()
    rows.forEach((a) => {
      const code = a.currency_code || "—"
      map.set(code, (map.get(code) || 0) + (a.total_contracted || 0))
    })
    return [...map.entries()]
      .filter(([code]) => code !== "—")
      .map(([code, total]) => ({ code, total }))
      .sort((a, b) => a.code.localeCompare(b.code))
  }

  const activeAccounts = useMemo(
    () => filteredAccounts.filter((a) => a.status === "active"),
    [filteredAccounts],
  )
  const inactiveAccounts = useMemo(
    () => filteredAccounts.filter((a) => a.status !== "active"),
    [filteredAccounts],
  )

  function renderAccountActions(account: Account) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Acciones de ${account.account_name}`}>
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
          <DropdownMenuItem onClick={() => handleDuplicate(account.id)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicar
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(account.id)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  function renderAccountsTable(rows: Account[], ariaLabel: string, showTotals = true) {
    // Los totales por moneda (MXN/USD) solo se muestran para las cuentas activas.
    const totals = showTotals ? computeTotals(rows) : []
    return (
      <DataTable
        ariaLabel={ariaLabel}
        rows={rows}
        columns={columnVisibility.visibleColumns}
        getRowKey={(a) => a.id}
        renderActions={renderAccountActions}
        widthsStorageKey="accounts-column-widths"
        mobileFieldKeys={accountMobileFields}
        summaryRows={totals.map((t) => ({
          key: t.code,
          label: `Total contratado (${t.code})`,
          cells: {
            total_contracted: <span className="tabular-nums">{formatMoney(t.total)}</span>,
            currency_code: t.code,
          },
        }))}
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
                {!loading && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm" aria-live="polite">
                    <Badge variant="outline" className="border-green-200 bg-green-100 text-green-700 hover:bg-green-100 tabular-nums">
                      Con cotización: {quotationSummary.withQuotation}
                    </Badge>
                    <Badge variant="outline" className="border-red-200 bg-red-100 text-red-700 hover:bg-red-100 tabular-nums">
                      Sin cotización: {quotationSummary.withoutQuotation}
                    </Badge>
                  </div>
                )}
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

                        <div className="space-y-1.5">
                          <Label className="text-xs">Cotización</Label>
                          <Select
                            value={filters.quotation ?? "all"}
                            onValueChange={(value) =>
                              setFilters({ ...filters, quotation: value as Filters["quotation"] })
                            }
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas</SelectItem>
                              <SelectItem value="yes">Con cotización</SelectItem>
                              <SelectItem value="no">Sin cotización</SelectItem>
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
                {filters.quotation && filters.quotation !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {filters.quotation === "yes" ? "Con cotización" : "Sin cotización"}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilters({ ...filters, quotation: "all" })}
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
            <div className="space-y-8">
              {/* Cuentas activas */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Cuentas activas</h3>
                  <Badge variant="secondary" className="tabular-nums">{activeAccounts.length}</Badge>
                </div>
                {activeAccounts.length > 0 ? (
                  renderAccountsTable(activeAccounts, "Cuentas activas")
                ) : (
                  <p className="py-4 text-sm text-muted-foreground">No hay cuentas activas.</p>
                )}
              </div>

              {/* Cuentas inactivas */}
              <div className="space-y-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 h-8 gap-2 px-2"
                  onClick={() => setShowInactive((v) => !v)}
                >
                  {showInactive ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="text-sm font-semibold">Cuentas inactivas</span>
                  <Badge variant="secondary" className="tabular-nums">{inactiveAccounts.length}</Badge>
                </Button>
            {showInactive &&
              (inactiveAccounts.length > 0 ? (
                renderAccountsTable(inactiveAccounts, "Cuentas inactivas", false)
                  ) : (
                    <p className="py-4 text-sm text-muted-foreground">No hay cuentas inactivas.</p>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
