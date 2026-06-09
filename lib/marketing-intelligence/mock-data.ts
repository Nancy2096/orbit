// Marketing Intelligence Mock Data - Phase 1

import type { 
  MIClient, 
  MIBrand, 
  MICampaign, 
  MIConnector, 
  MILead,
  MIMetrics,
  MIDashboard,
  MIDataSource,
  MIDestination,
  MINormalizedField,
  MICalculatedField
} from './types'

// Clients - Real Estate Agency Focus
export const mockMIClients: MIClient[] = [
  {
    id: 'client-1',
    name: 'Residencial Bosques del Valle',
    industry: 'Inmobiliario',
    type: 'enterprise',
    accountManager: 'María García',
    internalResponsible: 'Carlos Mendoza',
    brandsCount: 2,
    activeCampaigns: 8,
    monthlyInvestment: 485000,
    monthlyLeads: 342,
    avgCPL: 1418,
    status: 'activo',
    clientAccess: true,
    lastUpdated: '2026-05-18T10:30:00',
    website: 'https://bosquesdelvalle.mx',
    contacts: [
      { id: 'c1', name: 'Roberto Hernández', email: 'rhernandez@bosquesdelvalle.mx', phone: '+52 81 1234 5678', role: 'Director Comercial', isPrimary: true },
      { id: 'c2', name: 'Ana Martínez', email: 'amartinez@bosquesdelvalle.mx', role: 'Coordinadora Marketing', isPrimary: false }
    ],
    notes: 'Cliente prioritario. Reunión mensual el primer lunes de cada mes.'
  },
  {
    id: 'client-2',
    name: 'Torre Vista Norte',
    industry: 'Inmobiliario',
    type: 'corporativo',
    accountManager: 'María García',
    internalResponsible: 'Laura Sánchez',
    brandsCount: 1,
    activeCampaigns: 5,
    monthlyInvestment: 320000,
    monthlyLeads: 198,
    avgCPL: 1616,
    status: 'activo',
    clientAccess: true,
    lastUpdated: '2026-05-17T15:45:00',
    website: 'https://torrevistanorte.com',
    contacts: [
      { id: 'c3', name: 'Fernando López', email: 'flopez@torrevistanorte.com', phone: '+52 55 9876 5432', role: 'Gerente General', isPrimary: true }
    ]
  },
  {
    id: 'client-3',
    name: 'Desarrollos Urbanos MX',
    industry: 'Inmobiliario',
    type: 'enterprise',
    accountManager: 'Pedro Ramírez',
    internalResponsible: 'Carlos Mendoza',
    brandsCount: 3,
    activeCampaigns: 12,
    monthlyInvestment: 680000,
    monthlyLeads: 521,
    avgCPL: 1305,
    status: 'activo',
    clientAccess: false,
    lastUpdated: '2026-05-18T08:20:00',
    website: 'https://desarrollosurbanos.mx',
    contacts: [
      { id: 'c4', name: 'Gabriela Torres', email: 'gtorres@desarrollosurbanos.mx', phone: '+52 33 4567 8901', role: 'Directora Marketing', isPrimary: true }
    ]
  },
  {
    id: 'client-4',
    name: 'Plaza Comercial Altavista',
    industry: 'Inmobiliario Comercial',
    type: 'pyme',
    accountManager: 'Pedro Ramírez',
    internalResponsible: 'Laura Sánchez',
    brandsCount: 1,
    activeCampaigns: 3,
    monthlyInvestment: 95000,
    monthlyLeads: 87,
    avgCPL: 1092,
    status: 'activo',
    clientAccess: true,
    lastUpdated: '2026-05-16T12:00:00',
    website: 'https://plazaaltavista.com',
    contacts: [
      { id: 'c5', name: 'Miguel Ángel Ruiz', email: 'maruiz@plazaaltavista.com', role: 'Administrador', isPrimary: true }
    ]
  },
  {
    id: 'client-5',
    name: 'Hábitat Premium Living',
    industry: 'Inmobiliario',
    type: 'enterprise',
    accountManager: 'María García',
    internalResponsible: 'Carlos Mendoza',
    brandsCount: 2,
    activeCampaigns: 6,
    monthlyInvestment: 420000,
    monthlyLeads: 267,
    avgCPL: 1573,
    status: 'activo',
    clientAccess: true,
    lastUpdated: '2026-05-18T09:15:00',
    website: 'https://habitatpremium.mx',
    contacts: [
      { id: 'c6', name: 'Daniela Vega', email: 'dvega@habitatpremium.mx', phone: '+52 81 2345 6789', role: 'CEO', isPrimary: true }
    ]
  },
  {
    id: 'client-6',
    name: 'Condominios del Mar',
    industry: 'Inmobiliario',
    type: 'pyme',
    accountManager: 'Pedro Ramírez',
    internalResponsible: 'Laura Sánchez',
    brandsCount: 1,
    activeCampaigns: 4,
    monthlyInvestment: 180000,
    monthlyLeads: 156,
    avgCPL: 1154,
    status: 'pausado',
    clientAccess: false,
    lastUpdated: '2026-05-10T16:30:00',
    website: 'https://condominiosdelmar.mx',
    contacts: [
      { id: 'c7', name: 'Ricardo Fuentes', email: 'rfuentes@condominiosdelmar.mx', role: 'Director', isPrimary: true }
    ],
    notes: 'Cliente pausado temporalmente por remodelación de proyecto.'
  },
  {
    id: 'client-7',
    name: 'Inmobiliaria Capital Norte',
    industry: 'Inmobiliario',
    type: 'corporativo',
    accountManager: 'María García',
    internalResponsible: 'Carlos Mendoza',
    brandsCount: 4,
    activeCampaigns: 15,
    monthlyInvestment: 890000,
    monthlyLeads: 634,
    avgCPL: 1404,
    status: 'activo',
    clientAccess: true,
    lastUpdated: '2026-05-18T11:00:00',
    website: 'https://capitalNorte.mx',
    contacts: [
      { id: 'c8', name: 'Alejandro Mendoza', email: 'amendoza@capitalnorte.mx', phone: '+52 81 8765 4321', role: 'VP Marketing', isPrimary: true }
    ]
  }
]

// Brands
export const mockMIBrands: MIBrand[] = [
  {
    id: 'brand-1',
    clientId: 'client-1',
    name: 'Bosques Living',
    colors: ['#2D5A3D', '#8B9A6D', '#F5F0E8'],
    socialNetworks: [
      { platform: 'facebook', url: 'https://facebook.com/bosquesliving', connected: true },
      { platform: 'instagram', url: 'https://instagram.com/bosquesliving', connected: true },
      { platform: 'tiktok', url: 'https://tiktok.com/@bosquesliving', connected: true }
    ],
    website: 'https://bosquesliving.mx',
    country: 'México',
    city: 'Monterrey',
    industry: 'Inmobiliario Residencial',
    status: 'activo'
  },
  {
    id: 'brand-2',
    clientId: 'client-1',
    name: 'Bosques Elite',
    colors: ['#1A1A2E', '#C4A35A', '#FFFFFF'],
    socialNetworks: [
      { platform: 'facebook', url: 'https://facebook.com/bosqueselite', connected: true },
      { platform: 'instagram', url: 'https://instagram.com/bosqueselite', connected: true }
    ],
    website: 'https://bosqueselite.mx',
    country: 'México',
    city: 'Monterrey',
    industry: 'Inmobiliario Premium',
    status: 'activo'
  },
  {
    id: 'brand-3',
    clientId: 'client-2',
    name: 'Vista Norte Residences',
    colors: ['#0066CC', '#00A3E0', '#F0F4F8'],
    socialNetworks: [
      { platform: 'facebook', url: 'https://facebook.com/vistanorte', connected: true },
      { platform: 'instagram', url: 'https://instagram.com/vistanorte', connected: true },
      { platform: 'linkedin', url: 'https://linkedin.com/company/vistanorte', connected: false }
    ],
    website: 'https://vistanorteresidences.com',
    country: 'México',
    city: 'CDMX',
    industry: 'Inmobiliario Residencial',
    status: 'activo'
  },
  {
    id: 'brand-4',
    clientId: 'client-3',
    name: 'Urbania Homes',
    colors: ['#FF6B35', '#2E2E2E', '#FFFFFF'],
    socialNetworks: [
      { platform: 'facebook', url: 'https://facebook.com/urbaniahomes', connected: true },
      { platform: 'instagram', url: 'https://instagram.com/urbaniahomes', connected: true },
      { platform: 'tiktok', url: 'https://tiktok.com/@urbaniahomes', connected: true }
    ],
    website: 'https://urbaniahomes.mx',
    country: 'México',
    city: 'Guadalajara',
    industry: 'Inmobiliario',
    status: 'activo'
  },
  {
    id: 'brand-5',
    clientId: 'client-4',
    name: 'Altavista Plaza',
    colors: ['#8B4513', '#D4AF37', '#FFFAF0'],
    socialNetworks: [
      { platform: 'facebook', url: 'https://facebook.com/altavistaplaza', connected: true },
      { platform: 'instagram', url: 'https://instagram.com/altavistaplaza', connected: true }
    ],
    website: 'https://altavistaplaza.com',
    country: 'México',
    city: 'Querétaro',
    industry: 'Inmobiliario Comercial',
    status: 'activo'
  },
  {
    id: 'brand-6',
    clientId: 'client-6',
    name: 'Marena Condos',
    colors: ['#006994', '#40E0D0', '#FFF8DC'],
    socialNetworks: [
      { platform: 'facebook', url: 'https://facebook.com/marenacondos', connected: true },
      { platform: 'instagram', url: 'https://instagram.com/marenacondos', connected: false }
    ],
    website: 'https://marenacondos.mx',
    country: 'México',
    city: 'Cancún',
    industry: 'Inmobiliario Vacacional',
    status: 'activo'
  }
]

// Campaigns
export const mockMICampaigns: MICampaign[] = [
  {
    id: 'camp-1',
    clientId: 'client-1',
    brandId: 'brand-1',
    platform: 'meta',
    name: 'Leads departamentos CDMX',
    objective: 'Generación de leads',
    funnelStage: 'leads',
    budget: 150000,
    spent: 142500,
    impressions: 2850000,
    reach: 980000,
    clicks: 42750,
    ctr: 1.5,
    cpc: 3.33,
    cpm: 50,
    leads: 285,
    cpl: 500,
    conversions: 28,
    cpa: 5089,
    roas: 3.2,
    frequency: 2.9,
    leadQuality: 'alta',
    costPerAppointment: 2850,
    costPerSale: 14250,
    status: 'activo',
    alerts: [],
    startDate: '2026-04-01'
  },
  {
    id: 'camp-2',
    clientId: 'client-2',
    brandId: 'brand-3',
    platform: 'meta',
    name: 'Preventa Torre Vista Norte',
    objective: 'Generación de leads',
    funnelStage: 'leads',
    budget: 200000,
    spent: 185000,
    impressions: 3700000,
    reach: 1250000,
    clicks: 55500,
    ctr: 1.5,
    cpc: 3.33,
    cpm: 50,
    leads: 198,
    cpl: 934,
    conversions: 15,
    cpa: 12333,
    roas: 2.8,
    frequency: 2.96,
    leadQuality: 'alta',
    costPerAppointment: 3700,
    costPerSale: 18500,
    status: 'activo',
    alerts: [{ id: 'a1', type: 'warning', message: 'CPL 15% arriba del objetivo', date: '2026-05-17' }],
    startDate: '2026-03-15'
  },
  {
    id: 'camp-3',
    clientId: 'client-1',
    brandId: 'brand-1',
    platform: 'meta',
    name: 'Remarketing compradores interesados',
    objective: 'Conversiones',
    funnelStage: 'remarketing',
    budget: 50000,
    spent: 48500,
    impressions: 1940000,
    reach: 320000,
    clicks: 29100,
    ctr: 1.5,
    cpc: 1.67,
    cpm: 25,
    leads: 97,
    cpl: 500,
    conversions: 12,
    cpa: 4042,
    roas: 4.5,
    frequency: 6.06,
    leadQuality: 'alta',
    status: 'activo',
    alerts: [{ id: 'a2', type: 'info', message: 'Frecuencia alta, considerar renovar audiencia', date: '2026-05-16' }],
    startDate: '2026-04-01'
  },
  {
    id: 'camp-4',
    clientId: 'client-3',
    brandId: 'brand-4',
    platform: 'google',
    name: 'Google Search departamentos en venta',
    objective: 'Tráfico y leads',
    funnelStage: 'leads',
    budget: 180000,
    spent: 172800,
    impressions: 1152000,
    reach: 864000,
    clicks: 69120,
    ctr: 6.0,
    cpc: 2.5,
    cpm: 150,
    leads: 432,
    cpl: 400,
    conversions: 52,
    cpa: 3323,
    roas: 4.2,
    frequency: 1.33,
    leadQuality: 'alta',
    status: 'activo',
    alerts: [],
    startDate: '2026-01-01'
  },
  {
    id: 'camp-5',
    clientId: 'client-5',
    brandId: 'brand-1',
    platform: 'tiktok',
    name: 'Campaña TikTok amenidades premium',
    objective: 'Awareness',
    funnelStage: 'awareness',
    budget: 80000,
    spent: 76000,
    impressions: 7600000,
    reach: 3800000,
    clicks: 152000,
    ctr: 2.0,
    cpc: 0.5,
    cpm: 10,
    leads: 95,
    cpl: 800,
    conversions: 8,
    cpa: 9500,
    roas: 1.8,
    frequency: 2.0,
    leadQuality: 'media',
    status: 'activo',
    alerts: [],
    startDate: '2026-04-15'
  },
  {
    id: 'camp-6',
    clientId: 'client-7',
    brandId: 'brand-1',
    platform: 'linkedin',
    name: 'LinkedIn inversión inmobiliaria',
    objective: 'Generación de leads B2B',
    funnelStage: 'leads',
    budget: 120000,
    spent: 115200,
    impressions: 576000,
    reach: 288000,
    clicks: 11520,
    ctr: 2.0,
    cpc: 10,
    cpm: 200,
    leads: 72,
    cpl: 1600,
    conversions: 9,
    cpa: 12800,
    roas: 5.2,
    frequency: 2.0,
    leadQuality: 'alta',
    costPerAppointment: 5760,
    costPerSale: 23040,
    status: 'activo',
    alerts: [],
    startDate: '2026-02-01'
  },
  {
    id: 'camp-7',
    clientId: 'client-4',
    brandId: 'brand-5',
    platform: 'meta',
    name: 'Locales comerciales Altavista',
    objective: 'Generación de leads',
    funnelStage: 'leads',
    budget: 60000,
    spent: 57000,
    impressions: 1140000,
    reach: 475000,
    clicks: 17100,
    ctr: 1.5,
    cpc: 3.33,
    cpm: 50,
    leads: 87,
    cpl: 655,
    conversions: 6,
    cpa: 9500,
    roas: 2.5,
    frequency: 2.4,
    leadQuality: 'media',
    status: 'activo',
    alerts: [],
    startDate: '2026-03-01'
  },
  {
    id: 'camp-8',
    clientId: 'client-6',
    brandId: 'brand-6',
    platform: 'meta',
    name: 'Condos playa Cancún',
    objective: 'Generación de leads',
    funnelStage: 'leads',
    budget: 100000,
    spent: 45000,
    impressions: 900000,
    reach: 450000,
    clicks: 13500,
    ctr: 1.5,
    cpc: 3.33,
    cpm: 50,
    leads: 67,
    cpl: 672,
    conversions: 4,
    cpa: 11250,
    roas: 2.1,
    frequency: 2.0,
    leadQuality: 'media',
    status: 'pausado',
    alerts: [{ id: 'a3', type: 'warning', message: 'Campaña pausada por cliente', date: '2026-05-10' }],
    startDate: '2026-04-01'
  }
]

// Connectors
export const mockMIConnectors: MIConnector[] = [
  // Ads
  { id: 'conn-1', platform: 'Meta Ads', category: 'ads', clientId: 'client-1', brandId: 'brand-1', status: 'connected', lastSync: '2026-05-18T10:00:00', nextSync: '2026-05-18T11:00:00', availableMetrics: ['spend', 'impressions', 'clicks', 'ctr', 'cpc', 'leads', 'conversions'], icon: 'facebook' },
  { id: 'conn-2', platform: 'Google Ads', category: 'ads', clientId: 'client-3', brandId: 'brand-4', status: 'connected', lastSync: '2026-05-18T09:30:00', nextSync: '2026-05-18T10:30:00', availableMetrics: ['spend', 'impressions', 'clicks', 'ctr', 'cpc', 'conversions'], icon: 'google' },
  { id: 'conn-3', platform: 'TikTok Ads', category: 'ads', clientId: 'client-5', status: 'connected', lastSync: '2026-05-18T08:00:00', nextSync: '2026-05-18T12:00:00', availableMetrics: ['spend', 'impressions', 'clicks', 'engagement'], icon: 'tiktok' },
  { id: 'conn-4', platform: 'LinkedIn Ads', category: 'ads', clientId: 'client-7', status: 'token_expired', lastSync: '2026-05-15T10:00:00', availableMetrics: ['spend', 'impressions', 'clicks', 'leads'], icon: 'linkedin' },
  { id: 'conn-5', platform: 'X/Twitter Ads', category: 'ads', status: 'disconnected', availableMetrics: ['spend', 'impressions', 'clicks', 'engagement'], icon: 'twitter' },
  
  // Social Organic
  { id: 'conn-6', platform: 'Facebook Orgánico', category: 'social', clientId: 'client-1', brandId: 'brand-1', status: 'connected', lastSync: '2026-05-18T10:30:00', nextSync: '2026-05-18T11:30:00', availableMetrics: ['followers', 'reach', 'engagement', 'posts'], icon: 'facebook' },
  { id: 'conn-7', platform: 'Instagram Orgánico', category: 'social', clientId: 'client-1', brandId: 'brand-1', status: 'connected', lastSync: '2026-05-18T10:30:00', nextSync: '2026-05-18T11:30:00', availableMetrics: ['followers', 'reach', 'engagement', 'posts'], icon: 'instagram' },
  { id: 'conn-8', platform: 'TikTok Orgánico', category: 'social', status: 'disconnected', availableMetrics: ['followers', 'views', 'engagement'], icon: 'tiktok' },
  { id: 'conn-9', platform: 'LinkedIn Orgánico', category: 'social', status: 'disconnected', availableMetrics: ['followers', 'impressions', 'engagement'], icon: 'linkedin' },
  { id: 'conn-10', platform: 'YouTube', category: 'social', status: 'pending', availableMetrics: ['subscribers', 'views', 'watch_time'], icon: 'youtube' },
  
  // Web & SEO
  { id: 'conn-11', platform: 'Google Analytics 4', category: 'web', clientId: 'client-1', status: 'connected', lastSync: '2026-05-18T06:00:00', nextSync: '2026-05-19T06:00:00', availableMetrics: ['sessions', 'users', 'pageviews', 'bounce_rate', 'conversions'], icon: 'analytics' },
  { id: 'conn-12', platform: 'Google Search Console', category: 'seo', clientId: 'client-1', status: 'connected', lastSync: '2026-05-18T06:00:00', nextSync: '2026-05-19T06:00:00', availableMetrics: ['impressions', 'clicks', 'ctr', 'position'], icon: 'search' },
  { id: 'conn-13', platform: 'Google Business Profile', category: 'seo', status: 'disconnected', availableMetrics: ['views', 'searches', 'actions'], icon: 'business' },
  
  // CRM
  { id: 'conn-14', platform: 'HubSpot', category: 'crm', clientId: 'client-7', status: 'connected', lastSync: '2026-05-18T07:00:00', nextSync: '2026-05-18T13:00:00', availableMetrics: ['contacts', 'deals', 'revenue'], icon: 'hubspot' },
  { id: 'conn-15', platform: 'Salesforce', category: 'crm', status: 'disconnected', availableMetrics: ['leads', 'opportunities', 'revenue'], icon: 'salesforce' },
  { id: 'conn-16', platform: 'Zoho CRM', category: 'crm', status: 'disconnected', availableMetrics: ['leads', 'deals', 'revenue'], icon: 'zoho' },
  
  // Ecommerce
  { id: 'conn-17', platform: 'Shopify', category: 'ecommerce', status: 'disconnected', availableMetrics: ['orders', 'revenue', 'aov', 'conversion_rate'], icon: 'shopify' },
  { id: 'conn-18', platform: 'WooCommerce', category: 'ecommerce', status: 'disconnected', availableMetrics: ['orders', 'revenue', 'products'], icon: 'woocommerce' },
  { id: 'conn-19', platform: 'Mercado Libre', category: 'ecommerce', status: 'disconnected', availableMetrics: ['sales', 'visits', 'conversion'], icon: 'mercadolibre' },
  
  // Email
  { id: 'conn-20', platform: 'Mailchimp', category: 'email', status: 'error', lastSync: '2026-05-10T10:00:00', availableMetrics: ['subscribers', 'open_rate', 'click_rate'], icon: 'mailchimp' },
  { id: 'conn-21', platform: 'ActiveCampaign', category: 'email', status: 'disconnected', availableMetrics: ['contacts', 'automations', 'emails_sent'], icon: 'activecampaign' },
  { id: 'conn-22', platform: 'Brevo', category: 'email', status: 'disconnected', availableMetrics: ['contacts', 'campaigns', 'delivery_rate'], icon: 'brevo' },
  
  // BI & Warehouse
  { id: 'conn-23', platform: 'Google Sheets', category: 'bi', clientId: 'client-1', status: 'connected', lastSync: '2026-05-18T08:00:00', availableMetrics: [], icon: 'sheets' },
  { id: 'conn-24', platform: 'Looker Studio', category: 'bi', status: 'disconnected', availableMetrics: [], icon: 'looker' },
  { id: 'conn-25', platform: 'Power BI', category: 'bi', status: 'disconnected', availableMetrics: [], icon: 'powerbi' },
  { id: 'conn-26', platform: 'BigQuery', category: 'warehouse', status: 'disconnected', availableMetrics: [], icon: 'bigquery' },
  { id: 'conn-27', platform: 'Airtable', category: 'warehouse', status: 'disconnected', availableMetrics: [], icon: 'airtable' },
  
  // Custom API
  { id: 'conn-28', platform: 'API Personalizada', category: 'api', status: 'disconnected', availableMetrics: [], icon: 'api' }
]

// Global Metrics
export const mockMIGlobalMetrics: MIMetrics = {
  totalInvestment: 3070000,
  totalLeads: 2205,
  avgCPL: 1392,
  avgCTR: 2.14,
  avgCPC: 3.47,
  avgCPM: 62,
  totalConversions: 264,
  avgCPA: 11629,
  avgROAS: 3.24,
  totalReach: 8225000,
  totalImpressions: 19858000,
  connectedAccounts: 12,
  errorAccounts: 2,
  expiredTokens: 1,
  criticalAlerts: 3
}

// Monthly data for charts
export const mockMIMonthlyData = [
  { month: 'Ene', investment: 2450000, leads: 1720, cpl: 1424, roas: 2.9 },
  { month: 'Feb', investment: 2680000, leads: 1890, cpl: 1418, roas: 3.1 },
  { month: 'Mar', investment: 2890000, leads: 2050, cpl: 1410, roas: 3.2 },
  { month: 'Abr', investment: 3020000, leads: 2180, cpl: 1385, roas: 3.3 },
  { month: 'May', investment: 3070000, leads: 2205, cpl: 1392, roas: 3.24 }
]

// Investment by platform
export const mockMIPlatformData = [
  { platform: 'Meta Ads', investment: 1580000, leads: 1089, percentage: 51.5 },
  { platform: 'Google Ads', investment: 920000, leads: 632, percentage: 30.0 },
  { platform: 'TikTok Ads', investment: 280000, leads: 195, percentage: 9.1 },
  { platform: 'LinkedIn Ads', investment: 180000, leads: 189, percentage: 5.9 },
  { platform: 'Twitter Ads', investment: 110000, leads: 100, percentage: 3.5 }
]

// Funnel distribution
export const mockMIFunnelData = [
  { stage: 'Awareness', campaigns: 12, investment: 460000 },
  { stage: 'Engagement', campaigns: 8, investment: 320000 },
  { stage: 'Leads', campaigns: 28, investment: 1680000 },
  { stage: 'Conversiones', campaigns: 15, investment: 450000 },
  { stage: 'Remarketing', campaigns: 10, investment: 160000 }
]

// Top/Bottom performers
export const mockMITopClients = [
  { name: 'Desarrollos Urbanos MX', leads: 521, cpl: 1305, roas: 4.2, trend: 'up' },
  { name: 'Inmobiliaria Capital Norte', leads: 634, cpl: 1404, roas: 3.8, trend: 'up' },
  { name: 'Residencial Bosques del Valle', leads: 342, cpl: 1418, roas: 3.5, trend: 'stable' }
]

export const mockMIBottomClients = [
  { name: 'Condominios del Mar', leads: 156, cpl: 1154, roas: 2.1, trend: 'down' },
  { name: 'Plaza Comercial Altavista', leads: 87, cpl: 1092, roas: 2.5, trend: 'stable' }
]

// Data Warehouse
export const mockMIDataSources: MIDataSource[] = [
  { id: 'ds-1', name: 'Meta Ads', type: 'ads', status: 'synced', lastSync: '2026-05-18T10:00:00', tablesCount: 5, recordsCount: 125000 },
  { id: 'ds-2', name: 'Google Ads', type: 'ads', status: 'synced', lastSync: '2026-05-18T09:30:00', tablesCount: 4, recordsCount: 89000 },
  { id: 'ds-3', name: 'Google Analytics', type: 'web', status: 'syncing', lastSync: '2026-05-17T06:00:00', tablesCount: 8, recordsCount: 450000 },
  { id: 'ds-4', name: 'HubSpot', type: 'crm', status: 'synced', lastSync: '2026-05-18T07:00:00', tablesCount: 6, recordsCount: 28000 }
]

export const mockMIDestinations: MIDestination[] = [
  { id: 'dest-1', name: 'Supabase', type: 'supabase', status: 'connected' },
  { id: 'dest-2', name: 'BigQuery', type: 'bigquery', status: 'disconnected' },
  { id: 'dest-3', name: 'Google Sheets', type: 'sheets', status: 'connected' },
  { id: 'dest-4', name: 'Looker Studio', type: 'looker', status: 'disconnected' }
]

export const mockMINormalizedFields: MINormalizedField[] = [
  { original: 'spend', normalized: 'investment', platform: 'Meta Ads', description: 'Inversión publicitaria' },
  { original: 'amount_spent', normalized: 'investment', platform: 'Google Ads', description: 'Inversión publicitaria' },
  { original: 'cost', normalized: 'investment', platform: 'TikTok Ads', description: 'Inversión publicitaria' },
  { original: 'link_clicks', normalized: 'clicks', platform: 'Meta Ads', description: 'Clics en enlaces' },
  { original: 'clicks', normalized: 'clicks', platform: 'Google Ads', description: 'Clics' },
  { original: 'form_leads', normalized: 'leads', platform: 'Meta Ads', description: 'Leads de formulario' },
  { original: 'conversions', normalized: 'conversions', platform: 'Google Ads', description: 'Conversiones' }
]

export const mockMICalculatedFields: MICalculatedField[] = [
  { name: 'CTR', formula: 'clicks / impressions * 100', description: 'Tasa de clics' },
  { name: 'CPC', formula: 'investment / clicks', description: 'Costo por clic' },
  { name: 'CPM', formula: 'investment / impressions * 1000', description: 'Costo por mil impresiones' },
  { name: 'CPL', formula: 'investment / leads', description: 'Costo por lead' },
  { name: 'CPA', formula: 'investment / conversions', description: 'Costo por adquisición' },
  { name: 'ROAS', formula: 'revenue / investment', description: 'Retorno sobre inversión publicitaria' },
  { name: 'Engagement Rate', formula: 'engagement / reach * 100', description: 'Tasa de interacción' },
  { name: 'Conversion Rate', formula: 'conversions / clicks * 100', description: 'Tasa de conversión' },
  { name: 'Lead to Appointment', formula: 'appointments / leads * 100', description: 'Conversión de lead a cita' },
  { name: 'Lead to Sale', formula: 'sales / leads * 100', description: 'Conversión de lead a venta' }
]

// Leads
export const mockMILeads: MILead[] = [
  { id: 'lead-1', clientId: 'client-1', brandId: 'brand-1', campaignId: 'camp-1', source: 'Meta Ads', adName: 'Departamentos CDMX - Video', utmSource: 'facebook', utmMedium: 'paid', utmCampaign: 'leads-cdmx', commercialStatus: 'calificado', quality: 'alta', funnelStage: 'appointment', createdAt: '2026-05-18T09:30:00', name: 'Juan Pérez', email: 'jperez@email.com', phone: '+52 55 1234 5678' },
  { id: 'lead-2', clientId: 'client-1', brandId: 'brand-1', campaignId: 'camp-1', source: 'Meta Ads', adName: 'Departamentos CDMX - Carrusel', utmSource: 'facebook', utmMedium: 'paid', utmCampaign: 'leads-cdmx', commercialStatus: 'nuevo', quality: 'media', funnelStage: 'lead', createdAt: '2026-05-18T08:15:00', name: 'María López', email: 'mlopez@email.com' },
  { id: 'lead-3', clientId: 'client-3', brandId: 'brand-4', campaignId: 'camp-4', source: 'Google Ads', keyword: 'departamentos en venta cdmx', utmSource: 'google', utmMedium: 'cpc', utmCampaign: 'search-deptos', commercialStatus: 'cita', quality: 'alta', funnelStage: 'visit', createdAt: '2026-05-17T16:45:00', name: 'Roberto García', email: 'rgarcia@email.com', phone: '+52 55 9876 5432' },
  { id: 'lead-4', clientId: 'client-2', brandId: 'brand-3', campaignId: 'camp-2', source: 'Meta Ads', utmSource: 'instagram', utmMedium: 'paid', commercialStatus: 'propuesta', quality: 'alta', funnelStage: 'proposal', createdAt: '2026-05-15T11:20:00', name: 'Ana Martínez', email: 'amartinez@email.com', phone: '+52 55 5555 1234' },
  { id: 'lead-5', clientId: 'client-7', brandId: 'brand-1', campaignId: 'camp-6', source: 'LinkedIn Ads', utmSource: 'linkedin', utmMedium: 'paid', commercialStatus: 'venta', quality: 'alta', funnelStage: 'sale', createdAt: '2026-05-10T14:30:00', name: 'Carlos Rodríguez', email: 'crodriguez@empresa.com', phone: '+52 81 8888 9999' }
]

// Dashboard templates
export const mockMIDashboardTemplates = [
  { id: 'tpl-1', name: 'Dashboard Ejecutivo', description: 'Vista general para directivos', icon: 'briefcase' },
  { id: 'tpl-2', name: 'Dashboard de Pauta Digital', description: 'Métricas de campañas pagadas', icon: 'megaphone' },
  { id: 'tpl-3', name: 'Dashboard de Redes Sociales', description: 'Métricas orgánicas', icon: 'share' },
  { id: 'tpl-4', name: 'Dashboard SEO', description: 'Posicionamiento y tráfico orgánico', icon: 'search' },
  { id: 'tpl-5', name: 'Dashboard de Leads', description: 'Generación y calidad de leads', icon: 'users' },
  { id: 'tpl-6', name: 'Dashboard de Ventas', description: 'Conversión y revenue', icon: 'dollar' },
  { id: 'tpl-7', name: 'Dashboard Inmobiliario', description: 'Específico para real estate', icon: 'building' },
  { id: 'tpl-8', name: 'Dashboard Omnicanal', description: 'Visión 360 del cliente', icon: 'layers' }
]
