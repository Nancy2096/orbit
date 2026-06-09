"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { 
  Search, 
  Plus, 
  Download,
  Filter,
  Users,
  UserPlus,
  Mail,
  Phone,
  Building,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Edit,
  Trash,
  MoreVertical,
  CheckCircle,
  Clock,
  XCircle,
  Star,
  MessageSquare,
  ExternalLink
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Funnel, FunnelChart, LabelList } from "recharts"

// Mock leads data
const mockLeads = [
  {
    id: "lead1",
    name: "Carlos Mendoza",
    email: "carlos.mendoza@empresa.com",
    phone: "+52 55 1234 5678",
    company: "Tech Solutions SA",
    position: "Director de Marketing",
    source: "meta_ads",
    campaign: "Campaña Verano 2026",
    status: "qualified",
    score: 85,
    value: 45000,
    createdAt: "2026-05-15",
    lastContact: "2026-05-18",
    notes: "Interesado en plan enterprise"
  },
  {
    id: "lead2",
    name: "María García",
    email: "maria.garcia@innovate.mx",
    phone: "+52 33 9876 5432",
    company: "Innovate MX",
    position: "CEO",
    source: "google_ads",
    campaign: "Search - Productos",
    status: "contacted",
    score: 72,
    value: 28000,
    createdAt: "2026-05-14",
    lastContact: "2026-05-17",
    notes: "Solicitó demo"
  },
  {
    id: "lead3",
    name: "Roberto Sánchez",
    email: "r.sanchez@globalcom.com",
    phone: "+52 81 5555 1234",
    company: "GlobalCom",
    position: "Gerente de Compras",
    source: "linkedin",
    campaign: "LinkedIn - B2B Leads",
    status: "new",
    score: 45,
    value: 15000,
    createdAt: "2026-05-18",
    lastContact: null,
    notes: ""
  },
  {
    id: "lead4",
    name: "Ana Rodríguez",
    email: "ana.rodriguez@startup.io",
    phone: "+52 55 8888 9999",
    company: "Startup IO",
    position: "Head of Growth",
    source: "organic",
    campaign: null,
    status: "opportunity",
    score: 92,
    value: 75000,
    createdAt: "2026-05-10",
    lastContact: "2026-05-18",
    notes: "En proceso de negociación"
  },
  {
    id: "lead5",
    name: "Luis Hernández",
    email: "luis.h@corporativo.mx",
    phone: "+52 55 7777 8888",
    company: "Grupo Corporativo MX",
    position: "VP Marketing",
    source: "meta_ads",
    campaign: "Retargeting - Carritos",
    status: "won",
    score: 98,
    value: 120000,
    createdAt: "2026-05-01",
    lastContact: "2026-05-16",
    notes: "Cliente cerrado - Plan anual"
  },
  {
    id: "lead6",
    name: "Patricia López",
    email: "patricia@comercio.com",
    phone: "+52 33 4444 5555",
    company: "Comercio Digital",
    position: "Directora General",
    source: "referral",
    campaign: null,
    status: "lost",
    score: 65,
    value: 35000,
    createdAt: "2026-04-25",
    lastContact: "2026-05-10",
    notes: "Eligió a la competencia"
  },
  {
    id: "lead7",
    name: "Fernando Torres",
    email: "ftorres@industrial.mx",
    phone: "+52 81 2222 3333",
    company: "Industrial MX",
    position: "Gerente Comercial",
    source: "google_ads",
    campaign: "Search - Productos",
    status: "contacted",
    score: 58,
    value: 22000,
    createdAt: "2026-05-16",
    lastContact: "2026-05-17",
    notes: "Pendiente segunda llamada"
  },
  {
    id: "lead8",
    name: "Gabriela Morales",
    email: "gmorales@fintech.io",
    phone: "+52 55 1111 2222",
    company: "FinTech Solutions",
    position: "CMO",
    source: "tiktok",
    campaign: "TikTok - Gen Z",
    status: "qualified",
    score: 78,
    value: 55000,
    createdAt: "2026-05-12",
    lastContact: "2026-05-18",
    notes: "Muy interesada en automatización"
  }
]

const funnelData = [
  { name: "Nuevos", value: 150, fill: "#94a3b8" },
  { name: "Contactados", value: 95, fill: "#60a5fa" },
  { name: "Calificados", value: 45, fill: "#a78bfa" },
  { name: "Oportunidades", value: 25, fill: "#f59e0b" },
  { name: "Ganados", value: 12, fill: "#22c55e" }
]

const leadsOverTime = [
  { date: "Sem 1", new: 35, qualified: 12, won: 3 },
  { date: "Sem 2", new: 42, qualified: 15, won: 4 },
  { date: "Sem 3", new: 38, qualified: 18, won: 2 },
  { date: "Sem 4", new: 35, qualified: 10, won: 3 }
]

const sourceDistribution = [
  { name: "Meta Ads", value: 35, color: "#1877F2" },
  { name: "Google Ads", value: 28, color: "#34A853" },
  { name: "Orgánico", value: 18, color: "#8b5cf6" },
  { name: "LinkedIn", value: 12, color: "#0A66C2" },
  { name: "Referidos", value: 7, color: "#f59e0b" }
]

export default function LeadsCRMPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [showLeadDetail, setShowLeadDetail] = useState(false)
  const [selectedLead, setSelectedLead] = useState<typeof mockLeads[0] | null>(null)
  const [showNewLeadDialog, setShowNewLeadDialog] = useState(false)

  const filteredLeads = mockLeads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter
    return matchesSearch && matchesStatus && matchesSource
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new": return <Badge className="bg-gray-100 text-gray-800">Nuevo</Badge>
      case "contacted": return <Badge className="bg-blue-100 text-blue-800">Contactado</Badge>
      case "qualified": return <Badge className="bg-purple-100 text-purple-800">Calificado</Badge>
      case "opportunity": return <Badge className="bg-amber-100 text-amber-800">Oportunidad</Badge>
      case "won": return <Badge className="bg-green-100 text-green-800">Ganado</Badge>
      case "lost": return <Badge className="bg-red-100 text-red-800">Perdido</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const getSourceName = (source: string) => {
    switch (source) {
      case "meta_ads": return "Meta Ads"
      case "google_ads": return "Google Ads"
      case "linkedin": return "LinkedIn"
      case "tiktok": return "TikTok"
      case "organic": return "Orgánico"
      case "referral": return "Referido"
      default: return source
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-amber-600"
    return "text-red-600"
  }

  const totalLeads = mockLeads.length
  const qualifiedLeads = mockLeads.filter(l => l.status === "qualified" || l.status === "opportunity").length
  const wonLeads = mockLeads.filter(l => l.status === "won").length
  const totalValue = mockLeads.filter(l => l.status === "won").reduce((sum, l) => sum + l.value, 0)
  const pipelineValue = mockLeads.filter(l => l.status !== "won" && l.status !== "lost").reduce((sum, l) => sum + l.value, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CRM de Leads</h1>
          <p className="text-muted-foreground">Gestiona y da seguimiento a tus leads de marketing</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setShowNewLeadDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Lead
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{totalLeads}</p>
                <div className="flex items-center text-xs text-green-600">
                  <ArrowUpRight className="h-3 w-3" />
                  +18% este mes
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Calificados</p>
                <p className="text-2xl font-bold">{qualifiedLeads}</p>
                <div className="flex items-center text-xs text-green-600">
                  <ArrowUpRight className="h-3 w-3" />
                  +25% este mes
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ganados</p>
                <p className="text-2xl font-bold">{wonLeads}</p>
                <div className="flex items-center text-xs text-green-600">
                  <ArrowUpRight className="h-3 w-3" />
                  +12% este mes
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Cerrado</p>
                <p className="text-2xl font-bold">${(totalValue / 1000).toFixed(0)}K</p>
                <div className="flex items-center text-xs text-green-600">
                  <ArrowUpRight className="h-3 w-3" />
                  +35% este mes
                </div>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pipeline</p>
                <p className="text-2xl font-bold">${(pipelineValue / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground">Valor potencial</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="leads">Todos los Leads</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Embudo de Conversión</CardTitle>
                <CardDescription>Leads por etapa</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {funnelData.map((stage, index) => (
                    <div key={stage.name}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>{stage.name}</span>
                        <span className="font-medium">{stage.value}</span>
                      </div>
                      <div className="h-8 rounded relative overflow-hidden bg-muted">
                        <div 
                          className="h-full rounded transition-all"
                          style={{ 
                            width: `${(stage.value / funnelData[0].value) * 100}%`,
                            backgroundColor: stage.fill
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Source Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Fuentes de Leads</CardTitle>
                <CardDescription>Distribución por origen</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={sourceDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {sourceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {sourceDistribution.map(source => (
                    <div key={source.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                        <span>{source.name}</span>
                      </div>
                      <span className="font-medium">{source.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Leads Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Tendencia Semanal</CardTitle>
                <CardDescription>Leads por semana</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={leadsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="new" fill="#94a3b8" name="Nuevos" />
                    <Bar dataKey="qualified" fill="#a78bfa" name="Calificados" />
                    <Bar dataKey="won" fill="#22c55e" name="Ganados" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Leads */}
          <Card>
            <CardHeader>
              <CardTitle>Leads Recientes</CardTitle>
              <CardDescription>Últimos leads ingresados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Fuente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockLeads.slice(0, 5).map(lead => (
                    <TableRow 
                      key={lead.id} 
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedLead(lead)
                        setShowLeadDetail(true)
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{lead.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{lead.name}</p>
                            <p className="text-sm text-muted-foreground">{lead.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{lead.company}</TableCell>
                      <TableCell>{getSourceName(lead.source)}</TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${getScoreColor(lead.score)}`}>
                          {lead.score}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">${lead.value.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar leads..." 
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
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="new">Nuevos</SelectItem>
                <SelectItem value="contacted">Contactados</SelectItem>
                <SelectItem value="qualified">Calificados</SelectItem>
                <SelectItem value="opportunity">Oportunidades</SelectItem>
                <SelectItem value="won">Ganados</SelectItem>
                <SelectItem value="lost">Perdidos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Fuente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Fuentes</SelectItem>
                <SelectItem value="meta_ads">Meta Ads</SelectItem>
                <SelectItem value="google_ads">Google Ads</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="organic">Orgánico</SelectItem>
                <SelectItem value="referral">Referido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Leads Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead>Campaña</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map(lead => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{lead.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{lead.name}</p>
                          <p className="text-sm text-muted-foreground">{lead.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{lead.company}</TableCell>
                    <TableCell>{lead.position}</TableCell>
                    <TableCell>{getSourceName(lead.source)}</TableCell>
                    <TableCell>
                      {lead.campaign ? (
                        <span className="text-sm">{lead.campaign}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>
                      <span className={`font-medium ${getScoreColor(lead.score)}`}>
                        {lead.score}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">${lead.value.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedLead(lead)
                            setShowLeadDetail(true)
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar Email
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          {/* Kanban-style Pipeline */}
          <div className="grid grid-cols-5 gap-4">
            {["new", "contacted", "qualified", "opportunity", "won"].map(status => {
              const statusLeads = mockLeads.filter(l => l.status === status)
              const statusValue = statusLeads.reduce((sum, l) => sum + l.value, 0)
              
              return (
                <div key={status} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(status)}
                      <span className="text-sm text-muted-foreground">({statusLeads.length})</span>
                    </div>
                    <span className="text-sm font-medium">${(statusValue / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="space-y-2">
                    {statusLeads.map(lead => (
                      <Card 
                        key={lead.id} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                          setSelectedLead(lead)
                          setShowLeadDetail(true)
                        }}
                      >
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {lead.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{lead.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{lead.company}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${getScoreColor(lead.score)}`}>
                              Score: {lead.score}
                            </span>
                            <span className="text-sm font-medium">${(lead.value / 1000).toFixed(0)}K</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Lead Detail Dialog */}
      <Dialog open={showLeadDetail} onOpenChange={setShowLeadDetail}>
        <DialogContent className="max-w-2xl">
          {selectedLead && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {selectedLead.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle>{selectedLead.name}</DialogTitle>
                    <DialogDescription>{selectedLead.position} en {selectedLead.company}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {selectedLead.email}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Teléfono</Label>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {selectedLead.phone}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Fuente</Label>
                    <p>{getSourceName(selectedLead.source)}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Campaña</Label>
                    <p>{selectedLead.campaign || "Orgánico"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Estado</Label>
                    <div>{getStatusBadge(selectedLead.status)}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Score</Label>
                    <p className={`font-medium ${getScoreColor(selectedLead.score)}`}>
                      {selectedLead.score} / 100
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Valor Estimado</Label>
                    <p className="font-medium">${selectedLead.value.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Último Contacto</Label>
                    <p>{selectedLead.lastContact ? new Date(selectedLead.lastContact).toLocaleDateString('es-MX') : "Sin contacto"}</p>
                  </div>
                </div>

                {selectedLead.notes && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Notas</Label>
                    <p className="p-3 bg-muted rounded-lg">{selectedLead.notes}</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowLeadDetail(false)}>
                  Cerrar
                </Button>
                <Button variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Email
                </Button>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Lead
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Lead Dialog */}
      <Dialog open={showNewLeadDialog} onOpenChange={setShowNewLeadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Lead</DialogTitle>
            <DialogDescription>Agrega un nuevo lead manualmente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre Completo</Label>
                <Input placeholder="Ej: Juan Pérez" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="email@empresa.com" />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input placeholder="+52 55 1234 5678" />
              </div>
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Input placeholder="Nombre de la empresa" />
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input placeholder="Ej: Director de Marketing" />
              </div>
              <div className="space-y-2">
                <Label>Fuente</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar fuente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="referral">Referido</SelectItem>
                    <SelectItem value="event">Evento</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Valor Estimado</Label>
                <Input type="number" placeholder="0" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Notas</Label>
                <Textarea placeholder="Notas adicionales..." />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewLeadDialog(false)}>
              Cancelar
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Crear Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
