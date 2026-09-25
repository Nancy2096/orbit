import "server-only"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { getNotificationEmail } from "@/lib/notifications/recipients"
import { isOperationsDirectorFor } from "@/lib/bonus-workflow"

export const runtime = "nodejs"

export type ExpenseEvent =
  | "submitted" // Enviado a aprobación (status -> pending)
  | "approved" // Aprobado (incluida la auto-aprobación) (status -> approved)
  | "rejected" // Rechazado (status -> rejected)
  | "paid" // Marcado como pagado (status -> paid)

/**
 * Cliente con service role (sin sesión ni cookies). Necesario para leer el
 * gasto, recorrer la cadena de `reports_to_id` y listar roles/puestos aunque el
 * llamador no tenga acceso por RLS. Se crea uno por invocación.
 */
function createAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error("[notify:expense] Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.")
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

interface StaffRef {
  id: string
  first_name: string | null
  last_name: string | null
}

interface ExpenseRow {
  id: string
  expense_number: string | null
  description: string | null
  amount: number | null
  tax_amount: number | null
  total_amount: number | null
  status: string
  approval_status: string | null
  start_date: string | null
  end_date: string | null
  payment_date: string | null
  created_at: string | null
  approved_at: string | null
  rejection_reason: string | null
  receipt_url: string | null
  payment_receipt_url: string | null
  bank_account_id: string | null
  vendor_name: string | null
  invoice_number: string | null
  approver_id: string | null
  requested_by_id: string | null
  category:
    | { id: string; name: string | null; expense_type?: string | null }
    | { id: string; name: string | null; expense_type?: string | null }[]
    | null
  agency: { id: string; name: string | null } | { id: string; name: string | null }[] | null
  currency: { id: string; code: string | null; symbol: string | null } | { id: string; code: string | null; symbol: string | null }[] | null
  project: { id: string; name: string | null } | { id: string; name: string | null }[] | null
  account: { id: string; account_name: string | null } | { id: string; account_name: string | null }[] | null
  vendor: { id: string; name: string | null } | { id: string; name: string | null }[] | null
  requested_by: StaffRef | StaffRef[] | null
  approved_by: StaffRef | StaffRef[] | null
}

// Un mensaje concreto listo para enviar.
export interface ExpenseMessage {
  to: string[]
  replyTo?: string
  subject: string
  html: string
}

export interface ExpenseNotification {
  // El evento puede producir varios correos (p. ej. "approved" avisa al
  // solicitante y, por separado, a finanzas).
  messages: ExpenseMessage[]
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

function fullName(staff: Pick<StaffRef, "first_name" | "last_name"> | null): string {
  if (!staff) return "Empleado"
  return `${staff.first_name ?? ""} ${staff.last_name ?? ""}`.trim() || "Empleado"
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

const expenseTypeLabels: Record<string, string> = {
  fixed: "Gastos Operativos fijos",
  variable: "Gastos Operativos Variables",
  marketing: "Marketing y Ventas",
  financial: "Impuestos y Pagos Financieros",
}

function formatMoney(amount: number, symbol: string): string {
  return `${symbol}${Number(amount || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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

// Convierte una ruta de blob privado en un enlace absoluto que pasa por /api/file.
function receiptUrlAbs(receiptUrl: string | null): string | null {
  if (!receiptUrl) return null
  // En gastos, receipt_url guarda directamente el pathname del blob.
  const pathname = receiptUrl.replace(/^\//, "")
  return `${appUrl}/api/file?pathname=${encodeURIComponent(pathname)}`
}

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
    <td style="padding:6px 0;color:#6b7280;font-size:13px;vertical-align:top;width:140px;">${esc(label)}</td>
    <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;">${value}</td>
  </tr>`
}

// Bloque común con los datos del gasto para todas las plantillas.
function expenseDetailRows(exp: ExpenseRow, opts: { includePayment?: boolean } = {}): string {
  const currency = one(exp.currency)
  const symbol = currency?.symbol || "$"
  const category = one(exp.category)
  const agency = one(exp.agency)
  const project = one(exp.project)
  const account = one(exp.account)
  const vendor = one(exp.vendor)
  const requester = one(exp.requested_by)
  const approver = one(exp.approved_by)

  const rows: string[] = []
  if (exp.expense_number) rows.push(detailRow("N° de gasto", esc(exp.expense_number)))
  rows.push(detailRow("Concepto", esc(exp.description || "-")))
  rows.push(detailRow("Monto total", esc(formatMoney(Number(exp.total_amount || 0), symbol))))
  rows.push(
    detailRow(
      "Subtotal / IVA",
      esc(`${formatMoney(Number(exp.amount || 0), symbol)} / ${formatMoney(Number(exp.tax_amount || 0), symbol)}`),
    ),
  )
  if (agency?.name) rows.push(detailRow("Agencia", esc(agency.name)))
  if (category?.name) {
    const type = category.expense_type ? ` (${expenseTypeLabels[category.expense_type] || category.expense_type})` : ""
    rows.push(detailRow("Categoría", esc(`${category.name}${type}`)))
  }
  const vendorName = vendor?.name || exp.vendor_name
  if (vendorName) rows.push(detailRow("Proveedor", esc(vendorName)))
  if (project?.name) rows.push(detailRow("Proyecto", esc(project.name)))
  if (account?.account_name) rows.push(detailRow("Cuenta", esc(account.account_name)))
  if (exp.invoice_number) rows.push(detailRow("N° factura", esc(exp.invoice_number)))
  if (requester) rows.push(detailRow("Solicitante", esc(fullName(requester))))
  if (approver) rows.push(detailRow("Aprobado por", esc(fullName(approver))))

  const receipt = receiptUrlAbs(exp.receipt_url)
  if (receipt) {
    rows.push(detailRow("Comprobante", `<a href="${receipt}" style="color:#2563eb;text-decoration:underline;">Ver comprobante</a>`))
  }

  if (opts.includePayment) {
    if (exp.payment_date) rows.push(detailRow("Fecha de pago", esc(formatDate(exp.payment_date))))
    const payReceipt = exp.payment_receipt_url
    if (payReceipt) {
      rows.push(
        detailRow(
          "Comprobante de pago",
          `<a href="${payReceipt}" style="color:#2563eb;text-decoration:underline;">Ver comprobante de pago</a>`,
        ),
      )
    }
  }

  return `<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">${rows.join("")}</table>`
}

function reviewButton(expenseId: string, label: string): string {
  const url = `${appUrl}/dashboard/expenses/${expenseId}`
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

/**
 * Destinatarios del evento "submitted" (quienes pueden aprobar el gasto):
 *  1. El `approver_id` del gasto, si existe, está activo y tiene usuario.
 *  2. Si no, se sube por la cadena `reports_to_id` del solicitante hasta el
 *     primer jefe válido (existente, activo y con usuario). SIN filtrar por agencia.
 *  3. Si tampoco hay, la Dirección de Operaciones (mismo criterio que bonos).
 * Registra un console.warn cuando se usa el respaldo (pasos 2 o 3).
 */
async function resolveApprovalRecipients(
  admin: ReturnType<typeof createAdmin>,
  expense: ExpenseRow,
): Promise<string[]> {
  const { data: rows } = await admin
    .from("staff")
    .select("id, first_name, last_name, reports_to_id, is_active, user_id")

  const byId = new Map((rows || []).map((s: any) => [s.id, s]))
  const isValid = (s: any) => !!s && s.is_active && s.user_id

  // 1) approver_id explícito.
  if (expense.approver_id) {
    const approver = byId.get(expense.approver_id)
    if (isValid(approver)) {
      return emailsFor([approver.id])
    }
  }

  // 2) Cadena reports_to_id del solicitante.
  if (expense.requested_by_id) {
    const requester = byId.get(expense.requested_by_id)
    if (requester) {
      const visited = new Set<string>()
      let nextId: string | null | undefined = requester.reports_to_id
      while (nextId && !visited.has(nextId)) {
        visited.add(nextId)
        const node = byId.get(nextId)
        if (!node) break
        if (isValid(node)) {
          console.warn(
            `[notify:expense] El gasto ${expense.id} no tiene aprobador válido; se usa el respaldo por la cadena reports_to_id (${fullName(node)}).`,
          )
          return emailsFor([node.id])
        }
        nextId = node.reports_to_id
      }
    }
  }

  // 3) Dirección de Operaciones.
  console.warn(
    `[notify:expense] El gasto ${expense.id} no tiene aprobador ni jefe válido; se usa el respaldo de Dirección de Operaciones.`,
  )
  const ops = await emailsFor(await resolveOperationsDirectors(admin))
  if (ops.length === 0) {
    console.warn(`[notify:expense] El respaldo de Dirección de Operaciones no arrojó destinatarios para ${expense.id}.`)
  }
  return ops
}

// Resuelve los emails de los usuarios con rol "finanzas".
async function resolveFinanceEmails(admin: ReturnType<typeof createAdmin>): Promise<string[]> {
  const { data: role } = await admin.from("roles").select("id").eq("name", "finanzas").maybeSingle<{ id: string }>()
  if (!role) {
    console.warn("[notify:expense] No existe el rol 'finanzas'; no se notifica a finanzas.")
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
      // Preferir el email resuelto por getNotificationEmail (users -> auth.users).
      const resolved = await getNotificationEmail(staffId)
      push(resolved || u.email)
    } else {
      push(u.email)
    }
  }

  if (out.length === 0) {
    console.warn("[notify:expense] No se encontraron emails para el rol 'finanzas'.")
  }
  return out
}

/**
 * Construye las notificaciones de correo para un gasto.
 * Devuelve `null` si el gasto no existe.
 */
export async function buildExpenseNotification(
  id: string,
  event: ExpenseEvent,
): Promise<ExpenseNotification | null> {
  const admin = createAdmin()

  const { data, error } = await admin
    .from("expenses")
    .select(
      `
      id, expense_number, description, amount, tax_amount, total_amount, status, approval_status,
      start_date, end_date, payment_date, created_at, approved_at, rejection_reason,
      receipt_url, payment_receipt_url, bank_account_id, vendor_name, invoice_number,
      approver_id, requested_by_id,
      category:expense_categories(id, name, expense_type),
      agency:agencies(id, name),
      currency:currencies(id, code, symbol),
      project:projects(id, name),
      account:accounts(id, account_name),
      vendor:vendors(id, name),
      requested_by:staff!expenses_requested_by_id_fkey(id, first_name, last_name),
      approved_by:staff!expenses_approved_by_id_fkey(id, first_name, last_name)
    `,
    )
    .eq("id", id)
    .single<ExpenseRow>()

  if (error || !data) {
    if (error) console.error("[notify:expense] No se pudo obtener el gasto:", error.message)
    return null
  }

  const requestMeta = { id: data.id, status: data.status }
  const number = data.expense_number || "Gasto"
  const requester = one(data.requested_by)
  const requesterName = fullName(requester)
  const requesterEmail = data.requested_by_id ? (await getNotificationEmail(data.requested_by_id)) || undefined : undefined

  // ---- submitted: a quienes pueden aprobar (approver -> cadena -> ops). ----
  if (event === "submitted") {
    const to = await resolveApprovalRecipients(admin, data)
    const inner = `
      <p style="margin:0 0 4px;font-size:17px;font-weight:bold;">Nuevo gasto por aprobar</p>
      <p style="margin:0 0 16px;color:#4b5563;">${esc(requesterName)} registró un gasto que requiere tu aprobación.</p>
      ${expenseDetailRows(data)}
      ${reviewButton(data.id, "Revisar gasto")}
      <p style="margin:18px 0 0;color:#9ca3af;font-size:12px;">Registrado el ${esc(formatTimestamp(data.created_at))}.</p>
    `
    return {
      messages: [
        {
          to,
          replyTo: requesterEmail,
          subject: `[Orbit] Nuevo gasto por aprobar – ${number} · ${requesterName}`,
          html: wrap("Nuevo gasto por aprobar", inner),
        },
      ],
      request: requestMeta,
    }
  }

  // ---- approved: al solicitante (salvo auto-aprobación) + a finanzas. ----
  if (event === "approved") {
    const messages: ExpenseMessage[] = []
    const isSelfApproval = !!data.approver_id && data.approver_id === data.requested_by_id

    if (!isSelfApproval) {
      if (requesterEmail) {
        const accent = "#16a34a"
        const inner = `
          <p style="margin:0 0 4px;font-size:17px;font-weight:bold;">Tu gasto fue <span style="color:${accent};">aprobado</span></p>
          <p style="margin:0 0 16px;color:#4b5563;">Hola ${esc(requesterName)}, tu gasto ${esc(number)} fue aprobado.</p>
          ${expenseDetailRows(data)}
          ${data.approved_at ? `<p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">Aprobado el ${esc(formatTimestamp(data.approved_at))}.</p>` : ""}
        `
        messages.push({
          to: [requesterEmail],
          subject: `[Orbit] Tu gasto fue aprobado – ${number}`,
          html: wrap("Tu gasto fue aprobado", inner),
        })
      } else {
        console.warn(
          `[notify:expense] El solicitante (${data.requested_by_id}) no tiene email; no se le notifica la aprobación del gasto ${data.id}.`,
        )
      }
    }

    // Aviso a finanzas: hay un gasto aprobado pendiente de pago.
    const financeTo = await resolveFinanceEmails(admin)
    if (financeTo.length > 0) {
      const inner = `
        <p style="margin:0 0 4px;font-size:17px;font-weight:bold;">Gasto aprobado pendiente de pago</p>
        <p style="margin:0 0 16px;color:#4b5563;">El gasto ${esc(number)} de ${esc(requesterName)} fue aprobado y está pendiente de pago.</p>
        ${expenseDetailRows(data)}
        ${reviewButton(data.id, "Ver gasto")}
      `
      messages.push({
        to: financeTo,
        replyTo: requesterEmail,
        subject: `[Orbit] Gasto aprobado pendiente de pago – ${number} · ${requesterName}`,
        html: wrap("Gasto aprobado pendiente de pago", inner),
      })
    }

    return { messages, request: requestMeta }
  }

  // ---- rejected: al solicitante, con el motivo. ----
  if (event === "rejected") {
    if (!requesterEmail) {
      console.warn(
        `[notify:expense] El solicitante (${data.requested_by_id}) no tiene email; no se le notifica el rechazo del gasto ${data.id}.`,
      )
      return { messages: [], request: requestMeta }
    }
    const accent = "#dc2626"
    const reasonBlock = data.rejection_reason?.trim()
      ? `<div style="margin-top:16px;padding:12px 14px;background:#f9fafb;border-left:3px solid ${accent};border-radius:4px;">
           <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.4px;">Motivo del rechazo</p>
           <p style="margin:0;color:#111827;font-size:14px;">${esc(data.rejection_reason.trim())}</p>
         </div>`
      : ""
    const inner = `
      <p style="margin:0 0 4px;font-size:17px;font-weight:bold;">Tu gasto fue <span style="color:${accent};">rechazado</span></p>
      <p style="margin:0 0 16px;color:#4b5563;">Hola ${esc(requesterName)}, tu gasto ${esc(number)} fue rechazado.</p>
      ${expenseDetailRows(data)}
      ${reasonBlock}
    `
    return {
      messages: [
        {
          to: [requesterEmail],
          subject: `[Orbit] Tu gasto fue rechazado – ${number}`,
          html: wrap("Tu gasto fue rechazado", inner),
        },
      ],
      request: requestMeta,
    }
  }

  // ---- paid: al solicitante. ----
  if (!requesterEmail) {
    console.warn(
      `[notify:expense] El solicitante (${data.requested_by_id}) no tiene email; no se le notifica el pago del gasto ${data.id}.`,
    )
    return { messages: [], request: requestMeta }
  }
  const accent = "#2563eb"
  const inner = `
    <p style="margin:0 0 4px;font-size:17px;font-weight:bold;">Tu gasto fue <span style="color:${accent};">pagado</span></p>
    <p style="margin:0 0 16px;color:#4b5563;">Hola ${esc(requesterName)}, tu gasto ${esc(number)} fue marcado como pagado.</p>
    ${expenseDetailRows(data, { includePayment: true })}
  `
  return {
    messages: [
      {
        to: [requesterEmail],
        subject: `[Orbit] Tu gasto fue pagado – ${number}`,
        html: wrap("Tu gasto fue pagado", inner),
      },
    ],
    request: requestMeta,
  }
}
