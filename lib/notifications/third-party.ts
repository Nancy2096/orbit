import "server-only"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { getNotificationEmail } from "@/lib/notifications/recipients"
import { isOperationsDirectorFor } from "@/lib/bonus-workflow"

export const runtime = "nodejs"

export type ThirdPartyEvent =
  | "created" // Registrado en borrador (status -> draft)
  | "validated" // Validado (status -> validated)
  | "rejected" // Rechazado en validación (status -> rejected)
  | "invoiced" // Factura generada al cliente (status -> invoiced)
  | "paid" // Cliente reembolsó (status -> paid)

/**
 * Cliente con service role (sin sesión ni cookies). Necesario para leer el
 * pago, el staff creador, roles y puestos aunque el llamador no tenga acceso
 * por RLS. Se crea uno por invocación.
 */
function createAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error("[notify:third-party] Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.")
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

interface ThirdPartyRow {
  id: string
  payment_number: string | null
  payment_date: string | null
  description: string | null
  third_party_name: string | null
  third_party_rfc: string | null
  third_party_concept: string | null
  original_amount: number | null
  commission_percentage: number | null
  commission_amount: number | null
  tax_enabled: boolean | null
  tax_rate: number | null
  tax_amount: number | null
  total_amount: number | null
  status: string
  invoice_id: string | null
  created_by: string | null
  created_at: string | null
  validated_at: string | null
  validation_notes: string | null
  rejected_at: string | null
  rejection_reason: string | null
  client: { id: string; company_name: string | null } | { id: string; company_name: string | null }[] | null
  account: { id: string; account_name: string | null } | { id: string; account_name: string | null }[] | null
  project: { id: string; name: string | null } | { id: string; name: string | null }[] | null
  agency: { id: string; name: string | null } | { id: string; name: string | null }[] | null
  currency:
    | { id: string; code: string | null; symbol: string | null }
    | { id: string; code: string | null; symbol: string | null }[]
    | null
  invoice:
    | { id: string; invoice_number: string | null; due_date: string | null }
    | { id: string; invoice_number: string | null; due_date: string | null }[]
    | null
}

// Un mensaje concreto listo para enviar.
export interface ThirdPartyMessage {
  to: string[]
  replyTo?: string
  subject: string
  html: string
}

export interface ThirdPartyNotification {
  messages: ThirdPartyMessage[]
  // Datos crudos para validar el evento contra el estado real en el servidor.
  request: {
    id: string
    status: string
  }
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function formatMoney(amount: number, symbol: string, code?: string): string {
  const base = `${symbol}${Number(amount || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return code ? `${base} ${code}` : base
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return ""
  try {
    return new Date(value).toLocaleString("es-MX", {
      timeZone: "America/Mexico_City",
      dateStyle: "long",
      timeStyle: "short",
    })
  } catch {
    return value
  }
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "-"
  try {
    // Fechas sin hora: se interpretan sin zona para no correrse un día.
    const [y, m, d] = value.slice(0, 10).split("-").map(Number)
    if (y && m && d) {
      return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-MX", {
        timeZone: "UTC",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    }
    return value
  } catch {
    return value
  }
}

const appUrl = (process.env.APP_URL || "").replace(/\/$/, "")

function wrap(title: string, inner: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;">
  <div style="margin:0;padding:24px 12px;background:#f4f4f5;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
      <div style="background:#111827;padding:16px 20px;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;letter-spacing:0.5px;">Orbit</span>
      </div>
      <div style="padding:20px;font-size:15px;line-height:1.55;">
        ${inner}
      </div>
    </div>
  </div>
</body>
</html>`
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:#6b7280;font-size:13px;vertical-align:top;width:150px;">${esc(label)}</td>
    <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;">${value}</td>
  </tr>`
}

// Bloque común con los datos del pago para todas las plantillas.
function paymentDetailRows(p: ThirdPartyRow, opts: { includeInvoice?: boolean } = {}): string {
  const currency = one(p.currency)
  const symbol = currency?.symbol || "$"
  const code = currency?.code || ""
  const client = one(p.client)
  const account = one(p.account)
  const project = one(p.project)
  const agency = one(p.agency)
  const invoice = one(p.invoice)

  const rows: string[] = []
  if (p.payment_number) rows.push(detailRow("N° de pago", esc(p.payment_number)))
  if (client?.company_name) rows.push(detailRow("Cliente", esc(client.company_name)))
  const vendorLine = p.third_party_name
    ? `${p.third_party_name}${p.third_party_rfc ? ` (RFC: ${p.third_party_rfc})` : ""}`
    : "-"
  rows.push(detailRow("Proveedor", esc(vendorLine)))
  const concept = p.third_party_concept || p.description
  if (concept) rows.push(detailRow("Concepto", esc(concept)))
  rows.push(detailRow("Monto original", esc(formatMoney(Number(p.original_amount || 0), symbol, code))))
  rows.push(
    detailRow(
      "Comisión",
      esc(`${formatMoney(Number(p.commission_amount || 0), symbol, code)} (${Number(p.commission_percentage || 0)}%)`),
    ),
  )
  if (p.tax_enabled) rows.push(detailRow("IVA", esc(formatMoney(Number(p.tax_amount || 0), symbol, code))))
  rows.push(detailRow("Total a reembolsar", esc(formatMoney(Number(p.total_amount || 0), symbol, code))))
  if (agency?.name) rows.push(detailRow("Agencia", esc(agency.name)))
  if (account?.account_name) rows.push(detailRow("Cuenta", esc(account.account_name)))
  if (project?.name) rows.push(detailRow("Proyecto", esc(project.name)))
  if (p.payment_date) rows.push(detailRow("Fecha de pago", esc(formatDate(p.payment_date))))

  if (opts.includeInvoice && invoice) {
    if (invoice.invoice_number) rows.push(detailRow("N° factura", esc(invoice.invoice_number)))
    if (invoice.due_date) rows.push(detailRow("Reembolso esperado", esc(formatDate(invoice.due_date))))
  }

  return `<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">${rows.join("")}</table>`
}

function reviewButton(label: string): string {
  const url = `${appUrl}/dashboard/invoices/third-party`
  return `<a href="${url}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;">${esc(label)}</a>`
}

// Resuelve emails a partir de una lista de staffId, omitiendo vacíos y duplicados.
async function emailsFor(staffIds: string[]): Promise<string[]> {
  const out: string[] = []
  const seen = new Set<string>()
  for (const sid of staffIds) {
    const email = await getNotificationEmail(sid)
    if (email && !seen.has(email.toLowerCase())) {
      seen.add(email.toLowerCase())
      out.push(email)
    }
  }
  return out
}

// Lista a la Dirección de Operaciones con el MISMO criterio que payment_requested
// en bonos (director+"operac" o superadmin), SIN contar el acceso global como
// destinatario (isGlobalAccess: false) y sin filtrar por agencia.
async function resolveOperationsDirectors(admin: ReturnType<typeof createAdmin>): Promise<string[]> {
  const { data: staffRows } = await admin
    .from("staff")
    .select("id, user_id, is_active, position:positions(name, level)")
    .eq("is_active", true)

  const rows = staffRows || []
  const userIds = [...new Set(rows.filter((s: any) => s.user_id).map((s: any) => s.user_id))]

  const roleByUser = new Map<string, string | null>()
  if (userIds.length > 0) {
    const { data: userRows } = await admin.from("users").select("id, role:roles(name)").in("id", userIds as string[])
    for (const u of userRows || []) {
      roleByUser.set((u as any).id, one((u as any).role)?.name ?? null)
    }
  }

  const staffIds: string[] = []
  for (const s of rows as any[]) {
    const pos = one(s.position) as { name: string | null; level: string | null } | null
    const roleName = s.user_id ? roleByUser.get(s.user_id) ?? null : null
    if (
      isOperationsDirectorFor({
        positionLevel: pos?.level ?? null,
        positionName: pos?.name ?? null,
        roleName,
        isGlobalAccess: false,
      })
    ) {
      staffIds.push(s.id)
    }
  }
  return staffIds
}

// Resuelve los emails de los usuarios con rol "finanzas".
async function resolveFinanceEmails(admin: ReturnType<typeof createAdmin>): Promise<string[]> {
  const { data: role } = await admin.from("roles").select("id").eq("name", "finanzas").maybeSingle<{ id: string }>()
  if (!role) {
    console.warn("[notify:third-party] No existe el rol 'finanzas'; no se notifica a finanzas.")
    return []
  }

  const { data: users } = await admin.from("users").select("id, email").eq("role_id", role.id)
  const userRows = users || []
  if (userRows.length === 0) return []

  const userIds = userRows.map((u: any) => u.id)
  const { data: staffRows } = await admin.from("staff").select("id, user_id").in("user_id", userIds)
  const staffByUser = new Map<string, string>()
  for (const s of staffRows || []) {
    if ((s as any).user_id) staffByUser.set((s as any).user_id, (s as any).id)
  }

  const out: string[] = []
  const seen = new Set<string>()
  const push = (email: string | null | undefined) => {
    const e = email?.trim()
    if (e && !seen.has(e.toLowerCase())) {
      seen.add(e.toLowerCase())
      out.push(e)
    }
  }

  for (const u of userRows as any[]) {
    const staffId = staffByUser.get(u.id)
    if (staffId) {
      const resolved = await getNotificationEmail(staffId)
      push(resolved || u.email)
    } else {
      push(u.email)
    }
  }

  if (out.length === 0) {
    console.warn("[notify:third-party] No se encontraron emails para el rol 'finanzas'.")
  }
  return out
}

/**
 * Construye las notificaciones de correo para un pago por cuenta de cliente.
 * Devuelve `null` si el pago no existe.
 */
export async function buildThirdPartyNotification(
  id: string,
  event: ThirdPartyEvent,
): Promise<ThirdPartyNotification | null> {
  const admin = createAdmin()

  const { data, error } = await admin
    .from("third_party_payments")
    .select(
      `
      id, payment_number, payment_date, description, third_party_name, third_party_rfc, third_party_concept,
      original_amount, commission_percentage, commission_amount, tax_enabled, tax_rate, tax_amount, total_amount,
      status, invoice_id, created_by, created_at, validated_at, validation_notes, rejected_at, rejection_reason,
      client:clients(id, company_name),
      account:accounts(id, account_name),
      project:projects(id, name),
      agency:agencies(id, name),
      currency:currencies(id, code, symbol),
      invoice:invoices(id, invoice_number, due_date)
    `,
    )
    .eq("id", id)
    .single<ThirdPartyRow>()

  if (error || !data) {
    if (error) console.error("[notify:third-party] No se pudo obtener el pago:", error.message)
    return null
  }

  const requestMeta = { id: data.id, status: data.status }
  const number = data.payment_number || "Pago"
  const client = one(data.client)
  const clientName = client?.company_name || "Cliente"

  // Email del creador (created_by es un staff id). Se resuelve una sola vez.
  const creatorEmail = data.created_by ? (await getNotificationEmail(data.created_by)) || undefined : undefined

  // Los eventos dirigidos al creador comparten la misma lógica de respaldo:
  // si no hay created_by o no se resuelve email, se omite con console.warn.
  const requireCreator = (accion: string): string[] => {
    if (!data.created_by) {
      console.warn(
        `[notify:third-party] El pago ${data.id} no tiene created_by; no se notifica al creador (${accion}).`,
      )
      return []
    }
    if (!creatorEmail) {
      console.warn(
        `[notify:third-party] El creador (${data.created_by}) del pago ${data.id} no tiene email; no se le notifica (${accion}).`,
      )
      return []
    }
    return [creatorEmail]
  }

  // ---- created: a finanzas (quienes validan/facturan); respaldo Dirección de Operaciones. ----
  if (event === "created") {
    let to = await resolveFinanceEmails(admin)
    if (to.length === 0) {
      console.warn(
        `[notify:third-party] Sin rol 'finanzas' para el pago ${data.id}; se usa el respaldo de Dirección de Operaciones.`,
      )
      to = await emailsFor(await resolveOperationsDirectors(admin))
      if (to.length === 0) {
        console.warn(
          `[notify:third-party] El respaldo de Dirección de Operaciones no arrojó destinatarios para ${data.id}.`,
        )
      }
    }
    const inner = `
      <p style="margin:0 0 4px;font-size:17px;font-weight:bold;">Nuevo pago por cuenta de cliente</p>
      <p style="margin:0 0 16px;color:#4b5563;">Se registró un pago por cuenta de ${esc(clientName)} que requiere validación.</p>
      ${paymentDetailRows(data)}
      ${reviewButton("Revisar pago")}
      <p style="margin:18px 0 0;color:#9ca3af;font-size:12px;">Registrado el ${esc(formatTimestamp(data.created_at))}</p>
    `
    return {
      messages: [
        {
          to,
          subject: `[Orbit] Nuevo pago por cuenta de cliente – ${number} · ${clientName}`,
          html: wrap("Nuevo pago por cuenta de cliente", inner),
        },
      ],
      request: requestMeta,
    }
  }

  // ---- validated: al creador. ----
  if (event === "validated") {
    const to = requireCreator("validado")
    const accent = "#16a34a"
    const notesBlock = data.validation_notes?.trim()
      ? `<div style="margin-top:16px;padding:12px 14px;background:#f9fafb;border-left:3px solid ${accent};border-radius:4px;">
           <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.4px;">Notas de validación</p>
           <p style="margin:0;color:#111827;font-size:14px;">${esc(data.validation_notes.trim())}</p>
         </div>`
      : ""
    const inner = `
      <p style="margin:0 0 4px;font-size:17px;font-weight:bold;">Tu pago fue <span style="color:${accent};">validado</span></p>
      <p style="margin:0 0 16px;color:#4b5563;">El pago ${esc(number)} por cuenta de ${esc(clientName)} fue validado y está listo para facturar.</p>
      ${paymentDetailRows(data)}
      ${notesBlock}
      <p style="margin:18px 0 0;"></p>
      ${reviewButton("Ver pago")}
    `
    return {
      messages: [
        {
          to,
          subject: `[Orbit] Pago validado – ${number} · ${clientName}`,
          html: wrap("Pago validado", inner),
        },
      ],
      request: requestMeta,
    }
  }

  // ---- rejected: al creador, con el motivo. ----
  if (event === "rejected") {
    const to = requireCreator("rechazado")
    const accent = "#dc2626"
    const reasonBlock = data.rejection_reason?.trim()
      ? `<div style="margin-top:16px;padding:12px 14px;background:#f9fafb;border-left:3px solid ${accent};border-radius:4px;">
           <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.4px;">Motivo del rechazo</p>
           <p style="margin:0;color:#111827;font-size:14px;">${esc(data.rejection_reason.trim())}</p>
         </div>`
      : ""
    const inner = `
      <p style="margin:0 0 4px;font-size:17px;font-weight:bold;">Tu pago fue <span style="color:${accent};">rechazado</span></p>
      <p style="margin:0 0 16px;color:#4b5563;">El pago ${esc(number)} por cuenta de ${esc(clientName)} fue rechazado en validación.</p>
      ${paymentDetailRows(data)}
      ${reasonBlock}
    `
    return {
      messages: [
        {
          to,
          subject: `[Orbit] Pago rechazado – ${number} · ${clientName}`,
          html: wrap("Pago rechazado", inner),
        },
      ],
      request: requestMeta,
    }
  }

  // ---- invoiced: al creador. ----
  if (event === "invoiced") {
    const to = requireCreator("facturado")
    const accent = "#2563eb"
    const inner = `
      <p style="margin:0 0 4px;font-size:17px;font-weight:bold;">Se generó la <span style="color:${accent};">factura</span> del pago</p>
      <p style="margin:0 0 16px;color:#4b5563;">Se emitió la factura al cliente ${esc(clientName)} por el pago ${esc(number)}. En espera del reembolso.</p>
      ${paymentDetailRows(data, { includeInvoice: true })}
      ${reviewButton("Ver pago")}
    `
    return {
      messages: [
        {
          to,
          subject: `[Orbit] Factura generada – ${number} · ${clientName}`,
          html: wrap("Factura generada", inner),
        },
      ],
      request: requestMeta,
    }
  }

  // ---- paid: al creador (cliente reembolsó). ----
  const to = requireCreator("reembolsado")
  const accent = "#16a34a"
  const inner = `
    <p style="margin:0 0 4px;font-size:17px;font-weight:bold;">El cliente <span style="color:${accent};">reembolsó</span> el pago</p>
    <p style="margin:0 0 16px;color:#4b5563;">${esc(clientName)} reembolsó el pago ${esc(number)}. La operación queda cerrada.</p>
    ${paymentDetailRows(data, { includeInvoice: true })}
    ${reviewButton("Ver pago")}
  `
  return {
    messages: [
      {
        to,
        subject: `[Orbit] Pago reembolsado por el cliente – ${number} · ${clientName}`,
        html: wrap("Pago reembolsado", inner),
      },
    ],
    request: requestMeta,
  }
}
