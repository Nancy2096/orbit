import { del } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"

// DELETE: borra un archivo adjunto de una actividad del store de Vercel Blob.
// El registro en la BD se actualiza/elimina desde el cliente vía Supabase.
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const blobUrl = searchParams.get("blobUrl")

    if (!blobUrl) {
      return NextResponse.json({ error: "Se requiere la URL del archivo" }, { status: 400 })
    }

    try {
      await del(blobUrl)
    } catch {
      console.warn("Could not delete file from blob storage:", blobUrl)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting activity attachment:", error)
    return NextResponse.json({ error: "Error al eliminar el archivo" }, { status: 500 })
  }
}
