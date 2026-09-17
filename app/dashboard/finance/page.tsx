"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { NewCategoryButton } from "@/components/finance/new-category-button"
import { AccountBreakdown, type AccountRow } from "@/components/finance/account-breakdown"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  FileText,
  Wallet,
  RefreshCw,
  Receipt,
  TrendingUp,
  Landmark,
  PiggyBank,
} from "lucide-react"

interface Agency {
  id: string
  name: string
}

// Solo se muestran estas dos monedas y NUNCA se mezclan entre sí.
const DISPLAY_CURRENCIES = ["MXN", "USD"] as const
type CurrencyCode = (typeof DISPLAY_CURRENCIES)[number]

const CURRENCY_LOCALE: Record<CurrencyCode, string> = {
  MXN: "es-MX",
  USD: "en-US",
}

const CURRENCY_LABEL: Record<CurrencyCode, string> = {
  MXN: "Pesos (MXN)",
  USD: "Dólares (USD)",
}

function money(amount: number, code: CurrencyCode) {
  return `$${amount.toLocaleString(CURRENCY_LOCALE[code], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface CurrencyTotals {
  invoiced: number
  collected: number
  receivable: number
  expenses: number
  invoiceCount: number
}

interface MonthPoint {
  month: string
  facturado: number
  cobrado: number
  gastos: number
}

function emptyTotals(): CurrencyTotals {
  return { invoiced: 0, collected: 0, receivable: 0, expenses: 0, invoiceCount: 0 }
}

// Convierte un mapa cuenta -> {amount,count} en filas ordenadas con porcentaje,
// dejando las cuentas menores agrupadas en "Otras cuentas".
function toAccountRows(map: Map<string, { amount: number; count: number }>, topN = 8): AccountRow[] {
  const entries = Array.from(map.entries())
    .map(([account, v]) => ({ account, amount: v.amount, count: v.count }))
    .sort((a, b) => b.amount - a.amount)
  const total = entries.reduce((sum, e) => sum + e.amount, 0)

  let rows = entries
  if (entries.length > topN) {
    const top = entries.slice(0, topN)
    const rest = entries.slice(topN)
    const otras = rest.reduce(
      (acc, e) => ({ amount: acc.amount + e.amount, count: acc.count + e.count }),
      { amount: 0, count: 0 },
    )
    rows = [...top, { account: "Otras cuentas", amount: otras.amount, count: otras.count }]
  }

  return rows.map((r) => ({
    ...r,
    percentage: total > 0 ? (r.amount / total) * 100 : 0,
  }))
}

function currencyCodeOf(nested: any): CurrencyCode | null {
  const code = nested?.currencies?.code
  return code === "MXN" || code === "USD" ? code : null
}

export default function FinancialDashboardPage() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [selectedAgency, setSelectedAgency] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("current_year")
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const [totals, setTotals] = useState<Record<CurrencyCode, CurrencyTotals>>({
    MXN: emptyTotals(),
    USD: emptyTotals(),
  })
  const [monthly, setMonthly] = useState<Record<CurrencyCode, MonthPoint[]>>({ MXN: [], USD: [] })
  const [invoicesByAccount, setInvoicesByAccount] = useState<Record<CurrencyCode, AccountRow[]>>({
    MXN: [],
    USD: [],
  })
  const [incomeByAccount, setIncomeByAccount] = useState<Record<CurrencyCode, AccountRow[]>>({
    MXN: [],
    USD: [],
  })
  const [expenseByCategory, setExpenseByCategory] = useState<Record<CurrencyCode, AccountRow[]>>({
    MXN: [],
    USD: [],
  })

  useEffect(() => {
    fetchAgencies()
  }, [])

  useEffect(() => {
    fetchDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgency, selectedPeriod])

  async function fetchAgencies() {
    const { data } = await supabase.from("agencies").select("id, name").eq("is_active", true).order("name")
    if (data) setAgencies(data)
  }

  function getDateRange() {
    const now = new Date()
    const today = now.toISOString().split("T")[0]
    switch (selectedPeriod) {
      case "current_month":
        return { start: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, end: today }
      case "current_quarter": {
        const q = Math.floor(now.getMonth() / 3)
        return { start: `${now.getFullYear()}-${String(q * 3 + 1).padStart(2, "0")}-01`, end: today }
      }
      case "current_year":
        return { start: `${now.getFullYear()}-01-01`, end: today }
      default:
        return { start: "2000-01-01", end: today }
    }
  }

  async function fetchDashboardData() {
    setLoading(true)
    const { start, end } = getDateRange()

    try {
      // ----- Facturas (facturación + por cobrar + facturación por cuenta) -----
      let invoicesQuery = supabase
        .from("invoices")
        .select(
          "id, total_amount, balance_due, status, issue_date, account_id, accounts(account_name), currencies(code)",
        )
        .gte("issue_date", start)
        .lte("issue_date", end)
      if (selectedAgency !== "all") invoicesQuery = invoicesQuery.eq("agency_id", selectedAgency)
      const { data: invoices } = await invoicesQuery

      // ----- Pagos recibidos (ingresos reales) -----
      // Los pagos no guardan cuenta directamente: se deriva de la factura ligada.
      let paymentsQuery = supabase
        .from("payments")
        .select("id, amount, payment_date, status, currencies(code), invoices(account_id, accounts(account_name))")
        .gte("payment_date", start)
        .lte("payment_date", end)
        .eq("status", "completed")
      if (selectedAgency !== "all") paymentsQuery = paymentsQuery.eq("agency_id", selectedAgency)
      const { data: payments } = await paymentsQuery

      // ----- Gastos (por moneda y categoría) -----
      let expensesQuery = supabase
        .from("expenses")
        .select("id, total_amount, expense_date, status, currencies(code), expense_categories(name)")
        .gte("expense_date", start)
        .lte("expense_date", end)
        .in("status", ["approved", "paid"])
      if (selectedAgency !== "all") expensesQuery = expensesQuery.eq("agency_id", selectedAgency)
      const { data: expenses } = await expensesQuery

      // Estructuras acumuladoras por moneda
      const nextTotals: Record<CurrencyCode, CurrencyTotals> = { MXN: emptyTotals(), USD: emptyTotals() }
      const invAcc: Record<CurrencyCode, Map<string, { amount: number; count: number }>> = {
        MXN: new Map(),
        USD: new Map(),
      }
      const incAcc: Record<CurrencyCode, Map<string, { amount: number; count: number }>> = {
        MXN: new Map(),
        USD: new Map(),
      }
      const expCat: Record<CurrencyCode, Map<string, { amount: number; count: number }>> = {
        MXN: new Map(),
        USD: new Map(),
      }

      // Serie mensual (últimos 6 meses) por moneda
      const now = new Date()
      const monthKeys: string[] = []
      const monthlyMap: Record<CurrencyCode, Record<string, MonthPoint>> = { MXN: {}, USD: {} }
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        const label = d.toLocaleDateString("es-MX", { month: "short", year: "2-digit" })
        monthKeys.push(key)
        for (const code of DISPLAY_CURRENCIES) {
          monthlyMap[code][key] = { month: label.charAt(0).toUpperCase() + label.slice(1), facturado: 0, cobrado: 0, gastos: 0 }
        }
      }
      const monthKeyOf = (dateStr: string | null) => (dateStr ? String(dateStr).slice(0, 7) : null)

      // Procesar facturas
      for (const inv of (invoices as any[]) || []) {
        const code = currencyCodeOf(inv)
        if (!code) continue
        if (inv.status === "cancelled" || inv.status === "draft") continue
        const amount = Number(inv.total_amount) || 0
        const balance = Number(inv.balance_due) || 0
        nextTotals[code].invoiced += amount
        nextTotals[code].invoiceCount += 1
        if (inv.status === "pending") nextTotals[code].receivable += balance

        const accName = inv.accounts?.account_name || "(Sin cuenta)"
        const cur = invAcc[code].get(accName) || { amount: 0, count: 0 }
        invAcc[code].set(accName, { amount: cur.amount + amount, count: cur.count + 1 })

        const mk = monthKeyOf(inv.issue_date)
        if (mk && monthlyMap[code][mk]) monthlyMap[code][mk].facturado += amount
      }

      // Procesar pagos (ingresos)
      for (const p of (payments as any[]) || []) {
        const code = currencyCodeOf(p)
        if (!code) continue
        const amount = Number(p.amount) || 0
        nextTotals[code].collected += amount

        const accName = p.invoices?.accounts?.account_name || "(Sin cuenta)"
        const cur = incAcc[code].get(accName) || { amount: 0, count: 0 }
        incAcc[code].set(accName, { amount: cur.amount + amount, count: cur.count + 1 })

        const mk = monthKeyOf(p.payment_date)
        if (mk && monthlyMap[code][mk]) monthlyMap[code][mk].cobrado += amount
      }

      // Procesar gastos
      for (const e of (expenses as any[]) || []) {
        const code = currencyCodeOf(e)
        if (!code) continue
        const amount = Number(e.total_amount) || 0
        nextTotals[code].expenses += amount

        const catName = e.expense_categories?.name || "Otros"
        const cur = expCat[code].get(catName) || { amount: 0, count: 0 }
        expCat[code].set(catName, { amount: cur.amount + amount, count: cur.count + 1 })

        const mk = monthKeyOf(e.expense_date)
        if (mk && monthlyMap[code][mk]) monthlyMap[code][mk].gastos += amount
      }

      setTotals(nextTotals)
      setInvoicesByAccount({ MXN: toAccountRows(invAcc.MXN), USD: toAccountRows(invAcc.USD) })
      setIncomeByAccount({ MXN: toAccountRows(incAcc.MXN), USD: toAccountRows(incAcc.USD) })
      setExpenseByCategory({ MXN: toAccountRows(expCat.MXN), USD: toAccountRows(expCat.USD) })
      setMonthly({
        MXN: monthKeys.map((k) => monthlyMap.MXN[k]),
        USD: monthKeys.map((k) => monthlyMap.USD[k]),
      })
    } catch (error) {
      console.error("[v0] Error fetching finance dashboard:", error)
    }

    setLoading(false)
  }

  const periodLabel: Record<string, string> = {
    current_month: "Este mes",
    current_quarter: "Este trimestre",
    current_year: "Este año",
    all: "Todo el histórico",
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Financiero</h1>
          <p className="text-sm text-muted-foreground">
            Información en tiempo real, separada por moneda. Pesos y dólares nunca se mezclan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedAgency} onValueChange={setSelectedAgency}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Agencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las agencias</SelectItem>
              {agencies.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">Este mes</SelectItem>
              <SelectItem value="current_quarter">Este trimestre</SelectItem>
              <SelectItem value="current_year">Este año</SelectItem>
              <SelectItem value="all">Todo el histórico</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchDashboardData} aria-label="Actualizar">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <NewCategoryButton />
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : (
        <>
          {/* KPIs por moneda */}
          {DISPLAY_CURRENCIES.map((code) => {
            const t = totals[code]
            const profit = t.collected - t.expenses
            const cards = [
              { label: "Facturado", value: t.invoiced, icon: FileText, hint: `${t.invoiceCount} facturas` },
              { label: "Cobrado", value: t.collected, icon: Wallet, hint: "Pagos recibidos" },
              { label: "Por cobrar", value: t.receivable, icon: Receipt, hint: "Facturas pendientes" },
              { label: "Gastos", value: t.expenses, icon: TrendingUp, hint: "Aprobados y pagados" },
              {
                label: "Utilidad neta",
                value: profit,
                icon: PiggyBank,
                hint: "Cobrado − Gastos",
                highlight: true,
              },
            ]
            return (
              <section key={code} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Resumen en {CURRENCY_LABEL[code]}</h2>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                  {cards.map((c) => (
                    <Card key={c.label}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">{c.label}</CardTitle>
                        <c.icon className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div
                          className={`text-xl font-bold tabular-nums ${
                            c.highlight ? (c.value >= 0 ? "text-emerald-600" : "text-destructive") : ""
                          }`}
                        >
                          {money(c.value, code)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )
          })}

          {/* Tendencia mensual (real) por moneda */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Tendencia mensual</h2>
              <p className="text-sm text-muted-foreground">
                Últimos 6 meses · {periodLabel[selectedPeriod] ?? ""}. Una gráfica por moneda.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {DISPLAY_CURRENCIES.map((code) => (
                <Card key={code}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{CURRENCY_LABEL[code]}</CardTitle>
                    <CardDescription>Facturado · Cobrado · Gastos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={monthly[code]} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          fontSize={11}
                          width={70}
                          tickFormatter={(v: number) =>
                            v >= 1000 ? `$${(v / 1000).toLocaleString(CURRENCY_LOCALE[code])}k` : `$${v}`
                          }
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => [money(Number(value), code), name]}
                          contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                        />
                        <Legend fontSize={12} />
                        <Bar dataKey="facturado" name="Facturado" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="cobrado" name="Cobrado" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="gastos" name="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Cuentas — Facturación */}
          <AccountBreakdown
            title="Cuentas — Facturación"
            description="Cuánto representa cada cuenta sobre el total facturado, separado por moneda."
            icon={<FileText className="h-5 w-5" />}
            unit="facturas"
            mxn={invoicesByAccount.MXN}
            usd={invoicesByAccount.USD}
          />

          {/* Cuentas — Ingresos */}
          <AccountBreakdown
            title="Cuentas — Ingresos"
            description="Cuánto representa cada cuenta sobre el total cobrado (pagos recibidos), separado por moneda."
            icon={<Wallet className="h-5 w-5" />}
            unit="pagos"
            mxn={incomeByAccount.MXN}
            usd={incomeByAccount.USD}
          />

          {/* Gastos por categoría */}
          <AccountBreakdown
            title="Gastos por categoría"
            description="Distribución de los gastos aprobados y pagados, separado por moneda."
            icon={<Receipt className="h-5 w-5" />}
            unit="gastos"
            mxn={expenseByCategory.MXN}
            usd={expenseByCategory.USD}
          />
        </>
      )}
    </div>
  )
}
