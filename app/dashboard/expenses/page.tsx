"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { 
  Plus, 
  Search, 
  Receipt, 
  Pencil, 
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
  History
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
  category: { id: string; name: string } | null
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

interface Project {
  id: string
  name: string
  agency_id: string
}

interface Account {
  id: string
  account_name: string
  agency_id: string
}

interface Currency {
  id: string
  code: string
  symbol: string
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
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
  const [activeTab, setActiveTab] = useState("expenses")
  
  // Approval dialog
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [selectedExpenseForApproval, setSelectedExpenseForApproval] = useState<Expense | null>(null)
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve")
  const [rejectionReason, setRejectionReason] = useState("")
  const supabase = createClient()

  // Dialogs
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null)

  // Stats
  const [stats, setStats] = useState({
    totalExpenses: 0,
    thisMonth: 0,
    pending: 0,
    byCategory: [] as { name: string; total: number }[],
  })

  // New expense form
  const [expenseForm, setExpenseForm] = useState({
    agency_id: "",
    category_id: "",
    project_id: "",
    account_id: "",
    vendor_id: "",
    requested_by_id: "",
    approver_id: "",
    expense_date: new Date().toISOString().split("T")[0],
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
  })

  // Expense types for financial statements
  const expenseTypes = [
    { value: "fixed", label: "Gastos Fijos" },
    { value: "variable", label: "Variables" },
    { value: "direct", label: "Directos" },
    { value: "indirect", label: "Indirectos" },
    { value: "financial", label: "Costos Financieros" },
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
      // Pre-fill the requested_by_id always with logged user
      // If user has an agency, also pre-fill agency_id
      setExpenseForm(prev => ({
        ...prev,
        agency_id: staffData.agency_id || prev.agency_id,
        requested_by_id: staffData.id
      }))
    }
  }

  useEffect(() => {
    if (expenseForm.agency_id) {
      fetchFormCategoriesByAgency(expenseForm.agency_id)
      fetchProjectsByAgency(expenseForm.agency_id)
      fetchAccountsByAgency(expenseForm.agency_id)
      fetchVendorsByAgency(expenseForm.agency_id)
      fetchStaffByAgency(expenseForm.agency_id)
      // Fetch approvers for current user
      if (expenseForm.requested_by_id) {
        fetchApproversForStaff(expenseForm.requested_by_id, expenseForm.agency_id)
      }
    } else {
      // Reset form lists when no agency selected
      setFormCategories([])
      setProjects([])
      setAccounts([])
      setVendors([])
      setStaffList([])
      setApproversList([])
    }
  }, [expenseForm.agency_id, expenseForm.requested_by_id])

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

  const fetchProjectsByAgency = async (agencyId: string) => {
    const { data } = await supabase
      .from("projects")
      .select("id, name, agency_id")
      .eq("agency_id", agencyId)
      .order("name")
    if (data) setProjects(data)
  }

  const fetchAccountsByAgency = async (agencyId: string) => {
    const { data } = await supabase
      .from("accounts")
      .select("id, account_name, agency_id")
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

const fetchApproversForStaff = async (staffId: string, agencyId: string) => {
    // Get all staff for the agency
    const { data: allStaff } = await supabase
      .from("staff")
      .select("id, first_name, last_name, reports_to_id, position_id, positions(hierarchy_level)")
      .eq("agency_id", agencyId)
      .eq("is_active", true)

    if (!allStaff || allStaff.length === 0) {
      setApproversList([])
      return
    }

    // Find current staff - could be the logged-in user
    let currentStaff = allStaff.find(s => s.id === staffId)
    
    // If current user is global (not in this agency's staff), show all managers/supervisors
    if (!currentStaff && currentUserStaff) {
      // For global users, show staff who have subordinates (managers/supervisors)
      const managersAndSupervisors = allStaff.filter(s => 
        allStaff.some(subordinate => subordinate.reports_to_id === s.id) || 
        s.reports_to_id === null // Top-level managers
      )
      setApproversList(managersAndSupervisors)
      
      // Auto-select the first available approver
      if (managersAndSupervisors.length > 0 && !expenseForm.approver_id) {
        setExpenseForm(prev => ({ ...prev, approver_id: managersAndSupervisors[0].id }))
      }
      return
    }

    if (!currentStaff) {
      setApproversList([])
      return
    }

    // Build hierarchy - get direct supervisor and all higher levels
    const approvers: Staff[] = []

    // Add direct supervisor first
    if (currentStaff.reports_to_id) {
      const directSupervisor = allStaff.find(s => s.id === currentStaff.reports_to_id)
      if (directSupervisor) {
        approvers.push(directSupervisor)

        // Recursively add higher levels
        let currentSupervisorId = directSupervisor.reports_to_id
        while (currentSupervisorId) {
          const higherSupervisor = allStaff.find(s => s.id === currentSupervisorId)
          if (higherSupervisor && !approvers.find(a => a.id === higherSupervisor.id)) {
            approvers.push(higherSupervisor)
            currentSupervisorId = higherSupervisor.reports_to_id
          } else {
            break
          }
        }
      }
    }

    // Also add staff without supervisors (top level managers) if not already included
    const topLevelManagers = allStaff.filter(s => 
      s.reports_to_id === null && 
      s.id !== staffId && 
      !approvers.find(a => a.id === s.id)
    )
    approvers.push(...topLevelManagers)

    setApproversList(approvers)
    
    // Pre-select direct supervisor if available
    if (currentStaff.reports_to_id) {
      setExpenseForm(prev => ({ ...prev, approver_id: currentStaff.reports_to_id || "" }))
    }
  }

  const fetchExpenses = async () => {
    setLoading(true)
    let query = supabase
      .from("expenses")
      .select(`
        *,
        category:expense_categories(id, name),
        agency:agencies(id, name),
        currency:currencies(id, code, symbol),
        project:projects(id, name),
        requested_by:staff!expenses_requested_by_id_fkey(id, first_name, last_name),
        approved_by:staff!expenses_approved_by_id_fkey(id, first_name, last_name)
      `)
      .order("expense_date", { ascending: false })

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

    const totalExpenses = expensesData.reduce((sum, e) => sum + Number(e.total_amount), 0)
    const thisMonth = expensesData
      .filter(e => new Date(e.expense_date) >= thisMonthStart)
      .reduce((sum, e) => sum + Number(e.total_amount), 0)
    const pending = expensesData
      .filter(e => e.status === "pending")
      .reduce((sum, e) => sum + Number(e.total_amount), 0)

    // By category
    const categoryMap = new Map<string, number>()
    expensesData.forEach(e => {
      const catName = e.category?.name || "Sin categoría"
      categoryMap.set(catName, (categoryMap.get(catName) || 0) + Number(e.total_amount))
    })
    const byCategory = Array.from(categoryMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    setStats({ totalExpenses, thisMonth, pending, byCategory })
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

  const generateExpenseNumber = async (agencyId: string) => {
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from("expenses")
      .select("*", { count: "exact", head: true })
      .eq("agency_id", agencyId)
    
    const nextNumber = (count || 0) + 1
    return `GAS-${year}-${String(nextNumber).padStart(5, "0")}`
  }

  const handleSaveExpense = async () => {
    if (!expenseForm.agency_id || !expenseForm.description || expenseForm.amount <= 0 || !expenseForm.requested_by_id || !expenseForm.approver_id) return
    setSaving(true)

    const totalAmount = expenseForm.amount + expenseForm.tax_amount

    if (editingExpense) {
      const { error } = await supabase
        .from("expenses")
        .update({
          agency_id: expenseForm.agency_id,
          category_id: expenseForm.category_id || null,
          project_id: expenseForm.project_id || null,
          account_id: expenseForm.account_id || null,
          vendor_id: expenseForm.vendor_id || null,
          requested_by_id: expenseForm.requested_by_id,
          approver_id: expenseForm.approver_id,
          expense_date: expenseForm.expense_date,
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
          status: expenseForm.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingExpense.id)

      if (error) console.error("Error updating expense:", error)
    } else {
      const expenseNumber = await generateExpenseNumber(expenseForm.agency_id)
      const { data: newExpense, error } = await supabase
        .from("expenses")
        .insert({
          agency_id: expenseForm.agency_id,
          category_id: expenseForm.category_id || null,
          project_id: expenseForm.project_id || null,
          account_id: expenseForm.account_id || null,
          vendor_id: expenseForm.vendor_id || null,
          requested_by_id: expenseForm.requested_by_id,
          approver_id: expenseForm.approver_id,
          expense_number: expenseNumber,
          expense_date: expenseForm.expense_date,
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
          status: expenseForm.status,
          approval_status: "pending",
        })
        .select("id")
        .single()

      if (error) {
        console.error("Error creating expense:", error)
      } else if (newExpense) {
        // Create approval history entry
        await supabase.from("expense_approval_history").insert({
          expense_id: newExpense.id,
          action: "submitted",
          performed_by_id: expenseForm.requested_by_id,
          comments: "Gasto enviado para aprobación",
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

    // Get the approver (for now, we'll use the first staff with reports_to_id matching the requester)
    // In a real scenario, this would come from the logged-in user
    const approverId = staffList.find(s => s.reports_to_id === null)?.id || staffList[0]?.id

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

    const approverId = staffList.find(s => s.reports_to_id === null)?.id || staffList[0]?.id

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
        fetchProjectsByAgency(expense.agency.id),
        fetchAccountsByAgency(expense.agency.id),
        fetchVendorsByAgency(expense.agency.id)
      ])
    }
    setExpenseForm({
      agency_id: expense.agency?.id || "",
      category_id: expense.category?.id || "",
      project_id: expense.project?.id || "",
      account_id: "",
      vendor_id: (expense as Record<string, unknown>).vendor_id as string || "",
      requested_by_id: expense.requested_by_id || "",
      approver_id: (expense as Record<string, unknown>).approver_id as string || "",
      expense_date: expense.expense_date,
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
      project_id: "",
      account_id: "",
      vendor_id: "",
      requested_by_id: defaultRequestedById, // Always the logged-in user
      approver_id: "",
      expense_date: new Date().toISOString().split("T")[0],
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
    })
    setFormCategories([])
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
          <Button variant="outline" onClick={() => { resetCategoryForm(); setShowCategoryDialog(true); }}>
            <FolderTree className="mr-2 h-4 w-4" />
            Nueva Categoría
          </Button>
          <Button onClick={() => { resetExpenseForm(); setShowExpenseDialog(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Gasto
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">{expenses.length} gastos registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.thisMonth)}</div>
            <p className="text-xs text-muted-foreground">Mes actual</p>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorías</CardTitle>
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.filter(c => c.is_active).length}</div>
            <p className="text-xs text-muted-foreground">Categorías activas</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Categories */}
      {stats.byCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Categorías de Gasto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.byCategory.map((cat, index) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{index + 1}.</span>
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(cat.total)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Solicitante</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Aprobación</TableHead>
                      <TableHead className="w-[150px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium">{expense.expense_number}</TableCell>
                          <TableCell>{formatDate(expense.expense_date)}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{expense.description}</div>
                              <div className="text-sm text-muted-foreground">{expense.agency?.name} • {expense.category?.name || "Sin categoría"}</div>
                            </div>
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
                            {getApprovalStatusBadge(expense.approval_status || "pending")}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
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
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditExpense(expense)}
                              >
                                <Pencil className="h-4 w-4" />
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
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingExpense ? "Editar Gasto" : "Nuevo Gasto"}</DialogTitle>
            <DialogDescription>Registra un gasto operativo</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Agencia *</Label>
              <Select
                value={expenseForm.agency_id}
                onValueChange={(value) => setExpenseForm({ 
                    ...expenseForm, 
                    agency_id: value,
                    category_id: "",
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
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={expenseForm.expense_date}
                onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Solicitado por *</Label>
              {currentUserStaff ? (
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
                      {approver.reports_to_id === null && " (Director)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {approversList.length === 0 && expenseForm.requested_by_id && (
                <p className="text-xs text-muted-foreground">No hay supervisores configurados para este empleado</p>
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
            <div className="space-y-2">
              <Label>Proyecto</Label>
              <Select
                value={expenseForm.project_id}
                onValueChange={(value) => setExpenseForm({ ...expenseForm, project_id: value })}
                disabled={!expenseForm.agency_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder={expenseForm.agency_id ? "Seleccionar proyecto" : "Selecciona agencia primero"} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cuenta</Label>
              <Select
                value={expenseForm.account_id}
                onValueChange={(value) => setExpenseForm({ ...expenseForm, account_id: value })}
                disabled={!expenseForm.agency_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder={expenseForm.agency_id ? "Seleccionar cuenta" : "Selecciona agencia primero"} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>{account.account_name}</SelectItem>
                  ))}
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
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={expenseForm.status}
                onValueChange={(value) => setExpenseForm({ ...expenseForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>
          </div>
          <DialogFooter className="flex-shrink-0 border-t pt-4">
            <Button variant="outline" onClick={() => setShowExpenseDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveExpense} disabled={saving || !expenseForm.agency_id || !expenseForm.description || expenseForm.amount <= 0 || !expenseForm.requested_by_id || !expenseForm.approver_id}>
              {saving && <Spinner className="mr-2 h-4 w-4" />}
              {editingExpense ? "Guardar Cambios" : "Registrar Gasto"}
            </Button>
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
    </div>
  )
}
