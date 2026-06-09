"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
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
import { ArrowLeft, Calculator, Save } from "lucide-react"
import { toast } from "sonner"

interface Agency {
  id: string
  name: string
}

interface Staff {
  id: string
  first_name: string
  last_name: string
  employee_code: string | null
  agency_id: string | null
  agency_ids: string[] | null
  is_global: boolean
}

export default function NewLoanPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    agency_id: "",
    staff_id: "",
    loan_type: "personal",
    description: "",
    principal_amount: 0,
    interest_rate: 0,
    number_of_payments: 12,
    payment_frequency: "monthly",
    request_date: new Date().toISOString().split("T")[0],
    start_date: "",
    notes: "",
  })

  // Calculated values
  const interestAmount = (formData.principal_amount * formData.interest_rate) / 100
  const totalAmount = formData.principal_amount + interestAmount
  const paymentAmount = formData.number_of_payments > 0 ? totalAmount / formData.number_of_payments : 0

  useEffect(() => {
    fetchAgencies()
  }, [])

  useEffect(() => {
    if (formData.agency_id) {
      fetchStaffByAgency(formData.agency_id)
    } else {
      setStaffList([])
    }
  }, [formData.agency_id])

  const fetchAgencies = async () => {
    const { data } = await supabase
      .from("agencies")
      .select("id, name")
      .eq("is_active", true)
      .order("name")
    
    if (data) setAgencies(data)
    setLoading(false)
  }

  const fetchStaffByAgency = async (agencyId: string) => {
    // Fetch staff that belong to this agency (via agency_id, agency_ids array, or is_global)
    const { data } = await supabase
      .from("staff")
      .select("id, first_name, last_name, employee_code, agency_id, agency_ids, is_global")
      .eq("is_active", true)
      .order("first_name")
    
    if (data) {
      // Filter staff that have access to this agency
      const filteredStaff = data.filter(staff => {
        if (staff.is_global) return true
        if (staff.agency_id === agencyId) return true
        if (staff.agency_ids && Array.isArray(staff.agency_ids) && staff.agency_ids.includes(agencyId)) return true
        return false
      })
      setStaffList(filteredStaff)
    }
  }

  const generateLoanNumber = async () => {
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from("loans")
      .select("*", { count: "exact", head: true })
      .gte("created_at", `${year}-01-01`)
    
    const sequence = ((count || 0) + 1).toString().padStart(4, "0")
    return `PR-${year}-${sequence}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.agency_id || !formData.staff_id || formData.principal_amount <= 0) {
      toast.error("Completa los campos requeridos")
      return
    }

    setSaving(true)

    try {
      const loanNumber = await generateLoanNumber()

      const { error } = await supabase.from("loans").insert({
        agency_id: formData.agency_id,
        staff_id: formData.staff_id,
        loan_number: loanNumber,
        loan_type: formData.loan_type,
        description: formData.description || null,
        principal_amount: formData.principal_amount,
        interest_rate: formData.interest_rate,
        total_amount: totalAmount,
        number_of_payments: formData.number_of_payments,
        payment_amount: paymentAmount,
        payment_frequency: formData.payment_frequency,
        payments_made: 0,
        amount_paid: 0,
        remaining_balance: totalAmount,
        status: "pending",
        request_date: formData.request_date || null,
        start_date: formData.start_date || null,
        notes: formData.notes || null,
      })

      if (error) throw error

      toast.success("Préstamo creado exitosamente")
      router.push("/dashboard/hr/loans")
    } catch (error) {
      console.error("Error creating loan:", error)
      toast.error("Error al crear el préstamo")
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/hr/loans">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Préstamo</h1>
          <p className="text-muted-foreground">
            Registra un nuevo préstamo para un empleado
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información del Préstamo</CardTitle>
                <CardDescription>Datos básicos del préstamo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Agencia *</Label>
                    <Select
                      value={formData.agency_id}
                      onValueChange={(value) => setFormData({ ...formData, agency_id: value, staff_id: "" })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar agencia..." />
                      </SelectTrigger>
                      <SelectContent>
                        {agencies.map((agency) => (
                          <SelectItem key={agency.id} value={agency.id}>
                            {agency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Empleado *</Label>
                    <Select
                      value={formData.staff_id}
                      onValueChange={(value) => setFormData({ ...formData, staff_id: value })}
                      disabled={!formData.agency_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar empleado..." />
                      </SelectTrigger>
                      <SelectContent>
                        {staffList.length === 0 ? (
                          <div className="py-6 text-center text-sm text-muted-foreground">
                            No hay empleados en esta agencia
                          </div>
                        ) : (
                          staffList.map((staff) => (
                            <SelectItem key={staff.id} value={staff.id}>
                              {staff.first_name} {staff.last_name}
                              {staff.employee_code && ` (${staff.employee_code})`}
                              {staff.is_global && " - Global"}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

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
                <CardDescription>Define el monto, interés y plazos del préstamo</CardDescription>
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
                      onChange={(e) => setFormData({ ...formData, principal_amount: parseFloat(e.target.value) || 0 })}
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
                      onChange={(e) => setFormData({ ...formData, interest_rate: parseFloat(e.target.value) || 0 })}
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
                      onChange={(e) => setFormData({ ...formData, number_of_payments: parseInt(e.target.value) || 1 })}
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

          {/* Summary Sidebar */}
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
                    Crear Préstamo
                  </>
                )}
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard/hr/loans">Cancelar</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
