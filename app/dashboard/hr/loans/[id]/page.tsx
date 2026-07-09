"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { usePermissions } from "@/components/dashboard/permissions-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
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
import { LoanAuthorizers } from "@/components/hr/loan-authorizers"
import {
  ArrowLeft,
  HandCoins,
  User,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Pencil,
  Trash2,
} from "lucide-react"
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
  payment_frequency: string | null
  payments_made: number
  amount_paid: number
  remaining_balance: number
  status: string
  request_date: string | null
  approval_date: string | null
  start_date: string | null
  notes: string | null
  created_at: string
  staff: {
    id: string
    first_name: string
    last_name: string
    department: { name: string } | null
  } | null
  agency: {
    id: string
    name: string
  } | null
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  active: "Activo",
  paid: "Pagado",
  defaulted: "Vencido",
  cancelled: "Cancelado / Rechazado",
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

const frequencyLabels: Record<string, string> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
}

export default function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const { roleName, fullAccess } = usePermissions()

  // Solo Super Administrador y Dirección General (o acceso total) pueden
  // autorizar, editar o borrar préstamos.
  const canAuthorize = fullAccess || roleName === "superadmin" || roleName === "direccion_general"

  const [loan, setLoan] = useState<Loan | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchLoan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchLoan = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("loans")
      .select(`
        *,
        staff:staff(id, first_name, last_name, department:departments(name)),
        agency:agencies(id, name)
      `)
      .eq("id", id)
      .single()

    if (error || !data) {
      toast.error("No se encontró el préstamo")
      setLoading(false)
      return
    }
    setLoan(data as Loan)
    setLoading(false)
  }

  const authorizeLoan = async () => {
    if (!loan) return
    setUpdating(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase
      .from("loans")
      .update({
        status: "active",
        approval_date: new Date().toISOString().split("T")[0],
        approved_by: user?.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", loan.id)

    if (error) {
      toast.error("Error al autorizar el préstamo")
    } else {
      toast.success("Préstamo autorizado y registrado")
      fetchLoan()
    }
    setUpdating(false)
  }

  const rejectLoan = async () => {
    if (!loan) return
    setUpdating(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase
      .from("loans")
      .update({
        status: "cancelled",
        approved_by: user?.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", loan.id)

    if (error) {
      toast.error("Error al rechazar el préstamo")
    } else {
      toast.success("Préstamo rechazado")
      fetchLoan()
    }
    setUpdating(false)
  }

  const deleteLoan = async () => {
    if (!loan) return
    setDeleting(true)
    const { error } = await supabase.from("loans").delete().eq("id", loan.id)
    if (error) {
      toast.error("Error al borrar el préstamo")
      setDeleting(false)
    } else {
      toast.success("Préstamo borrado")
      router.push("/dashboard/hr/loans")
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    const day = date.getUTCDate()
    const month = date.toLocaleString("es-MX", { month: "short", timeZone: "UTC" })
    const year = date.getUTCFullYear()
    return `${day} ${month} ${year}`
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!loan) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <HandCoins className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Préstamo no encontrado</h2>
        <Button asChild className="mt-4">
          <Link href="/dashboard/hr/loans">Volver a Préstamos</Link>
        </Button>
      </div>
    )
  }

  const isPending = loan.status === "pending"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/hr/loans">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Detalle del Préstamo</h1>
          <p className="text-muted-foreground">
            {loan.staff?.first_name} {loan.staff?.last_name}
            {loan.loan_number && ` · #${loan.loan_number}`}
          </p>
        </div>
        {canAuthorize && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/hr/loans/${loan.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Borrar
            </Button>
          </div>
        )}
        <Badge variant={statusColors[loan.status]} className="text-sm">
          {statusLabels[loan.status] || loan.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Info principal */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <HandCoins className="h-5 w-5 text-primary" />
              <CardTitle>Información del Préstamo</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Empleado</p>
                  <p className="font-medium">
                    {loan.staff?.first_name} {loan.staff?.last_name}
                  </p>
                  {loan.staff?.department?.name && (
                    <p className="text-sm text-muted-foreground">{loan.staff.department.name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Agencia</p>
                  <p className="font-medium">{loan.agency?.name || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <HandCoins className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">{typeLabels[loan.loan_type] || loan.loan_type}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de solicitud</p>
                  <p className="font-medium">{formatDate(loan.request_date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <DollarSign className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Capital</p>
                  <p className="font-medium">{formatCurrency(Number(loan.principal_amount || 0))}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <DollarSign className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total a pagar</p>
                  <p className="font-medium text-lg">{formatCurrency(Number(loan.total_amount || 0))}</p>
                  {loan.interest_rate > 0 && (
                    <p className="text-sm text-muted-foreground">{loan.interest_rate}% interés</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Plazos</p>
                  <p className="font-medium">
                    {loan.number_of_payments} pagos ·{" "}
                    {frequencyLabels[loan.payment_frequency || "monthly"] || loan.payment_frequency}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(Number(loan.payment_amount || 0))} por período
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de autorización</p>
                  <p className="font-medium">{formatDate(loan.approval_date)}</p>
                </div>
              </div>
            </div>

            {loan.description && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Descripción / Motivo</p>
                <p className="text-sm">{loan.description}</p>
              </div>
            )}
            {loan.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notas internas</p>
                <p className="text-sm">{loan.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Autorización */}
        <Card>
          <CardHeader>
            <CardTitle>Autorización</CardTitle>
            <CardDescription>
              El préstamo debe ser autorizado por Super Administrador o Dirección General para registrarse.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPending ? (
              canAuthorize ? (
                <div className="flex flex-col gap-2">
                  <Button onClick={authorizeLoan} disabled={updating} className="w-full">
                    {updating ? (
                      <Spinner className="mr-2 h-4 w-4" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Autorizar préstamo
                  </Button>
                  <Button
                    onClick={rejectLoan}
                    disabled={updating}
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Rechazar
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border border-dashed p-4">
                  <p className="mb-3 text-sm text-muted-foreground">
                    Pendiente de autorización por Super Administrador o Dirección General.
                  </p>
                  <LoanAuthorizers compact />
                </div>
              )
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant={statusColors[loan.status]}>
                  {statusLabels[loan.status] || loan.status}
                </Badge>
                {loan.status !== "cancelled" && (
                  <span className="text-muted-foreground">
                    Autorizado el {formatDate(loan.approval_date)}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar este préstamo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el préstamo
              {loan.loan_number ? ` #${loan.loan_number}` : ""} de {loan.staff?.first_name}{" "}
              {loan.staff?.last_name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                deleteLoan()
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
