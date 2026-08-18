import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  // 1. Usuario logueado (Supabase Auth)
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: "No autenticado" }, { status: 401 })
  }

  // 2. Datos de la cita que manda el formulario
  const body = await request.json()
  const { titulo, descripcion, inicio, fin, invitados } = body

  if (!titulo || !inicio || !fin) {
    return Response.json(
      { error: "Faltan datos: titulo, inicio o fin" },
      { status: 400 }
    )
  }

  // 3. Enviar la cita a Make
  const webhookUrl = process.env.MAKE_WEBHOOK_URL
  if (!webhookUrl) {
    return Response.json(
      { error: "MAKE_WEBHOOK_URL no está configurada" },
      { status: 500 }
    )
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        comercial: user.email, // identifica al comercial → Make elige su calendario
        titulo,
        descripcion: descripcion ?? "",
        inicio, // ISO 8601, ej. "2026-08-20T15:00:00-06:00"
        fin, // ISO 8601
        invitados: invitados ?? [], // array de correos
      }),
    })

    if (!res.ok) {
      const texto = await res.text()
      return Response.json(
        { error: "Make respondió con error", detalle: texto },
        { status: 502 }
      )
    }

    return Response.json({ ok: true })
  } catch (e) {
    return Response.json(
      { error: "No se pudo contactar a Make", detalle: String(e) },
      { status: 502 }
    )
  }
}
