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
import { usePermissions } from "@/components/dashboard/permissions-provider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Plus, Search, BadgePercent, DollarSign, Clock, CheckCircle, Lock, MoreHorizontal, Eye, FileText, CalendarClock, UserPlus, Pencil, Trash2 } from "lucide-react"
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
  approved_at: string | null
  paid_at: string | null
  prospect_id: string | null
  commission_type_id: string | null
  clientType: {
    name: string
    amount: number
  } | null
  prospect: {
    company_name: string | null
    contact_name: string | null
  } | null
  approver: {
    first_name: string | null
    last_name: string | null
    email: string | null
  } | null
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

interface Quotation {
  id: string
  file_name: string
  file_url: string
  created_at: string
}

interface ProspectDetail {
  company_name: string | null
  contact_name: string | null
  created_at: string | null
  client_type: string | null
  quotations: Quotation[]
  appointmentDate: string | null
}

export default function CommissionsPage() {
  const { selectedAgencyId, loading: agencyLoading } = useAgency()
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [salesReps, setSalesReps] = useState<SalesRep[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [salesRepFilter, setSalesRepFilter] = useState<string>("all")
  const [detailCommission, setDetailCommission] = useState<Commission | null>(null)
  const [prospectDetail, setProspectDetail] = useState<ProspectDetail | null>(null)
  const [prospectLoading, setProspectLoading] = useState(false)
  const { roleName, fullAccess } = usePermissions()
  const supabase = createClient()

  // Solo Super Administrador y Dirección General (o acceso total) pueden editar comisiones.
  const canEdit = fullAccess || roleName === "superadmin" || roleName === "direccion_general"

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
          clientType:agency_commission_types!commission_type_id(name, amount),
          prospect:crm_prospects!prospect_id(company_name, contact_name),
          approver:users!commissions_approved_by_fkey(first_name, last_name, email),
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

  // Abre el detalle de la comisión y carga los datos del prospecto asociado
  // (tipo de cliente, cotización, fecha de registro y fecha de la cita).
  const openDetail = async (commission: Commission) => {
    setDetailCommission(commission)
    setProspectDetail(null)
    if (!commission.prospect_id) return

    setProspectLoading(true)
    try {
      const [prospectRes, quotationsRes, appointmentRes] = await Promise.all([
        supabase
          .from("crm_prospects")
          .select("company_name, contact_name, created_at, client_type:agency_commission_types(name)")
          .eq("id", commission.prospect_id)
          .maybeSingle(),
        supabase
          .from("crm_prospect_quotations")
          .select("id, file_name, file_url, created_at")
          .eq("prospect_id", commission.prospect_id)
          .order("created_at", { ascending: false }),
        supabase
          .from("crm_activities")
          .select("activity_date")
          .eq("prospect_id", commission.prospect_id)
          .eq("activity_type", "meeting")
          .order("activity_date", { ascending: true })
          .limit(1)
          .maybeSingle(),
      ])

      const prospect = prospectRes.data as
        | { company_name: string | null; contact_name: string | null; created_at: string | null; client_type: { name: string } | { name: string }[] | null }
        | null
      const clientTypeRel = prospect?.client_type
      const clientType = Array.isArray(clientTypeRel) ? clientTypeRel[0]?.name ?? null : clientTypeRel?.name ?? null

      setProspectDetail({
        company_name: prospect?.company_name ?? null,
        contact_name: prospect?.contact_name ?? null,
        created_at: prospect?.created_at ?? null,
        client_type: clientType,
        quotations: quotationsRes.data || [],
        appointmentDate: appointmentRes.data?.activity_date ?? null,
      })
    } catch (error) {
      console.error("Error fetching prospect detail:", error)
    } finally {
      setProspectLoading(false)
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

  const handleDelete = async (commission: Commission) => {
    if (isLocked(commission.status)) {
      toast.error("Esta comisión ya está liquidada y no puede eliminarse")
      return
    }
    if (!confirm("¿Eliminar esta comisión? Esta acción no se puede deshacer.")) return
    try {
      const { error } = await supabase.from("commissions").delete().eq("id", commission.id)
      if (error) throw error
      setCommissions((prev) => prev.filter((c) => c.id !== commission.id))
      toast.success("Comisión eliminada")
    } catch (error) {
      console.error("Error deleting commission:", error)
      const message = error instanceof Error ? error.message : "No se pudo eliminar la comisión"
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
          <h1 className="text-3xl font-bold tracking-tight">Comisiones Citas</h1>
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
                    <TableHead>Tipo de cliente</TableHead>
                    <TableHead>Prospecto</TableHead>
                    <TableHead className="text-right">Comisión</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Pagado</TableHead>
                    <TableHead>Aprobada por</TableHead>
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
                      <TableCell>{commission.clientType?.name || "-"}</TableCell>
                      <TableCell>
                        {commission.prospect?.company_name || commission.prospect?.contact_name || "-"}
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
                        {commission.paid_at ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-green-600">Pagado</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(commission.paid_at)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Pendiente</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {commission.approver ? (
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {[commission.approver.first_name, commission.approver.last_name]
                                .filter(Boolean)
                                .join(" ") || commission.approver.email}
                            </span>
                            {commission.approved_at && (
                              <span className="text-xs text-muted-foreground">
                                {formatDate(commission.approved_at)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetail(commission)}
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Ver detalle</span>
                          </Button>
                          <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Acciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEdit && (
                              <>
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/hr/commissions/${commission.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuLabel>Cambiar estado</DropdownMenuLabel>
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
                            {canEdit && !locked && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDelete(commission)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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

      {/* Detalle de comisión */}
      <Dialog
        open={!!detailCommission}
        onOpenChange={(open) => {
          if (!open) {
            setDetailCommission(null)
            setProspectDetail(null)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle de la comisión</DialogTitle>
            <DialogDescription>
              {detailCommission?.staff?.first_name} {detailCommission?.staff?.last_name}
            </DialogDescription>
          </DialogHeader>
          {detailCommission && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado</span>
                <Badge variant={statusColors[detailCommission.status]} className="gap-1">
                  {isLocked(detailCommission.status) && <Lock className="h-3 w-3" />}
                  {statusLabels[detailCommission.status] || detailCommission.status}
                </Badge>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Tipo</p>
                  <p className="font-medium">
                    {typeLabels[detailCommission.commission_type] || detailCommission.commission_type}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Referencia</p>
                  <p className="font-medium">
                    {detailCommission.project?.name || detailCommission.account?.account_name || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Monto base</p>
                  <p className="font-medium">{formatCurrency(Number(detailCommission.base_amount || 0))}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Porcentaje</p>
                  <p className="font-medium">
                    {detailCommission.commission_percentage ? `${detailCommission.commission_percentage}%` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Comisión</p>
                  <p className="font-semibold text-blue-600">
                    {formatCurrency(Number(detailCommission.commission_amount || 0))}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fecha del periodo</p>
                  <p className="font-medium">
                    {detailCommission.period_date ? formatDate(detailCommission.period_date) : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Agencia</p>
                  <p className="font-medium">{detailCommission.agency?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Aprobada por</p>
                  <p className="font-medium">
                    {detailCommission.approver
                      ? [detailCommission.approver.first_name, detailCommission.approver.last_name]
                          .filter(Boolean)
                          .join(" ") ||
                        detailCommission.approver.email ||
                        "-"
                      : "-"}
                    {detailCommission.approved_at && (
                      <span className="block text-xs text-muted-foreground">
                        {formatDate(detailCommission.approved_at)}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tipo de cliente</p>
                  <p className="font-medium">
                    {detailCommission.clientType?.name || "-"}
                    {detailCommission.clientType?.amount != null && (
                      <span className="block text-xs text-muted-foreground">
                        Tarifa: {formatCurrency(Number(detailCommission.clientType.amount))}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Información del prospecto (CRM) */}
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium">Información del prospecto</p>
                {!detailCommission.prospect_id ? (
                  <p className="text-sm text-muted-foreground">Esta comisión no está ligada a un prospecto.</p>
                ) : prospectLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Spinner className="h-4 w-4" />
                    Cargando información...
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                    {(prospectDetail?.company_name || prospectDetail?.contact_name) && (
                      <p className="font-medium">
                        {prospectDetail?.company_name || prospectDetail?.contact_name}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Registro del prospecto:</span>
                      <span className="font-medium">
                        {prospectDetail?.created_at ? formatDate(prospectDetail.created_at) : "-"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Cita:</span>
                      <span className="font-medium">
                        {prospectDetail?.appointmentDate ? formatDate(prospectDetail.appointmentDate) : "Sin cita registrada"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cotización:</span>
                      {prospectDetail && prospectDetail.quotations.length > 0 ? (
                        <div className="mt-1 space-y-1">
                          {prospectDetail.quotations.map((q) => (
                            <a
                              key={q.id}
                              href={q.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:underline"
                            >
                              <FileText className="h-4 w-4 shrink-0" />
                              <span className="truncate">{q.file_name}</span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="ml-1 font-medium">Sin cotización</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {detailCommission.description && (
                <>
                  <Separator />
                  <div className="text-sm">
                    <p className="text-muted-foreground">Descripción</p>
                    <p className="mt-1 whitespace-pre-wrap">{detailCommission.description}</p>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailCommission(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
