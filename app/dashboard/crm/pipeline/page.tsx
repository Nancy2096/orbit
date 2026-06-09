"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { useAgency } from "@/contexts/agency-context"
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
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { 
  UserPlus, 
  Search,
  MoreHorizontal,
  Eye,
  ArrowRight,
  ArrowLeft,
  Phone,
  Mail,
  DollarSign,
  Calendar,
  GripVertical,
  RefreshCw,
} from "lucide-react"

interface Stage {
  id: string
  name: string
  color: string
  sort_order: number
  is_won: boolean
  is_lost: boolean
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
  estimated_value: number | null
  expected_close_date: string | null
  probability: number
  stage_id: string | null
  status: string
  created_at: string
  assigned_to: string | null
}

export default function PipelinePage() {
  const { selectedAgencyId, loading: agencyLoading } = useAgency()
  const [loading, setLoading] = useState(true)
  const [stages, setStages] = useState<Stage[]>([])
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [salesReps, setSalesReps] = useState<SalesRep[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSalesRep, setSelectedSalesRep] = useState<string>("all")
  const [draggingProspect, setDraggingProspect] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (selectedAgencyId) {
      fetchData()
    } else {
      setLoading(false)
      setStages([])
      setProspects([])
    }
  }, [selectedAgencyId])

  const fetchData = async () => {
    if (!selectedAgencyId) return
    setLoading(true)

    // Fetch stages for this agency
    const { data: stagesData } = await supabase
      .from("crm_pipeline_stages")
      .select("*")
      .eq("agency_id", selectedAgencyId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })

    if (stagesData) {
      setStages(stagesData)
    }

    // Fetch sales reps for this agency
    const { data: salesRepsData } = await supabase
      .from("staff")
      .select("id, first_name, last_name")
      .or(`agency_id.eq.${selectedAgencyId},is_global.eq.true`)
      .eq("is_active", true)
      .order("first_name")

    if (salesRepsData) setSalesReps(salesRepsData)

    // Fetch prospects for this agency
    const { data: prospectsData, error: prospectsError } = await supabase
      .from("crm_prospects")
      .select("*")
      .eq("agency_id", selectedAgencyId)
      .eq("status", "active")
      .order("created_at", { ascending: false })

    console.log("[v0] Pipeline - prospectsData:", prospectsData?.length, "Error:", prospectsError)
    
    if (prospectsData) {
      setProspects(prospectsData as Prospect[])
    }

    setLoading(false)
  }

  const moveProspect = async (prospectId: string, newStageId: string) => {
    const stage = stages.find(s => s.id === newStageId)
    
    const updateData: Record<string, unknown> = {
      stage_id: newStageId,
      updated_at: new Date().toISOString(),
    }

    // If moved to won stage
    if (stage?.is_won) {
      updateData.won_date = new Date().toISOString()
    }

    // If moved to lost stage
    if (stage?.is_lost) {
      updateData.lost_date = new Date().toISOString()
    }

    const { error } = await supabase
      .from("crm_prospects")
      .update(updateData)
      .eq("id", prospectId)

    if (error) {
      toast.error("Error al mover el prospecto")
      return
    }

    // Update local state
    setProspects(prev => prev.map(p => 
      p.id === prospectId ? { ...p, stage_id: newStageId } : p
    ))

    toast.success(`Prospecto movido a ${stage?.name}`)
  }

  const handleDragStart = (e: React.DragEvent, prospectId: string) => {
    setDraggingProspect(prospectId)
    e.dataTransfer.setData("text/plain", prospectId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    const prospectId = e.dataTransfer.getData("text/plain")
    if (prospectId) {
      moveProspect(prospectId, stageId)
    }
    setDraggingProspect(null)
  }

  const handleDragEnd = () => {
    setDraggingProspect(null)
  }

const getProspectsForStage = (stageId: string) => {
    return prospects.filter(p => {
      const matchesStage = p.stage_id === stageId
      const salesRep = salesReps.find(r => r.id === p.assigned_to)
      const salesRepName = salesRep 
        ? `${salesRep.first_name} ${salesRep.last_name}`.toLowerCase()
        : ""
      const matchesSearch = searchTerm === "" ||
        p.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        salesRepName.includes(searchTerm.toLowerCase())
      const matchesSalesRep = selectedSalesRep === "all" || p.assigned_to === selectedSalesRep
      return matchesStage && matchesSearch && matchesSalesRep
    })
  }

  const getStageColor = (color: string | null) => {
    // If it's a hex color (from Ajustar Pipeline), use it directly
    if (color && color.startsWith("#")) {
      // Convert hex to RGB for lighter background
      const hex = color.replace("#", "")
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      return {
        bg: `rgba(${r}, ${g}, ${b}, 0.1)`,
        border: `rgba(${r}, ${g}, ${b}, 0.3)`,
        header: color,
      }
    }
    // Fallback for legacy named colors
    const colors: Record<string, { bg: string; border: string; header: string }> = {
      blue: { bg: "rgba(59, 130, 246, 0.1)", border: "rgba(59, 130, 246, 0.3)", header: "#3b82f6" },
      cyan: { bg: "rgba(6, 182, 212, 0.1)", border: "rgba(6, 182, 212, 0.3)", header: "#06b6d4" },
      yellow: { bg: "rgba(234, 179, 8, 0.1)", border: "rgba(234, 179, 8, 0.3)", header: "#eab308" },
      orange: { bg: "rgba(249, 115, 22, 0.1)", border: "rgba(249, 115, 22, 0.3)", header: "#f97316" },
      purple: { bg: "rgba(168, 85, 247, 0.1)", border: "rgba(168, 85, 247, 0.3)", header: "#a855f7" },
      green: { bg: "rgba(34, 197, 94, 0.1)", border: "rgba(34, 197, 94, 0.3)", header: "#22c55e" },
      red: { bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.3)", header: "#ef4444" },
    }
    return colors[color || ""] || { bg: "rgba(107, 114, 128, 0.1)", border: "rgba(107, 114, 128, 0.3)", header: "#6b7280" }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStageIndex = (stageId: string) => {
    return stages.findIndex(s => s.id === stageId)
  }

  const canMoveLeft = (stageId: string) => {
    const index = getStageIndex(stageId)
    return index > 0
  }

  const canMoveRight = (stageId: string) => {
    const index = getStageIndex(stageId)
    return index < stages.length - 1
  }

  const moveToStage = (prospectId: string, direction: "left" | "right") => {
    const prospect = prospects.find(p => p.id === prospectId)
    if (!prospect?.stage_id) return

    const currentIndex = getStageIndex(prospect.stage_id)
    const newIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1

    if (newIndex >= 0 && newIndex < stages.length) {
      moveProspect(prospectId, stages[newIndex].id)
    }
  }

  if (loading || agencyLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-[600px] w-[300px] flex-shrink-0" />
          ))}
        </div>
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
            Para ver el pipeline, primero selecciona una agencia en el selector de arriba.
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
          <h1 className="text-3xl font-bold tracking-tight">Pipeline de Ventas</h1>
          <p className="text-muted-foreground">
            Arrastra los prospectos entre etapas para actualizar su estado
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
          <Button asChild>
            <Link href="/dashboard/crm/prospects/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo Prospecto
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar prospectos o asesor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedSalesRep} onValueChange={setSelectedSalesRep}>
          <SelectTrigger className="w-full md:w-[220px]">
            <SelectValue placeholder="Filtrar por asesor" />
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

      {/* Pipeline Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageProspects = getProspectsForStage(stage.id)
          const stageColors = getStageColor(stage.color)
          const totalValue = stageProspects.reduce((sum, p) => sum + (p.estimated_value || 0), 0)

          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-[300px] rounded-lg border-2"
              style={{
                backgroundColor: stageColors.bg,
                borderColor: stageColors.border,
              }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Stage Header */}
              <div 
                className="p-3 text-white rounded-t-md"
                style={{ backgroundColor: stageColors.header }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{stage.name}</h3>
                  <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                    {stageProspects.length}
                  </Badge>
                </div>
                {totalValue > 0 && (
                  <div className="text-sm opacity-90 mt-1">
                    {formatCurrency(totalValue)}
                  </div>
                )}
              </div>

              {/* Prospects List */}
              <div className="p-2 space-y-2 min-h-[500px] max-h-[600px] overflow-y-auto">
                {stageProspects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Sin prospectos</p>
                  </div>
                ) : (
                  stageProspects.map((prospect) => (
                    <Card
                      key={prospect.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, prospect.id)}
                      onDragEnd={handleDragEnd}
                      className={`cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
                        draggingProspect === prospect.id ? "opacity-50 scale-95" : ""
                      }`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarFallback className="text-xs">
                                {prospect.contact_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">
                                {prospect.contact_name}
                              </div>
                              {prospect.company_name && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {prospect.company_name}
                                </div>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/crm/prospects/${prospect.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver Detalle
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {canMoveLeft(prospect.stage_id || "") && (
                                <DropdownMenuItem onClick={() => moveToStage(prospect.id, "left")}>
                                  <ArrowLeft className="mr-2 h-4 w-4" />
                                  Mover a etapa anterior
                                </DropdownMenuItem>
                              )}
                              {canMoveRight(prospect.stage_id || "") && (
                                <DropdownMenuItem onClick={() => moveToStage(prospect.id, "right")}>
                                  <ArrowRight className="mr-2 h-4 w-4" />
                                  Mover a siguiente etapa
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Contact Info */}
                        <div className="mt-2 space-y-1">
                          {prospect.contact_email && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{prospect.contact_email}</span>
                            </div>
                          )}
                          {prospect.contact_phone && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{prospect.contact_phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Value & Date */}
                        <div className="mt-2 flex items-center justify-between text-xs">
                          {prospect.estimated_value ? (
                            <div className="flex items-center gap-1 font-medium text-green-600">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(prospect.estimated_value)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sin valor</span>
                          )}
                          {prospect.expected_close_date && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(prospect.expected_close_date).toLocaleDateString("es-MX", {
                                day: "numeric",
                                month: "short",
                              })}
                            </div>
                          )}
                        </div>

                        {/* Probability */}
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Probabilidad</span>
                            <span className="font-medium">{prospect.probability}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${prospect.probability}%` }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
