import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const { error } = await supabase.from("user_google_connections").delete().eq("user_id", user.id)

  if (error) {
    console.log("[v0] Error desconectando Google:", error.message)
    return NextResponse.json({ error: "No se pudo desconectar" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
