import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { createClient } from "@/lib/supabase/server"

// Gestiona el token del webhook de captura de leads por agencia.
// GET  ?agencyId=...  -> devuelve el token existente (lo crea si no existe)
// POST { agencyId }    -> regenera el token
export const dynamic = "force-dynamic"

function generateToken() {
  return randomBytes(24).toString("hex")
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const agencyId = new URL(request.url).searchParams.get("agencyId")
  if (!agencyId) {
    return NextResponse.json({ error: "agencyId requerido" }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from("crm_inbound_webhooks")
    .select("token")
    .eq("agency_id", agencyId)
    .maybeSingle()

  if (existing?.token) {
    return NextResponse.json({ token: existing.token })
  }

  const token = generateToken()
  const { error } = await supabase
    .from("crm_inbound_webhooks")
    .insert({ agency_id: agencyId, token })
  if (error) {
    return NextResponse.json({ error: "No se pudo crear el token" }, { status: 500 })
  }
  return NextResponse.json({ token })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { agencyId } = (await request.json().catch(() => ({}))) as { agencyId?: string }
  if (!agencyId) {
    return NextResponse.json({ error: "agencyId requerido" }, { status: 400 })
  }

  const token = generateToken()
  const { error } = await supabase
    .from("crm_inbound_webhooks")
    .upsert(
      { agency_id: agencyId, token, updated_at: new Date().toISOString() },
      { onConflict: "agency_id" },
    )
  if (error) {
    return NextResponse.json({ error: "No se pudo regenerar el token" }, { status: 500 })
  }
  return NextResponse.json({ token })
}
