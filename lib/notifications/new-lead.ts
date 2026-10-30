import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { sendEmail } from "@/lib/email"
import { getNotificationEmail } from "@/lib/notifications/recipients"

export interface NewLeadEmailInput {
  prospectId: string
  assignedTo: string
  sourceName: string
  contactName: string
  contactEmail: string | null
  contactPhone: string | null
  companyName: string | null
  message: string | null
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function detailRow(label: string, value: string | null): string {
  return `<tr>
    <td style="padding:6px 0;color:#6b7280;font-size:13px;vertical-align:top;width:110px;">${esc(label)}</td>
    <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;white-space:pre-wrap;">${value ? esc(value) : "—"}</td>
  </tr>`
}

/**
 * Avisa al asesor asignado que recibió un lead nuevo. Nunca lanza: cualquier
 * error se registra en consola para no afectar la creación del prospecto.
 */
export async function notifyAdvisorNewLead(input: NewLeadEmailInput): Promise<void> {
  try {
    const to = await getNotificationEmail(input.assignedTo)
    if (!to) {
      console.warn(`[notify:new-lead] El asesor ${input.assignedTo} no tiene email; no se envía aviso.`)
      return
    }

    const supabase = createAdminClient()
    const { data: staff } = await supabase
      .from("staff")
      .select("first_name")
      .eq("id", input.assignedTo)
      .maybeSingle<{ first_name: string | null }>()

    const appUrl = (process.env.APP_URL || "").replace(/\/$/, "")
    const prospectUrl = `${appUrl}/dashboard/crm/prospects/${input.prospectId}`
    const greeting = staff?.first_name?.trim() ? `Hola ${esc(staff.first_name.trim())},` : "Hola,"
    const title = `Nuevo lead: ${input.contactName}`

    const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;">
  <div style="margin:0;padding:24px 12px;background:#f4f4f5;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
      <div style="background:#111827;padding:16px 20px;">
        <span style="color:#ffffff;font-size:16px;font-weight:bold;letter-spacing:0.5px;">Orbit</span>
      </div>
      <div style="padding:20px;font-size:15px;line-height:1.55;">
        <p style="margin:0 0 12px;">${greeting}</p>
        <p style="margin:0 0 16px;">Se te asignó un lead nuevo recibido desde <strong>${esc(input.sourceName)}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          ${detailRow("Nombre", input.contactName)}
          ${detailRow("Teléfono", input.contactPhone)}
          ${detailRow("Correo", input.contactEmail)}
          ${detailRow("Empresa", input.companyName)}
          ${detailRow("Mensaje", input.message)}
        </table>
        <a href="${esc(prospectUrl)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:bold;">Abrir prospecto</a>
      </div>
    </div>
  </div>
</body>
</html>`

    await sendEmail({ to, subject: title, html })
  } catch (e) {
    console.error("[notify:new-lead] No se pudo enviar el aviso al asesor:", (e as Error).message)
  }
}
