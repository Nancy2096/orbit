"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Plus, Search, FileText, Eye, DollarSign, Clock, AlertCircle, CheckCircle, Settings, Upload, CreditCard, MoreHorizontal, X, RefreshCw, Landmark, Pencil } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface Invoice {
  id: string
  invoice_number: string
  invoice_type: string
  status: string
  issue_date: string
  due_date: string | null
  subtotal: number
  tax_amount: number
  total_amount: number
  paid_amount: number
  balance_due: number
  client: { id: string; company_name: string } | null
  account: { id: string; name: string } | null
  agency: { id: string; name: string } | null
  currency: { id: string; code: string; symbol: string } | null
}

interface Agency {
  id: string
  name: string
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: "Borrador", variant: "secondary", icon: FileText },
  validated: { label: "Validado", variant: "outline", icon: CheckCircle },
  pending: { label: "Por Cobrar", variant: "default", icon: Clock },
  paid: { label: "Pagado", variant: "default", icon: CheckCircle },
  overdue: { label: "Vencido", variant: "destructive", icon: AlertCircle },
  cancelled: { label: "Cancelado", variant: "secondary", icon: FileText },
}

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAgency, setSelectedAgency] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const supabase = createClient()

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [paymentData, setPaymentData] = useState({
    status: "paid",
    payment_reference: "",
    payment_notes: "",
    payment_date: new Date().toISOString().split('T')[0],
    bank_account_id: "",
    payment_method: "transfer",
  })
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [bankAccounts, setBankAccounts] = useState<{ id: string; bank_name: string; account_number: string; account_name: string }[]>([])

  // Change status modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [statusInvoice, setStatusInvoice] = useState<Invoice | null>(null)
  const [newStatus, setNewStatus] = useState("")
  const [statusPaymentData, setStatusPaymentData] = useState({
    bank_account_id: "",
    payment_method: "transfer",
    payment_reference: "",
    payment_date: new Date().toISOString().split('T')[0],
  })
  const [statusBankAccounts, setStatusBankAccounts] = useState<{ id: string; bank_name: string; account_number: string; account_name: string }[]>([])

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    overdue: 0,
    paid: 0,
  })

  useEffect(() => {
    fetchAgencies()
    fetchInvoices()
  }, [selectedAgency, selectedStatus])

  const fetchAgencies = async () => {
    const { data } = await supabase
      .from("agencies")
      .select("id, name")
      .eq("is_active", true)
      .order("name")
    if (data) setAgencies(data)
  }

  const fetchBankAccountsForAgency = async (agencyId: string) => {
const { data } = await supabase
        .from("bank_accounts")
        .select("id, bank_name, account_number, account_name")
        .eq("agency_id", agencyId)
        .eq("is_active", true)
        .order("bank_name")
    
    setBankAccounts(data || [])
  }

  const openPaymentModal = async (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setPaymentData({
      status: "paid",
      payment_reference: "",
      payment_notes: "",
      payment_date: new Date().toISOString().split('T')[0],
      bank_account_id: "",
      payment_method: "transfer",
    })
    setReceiptFile(null)
    
    // Fetch bank accounts for the invoice's agency
    const agencyId = invoice.agency?.id || (invoice as Record<string, unknown>).agency_id as string
    
if (agencyId) {
  const { data } = await supabase
  .from("bank_accounts")
  .select("id, bank_name, account_number, account_name")
  .eq("agency_id", agencyId)
  .eq("is_active", true)
  .order("bank_name")
  
  setBankAccounts(data || [])
    } else {
      setBankAccounts([])
    }
    setPaymentModalOpen(true)
  }

  const openStatusModal = async (invoice: Invoice) => {
    setStatusInvoice(invoice)
    setNewStatus(invoice.status)
    setStatusPaymentData({
      bank_account_id: "",
      payment_method: "transfer",
      payment_reference: "",
      payment_date: new Date().toISOString().split('T')[0],
    })
    // Fetch bank accounts for the invoice's agency
    const agencyId = invoice.agency?.id || (invoice as Record<string, unknown>).agency_id as string
    if (agencyId) {
      const { data } = await supabase
        .from("bank_accounts")
        .select("id, bank_name, account_number, account_name")
        .eq("agency_id", agencyId)
        .eq("is_active", true)
        .order("bank_name")
      setStatusBankAccounts(data || [])
    } else {
      setStatusBankAccounts([])
    }
    setStatusModalOpen(true)
  }

  const handleConfirmStatusChange = async () => {
    console.log("[v0] handleConfirmStatusChange called")
    console.log("[v0] statusInvoice:", statusInvoice?.id)
    console.log("[v0] newStatus:", newStatus)
    console.log("[v0] statusPaymentData:", statusPaymentData)
    
    if (!statusInvoice || !newStatus) {
      console.log("[v0] Missing statusInvoice or newStatus, returning")
      return
    }

    // If changing to paid, require bank account and reference
    if (newStatus === "paid") {
      if (!statusPaymentData.bank_account_id) {
        toast.error("Debe seleccionar la cuenta bancaria donde se recibio el pago")
        return
      }
      if (!statusPaymentData.payment_reference) {
        toast.error("La referencia de pago es requerida")
        return
      }
    }

    const updateData: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    // If changing to paid, add payment info
    if (newStatus === "paid") {
      updateData.payment_date = statusPaymentData.payment_date
      updateData.payment_reference = statusPaymentData.payment_reference
      updateData.payment_method = statusPaymentData.payment_method
      updateData.bank_account_id = statusPaymentData.bank_account_id
      updateData.paid_amount = statusInvoice.total_amount
      updateData.balance_due = 0
    }

    console.log("[v0] Updating invoice with data:", updateData)

    const { data, error } = await supabase
      .from("invoices")
      .update(updateData)
      .eq("id", statusInvoice.id)
      .select()

    console.log("[v0] Update result - data:", data, "error:", error)

    if (error) {
      toast.error("Error al cambiar el estado: " + error.message)
      return
    }

    toast.success(newStatus === "paid" ? "Pago registrado exitosamente" : "Estado actualizado correctamente")

    setStatusModalOpen(false)
    fetchInvoices()
  }

  const handleStatusChange = async (invoiceId: string, status: string) => {
    const { error } = await supabase
      .from("invoices")
      .update({ status: status, updated_at: new Date().toISOString() })
      .eq("id", invoiceId)

    if (error) {
      toast.error("Error al cambiar el estado: " + error.message)
      return
    }

    toast.success("Estado actualizado")
    fetchInvoices()
  }

  const handlePaymentSubmit = async () => {
    if (!selectedInvoice) return

    if (paymentData.status === "paid" && !paymentData.payment_reference) {
      toast.error("La referencia de pago es requerida")
      return
    }

    if (paymentData.status === "paid" && !paymentData.bank_account_id) {
      toast.error("Debe seleccionar la cuenta bancaria donde se recibió el pago")
      return
    }

    setUploading(true)
    let receiptUrl = null

    // Upload receipt if provided
    if (receiptFile) {
      const formData = new FormData()
      formData.append("file", receiptFile)
      formData.append("invoiceId", selectedInvoice.id)

      try {
        const response = await fetch("/api/upload-payment-receipt", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Error al subir el comprobante")
        }

        const result = await response.json()
        receiptUrl = result.url
      } catch (error) {
        toast.error("Error al subir el comprobante")
        setUploading(false)
        return
      }
    }

    // Update invoice with payment info
    const updateData: Record<string, unknown> = {
      status: paymentData.status,
      updated_at: new Date().toISOString(),
    }

    if (paymentData.status === "paid") {
      updateData.payment_reference = paymentData.payment_reference
      updateData.payment_notes = paymentData.payment_notes || null
      updateData.payment_date = paymentData.payment_date
      updateData.paid_amount = selectedInvoice.total_amount
      updateData.balance_due = 0
      updateData.bank_account_id = paymentData.bank_account_id
      updateData.payment_method = paymentData.payment_method
      if (receiptUrl) {
        updateData.payment_receipt_url = receiptUrl
      }
    }

    const { error } = await supabase
      .from("invoices")
      .update(updateData)
      .eq("id", selectedInvoice.id)

    if (error) {
      toast.error("Error al registrar el pago")
      setUploading(false)
      return
    }

setUploading(false)
  toast.success("Pago registrado exitosamente")
    setPaymentModalOpen(false)
    fetchInvoices()
  }

  const fetchInvoices = async () => {
    setLoading(true)
    let query = supabase
      .from("invoices")
      .select(`
        *,
        client:clients(id, company_name),
        account:accounts(id, account_name),
        agency:agencies(id, name),
        currency:currencies(id, code, symbol)
      `)
      .order("issue_date", { ascending: false })

    if (selectedAgency !== "all") {
      query = query.eq("agency_id", selectedAgency)
    }
    if (selectedStatus !== "all") {
      query = query.eq("status", selectedStatus)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching invoices:", error)
    } else {
      // Map related data properly (Supabase can return arrays for relations)
      const mapped = (data || []).map((inv: Record<string, unknown>) => ({
        ...inv,
        client: Array.isArray(inv.client) ? inv.client[0] : inv.client,
        account: Array.isArray(inv.account) ? inv.account[0] : inv.account,
        agency: Array.isArray(inv.agency) ? inv.agency[0] : inv.agency,
        currency: Array.isArray(inv.currency) ? inv.currency[0] : inv.currency,
      })) as Invoice[]
      setInvoices(mapped)
      
      // Calculate stats
      const allInvoices = data || []
      setStats({
        total: allInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0),
        pending: allInvoices.filter(inv => ["sent", "partial"].includes(inv.status)).reduce((sum, inv) => sum + Number(inv.balance_due), 0),
        overdue: allInvoices.filter(inv => inv.status === "overdue").reduce((sum, inv) => sum + Number(inv.balance_due), 0),
        paid: allInvoices.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + Number(inv.total_amount), 0),
      })
    }
    setLoading(false)
  }

  const filteredInvoices = invoices.filter((invoice) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      invoice.invoice_number.toLowerCase().includes(searchLower) ||
      invoice.client?.company_name?.toLowerCase().includes(searchLower) ||
      invoice.account?.account_name?.toLowerCase().includes(searchLower)
    )
  })

  const formatCurrency = (amount: number, currency?: { symbol: string; code: string } | null) => {
    const symbol = currency?.symbol || "$"
    return `${symbol}${Number(amount).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturas y Pagos</h1>
          <p className="text-muted-foreground">
            Gestiona las facturas y pagos de tus clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/invoices/workflow">
              <Settings className="mr-2 h-4 w-4" />
              Flujo de Trabajo
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/invoices/third-party">
              <DollarSign className="mr-2 h-4 w-4" />
              Pago por Cuenta de Cliente
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/invoices/new">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Factura
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facturado</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
            <p className="text-xs text-muted-foreground">{invoices.length} facturas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Cobrar</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(stats.pending)}</div>
            <p className="text-xs text-muted-foreground">Pendiente de pago</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencido</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(stats.overdue)}</div>
            <p className="text-xs text-muted-foreground">Requiere atención</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagado</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.paid)}</div>
            <p className="text-xs text-muted-foreground">Pagos completados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, cliente o cuenta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedAgency} onValueChange={setSelectedAgency}>
              <SelectTrigger className="w-full md:w-[200px]">
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
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No hay facturas</h3>
              <p className="text-muted-foreground mt-1">
                {searchTerm || selectedAgency !== "all" || selectedStatus !== "all"
                  ? "No se encontraron facturas con los filtros seleccionados"
                  : "Comienza creando tu primera factura"}
              </p>
              {!searchTerm && selectedAgency === "all" && selectedStatus === "all" && (
                <Button asChild className="mt-4">
                  <Link href="/dashboard/invoices/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Factura
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente / Cuenta</TableHead>
                  <TableHead>Agencia</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => {
                  const status = statusConfig[invoice.status] || statusConfig.draft
                  const StatusIcon = status.icon
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.client?.company_name || "-"}</div>
                          {invoice.account && (
                            <div className="text-sm text-muted-foreground">{invoice.account.account_name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{invoice.agency?.name || "-"}</TableCell>
                      <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                      <TableCell>{formatDate(invoice.due_date)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.total_amount, invoice.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(invoice.balance_due) > 0 ? (
                          <span className="text-amber-600 font-medium">
                            {formatCurrency(invoice.balance_due, invoice.currency)}
                          </span>
                        ) : (
                          <span className="text-green-600">Pagado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
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
                            <DropdownMenuItem 
                              onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => router.push(`/dashboard/invoices/${invoice.id}/edit`)}
                              className="cursor-pointer"
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => openStatusModal(invoice)}
                              className="cursor-pointer"
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Cambiar Estado
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {invoice.status === "draft" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, "validated")}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Validar
                              </DropdownMenuItem>
                            )}
                            {invoice.status === "validated" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, "pending")}>
                                <Clock className="mr-2 h-4 w-4" />
                                Marcar Por Cobrar
                              </DropdownMenuItem>
                            )}
                            {(invoice.status === "pending" || invoice.status === "overdue") && (
                              <DropdownMenuItem onClick={() => openPaymentModal(invoice)}>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Registrar Pago
                              </DropdownMenuItem>
                            )}
                            {invoice.status !== "cancelled" && invoice.status !== "paid" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(invoice.id, "cancelled")}
                                  className="text-destructive"
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Cancelar Factura
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
          )}
        </CardContent>
      </Card>

      {/* Payment Registration Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              {selectedInvoice && (
                <>
                  Factura <strong>{selectedInvoice.invoice_number}</strong> - Total: {formatCurrency(selectedInvoice.total_amount, selectedInvoice.currency)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Nuevo Estado</Label>
              <Select
                value={paymentData.status}
                onValueChange={(value) => setPaymentData({ ...paymentData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Pagado</SelectItem>
                  <SelectItem value="pending">Por Cobrar</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentData.status === "paid" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="payment_date">Fecha de Pago</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={paymentData.payment_date}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_account_id">Cuenta Bancaria de Ingreso *</Label>
                  <Select
                    value={paymentData.bank_account_id}
                    onValueChange={(value) => setPaymentData({ ...paymentData, bank_account_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cuenta bancaria..." />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.length === 0 ? (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                          No hay cuentas bancarias configuradas para esta agencia
                        </div>
                      ) : (
                        bankAccounts.map((bank) => (
                          <SelectItem key={bank.id} value={bank.id}>
                            <div className="flex items-center gap-2">
                              <Landmark className="h-4 w-4" />
                              <span>{bank.account_name || bank.bank_name}</span>
                              {bank.account_number && (
                                <span className="text-muted-foreground">****{bank.account_number.slice(-4)}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    El monto se sumará al saldo de esta cuenta
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method">Método de Pago</Label>
                  <Select
                    value={paymentData.payment_method}
                    onValueChange={(value) => setPaymentData({ ...paymentData, payment_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer">Transferencia Bancaria</SelectItem>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="check">Cheque</SelectItem>
                      <SelectItem value="credit_card">Tarjeta de Crédito</SelectItem>
                      <SelectItem value="debit_card">Tarjeta de Débito</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_reference">Referencia de Pago *</Label>
                  <Input
                    id="payment_reference"
                    placeholder="Ej: TRF-123456, CHQ-789"
                    value={paymentData.payment_reference}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_reference: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Número de transferencia, cheque o referencia bancaria
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receipt">Comprobante de Pago</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="receipt"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                      className="flex-1"
                    />
                    {receiptFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setReceiptFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {receiptFile && (
                    <p className="text-xs text-muted-foreground">
                      Archivo seleccionado: {receiptFile.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_notes">Notas (Opcional)</Label>
                  <Textarea
                    id="payment_notes"
                    placeholder="Notas adicionales sobre el pago..."
                    value={paymentData.payment_notes}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePaymentSubmit} disabled={uploading}>
              {uploading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirmar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Status Modal */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cambiar Estado de Factura</DialogTitle>
            <DialogDescription>
              {statusInvoice && (
                <>
                  Factura <strong>{statusInvoice.invoice_number}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new_status">Nuevo Estado</Label>
              <Select
                value={newStatus}
                onValueChange={setNewStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4 text-gray-500" />
                      Borrador
                    </div>
                  </SelectItem>
                  <SelectItem value="validated">
                    <div className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />
                      Validado
                    </div>
                  </SelectItem>
                  <SelectItem value="pending">
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                      Por Cobrar
                    </div>
                  </SelectItem>
                  <SelectItem value="paid">
                    <div className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      Pagado
                    </div>
                  </SelectItem>
                  <SelectItem value="overdue">
                    <div className="flex items-center">
                      <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                      Vencido
                    </div>
                  </SelectItem>
                  <SelectItem value="cancelled">
                    <div className="flex items-center">
                      <X className="mr-2 h-4 w-4 text-gray-500" />
                      Cancelado
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {statusInvoice && newStatus !== statusInvoice.status && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="text-muted-foreground">
                  Estado actual: <strong>{statusConfig[statusInvoice.status]?.label || statusInvoice.status}</strong>
                </p>
                <p className="text-muted-foreground mt-1">
                  Nuevo estado: <strong>{statusConfig[newStatus]?.label || newStatus}</strong>
                </p>
              </div>
            )}

            {newStatus === "paid" && (
              <>
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Landmark className="h-4 w-4" />
                    Información de Pago
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Cuenta Bancaria de Ingreso *</Label>
                  <Select
                    value={statusPaymentData.bank_account_id}
                    onValueChange={(value) => setStatusPaymentData({ ...statusPaymentData, bank_account_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cuenta bancaria..." />
                    </SelectTrigger>
                    <SelectContent>
                      {statusBankAccounts.length === 0 ? (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                          No hay cuentas bancarias configuradas
                        </div>
                      ) : (
                        statusBankAccounts.map((bank) => (
                          <SelectItem key={bank.id} value={bank.id}>
                            <div className="flex items-center gap-2">
                              <Landmark className="h-4 w-4" />
                              <span>{bank.account_name || bank.bank_name}</span>
                              {bank.account_number && (
                                <span className="text-muted-foreground">****{bank.account_number.slice(-4)}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fecha de Pago</Label>
                  <Input
                    type="date"
                    value={statusPaymentData.payment_date}
                    onChange={(e) => setStatusPaymentData({ ...statusPaymentData, payment_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Método de Pago</Label>
                  <Select
                    value={statusPaymentData.payment_method}
                    onValueChange={(value) => setStatusPaymentData({ ...statusPaymentData, payment_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer">Transferencia Bancaria</SelectItem>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="check">Cheque</SelectItem>
                      <SelectItem value="credit_card">Tarjeta de Crédito</SelectItem>
                      <SelectItem value="debit_card">Tarjeta de Débito</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Referencia de Pago *</Label>
                  <Input
                    placeholder="Ej: TRF-123456, CHQ-789"
                    value={statusPaymentData.payment_reference}
                    onChange={(e) => setStatusPaymentData({ ...statusPaymentData, payment_reference: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setStatusModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmStatusChange} 
              disabled={!newStatus || (newStatus === "paid" && (!statusPaymentData.bank_account_id || !statusPaymentData.payment_reference))}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Cambiar Estado
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
