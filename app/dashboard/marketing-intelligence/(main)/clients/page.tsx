"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Plus,
  MoreHorizontal,
  Building2,
  Users,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  Filter,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Pause,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"
import { formatCurrency } from "@/lib/marketing-intelligence/calculations"
import { mockMIClients, mockMIBrands, mockMICampaigns } from "@/lib/marketing-intelligence/mock-data"

export default function MIClientsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [view, setView] = useState<"table" | "cards">("table")

  const filteredClients = mockMIClients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.industry.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || client.status === statusFilter
    const matchesType = typeFilter === "all" || client.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'activo':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Activo</Badge>
      case 'inactivo':
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Inactivo</Badge>
      case 'pausado':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100"><Pause className="h-3 w-3 mr-1" />Pausado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      enterprise: 'bg-purple-100 text-purple-700',
      corporativo: 'bg-blue-100 text-blue-700',
      pyme: 'bg-green-100 text-green-700',
      startup: 'bg-orange-100 text-orange-700'
    }
    return (
      <Badge className={`${colors[type] || 'bg-gray-100 text-gray-700'} hover:${colors[type] || 'bg-gray-100'}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  const getBrandsForClient = (clientId: string) => {
    return mockMIBrands.filter(b => b.clientId === clientId)
  }

  const getCampaignsForClient = (clientId: string) => {
    return mockMICampaigns.filter(c => c.clientId === clientId && c.status === 'activo')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes y Marcas</h1>
          <p className="text-muted-foreground">Gestiona tus clientes y sus marcas asociadas</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <Building2 className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockMIClients.length}</p>
                <p className="text-sm text-muted-foreground">Total Clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockMIClients.filter(c => c.status === 'activo').length}</p>
                <p className="text-sm text-muted-foreground">Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockMIBrands.length}</p>
                <p className="text-sm text-muted-foreground">Total Marcas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(mockMIClients.reduce((sum, c) => sum + c.monthlyInvestment, 0))}</p>
                <p className="text-sm text-muted-foreground">Inversión Mensual</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="pausado">Pausado</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="corporativo">Corporativo</SelectItem>
                <SelectItem value="pyme">PYME</SelectItem>
                <SelectItem value="startup">Startup</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1 border rounded-lg p-1">
              <Button 
                variant={view === "table" ? "secondary" : "ghost"} 
                size="sm"
                onClick={() => setView("table")}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
              <Button 
                variant={view === "cards" ? "secondary" : "ghost"} 
                size="sm"
                onClick={() => setView("cards")}
              >
                <Building2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <Tabs defaultValue="clients">
        <TabsList>
          <TabsTrigger value="clients">Clientes ({filteredClients.length})</TabsTrigger>
          <TabsTrigger value="brands">Marcas ({mockMIBrands.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="mt-4">
          {view === "table" ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Industria</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Account Manager</TableHead>
                      <TableHead className="text-center">Marcas</TableHead>
                      <TableHead className="text-center">Campañas</TableHead>
                      <TableHead className="text-right">Inversión/Mes</TableHead>
                      <TableHead className="text-right">Leads/Mes</TableHead>
                      <TableHead className="text-right">CPL</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="text-center">Acceso</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">
                                {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <Link 
                                href={`/dashboard/marketing-intelligence/clients/${client.id}`}
                                className="font-medium hover:underline"
                              >
                                {client.name}
                              </Link>
                              <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {client.website}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{client.industry}</TableCell>
                        <TableCell>{getTypeBadge(client.type)}</TableCell>
                        <TableCell className="text-sm">{client.accountManager}</TableCell>
                        <TableCell className="text-center">{getBrandsForClient(client.id).length}</TableCell>
                        <TableCell className="text-center">{getCampaignsForClient(client.id).length}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(client.monthlyInvestment)}</TableCell>
                        <TableCell className="text-right">{client.monthlyLeads.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{formatCurrency(client.avgCPL)}</TableCell>
                        <TableCell className="text-center">{getStatusBadge(client.status)}</TableCell>
                        <TableCell className="text-center">
                          {client.clientAccess ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
<DropdownMenuContent align="end">
                                              <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/marketing-intelligence/clients/${client.id}`}>
                                                  <Eye className="h-4 w-4 mr-2" />
                                                  Ver Detalle
                                                </Link>
                                              </DropdownMenuItem>
                                              <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/marketing-intelligence/clients/${client.id}/edit`}>
                                                  <Edit className="h-4 w-4 mr-2" />
                                                  Editar
                                                </Link>
                                              </DropdownMenuItem>
                                              {client.website && (
                                                <DropdownMenuItem onClick={() => window.open(client.website, '_blank')}>
                                                  <ExternalLink className="h-4 w-4 mr-2" />
                                                  Abrir Sitio Web
                                                </DropdownMenuItem>
                                              )}
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem className="text-destructive">
                                                <Trash2 className="h-4 w-4 mr-2" />
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
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredClients.map((client) => (
                <Card key={client.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-violet-100 text-violet-700">
                            {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{client.name}</CardTitle>
                          <CardDescription>{client.industry}</CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(client.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-muted p-2">
                        <p className="text-lg font-bold">{getBrandsForClient(client.id).length}</p>
                        <p className="text-xs text-muted-foreground">Marcas</p>
                      </div>
                      <div className="rounded-lg bg-muted p-2">
                        <p className="text-lg font-bold">{getCampaignsForClient(client.id).length}</p>
                        <p className="text-xs text-muted-foreground">Campañas</p>
                      </div>
                      <div className="rounded-lg bg-muted p-2">
                        <p className="text-lg font-bold">{client.monthlyLeads}</p>
                        <p className="text-xs text-muted-foreground">Leads</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Inversión mensual</span>
                      <span className="font-medium">{formatCurrency(client.monthlyInvestment)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">CPL promedio</span>
                      <span className="font-medium">{formatCurrency(client.avgCPL)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Account Manager</span>
                      <span>{client.accountManager}</span>
                    </div>
                    <Button asChild variant="outline" className="w-full mt-2">
                      <Link href={`/dashboard/marketing-intelligence/clients/${client.id}`}>
                        Ver Detalle
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="brands" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marca</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Industria</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead className="text-center">Redes Conectadas</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockMIBrands.map((brand) => {
                    const client = mockMIClients.find(c => c.id === brand.clientId)
                    const connectedNetworks = brand.socialNetworks.filter(n => n.connected).length
                    return (
                      <TableRow key={brand.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div 
                              className="h-9 w-9 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: brand.colors?.[0] || '#8b5cf6' }}
                            >
                              {brand.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <Link 
                                href={`/dashboard/marketing-intelligence/clients/${brand.clientId}/brands/${brand.id}`}
                                className="font-medium hover:underline"
                              >
                                {brand.name}
                              </Link>
                              <p className="text-xs text-muted-foreground">{brand.website}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{client?.name}</TableCell>
                        <TableCell className="text-sm">{brand.industry}</TableCell>
                        <TableCell className="text-sm">{brand.city}, {brand.country}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {connectedNetworks}/{brand.socialNetworks.length}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {brand.status === 'activo' ? (
                            <Badge className="bg-green-100 text-green-700">Activo</Badge>
                          ) : (
                            <Badge variant="secondary">Inactivo</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/marketing-intelligence/clients/${brand.clientId}/brands/${brand.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Detalle
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
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
      </Tabs>
    </div>
  )
}
