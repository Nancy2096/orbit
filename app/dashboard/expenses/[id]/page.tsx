"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  UserCheck,
} from "lucide-react"

interface ApprovalHistory {
  id: string
  action: string
  comments: string | null
  created_at: string | null
  performed_by: { first_name: string; last_name: string } | null
}

interface ExpenseDetail {
  id: string
  expense_number: string
  expense_date: string
  start_date: string | null
  end_date: string | null
  receipt_url: string | null
  is_operational: boolean | null
  description: string
  amount: number
  tax_amount: number
  total_amount: number
  status: string
  vendor_name: string | null
  invoice_number: string | null
  payment_method: string | null
  payment_date: string | null
  notes: string | null
  approval_status: string
  approved_at: string | null
  rejection_reason: string | null
  created_at: string | null
  category: { id: string; name: string; expense_type?: string | null } | null
  agency: { id: string; name: string } | null
  currency: { id: string; code: string; symbol: string } | null
  project: { id: string; name: string } | null
  account: { id: string; account_name: string } | null
  vendor: { id: string; name: string } | null
  requested_by: { id: string; first_name: string; last_name: string } | null
  approved_by: { id: string; first_name: string; last_name: string } | null
}

const paymentMethods: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  credit_card: "Tarjeta de Crédito",
  debit_card: "Tarjeta de Débito",
  check: "Cheque",
  petty_cash: "Caja Chica",
  other: "Otro",
}

const expenseTypes: Record<string, string> = {
  fixed: "Gastos Operativos fijos",
  variable: "Gastos Operativos Variables",
  marketing: "Marketing y Ventas",
  financial: "Impuestos y Pagos Financieros",
}

const actionLabels: Record<string, string> = {
  submitted: "Enviado a aprobación",
  approved: "Aprobado",
  rejected: "Rechazado",
  cancelled: "Cancelado",
  created: "Creado",
}

export default function ExpenseDetailPage() {
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()

  const [expense, setExpense] = useState<ExpenseDetail | null>(null)
  const [history, setHistory] = useState<ApprovalHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from("expenses")
        .select(`
          *,
          category:expense_categories(id, name, expense_type),
          agency:agencies(id, name),
          currency:currencies(id, code, symbol),
          project:projects(id, name),
          account:accounts(id, account_name),
          vendor:vendors(id, name),
          requested_by:staff!expenses_requested_by_id_fkey(id, first_name, last_name),
          approved_by:staff!expenses_approved_by_id_fkey(id, first_name, last_name)
        `)
        .eq("id", id)
        .single()

      setExpense(data as ExpenseDetail | null)

      const { data: hist } = await supabase
        .from("expense_approval_history")
        .select(`
          id, action, comments, created_at,
          performed_by:staff(first_name, last_name)
        `)
        .eq("expense_id", id)
        .order("created_at", { ascending: false })

      setHistory((hist as ApprovalHistory[]) || [])
      setLoading(false)
    }
    if (id) load()
  }, [id])

  const formatCurrency = (amount: number) => {
    const symbol = expense?.currency?.symbol || "$"
    return `${symbol}${Number(amount).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getApprovalStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Aprobado</Badge>
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rechazado</Badge>
      case "cancelled":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (!expense) {
    return (
      <div className="space-y-4 p-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/expenses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Gastos
          </Link>
        </Button>
        <p className="text-muted-foreground">No se encontró el gasto solicitado.</p>
      </div>
    )
  }

  const detailRow = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between gap-4 py-2 text-sm border-b last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/expenses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <h1 className="text-2xl font-bold font-mono">{expense.expense_number}</h1>
        {getApprovalStatusBadge(expense.approval_status || "pending")}
        {expense.is_operational && <Badge variant="secondary">Operativo</Badge>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Información del Gasto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {detailRow("Descripción", expense.description)}
              {detailRow("Agencia", expense.agency?.name || "-")}
              {detailRow("Categoría", expense.category?.name || "Sin categoría")}
              {detailRow(
                "Tipo de Gasto",
                expense.category?.expense_type ? expenseTypes[expense.category.expense_type] || expense.category.expense_type : "-",
              )}
              {detailRow("Proyecto", expense.project?.name || "-")}
              {detailRow("Cuenta", expense.account?.account_name || "-")}
              {detailRow("Proveedor", expense.vendor?.name || expense.vendor_name || "-")}
              {detailRow("N° Factura", expense.invoice_number || "-")}
              {detailRow("Método de Pago", expense.payment_method ? paymentMethods[expense.payment_method] || expense.payment_method : "-")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fechas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {detailRow("Fecha de Registro", formatDateTime(expense.created_at))}
              {detailRow("Fecha de Inicio", formatDate(expense.start_date))}
              {detailRow("Fecha Final", formatDate(expense.end_date))}
              {detailRow("Fecha de Pago", formatDate(expense.payment_date))}
            </CardContent>
          </Card>

          {expense.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{expense.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Historial de Aprobación</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin movimientos registrados.</p>
              ) : (
                <div className="space-y-4">
                  {history.map((h) => (
                    <div key={h.id} className="flex gap-3 text-sm">
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <div>
                        <div className="font-medium">{actionLabels[h.action] || h.action}</div>
                        <div className="text-muted-foreground">
                          {h.performed_by ? `${h.performed_by.first_name} ${h.performed_by.last_name}` : "Sistema"}
                          {" · "}
                          {formatDateTime(h.created_at)}
                        </div>
                        {h.comments && <div className="mt-1 text-muted-foreground">{h.comments}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Montos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {detailRow("Subtotal", formatCurrency(expense.amount))}
              {detailRow("IVA", formatCurrency(expense.tax_amount))}
              <div className="flex justify-between gap-4 pt-3 text-base font-bold">
                <span>Total</span>
                <span>{formatCurrency(expense.total_amount)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Solicitante</div>
                  <div className="font-medium">
                    {expense.requested_by ? `${expense.requested_by.first_name} ${expense.requested_by.last_name}` : "-"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-xs text-muted-foreground">Aprobado por</div>
                  <div className="font-medium">
                    {expense.approved_by ? `${expense.approved_by.first_name} ${expense.approved_by.last_name}` : "-"}
                    {expense.approved_at && <span className="text-muted-foreground"> · {formatDateTime(expense.approved_at)}</span>}
                  </div>
                </div>
              </div>
              {expense.rejection_reason && (
                <div className="rounded-md bg-red-50 p-3 text-red-700">
                  <div className="text-xs font-medium">Motivo de rechazo</div>
                  <div>{expense.rejection_reason}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {expense.receipt_url && (
            <Card>
              <CardHeader>
                <CardTitle>Comprobante</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild className="w-full">
                  <a
                    href={`/api/file?pathname=${encodeURIComponent(expense.receipt_url)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Ver comprobante
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
