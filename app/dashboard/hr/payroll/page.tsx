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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { Plus, Search, Wallet, Calendar, DollarSign, Users, Eye, CheckCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react"

interface PayrollPeriod {
  id: string
  period_name: string
  period_type: string
  start_date: string
  end_date: string
  payment_date: string | null
  status: string
  total_gross: number
  total_deductions: number
  total_net: number
  agency: {
    id: string
    name: string
  }
}

interface Agency {
  id: string
  name: string
}

const statusLabels: Record<string, string> = {
  draft: "Borrador",
  calculating: "Calculando",
  approved: "Aprobada",
  paid: "Pagada",
  cancelled: "Cancelada",
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  calculating: "outline",
  approved: "default",
  paid: "default",
  cancelled: "destructive",
}

const periodTypeLabels: Record<string, string> = {
  semanal: "Semanal",
  quincenal: "Quincenal",
  mensual: "Mensual",
}

export default function PayrollPage() {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [agencyFilter, setAgencyFilter] = useState<string>("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [periodToDelete, setPeriodToDelete] = useState<PayrollPeriod | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [periodsRes, agenciesRes] = await Promise.all([
        supabase
          .from("payroll_periods")
          .select(`
            *,
            agency:agencies(id, name)
          `)
          .order("start_date", { ascending: false }),
        supabase
          .from("agencies")
          .select("id, name")
          .eq("is_active", true)
          .order("name"),
      ])

      if (periodsRes.data) setPeriods(periodsRes.data)
      if (agenciesRes.data) setAgencies(agenciesRes.data)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPeriods = periods.filter((period) => {
    const matchesSearch = period.period_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || period.status === statusFilter
    const matchesAgency = agencyFilter === "all" || period.agency?.id === agencyFilter
    return matchesSearch && matchesStatus && matchesAgency
  })

  const handleDeletePeriod = async () => {
    if (!periodToDelete) return

    try {
      // First delete related payroll entries
      await supabase
        .from("payroll_entries")
        .delete()
        .eq("period_id", periodToDelete.id)

      // Then delete the period
      const { error } = await supabase
        .from("payroll_periods")
        .delete()
        .eq("id", periodToDelete.id)

      if (error) throw error

      setPeriods(periods.filter(p => p.id !== periodToDelete.id))
      toast.success("Periodo eliminado correctamente")
    } catch (error) {
      console.error("Error deleting period:", error)
      toast.error("Error al eliminar el periodo")
    } finally {
      setDeleteDialogOpen(false)
      setPeriodToDelete(null)
    }
  }

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
  const totalGross = periods.reduce((sum, p) => sum + Number(p.total_gross || 0), 0)
  const totalNet = periods.reduce((sum, p) => sum + Number(p.total_net || 0), 0)
  const pendingCount = periods.filter((p) => p.status === "draft" || p.status === "calculating").length
  const paidCount = periods.filter((p) => p.status === "paid").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nómina</h1>
          <p className="text-muted-foreground">
            Gestiona los períodos de nómina y pagos al personal
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/hr/payroll/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Período
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bruto</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalGross)}</div>
            <p className="text-xs text-muted-foreground">Todos los períodos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Neto</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalNet)}</div>
            <p className="text-xs text-muted-foreground">Después de deducciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Por procesar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidCount}</div>
            <p className="text-xs text-muted-foreground">Períodos completados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Períodos de Nómina</CardTitle>
          <CardDescription>Lista de todos los períodos de nómina registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre del período..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={agencyFilter} onValueChange={setAgencyFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Agencia" />
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="calculating">Calculando</SelectItem>
                <SelectItem value="approved">Aprobada</SelectItem>
                <SelectItem value="paid">Pagada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : filteredPeriods.length === 0 ? (
            <Empty>
              <EmptyMedia variant="icon">
                <Wallet className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No hay períodos de nómina</EmptyTitle>
              <EmptyDescription>
                {searchTerm || statusFilter !== "all" || agencyFilter !== "all"
                  ? "No se encontraron resultados para tu búsqueda"
                  : "Comienza creando el primer período de nómina"}
              </EmptyDescription>
              {!searchTerm && statusFilter === "all" && agencyFilter === "all" && (
                <Button asChild className="mt-4">
                  <Link href="/dashboard/hr/payroll/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Período
                  </Link>
                </Button>
              )}
            </Empty>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Agencia</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fechas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total Neto</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPeriods.map((period) => (
                    <TableRow key={period.id}>
                      <TableCell className="font-medium">{period.period_name}</TableCell>
                      <TableCell>{period.agency?.name || "Global"}</TableCell>
                      <TableCell>{periodTypeLabels[period.period_type] || period.period_type}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(period.start_date)} - {formatDate(period.end_date)}
                        </div>
                        {period.payment_date && (
                          <div className="text-xs text-muted-foreground">
                            Pago: {formatDate(period.payment_date)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[period.status]}>
                          {statusLabels[period.status] || period.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(period.total_net || 0))}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Acciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/hr/payroll/${period.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalle
                              </Link>
                            </DropdownMenuItem>
                            {(period.status === "draft" || period.status === "calculating") && (
                              <>
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/hr/payroll/${period.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    setPeriodToDelete(period)
                                    setDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </>
                            )}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar periodo de nómina?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el periodo &quot;{periodToDelete?.period_name}&quot; 
              y todos sus registros de pago asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePeriod}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
