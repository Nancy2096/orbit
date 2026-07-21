// Construye URLs seguras para el endpoint /api/file a partir del valor `url`
// guardado en la BD. Ese valor puede tener tres formas:
//   1. Ya un enlace a nuestro endpoint: "/api/file?pathname=<encoded>"  (registros nuevos)
//   2. Una URL absoluta de Vercel Blob: "https://....blob.vercel-storage.com/..."  (legado)
//   3. Una ruta/pathname relativa: "quotations/acc/archivo.pdf"  (legado)
// El objetivo es SIEMPRE terminar con "/api/file?pathname=<pathname del blob>".

/** Extrae el `pathname` del blob desde cualquiera de las tres formas de `url`. */
function extractBlobPathname(rawUrl: string): string {
  if (!rawUrl) return ""

  // Caso 1: ya es un enlace a /api/file?pathname=... -> devolvemos el pathname ya decodificado.
  if (rawUrl.includes("/api/file")) {
    const query = rawUrl.split("?")[1] ?? ""
    const params = new URLSearchParams(query)
    return params.get("pathname") ?? ""
  }

  // Caso 2: URL absoluta -> tomamos su pathname sin la barra inicial.
  try {
    return new URL(rawUrl).pathname.replace(/^\//, "")
  } catch {
    // Caso 3: ya es una ruta relativa.
    return rawUrl.replace(/^\//, "")
  }
}

/** URL para VER el archivo en línea (sin forzar descarga). */
export function getFileViewUrl(rawUrl: string): string {
  const pathname = extractBlobPathname(rawUrl)
  if (!pathname) return "#"
  return `/api/file?pathname=${encodeURIComponent(pathname)}`
}

/** URL para DESCARGAR el archivo con su nombre original. */
export function getFileDownloadUrl(rawUrl: string, filename?: string | null): string {
  const pathname = extractBlobPathname(rawUrl)
  if (!pathname) return "#"
  const name = encodeURIComponent(filename || "archivo")
  return `/api/file?pathname=${encodeURIComponent(pathname)}&download=1&filename=${name}`
}
