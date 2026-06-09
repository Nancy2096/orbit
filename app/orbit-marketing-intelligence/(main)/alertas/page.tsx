"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Eye,
  User,
  Building2,
  Calendar,
  Mail,
  MessageSquare,
  ExternalLink,
  ListTodo,
  Settings,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Link2,
  RefreshCw,
  Trash2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { mockAlerts, mockAlertRules } from "@/lib/marketing-intelligence/mock-data-phase3"
import type { Alert, AlertRule, AlertPriority, AlertStatus, AlertType } from "@/lib/marketing-intelligence/types-phase3"

const priorityConfig: Record<AlertPriority, { label: string; color: string; bgColor: string }> = {
  baja: { label: "Baja", color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-800" },
  media: { label: "Media", color: "text-yellow-600", bgColor: "bg-yellow-100 dark:bg-yellow-900" },
  alta: { label: "Alta", color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900" },
  critica: { label: "Crítica", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900" },
}

const statusConfig: Record<AlertStatus, { label: string; color: string; icon: any }> = {
  nueva: { label: "Nueva", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", icon: Bell },
  en_revision: { label: "En Revisión", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300", icon: Clock },
  asignada: { label: "Asignada", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300", icon: User },
  resuelta: { label: "Resuelta", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", icon: CheckCircle },
  ignorada: { label: "Ignorada", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: XCircle },
}

const alertTypeLabels: Record<AlertType, string> = {
  cpl_alto: "CPL Alto",
  ctr_bajo: "CTR Bajo",
  sin_leads: "Sin Leads",
  cuenta_desconectada: "Cuenta Desconectada",
  token_expirado: "Token Expirado",
  post_pendiente: "Post Pendiente",
  post_no_publicado: "Post No Publicado",
  comentario_negativo: "Comentario Negativo",
  competidor_creciendo: "Competidor Creciendo",
  reporte_pendiente: "Reporte Pendiente",
  presupuesto_agotado: "Presupuesto Agotado",
  frecuencia_alta: "Frecuencia Alta",
  roas_bajo: "ROAS Bajo",
  sin_conversiones: "Sin Conversiones",
  error_sincronizacion: "Error Sincronización",
  seo_caida: "Caída SEO",
  keyword_perdida: "Keyword Perdida",
  smartlink_caida: "Smartlink Caída",
  inbox_sin_responder: "Inbox Sin Responder",
  publicacion_rechazada: "Publicación Rechazada",
}

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts)
  const [rules, setRules] = useState<AlertRule[]>(mockAlertRules)
  const [activeTab, setActiveTab] = useState("alertas")
  const [searchTerm, setSearchTerm] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [showRuleDialog, setShowRuleDialog] = useState(false)

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPriority = priorityFilter === "all" || alert.priority === priorityFilter
    const matchesStatus = statusFilter === "all" || alert.status === statusFilter
    return matchesSearch && matchesPriority && matchesStatus
  })

  const alertsByPriority = {
    critica: alerts.filter(a => a.priority === 'critica' && a.status !== 'resuelta' && a.status !== 'ignorada').length,
    alta: alerts.filter(a => a.priority === 'alta' && a.status !== 'resuelta' && a.status !== 'ignorada').length,
    media: alerts.filter(a => a.priority === 'media' && a.status !== 'resuelta' && a.status !== 'ignorada').length,
    baja: alerts.filter(a => a.priority === 'baja' && a.status !== 'resuelta' && a.status !== 'ignorada').length,
  }

  const handleUpdateAlertStatus = (alertId: string, status: AlertStatus) => {
    setAlerts(alerts.map(a => a.id === alertId ? { ...a, status, resolvedAt: status === 'resuelta' ? new Date().toISOString() : undefined } : a))
  }

  const handleAssignAlert = (alertId: string, responsibleName: string) => {
    setAlerts(alerts.map(a => a.id === alertId ? { ...a, status: 'asignada', responsibleName, responsibleId: 'user-assigned' } : a))
    setShowAssignDialog(false)
    setSelectedAlert(null)
  }

  const handleToggleRule = (ruleId: string) => {
    setRules(rules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Alertas
          </h1>
          <p className="text-muted-foreground">Monitorea y gestiona alertas de tus campañas y cuentas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Configurar Alertas
          </Button>
          <Button>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Críticas</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{alertsByPriority.critica}</div>
            <p className="text-xs text-muted-foreground">Requieren atención inmediata</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alta Prioridad</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{alertsByPriority.alta}</div>
            <p className="text-xs text-muted-foreground">Revisar pronto</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Media Prioridad</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{alertsByPriority.media}</div>
            <p className="text-xs text-muted-foreground">Para seguimiento</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resueltas Hoy</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{alerts.filter(a => a.status === 'resuelta').length}</div>
            <p className="text-xs text-muted-foreground">Gestionadas correctamente</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="alertas" className="gap-2">
            <Bell className="h-4 w-4" />
            Alertas
          </TabsTrigger>
          <TabsTrigger value="reglas" className="gap-2">
            <Shield className="h-4 w-4" />
            Reglas
          </TabsTrigger>
        </TabsList>

        {/* Alertas Tab */}
        <TabsContent value="alertas" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar alertas..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las prioridades</SelectItem>
                    <SelectItem value="critica">Crítica</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="nueva">Nueva</SelectItem>
                    <SelectItem value="en_revision">En Revisión</SelectItem>
                    <SelectItem value="asignada">Asignada</SelectItem>
                    <SelectItem value="resuelta">Resuelta</SelectItem>
                    <SelectItem value="ignorada">Ignorada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Alerts List */}
          <div className="space-y-4">
            {filteredAlerts.map((alert) => {
              const StatusIcon = statusConfig[alert.status].icon
              return (
                <Card key={alert.id} className={`${alert.priority === 'critica' ? 'border-red-300 dark:border-red-700' : alert.priority === 'alta' ? 'border-orange-300 dark:border-orange-700' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${priorityConfig[alert.priority].bgColor}`}>
                        <AlertTriangle className={`h-6 w-6 ${priorityConfig[alert.priority].color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{alert.title}</h4>
                              <Badge className={priorityConfig[alert.priority].bgColor + " " + priorityConfig[alert.priority].color}>
                                {priorityConfig[alert.priority].label}
                              </Badge>
                              <Badge className={statusConfig[alert.status].color}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {statusConfig[alert.status].label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleUpdateAlertStatus(alert.id, 'resuelta')}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Marcar como Resuelta
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedAlert(alert)
                                setShowAssignDialog(true)
                              }}>
                                <User className="mr-2 h-4 w-4" />
                                Asignar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <ListTodo className="mr-2 h-4 w-4" />
                                Crear Tarea
                              </DropdownMenuItem>
                              {alert.sourceUrl && (
                                <DropdownMenuItem>
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  Ver Origen
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleUpdateAlertStatus(alert.id, 'ignorada')}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Ignorar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            {alert.clientName}
                            {alert.brandName && <span>/ {alert.brandName}</span>}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Zap className="h-4 w-4" />
                            {alert.module}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {new Date(alert.createdAt).toLocaleDateString('es-MX')}
                          </div>
                          {alert.responsibleName && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="h-4 w-4" />
                              {alert.responsibleName}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            {alert.channels.includes('email') && <Mail className="h-4 w-4 text-muted-foreground" />}
                            {alert.channels.includes('sistema') && <Bell className="h-4 w-4 text-muted-foreground" />}
                            {alert.channels.includes('slack') && <MessageSquare className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        </div>
                        <div className="mt-3 p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 text-sm">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">Acción sugerida:</span>
                            <span className="text-muted-foreground">{alert.suggestedAction}</span>
                          </div>
                        </div>
                        {alert.status !== 'resuelta' && alert.status !== 'ignorada' && (
                          <div className="flex gap-2 mt-4">
                            <Button size="sm" onClick={() => handleUpdateAlertStatus(alert.id, 'resuelta')}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Resolver
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => {
                              setSelectedAlert(alert)
                              setShowAssignDialog(true)
                            }}>
                              <User className="mr-2 h-4 w-4" />
                              Asignar
                            </Button>
                            <Button variant="outline" size="sm">
                              <ListTodo className="mr-2 h-4 w-4" />
                              Crear Tarea
                            </Button>
                            {alert.sourceUrl && (
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Ver Origen
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Reglas Tab */}
        <TabsContent value="reglas" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Reglas de Alertas</CardTitle>
                  <CardDescription>Configura las condiciones que generan alertas automáticas</CardDescription>
                </div>
                <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Nueva Regla
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Crear Nueva Regla</DialogTitle>
                      <DialogDescription>Define las condiciones para generar una alerta automática</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Nombre de la Regla</Label>
                        <Input placeholder="Ej: CPL superior a $50" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Tipo de Alerta</Label>
                          <Select defaultValue="cpl_alto">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(alertTypeLabels).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>Prioridad</Label>
                          <Select defaultValue="alta">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="baja">Baja</SelectItem>
                              <SelectItem value="media">Media</SelectItem>
                              <SelectItem value="alta">Alta</SelectItem>
                              <SelectItem value="critica">Crítica</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Umbral</Label>
                        <Input type="number" placeholder="Ej: 50" />
                      </div>
                      <div className="grid gap-2">
                        <Label>Canales de Notificación</Label>
                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="channel-sistema" defaultChecked />
                            <label htmlFor="channel-sistema" className="text-sm">Sistema</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="channel-email" defaultChecked />
                            <label htmlFor="channel-email" className="text-sm">Email</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="channel-slack" />
                            <label htmlFor="channel-slack" className="text-sm">Slack (próximamente)</label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowRuleDialog(false)}>Cancelar</Button>
                      <Button onClick={() => setShowRuleDialog(false)}>Crear Regla</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Regla</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Condición</TableHead>
                    <TableHead>Umbral</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Canales</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{alertTypeLabels[rule.type]}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{rule.condition}</TableCell>
                      <TableCell>{rule.threshold}</TableCell>
                      <TableCell>
                        <Badge className={priorityConfig[rule.priority].bgColor + " " + priorityConfig[rule.priority].color}>
                          {priorityConfig[rule.priority].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {rule.channels.includes('sistema') && <Bell className="h-4 w-4 text-muted-foreground" />}
                          {rule.channels.includes('email') && <Mail className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch 
                          checked={rule.enabled}
                          onCheckedChange={() => handleToggleRule(rule.id)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Alerta</DialogTitle>
            <DialogDescription>Selecciona un responsable para esta alerta</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Responsable</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar responsable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maria">María García</SelectItem>
                  <SelectItem value="carlos">Carlos López</SelectItem>
                  <SelectItem value="ana">Ana Martínez</SelectItem>
                  <SelectItem value="pedro">Pedro Sánchez</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Comentario (opcional)</Label>
              <Input placeholder="Agregar un comentario..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Cancelar</Button>
            <Button onClick={() => selectedAlert && handleAssignAlert(selectedAlert.id, 'Carlos López')}>
              Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
