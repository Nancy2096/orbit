import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Cliente con la llave de servicio (service role). SOLO debe usarse en el
 * servidor, en endpoints que no tienen sesión de usuario (por ejemplo, el
 * webhook público de captura de leads). Omite las políticas RLS, por lo que
 * cada uso debe validar su propia autorización (por ejemplo, vía token).
 */
export function createAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY")
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
