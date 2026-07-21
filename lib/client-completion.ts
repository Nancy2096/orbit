// Utilidad para calcular el porcentaje de información completada de un cliente,
// agrupado por categoría. Se usa tanto en la lista general de clientes como en
// el detalle de un cliente.

export type ClientLike = Record<string, unknown>

export interface CompletionCategory {
  key: string
  label: string
  /** Campos que componen la categoría */
  fields: string[]
}

// Definición de categorías y los campos que las componen.
export const COMPLETION_CATEGORIES: CompletionCategory[] = [
  {
    key: "general",
    label: "General",
    fields: ["legal_name", "tax_id", "industry_id", "website", "products", "referral_source_id"],
  },
  {
    key: "contact",
    label: "Contacto",
    fields: [
      "primary_contact_name",
      "primary_contact_email",
      "primary_contact_phone",
      "primary_contact_position",
    ],
  },
  {
    key: "address",
    label: "Dirección",
    fields: ["street", "exterior_number", "neighborhood", "city", "state", "country", "postal_code"],
  },
  {
    key: "billing",
    label: "Facturación",
    fields: ["billing_email", "tax_regime", "cfdi_use", "payment_terms"],
  },
  {
    key: "social",
    label: "Redes sociales",
    fields: ["instagram", "facebook", "tiktok", "linkedin"],
  },
  {
    key: "contract",
    label: "Contrato",
    fields: ["contract_url"],
  },
]

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === "string") return value.trim().length > 0
  if (typeof value === "number") return true
  return Boolean(value)
}

export interface CategoryCompletion {
  key: string
  label: string
  percentage: number
  filled: number
  total: number
}

/** Calcula el porcentaje de completitud por categoría para un cliente. */
export function getClientCompletionByCategory(client: ClientLike): CategoryCompletion[] {
  return COMPLETION_CATEGORIES.map((category) => {
    const total = category.fields.length
    const filled = category.fields.filter((field) => isFilled(client[field])).length
    const percentage = total === 0 ? 0 : Math.round((filled / total) * 100)
    return { key: category.key, label: category.label, percentage, filled, total }
  })
}

/** Calcula el porcentaje global de completitud (promedio de todos los campos). */
export function getClientOverallCompletion(client: ClientLike): number {
  const allFields = COMPLETION_CATEGORIES.flatMap((c) => c.fields)
  if (allFields.length === 0) return 0
  const filled = allFields.filter((field) => isFilled(client[field])).length
  return Math.round((filled / allFields.length) * 100)
}

/** Promedia la completitud por categoría a lo largo de varios clientes. */
export function getAggregateCompletionByCategory(clients: ClientLike[]): CategoryCompletion[] {
  if (clients.length === 0) {
    return COMPLETION_CATEGORIES.map((c) => ({
      key: c.key,
      label: c.label,
      percentage: 0,
      filled: 0,
      total: c.fields.length,
    }))
  }

  return COMPLETION_CATEGORIES.map((category) => {
    const total = category.fields.length
    let filledSum = 0
    for (const client of clients) {
      filledSum += category.fields.filter((field) => isFilled(client[field])).length
    }
    // Porcentaje promedio de completitud de la categoría entre todos los clientes.
    const percentage =
      total === 0 ? 0 : Math.round((filledSum / (total * clients.length)) * 100)
    return { key: category.key, label: category.label, percentage, filled: filledSum, total }
  })
}
