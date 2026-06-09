// Phase 2 Types for Marketing Intelligence

// Social Media Types
export type SocialNetwork = 
  | 'facebook' 
  | 'instagram' 
  | 'tiktok' 
  | 'linkedin' 
  | 'youtube' 
  | 'pinterest' 
  | 'twitter' 
  | 'threads' 
  | 'bluesky'

export type PostFormat = 
  | 'imagen' 
  | 'video' 
  | 'carrusel' 
  | 'reel' 
  | 'story' 
  | 'short' 
  | 'pin' 
  | 'thread'

export type PostStatus = 
  | 'idea' 
  | 'en_redaccion' 
  | 'en_diseno' 
  | 'en_revision' 
  | 'aprobado' 
  | 'programado' 
  | 'publicado' 
  | 'rechazado'

export type Sentiment = 'positivo' | 'neutral' | 'negativo' | 'urgente'

export interface SocialAccount {
  id: string
  clientId: string
  brandId: string
  network: SocialNetwork
  username: string
  profileUrl: string
  followers: number
  following: number
  posts: number
  engagement: number
  engagementRate: number
  connected: boolean
  lastSync: string
}

export interface OrganicMetrics {
  id: string
  accountId: string
  date: string
  followers: number
  followersGrowth: number
  reach: number
  impressions: number
  engagement: number
  engagementRate: number
  likes: number
  comments: number
  shares: number
  saves: number
  views: number
  watchTime: number
  profileClicks: number
  websiteClicks: number
}

export interface SocialPost {
  id: string
  clientId: string
  clientName: string
  brandId: string
  brandName: string
  networks: SocialNetwork[]
  format: PostFormat
  status: PostStatus
  copy: string
  caption: string
  hashtags: string[]
  cta: string
  link: string
  mediaUrl: string
  mediaType: 'image' | 'video'
  scheduledDate: string
  scheduledTime: string
  publishedDate?: string
  copyResponsible: string
  designResponsible: string
  approvalResponsible: string
  internalComments: Comment[]
  clientComments: Comment[]
  reach?: number
  impressions?: number
  engagement?: number
  engagementRate?: number
  likes?: number
  comments?: number
  shares?: number
  saves?: number
  clicks?: number
  views?: number
  sentiment?: Sentiment
  history: PostHistory[]
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  authorId: string
  authorName: string
  authorAvatar: string
  text: string
  createdAt: string
  isClient: boolean
}

export interface PostHistory {
  id: string
  action: string
  userId: string
  userName: string
  timestamp: string
  details?: string
}

// Approval Types
export type ApprovalStatus = 'pendiente' | 'aprobado' | 'rechazado' | 'cambios_solicitados'

export interface Approval {
  id: string
  postId: string
  post: SocialPost
  status: ApprovalStatus
  priority: 'alta' | 'media' | 'baja'
  requestedBy: string
  requestedAt: string
  reviewedBy?: string
  reviewedAt?: string
  comments: Comment[]
  previousVersion?: Partial<SocialPost>
  currentVersion: SocialPost
}

// Inbox Types
export type ConversationStatus = 'nuevo' | 'en_proceso' | 'respondido' | 'cerrado' | 'escalado'
export type ConversationTag = 
  | 'lead' 
  | 'queja' 
  | 'positivo' 
  | 'informacion' 
  | 'urgente' 
  | 'spam' 
  | 'cliente_actual' 
  | 'prospecto' 
  | 'reputacion'

export interface InboxMessage {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderAvatar: string
  content: string
  timestamp: string
  isFromBrand: boolean
  read: boolean
}

export interface Conversation {
  id: string
  clientId: string
  brandId: string
  network: SocialNetwork
  type: 'mensaje' | 'comentario'
  userId: string
  userName: string
  userAvatar: string
  userHandle: string
  status: ConversationStatus
  sentiment: Sentiment
  tags: ConversationTag[]
  assignedTo?: string
  assignedToName?: string
  messages: InboxMessage[]
  postId?: string
  postContent?: string
  createdAt: string
  updatedAt: string
  isLead: boolean
}

export interface QuickReply {
  id: string
  title: string
  content: string
  category: string
}

// SEO Types
export type SearchIntent = 'informacional' | 'navegacional' | 'transaccional' | 'comercial'
export type KeywordStatus = 'monitoreando' | 'ganada' | 'perdida' | 'nueva' | 'estable'

export interface Keyword {
  id: string
  clientId: string
  keyword: string
  url: string
  currentPosition: number
  previousPosition: number
  change: number
  clicks: number
  impressions: number
  ctr: number
  difficulty: number
  intent: SearchIntent
  status: KeywordStatus
  lastUpdated: string
}

export interface SeoPage {
  id: string
  clientId: string
  url: string
  title: string
  type: 'landing' | 'blog' | 'producto' | 'categoria' | 'home'
  clicks: number
  impressions: number
  ctr: number
  avgPosition: number
  conversions: number
  status: 'activa' | 'optimizar' | 'revisar' | 'nueva'
  recommendation?: string
  lastUpdated: string
}

export interface SeoHealth {
  score: number
  issues: {
    critical: number
    warning: number
    info: number
  }
  coreWebVitals: {
    lcp: number
    fid: number
    cls: number
    status: 'bueno' | 'mejorar' | 'malo'
  }
  technicalIssues: TechnicalIssue[]
}

export interface TechnicalIssue {
  id: string
  type: string
  severity: 'critical' | 'warning' | 'info'
  description: string
  url?: string
  recommendation: string
}

export interface SeoRecommendation {
  id: string
  clientId: string
  type: 'title' | 'meta' | 'enlaces' | 'contenido' | 'velocidad' | 'tecnico' | 'intencion'
  priority: 'alta' | 'media' | 'baja'
  title: string
  description: string
  url?: string
  status: 'pendiente' | 'en_progreso' | 'completada' | 'descartada'
  createdAt: string
}

// Competitor Types
export interface Competitor {
  id: string
  clientId: string
  brandId: string
  name: string
  website: string
  country: string
  city: string
  geoArea: string
  industry: string
  socialAccounts: {
    network: SocialNetwork
    username: string
    url: string
    followers: number
  }[]
  notes: string
  status: 'activo' | 'inactivo'
  createdAt: string
}

export interface CompetitorMetrics {
  id: string
  competitorId: string
  date: string
  followers: number
  followersGrowth: number
  engagementRate: number
  postsPerWeek: number
  avgLikes: number
  avgComments: number
  topHashtags: string[]
  topFormats: PostFormat[]
  activeAds: number
}

export interface CompetitorAlert {
  id: string
  competitorId: string
  competitorName: string
  type: 'crecimiento' | 'engagement' | 'frecuencia' | 'campana' | 'viral'
  title: string
  description: string
  severity: 'alta' | 'media' | 'baja'
  createdAt: string
  read: boolean
}

// Smartlink Types
export interface Smartlink {
  id: string
  clientId: string
  clientName: string
  brandId: string
  brandName: string
  campaignId?: string
  campaignName?: string
  name: string
  slug: string
  url: string
  logo?: string
  backgroundColor: string
  textColor: string
  buttonColor: string
  buttonTextColor: string
  buttons: SmartlinkButton[]
  totalClicks: number
  conversions: number
  status: 'activo' | 'inactivo' | 'borrador'
  createdAt: string
  updatedAt: string
}

export interface SmartlinkButton {
  id: string
  label: string
  url: string
  icon?: string
  order: number
  active: boolean
  clicks: number
  conversions: number
}

export interface SmartlinkAnalytics {
  id: string
  smartlinkId: string
  date: string
  clicks: number
  uniqueVisitors: number
  conversions: number
  clicksByButton: { buttonId: string; clicks: number }[]
  trafficSources: { source: string; visits: number }[]
  devices: { device: string; visits: number }[]
  countries: { country: string; visits: number }[]
  cities: { city: string; visits: number }[]
}

// Calendar View Types
export type CalendarView = 'month' | 'week' | 'day' | 'network' | 'grid' | 'list'

export interface CalendarEvent {
  id: string
  post: SocialPost
  date: Date
  time: string
}
