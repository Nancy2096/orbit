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
import { ArrowLeft, GraduationCap, Save, User, Clock, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { useAgency } from "@/contexts/agency-context"
import { getCurrentUserInfo, type CurrentUserInfo, BONUS_STAGES } from "@/lib/bonus-workflow"

interface Staff {
  id: string
  first_name: string
  last_name: string
  email: string
  agency_id: string
  monthly_salary: number | null
}

export default function NewBonusPage() {
  const router = useRouter()
  const supabase = createClient()
  const { selectedAgencyId, selectedAgency, loading: agencyLoading } = useAgency()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [staff, setStaff] = useState<Staff[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUserInfo | null>(null)

  const [formData, setFormData] = useState({
    staff_id: "",
    course_name: "",
    course_hours: "",
    agency_impact: "",
    description: "",
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
      const [staffRes, userInfo] = await Promise.all([
        supabase
          .from("staff")
          .select("id, first_name, last_name, email, agency_id, monthly_salary, user_id")
          .eq("agency_id", selectedAgencyId)
          .eq("is_active", true)
          .order("first_name"),
        getCurrentUserInfo(),
      ])

      const staffList = staffRes.data || []
      setStaff(staffList)
      setCurrentUser(userInfo)

      // Por defecto, el solicitante es el usuario logueado (si tiene registro de
      // staff en esta agencia).
      if (userInfo?.staffId && staffList.some((s: any) => s.id === userInfo.staffId)) {
        setFormData((prev) => ({ ...prev, staff_id: userInfo.staffId as string }))
      } else if (userInfo?.userId) {
        const match = staffList.find((s: any) => s.user_id === userInfo.userId)
        if (match) setFormData((prev) => ({ ...prev, staff_id: match.id }))
      }
    } catch (error) {
      console.error("Error fetching initial data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedAgencyId) return toast.error("Selecciona una agencia")
    if (!formData.staff_id) return toast.error("Selecciona quién solicita el bono")
    if (!formData.course_name.trim()) return toast.error("Ingresa el nombre del curso")

    setSaving(true)
    try {
      const { data, error } = await supabase
        .from("bonuses")
        .insert({
          agency_id: selectedAgencyId,
          staff_id: formData.staff_id,
          bonus_type: "other",
          amount: 0,
          course_name: formData.course_name.trim(),
          course_hours: formData.course_hours ? Number(formData.course_hours) : null,
          agency_impact: formData.agency_impact.trim() || null,
          description: formData.description.trim() || null,
          status: "pending",
          // Arranca en el paso 2: espera autorización del jefe / dirección.
          workflow_stage: BONUS_STAGES.PENDING_MANAGER,
        })
        .select("id")
        .single()

      if (error) throw error

      toast.success("Bono registrado. Enviado a autorización.")
      router.push(`/dashboard/hr/bonuses/${data.id}`)
    } catch (error) {
      console.error("Error saving bonus:", error)
      toast.error("Error al registrar el bono")
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
          <GraduationCap className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Selecciona una Agencia</h2>
        <p className="text-muted-foreground max-w-md">
          Para registrar un nuevo bono, primero selecciona una agencia en el selector de arriba.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/hr/bonuses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Bono por Capacitación</h1>
          <p className="text-muted-foreground">
            Paso 1 de 4: Registro — {selectedAgency?.name}
          </p>
        </div>
      </div>

      {/* Indicador de pasos */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {["Registro", "Autorización", "Testigos", "Autorización de pago"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </span>
            <span className={i === 0 ? "font-medium text-foreground" : "text-muted-foreground"}>
              {label}
            </span>
            {i < 3 && <span className="mx-1 text-muted-foreground">›</span>}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mx-auto max-w-2xl">
          {/* Datos del curso */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Datos del curso</CardTitle>
                  <CardDescription>Información de la capacitación realizada</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field>
                <FieldLabel>Solicita el bono *</FieldLabel>
                <Select
                  value={formData.staff_id}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, staff_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona a la persona" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.first_name} {s.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  <User className="mr-1 inline h-3 w-3" />
                  Por defecto eres tú ({currentUser?.fullName || "usuario actual"}). Puedes cambiarlo.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel>Nombre del curso *</FieldLabel>
                <Input
                  value={formData.course_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, course_name: e.target.value }))}
                  placeholder="Ej: Estrategia de contenidos para redes sociales"
                />
              </Field>

              <Field>
                <FieldLabel>Cantidad de horas del curso</FieldLabel>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    className="pl-9"
                    value={formData.course_hours}
                    onChange={(e) => setFormData((prev) => ({ ...prev, course_hours: e.target.value }))}
                    placeholder="Ej: 20"
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel>Impacto en la agencia</FieldLabel>
                <Textarea
                  value={formData.agency_impact}
                  onChange={(e) => setFormData((prev) => ({ ...prev, agency_impact: e.target.value }))}
                  placeholder="¿Cómo aplicará lo aprendido y qué beneficio traerá a la agencia?"
                  rows={4}
                />
                <FieldDescription>
                  <TrendingUp className="mr-1 inline h-3 w-3" />
                  Explica el valor que aportará esta capacitación.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel>Notas (opcional)</FieldLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Detalle adicional del curso..."
                  rows={3}
                />
              </Field>

              <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                Al registrar, se solicitará la <span className="font-medium text-foreground">autorización de tu jefe o dirección</span>{" "}
                (Paso 2) para confirmar que por este curso podrás obtener el bono.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/hr/bonuses">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Spinner className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                  Registrar y solicitar autorización
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
