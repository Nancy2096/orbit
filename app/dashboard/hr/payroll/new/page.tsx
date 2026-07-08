"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Save, Calendar, Wallet } from "lucide-react"
import { toast } from "sonner"

interface Agency {
  id: string
  name: string
}

const periodTypes = [
  { value: "semanal", label: "Semanal" },
  { value: "quincenal", label: "Quincenal" },
  { value: "mensual", label: "Mensual" },
]

export default function NewPayrollPeriodPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [formData, setFormData] = useState({
    agency_id: "",
    period_name: "",
    period_type: "quincenal",
    start_date: "",
    end_date: "",
    payment_date: "",
    notes: "",
  })

  useEffect(() => {
    fetchAgencies()
  }, [])

  const fetchAgencies = async () => {
    try {
      const { data, error } = await supabase
        .from("agencies")
        .select("id, name")
        .eq("is_active", true)
        .order("name")

      if (error) throw error
      setAgencies(data || [])

      // Si solo hay una agencia, seleccionarla automaticamente
      if (data && data.length === 1) {
        setFormData(prev => ({ ...prev, agency_id: data[0].id }))
      }
    } catch (error) {
      console.error("Error fetching agencies:", error)
      toast.error("Error al cargar las agencias")
    } finally {
      setLoading(false)
    }
  }

  // Generar nombre del periodo automaticamente
  useEffect(() => {
    if (formData.start_date && formData.end_date && formData.period_type) {
      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)
      const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
      
      const startMonth = monthNames[startDate.getMonth()]
      const endMonth = monthNames[endDate.getMonth()]
      const year = endDate.getFullYear()
      
      let periodName = ""
      if (formData.period_type === "mensual") {
        periodName = `${startMonth} ${year}`
      } else if (formData.period_type === "quincenal") {
        const dayStart = startDate.getDate()
        const quincena = dayStart <= 15 ? "1ra" : "2da"
        periodName = `${quincena} Quincena ${startMonth} ${year}`
      } else if (formData.period_type === "semanal") {
        const weekNum = Math.ceil(startDate.getDate() / 7)
        periodName = `Semana ${weekNum} ${startMonth} ${year}`
      }
      
      setFormData(prev => ({ ...prev, period_name: periodName }))
    }
  }, [formData.start_date, formData.end_date, formData.period_type])

  // Auto-calcular fecha de fin basado en tipo de periodo
  useEffect(() => {
    if (formData.start_date && formData.period_type) {
      const startDate = new Date(formData.start_date)
      let endDate = new Date(startDate)
      
      if (formData.period_type === "semanal") {
        endDate.setDate(startDate.getDate() + 6)
      } else if (formData.period_type === "quincenal") {
        endDate.setDate(startDate.getDate() + 14)
      } else if (formData.period_type === "mensual") {
        endDate.setMonth(startDate.getMonth() + 1)
        endDate.setDate(endDate.getDate() - 1)
      }
      
      const endDateStr = endDate.toISOString().split("T")[0]
      setFormData(prev => ({ ...prev, end_date: endDateStr }))
      
      // Sugerir fecha de pago (3 dias despues del fin del periodo)
      const paymentDate = new Date(endDate)
      paymentDate.setDate(paymentDate.getDate() + 3)
      const paymentDateStr = paymentDate.toISOString().split("T")[0]
      setFormData(prev => ({ ...prev, payment_date: paymentDateStr }))
    }
  }, [formData.start_date, formData.period_type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.agency_id) {
      toast.error("Selecciona una agencia")
      return
    }
    
    if (!formData.period_name || !formData.start_date || !formData.end_date) {
      toast.error("Completa todos los campos requeridos")
      return
    }

    setSaving(true)
    try {
      const { data, error } = await supabase
        .from("payroll_periods")
        .insert({
          // "global" => agency_id NULL (nómina de todas las agencias)
          agency_id: formData.agency_id === "global" ? null : formData.agency_id,
          period_name: formData.period_name,
          period_type: formData.period_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          payment_date: formData.payment_date || null,
          notes: formData.notes || null,
          status: "draft",
          total_gross: 0,
          total_deductions: 0,
          total_net: 0,
        })
        .select()
        .single()

      if (error) throw error

      toast.success("Periodo de nómina creado exitosamente")
      router.push(`/dashboard/hr/payroll/${data.id}`)
    } catch (error: any) {
      console.error("Error creating payroll period:", error)
      toast.error(error.message || "Error al crear el periodo de nomina")
    } finally {
      setSaving(false)
    }
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/hr/payroll">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuevo Periodo de Nomina</h1>
          <p className="text-muted-foreground">
            Crea un nuevo periodo para calcular la nomina del personal
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Formulario Principal */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Informacion del Periodo
                </CardTitle>
                <CardDescription>
                  Define las fechas y tipo de periodo de nomina
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="agency_id">Agencia *</FieldLabel>
                  <Select
                    value={formData.agency_id}
                    onValueChange={(value) => setFormData({ ...formData, agency_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una agencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global (todas las agencias)</SelectItem>
                      {agencies.map((agency) => (
                        <SelectItem key={agency.id} value={agency.id}>
                          {agency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="period_type">Tipo de Periodo *</FieldLabel>
                  <Select
                    value={formData.period_type}
                    onValueChange={(value) => setFormData({ ...formData, period_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="start_date">Fecha de Inicio *</FieldLabel>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="end_date">Fecha de Fin *</FieldLabel>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="period_name">Nombre del Periodo *</FieldLabel>
                  <Input
                    id="period_name"
                    value={formData.period_name}
                    onChange={(e) => setFormData({ ...formData, period_name: e.target.value })}
                    placeholder="Ej: 1ra Quincena Enero 2024"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Se genera automaticamente basado en las fechas seleccionadas
                  </p>
                </Field>

                <Field>
                  <FieldLabel htmlFor="payment_date">Fecha de Pago</FieldLabel>
                  <Input
                    id="payment_date"
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Fecha estimada en que se realizara el pago
                  </p>
                </Field>

                <Field>
                  <FieldLabel htmlFor="notes">Notas</FieldLabel>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notas adicionales sobre este periodo..."
                    rows={3}
                  />
                </Field>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Resumen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="font-medium">
                      {periodTypes.find(t => t.value === formData.period_type)?.label || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agencia:</span>
                    <span className="font-medium">
                      {formData.agency_id === "global"
                        ? "Global (todas las agencias)"
                        : agencies.find(a => a.id === formData.agency_id)?.name || "-"}
                    </span>
                  </div>
                  {formData.start_date && formData.end_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dias:</span>
                      <span className="font-medium">
                        {Math.ceil((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} dias
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-4">
                    Al crear el periodo, podras agregar al personal y calcular sus sueldos, deducciones y bonificaciones.
                  </p>
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Crear Periodo
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
