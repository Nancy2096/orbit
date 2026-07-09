"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { usePermissions } from "@/components/dashboard/permissions-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Plus, Search, HandCoins, DollarSign, Clock, CheckCircle, Eye, AlertTriangle, Pencil, Trash2 } from "lucide-react"
import { DepartmentFilter } from "@/components/hr/department-filter"
import { toast } from "sonner"

interface Loan {
  id: string
  loan_number: string | null
  loan_type: string
  description: string | null
  principal_amount: number
  interest_rate: number
  total_amount: number
  number_of_payments: number
  payment_amount: number
  payments_made: number
  amount_paid: number
  remaining_balance: number
  status: string
  request_date: string | null
  start_date: string | null
  end_date: string | null
  staff: {
    id: string
    first_name: string
    last_name: string
    department: { name: string } | null
  }
  agency: {
    id: string
    name: string
  }
}

interface Agency {
  id: string
  name: string
}

interface Department {
  id: string
  name: string
  agency_id: string | null
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  active: "Activo",
  paid: "Pagado",
  defaulted: "Vencido",
  cancelled: "Cancelado",
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "outline",
  active: "default",
  paid: "default",
  defaulted: "destructive",
  cancelled: "destructive",
}

const typeLabels: Record<string, string> = {
  personal: "Personal",
  emergency: "Emergencia",
  education: "Educación",
  medical: "Médico",
  housing: "Vivienda",
  other: "Otro",
}

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [agencyFilter, setAgencyFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()
  const { roleName, fullAccess } = usePermissions()

  // Solo Super Administrador y Dirección General (o acceso total) pueden editar o borrar.
  const canManage = fullAccess || roleName === "superadmin" || roleName === "direccion_general"

  useEffect(() => {
    fetchData()
  }, [])

  const handleDelete = async () => {
    if (!loanToDelete) return
    setDeleting(true)
    const { error } = await supabase.from("loans").delete().eq("id", loanToDelete.id)
    if (error) {
      toast.error("Error al borrar el préstamo")
      setDeleting(false)
    } else {
      toast.success("Préstamo borrado")
      setLoans((prev) => prev.filter((l) => l.id !== loanToDelete.id))
      setDeleting(false)
      setLoanToDelete(null)
    }
  }

  const fetchData = async () => {
    try {
      const [loansRes, agenciesRes, departmentsRes] = await Promise.all([
        supabase
          .from("loans")
          .select(`
            *,
            staff:staff(id, first_name, last_name, department:departments(name)),
            agency:agencies(id, name)
          `)
          .order("created_at", { ascending: false }),
        supabase
          .from("agencies")
          .select("id, name")
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("departments")
          .select("id, name, agency_id")
          .order("name"),
      ])

      if (loansRes.data) setLoans(loansRes.data)
      if (agenciesRes.data) setAgencies(agenciesRes.data)
      if (departmentsRes.data) setDepartments(departmentsRes.data)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLoans = loans.filter((loan) => {
    const staffName = `${loan.staff?.first_name || ""} ${loan.staff?.last_name || ""}`.toLowerCase()
    const matchesSearch = staffName.includes(searchTerm.toLowerCase()) ||
      (loan.loan_number?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (loan.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    const matchesStatus = statusFilter === "all" || loan.status === statusFilter
    const matchesType = typeFilter === "all" || loan.loan_type === typeFilter
    const matchesAgency = agencyFilter === "all" || loan.agency?.id === agencyFilter
    const matchesDepartment = departmentFilter === "all" || loan.staff?.department?.name === departmentFilter
    return matchesSearch && matchesStatus && matchesType && matchesAgency && matchesDepartment
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
  const totalLoaned = loans.reduce((sum, l) => sum + Number(l.principal_amount || 0), 0)
  const totalPending = loans
    .filter((l) => l.status === "active")
    .reduce((sum, l) => sum + Number(l.remaining_balance || 0), 0)
  const totalCollected = loans.reduce((sum, l) => sum + Number(l.amount_paid || 0), 0)
  const activeCount = loans.filter((l) => l.status === "active").length
  const defaultedCount = loans.filter((l) => l.status === "defaulted").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Préstamos</h1>
          <p className="text-muted-foreground">
            Gestiona los préstamos al personal y su seguimiento de pagos
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/hr/loans/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Préstamo
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prestado</CardTitle>
            <HandCoins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalLoaned)}</div>
            <p className="text-xs text-muted-foreground">Capital total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Cobrar</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPending)}</div>
            <p className="text-xs text-muted-foreground">Saldo pendiente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobrado</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCollected)}</div>
            <p className="text-xs text-muted-foreground">Total recuperado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">Préstamos vigentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{defaultedCount}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Préstamos</CardTitle>
          <CardDescription>Todos los préstamos otorgados al personal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por empleado, número o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={agencyFilter}
              onValueChange={(value) => {
                setAgencyFilter(value)
                setDepartmentFilter("all")
              }}
            >
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
            <DepartmentFilter
              departments={departments}
              agencyId={agencyFilter}
              value={departmentFilter}
              onChange={setDepartmentFilter}
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="emergency">Emergencia</SelectItem>
                <SelectItem value="education">Educación</SelectItem>
                <SelectItem value="medical">Médico</SelectItem>
                <SelectItem value="housing">Vivienda</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="approved">Aprobado</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
                <SelectItem value="defaulted">Vencido</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : filteredLoans.length === 0 ? (
            <Empty>
              <EmptyMedia variant="icon">
                <HandCoins className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No hay préstamos</EmptyTitle>
              <EmptyDescription>
                {searchTerm || statusFilter !== "all" || typeFilter !== "all" || agencyFilter !== "all" || departmentFilter !== "all"
                  ? "No se encontraron resultados para tu búsqueda"
                  : "Comienza registrando el primer préstamo"}
              </EmptyDescription>
              {!searchTerm && statusFilter === "all" && typeFilter === "all" && agencyFilter === "all" && departmentFilter === "all" && (
                <Button asChild className="mt-4">
                  <Link href="/dashboard/hr/loans/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Préstamo
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
                    <TableHead className="text-right">Capital</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[140px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoans.map((loan) => {
                    const progress = loan.number_of_payments > 0
                      ? (loan.payments_made / loan.number_of_payments) * 100
                      : 0
                    return (
                      <TableRow key={loan.id}>
                        <TableCell>
                          <div className="font-medium">
                            {loan.staff?.first_name} {loan.staff?.last_name}
                          </div>
                          {loan.loan_number && (
                            <div className="text-xs text-muted-foreground">
                              #{loan.loan_number}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{typeLabels[loan.loan_type] || loan.loan_type}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(loan.principal_amount || 0))}
                          {loan.interest_rate > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {loan.interest_rate}% interés
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="w-full max-w-[120px]">
                            <Progress value={progress} className="h-2" />
                            <div className="text-xs text-muted-foreground mt-1">
                              {loan.payments_made}/{loan.number_of_payments} pagos
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(loan.remaining_balance || 0))}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusColors[loan.status]}>
                            {statusLabels[loan.status] || loan.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                              <Link href={`/dashboard/hr/loans/${loan.id}`}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Ver</span>
                              </Link>
                            </Button>
                            {canManage && (
                              <>
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                  <Link href={`/dashboard/hr/loans/${loan.id}/edit`}>
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Editar</span>
                                  </Link>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => setLoanToDelete(loan)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Borrar</span>
                                </Button>
                              </>
                            )}
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

      <AlertDialog open={!!loanToDelete} onOpenChange={(open) => !open && setLoanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar este préstamo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el préstamo
              {loanToDelete?.loan_number ? ` #${loanToDelete.loan_number}` : ""} de{" "}
              {loanToDelete?.staff?.first_name} {loanToDelete?.staff?.last_name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Spinner className="mr-2 h-4 w-4" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Borrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
