import { NextResponse } from "next/server"
import { requireCollectionsAccess } from "@/lib/collections/access"
import { loadCollectionsSummary } from "@/lib/collections/data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const access = await requireCollectionsAccess()
  if (access instanceof NextResponse) return access

  const agency = new URL(request.url).searchParams.get("agency")
  const agencyFilter = agency && agency !== "all" ? agency : null

  try {
    const summary = await loadCollectionsSummary(access, agencyFilter)
    return NextResponse.json(summary)
  } catch (error) {
    console.error("[collections] Error al cargar la cartera:", error)
    return NextResponse.json({ error: "No se pudo cargar la cartera" }, { status: 500 })
  }
}
