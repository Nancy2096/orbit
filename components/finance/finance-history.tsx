"use client"

import useSWR, { mutate } from "swr"
import {
  History,
  FilePlus2,
  Pencil,
  ArrowRightLeft,
  BadgeCheck,
  Send,
  Mail,
  Receipt,
  Banknote,
  Trash2,
  type LucideIcon,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

export type FinanceEntityType = "pre_invoice" | "invoice" | "third_party_payment" | "expense"

export const financeHistoryKey = (type: FinanceEntityType, id: string) => ["finance-history", type, id] as const

export function refreshFinanceHistory(type: FinanceEntityType, id: string) {
  return mutate(financeHistoryKey(type, id))
}

interface HistoryUser {
  first_name: string | null
  last_name: string | null
  email: string | null
}

interface HistoryRow {
  id: string
  action: string
  description: string
  details: { changes?: { field: string; from: string | null; to: string | null }[]; backfilled?: boolean } | null
  created_at: string
  user: HistoryUser | null
}

const ACTION_META: Record<string, { label: string; icon: LucideIcon; tone: string }> = {
  created: { label: "Creación", icon: FilePlus2, tone: "bg-primary/10 text-primary" },
  edited: { label: "Edición", icon: Pencil, tone: "bg-muted text-foreground" },
  status_changed: { label: "Cambio de estado", icon: ArrowRightLeft, tone: "bg-amber-100 text-amber-800" },
  approval_changed: { label: "Autorización", icon: BadgeCheck, tone: "bg-emerald-100 text-emerald-800" },
  submitted: { label: "Solicitud de aprobación", icon: Send, tone: "bg-muted text-foreground" },
  email_sent: { label: "Envío por correo", icon: Mail, tone: "bg-muted text-foreground" },
  invoiced: { label: "Facturación", icon: Receipt, tone: "bg-primary/10 text-primary" },
  payment_registered: { label: "Pago", icon: Banknote, tone: "bg-emerald-100 text-emerald-800" },
  payment_updated: { label: "Pago modificado", icon: Banknote, tone: "bg-amber-100 text-amber-800" },
  payment_deleted: { label: "Pago eliminado", icon: Trash2, tone: "bg-destructive/10 text-destructive" },
}

const FALLBACK_META = { label: "Movimiento", icon: History, tone: "bg-muted text-foreground" }

const FIELD_LABELS: Record<string, string> = {
  account_id: "Cuenta",
  amount: "Monto",
  approved_at: "Fecha de aprobación",
  approved_by: "Aprobado por",
  approved_by_id: "Aprobado por",
  approver_id: "Aprobador",
  bank_account_id: "Cuenta bancaria",
  category_id: "Categoría",
  cfdi_use: "Uso de CFDI",
  client_id: "Cliente",
  commission_amount: "Comisión",
  commission_percentage: "% de comisión",
  currency: "Moneda",
  currency_id: "Moneda",
  description: "Descripción",
  discount_amount: "Descuento",
  due_date: "Fecha de vencimiento",
  end_date: "Fecha fin",
  exchange_rate: "Tipo de cambio",
  expense_date: "Fecha del gasto",
  expense_number: "Folio",
  internal_notes: "Notas internas",
  invoice_id: "Factura",
  invoice_number: "Número de factura",
  is_billable: "Facturable",
  is_operational: "Operativo",
  is_reimbursable: "Reembolsable",
  issue_date: "Fecha de emisión",
  notes: "Notas",
  original_amount: "Monto original",
  paid_amount: "Monto pagado",
  balance_due: "Saldo pendiente",
  paid_at: "Fecha de pago",
  payment_date: "Fecha de pago",
  payment_method: "Método de pago",
  payment_notes: "Notas de pago",
  payment_number: "Folio",
  payment_receipt_uploaded_at: "Comprobante de pago subido",
  payment_receipt_url: "Comprobante de pago",
  payment_reference: "Referencia de pago",
  payment_terms: "Días de crédito",
  period_label: "Periodo",
  period_start: "Inicio del periodo",
  pre_invoice_number: "Folio",
  project_id: "Proyecto",
  receipt_url: "Comprobante",
  rejected_at: "Fecha de rechazo",
  rejected_by: "Rechazado por",
  rejection_reason: "Motivo de rechazo",
  requested_by_id: "Solicitante",
  start_date: "Fecha inicio",
  subtotal: "Subtotal",
  tax: "IVA",
  tax_amount: "IVA",
  tax_enabled: "IVA habilitado",
  tax_rate: "Tasa de IVA",
  third_party_concept: "Concepto del tercero",
  third_party_name: "Nombre del tercero",
  third_party_payment_id: "Pago por cuenta de cliente",
  third_party_rfc: "RFC del tercero",
  total: "Total",
  total_amount: "Total",
  validated_at: "Fecha de validación",
  validated_by: "Validado por",
  validation_notes: "Notas de validación",
  vendor_id: "Proveedor",
  vendor_name: "Proveedor",
}

const HIDDEN_VALUE_FIELDS = new Set([
  "account_id",
  "bank_account_id",
  "category_id",
  "client_id",
  "currency_id",
  "invoice_id",
  "project_id",
  "vendor_id",
  "requested_by_id",
  "approved_by",
  "approved_by_id",
  "approver_id",
  "validated_by",
  "rejected_by",
  "third_party_payment_id",
  "receipt_url",
  "payment_receipt_url",
])

function formatValue(field: string, value: string | null): string {
  if (value === null || value === "") return "—"
  if (value === "true") return "Sí"
  if (value === "false") return "No"
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) return d.toLocaleString("es-MX")
  }
  return value
}

function userLabel(u: HistoryUser | null): string {
  if (!u) return "Sistema / usuario no identificado"
  const name = `${u.first_name || ""} ${u.last_name || ""}`.trim()
  return name || u.email || "Usuario desconocido"
}

const dateFormatter = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" })
const timeFormatter = new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

const ENTITY_LABEL: Record<FinanceEntityType, string> = {
  pre_invoice: "esta prefactura",
  invoice: "esta factura",
  third_party_payment: "este pago por cuenta de cliente",
  expense: "este gasto",
}

export function FinanceHistory({
  entityType,
  entityId,
  bare = false,
}: {
  entityType: FinanceEntityType
  entityId: string
  bare?: boolean
}) {
  const { data, error, isLoading } = useSWR(financeHistoryKey(entityType, entityId), async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("finance_history")
      .select("id, action, description, details, created_at, user:users!user_id(first_name, last_name, email)")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
    if (error) throw error
    return (data as unknown as HistoryRow[]) || []
  })

  const content = isLoading ? (
    <div className="flex justify-center py-6">
      <Spinner className="h-6 w-6" />
    </div>
  ) : error ? (
    <p className="py-4 text-center text-sm text-destructive">No se pudo cargar el histórico.</p>
  ) : !data || data.length === 0 ? (
    <p className="py-4 text-center text-sm text-muted-foreground">Aún no hay movimientos registrados.</p>
  ) : (
    <ol className="relative ml-3 space-y-4 border-l pl-6">
      {data.map((row) => {
        const meta = ACTION_META[row.action] ?? FALLBACK_META
        const Icon = meta.icon
        const date = new Date(row.created_at)
        const changes = (row.details?.changes ?? []).filter((c) => !c.field.startsWith("email_"))
        return (
          <li key={row.id} className="relative">
            <span
              className={`absolute -left-[37px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background ${meta.tone}`}
              aria-hidden="true"
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium text-pretty">{row.description}</p>
                {changes.length > 0 && (
                  <ul className="space-y-0.5 text-xs text-muted-foreground">
                    {changes.map((c, i) => (
                      <li key={i} className="break-words">
                        <span className="font-medium text-foreground">{FIELD_LABELS[c.field] ?? c.field}</span>
                        {HIDDEN_VALUE_FIELDS.has(c.field) ? (
                          " actualizado"
                        ) : (
                          <>
                            {": "}
                            {formatValue(c.field, c.from)}
                            {" → "}
                            {formatValue(c.field, c.to)}
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{userLabel(row.user)}</span>
                  {" · "}
                  {meta.label}
                </p>
              </div>
              <time dateTime={row.created_at} className="shrink-0 text-xs tabular-nums text-muted-foreground sm:text-right">
                <span className="block">{dateFormatter.format(date)}</span>
                <span className="block">{timeFormatter.format(date)}</span>
              </time>
            </div>
          </li>
        )
      })}
    </ol>
  )

  if (bare) {
    return (
      <section aria-labelledby={`history-${entityId}`} className="space-y-3">
        <h3 id={`history-${entityId}`} className="flex items-center gap-2 font-semibold">
          <History className="h-4 w-4" />
          Histórico
        </h3>
        {content}
      </section>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Histórico
        </CardTitle>
        <CardDescription>
          Registro de todo lo que ha sucedido con {ENTITY_LABEL[entityType]}: quién lo creó, quién lo autorizó y cada
          cambio, con fecha y hora.
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}
