export interface Agency {
  id: string
  name: string
  legal_name: string | null
  tax_id: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  logo_url: string | null
  currency: string
  is_active: boolean
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Role {
  id: string
  name: string
  display_name: string
  description: string | null
  level: number
  scope: 'global' | 'agency' | 'project'
  is_system: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  avatar_url: string | null
  role_id: string | null
  is_active: boolean
  last_login: string | null
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
  role?: Role
  agencies?: UserAgency[]
}

export interface UserAgency {
  id: string
  user_id: string
  agency_id: string
  is_primary: boolean
  created_at: string
  agency?: Agency
}

export interface Permission {
  id: string
  module: string
  action: string
  description: string | null
  created_at: string
}

export interface RolePermission {
  id: string
  role_id: string
  permission_id: string
  created_at: string
  permission?: Permission
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  module: string
  record_id: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  user?: User
}

// Dashboard stats
export interface DashboardStats {
  totalAgencies: number
  totalUsers: number
  activeUsers: number
  totalRoles: number
}

// Helper type for user with full relations
export interface UserWithRelations extends User {
  role: Role | null
  agencies: (UserAgency & { agency: Agency })[]
}
