import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextRequest, NextResponse } from "next/server"
import { getIncentiveActor } from "@/lib/incentives-server"
import { INCENTIVE_RECEIPT_MAX_BYTES, INCENTIVE_RECEIPT_TYPES } from "@/lib/incentives"
import { canManageIncentiveReceipt } from "@/lib/incentives-receipt"

export const runtime = "nodejs"

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const actor = await getIncentiveActor()
        if (!actor) throw new Error("No autorizado")

        const incentiveId = clientPayload ? (JSON.parse(clientPayload).incentiveId as string) : ""
        if (!incentiveId || !pathname.startsWith(`incentives/${incentiveId}/`)) {
          throw new Error("Ruta de archivo inválida")
        }

        const check = await canManageIncentiveReceipt(actor, incentiveId)
        if (!check.ok) throw new Error(check.error)

        return {
          access: "private",
          addRandomSuffix: true,
          allowedContentTypes: INCENTIVE_RECEIPT_TYPES,
          maximumSizeInBytes: INCENTIVE_RECEIPT_MAX_BYTES,
        }
      },
      // Sin onUploadCompleted: el callback no es alcanzable desde el preview; el
      // registro se guarda con POST /api/incentives/[id]/receipt al terminar.
    })
    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al generar el token de subida" },
      { status: 400 },
    )
  }
}
