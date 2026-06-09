"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Users, 
  Building2, 
  FolderKanban, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  CreditCard,
  AlertCircle,
  Calendar,
  Download,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  PieChart,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from "recharts"


interface Agency {
  id: string
  name: string
}

interface ClientRentabilidad {
  id: string
  name: string
  ingreso_mensual: number
  costo_operativo: number
  horas_invertidas: number
  margen_utilidad: number
  rentabilidad_porcentual: number
  estatus: "muy_rentable" | "rentable" | "en_riesgo" | "no_rentable"
}

interface ProjectRentabilidad {
  id: string
  name: string
  client_name: string
  presupuesto_contratado: number
  costos_acumulados: number
  utilidad_estimada: number
  avance_financiero: number
  avance_operativo: number
  rentabilidad_proyectada: number
  estatus: "muy_rentable" | "rentable" | "en_riesgo" | "no_rentable"
}

// Estatus colors and labels for rentabilidad
const rentabilidadStatusConfig = {
  muy_rentable: { 
    label: "Muy Rentable", 
    color: "bg-emerald-500", 
    textColor: "text-emerald-700",
    bgLight: "bg-emerald-50 dark:bg-emerald-950",
    borderColor: "border-emerald-500"
  },
  rentable: { 
    label: "Rentable", 
    color: "bg-green-400", 
    textColor: "text-green-600",
    bgLight: "bg-green-50 dark:bg-green-950",
    borderColor: "border-green-400"
  },
  en_riesgo: { 
    label: "En Riesgo", 
    color: "bg-amber-500", 
    textColor: "text-amber-600",
    bgLight: "bg-amber-50 dark:bg-amber-950",
    borderColor: "border-amber-500"
  },
  no_rentable: { 
    label: "No Rentable", 
    color: "bg-red-500", 
    textColor: "text-red-600",
    bgLight: "bg-red-50 dark:bg-red-950",
    borderColor: "border-red-500"
  }
}

function getRentabilidadEstatus(rentabilidad: number): "muy_rentable" | "rentable" | "en_riesgo" | "no_rentable" {
  if (rentabilidad > 40) return "muy_rentable"
  if (rentabilidad >= 25) return "rentable"
  if (rentabilidad >= 10) return "en_riesgo"
  return "no_rentable"
}

function RentabilidadStatusBadge({ estatus }: { estatus: keyof typeof rentabilidadStatusConfig }) {
  const config = rentabilidadStatusConfig[estatus]
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgLight} border ${config.borderColor}`}>
      <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
      <span className={`text-sm font-medium ${config.textColor}`}>{config.label}</span>
    </div>
  )
}

interface Client {
  id: string
  company_name: string
  agency_id: string
}

interface Account {
  id: string
  account_name: string
  client_id: string
}

interface Project {
  id: string
  project_name: string
  account_id: string | null
  client_id: string | null
}

interface Invoice {
  id: string
  invoice_number: string
  client_id: string
  account_id: string | null
  project_id: string | null
  subtotal: number
  tax_amount: number
  total_amount: number
  amount_paid: number
  balance_due: number
  status: string
  issue_date: string
  due_date: string
  currency: { code: string; symbol: string } | null
}

interface Payment {
  id: string
  payment_number: string
  client_id: string | null
  account_id: string | null
  project_id: string | null
  invoice_id: string | null
  amount: number
  payment_date: string
  payment_method: string
  status: string
  currency: { code: string; symbol: string } | null
}

interface Expense {
  id: string
  description: string
  client_id: string | null
  account_id: string | null
  project_id: string | null
  amount: number
  expense_date: string
  category: string
  status: string
  currency: { code: string; symbol: string } | null
}

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

export default function ClientReportsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  
  // Filters
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  
  const [selectedAgency, setSelectedAgency] = useState<string>("")
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [dateRange, setDateRange] = useState<string>("all")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  
  // Data
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])

  useEffect(() => {
    fetchAgencies()
  }, [])

  useEffect(() => {
    if (selectedAgency) {
      fetchClients(selectedAgency)
    } else {
      setClients([])
      setSelectedClient("")
    }
  }, [selectedAgency])

  useEffect(() => {
    if (selectedClient) {
      fetchAccounts(selectedClient)
      fetchProjects(selectedClient)
    } else {
      setAccounts([])
      setProjects([])
      setSelectedAccount("")
      setSelectedProject("")
    }
  }, [selectedClient])

  useEffect(() => {
    if (selectedClient) {
      fetchFinancialData()
    }
  }, [selectedClient, selectedAccount, selectedProject, dateRange, startDate, endDate])

  const fetchAgencies = async () => {
    const { data } = await supabase.from("agencies").select("id, name").order("name")
    if (data) setAgencies(data)
  }

  const fetchClients = async (agencyId: string) => {
    const { data } = await supabase
      .from("clients")
      .select("id, company_name, agency_id")
      .eq("agency_id", agencyId)
      .order("company_name")
    if (data) setClients(data)
  }

  const fetchAccounts = async (clientId: string) => {
    const { data } = await supabase
      .from("accounts")
      .select("id, account_name, client_id")
      .eq("client_id", clientId)
      .order("account_name")
    if (data) setAccounts(data)
  }

  const fetchProjects = async (clientId: string) => {
    const { data } = await supabase
      .from("projects")
      .select("id, project_name, account_id, client_id")
      .or(`client_id.eq.${clientId}`)
      .order("project_name")
    if (data) setProjects(data)
  }

  const getDateFilter = () => {
    const today = new Date()
    let start: Date | null = null
    let end: Date = today

    switch (dateRange) {
      case "month":
        start = new Date(today.getFullYear(), today.getMonth(), 1)
        break
      case "quarter":
        const quarter = Math.floor(today.getMonth() / 3)
        start = new Date(today.getFullYear(), quarter * 3, 1)
        break
      case "year":
        start = new Date(today.getFullYear(), 0, 1)
        break
      case "custom":
        if (startDate) start = new Date(startDate)
        if (endDate) end = new Date(endDate)
        break
      default:
        return null
    }

    return { start, end }
  }

  const fetchFinancialData = async () => {
    if (!selectedClient) return
    setLoading(true)

    const dateFilter = getDateFilter()

    // Fetch Invoices
    let invoiceQuery = supabase
      .from("invoices")
      .select("*, currency:currencies(code, symbol)")
      .eq("client_id", selectedClient)

    if (selectedAccount) invoiceQuery = invoiceQuery.eq("account_id", selectedAccount)
    if (selectedProject) invoiceQuery = invoiceQuery.eq("project_id", selectedProject)
    if (dateFilter?.start) invoiceQuery = invoiceQuery.gte("issue_date", dateFilter.start.toISOString().split("T")[0])
    if (dateFilter?.end) invoiceQuery = invoiceQuery.lte("issue_date", dateFilter.end.toISOString().split("T")[0])

    const { data: invoiceData } = await invoiceQuery.order("issue_date", { ascending: false })
    if (invoiceData) setInvoices(invoiceData)

    // Fetch Payments
    let paymentQuery = supabase
      .from("payments")
      .select("*, currency:currencies(code, symbol)")
      .eq("client_id", selectedClient)

    if (selectedAccount) paymentQuery = paymentQuery.eq("account_id", selectedAccount)
    if (selectedProject) paymentQuery = paymentQuery.eq("project_id", selectedProject)
    if (dateFilter?.start) paymentQuery = paymentQuery.gte("payment_date", dateFilter.start.toISOString().split("T")[0])
    if (dateFilter?.end) paymentQuery = paymentQuery.lte("payment_date", dateFilter.end.toISOString().split("T")[0])

    const { data: paymentData } = await paymentQuery.order("payment_date", { ascending: false })
    if (paymentData) setPayments(paymentData)

    // Fetch Expenses
    let expenseQuery = supabase
      .from("expenses")
      .select("*, currency:currencies(code, symbol)")
      .eq("client_id", selectedClient)

    if (selectedAccount) expenseQuery = expenseQuery.eq("account_id", selectedAccount)
    if (selectedProject) expenseQuery = expenseQuery.eq("project_id", selectedProject)
    if (dateFilter?.start) expenseQuery = expenseQuery.gte("expense_date", dateFilter.start.toISOString().split("T")[0])
    if (dateFilter?.end) expenseQuery = expenseQuery.lte("expense_date", dateFilter.end.toISOString().split("T")[0])

    const { data: expenseData } = await expenseQuery.order("expense_date", { ascending: false })
    if (expenseData) setExpenses(expenseData)

    setLoading(false)
  }

  // Calculated metrics
  const metrics = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)
    const totalPaid = payments.reduce((sum, pay) => sum + Number(pay.amount || 0), 0)
    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0)
    const totalDebt = invoices.reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0)
    const netIncome = totalPaid - totalExpenses
    const profitMargin = totalPaid > 0 ? ((totalPaid - totalExpenses) / totalPaid) * 100 : 0

    const paidInvoices = invoices.filter(inv => inv.status === "paid").length
    const pendingInvoices = invoices.filter(inv => inv.status === "pending" || inv.status === "sent").length
    const overdueInvoices = invoices.filter(inv => inv.status === "overdue").length

    return {
      totalInvoiced,
      totalPaid,
      totalExpenses,
      totalDebt,
      netIncome,
      profitMargin,
      invoiceCount: invoices.length,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      paymentCount: payments.length,
      expenseCount: expenses.length,
      avgInvoice: invoices.length > 0 ? totalInvoiced / invoices.length : 0,
      avgPayment: payments.length > 0 ? totalPaid / payments.length : 0
    }
  }, [invoices, payments, expenses])

  // Monthly data for charts
  const monthlyData = useMemo(() => {
    const months: { [key: string]: { month: string; invoiced: number; paid: number; expenses: number; profit: number } } = {}
    
    invoices.forEach(inv => {
      const month = inv.issue_date.substring(0, 7)
      if (!months[month]) months[month] = { month, invoiced: 0, paid: 0, expenses: 0, profit: 0 }
      months[month].invoiced += Number(inv.total_amount || 0)
    })

    payments.forEach(pay => {
      const month = pay.payment_date.substring(0, 7)
      if (!months[month]) months[month] = { month, invoiced: 0, paid: 0, expenses: 0, profit: 0 }
      months[month].paid += Number(pay.amount || 0)
    })

    expenses.forEach(exp => {
      const month = exp.expense_date.substring(0, 7)
      if (!months[month]) months[month] = { month, invoiced: 0, paid: 0, expenses: 0, profit: 0 }
      months[month].expenses += Number(exp.amount || 0)
    })

    Object.keys(months).forEach(key => {
      months[key].profit = months[key].paid - months[key].expenses
    })

    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month))
  }, [invoices, payments, expenses])

  // Invoice status distribution
  const invoiceStatusData = useMemo(() => {
    const statusCounts: { [key: string]: number } = {}
    invoices.forEach(inv => {
      statusCounts[inv.status] = (statusCounts[inv.status] || 0) + 1
    })
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
  }, [invoices])

  // Payment method distribution
  const paymentMethodData = useMemo(() => {
    const methodAmounts: { [key: string]: number } = {}
    payments.forEach(pay => {
      const method = pay.payment_method || "other"
      methodAmounts[method] = (methodAmounts[method] || 0) + Number(pay.amount || 0)
    })
    return Object.entries(methodAmounts).map(([name, value]) => ({ 
      name: name === "transfer" ? "Transferencia" : name === "cash" ? "Efectivo" : name === "card" ? "Tarjeta" : name === "check" ? "Cheque" : "Otro",
      value 
    }))
  }, [payments])

  // Expense categories
  const expenseCategoryData = useMemo(() => {
    const categoryAmounts: { [key: string]: number } = {}
    expenses.forEach(exp => {
      const category = exp.category || "general"
      categoryAmounts[category] = (categoryAmounts[category] || 0) + Number(exp.amount || 0)
    })
    return Object.entries(categoryAmounts).map(([name, value]) => ({ name, value }))
  }, [expenses])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
  }

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: { variant: "default" | "secondary" | "destructive" | "outline"; label: string } } = {
      paid: { variant: "default", label: "Pagada" },
      pending: { variant: "secondary", label: "Pendiente" },
      sent: { variant: "outline", label: "Enviada" },
      overdue: { variant: "destructive", label: "Vencida" },
      cancelled: { variant: "destructive", label: "Cancelada" },
      completed: { variant: "default", label: "Completado" },
      approved: { variant: "default", label: "Aprobado" },
    }
    const config = variants[status] || { variant: "secondary", label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const selectedClientName = clients.find(c => c.id === selectedClient)?.company_name || ""
  const selectedAccountName = accounts.find(a => a.id === selectedAccount)?.account_name || ""
  const selectedProjectName = projects.find(p => p.id === selectedProject)?.project_name || ""

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Informes de Clientes</h1>
          <p className="text-muted-foreground">Análisis financiero detallado por cliente, cuenta o proyecto</p>
        </div>
        <Button variant="outline" disabled={!selectedClient}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Reporte
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Agencia</Label>
              <Select value={selectedAgency} onValueChange={setSelectedAgency}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar agencia" />
                </SelectTrigger>
                <SelectContent>
                  {agencies.map(agency => (
                    <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient} disabled={!selectedAgency}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cuenta (opcional)</Label>
              <Select value={selectedAccount || "all"} onValueChange={(v) => setSelectedAccount(v === "all" ? "" : v)} disabled={!selectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las cuentas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las cuentas</SelectItem>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>{account.account_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Proyecto (opcional)</Label>
              <Select value={selectedProject || "all"} onValueChange={(v) => setSelectedProject(v === "all" ? "" : v)} disabled={!selectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los proyectos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los proyectos</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>{project.project_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo el tiempo</SelectItem>
                  <SelectItem value="month">Este mes</SelectItem>
                  <SelectItem value="quarter">Este trimestre</SelectItem>
                  <SelectItem value="year">Este año</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === "custom" && (
              <>
                <div className="space-y-2">
                  <Label>Desde</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Hasta</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {!selectedClient ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">Selecciona un cliente</h3>
            <p className="text-muted-foreground text-center max-w-md mt-2">
              Elige una agencia y un cliente para ver su informe financiero detallado con facturas, pagos, gastos y métricas de rendimiento.
            </p>
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Client Header */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedClientName}</h2>
                  <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                    {selectedAccountName && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {selectedAccountName}
                      </span>
                    )}
                    {selectedProjectName && (
                      <span className="flex items-center gap-1">
                        <FolderKanban className="h-4 w-4" />
                        {selectedProjectName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={metrics.netIncome >= 0 ? "default" : "destructive"} className="text-lg px-4 py-2">
                    {metrics.netIncome >= 0 ? (
                      <TrendingUp className="h-4 w-4 mr-2" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-2" />
                    )}
                    {metrics.netIncome >= 0 ? "Rentable" : "Pérdida"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Facturado</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.totalInvoiced)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.invoiceCount} facturas • Promedio: {formatCurrency(metrics.avgInvoice)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Cobrado</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalPaid)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.paymentCount} pagos • Promedio: {formatCurrency(metrics.avgPayment)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Gastos</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(metrics.totalExpenses)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.expenseCount} gastos relacionados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Deuda Pendiente</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(metrics.totalDebt)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.pendingInvoices} pendientes • {metrics.overdueInvoices} vencidas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className={metrics.netIncome >= 0 ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ingreso Neto</CardTitle>
                {metrics.netIncome >= 0 ? (
                  <ArrowUpRight className="h-5 w-5 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-5 w-5 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${metrics.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(metrics.netIncome)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Cobros ({formatCurrency(metrics.totalPaid)}) - Gastos ({formatCurrency(metrics.totalExpenses)})
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Margen de Utilidad</CardTitle>
                <PieChart className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {metrics.profitMargin.toFixed(1)}%
                </div>
                <div className="w-full bg-muted rounded-full h-3 mt-3">
                  <div 
                    className={`h-3 rounded-full ${metrics.profitMargin >= 50 ? "bg-green-500" : metrics.profitMargin >= 25 ? "bg-yellow-500" : "bg-red-500"}`}
                    style={{ width: `${Math.min(Math.max(metrics.profitMargin, 0), 100)}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {metrics.profitMargin >= 50 ? "Excelente rentabilidad" : metrics.profitMargin >= 25 ? "Rentabilidad moderada" : "Margen bajo"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs with detailed content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="invoices">Facturas</TabsTrigger>
              <TabsTrigger value="payments">Pagos</TabsTrigger>
              <TabsTrigger value="expenses">Gastos</TabsTrigger>
              <TabsTrigger value="charts">Gráficas</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Monthly Trend Chart */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Tendencia Mensual</CardTitle>
                    <CardDescription>Comparativa de ingresos vs gastos por mes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="month" className="text-xs" />
                          <YAxis className="text-xs" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                          <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            labelFormatter={(label) => `Mes: ${label}`}
                          />
                          <Legend />
                          <Bar dataKey="paid" name="Cobrado" fill="#22c55e" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="expenses" name="Gastos" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          <Line type="monotone" dataKey="profit" name="Utilidad" stroke="#6366f1" strokeWidth={3} dot={{ fill: "#6366f1" }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Invoice Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Estado de Facturas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={invoiceStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {invoiceStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div className="text-center p-2 bg-green-50 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 mx-auto text-green-600" />
                        <p className="text-lg font-bold">{metrics.paidInvoices}</p>
                        <p className="text-xs text-muted-foreground">Pagadas</p>
                      </div>
                      <div className="text-center p-2 bg-yellow-50 rounded-lg">
                        <Clock className="h-5 w-5 mx-auto text-yellow-600" />
                        <p className="text-lg font-bold">{metrics.pendingInvoices}</p>
                        <p className="text-xs text-muted-foreground">Pendientes</p>
                      </div>
                      <div className="text-center p-2 bg-red-50 rounded-lg">
                        <XCircle className="h-5 w-5 mx-auto text-red-600" />
                        <p className="text-lg font-bold">{metrics.overdueInvoices}</p>
                        <p className="text-xs text-muted-foreground">Vencidas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Methods */}
                <Card>
                  <CardHeader>
                    <CardTitle>Métodos de Pago</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={paymentMethodData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {paymentMethodData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Invoices Tab */}
            <TabsContent value="invoices">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Facturas</CardTitle>
                  <CardDescription>Todas las facturas emitidas al cliente</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Vencimiento</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Pagado</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No hay facturas para mostrar
                          </TableCell>
                        </TableRow>
                      ) : (
                        invoices.map(invoice => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                            <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                            <TableCell>{formatDate(invoice.due_date)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(Number(invoice.total_amount))}</TableCell>
                            <TableCell className="text-right text-green-600">{formatCurrency(Number(invoice.amount_paid))}</TableCell>
                            <TableCell className="text-right text-red-600">{formatCurrency(Number(invoice.balance_due))}</TableCell>
                            <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Pagos</CardTitle>
                  <CardDescription>Todos los pagos recibidos del cliente</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No hay pagos para mostrar
                          </TableCell>
                        </TableRow>
                      ) : (
                        payments.map(payment => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">{payment.payment_number}</TableCell>
                            <TableCell>{formatDate(payment.payment_date)}</TableCell>
                            <TableCell>
                              {payment.payment_method === "transfer" ? "Transferencia" : 
                               payment.payment_method === "cash" ? "Efectivo" : 
                               payment.payment_method === "card" ? "Tarjeta" : 
                               payment.payment_method === "check" ? "Cheque" : payment.payment_method}
                            </TableCell>
                            <TableCell className="text-right font-medium text-green-600">{formatCurrency(Number(payment.amount))}</TableCell>
                            <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Expenses Tab */}
            <TabsContent value="expenses">
              <Card>
                <CardHeader>
                  <CardTitle>Gastos Relacionados</CardTitle>
                  <CardDescription>Gastos asociados al cliente, cuenta o proyecto</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No hay gastos para mostrar
                          </TableCell>
                        </TableRow>
                      ) : (
                        expenses.map(expense => (
                          <TableRow key={expense.id}>
                            <TableCell className="font-medium">{expense.description}</TableCell>
                            <TableCell>{formatDate(expense.expense_date)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{expense.category}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium text-orange-600">{formatCurrency(Number(expense.amount))}</TableCell>
                            <TableCell>{getStatusBadge(expense.status)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Charts Tab */}
            <TabsContent value="charts" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Revenue vs Expenses Area Chart */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Flujo de Efectivo</CardTitle>
                    <CardDescription>Evolución de ingresos y gastos en el tiempo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="month" className="text-xs" />
                          <YAxis className="text-xs" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Legend />
                          <Area type="monotone" dataKey="paid" name="Ingresos" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                          <Area type="monotone" dataKey="expenses" name="Gastos" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Invoiced vs Collected */}
                <Card>
                  <CardHeader>
                    <CardTitle>Facturado vs Cobrado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="month" className="text-xs" />
                          <YAxis className="text-xs" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Legend />
                          <Bar dataKey="invoiced" name="Facturado" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="paid" name="Cobrado" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Profit Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tendencia de Utilidad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="month" className="text-xs" />
                          <YAxis className="text-xs" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Line 
                            type="monotone" 
                            dataKey="profit" 
                            name="Utilidad" 
                            stroke="#6366f1" 
                            strokeWidth={3}
                            dot={{ fill: "#6366f1", strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Expense Categories */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Distribución de Gastos por Categoría</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={expenseCategoryData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" className="text-xs" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                          <YAxis type="category" dataKey="name" className="text-xs" width={100} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Bar dataKey="value" name="Monto" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Sección de Rentabilidad */}
          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Análisis de Rentabilidad</h2>
                <p className="text-sm text-muted-foreground">Rentabilidad por cliente y proyecto</p>
              </div>
            </div>

            {/* Rentabilidad KPIs */}
            <div className="grid gap-4 md:grid-cols-5">
              {(() => {
                // Calculate rentabilidad metrics from invoices and expenses
                const clientTotals = new Map<string, { ingreso: number, costo: number }>()
                
                invoices.forEach(inv => {
                  const clientId = inv.client_id
                  const current = clientTotals.get(clientId) || { ingreso: 0, costo: 0 }
                  if (inv.status === "paid") {
                    current.ingreso += Number(inv.total)
                  }
                  clientTotals.set(clientId, current)
                })
                
                expenses.forEach(exp => {
                  const clientId = exp.client_id
                  if (clientId) {
                    const current = clientTotals.get(clientId) || { ingreso: 0, costo: 0 }
                    current.costo += Number(exp.amount)
                    clientTotals.set(clientId, current)
                  }
                })

                let totalIngreso = 0
                let totalCosto = 0
                let clientesEnRiesgo = 0
                const rentabilidades: number[] = []

                clientTotals.forEach((value) => {
                  totalIngreso += value.ingreso
                  totalCosto += value.costo
                  const margen = value.ingreso - value.costo
                  const rentPct = value.ingreso > 0 ? (margen / value.ingreso) * 100 : 0
                  rentabilidades.push(rentPct)
                  if (rentPct < 25) clientesEnRiesgo++
                })

                const rentabilidadPromedio = rentabilidades.length > 0 
                  ? rentabilidades.reduce((a, b) => a + b, 0) / rentabilidades.length 
                  : 0
                const utilidadTotal = totalIngreso - totalCosto

                return (
                  <>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 shrink-0">
                            <DollarSign className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xl font-bold text-green-600">{formatCurrency(totalIngreso)}</p>
                            <p className="text-xs text-muted-foreground truncate">Ingreso Total</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 shrink-0">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xl font-bold text-red-600">{formatCurrency(totalCosto)}</p>
                            <p className="text-xs text-muted-foreground truncate">Costo Operativo</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 shrink-0">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xl font-bold ${utilidadTotal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                              {formatCurrency(utilidadTotal)}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">Utilidad Total</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 shrink-0">
                            <BarChart3 className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xl font-bold text-purple-600">{rentabilidadPromedio.toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground truncate">Rentabilidad Prom.</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 shrink-0">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xl font-bold text-amber-600">{clientesEnRiesgo}</p>
                            <p className="text-xs text-muted-foreground truncate">En Riesgo</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )
              })()}
            </div>

            {/* Tabs for Clientes y Proyectos */}
            <Tabs defaultValue="clientes" className="space-y-4">
              <TabsList>
                <TabsTrigger value="clientes" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Por Cliente
                </TabsTrigger>
                <TabsTrigger value="proyectos" className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4" />
                  Por Proyecto
                </TabsTrigger>
              </TabsList>

              {/* Rentabilidad por Cliente */}
              <TabsContent value="clientes" className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-3">
                  {/* Chart */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Rentabilidad por Cliente</CardTitle>
                      <CardDescription>Ordenado por porcentaje de rentabilidad</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={(() => {
                              const clientData: { name: string, rentabilidad: number, estatus: string }[] = []
                              const clientTotals = new Map<string, { name: string, ingreso: number, costo: number }>()
                              
                              invoices.forEach(inv => {
                                const clientId = inv.client_id
                                const client = clients.find(c => c.id === clientId)
                                const current = clientTotals.get(clientId) || { 
                                  name: client?.company_name || 'Desconocido', 
                                  ingreso: 0, 
                                  costo: 0 
                                }
                                if (inv.status === "paid") {
                                  current.ingreso += Number(inv.total)
                                }
                                clientTotals.set(clientId, current)
                              })
                              
                              expenses.forEach(exp => {
                                if (exp.client_id) {
                                  const current = clientTotals.get(exp.client_id)
                                  if (current) {
                                    current.costo += Number(exp.amount)
                                  }
                                }
                              })

                              clientTotals.forEach((value, key) => {
                                const margen = value.ingreso - value.costo
                                const rentPct = value.ingreso > 0 ? (margen / value.ingreso) * 100 : 0
                                clientData.push({
                                  name: value.name.length > 15 ? value.name.substring(0, 15) + '...' : value.name,
                                  rentabilidad: Math.round(rentPct * 10) / 10,
                                  estatus: getRentabilidadEstatus(rentPct)
                                })
                              })

                              return clientData.sort((a, b) => b.rentabilidad - a.rentabilidad).slice(0, 10)
                            })()}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                            <YAxis type="category" dataKey="name" width={120} className="text-xs" />
                            <Tooltip formatter={(value: number) => [`${value}%`, 'Rentabilidad']} />
                            <Bar dataKey="rentabilidad" radius={[0, 4, 4, 0]}>
                              {(() => {
                                const clientData: { estatus: string }[] = []
                                const clientTotals = new Map<string, { ingreso: number, costo: number }>()
                                
                                invoices.forEach(inv => {
                                  const current = clientTotals.get(inv.client_id) || { ingreso: 0, costo: 0 }
                                  if (inv.status === "paid") current.ingreso += Number(inv.total)
                                  clientTotals.set(inv.client_id, current)
                                })
                                
                                expenses.forEach(exp => {
                                  if (exp.client_id) {
                                    const current = clientTotals.get(exp.client_id)
                                    if (current) current.costo += Number(exp.amount)
                                  }
                                })

                                clientTotals.forEach((value) => {
                                  const margen = value.ingreso - value.costo
                                  const rentPct = value.ingreso > 0 ? (margen / value.ingreso) * 100 : 0
                                  clientData.push({ estatus: getRentabilidadEstatus(rentPct) })
                                })

                                return clientData.sort((a, b) => {
                                  const order = { muy_rentable: 0, rentable: 1, en_riesgo: 2, no_rentable: 3 }
                                  return (order[a.estatus as keyof typeof order] || 0) - (order[b.estatus as keyof typeof order] || 0)
                                }).slice(0, 10).map((entry, index) => {
                                  const colors = {
                                    muy_rentable: '#10b981',
                                    rentable: '#4ade80',
                                    en_riesgo: '#f59e0b',
                                    no_rentable: '#ef4444'
                                  }
                                  return <Cell key={`cell-${index}`} fill={colors[entry.estatus as keyof typeof colors] || '#6b7280'} />
                                })
                              })()}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Status Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Resumen por Estatus</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(() => {
                        const statusCounts = { muy_rentable: 0, rentable: 0, en_riesgo: 0, no_rentable: 0 }
                        const clientTotals = new Map<string, { ingreso: number, costo: number }>()
                        
                        invoices.forEach(inv => {
                          const current = clientTotals.get(inv.client_id) || { ingreso: 0, costo: 0 }
                          if (inv.status === "paid") current.ingreso += Number(inv.total)
                          clientTotals.set(inv.client_id, current)
                        })
                        
                        expenses.forEach(exp => {
                          if (exp.client_id) {
                            const current = clientTotals.get(exp.client_id)
                            if (current) current.costo += Number(exp.amount)
                          }
                        })

                        clientTotals.forEach((value) => {
                          const margen = value.ingreso - value.costo
                          const rentPct = value.ingreso > 0 ? (margen / value.ingreso) * 100 : 0
                          statusCounts[getRentabilidadEstatus(rentPct)]++
                        })

                        const total = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1

                        return Object.entries(rentabilidadStatusConfig).map(([key, config]) => (
                          <div key={key} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${config.color}`} />
                                <span className="text-sm font-medium">{config.label}</span>
                              </div>
                              <span className="text-sm font-bold">{statusCounts[key as keyof typeof statusCounts]}</span>
                            </div>
                            <Progress 
                              value={(statusCounts[key as keyof typeof statusCounts] / total) * 100} 
                              className="h-2"
                            />
                          </div>
                        ))
                      })()}
                    </CardContent>
                  </Card>
                </div>

                {/* Client Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detalle por Cliente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cliente</TableHead>
                          <TableHead className="text-right">Ingreso</TableHead>
                          <TableHead className="text-right">Costo</TableHead>
                          <TableHead className="text-right">Margen</TableHead>
                          <TableHead className="text-right">Rentabilidad</TableHead>
                          <TableHead>Estatus</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const clientData: { id: string, name: string, ingreso: number, costo: number, margen: number, rentabilidad: number, estatus: "muy_rentable" | "rentable" | "en_riesgo" | "no_rentable" }[] = []
                          const clientTotals = new Map<string, { name: string, ingreso: number, costo: number }>()
                          
                          invoices.forEach(inv => {
                            const client = clients.find(c => c.id === inv.client_id)
                            const current = clientTotals.get(inv.client_id) || { 
                              name: client?.company_name || 'Desconocido', 
                              ingreso: 0, 
                              costo: 0 
                            }
                            if (inv.status === "paid") current.ingreso += Number(inv.total)
                            clientTotals.set(inv.client_id, current)
                          })
                          
                          expenses.forEach(exp => {
                            if (exp.client_id) {
                              const current = clientTotals.get(exp.client_id)
                              if (current) current.costo += Number(exp.amount)
                            }
                          })

                          clientTotals.forEach((value, key) => {
                            const margen = value.ingreso - value.costo
                            const rentPct = value.ingreso > 0 ? (margen / value.ingreso) * 100 : 0
                            clientData.push({
                              id: key,
                              name: value.name,
                              ingreso: value.ingreso,
                              costo: value.costo,
                              margen,
                              rentabilidad: Math.round(rentPct * 10) / 10,
                              estatus: getRentabilidadEstatus(rentPct)
                            })
                          })

                          if (clientData.length === 0) {
                            return (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                  No hay datos de rentabilidad disponibles
                                </TableCell>
                              </TableRow>
                            )
                          }

                          return clientData.sort((a, b) => b.rentabilidad - a.rentabilidad).map(client => (
                            <TableRow key={client.id}>
                              <TableCell className="font-medium">{client.name}</TableCell>
                              <TableCell className="text-right text-green-600">{formatCurrency(client.ingreso)}</TableCell>
                              <TableCell className="text-right text-red-600">{formatCurrency(client.costo)}</TableCell>
                              <TableCell className={`text-right font-medium ${client.margen >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {formatCurrency(client.margen)}
                              </TableCell>
                              <TableCell className="text-right font-bold">{client.rentabilidad}%</TableCell>
                              <TableCell>
                                <RentabilidadStatusBadge estatus={client.estatus} />
                              </TableCell>
                            </TableRow>
                          ))
                        })()}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Rentabilidad por Proyecto */}
              <TabsContent value="proyectos" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Rentabilidad por Proyecto</CardTitle>
                    <CardDescription>Análisis de rentabilidad a nivel de proyecto</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      <FolderKanban className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-lg font-medium">Próximamente</p>
                      <p className="text-sm">La rentabilidad por proyecto estará disponible cuando se configure el tracking de costos por proyecto.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}
    </div>
  )
}
