"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Check, 
  X, 
  Clock, 
  Users,
  Settings,
  CalendarDays,
  Palmtree,
  AlertCircle,
  Filter,
  Eye,
  History
} from "lucide-react"
import { format, differenceInBusinessDays, addDays, isWeekend } from "date-fns"
import { es } from "date-fns/locale"

interface Agency {
  id: string
  name: string
}

interface Staff {
  id: string
  first_name: string
  last_name: string
  position: string
  department: string
  agency_id: string
}

interface LeaveType {
  id: string
  agency_id: string
  name: string
  description: string | null
  days_per_year: number
  requires_approval: boolean
  is_paid: boolean
  color: string
  is_active: boolean
}

interface LeaveBalance {
  id: string
  staff_id: string
  leave_type_id: string
  year: number
  days_entitled: number
  days_taken: number
  days_pending: number
  days_available: number
  leave_type?: LeaveType
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
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  created_at: string
  staff?: Staff
  leave_type?: LeaveType
  reviewer?: Staff
}

interface Holiday {
  id: string
  agency_id: string
  name: string
  date: string
  is_recurring: boolean
}

export default function VacationsPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState("solicitudes")
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [selectedAgency, setSelectedAgency] = useState<string>("")
  const [staff, setStaff] = useState<Staff[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterStaff, setFilterStaff] = useState<string>("all")

  // Dialogs
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [showTypeDialog, setShowTypeDialog] = useState(false)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [showBalanceDialog, setShowBalanceDialog] = useState(false)
  const [showHolidayDialog, setShowHolidayDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)

  // New request form
  const [newRequest, setNewRequest] = useState({
    staff_id: "",
    leave_type_id: "",
    start_date: null as Date | null,
    end_date: null as Date | null,
    reason: "",
    is_half_day: false,
    half_day_period: "morning" as "morning" | "afternoon",
  })

  // New leave type form
  const [newLeaveType, setNewLeaveType] = useState({
    name: "",
    description: "",
    days_per_year: 15,
    requires_approval: true,
    is_paid: true,
    color: "#3b82f6",
  })

  // Review form
  const [reviewNotes, setReviewNotes] = useState("")

  // New holiday form
  const [newHoliday, setNewHoliday] = useState({
    name: "",
    date: null as Date | null,
    is_recurring: false,
  })

  // Balance assignment
  const [balanceStaff, setBalanceStaff] = useState("")
  const [balanceType, setBalanceType] = useState("")
  const [balanceDays, setBalanceDays] = useState(15)

  const currentYear = new Date().getFullYear()

  useEffect(() => {
    fetchAgencies()
  }, [])

  useEffect(() => {
    if (selectedAgency) {
      fetchStaff()
      fetchLeaveTypes()
      fetchLeaveRequests()
      fetchHolidays()
      fetchLeaveBalances()
    }
  }, [selectedAgency])

  const fetchAgencies = async () => {
    const { data } = await supabase
      .from("agencies")
      .select("id, name")
      .order("name")
    if (data) {
      setAgencies(data)
      if (data.length > 0) {
        setSelectedAgency(data[0].id)
      }
    }
    setLoading(false)
  }

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from("staff")
      .select("id, first_name, last_name, position, department, agency_id")
      .eq("agency_id", selectedAgency)
      .eq("is_active", true)
      .order("first_name")
    if (error) {
      console.error("[v0] Error fetching staff:", error.message)
      return
    }
    setStaff(data ?? [])
  }

  const fetchLeaveTypes = async () => {
    const { data } = await supabase
      .from("leave_types")
      .select("*")
      .eq("agency_id", selectedAgency)
      .eq("is_active", true)
      .order("name")
    if (data) setLeaveTypes(data)
  }

  const fetchLeaveRequests = async () => {
    const { data } = await supabase
      .from("leave_requests")
      .select(`
        *,
        staff:staff_id(id, first_name, last_name, position, department),
        leave_type:leave_type_id(id, name, color),
        reviewer:reviewed_by(id, first_name, last_name)
      `)
      .eq("agency_id", selectedAgency)
      .order("created_at", { ascending: false })
    if (data) setLeaveRequests(data)
  }

  const fetchLeaveBalances = async () => {
    const { data } = await supabase
      .from("leave_balances")
      .select(`
        *,
        leave_type:leave_type_id(id, name, color)
      `)
      .eq("agency_id", selectedAgency)
      .eq("year", currentYear)
    if (data) setLeaveBalances(data)
  }

  const fetchHolidays = async () => {
    const { data } = await supabase
      .from("holidays")
      .select("*")
      .eq("agency_id", selectedAgency)
      .order("date")
    if (data) setHolidays(data)
  }

  const calculateBusinessDays = (start: Date, end: Date): number => {
    let count = 0
    let current = new Date(start)
    const holidayDates = holidays.map(h => h.date)

    while (current <= end) {
      if (!isWeekend(current) && !holidayDates.includes(format(current, "yyyy-MM-dd"))) {
        count++
      }
      current = addDays(current, 1)
    }
    return count
  }

  const handleCreateRequest = async () => {
    if (!newRequest.staff_id || !newRequest.leave_type_id || !newRequest.start_date || !newRequest.end_date) {
      return
    }

    // En medio día solo cuenta 0.5 y la solicitud es de un único día.
    const totalDays = newRequest.is_half_day
      ? 0.5
      : calculateBusinessDays(newRequest.start_date, newRequest.end_date)
    const endDate = newRequest.is_half_day ? newRequest.start_date : newRequest.end_date

    const { error } = await supabase
      .from("leave_requests")
      .insert({
        agency_id: selectedAgency,
        staff_id: newRequest.staff_id,
        leave_type_id: newRequest.leave_type_id,
        start_date: format(newRequest.start_date, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        total_days: totalDays,
        reason: newRequest.reason || null,
        status: "pending",
        is_half_day: newRequest.is_half_day,
        half_day_period: newRequest.is_half_day ? newRequest.half_day_period : null,
      })

    if (!error) {
      // Update pending days in balance
      await supabase
        .from("leave_balances")
        .update({ days_pending: supabase.rpc("increment", { x: totalDays }) })
        .eq("staff_id", newRequest.staff_id)
        .eq("leave_type_id", newRequest.leave_type_id)
        .eq("year", currentYear)

      setShowRequestDialog(false)
      setNewRequest({
        staff_id: "",
        leave_type_id: "",
        start_date: null,
        end_date: null,
        reason: "",
        is_half_day: false,
        half_day_period: "morning",
      })
      fetchLeaveRequests()
      fetchLeaveBalances()
    }
  }

  const handleApproveRequest = async () => {
    if (!selectedRequest) return

    const { error } = await supabase
      .from("leave_requests")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes || null,
      })
      .eq("id", selectedRequest.id)

    if (!error) {
      // Update balance: move from pending to taken
      const balance = leaveBalances.find(
        b => b.staff_id === selectedRequest.staff_id && b.leave_type_id === selectedRequest.leave_type_id
      )
      if (balance) {
        await supabase
          .from("leave_balances")
          .update({
            days_pending: Math.max(0, balance.days_pending - selectedRequest.total_days),
            days_taken: balance.days_taken + selectedRequest.total_days,
          })
          .eq("id", balance.id)
      }

      setShowReviewDialog(false)
      setSelectedRequest(null)
      setReviewNotes("")
      fetchLeaveRequests()
      fetchLeaveBalances()
    }
  }

  const handleRejectRequest = async () => {
    if (!selectedRequest) return

    const { error } = await supabase
      .from("leave_requests")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes || null,
      })
      .eq("id", selectedRequest.id)

    if (!error) {
      // Update balance: remove from pending
      const balance = leaveBalances.find(
        b => b.staff_id === selectedRequest.staff_id && b.leave_type_id === selectedRequest.leave_type_id
      )
      if (balance) {
        await supabase
          .from("leave_balances")
          .update({
            days_pending: Math.max(0, balance.days_pending - selectedRequest.total_days),
          })
          .eq("id", balance.id)
      }

      setShowReviewDialog(false)
      setSelectedRequest(null)
      setReviewNotes("")
      fetchLeaveRequests()
      fetchLeaveBalances()
    }
  }

  const handleCreateLeaveType = async () => {
    if (!newLeaveType.name) return

    const { error } = await supabase
      .from("leave_types")
      .insert({
        agency_id: selectedAgency,
        ...newLeaveType,
      })

    if (!error) {
      setShowTypeDialog(false)
      setNewLeaveType({
        name: "",
        description: "",
        days_per_year: 15,
        requires_approval: true,
        is_paid: true,
        color: "#3b82f6",
      })
      fetchLeaveTypes()
    }
  }

  const handleAssignBalance = async () => {
    if (!balanceStaff || !balanceType) return

    const { error } = await supabase
      .from("leave_balances")
      .upsert({
        agency_id: selectedAgency,
        staff_id: balanceStaff,
        leave_type_id: balanceType,
        year: currentYear,
        days_entitled: balanceDays,
        days_taken: 0,
        days_pending: 0,
      }, {
        onConflict: "staff_id,leave_type_id,year",
      })

    if (!error) {
      setShowBalanceDialog(false)
      setBalanceStaff("")
      setBalanceType("")
      setBalanceDays(15)
      fetchLeaveBalances()
    }
  }

  const handleCreateHoliday = async () => {
    if (!newHoliday.name || !newHoliday.date) return

    const { error } = await supabase
      .from("holidays")
      .insert({
        agency_id: selectedAgency,
        name: newHoliday.name,
        date: format(newHoliday.date, "yyyy-MM-dd"),
        is_recurring: newHoliday.is_recurring,
      })

    if (!error) {
      setShowHolidayDialog(false)
      setNewHoliday({
        name: "",
        date: null,
        is_recurring: false,
      })
      fetchHolidays()
    }
  }

  const handleDeleteHoliday = async (id: string) => {
    const { error } = await supabase
      .from("holidays")
      .delete()
      .eq("id", id)

    if (!error) {
      fetchHolidays()
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><Check className="w-3 h-3 mr-1" />Aprobada</Badge>
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><X className="w-3 h-3 mr-1" />Rechazada</Badge>
      case "cancelled":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Cancelada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredRequests = leaveRequests.filter(req => {
    if (filterStatus !== "all" && req.status !== filterStatus) return false
    if (filterStaff !== "all" && req.staff_id !== filterStaff) return false
    return true
  })

  const pendingRequests = leaveRequests.filter(r => r.status === "pending")
  const approvedThisMonth = leaveRequests.filter(r => 
    r.status === "approved" && 
    new Date(r.created_at).getMonth() === new Date().getMonth()
  )

  const getStaffBalance = (staffId: string) => {
    return leaveBalances.filter(b => b.staff_id === staffId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Solicitud de Permisos</h1>
          <p className="text-muted-foreground">Gestiona las solicitudes de vacaciones y permisos del equipo</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedAgency} onValueChange={setSelectedAgency}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Seleccionar agencia" />
            </SelectTrigger>
            <SelectContent>
              {agencies.map((agency) => (
                <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowRequestDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Solicitud
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">Esperando aprobación</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas Este Mes</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedThisMonth.length}</div>
            <p className="text-xs text-muted-foreground">Solicitudes aprobadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tipos de Permiso</CardTitle>
            <Palmtree className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveTypes.length}</div>
            <p className="text-xs text-muted-foreground">Configurados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Empleados</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
            <p className="text-xs text-muted-foreground">En la agencia</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
          <TabsTrigger value="equipo">Mi Equipo</TabsTrigger>
          <TabsTrigger value="calendario">Calendario</TabsTrigger>
        </TabsList>

        {/* Solicitudes Tab */}
        <TabsContent value="solicitudes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Todas las Solicitudes</CardTitle>
                  <CardDescription>Historial de solicitudes de vacaciones y permisos</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[150px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendientes</SelectItem>
                      <SelectItem value="approved">Aprobadas</SelectItem>
                      <SelectItem value="rejected">Rechazadas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStaff} onValueChange={setFilterStaff}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar empleado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los empleados</SelectItem>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha Inicio</TableHead>
                    <TableHead>Fecha Fin</TableHead>
                    <TableHead>Días</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Solicitud</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No hay solicitudes
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{request.staff?.first_name} {request.staff?.last_name}</p>
                            <p className="text-sm text-muted-foreground">{request.staff?.position}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            style={{ borderColor: request.leave_type?.color, color: request.leave_type?.color }}
                          >
                            {request.leave_type?.name}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(request.start_date), "dd MMM yyyy", { locale: es })}</TableCell>
                        <TableCell>{format(new Date(request.end_date), "dd MMM yyyy", { locale: es })}</TableCell>
                        <TableCell>
                          {request.total_days} días
                          {request.is_half_day && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              (medio día · {request.half_day_period === "afternoon" ? "tarde" : "mañana"})
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>{format(new Date(request.created_at), "dd MMM yyyy", { locale: es })}</TableCell>
                        <TableCell className="text-right">
                          {request.status === "pending" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(request)
                                setShowReviewDialog(true)
                              }}
                            >
                              Revisar
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedRequest(request)
                                setShowReviewDialog(true)
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipo Tab */}
        <TabsContent value="equipo" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowBalanceDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Asignar Días
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {staff.map((member) => {
              const balances = getStaffBalance(member.id)
              return (
                <Card key={member.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary">
                          {member.first_name[0]}{member.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-base">{member.first_name} {member.last_name}</CardTitle>
                        <CardDescription>{member.position}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {balances.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sin días asignados para {currentYear}</p>
                    ) : (
                      balances.map((balance) => (
                        <div key={balance.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span style={{ color: balance.leave_type?.color }}>{balance.leave_type?.name}</span>
                            <span className="font-medium">{balance.days_available} disponibles</span>
                          </div>
                          <Progress 
                            value={(balance.days_taken / balance.days_entitled) * 100} 
                            className="h-2"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Tomados: {balance.days_taken}</span>
                            <span>Pendientes: {balance.days_pending}</span>
                            <span>Total: {balance.days_entitled}</span>
                          </div>
                        </div>
                      ))
                    )}
                    <div className="pt-2 border-t">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          setNewRequest({ ...newRequest, staff_id: member.id })
                          setShowRequestDialog(true)
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Solicitar Permiso
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Calendario Tab */}
        <TabsContent value="calendario" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Próximas Ausencias</CardTitle>
                <CardDescription>Solicitudes aprobadas próximas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaveRequests
                    .filter(r => r.status === "approved" && new Date(r.start_date) >= new Date())
                    .slice(0, 5)
                    .map((request) => (
                      <div key={request.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div 
                          className="w-2 h-12 rounded-full" 
                          style={{ backgroundColor: request.leave_type?.color }}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{request.staff?.first_name} {request.staff?.last_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(request.start_date), "dd MMM", { locale: es })} - {format(new Date(request.end_date), "dd MMM yyyy", { locale: es })}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {request.total_days} días
                          {request.is_half_day && (request.half_day_period === "afternoon" ? " · tarde" : " · mañana")}
                        </Badge>
                      </div>
                    ))}
                  {leaveRequests.filter(r => r.status === "approved" && new Date(r.start_date) >= new Date()).length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No hay ausencias próximas</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Días Festivos</CardTitle>
                  <CardDescription>Días no laborables configurados</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowHolidayDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {holidays.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No hay días festivos configurados</p>
                  ) : (
                    holidays.map((holiday) => (
                      <div key={holiday.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <CalendarDays className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{holiday.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(holiday.date), "dd MMMM yyyy", { locale: es })}
                              {holiday.is_recurring && " (Anual)"}
                            </p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDeleteHoliday(holiday.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Solicitud de Permiso</DialogTitle>
            <DialogDescription>Crea una nueva solicitud de vacaciones o permiso</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {staff.length === 0 || leaveTypes.length === 0 ? (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Configuración requerida</span>
                </div>
                <p className="text-sm">
                  {staff.length === 0 && "No hay empleados registrados. "}
                  {leaveTypes.length === 0 && "No hay tipos de permiso configurados. Ve a Configurar Agencia > Permisos para crear tipos de permiso."}
                </p>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label>Empleado *</Label>
              <Select 
                value={newRequest.staff_id || undefined} 
                onValueChange={(value) => setNewRequest({ ...newRequest, staff_id: value })}
                disabled={staff.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Permiso *</Label>
              <Select 
                value={newRequest.leave_type_id || undefined} 
                onValueChange={(value) => setNewRequest({ ...newRequest, leave_type_id: value })}
                disabled={leaveTypes.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="half-day-switch">Medio día</Label>
                <p className="text-xs text-muted-foreground">
                  Solicita solo medio día (0.5). No se descuenta el día completo.
                </p>
              </div>
              <Switch
                id="half-day-switch"
                checked={newRequest.is_half_day}
                onCheckedChange={(checked) =>
                  setNewRequest({
                    ...newRequest,
                    is_half_day: checked,
                    // Al activar medio día, la fecha fin es la misma que la de inicio.
                    end_date: checked ? newRequest.start_date : newRequest.end_date,
                  })
                }
              />
            </div>
            {newRequest.is_half_day && (
              <div className="space-y-2">
                <Label>Periodo *</Label>
                <Select
                  value={newRequest.half_day_period}
                  onValueChange={(value) =>
                    setNewRequest({ ...newRequest, half_day_period: value as "morning" | "afternoon" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Primera mitad (mañana)</SelectItem>
                    <SelectItem value="afternoon">Segunda mitad (tarde)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className={newRequest.is_half_day ? "" : "grid grid-cols-2 gap-4"}>
              <div className="space-y-2">
                <Label>{newRequest.is_half_day ? "Fecha *" : "Fecha Inicio *"}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newRequest.start_date ? format(newRequest.start_date, "dd/MM/yyyy") : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newRequest.start_date || undefined}
                      onSelect={(date) =>
                        setNewRequest({
                          ...newRequest,
                          start_date: date || null,
                          // En medio día, la fecha fin sigue a la de inicio.
                          end_date: newRequest.is_half_day ? date || null : newRequest.end_date,
                        })
                      }
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {!newRequest.is_half_day && (
                <div className="space-y-2">
                  <Label>Fecha Fin *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newRequest.end_date ? format(newRequest.end_date, "dd/MM/yyyy") : "Seleccionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newRequest.end_date || undefined}
                        onSelect={(date) => setNewRequest({ ...newRequest, end_date: date || null })}
                        locale={es}
                        disabled={(date) => newRequest.start_date ? date < newRequest.start_date : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
            {newRequest.is_half_day && newRequest.start_date && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm">
                  <strong>Días a solicitar:</strong> 0.5 día ({newRequest.half_day_period === "morning" ? "mañana" : "tarde"})
                </p>
              </div>
            )}
            {!newRequest.is_half_day && newRequest.start_date && newRequest.end_date && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm">
                  <strong>Días hábiles:</strong> {calculateBusinessDays(newRequest.start_date, newRequest.end_date)} días
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Textarea
                value={newRequest.reason}
                onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                placeholder="Describe el motivo de la solicitud..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateRequest}>Crear Solicitud</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedRequest?.status === "pending" ? "Revisar Solicitud" : "Detalle de Solicitud"}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Empleado:</span>
                  <span className="font-medium">{selectedRequest.staff?.first_name} {selectedRequest.staff?.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <Badge variant="outline" style={{ borderColor: selectedRequest.leave_type?.color }}>
                    {selectedRequest.leave_type?.name}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Período:</span>
                  <span>{format(new Date(selectedRequest.start_date), "dd/MM/yyyy")} - {format(new Date(selectedRequest.end_date), "dd/MM/yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Días:</span>
                  <span className="font-medium">{selectedRequest.total_days} días</span>
                </div>
                {selectedRequest.reason && (
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground">Motivo:</span>
                    <p className="mt-1">{selectedRequest.reason}</p>
                  </div>
                )}
              </div>

              {selectedRequest.status === "pending" ? (
                <>
                  <div className="space-y-2">
                    <Label>Notas de Revisión (opcional)</Label>
                    <Textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Agregar comentarios..."
                      rows={3}
                    />
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setShowReviewDialog(false)}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleRejectRequest}>
                      <X className="w-4 h-4 mr-2" />
                      Rechazar
                    </Button>
                    <Button onClick={handleApproveRequest}>
                      <Check className="w-4 h-4 mr-2" />
                      Aprobar
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Estado:</span>
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                  {selectedRequest.reviewed_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revisado:</span>
                      <span>{format(new Date(selectedRequest.reviewed_at), "dd/MM/yyyy HH:mm")}</span>
                    </div>
                  )}
                  {selectedRequest.reviewer && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Por:</span>
                      <span>{selectedRequest.reviewer.first_name} {selectedRequest.reviewer.last_name}</span>
                    </div>
                  )}
                  {selectedRequest.review_notes && (
                    <div className="pt-2 border-t">
                      <span className="text-muted-foreground">Notas:</span>
                      <p className="mt-1">{selectedRequest.review_notes}</p>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowReviewDialog(false)}>Cerrar</Button>
                  </DialogFooter>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Leave Type Dialog */}
      <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Tipo de Permiso</DialogTitle>
            <DialogDescription>Configura un nuevo tipo de ausencia o permiso</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={newLeaveType.name}
                onChange={(e) => setNewLeaveType({ ...newLeaveType, name: e.target.value })}
                placeholder="Ej: Vacaciones, Permiso Personal..."
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={newLeaveType.description}
                onChange={(e) => setNewLeaveType({ ...newLeaveType, description: e.target.value })}
                placeholder="Descripción del tipo de permiso..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Días por Año</Label>
              <Input
                type="number"
                value={newLeaveType.days_per_year}
                onChange={(e) => setNewLeaveType({ ...newLeaveType, days_per_year: parseInt(e.target.value) || 0 })}
                min={0}
              />
              <p className="text-xs text-muted-foreground">0 = Sin límite</p>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Input
                type="color"
                value={newLeaveType.color}
                onChange={(e) => setNewLeaveType({ ...newLeaveType, color: e.target.value })}
                className="h-10 w-20"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Requiere Aprobación</Label>
              <Switch
                checked={newLeaveType.requires_approval}
                onCheckedChange={(checked) => setNewLeaveType({ ...newLeaveType, requires_approval: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Con Goce de Sueldo</Label>
              <Switch
                checked={newLeaveType.is_paid}
                onCheckedChange={(checked) => setNewLeaveType({ ...newLeaveType, is_paid: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTypeDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateLeaveType}>Crear Tipo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Balance Dialog */}
      <Dialog open={showBalanceDialog} onOpenChange={setShowBalanceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar Días</DialogTitle>
            <DialogDescription>Asigna días de permiso a un empleado para el año {currentYear}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Empleado *</Label>
              <Select value={balanceStaff} onValueChange={setBalanceStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Permiso *</Label>
              <Select value={balanceType} onValueChange={setBalanceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Días a Asignar</Label>
              <Input
                type="number"
                value={balanceDays}
                onChange={(e) => setBalanceDays(parseInt(e.target.value) || 0)}
                min={0}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBalanceDialog(false)}>Cancelar</Button>
            <Button onClick={handleAssignBalance}>Asignar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Holiday Dialog */}
      <Dialog open={showHolidayDialog} onOpenChange={setShowHolidayDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Día Festivo</DialogTitle>
            <DialogDescription>Configura un día no laborable</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={newHoliday.name}
                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                placeholder="Ej: Navidad, Día de la Independencia..."
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newHoliday.date ? format(newHoliday.date, "dd/MM/yyyy") : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newHoliday.date || undefined}
                    onSelect={(date) => setNewHoliday({ ...newHoliday, date: date || null })}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Se Repite Anualmente</Label>
                <p className="text-xs text-muted-foreground">El festivo se repite cada año</p>
              </div>
              <Switch
                checked={newHoliday.is_recurring}
                onCheckedChange={(checked) => setNewHoliday({ ...newHoliday, is_recurring: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHolidayDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateHoliday}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
