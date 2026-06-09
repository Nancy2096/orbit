"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  FileBarChart, 
  Download, 
  TrendingUp, 
  TrendingDown,
  Building2,
  Wallet,
  Landmark,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar,
  RefreshCw
} from "lucide-react"

interface Agency {
  id: string
  name: string
}

interface FinancialData {
  // Balance General
  totalAssets: number
  currentAssets: number
  fixedAssets: number
  totalLiabilities: number
  currentLiabilities: number
  longTermLiabilities: number
  equity: number
  
  // Estado de Resultados
  revenue: number
  costOfServices: number
  grossProfit: number
  operatingExpenses: number
  operatingIncome: number
  financialExpenses: number
  netIncome: number
  
  // Flujo de Efectivo
  operatingCashFlow: number
  investingCashFlow: number
  financingCashFlow: number
  netCashFlow: number
  beginningCash: number
  endingCash: number
  
  // Patrimonio
  initialCapital: number
  capitalContributions: number
  capitalWithdrawals: number
  retainedEarnings: number
  dividends: number
  finalEquity: number
  
  // EBITDA
  ebitda: number
  depreciation: number
  amortization: number
  interestExpense: number
  taxes: number
  ebitdaMargin: number
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount)
}

const formatPercent = (value: number) => {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
}

export default function FinancialReportsPage() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [selectedAgency, setSelectedAgency] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("current_month")
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [loading, setLoading] = useState(true)
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const supabase = createClient()

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())

  useEffect(() => {
    fetchAgencies()
  }, [])

  useEffect(() => {
    fetchFinancialData()
  }, [selectedAgency, selectedPeriod, selectedYear])

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

  async function fetchFinancialData() {
    setLoading(true)
    
    // Calcular rango de fechas según el período
    const now = new Date()
    let startDate: string
    let endDate: string
    
    switch (selectedPeriod) {
      case "current_month":
        startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
        endDate = now.toISOString().split("T")[0]
        break
      case "current_quarter":
        const quarter = Math.floor(now.getMonth() / 3)
        startDate = `${now.getFullYear()}-${String(quarter * 3 + 1).padStart(2, "0")}-01`
        endDate = now.toISOString().split("T")[0]
        break
      case "current_year":
        startDate = `${now.getFullYear()}-01-01`
        endDate = now.toISOString().split("T")[0]
        break
      case "custom_year":
        startDate = `${selectedYear}-01-01`
        endDate = `${selectedYear}-12-31`
        break
      default:
        startDate = `${now.getFullYear()}-01-01`
        endDate = now.toISOString().split("T")[0]
    }

    try {
      // Obtener facturas (ingresos)
      let invoicesQuery = supabase
        .from("invoices")
        .select("total_amount, tax_amount, subtotal, status")
        .gte("issue_date", startDate)
        .lte("issue_date", endDate)
        .in("status", ["paid", "partial", "sent"])
      
      if (selectedAgency !== "all") {
        invoicesQuery = invoicesQuery.eq("agency_id", selectedAgency)
      }
      
      const { data: invoices } = await invoicesQuery

      // Obtener pagos recibidos
      let paymentsQuery = supabase
        .from("payments")
        .select("amount, status")
        .gte("payment_date", startDate)
        .lte("payment_date", endDate)
        .eq("status", "completed")
      
      if (selectedAgency !== "all") {
        paymentsQuery = paymentsQuery.eq("agency_id", selectedAgency)
      }
      
      const { data: payments } = await paymentsQuery

      // Obtener gastos
      let expensesQuery = supabase
        .from("expenses")
        .select("amount, tax_amount, total_amount, status, category_id")
        .gte("expense_date", startDate)
        .lte("expense_date", endDate)
        .in("status", ["approved", "paid"])
      
      if (selectedAgency !== "all") {
        expensesQuery = expensesQuery.eq("agency_id", selectedAgency)
      }
      
      const { data: expenses } = await expensesQuery

      // Obtener activos fijos
      let assetsQuery = supabase
        .from("fixed_assets")
        .select("acquisition_cost, current_value, accumulated_depreciation, status")
        .eq("status", "active")
      
      if (selectedAgency !== "all") {
        assetsQuery = assetsQuery.eq("agency_id", selectedAgency)
      }
      
      const { data: assets } = await assetsQuery

      // Obtener transacciones de patrimonio
      let equityQuery = supabase
        .from("equity_transactions")
        .select("transaction_type, amount")
        .gte("transaction_date", startDate)
        .lte("transaction_date", endDate)
      
      if (selectedAgency !== "all") {
        equityQuery = equityQuery.eq("agency_id", selectedAgency)
      }
      
      const { data: equityTransactions } = await equityQuery

      // Obtener nómina (gastos de personal)
      let payrollQuery = supabase
        .from("payroll_periods")
        .select("total_gross, total_net, status")
        .gte("start_date", startDate)
        .lte("end_date", endDate)
        .eq("status", "paid")
      
      if (selectedAgency !== "all") {
        payrollQuery = payrollQuery.eq("agency_id", selectedAgency)
      }
      
      const { data: payroll } = await payrollQuery

      // Calcular totales
      const revenue = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0
      const paymentsReceived = payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0
      const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.total_amount || 0), 0) || 0
      const payrollCost = payroll?.reduce((sum, p) => sum + Number(p.total_gross || 0), 0) || 0
      
      // Activos
      const fixedAssetsValue = assets?.reduce((sum, a) => sum + Number(a.current_value || a.acquisition_cost || 0), 0) || 0
      const accumulatedDepreciation = assets?.reduce((sum, a) => sum + Number(a.accumulated_depreciation || 0), 0) || 0
      
      // Patrimonio
      const capitalContributions = equityTransactions
        ?.filter(t => t.transaction_type === "capital_contribution")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0
      const capitalWithdrawals = equityTransactions
        ?.filter(t => t.transaction_type === "capital_withdrawal")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0
      const dividends = equityTransactions
        ?.filter(t => t.transaction_type === "dividend")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0

      // Cálculos financieros
      const grossProfit = revenue - (payrollCost * 0.6) // Estimación: 60% del costo de nómina es costo de servicios
      const costOfServices = payrollCost * 0.6
      const operatingExpenses = totalExpenses + (payrollCost * 0.4) // 40% nómina es gastos operativos
      const operatingIncome = grossProfit - operatingExpenses
      const financialExpenses = totalExpenses * 0.05 // Estimación: 5% de gastos son financieros
      const taxes = operatingIncome > 0 ? operatingIncome * 0.30 : 0 // ISR estimado 30%
      const netIncome = operatingIncome - financialExpenses - taxes

      // EBITDA
      const depreciation = accumulatedDepreciation / 12 // Depreciación mensual estimada
      const ebitda = operatingIncome + depreciation
      const ebitdaMargin = revenue > 0 ? (ebitda / revenue) * 100 : 0

      // Flujos de efectivo
      const operatingCashFlow = paymentsReceived - totalExpenses - payrollCost
      const investingCashFlow = -(fixedAssetsValue * 0.05) // Estimación: inversiones
      const financingCashFlow = capitalContributions - capitalWithdrawals - dividends
      const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow

      // Balance General
      const currentAssets = paymentsReceived + (revenue - paymentsReceived) * 0.8 // Efectivo + Cuentas por cobrar
      const totalAssets = currentAssets + fixedAssetsValue
      const currentLiabilities = totalExpenses * 0.3 // Estimación de pasivos corrientes
      const longTermLiabilities = 0 // Se puede calcular de préstamos si los hay
      const totalLiabilities = currentLiabilities + longTermLiabilities
      const equity = totalAssets - totalLiabilities

      setFinancialData({
        // Balance General
        totalAssets,
        currentAssets,
        fixedAssets: fixedAssetsValue,
        totalLiabilities,
        currentLiabilities,
        longTermLiabilities,
        equity,
        
        // Estado de Resultados
        revenue,
        costOfServices,
        grossProfit,
        operatingExpenses,
        operatingIncome,
        financialExpenses,
        netIncome,
        
        // Flujo de Efectivo
        operatingCashFlow,
        investingCashFlow,
        financingCashFlow,
        netCashFlow,
        beginningCash: 0, // Se podría calcular del período anterior
        endingCash: netCashFlow,
        
        // Patrimonio
        initialCapital: equity - capitalContributions + capitalWithdrawals + dividends - netIncome,
        capitalContributions,
        capitalWithdrawals,
        retainedEarnings: netIncome,
        dividends,
        finalEquity: equity,
        
        // EBITDA
        ebitda,
        depreciation,
        amortization: 0,
        interestExpense: financialExpenses,
        taxes,
        ebitdaMargin,
      })
    } catch (error) {
      console.error("Error fetching financial data:", error)
    }
    
    setLoading(false)
  }

  const renderTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="h-4 w-4 text-emerald-600" />
    if (value < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const renderValueColor = (value: number, inverse = false) => {
    if (inverse) {
      return value > 0 ? "text-red-600" : value < 0 ? "text-emerald-600" : ""
    }
    return value > 0 ? "text-emerald-600" : value < 0 ? "text-red-600" : ""
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Informes Financieros</h1>
          <p className="text-muted-foreground">
            Análisis financiero completo de tu agencia
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchFinancialData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Agencia</label>
              <Select value={selectedAgency} onValueChange={setSelectedAgency}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar agencia" />
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
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Mes actual</SelectItem>
                  <SelectItem value="current_quarter">Trimestre actual</SelectItem>
                  <SelectItem value="current_year">Año actual</SelectItem>
                  <SelectItem value="custom_year">Año específico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedPeriod === "custom_year" && (
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium mb-2 block">Año</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar año" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPIs Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(financialData?.revenue || 0)}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  {renderTrendIcon(financialData?.revenue || 0)}
                  <span className={renderValueColor(financialData?.revenue || 0)}>
                    Período actual
                  </span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilidad Neta</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${renderValueColor(financialData?.netIncome || 0)}`}>
                  {formatCurrency(financialData?.netIncome || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Margen: {financialData?.revenue ? ((financialData.netIncome / financialData.revenue) * 100).toFixed(1) : 0}%
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EBITDA</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${renderValueColor(financialData?.ebitda || 0)}`}>
                  {formatCurrency(financialData?.ebitda || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Margen EBITDA: {financialData?.ebitdaMargin?.toFixed(1) || 0}%
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patrimonio</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(financialData?.equity || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Capital total
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Informes */}
      <Tabs defaultValue="balance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="balance">Balance General</TabsTrigger>
          <TabsTrigger value="income">Estado de Resultados</TabsTrigger>
          <TabsTrigger value="cashflow">Flujo de Efectivo</TabsTrigger>
          <TabsTrigger value="equity">Cambios en Patrimonio</TabsTrigger>
          <TabsTrigger value="ebitda">EBITDA</TabsTrigger>
        </TabsList>

        {/* Balance General */}
        <TabsContent value="balance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Activos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Activos
                </CardTitle>
                <CardDescription>Recursos controlados por la empresa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <>
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">Activo Circulante</h4>
                      <div className="flex justify-between py-2 border-b">
                        <span>Efectivo y equivalentes</span>
                        <span className="font-medium">{formatCurrency((financialData?.currentAssets || 0) * 0.4)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Cuentas por cobrar</span>
                        <span className="font-medium">{formatCurrency((financialData?.currentAssets || 0) * 0.5)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Otros activos circulantes</span>
                        <span className="font-medium">{formatCurrency((financialData?.currentAssets || 0) * 0.1)}</span>
                      </div>
                      <div className="flex justify-between py-2 font-medium bg-muted/50 px-2 rounded">
                        <span>Total Activo Circulante</span>
                        <span>{formatCurrency(financialData?.currentAssets || 0)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">Activo Fijo</h4>
                      <div className="flex justify-between py-2 border-b">
                        <span>Propiedades, planta y equipo</span>
                        <span className="font-medium">{formatCurrency(financialData?.fixedAssets || 0)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b text-red-600">
                        <span>(-) Depreciación acumulada</span>
                        <span className="font-medium">-{formatCurrency((financialData?.fixedAssets || 0) * 0.2)}</span>
                      </div>
                      <div className="flex justify-between py-2 font-medium bg-muted/50 px-2 rounded">
                        <span>Total Activo Fijo Neto</span>
                        <span>{formatCurrency((financialData?.fixedAssets || 0) * 0.8)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between py-3 font-bold text-lg border-t-2 mt-4">
                      <span>TOTAL ACTIVOS</span>
                      <span className="text-primary">{formatCurrency(financialData?.totalAssets || 0)}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Pasivos y Patrimonio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Landmark className="h-5 w-5" />
                  Pasivos y Patrimonio
                </CardTitle>
                <CardDescription>Obligaciones y capital de los propietarios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <>
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">Pasivo Circulante</h4>
                      <div className="flex justify-between py-2 border-b">
                        <span>Cuentas por pagar</span>
                        <span className="font-medium">{formatCurrency((financialData?.currentLiabilities || 0) * 0.6)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Impuestos por pagar</span>
                        <span className="font-medium">{formatCurrency((financialData?.currentLiabilities || 0) * 0.3)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Otras cuentas por pagar</span>
                        <span className="font-medium">{formatCurrency((financialData?.currentLiabilities || 0) * 0.1)}</span>
                      </div>
                      <div className="flex justify-between py-2 font-medium bg-muted/50 px-2 rounded">
                        <span>Total Pasivo Circulante</span>
                        <span>{formatCurrency(financialData?.currentLiabilities || 0)}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">Pasivo a Largo Plazo</h4>
                      <div className="flex justify-between py-2 border-b">
                        <span>Préstamos bancarios</span>
                        <span className="font-medium">{formatCurrency(financialData?.longTermLiabilities || 0)}</span>
                      </div>
                      <div className="flex justify-between py-2 font-medium bg-muted/50 px-2 rounded">
                        <span>Total Pasivo L/P</span>
                        <span>{formatCurrency(financialData?.longTermLiabilities || 0)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between py-2 font-medium bg-red-50 dark:bg-red-950/30 px-2 rounded text-red-700 dark:text-red-400">
                      <span>TOTAL PASIVOS</span>
                      <span>{formatCurrency(financialData?.totalLiabilities || 0)}</span>
                    </div>

                    <div className="space-y-3 pt-4 border-t">
                      <h4 className="font-medium text-sm text-muted-foreground">Capital Contable</h4>
                      <div className="flex justify-between py-2 border-b">
                        <span>Capital social</span>
                        <span className="font-medium">{formatCurrency((financialData?.equity || 0) * 0.5)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Utilidades retenidas</span>
                        <span className="font-medium">{formatCurrency((financialData?.equity || 0) * 0.3)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Resultado del ejercicio</span>
                        <span className={`font-medium ${renderValueColor(financialData?.netIncome || 0)}`}>
                          {formatCurrency(financialData?.netIncome || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 font-medium bg-emerald-50 dark:bg-emerald-950/30 px-2 rounded text-emerald-700 dark:text-emerald-400">
                        <span>Total Patrimonio</span>
                        <span>{formatCurrency(financialData?.equity || 0)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between py-3 font-bold text-lg border-t-2 mt-4">
                      <span>PASIVO + PATRIMONIO</span>
                      <span className="text-primary">{formatCurrency(financialData?.totalAssets || 0)}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Estado de Resultados */}
        <TabsContent value="income" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Estado de Resultados
              </CardTitle>
              <CardDescription>Resumen de ingresos, costos y gastos del período</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-4 max-w-2xl">
                  <div className="flex justify-between py-3 text-lg font-medium border-b-2">
                    <span>Ingresos por servicios</span>
                    <span className="text-emerald-600">{formatCurrency(financialData?.revenue || 0)}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b text-red-600">
                    <span>(-) Costo de servicios</span>
                    <span>-{formatCurrency(financialData?.costOfServices || 0)}</span>
                  </div>

                  <div className="flex justify-between py-3 font-medium bg-muted/50 px-3 rounded">
                    <span>Utilidad Bruta</span>
                    <span className={renderValueColor(financialData?.grossProfit || 0)}>
                      {formatCurrency(financialData?.grossProfit || 0)}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b text-red-600">
                    <span>(-) Gastos operativos</span>
                    <span>-{formatCurrency(financialData?.operatingExpenses || 0)}</span>
                  </div>

                  <div className="flex justify-between py-3 font-medium bg-muted/50 px-3 rounded">
                    <span>Utilidad Operativa</span>
                    <span className={renderValueColor(financialData?.operatingIncome || 0)}>
                      {formatCurrency(financialData?.operatingIncome || 0)}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b text-red-600">
                    <span>(-) Gastos financieros</span>
                    <span>-{formatCurrency(financialData?.financialExpenses || 0)}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b text-red-600">
                    <span>(-) Impuestos</span>
                    <span>-{formatCurrency(financialData?.taxes || 0)}</span>
                  </div>

                  <div className="flex justify-between py-4 font-bold text-xl border-t-2 mt-4">
                    <span>UTILIDAD NETA</span>
                    <span className={renderValueColor(financialData?.netIncome || 0)}>
                      {formatCurrency(financialData?.netIncome || 0)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t mt-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Margen Bruto</p>
                      <p className="text-lg font-bold">
                        {financialData?.revenue ? ((financialData.grossProfit / financialData.revenue) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Margen Operativo</p>
                      <p className="text-lg font-bold">
                        {financialData?.revenue ? ((financialData.operatingIncome / financialData.revenue) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Margen Neto</p>
                      <p className="text-lg font-bold">
                        {financialData?.revenue ? ((financialData.netIncome / financialData.revenue) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Estado de Flujo de Efectivo */}
        <TabsContent value="cashflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Estado de Flujo de Efectivo
              </CardTitle>
              <CardDescription>Movimientos de efectivo clasificados por actividad</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-6 max-w-2xl">
                  {/* Actividades de Operación */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      Actividades de Operación
                    </h4>
                    <div className="ml-4 space-y-2">
                      <div className="flex justify-between py-2 border-b">
                        <span>Cobros a clientes</span>
                        <span className="font-medium text-emerald-600">
                          +{formatCurrency(Math.abs(financialData?.operatingCashFlow || 0) + (financialData?.operatingExpenses || 0))}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Pagos a proveedores y empleados</span>
                        <span className="font-medium text-red-600">
                          -{formatCurrency(financialData?.operatingExpenses || 0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between py-2 font-medium bg-emerald-50 dark:bg-emerald-950/30 px-3 rounded ml-4">
                      <span>Flujo neto de operación</span>
                      <span className={renderValueColor(financialData?.operatingCashFlow || 0)}>
                        {formatCurrency(financialData?.operatingCashFlow || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Actividades de Inversión */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      Actividades de Inversión
                    </h4>
                    <div className="ml-4 space-y-2">
                      <div className="flex justify-between py-2 border-b">
                        <span>Adquisición de activos fijos</span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(financialData?.investingCashFlow || 0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between py-2 font-medium bg-blue-50 dark:bg-blue-950/30 px-3 rounded ml-4">
                      <span>Flujo neto de inversión</span>
                      <span className={renderValueColor(financialData?.investingCashFlow || 0)}>
                        {formatCurrency(financialData?.investingCashFlow || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Actividades de Financiamiento */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      Actividades de Financiamiento
                    </h4>
                    <div className="ml-4 space-y-2">
                      <div className="flex justify-between py-2 border-b">
                        <span>Aportaciones de capital</span>
                        <span className="font-medium text-emerald-600">
                          +{formatCurrency(financialData?.capitalContributions || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Retiros de capital</span>
                        <span className="font-medium text-red-600">
                          -{formatCurrency(financialData?.capitalWithdrawals || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Dividendos pagados</span>
                        <span className="font-medium text-red-600">
                          -{formatCurrency(financialData?.dividends || 0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between py-2 font-medium bg-purple-50 dark:bg-purple-950/30 px-3 rounded ml-4">
                      <span>Flujo neto de financiamiento</span>
                      <span className={renderValueColor(financialData?.financingCashFlow || 0)}>
                        {formatCurrency(financialData?.financingCashFlow || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Resumen */}
                  <div className="border-t-2 pt-4 space-y-3">
                    <div className="flex justify-between py-2">
                      <span>Efectivo al inicio del período</span>
                      <span className="font-medium">{formatCurrency(financialData?.beginningCash || 0)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span>Cambio neto en efectivo</span>
                      <span className={`font-medium ${renderValueColor(financialData?.netCashFlow || 0)}`}>
                        {formatCurrency(financialData?.netCashFlow || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between py-3 font-bold text-lg bg-muted px-3 rounded">
                      <span>EFECTIVO AL FINAL DEL PERÍODO</span>
                      <span className="text-primary">{formatCurrency(financialData?.endingCash || 0)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Estado de Cambios en el Patrimonio */}
        <TabsContent value="equity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5" />
                Estado de Cambios en el Patrimonio
              </CardTitle>
              <CardDescription>Variaciones en el capital contable durante el período</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-4 max-w-2xl">
                  <div className="flex justify-between py-3 border-b-2">
                    <span className="font-medium">Patrimonio al inicio del período</span>
                    <span className="font-medium">{formatCurrency(financialData?.initialCapital || 0)}</span>
                  </div>

                  <div className="space-y-2 py-2">
                    <p className="text-sm text-muted-foreground font-medium">Movimientos del período:</p>
                    
                    <div className="flex justify-between py-2 border-b ml-4">
                      <span className="flex items-center gap-2">
                        <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                        Aportaciones de capital
                      </span>
                      <span className="font-medium text-emerald-600">
                        +{formatCurrency(financialData?.capitalContributions || 0)}
                      </span>
                    </div>

                    <div className="flex justify-between py-2 border-b ml-4">
                      <span className="flex items-center gap-2">
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                        Retiros de capital
                      </span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(financialData?.capitalWithdrawals || 0)}
                      </span>
                    </div>

                    <div className="flex justify-between py-2 border-b ml-4">
                      <span className="flex items-center gap-2">
                        {(financialData?.retainedEarnings || 0) >= 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-600" />
                        )}
                        Resultado del ejercicio
                      </span>
                      <span className={`font-medium ${renderValueColor(financialData?.retainedEarnings || 0)}`}>
                        {(financialData?.retainedEarnings || 0) >= 0 ? "+" : ""}{formatCurrency(financialData?.retainedEarnings || 0)}
                      </span>
                    </div>

                    <div className="flex justify-between py-2 border-b ml-4">
                      <span className="flex items-center gap-2">
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                        Dividendos decretados
                      </span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(financialData?.dividends || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between py-4 font-bold text-xl border-t-2 mt-4">
                    <span>PATRIMONIO AL FINAL DEL PERÍODO</span>
                    <span className="text-primary">{formatCurrency(financialData?.finalEquity || 0)}</span>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Variación del patrimonio:</p>
                    <div className="flex items-center gap-2">
                      {renderTrendIcon((financialData?.finalEquity || 0) - (financialData?.initialCapital || 0))}
                      <span className={`text-lg font-bold ${renderValueColor((financialData?.finalEquity || 0) - (financialData?.initialCapital || 0))}`}>
                        {formatCurrency((financialData?.finalEquity || 0) - (financialData?.initialCapital || 0))}
                      </span>
                      <span className="text-muted-foreground">
                        ({financialData?.initialCapital ? (((financialData.finalEquity - financialData.initialCapital) / financialData.initialCapital) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* EBITDA */}
        <TabsContent value="ebitda" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="h-5 w-5" />
                  Cálculo del EBITDA
                </CardTitle>
                <CardDescription>
                  Earnings Before Interest, Taxes, Depreciation, and Amortization
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between py-2 border-b">
                      <span>Utilidad Neta</span>
                      <span className={`font-medium ${renderValueColor(financialData?.netIncome || 0)}`}>
                        {formatCurrency(financialData?.netIncome || 0)}
                      </span>
                    </div>

                    <div className="flex justify-between py-2 border-b">
                      <span>(+) Impuestos</span>
                      <span className="font-medium">+{formatCurrency(financialData?.taxes || 0)}</span>
                    </div>

                    <div className="flex justify-between py-2 border-b">
                      <span>(+) Gastos financieros (intereses)</span>
                      <span className="font-medium">+{formatCurrency(financialData?.interestExpense || 0)}</span>
                    </div>

                    <div className="flex justify-between py-2 border-b">
                      <span>(+) Depreciación</span>
                      <span className="font-medium">+{formatCurrency(financialData?.depreciation || 0)}</span>
                    </div>

                    <div className="flex justify-between py-2 border-b">
                      <span>(+) Amortización</span>
                      <span className="font-medium">+{formatCurrency(financialData?.amortization || 0)}</span>
                    </div>

                    <div className="flex justify-between py-4 font-bold text-xl border-t-2 mt-4">
                      <span>EBITDA</span>
                      <span className={renderValueColor(financialData?.ebitda || 0)}>
                        {formatCurrency(financialData?.ebitda || 0)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análisis EBITDA</CardTitle>
                <CardDescription>Indicadores de rentabilidad operativa</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground mb-1">Margen EBITDA</p>
                      <p className={`text-4xl font-bold ${renderValueColor(financialData?.ebitdaMargin || 0)}`}>
                        {financialData?.ebitdaMargin?.toFixed(1) || 0}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        EBITDA / Ingresos Totales
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Ingresos</span>
                          <span>{formatCurrency(financialData?.revenue || 0)}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: "100%" }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>EBITDA</span>
                          <span>{formatCurrency(financialData?.ebitda || 0)}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${(financialData?.ebitdaMargin || 0) >= 0 ? "bg-emerald-500" : "bg-red-500"}`} 
                            style={{ width: `${Math.min(Math.abs(financialData?.ebitdaMargin || 0), 100)}%` }} 
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Utilidad Neta</span>
                          <span>{formatCurrency(financialData?.netIncome || 0)}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${(financialData?.netIncome || 0) >= 0 ? "bg-blue-500" : "bg-red-500"}`}
                            style={{ 
                              width: `${financialData?.revenue ? Math.min(Math.abs((financialData.netIncome / financialData.revenue) * 100), 100) : 0}%` 
                            }} 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        El EBITDA muestra la capacidad de generación de efectivo operativo de la empresa,
                        sin considerar decisiones de financiamiento, impuestos o políticas contables.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
