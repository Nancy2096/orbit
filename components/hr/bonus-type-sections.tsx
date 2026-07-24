"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldLabel } from "@/components/ui/field"
import { ScrollText, Pencil, Save, X, HandCoins, ArrowRight, CalendarClock, Lock } from "lucide-react"
import { toast } from "sonner"
import { BONUS_STAGES, getCurrentUserInfo, canManageBonusPolicy, type CurrentUserInfo } from "@/lib/bonus-workflow"
import {
  describeAvailableMonths,
  describeLimit,
  isMonthAvailable,
  getPeriodRange,
  getPeriodLabel,
} from "@/lib/bonus-availability"

interface BonusType {
  id: string
  name: string
  description: string | null
  benefit_type: string
  benefit_value: number
  available_months: number[]
  limit_period: string
  limit_count: number
}

interface StaffMember {
  id: string
  first_name: string
  last_name: string
  monthly_salary: number | null
  user_id: string | null
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount)

function describeBenefit(type: BonusType, staff?: StaffMember | null) {
  if (type.benefit_type === "money") {
    return formatCurrency(Number(type.benefit_value))
  }
  if (type.benefit_type === "salary_days") {
    if (staff?.monthly_salary) {
      const amount = (Number(staff.monthly_salary) / 30) * Number(type.benefit_value)
      return `${type.benefit_value} día(s) de sueldo (${formatCurrency(amount)})`
    }
    return `${type.benefit_value} día(s) de sueldo`
  }
  return `${type.benefit_value} día(s) libre(s)`
}

function computeAmount(type: BonusType, staff?: StaffMember | null) {
  if (type.benefit_type === "money") return Number(type.benefit_value) || 0
  if (type.benefit_type === "salary_days") {
    const dailySalary = (Number(staff?.monthly_salary) || 0) / 30
    return dailySalary * (Number(type.benefit_value) || 0)
  }
  return 0
}

interface BonusTypePanelProps {
  agencyId: string
  /** Patrones de nombre (en minúsculas) para localizar el tipo en el catálogo */
  matchNames: string[]
  /** Etiqueta legible del bono */
  label: string
  /** "flow" = ir al registro de 4 pasos; "direct" = crear solicitud con diálogo */
  requestMode: "flow" | "direct"
}

export function BonusTypePanel({ agencyId, matchNames, label, requestMode }: BonusTypePanelProps) {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [bonusType, setBonusType] = useState<BonusType | null>(null)
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUserInfo | null>(null)

  // Política
  const [policyContent, setPolicyContent] = useState("")
  const [policyDraft, setPolicyDraft] = useState("")
  const [policyUpdatedAt, setPolicyUpdatedAt] = useState<string | null>(null)
  const [editingPolicy, setEditingPolicy] = useState(false)
  const [savingPolicy, setSavingPolicy] = useState(false)

  // Solicitud directa
  const [dialogOpen, setDialogOpen] = useState(false)
  const [requestStaffId, setRequestStaffId] = useState("")
  const [requestNote, setRequestNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (agencyId) fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agencyId])

  async function fetchData() {
    setLoading(true)
    try {
      const [typesRes, staffRes, userInfo] = await Promise.all([
        supabase
          .from("bonus_types")
          .select("id, name, description, benefit_type, benefit_value, available_months, limit_period, limit_count")
          .eq("agency_id", agencyId)
          .eq("is_active", true),
        supabase
          .from("staff")
          .select("id, first_name, last_name, monthly_salary, user_id")
          .eq("agency_id", agencyId)
          .eq("is_active", true)
          .order("first_name"),
        getCurrentUserInfo(),
      ])

      const allTypes = (typesRes.data || []) as BonusType[]
      const matched =
        allTypes.find((t) => matchNames.some((m) => t.name.toLowerCase().includes(m))) || null
      setBonusType(matched)
      setStaff((staffRes.data || []) as StaffMember[])
      setCurrentUser(userInfo)

      if (matched) {
        const { data: policy } = await supabase
          .from("bonus_policies")
          .select("content, updated_at")
          .eq("agency_id", agencyId)
          .eq("bonus_type_id", matched.id)
          .maybeSingle()
        setPolicyContent(policy?.content || "")
        setPolicyDraft(policy?.content || "")
        setPolicyUpdatedAt(policy?.updated_at || null)
      }

      // Preseleccionar al usuario logueado como solicitante
      if (userInfo?.staffId) setRequestStaffId(userInfo.staffId)
    } catch (error) {
      console.error("Error loading bonus type panel:", error)
    } finally {
      setLoading(false)
    }
  }

  // Solo Recursos Humanos, Dirección General o Super administrador pueden
  // modificar las políticas de los bonos.
  const canManagePolicy = canManageBonusPolicy(currentUser)

  async function savePolicy() {
    if (!bonusType) return
    setSavingPolicy(true)
    try {
      const content = policyDraft.trim() || null
      const nowIso = new Date().toISOString()

      const { data: existing } = await supabase
        .from("bonus_policies")
        .select("id")
        .eq("agency_id", agencyId)
        .eq("bonus_type_id", bonusType.id)
        .maybeSingle()

      let saved: { content: string | null; updated_at: string | null } | null = null
      if (existing?.id) {
        const { data, error } = await supabase
          .from("bonus_policies")
          .update({ content, updated_at: nowIso })
          .eq("id", existing.id)
          .select("content, updated_at")
          .single()
        if (error) throw error
        saved = data
      } else {
        const { data, error } = await supabase
          .from("bonus_policies")
          .insert({ agency_id: agencyId, bonus_type_id: bonusType.id, content, updated_at: nowIso })
          .select("content, updated_at")
          .single()
        if (error) throw error
        saved = data
      }

      setPolicyContent(saved?.content || "")
      setPolicyDraft(saved?.content || "")
      setPolicyUpdatedAt(saved?.updated_at || null)
      setEditingPolicy(false)
      toast.success("Política actualizada")
    } catch (error) {
      console.error("Error saving policy:", error)
      toast.error("No se pudo guardar la política")
    } finally {
      setSavingPolicy(false)
    }
  }

  // Verifica que el bono esté habilitado este mes y que el colaborador no haya
  // superado el número de veces permitido en el periodo configurado.
  async function checkEligibility(staffId: string): Promise<{ ok: boolean; reason?: string }> {
    if (!bonusType) return { ok: false, reason: "Bono no disponible" }

    if (!isMonthAvailable(bonusType.available_months)) {
      return {
        ok: false,
        reason: `Este bono solo está habilitado en ciertos meses. ${describeAvailableMonths(bonusType.available_months)}.`,
      }
    }

    const range = getPeriodRange(bonusType.limit_period)
    if (range && bonusType.limit_count > 0) {
      const { count, error } = await supabase
        .from("bonuses")
        .select("id", { count: "exact", head: true })
        .eq("agency_id", agencyId)
        .eq("staff_id", staffId)
        .eq("bonus_type_id", bonusType.id)
        .neq("status", "rejected")
        .gte("created_at", range.start.toISOString())
        .lt("created_at", range.end.toISOString())

      if (error) {
        console.error("Error checking bonus usage:", error)
        return { ok: false, reason: "No se pudo validar la disponibilidad del bono" }
      }

      if ((count ?? 0) >= bonusType.limit_count) {
        const noun = getPeriodLabel(bonusType.limit_period)
        return {
          ok: false,
          reason: `Este colaborador ya alcanzó el límite de ${bonusType.limit_count} ${
            bonusType.limit_count === 1 ? "vez" : "veces"
          } por ${noun}. Estará disponible nuevamente en el siguiente ${noun}.`,
        }
      }
    }

    return { ok: true }
  }

  async function submitRequest() {
    if (!bonusType) return
    if (!requestStaffId) return toast.error("Selecciona quién solicita el bono")

    setSubmitting(true)
    try {
      const eligibility = await checkEligibility(requestStaffId)
      if (!eligibility.ok) {
        toast.error(eligibility.reason || "El bono no está disponible")
        setSubmitting(false)
        return
      }

      const member = staff.find((s) => s.id === requestStaffId) || null
      const amount = computeAmount(bonusType, member)

      const { data, error } = await supabase
        .from("bonuses")
        .insert({
          agency_id: agencyId,
          staff_id: requestStaffId,
          bonus_type_id: bonusType.id,
          bonus_type: "other",
          amount,
          benefit_type: bonusType.benefit_type,
          benefit_value: Number(bonusType.benefit_value),
          description: requestNote.trim() || null,
          status: "pending",
          workflow_stage: BONUS_STAGES.PENDING_MANAGER,
        })
        .select("id")
        .single()

      if (error) throw error
      toast.success("Solicitud enviada para autorización")
      setDialogOpen(false)
      if (data?.id) router.push(`/dashboard/hr/bonuses/${data.id}`)
    } catch (error) {
      console.error("Error creating bonus request:", error)
      toast.error("No se pudo crear la solicitud")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (!bonusType) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No se encontró un tipo de bono de <span className="font-medium">{label}</span> en el
          catálogo de esta agencia. Créalo en Agencias {">"} Catálogos {">"} Bonos.
        </CardContent>
      </Card>
    )
  }

  const requestMember = staff.find((s) => s.id === requestStaffId) || null
  const availableThisMonth = isMonthAvailable(bonusType.available_months)
  const hasMonthRestriction = (bonusType.available_months?.length ?? 0) > 0 && bonusType.available_months.length < 12

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Política */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ScrollText className="h-5 w-5" />
                Política
              </CardTitle>
              <CardDescription>
                {policyUpdatedAt
                  ? `Actualizada el ${new Date(policyUpdatedAt).toLocaleDateString("es-MX")}`
                  : `Política del bono de ${label}`}
              </CardDescription>
            </div>
            {canManagePolicy && !editingPolicy && (
              <Button variant="outline" size="sm" onClick={() => setEditingPolicy(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                {policyContent ? "Editar" : "Escribir"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingPolicy ? (
            <div className="space-y-3">
              <Textarea
                value={policyDraft}
                onChange={(e) => setPolicyDraft(e.target.value)}
                placeholder={`Describe la política del bono de ${label}...`}
                rows={12}
                className="resize-y leading-relaxed"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPolicyDraft(policyContent)
                    setEditingPolicy(false)
                  }}
                  disabled={savingPolicy}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button size="sm" onClick={savePolicy} disabled={savingPolicy}>
                  {savingPolicy ? (
                    <Spinner className="mr-2 h-4 w-4" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Guardar
                </Button>
              </div>
            </div>
          ) : policyContent ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {policyContent}
            </p>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aún no se ha definido una política para este bono.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Solicitar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HandCoins className="h-5 w-5" />
            Solicitar el bono
          </CardTitle>
          <CardDescription>{bonusType.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="mb-1 text-sm text-muted-foreground">Monto del bono:</p>
            <p className="text-2xl font-semibold text-foreground">
              {describeBenefit(bonusType, requestMode === "direct" ? requestMember : null)}
            </p>
            {bonusType.description && (
              <p className="mt-1 text-sm text-muted-foreground">{bonusType.description}</p>
            )}
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="h-4 w-4 shrink-0" />
              <span>{describeAvailableMonths(bonusType.available_months)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="h-4 w-4 shrink-0" />
              <span>{describeLimit(bonusType.limit_period, bonusType.limit_count)}</span>
            </div>
          </div>

          {hasMonthRestriction && !availableThisMonth && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
              Este bono no está habilitado este mes. {describeAvailableMonths(bonusType.available_months)}.
            </div>
          )}

          {requestMode === "flow" ? (
            <>
              <p className="text-sm text-muted-foreground">
                Este bono se solicita mediante el proceso de capacitación: registro del curso,
                autorización, evidencias (certificado, presentación y videollamada) y autorización de
                pago.
              </p>
              <Button
                onClick={() => router.push("/dashboard/hr/bonuses/new")}
                disabled={!availableThisMonth}
              >
                Solicitar por capacitación
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Al solicitar, se creará el bono a nombre del solicitante y quedará pendiente de
                autorización de tu jefe o dirección.
              </p>
              <Button onClick={() => setDialogOpen(true)} disabled={!availableThisMonth}>
                <HandCoins className="mr-2 h-4 w-4" />
                Solicitar el bono
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de solicitud directa */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar {label}</DialogTitle>
            <DialogDescription>
              El monto se toma de lo definido en el catálogo de la agencia.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field>
              <FieldLabel>Solicita el bono *</FieldLabel>
              <Select value={requestStaffId} onValueChange={setRequestStaffId}>
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
            </Field>

            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-sm text-muted-foreground">Monto estimado:</p>
              <p className="text-lg font-semibold text-foreground">
                {describeBenefit(bonusType, requestMember)}
              </p>
            </div>

            <Field>
              <FieldLabel>Notas (opcional)</FieldLabel>
              <Textarea
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                placeholder="Detalle adicional de la solicitud..."
                rows={3}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={submitRequest} disabled={submitting}>
              {submitting ? <Spinner className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
              Enviar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
