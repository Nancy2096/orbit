// Permisos individuales por usuario (tabla user_permissions). Complementan a los
// permisos por rol: superadmin y director general siempre los tienen.
export const USER_PERMISSION_KEYS = {
  accountsEdit: "accounts.edit",
  accountsEditCommissions: "accounts.edit_commissions",
} as const

export type UserPermissionKey = (typeof USER_PERMISSION_KEYS)[keyof typeof USER_PERMISSION_KEYS]

export const ROLES_WITH_ALL_USER_PERMISSIONS = ["superadmin", "direccion_general"]
