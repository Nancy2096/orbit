"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useAgency } from "@/contexts/agency-context"
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
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { 
  UserPlus, 
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building2,
  Filter,
  MessageCircle,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Stage {
  id: string
  name: string
  color: string
}

interface Source {
  id: string
  name: string
}

interface SalesRep {
  id: string
  first_name: string
  last_name: string
}

interface Prospect {
  id: string
  company_name: string | null
  contact_name: string
  contact_email: string | null
  contact_phone: string | null
  contact_position: string | null
  estimated_value: number | null
  expected_close_date: string | null
  probability: number
  status: string
  created_at: string
  stage: Stage | null
  source: Source | null
  assigned_to: string | null
  client_type: { id: string; name: string } | null
  industry: { id: string; name: string } | null
}

export default function ProspectsPage() {
  const { selectedAgencyId, loading: agencyLoading } = useAgency()
  const [loading, setLoading] = useState(true)
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [salesReps, setSalesReps] = useState<SalesRep[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStage, setSelectedStage] = useState<string>("all")
  const [selectedSource, setSelectedSource] = useState<string>("all")
  const [selectedSalesRep, setSelectedSalesRep] = useState<string>("all")
  const [prospectToDelete, setProspectToDelete] = useState<Prospect | null>(null)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  const handleDelete = async () => {
    if (!prospectToDelete) return
    setDeleting(true)

    const { error } = await supabase
      .from("crm_prospects")
      .delete()
      .eq("id", prospectToDelete.id)

    setDeleting(false)

    if (error) {
      console.log("[v0] Error deleting prospect:", error)
      toast.error("No se pudo eliminar el prospecto")
      return
    }

    setProspects((prev) => prev.filter((p) => p.id !== prospectToDelete.id))
    toast.success("Prospecto eliminado correctamente")
    setProspectToDelete(null)
  }

  useEffect(() => {
    if (selectedAgencyId) {
      fetchData()
    } else {
      setLoading(false)
      setProspects([])
    }
  }, [selectedAgencyId])

  const fetchData = async () => {
    if (!selectedAgencyId) return
    setLoading(true)

    // Fetch stages for this agency
    const { data: stagesData } = await supabase
      .from("crm_pipeline_stages")
      .select("id, name, color")
      .eq("agency_id", selectedAgencyId)
      .eq("is_active", true)
      .order("sort_order")

    if (stagesData) setStages(stagesData)

    // Fetch sources for this agency
    const { data: sourcesData } = await supabase
      .from("crm_lead_sources")
      .select("id, name")
      .eq("agency_id", selectedAgencyId)
      .eq("is_active", true)
      .order("name")

    if (sourcesData) setSources(sourcesData)

    // Fetch sales reps (staff) for this agency
    const { data: salesRepsData } = await supabase
      .from("staff")
      .select("id, first_name, last_name")
      .or(`agency_id.eq.${selectedAgencyId},is_global.eq.true`)
      .eq("is_active", true)
      .order("first_name")

    if (salesRepsData) setSalesReps(salesRepsData)

    // Fetch prospects and lookup tables in parallel
    const [prospectsRes, clientTypesRes, industriesRes] = await Promise.all([
      supabase
        .from("crm_prospects")
        .select(`
          id, company_name, contact_name, contact_email, contact_phone, contact_position,
          estimated_value, expected_close_date, probability, status, created_at, assigned_to,
          client_type_id, industry_id,
          stage:crm_pipeline_stages(id, name, color),
          source:crm_lead_sources(id, name)
        `)
        .eq("agency_id", selectedAgencyId)
        .order("created_at", { ascending: false }),
      supabase
        .from("client_types")
        .select("id, name")
        .eq("agency_id", selectedAgencyId),
      supabase
        .from("industries")
        .select("id, name")
        .eq("agency_id", selectedAgencyId),
    ])

    console.log("[v0] Prospects - prospectsData:", prospectsRes.data?.length, "Error:", prospectsRes.error)
    
    if (prospectsRes.data) {
      // Map client_type and industry data to prospects
      const clientTypesMap = new Map(clientTypesRes.data?.map(ct => [ct.id, ct]) || [])
      const industriesMap = new Map(industriesRes.data?.map(ind => [ind.id, ind]) || [])
      
      const enrichedProspects = prospectsRes.data.map(p => ({
        ...p,
        client_type: p.client_type_id ? clientTypesMap.get(p.client_type_id) || null : null,
        industry: p.industry_id ? industriesMap.get(p.industry_id) || null : null,
      }))
      
      setProspects(enrichedProspects as Prospect[])
    }

    setLoading(false)
  }

  const filteredProspects = prospects.filter(prospect => {
    const salesRep = salesReps.find(r => r.id === prospect.assigned_to)
    const salesRepName = salesRep 
      ? `${salesRep.first_name} ${salesRep.last_name}`.toLowerCase()
      : ""
    
    const matchesSearch = searchTerm === "" ||
      prospect.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salesRepName.includes(searchTerm.toLowerCase())
    
    const matchesStage = selectedStage === "all" || prospect.stage?.id === selectedStage
    const matchesSource = selectedSource === "all" || prospect.source?.id === selectedSource
    const matchesSalesRep = selectedSalesRep === "all" || prospect.assigned_to === selectedSalesRep

    return matchesSearch && matchesStage && matchesSource && matchesSalesRep
  })

  const getStageColor = (color: string | null) => {
    // If it's a hex color, return inline styles
    if (color && color.startsWith("#")) {
      return { isHex: true, hex: color }
    }
    const colors: Record<string, string> = {
      blue: "bg-blue-500 text-white border-blue-600",
      cyan: "bg-cyan-500 text-white border-cyan-600",
      yellow: "bg-yellow-500 text-white border-yellow-600",
      orange: "bg-orange-500 text-white border-orange-600",
      purple: "bg-purple-500 text-white border-purple-600",
      green: "bg-green-500 text-white border-green-600",
      red: "bg-red-500 text-white border-red-600",
      pink: "bg-pink-500 text-white border-pink-600",
      indigo: "bg-indigo-500 text-white border-indigo-600",
      teal: "bg-teal-500 text-white border-teal-600",
    }
    return { isHex: false, className: colors[color || ""] || "bg-gray-500 text-white border-gray-600" }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  if (loading || agencyLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-[500px]" />
      </div>
    )
  }

  if (!selectedAgencyId) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <UserPlus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Selecciona una Agencia</h2>
          <p className="text-muted-foreground max-w-md">
            Para ver los prospectos, primero selecciona una agencia en el selector de arriba.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prospectos</h1>
          <p className="text-muted-foreground">
            Gestiona todos tus prospectos y oportunidades
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/crm/prospects/new">
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Prospecto
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, empresa o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Etapa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las etapas</SelectItem>
                {stages.map((stage) => {
                  const stageStyle = getStageColor(stage.color)
                  const colorHex = stageStyle.isHex ? stageStyle.hex : 
                    stage.color === 'blue' ? '#3b82f6' :
                    stage.color === 'cyan' ? '#06b6d4' :
                    stage.color === 'yellow' ? '#eab308' :
                    stage.color === 'orange' ? '#f97316' :
                    stage.color === 'purple' ? '#a855f7' :
                    stage.color === 'green' ? '#22c55e' :
                    stage.color === 'red' ? '#ef4444' :
                    stage.color === 'pink' ? '#ec4899' :
                    stage.color === 'indigo' ? '#6366f1' :
                    stage.color === 'teal' ? '#14b8a6' : '#6b7280'
                  return (
                    <SelectItem key={stage.id} value={stage.id}>
                      <span className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: colorHex }}
                        />
                        {stage.name}
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Fuente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las fuentes</SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSalesRep} onValueChange={setSelectedSalesRep}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Asesor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los asesores</SelectItem>
                {salesReps.map((rep) => (
                  <SelectItem key={rep.id} value={rep.id}>
                    {rep.first_name} {rep.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prospecto</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Tipo de Cliente</TableHead>
                <TableHead>Asesor</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Fuente</TableHead>
                <TableHead className="text-right">Valor Est.</TableHead>
                <TableHead>Fecha Cierre</TableHead>
                <TableHead>Prob.</TableHead>
                <TableHead className="w-[80px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProspects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <UserPlus className="h-8 w-8 mb-2 opacity-50" />
                      <p>No se encontraron prospectos</p>
                      {(searchTerm || selectedStage !== "all" || selectedSource !== "all" || selectedSalesRep !== "all") && (
                        <Button
                          variant="link"
                          onClick={() => {
                            setSearchTerm("")
                            setSelectedStage("all")
                            setSelectedSource("all")
                            setSelectedSalesRep("all")
                          }}
                        >
                          Limpiar filtros
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProspects.map((prospect) => (
                  <TableRow key={prospect.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {prospect.contact_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Link 
                            href={`/dashboard/crm/prospects/${prospect.id}`}
                            className="font-medium hover:text-primary hover:underline transition-colors cursor-pointer"
                          >
                            {prospect.contact_name}
                          </Link>
                          {prospect.company_name && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {prospect.company_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <div className="flex items-center gap-1">
                          {prospect.contact_phone ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  asChild
                                >
                                  <a href={`tel:${prospect.contact_phone}`}>
                                    <Phone className="h-4 w-4" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Llamar: {prospect.contact_phone}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/40" disabled>
                              <Phone className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {prospect.contact_phone ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  asChild
                                >
                                  <a 
                                    href={`https://wa.me/${prospect.contact_phone.replace(/\D/g, '')}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>WhatsApp: {prospect.contact_phone}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/40" disabled>
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {prospect.contact_email ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                  asChild
                                >
                                  <a href={`mailto:${prospect.contact_email}`}>
                                    <Mail className="h-4 w-4" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Email: {prospect.contact_email}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/40" disabled>
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      {prospect.client_type?.name || prospect.industry?.name || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const salesRep = salesReps.find(r => r.id === prospect.assigned_to)
                        return salesRep ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {salesRep.first_name[0]}{salesRep.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{salesRep.first_name} {salesRep.last_name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sin asignar</span>
                        )
                      })()}
                    </TableCell>
                    <TableCell>
                      {prospect.stage ? (
                        (() => {
                          const stageStyle = getStageColor(prospect.stage.color)
                          if (stageStyle.isHex) {
                            return (
                              <Badge 
                                className="font-medium"
                                style={{ 
                                  backgroundColor: stageStyle.hex, 
                                  color: 'white',
                                  borderColor: stageStyle.hex 
                                }}
                              >
                                {prospect.stage.name}
                              </Badge>
                            )
                          }
                          return (
                            <Badge className={`font-medium ${stageStyle.className}`}>
                              {prospect.stage.name}
                            </Badge>
                          )
                        })()
                      ) : (
                        <span className="text-muted-foreground">Sin etapa</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {prospect.source?.name || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {prospect.estimated_value ? (
                        <span className="font-medium">{formatCurrency(prospect.estimated_value)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {prospect.expected_close_date ? (
                        formatDate(prospect.expected_close_date)
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary"
                            style={{ width: `${prospect.probability}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{prospect.probability}%</span>
                      </div>
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
                            <Link href={`/dashboard/crm/prospects/${prospect.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalle
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/crm/prospects/${prospect.id}?tab=info`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={(e) => {
                              e.preventDefault()
                              setProspectToDelete(prospect)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!prospectToDelete} onOpenChange={(open) => !open && setProspectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar prospecto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente a{" "}
              <span className="font-medium text-foreground">
                {prospectToDelete?.contact_name}
              </span>
              {prospectToDelete?.company_name ? ` (${prospectToDelete.company_name})` : ""} y toda su información asociada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
