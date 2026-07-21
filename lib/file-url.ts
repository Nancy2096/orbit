// Construye una URL segura para el endpoint /api/file a partir de una URL de Blob
// (absoluta) o de una ruta relativa ya almacenada. Evita que `new URL()` falle
// cuando el valor no es una URL absoluta válida.
function extractPathname(rawUrl: string): string {
  if (!rawUrl) return ""
  try {
    // URL absoluta (p. ej. https://blob.vercel-storage.com/...)
    return new URL(rawUrl).pathname.replace(/^\//, "")
  } catch {
    // Ya es una ruta relativa/pathname: solo quitamos la barra inicial.
    return rawUrl.replace(/^\//, "")
  }
}

/** URL para VER el archivo en línea (sin forzar descarga). */
export function getFileViewUrl(rawUrl: string): string {
  const pathname = extractPathname(rawUrl)
  if (!pathname) return "#"
  return `/api/file?pathname=${encodeURIComponent(pathname)}`
}

/** URL para DESCARGAR el archivo con su nombre original. */
export function getFileDownloadUrl(rawUrl: string, filename?: string | null): string {
  const pathname = extractPathname(rawUrl)
  if (!pathname) return "#"
  const name = encodeURIComponent(filename || "archivo")
  return `/api/file?pathname=${encodeURIComponent(pathname)}&download=1&filename=${name}`
}
