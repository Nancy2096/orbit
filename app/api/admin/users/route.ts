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
    const { email, password, first_name, last_name, phone, role_id, agency_id, is_global_access, replace } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      )
    }

    // Verificar si ya existe un usuario con este correo.
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, email, is_active, first_name, last_name")
      .ilike("email", email)
      .maybeSingle()

    if (existingUser && !replace) {
      // Se requiere confirmación explícita para reemplazar al usuario anterior.
      return NextResponse.json(
        {
          error: "EMAIL_EXISTS",
          existingUser: {
            id: existingUser.id,
            email: existingUser.email,
            is_active: existingUser.is_active,
            name: `${existingUser.first_name ?? ""} ${existingUser.last_name ?? ""}`.trim(),
          },
        },
        { status: 409 }
      )
    }

    if (existingUser && replace) {
      // Deshabilitar al usuario anterior en el perfil.
      const { error: disableError } = await supabaseAdmin
        .from("users")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", existingUser.id)

      if (disableError) {
        console.error("Error disabling previous user:", disableError)
        return NextResponse.json(
          { error: "No se pudo deshabilitar al usuario anterior" },
          { status: 500 }
        )
      }

      // Liberar el correo en Auth (renombrándolo) y bloquear el acceso del usuario anterior.
      const [localPart, domainPart] = email.split("@")
      const freedEmail = domainPart
        ? `${localPart}+reemplazado-${Date.now()}@${domainPart}`
        : `reemplazado-${Date.now()}-${email}`

      const { error: freeEmailError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          email: freedEmail,
          ban_duration: "876000h", // ~100 años: se deshabilita el acceso.
        }
      )

      if (freeEmailError) {
        console.error("Error freeing previous email:", freeEmailError)
        return NextResponse.json(
          { error: "No se pudo liberar el correo del usuario anterior" },
          { status: 500 }
        )
      }
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
