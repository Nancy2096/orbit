import { del } from "@vercel/blob"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST: genera el token para subir el archivo DIRECTO a Vercel Blob desde el
// cliente. Esto evita el límite de ~4.5MB de los Route Handlers, por lo que la
// cotización no tiene restricción de peso. El store es privado.
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          // Store privado, sin restricción de peso ni de tipo de archivo.
          access: "private",
          addRandomSuffix: false,
        }
      },
      // onUploadCompleted no se ejecuta en local/preview, por eso la BD se
      // guarda desde el cliente vía PATCH.
      onUploadCompleted: async () => {},
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error("Token generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al subir la cotización" },
      { status: 400 },
    )
  }
}

// PATCH: guarda en el HISTORIAL de la cuenta el registro de la cotización ya
// subida a Blob. Nunca borra las anteriores: cada subida es un registro nuevo.
export async function PATCH(request: NextRequest) {
  try {
    const { accountId, url, filename, label } = await request.json()

    if (!accountId || !url) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("entity_quotations")
      .insert({
        owner_type: "account",
        owner_id: accountId,
        url,
        filename: filename || null,
        label: label || null,
      })
      .select()
      .single()

    if (error) {
      // Si falla la BD, borra el archivo recién subido para no dejar huérfanos.
      await del(url).catch(() => {})
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
