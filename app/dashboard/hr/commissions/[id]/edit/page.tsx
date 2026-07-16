"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { usePermissions } from "@/components/dashboard/permissions-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, BadgePercent, Save, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

interface CommissionType {
  id: string
  name: string
  amount: number
}

export default function EditCommissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const { roleName, fullAccess, loading: permsLoading } = usePermissions()

  // Solo Super Administrador y Dirección General (o acceso total) pueden editar comisiones.
  const canEdit = fullAccess || roleName === "superadmin" || roleName === "direccion_general"

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [commissionTypes, setCommissionTypes] = useState<CommissionType[]>([])
  const [staffName, setStaffName] = useState("-")

  const [formData, setFormData] = useState({
    commission_type_id: "",
    commission_amount: "",
    description: "",
    notes: "",
  })

  useEffect(() => {
    // No cargar datos si el usuario no tiene permiso.
    if (permsLoading) return
    if (!canEdit) {
      setLoading(false)
      return
    }

    const fetchCommission = async () => {
      const { data, error } = await supabase
        .from("commissions")
        .select(
          "id, agency_id, commission_type_id, commission_amount, base_amount, description, notes, staff:staff(first_name, last_name)",
        )
        .eq("id", id)
        .single()

      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const staff: any = Array.isArray(data.staff) ? data.staff[0] : data.staff
      setStaffName(staff ? `${staff.first_name} ${staff.last_name}` : "-")

      setFormData({
        commission_type_id: data.commission_type_id ?? "",
        commission_amount: data.commission_amount != null ? String(data.commission_amount) : "",
        description: data.description ?? "",
        notes: data.notes ?? "",
      })

      // Cargar los tipos de cliente (tarifas) de la agencia de la comisión.
      if (data.agency_id) {
        const { data: typesData } = await supabase
          .from("agency_commission_types")
          .select("id, name, amount")
          .eq("agency_id", data.agency_id)
          .eq("is_active", true)
          .order("display_order")
        if (typesData) setCommissionTypes(typesData as CommissionType[])
      }

      setLoading(false)
    }
    fetchCommission()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, permsLoading, canEdit])

  // Al cambiar el tipo de cliente, se actualiza el monto con su tarifa.
  const handleTypeChange = (typeId: string) => {
    const type = commissionTypes.find((t) => t.id === typeId)
    setFormData((prev) => ({
      ...prev,
      commission_type_id: typeId,
      commission_amount: type ? String(type.amount) : prev.commission_amount,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number.parseFloat(formData.commission_amount)
    if (!formData.commission_amount || Number.isNaN(amount) || amount <= 0) {
      toast.error("El monto de la comisión debe ser mayor a cero")
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase
        .from("commissions")
        .update({
          commission_type_id: formData.commission_type_id || null,
          base_amount: amount,
          commission_amount: amount,
          description: formData.description || null,
          notes: formData.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error
      toast.success("Comisión actualizada")
      router.push("/dashboard/hr/commissions")
    } catch (error: any) {
      console.error("[v0] Error updating commission:", error)
      toast.error(`Error al actualizar la comisión: ${error?.message || "Error desconocido"}`)
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount)

  if (permsLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <ShieldAlert className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Sin permiso para editar</h2>
        <p className="text-muted-foreground max-w-md">
          Solo el Super Administrador o Dirección General pueden editar comisiones.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/dashboard/hr/commissions">Volver a Comisiones</Link>
        </Button>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h2 className="text-xl font-semibold mb-2">Comisión no encontrada</h2>
        <Button asChild className="mt-4">
          <Link href="/dashboard/hr/commissions">Volver a Comisiones</Link>
        </Button>
      </div>
    )
  }

  const selectedType = commissionTypes.find((t) => t.id === formData.commission_type_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/hr/commissions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Comisión</h1>
          <p className="text-muted-foreground">{staffName}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BadgePercent className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Información de la Comisión</CardTitle>
                  <CardDescription>Ajusta el tipo de cliente y el monto</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Cliente</Label>
                <Select value={formData.commission_type_id} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo de cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {commissionTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} · {formatCurrency(Number(type.amount))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  El tipo de cliente define la tarifa de la comisión.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Monto de la Comisión *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.commission_amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, commission_amount: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción de la comisión..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Notas internas</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas adicionales..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
              <CardDescription>Valores que se guardarán</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Tipo de Cliente:</p>
                <p className="font-semibold text-lg">{selectedType?.name || "Sin asignar"}</p>
                <p className="text-sm text-muted-foreground mt-2">Monto de Comisión:</p>
                <p className="font-bold text-2xl text-green-600">
                  {formatCurrency(Number(formData.commission_amount || 0))}
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
                Guardar cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
