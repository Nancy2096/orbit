"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, BadgePercent, Save, UserCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useAgency } from "@/contexts/agency-context"

interface CommissionType {
  id: string
  name: string
  amount: number
}

interface Staff {
  id: string
  first_name: string
  last_name: string
  email: string
  agency_id: string
}

interface Prospect {
  id: string
  contact_name: string
  company_name: string | null
  client_type_id: string | null
  client_type: {
    id: string
    name: string
    amount: number
  } | null
}

interface Manager {
  id: string
  first_name: string
  last_name: string
  agency_id: string | null
  position: {
    name: string
  } | null
}



export default function NewCommissionPage() {
  const router = useRouter()
  const supabase = createClient()
  const { selectedAgencyId, selectedAgency, loading: agencyLoading } = useAgency()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [commissionTypes, setCommissionTypes] = useState<CommissionType[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [managers, setManagers] = useState<Manager[]>([])
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [currentUserStaff, setCurrentUserStaff] = useState<Staff | null>(null)
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  
  const [formData, setFormData] = useState({
    staff_id: "",
    approved_by: "", // Gerente/Director que aprueba
    prospect_id: "",
    commission_type_id: "", // Reference to agency_commission_types (tipo de cliente)
    commission_amount: "",
    description: "",
    notes: "",
  })

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (selectedAgencyId) {
      fetchInitialData()
    } else {
      setLoading(false)
    }
  }, [selectedAgencyId, currentUserStaff])

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: staffData } = await supabase
      .from("staff")
      .select("id, first_name, last_name, email, agency_id, reports_to_id")
      .eq("user_id", user.id)
      .single()

    if (staffData) {
      setCurrentUserStaff(staffData as Staff)
      setFormData(prev => ({ ...prev, staff_id: staffData.id }))
    }
  }

const fetchInitialData = async () => {
    if (!selectedAgencyId) return
    setLoading(true)
    try {
      // Primero obtener el departamento comercial de esta agencia
      const { data: commercialDept } = await supabase
        .from("departments")
        .select("id")
        .eq("agency_id", selectedAgencyId)
        .ilike("name", "%comercial%")
        .single()

      const commercialDeptId = commercialDept?.id

      // Consultas paralelas
      const [commercialStaffRes, approversRes, prospectsRes, commissionTypesRes] = await Promise.all([
        // Asesor comercial: solo personal del departamento comercial de esta agencia
        commercialDeptId 
          ? supabase
              .from("staff")
              .select("id, first_name, last_name, email, agency_id")
              .eq("agency_id", selectedAgencyId)
              .eq("department_id", commercialDeptId)
              .eq("is_active", true)
              .order("first_name")
          : supabase
              .from("staff")
              .select("id, first_name, last_name, email, agency_id")
              .eq("agency_id", selectedAgencyId)
              .eq("is_active", true)
              .order("first_name"),
        
        // Aprobadores: personal comercial o directores (globales o de la agencia)
        supabase
          .from("staff")
          .select(`
            id, 
            first_name, 
            last_name, 
            agency_id,
            position:positions(name),
            department:departments(name)
          `)
          .or(`agency_id.eq.${selectedAgencyId},agency_id.is.null`)
          .eq("is_active", true)
          .order("first_name"),
        
        // Prospectos con su tipo de cliente (client_types, no agency_commission_types)
        // Solo los prospectos asignados al usuario actual
        (currentUserStaff
          ? supabase
              .from("crm_prospects")
              .select("id, contact_name, company_name, client_type_id")
              .eq("agency_id", selectedAgencyId)
              .eq("assigned_to", currentUserStaff.id)
          : supabase
              .from("crm_prospects")
              .select("id, contact_name, company_name, client_type_id")
              .eq("agency_id", selectedAgencyId)
        ).order("contact_name"),
        
        // Tipos de comisión configurados por agencia (de donde viene la comisión)
        supabase
          .from("agency_commission_types")
          .select("id, name, amount")
          .eq("agency_id", selectedAgencyId)
          .eq("is_active", true)
          .order("display_order"),
      ])

      if (commercialStaffRes.data) setStaff(commercialStaffRes.data)
      
      // Mapear los tipos de cliente a los prospectos
      if (prospectsRes.data && commissionTypesRes.data) {
        const clientTypesMap = new Map(commissionTypesRes.data.map(ct => [ct.id, ct]))
        const enrichedProspects = prospectsRes.data.map(p => ({
          ...p,
          client_type: p.client_type_id ? clientTypesMap.get(p.client_type_id) || null : null
        }))
        setProspects(enrichedProspects as Prospect[])
        setCommissionTypes(commissionTypesRes.data)
      } else {
        if (prospectsRes.data) setProspects(prospectsRes.data as Prospect[])
        if (commissionTypesRes.data) setCommissionTypes(commissionTypesRes.data)
      }

      // Filtrar aprobadores: solo gerentes o directores (jefes de los asesores)
      if (approversRes.data) {
        const filteredApprovers = approversRes.data.filter((s: any) => {
          const positionName = s.position?.name?.toLowerCase() || ""
          
          // Solo gerentes o directores
          const isDirectorOrManager = positionName.includes("director") || 
                                       positionName.includes("gerente") ||
                                       positionName.includes("manager") ||
                                       positionName.includes("jefe") ||
                                       positionName.includes("supervisor") ||
                                       positionName.includes("ceo") ||
                                       positionName.includes("coo") ||
                                       positionName.includes("cfo")
          
          return isDirectorOrManager
        })
        
        setManagers(filteredApprovers.map((s: any) => ({
          id: s.id,
          first_name: s.first_name,
          last_name: s.last_name,
          position: s.position,
          agency_id: s.agency_id
        })))
      }
    } catch (error) {
      console.error("Error fetching initial data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleProspectChange = (prospectId: string) => {
    const prospect = prospects.find(p => p.id === prospectId)
    setSelectedProspect(prospect || null)
    
    // Si el prospecto tiene un tipo de cliente, pre-llenar el monto de comision
    if (prospect?.client_type) {
      setFormData(prev => ({ 
        ...prev, 
        prospect_id: prospectId,
        commission_type_id: prospect.client_type!.id,
        commission_amount: prospect.client_type!.amount.toString()
      }))
    } else {
      setFormData(prev => ({ 
        ...prev, 
        prospect_id: prospectId,
        commission_type_id: "",
        commission_amount: ""
      }))
    }
  }

  const handleCommissionTypeChange = (commissionTypeId: string) => {
    const ct = commissionTypes.find(c => c.id === commissionTypeId)
    
    setFormData(prev => ({ 
      ...prev, 
      commission_type_id: commissionTypeId,
      commission_amount: ct?.amount?.toString() || "",
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedAgencyId) {
      toast.error("Selecciona una agencia")
      return
    }
    if (!formData.staff_id) {
      toast.error("Selecciona un asesor comercial")
      return
    }
    if (!formData.prospect_id) {
      toast.error("Selecciona un prospecto")
      return
    }
    if (!formData.commission_amount) {
      toast.error("No hay monto de comision definido")
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase.from("commissions").insert({
        agency_id: selectedAgencyId,
        staff_id: formData.staff_id,
        approved_by: formData.approved_by || null,
        commission_type: "sale", // Tipo de comisión válido
        commission_type_id: formData.commission_type_id || null,
        prospect_id: formData.prospect_id,
        base_amount: parseFloat(formData.commission_amount), // El monto base es el monto de comision
        commission_amount: parseFloat(formData.commission_amount),
        status: "pending",
        description: formData.description || null,
        notes: formData.notes || null,
      })

      if (error) throw error

      toast.success("Comision registrada correctamente")
      router.push("/dashboard/hr/commissions")
    } catch (error) {
      console.error("Error saving commission:", error)
      toast.error("Error al guardar la comision")
    } finally {
      setSaving(false)
    }
  }

  if (loading || agencyLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!selectedAgencyId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <BadgePercent className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Selecciona una Agencia</h2>
        <p className="text-muted-foreground max-w-md">
          Para crear una nueva comision, primero selecciona una agencia en el selector de arriba.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/hr/commissions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva Comision</h1>
          <p className="text-muted-foreground">
            Registra una nueva comision por cita o por cliente - {selectedAgency?.name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Información Principal */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BadgePercent className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Información de la Comisión</CardTitle>
                  <CardDescription>Datos principales de la comisión</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
<Field>
                <FieldLabel>Asesor Comercial *</FieldLabel>
                {currentUserStaff ? (
                  <div className="flex items-center gap-2 h-10 px-3 py-2 rounded-md border bg-muted">
                    <UserCheck className="h-4 w-4 text-primary" />
                    <span className="font-medium">{currentUserStaff.first_name} {currentUserStaff.last_name}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">Usuario actual</Badge>
                  </div>
                ) : (
                  <Select
                    value={formData.staff_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, staff_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un asesor comercial" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.first_name} {s.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Field>

              <Field>
                <FieldLabel>Aprobado por</FieldLabel>
                <Select 
                  value={formData.approved_by} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, approved_by: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona quien aprueba" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No hay gerentes/directores configurados
                      </div>
                    ) : (
                      managers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.first_name} {m.last_name} {m.position?.name ? `(${m.position.name})` : ""} {m.agency_id === null ? "(Global)" : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Gerente o Director que revisara y aprobara esta comision
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel>Prospecto *</FieldLabel>
                <Select 
                  value={formData.prospect_id} 
                  onValueChange={handleProspectChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un prospecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {prospects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.contact_name} {p.company_name ? `- ${p.company_name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {/* Mostrar tipo de cliente del prospecto */}
              {selectedProspect && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <h4 className="font-medium text-sm">Informacion del Prospecto</h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tipo de Cliente (del prospecto):</span>
                      <p className="font-medium">
                        {selectedProspect.client_type?.name || "No asignado"}
                      </p>
                    </div>
                    
                    {selectedProspect.client_type && (
                      <div>
                        <span className="text-muted-foreground">Monto de Comision Configurado:</span>
                        <p className="font-medium text-green-600">
                          ${selectedProspect.client_type.amount.toLocaleString("es-MX")} MXN
                        </p>
                      </div>
                    )}
                  </div>

                  {!selectedProspect.client_type && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg text-sm text-amber-700 dark:text-amber-300">
                      Este prospecto no tiene un tipo de cliente asignado. Puedes asignarlo manualmente abajo o editarlo en el CRM.
                    </div>
                  )}
                </div>
              )}

              {/* Selector manual de tipo de cliente si el prospecto no tiene uno */}
              {selectedProspect && !selectedProspect.client_type && (
                <Field>
                  <FieldLabel>Tipo de Cliente (Manual) *</FieldLabel>
                  {commissionTypes.length === 0 ? (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg text-sm text-amber-700 dark:text-amber-300">
                      No hay tipos de comision configurados para esta agencia. Configuralos en Agencias {">"} Comisiones.
                    </div>
                  ) : (
                    <Select 
                      value={formData.commission_type_id} 
                      onValueChange={handleCommissionTypeChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {commissionTypes.map((ct) => (
                          <SelectItem key={ct.id} value={ct.id}>
                            {ct.name} - ${ct.amount.toLocaleString("es-MX")} MXN
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </Field>
              )}

              <Field>
                <FieldLabel>Descripcion</FieldLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción de la comisión..."
                  rows={3}
                />
              </Field>
            </CardContent>
          </Card>

          {/* Resumen y Estado */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Comision</CardTitle>
              <CardDescription>El monto se calcula automaticamente segun el tipo de cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.commission_type_id && (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Tipo de Cliente:</p>
                  <p className="font-semibold text-lg">
                    {commissionTypes.find(ct => ct.id === formData.commission_type_id)?.name || ""}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">Monto de Comision:</p>
                  <p className="font-bold text-2xl text-green-600">
                    ${Number(formData.commission_amount || 0).toLocaleString("es-MX")} MXN
                  </p>
                </div>
              )}

              {!formData.commission_type_id && (
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    Selecciona un prospecto para ver el monto de comision
                  </p>
                </div>
              )}

              <Field>
                <FieldLabel>Notas internas</FieldLabel>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas adicionales..."
                  rows={3}
                />
              </Field>

              {formData.approved_by && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    La comision se enviara a <strong>{managers.find(m => m.id === formData.approved_by)?.first_name} {managers.find(m => m.id === formData.approved_by)?.last_name}</strong> para su revision y aprobacion.
                  </p>
                </div>
              )}

              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  La comision se creara con estado "Pendiente" y requerira aprobacion antes de ser pagada.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/hr/commissions">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Comisión
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
