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
import { 
  Plus, 
  Search, 
  ArrowLeft, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  FileText,
  MoreHorizontal,
  Eye,
  Receipt,
  Percent,
  Building2,
  X,
  Settings,
  RefreshCw,
  Calendar,
  User,
  Hash,
  AlertCircle,
  Banknote
} from "lucide-react"
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

interface ThirdPartyPayment {
  id: string
  payment_number: string
  payment_date: string
  description: string | null
  third_party_name: string
  third_party_rfc: string | null
  third_party_concept: string | null
  original_amount: number
  commission_percentage: number
  commission_amount: number
  total_amount: number
  status: string
  invoice_id: string | null
  receipt_url: string | null
  notes: string | null
  validated_by: string | null
  validated_at: string | null
  validation_notes: string | null
  rejected_by: string | null
  rejected_at: string | null
  rejection_reason: string | null
  // Direct ID fields
  agency_id: string
  client_id: string
  account_id: string | null
  project_id: string | null
  currency_id: string | null
  // Related objects
  client: { id: string; company_name: string } | null
  account: { id: string; account_name: string } | null
  project: { id: string; name: string } | null
  agency: { id: string; name: string } | null
  currency: { id: string; code: string; symbol: string } | null
  invoice: { id: string; invoice_number: string; status: string } | null
}

interface Vendor {
  id: string
  name: string
  legal_name: string | null
  tax_id: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  bank_name: string | null
  bank_account: string | null
  bank_clabe: string | null
}

interface Client {
  id: string
  company_name: string
  payment_terms: number | null
  tax_id: string | null
  billing_email: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
}

interface Account {
  id: string
  account_name: string
  client_id: string
}

interface Project {
  id: string
  name: string
  account_id: string
}

interface Agency {
  id: string
  name: string
}

interface Currency {
  id: string
  code: string
  symbol: string
}

interface BankAccount {
  id: string
  bank_name: string
  account_name: string
  account_number: string
  currency: { code: string; symbol: string } | null
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; description: string; icon: typeof FileText }> = {
  draft: { label: "Borrador", variant: "outline", description: "Pendiente de validación", icon: FileText },
  validated: { label: "Validado", variant: "secondary", description: "Validado, listo para facturar", icon: CheckCircle },
  pending: { label: "Pendiente", variant: "outline", description: "Pendiente de facturar al cliente", icon: Clock },
  invoiced: { label: "Facturado", variant: "secondary", description: "Factura emitida, esperando pago", icon: Receipt },
  paid: { label: "Reembolsado", variant: "default", description: "Cliente ha reembolsado el pago", icon: DollarSign },
  rejected: { label: "Rechazado", variant: "destructive", description: "Rechazado en validación", icon: X },
  cancelled: { label: "Cancelado", variant: "secondary", description: "Operación cancelada", icon: AlertCircle },
}

export default function ThirdPartyPaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<ThirdPartyPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const supabase = createClient()

  // New payment modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Workflow modal state
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false)
  const [workflowAction, setWorkflowAction] = useState<"validate" | "reject" | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<ThirdPartyPayment | null>(null)
  const [workflowNotes, setWorkflowNotes] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  
  // Detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailPayment, setDetailPayment] = useState<ThirdPartyPayment | null>(null)
  
  // Change status modal state
  const [changeStatusModalOpen, setChangeStatusModalOpen] = useState(false)
  const [changeStatusPayment, setChangeStatusPayment] = useState<ThirdPartyPayment | null>(null)
  const [newStatus, setNewStatus] = useState("")

  const [formData, setFormData] = useState({
    agency_id: "",
    vendor_id: "",
    client_id: "",
    account_id: "",
    project_id: "",
    currency_id: "",
    bank_account_id: "",
    payment_date: new Date().toISOString().split('T')[0],
    description: "",
    third_party_name: "",
    third_party_rfc: "",
    third_party_concept: "",
    original_amount: "",
    commission_percentage: "10",
    notes: "",
  })

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    commission: 0,
    invoiced: 0,
  })

  useEffect(() => {
    fetchPayments()
    fetchFormData()
  }, [])

  useEffect(() => {
    if (formData.client_id) {
      const filtered = accounts.filter(a => a.client_id === formData.client_id)
      setFilteredAccounts(filtered)
      if (!filtered.find(a => a.id === formData.account_id)) {
        setFormData(prev => ({ ...prev, account_id: "", project_id: "" }))
      }
    } else {
      setFilteredAccounts([])
      setFilteredProjects([])
    }
  }, [formData.client_id, accounts])

  useEffect(() => {
    if (formData.account_id) {
      const filtered = projects.filter(p => p.account_id === formData.account_id)
      setFilteredProjects(filtered)
      if (!filtered.find(p => p.id === formData.project_id)) {
        setFormData(prev => ({ ...prev, project_id: "" }))
      }
    } else {
      setFilteredProjects([])
    }
  }, [formData.account_id, projects])

  const fetchFormData = async () => {
    const [vendorsRes, clientsRes, accountsRes, projectsRes, agenciesRes, currenciesRes, bankRes] = await Promise.all([
      supabase.from("vendors").select("id, name, legal_name, tax_id, contact_name, contact_email, contact_phone, address, city, state, country, bank_name, bank_account, bank_clabe").eq("is_active", true).order("name"),
      supabase.from("clients").select("id, company_name, payment_terms, tax_id, billing_email, address, city, state, country").eq("status", "active").order("company_name"),
      supabase.from("accounts").select("id, account_name, client_id").eq("status", "active").order("account_name"),
      supabase.from("projects").select("id, name, account_id").eq("status", "active").order("name"),
      supabase.from("agencies").select("id, name").eq("is_active", true).order("name"),
      supabase.from("currencies").select("id, code, symbol").eq("is_active", true).order("code"),
      supabase.from("bank_accounts").select("id, bank_name, account_name, account_number, currency:currencies(code, symbol)").eq("is_active", true).order("bank_name"),
    ])

    if (vendorsRes.data) setVendors(vendorsRes.data)
    if (clientsRes.data) setClients(clientsRes.data)
    if (accountsRes.data) setAccounts(accountsRes.data)
    if (projectsRes.data) setProjects(projectsRes.data)
    if (agenciesRes.data) setAgencies(agenciesRes.data)
    if (currenciesRes.data) setCurrencies(currenciesRes.data)
    if (bankRes.data) {
      const mapped = bankRes.data.map((bank: Record<string, unknown>) => ({
        ...bank,
        currency: Array.isArray(bank.currency) ? bank.currency[0] : bank.currency,
      })) as BankAccount[]
      setBankAccounts(mapped)
    }
  }

  const fetchPayments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("third_party_payments")
      .select(`
        *,
        client:clients(id, company_name),
        account:accounts(id, account_name),
        project:projects(id, name),
        agency:agencies(id, name),
        currency:currencies(id, code, symbol),
        invoice:invoices(id, invoice_number, status)
      `)
      .order("payment_date", { ascending: false })

    if (error) {
      console.error("Error fetching payments:", error)
    } else {
      setPayments(data || [])
      
      const allPayments = data || []
      setStats({
        total: allPayments.reduce((sum, p) => sum + Number(p.total_amount), 0),
        pending: allPayments.filter(p => p.status === "pending").reduce((sum, p) => sum + Number(p.total_amount), 0),
        commission: allPayments.reduce((sum, p) => sum + Number(p.commission_amount), 0),
        invoiced: allPayments.filter(p => p.status === "invoiced" || p.status === "paid").reduce((sum, p) => sum + Number(p.total_amount), 0),
      })
    }
    setLoading(false)
  }

  const calculateAmounts = () => {
    const original = parseFloat(formData.original_amount) || 0
    const percentage = parseFloat(formData.commission_percentage) || 0
    const commission = original * (percentage / 100)
    const total = original + commission
    return { commission, total }
  }

  const generatePaymentNumber = async () => {
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from("third_party_payments")
      .select("*", { count: "exact", head: true })
    
    const nextNum = (count || 0) + 1
    return `PCT-${year}-${String(nextNum).padStart(5, "0")}`
  }

  const generateInvoiceNumber = async () => {
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
    
    const nextNumber = (count || 0) + 1
    return `FAC-${year}-${String(nextNumber).padStart(5, "0")}`
  }

  const handleSubmit = async () => {
if (!formData.agency_id || !formData.vendor_id || !formData.client_id || !formData.original_amount) {
  toast.error("Por favor completa los campos requeridos: Agencia, Proveedor, Cliente y Monto")
  return
  }

    setSaving(true)

    const { commission, total } = calculateAmounts()
    const paymentNumber = await generatePaymentNumber()

    const { data: payment, error } = await supabase
      .from("third_party_payments")
      .insert({
        agency_id: formData.agency_id,
        client_id: formData.client_id,
        account_id: formData.account_id || null,
        project_id: formData.project_id || null,
        currency_id: formData.currency_id || null,
        payment_number: paymentNumber,
        payment_date: formData.payment_date,
        description: formData.description || null,
        third_party_name: formData.third_party_name,
        third_party_rfc: formData.third_party_rfc || null,
        third_party_concept: formData.third_party_concept || null,
        original_amount: parseFloat(formData.original_amount),
        commission_percentage: parseFloat(formData.commission_percentage) || 0,
        commission_amount: commission,
        total_amount: total,
        notes: formData.notes || null,
        status: "draft",
      })
      .select()
      .single()

    setSaving(false)

    if (error) {
      toast.error("Error al crear el pago")
      console.error(error)
      return
    }

    toast.success("Pago por cuenta de cliente registrado en borrador")
    setModalOpen(false)
    resetForm()
    fetchPayments()
  }

  const openWorkflowModal = (payment: ThirdPartyPayment, action: "validate" | "reject") => {
    setSelectedPayment(payment)
    setWorkflowAction(action)
    setWorkflowNotes("")
    setWorkflowModalOpen(true)
  }

  const openDetailModal = (payment: ThirdPartyPayment) => {
    setDetailPayment(payment)
    setDetailModalOpen(true)
  }

  const openChangeStatusModal = (payment: ThirdPartyPayment) => {
    setChangeStatusPayment(payment)
    setNewStatus(payment.status)
    setChangeStatusModalOpen(true)
  }

  const handleChangeStatus = async () => {
    if (!changeStatusPayment || !newStatus) return

    const updates: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    // Add validation timestamps if changing to validated
    if (newStatus === "validated" && changeStatusPayment.status !== "validated") {
      updates.validated_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from("third_party_payments")
      .update(updates)
      .eq("id", changeStatusPayment.id)

    if (error) {
      toast.error("Error al cambiar el estado")
      console.error(error)
      return
    }

    toast.success(`Estado cambiado a ${statusConfig[newStatus]?.label || newStatus}`)
    setChangeStatusModalOpen(false)
    fetchPayments()
  }

  const handleWorkflowAction = async () => {
    if (!selectedPayment || !workflowAction) return

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (workflowAction === "validate") {
      updates.status = "validated"
      updates.validated_at = new Date().toISOString()
      updates.validation_notes = workflowNotes || null
    } else if (workflowAction === "reject") {
      if (!workflowNotes.trim()) {
        toast.error("Por favor ingresa el motivo del rechazo")
        return
      }
      updates.status = "rejected"
      updates.rejected_at = new Date().toISOString()
      updates.rejection_reason = workflowNotes
    }

    const { error } = await supabase
      .from("third_party_payments")
      .update(updates)
      .eq("id", selectedPayment.id)

    if (error) {
      toast.error(`Error al ${workflowAction === "validate" ? "validar" : "rechazar"} el pago`)
      console.error(error)
      return
    }

    toast.success(workflowAction === "validate" ? "Pago validado correctamente" : "Pago rechazado")
    setWorkflowModalOpen(false)
    fetchPayments()
  }

const resetForm = () => {
    setSelectedVendor(null)
    setSelectedClient(null)
    setFormData({
      agency_id: "",
      vendor_id: "",
      client_id: "",
      account_id: "",
      project_id: "",
      currency_id: "",
      bank_account_id: "",
      payment_date: new Date().toISOString().split('T')[0],
      description: "",
      third_party_name: "",
      third_party_rfc: "",
      third_party_concept: "",
      original_amount: "",
      commission_percentage: "10",
      notes: "",
    })
  }

  const handleCreateInvoice = async (payment: ThirdPartyPayment) => {
    // Validate required IDs
    if (!payment.agency_id) {
      toast.error("Error: No se encontró la agencia asociada")
      return
    }
    if (!payment.client_id) {
      toast.error("Error: No se encontró el cliente asociado")
      return
    }

    try {
      // Get client payment terms for due date
      const client = clients.find(c => c.id === payment.client_id)
      const paymentTerms = client?.payment_terms || 30
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + paymentTerms)

      // Generate invoice number
      const invoiceNumber = await generateInvoiceNumber()

      // Create invoice in "Facturas y Pagos"
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          agency_id: payment.agency_id,
          client_id: payment.client_id,
          account_id: payment.account_id || null,
          project_id: payment.project_id || null,
          invoice_number: invoiceNumber,
          invoice_type: "standard",
          status: "pending",
          issue_date: new Date().toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          subtotal: payment.total_amount,
          tax_amount: 0,
          tax_rate: 0,
          total_amount: payment.total_amount,
          balance_due: payment.total_amount,
          currency_id: payment.currency_id || null,
          payment_terms: paymentTerms,
          notes: `Pago por cuenta de cliente: ${payment.payment_number}\nProveedor: ${payment.third_party_name}${payment.third_party_rfc ? ` (RFC: ${payment.third_party_rfc})` : ""}\nConcepto: ${payment.third_party_concept || payment.description || "Pago a proveedor"}\n\nMonto original: $${payment.original_amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}\nComisión (${payment.commission_percentage}%): $${payment.commission_amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
        })
        .select()
        .single()

      if (invoiceError) {
        toast.error("Error al crear la factura: " + invoiceError.message)
        console.error("Invoice error:", invoiceError)
        return
      }

      // Create invoice items - two lines: original amount and commission
      const itemsToInsert = [
        {
          invoice_id: invoice.id,
          description: `Pago a proveedor: ${payment.third_party_name} - ${payment.third_party_concept || "Servicios"}`,
          quantity: 1,
          unit_price: payment.original_amount,
          discount_percentage: 0,
          tax_rate: 0,
          subtotal: payment.original_amount,
          tax_amount: 0,
          total: payment.original_amount,
          sort_order: 0,
        },
        {
          invoice_id: invoice.id,
          description: `Comisión por gestión de pago (${payment.commission_percentage}%)`,
          quantity: 1,
          unit_price: payment.commission_amount,
          discount_percentage: 0,
          tax_rate: 0,
          subtotal: payment.commission_amount,
          tax_amount: 0,
          total: payment.commission_amount,
          sort_order: 1,
        },
      ]

      const { error: itemsError } = await supabase.from("invoice_items").insert(itemsToInsert)

      if (itemsError) {
        console.error("Items error:", itemsError)
        // Continue anyway - invoice was created
      }

      // Create expense in "Gastos" - Monto Original para proceder con el pago al proveedor
      const EXPENSE_CATEGORY_ID = "d906cfc8-f85c-44a1-99a4-c4d8cfe5428a" // Pagos por Cuenta de Clientes
      
      const { error: expenseError } = await supabase
        .from("expenses")
        .insert({
          agency_id: payment.agency_id,
          category_id: EXPENSE_CATEGORY_ID,
          project_id: payment.project_id || null,
          vendor_name: payment.third_party_name,
          expense_date: payment.payment_date,
          description: `Pago por cuenta de cliente: ${payment.client?.company_name || "Cliente"} - ${payment.third_party_concept || payment.description || "Pago a proveedor"}`,
          amount: payment.original_amount,
          tax_amount: 0,
          total_amount: payment.original_amount,
          currency_id: payment.currency_id || null,
          payment_method: "transfer",
          is_billable: true,
          is_reimbursable: true,
          status: "pending",
          approval_status: "approved",
          notes: `Referencia: ${payment.payment_number}\nFactura generada: ${invoiceNumber}\nRFC Proveedor: ${payment.third_party_rfc || "N/A"}\nCliente: ${payment.client?.company_name || "N/A"}\nComisión cobrada: ${payment.commission_percentage}% ($${payment.commission_amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })})`,
        })

    if (expenseError) {
        console.error("Expense error:", expenseError)
        toast.error("Advertencia: Error al registrar el gasto en la sección de Gastos")
      }

      // Update third party payment - mark as invoiced (desaparece de la lista activa)
      const { error: updateError } = await supabase
        .from("third_party_payments")
        .update({ 
          invoice_id: invoice.id, 
          status: "invoiced",
          updated_at: new Date().toISOString()
        })
        .eq("id", payment.id)

      if (updateError) {
        console.error("Update error:", updateError)
      }

      toast.success("Factura creada en 'Facturas y Pagos' y gasto registrado en 'Gastos'")
      
      // Refresh the list to remove the invoiced payment
      fetchPayments()
      
      // Redirect to invoice detail
      router.push(`/dashboard/invoices/${invoice.id}`)
    } catch (error) {
      console.error("Error general:", error)
      toast.error("Error inesperado al crear la factura")
    }
  }

const filteredPayments = payments.filter((payment) => {
  const searchLower = searchTerm.toLowerCase()
  const matchesSearch = (
    payment.payment_number.toLowerCase().includes(searchLower) ||
    payment.third_party_name.toLowerCase().includes(searchLower) ||
    payment.client?.company_name?.toLowerCase().includes(searchLower)
  )
  const matchesStatus = statusFilter === "all" || payment.status === statusFilter
  return matchesSearch && matchesStatus
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

  const { commission, total } = calculateAmounts()

  const getInvoiceStatusBadge = (invoice: { status: string } | null) => {
    if (!invoice) return null
    const invoiceStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      draft: { label: "Borrador", variant: "secondary" },
      validated: { label: "Validado", variant: "outline" },
      pending: { label: "Por Cobrar", variant: "default" },
      paid: { label: "Pagado", variant: "default" },
      overdue: { label: "Vencido", variant: "destructive" },
      cancelled: { label: "Cancelado", variant: "secondary" },
    }
    const status = invoiceStatusConfig[invoice.status] || invoiceStatusConfig.draft
    return <Badge variant={status.variant} className="ml-2">{status.label}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pago por Cuenta de Cliente</h1>
            <p className="text-muted-foreground">
              Gestiona pagos realizados a nombre de clientes y genera facturas para reembolso
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/invoices/third-party/workflow">
              <Settings className="mr-2 h-4 w-4" />
              Flujo de Trabajo
            </Link>
          </Button>
          <Button onClick={() => {
    setSelectedVendor(null)
    setSelectedClient(null)
    setFormData({
      agency_id: "",
      vendor_id: "",
      client_id: "",
      account_id: "",
      project_id: "",
      currency_id: "",
      bank_account_id: "",
      payment_date: new Date().toISOString().split('T')[0],
      description: "",
      third_party_name: "",
      third_party_rfc: "",
      third_party_concept: "",
      original_amount: "",
      commission_percentage: "10",
      notes: "",
    })
    setModalOpen(true)
  }}>
    <Plus className="mr-2 h-4 w-4" />
            Nuevo Pago
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">Flujo contable de Pago por Cuenta de Cliente</p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li><strong>Al registrar:</strong> Se carga a Deudores (Cliente) y se abona a Bancos</li>
                <li><strong>Al facturar:</strong> Se genera factura al cliente por el monto total + comisión</li>
                <li><strong>Al recibir reembolso:</strong> Se abona a Deudores y se registra el ingreso financiero (comisión)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registrado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
            <p className="text-xs text-muted-foreground">{payments.length} pagos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendiente de Facturar</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(stats.pending)}</div>
            <p className="text-xs text-muted-foreground">Sin factura emitida</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comisiones Ganadas</CardTitle>
            <Percent className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.commission)}</div>
            <p className="text-xs text-muted-foreground">Ingreso financiero</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturado</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.invoiced)}</div>
            <p className="text-xs text-muted-foreground">Con factura emitida</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar y Filtrar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, proveedor o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="validated">Validado</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="invoiced">Facturado</SelectItem>
                <SelectItem value="paid">Reembolsado</SelectItem>
                <SelectItem value="rejected">Rechazado</SelectItem>
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
          ) : filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No hay pagos registrados</h3>
              <p className="text-muted-foreground mt-1">
                Registra pagos realizados a nombre de tus clientes
              </p>
<Button onClick={() => {
    setSelectedVendor(null)
    setSelectedClient(null)
    setFormData({
      agency_id: "",
      vendor_id: "",
      client_id: "",
      account_id: "",
      project_id: "",
      currency_id: "",
      bank_account_id: "",
      payment_date: new Date().toISOString().split('T')[0],
      description: "",
      third_party_name: "",
      third_party_rfc: "",
      third_party_concept: "",
      original_amount: "",
      commission_percentage: "10",
      notes: "",
    })
    setModalOpen(true)
  }} className="mt-4">
    <Plus className="mr-2 h-4 w-4" />
    Nuevo Pago
  </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente / Cuenta / Proyecto</TableHead>
                  <TableHead>Tercero</TableHead>
                  <TableHead className="text-right">Monto Original</TableHead>
                  <TableHead className="text-right">Comisión</TableHead>
                  <TableHead className="text-right">Total a Facturar</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Factura</TableHead>
                  <TableHead className="w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => {
                  const status = statusConfig[payment.status] || statusConfig.pending
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.payment_number}
                      </TableCell>
                      <TableCell>{formatDate(payment.payment_date)}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="font-medium">{payment.client?.company_name || "-"}</div>
                          {payment.account && (
                            <div className="text-sm text-muted-foreground">{payment.account.account_name}</div>
                          )}
                          {payment.project && (
                            <div className="text-xs text-blue-600">{payment.project.name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.third_party_name}</div>
                          {payment.third_party_rfc && (
                            <div className="text-sm text-muted-foreground">{payment.third_party_rfc}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(payment.original_amount, payment.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <div className="text-green-600 font-medium">
                            {formatCurrency(payment.commission_amount, payment.currency)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {payment.commission_percentage}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(payment.total_amount, payment.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.invoice ? (
                          <Link 
                            href={`/dashboard/invoices/${payment.invoice.id}`}
                            className="text-blue-600 hover:underline text-sm font-medium flex items-center"
                          >
                            {payment.invoice.invoice_number}
                            {getInvoiceStatusBadge(payment.invoice)}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => openDetailModal(payment)} className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalle
                            </DropdownMenuItem>
                            
                            {payment.invoice && (
                              <DropdownMenuItem 
                                onClick={() => router.push(`/dashboard/invoices/${payment.invoice?.id}`)}
                                className="cursor-pointer"
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Ver Factura
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem 
                              onClick={() => openChangeStatusModal(payment)}
                              className="cursor-pointer"
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Cambiar Estado
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            {payment.status === "draft" && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => openWorkflowModal(payment, "validate")}
                                  className="cursor-pointer text-green-600"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Validar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => openWorkflowModal(payment, "reject")}
                                  className="cursor-pointer text-red-600"
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Rechazar
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            {(payment.status === "validated" || payment.status === "pending") && !payment.invoice && (
                              <DropdownMenuItem 
                                onClick={() => handleCreateInvoice(payment)}
                                className="cursor-pointer text-blue-600"
                              >
                                <Receipt className="mr-2 h-4 w-4" />
                                Crear Factura
                              </DropdownMenuItem>
                            )}
                            
                            {payment.status === "rejected" && (
                              <DropdownMenuItem 
                                onClick={() => openWorkflowModal(payment, "validate")}
                                className="cursor-pointer text-amber-600"
                              >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Reactivar
                              </DropdownMenuItem>
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

      {/* New Payment Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Pago por Cuenta de Cliente</DialogTitle>
            <DialogDescription>
              Registra un pago realizado a nombre de un cliente para su posterior reembolso
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Agencia *</Label>
                <Select
                  value={formData.agency_id}
                  onValueChange={(value) => setFormData({ ...formData, agency_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar agencia" />
                  </SelectTrigger>
                  <SelectContent>
                    {agencies.map((agency) => (
                      <SelectItem key={agency.id} value={agency.id}>
                        {agency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha del Pago *</Label>
                <Input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                />
              </div>
            </div>

            {/* Vendor Selection - A quién se paga */}
            <Card className="border-dashed border-orange-200 bg-orange-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-orange-600" />
                  Proveedor (A quién se paga)
                </CardTitle>
                <CardDescription>
                  Selecciona el proveedor al que se realizará el pago
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Proveedor *</Label>
                  <Select
                    value={formData.vendor_id}
                    onValueChange={(value) => {
                      const vendor = vendors.find(v => v.id === value)
                      setSelectedVendor(vendor || null)
                      setFormData({ 
                        ...formData, 
                        vendor_id: value,
                        third_party_name: vendor?.legal_name || vendor?.name || "",
                        third_party_rfc: vendor?.tax_id || "",
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedVendor && (
                  <div className="p-3 bg-white rounded-lg border space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Razón Social:</span>
                        <p className="font-medium">{selectedVendor.legal_name || selectedVendor.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">RFC:</span>
                        <p className="font-medium">{selectedVendor.tax_id || "No especificado"}</p>
                      </div>
                    </div>
                    {(selectedVendor.bank_name || selectedVendor.bank_clabe) && (
                      <div className="pt-2 border-t">
                        <span className="text-muted-foreground text-sm">Datos Bancarios:</span>
                        <div className="grid grid-cols-2 gap-4 text-sm mt-1">
                          <p className="font-medium">{selectedVendor.bank_name || "---"}</p>
                          <p className="font-medium">{selectedVendor.bank_clabe || selectedVendor.bank_account || "---"}</p>
                        </div>
                      </div>
                    )}
                    {selectedVendor.contact_email && (
                      <div className="pt-2 border-t text-sm">
                        <span className="text-muted-foreground">Contacto:</span>
                        <p className="font-medium">{selectedVendor.contact_name || ""} {selectedVendor.contact_email ? `- ${selectedVendor.contact_email}` : ""}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Selection - A quién se factura */}
            <Card className="border-dashed border-blue-200 bg-blue-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  Cliente (A quién se factura)
                </CardTitle>
                <CardDescription>
                  Selecciona el cliente al que se emitirá la factura por el reembolso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => {
                      const client = clients.find(c => c.id === value)
                      setSelectedClient(client || null)
                      setFormData({ ...formData, client_id: value, account_id: "", project_id: "" })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedClient && (
                  <div className="p-3 bg-white rounded-lg border space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Razón Social:</span>
                        <p className="font-medium">{selectedClient.company_name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">RFC:</span>
                        <p className="font-medium">{selectedClient.tax_id || "No especificado"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Email Facturación:</span>
                        <p className="font-medium">{selectedClient.billing_email || "No especificado"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Términos de Pago:</span>
                        <p className="font-medium">{selectedClient.payment_terms ? `${selectedClient.payment_terms} días` : "No especificado"}</p>
                      </div>
                    </div>
                    {selectedClient.address && (
                      <div className="pt-2 border-t text-sm">
                        <span className="text-muted-foreground">Dirección:</span>
                        <p className="font-medium">
                          {selectedClient.address}
                          {selectedClient.city && `, ${selectedClient.city}`}
                          {selectedClient.state && `, ${selectedClient.state}`}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cuenta</Label>
                    <Select
                      value={formData.account_id}
                      onValueChange={(value) => setFormData({ ...formData, account_id: value })}
                      disabled={!formData.client_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cuenta" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Proyecto</Label>
                    <Select
                      value={formData.project_id}
                      onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                      disabled={!formData.account_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar proyecto" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredProjects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Concept */}
            <div className="space-y-2">
              <Label>Concepto del Pago</Label>
              <Textarea
                placeholder="Descripción del servicio o producto pagado al proveedor"
                value={formData.third_party_concept}
                onChange={(e) => setFormData({ ...formData, third_party_concept: e.target.value })}
                rows={2}
              />
            </div>

            {/* Amounts */}
            <Card className="border-dashed border-green-300 bg-green-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Montos y Comisión
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Moneda</Label>
                    <Select
                      value={formData.currency_id}
                      onValueChange={(value) => setFormData({ ...formData, currency_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.id} value={currency.id}>
                            {currency.code} ({currency.symbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Monto Original Pagado *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.original_amount}
                      onChange={(e) => setFormData({ ...formData, original_amount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Porcentaje de Comisión</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.commission_percentage}
                      onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
                      className="w-24"
                    />
                    <span className="text-muted-foreground">%</span>
                    <div className="flex gap-1 ml-4">
                      {[5, 10, 15, 20].map((pct) => (
                        <Button
                          key={pct}
                          type="button"
                          variant={formData.commission_percentage === String(pct) ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFormData({ ...formData, commission_percentage: String(pct) })}
                        >
                          {pct}%
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                {parseFloat(formData.original_amount) > 0 && (
                  <div className="mt-4 p-4 bg-white rounded-lg border space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Monto original:</span>
                      <span className="font-medium">
                        ${parseFloat(formData.original_amount).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Comisión ({formData.commission_percentage}%):</span>
                      <span className="font-medium text-green-600">
                        +${commission.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-bold border-t pt-2 mt-2">
                      <span>Total a Facturar:</span>
                      <span className="text-blue-600">
                        ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notas Internas</Label>
              <Textarea
                placeholder="Notas adicionales (opcional)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Pago
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Workflow Modal - Validate/Reject */}
      <Dialog open={workflowModalOpen} onOpenChange={setWorkflowModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className={workflowAction === "validate" ? "text-green-600" : "text-red-600"}>
              {workflowAction === "validate" ? "Validar Pago" : "Rechazar Pago"}
            </DialogTitle>
            <DialogDescription>
              {selectedPayment && (
                <>
                  Pago <strong>{selectedPayment.payment_number}</strong> - {selectedPayment.third_party_name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedPayment && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium">{selectedPayment.client?.company_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monto Original:</span>
                  <span className="font-medium">{formatCurrency(selectedPayment.original_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Comisión ({selectedPayment.commission_percentage}%):</span>
                  <span className="font-medium text-green-600">{formatCurrency(selectedPayment.commission_amount)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground">Total a Facturar:</span>
                  <span className="font-bold">{formatCurrency(selectedPayment.total_amount)}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>
                {workflowAction === "validate" ? "Notas de Validación (opcional)" : "Motivo del Rechazo *"}
              </Label>
              <Textarea
                placeholder={workflowAction === "validate" 
                  ? "Agregar notas opcionales sobre la validación..."
                  : "Explica el motivo por el cual se rechaza este pago..."
                }
                value={workflowNotes}
                onChange={(e) => setWorkflowNotes(e.target.value)}
                rows={3}
              />
            </div>

            {workflowAction === "validate" && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  Al validar este pago, quedará listo para generar la factura correspondiente al cliente.
                </p>
              </div>
            )}

            {workflowAction === "reject" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  Al rechazar este pago, no se podrá facturar. Deberás proporcionar un motivo.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setWorkflowModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleWorkflowAction}
              variant={workflowAction === "validate" ? "default" : "destructive"}
              className={workflowAction === "validate" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {workflowAction === "validate" ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Validar Pago
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Rechazar Pago
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              {detailPayment?.payment_number}
            </DialogTitle>
            <DialogDescription>
              Detalle del pago por cuenta de cliente
            </DialogDescription>
          </DialogHeader>
          
          {detailPayment && (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado:</span>
                <Badge variant={statusConfig[detailPayment.status]?.variant || "outline"}>
                  {statusConfig[detailPayment.status]?.label || detailPayment.status}
                </Badge>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <span className="text-xs text-muted-foreground">Proveedor</span>
                  <p className="font-medium">{detailPayment.third_party_name}</p>
                  {detailPayment.third_party_rfc && (
                    <p className="text-sm text-muted-foreground">RFC: {detailPayment.third_party_rfc}</p>
                  )}
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Cliente</span>
                  <p className="font-medium">{detailPayment.client?.company_name || "-"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Fecha de Pago</span>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(detailPayment.payment_date).toLocaleDateString("es-MX")}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Cuenta / Proyecto</span>
                  <p className="font-medium">
                    {detailPayment.account?.account_name || "-"} 
                    {detailPayment.project?.name && ` / ${detailPayment.project.name}`}
                  </p>
                </div>
              </div>

              {/* Amounts */}
              <div className="space-y-2 p-4 border rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto Original:</span>
                  <span className="font-medium">{formatCurrency(detailPayment.original_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Comisión ({detailPayment.commission_percentage}%):</span>
                  <span className="font-medium text-green-600">+ {formatCurrency(detailPayment.commission_amount)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Total a Facturar:</span>
                  <span className="font-bold text-lg">{formatCurrency(detailPayment.total_amount)}</span>
                </div>
              </div>

              {/* Concept */}
              {detailPayment.third_party_concept && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <span className="text-xs text-muted-foreground">Concepto:</span>
                  <p className="text-sm">{detailPayment.third_party_concept}</p>
                </div>
              )}

              {/* Notes */}
              {detailPayment.notes && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <span className="text-xs text-muted-foreground">Notas:</span>
                  <p className="text-sm">{detailPayment.notes}</p>
                </div>
              )}

              {/* Workflow Info */}
              {(detailPayment.validated_at || detailPayment.rejected_at) && (
                <div className="p-3 border rounded-lg space-y-1">
                  {detailPayment.validated_at && (
                    <p className="text-sm">
                      <span className="text-green-600 font-medium">Validado:</span>{" "}
                      {new Date(detailPayment.validated_at).toLocaleString("es-MX")}
                    </p>
                  )}
                  {detailPayment.validation_notes && (
                    <p className="text-sm text-muted-foreground">{detailPayment.validation_notes}</p>
                  )}
                  {detailPayment.rejected_at && (
                    <p className="text-sm">
                      <span className="text-red-600 font-medium">Rechazado:</span>{" "}
                      {new Date(detailPayment.rejected_at).toLocaleString("es-MX")}
                    </p>
                  )}
                  {detailPayment.rejection_reason && (
                    <p className="text-sm text-red-600">{detailPayment.rejection_reason}</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between border-t pt-4">
                <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
                  Cerrar
                </Button>
                <div className="flex gap-2">
                  {detailPayment.status === "draft" && (
                    <>
                      <Button 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setDetailModalOpen(false)
                          openWorkflowModal(detailPayment, "validate")
                        }}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Validar
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => {
                          setDetailModalOpen(false)
                          openWorkflowModal(detailPayment, "reject")
                        }}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Rechazar
                      </Button>
                    </>
                  )}
                  {(detailPayment.status === "validated" || detailPayment.status === "pending") && !detailPayment.invoice && (
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        setDetailModalOpen(false)
                        handleCreateInvoice(detailPayment)
                      }}
                    >
                      <Receipt className="mr-2 h-4 w-4" />
                      Crear Factura
                    </Button>
                  )}
                  {detailPayment.invoice && (
                    <Button 
                      variant="outline"
                      onClick={() => router.push(`/dashboard/invoices/${detailPayment.invoice?.id}`)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Ver Factura
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Status Modal */}
      <Dialog open={changeStatusModalOpen} onOpenChange={setChangeStatusModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Cambiar Estado
            </DialogTitle>
            <DialogDescription>
              {changeStatusPayment && (
                <>Pago <strong>{changeStatusPayment.payment_number}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {changeStatusPayment && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Estado actual:</span>
                  <Badge variant={statusConfig[changeStatusPayment.status]?.variant || "outline"}>
                    {statusConfig[changeStatusPayment.status]?.label || changeStatusPayment.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nuevo Estado</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        Borrador
                      </div>
                    </SelectItem>
                    <SelectItem value="validated">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        Validado
                      </div>
                    </SelectItem>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        Pendiente
                      </div>
                    </SelectItem>
                    <SelectItem value="invoiced">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-purple-500" />
                        Facturado
                      </div>
                    </SelectItem>
                    <SelectItem value="paid">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        Reembolsado
                      </div>
                    </SelectItem>
                    <SelectItem value="rejected">
                      <div className="flex items-center gap-2">
                        <X className="h-4 w-4 text-red-500" />
                        Rechazado
                      </div>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-gray-500" />
                        Cancelado
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newStatus && newStatus !== changeStatusPayment.status && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    El estado cambiará de <strong>{statusConfig[changeStatusPayment.status]?.label}</strong> a{" "}
                    <strong>{statusConfig[newStatus]?.label}</strong>
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setChangeStatusModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleChangeStatus}
              disabled={!newStatus || newStatus === changeStatusPayment?.status}
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
