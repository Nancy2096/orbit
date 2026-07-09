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
import { ArrowLeft, Calculator, Save, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

export default function EditLoanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const { roleName, fullAccess, loading: permsLoading } = usePermissions()

  // Solo Super Administrador y Dirección General (o acceso total) pueden editar préstamos.
  const canEdit = fullAccess || roleName === "superadmin" || roleName === "direccion_general"

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const [formData, setFormData] = useState({
    staff_name: "",
    agency_name: "",
    loan_number: "",
    loan_type: "personal",
    description: "",
    principal_amount: 0,
    interest_rate: 0,
    number_of_payments: 12,
    payment_frequency: "monthly",
    request_date: "",
    start_date: "",
    notes: "",
  })

  // Valores calculados
  const interestAmount = (formData.principal_amount * formData.interest_rate) / 100
  const totalAmount = formData.principal_amount + interestAmount
  const paymentAmount = formData.number_of_payments > 0 ? totalAmount / formData.number_of_payments : 0

  useEffect(() => {
    const fetchLoan = async () => {
      const { data, error } = await supabase
        .from("loans")
        .select(`
          *,
          staff:staff(first_name, last_name),
          agency:agencies(name)
        `)
        .eq("id", id)
        .single()

      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const staff: any = Array.isArray(data.staff) ? data.staff[0] : data.staff
      const agency: any = Array.isArray(data.agency) ? data.agency[0] : data.agency

      setFormData({
        staff_name: staff ? `${staff.first_name} ${staff.last_name}` : "-",
        agency_name: agency?.name ?? "-",
        loan_number: data.loan_number ?? "",
        loan_type: data.loan_type ?? "personal",
        description: data.description ?? "",
        principal_amount: Number(data.principal_amount ?? 0),
        interest_rate: Number(data.interest_rate ?? 0),
        number_of_payments: Number(data.number_of_payments ?? 12),
        payment_frequency: data.payment_frequency ?? "monthly",
        request_date: data.request_date ?? "",
        start_date: data.start_date ?? "",
        notes: data.notes ?? "",
      })
      setLoading(false)
    }
    fetchLoan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.principal_amount <= 0) {
      toast.error("El monto del préstamo debe ser mayor a cero")
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase
        .from("loans")
        .update({
          loan_type: formData.loan_type,
          description: formData.description || null,
          principal_amount: formData.principal_amount,
          interest_rate: formData.interest_rate,
          total_amount: totalAmount,
          number_of_payments: formData.number_of_payments,
          payment_amount: paymentAmount,
          payment_frequency: formData.payment_frequency,
          request_date: formData.request_date || null,
          start_date: formData.start_date || null,
          notes: formData.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error
      toast.success("Préstamo actualizado")
      router.push(`/dashboard/hr/loans/${id}`)
    } catch (error: any) {
      console.error("[v0] Error updating loan:", error)
      toast.error(`Error al actualizar el préstamo: ${error?.message || "Error desconocido"}`)
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount)

  if (loading || permsLoading) {
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
              Solo el Super Administrador o Dirección General pueden editar préstamos.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href={`/dashboard/hr/loans/${id}`}>Volver al préstamo</Link>
        </Button>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h2 className="text-xl font-semibold mb-2">Préstamo no encontrado</h2>
        <Button asChild className="mt-4">
          <Link href="/dashboard/hr/loans">Volver a Préstamos</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/hr/loans/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Préstamo</h1>
          <p className="text-muted-foreground">
            {formData.staff_name}
            {formData.loan_number && ` · #${formData.loan_number}`}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información del Préstamo</CardTitle>
                <CardDescription>
                  Empleado: {formData.staff_name} · Agencia: {formData.agency_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Préstamo *</Label>
                    <Select
                      value={formData.loan_type}
                      onValueChange={(value) => setFormData({ ...formData, loan_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="emergency">Emergencia</SelectItem>
                        <SelectItem value="education">Educación</SelectItem>
                        <SelectItem value="medical">Médico</SelectItem>
                        <SelectItem value="housing">Vivienda</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Solicitud</Label>
                    <Input
                      type="date"
                      value={formData.request_date}
                      onChange={(e) => setFormData({ ...formData, request_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descripción / Motivo</Label>
                  <Textarea
                    placeholder="Describe el motivo del préstamo..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Condiciones Financieras</CardTitle>
                <CardDescription>Monto, interés y plazos del préstamo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Monto del Préstamo (Capital) *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      placeholder="0.00"
                      value={formData.principal_amount || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, principal_amount: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tasa de Interés (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      placeholder="0"
                      value={formData.interest_rate || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, interest_rate: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Número de Pagos *</Label>
                    <Input
                      type="number"
                      min="1"
                      max="120"
                      placeholder="12"
                      value={formData.number_of_payments || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, number_of_payments: parseInt(e.target.value) || 1 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Frecuencia de Pago</Label>
                    <Select
                      value={formData.payment_frequency}
                      onValueChange={(value) => setFormData({ ...formData, payment_frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="biweekly">Quincenal</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Fecha de Inicio de Pagos</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notas Adicionales</Label>
                  <Textarea
                    placeholder="Notas internas sobre el préstamo..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Resumen del Préstamo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Capital</span>
                  <span className="font-medium">{formatCurrency(formData.principal_amount)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Interés ({formData.interest_rate}%)</span>
                  <span className="font-medium">{formatCurrency(interestAmount)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground font-semibold">Total a Pagar</span>
                  <span className="font-bold text-lg">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Número de Pagos</span>
                  <span className="font-medium">{formData.number_of_payments}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Pago por Período</span>
                  <span className="font-bold text-primary">{formatCurrency(paymentAmount)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={saving} className="w-full">
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
              <Button variant="outline" asChild className="w-full">
                <Link href={`/dashboard/hr/loans/${id}`}>Cancelar</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
