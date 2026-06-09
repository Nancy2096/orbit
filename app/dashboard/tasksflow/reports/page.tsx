"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
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
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Kanban,
  Calendar,
  GanttChart,
  FileCheck,
  Activity,
  FileText,
  Download,
  Building2,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Target,
  Zap,
  DollarSign,
  Repeat,
  Filter,
  X,
  CalendarDays,
  User,
  Briefcase,
} from "lucide-react"
import Link from "next/link"
import { TaskFlowNavigation } from "@/components/tasksflow/navigation"

const CHART_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

// Report data
const productivityByAreaData = [
  { name: "Diseño", completadas: 28, total: 35, efficiency: 92 },
  { name: "Programación", completadas: 15, total: 22, efficiency: 78 },
  { name: "Estrategia", completadas: 32, total: 38, efficiency: 95 },
  { name: "Community", completadas: 18, total: 24, efficiency: 85 },
  { name: "Producción", completadas: 8, total: 18, efficiency: 55 },
  { name: "Copywriting", completadas: 12, total: 15, efficiency: 88 },
]

const clientHoursData = [
  { name: "Horizonte", horas: 85, presupuesto: 80 },
  { name: "Torre Central", horas: 62, presupuesto: 60 },
  { name: "Bosques", horas: 78, presupuesto: 70 },
  { name: "Nova Arq", horas: 45, presupuesto: 40 },
  { name: "Altiva", horas: 35, presupuesto: 40 },
]

const weeklyTrendsData = [
  { semana: "S1", tareas: 42, completadas: 38, horas: 180 },
  { semana: "S2", tareas: 48, completadas: 42, horas: 195 },
  { semana: "S3", tareas: 55, completadas: 48, horas: 210 },
  { semana: "S4", tareas: 52, completadas: 45, horas: 198 },
]

const delaysByAreaData = [
  { name: "Diseño", retrasos: 2 },
  { name: "Programación", retrasos: 5 },
  { name: "Estrategia", retrasos: 1 },
  { name: "Community", retrasos: 2 },
  { name: "Producción", retrasos: 6 },
  { name: "Copywriting", retrasos: 1 },
]

const clientChangeRequestsData = [
  { name: "Horizonte", cambios: 8 },
  { name: "Torre Central", cambios: 15 },
  { name: "Bosques", cambios: 12 },
  { name: "Nova Arq", cambios: 3 },
  { name: "Altiva", cambios: 5 },
]

const deliverableApprovalsData = [
  { name: "Aprobados", value: 28, color: "#10b981" },
  { name: "Rechazados", value: 4, color: "#ef4444" },
  { name: "Pendientes", value: 8, color: "#f59e0b" },
]

const reportTypes = [
  { id: "productivity", name: "Productividad por Área", icon: TrendingUp, description: "Análisis de rendimiento por área" },
  { id: "hours", name: "Horas por Cliente", icon: Clock, description: "Tiempo invertido vs contratado" },
  { id: "delays", name: "Tareas Vencidas", icon: AlertTriangle, description: "Retrasos por área y responsable" },
  { id: "workload", name: "Carga Laboral", icon: Activity, description: "Distribución de trabajo del equipo" },
  { id: "deliverables", name: "Entregables", icon: FileCheck, description: "Aprobados vs rechazados" },
  { id: "compliance", name: "Cumplimiento Mensual", icon: Target, description: "Indicadores de cumplimiento" },
  { id: "profitability", name: "Rentabilidad", icon: DollarSign, description: "Rentabilidad por proyecto" },
  { id: "changes", name: "Vueltas de Cambios", icon: Repeat, description: "Solicitudes de cambios por cliente" },
]

// Mock data for staff and accounts
const mockStaff = [
  { id: "1", name: "Ana López" },
  { id: "2", name: "Carlos Ruiz" },
  { id: "3", name: "Diana García" },
  { id: "4", name: "Eduardo Méndez" },
  { id: "5", name: "Fernando Torres" },
]

const mockAccounts = [
  { id: "1", name: "Coca-Cola México" },
  { id: "2", name: "Nestlé" },
  { id: "3", name: "Bimbo" },
  { id: "4", name: "Televisa" },
  { id: "5", name: "Liverpool" },
]

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [selectedAgency, setSelectedAgency] = useState("all")
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [selectedReport, setSelectedReport] = useState("productivity")
  const [agencies, setAgencies] = useState<any[]>([])
  
  // Advanced filters
  const [showFilters, setShowFilters] = useState(false)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedPerson, setSelectedPerson] = useState("all")
  const [selectedAccount, setSelectedAccount] = useState("all")
  
  const activeFiltersCount = [dateFrom, dateTo, selectedPerson !== "all" ? selectedPerson : "", selectedAccount !== "all" ? selectedAccount : ""].filter(Boolean).length

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("agencies").select("id, name").eq("is_active", true)
      if (data) setAgencies(data)
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            Reportes
          </h1>
          <p className="text-muted-foreground">Análisis y métricas de productividad operativa</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedAgency} onValueChange={setSelectedAgency}>
            <SelectTrigger className="w-36">
              <Building2 className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Agencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {agencies.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mes</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Año</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          <Button>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros Avanzados
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setDateFrom("")
                  setDateTo("")
                  setSelectedPerson("all")
                  setSelectedAccount("all")
                }}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar Filtros
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Date Range */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  Fecha Desde
                </Label>
                <Input 
                  type="date" 
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  Fecha Hasta
                </Label>
                <Input 
                  type="date" 
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              
              {/* Person Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Persona
                </Label>
                <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar persona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las personas</SelectItem>
                    {mockStaff.map(person => (
                      <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Account Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  Cuenta
                </Label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las cuentas</SelectItem>
                    {mockAccounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Active Filters Summary */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                <span className="text-sm text-muted-foreground">Filtros activos:</span>
                {dateFrom && (
                  <Badge variant="secondary" className="gap-1">
                    Desde: {dateFrom}
                    <button onClick={() => setDateFrom("")} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {dateTo && (
                  <Badge variant="secondary" className="gap-1">
                    Hasta: {dateTo}
                    <button onClick={() => setDateTo("")} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedPerson !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {mockStaff.find(p => p.id === selectedPerson)?.name}
                    <button onClick={() => setSelectedPerson("all")} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedAccount !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {mockAccounts.find(a => a.id === selectedAccount)?.name}
                    <button onClick={() => setSelectedAccount("all")} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <TaskFlowNavigation />

      {/* Report Type Selector */}
      <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-8">
        {reportTypes.map((report) => {
          const Icon = report.icon
          return (
            <Card 
              key={report.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedReport === report.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedReport(report.id)}
            >
              <CardContent className="p-3 text-center">
                <Icon className={`h-6 w-6 mx-auto mb-1 ${
                  selectedReport === report.id ? "text-primary" : "text-muted-foreground"
                }`} />
                <p className="text-xs font-medium line-clamp-1">{report.name}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* KPI Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tareas Completadas</p>
                <p className="text-2xl font-bold">173</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% vs mes anterior
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Horas Trabajadas</p>
                <p className="text-2xl font-bold">783h</p>
                <p className="text-xs text-amber-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +5% vs presupuesto
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Eficiencia General</p>
                <p className="text-2xl font-bold">87%</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +3% vs mes anterior
                </p>
              </div>
              <Zap className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tareas Vencidas</p>
                <p className="text-2xl font-bold">17</p>
                <p className="text-xs text-red-600 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -8% vs mes anterior
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Productivity by Area */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Productividad por Área</CardTitle>
            <CardDescription>Tareas completadas vs total asignado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productivityByAreaData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completadas" fill="#10b981" name="Completadas" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total" fill="#e5e7eb" name="Total" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Hours by Client */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Horas por Cliente</CardTitle>
            <CardDescription>Tiempo trabajado vs presupuestado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientHoursData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={80} className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="horas" name="Trabajadas" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="presupuesto" name="Presupuesto" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tendencia Semanal</CardTitle>
            <CardDescription>Evolución de tareas y horas por semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrendsData}>
                  <defs>
                    <linearGradient id="colorTareas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCompletadas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="semana" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="tareas" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTareas)" name="Asignadas" />
                  <Area type="monotone" dataKey="completadas" stroke="#10b981" fillOpacity={1} fill="url(#colorCompletadas)" name="Completadas" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Deliverable Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aprobación de Entregables</CardTitle>
            <CardDescription>Distribución de estados de entregables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deliverableApprovalsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {deliverableApprovalsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              {deliverableApprovalsData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Delays by Area */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Retrasos por Área
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {delaysByAreaData.sort((a, b) => b.retrasos - a.retrasos).map((area) => (
                <div key={area.name} className="flex items-center justify-between">
                  <span className="text-sm">{area.name}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={area.retrasos * 10} className="w-24 h-2" />
                    <span className={`text-sm font-medium ${area.retrasos > 3 ? "text-red-600" : "text-amber-600"}`}>
                      {area.retrasos} tareas
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Client Change Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Repeat className="h-5 w-5 text-blue-500" />
              Vueltas de Cambios por Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clientChangeRequestsData.sort((a, b) => b.cambios - a.cambios).map((client) => (
                <div key={client.name} className="flex items-center justify-between">
                  <span className="text-sm">{client.name}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={client.cambios * 5} className="w-24 h-2" />
                    <span className={`text-sm font-medium ${client.cambios > 10 ? "text-red-600" : client.cambios > 5 ? "text-amber-600" : "text-green-600"}`}>
                      {client.cambios} cambios
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
