type ProspectFields = Record<string, unknown>

const hasValue = (value: unknown) => {
  if (value === null || value === undefined) return false
  if (typeof value === "string") return value.trim().length > 0
  return true
}

// Campos que se capturan en la pestaña "Información" del detalle del prospecto.
const COMPLETENESS_CHECKS: Array<(p: ProspectFields) => boolean> = [
  (p) => hasValue(p.assigned_to),
  (p) => hasValue(p.contact_name),
  (p) => hasValue(p.contact_position),
  (p) => hasValue(p.industry_id) || hasValue(p.client_type_id),
  (p) => hasValue(p.product_id),
  (p) => hasValue(p.project_count),
  (p) => hasValue(p.contact_email),
  (p) => hasValue(p.contact_phone),
  (p) => hasValue(p.company_name),
  (p) => hasValue(p.website),
  (p) => hasValue(p.country),
  (p) => hasValue(p.state_province),
  (p) =>
    hasValue(p.social_facebook) ||
    hasValue(p.social_instagram) ||
    hasValue(p.social_linkedin) ||
    hasValue(p.social_twitter),
  (p) => hasValue(p.estimated_value) && Number(p.estimated_value) > 0,
  (p) => hasValue(p.currency_id),
  (p) => hasValue(p.expected_close_date),
  (p) => hasValue(p.description),
  (p) => hasValue(p.notes),
]

export const PROSPECT_COMPLETENESS_COLUMNS =
  "assigned_to, contact_name, contact_position, industry_id, client_type_id, product_id, project_count, contact_email, contact_phone, company_name, website, country, state_province, social_facebook, social_instagram, social_linkedin, social_twitter, estimated_value, currency_id, expected_close_date, description, notes"

export function getProspectCompleteness(prospect: ProspectFields) {
  const total = COMPLETENESS_CHECKS.length
  const filled = COMPLETENESS_CHECKS.filter((check) => check(prospect)).length
  return { filled, total, percent: Math.round((filled / total) * 100) }
}

export function getCompletenessColor(percent: number) {
  if (percent >= 80) return "bg-emerald-500"
  if (percent >= 50) return "bg-amber-500"
  return "bg-red-500"
}
