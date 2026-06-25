import { createClient } from "@/lib/supabase/server"
import { get } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"

// Sirve un documento de personal almacenado en un store privado de Vercel Blob.
// Los blobs privados requieren autenticación, por eso se transmiten desde el servidor.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get("id")
    const forceDownload = searchParams.get("download") === "1"

    if (!documentId) {
      return NextResponse.json({ error: "Se requiere el ID del documento" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar que el usuario tenga sesión activa.
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: doc, error } = await supabase
      .from("staff_documents")
      .select("file_url, file_name, mime_type")
      .eq("id", documentId)
      .single()

    if (error || !doc?.file_url) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
    }

    // Obtener el blob privado desde el servidor con el token del store.
    const result = await get(doc.file_url, { access: "private" })

    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: "No se pudo obtener el archivo" }, { status: 404 })
    }

    const contentType = doc.mime_type || result.blob.contentType || "application/octet-stream"
    const dispositionType = forceDownload ? "attachment" : "inline"
    const safeName = (doc.file_name || "documento").replace(/"/g, "")

    return new NextResponse(result.stream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${dispositionType}; filename="${safeName}"`,
        "Cache-Control": "private, no-store",
      },
    })
  } catch (error) {
    console.error("Error serving document file:", error)
    return NextResponse.json({ error: "Error al obtener el archivo" }, { status: 500 })
  }
}
