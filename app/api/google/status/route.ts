import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { googleConfigured } from "@/lib/google"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ connected: false, configured: googleConfigured() }, { status: 200 })
  }

  const { data } = await supabase
    .from("user_google_connections")
    .select("google_email, scopes, status, last_sync")
    .eq("user_id", user.id)
    .maybeSingle()

  return NextResponse.json({
    configured: googleConfigured(),
    connected: Boolean(data && data.status === "active"),
    email: data?.google_email ?? null,
    scopes: data?.scopes ?? null,
    lastSync: data?.last_sync ?? null,
  })
}
