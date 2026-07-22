"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { usePermissions } from "@/components/dashboard/permissions-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Banknote,
  Users,
  Wallet,
  BadgePercent,
  Save,
  Search,
  Info,
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  LineChartIcon,
  CalendarDays,
  CalendarClock,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { toast } from "sonner"
import { getEmploymentStatus } from "@/app/dashboard/hr/staff/page"

interface Agency {
  id: string
  name: string
  settings: { working_hours_per_month?: number } | null
}

const DEFAULT_WORKING_HOURS = 160

interface Currency {
  id: string
  code: string
  name: string
}

interface StaffSalary {
  id: string
  employee_code: string | null
  first_name: string
  last_name: string
  position: string | null
  department: string | null
  agency_id: string | null
  is_global: boolean | null
  is_active: boolean
  employment_status: string | null
  contract_type: string | null
  hourly_cost: number | null
  monthly_salary: number | null
  currency_id: string | null
  commission_percentage: number | null
  commission_type: string | null
  payment_frequency: string | null
  finiquito: number | null
  finiquito_paid_at: string | null
}

// Registro de bitácora de cambios de sueldo/comisión
interface ChangeLog {
  id: string
  staff_id: string
  field: string
  old_value: number | null
  new_value: number | null
  currency_code: string | null
  changed_by_name: string | null
  changed_at: string
  staff: { first_name: string; last_name: string } | null
}

// Valores editables por fila
interface EditableRow {
  monthly_salary: string
  hourly_cost: string
  commission_percentage: string
  currency_id: string
  payment_frequency: string
  finiquito: string
}

const paymentFrequencyLabels: Record<string, string> = {
  biweekly: "Quincenal",
  monthly: "Mensual",
}

// Ajusta una fecha de pago: si cae en sábado o domingo, la recorre al
// viernes hábil anterior (día más cercano entre semana antes del fin de semana).
function adjustToBusinessDay(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0 = domingo, 6 = sábado
  if (day === 6) d.setDate(d.getDate() - 1) // sábado -> viernes
  else if (day === 0) d.setDate(d.getDate() - 2) // domingo -> viernes
  return d
}

// Fecha de pago de la primera quincena (día 15) del mes/año dados, ya ajustada.
function firstBiweeklyPayDate(year: number, month: number): Date {
  return adjustToBusinessDay(new Date(year, month, 15))
}

// Fecha de pago de fin de mes / segunda quincena (último día del mes), ya ajustada.
function endOfMonthPayDate(year: number, month: number): Date {
  return adjustToBusinessDay(new Date(year, month + 1, 0))
}

function formatPayDate(date: Date): string {
  return date.toLocaleDateString("es-MX", { weekday: "short", day: "2-digit", month: "short" })
}

const contractTypeLabels: Record<string, string> = {
  full_time: "Tiempo completo",
  part_time: "Medio tiempo",
  commission: "Comisionista",
  full_time_variable: "Fijo + variable",
  contractor: "Honorarios",
  intern: "Practicante",
  temporary: "Temporal",
}

// Permite solo dígitos y un único punto decimal (evita letras y signos).
function sanitizeDecimal(value: string) {
  const cleaned = value.replace(/[^0-9.]/g, "")
  const parts = cleaned.split(".")
  if (parts.length <= 1) return cleaned
  return `${parts[0]}.${parts.slice(1).join("")}`
}

function formatMoney(value: number, currencyCode: string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currencyCode || "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0)
}

export default function SalariesPage() {
  const supabase = createClient()
  const { hasAnyModule, fullAccess, loading: permsLoading } = usePermissions()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [staff, setStaff] = useState<StaffSalary[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])

  const [search, setSearch] = useState("")
  const [filterAgency, setFilterAgency] = useState("all")
  const [filterContract, setFilterContract] = useState("all")
  const [filterFrequency, setFilterFrequency] = useState("all")
  // Controla si se despliega el grupo de colaboradores no activos (bajas, inactivos, etc.)
  const [showOthers, setShowOthers] = useState(false)

  // Cambios pendientes por id de empleado
  const [edits, setEdits] = useState<Record<string, EditableRow>>({})

  // Diálogo de confirmación antes de guardar cambios de sueldo/comisión.
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Pestaña activa: compensación actual o evolución en el tiempo.
  const [activeTab, setActiveTab] = useState("current")

  // Historial (bitácora) de cambios de sueldo y comisión.
  const [historyLogs, setHistoryLogs] = useState<ChangeLog[]>([])
  // Empleado seleccionado para ver la evolución de su salario.
  const [historyStaffId, setHistoryStaffId] = useState<string>("")
  // Modo de visualización de la evolución: individual o comparativa.
  const [evolutionView, setEvolutionView] = useState<"single" | "compare">("single")
  // Empleados seleccionados para comparar en la misma gráfica.
  const [compareStaffIds, setCompareStaffIds] = useState<string[]>([])
  // Filtro por rango de fechas (formato YYYY-MM-DD, vacío = sin límite).
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")

  // Solo pueden editar quienes tienen acceso al módulo de sueldos y salarios.
  const canEdit = fullAccess || hasAnyModule(["salaries"])

  // Convierte texto a número (o null si está vacío/ inválido).
  const parseNum = (v: string): number | null => {
    const t = v.trim()
    if (t === "") return null
    const n = Number.parseFloat(t)
    return Number.isFinite(n) ? n : null
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [staffRes, agenciesRes, currenciesRes, logsRes] = await Promise.all([
      supabase
        .from("staff")
        .select(
          "id, employee_code, first_name, last_name, position, department, agency_id, is_global, is_active, employment_status, contract_type, hourly_cost, monthly_salary, currency_id, commission_percentage, commission_type, payment_frequency, finiquito, finiquito_paid_at",
        )
        // Incluye al personal activo y también a quienes están en baja
        // (employment_status = 'terminated'), para poder gestionar su finiquito.
        .or("is_active.eq.true,employment_status.eq.terminated")
        .order("first_name"),
      supabase.from("agencies").select("id, name, settings").order("name"),
      supabase.from("currencies").select("id, code, name").eq("is_active", true).order("code"),
      supabase
        .from("salary_change_logs")
        .select(
          "id, staff_id, field, old_value, new_value, currency_code, changed_by_name, changed_at, staff(first_name, last_name)",
        )
        .order("changed_at", { ascending: true }),
    ])

    if (staffRes.data) setStaff(staffRes.data as StaffSalary[])
    if (agenciesRes.data) setAgencies(agenciesRes.data as Agency[])
    if (currenciesRes.data) setCurrencies(currenciesRes.data as Currency[])
    if (logsRes.data) setHistoryLogs(logsRes.data as unknown as ChangeLog[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const currencyCode = useCallback(
    (id: string | null) => currencies.find((c) => c.id === id)?.code || "MXN",
    [currencies],
  )

  const agencyName = useCallback(
    (s: StaffSalary) => (s.agency_id ? agencies.find((a) => a.id === s.agency_id)?.name || "-" : "Global"),
    [agencies],
  )

  // Horas laborables al mes de la agencia. El personal Global (sin agencia)
  // usa el valor de cualquier agencia que lo tenga configurado, pues es igual
  // para todas. Si nadie lo tiene, se usa el valor por defecto.
  const globalWorkingHours = useMemo(() => {
    const found = agencies.find((a) => Number(a.settings?.working_hours_per_month) > 0)
    return Number(found?.settings?.working_hours_per_month) || DEFAULT_WORKING_HOURS
  }, [agencies])

  const workingHoursFor = useCallback(
    (agencyId: string | null) => {
      if (agencyId) {
        const agency = agencies.find((a) => a.id === agencyId)
        const h = Number(agency?.settings?.working_hours_per_month)
        if (h > 0) return h
      }
      return globalWorkingHours
    },
    [agencies, globalWorkingHours],
  )

  // Costo por hora = salario mensual ÷ horas laborables al mes (automático).
  const computeHourlyCost = useCallback(
    (monthlySalary: number, agencyId: string | null) => {
      const hours = workingHoursFor(agencyId)
      if (!(monthlySalary > 0) || !(hours > 0)) return 0
      return monthlySalary / hours
    },
    [workingHoursFor],
  )

  // Valor efectivo (usa el editado si existe, si no el guardado).
  const effective = useCallback(
    (s: StaffSalary): EditableRow =>
      edits[s.id] ?? {
        monthly_salary: s.monthly_salary != null ? String(s.monthly_salary) : "",
        hourly_cost: s.hourly_cost != null ? String(s.hourly_cost) : "",
        commission_percentage: s.commission_percentage != null ? String(s.commission_percentage) : "",
        currency_id: s.currency_id || "",
        payment_frequency: s.payment_frequency || "biweekly",
        finiquito: s.finiquito != null ? String(s.finiquito) : "",
      },
    [edits],
  )

  const updateField = (s: StaffSalary, field: keyof EditableRow, value: string) => {
    setEdits((prev) => {
      const base = prev[s.id] ?? {
        monthly_salary: s.monthly_salary != null ? String(s.monthly_salary) : "",
        hourly_cost: s.hourly_cost != null ? String(s.hourly_cost) : "",
        commission_percentage: s.commission_percentage != null ? String(s.commission_percentage) : "",
        currency_id: s.currency_id || "",
        payment_frequency: s.payment_frequency || "biweekly",
        finiquito: s.finiquito != null ? String(s.finiquito) : "",
      }
      return { ...prev, [s.id]: { ...base, [field]: value } }
    })
  }

  const filtered = useMemo(() => {
    return staff.filter((s) => {
      if (filterAgency === "global" ? !!s.agency_id : filterAgency !== "all" && s.agency_id !== filterAgency)
        return false
      if (filterContract !== "all" && (s.contract_type || "") !== filterContract) return false
      if (filterFrequency !== "all" && (s.payment_frequency || "biweekly") !== filterFrequency) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const full = `${s.first_name} ${s.last_name} ${s.position || ""} ${s.employee_code || ""}`.toLowerCase()
        if (!full.includes(q)) return false
      }
      return true
    })
  }, [staff, filterAgency, filterContract, filterFrequency, search])

  // Colaboradores activos (excluye bajas), usados para los totales de nómina
  // base mensual, ya que las bajas no perciben salario recurrente.
  const activeFiltered = useMemo(
    () => filtered.filter((s) => s.employment_status !== "terminated"),
    [filtered],
  )

  // Dos listas: colaboradores activos (siempre visibles) y el resto (bajas,
  // inactivos, suspendidos) agrupados aparte para desplegarlos bajo demanda.
  const activeRows = useMemo(
    () => filtered.filter((s) => (s.employment_status || "active") === "active"),
    [filtered],
  )
  const otherRows = useMemo(
    () => filtered.filter((s) => (s.employment_status || "active") !== "active"),
    [filtered],
  )

  const renderSalaryRow = (s: StaffSalary) => {
    const eff = effective(s)
    const isDirty = !!edits[s.id]
    return (
      <TableRow key={s.id} className={isDirty ? "bg-primary/5" : undefined}>
        <TableCell>
          <Link href={`/dashboard/hr/staff/${s.id}`} className="font-medium hover:underline">
            {s.first_name} {s.last_name}
          </Link>
          <div className="text-xs text-muted-foreground">
            {s.position || "Sin puesto"}
            {s.employee_code ? ` · ${s.employee_code}` : ""}
          </div>
        </TableCell>
        <TableCell>
          {s.agency_id ? (
            <span className="text-sm">{agencyName(s)}</span>
          ) : (
            <Badge variant="secondary">Global</Badge>
          )}
        </TableCell>
        <TableCell>
          {(() => {
            const st = getEmploymentStatus(s.employment_status)
            return <Badge variant={st.badgeVariant}>{st.label}</Badge>
          })()}
        </TableCell>
        <TableCell>
          <Select
            value={eff.payment_frequency}
            onValueChange={(v) => updateField(s, "payment_frequency", v)}
            disabled={!canEdit}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="biweekly">Quincenal</SelectItem>
              <SelectItem value="monthly">Mensual</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <Select
            value={eff.currency_id}
            onValueChange={(v) => updateField(s, "currency_id", v)}
            disabled={!canEdit}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="text-right">
          <Input
            type="text"
            inputMode="decimal"
            value={eff.monthly_salary}
            onChange={(e) => updateField(s, "monthly_salary", sanitizeDecimal(e.target.value))}
            disabled={!canEdit}
            className="h-8 text-right"
            placeholder="0.00"
          />
        </TableCell>
        <TableCell className="text-right">
          {(() => {
            const salary = Number.parseFloat(eff.monthly_salary) || 0
            const code = currencyCode(eff.currency_id || s.currency_id)
            const isBiweekly = eff.payment_frequency !== "monthly"
            return isBiweekly && salary > 0 ? (
              <span className="text-sm tabular-nums">{formatMoney(salary / 2, code)}</span>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )
          })()}
        </TableCell>
        <TableCell className="text-right">
          {(() => {
            const salary = Number.parseFloat(eff.monthly_salary) || 0
            const code = currencyCode(eff.currency_id || s.currency_id)
            const isBiweekly = eff.payment_frequency !== "monthly"
            const amount = salary > 0 ? (isBiweekly ? salary / 2 : salary) : 0
            return salary > 0 ? (
              <span className="text-sm font-medium tabular-nums">{formatMoney(amount, code)}</span>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )
          })()}
        </TableCell>
        <TableCell className="text-right">
          <Input
            type="text"
            inputMode="decimal"
            value={eff.commission_percentage}
            onChange={(e) => updateField(s, "commission_percentage", sanitizeDecimal(e.target.value))}
            disabled={!canEdit}
            className="h-8 text-right"
            placeholder="0"
          />
        </TableCell>
        <TableCell className="text-right">
          {s.employment_status === "terminated" ? (
            <div className="space-y-1">
              <Input
                type="text"
                inputMode="decimal"
                value={eff.finiquito}
                onChange={(e) => updateField(s, "finiquito", sanitizeDecimal(e.target.value))}
                disabled={!canEdit || !!s.finiquito_paid_at}
                className="h-8 text-right"
                placeholder="0.00"
              />
              {s.finiquito_paid_at && (
                <p className="text-[10px] text-muted-foreground">
                  Pagado {new Date(s.finiquito_paid_at).toLocaleDateString("es-MX")}
                </p>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">N/A</span>
          )}
        </TableCell>
      </TableRow>
    )
  }

  // Totales de nómina base mensual agrupados por moneda.
  const totalsByCurrency = useMemo(() => {
    const map = new Map<string, number>()
    activeFiltered.forEach((s) => {
      const code = currencyCode(s.currency_id)
      const eff = effective(s)
      const salary = Number.parseFloat(eff.monthly_salary) || 0
      map.set(code, (map.get(code) || 0) + salary)
    })
    return Array.from(map.entries()).filter(([, v]) => v > 0)
  }, [activeFiltered, currencyCode, effective])

  // Frecuencia de pago efectiva (usa el valor editado si existe).
  const effectiveFrequency = useCallback(
    (s: StaffSalary) => effective(s).payment_frequency || s.payment_frequency || "biweekly",
    [effective],
  )

  // Fechas de pago del mes en curso, ya ajustadas a día hábil.
  const payDates = useMemo(() => {
    const now = new Date()
    return {
      first: firstBiweeklyPayDate(now.getFullYear(), now.getMonth()),
      end: endOfMonthPayDate(now.getFullYear(), now.getMonth()),
    }
  }, [])

  // Reparte la nómina en dos corridas:
  //  - Primera quincena (día 15): solo el 50% de quienes cobran quincenalmente.
  //  - Fin de mes: el 50% restante de los quincenales + el 100% de los mensuales.
  const payrollRuns = useMemo(() => {
    const first = new Map<string, number>()
    const end = new Map<string, number>()
    let biweeklyCount = 0
    let monthlyCount = 0
    activeFiltered.forEach((s) => {
      const code = currencyCode(s.currency_id)
      const salary = Number.parseFloat(effective(s).monthly_salary) || 0
      if (salary <= 0) return
      if (effectiveFrequency(s) === "monthly") {
        monthlyCount++
        end.set(code, (end.get(code) || 0) + salary)
      } else {
        biweeklyCount++
        const half = salary / 2
        first.set(code, (first.get(code) || 0) + half)
        end.set(code, (end.get(code) || 0) + half)
      }
    })
    return {
      first: Array.from(first.entries()).filter(([, v]) => v > 0),
      end: Array.from(end.entries()).filter(([, v]) => v > 0),
      biweeklyCount,
      monthlyCount,
    }
  }, [activeFiltered, currencyCode, effective, effectiveFrequency])

  const contractTypesPresent = useMemo(() => {
    const set = new Set<string>()
    staff.forEach((s) => s.contract_type && set.add(s.contract_type))
    return Array.from(set)
  }, [staff])

  const dirtyCount = Object.keys(edits).length

  // Cambios de salario y comisión pendientes (los que requieren confirmación y registro).
  const sensitiveChanges = useMemo(() => {
    const list: {
      staffId: string
      name: string
      field: "monthly_salary" | "commission_percentage"
      label: string
      oldValue: number | null
      newValue: number | null
      display: string
    }[] = []
    Object.entries(edits).forEach(([id, row]) => {
      const person = staff.find((s) => s.id === id)
      if (!person) return
      const name = `${person.first_name} ${person.last_name}`
      const code = currencyCode(row.currency_id || person.currency_id)

      const newSalary = parseNum(row.monthly_salary)
      const oldSalary = person.monthly_salary ?? null
      if (newSalary !== oldSalary) {
        list.push({
          staffId: id,
          name,
          field: "monthly_salary",
          label: "Salario mensual",
          oldValue: oldSalary,
          newValue: newSalary,
          display: `${formatMoney(oldSalary || 0, code)} → ${formatMoney(newSalary || 0, code)}`,
        })
      }

      const newComm = parseNum(row.commission_percentage)
      const oldComm = person.commission_percentage ?? null
      if (newComm !== oldComm) {
        list.push({
          staffId: id,
          name,
          field: "commission_percentage",
          label: "Comisión",
          oldValue: oldComm,
          newValue: newComm,
          display: `${oldComm ?? 0}% → ${newComm ?? 0}%`,
        })
      }
    })
    return list
  }, [edits, staff, currencyCode])

  // Abre la confirmación en lugar de guardar directamente.
  const handleSaveClick = () => {
    if (dirtyCount === 0) return
    setConfirmOpen(true)
  }

  // Colores para las líneas de comparación.
  const compareColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]

  // ¿La fecha cae dentro del rango seleccionado?
  const inDateRange = useCallback(
    (iso: string) => {
      const t = new Date(iso).getTime()
      if (dateFrom && t < new Date(dateFrom).getTime()) return false
      if (dateTo && t > new Date(dateTo + "T23:59:59").getTime()) return false
      return true
    },
    [dateFrom, dateTo],
  )

  // Solo cambios de salario, ordenados cronológicamente (asc).
  const salaryLogsAsc = useMemo(
    () =>
      historyLogs
        .filter((l) => l.field === "monthly_salary")
        .slice()
        .sort((a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()),
    [historyLogs],
  )

  // Igual que el anterior, pero acotado al rango de fechas.
  const salaryLogsFiltered = useMemo(
    () => salaryLogsAsc.filter((l) => inDateRange(l.changed_at)),
    [salaryLogsAsc, inDateRange],
  )

  // Empleados que tienen al menos un cambio de salario registrado.
  const staffWithHistory = useMemo(() => {
    const map = new Map<string, string>()
    salaryLogsAsc.forEach((l) => {
      const name = l.staff ? `${l.staff.first_name} ${l.staff.last_name}` : "Colaborador"
      if (!map.has(l.staff_id)) map.set(l.staff_id, name)
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [salaryLogsAsc])

  // Selecciona automáticamente el primer empleado con historial.
  useEffect(() => {
    if (!historyStaffId && staffWithHistory.length > 0) {
      setHistoryStaffId(staffWithHistory[0].id)
    }
  }, [staffWithHistory, historyStaffId])

  // Serie de puntos de la trayectoria salarial del empleado seleccionado.
  const salarySeries = useMemo(() => {
    if (!historyStaffId) return [] as { label: string; salario: number; fecha: string }[]
    const rows = salaryLogsFiltered.filter((l) => l.staff_id === historyStaffId)
    if (rows.length === 0) return []
    const points: { label: string; salario: number; fecha: string }[] = []
    // Punto inicial: el salario previo al primer cambio.
    points.push({ label: "Inicial", salario: rows[0].old_value ?? 0, fecha: "Valor previo" })
    rows.forEach((r) => {
      points.push({
        label: new Date(r.changed_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "2-digit" }),
        salario: r.new_value ?? 0,
        fecha: new Date(r.changed_at).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" }),
      })
    })
    return points
  }, [historyStaffId, salaryLogsFiltered])

  // Moneda y métricas de la trayectoria seleccionada.
  const selectedCurrency = useMemo(() => {
    const rows = salaryLogsAsc.filter((l) => l.staff_id === historyStaffId)
    return rows[rows.length - 1]?.currency_code || "MXN"
  }, [historyStaffId, salaryLogsAsc])

  const evolutionStats = useMemo(() => {
    if (salarySeries.length < 1) return null
    const first = salarySeries[0].salario
    const current = salarySeries[salarySeries.length - 1].salario
    const diff = current - first
    const pct = first > 0 ? (diff / first) * 100 : 0
    return { first, current, diff, pct, changes: salarySeries.length - 1 }
  }, [salarySeries])

  // Serie combinada para comparar a varios colaboradores en una misma gráfica.
  // Se construye una función escalón: en cada fecha de cambio, el salario vigente de cada persona.
  const compareSeries = useMemo(() => {
    if (compareStaffIds.length === 0) return [] as Record<string, number | string>[]
    // Fechas de cambio (de los seleccionados) dentro del rango, únicas y ordenadas.
    const dates = Array.from(
      new Set(
        salaryLogsFiltered
          .filter((l) => compareStaffIds.includes(l.staff_id))
          .map((l) => l.changed_at),
      ),
    ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

    // Salario vigente de un colaborador en un instante dado.
    const salaryAt = (staffId: string, t: number): number | null => {
      const rows = salaryLogsAsc.filter((l) => l.staff_id === staffId)
      if (rows.length === 0) return null
      let value = rows[0].old_value ?? 0
      for (const r of rows) {
        if (new Date(r.changed_at).getTime() <= t) value = r.new_value ?? value
      }
      return value
    }

    return dates.map((d) => {
      const t = new Date(d).getTime()
      const row: Record<string, number | string> = {
        label: new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "2-digit" }),
      }
      compareStaffIds.forEach((id) => {
        const v = salaryAt(id, t)
        if (v !== null) row[id] = v
      })
      return row
    })
  }, [compareStaffIds, salaryLogsFiltered, salaryLogsAsc])

  // Bitácora del empleado seleccionado (salario y comisión) dentro del rango.
  const selectedStaffLogs = useMemo(
    () =>
      historyLogs
        .filter((l) => l.staff_id === historyStaffId && inDateRange(l.changed_at))
        .slice()
        .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()),
    [historyLogs, historyStaffId, inDateRange],
  )

  const performSave = async () => {
    if (dirtyCount === 0) return
    setConfirmOpen(false)
    setSaving(true)
    try {
      const updates = Object.entries(edits).map(([id, row]) => {
        const monthlySalary = parseNum(row.monthly_salary)
        const person = staff.find((s) => s.id === id)
        // El costo por hora se deriva automáticamente del salario mensual y las
        // horas laborables de la agencia; no se toma un valor manual.
        const hourlyCost =
          monthlySalary != null && monthlySalary > 0
            ? computeHourlyCost(monthlySalary, person?.agency_id ?? null)
            : null
        // El finiquito solo aplica a colaboradores en baja; para el resto se
        // guarda null para evitar montos residuales.
        const isTerminated = person?.employment_status === "terminated"
        return supabase
          .from("staff")
          .update({
            monthly_salary: monthlySalary,
            hourly_cost: hourlyCost,
            commission_percentage: parseNum(row.commission_percentage),
            currency_id: row.currency_id || null,
            payment_frequency: row.payment_frequency || "biweekly",
            finiquito: isTerminated ? parseNum(row.finiquito) : null,
          })
          .eq("id", id)
      })

      const results = await Promise.all(updates)
      const failed = results.find((r) => r.error)
      if (failed?.error) throw new Error(failed.error.message)

      // Registrar en bitácora cada cambio de salario o comisión.
      if (sensitiveChanges.length > 0) {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()
        let changedByName: string | null = null
        if (authUser) {
          const { data: u } = await supabase
            .from("users")
            .select("first_name, last_name")
            .eq("id", authUser.id)
            .single()
          changedByName = `${u?.first_name ?? ""} ${u?.last_name ?? ""}`.trim() || null
        }
        const logRows = sensitiveChanges.map((c) => {
          const person = staff.find((s) => s.id === c.staffId)
          return {
            staff_id: c.staffId,
            field: c.field,
            old_value: c.oldValue,
            new_value: c.newValue,
            currency_code:
              c.field === "monthly_salary"
                ? currencyCode(edits[c.staffId]?.currency_id || person?.currency_id || null)
                : null,
            changed_by: authUser?.id ?? null,
            changed_by_name: changedByName,
          }
        })
        const { error: logError } = await supabase.from("salary_change_logs").insert(logRows)
        if (logError) console.log("[v0] Error al registrar bitácora de sueldos:", logError.message)
      }

      toast.success(`Se guardaron los cambios de ${dirtyCount} colaborador(es)`)
      setEdits({})
      await fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron guardar los cambios")
    } finally {
      setSaving(false)
    }
  }

  if (loading || permsLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Sueldos y Salarios</h1>
          <p className="text-sm text-muted-foreground">
            Compensación de todo el personal. Se sincroniza con Costos y Facturación de cada persona y alimenta el
            cálculo de Nómina.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && activeTab === "current" && (
            <Button onClick={handleSaveClick} disabled={dirtyCount === 0 || saving}>
              {saving ? <Spinner className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar cambios{dirtyCount > 0 ? ` (${dirtyCount})` : ""}
            </Button>
          )}
        </div>
      </div>

      {/* Aviso de vinculación */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Los importes que edites aquí actualizan el salario mensual y la comisión de cada colaborador, y alimentan el{" "}
          <span className="font-medium text-foreground">cálculo de Nómina</span>. Cada persona tiene una{" "}
          <span className="font-medium text-foreground">frecuencia de pago</span>: los{" "}
          <span className="font-medium text-foreground">quincenales</span> cobran el 50% el día 15 y el 50% a fin de
          mes; los <span className="font-medium text-foreground">mensuales</span> cobran el total a fin de mes. Si la
          fecha de pago cae en sábado o domingo, se recorre al{" "}
          <span className="font-medium text-foreground">viernes hábil anterior</span>.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="current">
            <Wallet className="mr-2 h-4 w-4" />
            Compensación actual
          </TabsTrigger>
          <TabsTrigger value="evolution">
            <LineChartIcon className="mr-2 h-4 w-4" />
            Evolución en el tiempo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
      {/* Tarjetas resumen */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nómina mensual base</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {totalsByCurrency.length === 0 ? (
              <div className="text-2xl font-bold">{formatMoney(0, "MXN")}</div>
            ) : (
              <div className="space-y-0.5">
                {totalsByCurrency.map(([code, total]) => (
                  <div key={code} className="text-2xl font-bold leading-tight">
                    {formatMoney(total, code)}
                  </div>
                ))}
              </div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">Suma de salarios mensuales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filtered.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">Activos en la vista actual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pago 1ª quincena</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {payrollRuns.first.length === 0 ? (
              <div className="text-2xl font-bold">{formatMoney(0, "MXN")}</div>
            ) : (
              <div className="space-y-0.5">
                {payrollRuns.first.map(([code, total]) => (
                  <div key={code} className="text-2xl font-bold leading-tight">
                    {formatMoney(total, code)}
                  </div>
                ))}
              </div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {formatPayDate(payDates.first)} · {payrollRuns.biweeklyCount} quincenal(es)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pago fin de mes</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {payrollRuns.end.length === 0 ? (
              <div className="text-2xl font-bold">{formatMoney(0, "MXN")}</div>
            ) : (
              <div className="space-y-0.5">
                {payrollRuns.end.map(([code, total]) => (
                  <div key={code} className="text-2xl font-bold leading-tight">
                    {formatMoney(total, code)}
                  </div>
                ))}
              </div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {formatPayDate(payDates.end)} · 2ª quincena + {payrollRuns.monthlyCount} mensual(es)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, puesto o código"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterAgency} onValueChange={setFilterAgency}>
          <SelectTrigger className="md:w-52">
            <SelectValue placeholder="Agencia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las agencias</SelectItem>
            <SelectItem value="global">Global</SelectItem>
            {agencies.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterContract} onValueChange={setFilterContract}>
          <SelectTrigger className="md:w-52">
            <SelectValue placeholder="Tipo de contrato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los contratos</SelectItem>
            {contractTypesPresent.map((c) => (
              <SelectItem key={c} value={c}>
                {contractTypeLabels[c] || c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterFrequency} onValueChange={setFilterFrequency}>
          <SelectTrigger className="md:w-44">
            <SelectValue placeholder="Frecuencia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toda frecuencia</SelectItem>
            <SelectItem value="biweekly">Quincenal</SelectItem>
            <SelectItem value="monthly">Mensual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de compensación</CardTitle>
          <CardDescription>
            {canEdit
              ? "Edita los importes directamente en la tabla y guarda los cambios."
              : "Vista de solo lectura. No tienes permisos para editar la compensación."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Agencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-36">Frecuencia</TableHead>
                  <TableHead className="w-28">Moneda</TableHead>
                  <TableHead className="text-right">Salario mensual</TableHead>
                  <TableHead className="text-right">1ª quincena (día 15)</TableHead>
                  <TableHead className="text-right">Fin de mes</TableHead>
                  <TableHead className="text-right">Comisión %</TableHead>
                  <TableHead className="text-right w-40">Finiquito</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                      No hay colaboradores que coincidan con los filtros
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {activeRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="py-6 text-center text-sm text-muted-foreground">
                          No hay colaboradores activos con estos filtros
                        </TableCell>
                      </TableRow>
                    ) : (
                      activeRows.map((s) => renderSalaryRow(s))
                    )}

                    {otherRows.length > 0 && (
                      <>
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={10} className="p-0">
                            <button
                              type="button"
                              onClick={() => setShowOthers((v) => !v)}
                              className="flex w-full items-center gap-2 bg-muted/50 px-4 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                            >
                              {showOthers ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              Otros colaboradores (bajas, inactivos, suspendidos)
                              <Badge variant="secondary" className="ml-1">
                                {otherRows.length}
                              </Badge>
                            </button>
                          </TableCell>
                        </TableRow>
                        {showOthers && otherRows.map((s) => renderSalaryRow(s))}
                      </>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        {/* ===== Pestaña: Evolución en el tiempo ===== */}
        <TabsContent value="evolution" className="space-y-6">
          {staffWithHistory.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <div className="rounded-full bg-muted p-4">
                  <LineChartIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold">Sin historial de cambios todavía</h2>
                <p className="max-w-md text-sm text-muted-foreground">
                  Cuando modifiques el salario de un colaborador desde la pestaña de compensación, aquí verás su
                  evolución en el tiempo con gráficas y el detalle de cada cambio.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Barra de herramientas: modo de vista y filtro de fechas */}
              <Card>
                <CardContent className="flex flex-col gap-4 py-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Modo de visualización</span>
                    <div className="inline-flex w-fit rounded-lg border border-border p-1">
                      <Button
                        size="sm"
                        variant={evolutionView === "single" ? "default" : "ghost"}
                        onClick={() => setEvolutionView("single")}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Individual
                      </Button>
                      <Button
                        size="sm"
                        variant={evolutionView === "compare" ? "default" : "ghost"}
                        onClick={() => setEvolutionView("compare")}
                      >
                        <LineChartIcon className="mr-2 h-4 w-4" />
                        Comparar
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="date-from" className="text-xs text-muted-foreground">
                        Desde
                      </Label>
                      <Input
                        id="date-from"
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-40"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="date-to" className="text-xs text-muted-foreground">
                        Hasta
                      </Label>
                      <Input
                        id="date-to"
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-40"
                      />
                    </div>
                    {(dateFrom || dateTo) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDateFrom("")
                          setDateTo("")
                        }}
                      >
                        Limpiar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ===== Vista individual ===== */}
              {evolutionView === "single" && (
              <>
              {/* Selector de colaborador */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="text-sm font-medium text-muted-foreground">Colaborador:</span>
                <Select value={historyStaffId} onValueChange={setHistoryStaffId}>
                  <SelectTrigger className="sm:w-72">
                    <SelectValue placeholder="Selecciona un colaborador" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffWithHistory.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Métricas de evolución */}
              {evolutionStats && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Salario inicial</CardTitle>
                      <History className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatMoney(evolutionStats.first, selectedCurrency)}</div>
                      <p className="mt-1 text-xs text-muted-foreground">Antes del primer cambio</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Salario actual</CardTitle>
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatMoney(evolutionStats.current, selectedCurrency)}</div>
                      <p className="mt-1 text-xs text-muted-foreground">Último valor registrado</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Variación total</CardTitle>
                      {evolutionStats.diff > 0 ? (
                        <TrendingUp className="h-4 w-4 text-[var(--chart-1)]" />
                      ) : evolutionStats.diff < 0 ? (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      ) : (
                        <Minus className="h-4 w-4 text-muted-foreground" />
                      )}
                    </CardHeader>
                    <CardContent>
                      <div
                        className={`text-2xl font-bold ${
                          evolutionStats.diff > 0
                            ? "text-[var(--chart-1)]"
                            : evolutionStats.diff < 0
                              ? "text-destructive"
                              : ""
                        }`}
                      >
                        {evolutionStats.diff >= 0 ? "+" : "-"}
                        {formatMoney(Math.abs(evolutionStats.diff), selectedCurrency)}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {evolutionStats.pct >= 0 ? "+" : ""}
                        {evolutionStats.pct.toFixed(1)}% desde el inicio
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Ajustes</CardTitle>
                      <BadgePercent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{evolutionStats.changes}</div>
                      <p className="mt-1 text-xs text-muted-foreground">Cambios de salario</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Gráfica de evolución */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <LineChartIcon className="h-4 w-4 text-primary" />
                    Trayectoria salarial
                  </CardTitle>
                  <CardDescription>Evolución del salario mensual a lo largo del tiempo.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={salarySeries} margin={{ top: 16, right: 16, left: 8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="salaryGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                          className="text-xs"
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                          className="text-xs"
                          tickLine={false}
                          axisLine={false}
                          width={70}
                          tickFormatter={(v: number) =>
                            new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 }).format(v)
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [formatMoney(value, selectedCurrency), "Salario"]}
                        />
                        <Area
                          type="stepAfter"
                          dataKey="salario"
                          stroke="none"
                          fill="url(#salaryGrad)"
                          isAnimationActive={false}
                        />
                        <Line
                          type="stepAfter"
                          dataKey="salario"
                          name="Salario"
                          stroke="var(--chart-1)"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: "var(--chart-1)" }}
                          activeDot={{ r: 6 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Bitácora detallada del colaborador */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <History className="h-4 w-4" />
                    Detalle de cambios
                  </CardTitle>
                  <CardDescription>
                    Cada modificación de sueldo y comisión, con el usuario responsable y la fecha.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedStaffLogs.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Este colaborador no tiene cambios registrados.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedStaffLogs.map((log) => {
                        const isSalary = log.field === "monthly_salary"
                        const label = isSalary ? "Salario mensual" : "Comisión"
                        const up = (log.new_value ?? 0) >= (log.old_value ?? 0)
                        const change = isSalary
                          ? `${formatMoney(log.old_value || 0, log.currency_code || "MXN")} → ${formatMoney(log.new_value || 0, log.currency_code || "MXN")}`
                          : `${log.old_value ?? 0}% → ${log.new_value ?? 0}%`
                        return (
                          <div
                            key={log.id}
                            className="flex flex-col gap-1 rounded-lg border border-border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                                  up ? "bg-[var(--chart-1)]/10 text-[var(--chart-1)]" : "bg-destructive/10 text-destructive"
                                }`}
                              >
                                {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground">
                                    {label}
                                  </span>
                                  <span className="tabular-nums">{change}</span>
                                </div>
                                <div className="mt-0.5 text-xs text-muted-foreground">
                                  Por {log.changed_by_name || "Usuario desconocido"}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground sm:text-right">
                              {new Date(log.changed_at).toLocaleString("es-MX", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
              </>
              )}

              {/* ===== Vista comparativa ===== */}
              {evolutionView === "compare" && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Colaboradores a comparar</CardTitle>
                      <CardDescription>
                        Selecciona hasta 5 colaboradores para ver sus salarios en la misma gráfica.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {staffWithHistory.map((s) => {
                          const idx = compareStaffIds.indexOf(s.id)
                          const selected = idx !== -1
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() =>
                                setCompareStaffIds((prev) =>
                                  prev.includes(s.id)
                                    ? prev.filter((id) => id !== s.id)
                                    : prev.length >= 5
                                      ? prev
                                      : [...prev, s.id],
                                )
                              }
                              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                                selected
                                  ? "border-transparent bg-primary text-primary-foreground"
                                  : "border-border bg-card text-foreground hover:bg-muted"
                              }`}
                            >
                              {selected && (
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: compareColors[idx % compareColors.length] }}
                                />
                              )}
                              {s.name}
                            </button>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <LineChartIcon className="h-4 w-4 text-primary" />
                        Comparación de trayectorias
                      </CardTitle>
                      <CardDescription>Salario mensual de los colaboradores seleccionados en el tiempo.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {compareStaffIds.length === 0 ? (
                        <p className="py-16 text-center text-sm text-muted-foreground">
                          Selecciona al menos un colaborador para ver la comparación.
                        </p>
                      ) : (
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={compareSeries} margin={{ top: 16, right: 16, left: 8, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                              <XAxis
                                dataKey="label"
                                tick={{ fill: "hsl(var(--muted-foreground))" }}
                                className="text-xs"
                                tickLine={false}
                                axisLine={false}
                              />
                              <YAxis
                                tick={{ fill: "hsl(var(--muted-foreground))" }}
                                className="text-xs"
                                tickLine={false}
                                axisLine={false}
                                width={70}
                                tickFormatter={(v: number) =>
                                  new Intl.NumberFormat("es-MX", {
                                    notation: "compact",
                                    maximumFractionDigits: 1,
                                  }).format(v)
                                }
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "hsl(var(--card))",
                                  border: "1px solid hsl(var(--border))",
                                  borderRadius: "8px",
                                }}
                                formatter={(value: number, name: string) => [
                                  formatMoney(value, selectedCurrency),
                                  staffWithHistory.find((s) => s.id === name)?.name || name,
                                ]}
                              />
                              {compareStaffIds.map((id, i) => (
                                <Line
                                  key={id}
                                  type="stepAfter"
                                  dataKey={id}
                                  name={id}
                                  stroke={compareColors[i % compareColors.length]}
                                  strokeWidth={2.5}
                                  dot={{ r: 3 }}
                                  activeDot={{ r: 5 }}
                                  connectNulls
                                />
                              ))}
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Leyenda personalizada */}
                      {compareStaffIds.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-4">
                          {compareStaffIds.map((id, i) => (
                            <div key={id} className="flex items-center gap-2 text-sm">
                              <span
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: compareColors[i % compareColors.length] }}
                              />
                              {staffWithHistory.find((s) => s.id === id)?.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmación de cambios de sueldo / comisión */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cambios de compensación</AlertDialogTitle>
            <AlertDialogDescription>
              {sensitiveChanges.length > 0
                ? "Revisa los cambios de sueldo y comisión antes de aplicarlos. Quedarán registrados en la bitácora con tu usuario y la fecha."
                : "Se guardarán los cambios pendientes. ¿Deseas continuar?"}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {sensitiveChanges.length > 0 && (
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
              {sensitiveChanges.map((c, i) => (
                <div key={`${c.staffId}-${c.field}-${i}`} className="text-sm">
                  <div className="font-medium">{c.name}</div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{c.label}:</span>
                    <span className="tabular-nums">{c.display}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={performSave} disabled={saving}>
              {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Sí, aplicar cambios
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
