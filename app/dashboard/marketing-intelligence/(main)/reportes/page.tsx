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
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  FileText,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Send,
  Download,
  Eye,
  Edit,
  Trash2,
  Copy,
  MoreHorizontal,
  Mail,
  FileSpreadsheet,
  FileDown,
  Sparkles,
  Building2,
  User,
  CheckCircle,
  AlertCircle,
  PauseCircle,
  Settings,
  LayoutTemplate,
  History,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { mockReports, mockReportTemplates, mockReportHistory } from "@/lib/marketing-intelligence/mock-data-phase3"
import type { Report, ReportFrequency, ReportStatus } from "@/lib/marketing-intelligence/types-phase3"

const frequencyLabels: Record<ReportFrequency, string> = {
  diario: "Diario",
  semanal: "Semanal",
  quincenal: "Quincenal",
  mensual: "Mensual",
  trimestral: "Trimestral",
  personalizado: "Personalizado",
}

const statusConfig: Record<ReportStatus, { label: string; color: string; icon: any }> = {
  borrador: { label: "Borrador", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: Edit },
  programado: { label: "Programado", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", icon: Clock },
  enviado: { label: "Enviado", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", icon: CheckCircle },
  error: { label: "Error", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", icon: AlertCircle },
}

export default function ReportesPage() {
  const [reports, setReports] = useState<Report[]>(mockReports)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [frequencyFilter, setFrequencyFilter] = useState<string>("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [activeTab, setActiveTab] = useState("listado")

  // New report form state
  const [newReport, setNewReport] = useState({
    name: "",
    clientId: "",
    brandId: "",
    templateId: "",
    frequency: "mensual" as ReportFrequency,
    recipients: "",
    includeAiComments: true,
    useAgencyBranding: true,
    includeClientLogo: true,
    useClientColors: false,
  })

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || report.status === statusFilter
    const matchesFrequency = frequencyFilter === "all" || report.frequency === frequencyFilter
    return matchesSearch && matchesStatus && matchesFrequency
  })

  const handleCreateReport = () => {
    const template = mockReportTemplates.find(t => t.id === newReport.templateId)
    const newReportData: Report = {
      id: `rpt-${Date.now()}`,
      name: newReport.name,
      clientId: newReport.clientId,
      clientName: newReport.clientId === 'client-1' ? 'Vertex Inmobiliaria' : 'TechStart',
      brandId: newReport.brandId,
      brandName: newReport.brandId === 'brand-1' ? 'Torre Skyline' : 'TechStart SaaS',
      templateId: newReport.templateId,
      templateName: template?.name || '',
      frequency: newReport.frequency,
      sections: [],
      recipients: newReport.recipients.split(',').map(e => e.trim()),
      status: 'borrador',
      responsibleId: 'user-1',
      responsibleName: 'María García',
      includeAiComments: newReport.includeAiComments,
      useAgencyBranding: newReport.useAgencyBranding,
      includeClientLogo: newReport.includeClientLogo,
      useClientColors: newReport.useClientColors,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    }
    setReports([...reports, newReportData])
    setShowCreateDialog(false)
    setNewReport({
      name: "",
      clientId: "",
      brandId: "",
      templateId: "",
      frequency: "mensual",
      recipients: "",
      includeAiComments: true,
      useAgencyBranding: true,
      includeClientLogo: true,
      useClientColors: false,
    })
  }

  const handleExport = (format: 'pdf' | 'excel' | 'csv', reportId: string) => {
    // Simulated export
    console.log(`Exporting report ${reportId} as ${format}`)
    alert(`Exportando reporte en formato ${format.toUpperCase()}...`)
  }

  const handleSendReport = (reportId: string) => {
    setReports(reports.map(r => 
      r.id === reportId ? { ...r, status: 'enviado', lastSent: new Date().toISOString().split('T')[0] } : r
    ))
    alert('Reporte enviado correctamente')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reportes Automáticos</h1>
          <p className="text-muted-foreground">Crea, programa y envía reportes personalizados a tus clientes</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Crear Reporte
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Reporte</DialogTitle>
              <DialogDescription>Configura un nuevo reporte automático para tu cliente</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nombre del Reporte</Label>
                <Input 
                  placeholder="Ej: Reporte Mensual - Cliente"
                  value={newReport.name}
                  onChange={(e) => setNewReport({...newReport, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Cliente</Label>
                  <Select value={newReport.clientId} onValueChange={(v) => setNewReport({...newReport, clientId: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client-1">Vertex Inmobiliaria</SelectItem>
                      <SelectItem value="client-2">TechStart</SelectItem>
                      <SelectItem value="client-3">FoodDelight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Marca</Label>
                  <Select value={newReport.brandId} onValueChange={(v) => setNewReport({...newReport, brandId: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar marca" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brand-1">Torre Skyline</SelectItem>
                      <SelectItem value="brand-2">TechStart SaaS</SelectItem>
                      <SelectItem value="brand-3">FoodDelight Restaurant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Plantilla</Label>
                  <Select value={newReport.templateId} onValueChange={(v) => setNewReport({...newReport, templateId: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar plantilla" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockReportTemplates.map(template => (
                        <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Frecuencia</Label>
                  <Select value={newReport.frequency} onValueChange={(v) => setNewReport({...newReport, frequency: v as ReportFrequency})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diario">Diario</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="quincenal">Quincenal</SelectItem>
                      <SelectItem value="mensual">Mensual</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="personalizado">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Destinatarios (separados por coma)</Label>
                <Input 
                  placeholder="email1@cliente.com, email2@cliente.com"
                  value={newReport.recipients}
                  onChange={(e) => setNewReport({...newReport, recipients: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <Label>Opciones</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="aiComments" 
                    checked={newReport.includeAiComments}
                    onCheckedChange={(c) => setNewReport({...newReport, includeAiComments: c as boolean})}
                  />
                  <label htmlFor="aiComments" className="text-sm">Incluir comentarios automáticos con IA</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="agencyBranding" 
                    checked={newReport.useAgencyBranding}
                    onCheckedChange={(c) => setNewReport({...newReport, useAgencyBranding: c as boolean})}
                  />
                  <label htmlFor="agencyBranding" className="text-sm">Usar marca de la agencia</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="clientLogo" 
                    checked={newReport.includeClientLogo}
                    onCheckedChange={(c) => setNewReport({...newReport, includeClientLogo: c as boolean})}
                  />
                  <label htmlFor="clientLogo" className="text-sm">Incluir logo del cliente</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="clientColors" 
                    checked={newReport.useClientColors}
                    onCheckedChange={(c) => setNewReport({...newReport, useClientColors: c as boolean})}
                  />
                  <label htmlFor="clientColors" className="text-sm">Usar colores del cliente</label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreateReport}>Crear Reporte</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="listado" className="gap-2">
            <FileText className="h-4 w-4" />
            Listado
          </TabsTrigger>
          <TabsTrigger value="plantillas" className="gap-2">
            <LayoutTemplate className="h-4 w-4" />
            Plantillas
          </TabsTrigger>
          <TabsTrigger value="historial" className="gap-2">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        {/* Listado Tab */}
        <TabsContent value="listado" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar reportes..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="borrador">Borrador</SelectItem>
                    <SelectItem value="programado">Programado</SelectItem>
                    <SelectItem value="enviado">Enviado</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las frecuencias</SelectItem>
                    <SelectItem value="diario">Diario</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="quincenal">Quincenal</SelectItem>
                    <SelectItem value="mensual">Mensual</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Reports Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cliente / Marca</TableHead>
                    <TableHead>Frecuencia</TableHead>
                    <TableHead>Último Envío</TableHead>
                    <TableHead>Próximo Envío</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => {
                    const StatusIcon = statusConfig[report.status].icon
                    return (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{report.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{report.clientName}</div>
                            <div className="text-sm text-muted-foreground">{report.brandName}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{frequencyLabels[report.frequency]}</Badge>
                        </TableCell>
                        <TableCell>{report.lastSent || '-'}</TableCell>
                        <TableCell>{report.nextSend || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-3 w-3" />
                            </div>
                            <span className="text-sm">{report.responsibleName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig[report.status].color}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusConfig[report.status].label}
                          </Badge>
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
                                Vista Previa
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSendReport(report.id)}>
                                <Send className="mr-2 h-4 w-4" />
                                Enviar Ahora
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleExport('pdf', report.id)}>
                                <FileText className="mr-2 h-4 w-4" />
                                Exportar PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExport('excel', report.id)}>
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Exportar Excel
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExport('csv', report.id)}>
                                <FileDown className="mr-2 h-4 w-4" />
                                Exportar CSV
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plantillas Tab */}
        <TabsContent value="plantillas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockReportTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Secciones incluidas:</div>
                    <div className="flex flex-wrap gap-1">
                      {template.sections.slice(0, 4).map((section, i) => (
                        <Badge key={i} variant="secondary" className="text-xs capitalize">{section}</Badge>
                      ))}
                      {template.sections.length > 4 && (
                        <Badge variant="secondary" className="text-xs">+{template.sections.length - 4}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="mr-2 h-3 w-3" />
                      Vista Previa
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => {
                      setNewReport({...newReport, templateId: template.id})
                      setShowCreateDialog(true)
                    }}>
                      <Plus className="mr-2 h-3 w-3" />
                      Usar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Historial Tab */}
        <TabsContent value="historial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Envíos</CardTitle>
              <CardDescription>Registro de todos los reportes enviados</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Reporte</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Destinatarios</TableHead>
                    <TableHead>Formato</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockReportHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(item.sentAt).toLocaleDateString('es-MX')}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.reportName}</TableCell>
                      <TableCell>
                        <div>
                          <div>{item.clientName}</div>
                          <div className="text-sm text-muted-foreground">{item.brandName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{item.recipients.length} destinatario(s)</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase">{item.format}</Badge>
                      </TableCell>
                      <TableCell>{item.responsibleName}</TableCell>
                      <TableCell>
                        <Badge className={item.status === 'enviado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {item.status === 'enviado' ? <CheckCircle className="mr-1 h-3 w-3" /> : <AlertCircle className="mr-1 h-3 w-3" />}
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
