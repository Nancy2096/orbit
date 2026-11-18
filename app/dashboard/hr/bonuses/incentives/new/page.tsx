"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { useAgency } from "@/contexts/agency-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Calculator, Save } from "lucide-react"
import { toast } from "sonner"
import { LoanAuthorizers } from "@/components/hr/loan-authorizers"
import { INCENTIVE_TYPE_LABELS, formatIncentiveAmount, todayInMexico } from "@/lib/incentives"

interface StaffOption {
  id: string
  first_name: string
  last_name: string
  employee_code: string | null
  agency_id: string | null
  agency_ids: string[] | null
  is_global: boolean
  currency_id: string | null
  payroll_payment_currency_id: string | null
}

async function fetchFormData() {
  const supabase = createClient()
  const [agencies, staff, currencies] = await Promise.all([
    supabase.from("agencies").select("id, name").eq("is_active", true).order("name"),
    supabase
      .from("staff")
      .select("id, first_name, last_name, employee_code, agency_id, agency_ids, is_global, currency_id, payroll_payment_currency_id")
      .eq("is_active", true)
      .order("first_name"),
    supabase.from("currencies").select("id, code"),
  ])
  return {
    agencies: (agencies.data || []) as { id: string; name: string }[],
    staff: (staff.data || []) as StaffOption[],
    currencies: (currencies.data || []) as { id: string; code: string }[],
  }
}

export default function NewIncentivePage() {
  const router = useRouter()
  const { selectedAgencyId } = useAgency()
  const { data, isLoading } = useSWR("incentive-form-data", fetchFormData)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    agency_id: "",
    staff_id: "",
    incentive_type: "performance",
    request_date: todayInMexico(),
    description: "",
    notes: "",
    amount: 0,
    pay_in_payroll_date: "",
  })

  useEffect(() => {
    if (!form.agency_id && selectedAgencyId) setForm((f) => ({ ...f, agency_id: selectedAgencyId }))
  }, [selectedAgencyId, form.agency_id])

  const staffList = useMemo(
    () =>
      (data?.staff || []).filter(
        (s) =>
          s.is_global ||
          s.agency_id === form.agency_id ||
          (Array.isArray(s.agency_ids) && s.agency_ids.includes(form.agency_id)),
      ),
    [data?.staff, form.agency_id],
  )

  const selectedStaff = staffList.find((s) => s.id === form.staff_id)
  const currencyId = selectedStaff?.payroll_payment_currency_id || selectedStaff?.currency_id || null
  const currencyCode = data?.currencies.find((c) => c.id === currencyId)?.code || "MXN"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.agency_id || !form.staff_id || form.amount <= 0) {
      toast.error("Completa los campos requeridos")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/incentives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, pay_in_payroll_date: form.pay_in_payroll_date || null }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Error desconocido")
      toast.success("Incentivo enviado para autorización de Dirección")
      router.push("/dashboard/hr/bonuses?tab=incentives")
    } catch (error) {
      toast.error(`Error al crear el incentivo: ${error instanceof Error ? error.message : "Error desconocido"}`)
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/hr/bonuses?tab=incentives">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver a incentivos</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Incentivo</h1>
          <p className="text-muted-foreground">Registra un incentivo para un empleado</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Información del Incentivo</CardTitle>
                <CardDescription>Datos básicos del incentivo</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="agency">Agencia *</Label>
                    <Select
                      value={form.agency_id}
                      onValueChange={(value) => setForm({ ...form, agency_id: value, staff_id: "" })}
                    >
                      <SelectTrigger id="agency">
                        <SelectValue placeholder="Seleccionar agencia..." />
                      </SelectTrigger>
                      <SelectContent>
                        {data.agencies.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="staff">Empleado *</Label>
                    <Select
                      value={form.staff_id}
                      onValueChange={(value) => setForm({ ...form, staff_id: value })}
                      disabled={!form.agency_id}
                    >
                      <SelectTrigger id="staff">
                        <SelectValue placeholder="Seleccionar empleado..." />
                      </SelectTrigger>
                      <SelectContent>
                        {staffList.length === 0 ? (
                          <div className="py-6 text-center text-sm text-muted-foreground">
                            No hay empleados en esta agencia
                          </div>
                        ) : (
                          staffList.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.first_name} {s.last_name}
                              {s.employee_code && ` (${s.employee_code})`}
                              {s.is_global && " - Global"}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="type">Tipo de Incentivo *</Label>
                    <Select value={form.incentive_type} onValueChange={(value) => setForm({ ...form, incentive_type: value })}>
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(INCENTIVE_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="request-date">Fecha de Solicitud</Label>
                    <Input
                      id="request-date"
                      type="date"
                      value={form.request_date}
                      onChange={(e) => setForm({ ...form, request_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Descripción / Motivo</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe el motivo del incentivo..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Condiciones Financieras</CardTitle>
                <CardDescription>Monto en la moneda de pago del empleado ({currencyCode})</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="amount">Monto total del incentivo ({currencyCode}) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={form.amount || ""}
                      onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="pay-date">Pagar en la nómina de</Label>
                    <Input
                      id="pay-date"
                      type="date"
                      value={form.pay_in_payroll_date}
                      onChange={(e) => setForm({ ...form, pay_in_payroll_date: e.target.value })}
                      aria-describedby="pay-date-hint"
                    />
                    <p id="pay-date-hint" className="text-xs text-muted-foreground">
                      Si lo dejas vacío, se usa la fecha de aprobación.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="notes">Notas Adicionales</Label>
                  <Textarea
                    id="notes"
                    placeholder="Notas internas sobre el incentivo..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Resumen del Incentivo
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col">
                <div className="flex justify-between border-b py-2">
                  <span className="text-muted-foreground">Moneda de pago</span>
                  <span className="font-medium">{currencyCode}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-semibold text-muted-foreground">Total</span>
                  <span className="text-lg font-bold">{formatIncentiveAmount(form.amount, currencyCode)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Autorización</CardTitle>
                <CardDescription>El incentivo se enviará como pendiente y deberá ser autorizado por:</CardDescription>
              </CardHeader>
              <CardContent>
                <LoanAuthorizers />
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Solicitar autorización
                  </>
                )}
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard/hr/bonuses?tab=incentives">Cancelar</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
