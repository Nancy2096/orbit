// ============================================
// FASE 2: Planeación, Creatividad e IA
// ============================================

// ============ CONTENIDO ORGÁNICO ============

export type ContentStatus = 
  | 'idea'
  | 'draft'
  | 'writing'
  | 'design'
  | 'internal_review'
  | 'client_review'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'paused'

export type ContentFormat = 
  | 'imagen'
  | 'video'
  | 'reel'
  | 'story'
  | 'carrusel'
  | 'live'
  | 'article'
  | 'thread'

export type SocialPlatform = 
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'linkedin'
  | 'youtube'
  | 'twitter'
  | 'pinterest'
  | 'threads'

export type FunnelStage = 'awareness' | 'consideration' | 'conversion' | 'retention'

export interface ContentPillar {
  id: string
  brandId: string
  name: string
  description: string
  color: string
  icon?: string
  percentage: number // Porcentaje del total de contenido
  examples?: string[]
  buyerPersonaIds?: string[]
  funnelStages?: FunnelStage[]
  isActive: boolean
}

export interface ContentPiece {
  id: string
  brandId: string
  title: string
  description?: string
  format: ContentFormat
  platform: SocialPlatform
  pillarId?: string
  buyerPersonaId?: string
  funnelStage: FunnelStage
  status: ContentStatus
  
  // Contenido
  copy?: string
  hashtags?: string[]
  callToAction?: string
  link?: string
  
  // Media
  mediaUrls?: string[]
  thumbnailUrl?: string
  
  // Programación
  scheduledDate?: string
  scheduledTime?: string
  publishedAt?: string
  
  // Asignación
  assignedTo?: string
  createdBy?: string
  
  // Aprobaciones
  internalApproval?: {
    status: 'pending' | 'approved' | 'rejected'
    approvedBy?: string
    approvedAt?: string
    comments?: string
  }
  clientApproval?: {
    status: 'pending' | 'approved' | 'rejected'
    approvedBy?: string
    approvedAt?: string
    comments?: string
  }
  
  // AI
  generatedWithGem?: string
  aiPrompt?: string
  
  // Métricas (post-publicación)
  metrics?: {
    reach?: number
    impressions?: number
    engagement?: number
    likes?: number
    comments?: number
    shares?: number
    saves?: number
    clicks?: number
  }
  
  // Historial de versiones
  version: number
  versionHistory?: ContentVersion[]
  
  createdAt: string
  updatedAt: string
}

// Version history for content pieces
export interface ContentVersion {
  id: string
  version: number
  title: string
  copy?: string
  status: ContentStatus
  changedBy: string
  changedAt: string
  changeType: 'create' | 'edit' | 'status_change' | 'approval' | 'schedule'
  changeDescription?: string
  previousValues?: {
    title?: string
    copy?: string
    status?: ContentStatus
    scheduledDate?: string
  }
}

// Content status configuration
export const contentStatusConfig: Record<ContentStatus, { 
  label: string
  color: string
  bgColor: string
  order: number
}> = {
  idea: { label: 'Idea', color: '#6366f1', bgColor: 'bg-indigo-50', order: 1 },
  draft: { label: 'Borrador', color: '#8b5cf6', bgColor: 'bg-violet-50', order: 2 },
  writing: { label: 'Copywriting', color: '#a855f7', bgColor: 'bg-purple-50', order: 3 },
  design: { label: 'Diseño', color: '#ec4899', bgColor: 'bg-pink-50', order: 4 },
  internal_review: { label: 'Revisión Interna', color: '#f59e0b', bgColor: 'bg-amber-50', order: 5 },
  client_review: { label: 'Aprobación Cliente', color: '#3b82f6', bgColor: 'bg-blue-50', order: 6 },
  approved: { label: 'Aprobado', color: '#10b981', bgColor: 'bg-emerald-50', order: 7 },
  scheduled: { label: 'Programado', color: '#06b6d4', bgColor: 'bg-cyan-50', order: 8 },
  published: { label: 'Publicado', color: '#22c55e', bgColor: 'bg-green-50', order: 9 },
  paused: { label: 'Pausado', color: '#6b7280', bgColor: 'bg-gray-50', order: 10 },
}

// ============ CALENDARIO Y PROGRAMADOR ============

export interface ScheduledPost {
  id: string
  contentPieceId: string
  brandId: string
  platform: SocialPlatform
  scheduledDate: string
  scheduledTime: string
  timezone: string
  status: 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled'
  publishedAt?: string
  errorMessage?: string
  retryCount?: number
}

export interface PublishingHour {
  hour: number // 0-23
  dayOfWeek: number // 0-6 (domingo-sábado)
  score: number // 0-100 engagement score
  engagementRate?: number
  reachEstimate?: number
}

export interface HeatmapData {
  brandId: string
  platform: SocialPlatform
  data: PublishingHour[]
  lastUpdated: string
  dataPoints: number // Cantidad de posts analizados
}

// ============ PAUTA Y CAMPAÑAS PAGADAS ============

export type CampaignObjective = 
  | 'awareness'
  | 'reach'
  | 'traffic'
  | 'engagement'
  | 'leads'
  | 'conversions'
  | 'sales'
  | 'app_installs'
  | 'video_views'
  | 'messages'

export type CampaignStatus = 'draft' | 'pending' | 'active' | 'paused' | 'completed' | 'archived'

export type AdPlatform = 'meta' | 'google' | 'tiktok' | 'linkedin' | 'twitter' | 'youtube'

export interface TargetingCriteria {
  locations?: string[]
  ageMin?: number
  ageMax?: number
  genders?: ('male' | 'female' | 'all')[]
  languages?: string[]
  interests?: string[]
  behaviors?: string[]
  customAudiences?: string[]
  lookalikeAudiences?: string[]
  placements?: string[]
  devices?: string[]
  incomeLevel?: string[]
}

export interface Ad {
  id: string
  adSetId: string
  name: string
  format: 'image' | 'video' | 'carousel' | 'collection' | 'stories'
  status: 'draft' | 'active' | 'paused' | 'rejected'
  primaryText?: string
  headline?: string
  description?: string
  callToAction?: string
  destinationUrl?: string
  mediaUrls?: string[]
  creativeId?: string
  metrics?: {
    impressions: number
    clicks: number
    ctr: number
    spend: number
    conversions: number
    cpc: number
    cpm: number
  }
}

export interface AdSet {
  id: string
  campaignId: string
  name: string
  status: CampaignStatus
  budget: number
  budgetType: 'daily' | 'lifetime'
  startDate: string
  endDate?: string
  targeting: TargetingCriteria
  buyerPersonaId?: string
  placements: string[]
  optimizationGoal?: string
  bidStrategy?: string
  ads: Ad[]
  metrics?: {
    impressions: number
    reach: number
    clicks: number
    ctr: number
    spend: number
    leads: number
    cpl: number
    conversions: number
    cpa: number
  }
}

export interface PaidCampaign {
  id: string
  brandId: string
  name: string
  platform: AdPlatform
  objective: CampaignObjective
  status: CampaignStatus
  budget: number
  budgetType: 'daily' | 'lifetime'
  startDate: string
  endDate?: string
  funnelStage: FunnelStage
  adSets: AdSet[]
  
  // KPIs objetivo
  targetKPIs?: {
    cpl?: { min: number; max: number; target: number }
    cpa?: { min: number; max: number; target: number }
    roas?: { min: number; max: number; target: number }
    ctr?: { min: number; max: number; target: number }
  }
  
  // Métricas agregadas
  metrics?: {
    impressions: number
    reach: number
    clicks: number
    ctr: number
    spend: number
    leads: number
    cpl: number
    conversions: number
    cpa: number
    revenue: number
    roas: number
  }
  
  createdAt: string
  updatedAt: string
}

// ============ MOODBOARDS ============

export interface VisualReference {
  id: string
  url: string
  source?: string
  description?: string
  tags?: string[]
}

export interface ColorPalette {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
  additional?: string[]
}

export interface Moodboard {
  id: string
  brandId: string
  name: string
  description?: string
  purpose: 'campaign' | 'persona' | 'general' | 'seasonal'
  campaignId?: string
  buyerPersonaId?: string
  
  // Visual elements
  references: VisualReference[]
  colorPalette?: ColorPalette
  typography?: {
    primary: string
    secondary?: string
    accent?: string
  }
  
  // AI generation
  aiPrompt?: string
  generatedWithGem?: string
  styleKeywords?: string[]
  moodKeywords?: string[]
  
  // Status
  status: 'draft' | 'approved' | 'archived'
  approvedBy?: string
  approvedAt?: string
  
  createdAt: string
  updatedAt: string
}

// ============ CREATIVOS IA ============

export type ImageFormat = '1:1' | '4:5' | '9:16' | '16:9' | '1.91:1'

export interface GeneratedImage {
  id: string
  brandId: string
  prompt: string
  negativePrompt?: string
  format: ImageFormat
  width: number
  height: number
  imageUrl: string
  thumbnailUrl?: string
  
  // Contexto
  moodboardId?: string
  buyerPersonaId?: string
  campaignId?: string
  contentPieceId?: string
  
  // AI
  model: string
  seed?: number
  style?: string
  
  // Status
  status: 'generating' | 'completed' | 'failed' | 'approved' | 'rejected'
  usedIn?: ('content' | 'campaign' | 'ad')[]
  
  // Metadata
  generatedBy?: string
  generatedAt: string
  tokensUsed?: number
}

export interface CreativeRequest {
  id: string
  brandId: string
  prompt: string
  negativePrompt?: string
  format: ImageFormat
  quantity: number
  style?: string
  moodboardId?: string
  buyerPersonaId?: string
  referenceImages?: string[]
  status: 'pending' | 'processing' | 'completed' | 'failed'
  generatedImages?: string[]
  createdAt: string
}

// ============ GEMs Y AGENTES ============

export type GemType = 
  | 'brief_strategist'
  | 'content_planner'
  | 'copywriter'
  | 'visual_director'
  | 'social_manager'
  | 'paid_strategist'
  | 'data_analyst'
  | 'persona_creator'
  | 'competitor_analyst'
  | 'seo_specialist'
  | 'custom'

export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'custom'

export interface GemConfig {
  id: string
  brandId: string
  type: GemType
  name: string
  description: string
  provider: AIProvider
  model: string
  
  // System prompt
  systemPrompt: string
  
  // Context
  includeContext: {
    brandProfile: boolean
    brief: boolean
    buyerPersonas: boolean
    objectives: boolean
    competitors: boolean
    previousContent: boolean
    moodboards: boolean
  }
  
  // Settings
  temperature: number
  maxTokens: number
  topP?: number
  
  // Permissions
  canEdit: ('admin' | 'director' | 'manager')[]
  canUse: ('admin' | 'director' | 'manager' | 'analyst' | 'creator')[]
  
  // Usage
  isActive: boolean
  usageCount: number
  lastUsedAt?: string
  
  createdAt: string
  updatedAt: string
}

export interface AIGeneration {
  id: string
  brandId: string
  gemId: string
  type: 'content' | 'copy' | 'strategy' | 'analysis' | 'persona' | 'targeting'
  prompt: string
  response: string
  
  // Context used
  contextUsed: string[]
  
  // Metadata
  model: string
  tokensInput: number
  tokensOutput: number
  duration: number // ms
  cost?: number
  
  // Feedback
  rating?: 1 | 2 | 3 | 4 | 5
  feedback?: string
  wasUsed: boolean
  
  createdAt: string
  createdBy?: string
}

// Default GEM configurations
export const defaultGemConfigs: Partial<GemConfig>[] = [
  {
    type: 'brief_strategist',
    name: 'Brief Strategist',
    description: 'Analiza y completa briefs de marca con enfoque estratégico',
    systemPrompt: 'Eres un estratega de marketing experto en real estate...',
    includeContext: { brandProfile: true, brief: true, buyerPersonas: true, objectives: true, competitors: true, previousContent: false, moodboards: false },
    temperature: 0.7,
  },
  {
    type: 'content_planner',
    name: 'Content Planner',
    description: 'Planifica contenido mensual alineado a objetivos',
    systemPrompt: 'Eres un planificador de contenido especializado en inmobiliario...',
    includeContext: { brandProfile: true, brief: true, buyerPersonas: true, objectives: true, competitors: false, previousContent: true, moodboards: false },
    temperature: 0.8,
  },
  {
    type: 'copywriter',
    name: 'Copywriter',
    description: 'Genera copies persuasivos por plataforma y persona',
    systemPrompt: 'Eres un copywriter experto en marketing inmobiliario...',
    includeContext: { brandProfile: true, brief: true, buyerPersonas: true, objectives: false, competitors: false, previousContent: true, moodboards: false },
    temperature: 0.9,
  },
  {
    type: 'visual_director',
    name: 'Visual Director',
    description: 'Genera prompts visuales y dirige el estilo creativo',
    systemPrompt: 'Eres un director creativo visual especializado en real estate...',
    includeContext: { brandProfile: true, brief: true, buyerPersonas: true, objectives: false, competitors: false, previousContent: false, moodboards: true },
    temperature: 0.85,
  },
  {
    type: 'paid_strategist',
    name: 'Paid Media Strategist',
    description: 'Planifica campañas pagadas y segmentaciones',
    systemPrompt: 'Eres un estratega de medios pagados experto en Meta Ads y Google Ads...',
    includeContext: { brandProfile: true, brief: true, buyerPersonas: true, objectives: true, competitors: true, previousContent: false, moodboards: false },
    temperature: 0.7,
  },
  {
    type: 'data_analyst',
    name: 'Data Analyst',
    description: 'Analiza métricas y genera insights accionables',
    systemPrompt: 'Eres un analista de datos de marketing digital...',
    includeContext: { brandProfile: true, brief: false, buyerPersonas: true, objectives: true, competitors: true, previousContent: true, moodboards: false },
    temperature: 0.5,
  },
]

// ============ CONEXIONES SOCIALES ============

export type SocialConnectionStatus = 'connected' | 'disconnected' | 'expired' | 'error' | 'pending'

export interface SocialConnection {
  id: string
  brandId: string
  platform: SocialPlatform
  accountId: string
  accountName: string
  accountHandle?: string
  profileImageUrl?: string
  
  // Connection
  status: SocialConnectionStatus
  connectedAt?: string
  expiresAt?: string
  lastSyncAt?: string
  
  // Permissions
  permissions: string[]
  canPublish: boolean
  canSchedule: boolean
  canAnalyze: boolean
  
  // Errors
  errorMessage?: string
  errorCode?: string
  
  // Stats
  followers?: number
  following?: number
  posts?: number
}

export interface PublishingError {
  id: string
  brandId: string
  contentPieceId?: string
  scheduledPostId?: string
  platform: SocialPlatform
  errorType: 'auth' | 'permission' | 'content' | 'rate_limit' | 'network' | 'unknown'
  errorMessage: string
  errorCode?: string
  retryable: boolean
  retriedAt?: string
  resolvedAt?: string
  createdAt: string
}

// Platform configuration
export const platformConfig: Record<SocialPlatform, {
  name: string
  color: string
  icon: string
  formats: ContentFormat[]
  maxCharacters?: number
  maxHashtags?: number
  aspectRatios: ImageFormat[]
}> = {
  instagram: {
    name: 'Instagram',
    color: '#E4405F',
    icon: 'instagram',
    formats: ['imagen', 'video', 'reel', 'story', 'carrusel', 'live'],
    maxHashtags: 30,
    aspectRatios: ['1:1', '4:5', '9:16', '1.91:1'],
  },
  facebook: {
    name: 'Facebook',
    color: '#1877F2',
    icon: 'facebook',
    formats: ['imagen', 'video', 'reel', 'story', 'carrusel', 'live'],
    maxCharacters: 63206,
    aspectRatios: ['1:1', '4:5', '16:9', '1.91:1'],
  },
  tiktok: {
    name: 'TikTok',
    color: '#000000',
    icon: 'tiktok',
    formats: ['video', 'live'],
    maxCharacters: 2200,
    aspectRatios: ['9:16'],
  },
  linkedin: {
    name: 'LinkedIn',
    color: '#0A66C2',
    icon: 'linkedin',
    formats: ['imagen', 'video', 'carrusel', 'article'],
    maxCharacters: 3000,
    maxHashtags: 5,
    aspectRatios: ['1:1', '1.91:1', '16:9'],
  },
  youtube: {
    name: 'YouTube',
    color: '#FF0000',
    icon: 'youtube',
    formats: ['video', 'live'],
    aspectRatios: ['16:9', '9:16'],
  },
  twitter: {
    name: 'X (Twitter)',
    color: '#000000',
    icon: 'twitter',
    formats: ['imagen', 'video', 'thread'],
    maxCharacters: 280,
    aspectRatios: ['1:1', '16:9'],
  },
  pinterest: {
    name: 'Pinterest',
    color: '#E60023',
    icon: 'pinterest',
    formats: ['imagen', 'video'],
    aspectRatios: ['2:3', '1:1'],
  },
  threads: {
    name: 'Threads',
    color: '#000000',
    icon: 'threads',
    formats: ['imagen', 'video', 'thread'],
    maxCharacters: 500,
    aspectRatios: ['1:1', '4:5'],
  },
}
