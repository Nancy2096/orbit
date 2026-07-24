"use client"

import { useState, useEffect, use, useRef } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { upload } from "@vercel/blob/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import {
  ArrowLeft,
  GraduationCap,
  User,
  Building2,
  Calendar,
  DollarSign,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Circle,
  FileCheck,
  Presentation,
  Video,
  Upload,
  Download,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"
import {
  getCurrentUserInfo,
  type CurrentUserInfo,
  BONUS_STAGES,
  STAGE_LABELS,
  STAGE_BADGE_STYLES,
  BONUS_STEPS,
  activeStepIndex,
} from "@/lib/bonus-workflow"

interface Bonus {
  id: string
  bonus_type: string
  description: string | null
  amount: number
  status: string
  effective_date: string | null
  notes: string | null
  created_at: string
  course_name: string | null
  course_hours: number | null
  agency_impact: string | null
  workflow_stage: string
  manager_approved_by: string | null
  manager_approved_at: string | null
  manager_note: string | null
  certificate_url: string | null
  certificate_filename: string | null
  certificate_uploaded_at: string | null
  presentation_url: string | null
  presentation_filename: string | null
  presentation_uploaded_at: string | null
  videocall_url: string | null
  videocall_scheduled_at: string | null
  videocall_done: boolean
  rejection_reason: string | null
  rejected_at: string | null
  paid_at: string | null
  staff: {
    id: string
    first_name: string
    last_name: string
    department: { name: string } | null
  } | null
  agency: { id: string; name: string } | null
  bonus_type_ref: { id: string; name: string } | null
}

const fileApiUrl = (blobUrl: string) => {
  try {
    const pathname = new URL(blobUrl).pathname.replace(/^\//, "")
    return `/api/file?pathname=${encodeURIComponent(pathname)}`
  } catch {
    return blobUrl
  }
}

export default function BonusDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()

  const [bonus, setBonus] = useState<Bonus | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<CurrentUserInfo | null>(null)
  const [working, setWorking] = useState(false)
  // user_id de los jefes/directores del solicitante (cadena de reports_to_id).
  // Solo ellos (o dirección general / super admin) pueden autorizar el bono.
  const [authorizerUserIds, setAuthorizerUserIds] = useState<string[]>([])

  // Estado de formularios de acciones
  const [managerNote, setManagerNote] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [videocallUrl, setVideocallUrl] = useState("")
  const [videocallDate, setVideocallDate] = useState("")
  const [uploadingCert, setUploadingCert] = useState(false)
  const [uploadingPres, setUploadingPres] = useState(false)
  const certInputRef = useRef<HTMLInputElement>(null)
  const presInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data, error }, userInfo] = await Promise.all([
      supabase
        .from("bonuses")
        .select(`
          *,
          staff:staff(id, first_name, last_name, department:departments(name)),
          agency:agencies(id, name),
          bonus_type_ref:bonus_types(id, name)
        `)
        .eq("id", id)
        .single(),
      getCurrentUserInfo(),
    ])

    if (error || !data) {
      toast.error("No se encontró el bono")
      setLoading(false)
      return
    }
    setBonus(data as Bonus)
    setCurrentUser(userInfo)
    setVideocallUrl(data.videocall_url || "")
    setVideocallDate(data.videocall_scheduled_at ? data.videocall_scheduled_at.slice(0, 16) : "")

    // Construir la cadena de jefes/directores del solicitante siguiendo
    // reports_to_id hacia arriba, para limitar quién puede autorizar el bono.
    const requesterStaffId = data.staff?.id
    const bonusAgencyId = data.agency?.id
    if (requesterStaffId && bonusAgencyId) {
      const { data: staffRows } = await supabase
        .from("staff")
        .select("id, user_id, reports_to_id")
        .eq("agency_id", bonusAgencyId)

      const byId = new Map((staffRows || []).map((s: any) => [s.id, s]))
      const chainUserIds: string[] = []
      const visited = new Set<string>()
      let nextId = byId.get(requesterStaffId)?.reports_to_id as string | null | undefined
      while (nextId && !visited.has(nextId)) {
        visited.add(nextId)
        const node = byId.get(nextId)
        if (!node) break
        if (node.user_id) chainUserIds.push(node.user_id)
        nextId = node.reports_to_id
      }
      setAuthorizerUserIds(chainUserIds)
    } else {
      setAuthorizerUserIds([])
    }

    setLoading(false)
  }

  const patchBonus = async (updates: Record<string, unknown>, successMsg: string) => {
    if (!bonus) return
    setWorking(true)
    const { error } = await supabase.from("bonuses").update(updates).eq("id", bonus.id)
    if (error) {
      console.error(error)
      toast.error("Ocurrió un error. Intenta de nuevo.")
    } else {
      toast.success(successMsg)
      await fetchAll()
    }
    setWorking(false)
  }

  // Paso 2: autorización del jefe / dirección
  const approveManager = () =>
    patchBonus(
      {
        workflow_stage: BONUS_STAGES.PENDING_EVIDENCE,
        manager_approved_by: currentUser?.userId ?? null,
        manager_approved_at: new Date().toISOString(),
        manager_note: managerNote.trim() || null,
        status: "approved",
        approved_at: new Date().toISOString(),
      },
      "Bono autorizado. Ahora se requieren las evidencias.",
    )

  const reject = () => {
    if (!rejectReason.trim()) {
      toast.error("Indica el motivo del rechazo")
      return
    }
    patchBonus(
      {
        workflow_stage: BONUS_STAGES.REJECTED,
        rejection_reason: rejectReason.trim(),
        rejected_by: currentUser?.userId ?? null,
        rejected_at: new Date().toISOString(),
        status: "cancelled",
      },
      "Bono rechazado.",
    )
  }

  // Paso 3: subir archivos
  const handleUpload = async (file: File, kind: "certificate" | "presentation") => {
    if (!bonus) return
    const setUploading = kind === "certificate" ? setUploadingCert : setUploadingPres
    setUploading(true)
    try {
      const extension = file.name.split(".").pop() || "bin"
      const pathname = `bonuses/${bonus.id}/${kind}_${Date.now()}.${extension}`
      const blob = await upload(pathname, file, {
        access: "private",
        handleUploadUrl: "/api/bonuses/upload",
        contentType: file.type,
        multipart: file.size > 5 * 1024 * 1024,
      })

      const now = new Date().toISOString()
      const updates =
        kind === "certificate"
          ? { certificate_url: blob.url, certificate_filename: file.name, certificate_uploaded_at: now }
          : { presentation_url: blob.url, presentation_filename: file.name, presentation_uploaded_at: now }

      const { error } = await supabase.from("bonuses").update(updates).eq("id", bonus.id)
      if (error) throw error
      toast.success(kind === "certificate" ? "Certificado cargado" : "Presentación cargada")
      await fetchAll()
    } catch (err) {
      console.error(err)
      toast.error("Error al subir el archivo")
    } finally {
      setUploading(false)
    }
  }

  const saveVideocall = () =>
    patchBonus(
      {
        videocall_url: videocallUrl.trim() || null,
        videocall_scheduled_at: videocallDate ? new Date(videocallDate).toISOString() : null,
        videocall_done: true,
      },
      "Videollamada registrada.",
    )

  // Avanzar del paso 3 al 4 (solicitar autorización de pago)
  const requestPayment = () =>
    patchBonus(
      { workflow_stage: BONUS_STAGES.PENDING_PAYMENT },
      "Evidencias completas. Enviado a autorización de pago.",
    )

  // Paso 4: autorización de pago (Dirección de Operaciones)
  const authorizePayment = () =>
    patchBonus(
      { workflow_stage: BONUS_STAGES.PAID, status: "paid", paid_at: new Date().toISOString() },
      "Pago autorizado. Bono completado.",
    )

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    const d = new Date(dateString)
    return `${d.getUTCDate()} ${d.toLocaleString("es-MX", { month: "short", timeZone: "UTC" })} ${d.getUTCFullYear()}`
  }
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount)

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!bonus) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <GraduationCap className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mb-2 text-xl font-semibold">Bono no encontrado</h2>
        <Button asChild className="mt-4">
          <Link href="/dashboard/hr/bonuses">Volver a Bonos</Link>
        </Button>
      </div>
    )
  }

  const stage = bonus.workflow_stage || BONUS_STAGES.PENDING_MANAGER
  const activeIdx = activeStepIndex(stage)
  const isRejected = stage === BONUS_STAGES.REJECTED
  // Dirección general / super admin / acceso global pueden autorizar siempre
  // (para no bloquear la administración). En los demás casos, solo los jefes o
  // directores del solicitante (su cadena de reports_to_id) pueden autorizar.
  const isTopAuthorizer =
    currentUser?.isGlobalAccess === true ||
    currentUser?.roleName === "superadmin" ||
    currentUser?.roleName === "direccion_general"
  const isRequesterManager = currentUser ? authorizerUserIds.includes(currentUser.userId) : false
  const canAuthorize = isTopAuthorizer || (currentUser?.isManagerOrAbove === true && isRequesterManager)
  const canPay = currentUser?.isOperationsDirector
  const hasCertificate = !!bonus.certificate_url
  const hasPresentation = !!bonus.presentation_url
  const hasVideocall = bonus.videocall_done
  const evidenceComplete = hasCertificate && hasPresentation && hasVideocall

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/hr/bonuses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-balance">
            {bonus.course_name || "Bono por Capacitación"}
          </h1>
          <p className="text-muted-foreground">
            {bonus.staff?.first_name} {bonus.staff?.last_name}
          </p>
        </div>
        <Badge className={STAGE_BADGE_STYLES[stage] || ""}>{STAGE_LABELS[stage] || stage}</Badge>
      </div>

      {/* Stepper de 4 pasos */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {BONUS_STEPS.map((step, i) => {
              const done = isRejected ? false : i + 1 < activeIdx
              const active = !isRejected && i + 1 === activeIdx
              return (
                <div key={step.key} className="flex flex-1 items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      done
                        ? "bg-green-600 text-white"
                        : active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {done ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Paso {i + 1}
                    </p>
                    <p
                      className={`truncate text-sm ${
                        active ? "font-semibold text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                  {i < BONUS_STEPS.length - 1 && (
                    <div className="hidden h-px flex-1 bg-border sm:block" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {isRejected && (
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="flex items-start gap-3 p-4">
            <XCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">Bono rechazado</p>
              <p className="text-sm text-muted-foreground">{bonus.rejection_reason}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatDate(bonus.rejected_at)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna izquierda: info del bono */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <CardTitle>Información del curso</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoItem icon={User} label="Solicita">
                {bonus.staff?.first_name} {bonus.staff?.last_name}
                {bonus.staff?.department?.name && (
                  <span className="block text-sm text-muted-foreground">
                    {bonus.staff.department.name}
                  </span>
                )}
              </InfoItem>
              <InfoItem icon={Building2} label="Agencia">
                {bonus.agency?.name || "-"}
              </InfoItem>
              <InfoItem icon={Clock} label="Horas del curso">
                {bonus.course_hours ? `${bonus.course_hours} h` : "-"}
              </InfoItem>
              <InfoItem icon={DollarSign} label="Monto del bono">
                <span className="text-lg font-semibold text-green-600">
                  {formatCurrency(Number(bonus.amount || 0))}
                </span>
              </InfoItem>
              <InfoItem icon={Calendar} label="Registrado">
                {formatDate(bonus.created_at)}
              </InfoItem>
              <InfoItem icon={GraduationCap} label="Tipo de bono">
                {bonus.bonus_type_ref?.name || bonus.bonus_type}
              </InfoItem>
            </div>

            {bonus.agency_impact && (
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="mb-1 flex items-center gap-1 text-sm font-medium">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Impacto en la agencia
                </p>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {bonus.agency_impact}
                </p>
              </div>
            )}
            {bonus.description && (
              <div>
                <p className="mb-1 text-sm text-muted-foreground">Notas</p>
                <p className="whitespace-pre-wrap text-sm">{bonus.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Columna derecha: acción del paso actual */}
        <div className="space-y-6">
          {/* Paso 2: Autorización */}
          {stage === BONUS_STAGES.PENDING_MANAGER && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Paso 2: Autorización
                </CardTitle>
                <CardDescription>Jefe o dirección debe confirmar el bono</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {canAuthorize ? (
                  <>
                    <div>
                      <Label className="text-xs">Nota (opcional)</Label>
                      <Textarea
                        value={managerNote}
                        onChange={(e) => setManagerNote(e.target.value)}
                        rows={2}
                        placeholder="Comentario de autorización..."
                      />
                    </div>
                    <Button className="w-full" onClick={approveManager} disabled={working}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Autorizar bono
                    </Button>
                    <div className="border-t pt-3">
                      <Label className="text-xs">Motivo de rechazo</Label>
                      <Textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={2}
                        placeholder="Si rechazas, indica el motivo..."
                      />
                      <Button
                        variant="outline"
                        className="mt-2 w-full text-destructive hover:text-destructive"
                        onClick={reject}
                        disabled={working}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Rechazar
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Este bono está pendiente de autorización por parte del jefe o dirección del
                    solicitante.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Paso 3: Testigos / evidencia */}
          {stage === BONUS_STAGES.PENDING_EVIDENCE && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Paso 3: Testigos</CardTitle>
                <CardDescription>Certificado, presentación y videollamada</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Certificado */}
                <EvidenceRow
                  icon={FileCheck}
                  label="Certificado"
                  done={hasCertificate}
                  fileName={bonus.certificate_filename}
                  fileUrl={bonus.certificate_url}
                >
                  <input
                    ref={certInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleUpload(f, "certificate")
                      e.target.value = ""
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => certInputRef.current?.click()}
                    disabled={uploadingCert}
                  >
                    {uploadingCert ? <Spinner className="mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                    {hasCertificate ? "Reemplazar" : "Cargar"}
                  </Button>
                </EvidenceRow>

                {/* Presentación */}
                <EvidenceRow
                  icon={Presentation}
                  label="Presentación de lo aprendido"
                  done={hasPresentation}
                  fileName={bonus.presentation_filename}
                  fileUrl={bonus.presentation_url}
                >
                  <input
                    ref={presInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.ppt,.pptx,.odp,image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleUpload(f, "presentation")
                      e.target.value = ""
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => presInputRef.current?.click()}
                    disabled={uploadingPres}
                  >
                    {uploadingPres ? <Spinner className="mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                    {hasPresentation ? "Reemplazar" : "Subir"}
                  </Button>
                </EvidenceRow>

                {/* Videollamada */}
                <div className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    {hasVideocall ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Video className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Videollamada con el equipo</span>
                  </div>
                  <div className="space-y-2">
                    <Input
                      value={videocallUrl}
                      onChange={(e) => setVideocallUrl(e.target.value)}
                      placeholder="Enlace (Zoom, Meet, Teams...)"
                    />
                    <Input
                      type="datetime-local"
                      value={videocallDate}
                      onChange={(e) => setVideocallDate(e.target.value)}
                    />
                    <Button variant="outline" size="sm" className="w-full" onClick={saveVideocall} disabled={working}>
                      Guardar videollamada
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={requestPayment}
                  disabled={working || !evidenceComplete}
                >
                  Enviar a autorización de pago
                </Button>
                {!evidenceComplete && (
                  <p className="text-center text-xs text-muted-foreground">
                    Completa certificado, presentación y videollamada para continuar.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Paso 4: Autorización de pago */}
          {stage === BONUS_STAGES.PENDING_PAYMENT && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Paso 4: Autorización de pago
                </CardTitle>
                <CardDescription>Dirección de Operaciones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {canPay ? (
                  <Button className="w-full" onClick={authorizePayment} disabled={working}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Autorizar pago
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Pendiente de autorización de pago por parte de la Dirección de Operaciones.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Completado */}
          {stage === BONUS_STAGES.PAID && (
            <Card className="border-green-200 dark:border-green-900">
              <CardContent className="flex items-start gap-3 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">Bono pagado</p>
                  <p className="text-sm text-muted-foreground">
                    El proceso se completó. Pago autorizado el {formatDate(bonus.paid_at)}.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resumen de evidencias (visible una vez cargadas, en cualquier etapa posterior) */}
          {(hasCertificate || hasPresentation || bonus.videocall_url) && stage !== BONUS_STAGES.PENDING_EVIDENCE && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evidencias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {hasCertificate && (
                  <a
                    href={fileApiUrl(bonus.certificate_url!)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Download className="h-4 w-4" /> {bonus.certificate_filename || "Certificado"}
                  </a>
                )}
                {hasPresentation && (
                  <a
                    href={fileApiUrl(bonus.presentation_url!)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Download className="h-4 w-4" /> {bonus.presentation_filename || "Presentación"}
                  </a>
                )}
                {bonus.videocall_url && (
                  <a
                    href={bonus.videocall_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Video className="h-4 w-4" /> Enlace de videollamada
                  </a>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoItem({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-1 h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="font-medium">{children}</div>
      </div>
    </div>
  )
}

function EvidenceRow({
  icon: Icon,
  label,
  done,
  fileName,
  fileUrl,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  done: boolean
  fileName: string | null
  fileUrl: string | null
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-center gap-2">
        {done ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground" />
        )}
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {done && fileName && (
        <a
          href={fileUrl ? fileApiUrl(fileUrl) : "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-2 flex items-center gap-1 truncate text-xs text-primary hover:underline"
        >
          <Download className="h-3 w-3" /> {fileName}
        </a>
      )}
      {children}
    </div>
  )
}
