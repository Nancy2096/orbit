import { createClient } from "@/lib/supabase/server"
import { put, del } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const prospectId = formData.get("prospectId") as string | null

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
    }

    if (!prospectId) {
      return NextResponse.json({ error: "No se proporcionó el ID del prospecto" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Solo se permiten archivos PDF" },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "El archivo es demasiado grande. Máximo 10MB." },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify prospect exists
    const { data: prospect, error: prospectError } = await supabase
      .from("crm_prospects")
      .select("id")
      .eq("id", prospectId)
      .single()

    if (prospectError || !prospect) {
      return NextResponse.json({ error: "Prospecto no encontrado" }, { status: 404 })
    }

    // Determine next version number
    const { count } = await supabase
      .from("crm_prospect_quotations")
      .select("id", { count: "exact", head: true })
      .eq("prospect_id", prospectId)

    const version = (count || 0) + 1

    // Generate unique filename and upload to Vercel Blob
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const fileName = `quotations/${prospectId}/${timestamp}-${safeName}`

    const blob = await put(fileName, file, {
      access: "public",
      addRandomSuffix: false,
    })

    // Save quotation record in database
    const { data: newQuotation, error: dbError } = await supabase
      .from("crm_prospect_quotations")
      .insert({
        prospect_id: prospectId,
        file_name: file.name,
        file_url: blob.url,
        file_size: file.size,
        version,
      })
      .select()
      .single()

    if (dbError) {
      throw dbError
    }

    return NextResponse.json(newQuotation)
  } catch (error) {
    console.error("Error uploading quotation:", error)
    return NextResponse.json(
      { error: "Error al subir la cotización" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const quotationId = searchParams.get("id")

    if (!quotationId) {
      return NextResponse.json({ error: "Se requiere el ID de la cotización" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: quotation, error: fetchError } = await supabase
      .from("crm_prospect_quotations")
      .select("file_url")
      .eq("id", quotationId)
      .single()

    if (fetchError || !quotation) {
      return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 })
    }

    if (quotation.file_url) {
      try {
        await del(quotation.file_url)
      } catch {
        console.warn("Could not delete file from blob storage:", quotation.file_url)
      }
    }

    const { error: deleteError } = await supabase
      .from("crm_prospect_quotations")
      .delete()
      .eq("id", quotationId)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting quotation:", error)
    return NextResponse.json(
      { error: "Error al eliminar la cotización" },
      { status: 500 }
    )
  }
}
