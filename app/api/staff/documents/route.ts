import { createClient } from "@/lib/supabase/server"
import { put, del } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const staffId = formData.get("staffId") as string | null
    const documentType = formData.get("documentType") as string | null

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
    }

    if (!staffId) {
      return NextResponse.json({ error: "No se proporcionó el ID del empleado" }, { status: 400 })
    }

    if (!documentType) {
      return NextResponse.json({ error: "No se proporcionó el tipo de documento" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Solo PDF, JPG o PNG." },
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

    // Verify staff exists
    const { data: staff, error: staffError } = await supabase
      .from("staff")
      .select("id")
      .eq("id", staffId)
      .single()

    if (staffError || !staff) {
      return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 })
    }

    // Check if document of this type already exists for this staff
    const { data: existingDoc } = await supabase
      .from("staff_documents")
      .select("id, file_url")
      .eq("staff_id", staffId)
      .eq("document_type", documentType)
      .single()

    // If document exists, delete the old file from blob storage
    if (existingDoc?.file_url) {
      try {
        await del(existingDoc.file_url)
      } catch {
        // Ignore errors when deleting old file
        console.warn("Could not delete old file:", existingDoc.file_url)
      }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split(".").pop() || "pdf"
    const fileName = `staff/${staffId}/${documentType}_${timestamp}.${extension}`

    // Upload to Vercel Blob (el store está configurado como privado)
    const blob = await put(fileName, file, {
      access: "private",
      addRandomSuffix: false,
    })

    // Save or update document record in database
    if (existingDoc) {
      // Update existing record
      const { data: updatedDoc, error: updateError } = await supabase
        .from("staff_documents")
        .update({
          file_name: file.name,
          file_url: blob.url,
          file_size: file.size,
          mime_type: file.type,
          uploaded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingDoc.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      return NextResponse.json(updatedDoc)
    } else {
      // Insert new record
      const { data: newDoc, error: insertError } = await supabase
        .from("staff_documents")
        .insert({
          staff_id: staffId,
          document_type: documentType,
          file_name: file.name,
          file_url: blob.url,
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      return NextResponse.json(newDoc)
    }
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json(
      { error: "Error al subir el documento" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")

    if (!staffId) {
      return NextResponse.json({ error: "Se requiere staffId" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: documents, error } = await supabase
      .from("staff_documents")
      .select("*")
      .eq("staff_id", staffId)
      .order("document_type")

    if (error) {
      throw error
    }

    return NextResponse.json(documents)
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json(
      { error: "Error al obtener los documentos" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get("id")

    if (!documentId) {
      return NextResponse.json({ error: "Se requiere el ID del documento" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get document to find the file URL
    const { data: doc, error: fetchError } = await supabase
      .from("staff_documents")
      .select("file_url")
      .eq("id", documentId)
      .single()

    if (fetchError || !doc) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
    }

    // Delete from blob storage
    if (doc.file_url) {
      try {
        await del(doc.file_url)
      } catch {
        console.warn("Could not delete file from blob storage:", doc.file_url)
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("staff_documents")
      .delete()
      .eq("id", documentId)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json(
      { error: "Error al eliminar el documento" },
      { status: 500 }
    )
  }
}
