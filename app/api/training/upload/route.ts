import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Maneja la subida de materiales de capacitación (presentaciones, documentos, videos)
// usando subida directa desde el cliente para evitar el límite de tamaño del servidor.
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Verificar que el usuario esté autenticado antes de permitir la subida.
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
          maximumSizeInBytes: 200 * 1024 * 1024, // 200 MB
          allowedContentTypes: [
            "application/pdf",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "image/*",
            "video/*",
          ],
        }
      },
      onUploadCompleted: async () => {
        // No se requiere acción adicional al completar la subida.
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.log("[v0] Error subiendo material:", (error as Error).message)
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
