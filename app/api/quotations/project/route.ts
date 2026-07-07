import { del, put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Permite cuerpos grandes en el route handler (cotizaciones pesadas).
export const maxDuration = 60

// POST: sube la cotización a Vercel Blob DESDE EL SERVIDOR (en un solo paso) y
// la agrega al HISTORIAL del proyecto. Nunca borra las cotizaciones anteriores:
// cada subida es un registro nuevo.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const projectId = formData.get("projectId") as string | null
    const label = (formData.get("label") as string | null) || null

    if (!file || !projectId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    // El store de Blob es privado: se sube con access "private" y el archivo se
    // sirve de forma autenticada a través de /api/file (no con una URL pública).
    const blob = await put(`quotations/projects/${projectId}/${file.name}`, file, {
      access: "private",
      addRandomSuffix: true,
    })

    // URL de descarga que pasa por nuestro route autenticado.
    const fileUrl = `/api/file?pathname=${encodeURIComponent(blob.pathname)}`

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("entity_quotations")
      .insert({
        owner_type: "project",
        owner_id: projectId,
        url: fileUrl,
        filename: file.name,
        label,
      })
      .select()
      .single()

    if (error) {
      // Si falla la BD, borra el archivo recién subido para no dejar huérfanos.
      await del(blob.pathname)
      console.error("Save error:", error)
      return NextResponse.json({ error: "Failed to save quotation" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    )
  }
}

// DELETE: elimina UNA cotización específica del historial (por su id).
export async function DELETE(request: NextRequest) {
  try {
    const { quotationId, url } = await request.json()

    if (!quotationId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from("entity_quotations")
      .delete()
      .eq("id", quotationId)

    if (error) {
      return NextResponse.json({ error: "Failed to delete quotation" }, { status: 500 })
    }

    // Borra el archivo del blob storage solo tras eliminar el registro.
    // Los registros nuevos guardan "/api/file?pathname=...": extraemos el
    // pathname. Los antiguos guardaban la URL completa del blob: se usa tal cual.
    if (url) {
      try {
        let target = url as string
        if (target.includes("pathname=")) {
          target = decodeURIComponent(target.split("pathname=")[1] ?? "")
        }
        if (target) await del(target)
      } catch (e) {
        console.error("Error deleting blob file:", e)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
