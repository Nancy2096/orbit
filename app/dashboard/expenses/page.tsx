"use client"

import { useEffect, useRef, useState } from "react"
import { useTabParam } from "@/hooks/use-tab-param"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { upload } from "@vercel/blob/client"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { 
  Plus, 
  Search, 
  Receipt, 
  Pencil,
  Eye, 
  Trash2, 
  DollarSign, 
  TrendingDown, 
  Calendar, 
  FolderTree,
  Building2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  UserCheck,
  Send,
  History,
  Upload,
  FileText,
  Wallet,
  X
} from "lucide-react"

interface ExpenseCategory {
  id: string
  name: string
  description: string | null
  expense_type: string
  is_active: boolean
  agency_id: string | null
}

interface Expense {
  id: string
  expense_number: string
  expense_date: string
  start_date: string | null
  end_date: string | null
  receipt_url: string | null
  is_operational: boolean | null
  account_id: string | null
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
  requested_by_id: string | null
  approved_by_id: string | null
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
  requested_by: { id: string; first_name: string; last_name: string } | null
  approved_by: { id: string; first_name: string; last_name: string } | null
}

interface Staff {
  id: string
  first_name: string
  last_name: string
  reports_to_id: string | null
}

interface Agency {
  id: string
  name: string
}

interface Client {
  id: string
  company_name: string
  agency_id: string
}

interface Project {
  id: string
  name: string
  account_id: string | null
  client_id: string | null
}

interface Account {
  id: string
  account_name: string
  agency_id: string
  client_id: string | null
}

interface Currency {
  id: string
  code: string
  symbol: string
}

interface BankAccount {
  id: string
  agency_id: string
  bank_name: string
  account_name: string
  account_number: string | null
  current_balance: number | null
  is_active: boolean
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Borrador", variant: "secondary" },
  pending: { label: "Pendiente", variant: "outline" },
  approved: { label: "Aprobado", variant: "default" },
  paid: { label: "Pagado", variant: "default" },
  rejected: { label: "Rechazado", variant: "destructive" },
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

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [formCategories, setFormCategories] = useState<ExpenseCategory[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [approversList, setApproversList] = useState<Staff[]>([])
  const [currentUserStaff, setCurrentUserStaff] = useState<Staff | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAgency, setSelectedAgency] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState<string>("all")
  const [activeTab, setActiveTab] = useTabParam("expenses")
  
  // Approval dialog
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [selectedExpenseForApproval, setSelectedExpenseForApproval] = useState<Expense | null>(null)
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve")
  const [rejectionReason, setRejectionReason] = useState("")

  // Diálogo de pago (aprobado -> pagado): elige el banco de salida.
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedExpenseForPayment, setSelectedExpenseForPayment] = useState<Expense | null>(null)
  const [paymentBankAccounts, setPaymentBankAccounts] = useState<BankAccount[]>([])
  const [selectedPaymentBankId, setSelectedPaymentBankId] = useState<string>("")
  const supabase = createClient()

  // Dialogs
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null)

  // Stats
  const [stats, setStats] = useState({
    totalApproved: 0,
    thisMonth: 0,
    pending: 0,
    byType: [] as { type: string; total: number }[],
  })

  // New expense form
  const [expenseForm, setExpenseForm] = useState({
    agency_id: "",
    category_id: "",
    client_id: "",
    project_id: "",
    account_id: "",
    is_operational: false,
    vendor_id: "",
    requested_by_id: "",
    approver_id: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
    description: "",
    amount: 0,
    tax_amount: 0,
    vendor_name: "",
    invoice_number: "",
    payment_method: "",
    payment_date: "",
    currency_id: "",
    notes: "",
    status: "pending",
    receipt_url: "",
  })

  // Estado de subida del comprobante/factura del gasto.
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const receiptInputRef = useRef<HTMLInputElement>(null)

  // Previsualización del número consecutivo que tendrá el gasto al registrarse.
  const [previewNumber, setPreviewNumber] = useState("")

  // Tipos de gasto alineados con los rubros de "Objetivos Financieros" de la agencia.
  // Si cambian los nombres allá, deben cambiar aquí también.
  const expenseTypes = [
    { value: "fixed", label: "Gastos Operativos fijos" },
    { value: "variable", label: "Gastos Operativos Variables" },
    { value: "marketing", label: "Marketing y Ventas" },
    { value: "financial", label: "Impuestos y Pagos Financieros" },
  ]

  // New category form
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    expense_type: "variable",
    agency_id: "",
    is_active: true,
  })

  useEffect(() => {
    fetchCurrentUserStaff()
    fetchAgencies()
    fetchCurrencies()
    fetchCategories()
    fetchExpenses()
  }, [selectedAgency, selectedCategory, selectedStatus])

  const fetchCurrentUserStaff = async () => {
    // Get current authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Find staff record linked to this user
    const { data: staffData } = await supabase
      .from("staff")
      .select("id, first_name, last_name, reports_to_id, agency_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (staffData) {
      setCurrentUserStaff(staffData)
      // Prellenar el solicitante con el usuario logueado SOLO si no se está
      // editando un gasto existente. Al editar, se conserva el solicitante
      // original del gasto para no reasignarlo al usuario actual.
      setExpenseForm(prev => {
        if (editingExpense) return prev
        return {
          ...prev,
          agency_id: staffData.agency_id || prev.agency_id,
          requested_by_id: staffData.id,
        }
      })
    }
  }

  useEffect(() => {
    if (expenseForm.agency_id) {
      fetchFormCategoriesByAgency(expenseForm.agency_id)
      fetchClientsByAgency(expenseForm.agency_id)
      fetchProjectsByAgency(expenseForm.agency_id)
      fetchAccountsByAgency(expenseForm.agency_id)
      fetchVendorsByAgency(expenseForm.agency_id)
      fetchStaffByAgency(expenseForm.agency_id)
    } else {
      // Reset agency-dependent lists when no agency selected
      setFormCategories([])
      setClients([])
      setProjects([])
      setAccounts([])
      setVendors([])
      setStaffList([])
    }
  }, [expenseForm.agency_id])

  // La lista de aprobadores depende del SOLICITANTE (cadena de mando por
  // reports_to_id), NO de la agencia: los jefes pueden ser globales
  // (agency_id nulo, ej. Director General, Directora de Operaciones). Por eso
  // se resuelve de forma independiente al agency_id seleccionado.
  // Se recalcula cuando cambia el solicitante Y también al abrir el diálogo:
  // resetExpenseForm() vacía approversList pero mantiene el mismo requested_by_id
  // (el usuario logeado), por lo que sin depender de showExpenseDialog el efecto
  // no volvía a dispararse y la lista quedaba vacía ("Solicitar aprobación a").
  useEffect(() => {
    if (!showExpenseDialog) return
    if (expenseForm.requested_by_id) {
      fetchApproversForStaff(expenseForm.requested_by_id, expenseForm.agency_id)
    } else {
      setApproversList([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseForm.requested_by_id, showExpenseDialog])

  // Al abrir el formulario de un gasto nuevo con agencia seleccionada, se
  // consulta (SIN reservar) el siguiente número consecutivo como referencia.
  // El folio real se reserva atómicamente al guardar, no al previsualizar,
  // para no consumir números si el usuario cierra sin guardar.
  useEffect(() => {
    if (showExpenseDialog && !editingExpense && expenseForm.agency_id) {
      supabase
        .rpc("peek_expense_folio", { p_agency_id: expenseForm.agency_id })
        .then(({ data }) => setPreviewNumber(formatExpenseFolio(Number(data ?? 0) + 1)))
    } else if (!showExpenseDialog) {
      setPreviewNumber("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showExpenseDialog, editingExpense, expenseForm.agency_id])

  const fetchAgencies = async () => {
    const { data } = await supabase.from("agencies").select("id, name").eq("is_active", true).order("name")
    if (data) setAgencies(data)
  }

  const fetchCurrencies = async () => {
    const { data } = await supabase.from("currencies").select("id, code, symbol").eq("is_active", true)
    if (data) {
      setCurrencies(data)
      const mxn = data.find(c => c.code === "MXN")
      if (mxn) setExpenseForm(prev => ({ ...prev, currency_id: mxn.id }))
    }
  }

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("expense_categories")
      .select("id, name, description, expense_type, is_active, agency_id")
      .order("name")
    if (data) setCategories(data)
  }

  const fetchFormCategoriesByAgency = async (agencyId: string) => {
    // Get categories that are global (no agency_id) or belong to this agency
    const { data } = await supabase
      .from("expense_categories")
      .select("id, name, description, expense_type, is_active, agency_id")
      .or(`agency_id.is.null,agency_id.eq.${agencyId}`)
      .eq("is_active", true)
      .order("name")
    if (data) setFormCategories(data)
  }

  const fetchClientsByAgency = async (agencyId: string) => {
    const { data } = await supabase
      .from("clients")
      .select("id, company_name, agency_id")
      .eq("agency_id", agencyId)
      .eq("status", "active")
      .order("company_name")
    if (data) setClients(data)
  }

  const fetchProjectsByAgency = async (agencyId: string) => {
    // Los proyectos no tienen agency_id ni client_id directo: se relacionan con el
    // cliente a través de la cuenta (projects.account_id -> accounts.client_id/agency_id).
    const { data } = await supabase
      .from("projects")
      .select("id, name, account_id, account:accounts!inner(client_id, agency_id)")
      .eq("account.agency_id", agencyId)
      .order("name")
    if (data) {
      setProjects(
        data.map((p: Record<string, unknown>) => {
          const acc = Array.isArray(p.account) ? p.account[0] : p.account
          return {
            id: p.id as string,
            name: p.name as string,
            account_id: (p.account_id as string) || null,
            client_id: (acc?.client_id as string) || null,
          }
        })
      )
    }
  }

  const fetchAccountsByAgency = async (agencyId: string) => {
    const { data } = await supabase
      .from("accounts")
      .select("id, account_name, agency_id, client_id")
      .eq("agency_id", agencyId)
      .eq("status", "active")
      .order("account_name")
    if (data) setAccounts(data)
  }

  const fetchVendorsByAgency = async (agencyId: string) => {
    const { data } = await supabase
      .from("vendors")
      .select("id, name")
      .eq("agency_id", agencyId)
      .eq("is_active", true)
      .order("name")
    if (data) setVendors(data)
  }

  const fetchStaffByAgency = async (agencyId: string) => {
    const { data } = await supabase
      .from("staff")
      .select("id, first_name, last_name, reports_to_id")
      .eq("agency_id", agencyId)
      .eq("is_active", true)
      .order("first_name")
    if (data) setStaffList(data)
  }

const fetchApproversForStaff = async (staffId: string, _agencyId: string) => {
    // Traemos TODO el staff activo (sin filtrar por agencia): los puestos más
    // altos (Director General, Directora de Operaciones) tienen agency_id nulo
    // y no aparecerían al filtrar por una agencia específica. La cadena de
    // aprobación se construye siguiendo reports_to_id, que es explícito.
    const { data: allStaffRaw } = await supabase
      .from("staff")
      .select("id, first_name, last_name, reports_to_id, position:positions(sort_order)")
      .eq("is_active", true)

    if (!allStaffRaw || allStaffRaw.length === 0) {
      setApproversList([])
      return
    }

    type StaffWithPosition = Staff & { position?: { sort_order: number | null } | { sort_order: number | null }[] | null }
    const allStaff = allStaffRaw as unknown as StaffWithPosition[]

    // El sort_order del puesto define la jerarquía (0 = más alto). Supabase
    // puede devolver la relación como objeto o como arreglo.
    const getSortOrder = (s: StaffWithPosition): number => {
      const pos = Array.isArray(s.position) ? s.position[0] : s.position
      return typeof pos?.sort_order === "number" ? pos.sort_order : Number.POSITIVE_INFINITY
    }

    const currentStaff = allStaff.find(s => s.id === staffId)
    if (!currentStaff) {
      setApproversList([])
      return
    }

    // Empleado CON jefe: se arma la cadena de mando hacia arriba.
    if (currentStaff.reports_to_id) {
      const approvers: Staff[] = []
      let currentSupervisorId: string | null = currentStaff.reports_to_id
      while (currentSupervisorId) {
        const supervisor = allStaff.find(s => s.id === currentSupervisorId)
        if (supervisor && !approvers.find(a => a.id === supervisor.id)) {
          approvers.push(supervisor)
          currentSupervisorId = supervisor.reports_to_id
        } else {
          break
        }
      }
      setApproversList(approvers)
      setExpenseForm(prev => ({ ...prev, approver_id: currentStaff.reports_to_id || "" }))
      return
    }

    // Empleado SIN jefe (puesto más alto, ej. Director General): mostramos los
    // dos puestos más altos: él mismo y el siguiente nivel jerárquico (ej.
    // Directora de Operaciones). Puede aprobar sus propios gastos.
    const ownOrder = getSortOrder(currentStaff)
    const nextOrder = allStaff
      .map(getSortOrder)
      .filter(o => Number.isFinite(o) && o > ownOrder)
      .sort((a, b) => a - b)[0]
    const nextLevelStaff = nextOrder !== undefined
      ? allStaff.filter(s => getSortOrder(s) === nextOrder && s.id !== currentStaff.id)
      : []

    setApproversList([currentStaff, ...nextLevelStaff])
    setExpenseForm(prev => ({ ...prev, approver_id: currentStaff.id }))
  }

  const fetchExpenses = async () => {
    setLoading(true)
    let query = supabase
      .from("expenses")
      .select(`
        *,
        category:expense_categories(id, name, expense_type),
        agency:agencies(id, name),
        currency:currencies(id, code, symbol),
        project:projects(id, name),
        requested_by:staff!expenses_requested_by_id_fkey(id, first_name, last_name),
        approved_by:staff!expenses_approved_by_id_fkey(id, first_name, last_name)
      `)
      .order("created_at", { ascending: false })

    if (selectedAgency !== "all") {
      query = query.eq("agency_id", selectedAgency)
    }
    if (selectedCategory !== "all") {
      query = query.eq("category_id", selectedCategory)
    }
    if (selectedStatus !== "all") {
      query = query.eq("status", selectedStatus)
    }
    if (selectedApprovalStatus !== "all") {
      query = query.eq("approval_status", selectedApprovalStatus)
    }

    const { data, error } = await query

    if (!error) {
      setExpenses(data || [])
      calculateStats(data || [])
    }
    setLoading(false)
  }

  const calculateStats = (expensesData: Expense[]) => {
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // El total gastado considera únicamente los gastos aprobados.
    const approved = expensesData.filter(e => e.status === "approved")
    const totalApproved = approved.reduce((sum, e) => sum + Number(e.total_amount), 0)
    const thisMonth = approved
      .filter(e => new Date(e.expense_date) >= thisMonthStart)
      .reduce((sum, e) => sum + Number(e.total_amount), 0)
    const pending = expensesData
      .filter(e => e.status === "pending")
      .reduce((sum, e) => sum + Number(e.total_amount), 0)

    // Acumulado por tipo de gasto (solo aprobados).
    const typeMap = new Map<string, number>()
    approved.forEach(e => {
      const type = e.category?.expense_type || "sin_tipo"
      typeMap.set(type, (typeMap.get(type) || 0) + Number(e.total_amount))
    })
    const byType = Array.from(typeMap.entries()).map(([type, total]) => ({ type, total }))

    setStats({ totalApproved, thisMonth, pending, byType })
  }

  const filteredExpenses = expenses.filter((expense) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      expense.expense_number?.toLowerCase().includes(searchLower) ||
      expense.description?.toLowerCase().includes(searchLower) ||
      expense.vendor_name?.toLowerCase().includes(searchLower) ||
      expense.category?.name?.toLowerCase().includes(searchLower)
    )
  })

  const filteredCategories = categories.filter((category) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      category.name?.toLowerCase().includes(searchLower) ||
      category.code?.toLowerCase().includes(searchLower)
    )
  })

  const formatCurrency = (amount: number, currency?: { symbol: string } | null) => {
    const symbol = currency?.symbol || "$"
    return `${symbol}${Number(amount).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
  }

  // Fecha y hora de registro (cuando se hizo la solicitud del gasto).
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

  const formatExpenseFolio = (folio: number) => {
    const year = new Date().getFullYear()
    return `GAS-${year}-${String(folio).padStart(5, "0")}`
  }

  // Reserva atómica del siguiente folio consecutivo del gasto. El folio se
  // incrementa de forma permanente: aunque el gasto se elimine, ese número
  // no se reutiliza y es único.
  const generateExpenseNumber = async (agencyId: string) => {
    const { data, error } = await supabase.rpc("next_expense_folio", {
      p_agency_id: agencyId,
    })
    if (error || data == null) {
      throw new Error(error?.message || "No se pudo reservar el número de gasto")
    }
    return formatExpenseFolio(Number(data))
  }

  // Sube el comprobante/factura del gasto a Blob (privado) y guarda la URL.
  const handleReceiptUpload = async (file: File) => {
    setUploadingReceipt(true)
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      const blob = await upload(`expense-receipts/${Date.now()}-${safeName}`, file, {
        access: "private",
        handleUploadUrl: "/api/expenses/receipt/upload",
        contentType: file.type,
      })
      // El store es privado: guardamos el pathname para servirlo vía /api/file.
      const pathname = blob.url.split(".vercel-storage.com/")[1] || blob.url
      setExpenseForm((prev) => ({ ...prev, receipt_url: pathname }))
    } catch (error) {
      console.error("Error uploading receipt:", error)
      alert("Error al subir el comprobante. Verifica que sea PDF o imagen (máx 25MB).")
    } finally {
      setUploadingReceipt(false)
      if (receiptInputRef.current) receiptInputRef.current.value = ""
    }
  }

  const handleSaveExpense = async (submitForApproval: boolean) => {
    // Un gasto aprobado es de solo lectura: no se puede editar, guardar como
    // borrador ni reenviar a aprobación. Solo se puede ver y eliminar.
    if (editingExpense && editingExpense.approval_status === "approved") {
      return
    }
    // Datos mínimos para cualquier guardado (incluido el borrador).
    if (!expenseForm.agency_id || !expenseForm.description || expenseForm.amount <= 0 || !expenseForm.requested_by_id) return
    // Para enviar a aprobación es obligatorio elegir un aprobador.
    if (submitForApproval && !expenseForm.approver_id) return
    setSaving(true)

    const totalAmount = expenseForm.amount + expenseForm.tax_amount
    // Un gasto operativo es de la agencia: no se asocia a proyecto ni cuenta.
    const projectId = expenseForm.is_operational ? null : expenseForm.project_id || null
    const accountId = expenseForm.is_operational ? null : expenseForm.account_id || null
    // Auto-aprobación: al enviar a aprobación, si el solicitante es su propio
    // aprobador (empleado sin jefe), el gasto queda aprobado al registrarse.
    const isSelfApproval = submitForApproval && expenseForm.approver_id === expenseForm.requested_by_id
    // Estado resultante: borrador, aprobado (auto) o pendiente de aprobación.
    const resolvedStatus = !submitForApproval ? "draft" : isSelfApproval ? "approved" : "pending"
    const resolvedApprovalStatus = resolvedStatus

    if (editingExpense) {
      const { error } = await supabase
        .from("expenses")
        .update({
          agency_id: expenseForm.agency_id,
          category_id: expenseForm.category_id || null,
          project_id: projectId,
          account_id: accountId,
          is_operational: expenseForm.is_operational,
          vendor_id: expenseForm.vendor_id || null,
          requested_by_id: expenseForm.requested_by_id,
          approver_id: expenseForm.approver_id,
          start_date: expenseForm.start_date,
          end_date: expenseForm.end_date,
          // expense_date se conserva por compatibilidad (columna NOT NULL).
          expense_date: expenseForm.start_date,
          description: expenseForm.description,
          amount: expenseForm.amount,
          tax_amount: expenseForm.tax_amount,
          total_amount: totalAmount,
          vendor_name: expenseForm.vendor_name || null,
          invoice_number: expenseForm.invoice_number || null,
          payment_method: expenseForm.payment_method || null,
          payment_date: expenseForm.payment_date || null,
          currency_id: expenseForm.currency_id || null,
          notes: expenseForm.notes || null,
          status: resolvedStatus,
          approval_status: resolvedApprovalStatus,
          approved_by_id: isSelfApproval ? expenseForm.approver_id : null,
          approved_at: isSelfApproval ? new Date().toISOString() : null,
          receipt_url: expenseForm.receipt_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingExpense.id)

      if (error) {
        console.error("Error updating expense:", error)
      } else if (submitForApproval) {
        // Registrar en el historial la transición al enviar a aprobación.
        await supabase.from("expense_approval_history").insert({
          expense_id: editingExpense.id,
          action: isSelfApproval ? "approved" : "submitted",
          performed_by_id: expenseForm.requested_by_id,
          comments: isSelfApproval
            ? "Gasto aprobado por el mismo solicitante (sin jefe asignado)"
            : "Gasto enviado para aprobación",
        })
      }
    } else {
      let expenseNumber: string
      try {
        expenseNumber = await generateExpenseNumber(expenseForm.agency_id)
      } catch (err) {
        console.error("Error generating expense number:", err)
        alert("No se pudo generar el número de gasto. Intenta de nuevo.")
        setSaving(false)
        return
      }
      const { data: newExpense, error } = await supabase
        .from("expenses")
        .insert({
          agency_id: expenseForm.agency_id,
          category_id: expenseForm.category_id || null,
          project_id: projectId,
          account_id: accountId,
          is_operational: expenseForm.is_operational,
          vendor_id: expenseForm.vendor_id || null,
          requested_by_id: expenseForm.requested_by_id,
          approver_id: expenseForm.approver_id,
          expense_number: expenseNumber,
          start_date: expenseForm.start_date,
          end_date: expenseForm.end_date,
          // expense_date se conserva por compatibilidad (columna NOT NULL).
          expense_date: expenseForm.start_date,
          description: expenseForm.description,
          amount: expenseForm.amount,
          tax_amount: expenseForm.tax_amount,
          total_amount: totalAmount,
          vendor_name: expenseForm.vendor_name || null,
          invoice_number: expenseForm.invoice_number || null,
          payment_method: expenseForm.payment_method || null,
          payment_date: expenseForm.payment_date || null,
          currency_id: expenseForm.currency_id || null,
          notes: expenseForm.notes || null,
          status: resolvedStatus,
          approval_status: resolvedApprovalStatus,
          approved_by_id: isSelfApproval ? expenseForm.approver_id : null,
          approved_at: isSelfApproval ? new Date().toISOString() : null,
          receipt_url: expenseForm.receipt_url || null,
        })
        .select("id")
        .single()

      if (error) {
        console.error("Error creating expense:", error)
      } else if (newExpense && submitForApproval) {
        // Solo se registra historial cuando el gasto se envía a aprobación.
        await supabase.from("expense_approval_history").insert({
          expense_id: newExpense.id,
          action: isSelfApproval ? "approved" : "submitted",
          performed_by_id: expenseForm.requested_by_id,
          comments: isSelfApproval
            ? "Gasto registrado y aprobado por el mismo solicitante (sin jefe asignado)"
            : "Gasto enviado para aprobación",
        })
      }
    }

    setShowExpenseDialog(false)
    resetExpenseForm()
    fetchExpenses()
    setSaving(false)
  }

  const handleApproveExpense = async () => {
    if (!selectedExpenseForApproval) return
    setSaving(true)

    // El aprobador es la persona a la que se le solicitó la aprobación de este
    // gasto (approver_id), NO un director genérico. Así, quien queda registrado
    // en "Personas" y en el "Historial de aprobación" es el aprobador real.
    const approverId =
      ((selectedExpenseForApproval as Record<string, unknown>).approver_id as string) || null

    const { error } = await supabase
      .from("expenses")
      .update({
        approval_status: "approved",
        approved_by_id: approverId,
        approved_at: new Date().toISOString(),
        status: "approved",
      })
      .eq("id", selectedExpenseForApproval.id)

    if (!error) {
      await supabase.from("expense_approval_history").insert({
        expense_id: selectedExpenseForApproval.id,
        action: "approved",
        performed_by_id: approverId,
        comments: "Gasto aprobado",
      })
    }

    setShowApprovalDialog(false)
    setSelectedExpenseForApproval(null)
    fetchExpenses()
    setSaving(false)
  }

  const handleRejectExpense = async () => {
    if (!selectedExpenseForApproval || !rejectionReason) return
    setSaving(true)

    // El rechazo también lo registra la persona a la que se solicitó la
    // aprobación de este gasto (approver_id), no un director genérico.
    const approverId =
      ((selectedExpenseForApproval as Record<string, unknown>).approver_id as string) || null

    const { error } = await supabase
      .from("expenses")
      .update({
        approval_status: "rejected",
        approved_by_id: approverId,
        approved_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
        status: "rejected",
      })
      .eq("id", selectedExpenseForApproval.id)

    if (!error) {
      await supabase.from("expense_approval_history").insert({
        expense_id: selectedExpenseForApproval.id,
        action: "rejected",
        performed_by_id: approverId,
        comments: rejectionReason,
      })
    }

    setShowApprovalDialog(false)
    setSelectedExpenseForApproval(null)
    setRejectionReason("")
    fetchExpenses()
    setSaving(false)
  }

  const openApprovalDialog = (expense: Expense, action: "approve" | "reject") => {
    setSelectedExpenseForApproval(expense)
    setApprovalAction(action)
    setRejectionReason("")
    setShowApprovalDialog(true)
    // Load staff for the agency
    if (expense.agency?.id) {
      fetchStaffByAgency(expense.agency.id)
    }
  }

  // Abre el diálogo para marcar un gasto aprobado como pagado. Carga los bancos
  // activos de la agencia del gasto para elegir el banco de salida.
  const openPaymentDialog = async (expense: Expense) => {
    setSelectedExpenseForPayment(expense)
    // Preseleccionar el banco ya asignado en el detalle (si existe).
    setSelectedPaymentBankId(expense.bank_account_id || "")
    setShowPaymentDialog(true)

    if (expense.agency?.id) {
      const { data } = await supabase
        .from("bank_accounts")
        .select("id, agency_id, bank_name, account_name, account_number, current_balance, is_active")
        .eq("agency_id", expense.agency.id)
        .eq("is_active", true)
        .order("is_primary", { ascending: false })
        .order("bank_name")
      setPaymentBankAccounts((data as BankAccount[]) || [])
    } else {
      setPaymentBankAccounts([])
    }
  }

  // Marca el gasto como pagado, resta el monto total del banco seleccionado y
  // registra el movimiento en el historial de aprobación.
  const handleMarkAsPaid = async () => {
    if (!selectedExpenseForPayment || !selectedPaymentBankId) return
    setSaving(true)

    const expense = selectedExpenseForPayment
    const bank = paymentBankAccounts.find((b) => b.id === selectedPaymentBankId)
    if (!bank) {
      setSaving(false)
      return
    }

    const amount = Number(expense.total_amount || 0)
    const previousBalance = Number(bank.current_balance || 0)
    const newBalance = previousBalance - amount

    // Quién realiza la acción: el staff del usuario autenticado.
    const performedById = currentUserStaff?.id || expense.approved_by_id || null

    // 1) Descontar el monto del saldo del banco de salida.
    const { error: bankError } = await supabase
      .from("bank_accounts")
      .update({ current_balance: newBalance, updated_at: new Date().toISOString() })
      .eq("id", bank.id)

    if (bankError) {
      console.error("Error updating bank balance:", bankError)
      setSaving(false)
      return
    }

    // 2) Marcar el gasto como pagado y guardar el banco de salida y la fecha.
    const { error } = await supabase
      .from("expenses")
      .update({
        status: "paid",
        approval_status: "paid",
        bank_account_id: bank.id,
        payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", expense.id)

    if (error) {
      console.error("Error marking expense as paid:", error)
      // Revertir el descuento del banco si falla la actualización del gasto.
      await supabase
        .from("bank_accounts")
        .update({ current_balance: previousBalance })
        .eq("id", bank.id)
      setSaving(false)
      return
    }

    // 3) Registrar el movimiento en el historial de aprobación.
    const currencySymbol = expense.currency?.symbol || "$"
    await supabase.from("expense_approval_history").insert({
      expense_id: expense.id,
      action: "paid",
      performed_by_id: performedById,
      comments:
        `Gasto marcado como pagado. Banco de salida: ${bank.bank_name} - ${bank.account_name}. ` +
        `Se descontaron ${currencySymbol}${amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })} ` +
        `del saldo (nuevo saldo: ${currencySymbol}${newBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}).`,
    })

    setShowPaymentDialog(false)
    setSelectedExpenseForPayment(null)
    setSelectedPaymentBankId("")
    setPaymentBankAccounts([])
    fetchExpenses()
    setSaving(false)
  }

  const getApprovalStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Aprobado</Badge>
      case "paid":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200"><Wallet className="w-3 h-3 mr-1" />Pagado</Badge>
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rechazado</Badge>
      case "cancelled":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleSaveCategory = async () => {
    if (!categoryForm.name) return
    setSaving(true)

    const categoryData = {
      name: categoryForm.name,
      description: categoryForm.description || null,
      expense_type: categoryForm.expense_type,
      agency_id: categoryForm.agency_id || null,
      is_active: categoryForm.is_active,
    }

    if (editingCategory) {
      const { error } = await supabase
        .from("expense_categories")
        .update(categoryData)
        .eq("id", editingCategory.id)

      if (error) console.error("Error updating category:", error)
    } else {
      const { error } = await supabase
        .from("expense_categories")
        .insert(categoryData)

      if (error) console.error("Error creating category:", error)
    }

    setShowCategoryDialog(false)
    resetCategoryForm()
    fetchCategories()
    setSaving(false)
  }

  const handleEditExpense = async (expense: Expense) => {
    setEditingExpense(expense)
    // Load related data for agency if expense has agency
    if (expense.agency?.id) {
      await Promise.all([
        fetchFormCategoriesByAgency(expense.agency.id),
        fetchClientsByAgency(expense.agency.id),
        fetchProjectsByAgency(expense.agency.id),
        fetchAccountsByAgency(expense.agency.id),
        fetchVendorsByAgency(expense.agency.id)
      ])
    }

    // Derivar el cliente a partir de la cuenta o del proyecto del gasto.
    let derivedClientId = ""
    if (expense.account_id) {
      const { data } = await supabase.from("accounts").select("client_id").eq("id", expense.account_id).single()
      derivedClientId = (data?.client_id as string) || ""
    } else if (expense.project?.id) {
      const { data } = await supabase
        .from("projects")
        .select("account:accounts(client_id)")
        .eq("id", expense.project.id)
        .single()
      const acc = data ? (Array.isArray(data.account) ? data.account[0] : data.account) : null
      derivedClientId = (acc?.client_id as string) || ""
    }

    setExpenseForm({
      agency_id: expense.agency?.id || "",
      category_id: expense.category?.id || "",
      client_id: derivedClientId,
      project_id: expense.project?.id || "",
      account_id: expense.account_id || "",
      is_operational: expense.is_operational ?? false,
      vendor_id: (expense as Record<string, unknown>).vendor_id as string || "",
      requested_by_id: expense.requested_by_id || "",
      approver_id: (expense as Record<string, unknown>).approver_id as string || "",
      // Usar el rango si existe; si no, caer al expense_date anterior.
      start_date: expense.start_date || expense.expense_date,
      end_date: expense.end_date || expense.expense_date,
      description: expense.description,
      amount: Number(expense.amount),
      tax_amount: Number(expense.tax_amount),
      vendor_name: expense.vendor_name || "",
      invoice_number: expense.invoice_number || "",
      payment_method: expense.payment_method || "",
      payment_date: expense.payment_date || "",
      currency_id: expense.currency?.id || "",
      notes: expense.notes || "",
      status: expense.status,
      receipt_url: expense.receipt_url || "",
    })
    setShowExpenseDialog(true)
  }

  const handleEditCategory = (category: ExpenseCategory) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      expense_type: (category as Record<string, unknown>).expense_type as string || "variable",
      agency_id: category.agency_id || "",
      is_active: category.is_active,
    })
    setShowCategoryDialog(true)
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este gasto?")) return
    await supabase.from("expenses").delete().eq("id", id)
    fetchExpenses()
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta categoría?")) return
    await supabase.from("expense_categories").delete().eq("id", id)
    fetchCategories()
  }

const resetExpenseForm = () => {
    setEditingExpense(null)
    // Keep current user data - always pre-fill requested_by_id with logged user
    const defaultAgencyId = currentUserStaff?.agency_id || ""
    const defaultRequestedById = currentUserStaff?.id || ""

    setExpenseForm({
      agency_id: defaultAgencyId,
      category_id: "",
      client_id: "",
      project_id: "",
      account_id: "",
      is_operational: false,
      vendor_id: "",
      requested_by_id: defaultRequestedById, // Always the logged-in user
      approver_id: "",
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0],
      description: "",
      amount: 0,
      tax_amount: 0,
      vendor_name: "",
      invoice_number: "",
      payment_method: "",
      payment_date: "",
      currency_id: currencies.find(c => c.code === "MXN")?.id || "",
      notes: "",
      status: "pending",
      receipt_url: "",
    })
    setFormCategories([])
    setClients([])
    setProjects([])
    setAccounts([])
    setVendors([])
    setApproversList([])
  }

  const resetCategoryForm = () => {
    setEditingCategory(null)
    setCategoryForm({
      name: "",
      description: "",
      expense_type: "variable",
      agency_id: "",
      is_active: true,
    })
  }

  // Un gasto aprobado es de solo lectura: no se puede editar ni reenviar,
  // únicamente consultar (y eliminar desde la tabla).
  const isApprovedReadOnly = !!editingExpense && editingExpense.approval_status === "approved"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gastos</h1>
          <p className="text-muted-foreground">
            Gestiona los gastos operativos de tus agencias
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { resetExpenseForm(); setShowExpenseDialog(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Gasto
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gastado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalApproved)}</div>
            <p className="text-xs text-muted-foreground">Solo gastos aprobados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.thisMonth)}</div>
            <p className="text-xs text-muted-foreground">Aprobado en el mes actual</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(stats.pending)}</div>
            <p className="text-xs text-muted-foreground">Por aprobar</p>
          </CardContent>
        </Card>
      </div>

      {/* Acumulado por tipo de gasto: una tarjeta por cada tipo (solo aprobados) */}
      <div className="grid gap-4 md:grid-cols-4">
        {expenseTypes.map((t) => {
          const total = stats.byType.find((b) => b.type === t.value)?.total || 0
          return (
            <Card key={t.value}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-pretty">{t.label}</CardTitle>
                <FolderTree className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(total)}</div>
                <p className="text-xs text-muted-foreground">Acumulado aprobado</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
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
                    placeholder="Buscar por descripción, proveedor o categoría..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedAgency} onValueChange={setSelectedAgency}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Agencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las agencias</SelectItem>
                    {agencies.map((agency) => (
                      <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.filter(c => c.is_active).map((category) => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedApprovalStatus} onValueChange={setSelectedApprovalStatus}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Aprobación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="approved">Aprobado</SelectItem>
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
              ) : filteredExpenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">No hay gastos</h3>
                  <p className="text-muted-foreground mt-1">Registra tu primer gasto para comenzar</p>
                  <Button className="mt-4" onClick={() => { resetExpenseForm(); setShowExpenseDialog(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Gasto
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Fecha de Registro</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Tipo de Gasto</TableHead>
                      <TableHead>Solicitante</TableHead>
                      <TableHead className="text-left">Monto</TableHead>
                      <TableHead>Aprobación</TableHead>
                      <TableHead className="w-[150px] text-left">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium">
                            <Link
                              href={`/dashboard/expenses/${expense.id}`}
                              className="text-primary underline-offset-4 hover:underline"
                            >
                              {expense.expense_number}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{formatDateTime(expense.created_at)}</div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {expense.description}
                                {expense.receipt_url && (
                                  <a
                                    href={`/api/file?pathname=${encodeURIComponent(expense.receipt_url)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary"
                                    title="Ver comprobante"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                  </a>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {expense.agency?.name}
                                {expense.is_operational && (
                                  <Badge variant="secondary" className="ml-2 text-xs">Operativo</Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {expense.category?.name ? (
                              <Badge variant="outline">{expense.category.name}</Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">Sin categoría</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {expense.category?.expense_type ? (
                              <Badge variant="secondary">
                                {expenseTypes.find(t => t.value === expense.category?.expense_type)?.label || expense.category.expense_type}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {expense.requested_by ? (
                              <span>{expense.requested_by.first_name} {expense.requested_by.last_name}</span>
                            ) : "-"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(expense.total_amount, expense.currency)}
                          </TableCell>
                          <TableCell>
                            {getApprovalStatusBadge(
                              expense.status === "paid" ? "paid" : expense.approval_status || "pending",
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              {expense.approval_status === "pending" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => openApprovalDialog(expense, "approve")}
                                    title="Aprobar"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => openApprovalDialog(expense, "reject")}
                                    title="Rechazar"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {expense.status === "approved" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => openPaymentDialog(expense)}
                                  title="Marcar como pagado"
                                >
                                  <Wallet className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditExpense(expense)}
                                title={expense.approval_status === "approved" ? "Ver gasto (aprobado)" : "Editar gasto"}
                              >
                                {expense.approval_status === "approved" ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <Pencil className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteExpense(expense.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FolderTree className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">No hay categorías</h3>
                  <p className="text-muted-foreground mt-1">Crea categorías para organizar tus gastos</p>
                  <Button className="mt-4" onClick={() => { resetCategoryForm(); setShowCategoryDialog(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Categoría
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Tipo de Gasto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-muted-foreground">{category.description || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {expenseTypes.find(t => t.value === category.expense_type)?.label || category.expense_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={category.is_active ? "default" : "secondary"}>
                            {category.is_active ? "Activa" : "Inactiva"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditCategory(category)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Expense Dialog */}
      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {isApprovedReadOnly ? "Ver Gasto (aprobado)" : editingExpense ? "Editar Gasto" : "Nuevo Gasto"}
            </DialogTitle>
            <DialogDescription>
              {isApprovedReadOnly
                ? "Este gasto ya fue aprobado. Solo se puede consultar."
                : "Registra un gasto operativo"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1 pr-3">
          <div className="mb-6 flex flex-wrap items-center gap-4 rounded-md border bg-muted/50 px-4 py-3">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Número de Gasto</span>
              <span className="font-mono font-medium">
                {editingExpense
                  ? editingExpense.expense_number
                  : expenseForm.agency_id
                    ? previewNumber || "Generando..."
                    : "Selecciona una agencia"}
              </span>
            </div>
            <div className="ml-auto flex flex-col text-right">
              <span className="text-xs text-muted-foreground">Solicitante</span>
              <span className="font-medium">
                {editingExpense?.requested_by
                  ? `${editingExpense.requested_by.first_name} ${editingExpense.requested_by.last_name}`
                  : currentUserStaff
                    ? `${currentUserStaff.first_name} ${currentUserStaff.last_name}`
                    : "-"}
              </span>
            </div>
          </div>
          <fieldset disabled={isApprovedReadOnly} className="grid gap-x-6 gap-y-5 md:grid-cols-2 border-0 p-0 m-0 min-w-0">
            <div className="space-y-2">
              <Label>Agencia *</Label>
              <Select
                value={expenseForm.agency_id}
                onValueChange={(value) => setExpenseForm({ 
                    ...expenseForm, 
                    agency_id: value,
                    category_id: "",
                    client_id: "",
                    project_id: "",
                    account_id: "",
                    vendor_id: "",
                    vendor_name: ""
                  })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {agencies.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha de Inicio *</Label>
              <Input
                type="date"
                value={expenseForm.start_date}
                onChange={(e) => setExpenseForm({ ...expenseForm, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha Final *</Label>
              <Input
                type="date"
                value={expenseForm.end_date}
                min={expenseForm.start_date || undefined}
                onChange={(e) => setExpenseForm({ ...expenseForm, end_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Solicitado por *</Label>
              {editingExpense ? (
                // Al editar, el solicitante es SIEMPRE el que registró el gasto,
                // NO el usuario actual. Se muestra como solo lectura para no
                // reasignarlo por error al visualizar/editar un gasto ajeno.
                <div className="flex items-center gap-2 h-10 px-3 py-2 rounded-md border bg-muted">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    {editingExpense.requested_by
                      ? `${editingExpense.requested_by.first_name} ${editingExpense.requested_by.last_name}`
                      : "Solicitante original"}
                  </span>
                  <Badge variant="secondary" className="ml-auto text-xs">Solicitante original</Badge>
                </div>
              ) : currentUserStaff ? (
                // Gasto nuevo: se prellena con el usuario actual como solicitante.
                <div className="flex items-center gap-2 h-10 px-3 py-2 rounded-md border bg-muted">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <span className="font-medium">{currentUserStaff.first_name} {currentUserStaff.last_name}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">Usuario actual</Badge>
                </div>
              ) : (
                <Select
                  value={expenseForm.requested_by_id}
                  onValueChange={(value) => setExpenseForm({ ...expenseForm, requested_by_id: value, approver_id: "" })}
                  disabled={!expenseForm.agency_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={expenseForm.agency_id ? "Seleccionar solicitante" : "Selecciona agencia primero"} />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>{staff.first_name} {staff.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Solicitar aprobación a *</Label>
              <Select
                value={expenseForm.approver_id}
                onValueChange={(value) => setExpenseForm({ ...expenseForm, approver_id: value })}
                disabled={!expenseForm.requested_by_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder={expenseForm.requested_by_id ? "Seleccionar aprobador" : "Selecciona solicitante primero"} />
                </SelectTrigger>
                <SelectContent>
                  {approversList.map((approver) => (
                    <SelectItem key={approver.id} value={approver.id}>
                      {approver.first_name} {approver.last_name}
                      {approver.id === expenseForm.requested_by_id
                        ? " (Yo mismo)"
                        : approver.reports_to_id === null && " (Director)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {approversList.length === 0 && expenseForm.requested_by_id && (
                <p className="text-xs text-muted-foreground">No hay supervisores configurados para este empleado</p>
              )}
              {expenseForm.approver_id && expenseForm.approver_id === expenseForm.requested_by_id && (
                <p className="text-xs text-muted-foreground">
                  Al no tener jefe asignado, el gasto quedará aprobado automáticamente al registrarlo.
                </p>
              )}
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Descripción *</Label>
              <Textarea
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                placeholder="Descripción del gasto..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select
                value={expenseForm.category_id}
                onValueChange={(value) => setExpenseForm({ ...expenseForm, category_id: value })}
                disabled={!expenseForm.agency_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder={expenseForm.agency_id ? "Seleccionar categoría" : "Selecciona agencia primero"} />
                </SelectTrigger>
                <SelectContent>
                  {formCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Proveedor</Label>
              <Select
                value={expenseForm.vendor_id}
                onValueChange={(value) => {
                  const vendor = vendors.find(v => v.id === value)
                  setExpenseForm({ 
                    ...expenseForm, 
                    vendor_id: value,
                    vendor_name: vendor?.name || ""
                  })
                }}
                disabled={!expenseForm.agency_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder={expenseForm.agency_id ? "Seleccionar proveedor" : "Selecciona agencia primero"} />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Monto (sin IVA) *</Label>
              <Input
                type="number"
                step="0.01"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>IVA</Label>
              <Input
                type="number"
                step="0.01"
                value={expenseForm.tax_amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, tax_amount: Number(e.target.value) })}
              />
            </div>
            <div className="md:col-span-2 flex items-start gap-3 rounded-md border p-3">
              <Switch
                id="is-operational"
                checked={expenseForm.is_operational}
                onCheckedChange={(checked) =>
                  setExpenseForm({
                    ...expenseForm,
                    is_operational: checked,
                    // Un gasto operativo es de la agencia: se limpia cliente, proyecto y cuenta.
                    client_id: checked ? "" : expenseForm.client_id,
                    project_id: checked ? "" : expenseForm.project_id,
                    account_id: checked ? "" : expenseForm.account_id,
                  })
                }
              />
              <div className="space-y-0.5">
                <Label htmlFor="is-operational">Gasto Operativo (de la Agencia)</Label>
                <p className="text-xs text-muted-foreground">
                  Actívalo cuando el gasto no corresponde a un proyecto o cuenta específica, sino a la operación de la agencia.
                </p>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Cliente</Label>
              <Select
                value={expenseForm.client_id}
                onValueChange={(value) =>
                  // Al cambiar de cliente se reinician la cuenta y el proyecto seleccionados.
                  setExpenseForm({ ...expenseForm, client_id: value, project_id: "", account_id: "" })
                }
                disabled={!expenseForm.agency_id || expenseForm.is_operational}
              >
                <SelectTrigger>
                  <SelectValue placeholder={expenseForm.is_operational ? "No aplica (gasto operativo)" : expenseForm.agency_id ? "Seleccionar cliente" : "Selecciona agencia primero"} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>{client.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cuenta</Label>
              <Select
                value={expenseForm.account_id}
                onValueChange={(value) => setExpenseForm({ ...expenseForm, account_id: value, project_id: "" })}
                disabled={!expenseForm.client_id || expenseForm.is_operational}
              >
                <SelectTrigger>
                  <SelectValue placeholder={expenseForm.is_operational ? "No aplica (gasto operativo)" : expenseForm.client_id ? "Seleccionar cuenta" : "Selecciona cliente primero"} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.filter((a) => a.client_id === expenseForm.client_id).length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">Este cliente no tiene cuentas.</div>
                  ) : (
                    accounts
                      .filter((a) => a.client_id === expenseForm.client_id)
                      .map((account) => (
                        <SelectItem key={account.id} value={account.id}>{account.account_name}</SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Proyecto</Label>
              <Select
                value={expenseForm.project_id}
                onValueChange={(value) => setExpenseForm({ ...expenseForm, project_id: value })}
                disabled={!expenseForm.client_id || expenseForm.is_operational}
              >
                <SelectTrigger>
                  <SelectValue placeholder={expenseForm.is_operational ? "No aplica (gasto operativo)" : expenseForm.client_id ? "Seleccionar proyecto" : "Selecciona cliente primero"} />
                </SelectTrigger>
                <SelectContent>
                  {projects.filter((p) => p.client_id === expenseForm.client_id).length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">Este cliente no tiene proyectos.</div>
                  ) : (
                    projects
                      .filter((p) => p.client_id === expenseForm.client_id)
                      .map((project) => (
                        <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <Select
                value={expenseForm.payment_method}
                onValueChange={(value) => setExpenseForm({ ...expenseForm, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentMethods).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Factura del Proveedor</Label>
              <Input
                value={expenseForm.invoice_number}
                onChange={(e) => setExpenseForm({ ...expenseForm, invoice_number: e.target.value })}
                placeholder="Número de factura"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Comprobante o Factura</Label>
              <input
                ref={receiptInputRef}
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleReceiptUpload(file)
                }}
              />
              {expenseForm.receipt_url ? (
                <div className="flex items-center gap-2 rounded-md border p-2">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <a
                    href={`/api/file?pathname=${encodeURIComponent(expenseForm.receipt_url)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline truncate flex-1"
                  >
                    Ver comprobante adjunto
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setExpenseForm({ ...expenseForm, receipt_url: "" })}
                    aria-label="Quitar comprobante"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-transparent"
                  disabled={uploadingReceipt}
                  onClick={() => receiptInputRef.current?.click()}
                >
                  {uploadingReceipt ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Subir comprobante o factura (PDF o imagen)
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3">
                <Badge variant={statusConfig[editingExpense?.status || "draft"]?.variant || "secondary"}>
                  {statusConfig[editingExpense?.status || "draft"]?.label || "Borrador"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                El estado se define automáticamente: al enviar a aprobación queda pendiente para que un responsable lo autorice.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select
                value={expenseForm.currency_id}
                onValueChange={(value) => setExpenseForm({ ...expenseForm, currency_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="MXN" />
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
            <div className="md:col-span-2 space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                placeholder="Notas adicionales..."
                rows={2}
              />
            </div>
            <div className="md:col-span-2 border-t pt-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>{formatCurrency(expenseForm.amount + expenseForm.tax_amount)}</span>
              </div>
            </div>
          </fieldset>
          </div>
          <DialogFooter className="flex-shrink-0 border-t pt-4">
            {isApprovedReadOnly ? (
              // Gasto aprobado: solo lectura. No se permite editar/guardar/reenviar.
              <Button onClick={() => setShowExpenseDialog(false)}>Cerrar</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setShowExpenseDialog(false)}>Cancelar</Button>
                <Button
                  variant="outline"
                  onClick={() => handleSaveExpense(false)}
                  disabled={saving || !expenseForm.agency_id || !expenseForm.description || expenseForm.amount <= 0 || !expenseForm.requested_by_id}
                >
                  {saving && <Spinner className="mr-2 h-4 w-4" />}
                  Guardar como borrador
                </Button>
                <Button
                  onClick={() => handleSaveExpense(true)}
                  disabled={saving || !expenseForm.agency_id || !expenseForm.description || expenseForm.amount <= 0 || !expenseForm.requested_by_id || !expenseForm.approver_id}
                >
                  {saving && <Spinner className="mr-2 h-4 w-4" />}
                  Enviar a aprobación
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
            <DialogDescription>Crea una categoría para organizar tus gastos</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Nombre de la categoría"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Descripción de la categoría..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Gasto *</Label>
              <Select
                value={categoryForm.expense_type}
                onValueChange={(value) => setCategoryForm({ ...categoryForm, expense_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo de gasto" />
                </SelectTrigger>
                <SelectContent>
                  {expenseTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Agencia (opcional)</Label>
              <Select
                value={categoryForm.agency_id || "global"}
                onValueChange={(value) => setCategoryForm({ ...categoryForm, agency_id: value === "global" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Global (todas las agencias)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  {agencies.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveCategory} disabled={saving || !categoryForm.name}>
              {saving && <Spinner className="mr-2 h-4 w-4" />}
              {editingCategory ? "Guardar Cambios" : "Crear Categoría"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "approve" ? "Aprobar Gasto" : "Rechazar Gasto"}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === "approve" 
                ? "Confirma la aprobación de este gasto"
                : "Indica el motivo del rechazo"
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedExpenseForApproval && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Número:</span>
                  <span className="font-medium">{selectedExpenseForApproval.expense_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Descripción:</span>
                  <span className="font-medium">{selectedExpenseForApproval.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Monto:</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(selectedExpenseForApproval.total_amount, selectedExpenseForApproval.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Solicitado por:</span>
                  <span className="font-medium">
                    {selectedExpenseForApproval.requested_by 
                      ? `${selectedExpenseForApproval.requested_by.first_name} ${selectedExpenseForApproval.requested_by.last_name}`
                      : "-"
                    }
                  </span>
                </div>
              </div>

              {approvalAction === "reject" && (
                <div className="space-y-2">
                  <Label>Motivo del rechazo *</Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explica el motivo del rechazo..."
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancelar
            </Button>
            {approvalAction === "approve" ? (
              <Button 
                onClick={handleApproveExpense} 
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? <Spinner className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Aprobar
              </Button>
            ) : (
              <Button 
                variant="destructive"
                onClick={handleRejectExpense} 
                disabled={saving || !rejectionReason}
              >
                {saving ? <Spinner className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
                Rechazar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: marcar gasto como pagado eligiendo el banco de salida */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como pagado</DialogTitle>
            <DialogDescription>
              Selecciona el banco de salida. El monto del gasto se descontará del saldo de ese banco.
            </DialogDescription>
          </DialogHeader>

          {selectedExpenseForPayment && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm text-muted-foreground">{selectedExpenseForPayment.expense_number}</p>
                  <p className="font-medium">{selectedExpenseForPayment.description}</p>
                </div>
                <p className="text-lg font-semibold">
                  {selectedExpenseForPayment.currency?.symbol || "$"}
                  {Number(selectedExpenseForPayment.total_amount || 0).toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Banco de salida</Label>
                {paymentBankAccounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay bancos activos para esta agencia.
                  </p>
                ) : (
                  <Select value={selectedPaymentBankId} onValueChange={setSelectedPaymentBankId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un banco" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentBankAccounts.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.bank_name} - {bank.account_name}
                          {bank.current_balance != null && (
                            <span className="text-muted-foreground">
                              {" "}
                              (Saldo: {selectedExpenseForPayment.currency?.symbol || "$"}
                              {Number(bank.current_balance).toLocaleString("es-MX", {
                                minimumFractionDigits: 2,
                              })}
                              )
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {selectedPaymentBankId && (() => {
                const bank = paymentBankAccounts.find((b) => b.id === selectedPaymentBankId)
                if (!bank) return null
                const amount = Number(selectedExpenseForPayment.total_amount || 0)
                const newBalance = Number(bank.current_balance || 0) - amount
                const symbol = selectedExpenseForPayment.currency?.symbol || "$"
                return (
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Saldo actual</span>
                      <span>
                        {symbol}
                        {Number(bank.current_balance || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monto a pagar</span>
                      <span className="text-destructive">
                        -{symbol}
                        {amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="mt-1 flex justify-between border-t pt-1 font-medium">
                      <span>Saldo resultante</span>
                      <span className={newBalance < 0 ? "text-destructive" : ""}>
                        {symbol}
                        {newBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleMarkAsPaid}
              disabled={saving || !selectedPaymentBankId}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? <Spinner className="mr-2 h-4 w-4" /> : <Wallet className="mr-2 h-4 w-4" />}
              Marcar como pagado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
