"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, ClipboardList, DollarSign } from "lucide-react"
import { useAgency } from "@/contexts/agency-context"

interface Currency {
  id: string
  code: string
  name: string
  symbol: string
}

interface Department {
  id: string
  name: string
}

export default function NewServicePage() {
  const { selectedAgencyId, selectedAgency, loading: agencyLoading } = useAgency()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [formData, setFormData] = useState({
    service_code: "",
    name: "",
    description: "",
    department_id: "",
    unit_type: "hour",
    base_price: "",
    base_price_usd: "",
    currency_id: "",
    estimated_hours: "",
    is_active: true,
  })
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && selectedAgencyId) {
      fetchData()
    }
  }, [mounted, selectedAgencyId])

  async function fetchData() {
    if (!selectedAgencyId) return
    
    const [currenciesRes, departmentsRes] = await Promise.all([
      supabase.from("currencies").select("id, code, name, symbol").eq("is_active", true).order("code"),
      supabase.from("departments").select("id, name").eq("agency_id", selectedAgencyId).eq("is_active", true).order("name"),
    ])

    if (currenciesRes.data) setCurrencies(currenciesRes.data)
    if (departmentsRes.data) setDepartments(departmentsRes.data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedAgencyId) {
      setError("Debes seleccionar una agencia primero")
      return
    }
    setError(null)
    setLoading(true)

    const { error: insertError } = await supabase.from("services").insert({
      agency_id: selectedAgencyId,
      service_code: formData.service_code || null,
      name: formData.name,
      description: formData.description || null,
      department_id: formData.department_id || null,
      unit_type: formData.unit_type,
      base_price: parseFloat(formData.base_price) || 0,
      base_price_usd: parseFloat(formData.base_price_usd) || 0,
      currency_id: formData.currency_id || null,
      estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
      is_active: formData.is_active,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push("/dashboard/services")
  }

  if (!mounted || agencyLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!selectedAgencyId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <ClipboardList className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Selecciona una Agencia</h2>
        <p className="text-muted-foreground max-w-md">
          Para crear un nuevo servicio, primero selecciona una agencia en el selector de arriba.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/services">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nuevo Servicio</h1>
          <p className="text-muted-foreground">Agrega un nuevo servicio para {selectedAgency?.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Información básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Información del Servicio
              </CardTitle>
              <CardDescription>Datos básicos del servicio</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="name">Nombre del servicio *</FieldLabel>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="service_code">Código</FieldLabel>
                    <Input
                      id="service_code"
                      value={formData.service_code}
                      onChange={(e) => setFormData({ ...formData, service_code: e.target.value })}
                      placeholder="Ej: SRV-001"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="description">Descripción</FieldLabel>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="department_id">Departamento</FieldLabel>
                  <Select
                    value={formData.department_id}
                    onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Precios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Precios y Unidades
              </CardTitle>
              <CardDescription>Configuración de precios del servicio</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="unit_type">Tipo de unidad</FieldLabel>
                  <Select
                    value={formData.unit_type}
                    onValueChange={(value) => setFormData({ ...formData, unit_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hour">Por hora</SelectItem>
                      <SelectItem value="day">Por día</SelectItem>
                      <SelectItem value="project">Por proyecto</SelectItem>
                      <SelectItem value="unit">Por unidad</SelectItem>
                      <SelectItem value="month">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="base_price">Precio en MXN (Pesos Mexicanos)</FieldLabel>
                    <Input
                      id="base_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.base_price}
                      onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                      placeholder="0.00"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="base_price_usd">Precio en USD (Dólares Americanos)</FieldLabel>
                    <Input
                      id="base_price_usd"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.base_price_usd}
                      onChange={(e) => setFormData({ ...formData, base_price_usd: e.target.value })}
                      placeholder="0.00"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="estimated_hours">Horas estimadas (promedio)</FieldLabel>
                  <Input
                    id="estimated_hours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                    placeholder="0"
                  />
                </Field>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked as boolean })
                    }
                  />
                  <label htmlFor="is_active" className="text-sm">
                    Servicio activo (disponible para cotizaciones)
                  </label>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/services">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="mr-2" />
                  Guardando...
                </>
              ) : (
                "Guardar Servicio"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
