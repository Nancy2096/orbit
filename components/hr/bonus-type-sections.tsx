"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Gift, ScrollText, Pencil, Save, X, Send, HandCoins } from "lucide-react"
import { toast } from "sonner"
import { BONUS_STAGES, getCurrentUserInfo, type CurrentUserInfo } from "@/lib/bonus-workflow"

interface BonusType {
  id: string
  name: string
  description: string | null
  benefit_type: string
  benefit_value: number
}

interface PolicyRow {
  content: string | null
  updated_at: string | null
}

export function BonusTypeSections({ agencyId }: { agencyId: string }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [bonusTypes, setBonusTypes] = useState<BonusType[]>([])
  const [policies, setPolicies] = useState<Record<string, PolicyRow>>({})
  const [currentUser, setCurrentUser] = useState<CurrentUserInfo | null>(null)
  const [requesterSalary, setRequesterSalary] = useState(0)

  // Edición de política por tipo
  const [editingId, setEditingId] = useState<string | null>(null)
  const [policyDraft, setPolicyDraft] = useState("")
  const [savingPolicyId, setSavingPolicyId] = useState<string | null>(null)

  // Diálogo de solicitud
  const [requestType, setRequestType] = useState<BonusType | null>(null)
  const [requestNote, setRequestNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getUTCDate()} ${date.toLocaleString("es-MX", { month: "short", timeZone: "UTC" })} ${date.getUTCFullYear()}`
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [typesRes, policiesRes, userInfo] = await Promise.all([
        supabase
          .from("bonus_types")
          .select("id, name, description, benefit_type, benefit_value")
          .eq("agency_id", agencyId)
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("bonus_policies")
          .select("bonus_type_id, content, updated_at")
          .eq("agency_id", agencyId)
          .not("bonus_type_id", "is", null),
        getCurrentUserInfo(),
      ])

      setBonusTypes(typesRes.data || [])

      const policyMap: Record<string, PolicyRow> = {}
      for (const row of policiesRes.data || []) {
        if (row.bonus_type_id) {
          policyMap[row.bonus_type_id] = { content: row.content, updated_at: row.updated_at }
        }
      }
      setPolicies(policyMap)
      setCurrentUser(userInfo)

      if (userInfo?.staffId) {
        const { data: staffRow } = await supabase
          .from("staff")
          .select("monthly_salary")
          .eq("id", userInfo.staffId)
          .maybeSingle()
        setRequesterSalary(Number(staffRow?.monthly_salary) || 0)
      } else {
        setRequesterSalary(0)
      }
    } catch (error) {
      console.error("Error fetching bonus type sections:", error)
    } finally {
      setLoading(false)
    }
  }, [agencyId, supabase])

  useEffect(() => {
    if (agencyId) fetchData()
  }, [agencyId, fetchData])

  const benefitSummary = (type: BonusType) => {
    if (type.benefit_type === "money") return formatCurrency(Number(type.benefit_value))
    if (type.benefit_type === "salary_days") return `${type.benefit_value} día(s) de sueldo`
    return `${type.benefit_value} día(s) libre(s)`
  }

  // El monto se calcula a partir de lo definido en el catálogo de bonos.
  const computeAmount = (type: BonusType) => {
    if (type.benefit_type === "money") return Number(type.benefit_value) || 0
    if (type.benefit_type === "salary_days") {
      return (requesterSalary / 30) * (Number(type.benefit_value) || 0)
    }
    return 0
  }

  async function savePolicy(typeId: string) {
    setSavingPolicyId(typeId)
    try {
      const content = policyDraft.trim() || null
      const nowIso = new Date().toISOString()

      // Buscar si ya existe una política para este tipo (evita conflicto con índice parcial)
      const { data: existing } = await supabase
        .from("bonus_policies")
        .select("id")
        .eq("agency_id", agencyId)
        .eq("bonus_type_id", typeId)
        .maybeSingle()

      if (existing?.id) {
        const { error } = await supabase
          .from("bonus_policies")
          .update({ content, updated_at: nowIso })
          .eq("id", existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("bonus_policies")
          .insert({ agency_id: agencyId, bonus_type_id: typeId, content, updated_at: nowIso })
        if (error) throw error
      }

      setPolicies((prev) => ({ ...prev, [typeId]: { content, updated_at: nowIso } }))
      setEditingId(null)
      toast.success("Política guardada")
    } catch (error) {
      console.error("Error saving policy:", error)
      toast.error("No se pudo guardar la política")
    } finally {
      setSavingPolicyId(null)
    }
  }

  async function submitRequest() {
    if (!requestType) return
    if (!currentUser?.staffId) {
      toast.error("Tu usuario no está vinculado a un registro de personal en esta agencia")
      return
    }
    setSubmitting(true)
    try {
      const amount = computeAmount(requestType)
      const { data, error } = await supabase
        .from("bonuses")
        .insert({
          agency_id: agencyId,
          staff_id: currentUser.staffId,
          bonus_type: "other",
          bonus_type_id: requestType.id,
          benefit_type: requestType.benefit_type,
          benefit_value: Number(requestType.benefit_value),
          amount,
          description: requestNote.trim() || null,
          status: "pending",
          // Entra al flujo: espera autorización del jefe / dirección.
          workflow_stage: BONUS_STAGES.PENDING_MANAGER,
        })
        .select("id")
        .single()

      if (error) throw error
      toast.success("Solicitud enviada. Espera la autorización de tu jefe o dirección.")
      setRequestType(null)
      setRequestNote("")
      // Redirige al detalle del bono recién creado
      if (data?.id) window.location.href = `/dashboard/hr/bonuses/${data.id}`
    } catch (error) {
      console.error("Error submitting request:", error)
      toast.error("No se pudo enviar la solicitud")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (bonusTypes.length === 0) {
    return (
      <Empty>
        <EmptyMedia variant="icon">
          <Gift className="h-6 w-6" />
        </EmptyMedia>
        <EmptyTitle>Sin tipos de bono activos</EmptyTitle>
        <EmptyDescription>
          Configura los tipos de bono en Agencias {">"} Catálogos {">"} Bonos para que aparezcan aquí.
        </EmptyDescription>
      </Empty>
    )
  }

  return (
    <>
      <Accordion type="multiple" className="space-y-3">
        {bonusTypes.map((type) => {
          const policy = policies[type.id]
          const isEditing = editingId === type.id
          const amount = computeAmount(type)
          return (
            <AccordionItem
              key={type.id}
              value={type.id}
              className="rounded-lg border bg-card px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-1 items-center justify-between gap-3 pr-2">
                  <div className="flex items-center gap-3 text-left">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Gift className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold leading-tight">{type.name}</p>
                      {type.description && (
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {benefitSummary(type)}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pb-4">
                {/* Sección: Política */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ScrollText className="h-4 w-4 text-muted-foreground" />
                      <h4 className="text-sm font-semibold">Política</h4>
                    </div>
                    {!isEditing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPolicyDraft(policy?.content || "")
                          setEditingId(type.id)
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        {policy?.content ? "Editar" : "Escribir política"}
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(null)}
                          disabled={savingPolicyId === type.id}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => savePolicy(type.id)}
                          disabled={savingPolicyId === type.id}
                        >
                          {savingPolicyId === type.id ? (
                            <Spinner className="mr-2 h-4 w-4" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Guardar
                        </Button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <Textarea
                      value={policyDraft}
                      onChange={(e) => setPolicyDraft(e.target.value)}
                      placeholder={`Describe la política para el bono "${type.name}": elegibilidad, requisitos y pasos a seguir para obtenerlo.`}
                      rows={10}
                      className="resize-y leading-relaxed"
                    />
                  ) : policy?.content ? (
                    <div className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm leading-relaxed text-foreground">
                      {policy.content}
                    </div>
                  ) : (
                    <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                      Aún no hay política definida para este bono.
                    </p>
                  )}
                  {policy?.updated_at && !isEditing && (
                    <p className="text-xs text-muted-foreground">
                      Última actualización: {formatDate(policy.updated_at)}
                    </p>
                  )}
                </section>

                {/* Sección: Solicitar el bono */}
                <section className="space-y-3 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <HandCoins className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold">Solicitar el bono</h4>
                  </div>
                  <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {type.benefit_type === "free_days" ? "Beneficio" : "Monto del bono"}
                      </p>
                      <p className="text-2xl font-semibold">
                        {type.benefit_type === "free_days"
                          ? `${type.benefit_value} día(s) libre(s)`
                          : formatCurrency(amount)}
                      </p>
                      {type.benefit_type === "salary_days" && (
                        <p className="text-xs text-muted-foreground">
                          Calculado con tu sueldo mensual registrado.
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => {
                        setRequestNote("")
                        setRequestType(type)
                      }}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Solicitar
                    </Button>
                  </div>
                </section>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      {/* Diálogo de solicitud */}
      <Dialog open={!!requestType} onOpenChange={(open) => !open && setRequestType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar bono: {requestType?.name}</DialogTitle>
            <DialogDescription>
              Se creará una solicitud a tu nombre y se enviará a autorización de tu jefe o dirección.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Solicitante</span>
                <span className="font-medium">{currentUser?.fullName || "—"}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-muted-foreground">
                  {requestType?.benefit_type === "free_days" ? "Beneficio" : "Monto"}
                </span>
                <span className="font-medium">
                  {requestType
                    ? requestType.benefit_type === "free_days"
                      ? `${requestType.benefit_value} día(s) libre(s)`
                      : formatCurrency(computeAmount(requestType))
                    : "—"}
                </span>
              </div>
            </div>

            {!currentUser?.staffId && (
              <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
                Tu usuario no está vinculado a un registro de personal, por lo que no puedes solicitar
                el bono. Contacta a Recursos Humanos.
              </p>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Notas (opcional)</label>
              <Textarea
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                placeholder="Motivo o detalle de la solicitud..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestType(null)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={submitRequest} disabled={submitting || !currentUser?.staffId}>
              {submitting ? <Spinner className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
              Enviar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
