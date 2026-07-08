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
      // IMPORTANTE: NO definimos onUploadCompleted. Si se define (aunque sea vacío),
      // el SDK adjunta un callbackUrl al token y el servicio de Blob intenta llamar
      // de vuelta a esa URL tras subir el archivo. En entornos con proxy/preview esa
      // URL no es alcanzable, por lo que el paso de "completado" de upload() se queda
      // colgado y la UI se queda "Subiendo..." sin avanzar. El registro en la base de
      // datos se guarda desde el cliente (POST a /api/staff/documents) tras completar.
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
