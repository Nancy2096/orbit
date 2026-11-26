import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getClientIdsWithQuotation } from "@/lib/client-quotations-server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  // Solo se devuelven IDs de clientes que el usuario puede ver (RLS de `clients`).
  const [withQuotation, visible] = await Promise.all([
    getClientIdsWithQuotation(),
    supabase.from("clients").select("id"),
  ])
  const visibleIds = new Set((visible.data ?? []).map((c) => c.id))
  return NextResponse.json({ clientIds: withQuotation.filter((id) => visibleIds.has(id)) })
}
