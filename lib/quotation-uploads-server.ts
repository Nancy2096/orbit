import "server-only"
import { head, del } from "@vercel/blob"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  QUOTATION_ALLOWED_CONTENT_TYPES,
  QUOTATION_FORMAT_ERROR,
  QUOTATION_MAX_SIZE_BYTES,
  QUOTATION_SIZE_ERROR,
  hasAllowedQuotationExtension,
} from "@/lib/quotation-files"

/**
 * Verifica en Blob el archivo recién subido: ruta esperada, tipo y tamaño.
 * Si no es válido, lo elimina y devuelve el error.
 */
export async function verifyUploadedQuotation(
  url: string,
  expectedPrefix: string,
  fileName: string,
): Promise<{ ok: true; pathname: string; size: number; contentType: string } | { ok: false; error: string }> {
  let meta
  try {
    meta = await head(url)
  } catch {
    return { ok: false, error: "No se encontró el archivo subido" }
  }
  const reject = async (error: string) => {
    await del(url).catch(() => {})
    return { ok: false as const, error }
  }
  if (!meta.pathname.startsWith(expectedPrefix)) return reject("Ruta de archivo no válida")
  if (!hasAllowedQuotationExtension(fileName) || !QUOTATION_ALLOWED_CONTENT_TYPES.includes(meta.contentType)) {
    return reject(QUOTATION_FORMAT_ERROR)
  }
  if (meta.size > QUOTATION_MAX_SIZE_BYTES) return reject(QUOTATION_SIZE_ERROR)
  return { ok: true, pathname: meta.pathname, size: meta.size, contentType: meta.contentType }
}

export async function getUserDisplayName(userId: string, email?: string | null): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.from("users").select("first_name, last_name, email").eq("id", userId).maybeSingle()
  const name = [data?.first_name, data?.last_name].filter(Boolean).join(" ").trim()
  return name || data?.email || email || null
}

export async function getStaffIdForUser(userId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.from("staff").select("id").eq("user_id", userId).limit(1)
  return data?.[0]?.id ?? null
}
