import { del } from "@vercel/blob"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { QUOTATION_ALLOWED_CONTENT_TYPES, QUOTATION_MAX_SIZE_BYTES } from "@/lib/quotation-files"
import {
  getClientQuotationGroups,
  getUserDisplayName,
  verifyUploadedQuotation,
} from "@/lib/client-quotations-server"

type Context = { params: Promise<{ id: string }> }

/** Sesión del usuario y acceso al cliente (respeta RLS de `clients`). */
async function authorize(clientId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) }

  const { data: client } = await supabase.from("clients").select("id").eq("id", clientId).maybeSingle()
  if (!client) return { error: NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 }) }

  return { user }
}

const prefixFor = (clientId: string) => `client-quotations/${clientId}/`

export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params
  const auth = await authorize(id)
  if ("error" in auth) return auth.error

  const groups = await getClientQuotationGroups(id)
  return NextResponse.json({ groups })
}

// POST: token para subir directo a Blob. Blob rechaza tipos y tamaños fuera de la regla.
export async function POST(request: NextRequest, { params }: Context): Promise<NextResponse> {
  const { id } = await params
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const auth = await authorize(id)
        if ("error" in auth) throw new Error("No autorizado")
        if (!pathname.startsWith(prefixFor(id))) throw new Error("Ruta de archivo no válida")
        return {
          access: "private",
          addRandomSuffix: false,
          allowedContentTypes: QUOTATION_ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: QUOTATION_MAX_SIZE_BYTES,
        }
      },
      onUploadCompleted: async () => {},
    })
    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al subir la cotización" },
      { status: 400 },
    )
  }
}

// PATCH: registra en la BD la cotización ya subida, tras validar tipo y tamaño en Blob.
export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params
  const auth = await authorize(id)
  if ("error" in auth) return auth.error

  const { url, filename } = (await request.json().catch(() => ({}))) as { url?: string; filename?: string }
  if (!url || !filename) return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })

  const check = await verifyUploadedQuotation(url, prefixFor(id), filename)
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 })

  const admin = createAdminClient()
  const uploaderName = await getUserDisplayName(auth.user.id, auth.user.email)
  const { data, error } = await admin
    .from("client_quotations")
    .insert({
      client_id: id,
      file_url: `/api/file?pathname=${encodeURIComponent(check.pathname)}`,
      file_name: filename.slice(0, 255),
      file_size: check.size,
      mime_type: check.contentType,
      uploaded_by: auth.user.id,
      uploaded_by_name: uploaderName,
    })
    .select("id")
    .single()

  if (error) {
    await del(url).catch(() => {})
    return NextResponse.json({ error: "Error al guardar la cotización" }, { status: 500 })
  }
  return NextResponse.json({ id: data.id })
}

// DELETE: solo cotizaciones propias del cliente (las del prospecto y cuentas son de consulta).
export async function DELETE(request: NextRequest, { params }: Context) {
  const { id } = await params
  const auth = await authorize(id)
  if ("error" in auth) return auth.error

  const quotationId = request.nextUrl.searchParams.get("quotationId")
  if (!quotationId) return NextResponse.json({ error: "Falta la cotización" }, { status: 400 })

  const admin = createAdminClient()
  const { data: quotation } = await admin
    .from("client_quotations")
    .select("id, file_url")
    .eq("id", quotationId)
    .eq("client_id", id)
    .maybeSingle()
  if (!quotation) return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 })

  const { error } = await admin.from("client_quotations").delete().eq("id", quotation.id)
  if (error) return NextResponse.json({ error: "No se pudo eliminar la cotización" }, { status: 500 })

  const pathname = new URLSearchParams(quotation.file_url.split("?")[1] ?? "").get("pathname")
  if (pathname) await del(pathname).catch(() => {})

  return NextResponse.json({ ok: true })
}
