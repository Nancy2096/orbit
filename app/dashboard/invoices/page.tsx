"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { parseLocalDate } from "@/lib/utils"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { Plus, Search, FileText, Eye, DollarSign, Clock, AlertCircle, CheckCircle, Settings, Upload, CreditCard, MoreHorizontal, X, RefreshCw, Landmark, Pencil, Trash2 } from "lucide-react"
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
  pending: { label: "Por Cobrar", variant: "default", icon: Clock },
  paid: { label: "Cobrado", variant: "default", icon: CheckCircle },
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
  // Filtro por fecha de emisión: preset (mes/rango) + valores personalizados.
  const [datePreset, setDatePreset] = useState<string>("all")
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [customStart, setCustomStart] = useState<string>("")
  const [customEnd, setCustomEnd] = useState<string>("")
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

  // Delete confirmation state
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

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

    // Aplica el pago al banco seleccionado (solo al pasar a pagado desde otro estado, evita duplicados)
    if (newStatus === "paid" && statusInvoice.status !== "paid") {
      const { error: paymentError } = await createPaymentRecord(statusInvoice, {
        amount: statusInvoice.total_amount,
        bank_account_id: statusPaymentData.bank_account_id,
        payment_method: statusPaymentData.payment_method,
        payment_date: statusPaymentData.payment_date,
        reference_number: statusPaymentData.payment_reference,
      })
      if (paymentError) {
        toast.error("El estado se actualizó, pero no se pudo aplicar al banco: " + paymentError.message)
      }
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

  // Elimina la factura (previa confirmación) junto con sus dependencias.
  const handleDeleteInvoice = async () => {
    if (!deleteInvoice) return
    setDeleting(true)
    // Borrar primero las líneas y pagos asociados para evitar restricciones de FK.
    await supabase.from("invoice_items").delete().eq("invoice_id", deleteInvoice.id)
    await supabase.from("payments").delete().eq("invoice_id", deleteInvoice.id)
    const { error } = await supabase.from("invoices").delete().eq("id", deleteInvoice.id)
    setDeleting(false)
    if (error) {
      toast.error("Error al eliminar la factura: " + error.message)
      return
    }
    toast.success("Factura eliminada")
    setDeleteInvoice(null)
    fetchInvoices()
  }

  // Alterna la selección de una factura individual.
  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Cambia el estado de todas las facturas seleccionadas a la vez.
  const handleBulkStatus = async (status: string) => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setBulkProcessing(true)
    const { error } = await supabase
      .from("invoices")
      .update({ status, updated_at: new Date().toISOString() })
      .in("id", ids)
    setBulkProcessing(false)
    if (error) {
      toast.error("Error al actualizar: " + error.message)
      return
    }
    toast.success(`${ids.length} ${ids.length === 1 ? "factura actualizada" : "facturas actualizadas"}`)
    setSelectedIds(new Set())
    fetchInvoices()
  }

  // Elimina todas las facturas seleccionadas junto con sus dependencias.
  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setBulkProcessing(true)
    await supabase.from("invoice_items").delete().in("invoice_id", ids)
    await supabase.from("payments").delete().in("invoice_id", ids)
    const { error } = await supabase.from("invoices").delete().in("id", ids)
    setBulkProcessing(false)
    setBulkDeleteOpen(false)
    if (error) {
      toast.error("Error al eliminar: " + error.message)
      return
    }
    toast.success(`${ids.length} ${ids.length === 1 ? "factura eliminada" : "facturas eliminadas"}`)
    setSelectedIds(new Set())
    fetchInvoices()
  }

  // Registra un pago en la tabla `payments` y lo aplica al banco seleccionado.
  // Esta tabla es la fuente de verdad para el saldo de Bancos.
  const createPaymentRecord = async (
    invoice: Invoice,
    data: {
      amount: number
      bank_account_id: string
      payment_method: string
      payment_date: string
      reference_number: string
      notes?: string
    }
  ) => {
    const agencyId = invoice.agency?.id || ((invoice as unknown as Record<string, unknown>).agency_id as string | undefined)
    if (!agencyId) {
      return { error: { message: "La factura no tiene una agencia asociada" } }
    }

    const year = new Date().getFullYear()
    const { count } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("agency_id", agencyId)
    const paymentNumber = `PAG-${year}-${String((count || 0) + 1).padStart(5, "0")}`

    return await supabase.from("payments").insert({
      agency_id: agencyId,
      invoice_id: invoice.id,
      client_id: invoice.client?.id || null,
      payment_number: paymentNumber,
      payment_date: data.payment_date,
      amount: data.amount,
      currency_id: invoice.currency?.id || null,
      payment_method: data.payment_method,
      reference_number: data.reference_number || null,
      bank_account_id: data.bank_account_id || null,
      status: "completed",
      notes: data.notes || null,
    })
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

    // Aplica el pago al banco seleccionado (solo si la factura no estaba ya pagada, evita duplicados)
    if (paymentData.status === "paid" && selectedInvoice.status !== "paid") {
      const { error: paymentError } = await createPaymentRecord(selectedInvoice, {
        amount: selectedInvoice.total_amount,
        bank_account_id: paymentData.bank_account_id,
        payment_method: paymentData.payment_method,
        payment_date: paymentData.payment_date,
        reference_number: paymentData.payment_reference,
        notes: paymentData.payment_notes,
      })
      if (paymentError) {
        toast.error("El pago se guardó, pero no se pudo aplicar al banco: " + paymentError.message)
      }
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

  // Calcula el rango [inicio, fin] activo según el preset de fecha seleccionado.
  const getDateRange = (): { start: Date | null; end: Date | null } => {
    const now = new Date()
    if (datePreset === "this_month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return { start, end }
    }
    if (datePreset === "last_month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return { start, end }
    }
    if (datePreset === "month" && selectedMonth) {
      const [y, m] = selectedMonth.split("-").map(Number)
      const start = new Date(y, m - 1, 1)
      const end = new Date(y, m, 0)
      return { start, end }
    }
    if (datePreset === "custom") {
      return {
        start: customStart ? new Date(customStart + "T00:00:00") : null,
        end: customEnd ? new Date(customEnd + "T23:59:59") : null,
      }
    }
    return { start: null, end: null }
  }
  const dateRange = getDateRange()

  const filteredInvoices = invoices.filter((invoice) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchLower) ||
      invoice.client?.company_name?.toLowerCase().includes(searchLower) ||
      invoice.account?.account_name?.toLowerCase().includes(searchLower)

    let matchesDate = true
    if (dateRange.start || dateRange.end) {
      const issued = invoice.issue_date ? parseLocalDate(invoice.issue_date) : null
      if (!issued) {
        matchesDate = false
      } else {
        if (dateRange.start && issued < dateRange.start) matchesDate = false
        if (dateRange.end && issued > dateRange.end) matchesDate = false
      }
    }

    return matchesSearch && matchesDate
  })

  // Totales facturados separados por moneda (para los indicadores superiores).
  const totalsByCurrency = filteredInvoices.reduce<Record<string, number>>((acc, inv) => {
    const code = inv.currency?.code || "MXN"
    acc[code] = (acc[code] || 0) + Number(inv.total_amount)
    return acc
  }, {})
  const totalMXN = totalsByCurrency["MXN"] || 0
  const totalUSD = totalsByCurrency["USD"] || 0
  const hasDateFilter = datePreset !== "all"

  // Estado de la casilla "seleccionar todas" según lo que hay filtrado en pantalla.
  const filteredIds = filteredInvoices.map((i) => i.id)
  const selectedCount = filteredIds.filter((id) => selectedIds.has(id)).length
  const allSelected = filteredIds.length > 0 && selectedCount === filteredIds.length
  const someSelected = selectedCount > 0 && !allSelected

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        filteredIds.forEach((id) => next.delete(id))
      } else {
        filteredIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const formatCurrency = (amount: number, currency?: { symbol: string; code: string } | null) => {
    const symbol = currency?.symbol || "$"
    return `${symbol}${Number(amount).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    const date = parseLocalDate(dateString)
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
            <div className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">
                  ${Number(totalMXN).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-medium text-muted-foreground">MXN</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-semibold text-muted-foreground">
                  ${Number(totalUSD).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-medium text-muted-foreground">USD</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{filteredInvoices.length} facturas</p>
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
            <CardTitle className="text-sm font-medium">Cobrado</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.paid)}</div>
            <p className="text-xs text-muted-foreground">Cobros completados</p>
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
            <Select value={datePreset} onValueChange={setDatePreset}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el tiempo</SelectItem>
                <SelectItem value="this_month">Este mes</SelectItem>
                <SelectItem value="last_month">Mes anterior</SelectItem>
                <SelectItem value="month">Mes específico</SelectItem>
                <SelectItem value="custom">Rango personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(datePreset === "month" || datePreset === "custom") && (
            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end">
              {datePreset === "month" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="filter-month" className="text-xs text-muted-foreground">
                    Mes
                  </Label>
                  <Input
                    id="filter-month"
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full md:w-[200px]"
                  />
                </div>
              )}
              {datePreset === "custom" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="filter-start" className="text-xs text-muted-foreground">
                      Desde
                    </Label>
                    <Input
                      id="filter-start"
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full md:w-[180px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="filter-end" className="text-xs text-muted-foreground">
                      Hasta
                    </Label>
                    <Input
                      id="filter-end"
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full md:w-[180px]"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk actions bar */}
      {selectedCount > 0 && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>
                {selectedCount} {selectedCount === 1 ? "factura seleccionada" : "facturas seleccionadas"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground"
                onClick={() => setSelectedIds(new Set())}
              >
                Limpiar
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={bulkProcessing}
                onClick={() => handleBulkStatus("pending")}
              >
                <Clock className="mr-2 h-4 w-4" />
                Marcar Por Cobrar
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={bulkProcessing}
                onClick={() => handleBulkStatus("cancelled")}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={bulkProcessing}
                onClick={() => setBulkDeleteOpen(true)}
              >
                {bulkProcessing ? (
                  <Spinner className="mr-2 h-4 w-4" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Eliminar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                {searchTerm || selectedAgency !== "all" || selectedStatus !== "all" || hasDateFilter
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
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected ? true : someSelected ? "indeterminate" : false}
                      onCheckedChange={toggleAll}
                      aria-label="Seleccionar todas las facturas"
                    />
                  </TableHead>
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
                  const status = statusConfig[invoice.status] || statusConfig.pending
                  const StatusIcon = status.icon
                  return (
                    <TableRow
                      key={invoice.id}
                      data-state={selectedIds.has(invoice.id) ? "selected" : undefined}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(invoice.id)}
                          onCheckedChange={() => toggleOne(invoice.id)}
                          aria-label={`Seleccionar factura ${invoice.invoice_number}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link
                          href={`/dashboard/invoices/${invoice.id}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {invoice.invoice_number}
                        </Link>
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
                          <span className="text-green-600">Cobrado</span>
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteInvoice(invoice)}
                              className="cursor-pointer text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
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

      {/* Bulk delete confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={(open) => !open && setBulkDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {selectedCount} {selectedCount === 1 ? "factura" : "facturas"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán permanentemente las facturas seleccionadas junto con sus líneas y pagos
              registrados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleBulkDelete()
              }}
              disabled={bulkProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkProcessing ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteInvoice} onOpenChange={(open) => !open && setDeleteInvoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta factura?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente la factura{" "}
              <strong>{deleteInvoice?.invoice_number}</strong> junto con sus líneas y pagos
              registrados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteInvoice()
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                  <SelectItem value="paid">Cobrado</SelectItem>
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
                  <SelectItem value="pending">
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                      Por Cobrar
                    </div>
                  </SelectItem>
                  <SelectItem value="paid">
                    <div className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      Cobrado
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
