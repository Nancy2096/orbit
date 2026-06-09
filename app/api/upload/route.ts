import { put, del } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const oldUrl = formData.get('oldUrl') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    // Validar tipo de archivo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Solo se permiten archivos de imagen (PNG, JPG, GIF, WEBP)' }, { status: 400 })
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo no debe exceder 5MB' }, { status: 400 })
    }

    // Eliminar archivo anterior si existe
    if (oldUrl) {
      try {
        await del(oldUrl)
      } catch (e) {
        console.error('Error deleting old file:', e)
      }
    }

    // Obtener folder del formData (default: staff-photos)
    const folder = formData.get('folder') as string || 'staff-photos'

    // Subir nuevo archivo (siempre privado ya que el store es privado)
    const blob = await put(`${folder}/${Date.now()}-${file.name}`, file, {
      access: 'private',
    })

    // Extraer el pathname del URL para usarlo con el proxy
    const pathname = blob.url.split('.vercel-storage.com/')[1]
    
    return NextResponse.json({ 
      url: blob.url,
      pathname: pathname // Para usar con /api/file o /api/blob/image
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 })
  }
}
