"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAgency } from "@/contexts/agency-context"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { 
  Users, 
  ArrowRight, 
  RefreshCw, 
  UserCheck,
  AlertTriangle,
  CheckCircle2
} from "lucide-react"

interface SalesRep {
  id: string
  first_name: string
  last_name: string
  email: string
  prospect_count?: number
}

interface Prospect {
  id: string
  contact_name: string
  company_name: string | null
  stage: { name: string; color: string } | null
  estimated_value: number | null
  assigned_to: string | null
}

export default function ReassignProspectsPage() {
  const { selectedAgencyId, selectedAgency, loading: agencyLoading } = useAgency()
  const [loading, setLoading] = useState(true)
  const [salesReps, setSalesReps] = useState<SalesRep[]>([])
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [fromSalesRep, setFromSalesRep] = useState<string>("")
  const [toSalesRep, setToSalesRep] = useState<string>("")
  const [selectedProspects, setSelectedProspects] = useState<string[]>([])
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [reassigning, setReassigning] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (selectedAgencyId) {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [selectedAgencyId])

  useEffect(() => {
    if (fromSalesRep && selectedAgencyId) {
      fetchProspects()
    } else {
      setProspects([])
      setSelectedProspects([])
    }
  }, [fromSalesRep, selectedAgencyId])

  const fetchData = async () => {
    if (!selectedAgencyId) return
    setLoading(true)

    // Fetch sales reps with prospect count
    const { data: staffData } = await supabase
      .from("staff")
      .select("id, first_name, last_name, email")
      .or(`agency_id.eq.${selectedAgencyId},is_global.eq.true`)
      .eq("is_active", true)
      .order("first_name")

    if (staffData) {
      // Count prospects per sales rep
      const repsWithCounts = await Promise.all(
        staffData.map(async (rep) => {
          const { count } = await supabase
            .from("crm_prospects")
            .select("*", { count: "exact", head: true })
            .eq("agency_id", selectedAgencyId)
            .eq("assigned_to", rep.id)
            .eq("status", "active")

          return {
            ...rep,
            prospect_count: count || 0,
          }
        })
      )
      setSalesReps(repsWithCounts)
    }

    setLoading(false)
  }

  const fetchProspects = async () => {
    if (!selectedAgencyId || !fromSalesRep) return

    const query = supabase
      .from("crm_prospects")
      .select(`
        id, contact_name, company_name, estimated_value, assigned_to,
        stage:crm_pipeline_stages(name, color)
      `)
      .eq("agency_id", selectedAgencyId)
      .eq("status", "active")
      .order("contact_name")

    if (fromSalesRep === "unassigned") {
      query.is("assigned_to", null)
    } else {
      query.eq("assigned_to", fromSalesRep)
    }

    const { data } = await query

    if (data) {
      setProspects(data as Prospect[])
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProspects(prospects.map((p) => p.id))
    } else {
      setSelectedProspects([])
    }
  }

  const handleSelectProspect = (prospectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProspects([...selectedProspects, prospectId])
    } else {
      setSelectedProspects(selectedProspects.filter((id) => id !== prospectId))
    }
  }

  const handleReassign = async () => {
    if (!toSalesRep || selectedProspects.length === 0) return

    setReassigning(true)

    const { error } = await supabase
      .from("crm_prospects")
      .update({ 
        assigned_to: toSalesRep === "unassigned" ? null : toSalesRep,
        updated_at: new Date().toISOString()
      })
      .in("id", selectedProspects)

    if (error) {
      toast.error("Error al reasignar prospectos")
      console.error(error)
    } else {
      const toRepName = toSalesRep === "unassigned" 
        ? "Sin asignar"
        : salesReps.find(r => r.id === toSalesRep)?.first_name + " " + salesReps.find(r => r.id === toSalesRep)?.last_name

      toast.success(`${selectedProspects.length} prospecto(s) reasignado(s) a ${toRepName}`)
      
      // Refresh data
      setSelectedProspects([])
      setShowConfirmDialog(false)
      fetchProspects()
      fetchData()
    }

    setReassigning(false)
  }

  const getStageColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-100 text-blue-800",
      cyan: "bg-cyan-100 text-cyan-800",
      yellow: "bg-yellow-100 text-yellow-800",
      orange: "bg-orange-100 text-orange-800",
      purple: "bg-purple-100 text-purple-800",
      green: "bg-green-100 text-green-800",
      red: "bg-red-100 text-red-800",
    }
    return colors[color] || "bg-gray-100 text-gray-800"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading || agencyLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!selectedAgencyId) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Selecciona una Agencia</h2>
          <p className="text-muted-foreground max-w-md">
            Para reasignar prospectos, primero selecciona una agencia en el selector de arriba.
          </p>
        </div>
      </div>
    )
  }

  const fromRep = fromSalesRep === "unassigned" 
    ? { first_name: "Sin", last_name: "Asignar", prospect_count: prospects.length }
    : salesReps.find((r) => r.id === fromSalesRep)
  
  const toRep = toSalesRep === "unassigned"
    ? { first_name: "Sin", last_name: "Asignar" }
    : salesReps.find((r) => r.id === toSalesRep)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reasignar Prospectos</h1>
          <p className="text-muted-foreground">
            Transfiere prospectos de un asesor a otro
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Sales Rep Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribucion de Prospectos por Asesor</CardTitle>
          <CardDescription>Selecciona el asesor de origen y destino</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* From Sales Rep */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Desde (Asesor Actual)</label>
              <Select value={fromSalesRep} onValueChange={(v) => { setFromSalesRep(v); setSelectedProspects([]) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona asesor de origen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    <div className="flex items-center justify-between w-full">
                      <span>Sin Asignar</span>
                    </div>
                  </SelectItem>
                  {salesReps.map((rep) => (
                    <SelectItem key={rep.id} value={rep.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{rep.first_name} {rep.last_name}</span>
                        <Badge variant="secondary" className="ml-2">{rep.prospect_count}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center">
              <div className="hidden md:flex items-center gap-2 text-muted-foreground">
                <ArrowRight className="h-6 w-6" />
              </div>
            </div>

            {/* To Sales Rep */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Hacia (Nuevo Asesor)</label>
              <Select value={toSalesRep} onValueChange={setToSalesRep} disabled={!fromSalesRep}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona asesor destino" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Sin Asignar</SelectItem>
                  {salesReps
                    .filter((rep) => rep.id !== fromSalesRep)
                    .map((rep) => (
                      <SelectItem key={rep.id} value={rep.id}>
                        {rep.first_name} {rep.last_name}
                        <Badge variant="secondary" className="ml-2">{rep.prospect_count}</Badge>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prospects List */}
      {fromSalesRep && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  Prospectos de {fromRep?.first_name} {fromRep?.last_name}
                </CardTitle>
                <CardDescription>
                  {prospects.length} prospecto(s) | {selectedProspects.length} seleccionado(s)
                </CardDescription>
              </div>
              {selectedProspects.length > 0 && toSalesRep && (
                <Button onClick={() => setShowConfirmDialog(true)}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Reasignar {selectedProspects.length} prospecto(s)
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {prospects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Users className="h-8 w-8 mb-2 opacity-50" />
                <p>Este asesor no tiene prospectos asignados</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedProspects.length === prospects.length}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      />
                    </TableHead>
                    <TableHead>Prospecto</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead className="text-right">Valor Est.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prospects.map((prospect) => (
                    <TableRow key={prospect.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProspects.includes(prospect.id)}
                          onCheckedChange={(checked) => handleSelectProspect(prospect.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {prospect.contact_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{prospect.contact_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{prospect.company_name || "-"}</TableCell>
                      <TableCell>
                        {prospect.stage ? (
                          <Badge variant="outline" className={getStageColor(prospect.stage.color)}>
                            {prospect.stage.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {prospect.estimated_value ? formatCurrency(prospect.estimated_value) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar Reasignacion
            </DialogTitle>
            <DialogDescription>
              Esta accion reasignara los prospectos seleccionados a otro asesor.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center justify-center gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <Avatar className="h-12 w-12 mx-auto mb-2">
                  <AvatarFallback>
                    {fromRep?.first_name?.[0]}{fromRep?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <p className="font-medium">{fromRep?.first_name} {fromRep?.last_name}</p>
                <p className="text-sm text-muted-foreground">Origen</p>
              </div>
              
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
              
              <div className="text-center">
                <Avatar className="h-12 w-12 mx-auto mb-2">
                  <AvatarFallback>
                    {toRep?.first_name?.[0]}{toRep?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <p className="font-medium">{toRep?.first_name} {toRep?.last_name}</p>
                <p className="text-sm text-muted-foreground">Destino</p>
              </div>
            </div>
            
            <p className="text-center mt-4">
              <strong>{selectedProspects.length}</strong> prospecto(s) seran reasignados
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={reassigning}>
              Cancelar
            </Button>
            <Button onClick={handleReassign} disabled={reassigning}>
              {reassigning ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Reasignando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirmar Reasignacion
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
