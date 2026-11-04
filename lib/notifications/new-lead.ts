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

export interface AssignedProspectEmailData {
  id: string
  contactName: string
  companyName: string | null
  contactPhone: string | null
  contactEmail: string | null
  stageName: string | null
  sourceName: string | null
}

export interface AssignmentEmailInput {
  assignedTo: string
  assignedByName: string
  prospects: AssignedProspectEmailData[]
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

function prospectUrl(prospectId: string): string {
  const appUrl = (process.env.APP_URL || "").replace(/\/$/, "")
  return `${appUrl}/dashboard/crm/prospects/${prospectId}`
}

function openButton(url: string): string {
  return `<a href="${esc(url)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:bold;">Abrir prospecto</a>`
}

function renderLayout(title: string, greeting: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
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
        ${bodyHtml}
      </div>
    </div>
  </div>
</body>
</html>`
}

async function greetingFor(staffId: string): Promise<string> {
  const supabase = createAdminClient()
  const { data: staff } = await supabase
    .from("staff")
    .select("first_name")
    .eq("id", staffId)
    .maybeSingle<{ first_name: string | null }>()
  return staff?.first_name?.trim() ? `Hola ${esc(staff.first_name.trim())},` : "Hola,"
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

    const title = `Nuevo lead: ${input.contactName}`
    const html = renderLayout(
      title,
      await greetingFor(input.assignedTo),
      `<p style="margin:0 0 16px;">Se te asignó un lead nuevo recibido desde <strong>${esc(input.sourceName)}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          ${detailRow("Nombre", input.contactName)}
          ${detailRow("Teléfono", input.contactPhone)}
          ${detailRow("Correo", input.contactEmail)}
          ${detailRow("Empresa", input.companyName)}
          ${detailRow("Mensaje", input.message)}
        </table>
        ${openButton(prospectUrl(input.prospectId))}`,
    )

    await sendEmail({ to, subject: title, html })
  } catch (e) {
    console.error("[notify:new-lead] No se pudo enviar el aviso al asesor:", (e as Error).message)
  }
}

/**
 * Avisa a la asesora que se le asignaron uno o varios prospectos. Con un solo
 * prospecto envía el detalle completo; con varios, un único correo con la lista.
 * Nunca lanza, para no afectar la asignación ya guardada.
 */
export async function notifyAdvisorAssignment(input: AssignmentEmailInput): Promise<void> {
  try {
    if (input.prospects.length === 0) return
    const to = await getNotificationEmail(input.assignedTo)
    if (!to) {
      console.warn(`[notify:assignment] El asesor ${input.assignedTo} no tiene email; no se envía aviso.`)
      return
    }

    const greeting = await greetingFor(input.assignedTo)
    const by = esc(input.assignedByName || "Orbit")
    let title: string
    let body: string

    if (input.prospects.length === 1) {
      const p = input.prospects[0]
      title = `Prospecto asignado: ${p.contactName}`
      body = `<p style="margin:0 0 16px;"><strong>${by}</strong> te asignó un prospecto.</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          ${detailRow("Nombre", p.contactName)}
          ${detailRow("Empresa", p.companyName)}
          ${detailRow("Teléfono", p.contactPhone)}
          ${detailRow("Correo", p.contactEmail)}
          ${detailRow("Etapa", p.stageName)}
          ${detailRow("Fuente", p.sourceName)}
          ${detailRow("Asignado por", input.assignedByName || "Orbit")}
        </table>
        ${openButton(prospectUrl(p.id))}`
    } else {
      title = `Se te asignaron ${input.prospects.length} prospectos`
      const items = input.prospects
        .map(
          (p) => `<div style="border:1px solid #e4e4e7;border-radius:8px;padding:12px 14px;margin-bottom:12px;">
          <table style="width:100%;border-collapse:collapse;margin-bottom:10px;">
            ${detailRow("Nombre", p.contactName)}
            ${detailRow("Empresa", p.companyName)}
            ${detailRow("Teléfono", p.contactPhone)}
            ${detailRow("Correo", p.contactEmail)}
            ${detailRow("Etapa", p.stageName)}
            ${detailRow("Fuente", p.sourceName)}
          </table>
          ${openButton(prospectUrl(p.id))}
        </div>`,
        )
        .join("")
      body = `<p style="margin:0 0 16px;"><strong>${by}</strong> te asignó ${input.prospects.length} prospectos.</p>${items}`
    }

    await sendEmail({ to, subject: title, html: renderLayout(title, greeting, body) })
  } catch (e) {
    console.error("[notify:assignment] No se pudo enviar el aviso de asignación:", (e as Error).message)
  }
}
