import { type NextRequest, NextResponse } from 'next/server'
import { get } from '@vercel/blob'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    // Extraer el pathname de la URL del blob
    const blobUrl = new URL(url)
    const pathname = blobUrl.pathname.slice(1) // Remover el / inicial
    
    const result = await get(pathname, { 
      access: 'private',
      ifNoneMatch: request.headers.get('if-none-match') ?? undefined,
    })

    if (!result) {
      return new NextResponse('Not found', { status: 404 })
    }

    // Si el blob no ha cambiado, usar cache del browser
    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'ETag': result.blob.etag,
          'Cache-Control': 'private, max-age=3600',
        },
      })
    }

    return new NextResponse(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType,
        'X-Content-Type-Options': 'nosniff',
        'ETag': result.blob.etag,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error fetching blob:', error)
    return NextResponse.json({ error: 'Error fetching image' }, { status: 500 })
  }
}
