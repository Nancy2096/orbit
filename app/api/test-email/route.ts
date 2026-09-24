import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email"

export const runtime = "nodejs"

export async function POST() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  // Misma validación de rol que permissions-provider.tsx, pero del lado del
  // servidor: se lee users -> role_id -> roles(name) y solo "superadmin" pasa.
  const { data: userData } = await supabase
    .from("users")
    .select("id, role:roles(name)")
    .eq("id", authUser.id)
    .single()

  const role = Array.isArray(userData?.role) ? userData?.role[0] : userData?.role
  const roleName = role?.name ?? null

  // Acceso temporal para pruebas de envío: además de superadmin, se permite a
  // nancy@agency4realestate.com. Eliminar junto con esta ruta al terminar.
  const isTemporarilyAllowed = authUser.email === "nancy@agency4realestate.com"

  if (roleName !== "superadmin" && !isTemporarilyAllowed) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  try {
    const result = await sendEmail({
      to: authUser.email ?? process.env.SMTP_FROM ?? "",
      subject: "Correo de prueba de Orbit",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
          <h1 style="font-size: 18px;">Correo de prueba de Orbit</h1>
          <p>Este es un correo de prueba enviado desde <strong>Orbit</strong> para verificar la configuración SMTP.</p>
          <p style="color: #666; font-size: 12px;">Enviado el ${new Date().toLocaleString("es-MX")}.</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true, ...result })
  } catch {
    return NextResponse.json(
      { error: "No se pudo enviar el correo de prueba" },
      { status: 500 },
    )
  }
}
