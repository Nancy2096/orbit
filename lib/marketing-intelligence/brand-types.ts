// Brand Types for Orbit Marketing Intelligence

export type BrandStatus = 'activo' | 'pausado' | 'archivado' | 'borrador'
export type ProjectType = 'inmobiliario' | 'producto' | 'servicio' | 'ecommerce' | 'otro'
export type RealEstateStage = 'preventa' | 'lanzamiento' | 'comercializacion' | 'cierre' | 'entregado'
export type ApprovalStatus = 'borrador' | 'en_revision' | 'aprobado' | 'rechazado' | 'archivado'

// Main Brand Interface
export interface MIBrand {
  id: string
  clientId: string
  name: string
  status: BrandStatus
  projectType: ProjectType
  industry: string
  country: string
  city: string
  website?: string
  socialMedia?: {
    instagram?: string
    facebook?: string
    tiktok?: string
    linkedin?: string
    youtube?: string
    twitter?: string
  }
  logo?: string
  colors?: string[]
  typography?: string
  toneOfVoice?: string
  valueProposition?: string
  differentiators?: string[]
  competitors?: string[]
  productsServices?: string[]
  monthlyBudget?: number
  commercialObjective?: string
  startDate?: string
  internalManager?: string
  createdAt: string
  updatedAt: string
  
  // Completion percentages
  profileCompletion: number
  briefCompletion: number
  objectivesCompletion: number
  personasCompletion: number
  assetsCompletion: number
  
  // Real Estate specific fields
  realEstate?: RealEstateInfo
}

// Real Estate specific information
export interface RealEstateInfo {
  location: string
  priceFrom: number
  priceTo?: number
  totalUnits: number
  availableUnits: number
  typologies: string[] // "Depto 1 rec", "Depto 2 rec", etc.
  sqmFrom: number
  sqmTo: number
  amenities: string[]
  deliveryDate: string
  stage: RealEstateStage
  paymentOptions?: string
  financing?: string
  appreciation?: string
  
  // Goals
  salesGoal?: number
  reservationsGoal?: number
  appointmentsGoal?: number
  visitsGoal?: number
}

// Brand Brief
export interface BrandBrief {
  id: string
  brandId: string
  qualityScore: number // 0-100
  lastUpdated: string
  version: number
  
  // Sections
  generalInfo?: string
  history?: string
  productDescription?: string
  valueProposition?: string
  differentiators?: string
  competitors?: string
  targetAudience?: string
  geographicZones?: string
  salesProcess?: string
  commonObjections?: string
  faqs?: string[]
  promotions?: string
  restrictions?: string
  toneVoice?: string
  preferredChannels?: string[]
  expectedResults?: string
  objectives?: string
  budget?: string
  existingMaterials?: string
  importantDates?: string
  additionalInsights?: string
  
  // Approval
  status: ApprovalStatus
  approvedBy?: string
  approvedAt?: string
}

// Brand Objectives
export interface BrandObjectives {
  id: string
  brandId: string
  period: string // "2024-Q1", "2024-01", etc.
  
  // Sales objectives
  salesGoal?: number
  reservationsGoal?: number
  appointmentsGoal?: number
  visitsGoal?: number
  leadsGoal?: number
  qualifiedLeadsGoal?: number
  revenueGoal?: number
  roasGoal?: number
  conversionRateGoal?: number
  
  // Budget
  totalBudget: number
  organicBudget?: number
  paidBudget?: number
  budgetByChannel?: Record<string, number>
  
  // KPIs with ranges
  kpis: KPIRange[]
}

export interface KPIRange {
  id: string
  name: string
  code: string // CPL, CPC, etc.
  minValue: number
  maxValue: number
  currentValue?: number
  unit: 'currency' | 'percentage' | 'number'
  status?: 'green' | 'yellow' | 'red'
}

// Buyer Persona
export interface BuyerPersona {
  id: string
  brandId: string
  name: string
  image?: string
  imageGenerated: boolean
  
  // Demographics
  age: number
  ageRange?: string
  gender: 'masculino' | 'femenino' | 'otro'
  location: string
  socioeconomicLevel: string // "A/B", "C+", "C", "D+", etc.
  profession: string
  maritalStatus: string
  income?: string
  
  // Psychographics
  motivations: string[]
  pains: string[]
  objections: string[]
  fears: string[]
  desires: string[]
  purchaseActivators: string[]
  purchaseBarriers: string[]
  
  // Media & Content
  channels: string[]
  socialNetworks: string[]
  contentTypes: string[]
  
  // Messaging
  persuasiveMessages: string[]
  messagesToAvoid: string[]
  keywords: string[]
  interests: string[]
  hooks: string[]
  ctas: string[]
  creativeAngles: string[]
  
  // Status
  status: ApprovalStatus
  approvedBy?: string
  approvedAt?: string
  createdAt: string
  updatedAt: string
}

// Brand Assets
export interface BrandAsset {
  id: string
  brandId: string
  type: AssetType
  name: string
  url?: string
  driveId?: string
  uploadedAt: string
  status: 'pendiente' | 'aprobado' | 'rechazado'
}

export type AssetType = 
  | 'logo'
  | 'manual'
  | 'brandbook'
  | 'typography'
  | 'palette'
  | 'photo'
  | 'video'
  | 'render'
  | 'brochure'
  | 'presentation'
  | 'reference'
  | 'template'

// Blocking Rules
export interface BlockingRule {
  id: string
  condition: string
  blockedFeature: string
  reason: string
  missingInfo: string[]
  recommendedAction: string
  actionUrl: string
}

// Default KPIs for real estate
export const defaultRealEstateKPIs: Omit<KPIRange, 'id'>[] = [
  { name: 'Costo por Lead', code: 'CPL', minValue: 50, maxValue: 150, unit: 'currency' },
  { name: 'Costo por Clic', code: 'CPC', minValue: 5, maxValue: 20, unit: 'currency' },
  { name: 'CPM', code: 'CPM', minValue: 30, maxValue: 80, unit: 'currency' },
  { name: 'CTR', code: 'CTR', minValue: 1, maxValue: 3, unit: 'percentage' },
  { name: 'Costo por Adquisición', code: 'CPA', minValue: 500, maxValue: 2000, unit: 'currency' },
  { name: 'Costo por Interacción', code: 'CPI', minValue: 1, maxValue: 5, unit: 'currency' },
  { name: 'Costo por Cita', code: 'CPAP', minValue: 200, maxValue: 800, unit: 'currency' },
  { name: 'ROAS', code: 'ROAS', minValue: 3, maxValue: 10, unit: 'number' },
  { name: 'Frecuencia', code: 'FREQ', minValue: 2, maxValue: 5, unit: 'number' },
  { name: 'Engagement Rate', code: 'ER', minValue: 2, maxValue: 8, unit: 'percentage' },
]

// Asset types for real estate
export const realEstateAssetTypes: { type: AssetType; label: string; required: boolean }[] = [
  { type: 'logo', label: 'Logotipos', required: true },
  { type: 'brandbook', label: 'Brandbook / Manual de marca', required: false },
  { type: 'typography', label: 'Tipografías', required: true },
  { type: 'palette', label: 'Paleta de colores', required: true },
  { type: 'render', label: 'Renders', required: true },
  { type: 'photo', label: 'Fotografías', required: false },
  { type: 'video', label: 'Videos', required: false },
  { type: 'brochure', label: 'Brochures / Folletos', required: false },
  { type: 'presentation', label: 'Presentaciones', required: false },
  { type: 'reference', label: 'Referencias visuales', required: false },
]

// ============================================
// FASE 3: Marketing Intelligence Center
// ============================================

// Media Connection Types
export type MediaType = 
  | 'meta_ads'
  | 'google_ads'
  | 'tiktok_ads'
  | 'linkedin_ads'
  | 'twitter_ads'
  | 'meta_organic'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'google_analytics'
  | 'google_search_console'
  | 'hubspot'
  | 'salesforce'
  | 'whatsapp_business'
  | 'mailchimp'
  | 'activecampaign'

export interface MediaConnection {
  id: string
  brandId: string
  type: MediaType
  name: string
  status: 'connected' | 'disconnected' | 'error' | 'syncing'
  accountId?: string
  accountName?: string
  lastSync?: string
  metrics: string[]
  permissions: string[]
  errors?: string[]
  connectedAt?: string
}

// Campaign Performance
export interface CampaignPerformance {
  id: string
  brandId: string
  campaignId?: string
  campaignName: string
  channel: MediaType
  objective: string
  status: 'active' | 'paused' | 'completed' | 'draft'
  investment: number
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
  appointments: number
  cpAppointment: number
  sales: number
  revenue: number
  roas: number
  frequency: number
  buyerPersonaId?: string
  funnelStage: 'awareness' | 'consideration' | 'conversion' | 'retention'
  startDate: string
  endDate?: string
  period: string
}

// Organic Content Performance
export interface OrganicContentPerformance {
  id: string
  brandId: string
  contentId?: string
  title: string
  platform: 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'linkedin' | 'twitter'
  type: 'imagen' | 'video' | 'reel' | 'story' | 'carrusel' | 'live' | 'article'
  pillar?: string
  funnelStage: 'awareness' | 'consideration' | 'conversion' | 'retention'
  reach: number
  impressions: number
  engagement: number
  engagementRate: number
  likes: number
  comments: number
  shares: number
  saves: number
  clicks?: number
  views?: number
  watchTime?: number
  retention?: number
  leads?: number
  buyerPersonaId?: string
  publishedAt: string
  thumbnailUrl?: string
}

// AI Insights
export type InsightType = 'trend' | 'opportunity' | 'warning' | 'recommendation' | 'anomaly' | 'pattern'
export type InsightImpact = 'high' | 'medium' | 'low'

export interface AIInsight {
  id: string
  brandId: string
  type: InsightType
  title: string
  finding: string
  evidence: string
  metric?: string
  metricValue?: number
  metricChange?: number
  impact: InsightImpact
  recommendation: string
  priority: number
  action: string
  actionUrl?: string
  dataSource: string
  gemAgent?: string
  createdAt: string
  expiresAt?: string
  acknowledged: boolean
}

// Smart Alerts
export type AlertType = 'info' | 'attention' | 'risk' | 'critical' | 'opportunity' | 'success'

export interface SmartAlert {
  id: string
  brandId: string
  type: AlertType
  category: 'kpi' | 'budget' | 'campaign' | 'content' | 'audience' | 'competitor' | 'system'
  title: string
  description: string
  metric?: string
  threshold?: number
  currentValue?: number
  targetValue?: number
  variance?: number
  campaignId?: string
  contentId?: string
  actionUrl?: string
  actionLabel?: string
  createdAt: string
  expiresAt?: string
  acknowledged: boolean
  acknowledgedAt?: string
  acknowledgedBy?: string
}

// Reports
export interface ReportKPI {
  name: string
  code: string
  value: number
  target: number
  variance: number
  status: 'above' | 'on-track' | 'below' | 'critical'
  trend: 'up' | 'down' | 'stable'
  previousValue?: number
}

export interface ReportRanking {
  type: 'campaign' | 'content'
  items: {
    id: string
    name: string
    metric: string
    value: number
    rank: number
  }[]
}

export interface ExecutiveReport {
  id: string
  brandId: string
  month: number
  year: number
  period: string
  status: 'draft' | 'generated' | 'approved' | 'sent'
  summary: string
  highlights: string[]
  kpis: ReportKPI[]
  rankings: ReportRanking[]
  topCampaigns: string[]
  topContent: string[]
  learnings: string[]
  recommendations: string[]
  nextMonthFocus: string[]
  investmentSummary: {
    total: number
    byChannel: { channel: string; amount: number; percentage: number }[]
  }
  leadsSummary: {
    total: number
    qualified: number
    appointments: number
    sales: number
  }
  createdAt: string
  approvedAt?: string
  sentAt?: string
}

// AI Generation Logs
export interface AIGenerationLog {
  id: string
  brandId: string
  type: 'insight' | 'persona' | 'recommendation' | 'report' | 'content' | 'brief'
  prompt: string
  response: string
  model: string
  tokens: number
  cost?: number
  duration: number
  status: 'success' | 'error' | 'partial'
  error?: string
  createdAt: string
  createdBy?: string
}

// KPI Status for semáforo
export type KPIStatus = 'excellent' | 'good' | 'warning' | 'critical'

export interface KPIWithStatus {
  code: string
  name: string
  value: number
  target: number
  min: number
  max: number
  status: KPIStatus
  variance: number
  trend: 'up' | 'down' | 'stable'
  unit: 'currency' | 'percentage' | 'number'
}

// Channel Dashboard Config
export interface ChannelDashboardConfig {
  channel: MediaType
  name: string
  icon: string
  color: string
  metrics: string[]
  kpis: string[]
}

export const channelConfigs: ChannelDashboardConfig[] = [
  {
    channel: 'meta_ads',
    name: 'Meta Ads',
    icon: 'facebook',
    color: '#1877F2',
    metrics: ['impressions', 'reach', 'clicks', 'leads', 'conversions'],
    kpis: ['CPL', 'CPC', 'CPM', 'CTR', 'ROAS']
  },
  {
    channel: 'google_ads',
    name: 'Google Ads',
    icon: 'chrome',
    color: '#4285F4',
    metrics: ['impressions', 'clicks', 'conversions', 'cost'],
    kpis: ['CPC', 'CPM', 'CTR', 'CPA', 'ROAS']
  },
  {
    channel: 'tiktok_ads',
    name: 'TikTok Ads',
    icon: 'tiktok',
    color: '#000000',
    metrics: ['impressions', 'reach', 'views', 'clicks', 'conversions'],
    kpis: ['CPV', 'CPC', 'CPM', 'CTR', 'ER']
  },
  {
    channel: 'instagram',
    name: 'Instagram',
    icon: 'instagram',
    color: '#E4405F',
    metrics: ['reach', 'impressions', 'engagement', 'followers'],
    kpis: ['ER', 'reach_rate', 'saves_rate']
  },
  {
    channel: 'facebook',
    name: 'Facebook',
    icon: 'facebook',
    color: '#1877F2',
    metrics: ['reach', 'impressions', 'engagement', 'page_views'],
    kpis: ['ER', 'reach_rate', 'shares_rate']
  },
]

