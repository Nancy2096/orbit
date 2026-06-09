// Marketing Intelligence Types - Phase 1

export interface MIClient {
  id: string
  name: string
  industry: string
  type: 'enterprise' | 'pyme' | 'startup' | 'corporativo'
  accountManager: string
  internalResponsible: string
  brandsCount: number
  activeCampaigns: number
  monthlyInvestment: number
  monthlyLeads: number
  avgCPL: number
  status: 'activo' | 'inactivo' | 'pausado'
  clientAccess: boolean
  lastUpdated: string
  logo?: string
  brandColors?: string[]
  website?: string
  contacts: MIContact[]
  notes?: string
}

export interface MIContact {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  isPrimary: boolean
}

export interface MIBrand {
  id: string
  clientId: string
  name: string
  logo?: string
  colors?: string[]
  socialNetworks: MISocialNetwork[]
  website?: string
  country: string
  city: string
  industry: string
  status: 'activo' | 'inactivo'
}

export interface MISocialNetwork {
  platform: string
  url: string
  connected: boolean
}

export interface MICampaign {
  id: string
  clientId: string
  brandId: string
  platform: 'meta' | 'google' | 'tiktok' | 'linkedin' | 'twitter'
  name: string
  objective: string
  funnelStage: 'awareness' | 'engagement' | 'leads' | 'conversions' | 'remarketing'
  budget: number
  spent: number
  impressions: number
  reach: number
  clicks: number
  ctr: number
  cpc: number
  cpm: number
  leads: number
  cpl: number
  conversions: number
  cpa: number
  roas: number
  frequency: number
  leadQuality: 'alta' | 'media' | 'baja'
  costPerAppointment?: number
  costPerSale?: number
  status: 'activo' | 'pausado' | 'completado' | 'error'
  alerts: MIAlert[]
  startDate: string
  endDate?: string
}

export interface MIAlert {
  id: string
  type: 'warning' | 'error' | 'info'
  message: string
  date: string
}

export interface MIConnector {
  id: string
  platform: string
  category: 'ads' | 'social' | 'web' | 'seo' | 'crm' | 'ecommerce' | 'email' | 'bi' | 'warehouse' | 'api'
  clientId?: string
  brandId?: string
  status: 'connected' | 'disconnected' | 'token_expired' | 'error' | 'pending'
  lastSync?: string
  nextSync?: string
  availableMetrics: string[]
  icon: string
}

export interface MILead {
  id: string
  clientId: string
  brandId: string
  campaignId: string
  source: string
  adName?: string
  keyword?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  commercialStatus: 'nuevo' | 'contactado' | 'calificado' | 'cita' | 'propuesta' | 'venta' | 'perdido'
  quality: 'alta' | 'media' | 'baja'
  funnelStage: 'lead' | 'prospect' | 'appointment' | 'visit' | 'proposal' | 'sale' | 'lost'
  createdAt: string
  name?: string
  email?: string
  phone?: string
}

export interface MIDashboardWidget {
  id: string
  type: 'kpi' | 'line_chart' | 'bar_chart' | 'donut_chart' | 'table' | 'funnel' | 'comparison' | 'ranking' | 'alerts' | 'comments' | 'connector_status' | 'progress'
  title: string
  size: 'small' | 'medium' | 'large' | 'full'
  position: { x: number; y: number }
  config: Record<string, any>
}

export interface MIDashboard {
  id: string
  name: string
  clientId?: string
  brandId?: string
  template?: string
  widgets: MIDashboardWidget[]
  createdAt: string
  updatedAt: string
}

export interface MIDataSource {
  id: string
  name: string
  type: string
  status: 'synced' | 'syncing' | 'error' | 'pending'
  lastSync?: string
  tablesCount: number
  recordsCount: number
}

export interface MIDestination {
  id: string
  name: string
  type: 'supabase' | 'postgresql' | 'bigquery' | 'snowflake' | 'sheets' | 'powerbi' | 'looker'
  status: 'connected' | 'disconnected' | 'error'
}

export interface MINormalizedField {
  original: string
  normalized: string
  platform: string
  description: string
}

export interface MICalculatedField {
  name: string
  formula: string
  description: string
}

export interface MIMetrics {
  totalInvestment: number
  totalLeads: number
  avgCPL: number
  avgCTR: number
  avgCPC: number
  avgCPM: number
  totalConversions: number
  avgCPA: number
  avgROAS: number
  totalReach: number
  totalImpressions: number
  connectedAccounts: number
  errorAccounts: number
  expiredTokens: number
  criticalAlerts: number
}

export type MIPeriod = '7d' | '14d' | '30d' | '90d' | 'mtd' | 'qtd' | 'ytd' | 'custom'
