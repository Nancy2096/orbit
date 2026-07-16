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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { Plus, Search, BadgePercent, DollarSign, Clock, CheckCircle, Lock, MoreHorizontal } from "lucide-react"
import { useAgency } from "@/contexts/agency-context"

interface Commission {
  id: string
  commission_type: string
  description: string | null
  base_amount: number
  commission_percentage: number | null
  commission_amount: number
  status: string
  period_date: string | null
  staff: {
    id: string
    first_name: string
    last_name: string
  }
  project: {
    id: string
    name: string
  } | null
  account: {
    id: string
    account_name: string
  } | null
  agency: {
    id: string
    name: string
  }
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  paid: "Pagada",
  cancelled: "Cancelada",
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "outline",
  paid: "default",
  cancelled: "destructive",
}

const typeLabels: Record<string, string> = {
  appointment: "Por Cita",
  client: "Por Cliente",
  project: "Proyecto",
  sale: "Venta",
  retention: "Retencion",
  referral: "Referido",
  other: "Otro",
}

interface SalesRep {
  id: string
  first_name: string
  last_name: string
}

export default function CommissionsPage() {
  const { selectedAgencyId, loading: agencyLoading } = useAgency()
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [salesReps, setSalesReps] = useState<SalesRep[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [salesRepFilter, setSalesRepFilter] = useState<string>("all")
  const supabase = createClient()

  useEffect(() => {
    if (selectedAgencyId) {
      fetchData()
    } else {
      setLoading(false)
      setCommissions([])
    }
  }, [selectedAgencyId])

  const fetchData = async () => {
    if (!selectedAgencyId) return
    setLoading(true)
    try {
      // Fetch sales reps
      const { data: salesRepsData } = await supabase
        .from("staff")
        .select("id, first_name, last_name")
        .or(`agency_id.eq.${selectedAgencyId},is_global.eq.true`)
        .eq("is_active", true)
        .order("first_name")

      if (salesRepsData) setSalesReps(salesRepsData)

      // Fetch commissions
      const { data: commissionsData } = await supabase
        .from("commissions")
        .select(`
          *,
          staff:staff(id, first_name, last_name),
          project:projects(id, name),
          account:accounts(id, account_name),
          agency:agencies(id, name)
        `)
        .eq("agency_id", selectedAgencyId)
        .order("created_at", { ascending: false })

      if (commissionsData) setCommissions(commissionsData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Una comisión pagada queda bloqueada: no se puede editar ni cambiar de estado
  // (ya fue liquidada en la nómina). Las canceladas también se bloquean.
  const isLocked = (status: string) => status === "paid" || status === "cancelled"

  const handleChangeStatus = async (commission: Commission, newStatus: string) => {
    if (isLocked(commission.status)) {
      toast.error("Esta comisión ya está liquidada y no puede modificarse")
      return
    }
    try {
      const updates: Record<string, unknown> = { status: newStatus }

      if (newStatus === "approved") {
        // Registrar quién aprueba (users.id del usuario autenticado) y cuándo.
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          toast.error("Debes iniciar sesión para aprobar comisiones")
          return
        }
        updates.approved_by = user.id
        updates.approved_at = new Date().toISOString()
      }
      if (newStatus === "paid") updates.paid_at = new Date().toISOString()

      const { error } = await supabase.from("commissions").update(updates).eq("id", commission.id)
      if (error) throw error

      setCommissions((prev) =>
        prev.map((c) => (c.id === commission.id ? { ...c, status: newStatus } : c)),
      )
      toast.success(`Comisión marcada como ${statusLabels[newStatus].toLowerCase()}`)
    } catch (error) {
      console.error("Error updating commission status:", error)
      const message = error instanceof Error ? error.message : "No se pudo actualizar el estado de la comisión"
      toast.error(message)
    }
  }

  const filteredCommissions = commissions.filter((commission) => {
    const staffName = `${commission.staff?.first_name || ""} ${commission.staff?.last_name || ""}`.toLowerCase()
    const matchesSearch = staffName.includes(searchTerm.toLowerCase()) ||
      (commission.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    const matchesStatus = statusFilter === "all" || commission.status === statusFilter
    const matchesSalesRep = salesRepFilter === "all" || commission.staff?.id === salesRepFilter
    return matchesSearch && matchesStatus && matchesSalesRep
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getUTCDate()
    const month = date.toLocaleString("es-MX", { month: "short", timeZone: "UTC" })
    const year = date.getUTCFullYear()
    return `${day} ${month} ${year}`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  // Stats
  const totalCommissions = commissions.reduce((sum, c) => sum + Number(c.commission_amount || 0), 0)
  const pendingAmount = commissions
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0)
  const paidAmount = commissions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0)
  const pendingCount = commissions.filter((c) => c.status === "pending").length

  if (agencyLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!selectedAgencyId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <BadgePercent className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Selecciona una Agencia</h2>
        <p className="text-muted-foreground max-w-md">
          Para ver las comisiones, primero selecciona una agencia en el selector de arriba.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comisiones</h1>
          <p className="text-muted-foreground">
            Gestiona las comisiones del equipo por ventas y proyectos
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/hr/commissions/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Comision
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comisiones</CardTitle>
            <BadgePercent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCommissions)}</div>
            <p className="text-xs text-muted-foreground">Todas las comisiones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">{pendingCount} comisiones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(paidAmount)}</div>
            <p className="text-xs text-muted-foreground">Total pagado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(commissions.length > 0 ? totalCommissions / commissions.length : 0)}
            </div>
            <p className="text-xs text-muted-foreground">Por comisión</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Comisiones</CardTitle>
          <CardDescription>Todas las comisiones registradas del equipo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por empleado o descripcion..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="approved">Aprobada</SelectItem>
                <SelectItem value="paid">Pagada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={salesRepFilter} onValueChange={setSalesRepFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Asesor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los asesores</SelectItem>
                {salesReps.map((rep) => (
                  <SelectItem key={rep.id} value={rep.id}>
                    {rep.first_name} {rep.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : filteredCommissions.length === 0 ? (
            <Empty>
              <EmptyMedia variant="icon">
                <BadgePercent className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No hay comisiones</EmptyTitle>
              <EmptyDescription>
                {searchTerm || statusFilter !== "all" || salesRepFilter !== "all"
                  ? "No se encontraron resultados para tu busqueda"
                  : "Comienza registrando la primera comision"}
              </EmptyDescription>
              {!searchTerm && statusFilter === "all" && salesRepFilter === "all" && (
                <Button asChild className="mt-4">
                  <Link href="/dashboard/hr/commissions/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Comisión
                  </Link>
                </Button>
              )}
            </Empty>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Base</TableHead>
                    <TableHead>%</TableHead>
                    <TableHead className="text-right">Comisión</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCommissions.map((commission) => {
                    const locked = isLocked(commission.status)
                    return (
                    <TableRow key={commission.id} className={locked ? "bg-muted/30" : undefined}>
                      <TableCell className="font-medium">
                        {commission.staff?.first_name} {commission.staff?.last_name}
                      </TableCell>
                      <TableCell>{typeLabels[commission.commission_type] || commission.commission_type}</TableCell>
                      <TableCell>
                        {commission.project?.name || commission.account?.account_name || "-"}
                      </TableCell>
                      <TableCell>{formatCurrency(Number(commission.base_amount || 0))}</TableCell>
                      <TableCell>
                        {commission.commission_percentage ? `${commission.commission_percentage}%` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(commission.commission_amount || 0))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[commission.status]} className="gap-1">
                          {locked && <Lock className="h-3 w-3" />}
                          {statusLabels[commission.status] || commission.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Acciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Cambiar estado</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {locked ? (
                              <DropdownMenuItem disabled className="gap-2">
                                <Lock className="h-4 w-4" />
                                Comisión liquidada (bloqueada)
                              </DropdownMenuItem>
                            ) : (
                              <>
                                {commission.status === "pending" && (
                                  <DropdownMenuItem onClick={() => handleChangeStatus(commission, "approved")}>
                                    Aprobar
                                  </DropdownMenuItem>
                                )}
                                {(commission.status === "pending" || commission.status === "approved") && (
                                  <DropdownMenuItem onClick={() => handleChangeStatus(commission, "paid")}>
                                    Marcar como pagada
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleChangeStatus(commission, "cancelled")}
                                >
                                  Cancelar
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
