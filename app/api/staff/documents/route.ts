import { createClient } from "@/lib/supabase/server"
import { del } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"

// El archivo ya fue subido directamente a Vercel Blob desde el navegador
// (client upload). Aquí solo recibimos los metadatos y guardamos el registro.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      staffId,
      documentType,
      fileName,
      fileUrl,
      fileSize,
      mimeType,
    }: {
      staffId?: string
      documentType?: string
      fileName?: string
      fileUrl?: string
      fileSize?: number
      mimeType?: string
    } = body

    if (!fileUrl) {
      return NextResponse.json({ error: "No se proporcionó la URL del archivo" }, { status: 400 })
    }

    if (!staffId) {
      return NextResponse.json({ error: "No se proporcionó el ID del empleado" }, { status: 400 })
    }

    if (!documentType) {
      return NextResponse.json({ error: "No se proporcionó el tipo de documento" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar sesión activa
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

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
    if (existingDoc?.file_url && existingDoc.file_url !== fileUrl) {
      try {
        await del(existingDoc.file_url)
      } catch {
        // Ignore errors when deleting old file
        console.warn("Could not delete old file:", existingDoc.file_url)
      }
    }

    // Save or update document record in database
    if (existingDoc) {
      // Update existing record
      const { data: updatedDoc, error: updateError } = await supabase
        .from("staff_documents")
        .update({
          file_name: fileName,
          file_url: fileUrl,
          file_size: fileSize ?? null,
          mime_type: mimeType ?? null,
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
          file_name: fileName,
          file_url: fileUrl,
          file_size: fileSize ?? null,
          mime_type: mimeType ?? null,
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      return NextResponse.json(newDoc)
    }
  } catch (error) {
    console.error("Error saving document:", error)
    return NextResponse.json(
      { error: "Error al guardar el documento" },
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
