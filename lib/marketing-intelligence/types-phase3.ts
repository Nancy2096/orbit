// Phase 3 Types for Marketing Intelligence

// ==================== REPORTS ====================
export type ReportFrequency = 'diario' | 'semanal' | 'quincenal' | 'mensual' | 'trimestral' | 'personalizado'
export type ReportStatus = 'borrador' | 'programado' | 'enviado' | 'error'
export type ReportFormat = 'pdf' | 'excel' | 'csv'

export interface ReportTemplate {
  id: string
  name: string
  description: string
  sections: string[]
  thumbnail?: string
}

export interface ReportSection {
  id: string
  name: string
  type: 'kpi' | 'chart' | 'table' | 'text' | 'image'
  module: string
  enabled: boolean
  order: number
}

export interface Report {
  id: string
  name: string
  clientId: string
  clientName: string
  brandId: string
  brandName: string
  templateId: string
  templateName: string
  frequency: ReportFrequency
  sections: ReportSection[]
  recipients: string[]
  lastSent?: string
  nextSend?: string
  status: ReportStatus
  responsibleId: string
  responsibleName: string
  includeAiComments: boolean
  managerComments?: string
  conclusions?: string
  nextSteps?: string
  useAgencyBranding: boolean
  includeClientLogo: boolean
  useClientColors: boolean
  createdAt: string
  updatedAt: string
}

export interface ReportHistory {
  id: string
  reportId: string
  reportName: string
  clientName: string
  brandName: string
  sentAt: string
  recipients: string[]
  format: ReportFormat
  status: 'enviado' | 'error' | 'pendiente'
  responsibleName: string
  fileUrl?: string
}

// ==================== AI & INSIGHTS ====================
export type AiProvider = 'chatgpt' | 'gemini' | 'otro'
export type InsightType = 'anomaly' | 'recommendation' | 'finding' | 'alert'
export type InsightPriority = 'baja' | 'media' | 'alta' | 'critica'

export interface AiInsight {
  id: string
  type: InsightType
  title: string
  description: string
  clientId: string
  clientName: string
  brandId?: string
  brandName?: string
  module: string
  priority: InsightPriority
  metric?: string
  currentValue?: number
  previousValue?: number
  changePercent?: number
  recommendation?: string
  createdAt: string
  status: 'nuevo' | 'revisado' | 'aplicado' | 'ignorado'
}

export interface AiTask {
  id: string
  task: string
  clientId: string
  clientName: string
  brandId?: string
  brandName?: string
  priority: InsightPriority
  suggestedResponsible: string
  suggestedDate: string
  status: 'pendiente' | 'asignada' | 'completada'
  createdAt: string
}

export interface ContentGeneratorRequest {
  type: 'copy' | 'caption' | 'hashtags' | 'campaign_idea' | 'executive_summary' | 'next_steps'
  clientId: string
  brandId?: string
  context?: string
  tone?: string
  platform?: string
}

// ==================== ALERTS ====================
export type AlertType = 
  | 'cpl_alto' 
  | 'ctr_bajo' 
  | 'sin_leads' 
  | 'cuenta_desconectada' 
  | 'token_expirado'
  | 'post_pendiente'
  | 'post_no_publicado'
  | 'comentario_negativo'
  | 'competidor_creciendo'
  | 'reporte_pendiente'
  | 'presupuesto_agotado'
  | 'frecuencia_alta'
  | 'roas_bajo'
  | 'sin_conversiones'
  | 'error_sincronizacion'
  | 'seo_caida'
  | 'keyword_perdida'
  | 'smartlink_caida'
  | 'inbox_sin_responder'
  | 'publicacion_rechazada'

export type AlertPriority = 'baja' | 'media' | 'alta' | 'critica'
export type AlertStatus = 'nueva' | 'en_revision' | 'asignada' | 'resuelta' | 'ignorada'
export type AlertChannel = 'sistema' | 'email' | 'slack' | 'whatsapp'

export interface Alert {
  id: string
  type: AlertType
  title: string
  description: string
  clientId: string
  clientName: string
  brandId?: string
  brandName?: string
  module: string
  priority: AlertPriority
  status: AlertStatus
  responsibleId?: string
  responsibleName?: string
  suggestedAction: string
  sourceUrl?: string
  createdAt: string
  resolvedAt?: string
  channels: AlertChannel[]
}

export interface AlertRule {
  id: string
  name: string
  type: AlertType
  condition: string
  threshold: number
  priority: AlertPriority
  channels: AlertChannel[]
  enabled: boolean
  clientIds?: string[]
  brandIds?: string[]
}

// ==================== USERS & PERMISSIONS ====================
export type UserRole = 'director' | 'account_manager' | 'analista' | 'community_manager' | 'disenador' | 'cliente' | 'solo_lectura'
export type UserStatus = 'activo' | 'inactivo' | 'pendiente'

export type PermissionAction = 
  | 'ver' 
  | 'crear' 
  | 'editar' 
  | 'eliminar' 
  | 'aprobar' 
  | 'comentar' 
  | 'exportar' 
  | 'programar' 
  | 'publicar' 
  | 'responder_inbox' 
  | 'ver_metricas' 
  | 'ver_reportes' 
  | 'conectar_cuentas' 
  | 'admin_usuarios' 
  | 'config_ia' 
  | 'config_reportes'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: UserRole
  assignedClients: string[]
  assignedBrands: string[]
  status: UserStatus
  lastAccess?: string
  createdAt: string
}

export interface Permission {
  moduleId: string
  moduleName: string
  actions: {
    action: PermissionAction
    allowed: boolean
  }[]
}

export interface RolePermissions {
  role: UserRole
  roleName: string
  description: string
  permissions: Permission[]
}

// ==================== AUDIT LOG ====================
export type AuditAction = 
  | 'conexion_cuenta'
  | 'desconexion_cuenta'
  | 'token_expirado'
  | 'crear_dashboard'
  | 'editar_dashboard'
  | 'crear_reporte'
  | 'enviar_reporte'
  | 'crear_post'
  | 'aprobar_post'
  | 'rechazar_post'
  | 'responder_inbox'
  | 'crear_smartlink'
  | 'cambiar_permisos'
  | 'exportar_datos'
  | 'generar_insight'
  | 'crear_alerta'
  | 'resolver_alerta'
  | 'login'
  | 'logout'

export interface AuditLog {
  id: string
  userId: string
  userName: string
  userEmail: string
  action: AuditAction
  actionLabel: string
  module: string
  clientId?: string
  clientName?: string
  brandId?: string
  brandName?: string
  recordId?: string
  recordType?: string
  previousValue?: string
  newValue?: string
  ip: string
  device: string
  browser: string
  timestamp: string
}

// ==================== SETTINGS ====================
export interface GeneralSettings {
  moduleName: string
  logo?: string
  primaryColor: string
  secondaryColor: string
  darkMode: boolean
  timezone: string
  currency: string
  language: string
}

export interface BrandingSettings {
  agencyName: string
  agencyLogo?: string
  agencyColors: {
    primary: string
    secondary: string
    accent: string
  }
  reportFooter?: string
  emailSignature?: string
}

export interface ConnectorSettings {
  autoSync: boolean
  syncFrequency: 'hourly' | 'daily' | 'weekly'
  retryAttempts: number
  notifyOnError: boolean
}

export interface AiSettings {
  provider: AiProvider
  model?: string
  autoGenerateInsights: boolean
  insightFrequency: 'daily' | 'weekly'
  contentSuggestions: boolean
  anomalyDetection: boolean
}

export interface AlertSettings {
  emailNotifications: boolean
  inAppNotifications: boolean
  digestFrequency: 'instant' | 'hourly' | 'daily'
  defaultPriority: AlertPriority
  thresholds: {
    cplIncrease: number
    ctrDecrease: number
    roasDecrease: number
    keywordPositionDrop: number
    competitorGrowth: number
  }
}

export interface Settings {
  general: GeneralSettings
  branding: BrandingSettings
  connectors: ConnectorSettings
  ai: AiSettings
  alerts: AlertSettings
}

// ==================== DATA WAREHOUSE ADVANCED ====================
export type DataDestination = 'supabase' | 'postgresql' | 'bigquery' | 'snowflake' | 'google_sheets' | 'power_bi' | 'looker_studio'

export interface DataBlend {
  id: string
  name: string
  description: string
  sources: {
    sourceId: string
    sourceName: string
    fields: string[]
  }[]
  joinKey: string
  outputFields: string[]
  status: 'activo' | 'inactivo'
  lastSync?: string
}

export interface DataDestinationConfig {
  id: string
  type: DataDestination
  name: string
  config: Record<string, string>
  tables: string[]
  status: 'conectado' | 'desconectado' | 'error'
  lastSync?: string
}

export interface SyncLog {
  id: string
  connectorId: string
  connectorName: string
  startTime: string
  endTime?: string
  status: 'en_progreso' | 'completado' | 'error'
  recordsProcessed: number
  recordsFailed: number
  errorMessage?: string
}

export interface FieldMapping {
  id: string
  sourceField: string
  sourceType: string
  targetField: string
  targetType: string
  transformation?: string
  isRequired: boolean
}

export interface CalculatedField {
  id: string
  name: string
  formula: string
  resultType: 'number' | 'string' | 'date' | 'boolean'
  description?: string
}

// ==================== CONNECTOR BUILDER ====================
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
export type AuthType = 'none' | 'api_key' | 'oauth' | 'bearer'

export interface CustomConnector {
  id: string
  name: string
  category: string
  baseUrl: string
  endpoint: string
  method: HttpMethod
  headers: Record<string, string>
  params: Record<string, string>
  authType: AuthType
  authConfig?: Record<string, string>
  syncFrequency: 'hourly' | 'daily' | 'weekly' | 'manual'
  fieldMappings: FieldMapping[]
  status: 'activo' | 'inactivo' | 'error'
  lastTest?: string
  lastTestStatus?: 'success' | 'error'
  createdAt: string
}

// ==================== SUPABASE SCHEMA ====================
export interface SupabaseSchema {
  users: User
  roles: RolePermissions
  permissions: Permission
  clients: {
    id: string
    name: string
    industry: string
    status: string
  }
  brands: {
    id: string
    clientId: string
    name: string
    status: string
  }
  campaigns: {
    id: string
    brandId: string
    name: string
    platform: string
    status: string
  }
  connectors: {
    id: string
    brandId: string
    platform: string
    status: string
  }
  connector_logs: SyncLog
  metrics: {
    id: string
    campaignId: string
    date: string
    impressions: number
    clicks: number
    spend: number
    conversions: number
  }
  social_posts: {
    id: string
    brandId: string
    platform: string
    content: string
    status: string
  }
  inbox_messages: {
    id: string
    brandId: string
    platform: string
    message: string
    status: string
  }
  leads: {
    id: string
    brandId: string
    name: string
    email: string
    status: string
  }
  seo_keywords: {
    id: string
    brandId: string
    keyword: string
    position: number
  }
  competitors: {
    id: string
    brandId: string
    name: string
    url: string
  }
  smartlinks: {
    id: string
    brandId: string
    shortUrl: string
    targetUrl: string
  }
  reports: Report
  alerts: Alert
  audit_logs: AuditLog
  settings: Settings
}
