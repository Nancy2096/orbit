import { createClient } from "@/lib/supabase/server"
import { put, del } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"

// Sube presentaciones (PDF / PPT / imágenes) para inducción o formación, por agencia y etapa.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const agencyId = formData.get("agencyId") as string | null
    const stage = formData.get("stage") as string | null
    const title = (formData.get("title") as string | null) || file?.name || "Presentación"

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
    }
    if (!stage) {
      return NextResponse.json({ error: "No se proporcionó la etapa" }, { status: 400 })
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Solo PDF, PPT, PPTX, JPG o PNG." },
        { status: 400 }
      )
    }

    const maxSize = 25 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "El archivo es demasiado grande. Máximo 25MB." }, { status: 400 })
    }

    const supabase = await createClient()

    const timestamp = Date.now()
    const extension = file.name.split(".").pop() || "pdf"
    const fileName = `onboarding/${agencyId || "global"}/${stage}/${timestamp}.${extension}`

    const blob = await put(fileName, file, { access: "public", addRandomSuffix: false })

    const { data: material, error } = await supabase
      .from("onboarding_materials")
      .insert({
        agency_id: agencyId || null,
        stage,
        title,
        file_url: blob.url,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(material)
  } catch (error) {
    console.error("Error uploading material:", error)
    return NextResponse.json({ error: "Error al subir la presentación" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get("agencyId")
    const stage = searchParams.get("stage")

    const supabase = await createClient()
    let query = supabase.from("onboarding_materials").select("*").order("created_at", { ascending: true })

    if (stage) query = query.eq("stage", stage)
    if (agencyId) query = query.eq("agency_id", agencyId)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching materials:", error)
    return NextResponse.json({ error: "Error al obtener las presentaciones" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Se requiere el ID" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: material } = await supabase
      .from("onboarding_materials")
      .select("file_url")
      .eq("id", id)
      .single()

    if (material?.file_url) {
      try {
        await del(material.file_url)
      } catch {
        console.warn("Could not delete material file:", material.file_url)
      }
    }

    const { error } = await supabase.from("onboarding_materials").delete().eq("id", id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting material:", error)
    return NextResponse.json({ error: "Error al eliminar la presentación" }, { status: 500 })
  }
}
