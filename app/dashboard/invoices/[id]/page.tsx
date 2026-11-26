"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { FinanceHistory, refreshFinanceHistory } from "@/components/finance/finance-history"
import { parseLocalDate } from "@/lib/utils"
import { getDocumentPalette } from "@/lib/document-colors"
import { InvoicePreviewDocument, InvoicePrintDocument } from "@/components/invoices/invoice-print-document"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { 
  ArrowLeft, 
  MoreVertical, 
  Send, 
  CreditCard, 
  FileText,
  XCircle,
  Pencil,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Printer,
  Eye
} from "lucide-react"

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  discount_percentage: number
  tax_rate: number
  subtotal: number
  tax_amount: number
  total: number
  service: { id: string; name: string } | null
}

interface Payment {
  id: string
  payment_number: string
  payment_date: string
  amount: number
  payment_method: string
  reference_number: string | null
  status: string
}

interface AgencyBranding {
  primary_color: string
  secondary_color: string
  accent_color: string
  text_color: string
  background_color: string
  font_family: string
  tagline: string
}

interface Invoice {
  id: string
  invoice_number: string
  invoice_type: string
  status: string
  issue_date: string
  due_date: string | null
  subtotal: number
  tax_amount: number
  tax_rate: number
  discount_amount: number
  total_amount: number
  paid_amount: number
  balance_due: number
  exchange_rate: number
  bank_account_id: string | null
  payment_terms: number
  cfdi_use: string | null
  payment_method: string | null
  notes: string | null
  internal_notes: string | null
  created_at: string
  client: { id: string; company_name: string; rfc: string | null; email: string | null; address: string | null } | null
  account: { id: string; name: string; notes?: string | null } | null
  agency: { 
    id: string
    name: string
    legal_name: string | null
    tax_id: string | null
    address: string | null
    phone: string | null
    email: string | null
    website: string | null
    logo_url: string | null
    settings: { branding?: AgencyBranding } | null
  } | null
  currency: { id: string; code: string; symbol: string } | null
  project: { id: string; name: string; notes?: string | null } | null
}

function getSourceNotes(invoice: Pick<Invoice, "account" | "project">): string | null {
  return invoice.project?.notes?.trim() || invoice.account?.notes?.trim() || null
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: "Borrador", variant: "secondary", icon: FileText },
  validated: { label: "Validado", variant: "outline", icon: CheckCircle },
  pending: { label: "Por Cobrar", variant: "default", icon: Clock },
  sent: { label: "Enviada", variant: "outline", icon: Send },
  paid: { label: "Pagado", variant: "default", icon: CheckCircle },
  partial: { label: "Pago Parcial", variant: "outline", icon: DollarSign },
  overdue: { label: "Vencido", variant: "destructive", icon: AlertCircle },
  cancelled: { label: "Cancelado", variant: "secondary", icon: XCircle },
}

const paymentMethods: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  check: "Cheque",
  credit_card: "Tarjeta de Crédito",
  debit_card: "Tarjeta de Débito",
  paypal: "PayPal",
  other: "Otro",
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [bankAccounts, setBankAccounts] = useState<{ id: string; bank_name: string; account_number: string }[]>([])

  const [newPayment, setNewPayment] = useState({
    payment_date: new Date().toISOString().split("T")[0],
    amount: 0,
    payment_method: "transfer",
    reference_number: "",
    bank_account_id: "",
    notes: "",
  })

  useEffect(() => {
    fetchInvoice()
    fetchItems()
    fetchPayments()
  }, [id])

  const fetchInvoice = async () => {
    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        client:clients(id, company_name, billing_email, primary_contact_email, address, city, state, country, payment_terms, credit_limit),
        account:accounts(id, account_name, notes),
        agency:agencies(id, name, legal_name, tax_id, address, phone, email, website, logo_url, settings),
        currency:currencies(id, code, symbol),
        project:projects(id, name, notes)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching invoice:", error)
      router.push("/dashboard/invoices")
    } else {
      setInvoice(data)
      // Initialize bank_account_id from invoice if exists
      if (data.bank_account_id) {
        setNewPayment(prev => ({ ...prev, bank_account_id: data.bank_account_id }))
      }
      // Fetch bank accounts for this agency
      if (data.agency_id) {
        const { data: accounts } = await supabase
          .from("bank_accounts")
          .select("id, bank_name, account_number")
          .eq("agency_id", data.agency_id)
          .eq("is_active", true)
        if (accounts) setBankAccounts(accounts)
      }
    }
    setLoading(false)
    refreshFinanceHistory("invoice", id)
  }

  const fetchItems = async () => {
    const { data } = await supabase
      .from("invoice_items")
      .select(`
        *,
        service:services(id, name)
      `)
      .eq("invoice_id", id)
      .order("sort_order")
    if (data) setItems(data)
  }

  const fetchPayments = async () => {
    const { data } = await supabase
      .from("payments")
      .select("*")
      .eq("invoice_id", id)
      .order("payment_date", { ascending: false })
    if (data) setPayments(data)
  }

  const saveBankAccount = async (bankAccountId: string) => {
    setNewPayment(prev => ({ ...prev, bank_account_id: bankAccountId }))
    
    const { error } = await supabase
      .from("invoices")
      .update({ bank_account_id: bankAccountId, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      toast.error("Error al guardar la cuenta bancaria")
    } else {
      toast.success("Cuenta bancaria guardada")
      setInvoice(prev => prev ? { ...prev, bank_account_id: bankAccountId } : null)
    }
  }

  const updateInvoiceStatus = async (newStatus: string) => {
    setActionLoading(true)
    
    const updateData: Record<string, unknown> = { 
      status: newStatus, 
      updated_at: new Date().toISOString() 
    }
    
    // Include bank_account_id if selected
    if (newPayment.bank_account_id) {
      updateData.bank_account_id = newPayment.bank_account_id
    }
    
    // Al marcar como pagada, salda el pendiente y aplica el pago al banco.
    const bankForPayment = newPayment.bank_account_id || invoice?.bank_account_id || ""
    const outstanding = invoice ? Number(invoice.balance_due ?? invoice.total_amount) : 0
    const willRegisterPayment =
      newStatus === "paid" && invoice?.status !== "paid" && outstanding > 0

    if (willRegisterPayment) {
      updateData.paid_amount = invoice!.total_amount
      updateData.balance_due = 0
      updateData.payment_date = newPayment.payment_date
    }

    const { error } = await supabase
      .from("invoices")
      .update(updateData)
      .eq("id", id)

    if (error) {
      toast.error("Error al actualizar el estado: " + error.message)
      setActionLoading(false)
      setShowStatusDialog(false)
      return
    }

    // Crea el registro de pago para que se refleje en el saldo del banco
    if (willRegisterPayment && invoice) {
      if (!bankForPayment) {
        toast.warning("Factura marcada como pagada, pero sin banco seleccionado no se refleja en Bancos.")
      } else {
        const paymentNumber = await generatePaymentNumber()
        const { error: paymentError } = await supabase.from("payments").insert({
          agency_id: invoice.agency?.id,
          invoice_id: invoice.id,
          client_id: invoice.client?.id,
          payment_number: paymentNumber,
          payment_date: newPayment.payment_date,
          amount: outstanding,
          currency_id: invoice.currency?.id,
          exchange_rate: invoice.exchange_rate,
          payment_method: newPayment.payment_method,
          reference_number: newPayment.reference_number || null,
          bank_account_id: bankForPayment,
          status: "completed",
          notes: newPayment.notes || null,
        })
        if (paymentError) {
          toast.error("El estado se actualizó, pero no se pudo aplicar al banco: " + paymentError.message)
        }
      }
    }

    toast.success("Estado actualizado correctamente")
    setInvoice(prev =>
      prev
        ? {
            ...prev,
            status: newStatus,
            bank_account_id: bankForPayment || prev.bank_account_id,
            ...(willRegisterPayment ? { paid_amount: prev.total_amount, balance_due: 0 } : {}),
          }
        : null
    )
    if (willRegisterPayment) fetchPayments()
    setActionLoading(false)
    setShowStatusDialog(false)
  }

  const generatePaymentNumber = async () => {
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("agency_id", invoice?.agency?.id)
    
    const nextNumber = (count || 0) + 1
    return `PAG-${year}-${String(nextNumber).padStart(5, "0")}`
  }

  const registerPayment = async () => {
    if (!invoice || newPayment.amount <= 0) return
    setActionLoading(true)

    const paymentNumber = await generatePaymentNumber()
    const { error: paymentError } = await supabase
      .from("payments")
      .insert({
        agency_id: invoice.agency?.id,
        invoice_id: invoice.id,
        client_id: invoice.client?.id,
        payment_number: paymentNumber,
        payment_date: newPayment.payment_date,
        amount: newPayment.amount,
        currency_id: invoice.currency?.id,
        exchange_rate: invoice.exchange_rate,
        payment_method: newPayment.payment_method,
        reference_number: newPayment.reference_number || null,
        bank_account_id: newPayment.bank_account_id || null,
        status: "completed",
        notes: newPayment.notes || null,
      })

    if (paymentError) {
      console.error("Error registering payment:", paymentError)
      setActionLoading(false)
      return
    }

    // Update invoice amounts
    const newPaidAmount = Number(invoice.paid_amount) + newPayment.amount
    const newBalanceDue = Number(invoice.total_amount) - newPaidAmount
    let newStatus = invoice.status

    if (newBalanceDue <= 0) {
      newStatus = "paid"
    } else if (newPaidAmount > 0) {
      newStatus = "partial"
    }

    await supabase
      .from("invoices")
      .update({
        paid_amount: newPaidAmount,
        balance_due: Math.max(0, newBalanceDue),
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    setShowPaymentDialog(false)
    setNewPayment({
      payment_date: new Date().toISOString().split("T")[0],
      amount: 0,
      payment_method: "transfer",
      reference_number: "",
      bank_account_id: "",
      notes: "",
    })
    fetchInvoice()
    fetchPayments()
    setActionLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p>Factura no encontrada</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/invoices">Volver a Facturas</Link>
        </Button>
      </div>
    )
  }

  const status = statusConfig[invoice.status] || statusConfig.draft
  const StatusIcon = status.icon

  const formatCurrency = (amount: number) => {
    const symbol = invoice.currency?.symbol || "$"
    return `${symbol}${Number(amount).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string | null) => {
  if (!dateString) return "-"
  return parseLocalDate(dateString).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })
  }

  // Fecha con hora, usada para la fecha de alta en el sistema (auditoría).
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Branding helpers
  const branding = invoice.agency?.settings?.branding || {
    primary_color: "#3B82F6",
    secondary_color: "#10B981",
    accent_color: "#F59E0B",
    text_color: "#1F2937",
    background_color: "#FFFFFF",
    font_family: "Inter",
    tagline: "",
  }

  const docPalette = getDocumentPalette(branding)

  const getLogoUrl = (logoUrl: string | null) => {
    if (!logoUrl) return null
    if (logoUrl.includes('.vercel-storage.com/')) {
      const pathname = logoUrl.split('.vercel-storage.com/')[1]
      return `/api/file?pathname=${encodeURIComponent(pathname)}`
    }
    if (logoUrl.startsWith('logos/') || logoUrl.startsWith('staff-photos/')) {
      return `/api/file?pathname=${encodeURIComponent(logoUrl)}`
    }
    return logoUrl
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{invoice.invoice_number}</h1>
              <Badge variant={status.variant} className="gap-1">
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">{invoice.client?.company_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {invoice.status === "draft" && (
            <Button onClick={() => updateInvoiceStatus("sent")} disabled={actionLoading}>
              <Send className="mr-2 h-4 w-4" />
              Marcar como Enviada
            </Button>
          )}
          {["sent", "partial", "overdue"].includes(invoice.status) && (
            <Button onClick={() => {
              setNewPayment(prev => ({ ...prev, amount: Number(invoice.balance_due) }))
              setShowPaymentDialog(true)
            }}>
              <CreditCard className="mr-2 h-4 w-4" />
              Registrar Pago
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/invoices/${id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowPrintPreview(true)}>
                <Eye className="mr-2 h-4 w-4" />
                Vista Previa / Imprimir
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowStatusDialog(true)}>
                Cambiar Estado
              </DropdownMenuItem>
              {invoice.status !== "cancelled" && (
                <DropdownMenuItem
                  onClick={() => updateInvoiceStatus("cancelled")}
                  className="text-destructive"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancelar Factura
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client & Agency Info */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Facturar a</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="font-semibold">{invoice.client?.company_name}</div>
                  {invoice.client?.address && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {invoice.client.address}
                      {invoice.client.city && `, ${invoice.client.city}`}
                      {invoice.client.state && `, ${invoice.client.state}`}
                      {invoice.client.country && `, ${invoice.client.country}`}
                    </div>
                  )}
                </div>
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Correo de Facturación:</span>
                    <span className="font-medium">{invoice.client?.billing_email || invoice.client?.primary_contact_email || "No especificado"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Términos de Pago:</span>
                    <span className="font-medium">{invoice.client?.payment_terms ? `${invoice.client.payment_terms} días` : "No especificado"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Límite de Crédito:</span>
                    <span className="font-medium">
                      {invoice.client?.credit_limit 
                        ? formatCurrency(invoice.client.credit_limit, invoice.currency?.code || "MXN")
                        : "Sin límite"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">De</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-semibold">{invoice.agency?.name}</div>
                {invoice.agency?.address && <div className="text-sm text-muted-foreground mt-2">{invoice.agency.address}</div>}
                {invoice.agency?.phone && <div className="text-sm text-muted-foreground">{invoice.agency.phone}</div>}
              </CardContent>
            </Card>
          </div>

          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles de la Factura</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Fecha de Emisión</div>
                  <div className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(invoice.issue_date)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Fecha de Vencimiento</div>
                  <div className="font-medium flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDate(invoice.due_date)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Términos de Pago</div>
                  <div className="font-medium">{invoice.payment_terms} días</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Moneda</div>
                  <div className="font-medium">{invoice.currency?.code || "MXN"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Fecha de Alta en el Sistema</div>
                  <div className="font-medium flex items-center gap-1" title="Fecha en que se registró la factura en el sistema (no editable)">
                    <Clock className="h-4 w-4" />
                    {formatDateTime(invoice.created_at)}
                  </div>
                </div>
              </div>
              {(invoice.cfdi_use || invoice.payment_method) && (
                <div className="grid gap-4 md:grid-cols-4 text-sm mt-4 pt-4 border-t">
                  {invoice.cfdi_use && (
                    <div>
                      <div className="text-muted-foreground">Uso de CFDI</div>
                      <div className="font-medium">{invoice.cfdi_use}</div>
                    </div>
                  )}
                  {invoice.payment_method && (
                    <div>
                      <div className="text-muted-foreground">Método de Pago</div>
                      <div className="font-medium">{invoice.payment_method}</div>
                    </div>
                  )}
                  {invoice.account && (
                    <div>
                      <div className="text-muted-foreground">Cuenta</div>
                      <div className="font-medium">{invoice.account?.account_name}</div>
                    </div>
                  )}
                  {invoice.project && (
                    <div>
                      <div className="text-muted-foreground">Proyecto</div>
                      <div className="font-medium">{invoice.project.name}</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Partidas</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Descripción</TableHead>
                    <TableHead className="text-right">Cant.</TableHead>
                    <TableHead className="text-right">P. Unitario</TableHead>
                    <TableHead className="text-right">Desc.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">IVA</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.description}</div>
                        {item.service && (
                          <div className="text-sm text-muted-foreground">{item.service.name}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell className="text-right">{item.discount_percentage}%</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.tax_amount)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Notes */}
          {(getSourceNotes(invoice) || invoice.notes || invoice.internal_notes) && (
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {getSourceNotes(invoice) && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Notas {invoice.project?.notes?.trim() ? "del proyecto" : "de la cuenta"}
                    </div>
                    <p className="text-sm whitespace-pre-line">{getSourceNotes(invoice)}</p>
                  </div>
                )}
                {invoice.notes && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Notas para el Cliente</div>
                    <p className="text-sm">{invoice.notes}</p>
                  </div>
                )}
                {invoice.internal_notes && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Notas Internas</div>
                    <p className="text-sm">{invoice.internal_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payments History */}
          {payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historial de Pagos</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.payment_number}</TableCell>
                        <TableCell>{formatDate(payment.payment_date)}</TableCell>
                        <TableCell>{paymentMethods[payment.payment_method] || payment.payment_method}</TableCell>
                        <TableCell>{payment.reference_number || "-"}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Totals */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {Number(invoice.discount_amount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Descuento</span>
                  <span className="text-destructive">-{formatCurrency(invoice.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA ({invoice.tax_rate}%)</span>
                <span>{formatCurrency(invoice.tax_amount)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">{formatCurrency(invoice.total_amount)}</span>
              </div>
              {Number(invoice.paid_amount) > 0 && (
                <>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Pagado</span>
                    <span>-{formatCurrency(invoice.paid_amount)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold">Saldo Pendiente</span>
                    <span className={`text-xl font-bold ${Number(invoice.balance_due) > 0 ? "text-amber-600" : "text-green-600"}`}>
                      {formatCurrency(invoice.balance_due)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Bank Account Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Cuenta Bancaria
              </CardTitle>
              <CardDescription>
                Banco para recibir el pago de esta factura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {bankAccounts.length > 0 ? (
                <>
                  <Select
                    value={newPayment.bank_account_id}
                    onValueChange={(value) => saveBankAccount(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.bank_name} - {account.account_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newPayment.bank_account_id && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">Banco guardado:</p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {bankAccounts.find(a => a.id === newPayment.bank_account_id)?.bank_name} - {bankAccounts.find(a => a.id === newPayment.bank_account_id)?.account_number}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hay cuentas bancarias configuradas para esta agencia.</p>
                  <Button variant="link" size="sm" asChild className="mt-2">
                    <Link href="/dashboard/settings/bank-accounts">
                      Agregar cuenta bancaria
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rapidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full" 
                onClick={() => window.print()}
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver Factura
              </Button>
              {["sent", "partial", "overdue"].includes(invoice.status) && (
                <Button 
                  variant="outline"
                  className="w-full" 
                  onClick={() => {
                    setNewPayment(prev => ({ ...prev, amount: Number(invoice.balance_due) }))
                    setShowPaymentDialog(true)
                  }}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Registrar Pago
                </Button>
              )}
              <Button variant="outline" className="w-full" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir Factura
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/dashboard/invoices/${id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar Factura
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="print:hidden">
        <FinanceHistory entityType="invoice" entityId={id} />
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              Saldo pendiente: {formatCurrency(invoice.balance_due)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Pago</Label>
                <Input
                  type="date"
                  value={newPayment.payment_date}
                  onChange={(e) => setNewPayment({ ...newPayment, payment_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Monto</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <Select
                value={newPayment.payment_method}
                onValueChange={(value) => setNewPayment({ ...newPayment, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentMethods).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {bankAccounts.length > 0 && (
              <div className="space-y-2">
                <Label>Cuenta de Banco</Label>
                <Select
                  value={newPayment.bank_account_id}
                  onValueChange={(value) => setNewPayment({ ...newPayment, bank_account_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cuenta..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.bank_name} - {account.account_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Referencia / Número de Operación</Label>
              <Input
                value={newPayment.reference_number || ""}
                onChange={(e) => setNewPayment({ ...newPayment, reference_number: e.target.value })}
                placeholder="Ej: 123456789"
              />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={newPayment.notes || ""}
                onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                placeholder="Notas adicionales..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancelar</Button>
            <Button onClick={registerPayment} disabled={actionLoading || newPayment.amount <= 0}>
              {actionLoading && <Spinner className="mr-2 h-4 w-4" />}
              Registrar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cambiar Estado de Factura</DialogTitle>
            <DialogDescription>Selecciona el nuevo estado y la cuenta bancaria de ingreso</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Bank Account Selector */}
            <div className="space-y-2">
              <Label>Cuenta Bancaria de Ingreso *</Label>
              {bankAccounts.length > 0 ? (
                <Select
                  value={newPayment.bank_account_id}
                  onValueChange={(value) => setNewPayment(prev => ({ ...prev, bank_account_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la cuenta bancaria" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.bank_name} - {account.account_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900 text-sm text-amber-700 dark:text-amber-300">
                  No hay cuentas bancarias configuradas para esta agencia.
                </div>
              )}
            </div>
            
            {/* Status Buttons */}
            <div className="space-y-2">
              <Label>Nuevo Estado</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(statusConfig).map(([key, config]) => {
                  const Icon = config.icon
                  return (
                    <Button
                      key={key}
                      variant={invoice.status === key ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => updateInvoiceStatus(key)}
                      disabled={actionLoading || (bankAccounts.length > 0 && !newPayment.bank_account_id)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {config.label}
                    </Button>
                  )
                })}
              </div>
            </div>
            
            {bankAccounts.length > 0 && !newPayment.bank_account_id && (
              <p className="text-sm text-destructive">
                Debes seleccionar una cuenta bancaria antes de cambiar el estado.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Preview Dialog */}
      <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Vista Previa de Factura
            </DialogTitle>
            <DialogDescription>
              Revisa la factura antes de imprimir. Los colores y el logo corresponden a la personalización de la agencia.
            </DialogDescription>
          </DialogHeader>
          
          <InvoicePreviewDocument
            invoice={invoice}
            items={items}
            palette={docPalette}
            logoUrl={getLogoUrl(invoice.agency?.logo_url ?? null)}
            tagline={branding.tagline}
            fontFamily={branding.font_family}
            sourceNotes={getSourceNotes(invoice)}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPrintPreview(false)}>
              Cerrar
            </Button>
            <Button onClick={() => window.print()} style={{ backgroundColor: docPalette.brand, color: docPalette.onBrand }}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InvoicePrintDocument
            invoice={invoice}
            items={items}
            palette={docPalette}
            logoUrl={getLogoUrl(invoice.agency?.logo_url ?? null)}
            tagline={branding.tagline}
            fontFamily={branding.font_family}
            sourceNotes={getSourceNotes(invoice)}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
      />
    </div>
  )
}
