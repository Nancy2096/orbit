"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Copy, 
  Trash2,
  Building2,
  Tag,
  Filter,
  LayoutGrid,
  List,
  MapPin,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  Pause,
  Archive
} from "lucide-react"
import { mockBrands, calculateOverallCompletion } from "@/lib/marketing-intelligence/brand-mock-data"
import { mockMIClients } from "@/lib/marketing-intelligence/mock-data"
import { formatCurrency } from "@/lib/marketing-intelligence/calculations"
import type { BrandStatus, ProjectType } from "@/lib/marketing-intelligence/brand-types"

export default function BrandsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [clientFilter, setClientFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<BrandStatus | "all">("all")
  const [typeFilter, setTypeFilter] = useState<ProjectType | "all">("all")
  const [view, setView] = useState<"table" | "cards">("cards")
  const [brandToDelete, setBrandToDelete] = useState<{ id: string; name: string } | null>(null)

  const handleDuplicate = (name: string) => {
    toast.success("Marca duplicada", {
      description: `Se creó una copia de "${name}" como borrador.`,
    })
  }

  const handleDelete = () => {
    if (!brandToDelete) return
    toast.success("Marca eliminada", {
      description: `"${brandToDelete.name}" fue eliminada.`,
    })
    setBrandToDelete(null)
  }

  const filteredBrands = useMemo(() => {
    return mockBrands.filter(brand => {
      const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           brand.city.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesClient = clientFilter === "all" || brand.clientId === clientFilter
      const matchesStatus = statusFilter === "all" || brand.status === statusFilter
      const matchesType = typeFilter === "all" || brand.projectType === typeFilter
      return matchesSearch && matchesClient && matchesStatus && matchesType
    })
  }, [searchQuery, clientFilter, statusFilter, typeFilter])

  const getClientName = (clientId: string) => {
    return mockMIClients.find(c => c.id === clientId)?.name || 'Cliente'
  }

  const getStatusConfig = (status: BrandStatus) => {
    const configs = {
      activo: { label: 'Activo', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
      pausado: { label: 'Pausado', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Pause },
      archivado: { label: 'Archivado', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: Archive },
      borrador: { label: 'Borrador', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
    }
    return configs[status]
  }

  const getTypeLabel = (type: ProjectType) => {
    const labels = {
      inmobiliario: 'Inmobiliario',
      producto: 'Producto',
      servicio: 'Servicio',
      ecommerce: 'E-commerce',
      otro: 'Otro'
    }
    return labels[type]
  }

  // Stats
  const stats = useMemo(() => ({
    total: mockBrands.length,
    activos: mockBrands.filter(b => b.status === 'activo').length,
    inmobiliarios: mockBrands.filter(b => b.projectType === 'inmobiliario').length,
    avgCompletion: Math.round(mockBrands.reduce((sum, b) => sum + calculateOverallCompletion(b), 0) / mockBrands.length),
  }), [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marcas y Proyectos</h1>
          <p className="text-muted-foreground">Tus clientes son empresas y dueños de marcas; aquí gestionas cada marca o proyecto</p>
        </div>
        <Button asChild>
          <Link href="/orbit-marketing-intelligence/brands/new">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Marca
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Marcas</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Tag className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Activas</p>
                <p className="text-2xl font-bold">{stats.activos}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inmobiliarios</p>
                <p className="text-2xl font-bold">{stats.inmobiliarios}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completitud Promedio</p>
                <p className="text-2xl font-bold">{stats.avgCompletion}%</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar marcas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-[180px]">
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los clientes</SelectItem>
                  {mockMIClients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BrandStatus | "all")}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="pausado">Pausado</SelectItem>
                  <SelectItem value="borrador">Borrador</SelectItem>
                  <SelectItem value="archivado">Archivado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ProjectType | "all")}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="inmobiliario">Inmobiliario</SelectItem>
                  <SelectItem value="producto">Producto</SelectItem>
                  <SelectItem value="servicio">Servicio</SelectItem>
                  <SelectItem value="ecommerce">E-commerce</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={view === 'cards' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setView('cards')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'table' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setView('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Mostrando {filteredBrands.length} de {mockBrands.length} marcas
      </div>

      {/* Brands Grid/Table */}
      {view === 'cards' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBrands.map(brand => {
            const statusConfig = getStatusConfig(brand.status)
            const StatusIcon = statusConfig.icon
            const overallCompletion = calculateOverallCompletion(brand)
            
            return (
              <Card key={brand.id} className="group hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{brand.name}</CardTitle>
                      </div>
                      <CardDescription className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {getClientName(brand.clientId)}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/orbit-marketing-intelligence/brands/${brand.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/orbit-marketing-intelligence/brands/${brand.id}/profile`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar Perfil
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleDuplicate(brand.name)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={() => setBrandToDelete({ id: brand.id, name: brand.name })}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={statusConfig.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                    <Badge variant="secondary">{getTypeLabel(brand.projectType)}</Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {brand.city}
                    </Badge>
                  </div>

                  {/* Real Estate specific info */}
                  {brand.realEstate && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        <span>Desde {formatCurrency(brand.realEstate.priceFrom)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span>{brand.realEstate.availableUnits}/{brand.realEstate.totalUnits} disp.</span>
                      </div>
                    </div>
                  )}

                  {/* Completion Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Completitud</span>
                      <span className="font-medium">{overallCompletion}%</span>
                    </div>
                    <Progress value={overallCompletion} className="h-2" />
                    <div className="grid grid-cols-5 gap-1 text-xs text-muted-foreground">
                      <div className="text-center">
                        <div className="h-1 rounded-full bg-primary/30 mb-1" style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${brand.profileCompletion}%, hsl(var(--muted)) ${brand.profileCompletion}%)` }} />
                        Perfil
                      </div>
                      <div className="text-center">
                        <div className="h-1 rounded-full bg-primary/30 mb-1" style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${brand.briefCompletion}%, hsl(var(--muted)) ${brand.briefCompletion}%)` }} />
                        Brief
                      </div>
                      <div className="text-center">
                        <div className="h-1 rounded-full bg-primary/30 mb-1" style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${brand.objectivesCompletion}%, hsl(var(--muted)) ${brand.objectivesCompletion}%)` }} />
                        Obj.
                      </div>
                      <div className="text-center">
                        <div className="h-1 rounded-full bg-primary/30 mb-1" style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${brand.personasCompletion}%, hsl(var(--muted)) ${brand.personasCompletion}%)` }} />
                        Personas
                      </div>
                      <div className="text-center">
                        <div className="h-1 rounded-full bg-primary/30 mb-1" style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${brand.assetsCompletion}%, hsl(var(--muted)) ${brand.assetsCompletion}%)` }} />
                        Activos
                      </div>
                    </div>
                  </div>

                  {/* Budget */}
                  {brand.monthlyBudget && (
                    <div className="flex items-center justify-between pt-2 border-t text-sm">
                      <span className="text-muted-foreground">Presupuesto mensual</span>
                      <span className="font-medium">{formatCurrency(brand.monthlyBudget)}</span>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button className="w-full" variant="outline" asChild>
                    <Link href={`/orbit-marketing-intelligence/brands/${brand.id}`}>
                      Ver Dashboard
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marca</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Completitud</TableHead>
                <TableHead>Presupuesto</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBrands.map(brand => {
                const statusConfig = getStatusConfig(brand.status)
                const StatusIcon = statusConfig.icon
                const overallCompletion = calculateOverallCompletion(brand)
                
                return (
                  <TableRow key={brand.id}>
                    <TableCell>
                      <Link 
                        href={`/orbit-marketing-intelligence/brands/${brand.id}`}
                        className="font-medium hover:underline"
                      >
                        {brand.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getClientName(brand.clientId)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getTypeLabel(brand.projectType)}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{brand.city}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusConfig.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={overallCompletion} className="h-2 w-20" />
                        <span className="text-sm text-muted-foreground">{overallCompletion}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {brand.monthlyBudget ? formatCurrency(brand.monthlyBudget) : '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/orbit-marketing-intelligence/brands/${brand.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Dashboard
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/orbit-marketing-intelligence/brands/${brand.id}/profile`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={() => setBrandToDelete({ id: brand.id, name: brand.name })}
                          >
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
        </Card>
      )}

      {filteredBrands.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No se encontraron marcas</h3>
            <p className="text-muted-foreground mb-4">
              Intenta ajustar los filtros o crea una nueva marca
            </p>
            <Button asChild>
              <Link href="/orbit-marketing-intelligence/brands/new">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Marca
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!brandToDelete} onOpenChange={(open) => !open && setBrandToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta marca?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente
              {brandToDelete ? ` "${brandToDelete.name}"` : ""} y toda su configuración asociada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
