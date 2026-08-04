"use client"

import { useState, useEffect, use, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { upload } from "@vercel/blob/client"
import { createClient } from "@/lib/supabase/client"
import { usePermissions } from "@/components/dashboard/permissions-provider"
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
  Settings,
  Upload,
  Paperclip,
  X
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
  // Concepto de pago (mismo para toda la nómina), editable al crear la nómina.
  payment_concept: string | null
  // Ajuste de impuestos/deducciones guardado para este periodo (se conserva
  // para que quien apruebe vea lo previamente configurado).
  tax_config: {
    taxRate: number
    imssRate: number
    isrRate: number
    otherDeductions: number
  } | null
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
  employment_status: string | null
  hire_date: string | null
  status_change_date: string | null
  finiquito: number | null
  finiquito_paid_at: string | null
  // Información de pagos (de RRHH > Personal > Información de pagos)
  bank_name: string | null
  bank_clabe: string | null
  bank_account_number: string | null
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

interface LoanDeductionItem {
  loan_id: string
  loan_number: string | null
  loan_type: string | null
  // Monto a descontar en este periodo (normalmente la parcialidad del préstamo).
  amount: number
  // Número de la siguiente parcialidad a registrar.
  payment_number: number
  remaining_balance: number
  amount_paid: number
  number_of_payments: number
  payments_made: number
}

interface PayrollEntry {
  staff_id: string
  staff: Staff
  base_salary: number
  bonuses: number
  commissions: number
  commissionItems: CommissionItem[]
  finiquito: number
  // Descuento de préstamos (del apartado Préstamos) aplicable a este periodo.
  loanDeductions: number
  loanItems: LoanDeductionItem[]
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
  // Solo super administrador y director general pueden aprobar nóminas.
  const { roleName } = usePermissions()
  const canApprovePayroll = roleName === "superadmin" || roleName === "direccion_general"
  const [period, setPeriod] = useState<PayrollPeriod | null>(null)
  const [entries, setEntries] = useState<PayrollEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [editingEntry, setEditingEntry] = useState<PayrollEntry | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [commissionDetailEntry, setCommissionDetailEntry] = useState<PayrollEntry | null>(null)
  const [loanDetailEntry, setLoanDetailEntry] = useState<PayrollEntry | null>(null)
  const [includeGlobalStaff, setIncludeGlobalStaff] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [payrollConfig, setPayrollConfig] = useState({
    taxRate: 10, // Percentage
    imssRate: 3, // IMSS percentage
    isrRate: 0, // ISR percentage (calculated separately)
    otherDeductions: 0, // Fixed amount
  })
  // Comprobantes de pago por empleado (staff_id -> { file_path, file_name }).
  const [receipts, setReceipts] = useState<Record<string, { file_path: string; file_name: string | null }>>({})
  // staff_id que está subiendo actualmente su comprobante.
  const [uploadingStaffId, setUploadingStaffId] = useState<string | null>(null)
  const receiptInputRef = useRef<HTMLInputElement>(null)
  // staff_id objetivo del input de archivo (se establece antes de abrir el selector).
  const [receiptTargetStaffId, setReceiptTargetStaffId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [resolvedParams.id, includeGlobalStaff])

  // Carga los comprobantes de pago guardados para este periodo.
  const fetchReceipts = async () => {
    const { data, error } = await supabase
      .from("payroll_payment_receipts")
      .select("staff_id, file_path, file_name")
      .eq("period_id", resolvedParams.id)
    if (error) {
      console.error("Error fetching payroll receipts:", error)
      return
    }
    const map: Record<string, { file_path: string; file_name: string | null }> = {}
    ;(data || []).forEach((r) => {
      map[r.staff_id] = { file_path: r.file_path, file_name: r.file_name }
    })
    setReceipts(map)
  }

  useEffect(() => {
    fetchReceipts()
  }, [resolvedParams.id])

  // Abre el selector de archivos para el empleado indicado.
  const openReceiptPicker = (staffId: string) => {
    setReceiptTargetStaffId(staffId)
    receiptInputRef.current?.click()
  }

  // Sube el comprobante a Blob (privado) y lo guarda por empleado/periodo.
  const handleReceiptSelected = async (file: File) => {
    const staffId = receiptTargetStaffId
    if (!staffId) return
    setUploadingStaffId(staffId)
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      const blob = await upload(`payroll-receipts/${resolvedParams.id}/${staffId}-${Date.now()}-${safeName}`, file, {
        access: "private",
        handleUploadUrl: "/api/payroll/receipt/upload",
        contentType: file.type,
      })
      // Store privado: guardamos el pathname para servirlo vía /api/file.
      const pathname = blob.url.split(".vercel-storage.com/")[1] || blob.url
      // Upsert por (period_id, staff_id).
      const { error } = await supabase
        .from("payroll_payment_receipts")
        .upsert(
          { period_id: resolvedParams.id, staff_id: staffId, file_path: pathname, file_name: file.name },
          { onConflict: "period_id,staff_id" },
        )
      if (error) throw error
      setReceipts((prev) => ({ ...prev, [staffId]: { file_path: pathname, file_name: file.name } }))
      toast.success("Comprobante adjuntado")
    } catch (error) {
      console.error("Error uploading payroll receipt:", error)
      toast.error("Error al subir el comprobante. Verifica que sea PDF o imagen (máx 25MB).")
    } finally {
      setUploadingStaffId(null)
      setReceiptTargetStaffId(null)
      if (receiptInputRef.current) receiptInputRef.current.value = ""
    }
  }

  // Elimina el comprobante adjunto de un empleado.
  const handleRemoveReceipt = async (staffId: string) => {
    try {
      const { error } = await supabase
        .from("payroll_payment_receipts")
        .delete()
        .eq("period_id", resolvedParams.id)
        .eq("staff_id", staffId)
      if (error) throw error
      setReceipts((prev) => {
        const next = { ...prev }
        delete next[staffId]
        return next
      })
      toast.success("Comprobante eliminado")
    } catch (error) {
      console.error("Error removing payroll receipt:", error)
      toast.error("Error al eliminar el comprobante")
    }
  }

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

      // Config de impuestos guardada para este periodo. Si existe, se usa tal cual
      // (para que quien apruebe vea lo previamente configurado); si no, se usan
      // los valores por defecto.
      const savedConfig = periodData.tax_config
      const config = {
        taxRate: savedConfig?.taxRate ?? 10,
        imssRate: savedConfig?.imssRate ?? 3,
        isrRate: savedConfig?.isrRate ?? 0,
        otherDeductions: savedConfig?.otherDeductions ?? 0,
      }
      setPayrollConfig(config)

      // Un periodo GLOBAL no tiene agencia (agency_id null) => incluye a todo el personal
      const isGlobalPeriod = !periodData.agency_id

      // Fetch staff for this agency (and optionally global staff).
      // No filtramos por is_active en la consulta: incluimos también a las
      // bajas para poder liquidar su finiquito pendiente (se filtra en JS).
      let staffQuery = supabase
        .from("staff")
        .select("*")
        .order("first_name")

      if (isGlobalPeriod) {
        // Periodo global: todo el personal de todas las agencias (sin filtrar)
      } else if (includeGlobalStaff) {
        // Include agency staff AND global staff (agency_id is null)
        staffQuery = staffQuery.or(`agency_id.eq.${periodData.agency_id},agency_id.is.null`)
      } else {
        // Only agency staff
        staffQuery = staffQuery.eq("agency_id", periodData.agency_id)
      }

      const { data: staffRaw, error: staffError } = await staffQuery

      if (staffError) throw staffError

      // Regla de inclusión:
      //  - Personal activo: siempre se incluye.
      //  - Personal dado de baja/inactivo/suspendido DURANTE el periodo: se incluye
      //    para pagarle la parte proporcional de los días trabajados en el mes.
      //  - Personal en baja con finiquito pendiente (> 0 y no pagado): se incluye
      //    para liquidarlo. El resto de bajas anteriores al periodo se omite.
      const staffData = (staffRaw || []).filter((s) => {
        if (s.is_active) return true
        const hasFiniquito = Number(s.finiquito) > 0 && !s.finiquito_paid_at
        const changed = s.status_change_date
        const leftDuringPeriod =
          !!changed && changed >= periodData.start_date && changed <= periodData.end_date
        return hasFiniquito || leftDuringPeriod
      })

      // Obtener bonos y comisiones (del apartado Comercial) aplicables al periodo.
      // Se consideran solo los aprobados o pagados cuya fecha cae dentro del periodo.
      // Nota: usamos la fecha efectiva y, si es nula, la fecha de creación como
      // respaldo, y filtramos en JS para no excluir registros con fecha nula.
      const staffIds = (staffData || []).map((s) => s.id)
      const bonusesByStaff: Record<string, number> = {}
      const commissionsByStaff: Record<string, number> = {}
      const commissionItemsByStaff: Record<string, CommissionItem[]> = {}
      // Descuentos de préstamos activos (del apartado Préstamos) por colaborador.
      const loanDeductionsByStaff: Record<string, number> = {}
      const loanItemsByStaff: Record<string, LoanDeductionItem[]> = {}

      const start = periodData.start_date // YYYY-MM-DD
      const end = periodData.end_date // YYYY-MM-DD
      const inPeriod = (dateStr: string | null | undefined, fallback: string | null | undefined) => {
        const raw = dateStr || fallback
        if (!raw) return false
        const d = String(raw).slice(0, 10) // normaliza date/timestamp a YYYY-MM-DD
        return d >= start && d <= end
      }

      if (staffIds.length > 0) {
        const [bonusesRes, commissionsRes, loansRes] = await Promise.all([
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
          // Préstamos vigentes (activos/aprobados) con saldo pendiente.
          supabase
            .from("loans")
            .select(
              "id, staff_id, loan_number, loan_type, payment_amount, number_of_payments, payments_made, amount_paid, remaining_balance, status",
            )
            .in("staff_id", staffIds)
            .in("status", ["active", "approved"]),
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

        for (const l of loansRes.data || []) {
          const remaining = Number(l.remaining_balance ?? 0)
          if (remaining <= 0) continue
          // La parcialidad a descontar; nunca más que el saldo restante.
          const amount = Math.min(Number(l.payment_amount || 0), remaining)
          if (amount <= 0) continue
          loanDeductionsByStaff[l.staff_id] = (loanDeductionsByStaff[l.staff_id] || 0) + amount
          if (!loanItemsByStaff[l.staff_id]) loanItemsByStaff[l.staff_id] = []
          loanItemsByStaff[l.staff_id].push({
            loan_id: l.id,
            loan_number: l.loan_number,
            loan_type: l.loan_type,
            amount,
            payment_number: Number(l.payments_made || 0) + 1,
            remaining_balance: remaining,
            amount_paid: Number(l.amount_paid || 0),
            number_of_payments: Number(l.number_of_payments || 0),
            payments_made: Number(l.payments_made || 0),
          })
        }
      }

      // Create entries from staff data
      const payrollEntries: PayrollEntry[] = (staffData || []).map(staff => {
        const baseSalary = calculateBaseSalary(staff, periodData.period_type, periodData.start_date, periodData.end_date)
        const bonuses = bonusesByStaff[staff.id] || 0
        const commissions = commissionsByStaff[staff.id] || 0
        // Finiquito pendiente de la baja (último pago). Se liquida una sola vez.
        const finiquito =
          staff.employment_status === "terminated" && !staff.finiquito_paid_at
            ? Number(staff.finiquito || 0)
            : 0
        // Deducciones fijas configuradas para el periodo (aplicadas a cada entrada).
        const deductions = config.otherDeductions
        const loanDeductions = loanDeductionsByStaff[staff.id] || 0
        const grossPay = baseSalary + bonuses + commissions + finiquito
        // Impuestos según la config guardada del periodo.
        const taxes = grossPay * ((config.taxRate + config.imssRate + config.isrRate) / 100)
        const netPay = grossPay - deductions - loanDeductions - taxes

        return {
          staff_id: staff.id,
          staff: staff,
          base_salary: baseSalary,
          bonuses: bonuses,
          commissions: commissions,
          commissionItems: commissionItemsByStaff[staff.id] || [],
          finiquito: finiquito,
          loanDeductions: loanDeductions,
          loanItems: loanItemsByStaff[staff.id] || [],
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
        const totalDeductions = payrollEntries.reduce((sum, e) => sum + e.deductions + e.loanDeductions + e.taxes, 0)
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

  const calculateBaseSalary = (
    staff: Staff,
    periodType: string,
    startDate?: string | null,
    endDate?: string | null,
  ): number => {
    const monthlySalary = staff.monthly_salary || 0
    // Frecuencia de pago del colaborador (por defecto quincenal).
    const frequency = staff.payment_frequency || "biweekly"
    // Tarifa diaria según la regla del negocio: sueldo mensual / 30.5.
    const dailyRate = monthlySalary / 30.5

    const parseDate = (s?: string | null) => (s ? new Date(s + "T00:00:00Z") : null)
    const daysInclusive = (a: Date, b: Date) =>
      Math.floor((b.getTime() - a.getTime()) / 86400000) + 1

    const periodStart = parseDate(startDate)
    const periodEnd = parseDate(endDate)
    const hire = parseDate(staff.hire_date)
    // Fecha de salida: solo si la persona ya no está activa y tiene fecha de cambio de estado.
    const exit = !staff.is_active && staff.status_change_date ? parseDate(staff.status_change_date) : null

    // Sueldo estándar de periodo completo (comportamiento original).
    const standardSalary = (): number => {
      switch (periodType) {
        case "semanal":
          return monthlySalary / 4
        case "quincenal": {
          const startDay = periodStart ? periodStart.getUTCDate() : 1
          const isFirstHalf = startDay <= 15
          if (frequency === "monthly") return isFirstHalf ? 0 : monthlySalary
          return monthlySalary / 2
        }
        case "mensual":
          return monthlySalary
        default:
          return monthlySalary
      }
    }

    // A los mensuales se les paga el mes completo en una sola exhibición (fin de mes).
    // Su prorrateo se calcula sobre los días trabajados en TODO el mes.
    if (frequency === "monthly") {
      if (periodType === "quincenal" && periodStart && periodStart.getUTCDate() <= 15) {
        // Primera quincena: el pago del mensual va en la segunda quincena.
        return 0
      }
      const ref = periodEnd || periodStart
      if (!ref) return monthlySalary
      const monthStart = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1))
      const monthEnd = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 0))
      const isPartial = (hire && hire > monthStart) || (exit && exit < monthEnd)
      if (!isPartial) return monthlySalary
      const activeStart = hire && hire > monthStart ? hire : monthStart
      const activeEnd = exit && exit < monthEnd ? exit : monthEnd
      if (activeEnd < activeStart) return 0
      return Math.round(dailyRate * daysInclusive(activeStart, activeEnd) * 100) / 100
    }

    // Semanal / quincenal: se prorratea por los días trabajados DENTRO del periodo
    // cuando la persona entró o salió a mitad del periodo.
    if (periodStart && periodEnd) {
      const isPartial = (hire && hire > periodStart) || (exit && exit < periodEnd)
      if (isPartial) {
        const activeStart = hire && hire > periodStart ? hire : periodStart
        const activeEnd = exit && exit < periodEnd ? exit : periodEnd
        if (activeEnd < activeStart) return 0
        return Math.round(dailyRate * daysInclusive(activeStart, activeEnd) * 100) / 100
      }
    }

    return standardSalary()
  }

  // Guarda el ajuste de impuestos/deducciones en el periodo para que se conserve
  // (no se reinicia) y quien apruebe vea lo previamente configurado.
  const handleSaveConfig = async () => {
    if (!period) return
    try {
      const { error } = await supabase
        .from("payroll_periods")
        .update({ tax_config: payrollConfig })
        .eq("id", period.id)
      if (error) throw error
      setPeriod({ ...period, tax_config: payrollConfig })
      setShowConfigDialog(false)
      toast.success("Configuración guardada. Recalcula la nómina para aplicar los cambios.")
    } catch (error) {
      console.error("Error saving payroll config:", error)
      toast.error("Error al guardar la configuración")
    }
  }

  const handleCalculatePayroll = async () => {
    if (!period) return
    
    setCalculating(true)
    try {
      // Recalculate all entries with configured tax rates
      const totalTaxRate = (payrollConfig.taxRate + payrollConfig.imssRate + payrollConfig.isrRate) / 100
      
      const updatedEntries = entries.map(entry => {
        const baseSalary = calculateBaseSalary(entry.staff, period.period_type, period.start_date, period.end_date)
        const grossPay = baseSalary + entry.bonuses + entry.commissions + entry.finiquito
        const taxes = grossPay * totalTaxRate
        const totalDeductions = entry.deductions + payrollConfig.otherDeductions
        // El descuento de préstamos se resta además de deducciones e impuestos.
        const netPay = grossPay - totalDeductions - entry.loanDeductions - taxes

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
      const totalDeductions = updatedEntries.reduce((sum, e) => sum + e.deductions + e.loanDeductions + e.taxes, 0)
      const totalNet = updatedEntries.reduce((sum, e) => sum + e.net_pay, 0)

      // Update period totals
      const { error } = await supabase
        .from("payroll_periods")
        .update({
          total_gross: totalGross,
          total_deductions: totalDeductions,
          total_net: totalNet,
          status: "calculating",
          // Conservar el ajuste usado para este cálculo.
          tax_config: payrollConfig,
        })
        .eq("id", period.id)

      if (error) throw error

      setPeriod({
        ...period,
        total_gross: totalGross,
        total_deductions: totalDeductions,
        total_net: totalNet,
        status: "calculating",
        tax_config: payrollConfig,
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

    // Solo super administrador o director general pueden aprobar.
    if (!canApprovePayroll) {
      toast.error("No tienes permiso para aprobar nóminas")
      return
    }

    try {
      // Registrar quién autoriza junto con la aprobación.
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase
        .from("payroll_periods")
        .update({
          status: "approved",
          approved_by: user?.id ?? null,
          approved_at: new Date().toISOString(),
        })
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

      // Marcar como pagadas las comisiones incluidas en este periodo que
      // aún no lo estén, registrando su fecha de pago. Así no se vuelven a
      // incluir (como "aprobadas") en la siguiente nómina.
      const commissionIdsToPay = entries
        .flatMap((e) => e.commissionItems)
        .filter((c) => c.status !== "paid")
        .map((c) => c.id)

      let paidCommissionsCount = 0
      if (commissionIdsToPay.length > 0) {
        const { error: commError } = await supabase
          .from("commissions")
          .update({ status: "paid", paid_at: new Date().toISOString() })
          .in("id", commissionIdsToPay)

        if (commError) {
          console.error("Error updating commissions:", commError)
          toast.error("La nómina se marcó como pagada, pero no se pudieron actualizar las comisiones")
        } else {
          paidCommissionsCount = commissionIdsToPay.length
        }
      }

      // Marcar como liquidados los finiquitos incluidos en este periodo, para
      // que no se vuelvan a considerar en nóminas futuras.
      const finiquitoStaffIds = entries
        .filter((e) => e.finiquito > 0 && !e.staff.finiquito_paid_at)
        .map((e) => e.staff_id)

      let paidFiniquitosCount = 0
      if (finiquitoStaffIds.length > 0) {
        const { error: finError } = await supabase
          .from("staff")
          .update({ finiquito_paid_at: new Date().toISOString() })
          .in("id", finiquitoStaffIds)

        if (finError) {
          console.error("Error updating finiquitos:", finError)
          toast.error("La nómina se marcó como pagada, pero no se pudieron actualizar los finiquitos")
        } else {
          paidFiniquitosCount = finiquitoStaffIds.length
        }
      }

      // Registrar en "Préstamos" los pagos descontados en esta nómina: se crea
      // un registro en loan_payments por cada parcialidad y se actualiza el
      // saldo del préstamo (parcialidades hechas, monto pagado y saldo restante).
      const loanItemsToPay = entries.flatMap((e) => e.loanItems).filter((l) => l.amount > 0)
      let paidLoansCount = 0
      if (loanItemsToPay.length > 0) {
        const today = new Date().toISOString().split("T")[0]
        for (const l of loanItemsToPay) {
          const newPaymentsMade = l.payments_made + 1
          const newRemaining = Math.max(0, l.remaining_balance - l.amount)
          const isSettled = newRemaining <= 0 || newPaymentsMade >= l.number_of_payments

          const { error: payError } = await supabase.from("loan_payments").insert({
            loan_id: l.loan_id,
            payment_number: l.payment_number,
            payment_date: today,
            scheduled_date: today,
            amount: l.amount,
            principal_amount: l.amount,
            status: "paid",
            notes: `Descontado en nómina ${period.period_name}`,
          })
          if (payError) {
            console.error("Error inserting loan_payment:", payError)
            continue
          }

          const { error: loanError } = await supabase
            .from("loans")
            .update({
              payments_made: newPaymentsMade,
              amount_paid: l.amount_paid + l.amount,
              remaining_balance: newRemaining,
              status: isSettled ? "paid" : "active",
              updated_at: new Date().toISOString(),
            })
            .eq("id", l.loan_id)
          if (loanError) {
            console.error("Error updating loan:", loanError)
            continue
          }
          paidLoansCount++
        }
      }

      setPeriod({ ...period, status: "paid" })
      // Reflejar el nuevo estado de las comisiones y finiquitos en la vista.
      const paidAt = new Date().toISOString()
      setEntries((prev) =>
        prev.map((e) => ({
          ...e,
          commissionItems: e.commissionItems.map((c) =>
            commissionIdsToPay.includes(c.id) ? { ...c, status: "paid" } : c,
          ),
          staff: finiquitoStaffIds.includes(e.staff_id)
            ? { ...e.staff, finiquito_paid_at: paidAt }
            : e.staff,
        })),
      )

      const extras = [
        paidCommissionsCount > 0 ? `${paidCommissionsCount} comisión(es)` : null,
        paidFiniquitosCount > 0 ? `${paidFiniquitosCount} finiquito(s)` : null,
        paidLoansCount > 0 ? `${paidLoansCount} pago(s) de préstamo` : null,
      ].filter(Boolean)
      toast.success(
        extras.length > 0
          ? `Nómina marcada como pagada · ${extras.join(" y ")} liquidada(s)`
          : "Nómina marcada como pagada",
      )
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
    const grossPay = editingEntry.base_salary + editingEntry.bonuses + editingEntry.commissions + editingEntry.finiquito
    const taxes = grossPay * totalTaxRate
    const netPay = grossPay - editingEntry.deductions - editingEntry.loanDeductions - taxes

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
    deductions: entries.reduce((sum, e) => sum + e.deductions + e.loanDeductions + e.taxes, 0),
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
              {canApprovePayroll ? (
                <Button onClick={handleApprovePayroll}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aprobar
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground max-w-[220px] text-pretty">
                  Solo el super administrador o el director general pueden aprobar la nómina.
                </p>
              )}
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
                en <span className="font-medium">Comisiones Citas</span> (aprobadas o pagadas) que
                caen dentro de este periodo. Las comisiones se pagan{" "}
                <span className="font-medium">quincenalmente</span>. Haz clic en el monto de un colaborador para ver el
                desglose.
              </p>
            </div>
          )}
          {entries.some((e) => e.loanItems.length > 0) && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/20">
              <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <p className="text-sm text-red-800 dark:text-red-200">
                Se descuentan{" "}
                <span className="font-semibold">
                  {formatCurrency(entries.reduce((sum, e) => sum + e.loanDeductions, 0))}
                </span>{" "}
                en parcialidades de <span className="font-medium">Préstamos</span> vigentes. Al marcar la
                nómina como pagada, estos pagos se registran automáticamente en el apartado de{" "}
                <span className="font-medium">Préstamos</span>.
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
                  <TableHead className="text-right">Comisiones Citas</TableHead>
                  <TableHead className="text-right">Finiquito</TableHead>
                  <TableHead className="text-right">Préstamos</TableHead>
                  <TableHead className="text-right">Deducciones</TableHead>
                  <TableHead className="text-right">Impuestos</TableHead>
                  <TableHead className="text-right">Bruto</TableHead>
                  <TableHead className="text-right">Neto</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>CLABE Interbancaria</TableHead>
                  <TableHead>Concepto</TableHead>
                  {(period.status === "approved" || period.status === "paid") && (
                    <TableHead>Comprobante</TableHead>
                  )}
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
                      {entry.staff.employment_status === "terminated" ? (
                        <Badge variant="destructive" className="ml-2 text-xs">Baja</Badge>
                      ) : entry.staff.payment_frequency === "monthly" ? (
                        <Badge
                          variant="secondary"
                          className="ml-2 text-xs bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300"
                        >
                          Mensual
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Quincenal
                        </Badge>
                      )}
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
                    <TableCell className="text-right">
                      {entry.finiquito > 0 ? (
                        <span className="font-medium text-amber-600">{formatCurrency(entry.finiquito)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {entry.loanItems.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setLoanDetailEntry(entry)}
                          className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 hover:text-red-800"
                          title="Ver detalle de préstamos"
                        >
                          -{formatCurrency(entry.loanDeductions)}
                          <Badge variant="secondary" className="text-[10px]">
                            {entry.loanItems.length}
                          </Badge>
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-red-600">-{formatCurrency(entry.deductions)}</TableCell>
                    <TableCell className="text-right text-red-600">-{formatCurrency(entry.taxes)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(entry.gross_pay)}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">{formatCurrency(entry.net_pay)}</TableCell>
                    <TableCell>
                      {entry.staff.bank_name || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {entry.staff.bank_clabe || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {period.payment_concept || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    {(period.status === "approved" || period.status === "paid") && (
                      <TableCell>
                        {receipts[entry.staff_id] ? (
                          <div className="flex items-center gap-1">
                            <a
                              href={`/api/file?pathname=${encodeURIComponent(receipts[entry.staff_id].file_path)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-blue-600 underline decoration-dotted underline-offset-2 hover:text-blue-800 max-w-[160px] truncate"
                              title={receipts[entry.staff_id].file_name || "Ver comprobante"}
                            >
                              <Paperclip className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{receipts[entry.staff_id].file_name || "Comprobante"}</span>
                            </a>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleRemoveReceipt(entry.staff_id)}
                              title="Eliminar comprobante"
                            >
                              <X className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReceiptPicker(entry.staff_id)}
                            disabled={uploadingStaffId === entry.staff_id}
                          >
                            {uploadingStaffId === entry.staff_id ? (
                              <Spinner className="mr-1 h-3.5 w-3.5" />
                            ) : (
                              <Upload className="mr-1 h-3.5 w-3.5" />
                            )}
                            Adjuntar
                          </Button>
                        )}
                      </TableCell>
                    )}
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

      {/* Input oculto para adjuntar comprobantes de pago (PDF o imagen) */}
      <input
        ref={receiptInputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleReceiptSelected(file)
        }}
      />

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
              {editingEntry.finiquito > 0 && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
                  <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium">Finiquito: {formatCurrency(editingEntry.finiquito)}</p>
                    <p className="text-xs">
                      Último pago del colaborador (baja). Se define en Sueldos y Salarios y se liquida en esta nómina.
                    </p>
                  </div>
                </div>
              )}
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Bruto Estimado:</span>
                  <span className="font-medium">
                    {formatCurrency(editingEntry.base_salary + editingEntry.bonuses + editingEntry.commissions + editingEntry.finiquito)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Impuestos ({payrollConfig.taxRate + payrollConfig.imssRate + payrollConfig.isrRate}%):</span>
                  <span className="text-red-600">
                    -{formatCurrency((editingEntry.base_salary + editingEntry.bonuses + editingEntry.commissions + editingEntry.finiquito) * ((payrollConfig.taxRate + payrollConfig.imssRate + payrollConfig.isrRate) / 100))}
                  </span>
                </div>
                {editingEntry.loanDeductions > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Préstamos:</span>
                    <span className="text-red-600">-{formatCurrency(editingEntry.loanDeductions)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Deducciones:</span>
                  <span className="text-red-600">-{formatCurrency(editingEntry.deductions)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Neto a Pagar:</span>
                  <span className="text-green-600">
                    {formatCurrency(
                      (editingEntry.base_salary + editingEntry.bonuses + editingEntry.commissions + editingEntry.finiquito) * (1 - (payrollConfig.taxRate + payrollConfig.imssRate + payrollConfig.isrRate) / 100) 
                      - editingEntry.deductions
                      - editingEntry.loanDeductions
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

      {/* Loan Detail Dialog */}
      <Dialog open={!!loanDetailEntry} onOpenChange={(open) => !open && setLoanDetailEntry(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle de préstamos</DialogTitle>
            <DialogDescription>
              {loanDetailEntry?.staff.first_name} {loanDetailEntry?.staff.last_name} · Parcialidades de préstamos a
              descontar en este periodo
            </DialogDescription>
          </DialogHeader>
          {loanDetailEntry && (
            <div className="space-y-3">
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {loanDetailEntry.loanItems.map((item) => (
                  <div
                    key={item.loan_id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {item.loan_number || "Préstamo"}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          Pago {item.payment_number}/{item.number_of_payments}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Saldo restante: {formatCurrency(item.remaining_balance)}
                      </p>
                    </div>
                    <span className="shrink-0 font-medium text-red-600">-{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t pt-3 font-bold">
                <span>Total a descontar</span>
                <span className="text-red-600">-{formatCurrency(loanDetailEntry.loanDeductions)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoanDetailEntry(null)}>
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
            <Button onClick={handleSaveConfig}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Configuración
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
