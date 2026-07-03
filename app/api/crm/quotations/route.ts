import { del } from "@vercel/blob"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextRequest, NextResponse } from "next/server"
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
      // actualiza desde el cliente vía PATCH.
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

// PATCH: guarda en la BD el registro de la cotización ya subida a Blob,
// calculando el número de versión correspondiente.
export async function PATCH(request: NextRequest) {
  try {
    const { prospectId, url, filename, fileSize } = await request.json()

    if (!prospectId || !url) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify prospect exists
    const { data: prospect, error: prospectError } = await supabase
      .from("crm_prospects")
      .select("id")
      .eq("id", prospectId)
      .single()

    if (prospectError || !prospect) {
      // Si falla, borra el archivo recién subido
      await del(url).catch(() => {})
      return NextResponse.json({ error: "Prospecto no encontrado" }, { status: 404 })
    }

    // Determine next version number
    const { count } = await supabase
      .from("crm_prospect_quotations")
      .select("id", { count: "exact", head: true })
      .eq("prospect_id", prospectId)

    const version = (count || 0) + 1

    const { data: newQuotation, error: dbError } = await supabase
      .from("crm_prospect_quotations")
      .insert({
        prospect_id: prospectId,
        file_name: filename,
        file_url: url,
        file_size: fileSize ?? null,
        version,
      })
      .select()
      .single()

    if (dbError) {
      // Si falla la BD, borra el archivo recién subido
      await del(url).catch(() => {})
      throw dbError
    }

    return NextResponse.json(newQuotation)
  } catch (error) {
    console.error("Error saving quotation:", error)
    return NextResponse.json({ error: "Error al guardar la cotización" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const quotationId = searchParams.get("id")

    if (!quotationId) {
      return NextResponse.json({ error: "Se requiere el ID de la cotización" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: quotation, error: fetchError } = await supabase
      .from("crm_prospect_quotations")
      .select("file_url")
      .eq("id", quotationId)
      .single()

    if (fetchError || !quotation) {
      return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 })
    }

    if (quotation.file_url) {
      try {
        await del(quotation.file_url)
      } catch {
        console.warn("Could not delete file from blob storage:", quotation.file_url)
      }
    }

    const { error: deleteError } = await supabase
      .from("crm_prospect_quotations")
      .delete()
      .eq("id", quotationId)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting quotation:", error)
    return NextResponse.json(
      { error: "Error al eliminar la cotización" },
      { status: 500 }
    )
  }
}
