"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import { 
  ArrowLeft, 
  Calculator, 
  DollarSign, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Pencil,
  Save,
  FileText,
  Wallet,
  Settings
} from "lucide-react"
import { toast } from "sonner"

interface PayrollPeriod {
  id: string
  period_name: string
  period_type: string
  start_date: string
  end_date: string
  payment_date: string | null
  status: string
  total_gross: number
  total_deductions: number
  total_net: number
  notes: string | null
  agency_id: string | null
  agency: {
    id: string
    name: string
  } | null
}

interface Staff {
  id: string
  first_name: string
  last_name: string
  position: string
  monthly_salary: number | null
  hourly_cost: number | null
  contract_type: string
  payment_frequency: string | null
  is_active: boolean
  agency_id: string | null
}

interface CommissionItem {
  id: string
  commission_type: string
  description: string | null
  commission_amount: number
  period_date: string | null
  created_at: string
  status: string
}

interface PayrollEntry {
  staff_id: string
  staff: Staff
  base_salary: number
  bonuses: number
  commissions: number
  commissionItems: CommissionItem[]
  deductions: number
  taxes: number
  gross_pay: number
  net_pay: number
}

const commissionTypeLabels: Record<string, string> = {
  appointment: "Por Cita",
  client: "Por Cliente",
  project: "Proyecto",
  sale: "Venta",
  retention: "Retención",
  referral: "Referido",
  other: "Otro",
}

const statusLabels: Record<string, string> = {
  draft: "Borrador",
  calculating: "Calculando",
  approved: "Aprobada",
  paid: "Pagada",
  cancelled: "Cancelada",
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  calculating: "outline",
  approved: "default",
  paid: "default",
  cancelled: "destructive",
}

export default function PayrollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [period, setPeriod] = useState<PayrollPeriod | null>(null)
  const [entries, setEntries] = useState<PayrollEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [editingEntry, setEditingEntry] = useState<PayrollEntry | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [commissionDetailEntry, setCommissionDetailEntry] = useState<PayrollEntry | null>(null)
  const [includeGlobalStaff, setIncludeGlobalStaff] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [payrollConfig, setPayrollConfig] = useState({
    taxRate: 10, // Percentage
    imssRate: 3, // IMSS percentage
    isrRate: 0, // ISR percentage (calculated separately)
    otherDeductions: 0, // Fixed amount
  })

  useEffect(() => {
    fetchData()
  }, [resolvedParams.id, includeGlobalStaff])

  const fetchData = async () => {
    try {
      // Fetch period
      const { data: periodData, error: periodError } = await supabase
        .from("payroll_periods")
        .select(`
          *,
          agency:agencies(id, name)
        `)
        .eq("id", resolvedParams.id)
        .single()

      if (periodError) throw periodError
      setPeriod(periodData)

      // Un periodo GLOBAL no tiene agencia (agency_id null) => incluye a todo el personal
      const isGlobalPeriod = !periodData.agency_id

      // Fetch staff for this agency (and optionally global staff)
      let staffQuery = supabase
        .from("staff")
        .select("*")
        .eq("is_active", true)
        .order("first_name")

      if (isGlobalPeriod) {
        // Periodo global: todo el personal activo de todas las agencias (sin filtrar)
      } else if (includeGlobalStaff) {
        // Include agency staff AND global staff (agency_id is null)
        staffQuery = staffQuery.or(`agency_id.eq.${periodData.agency_id},agency_id.is.null`)
      } else {
        // Only agency staff
        staffQuery = staffQuery.eq("agency_id", periodData.agency_id)
      }

      const { data: staffData, error: staffError } = await staffQuery

      if (staffError) throw staffError

      // Obtener bonos y comisiones (del apartado Comercial) aplicables al periodo.
      // Se consideran solo los aprobados o pagados cuya fecha cae dentro del periodo.
      // Nota: usamos la fecha efectiva y, si es nula, la fecha de creación como
      // respaldo, y filtramos en JS para no excluir registros con fecha nula.
      const staffIds = (staffData || []).map((s) => s.id)
      const bonusesByStaff: Record<string, number> = {}
      const commissionsByStaff: Record<string, number> = {}
      const commissionItemsByStaff: Record<string, CommissionItem[]> = {}

      const start = periodData.start_date // YYYY-MM-DD
      const end = periodData.end_date // YYYY-MM-DD
      const inPeriod = (dateStr: string | null | undefined, fallback: string | null | undefined) => {
        const raw = dateStr || fallback
        if (!raw) return false
        const d = String(raw).slice(0, 10) // normaliza date/timestamp a YYYY-MM-DD
        return d >= start && d <= end
      }

      if (staffIds.length > 0) {
        const [bonusesRes, commissionsRes] = await Promise.all([
          supabase
            .from("bonuses")
            .select("staff_id, amount, benefit_type, status, effective_date, created_at")
            .in("staff_id", staffIds)
            .in("status", ["approved", "paid"]),
          supabase
            .from("commissions")
            .select("id, staff_id, commission_type, description, commission_amount, status, period_date, created_at")
            .in("staff_id", staffIds)
            .in("status", ["approved", "paid"]),
        ])

        for (const b of bonusesRes.data || []) {
          // Los bonos de "días libres" no representan un monto en dinero
          if (b.benefit_type === "free_days") continue
          if (!inPeriod(b.effective_date, b.created_at)) continue
          bonusesByStaff[b.staff_id] = (bonusesByStaff[b.staff_id] || 0) + Number(b.amount || 0)
        }
        for (const c of commissionsRes.data || []) {
          if (!inPeriod(c.period_date, c.created_at)) continue
          commissionsByStaff[c.staff_id] =
            (commissionsByStaff[c.staff_id] || 0) + Number(c.commission_amount || 0)
          if (!commissionItemsByStaff[c.staff_id]) commissionItemsByStaff[c.staff_id] = []
          commissionItemsByStaff[c.staff_id].push({
            id: c.id,
            commission_type: c.commission_type,
            description: c.description,
            commission_amount: Number(c.commission_amount || 0),
            period_date: c.period_date,
            created_at: c.created_at,
            status: c.status,
          })
        }
      }

      // Create entries from staff data
      const payrollEntries: PayrollEntry[] = (staffData || []).map(staff => {
        const baseSalary = calculateBaseSalary(staff, periodData.period_type, periodData.start_date)
        const bonuses = bonusesByStaff[staff.id] || 0
        const commissions = commissionsByStaff[staff.id] || 0
        const deductions = 0
        const grossPay = baseSalary + bonuses + commissions
        const taxes = grossPay * 0.10 // 10% tax estimate
        const netPay = grossPay - deductions - taxes

        return {
          staff_id: staff.id,
          staff: staff,
          base_salary: baseSalary,
          bonuses: bonuses,
          commissions: commissions,
          commissionItems: commissionItemsByStaff[staff.id] || [],
          deductions: deductions,
          taxes: taxes,
          gross_pay: grossPay,
          net_pay: netPay,
        }
      })

      setEntries(payrollEntries)

      // If there are entries, calculate and display totals from the entries
      if (payrollEntries.length > 0) {
        const totalGross = payrollEntries.reduce((sum, e) => sum + e.gross_pay, 0)
        const totalDeductions = payrollEntries.reduce((sum, e) => sum + e.deductions + e.taxes, 0)
        const totalNet = payrollEntries.reduce((sum, e) => sum + e.net_pay, 0)
        
        // Update the period state with calculated totals for display
        setPeriod({
          ...periodData,
          total_gross: totalGross,
          total_deductions: totalDeductions,
          total_net: totalNet,
        })
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  const calculateBaseSalary = (staff: Staff, periodType: string, startDate?: string | null): number => {
    const monthlySalary = staff.monthly_salary || 0
    // Frecuencia de pago del colaborador (por defecto quincenal).
    const frequency = staff.payment_frequency || "biweekly"

    switch (periodType) {
      case "semanal":
        return monthlySalary / 4
      case "quincenal": {
        // ¿Es la primera o la segunda quincena? Se infiere del día de inicio.
        const startDay = startDate ? new Date(startDate).getUTCDate() : 1
        const isFirstHalf = startDay <= 15
        if (frequency === "monthly") {
          // A los mensuales se les paga solo en la segunda quincena (fin de mes).
          return isFirstHalf ? 0 : monthlySalary
        }
        // A los quincenales se les paga el 50% en cada quincena.
        return monthlySalary / 2
      }
      case "mensual":
        return monthlySalary
      default:
        return monthlySalary
    }
  }

  const handleCalculatePayroll = async () => {
    if (!period) return
    
    setCalculating(true)
    try {
      // Recalculate all entries with configured tax rates
      const totalTaxRate = (payrollConfig.taxRate + payrollConfig.imssRate + payrollConfig.isrRate) / 100
      
      const updatedEntries = entries.map(entry => {
        const baseSalary = calculateBaseSalary(entry.staff, period.period_type, period.start_date)
        const grossPay = baseSalary + entry.bonuses + entry.commissions
        const taxes = grossPay * totalTaxRate
        const totalDeductions = entry.deductions + payrollConfig.otherDeductions
        const netPay = grossPay - totalDeductions - taxes

        return {
          ...entry,
          base_salary: baseSalary,
          taxes: taxes,
          gross_pay: grossPay,
          net_pay: netPay,
          deductions: totalDeductions,
        }
      })

      setEntries(updatedEntries)

      // Calculate totals
      const totalGross = updatedEntries.reduce((sum, e) => sum + e.gross_pay, 0)
      const totalDeductions = updatedEntries.reduce((sum, e) => sum + e.deductions + e.taxes, 0)
      const totalNet = updatedEntries.reduce((sum, e) => sum + e.net_pay, 0)

      // Update period totals
      const { error } = await supabase
        .from("payroll_periods")
        .update({
          total_gross: totalGross,
          total_deductions: totalDeductions,
          total_net: totalNet,
          status: "calculating",
        })
        .eq("id", period.id)

      if (error) throw error

      setPeriod({
        ...period,
        total_gross: totalGross,
        total_deductions: totalDeductions,
        total_net: totalNet,
        status: "calculating",
      })

      toast.success("Nómina calculada exitosamente")
    } catch (error) {
      console.error("Error calculating payroll:", error)
      toast.error("Error al calcular la nómina")
    } finally {
      setCalculating(false)
    }
  }

  const handleApprovePayroll = async () => {
    if (!period) return

    try {
      const { error } = await supabase
        .from("payroll_periods")
        .update({ status: "approved" })
        .eq("id", period.id)

      if (error) throw error

      setPeriod({ ...period, status: "approved" })
      toast.success("Nómina aprobada")
    } catch (error) {
      console.error("Error approving payroll:", error)
      toast.error("Error al aprobar la nómina")
    }
  }

  const handleMarkAsPaid = async () => {
    if (!period) return

    try {
      const { error } = await supabase
        .from("payroll_periods")
        .update({ status: "paid" })
        .eq("id", period.id)

      if (error) throw error

      setPeriod({ ...period, status: "paid" })
      toast.success("Nómina marcada como pagada")
    } catch (error) {
      console.error("Error marking as paid:", error)
      toast.error("Error al marcar como pagada")
    }
  }

  const handleEditEntry = (entry: PayrollEntry) => {
    setEditingEntry({ ...entry })
    setShowEditDialog(true)
  }

  const handleSaveEntry = () => {
    if (!editingEntry) return

    // Recalculate entry totals with configured tax rates
    const totalTaxRate = (payrollConfig.taxRate + payrollConfig.imssRate + payrollConfig.isrRate) / 100
    const grossPay = editingEntry.base_salary + editingEntry.bonuses + editingEntry.commissions
    const taxes = grossPay * totalTaxRate
    const netPay = grossPay - editingEntry.deductions - taxes

    const updatedEntry = {
      ...editingEntry,
      gross_pay: grossPay,
      taxes: taxes,
      net_pay: netPay,
    }

    setEntries(entries.map(e => 
      e.staff_id === updatedEntry.staff_id ? updatedEntry : e
    ))

    setShowEditDialog(false)
    setEditingEntry(null)
    toast.success("Entrada actualizada")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC"
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!period) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Periodo no encontrado</p>
        <Button asChild>
          <Link href="/dashboard/hr/payroll">Volver a Nómina</Link>
        </Button>
      </div>
    )
  }

  // Calculate totals from entries
  const calculatedTotals = {
    gross: entries.reduce((sum, e) => sum + e.gross_pay, 0),
    deductions: entries.reduce((sum, e) => sum + e.deductions + e.taxes, 0),
    net: entries.reduce((sum, e) => sum + e.net_pay, 0),
  }
  const employeesWithoutSalary = entries.filter(e => !e.staff.monthly_salary || e.staff.monthly_salary === 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/hr/payroll">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{period.period_name}</h1>
              <Badge variant={statusColors[period.status]}>
                {statusLabels[period.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {period.agency?.name || "Global (todas las agencias)"} • {formatDate(period.start_date)} - {formatDate(period.end_date)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(period.status === "draft" || period.status === "calculating") && (
            <Button variant="outline" onClick={() => setShowConfigDialog(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Configurar Impuestos
            </Button>
          )}
          {period.status === "draft" && (
            <Button onClick={handleCalculatePayroll} disabled={calculating}>
              {calculating ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <Calculator className="mr-2 h-4 w-4" />
              )}
              Calcular Nómina
            </Button>
          )}
          {period.status === "calculating" && (
            <>
              <Button variant="outline" onClick={handleCalculatePayroll} disabled={calculating}>
                {calculating ? (
                  <Spinner className="mr-2 h-4 w-4" />
                ) : (
                  <Calculator className="mr-2 h-4 w-4" />
                )}
                Recalcular
              </Button>
              <Button onClick={handleApprovePayroll}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprobar
              </Button>
            </>
          )}
          {period.status === "approved" && (
            <Button onClick={handleMarkAsPaid}>
              <Wallet className="mr-2 h-4 w-4" />
              Marcar como Pagada
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empleados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entries.length}</div>
            <p className="text-xs text-muted-foreground">En este periodo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bruto</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(calculatedTotals.gross)}</div>
            <p className="text-xs text-muted-foreground">Antes de deducciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deducciones</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(calculatedTotals.deductions)}</div>
            <p className="text-xs text-muted-foreground">Impuestos y descuentos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Neto</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(calculatedTotals.net)}</div>
            <p className="text-xs text-muted-foreground">A pagar</p>
          </CardContent>
        </Card>
      </div>

      {/* Warning for employees without salary */}
      {employeesWithoutSalary.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                {employeesWithoutSalary.length} empleado(s) sin salario configurado
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Los siguientes empleados no tienen salario mensual: {employeesWithoutSalary.map(e => `${e.staff.first_name} ${e.staff.last_name}`).join(", ")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detalle de Nómina</CardTitle>
              <CardDescription>
                Revisa y ajusta los pagos de cada empleado
              </CardDescription>
            </div>
            {period.agency_id ? (
              <div className="flex items-center gap-2">
                <Switch
                  id="include-global"
                  checked={includeGlobalStaff}
                  onCheckedChange={setIncludeGlobalStaff}
                />
                <Label htmlFor="include-global" className="text-sm">
                  Incluir personal global
                </Label>
              </div>
            ) : (
              <Badge variant="secondary">Todas las agencias</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {entries.some((e) => e.commissionItems.length > 0) && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
              <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Se incluyen{" "}
                <span className="font-semibold">
                  {formatCurrency(entries.reduce((sum, e) => sum + e.commissions, 0))}
                </span>{" "}
                en comisiones del apartado <span className="font-medium">Comercial</span> (aprobadas o pagadas) que
                caen dentro de este periodo. Las comisiones se pagan{" "}
                <span className="font-medium">quincenalmente</span>. Haz clic en el monto de un colaborador para ver el
                desglose.
              </p>
            </div>
          )}
          {entries.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay empleados activos en esta agencia</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Puesto</TableHead>
                  <TableHead className="text-right">Salario Base</TableHead>
                  <TableHead className="text-right">Bonos</TableHead>
                  <TableHead className="text-right">Comisiones</TableHead>
                  <TableHead className="text-right">Deducciones</TableHead>
                  <TableHead className="text-right">Impuestos</TableHead>
                  <TableHead className="text-right">Bruto</TableHead>
                  <TableHead className="text-right">Neto</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.staff_id}>
                    <TableCell className="font-medium">
                      {entry.staff.first_name} {entry.staff.last_name}
                      {entry.staff.agency_id === null && (
                        <Badge variant="outline" className="ml-2 text-xs">Global</Badge>
                      )}
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {entry.staff.payment_frequency === "monthly" ? "Mensual" : "Quincenal"}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.staff.position}</TableCell>
                    <TableCell className="text-right">{formatCurrency(entry.base_salary)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(entry.bonuses)}</TableCell>
                    <TableCell className="text-right text-blue-600">
                      {entry.commissionItems.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setCommissionDetailEntry(entry)}
                          className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 hover:text-blue-800"
                          title="Ver detalle de comisiones"
                        >
                          {formatCurrency(entry.commissions)}
                          <Badge variant="secondary" className="text-[10px]">
                            {entry.commissionItems.length}
                          </Badge>
                        </button>
                      ) : (
                        formatCurrency(entry.commissions)
                      )}
                    </TableCell>
                    <TableCell className="text-right text-red-600">-{formatCurrency(entry.deductions)}</TableCell>
                    <TableCell className="text-right text-red-600">-{formatCurrency(entry.taxes)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(entry.gross_pay)}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">{formatCurrency(entry.net_pay)}</TableCell>
                    <TableCell>
                      {(period.status === "draft" || period.status === "calculating") && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditEntry(entry)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Entry Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Pago</DialogTitle>
            <DialogDescription>
              {editingEntry?.staff.first_name} {editingEntry?.staff.last_name}
            </DialogDescription>
          </DialogHeader>
          {editingEntry && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Salario Base</Label>
                  <Input
                    type="number"
                    value={editingEntry.base_salary}
                    onChange={(e) => setEditingEntry({
                      ...editingEntry,
                      base_salary: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bonos</Label>
                  <Input
                    type="number"
                    value={editingEntry.bonuses}
                    onChange={(e) => setEditingEntry({
                      ...editingEntry,
                      bonuses: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Comisiones</Label>
                  <Input
                    type="number"
                    value={editingEntry.commissions}
                    onChange={(e) => setEditingEntry({
                      ...editingEntry,
                      commissions: parseFloat(e.target.value) || 0
                    })}
                  />
                  <p className="text-xs text-muted-foreground">Citas y ventas</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Deducciones</Label>
                  <Input
                    type="number"
                    value={editingEntry.deductions}
                    onChange={(e) => setEditingEntry({
                      ...editingEntry,
                      deductions: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
              </div>
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Bruto Estimado:</span>
                  <span className="font-medium">
                    {formatCurrency(editingEntry.base_salary + editingEntry.bonuses + editingEntry.commissions)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Impuestos ({payrollConfig.taxRate + payrollConfig.imssRate + payrollConfig.isrRate}%):</span>
                  <span className="text-red-600">
                    -{formatCurrency((editingEntry.base_salary + editingEntry.bonuses + editingEntry.commissions) * ((payrollConfig.taxRate + payrollConfig.imssRate + payrollConfig.isrRate) / 100))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Deducciones:</span>
                  <span className="text-red-600">-{formatCurrency(editingEntry.deductions)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Neto a Pagar:</span>
                  <span className="text-green-600">
                    {formatCurrency(
                      (editingEntry.base_salary + editingEntry.bonuses + editingEntry.commissions) * (1 - (payrollConfig.taxRate + payrollConfig.imssRate + payrollConfig.isrRate) / 100) 
                      - editingEntry.deductions
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEntry}>
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Commission Detail Dialog */}
      <Dialog open={!!commissionDetailEntry} onOpenChange={(open) => !open && setCommissionDetailEntry(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle de comisiones</DialogTitle>
            <DialogDescription>
              {commissionDetailEntry?.staff.first_name} {commissionDetailEntry?.staff.last_name} · Comisiones del
              apartado Comercial incluidas en esta quincena
            </DialogDescription>
          </DialogHeader>
          {commissionDetailEntry && (
            <div className="space-y-3">
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {commissionDetailEntry.commissionItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {commissionTypeLabels[item.commission_type] || item.commission_type}
                        </Badge>
                        <Badge
                          variant={item.status === "paid" ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {item.status === "paid" ? "Pagada" : "Aprobada"}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="mt-1 truncate text-sm text-muted-foreground">{item.description}</p>
                      )}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(item.period_date || item.created_at)}
                      </p>
                    </div>
                    <span className="shrink-0 font-medium text-blue-600">
                      {formatCurrency(item.commission_amount)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t pt-3 font-bold">
                <span>Total comisiones</span>
                <span className="text-blue-600">{formatCurrency(commissionDetailEntry.commissions)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommissionDetailEntry(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Config Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Impuestos y Deducciones</DialogTitle>
            <DialogDescription>
              Define las tasas de impuestos y deducciones generales para este periodo de nómina
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxRate">Impuesto General (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={payrollConfig.taxRate}
                  onChange={(e) => setPayrollConfig({
                    ...payrollConfig,
                    taxRate: parseFloat(e.target.value) || 0
                  })}
                />
                <p className="text-xs text-muted-foreground">Tasa de impuesto base</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="imssRate">IMSS (%)</Label>
                <Input
                  id="imssRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={payrollConfig.imssRate}
                  onChange={(e) => setPayrollConfig({
                    ...payrollConfig,
                    imssRate: parseFloat(e.target.value) || 0
                  })}
                />
                <p className="text-xs text-muted-foreground">Seguro Social</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="isrRate">ISR (%)</Label>
                <Input
                  id="isrRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={payrollConfig.isrRate}
                  onChange={(e) => setPayrollConfig({
                    ...payrollConfig,
                    isrRate: parseFloat(e.target.value) || 0
                  })}
                />
                <p className="text-xs text-muted-foreground">Impuesto Sobre la Renta</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="otherDeductions">Otras Deducciones Fijas ($)</Label>
                <Input
                  id="otherDeductions"
                  type="number"
                  min="0"
                  step="0.01"
                  value={payrollConfig.otherDeductions}
                  onChange={(e) => setPayrollConfig({
                    ...payrollConfig,
                    otherDeductions: parseFloat(e.target.value) || 0
                  })}
                />
                <p className="text-xs text-muted-foreground">Monto fijo por empleado</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total de Impuestos:</span>
                <Badge variant="secondary" className="text-lg">
                  {payrollConfig.taxRate + payrollConfig.imssRate + payrollConfig.isrRate}%
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Este porcentaje se aplicará sobre el salario bruto de cada empleado
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              setShowConfigDialog(false)
              toast.success("Configuración guardada. Recalcula la nómina para aplicar los cambios.")
            }}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Configuración
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
