import { NextRequest, NextResponse } from "next/server"
import { getIncentiveActor } from "@/lib/incentives-server"
import { canManageIncentiveReceipt } from "@/lib/incentives-receipt"
import { INCENTIVE_RECEIPT_TYPES } from "@/lib/incentives"

export const runtime = "nodejs"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const actor = await getIncentiveActor()
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const url = typeof body?.url === "string" ? body.url : ""
  const pathname = typeof body?.pathname === "string" ? body.pathname : ""
  const filename = typeof body?.filename === "string" ? body.filename.slice(0, 255) : null
  const contentType = typeof body?.contentType === "string" ? body.contentType : ""

  let validUrl = false
  try {
    const parsed = new URL(url)
    validUrl =
      parsed.protocol === "https:" &&
      parsed.hostname.endsWith(".blob.vercel-storage.com") &&
      parsed.pathname.replace(/^\//, "") === pathname
  } catch {
    validUrl = false
  }
  if (!validUrl || !pathname.startsWith(`incentives/${id}/`) || !INCENTIVE_RECEIPT_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "Archivo inválido" }, { status: 400 })
  }

  const check = await canManageIncentiveReceipt(actor, id)
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 403 })

  const now = new Date().toISOString()
  const { error } = await actor.service
    .from("incentives")
    .update({
      receipt_url: url,
      receipt_pathname: pathname,
      receipt_filename: filename,
      receipt_content_type: contentType,
      receipt_uploaded_by: actor.userId,
      receipt_uploaded_at: now,
      updated_at: now,
    })
    .eq("id", id)
    .in("status", ["approved", "paid"])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
