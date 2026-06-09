"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  Wallet,
  Building2,
  Users,
  FolderKanban,
  Briefcase,
  Download
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts"

interface Agency {
  id: string
  name: string
}

interface ProfitabilityData {
  agency: string
  agency_id: string
  revenue: number
  expenses: number
  payroll: number
  profit: number
  margin: number
}

interface ClientProfitability {
  client_id: string
  client_name: string
  revenue: number
  expenses: number
  profit: number
  margin: number
  invoices_count: number
}

interface ProjectProfitability {
  project_id: string
  project_name: string
  client_name: string
  revenue: number
  expenses: number
  profit: number
  margin: number
}

interface MonthlyTrend {
  month: string
  revenue: number
  expenses: number
  profit: number
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

export default function ProfitabilityPage() {
  const [loading, setLoading] = useState(true)
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [selectedAgency, setSelectedAgency] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("year")
  const supabase = createClient()

  // Data states
  const [overallStats, setOverallStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    totalPayroll: 0,
    netProfit: 0,
    profitMargin: 0,
    revenueGrowth: 0,
    expenseGrowth: 0,
  })

  const [agencyProfitability, setAgencyProfitability] = useState<ProfitabilityData[]>([])
  const [clientProfitability, setClientProfitability] = useState<ClientProfitability[]>([])
  const [projectProfitability, setProjectProfitability] = useState<ProjectProfitability[]>([])
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([])

  useEffect(() => {
    fetchAgencies()
  }, [])

  useEffect(() => {
    fetchProfitabilityData()
  }, [selectedAgency, selectedPeriod])

  const fetchAgencies = async () => {
    const { data } = await supabase.from("agencies").select("id, name").eq("is_active", true).order("name")
    if (data) setAgencies(data)
  }

  const getDateRange = () => {
    const now = new Date()
    let startDate: Date
    let previousStartDate: Date
    let previousEndDate: Date

    switch (selectedPeriod) {
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case "quarter":
        const currentQuarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1)
        previousStartDate = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1)
        previousEndDate = new Date(now.getFullYear(), currentQuarter * 3, 0)
        break
      case "year":
      default:
        startDate = new Date(now.getFullYear(), 0, 1)
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1)
        previousEndDate = new Date(now.getFullYear() - 1, 11, 31)
        break
    }

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: now.toISOString().split("T")[0],
      previousStartDate: previousStartDate.toISOString().split("T")[0],
      previousEndDate: previousEndDate.toISOString().split("T")[0],
    }
  }

  const fetchProfitabilityData = async () => {
    setLoading(true)
    const dateRange = getDateRange()

    // Fetch invoices (revenue)
    let invoicesQuery = supabase
      .from("invoices")
      .select(`
        id, total_amount, agency_id, client_id, issue_date,
        agency:agencies(id, name),
        client:clients(id, company_name),
        project:projects(id, name)
      `)
      .gte("issue_date", dateRange.startDate)
      .lte("issue_date", dateRange.endDate)
      .neq("status", "cancelled")

    if (selectedAgency !== "all") {
      invoicesQuery = invoicesQuery.eq("agency_id", selectedAgency)
    }

    // Fetch expenses
    let expensesQuery = supabase
      .from("expenses")
      .select(`
        id, total_amount, agency_id, project_id, expense_date, account_id,
        agency:agencies(id, name),
        project:projects(id, name)
      `)
      .gte("expense_date", dateRange.startDate)
      .lte("expense_date", dateRange.endDate)
      .neq("status", "rejected")

    if (selectedAgency !== "all") {
      expensesQuery = expensesQuery.eq("agency_id", selectedAgency)
    }

    // Fetch payroll
    let payrollQuery = supabase
      .from("payroll")
      .select(`
        id, net_salary, total_deductions, agency_id, period_start,
        agency:agencies(id, name)
      `)
      .gte("period_start", dateRange.startDate)
      .lte("period_start", dateRange.endDate)
      .eq("status", "paid")

    if (selectedAgency !== "all") {
      payrollQuery = payrollQuery.eq("agency_id", selectedAgency)
    }

    // Fetch previous period data for comparison
    let prevInvoicesQuery = supabase
      .from("invoices")
      .select("total_amount")
      .gte("issue_date", dateRange.previousStartDate)
      .lte("issue_date", dateRange.previousEndDate)
      .neq("status", "cancelled")

    let prevExpensesQuery = supabase
      .from("expenses")
      .select("total_amount")
      .gte("expense_date", dateRange.previousStartDate)
      .lte("expense_date", dateRange.previousEndDate)
      .neq("status", "rejected")

    if (selectedAgency !== "all") {
      prevInvoicesQuery = prevInvoicesQuery.eq("agency_id", selectedAgency)
      prevExpensesQuery = prevExpensesQuery.eq("agency_id", selectedAgency)
    }

    const [
      { data: invoices },
      { data: expenses },
      { data: payroll },
      { data: prevInvoices },
      { data: prevExpenses },
    ] = await Promise.all([
      invoicesQuery,
      expensesQuery,
      payrollQuery,
      prevInvoicesQuery,
      prevExpensesQuery,
    ])

    // Calculate overall stats
    const totalRevenue = (invoices || []).reduce((sum, inv) => sum + Number(inv.total_amount), 0)
    const totalExpenses = (expenses || []).reduce((sum, exp) => sum + Number(exp.total_amount), 0)
    const totalPayroll = (payroll || []).reduce((sum, pay) => sum + Number(pay.net_salary), 0)
    const netProfit = totalRevenue - totalExpenses - totalPayroll
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    const prevRevenue = (prevInvoices || []).reduce((sum, inv) => sum + Number(inv.total_amount), 0)
    const prevExpensesTotal = (prevExpenses || []).reduce((sum, exp) => sum + Number(exp.total_amount), 0)
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0
    const expenseGrowth = prevExpensesTotal > 0 ? ((totalExpenses - prevExpensesTotal) / prevExpensesTotal) * 100 : 0

    setOverallStats({
      totalRevenue,
      totalExpenses,
      totalPayroll,
      netProfit,
      profitMargin,
      revenueGrowth,
      expenseGrowth,
    })

    // Calculate agency profitability
    const agencyMap = new Map<string, { name: string; revenue: number; expenses: number; payroll: number }>()
    
    ;(invoices || []).forEach(inv => {
      const agencyId = inv.agency_id
      const agencyName = inv.agency?.name || "Sin agencia"
      const current = agencyMap.get(agencyId) || { name: agencyName, revenue: 0, expenses: 0, payroll: 0 }
      current.revenue += Number(inv.total_amount)
      agencyMap.set(agencyId, current)
    })

    ;(expenses || []).forEach(exp => {
      const agencyId = exp.agency_id
      const agencyName = exp.agency?.name || "Sin agencia"
      const current = agencyMap.get(agencyId) || { name: agencyName, revenue: 0, expenses: 0, payroll: 0 }
      current.expenses += Number(exp.total_amount)
      agencyMap.set(agencyId, current)
    })

    ;(payroll || []).forEach(pay => {
      const agencyId = pay.agency_id
      const agencyName = pay.agency?.name || "Sin agencia"
      const current = agencyMap.get(agencyId) || { name: agencyName, revenue: 0, expenses: 0, payroll: 0 }
      current.payroll += Number(pay.net_salary)
      agencyMap.set(agencyId, current)
    })

    const agencyData: ProfitabilityData[] = Array.from(agencyMap.entries()).map(([id, data]) => ({
      agency_id: id,
      agency: data.name,
      revenue: data.revenue,
      expenses: data.expenses,
      payroll: data.payroll,
      profit: data.revenue - data.expenses - data.payroll,
      margin: data.revenue > 0 ? ((data.revenue - data.expenses - data.payroll) / data.revenue) * 100 : 0,
    })).sort((a, b) => b.profit - a.profit)

    setAgencyProfitability(agencyData)

    // Calculate client profitability
    const clientMap = new Map<string, { name: string; revenue: number; expenses: number; invoices_count: number }>()
    
    ;(invoices || []).forEach(inv => {
      const clientId = inv.client_id || "unknown"
      const clientName = inv.client?.company_name || "Sin cliente"
      const current = clientMap.get(clientId) || { name: clientName, revenue: 0, expenses: 0, invoices_count: 0 }
      current.revenue += Number(inv.total_amount)
      current.invoices_count += 1
      clientMap.set(clientId, current)
    })

    // Match expenses to clients via accounts
    ;(expenses || []).forEach(exp => {
      if (exp.account_id) {
        // Find which client this account belongs to
        // For simplicity, we'll associate expenses with projects/accounts
      }
    })

    const clientData: ClientProfitability[] = Array.from(clientMap.entries())
      .filter(([id]) => id !== "unknown")
      .map(([id, data]) => ({
        client_id: id,
        client_name: data.name,
        revenue: data.revenue,
        expenses: data.expenses,
        profit: data.revenue - data.expenses,
        margin: data.revenue > 0 ? ((data.revenue - data.expenses) / data.revenue) * 100 : 0,
        invoices_count: data.invoices_count,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    setClientProfitability(clientData)

    // Calculate project profitability
    const projectMap = new Map<string, { name: string; clientName: string; revenue: number; expenses: number }>()
    
    ;(invoices || []).forEach(inv => {
      if (inv.project) {
        const projectId = inv.project.id
        const current = projectMap.get(projectId) || { 
          name: inv.project.name, 
          clientName: inv.client?.company_name || "Sin cliente",
          revenue: 0, 
          expenses: 0 
        }
        current.revenue += Number(inv.total_amount)
        projectMap.set(projectId, current)
      }
    })

    ;(expenses || []).forEach(exp => {
      if (exp.project) {
        const projectId = exp.project.id
        const current = projectMap.get(projectId) || { name: exp.project.name, clientName: "", revenue: 0, expenses: 0 }
        current.expenses += Number(exp.total_amount)
        projectMap.set(projectId, current)
      }
    })

    const projectData: ProjectProfitability[] = Array.from(projectMap.entries())
      .map(([id, data]) => ({
        project_id: id,
        project_name: data.name,
        client_name: data.clientName,
        revenue: data.revenue,
        expenses: data.expenses,
        profit: data.revenue - data.expenses,
        margin: data.revenue > 0 ? ((data.revenue - data.expenses) / data.revenue) * 100 : 0,
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10)

    setProjectProfitability(projectData)

    // Calculate monthly trend
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const monthlyData = new Map<string, { revenue: number; expenses: number }>()

    // Initialize months
    const startMonth = new Date(dateRange.startDate)
    const endMonth = new Date(dateRange.endDate)
    let currentMonth = new Date(startMonth)
    
    while (currentMonth <= endMonth) {
      const key = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`
      monthlyData.set(key, { revenue: 0, expenses: 0 })
      currentMonth.setMonth(currentMonth.getMonth() + 1)
    }

    ;(invoices || []).forEach(inv => {
      const date = new Date(inv.issue_date)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const current = monthlyData.get(key)
      if (current) {
        current.revenue += Number(inv.total_amount)
        monthlyData.set(key, current)
      }
    })

    ;(expenses || []).forEach(exp => {
      const date = new Date(exp.expense_date)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const current = monthlyData.get(key)
      if (current) {
        current.expenses += Number(exp.total_amount)
        monthlyData.set(key, current)
      }
    })

    const trendData: MonthlyTrend[] = Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => {
        const [year, month] = key.split("-")
        return {
          month: `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`,
          revenue: data.revenue,
          expenses: data.expenses,
          profit: data.revenue - data.expenses,
        }
      })

    setMonthlyTrend(trendData)

    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return `$${Math.abs(amount).toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rentabilidad</h1>
          <p className="text-muted-foreground">
            Analiza la rentabilidad de tus agencias, clientes y proyectos
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Este Mes</SelectItem>
              <SelectItem value="quarter">Este Trimestre</SelectItem>
              <SelectItem value="year">Este Año</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedAgency} onValueChange={setSelectedAgency}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Agencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las agencias</SelectItem>
              {agencies.map((agency) => (
                <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(overallStats.totalRevenue)}</div>
            <div className={`flex items-center text-xs ${overallStats.revenueGrowth >= 0 ? "text-green-600" : "text-destructive"}`}>
              {overallStats.revenueGrowth >= 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
              {formatPercent(overallStats.revenueGrowth)} vs periodo anterior
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Operativos</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overallStats.totalExpenses)}</div>
            <div className={`flex items-center text-xs ${overallStats.expenseGrowth <= 0 ? "text-green-600" : "text-destructive"}`}>
              {overallStats.expenseGrowth <= 0 ? <TrendingDown className="mr-1 h-3 w-3" /> : <TrendingUp className="mr-1 h-3 w-3" />}
              {formatPercent(overallStats.expenseGrowth)} vs periodo anterior
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nómina</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overallStats.totalPayroll)}</div>
            <p className="text-xs text-muted-foreground">Salarios pagados</p>
          </CardContent>
        </Card>
        <Card className={overallStats.netProfit >= 0 ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950" : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilidad Neta</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overallStats.netProfit >= 0 ? "text-green-600" : "text-destructive"}`}>
              {overallStats.netProfit >= 0 ? "" : "-"}{formatCurrency(overallStats.netProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Margen: {overallStats.profitMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia Mensual</CardTitle>
            <CardDescription>Evolución de ingresos, gastos y utilidad</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Ingresos" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="expenses" name="Gastos" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="profit" name="Utilidad" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Agency Profitability Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Rentabilidad por Agencia</CardTitle>
            <CardDescription>Comparación de ingresos y gastos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agencyProfitability} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="agency" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Ingresos" fill="#10b981" />
                  <Bar dataKey="expenses" name="Gastos" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Clients */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Top Clientes
                </CardTitle>
                <CardDescription>Clientes con mayor facturación</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {clientProfitability.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos de clientes para el período seleccionado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="text-right">Facturas</TableHead>
                    <TableHead className="text-right">Margen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientProfitability.map((client) => (
                    <TableRow key={client.client_id}>
                      <TableCell className="font-medium">{client.client_name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(client.revenue)}</TableCell>
                      <TableCell className="text-right">{client.invoices_count}</TableCell>
                      <TableCell className="text-right">
                        <span className={client.margin >= 0 ? "text-green-600" : "text-destructive"}>
                          {client.margin.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5" />
                  Top Proyectos
                </CardTitle>
                <CardDescription>Proyectos con mayor rentabilidad</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {projectProfitability.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos de proyectos para el período seleccionado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proyecto</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="text-right">Gastos</TableHead>
                    <TableHead className="text-right">Utilidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectProfitability.map((project) => (
                    <TableRow key={project.project_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{project.project_name}</div>
                          <div className="text-sm text-muted-foreground">{project.client_name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(project.revenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(project.expenses)}</TableCell>
                      <TableCell className="text-right">
                        <span className={project.profit >= 0 ? "text-green-600 font-medium" : "text-destructive font-medium"}>
                          {project.profit >= 0 ? "" : "-"}{formatCurrency(project.profit)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agency Breakdown Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Desglose por Agencia
              </CardTitle>
              <CardDescription>Detalle de ingresos, gastos, nómina y utilidad por agencia</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {agencyProfitability.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos para el período seleccionado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agencia</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                  <TableHead className="text-right">Gastos Op.</TableHead>
                  <TableHead className="text-right">Nómina</TableHead>
                  <TableHead className="text-right">Utilidad</TableHead>
                  <TableHead className="text-right">Margen</TableHead>
                  <TableHead className="w-[100px]">Rentabilidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agencyProfitability.map((agency) => (
                  <TableRow key={agency.agency_id}>
                    <TableCell className="font-medium">{agency.agency}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(agency.revenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(agency.expenses)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(agency.payroll)}</TableCell>
                    <TableCell className="text-right">
                      <span className={agency.profit >= 0 ? "text-green-600 font-semibold" : "text-destructive font-semibold"}>
                        {agency.profit >= 0 ? "" : "-"}{formatCurrency(agency.profit)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={agency.margin >= 0 ? "text-green-600" : "text-destructive"}>
                        {agency.margin.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={Math.min(Math.max(agency.margin, 0), 100)} 
                          className="h-2 w-full"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
