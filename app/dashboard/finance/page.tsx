"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Receipt,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Users,
  FolderKanban,
  Calendar,
  Download,
  Plus,
  RefreshCw,
  Filter,
  ChevronRight,
  Eye,
  Edit,
  FileText,
  Bell,
  PiggyBank,
  Banknote,
  CircleDollarSign,
  Target,
  Activity,
} from "lucide-react"

interface Agency {
  id: string
  name: string
}

interface KPIData {
  totalIncome: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  cashFlow: number
  accountsReceivable: number
  accountsPayable: number
  overdueInvoices: number
  monthProjection: number
  incomeChange: number
  expenseChange: number
  profitChange: number
}

interface MonthlyData {
  month: string
  income: number
  expenses: number
  profit: number
}

interface CashFlowData {
  period: string
  inflows: number
  outflows: number
  balance: number
}

interface AccountReceivable {
  id: string
  client: string
  project: string
  amount: number
  dueDate: string
  status: "pending" | "due_soon" | "overdue" | "partial" | "paid"
  daysOverdue: number
}

interface AccountPayable {
  id: string
  vendor: string
  concept: string
  amount: number
  dueDate: string
  category: string
  status: "pending" | "due_soon" | "overdue" | "paid"
}

interface ExpenseCategory {
  name: string
  amount: number
  percentage: number
  color: string
}

interface FinancialAlert {
  id: string
  type: "critical" | "high" | "medium" | "low"
  title: string
  description: string
  amount?: number
  date?: string
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatPercent = (value: number) => {
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(1)}%`
}

const EXPENSE_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
]

const AGING_COLORS = {
  "0-15": "#10b981",
  "16-30": "#f59e0b",
  "31-60": "#f97316",
  "60+": "#ef4444",
}

// Sparkline mini component
function Sparkline({ data, color = "#10b981", height = 30 }: { data: number[]; color?: string; height?: number }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const width = 80
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  }).join(" ")

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function FinancialDashboardPage() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [selectedAgency, setSelectedAgency] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("current_month")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const supabase = createClient()

  // KPI Data
  const [kpiData, setKpiData] = useState<KPIData>({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    cashFlow: 0,
    accountsReceivable: 0,
    accountsPayable: 0,
    overdueInvoices: 0,
    monthProjection: 0,
    incomeChange: 0,
    expenseChange: 0,
    profitChange: 0,
  })

  // Chart Data
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([])
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([])
  const [receivables, setReceivables] = useState<AccountReceivable[]>([])
  const [payables, setPayables] = useState<AccountPayable[]>([])
  const [alerts, setAlerts] = useState<FinancialAlert[]>([])

  // Sparkline data
  const [incomeSparkline, setIncomeSparkline] = useState<number[]>([])
  const [expenseSparkline, setExpenseSparkline] = useState<number[]>([])
  const [profitSparkline, setProfitSparkline] = useState<number[]>([])

  useEffect(() => {
    fetchAgencies()
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [selectedAgency, selectedPeriod])

  async function fetchAgencies() {
    const { data } = await supabase
      .from("agencies")
      .select("id, name")
      .eq("is_active", true)
      .order("name")

    if (data) {
      setAgencies(data)
    }
  }

  async function fetchDashboardData() {
    setLoading(true)

    const now = new Date()
    let startDate: string
    let endDate: string
    let prevStartDate: string
    let prevEndDate: string

    // Calculate date ranges
    switch (selectedPeriod) {
      case "current_month":
        startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
        endDate = now.toISOString().split("T")[0]
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        prevStartDate = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}-01`
        prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0]
        break
      case "current_quarter":
        const quarter = Math.floor(now.getMonth() / 3)
        startDate = `${now.getFullYear()}-${String(quarter * 3 + 1).padStart(2, "0")}-01`
        endDate = now.toISOString().split("T")[0]
        const prevQuarter = quarter === 0 ? 3 : quarter - 1
        const prevQuarterYear = quarter === 0 ? now.getFullYear() - 1 : now.getFullYear()
        prevStartDate = `${prevQuarterYear}-${String(prevQuarter * 3 + 1).padStart(2, "0")}-01`
        prevEndDate = `${prevQuarterYear}-${String(prevQuarter * 3 + 3).padStart(2, "0")}-${prevQuarter === 0 || prevQuarter === 2 ? "31" : "30"}`
        break
      default:
        startDate = `${now.getFullYear()}-01-01`
        endDate = now.toISOString().split("T")[0]
        prevStartDate = `${now.getFullYear() - 1}-01-01`
        prevEndDate = `${now.getFullYear() - 1}-12-31`
    }

    try {
      // Fetch invoices (income)
      let invoicesQuery = supabase
        .from("invoices")
        .select("id, total_amount, status, issue_date, due_date, accounts(name)")
        .gte("issue_date", startDate)
        .lte("issue_date", endDate)

      if (selectedAgency !== "all") {
        invoicesQuery = invoicesQuery.eq("agency_id", selectedAgency)
      }

      const { data: invoices } = await invoicesQuery

      // Fetch previous period invoices
      let prevInvoicesQuery = supabase
        .from("invoices")
        .select("total_amount")
        .gte("issue_date", prevStartDate)
        .lte("issue_date", prevEndDate)

      if (selectedAgency !== "all") {
        prevInvoicesQuery = prevInvoicesQuery.eq("agency_id", selectedAgency)
      }

      const { data: prevInvoices } = await prevInvoicesQuery

      // Fetch payments received
      let paymentsQuery = supabase
        .from("payments")
        .select("amount, payment_date")
        .gte("payment_date", startDate)
        .lte("payment_date", endDate)
        .eq("status", "completed")

      if (selectedAgency !== "all") {
        paymentsQuery = paymentsQuery.eq("agency_id", selectedAgency)
      }

      const { data: payments } = await paymentsQuery

      // Fetch expenses
      let expensesQuery = supabase
        .from("expenses")
        .select("id, total_amount, expense_date, category_id, status, expense_categories(name)")
        .gte("expense_date", startDate)
        .lte("expense_date", endDate)
        .in("status", ["approved", "paid"])

      if (selectedAgency !== "all") {
        expensesQuery = expensesQuery.eq("agency_id", selectedAgency)
      }

      const { data: expenses } = await expensesQuery

      // Fetch previous period expenses
      let prevExpensesQuery = supabase
        .from("expenses")
        .select("total_amount")
        .gte("expense_date", prevStartDate)
        .lte("expense_date", prevEndDate)
        .in("status", ["approved", "paid"])

      if (selectedAgency !== "all") {
        prevExpensesQuery = prevExpensesQuery.eq("agency_id", selectedAgency)
      }

      const { data: prevExpenses } = await prevExpensesQuery

      // Fetch payroll
      let payrollQuery = supabase
        .from("payroll_periods")
        .select("total_gross")
        .gte("start_date", startDate)
        .lte("end_date", endDate)
        .eq("status", "paid")

      if (selectedAgency !== "all") {
        payrollQuery = payrollQuery.eq("agency_id", selectedAgency)
      }

      const { data: payroll } = await payrollQuery

      // Fetch pending invoices (accounts receivable)
      let pendingInvoicesQuery = supabase
        .from("invoices")
        .select("id, total_amount, due_date, status, accounts(name), projects(name)")
        .in("status", ["sent", "partial"])
        .order("due_date")

      if (selectedAgency !== "all") {
        pendingInvoicesQuery = pendingInvoicesQuery.eq("agency_id", selectedAgency)
      }

      const { data: pendingInvoices } = await pendingInvoicesQuery

      // Fetch pending expenses (accounts payable)
      let pendingExpensesQuery = supabase
        .from("expenses")
        .select("id, total_amount, expense_date, description, expense_categories(name), vendors(name)")
        .eq("status", "approved")
        .order("expense_date")

      if (selectedAgency !== "all") {
        pendingExpensesQuery = pendingExpensesQuery.eq("agency_id", selectedAgency)
      }

      const { data: pendingExpenses } = await pendingExpensesQuery

      // Calculate KPIs
      const totalIncome = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0
      const prevTotalIncome = prevInvoices?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0
      const totalExpensesAmount = (expenses?.reduce((sum, exp) => sum + Number(exp.total_amount || 0), 0) || 0) +
        (payroll?.reduce((sum, p) => sum + Number(p.total_gross || 0), 0) || 0)
      const prevTotalExpenses = prevExpenses?.reduce((sum, exp) => sum + Number(exp.total_amount || 0), 0) || 0
      const netProfit = totalIncome - totalExpensesAmount
      const prevNetProfit = prevTotalIncome - prevTotalExpenses
      const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0
      const cashFlowAmount = payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0
      const accountsReceivable = pendingInvoices?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0
      const accountsPayable = pendingExpenses?.reduce((sum, exp) => sum + Number(exp.total_amount || 0), 0) || 0

      // Calculate overdue invoices
      const today = new Date()
      const overdueInvoices = pendingInvoices?.filter(inv => new Date(inv.due_date) < today).length || 0

      // Calculate changes
      const incomeChange = prevTotalIncome > 0 ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100 : 0
      const expenseChange = prevTotalExpenses > 0 ? ((totalExpensesAmount - prevTotalExpenses) / prevTotalExpenses) * 100 : 0
      const profitChange = prevNetProfit !== 0 ? ((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100 : 0

      setKpiData({
        totalIncome,
        totalExpenses: totalExpensesAmount,
        netProfit,
        profitMargin,
        cashFlow: cashFlowAmount,
        accountsReceivable,
        accountsPayable,
        overdueInvoices,
        monthProjection: totalIncome * 1.1, // Simple projection
        incomeChange,
        expenseChange,
        profitChange,
      })

      // Generate monthly chart data (last 6 months)
      const monthlyChartData: MonthlyData[] = []
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthName = monthDate.toLocaleDateString("es-MX", { month: "short" })
        monthlyChartData.push({
          month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          income: Math.random() * 500000 + 200000, // Placeholder - would calculate from real data
          expenses: Math.random() * 300000 + 150000,
          profit: Math.random() * 200000 + 50000,
        })
      }
      setMonthlyData(monthlyChartData)

      // Generate sparkline data
      setIncomeSparkline(monthlyChartData.map(d => d.income))
      setExpenseSparkline(monthlyChartData.map(d => d.expenses))
      setProfitSparkline(monthlyChartData.map(d => d.profit))

      // Generate cash flow projection
      const cashFlowProjection: CashFlowData[] = [
        { period: "Actual", inflows: cashFlowAmount, outflows: totalExpensesAmount * 0.8, balance: cashFlowAmount - totalExpensesAmount * 0.8 },
        { period: "30 días", inflows: accountsReceivable * 0.6, outflows: accountsPayable * 0.7, balance: accountsReceivable * 0.6 - accountsPayable * 0.7 },
        { period: "60 días", inflows: accountsReceivable * 0.3, outflows: accountsPayable * 0.2, balance: accountsReceivable * 0.3 - accountsPayable * 0.2 },
        { period: "90 días", inflows: totalIncome * 0.2, outflows: totalExpensesAmount * 0.3, balance: totalIncome * 0.2 - totalExpensesAmount * 0.3 },
      ]
      setCashFlowData(cashFlowProjection)

      // Calculate expense categories
      const categoryMap = new Map<string, number>()
      expenses?.forEach(exp => {
        const catName = (exp.expense_categories as any)?.name || "Otros"
        categoryMap.set(catName, (categoryMap.get(catName) || 0) + Number(exp.total_amount || 0))
      })
      // Add payroll as Nómina
      const payrollTotal = payroll?.reduce((sum, p) => sum + Number(p.total_gross || 0), 0) || 0
      if (payrollTotal > 0) {
        categoryMap.set("Nómina", payrollTotal)
      }

      const totalCatExpenses = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0)
      const categories: ExpenseCategory[] = Array.from(categoryMap.entries())
        .map(([name, amount], index) => ({
          name,
          amount,
          percentage: totalCatExpenses > 0 ? (amount / totalCatExpenses) * 100 : 0,
          color: EXPENSE_COLORS[index % EXPENSE_COLORS.length],
        }))
        .sort((a, b) => b.amount - a.amount)
      setExpenseCategories(categories)

      // Process accounts receivable
      const receivablesList: AccountReceivable[] = (pendingInvoices || []).map(inv => {
        const dueDate = new Date(inv.due_date)
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        let status: AccountReceivable["status"] = "pending"
        if (daysOverdue > 0) status = "overdue"
        else if (daysOverdue > -7) status = "due_soon"
        if (inv.status === "partial") status = "partial"

        return {
          id: inv.id,
          client: (inv.accounts as any)?.name || "Cliente",
          project: (inv.projects as any)?.name || "-",
          amount: Number(inv.total_amount),
          dueDate: inv.due_date,
          status,
          daysOverdue: Math.max(0, daysOverdue),
        }
      })
      setReceivables(receivablesList)

      // Process accounts payable
      const payablesList: AccountPayable[] = (pendingExpenses || []).map(exp => {
        const expDate = new Date(exp.expense_date)
        const daysToDue = Math.floor((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        let status: AccountPayable["status"] = "pending"
        if (daysToDue < 0) status = "overdue"
        else if (daysToDue < 7) status = "due_soon"

        return {
          id: exp.id,
          vendor: (exp.vendors as any)?.name || "Proveedor",
          concept: exp.description || "Gasto",
          amount: Number(exp.total_amount),
          dueDate: exp.expense_date,
          category: (exp.expense_categories as any)?.name || "Otros",
          status,
        }
      })
      setPayables(payablesList)

      // Generate alerts
      const alertsList: FinancialAlert[] = []
      
      if (overdueInvoices > 0) {
        alertsList.push({
          id: "1",
          type: "critical",
          title: `${overdueInvoices} facturas vencidas`,
          description: "Hay facturas pendientes de cobro que han superado su fecha de vencimiento",
          amount: receivablesList.filter(r => r.status === "overdue").reduce((sum, r) => sum + r.amount, 0),
        })
      }

      if (profitMargin < 10 && totalIncome > 0) {
        alertsList.push({
          id: "2",
          type: "high",
          title: "Margen de utilidad bajo",
          description: `El margen actual es de ${profitMargin.toFixed(1)}%, por debajo del objetivo del 10%`,
        })
      }

      if (accountsPayable > cashFlowAmount * 0.8) {
        alertsList.push({
          id: "3",
          type: "medium",
          title: "Compromisos de pago elevados",
          description: "Las cuentas por pagar representan más del 80% del flujo de efectivo disponible",
          amount: accountsPayable,
        })
      }

      const upcomingPayables = payablesList.filter(p => p.status === "due_soon").length
      if (upcomingPayables > 0) {
        alertsList.push({
          id: "4",
          type: "low",
          title: `${upcomingPayables} pagos próximos`,
          description: "Hay pagos programados para los próximos 7 días",
        })
      }

      setAlerts(alertsList)

    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    }

    setLoading(false)
  }

  // Aging distribution for receivables
  const agingDistribution = useMemo(() => {
    const aging = { "0-15": 0, "16-30": 0, "31-60": 0, "60+": 0 }
    receivables.forEach(r => {
      if (r.daysOverdue === 0) aging["0-15"] += r.amount
      else if (r.daysOverdue <= 15) aging["0-15"] += r.amount
      else if (r.daysOverdue <= 30) aging["16-30"] += r.amount
      else if (r.daysOverdue <= 60) aging["31-60"] += r.amount
      else aging["60+"] += r.amount
    })
    return Object.entries(aging).map(([range, amount]) => ({
      range,
      amount,
      color: AGING_COLORS[range as keyof typeof AGING_COLORS],
    }))
  }, [receivables])

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      pending: { variant: "secondary", className: "" },
      due_soon: { variant: "outline", className: "border-amber-500 text-amber-600" },
      overdue: { variant: "destructive", className: "" },
      partial: { variant: "outline", className: "border-blue-500 text-blue-600" },
      paid: { variant: "outline", className: "border-emerald-500 text-emerald-600" },
    }
    const labels: Record<string, string> = {
      pending: "Pendiente",
      due_soon: "Por vencer",
      overdue: "Vencido",
      partial: "Pago parcial",
      paid: "Pagado",
    }
    const style = styles[status] || styles.pending
    return <Badge variant={style.variant} className={style.className}>{labels[status]}</Badge>
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical": return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "high": return <AlertCircle className="h-5 w-5 text-orange-500" />
      case "medium": return <AlertCircle className="h-5 w-5 text-amber-500" />
      default: return <Bell className="h-5 w-5 text-blue-500" />
    }
  }

  const getAlertBg = (type: string) => {
    switch (type) {
      case "critical": return "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
      case "high": return "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900"
      case "medium": return "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900"
      default: return "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Financiero</h1>
          <p className="text-muted-foreground">
            Visión general de la salud financiera de tu agencia
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchDashboardData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" />
            Registrar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedAgency} onValueChange={setSelectedAgency}>
                <SelectTrigger className="w-[180px]">
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
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Mes actual</SelectItem>
                  <SelectItem value="current_quarter">Trimestre actual</SelectItem>
                  <SelectItem value="current_year">Año actual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Ingresos */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Ingresos</p>
                {loading ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <p className="text-xl font-bold">{formatCurrency(kpiData.totalIncome)}</p>
                )}
              </div>
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            {!loading && (
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {kpiData.incomeChange >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs font-medium ${kpiData.incomeChange >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {formatPercent(kpiData.incomeChange)}
                  </span>
                </div>
                <Sparkline data={incomeSparkline.length > 0 ? incomeSparkline : [0, 0, 0, 0, 0, 0]} color="#10b981" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Egresos */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Egresos</p>
                {loading ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <p className="text-xl font-bold">{formatCurrency(kpiData.totalExpenses)}</p>
                )}
              </div>
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <CreditCard className="h-4 w-4 text-red-600" />
              </div>
            </div>
            {!loading && (
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {kpiData.expenseChange <= 0 ? (
                    <ArrowDownRight className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <ArrowUpRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs font-medium ${kpiData.expenseChange <= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {formatPercent(kpiData.expenseChange)}
                  </span>
                </div>
                <Sparkline data={expenseSparkline.length > 0 ? expenseSparkline : [0, 0, 0, 0, 0, 0]} color="#ef4444" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Utilidad */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Utilidad Neta</p>
                {loading ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <p className={`text-xl font-bold ${kpiData.netProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {formatCurrency(kpiData.netProfit)}
                  </p>
                )}
              </div>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Wallet className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            {!loading && (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Margen: {kpiData.profitMargin.toFixed(1)}%
                </span>
                <Sparkline data={profitSparkline.length > 0 ? profitSparkline : [0, 0, 0, 0, 0, 0]} color="#3b82f6" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cuentas por Cobrar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Por Cobrar</p>
                {loading ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <p className="text-xl font-bold">{formatCurrency(kpiData.accountsReceivable)}</p>
                )}
              </div>
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Receipt className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            {!loading && kpiData.overdueInvoices > 0 && (
              <div className="mt-3">
                <Badge variant="destructive" className="text-xs">
                  {kpiData.overdueInvoices} vencidas
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cuentas por Pagar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Por Pagar</p>
                {loading ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <p className="text-xl font-bold">{formatCurrency(kpiData.accountsPayable)}</p>
                )}
              </div>
              <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <Banknote className="h-4 w-4 text-violet-600" />
              </div>
            </div>
            {!loading && (
              <div className="mt-3">
                <span className="text-xs text-muted-foreground">
                  {payables.filter(p => p.status === "due_soon").length} próximos
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Ingresos vs Egresos</CardTitle>
                <CardDescription>Comparativo mensual</CardDescription>
              </div>
              <Tabs defaultValue="bar" className="w-auto">
                <TabsList className="h-8">
                  <TabsTrigger value="bar" className="text-xs px-2">Barras</TabsTrigger>
                  <TabsTrigger value="line" className="text-xs px-2">Líneas</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis 
                    className="text-xs" 
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="Utilidad" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Expense Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribución de Egresos</CardTitle>
            <CardDescription>Por categoría</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="amount"
                      nameKey="name"
                    >
                      {expenseCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {expenseCategories.slice(0, 4).map((cat, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-muted-foreground truncate max-w-[100px]">{cat.name}</span>
                      </div>
                      <span className="font-medium">{cat.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Projection */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Flujo de Efectivo</CardTitle>
                <CardDescription>Proyección a 90 días</CardDescription>
              </div>
              <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                <Activity className="h-3 w-3 mr-1" />
                Saludable
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInflows" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOutflows" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="period" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis 
                    className="text-xs" 
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="inflows"
                    name="Entradas"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorInflows)"
                  />
                  <Area
                    type="monotone"
                    dataKey="outflows"
                    name="Salidas"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorOutflows)"
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    name="Balance"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Financial Alerts */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Alertas Financieras</CardTitle>
              <Badge variant="secondary">{alerts.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                <p className="text-sm text-muted-foreground">Sin alertas pendientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${getAlertBg(alert.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {alert.description}
                        </p>
                        {alert.amount && (
                          <p className="text-xs font-medium mt-1">
                            {formatCurrency(alert.amount)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Accounts Receivable and Payable */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accounts Receivable */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Cuentas por Cobrar</CardTitle>
                <CardDescription>Antigüedad de saldos</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                Ver todo <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <>
                {/* Aging Summary */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {agingDistribution.map((item) => (
                    <div key={item.range} className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">{item.range} días</p>
                      <p className="text-sm font-bold" style={{ color: item.color }}>
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Receivables Table */}
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {receivables.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.client}</p>
                        <p className="text-xs text-muted-foreground">{item.project}</p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-sm font-medium">{formatCurrency(item.amount)}</p>
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Accounts Payable */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Cuentas por Pagar</CardTitle>
                <CardDescription>Próximos vencimientos</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                Ver todo <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <>
                {/* Summary by category */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {expenseCategories.slice(0, 4).map((cat) => (
                    <Badge key={cat.name} variant="outline" className="text-xs">
                      <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </Badge>
                  ))}
                </div>

                {/* Payables Table */}
                <div className="space-y-2 max-h-[240px] overflow-y-auto">
                  {payables.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.vendor}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.concept}</p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-sm font-medium">{formatCurrency(item.amount)}</p>
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
