import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const invoiceId = formData.get('invoiceId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!invoiceId) {
      return NextResponse.json({ error: 'No invoice ID provided' }, { status: 400 })
    }

    // Generate a unique filename with invoice ID prefix
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `payment-receipts/${invoiceId}/${timestamp}.${extension}`

    const blob = await put(filename, file, {
      access: 'public',
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
