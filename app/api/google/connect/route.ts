import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getOAuthClient, GOOGLE_SCOPES, googleConfigured } from "@/lib/google"

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const integrationsUrl = `${origin}/dashboard/crm/integrations?tab=google_suite`

  if (!googleConfigured()) {
    return NextResponse.redirect(`${integrationsUrl}&google=not_configured`)
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/auth/login`)
  }

  const oauth2Client = getOAuthClient(origin)

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES,
    state: user.id,
  })

  return NextResponse.redirect(authUrl)
}
