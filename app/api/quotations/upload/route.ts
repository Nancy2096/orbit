import { put, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const accountId = formData.get("accountId") as string
    const oldUrl = formData.get("oldUrl") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!accountId) {
      return NextResponse.json({ error: "No account ID provided" }, { status: 400 })
    }

    // Delete old file if exists
    if (oldUrl) {
      try {
        await del(oldUrl)
      } catch (e) {
        console.error("Error deleting old file:", e)
      }
    }

    // Upload new file
    const blob = await put(`quotations/${accountId}/${file.name}`, file, {
      access: "public",
    })

    // Update account in database
    const supabase = await createClient()
    const { error } = await supabase
      .from("accounts")
      .update({
        quotation_url: blob.url,
        quotation_filename: file.name,
        quotation_uploaded_at: new Date().toISOString(),
      })
      .eq("id", accountId)

    if (error) {
      // If database update fails, delete the uploaded file
      await del(blob.url)
      return NextResponse.json({ error: "Failed to update account" }, { status: 500 })
    }

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      uploadedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { accountId, url } = await request.json()

    if (!accountId || !url) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    // Delete file from blob storage
    await del(url)

    // Update account in database
    const supabase = await createClient()
    const { error } = await supabase
      .from("accounts")
      .update({
        quotation_url: null,
        quotation_filename: null,
        quotation_uploaded_at: null,
      })
      .eq("id", accountId)

    if (error) {
      return NextResponse.json({ error: "Failed to update account" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
