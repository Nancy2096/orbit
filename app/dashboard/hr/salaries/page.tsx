"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { usePermissions } from "@/components/dashboard/permissions-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Banknote, Users, Wallet, BadgePercent, Save, Search, Info } from "lucide-react"
import { toast } from "sonner"

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
  contract_type: string | null
  hourly_cost: number | null
  monthly_salary: number | null
  currency_id: string | null
  commission_percentage: number | null
  commission_type: string | null
}

// Valores editables por fila
interface EditableRow {
  monthly_salary: string
  hourly_cost: string
  commission_percentage: string
  currency_id: string
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

  // Cambios pendientes por id de empleado
  const [edits, setEdits] = useState<Record<string, EditableRow>>({})

  // Solo pueden editar quienes tienen acceso al módulo de sueldos y salarios.
  const canEdit = fullAccess || hasAnyModule(["salaries"])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [staffRes, agenciesRes, currenciesRes] = await Promise.all([
      supabase
        .from("staff")
        .select(
          "id, employee_code, first_name, last_name, position, department, agency_id, is_global, is_active, contract_type, hourly_cost, monthly_salary, currency_id, commission_percentage, commission_type",
        )
        .eq("is_active", true)
        .order("first_name"),
      supabase.from("agencies").select("id, name, settings").order("name"),
      supabase.from("currencies").select("id, code, name").eq("is_active", true).order("code"),
    ])

    if (staffRes.data) setStaff(staffRes.data as StaffSalary[])
    if (agenciesRes.data) setAgencies(agenciesRes.data as Agency[])
    if (currenciesRes.data) setCurrencies(currenciesRes.data as Currency[])
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
      }
      return { ...prev, [s.id]: { ...base, [field]: value } }
    })
  }

  const filtered = useMemo(() => {
    return staff.filter((s) => {
      if (filterAgency === "global" ? !!s.agency_id : filterAgency !== "all" && s.agency_id !== filterAgency)
        return false
      if (filterContract !== "all" && (s.contract_type || "") !== filterContract) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const full = `${s.first_name} ${s.last_name} ${s.position || ""} ${s.employee_code || ""}`.toLowerCase()
        if (!full.includes(q)) return false
      }
      return true
    })
  }, [staff, filterAgency, filterContract, search])

  // Totales de nómina base mensual agrupados por moneda.
  const totalsByCurrency = useMemo(() => {
    const map = new Map<string, number>()
    filtered.forEach((s) => {
      const code = currencyCode(s.currency_id)
      const eff = effective(s)
      const salary = Number.parseFloat(eff.monthly_salary) || 0
      map.set(code, (map.get(code) || 0) + salary)
    })
    return Array.from(map.entries()).filter(([, v]) => v > 0)
  }, [filtered, currencyCode, effective])

  const withCommission = filtered.filter((s) => (Number.parseFloat(effective(s).commission_percentage) || 0) > 0).length

  const contractTypesPresent = useMemo(() => {
    const set = new Set<string>()
    staff.forEach((s) => s.contract_type && set.add(s.contract_type))
    return Array.from(set)
  }, [staff])

  const dirtyCount = Object.keys(edits).length

  const handleSaveAll = async () => {
    if (dirtyCount === 0) return
    setSaving(true)
    try {
      const updates = Object.entries(edits).map(([id, row]) => {
        const parseNum = (v: string) => {
          const t = v.trim()
          if (t === "") return null
          const n = Number.parseFloat(t)
          return Number.isFinite(n) ? n : null
        }
        const monthlySalary = parseNum(row.monthly_salary)
        const person = staff.find((s) => s.id === id)
        // El costo por hora se deriva automáticamente del salario mensual y las
        // horas laborables de la agencia; no se toma un valor manual.
        const hourlyCost =
          monthlySalary != null && monthlySalary > 0
            ? computeHourlyCost(monthlySalary, person?.agency_id ?? null)
            : null
        return supabase
          .from("staff")
          .update({
            monthly_salary: monthlySalary,
            hourly_cost: hourlyCost,
            commission_percentage: parseNum(row.commission_percentage),
            currency_id: row.currency_id || null,
          })
          .eq("id", id)
      })

      const results = await Promise.all(updates)
      const failed = results.find((r) => r.error)
      if (failed?.error) throw new Error(failed.error.message)

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
        {canEdit && (
          <Button onClick={handleSaveAll} disabled={dirtyCount === 0 || saving}>
            {saving ? <Spinner className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar cambios{dirtyCount > 0 ? ` (${dirtyCount})` : ""}
          </Button>
        )}
      </div>

      {/* Aviso de vinculación */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Los importes que edites aquí actualizan directamente el salario mensual y la comisión de cada colaborador. El{" "}
          <span className="font-medium text-foreground">costo por hora se calcula automáticamente</span> dividiendo el
          salario mensual entre las <span className="font-medium text-foreground">horas laborables</span> configuradas
          en cada agencia. Estos mismos valores se muestran en{" "}
          <span className="font-medium text-foreground">Personal → Costos y Facturación</span> y se utilizan al{" "}
          <span className="font-medium text-foreground">calcular la Nómina</span>.
        </p>
      </div>

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
            <CardTitle className="text-sm font-medium">Con comisión</CardTitle>
            <BadgePercent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{withCommission}</div>
            <p className="mt-1 text-xs text-muted-foreground">Perciben porcentaje de comisión</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monedas</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalsByCurrency.length || 1}</div>
            <p className="mt-1 text-xs text-muted-foreground">Divisas en uso</p>
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
                  <TableHead>Contrato</TableHead>
                  <TableHead className="w-28">Moneda</TableHead>
                  <TableHead className="text-right">Salario mensual</TableHead>
                  <TableHead className="text-right">Costo por hora (auto)</TableHead>
                  <TableHead className="text-right">Comisión %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No hay colaboradores que coincidan con los filtros
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s) => {
                    const eff = effective(s)
                    const isDirty = !!edits[s.id]
                    return (
                      <TableRow key={s.id} className={isDirty ? "bg-primary/5" : undefined}>
                        <TableCell>
                          <Link
                            href={`/dashboard/hr/staff/${s.id}`}
                            className="font-medium hover:underline"
                          >
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
                          <span className="text-sm text-muted-foreground">
                            {contractTypeLabels[s.contract_type || ""] || s.contract_type || "-"}
                          </span>
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
                            type="number"
                            step="0.01"
                            min="0"
                            inputMode="decimal"
                            value={eff.monthly_salary}
                            onChange={(e) => updateField(s, "monthly_salary", e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-right"
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex h-8 items-center justify-end rounded-md bg-muted px-3 text-sm tabular-nums text-muted-foreground">
                            {formatMoney(
                              computeHourlyCost(Number.parseFloat(eff.monthly_salary) || 0, s.agency_id),
                              currencyCode(eff.currency_id || s.currency_id),
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            inputMode="decimal"
                            value={eff.commission_percentage}
                            onChange={(e) => updateField(s, "commission_percentage", e.target.value)}
                            disabled={!canEdit}
                            className="h-8 text-right"
                            placeholder="0"
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
