"use client"

import { use, useRef, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { upload } from "@vercel/blob/client"
import { createClient } from "@/lib/supabase/client"
import { usePermissions } from "@/components/dashboard/permissions-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Check, Download, Eye, Upload, X } from "lucide-react"
import { toast } from "sonner"
import { LoanAuthorizers } from "@/components/hr/loan-authorizers"
import {
  INCENTIVE_RECEIPT_MAX_BYTES,
  INCENTIVE_RECEIPT_TYPES,
  INCENTIVE_STATUS_LABELS,
  INCENTIVE_STATUS_STYLES,
  INCENTIVE_TYPE_LABELS,
  formatDateOnly,
  formatIncentiveAmount,
  isIncentiveAuthorizer,
  receiptFileUrl,
  todayInMexico,
  type IncentiveStatus,
} from "@/lib/incentives"

interface IncentiveDetail {
  id: string
  incentive_number: string | null
  incentive_type: string
  request_date: string
  description: string | null
  notes: string | null
  amount: number
  status: IncentiveStatus
  pay_in_payroll_date: string | null
  created_by: string | null
  created_at: string
  approved_by: string | null
  approved_at: string | null
  rejected_by: string | null
  rejected_at: string | null
  rejection_reason: string | null
  receipt_pathname: string | null
  receipt_filename: string | null
  receipt_uploaded_by: string | null
  receipt_uploaded_at: string | null
  paid_at: string | null
  staff: { first_name: string | null; last_name: string | null } | null
  agency: { name: string | null } | null
  currency: { code: string | null } | null
}

type UserRow = Record<string, unknown> & { id: string }

function userLabel(user: UserRow | undefined): string {
  if (!user) return "—"
  const full =
    (typeof user.full_name === "string" && user.full_name) ||
    [user.first_name, user.last_name].filter((v) => typeof v === "string" && v).join(" ")
  return full || (typeof user.email === "string" ? user.email : "—")
}

function formatDateTime(value: string | null): string {
  if (!value) return "—"
  return new Date(value).toLocaleString("es-MX", { timeZone: "America/Mexico_City", dateStyle: "medium", timeStyle: "short" })
}

async function fetchIncentive(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("incentives")
    .select("*, staff:staff_id(first_name, last_name), agency:agency_id(name), currency:currency_id(code)")
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const incentive = data as IncentiveDetail
  const ids = [incentive.created_by, incentive.approved_by, incentive.rejected_by, incentive.receipt_uploaded_by].filter(
    (v): v is string => !!v,
  )
  const users: Record<string, UserRow> = {}
  if (ids.length > 0) {
    const { data: rows } = await supabase.from("users").select("*").in("id", ids)
    for (const row of (rows || []) as UserRow[]) users[row.id] = row
  }
  return { incentive, users }
}

export default function IncentiveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { roleName } = usePermissions()
  const { data, isLoading, mutate } = useSWR(["incentive", id], () => fetchIncentive(id))
  const [payDate, setPayDate] = useState(todayInMexico())
  const [reason, setReason] = useState("")
  const [deciding, setDeciding] = useState<"approve" | "reject" | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }
  if (!data) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-muted-foreground">Incentivo no encontrado.</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/hr/bonuses?tab=incentives">Volver</Link>
        </Button>
      </div>
    )
  }

  const { incentive, users } = data
  const isAuthorizer = isIncentiveAuthorizer(roleName)
  const employee = `${incentive.staff?.first_name ?? ""} ${incentive.staff?.last_name ?? ""}`.trim() || "—"
  const canUpload = incentive.status === "approved" || (incentive.status === "paid" && !incentive.receipt_pathname)

  async function decide(action: "approve" | "reject") {
    if (action === "reject" && !reason.trim()) {
      toast.error("Indica el motivo del rechazo")
      return
    }
    setDeciding(action)
    try {
      const res = await fetch(`/api/incentives/${id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "approve" ? { action, pay_in_payroll_date: payDate } : { action, reason }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Error")
      toast.success(action === "approve" ? "Incentivo aprobado" : "Incentivo rechazado")
      await mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar la decisión")
    } finally {
      setDeciding(null)
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (!INCENTIVE_RECEIPT_TYPES.includes(file.type)) {
      toast.error("Solo se aceptan PDF o imágenes (JPG, PNG, WEBP)")
      return
    }
    if (file.size > INCENTIVE_RECEIPT_MAX_BYTES) {
      toast.error("El archivo supera 10 MB")
      return
    }
    setUploading(true)
    try {
      const safeName = file.name.replace(/[^\w.\-]+/g, "_")
      const blob = await upload(`incentives/${id}/${safeName}`, file, {
        access: "private",
        handleUploadUrl: "/api/incentives/upload",
        clientPayload: JSON.stringify({ incentiveId: id }),
        contentType: file.type,
      })
      const res = await fetch(`/api/incentives/${id}/receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: blob.url, pathname: blob.pathname, filename: file.name, contentType: file.type }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Error")
      toast.success("Comprobante guardado")
      await mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al subir el comprobante")
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ""
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/hr/bonuses?tab=incentives" aria-label="Volver a incentivos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold text-balance">{incentive.incentive_number || "Incentivo"}</h1>
          <p className="text-sm text-muted-foreground">{employee}</p>
        </div>
        <Badge variant="outline" className={`ml-auto border-0 ${INCENTIVE_STATUS_STYLES[incentive.status]}`}>
          {INCENTIVE_STATUS_LABELS[incentive.status]}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos del incentivo</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Agencia" value={incentive.agency?.name || "—"} />
                <Field label="Tipo" value={INCENTIVE_TYPE_LABELS[incentive.incentive_type] || incentive.incentive_type} />
                <Field label="Fecha de solicitud" value={formatDateOnly(incentive.request_date)} />
                <Field label="Monto total" value={formatIncentiveAmount(incentive.amount, incentive.currency?.code)} />
                <Field label="Pagar en la nómina de" value={formatDateOnly(incentive.pay_in_payroll_date)} />
                <Field label="Pagado" value={formatDateTime(incentive.paid_at)} />
                <div className="sm:col-span-2">
                  <Field label="Descripción / motivo" value={incentive.description || "—"} />
                </div>
                {incentive.notes && (
                  <div className="sm:col-span-2">
                    <Field label="Notas" value={incentive.notes} />
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Creado por" value={`${userLabel(users[incentive.created_by ?? ""])} · ${formatDateTime(incentive.created_at)}`} />
                {incentive.approved_at && (
                  <Field label="Aprobado por" value={`${userLabel(users[incentive.approved_by ?? ""])} · ${formatDateTime(incentive.approved_at)}`} />
                )}
                {incentive.rejected_at && (
                  <>
                    <Field label="Rechazado por" value={`${userLabel(users[incentive.rejected_by ?? ""])} · ${formatDateTime(incentive.rejected_at)}`} />
                    <Field label="Motivo del rechazo" value={incentive.rejection_reason || "—"} />
                  </>
                )}
                {incentive.receipt_uploaded_at && (
                  <Field
                    label="Comprobante subido por"
                    value={`${userLabel(users[incentive.receipt_uploaded_by ?? ""])} · ${formatDateTime(incentive.receipt_uploaded_at)}`}
                  />
                )}
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          {incentive.status === "pending" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Autorización</CardTitle>
                <CardDescription>Pendiente de autorización por:</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <LoanAuthorizers compact />
                {isAuthorizer && (
                  <>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="pay-date">Pagar en la nómina de</Label>
                      <Input id="pay-date" type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                    </div>
                    <Button onClick={() => decide("approve")} disabled={deciding !== null}>
                      {deciding === "approve" ? <Spinner className="mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
                      Aprobar
                    </Button>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="reject-reason">Motivo del rechazo</Label>
                      <Textarea id="reject-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
                    </div>
                    <Button variant="destructive" onClick={() => decide("reject")} disabled={deciding !== null}>
                      {deciding === "reject" ? <Spinner className="mr-2 h-4 w-4" /> : <X className="mr-2 h-4 w-4" />}
                      Rechazar
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comprobante</CardTitle>
              <CardDescription>PDF o imagen, máximo 10 MB.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {incentive.receipt_pathname ? (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={receiptFileUrl(incentive.receipt_pathname)} target="_blank" rel="noreferrer">
                      <Eye className="mr-2 h-4 w-4" />
                      Ver
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={receiptFileUrl(incentive.receipt_pathname, { filename: incentive.receipt_filename })}>
                      <Download className="mr-2 h-4 w-4" />
                      Descargar
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin comprobante.</p>
              )}
              <input
                ref={fileInput}
                type="file"
                accept={INCENTIVE_RECEIPT_TYPES.join(",")}
                className="sr-only"
                aria-label="Archivo del comprobante"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <Button onClick={() => fileInput.current?.click()} disabled={!canUpload || uploading}>
                {uploading ? <Spinner className="mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                {incentive.receipt_pathname ? "Reemplazar comprobante" : "Subir comprobante"}
              </Button>
              {!canUpload && incentive.status === "pending" && (
                <p className="text-xs text-muted-foreground">Se habilita cuando el incentivo esté aprobado.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm whitespace-pre-wrap">{value}</dd>
    </div>
  )
}
