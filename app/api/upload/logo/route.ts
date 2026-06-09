import { put, del } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const oldPathname = formData.get('oldPathname') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    // Validar tipo de archivo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Solo se permiten archivos PNG o JPG' }, { status: 400 })
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo no debe exceder 5MB' }, { status: 400 })
    }

    // Eliminar logo anterior si existe
    if (oldPathname) {
      try {
        await del(oldPathname)
      } catch (e) {
        console.error('Error deleting old logo:', e)
      }
    }

    // Subir nuevo logo - usando access: 'private' ya que el store es privado
    const blob = await put(`logos/${Date.now()}-${file.name}`, file, {
      access: 'private',
    })

    // Retornamos el pathname que se usará para servir el archivo
    return NextResponse.json({ pathname: blob.pathname })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 })
  }
}
