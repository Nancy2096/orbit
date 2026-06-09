"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { ArrowLeft, Save } from "lucide-react"

interface PayrollPeriod {
  id: string
  period_name: string
  period_type: string
  start_date: string
  end_date: string
  payment_date: string | null
  status: string
  agency_id: string
}

interface Agency {
  id: string
  name: string
}

export default function EditPayrollPeriodPage() {
  const router = useRouter()
  const params = useParams()
  const periodId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [formData, setFormData] = useState({
    period_name: "",
    period_type: "monthly",
    start_date: "",
    end_date: "",
    payment_date: "",
    agency_id: "",
  })
  
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [periodId])

  const fetchData = async () => {
    try {
      const [periodRes, agenciesRes] = await Promise.all([
        supabase
          .from("payroll_periods")
          .select("*")
          .eq("id", periodId)
          .single(),
        supabase
          .from("agencies")
          .select("id, name")
          .eq("is_active", true)
          .order("name"),
      ])

      if (periodRes.error) throw periodRes.error

      const period = periodRes.data as PayrollPeriod
      setFormData({
        period_name: period.period_name,
        period_type: period.period_type,
        start_date: period.start_date,
        end_date: period.end_date,
        payment_date: period.payment_date || "",
        agency_id: period.agency_id,
      })

      if (agenciesRes.data) setAgencies(agenciesRes.data)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Error al cargar el periodo")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from("payroll_periods")
        .update({
          period_name: formData.period_name,
          period_type: formData.period_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          payment_date: formData.payment_date || null,
          agency_id: formData.agency_id,
        })
        .eq("id", periodId)

      if (error) throw error

      toast.success("Periodo actualizado correctamente")
      router.push(`/dashboard/hr/payroll/${periodId}`)
    } catch (error) {
      console.error("Error updating period:", error)
      toast.error("Error al actualizar el periodo")
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/hr/payroll/${periodId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Periodo</h1>
          <p className="text-muted-foreground">
            Modifica los datos del periodo de nómina
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Periodo</CardTitle>
          <CardDescription>
            Actualiza los detalles del periodo de nómina
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="period_name">Nombre del Periodo *</Label>
                <Input
                  id="period_name"
                  value={formData.period_name}
                  onChange={(e) => setFormData({ ...formData, period_name: e.target.value })}
                  placeholder="Ej: Nómina Enero 2024"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agency">Agencia *</Label>
                <Select
                  value={formData.agency_id}
                  onValueChange={(value) => setFormData({ ...formData, agency_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar agencia" />
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
                <Label htmlFor="period_type">Tipo de Periodo *</Label>
                <Select
                  value={formData.period_type}
                  onValueChange={(value) => setFormData({ ...formData, period_type: value })}
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

              <div className="space-y-2">
                <Label htmlFor="payment_date">Fecha de Pago</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Fecha de Inicio *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">Fecha de Fin *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href={`/dashboard/hr/payroll/${periodId}`}>Cancelar</Link>
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Spinner className="mr-2 h-4 w-4" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar Cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
