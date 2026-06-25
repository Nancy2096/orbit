import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getOAuthClient, GOOGLE_SCOPES } from "@/lib/google"
import { google } from "googleapis"

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const integrationsUrl = `${origin}/dashboard/crm/integrations?tab=communication`

  const code = request.nextUrl.searchParams.get("code")
  const state = request.nextUrl.searchParams.get("state")
  const error = request.nextUrl.searchParams.get("error")

  if (error || !code) {
    return NextResponse.redirect(`${integrationsUrl}&google=error`)
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || state !== user.id) {
    return NextResponse.redirect(`${integrationsUrl}&google=error`)
  }

  try {
    const oauth2Client = getOAuthClient(origin)
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    // Obtener el correo de la cuenta de Google conectada.
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client })
    const { data: profile } = await oauth2.userinfo.get()

    const { error: dbError } = await supabase.from("user_google_connections").upsert(
      {
        user_id: user.id,
        google_email: profile.email ?? null,
        scopes: (tokens.scope as string) || GOOGLE_SCOPES.join(" "),
        access_token: tokens.access_token ?? null,
        refresh_token: tokens.refresh_token ?? null,
        token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        status: "active",
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )

    if (dbError) {
      console.log("[v0] Error guardando conexión de Google:", dbError.message)
      return NextResponse.redirect(`${integrationsUrl}&google=error`)
    }

    return NextResponse.redirect(`${integrationsUrl}&google=connected`)
  } catch (err) {
    console.log("[v0] Error en callback de Google:", err instanceof Error ? err.message : err)
    return NextResponse.redirect(`${integrationsUrl}&google=error`)
  }
}
