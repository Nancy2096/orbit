import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// Admin client with service role key (server-only, never exposed to the browser)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params

    // 1. Verify the caller is authenticated
    const supabase = await createServerClient()
    const {
      data: { user: caller },
    } = await supabase.auth.getUser()

    if (!caller) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // 2. Verify the caller is a super administrator
    const { data: callerProfile } = await supabase
      .from("users")
      .select("role:roles(name)")
      .eq("id", caller.id)
      .single()

    const callerRole = (callerProfile?.role as { name: string } | null)?.name
    if (callerRole !== "superadmin") {
      return NextResponse.json(
        { error: "Solo el super administrador puede modificar credenciales" },
        { status: 403 }
      )
    }

    // 3. Validate payload
    const body = await request.json()
    const { email, password } = body as { email?: string; password?: string }

    if (!email && !password) {
      return NextResponse.json(
        { error: "Debes proporcionar un nuevo correo o una nueva contraseña" },
        { status: 400 }
      )
    }

    const updates: { email?: string; password?: string } = {}

    if (email !== undefined) {
      if (!isValidEmail(email)) {
        return NextResponse.json({ error: "El correo electrónico no es válido" }, { status: 400 })
      }
      updates.email = email
    }

    if (password !== undefined) {
      if (typeof password !== "string" || password.length < 8) {
        return NextResponse.json(
          { error: "La contraseña debe tener al menos 8 caracteres" },
          { status: 400 }
        )
      }
      updates.password = password
    }

    // 4. Update credentials in auth.users via the admin API
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
      ...updates,
      // Keep the email confirmed so the user can log in immediately
      ...(updates.email ? { email_confirm: true } : {}),
    })

    if (authError) {
      console.error("[v0] Error updating credentials:", authError.message)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // 5. Keep the email in sync in public.users
    if (updates.email) {
      const { error: profileError } = await supabaseAdmin
        .from("users")
        .update({ email: updates.email })
        .eq("id", targetUserId)

      if (profileError) {
        console.error("[v0] Error syncing email in users table:", profileError.message)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Server error updating credentials:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
