import { del, put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Permite cuerpos grandes en el route handler (contratos en PDF).
export const maxDuration = 60

// POST: sube el contrato firmado (PDF) del cliente a Vercel Blob privado y guarda
// la referencia en las columnas contract_* de la tabla clients. Solo hay un
// contrato por cliente: si ya existía uno, se elimina el archivo anterior.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const clientId = formData.get("clientId") as string | null

    if (!file || !clientId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "El contrato debe ser un archivo PDF" }, { status: 400 })
    }

    const supabase = await createClient()

    // Recuperar el contrato anterior (si existe) para borrarlo del blob luego.
    const { data: existing } = await supabase
      .from("clients")
      .select("contract_url")
      .eq("id", clientId)
      .maybeSingle()

    // Sube con access "private": se sirve autenticado vía /api/file.
    const blob = await put(`contracts/${clientId}/${file.name}`, file, {
      access: "private",
      addRandomSuffix: true,
    })

    const fileUrl = `/api/file?pathname=${encodeURIComponent(blob.pathname)}`

    const { error } = await supabase
      .from("clients")
      .update({
        contract_url: fileUrl,
        contract_filename: file.name,
        contract_uploaded_at: new Date().toISOString(),
      })
      .eq("id", clientId)

    if (error) {
      // Si falla la BD, borra el archivo recién subido para no dejar huérfanos.
      await del(blob.pathname)
      console.error("[v0] Save contract error:", error)
      return NextResponse.json({ error: "Failed to save contract" }, { status: 500 })
    }

    // Borra el archivo anterior tras actualizar correctamente.
    if (existing?.contract_url) {
      try {
        let target = existing.contract_url as string
        if (target.includes("pathname=")) {
          target = decodeURIComponent(target.split("pathname=")[1] ?? "")
        }
        if (target) await del(target)
      } catch (e) {
        console.error("[v0] Error deleting previous contract:", e)
      }
    }

    return NextResponse.json({
      contract_url: fileUrl,
      contract_filename: file.name,
      contract_uploaded_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Upload contract error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    )
  }
}

// DELETE: elimina el contrato del cliente (archivo del blob y columnas de la BD).
export async function DELETE(request: NextRequest) {
  try {
    const { clientId } = await request.json()

    if (!clientId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: existing } = await supabase
      .from("clients")
      .select("contract_url")
      .eq("id", clientId)
      .maybeSingle()

    const { error } = await supabase
      .from("clients")
      .update({
        contract_url: null,
        contract_filename: null,
        contract_uploaded_at: null,
      })
      .eq("id", clientId)

    if (error) {
      return NextResponse.json({ error: "Failed to delete contract" }, { status: 500 })
    }

    if (existing?.contract_url) {
      try {
        let target = existing.contract_url as string
        if (target.includes("pathname=")) {
          target = decodeURIComponent(target.split("pathname=")[1] ?? "")
        }
        if (target) await del(target)
      } catch (e) {
        console.error("[v0] Error deleting contract blob:", e)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete contract error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
