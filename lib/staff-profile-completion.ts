// Utilidad para calcular el porcentaje de llenado del perfil de un miembro del personal.
// Agrupa los campos en categorías para poder mostrar tanto un total como un desglose.

export interface StaffProfileFields {
  // Información básica
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  employee_code?: string | null
  hire_date?: string | null
  photo_url?: string | null
  // Puesto y organización
  position?: string | null
  position_id?: string | null
  department?: string | null
  department_id?: string | null
  reports_to_id?: string | null
  contract_type_id?: string | null
  contract_type?: string | null
  // Contacto personal
  personal_email?: string | null
  personal_phone?: string | null
  address_street?: string | null
  address_colony?: string | null
  address_city?: string | null
  address_state?: string | null
  address_zip?: string | null
  address_country?: string | null
  // Contacto de emergencia
  emergency_contact_name?: string | null
  emergency_contact_relationship?: string | null
  emergency_contact_phone?: string | null
  emergency_contact_email?: string | null
  // Información bancaria
  bank_name?: string | null
  bank_account_number?: string | null
  bank_clabe?: string | null
  bank_account_holder?: string | null
}

export interface ProfileCategory {
  key: string
  label: string
  filled: number
  total: number
  percentage: number
}

export interface ProfileCompletion {
  percentage: number
  filled: number
  total: number
  categories: ProfileCategory[]
}

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === "string") return value.trim().length > 0
  if (typeof value === "number") return true
  if (typeof value === "boolean") return true
  if (Array.isArray(value)) return value.length > 0
  return Boolean(value)
}

// Cada categoría usa un campo "representativo" cuando hay alternativas
// (ej. position_id o position cuentan como el mismo dato).
const CATEGORY_DEFINITIONS: {
  key: string
  label: string
  fields: (keyof StaffProfileFields | (keyof StaffProfileFields)[])[]
}[] = [
  {
    key: "basic",
    label: "Información básica",
    fields: ["first_name", "last_name", "email", "phone", "employee_code", "hire_date", "photo_url"],
  },
  {
    key: "position",
    label: "Puesto y organización",
    fields: [
      ["position_id", "position"],
      ["department_id", "department"],
      "reports_to_id",
      ["contract_type_id", "contract_type"],
    ],
  },
  {
    key: "contact",
    label: "Contacto personal",
    fields: [
      "personal_email",
      "personal_phone",
      "address_street",
      "address_colony",
      "address_city",
      "address_state",
      "address_zip",
      "address_country",
    ],
  },
  {
    key: "emergency",
    label: "Contacto de emergencia",
    fields: [
      "emergency_contact_name",
      "emergency_contact_relationship",
      "emergency_contact_phone",
      "emergency_contact_email",
    ],
  },
  {
    key: "bank",
    label: "Información bancaria",
    fields: ["bank_name", "bank_account_number", "bank_clabe", "bank_account_holder"],
  },
]

export function calculateProfileCompletion(staff: StaffProfileFields | null | undefined): ProfileCompletion {
  const categories: ProfileCategory[] = CATEGORY_DEFINITIONS.map((def) => {
    const total = def.fields.length
    let filled = 0
    for (const field of def.fields) {
      if (Array.isArray(field)) {
        // El dato cuenta como lleno si cualquiera de las alternativas tiene valor.
        if (field.some((f) => isFilled(staff?.[f]))) filled++
      } else if (isFilled(staff?.[field])) {
        filled++
      }
    }
    return {
      key: def.key,
      label: def.label,
      filled,
      total,
      percentage: total === 0 ? 0 : Math.round((filled / total) * 100),
    }
  })

  const totalFields = categories.reduce((sum, c) => sum + c.total, 0)
  const totalFilled = categories.reduce((sum, c) => sum + c.filled, 0)

  return {
    percentage: totalFields === 0 ? 0 : Math.round((totalFilled / totalFields) * 100),
    filled: totalFilled,
    total: totalFields,
    categories,
  }
}

// Lógica de semáforo: rojo (bajo), ámbar (medio), verde (alto).
export type ProfileCompletionLevel = "low" | "medium" | "high"

export function getCompletionLevel(percentage: number): ProfileCompletionLevel {
  if (percentage >= 80) return "high"
  if (percentage >= 50) return "medium"
  return "low"
}

export function getCompletionColors(percentage: number): {
  level: ProfileCompletionLevel
  // Clase para el relleno de la barra
  bar: string
  // Clase de texto
  text: string
  // Etiqueta legible
  label: string
} {
  const level = getCompletionLevel(percentage)
  switch (level) {
    case "high":
      return { level, bar: "bg-green-500", text: "text-green-600", label: "Completo" }
    case "medium":
      return { level, bar: "bg-amber-500", text: "text-amber-600", label: "Parcial" }
    default:
      return { level, bar: "bg-red-500", text: "text-red-600", label: "Incompleto" }
  }
}
