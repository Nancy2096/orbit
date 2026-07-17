"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAgency } from "@/contexts/agency-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { Users, ArrowUp, ArrowDown, Plus, X, Save, Clock, RefreshCw } from "lucide-react"

interface CommercialStaff {
  id: string
  first_name: string
  last_name: string
  email: string | null
  position: string | null
}

interface Member {
  staff_id: string
  enabled: boolean
  sort_order: number
}

type Method = "round_robin" | "load_balanced" | "manual"

const METHOD_OPTIONS: { value: Method; label: string; description: string }[] = [
  {
    value: "round_robin",
    label: "Por orden (round-robin)",
    description: "Los leads se reparten en secuencia según el orden definido abajo.",
  },
  {
    value: "load_balanced",
    label: "Por carga",
    description: "Cada lead se asigna al asesor con menos leads activos en ese momento.",
  },
  {
    value: "manual",
    label: "Manual",
    description: "Sin asignación automática; cada lead se asigna a mano.",
  },
]

export default function CommercialTeamPage() {
  const supabase = createClient()
  const { selectedAgencyId, loading: agencyLoading } = useAgency()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [processing, setProcessing] = useState(false)

  const [staff, setStaff] = useState<CommercialStaff[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [method, setMethod] = useState<Method>("round_robin")
  const [reassignEnabled, setReassignEnabled] = useState(false)
  const [responseTime, setResponseTime] = useState(60)

  useEffect(() => {
    if (selectedAgencyId) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgencyId])

  const fetchData = async () => {
    if (!selectedAgencyId) return
    setLoading(true)

    // Personal del departamento Comercial de la agencia (o global).
    const { data: staffData } = await supabase
      .from("staff")
      .select("id, first_name, last_name, email, position")
      .or(`agency_id.eq.${selectedAgencyId},is_global.eq.true`)
      .eq("department", "Comercial")
      .eq("is_active", true)
      .order("first_name")

    setStaff((staffData as CommercialStaff[]) ?? [])

    // Configuración de asignación de la agencia.
    const { data: settingsData } = await supabase
      .from("crm_assignment_settings")
      .select("method, reassign_enabled, response_time_minutes")
      .eq("agency_id", selectedAgencyId)
      .maybeSingle()

    if (settingsData) {
      setMethod(settingsData.method as Method)
      setReassignEnabled(settingsData.reassign_enabled)
      setResponseTime(settingsData.response_time_minutes)
    } else {
      setMethod("round_robin")
      setReassignEnabled(false)
      setResponseTime(60)
    }

    // Miembros participantes en la asignación.
    const { data: membersData } = await supabase
      .from("crm_assignment_members")
      .select("staff_id, enabled, sort_order")
      .eq("agency_id", selectedAgencyId)
      .order("sort_order", { ascending: true })

    setMembers(
      ((membersData as Member[]) ?? []).map((m) => ({
        staff_id: m.staff_id,
        enabled: m.enabled,
        sort_order: m.sort_order,
      })),
    )

    setLoading(false)
  }

  const memberStaffIds = new Set(members.map((m) => m.staff_id))
  const availableStaff = staff.filter((s) => !memberStaffIds.has(s.id))
  const staffById = (id: string) => staff.find((s) => s.id === id)

  const addMember = (staffId: string) => {
    setMembers((prev) => [
      ...prev,
      { staff_id: staffId, enabled: true, sort_order: prev.length },
    ])
  }

  const removeMember = (staffId: string) => {
    setMembers((prev) =>
      prev
        .filter((m) => m.staff_id !== staffId)
        .map((m, i) => ({ ...m, sort_order: i })),
    )
  }

  const toggleMember = (staffId: string, enabled: boolean) => {
    setMembers((prev) => prev.map((m) => (m.staff_id === staffId ? { ...m, enabled } : m)))
  }

  const move = (index: number, direction: -1 | 1) => {
    setMembers((prev) => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next.map((m, i) => ({ ...m, sort_order: i }))
    })
  }

  const handleSave = async () => {
    if (!selectedAgencyId) return
    setSaving(true)

    // Guardar configuración.
    const { error: settingsError } = await supabase.from("crm_assignment_settings").upsert(
      {
        agency_id: selectedAgencyId,
        method,
        reassign_enabled: reassignEnabled,
        response_time_minutes: responseTime,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "agency_id" },
    )

    if (settingsError) {
      setSaving(false)
      toast.error("Error al guardar la configuración")
      console.log("[v0] settings error:", settingsError.message)
      return
    }

    // Sincronizar miembros: borrar los que ya no están y upsert del resto.
    const { data: existing } = await supabase
      .from("crm_assignment_members")
      .select("staff_id")
      .eq("agency_id", selectedAgencyId)

    const keepIds = new Set(members.map((m) => m.staff_id))
    const toDelete = ((existing as { staff_id: string }[]) ?? [])
      .map((e) => e.staff_id)
      .filter((id) => !keepIds.has(id))

    if (toDelete.length > 0) {
      await supabase
        .from("crm_assignment_members")
        .delete()
        .eq("agency_id", selectedAgencyId)
        .in("staff_id", toDelete)
    }

    if (members.length > 0) {
      const { error: membersError } = await supabase.from("crm_assignment_members").upsert(
        members.map((m) => ({
          agency_id: selectedAgencyId,
          staff_id: m.staff_id,
          enabled: m.enabled,
          sort_order: m.sort_order,
        })),
        { onConflict: "agency_id,staff_id" },
      )
      if (membersError) {
        setSaving(false)
        toast.error("Error al guardar el equipo")
        console.log("[v0] members error:", membersError.message)
        return
      }
    }

    setSaving(false)
    toast.success("Configuración guardada")
  }

  const handleProcessStale = async () => {
    setProcessing(true)
    try {
      const res = await fetch("/api/crm/reassign-stale", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Reasignación completada: ${data.reassigned ?? 0} lead(s)`)
        fetchData()
      } else {
        toast.error(data.error || "Error al procesar")
      }
    } catch (e) {
      toast.error("Error al procesar")
      console.log("[v0] process stale error:", (e as Error).message)
    }
    setProcessing(false)
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
            Para configurar el equipo comercial, primero selecciona una agencia en el selector de arriba.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipo Comercial</h1>
          <p className="text-muted-foreground">
            Define quién recibe los leads y cómo se asignan automáticamente
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Spinner className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar cambios
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuración de asignación */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Método de asignación</CardTitle>
            <CardDescription>Cómo se reparten los leads nuevos entre el equipo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={method} onValueChange={(v) => setMethod(v as Method)} className="space-y-3">
              {METHOD_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-start gap-3 rounded-lg border p-3">
                  <RadioGroupItem value={opt.value} id={opt.value} className="mt-1" />
                  <Label htmlFor={opt.value} className="cursor-pointer font-normal">
                    <span className="block font-medium">{opt.label}</span>
                    <span className="block text-sm text-muted-foreground">{opt.description}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Reasignación por tiempo</p>
                  <p className="text-sm text-muted-foreground">
                    Si el asesor no atiende el lead a tiempo, se reasigna a otro.
                  </p>
                </div>
                <Switch checked={reassignEnabled} onCheckedChange={setReassignEnabled} />
              </div>

              {reassignEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="response-time" className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    Tiempo de atención (minutos)
                  </Label>
                  <Input
                    id="response-time"
                    type="number"
                    min={1}
                    value={responseTime}
                    onChange={(e) => setResponseTime(Math.max(1, Number(e.target.value) || 1))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Un lead se considera sin atender si el asesor no registra una actividad ni
                    cambia su etapa/estatus dentro de este tiempo.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 bg-transparent"
                    onClick={handleProcessStale}
                    disabled={processing}
                  >
                    {processing ? (
                      <Spinner className="mr-2 h-4 w-4" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Procesar vencidos ahora
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Equipo y orden */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Asesores en la asignación</CardTitle>
            <CardDescription>
              {method === "round_robin"
                ? "El orden define la secuencia de reparto de leads."
                : method === "load_balanced"
                  ? "Los leads se reparten por carga entre los asesores habilitados."
                  : "La asignación es manual; el equipo se usa solo como referencia."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Miembros ordenados */}
            {members.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No hay asesores en la asignación. Agrégalos desde la lista de abajo.
              </p>
            ) : (
              <ul className="space-y-2">
                {members.map((m, index) => {
                  const person = staffById(m.staff_id)
                  return (
                    <li
                      key={m.staff_id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <div className="flex flex-col">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => move(index, -1)}
                          disabled={index === 0}
                          aria-label="Subir"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => move(index, 1)}
                          disabled={index === members.length - 1}
                          aria-label="Bajar"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {index + 1}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {person ? `${person.first_name} ${person.last_name}` : "Asesor"}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {person?.position || person?.email || ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {m.enabled ? "Activo" : "Pausado"}
                        </span>
                        <Switch
                          checked={m.enabled}
                          onCheckedChange={(v) => toggleMember(m.staff_id, v)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeMember(m.staff_id)}
                        aria-label="Quitar"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  )
                })}
              </ul>
            )}

            {/* Disponibles para agregar */}
            <div className="border-t pt-4">
              <p className="mb-2 text-sm font-medium">Personal del departamento Comercial</p>
              {availableStaff.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {staff.length === 0
                    ? "No hay personal en el departamento Comercial para esta agencia."
                    : "Todo el personal comercial ya está en la asignación."}
                </p>
              ) : (
                <ul className="space-y-2">
                  {availableStaff.map((person) => (
                    <li
                      key={person.id}
                      className="flex items-center justify-between gap-3 rounded-lg border p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {person.first_name} {person.last_name}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {person.position || person.email || ""}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => addMember(person.id)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
