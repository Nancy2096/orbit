"use client"

import { useState, useEffect } from "react"
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
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Briefcase, FolderKanban } from "lucide-react"

interface Account {
  id: string
  account_name: string
  account_type: string
  retainer_amount: number | null
  payment_terms: number
  discount_percentage: number
  status: string
  client: {
    company_name: string
  } | null
  agency: {
    name: string
  } | null
  account_manager: {
    first_name: string
    last_name: string
  } | null
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

export default function AccountsPage() {
  const [mounted, setMounted] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
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
    
    // First, get accounts with basic relations
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
        account_manager_id
      `)
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
    const staffIds = [...new Set(data.map(a => a.account_manager_id).filter(Boolean))]

    const [clientsRes, agenciesRes, staffRes] = await Promise.all([
      clientIds.length > 0 
        ? supabase.from("clients").select("id, company_name").in("id", clientIds)
        : { data: [] },
      agencyIds.length > 0
        ? supabase.from("agencies").select("id, name").in("id", agencyIds)
        : { data: [] },
      staffIds.length > 0
        ? supabase.from("staff").select("id, first_name, last_name").in("id", staffIds)
        : { data: [] },
    ])

    const clientsMap = new Map((clientsRes.data || []).map(c => [c.id, c]))
    const agenciesMap = new Map((agenciesRes.data || []).map(a => [a.id, a]))
    const staffMap = new Map((staffRes.data || []).map(s => [s.id, s]))

    // Map data to expected interface
    const mappedData = data.map(account => ({
      ...account,
      client: account.client_id ? clientsMap.get(account.client_id) || null : null,
      agency: account.agency_id ? agenciesMap.get(account.agency_id) || null : null,
      account_manager: account.account_manager_id ? staffMap.get(account.account_manager_id) || null : null,
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

  const filteredAccounts = accounts.filter(
    (a) =>
      a.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.client?.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.agency?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Lista de Cuentas</CardTitle>
              <CardDescription>
                {accounts.length} cuenta{accounts.length !== 1 ? "s" : ""} registrada{accounts.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cuenta, cliente o agencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
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
                {searchTerm ? "No se encontraron resultados para tu búsqueda" : "Comienza creando tu primera cuenta"}
              </EmptyDescription>
              {!searchTerm && (
                <Button asChild>
                  <Link href="/dashboard/accounts/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Cuenta
                  </Link>
                </Button>
              )}
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Agencia</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{account.account_name}</div>
                        {account.discount_percentage > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Descuento: {account.discount_percentage}%
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {account.client?.company_name || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {account.agency?.name || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge variant="outline">
                          {typeLabels[account.account_type] || account.account_type}
                        </Badge>
                        {account.account_type === "retainer" && account.retainer_amount && (
                          <div className="text-xs text-muted-foreground mt-1">
                            ${account.retainer_amount.toLocaleString("es-MX")}/mes
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {account.account_manager
                          ? `${account.account_manager.first_name} ${account.account_manager.last_name}`
                          : "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusLabels[account.status]?.variant || "outline"}>
                        {statusLabels[account.status]?.label || account.status}
                      </Badge>
                    </TableCell>
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
