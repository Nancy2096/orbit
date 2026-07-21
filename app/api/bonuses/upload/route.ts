import { createClient } from "@/lib/supabase/server"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextRequest, NextResponse } from "next/server"

// Genera un token para que el navegador suba archivos de bonos (certificado,
// presentación) DIRECTAMENTE a Vercel Blob, evitando el límite del body de la
// función serverless. El registro en la base de datos se guarda desde el cliente
// tras completar la subida (no definimos onUploadCompleted a propósito).
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const supabase = await createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          throw new Error("No autorizado")
        }

        return {
          access: "private",
          addRandomSuffix: true,
          allowedContentTypes: [
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
            // Presentaciones
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.oasis.opendocument.presentation",
          ],
          maximumSizeInBytes: 25 * 1024 * 1024,
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error("Error generating bonus upload token:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al generar el token de subida" },
      { status: 400 },
    )
  }
}
