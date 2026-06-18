import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// Create admin client with service role key
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, first_name, last_name, phone, role_id, agency_id, is_global_access } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      )
    }

    // Create user with admin API (bypasses email confirmation)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name,
        last_name,
        role_id: role_id || null,
      },
    })

    if (authError) {
      console.error("Auth error:", authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "No se pudo crear el usuario" },
        { status: 500 }
      )
    }

    // Update user profile with additional data
    const { error: profileError } = await supabaseAdmin
      .from("users")
      .update({
        first_name,
        last_name,
        phone,
        role_id: role_id || null,
        is_global_access: is_global_access === true,
      })
      .eq("id", authData.user.id)

    if (profileError) {
      console.error("Profile update error:", profileError)
    }

    // Associate user with agencies
    if (is_global_access === true) {
      // Usuario global: asignar a todas las agencias activas
      const { data: allAgencies } = await supabaseAdmin
        .from("agencies")
        .select("id")
        .eq("is_active", true)
        .order("name")

      if (allAgencies && allAgencies.length > 0) {
        const rows = allAgencies.map((a, index) => ({
          user_id: authData.user.id,
          agency_id: a.id,
          is_primary: index === 0,
        }))
        const { error: agencyError } = await supabaseAdmin
          .from("user_agencies")
          .insert(rows)

        if (agencyError) {
          console.error("Agency association error (global):", agencyError)
        }
      }
    } else if (agency_id) {
      const { error: agencyError } = await supabaseAdmin
        .from("user_agencies")
        .insert({
          user_id: authData.user.id,
          agency_id,
          is_primary: true,
        })

      if (agencyError) {
        console.error("Agency association error:", agencyError)
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    })
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
