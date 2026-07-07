"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Clock, Check, X, CalendarDays, Building2, Search, TrendingUp, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Agency {
  id: string
  name: string
}

interface StaffRef {
  id: string
  first_name: string
  last_name: string
  position: string | null
  department: string | null
  agency_id: string | null
}

interface LeaveTypeRef {
  id: string
  name: string
  color: string | null
}

interface AgencyRef {
  id: string
  name: string
}

interface LeaveRequest {
  id: string
  agency_id: string
  staff_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  total_days: number
  is_half_day?: boolean
  half_day_period?: "morning" | "afternoon" | null
  reason: string | null
  status: string
  reviewed_at: string | null
  created_at: string
  staff?: StaffRef
  leave_type?: LeaveTypeRef
  agency?: AgencyRef
  reviewer?: { id: string; first_name: string; last_name: string } | null
  approver?: { id: string; first_name: string; last_name: string } | null
}

interface StaffFull {
  id: string
  first_name: string
  last_name: string
  position: string | null
  department: string | null
  agency_id: string | null
}

interface LeaveBalance {
  id: string
  staff_id: string
  leave_type_id: string
  agency_id: string | null
  year: number
  days_entitled: number
  days_taken: number
  days_pending: number
  days_available: number
}

interface LeaveTypeFull {
  id: string
  name: string
  color: string | null
  days_per_year: number | null
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "approved":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Aprobada</Badge>
    case "rejected":
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rechazada</Badge>
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pendiente</Badge>
    default:
      return <Badge variant="secondary">{STATUS_LABEL[status] || status}</Badge>
  }
}

export default function LeaveRequestsOverviewPage() {
  const supabase = createClient()

  const currentYear = new Date().getFullYear()

  const [agencies, setAgencies] = useState<Agency[]>([])
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [staff, setStaff] = useState<StaffFull[]>([])
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeFull[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [filterAgency, setFilterAgency] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterDepartment, setFilterDepartment] = useState<string>("all")
  const [search, setSearch] = useState<string>("")

  useEffect(() => {
    const load = async () => {
      const [
        { data: agencyData },
        { data: requestData },
        { data: staffData },
        { data: balanceData },
        { data: typeData },
      ] = await Promise.all([
        supabase.from("agencies").select("id, name").order("name"),
        supabase
          .from("leave_requests")
          .select(
            `
            *,
            staff:staff_id(id, first_name, last_name, position, department, agency_id),
            leave_type:leave_type_id(id, name, color),
            agency:agency_id(id, name),
            reviewer:reviewed_by(id, first_name, last_name),
            approver:approver_id(id, first_name, last_name)
          `,
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("staff")
          .select("id, first_name, last_name, position, department, agency_id")
          .eq("is_active", true)
          .order("first_name"),
        supabase
          .from("leave_balances")
          .select("id, staff_id, leave_type_id, agency_id, year, days_entitled, days_taken, days_pending, days_available")
          .eq("year", currentYear),
        supabase
          .from("leave_types")
          .select("id, name, color, days_per_year")
          .eq("is_active", true)
          .order("name"),
      ])
      if (agencyData) setAgencies(agencyData)
      if (requestData) setRequests(requestData as LeaveRequest[])
      if (staffData) setStaff(staffData as StaffFull[])
      if (balanceData) setBalances(balanceData as LeaveBalance[])
      if (typeData) setLeaveTypes(typeData as LeaveTypeFull[])
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Departamentos únicos para el filtro
  const departments = useMemo(() => {
    const set = new Set<string>()
    requests.forEach((r) => {
      const d = r.staff?.department?.trim()
      if (d) set.add(d)
    })
    return Array.from(set).sort()
  }, [requests])

  // Solicitudes filtradas
  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (filterAgency !== "all" && r.agency_id !== filterAgency) return false
      if (filterStatus !== "all" && r.status !== filterStatus) return false
      if (filterDepartment !== "all" && (r.staff?.department || "") !== filterDepartment) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const name = `${r.staff?.first_name || ""} ${r.staff?.last_name || ""}`.toLowerCase()
        if (!name.includes(q)) return false
      }
      return true
    })
  }, [requests, filterAgency, filterStatus, filterDepartment, search])

  // KPIs globales (respetan los filtros de agencia/depto/búsqueda salvo el estado)
  const scoped = useMemo(() => {
    return requests.filter((r) => {
      if (filterAgency !== "all" && r.agency_id !== filterAgency) return false
      if (filterDepartment !== "all" && (r.staff?.department || "") !== filterDepartment) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const name = `${r.staff?.first_name || ""} ${r.staff?.last_name || ""}`.toLowerCase()
        if (!name.includes(q)) return false
      }
      return true
    })
  }, [requests, filterAgency, filterDepartment, search])

  const kpis = useMemo(() => {
    const total = scoped.length
    const pending = scoped.filter((r) => r.status === "pending").length
    const approved = scoped.filter((r) => r.status === "approved").length
    const rejected = scoped.filter((r) => r.status === "rejected").length
    const daysApproved = scoped
      .filter((r) => r.status === "approved")
      .reduce((sum, r) => sum + Number(r.total_days || 0), 0)
    return { total, pending, approved, rejected, daysApproved }
  }, [scoped])

  // Desglose por agencia
  const byAgency = useMemo(() => {
    const map = new Map<
      string,
      { name: string; pending: number; approved: number; rejected: number; total: number; days: number }
    >()
    // Inicializar todas las agencias conocidas para que aparezcan aunque tengan 0
    agencies.forEach((a) => map.set(a.id, { name: a.name, pending: 0, approved: 0, rejected: 0, total: 0, days: 0 }))
    scoped.forEach((r) => {
      const key = r.agency_id
      const entry = map.get(key) || {
        name: r.agency?.name || "Sin agencia",
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0,
        days: 0,
      }
      entry.total += 1
      if (r.status === "pending") entry.pending += 1
      else if (r.status === "approved") entry.approved += 1
      else if (r.status === "rejected") entry.rejected += 1
      if (r.status === "approved") entry.days += Number(r.total_days || 0)
      map.set(key, entry)
    })
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [scoped, agencies])

  // Desglose por tipo de permiso
  const byType = useMemo(() => {
    const map = new Map<string, { name: string; color: string; count: number; days: number }>()
    scoped.forEach((r) => {
      const key = r.leave_type_id
      const entry = map.get(key) || {
        name: r.leave_type?.name || "Sin tipo",
        color: r.leave_type?.color || "#64748b",
        count: 0,
        days: 0,
      }
      entry.count += 1
      entry.days += Number(r.total_days || 0)
      map.set(key, entry)
    })
    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [scoped])

  const chartData = useMemo(
    () => byAgency.map((a) => ({ agency: a.name, Pendiente: a.pending, Aprobada: a.approved, Rechazada: a.rejected })),
    [byAgency],
  )

  const chartConfig = {
    Pendiente: { label: "Pendiente", color: "hsl(45 93% 47%)" },
    Aprobada: { label: "Aprobada", color: "hsl(142 71% 45%)" },
    Rechazada: { label: "Rechazada", color: "hsl(0 84% 60%)" },
  }

  // Fin del año calendario: los saldos vencen el 31 de diciembre
  const yearEnd = useMemo(() => new Date(currentYear, 11, 31), [currentYear])
  const daysUntilYearEnd = useMemo(() => {
    const today = new Date()
    const diff = Math.ceil((yearEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }, [yearEnd])

  // Saldos del personal (respetan filtros de agencia/depto/búsqueda)
  const staffBalances = useMemo(() => {
    const typeMap = new Map(leaveTypes.map((t) => [t.id, t]))
    return staff
      .filter((s) => {
        if (filterAgency !== "all" && s.agency_id !== filterAgency) return false
        if (filterDepartment !== "all" && (s.department || "") !== filterDepartment) return false
        if (search.trim()) {
          const q = search.trim().toLowerCase()
          const name = `${s.first_name} ${s.last_name}`.toLowerCase()
          if (!name.includes(q)) return false
        }
        return true
      })
      .map((s) => {
        const agencyName = agencies.find((a) => a.id === s.agency_id)?.name || "-"
        const rows = balances
          .filter((b) => b.staff_id === s.id)
          .map((b) => {
            const t = typeMap.get(b.leave_type_id)
            const entitled = Number(b.days_entitled || 0)
            const taken = Number(b.days_taken || 0)
            const pending = Number(b.days_pending || 0)
            const available =
              b.days_available != null ? Number(b.days_available) : Math.max(0, entitled - taken - pending)
            return {
              typeId: b.leave_type_id,
              typeName: t?.name || "Permiso",
              color: t?.color || "#64748b",
              entitled,
              taken,
              pending,
              available,
            }
          })
          .sort((a, b) => a.typeName.localeCompare(b.typeName))
        const totalAvailable = rows.reduce((sum, r) => sum + r.available, 0)
        const totalTaken = rows.reduce((sum, r) => sum + r.taken, 0)
        return { staff: s, agencyName, rows, totalAvailable, totalTaken }
      })
      .sort((a, b) => `${a.staff.first_name} ${a.staff.last_name}`.localeCompare(`${b.staff.first_name} ${b.staff.last_name}`))
  }, [staff, balances, leaveTypes, agencies, filterAgency, filterDepartment, search])

  // Indicadores de saldos
  const balanceKpis = useMemo(() => {
    let entitled = 0
    let taken = 0
    let pending = 0
    let available = 0
    staffBalances.forEach((sb) => {
      sb.rows.forEach((r) => {
        entitled += r.entitled
        taken += r.taken
        pending += r.pending
        available += r.available
      })
    })
    return { entitled, taken, pending, available }
  }, [staffBalances])

  // Gráfico: días otorgados vs usados vs disponibles por tipo de permiso
  const balanceByType = useMemo(() => {
    const map = new Map<string, { name: string; Otorgados: number; Usados: number; Disponibles: number }>()
    staffBalances.forEach((sb) => {
      sb.rows.forEach((r) => {
        const entry = map.get(r.typeName) || { name: r.typeName, Otorgados: 0, Usados: 0, Disponibles: 0 }
        entry.Otorgados += r.entitled
        entry.Usados += r.taken
        entry.Disponibles += r.available
        map.set(r.typeName, entry)
      })
    })
    return Array.from(map.values()).sort((a, b) => b.Otorgados - a.Otorgados)
  }, [staffBalances])

  const balanceChartConfig = {
    Otorgados: { label: "Otorgados", color: "hsl(217 91% 60%)" },
    Usados: { label: "Usados", color: "hsl(0 84% 60%)" },
    Disponibles: { label: "Disponibles", color: "hsl(142 71% 45%)" },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panorama de Solicitudes de Permiso</h1>
        <p className="text-muted-foreground">
          Vista completa de las solicitudes de permiso de todo el personal y todas las agencias
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Solicitudes</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.total}</div>
            <p className="text-xs text-muted-foreground">En el alcance seleccionado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.pending}</div>
            <p className="text-xs text-muted-foreground">Esperando aprobación</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.approved}</div>
            <p className="text-xs text-muted-foreground">Solicitudes autorizadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.rejected}</div>
            <p className="text-xs text-muted-foreground">No autorizadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Días Aprobados</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.daysApproved}</div>
            <p className="text-xs text-muted-foreground">Total de días concedidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empleado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterAgency} onValueChange={setFilterAgency}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Building2 className="w-4 h-4 mr-2" />
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
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los departamentos</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="approved">Aprobadas</SelectItem>
              <SelectItem value="rejected">Rechazadas</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs defaultValue="detalle" className="space-y-4">
        <TabsList>
          <TabsTrigger value="detalle">Detalle</TabsTrigger>
          <TabsTrigger value="saldos">Saldos del Personal</TabsTrigger>
          <TabsTrigger value="agencias">Por Agencia</TabsTrigger>
          <TabsTrigger value="tipos">Por Tipo</TabsTrigger>
        </TabsList>

        {/* Detalle: tabla completa */}
        <TabsContent value="detalle" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todas las Solicitudes</CardTitle>
              <CardDescription>
                {filtered.length} solicitud{filtered.length === 1 ? "" : "es"} en el alcance seleccionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Agencia</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Días</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Aprobador</TableHead>
                      <TableHead>Solicitado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No hay solicitudes que coincidan con los filtros
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <p className="font-medium">
                              {r.staff?.first_name} {r.staff?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">{r.staff?.position}</p>
                          </TableCell>
                          <TableCell>{r.agency?.name || "-"}</TableCell>
                          <TableCell>{r.staff?.department || "-"}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              style={{ borderColor: r.leave_type?.color || undefined, color: r.leave_type?.color || undefined }}
                            >
                              {r.leave_type?.name}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(r.start_date), "dd MMM", { locale: es })} -{" "}
                            {format(new Date(r.end_date), "dd MMM yyyy", { locale: es })}
                          </TableCell>
                          <TableCell>
                            {r.total_days}
                            {r.is_half_day && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                (½ · {r.half_day_period === "afternoon" ? "tarde" : "mañana"})
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={r.status} />
                          </TableCell>
                          <TableCell>
                            {r.reviewer
                              ? `${r.reviewer.first_name} ${r.reviewer.last_name}`
                              : r.approver
                                ? `${r.approver.first_name} ${r.approver.last_name}`
                                : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(r.created_at), "dd MMM yyyy", { locale: es })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Saldos del personal: días por categoría, usados, disponibles y vencimiento */}
        <TabsContent value="saldos" className="space-y-4">
          {/* Indicadores de saldos */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Días Otorgados {currentYear}</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{balanceKpis.entitled}</div>
                <p className="text-xs text-muted-foreground">Total del personal en alcance</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Días Usados</CardTitle>
                <Check className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{balanceKpis.taken}</div>
                <p className="text-xs text-muted-foreground">
                  {balanceKpis.entitled > 0 ? Math.round((balanceKpis.taken / balanceKpis.entitled) * 100) : 0}% de lo otorgado
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Días Disponibles</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{balanceKpis.available}</div>
                <p className="text-xs text-muted-foreground">Saldo sin usar</p>
              </CardContent>
            </Card>
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-amber-800">Vencen el 31 dic {currentYear}</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-800">{balanceKpis.available}</div>
                <p className="text-xs text-amber-700">
                  En {daysUntilYearEnd} día{daysUntilYearEnd === 1 ? "" : "s"} · los saldos se reinician cada año
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico: otorgados vs usados vs disponibles por tipo */}
          <Card>
            <CardHeader>
              <CardTitle>Días por Tipo de Permiso</CardTitle>
              <CardDescription>Comparativo de días otorgados, usados y disponibles ({currentYear})</CardDescription>
            </CardHeader>
            <CardContent>
              {balanceByType.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Sin saldos registrados para el año en curso</p>
              ) : (
                <ChartContainer config={balanceChartConfig} className="h-[320px] w-full">
                  <BarChart accessibilityLayer data={balanceByType}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="Otorgados" fill="var(--color-Otorgados)" radius={4} />
                    <Bar dataKey="Usados" fill="var(--color-Usados)" radius={4} />
                    <Bar dataKey="Disponibles" fill="var(--color-Disponibles)" radius={4} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Tabla: lista completa del personal con saldos por categoría */}
          <Card>
            <CardHeader>
              <CardTitle>Saldos por Empleado</CardTitle>
              <CardDescription>
                Días restantes por categoría, días usados y fecha de vencimiento (31 dic {currentYear})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Agencia</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-center">Otorgados</TableHead>
                      <TableHead className="text-center">Usados</TableHead>
                      <TableHead className="text-center">Pendientes</TableHead>
                      <TableHead className="text-center">Disponibles</TableHead>
                      <TableHead className="whitespace-nowrap">Vence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffBalances.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No hay personal que coincida con los filtros
                        </TableCell>
                      </TableRow>
                    ) : (
                      staffBalances.map((sb) =>
                        sb.rows.length === 0 ? (
                          <TableRow key={sb.staff.id}>
                            <TableCell>
                              <p className="font-medium">
                                {sb.staff.first_name} {sb.staff.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">{sb.staff.position}</p>
                            </TableCell>
                            <TableCell>{sb.agencyName}</TableCell>
                            <TableCell colSpan={6} className="text-muted-foreground text-sm">
                              Sin saldos registrados para {currentYear}
                            </TableCell>
                          </TableRow>
                        ) : (
                          sb.rows.map((r, idx) => (
                            <TableRow key={`${sb.staff.id}-${r.typeId}`}>
                              {idx === 0 ? (
                                <>
                                  <TableCell rowSpan={sb.rows.length} className="align-top">
                                    <p className="font-medium">
                                      {sb.staff.first_name} {sb.staff.last_name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{sb.staff.position}</p>
                                  </TableCell>
                                  <TableCell rowSpan={sb.rows.length} className="align-top">
                                    {sb.agencyName}
                                  </TableCell>
                                </>
                              ) : null}
                              <TableCell>
                                <span className="flex items-center gap-2">
                                  <span
                                    className="inline-block h-3 w-3 rounded-full"
                                    style={{ backgroundColor: r.color }}
                                  />
                                  {r.typeName}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">{r.entitled}</TableCell>
                              <TableCell className="text-center text-red-600">{r.taken}</TableCell>
                              <TableCell className="text-center text-yellow-600">{r.pending}</TableCell>
                              <TableCell className="text-center font-semibold text-green-600">{r.available}</TableCell>
                              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                31 dic {currentYear}
                              </TableCell>
                            </TableRow>
                          ))
                        ),
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Por Agencia: gráfico + tarjetas */}
        <TabsContent value="agencias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes por Agencia</CardTitle>
              <CardDescription>Distribución de estados en cada agencia</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Sin datos para mostrar</p>
              ) : (
                <ChartContainer config={chartConfig} className="h-[320px] w-full">
                  <BarChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="agency" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="Pendiente" stackId="a" fill="var(--color-Pendiente)" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="Aprobada" stackId="a" fill="var(--color-Aprobada)" />
                    <Bar dataKey="Rechazada" stackId="a" fill="var(--color-Rechazada)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {byAgency.map((a) => (
              <Card key={a.name}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {a.name}
                  </CardTitle>
                  <CardDescription>
                    {a.total} solicitud{a.total === 1 ? "" : "es"} · {a.days} días aprobados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-yellow-600">Pendientes</span>
                    <span className="font-medium">{a.pending}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600">Aprobadas</span>
                    <span className="font-medium">{a.approved}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-red-600">Rechazadas</span>
                    <span className="font-medium">{a.rejected}</span>
                  </div>
                  <Progress
                    value={a.total > 0 ? (a.approved / a.total) * 100 : 0}
                    className="h-2 mt-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {a.total > 0 ? Math.round((a.approved / a.total) * 100) : 0}% aprobadas
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Por Tipo de permiso */}
        <TabsContent value="tipos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes por Tipo de Permiso</CardTitle>
              <CardDescription>Cantidad de solicitudes y días por cada tipo</CardDescription>
            </CardHeader>
            <CardContent>
              {byType.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Sin datos para mostrar</p>
              ) : (
                <div className="space-y-4">
                  {byType.map((t) => {
                    const max = Math.max(...byType.map((x) => x.count))
                    return (
                      <div key={t.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 font-medium">
                            <span
                              className="inline-block h-3 w-3 rounded-full"
                              style={{ backgroundColor: t.color }}
                            />
                            {t.name}
                          </span>
                          <span className="text-muted-foreground">
                            {t.count} solicitudes · {t.days} días
                          </span>
                        </div>
                        <Progress value={max > 0 ? (t.count / max) * 100 : 0} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
