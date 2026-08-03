import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Maneja la subida del comprobante o factura de un gasto usando subida directa
// desde el cliente (soporta PDF e imágenes) para evitar el límite del servidor.
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
          maximumSizeInBytes: 25 * 1024 * 1024, // 25 MB
          allowedContentTypes: [
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/webp",
            "image/gif",
          ],
        }
      },
      onUploadCompleted: async () => {
        // No se requiere acción adicional al completar la subida.
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.log("[v0] Error subiendo comprobante de gasto:", (error as Error).message)
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
