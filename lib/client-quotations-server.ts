import "server-only"
import { head, del } from "@vercel/blob"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  QUOTATION_ALLOWED_CONTENT_TYPES,
  QUOTATION_FORMAT_ERROR,
  QUOTATION_MAX_SIZE_BYTES,
  QUOTATION_SIZE_ERROR,
  hasAllowedQuotationExtension,
  toFileHref,
} from "@/lib/quotation-files"

export type QuotationSource = "client" | "prospect" | "account"

export interface QuotationItem {
  id: string
  source: QuotationSource
  file_name: string
  href: string
  file_size: number | null
  uploaded_at: string | null
  uploaded_by_name: string | null
}

export interface QuotationGroup {
  key: string
  source: QuotationSource
  label: string
  readOnly: boolean
  items: QuotationItem[]
}

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

function fullName(first?: string | null, last?: string | null): string | null {
  const name = [first, last].filter(Boolean).join(" ").trim()
  return name || null
}

export async function getUserDisplayName(userId: string, email?: string | null): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.from("users").select("first_name, last_name, email").eq("id", userId).maybeSingle()
  return fullName(data?.first_name, data?.last_name) || data?.email || email || null
}

export async function getStaffIdForUser(userId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.from("staff").select("id").eq("user_id", userId).limit(1)
  return data?.[0]?.id ?? null
}

/** Cotizaciones del cliente agrupadas por origen: cliente, prospecto y cuentas. */
export async function getClientQuotationGroups(clientId: string): Promise<QuotationGroup[]> {
  const admin = createAdminClient()

  const [clientRes, prospectsRes, accountsRes] = await Promise.all([
    admin
      .from("client_quotations")
      .select("id, file_name, file_url, file_size, uploaded_at, uploaded_by_name")
      .eq("client_id", clientId)
      .order("uploaded_at", { ascending: false }),
    admin.from("crm_prospects").select("id, company_name").eq("converted_to_client_id", clientId),
    admin.from("accounts").select("id, account_name").eq("client_id", clientId).order("account_name"),
  ])

  const groups: QuotationGroup[] = [
    {
      key: "client",
      source: "client",
      label: "Del cliente",
      readOnly: false,
      items: (clientRes.data ?? []).map((q) => ({
        id: q.id,
        source: "client",
        file_name: q.file_name,
        href: toFileHref(q.file_url),
        file_size: q.file_size,
        uploaded_at: q.uploaded_at,
        uploaded_by_name: q.uploaded_by_name,
      })),
    },
  ]

  const prospectIds = (prospectsRes.data ?? []).map((p) => p.id)
  if (prospectIds.length > 0) {
    const { data: pq } = await admin
      .from("crm_prospect_quotations")
      .select("id, file_name, file_url, file_size, created_at, version, uploader:staff(first_name, last_name)")
      .in("prospect_id", prospectIds)
      .order("created_at", { ascending: false })
    const items: QuotationItem[] = (pq ?? []).map((q) => {
      const uploader = (Array.isArray(q.uploader) ? q.uploader[0] : q.uploader) as
        | { first_name?: string | null; last_name?: string | null }
        | null
      return {
        id: q.id,
        source: "prospect",
        file_name: q.version ? `${q.file_name} (v${q.version})` : q.file_name,
        href: toFileHref(q.file_url),
        file_size: q.file_size,
        uploaded_at: q.created_at,
        uploaded_by_name: fullName(uploader?.first_name, uploader?.last_name),
      }
    })
    if (items.length > 0) {
      groups.push({ key: "prospect", source: "prospect", label: "Del prospecto", readOnly: true, items })
    }
  }

  const accounts = accountsRes.data ?? []
  if (accounts.length > 0) {
    const { data: eq } = await admin
      .from("entity_quotations")
      .select("id, owner_id, filename, url, uploaded_at")
      .eq("owner_type", "account")
      .in(
        "owner_id",
        accounts.map((a) => a.id),
      )
      .order("uploaded_at", { ascending: false })
    for (const account of accounts) {
      const items: QuotationItem[] = (eq ?? [])
        .filter((q) => q.owner_id === account.id)
        .map((q) => ({
          id: q.id,
          source: "account",
          file_name: q.filename,
          href: toFileHref(q.url),
          file_size: null,
          uploaded_at: q.uploaded_at,
          uploaded_by_name: null,
        }))
      if (items.length > 0) {
        groups.push({
          key: `account-${account.id}`,
          source: "account",
          label: `De la cuenta ${account.account_name || "sin nombre"}`,
          readOnly: true,
          items,
        })
      }
    }
  }

  return groups
}

/** IDs de clientes que tienen al menos una cotización (propia, de su prospecto o de sus cuentas). */
export async function getClientIdsWithQuotation(): Promise<string[]> {
  const admin = createAdminClient()
  const [own, prospects, accounts] = await Promise.all([
    admin.from("client_quotations").select("client_id"),
    admin
      .from("crm_prospects")
      .select("converted_to_client_id, crm_prospect_quotations!inner(id)")
      .not("converted_to_client_id", "is", null),
    admin.from("accounts").select("id, client_id").not("client_id", "is", null),
  ])

  const ids = new Set<string>()
  for (const row of own.data ?? []) ids.add(row.client_id)
  for (const row of prospects.data ?? []) if (row.converted_to_client_id) ids.add(row.converted_to_client_id)

  const accountToClient = new Map((accounts.data ?? []).map((a) => [a.id, a.client_id as string]))
  if (accountToClient.size > 0) {
    const { data: eq } = await admin.from("entity_quotations").select("owner_id").eq("owner_type", "account")
    for (const row of eq ?? []) {
      const clientId = accountToClient.get(row.owner_id)
      if (clientId) ids.add(clientId)
    }
  }

  return [...ids]
}
