"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  ScrollText,
  Search,
  Filter,
  Download,
  Calendar as CalendarIcon,
  User,
  Building2,
  Monitor,
  Globe,
  Clock,
  FileText,
  Send,
  Link2,
  Shield,
  Eye,
  Trash2,
  Edit,
  LogIn,
  LogOut,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  MoreHorizontal,
  Laptop,
  Smartphone,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { mockAuditLogs } from "@/lib/marketing-intelligence/mock-data-phase3"
import type { AuditLog, AuditAction } from "@/lib/marketing-intelligence/types-phase3"
import { cn } from "@/lib/utils"

const actionConfig: Record<AuditAction, { label: string; icon: any; color: string }> = {
  conexion_cuenta: { label: "Conexión de cuenta", icon: Link2, color: "text-green-500" },
  desconexion_cuenta: { label: "Desconexión de cuenta", icon: Link2, color: "text-red-500" },
  token_expirado: { label: "Token expirado", icon: AlertCircle, color: "text-orange-500" },
  crear_dashboard: { label: "Crear dashboard", icon: FileText, color: "text-blue-500" },
  editar_dashboard: { label: "Editar dashboard", icon: Edit, color: "text-blue-500" },
  crear_reporte: { label: "Crear reporte", icon: FileText, color: "text-purple-500" },
  enviar_reporte: { label: "Enviar reporte", icon: Send, color: "text-purple-500" },
  crear_post: { label: "Crear post", icon: FileText, color: "text-pink-500" },
  aprobar_post: { label: "Aprobar post", icon: CheckCircle, color: "text-green-500" },
  rechazar_post: { label: "Rechazar post", icon: AlertCircle, color: "text-red-500" },
  responder_inbox: { label: "Responder mensaje", icon: Send, color: "text-blue-500" },
  crear_smartlink: { label: "Crear smartlink", icon: Link2, color: "text-indigo-500" },
  cambiar_permisos: { label: "Cambiar permisos", icon: Shield, color: "text-yellow-500" },
  exportar_datos: { label: "Exportar datos", icon: Download, color: "text-gray-500" },
  generar_insight: { label: "Generar insight", icon: RefreshCw, color: "text-cyan-500" },
  crear_alerta: { label: "Crear alerta", icon: AlertCircle, color: "text-orange-500" },
  resolver_alerta: { label: "Resolver alerta", icon: CheckCircle, color: "text-green-500" },
  login: { label: "Inicio de sesión", icon: LogIn, color: "text-green-500" },
  logout: { label: "Cierre de sesión", icon: LogOut, color: "text-gray-500" },
}

export default function BitacoraPage() {
  const [logs, setLogs] = useState<AuditLog[]>(mockAuditLogs)
  const [searchTerm, setSearchTerm] = useState("")
  const [userFilter, setUserFilter] = useState<string>("all")
  const [moduleFilter, setModuleFilter] = useState<string>("all")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined })
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.actionLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    const matchesUser = userFilter === "all" || log.userId === userFilter
    const matchesModule = moduleFilter === "all" || log.module === moduleFilter
    const matchesAction = actionFilter === "all" || log.action === actionFilter
    return matchesSearch && matchesUser && matchesModule && matchesAction
  })

  const uniqueUsers = Array.from(new Set(logs.map(l => l.userId))).map(userId => {
    const log = logs.find(l => l.userId === userId)
    return { id: userId, name: log?.userName || '' }
  })

  const uniqueModules = Array.from(new Set(logs.map(l => l.module)))

  const viewLogDetail = (log: AuditLog) => {
    setSelectedLog(log)
    setShowDetailDialog(true)
  }

  const handleExport = () => {
    // Simulated export
    const csvData = filteredLogs.map(log => ({
      fecha: new Date(log.timestamp).toLocaleString('es-MX'),
      usuario: log.userName,
      email: log.userEmail,
      accion: log.actionLabel,
      modulo: log.module,
      cliente: log.clientName || '-',
      marca: log.brandName || '-',
      ip: log.ip,
      dispositivo: log.device,
    }))
    console.log('Exporting:', csvData)
    alert('Exportando bitácora en formato CSV...')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScrollText className="h-6 w-6 text-primary" />
            Bitácora de Actividad
          </h1>
          <p className="text-muted-foreground">Registro completo de todas las acciones en el sistema</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Acciones Hoy</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length}
            </div>
            <p className="text-xs text-muted-foreground">En las últimas 24 horas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUsers.length}</div>
            <p className="text-xs text-muted-foreground">Han realizado acciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reportes Enviados</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.filter(l => l.action === 'enviar_reporte').length}</div>
            <p className="text-xs text-muted-foreground">En el periodo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cambios de Permisos</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.filter(l => l.action === 'cambiar_permisos').length}</div>
            <p className="text-xs text-muted-foreground">Modificaciones de seguridad</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar en bitácora..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-[180px]">
                <User className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Usuario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los usuarios</SelectItem>
                {uniqueUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los módulos</SelectItem>
                {uniqueModules.map(module => (
                  <SelectItem key={module} value={module}>{module}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "d MMM", { locale: es })} - {format(dateRange.to, "d MMM", { locale: es })}
                      </>
                    ) : (
                      format(dateRange.from, "d MMM, yyyy", { locale: es })
                    )
                  ) : (
                    "Rango de fechas"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Actividad</CardTitle>
          <CardDescription>{filteredLogs.length} registros encontrados</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha / Hora</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Cliente / Marca</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead className="text-right">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const ActionIcon = actionConfig[log.action]?.icon || Eye
                  const actionColor = actionConfig[log.action]?.color || "text-gray-500"
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">
                              {new Date(log.timestamp).toLocaleDateString('es-MX', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString('es-MX', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {log.userName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">{log.userName}</div>
                            <div className="text-xs text-muted-foreground">{log.userEmail}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ActionIcon className={cn("h-4 w-4", actionColor)} />
                          <span className="text-sm">{log.actionLabel}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.module}</Badge>
                      </TableCell>
                      <TableCell>
                        {log.clientName ? (
                          <div>
                            <div className="flex items-center gap-1 text-sm">
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              {log.clientName}
                            </div>
                            {log.brandName && (
                              <div className="text-xs text-muted-foreground">{log.brandName}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {log.device === 'Desktop' ? (
                            <Laptop className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <div className="text-xs">{log.device}</div>
                            <div className="text-xs text-muted-foreground">{log.browser}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => viewLogDetail(log)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalle de Actividad</DialogTitle>
            <DialogDescription>
              {selectedLog && new Date(selectedLog.timestamp).toLocaleString('es-MX', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Usuario</div>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {selectedLog.userName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{selectedLog.userName}</div>
                      <div className="text-xs text-muted-foreground">{selectedLog.userEmail}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Acción</div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const ActionIcon = actionConfig[selectedLog.action]?.icon || Eye
                      const actionColor = actionConfig[selectedLog.action]?.color || "text-gray-500"
                      return <ActionIcon className={cn("h-4 w-4", actionColor)} />
                    })()}
                    <span className="font-medium">{selectedLog.actionLabel}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Módulo</div>
                  <Badge variant="outline">{selectedLog.module}</Badge>
                </div>
                {selectedLog.clientName && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Cliente</div>
                    <div className="text-sm">{selectedLog.clientName}</div>
                    {selectedLog.brandName && (
                      <div className="text-xs text-muted-foreground">{selectedLog.brandName}</div>
                    )}
                  </div>
                )}
              </div>

              {(selectedLog.previousValue || selectedLog.newValue) && (
                <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="text-xs font-medium">Cambios Realizados</div>
                  {selectedLog.previousValue && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Anterior:</span>
                      <span className="line-through text-red-500">{selectedLog.previousValue}</span>
                    </div>
                  )}
                  {selectedLog.newValue && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Nuevo:</span>
                      <span className="text-green-500">{selectedLog.newValue}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 rounded-lg border space-y-2">
                <div className="text-xs font-medium">Información Técnica</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">IP:</span> {selectedLog.ip}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dispositivo:</span> {selectedLog.device}
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Navegador:</span> {selectedLog.browser}
                  </div>
                  {selectedLog.recordId && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">ID Registro:</span> {selectedLog.recordId}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
