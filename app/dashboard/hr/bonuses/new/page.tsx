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
import { ArrowLeft, Gift, Save } from "lucide-react"
import { toast } from "sonner"
import { useAgency } from "@/contexts/agency-context"

interface Staff {
  id: string
  first_name: string
  last_name: string
  email: string
  agency_id: string
}

interface BonusType {
  id: string
  name: string
  description: string | null
}

export default function NewBonusPage() {
  const router = useRouter()
  const supabase = createClient()
  const { selectedAgencyId, selectedAgency, loading: agencyLoading } = useAgency()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [staff, setStaff] = useState<Staff[]>([])
  const [bonusTypes, setBonusTypes] = useState<BonusType[]>([])

  const [formData, setFormData] = useState({
    staff_id: "",
    bonus_type_id: "",
    amount: "",
    effective_date: "",
    status: "pending",
    description: "",
    notes: "",
  })

  useEffect(() => {
    if (selectedAgencyId) {
      fetchInitialData()
    } else {
      setLoading(false)
    }
  }, [selectedAgencyId])

  const fetchInitialData = async () => {
    if (!selectedAgencyId) return
    setLoading(true)
    try {
      const [staffRes, bonusTypesRes] = await Promise.all([
        supabase
          .from("staff")
          .select("id, first_name, last_name, email, agency_id")
          .eq("agency_id", selectedAgencyId)
          .eq("is_active", true)
          .order("first_name"),
        supabase
          .from("bonus_types")
          .select("id, name, description")
          .eq("agency_id", selectedAgencyId)
          .eq("is_active", true)
          .order("name"),
      ])

      if (staffRes.data) setStaff(staffRes.data)
      if (bonusTypesRes.data) setBonusTypes(bonusTypesRes.data)
    } catch (error) {
      console.error("Error fetching initial data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedAgencyId) {
      toast.error("Selecciona una agencia")
      return
    }
    if (!formData.staff_id) {
      toast.error("Selecciona un miembro del personal")
      return
    }
    if (!formData.bonus_type_id) {
      toast.error("Selecciona un tipo de bono")
      return
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Ingresa un monto válido")
      return
    }

    setSaving(true)

    try {
      const selectedType = bonusTypes.find((t) => t.id === formData.bonus_type_id)

      const { error } = await supabase.from("bonuses").insert({
        agency_id: selectedAgencyId,
        staff_id: formData.staff_id,
        bonus_type_id: formData.bonus_type_id,
        // Se conserva bonus_type (texto) por compatibilidad con la vista existente
        bonus_type: selectedType?.name || "Otro",
        amount: parseFloat(formData.amount),
        effective_date: formData.effective_date || null,
        status: formData.status,
        description: formData.description || null,
        notes: formData.notes || null,
      })

      if (error) throw error

      toast.success("Bono registrado correctamente")
      router.push("/dashboard/hr/bonuses")
    } catch (error) {
      console.error("Error saving bonus:", error)
      toast.error("Error al guardar el bono")
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
          <Gift className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Selecciona una Agencia</h2>
        <p className="text-muted-foreground max-w-md">
          Para registrar un nuevo bono, primero selecciona una agencia en el selector de arriba.
        </p>
      </div>
    )
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount)

  const selectedType = bonusTypes.find((t) => t.id === formData.bonus_type_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/hr/bonuses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Bono</h1>
          <p className="text-muted-foreground">
            Registra un nuevo bono para el personal - {selectedAgency?.name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Información principal */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Información del Bono</CardTitle>
                  <CardDescription>Datos principales del bono a otorgar</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field>
                <FieldLabel>Miembro del Personal *</FieldLabel>
                <Select
                  value={formData.staff_id}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, staff_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un miembro" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.first_name} {s.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Tipo de Bono *</FieldLabel>
                {bonusTypes.length === 0 ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg text-sm text-amber-700 dark:text-amber-300">
                    No hay tipos de bono configurados para esta agencia. Configúralos en Agencias {">"} Catálogos {">"} Bonos.
                  </div>
                ) : (
                  <Select
                    value={formData.bonus_type_id}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, bonus_type_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de bono" />
                    </SelectTrigger>
                    <SelectContent>
                      {bonusTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {selectedType?.description && (
                  <FieldDescription>{selectedType.description}</FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel>Monto (MXN) *</FieldLabel>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </Field>

              <Field>
                <FieldLabel>Fecha efectiva</FieldLabel>
                <Input
                  type="date"
                  value={formData.effective_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, effective_date: e.target.value }))}
                />
              </Field>

              <Field>
                <FieldLabel>Descripción</FieldLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Motivo o detalle del bono..."
                  rows={3}
                />
              </Field>
            </CardContent>
          </Card>

          {/* Resumen y estado */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
              <CardDescription>Estado y detalles del bono</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field>
                <FieldLabel>Estado</FieldLabel>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="approved">Aprobado</SelectItem>
                    <SelectItem value="paid">Pagado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {formData.amount && parseFloat(formData.amount) > 0 && (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Monto del bono:</p>
                  <p className="font-semibold text-2xl text-green-600">
                    {formatCurrency(parseFloat(formData.amount))}
                  </p>
                  {selectedType && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedType.name}</p>
                  )}
                </div>
              )}

              <Field>
                <FieldLabel>Notas internas</FieldLabel>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas adicionales (opcional)..."
                  rows={3}
                />
              </Field>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/hr/bonuses">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Spinner className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Guardar Bono
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
