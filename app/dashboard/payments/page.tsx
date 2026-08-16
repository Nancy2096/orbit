"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { Search, DollarSign, TrendingUp, Calendar, Building2, Landmark, ArrowUpRight, ArrowDownRight, Eye, Plus, PiggyBank, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface BankAccount {
  id: string
  bank_name: string
  account_name: string
  account_number: string
  clabe: string | null
  account_type: string
  is_primary: boolean
  current_balance: number
  initial_balance: number
  invoices_total: number
  capital_total: number
  currency: { code: string; symbol: string } | null
  agency: { id: string; name: string } | null
}

interface PaidInvoice {
  id: string
  invoice_number: string
  total_amount: number
  paid_amount: number
  payment_date: string | null
  payment_reference: string | null
  status: string
  client: { id: string; company_name: string } | null
  agency: { id: string; name: string } | null
  currency: { id: string; code: string; symbol: string } | null
  account: { id: string; account_name: string } | null
  project: { id: string; name: string } | null
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

export default function IncomesPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [paidInvoices, setPaidInvoices] = useState<PaidInvoice[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAgency, setSelectedAgency] = useState<string>("all")
  const [dateRange, setDateRange] = useState<string>("all")
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [showAddAccountDialog, setShowAddAccountDialog] = useState(false)
  const [savingAccount, setSavingAccount] = useState(false)
  const [newAccount, setNewAccount] = useState({
    agency_id: "",
    currency_id: "",
    bank_name: "",
    account_name: "",
    account_number: "",
    clabe: "",
    account_type: "checking",
    initial_balance: "",
    is_primary: false,
    is_active: true,
  })

  // Editar saldo inicial de un banco existente
  const [editBalanceAccount, setEditBalanceAccount] = useState<BankAccount | null>(null)
  const [editInitialBalance, setEditInitialBalance] = useState("")
  const [savingBalance, setSavingBalance] = useState(false)

  // Ingreso de capital
  const [showCapitalDialog, setShowCapitalDialog] = useState(false)
  const [savingCapital, setSavingCapital] = useState(false)
  const [newCapital, setNewCapital] = useState({
    bank_account_id: "",
    amount: "",
    description: "",
    transaction_date: new Date().toISOString().split("T")[0],
  })

  const supabase = createClient()

  // Stats
  const [stats, setStats] = useState({
    totalReceived: 0,
    thisMonth: 0,
    lastMonth: 0,
    growth: 0,
  })

  useEffect(() => {
    fetchAgencies()
    fetchCurrencies()
    fetchBankAccounts()
    fetchPaidInvoices()
  }, [selectedAgency, dateRange])

  const fetchAgencies = async () => {
    const { data } = await supabase.from("agencies").select("id, name").eq("is_active", true).order("name")
    if (data) setAgencies(data)
  }

  const fetchCurrencies = async () => {
    const { data } = await supabase.from("currencies").select("id, code, symbol").eq("is_active", true).order("code")
    if (data) setCurrencies(data)
  }

  const handleSaveAccount = async () => {
    if (!newAccount.agency_id || !newAccount.currency_id || !newAccount.bank_name || !newAccount.account_name) {
      toast.error("Por favor completa los campos requeridos")
      return
    }

    const initialBalance = parseFloat(newAccount.initial_balance) || 0

    setSavingAccount(true)
    const { error } = await supabase.from("bank_accounts").insert({
      agency_id: newAccount.agency_id,
      currency_id: newAccount.currency_id,
      bank_name: newAccount.bank_name,
      account_name: newAccount.account_name,
      account_number: newAccount.account_number || null,
      clabe: newAccount.clabe || null,
      account_type: newAccount.account_type,
      initial_balance: initialBalance,
      current_balance: initialBalance,
      is_primary: newAccount.is_primary,
      is_active: newAccount.is_active,
    })

    setSavingAccount(false)

    if (error) {
      toast.error("Error al crear la cuenta: " + error.message)
      return
    }

    toast.success("Cuenta bancaria creada exitosamente")
    setShowAddAccountDialog(false)
    setNewAccount({
      agency_id: "",
      currency_id: "",
      bank_name: "",
      account_name: "",
      account_number: "",
      clabe: "",
      account_type: "checking",
      initial_balance: "",
      is_primary: false,
      is_active: true,
    })
    fetchBankAccounts()
  }

  const handleSaveInitialBalance = async () => {
    if (!editBalanceAccount) return
    const value = parseFloat(editInitialBalance) || 0

    setSavingBalance(true)
    const { error } = await supabase
      .from("bank_accounts")
      .update({ initial_balance: value })
      .eq("id", editBalanceAccount.id)
    setSavingBalance(false)

    if (error) {
      toast.error("Error al actualizar el saldo inicial: " + error.message)
      return
    }

    toast.success("Saldo inicial actualizado")
    setEditBalanceAccount(null)
    setEditInitialBalance("")
    fetchBankAccounts()
  }

  const handleSaveCapital = async () => {
    const amount = parseFloat(newCapital.amount) || 0
    if (!newCapital.bank_account_id || amount <= 0) {
      toast.error("Selecciona un banco e ingresa un monto válido")
      return
    }

    const bank = bankAccounts.find((b) => b.id === newCapital.bank_account_id)

    setSavingCapital(true)
    const { error } = await supabase.from("equity_transactions").insert({
      bank_account_id: newCapital.bank_account_id,
      agency_id: bank?.agency?.id || null,
      transaction_type: "capital_contribution",
      amount,
      description: newCapital.description || "Ingreso de capital",
      transaction_date: newCapital.transaction_date,
    })
    setSavingCapital(false)

    if (error) {
      toast.error("Error al registrar el ingreso de capital: " + error.message)
      return
    }

    toast.success("Ingreso de capital registrado exitosamente")
    setShowCapitalDialog(false)
    setNewCapital({
      bank_account_id: "",
      amount: "",
      description: "",
      transaction_date: new Date().toISOString().split("T")[0],
    })
    fetchBankAccounts()
  }

  const fetchBankAccounts = async () => {
    let query = supabase
      .from("bank_accounts")
      .select(`
        id, bank_name, account_name, account_number, clabe, account_type, is_primary, current_balance, initial_balance,
        currency:currencies(code, symbol),
        agency:agencies(id, name)
      `)
      .eq("is_active", true)
      .order("bank_name")

    if (selectedAgency !== "all") {
      query = query.eq("agency_id", selectedAgency)
    }

    const { data, error } = await query
    
    if (error) {
      console.error("Error fetching bank accounts:", error)
      setBankAccounts([])
      return
    }
    
    if (data) {
      const bankIds = data.map((b: Record<string, unknown>) => b.id as string)

      // Facturas pagadas por banco
      const { data: paidInvoices } = await supabase
        .from("invoices")
        .select("bank_account_id, total_amount")
        .eq("status", "paid")
        .in("bank_account_id", bankIds)

      const invoicesByBank: Record<string, number> = {}
      if (paidInvoices) {
        paidInvoices.forEach((inv: { bank_account_id: string | null; total_amount: number }) => {
          if (inv.bank_account_id) {
            invoicesByBank[inv.bank_account_id] = (invoicesByBank[inv.bank_account_id] || 0) + (inv.total_amount || 0)
          }
        })
      }

      // Aportaciones de capital por banco
      const { data: capitalTx } = await supabase
        .from("equity_transactions")
        .select("bank_account_id, amount, transaction_type")
        .in("bank_account_id", bankIds)

      const capitalByBank: Record<string, number> = {}
      if (capitalTx) {
        capitalTx.forEach((tx: { bank_account_id: string | null; amount: number; transaction_type: string }) => {
          if (!tx.bank_account_id) return
          // Las aportaciones suman; retiros/dividendos restan del saldo del banco.
          const sign = tx.transaction_type === "capital_contribution" ? 1 : -1
          capitalByBank[tx.bank_account_id] = (capitalByBank[tx.bank_account_id] || 0) + sign * (tx.amount || 0)
        })
      }

      const mapped = data.map((bank: Record<string, unknown>) => {
        const id = bank.id as string
        const initial = Number(bank.initial_balance) || 0
        const invoicesTotal = invoicesByBank[id] || 0
        const capitalTotal = capitalByBank[id] || 0
        return {
          ...bank,
          currency: Array.isArray(bank.currency) ? bank.currency[0] : bank.currency,
          agency: Array.isArray(bank.agency) ? bank.agency[0] : bank.agency,
          initial_balance: initial,
          invoices_total: invoicesTotal,
          capital_total: capitalTotal,
          // Saldo actual = saldo inicial + facturas pagadas + aportaciones de capital
          current_balance: initial + invoicesTotal + capitalTotal,
        }
      }) as BankAccount[]
      setBankAccounts(mapped)
    }
  }

  const fetchPaidInvoices = async () => {
    setLoading(true)
    
    let query = supabase
      .from("invoices")
      .select(`
        id, invoice_number, total_amount, paid_amount, payment_date, payment_reference, status,
        client:clients(id, company_name),
        agency:agencies(id, name),
        currency:currencies(id, code, symbol),
        account:accounts(id, account_name),
        project:projects(id, name)
      `)
      .eq("status", "paid")
      .order("payment_date", { ascending: false })

    if (selectedAgency !== "all") {
      query = query.eq("agency_id", selectedAgency)
    }

    // Date range filter
    const now = new Date()
    if (dateRange === "today") {
      const today = now.toISOString().split('T')[0]
      query = query.gte("payment_date", today)
    } else if (dateRange === "week") {
      const weekAgo = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0]
      query = query.gte("payment_date", weekAgo)
    } else if (dateRange === "month") {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0]
      query = query.gte("payment_date", monthAgo)
    } else if (dateRange === "year") {
      const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0]
      query = query.gte("payment_date", yearAgo)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching paid invoices:", error)
    } else if (data) {
      const mapped = data.map((inv: Record<string, unknown>) => ({
        ...inv,
        client: Array.isArray(inv.client) ? inv.client[0] : inv.client,
        agency: Array.isArray(inv.agency) ? inv.agency[0] : inv.agency,
        currency: Array.isArray(inv.currency) ? inv.currency[0] : inv.currency,
        account: Array.isArray(inv.account) ? inv.account[0] : inv.account,
        project: Array.isArray(inv.project) ? inv.project[0] : inv.project,
      })) as PaidInvoice[]
      setPaidInvoices(mapped)
      calculateStats(mapped)
    }
    setLoading(false)
  }

  const calculateStats = (invoices: PaidInvoice[]) => {
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    const totalReceived = invoices.reduce((sum, inv) => sum + (Number(inv.paid_amount) || Number(inv.total_amount) || 0), 0)
    
    const thisMonth = invoices
      .filter(inv => inv.payment_date && new Date(inv.payment_date) >= thisMonthStart)
      .reduce((sum, inv) => sum + (Number(inv.paid_amount) || Number(inv.total_amount) || 0), 0)
    
    const lastMonth = invoices
      .filter(inv => {
        if (!inv.payment_date) return false
        const date = new Date(inv.payment_date)
        return date >= lastMonthStart && date <= lastMonthEnd
      })
      .reduce((sum, inv) => sum + (Number(inv.paid_amount) || Number(inv.total_amount) || 0), 0)

    const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : thisMonth > 0 ? 100 : 0

    setStats(prev => ({
      ...prev,
      totalReceived,
      thisMonth,
      lastMonth,
      growth,
    }))
  }

  const formatCurrency = (amount: number, currencyCode?: string) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currencyCode || "MXN",
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const filteredInvoices = paidInvoices.filter((invoice) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      invoice.invoice_number?.toLowerCase().includes(searchLower) ||
      invoice.client?.company_name?.toLowerCase().includes(searchLower) ||
      invoice.payment_reference?.toLowerCase().includes(searchLower) ||
      invoice.account?.account_name?.toLowerCase().includes(searchLower)
    )
  })

  const getAccountTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      checking: "Cuenta Corriente",
      savings: "Cuenta de Ahorro",
      investment: "Inversión",
    }
    return types[type] || type
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bancos e Ingresos</h1>
          <p className="text-muted-foreground">
            Reporte de ingresos recibidos y saldos bancarios
          </p>
        </div>
      </div>

      {/* Agency Selector - Main Filter */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-medium">Seleccionar Agencia:</span>
            </div>
            <Select value={selectedAgency} onValueChange={setSelectedAgency}>
              <SelectTrigger className="w-[280px] bg-background">
                <SelectValue placeholder="Seleccionar agencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4" />
                    <span className="font-medium">Global (Todas las agencias)</span>
                  </div>
                </SelectItem>
                {agencies.map((agency) => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAgency !== "all" && (
              <Badge variant="secondary" className="ml-2">
                {agencies.find(a => a.id === selectedAgency)?.name || "Agencia seleccionada"}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bank Balances Summary by Currency */}
      {bankAccounts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* MXN Summary */}
          {(() => {
            const mxnAccounts = bankAccounts.filter(a => a.currency?.code === "MXN")
            const mxnTotal = mxnAccounts.reduce((sum, a) => sum + (a.current_balance || 0), 0)
            if (mxnAccounts.length === 0) return null
            return (
              <Card className="border-2 border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    Saldo Total en Pesos Mexicanos
                  </CardDescription>
                  <CardTitle className="text-3xl font-bold text-green-600 dark:text-green-400">
                    ${mxnTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {mxnAccounts.length} cuenta{mxnAccounts.length !== 1 ? "s" : ""} en MXN
                  </p>
                </CardContent>
              </Card>
            )
          })()}
          
          {/* USD Summary */}
          {(() => {
            const usdAccounts = bankAccounts.filter(a => a.currency?.code === "USD")
            const usdTotal = usdAccounts.reduce((sum, a) => sum + (a.current_balance || 0), 0)
            if (usdAccounts.length === 0) return null
            return (
              <Card className="border-2 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    Saldo Total en Dolares
                  </CardDescription>
                  <CardTitle className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    ${usdTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {usdAccounts.length} cuenta{usdAccounts.length !== 1 ? "s" : ""} en USD
                  </p>
                </CardContent>
              </Card>
            )
          })()}

          {/* Other Currencies Summary */}
          {(() => {
            const otherAccounts = bankAccounts.filter(a => a.currency?.code !== "MXN" && a.currency?.code !== "USD")
            if (otherAccounts.length === 0) return null
            const groupedByCode = otherAccounts.reduce((acc, a) => {
              const code = a.currency?.code || "N/A"
              if (!acc[code]) acc[code] = 0
              acc[code] += a.current_balance || 0
              return acc
            }, {} as Record<string, number>)
            return (
              <Card className="border-2 border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    Otras Monedas
                  </CardDescription>
                  <div className="space-y-1">
                    {Object.entries(groupedByCode).map(([code, total]) => (
                      <CardTitle key={code} className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {code}
                      </CardTitle>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {otherAccounts.length} cuenta{otherAccounts.length !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>
            )
          })()}
        </div>
      )}

      {/* Bank Accounts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Cuentas Bancarias
            {selectedAgency !== "all" && (
              <Badge variant="outline" className="ml-2 font-normal">
                {agencies.find(a => a.id === selectedAgency)?.name}
              </Badge>
            )}
            {selectedAgency === "all" && (
              <Badge variant="secondary" className="ml-2 font-normal">
                Todas las agencias
              </Badge>
            )}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {bankAccounts.length} cuenta{bankAccounts.length !== 1 ? "s" : ""} bancaria{bankAccounts.length !== 1 ? "s" : ""}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setNewCapital((prev) => ({ ...prev, bank_account_id: bankAccounts[0]?.id || "" }))
                setShowCapitalDialog(true)
              }}
              disabled={bankAccounts.length === 0}
            >
              <PiggyBank className="mr-2 h-4 w-4" />
              Ingreso de Capital
            </Button>
            <Button size="sm" onClick={() => setShowAddAccountDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Cuenta
            </Button>
          </div>
        </div>
        
        {bankAccounts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Landmark className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No hay cuentas bancarias registradas</p>
              <Button variant="link" className="mt-2" onClick={() => setShowAddAccountDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar cuenta bancaria
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {bankAccounts.map((bank) => (
              <Card key={bank.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        bank.currency?.code === "MXN" 
                          ? "bg-green-100 dark:bg-green-900/30" 
                          : bank.currency?.code === "USD" 
                          ? "bg-blue-100 dark:bg-blue-900/30" 
                          : "bg-primary/10"
                      }`}>
                        <Landmark className={`h-5 w-5 ${
                          bank.currency?.code === "MXN" 
                            ? "text-green-600 dark:text-green-400" 
                            : bank.currency?.code === "USD" 
                            ? "text-blue-600 dark:text-blue-400" 
                            : "text-primary"
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium">{bank.account_name || bank.bank_name}</CardTitle>
                        <CardDescription className="text-xs">{bank.bank_name}</CardDescription>
                      </div>
                    </div>
                    {bank.is_primary && (
                      <Badge variant="default" className="text-xs">Principal</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Balance prominente */}
                  <div className={`p-3 rounded-lg ${
                    bank.currency?.code === "MXN" 
                      ? "bg-green-50 dark:bg-green-950/30" 
                      : bank.currency?.code === "USD" 
                      ? "bg-blue-50 dark:bg-blue-950/30" 
                      : "bg-muted/50"
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground">Saldo Actual</p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditBalanceAccount(bank)
                          setEditInitialBalance(String(bank.initial_balance ?? 0))
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Editar saldo inicial"
                        title="Editar saldo inicial"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className={`text-xl font-bold ${
                      bank.currency?.code === "MXN" 
                        ? "text-green-600 dark:text-green-400" 
                        : bank.currency?.code === "USD" 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-foreground"
                    }`}>
                      {bank.currency?.symbol || "$"}{(bank.current_balance || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })} {bank.currency?.code || ""}
                    </p>
                  </div>

                  {/* Desglose del saldo */}
                  <div className="text-xs space-y-1 rounded-lg border p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Saldo inicial</span>
                      <span className="font-medium">
                        {bank.currency?.symbol || "$"}{(bank.initial_balance || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Facturas cobradas</span>
                      <span className="font-medium">
                        +{bank.currency?.symbol || "$"}{(bank.invoices_total || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Aportaciones de capital</span>
                      <span className="font-medium">
                        {bank.capital_total >= 0 ? "+" : "-"}{bank.currency?.symbol || "$"}{Math.abs(bank.capital_total || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>
                      {bank.account_number ? `Cuenta: ****${bank.account_number.slice(-4)}` : "Sin numero de cuenta"}
                    </div>
                    {bank.clabe && (
                      <div>CLABE: ****{bank.clabe.slice(-4)}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t">
                    <Badge variant="outline" className="text-xs">{getAccountTypeLabel(bank.account_type)}</Badge>
                    {bank.currency && (
                      <Badge variant="secondary" className="text-xs">{bank.currency.code}</Badge>
                    )}
                  </div>
                  {bank.agency && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      {bank.agency.name}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recibido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalReceived)}</div>
            <p className="text-xs text-muted-foreground">{paidInvoices.length} facturas pagadas</p>
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
            <CardTitle className="text-sm font-medium">Mes Anterior</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.lastMonth)}</div>
            <p className="text-xs text-muted-foreground">Mes pasado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crecimiento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center gap-1 ${stats.growth >= 0 ? "text-green-600" : "text-destructive"}`}>
              {stats.growth >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
              {stats.growth >= 0 ? "+" : ""}{stats.growth.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">vs mes anterior</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Ingresos</CardTitle>
          <CardDescription>Pagos recibidos registrados en Facturas y Pagos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número de factura, cliente o referencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el tiempo</SelectItem>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mes</SelectItem>
                <SelectItem value="year">Último año</SelectItem>
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
              <DollarSign className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No hay ingresos registrados</h3>
              <p className="text-muted-foreground mt-1">
                {searchTerm || selectedAgency !== "all" || dateRange !== "all"
                  ? "No se encontraron ingresos con los filtros seleccionados"
                  : "Los ingresos aparecerán aquí cuando registres pagos en Facturas y Pagos"}
              </p>
              <Button variant="link" asChild className="mt-2">
                <Link href="/dashboard/invoices">Ir a Facturas y Pagos</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Factura</TableHead>
                  <TableHead>Fecha de Pago</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div className="font-medium">{invoice.invoice_number}</div>
                      {invoice.agency && (
                        <div className="text-xs text-muted-foreground">{invoice.agency.name}</div>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(invoice.payment_date)}</TableCell>
                    <TableCell>
                      {invoice.client?.company_name || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{invoice.account?.account_name || "-"}</div>
                      {invoice.project && (
                        <div className="text-xs text-muted-foreground">{invoice.project.name}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {invoice.payment_reference || "-"}
                      </code>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium text-green-600">
                        {formatCurrency(Number(invoice.paid_amount) || Number(invoice.total_amount), invoice.currency?.code)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/invoices/${invoice.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Bank Account Dialog */}
      <Dialog open={showAddAccountDialog} onOpenChange={setShowAddAccountDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agregar Cuenta Bancaria</DialogTitle>
            <DialogDescription>
              Registra una nueva cuenta bancaria para gestionar ingresos y pagos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agency">Agencia *</Label>
                <Select
                  value={newAccount.agency_id}
                  onValueChange={(value) => setNewAccount({ ...newAccount, agency_id: value })}
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
                <Label htmlFor="currency">Moneda *</Label>
                <Select
                  value={newAccount.currency_id}
                  onValueChange={(value) => setNewAccount({ ...newAccount, currency_id: value })}
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_name">Nombre del Banco *</Label>
              <Input
                id="bank_name"
                value={newAccount.bank_name}
                onChange={(e) => setNewAccount({ ...newAccount, bank_name: e.target.value })}
                placeholder="Ej: BBVA, Santander, Banorte..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_name">Nombre de la Cuenta *</Label>
              <Input
                id="account_name"
                value={newAccount.account_name}
                onChange={(e) => setNewAccount({ ...newAccount, account_name: e.target.value })}
                placeholder="Ej: Cuenta Principal, Cuenta Nómina..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="account_number">Número de Cuenta</Label>
                <Input
                  id="account_number"
                  value={newAccount.account_number}
                  onChange={(e) => setNewAccount({ ...newAccount, account_number: e.target.value })}
                  placeholder="Últimos 4 dígitos o completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clabe">CLABE</Label>
                <Input
                  id="clabe"
                  value={newAccount.clabe}
                  onChange={(e) => setNewAccount({ ...newAccount, clabe: e.target.value })}
                  placeholder="18 dígitos"
                  maxLength={18}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="account_type">Tipo de Cuenta</Label>
                <Select
                  value={newAccount.account_type}
                  onValueChange={(value) => setNewAccount({ ...newAccount, account_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Cuenta Corriente</SelectItem>
                    <SelectItem value="savings">Cuenta de Ahorro</SelectItem>
                    <SelectItem value="investment">Inversión</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="initial_balance">Saldo Inicial</Label>
                <Input
                  id="initial_balance"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newAccount.initial_balance}
                  onChange={(e) => setNewAccount({ ...newAccount, initial_balance: e.target.value })}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">Saldo con el que arranca la cuenta.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAccountDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAccount} disabled={savingAccount}>
              {savingAccount ? "Guardando..." : "Guardar Cuenta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar saldo inicial */}
      <Dialog open={!!editBalanceAccount} onOpenChange={(open) => { if (!open) { setEditBalanceAccount(null); setEditInitialBalance("") } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Saldo Inicial</DialogTitle>
            <DialogDescription>
              {editBalanceAccount?.account_name || editBalanceAccount?.bank_name}
              {editBalanceAccount?.currency?.code ? ` · ${editBalanceAccount.currency.code}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_initial_balance">Saldo Inicial</Label>
              <Input
                id="edit_initial_balance"
                type="number"
                step="0.01"
                value={editInitialBalance}
                onChange={(e) => setEditInitialBalance(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Este monto es la base del saldo; se le suman las facturas cobradas y las aportaciones de capital.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditBalanceAccount(null); setEditInitialBalance("") }}>
              Cancelar
            </Button>
            <Button onClick={handleSaveInitialBalance} disabled={savingBalance}>
              {savingBalance ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Ingreso de capital */}
      <Dialog open={showCapitalDialog} onOpenChange={setShowCapitalDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5" />
              Ingreso de Capital
            </DialogTitle>
            <DialogDescription>
              Registra una aportación de capital y deposítala en un banco. Se sumará a su saldo y al patrimonio en Finanzas.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="capital_bank">Banco destino *</Label>
              <Select
                value={newCapital.bank_account_id}
                onValueChange={(value) => setNewCapital({ ...newCapital, bank_account_id: value })}
              >
                <SelectTrigger id="capital_bank">
                  <SelectValue placeholder="Seleccionar banco" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.account_name || bank.bank_name}
                      {bank.currency?.code ? ` (${bank.currency.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capital_amount">Monto *</Label>
                <Input
                  id="capital_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newCapital.amount}
                  onChange={(e) => setNewCapital({ ...newCapital, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capital_date">Fecha *</Label>
                <Input
                  id="capital_date"
                  type="date"
                  value={newCapital.transaction_date}
                  onChange={(e) => setNewCapital({ ...newCapital, transaction_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capital_description">Descripción</Label>
              <Textarea
                id="capital_description"
                value={newCapital.description}
                onChange={(e) => setNewCapital({ ...newCapital, description: e.target.value })}
                placeholder="Ej: Aportación de socios, inyección de capital inicial..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCapitalDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCapital} disabled={savingCapital}>
              {savingCapital ? "Guardando..." : "Registrar Capital"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
