import { del } from "@vercel/blob"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST: genera el token para subir el archivo DIRECTO a Vercel Blob desde el
// cliente. Esto evita el límite de ~4.5MB de los Route Handlers, por lo que la
// cotización no tiene restricción de peso (ni de tipo de archivo).
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          // Sin restricción de tipo ni de tamaño de archivo.
          addRandomSuffix: true,
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
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 },
    )
  }
}

// PATCH: guarda en la BD la URL de la cotización ya subida y borra la anterior.
export async function PATCH(request: NextRequest) {
  try {
    const { accountId, url, filename, oldUrl } = await request.json()

    if (!accountId || !url) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    // Borra el archivo anterior si existe
    if (oldUrl) {
      try {
        await del(oldUrl)
      } catch (e) {
        console.error("Error deleting old file:", e)
      }
    }

    const uploadedAt = new Date().toISOString()
    const supabase = await createClient()
    const { error } = await supabase
      .from("accounts")
      .update({
        quotation_url: url,
        quotation_filename: filename,
        quotation_uploaded_at: uploadedAt,
      })
      .eq("id", accountId)

    if (error) {
      // Si falla la BD, borra el archivo recién subido
      await del(url)
      return NextResponse.json({ error: "Failed to update account" }, { status: 500 })
    }

    return NextResponse.json({ url, filename, uploadedAt })
  } catch (error) {
    console.error("Save error:", error)
    return NextResponse.json({ error: "Save failed" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { accountId, url } = await request.json()

    if (!accountId || !url) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    // Delete file from blob storage
    await del(url)

    // Update account in database
    const supabase = await createClient()
    const { error } = await supabase
      .from("accounts")
      .update({
        quotation_url: null,
        quotation_filename: null,
        quotation_uploaded_at: null,
      })
      .eq("id", accountId)

    if (error) {
      return NextResponse.json({ error: "Failed to update account" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
