"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Users, 
  Palmtree, 
  Award, 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Clock,
  Building2,
  Briefcase,
  GraduationCap,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  UserCheck,
  UserX,
  AlertCircle,
  CalendarDays,
} from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts"

interface Agency {
  id: string
  name: string
}

interface DashboardStats {
  totalStaff: number
  activeStaff: number
  inactiveStaff: number
  pendingVacations: number
  approvedVacations: number
  totalRecognitions: number
  totalPayrollAmount: number
  staffByDepartment: { name: string; count: number }[]
  staffByContractType: { name: string; count: number }[]
  vacationsByMonth: { month: string; approved: number; pending: number; rejected: number }[]
  payrollByMonth: { month: string; amount: number }[]
  recentHires: { id: string; name: string; position: string; date: string }[]
  upcomingBirthdays: { id: string; name: string; date: string }[]
  pendingLeaveRequests: { id: string; name: string; type: string; days: number; status: string }[]
}

interface Balance {
  id: string
  staff_id: string
  total_points: number
  total_redeemed: number
  staff?: { first_name: string; last_name: string; position: string }
}

interface Allocation {
  id: string
  staff_id: string
  recognitions_given: number
  points_received: number
}

interface RecognitionSettings {
  max_recognitions_per_month: number
  point_value: number
}

const CHART_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]

export default function HRDashboardPage() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [selectedAgency, setSelectedAgency] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [balances, setBalances] = useState<Balance[]>([])
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [recognitionSettings, setRecognitionSettings] = useState<RecognitionSettings | null>(null)
  const [staffList, setStaffList] = useState<{ id: string; first_name: string; last_name: string; position: string; agency_id: string | null }[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalStaff: 0,
    activeStaff: 0,
    inactiveStaff: 0,
    pendingVacations: 0,
    approvedVacations: 0,
    totalRecognitions: 0,
    totalPayrollAmount: 0,
    staffByDepartment: [],
    staffByContractType: [],
    vacationsByMonth: [],
    payrollByMonth: [],
    recentHires: [],
    upcomingBirthdays: [],
    pendingLeaveRequests: [],
  })
  const supabase = createClient()

  useEffect(() => {
    fetchAgencies()
  }, [])

  useEffect(() => {
    if (selectedAgency) {
      fetchDashboardData()
    }
  }, [selectedAgency])

  const fetchAgencies = async () => {
    const { data } = await supabase
      .from("agencies")
      .select("id, name")
      .eq("is_active", true)
      .order("name")

    if (data && data.length > 0) {
      setAgencies(data)
      setSelectedAgency(data[0].id)
    }
    setLoading(false)
  }

  const fetchDashboardData = async () => {
    setLoading(true)

    // Fetch staff stats
    const { data: staffData } = await supabase
      .from("staff")
      .select("id, first_name, last_name, position, department, contract_type, is_active, created_at, birth_date")
      .or(`agency_id.eq.${selectedAgency},agency_id.is.null`)

    const activeStaff = staffData?.filter(s => s.is_active) || []
    const inactiveStaff = staffData?.filter(s => !s.is_active) || []

    // Staff by department
    const deptCounts: { [key: string]: number } = {}
    activeStaff.forEach(s => {
      const dept = s.department || "Sin departamento"
      deptCounts[dept] = (deptCounts[dept] || 0) + 1
    })
    const staffByDepartment = Object.entries(deptCounts).map(([name, count]) => ({ name, count }))

    // Staff by contract type
    const contractCounts: { [key: string]: number } = {}
    activeStaff.forEach(s => {
      const contract = s.contract_type || "No especificado"
      contractCounts[contract] = (contractCounts[contract] || 0) + 1
    })
    const staffByContractType = Object.entries(contractCounts).map(([name, count]) => ({ name, count }))

    // Recent hires (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentHires = (staffData || [])
      .filter(s => s.created_at && new Date(s.created_at) >= thirtyDaysAgo)
      .slice(0, 5)
      .map(s => ({
        id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        position: s.position || "Sin puesto",
        date: s.created_at ? new Date(s.created_at).toLocaleDateString("es-MX") : ""
      }))

    // Upcoming birthdays (next 30 days)
    const today = new Date()
    const upcomingBirthdays = (staffData || [])
      .filter(s => {
        if (!s.birth_date) return false
        const birth = new Date(s.birth_date)
        const thisYearBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate())
        const diffDays = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return diffDays >= 0 && diffDays <= 30
      })
      .slice(0, 5)
      .map(s => ({
        id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        date: s.birth_date ? new Date(s.birth_date).toLocaleDateString("es-MX", { month: "short", day: "numeric" }) : ""
      }))

    // Fetch vacation requests
    const { data: vacationsData } = await supabase
      .from("leave_requests")
      .select("id, status, days_requested, staff:staff_id(first_name, last_name), leave_type:leave_type_id(name)")
      .eq("agency_id", selectedAgency)

    const pendingVacations = vacationsData?.filter(v => v.status === "pending").length || 0
    const approvedVacations = vacationsData?.filter(v => v.status === "approved").length || 0

    const pendingLeaveRequests = (vacationsData || [])
      .filter(v => v.status === "pending")
      .slice(0, 5)
      .map(v => ({
        id: v.id,
        name: v.staff ? `${(v.staff as any).first_name} ${(v.staff as any).last_name}` : "Desconocido",
        type: v.leave_type ? (v.leave_type as any).name : "Permiso",
        days: v.days_requested || 0,
        status: v.status
      }))

    // Vacations by month (mock data for visualization)
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"]
    const vacationsByMonth = months.map(month => ({
      month,
      approved: Math.floor(Math.random() * 10) + 2,
      pending: Math.floor(Math.random() * 5),
      rejected: Math.floor(Math.random() * 3)
    }))

    // Fetch recognition transactions
    const { data: recognitionsData } = await supabase
      .from("recognition_transactions")
      .select("id")
      .eq("agency_id", selectedAgency)

    const totalRecognitions = recognitionsData?.length || 0

    // Fetch recognition balances (for ranking)
    const { data: balancesData } = await supabase
      .from("recognition_balances")
      .select("id, staff_id, total_points, total_redeemed, staff:staff_id(first_name, last_name, position)")
      .eq("agency_id", selectedAgency)
      .order("total_points", { ascending: false })

    setBalances(balancesData || [])

    // Fetch current month allocations (for admin)
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    const currentQuarter = Math.ceil(currentMonth / 3)
    
    const { data: allocationsData } = await supabase
      .from("recognition_point_allocations")
      .select("id, staff_id, recognitions_given, points_received")
      .eq("agency_id", selectedAgency)
      .eq("year", currentYear)
      .eq("quarter", currentQuarter)

    setAllocations(allocationsData || [])

    // Fetch recognition settings
    const { data: settingsData } = await supabase
      .from("recognition_settings")
      .select("max_recognitions_per_month, point_value")
      .eq("agency_id", selectedAgency)
      .single()

    setRecognitionSettings(settingsData)

    // Store staff list for recognition admin
    setStaffList(activeStaff.map(s => ({
      id: s.id,
      first_name: s.first_name,
      last_name: s.last_name,
      position: s.position || "",
      agency_id: null
    })))

    // Fetch payroll data
    const { data: payrollData } = await supabase
      .from("payroll_periods")
      .select("id, total_amount")
      .eq("agency_id", selectedAgency)
      .eq("status", "closed")

    const totalPayrollAmount = payrollData?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0

    // Payroll by month (mock data for visualization)
    const payrollByMonth = months.map(month => ({
      month,
      amount: Math.floor(Math.random() * 500000) + 200000
    }))

    setStats({
      totalStaff: staffData?.length || 0,
      activeStaff: activeStaff.length,
      inactiveStaff: inactiveStaff.length,
      pendingVacations,
      approvedVacations,
      totalRecognitions,
      totalPayrollAmount,
      staffByDepartment,
      staffByContractType,
      vacationsByMonth,
      payrollByMonth,
      recentHires,
      upcomingBirthdays,
      pendingLeaveRequests,
    })

    setLoading(false)
  }

  if (loading && agencies.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recursos Humanos</h1>
          <p className="text-muted-foreground">Panel de control y métricas del equipo</p>
        </div>
        <Select value={selectedAgency} onValueChange={setSelectedAgency}>
          <SelectTrigger className="w-[200px]">
            <Building2 className="h-4 w-4 mr-2" />
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

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Empleados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalStaff}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="default" className="text-xs">
                <UserCheck className="h-3 w-3 mr-1" />
                {stats.activeStaff} activos
              </Badge>
              {stats.inactiveStaff > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <UserX className="h-3 w-3 mr-1" />
                  {stats.inactiveStaff} inactivos
                </Badge>
              )}
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Solicitudes de Permiso</CardTitle>
            <Palmtree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingVacations + stats.approvedVacations}</div>
            <div className="flex items-center gap-2 mt-1">
              {stats.pendingVacations > 0 && (
                <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                  <Clock className="h-3 w-3 mr-1" />
                  {stats.pendingVacations} pendientes
                </Badge>
              )}
              <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                {stats.approvedVacations} aprobadas
              </Badge>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reconocimientos</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalRecognitions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de reconocimientos dados
            </p>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nómina Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${stats.totalPayrollAmount.toLocaleString("es-MX")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Períodos cerrados
            </p>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Staff by Department */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Empleados por Departamento</CardTitle>
            <CardDescription>Distribución del equipo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.staffByDepartment}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="name"
                  >
                    {stats.staffByDepartment.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [`${value} empleados`, name]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend 
                    layout="vertical" 
                    align="right" 
                    verticalAlign="middle"
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Vacations by Month */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Permisos por Mes</CardTitle>
            <CardDescription>Solicitudes aprobadas, pendientes y rechazadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.vacationsByMonth} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="approved" name="Aprobadas" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Pendientes" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rejected" name="Rechazadas" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Payroll Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Tendencia de Nómina</CardTitle>
            <CardDescription>Costo total de nómina por mes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.payrollByMonth}>
                  <defs>
                    <linearGradient id="payrollGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis 
                    className="text-xs" 
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString("es-MX")}`, "Nómina"]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    fill="url(#payrollGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Contract Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tipos de Contrato</CardTitle>
            <CardDescription>Distribución por tipo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.staffByContractType.map((item, index) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground">{item.count}</span>
                  </div>
                  <Progress 
                    value={(item.count / stats.totalStaff) * 100} 
                    className="h-2"
                    style={{ 
                      ['--progress-background' as any]: CHART_COLORS[index % CHART_COLORS.length] 
                    }}
                  />
                </div>
              ))}
              {stats.staffByContractType.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay datos disponibles
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lists Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Pending Leave Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Solicitudes Pendientes</CardTitle>
              <CardDescription>Permisos por aprobar</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/hr/vacations">
                Ver todas
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.pendingLeaveRequests.length > 0 ? (
                stats.pendingLeaveRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{request.name}</p>
                      <p className="text-xs text-muted-foreground">{request.type}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="border-amber-500 text-amber-600">
                        {request.days} días
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay solicitudes pendientes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Hires */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Nuevas Incorporaciones</CardTitle>
              <CardDescription>Últimos 30 días</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/hr/staff">
                Ver equipo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentHires.length > 0 ? (
                stats.recentHires.map((hire) => (
                  <div key={hire.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{hire.name}</p>
                      <p className="text-xs text-muted-foreground">{hire.position}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{hire.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay nuevas incorporaciones</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Birthdays */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próximos Cumpleaños</CardTitle>
            <CardDescription>En los próximos 30 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.upcomingBirthdays.length > 0 ? (
                stats.upcomingBirthdays.map((birthday) => (
                  <div key={birthday.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{birthday.name}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {birthday.date}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay cumpleaños próximos</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recognition Ranking & Administration */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              Ranking de Puntos
            </CardTitle>
            <CardDescription>
              Los empleados con más puntos acumulados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {balances.slice(0, 5).map((balance, index) => (
                <div key={balance.id} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? "bg-yellow-100 text-yellow-700" :
                    index === 1 ? "bg-gray-100 text-gray-700" :
                    index === 2 ? "bg-orange-100 text-orange-700" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {index + 1}
                  </div>
                  <Avatar>
                    <AvatarFallback>
                      {balance.staff?.first_name?.[0]}{balance.staff?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">
                      {balance.staff ? `${balance.staff.first_name} ${balance.staff.last_name}` : "Desconocido"}
                    </p>
                    <p className="text-sm text-muted-foreground">{balance.staff?.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{balance.total_points}</p>
                    <p className="text-xs text-muted-foreground">puntos</p>
                  </div>
                </div>
              ))}
              {balances.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay datos de ranking aún</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recognition Administration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-500" />
              Reconocimientos del Mes
            </CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" })} - Reconocimientos dados y recibidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {staffList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay empleados registrados</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead className="text-center">Dados</TableHead>
                    <TableHead className="text-right">Pts Recibidos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffList.slice(0, 5).map((staff) => {
                    const alloc = allocations.find(a => a.staff_id === staff.id)
                    const maxRecognitions = recognitionSettings?.max_recognitions_per_month || 2
                    return (
                      <TableRow key={staff.id}>
                        <TableCell className="font-medium">
                          {staff.first_name} {staff.last_name}
                        </TableCell>
                        <TableCell className="text-center">{alloc?.recognitions_given || 0} / {maxRecognitions}</TableCell>
                        <TableCell className="text-right text-green-600">+{alloc?.points_received || 0}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
            {staffList.length > 5 && (
              <div className="mt-4 text-center">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/hr/recognitions">
                    Ver todos
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Access */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acceso Rápido</CardTitle>
          <CardDescription>Módulos de Recursos Humanos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/dashboard/hr/staff">
                <Users className="h-5 w-5 text-blue-500" />
                <span>Personal</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/dashboard/hr/vacations">
                <Palmtree className="h-5 w-5 text-green-500" />
                <span>Permisos</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/dashboard/hr/leave-requests">
                <Calendar className="h-5 w-5 text-teal-500" />
                <span>Panorama Permisos</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/dashboard/hr/payroll">
                <Wallet className="h-5 w-5 text-purple-500" />
                <span>Nómina</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/dashboard/hr/recognitions">
                <Award className="h-5 w-5 text-amber-500" />
                <span>Reconocimientos</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/dashboard/hr/calendar?admin=1">
                <CalendarDays className="h-5 w-5 text-rose-500" />
                <span>Calendario</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/dashboard/hr/organigrama">
                <Building2 className="h-5 w-5 text-cyan-500" />
                <span>Organigrama</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/dashboard/hr/training">
                <GraduationCap className="h-5 w-5 text-pink-500" />
                <span>Capacitaciones</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/dashboard/hr/evaluations">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <span>Evaluaciones</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/dashboard/hr/loans">
                <DollarSign className="h-5 w-5 text-orange-500" />
                <span>Préstamos</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/dashboard/hr/commissions">
                <Briefcase className="h-5 w-5 text-indigo-500" />
                <span>Comisiones</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/dashboard/hr/workload">
                <Clock className="h-5 w-5 text-rose-500" />
                <span>Carga Laboral</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
