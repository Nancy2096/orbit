"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  UserCheck,
  Building2,
  Banknote,
  Upload,
  ChevronDown,
  Pencil,
} from "lucide-react"
import { toast } from "sonner"

interface ApprovalHistory {
  id: string
  action: string
  comments: string | null
  created_at: string | null
  performed_by: { first_name: string; last_name: string } | null
}

interface BankAccount {
  id: string
  bank_name: string
  account_name: string | null
  account_number: string | null
  clabe: string | null
  is_primary: boolean | null
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
  bank_account_id: string | null
  payment_receipt_url: string | null
  payment_receipt_uploaded_at: string | null
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
  pending: "Enviado a aprobación",
  approved: "Aprobado",
  paid: "Marcado como pagado",
  rejected: "Rechazado",
  cancelled: "Cancelado",
  draft: "Regresado a borrador",
  created: "Creado",
  receipt_uploaded: "Comprobante de pago subido",
  receipt_replaced: "Comprobante de pago reemplazado",
  bank_selected: "Banco de salida asignado",
}

// Estados del flujo de un gasto. El campo `status` es la fuente de verdad.
const statusConfig: Record<
  string,
  { label: string; className: string; icon: typeof Clock }
> = {
  draft: { label: "Borrador", className: "bg-gray-100 text-gray-700 border-gray-200", icon: Pencil },
  pending: { label: "Pendiente de aprobación", className: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
  approved: { label: "Aprobado", className: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle },
  paid: { label: "Pagado", className: "bg-blue-50 text-blue-700 border-blue-200", icon: Banknote },
  rejected: { label: "Rechazado", className: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
}

// Estados que el usuario puede seleccionar desde las acciones.
const selectableStatuses: { value: string; label: string }[] = [
  { value: "draft", label: "Borrador" },
  { value: "pending", label: "Pendiente de aprobación" },
  { value: "approved", label: "Aprobado" },
  { value: "paid", label: "Pagado" },
]

export default function ExpenseDetailPage() {
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()

  const [expense, setExpense] = useState<ExpenseDetail | null>(null)
  const [history, setHistory] = useState<ApprovalHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(null)
  const [savingStatus, setSavingStatus] = useState(false)

  // Banco de salida (visible cuando el gasto está aprobado).
  const [banks, setBanks] = useState<BankAccount[]>([])
  const [savingBank, setSavingBank] = useState(false)

  // Comprobante de pago (visible cuando el gasto está pagado).
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const receiptInputRef = useRef<HTMLInputElement>(null)

  const loadExpense = async () => {
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
    return data as ExpenseDetail | null
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      // Staff del usuario autenticado (para aprobado por / historial).
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: staffData } = await supabase
          .from("staff")
          .select("id")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle()
        setCurrentStaffId(staffData?.id ?? null)
      }
      await loadExpense()
      setLoading(false)
    }
    if (id) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Cargar los bancos activos de la agencia cuando el gasto lo necesita
  // (aprobado -> banco de salida; pagado -> mostrar el banco elegido).
  useEffect(() => {
    const agencyId = expense?.agency?.id
    if (!agencyId || (expense?.status !== "approved" && expense?.status !== "paid")) return
    const loadBanks = async () => {
      const { data } = await supabase
        .from("bank_accounts")
        .select("id, bank_name, account_name, account_number, clabe, is_primary")
        .eq("agency_id", agencyId)
        .eq("is_active", true)
        .order("is_primary", { ascending: false })
        .order("bank_name", { ascending: true })
      setBanks((data as BankAccount[]) || [])
    }
    loadBanks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expense?.agency?.id, expense?.status])

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

  // Cambia el estado del gasto y registra el movimiento en el historial.
  const handleChangeStatus = async (newStatus: string) => {
    if (!expense || newStatus === expense.status) return
    setSavingStatus(true)
    try {
      const updates: Record<string, unknown> = {
        status: newStatus,
        // approval_status se mantiene coherente con el flujo para los filtros.
        approval_status: newStatus === "paid" ? "approved" : newStatus,
        updated_at: new Date().toISOString(),
      }
      if (newStatus === "approved") {
        updates.approved_at = new Date().toISOString()
        if (currentStaffId) updates.approved_by_id = currentStaffId
      }
      if (newStatus === "paid" && !expense.payment_date) {
        updates.payment_date = new Date().toISOString()
      }
      if (newStatus === "draft" || newStatus === "pending") {
        // Al regresar el gasto, se limpia la aprobación previa.
        updates.approved_at = null
        updates.approved_by_id = null
      }

      const { error } = await supabase.from("expenses").update(updates).eq("id", expense.id)
      if (error) throw error

      if (currentStaffId) {
        const comments =
          newStatus === "paid"
            ? `Gasto marcado como pagado el ${new Date().toLocaleString("es-MX")}.`
            : `Estado cambiado a "${statusConfig[newStatus]?.label || newStatus}"`
        await supabase.from("expense_approval_history").insert({
          expense_id: expense.id,
          action: newStatus,
          performed_by_id: currentStaffId,
          comments,
        })
      }

      toast.success(`Estado actualizado a ${statusConfig[newStatus]?.label || newStatus}`)
      await loadExpense()
    } catch (err) {
      console.error("Error changing status:", err)
      toast.error("No se pudo actualizar el estado")
    } finally {
      setSavingStatus(false)
    }
  }

  // Guarda el banco de salida seleccionado.
  const handleSelectBank = async (bankId: string) => {
    if (!expense) return
    setSavingBank(true)
    try {
      const { error } = await supabase
        .from("expenses")
        .update({ bank_account_id: bankId, updated_at: new Date().toISOString() })
        .eq("id", expense.id)
      if (error) throw error

      if (currentStaffId) {
        const bank = banks.find((b) => b.id === bankId)
        await supabase.from("expense_approval_history").insert({
          expense_id: expense.id,
          action: "bank_selected",
          performed_by_id: currentStaffId,
          comments: bank
            ? `Banco de salida asignado: ${bank.bank_name} - ${bank.account_name}.`
            : "Banco de salida asignado.",
        })
      }

      setExpense((prev) => (prev ? { ...prev, bank_account_id: bankId } : prev))
      await loadExpense()
      toast.success("Banco de salida guardado")
    } catch (err) {
      console.error("Error saving bank:", err)
      toast.error("No se pudo guardar el banco de salida")
    } finally {
      setSavingBank(false)
    }
  }

  // Sube el comprobante de pago y registra la fecha/hora de subida.
  const handleUploadReceipt = async (file: File) => {
    if (!expense) return
    setUploadingReceipt(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("invoiceId", expense.id)
      const res = await fetch("/api/upload-payment-receipt", { method: "POST", body: formData })
      if (!res.ok) throw new Error("upload failed")
      const { url } = await res.json()

      const uploadedAt = new Date().toISOString()
      const wasReplaced = Boolean(expense.payment_receipt_url)
      const { error } = await supabase
        .from("expenses")
        .update({ payment_receipt_url: url, payment_receipt_uploaded_at: uploadedAt, updated_at: uploadedAt })
        .eq("id", expense.id)
      if (error) throw error

      if (currentStaffId) {
        await supabase.from("expense_approval_history").insert({
          expense_id: expense.id,
          action: wasReplaced ? "receipt_replaced" : "receipt_uploaded",
          performed_by_id: currentStaffId,
          comments: `Comprobante de pago ${wasReplaced ? "reemplazado" : "subido"} el ${new Date().toLocaleString("es-MX")}.`,
        })
      }

      setExpense((prev) =>
        prev ? { ...prev, payment_receipt_url: url, payment_receipt_uploaded_at: uploadedAt } : prev,
      )
      await loadExpense()
      toast.success("Comprobante de pago cargado")
    } catch (err) {
      console.error("Error uploading receipt:", err)
      toast.error("No se pudo subir el comprobante")
    } finally {
      setUploadingReceipt(false)
      if (receiptInputRef.current) receiptInputRef.current.value = ""
    }
  }

  const getStatusBadge = (status: string) => {
    const cfg = statusConfig[status]
    if (!cfg) return <Badge variant="outline">{status}</Badge>
    const Icon = cfg.icon
    return (
      <Badge variant="outline" className={cfg.className}>
        <Icon className="w-3 h-3 mr-1" />
        {cfg.label}
      </Badge>
    )
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

  const selectedBank = banks.find((b) => b.id === expense.bank_account_id) || null

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
        {getStatusBadge(expense.status || "draft")}
        {expense.is_operational && <Badge variant="secondary">Operativo</Badge>}

        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={savingStatus}>
                {savingStatus ? <Spinner className="mr-2 h-4 w-4" /> : null}
                Acciones
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Cambiar estado</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {selectableStatuses.map((s) => (
                <DropdownMenuItem
                  key={s.value}
                  disabled={s.value === expense.status}
                  onSelect={(e) => {
                    e.preventDefault()
                    handleChangeStatus(s.value)
                  }}
                >
                  {(() => {
                    const Icon = statusConfig[s.value]?.icon || Clock
                    return <Icon className="mr-2 h-4 w-4" />
                  })()}
                  {s.label}
                  {s.value === expense.status && (
                    <CheckCircle className="ml-auto h-4 w-4 text-green-600" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
              <CardTitle>Historial</CardTitle>
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

          {/* Banco de salida: visible cuando el gasto está Aprobado. */}
          {expense.status === "approved" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Banco de salida
                </CardTitle>
              </CardHeader>
              <CardContent>
                {banks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay bancos activos registrados para esta agencia.
                  </p>
                ) : (
                  <RadioGroup
                    value={expense.bank_account_id || ""}
                    onValueChange={handleSelectBank}
                    className="space-y-2"
                  >
                    {banks.map((bank) => (
                      <Label
                        key={bank.id}
                        htmlFor={`bank-${bank.id}`}
                        className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                      >
                        <RadioGroupItem id={`bank-${bank.id}`} value={bank.id} className="mt-1" disabled={savingBank} />
                        <div className="text-sm">
                          <div className="font-medium flex items-center gap-2">
                            {bank.bank_name}
                            {bank.is_primary && <Badge variant="secondary" className="text-xs">Principal</Badge>}
                          </div>
                          {bank.account_name && (
                            <div className="text-muted-foreground">{bank.account_name}</div>
                          )}
                          {bank.account_number && (
                            <div className="text-muted-foreground font-mono text-xs">
                              N° {bank.account_number}
                            </div>
                          )}
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                )}
              </CardContent>
            </Card>
          )}

          {/* Comprobante de pago: visible cuando el gasto está Pagado. */}
          {expense.status === "paid" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Comprobante de pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedBank && (
                  <div className="rounded-md bg-muted/50 p-3 text-sm">
                    <div className="text-xs text-muted-foreground">Banco de salida</div>
                    <div className="font-medium">{selectedBank.bank_name}</div>
                    {selectedBank.account_number && (
                      <div className="text-muted-foreground font-mono text-xs">N° {selectedBank.account_number}</div>
                    )}
                  </div>
                )}

                {expense.payment_receipt_url ? (
                  <div className="space-y-2">
                    <Button variant="outline" asChild className="w-full">
                      <a href={expense.payment_receipt_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="mr-2 h-4 w-4" />
                        Ver comprobante
                      </a>
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Subido el {formatDateTime(expense.payment_receipt_uploaded_at)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aún no se ha subido un comprobante de pago.</p>
                )}

                <input
                  ref={receiptInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleUploadReceipt(f)
                  }}
                />
                <Button
                  variant={expense.payment_receipt_url ? "outline" : "default"}
                  className="w-full"
                  disabled={uploadingReceipt}
                  onClick={() => receiptInputRef.current?.click()}
                >
                  {uploadingReceipt ? <Spinner className="mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                  {expense.payment_receipt_url ? "Reemplazar comprobante" : "Subir comprobante"}
                </Button>
              </CardContent>
            </Card>
          )}

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
