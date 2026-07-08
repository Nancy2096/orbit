import { createClient } from "@/lib/supabase/server"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextRequest, NextResponse } from "next/server"

// Genera un token para que el navegador suba el documento DIRECTAMENTE a Vercel Blob.
// Esto evita que el archivo pase por la función serverless (límite ~4.5MB del body),
// que era la causa de que las subidas grandes se quedaran "cargando" sin avanzar.
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Verificar que exista una sesión activa antes de permitir la subida.
        const supabase = await createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          throw new Error("No autorizado")
        }

        return {
          access: "private",
          addRandomSuffix: false,
          allowedContentTypes: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
          maximumSizeInBytes: 10 * 1024 * 1024,
        }
      },
      // No usamos onUploadCompleted para guardar en BD porque no se dispara en
      // entornos locales; el registro se guarda desde el cliente tras completar.
      onUploadCompleted: async () => {},
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error("Error generating upload token:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al generar el token de subida" },
      { status: 400 },
    )
  }
}
