import { del } from "@vercel/blob"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { QUOTATION_ALLOWED_CONTENT_TYPES, QUOTATION_MAX_SIZE_BYTES } from "@/lib/quotation-files"
import { getUserDisplayName, verifyUploadedQuotation } from "@/lib/quotation-uploads-server"

const ACCOUNT_QUOTATION_PREFIX = "quotations/"

// POST: genera el token para subir el archivo DIRECTO a Vercel Blob desde el
// cliente (evita el límite de ~4.5MB de los Route Handlers). Blob rechaza en el
// propio upload cualquier archivo que no sea PDF, Word, Excel o imagen, o que
// supere el tamaño máximo.
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(ACCOUNT_QUOTATION_PREFIX)) throw new Error("Ruta de archivo no válida")
        return {
          access: "private",
          addRandomSuffix: false,
          allowedContentTypes: QUOTATION_ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: QUOTATION_MAX_SIZE_BYTES,
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
// subida a Blob, tras volver a validar tipo, tamaño y ruta en el servidor.
// Nunca borra las anteriores: cada subida es un registro nuevo.
export async function PATCH(request: NextRequest) {
  try {
    const { accountId, url, filename, label } = await request.json()

    if (!accountId || !url || !filename) {
      return NextResponse.json({ error: "Faltan datos de la cotización" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      await del(url).catch(() => {})
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const check = await verifyUploadedQuotation(url, `${ACCOUNT_QUOTATION_PREFIX}${accountId}/`, filename)
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 })

    const baseRecord = {
      owner_type: "account",
      owner_id: accountId,
      url,
      filename,
      label: label || null,
    }

    let { data, error } = await supabase
      .from("entity_quotations")
      .insert({
        ...baseRecord,
        uploaded_by: user.id,
        uploaded_by_name: await getUserDisplayName(user.id, user.email),
      })
      .select()
      .single()

    // Until scripts/account_quotations_uploader.sql runs, the uploader columns
    // don't exist (Postgres 42703 / PostgREST PGRST204); save without them.
    if (error && (error.code === "42703" || error.code === "PGRST204")) {
      ;({ data, error } = await supabase.from("entity_quotations").insert(baseRecord).select().single())
    }

    if (error) {
      // Si falla la BD, borra el archivo recién subido para no dejar huérfanos.
      await del(url).catch(() => {})
      console.error("Save error:", error)
      return NextResponse.json({ error: "No se pudo guardar la cotización" }, { status: 500 })
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
