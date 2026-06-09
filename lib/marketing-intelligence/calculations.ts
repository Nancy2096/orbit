// Marketing Intelligence Calculations - Phase 1

import type { MICampaign, MIMetrics } from './types'

// Calculate CTR
export function calculateCTR(clicks: number, impressions: number): number {
  if (impressions === 0) return 0
  return Number(((clicks / impressions) * 100).toFixed(2))
}

// Calculate CPC
export function calculateCPC(investment: number, clicks: number): number {
  if (clicks === 0) return 0
  return Number((investment / clicks).toFixed(2))
}

// Calculate CPM
export function calculateCPM(investment: number, impressions: number): number {
  if (impressions === 0) return 0
  return Number(((investment / impressions) * 1000).toFixed(2))
}

// Calculate CPL
export function calculateCPL(investment: number, leads: number): number {
  if (leads === 0) return 0
  return Number((investment / leads).toFixed(2))
}

// Calculate CPA
export function calculateCPA(investment: number, conversions: number): number {
  if (conversions === 0) return 0
  return Number((investment / conversions).toFixed(2))
}

// Calculate ROAS
export function calculateROAS(revenue: number, investment: number): number {
  if (investment === 0) return 0
  return Number((revenue / investment).toFixed(2))
}

// Calculate Engagement Rate
export function calculateEngagementRate(engagement: number, reach: number): number {
  if (reach === 0) return 0
  return Number(((engagement / reach) * 100).toFixed(2))
}

// Calculate Conversion Rate
export function calculateConversionRate(conversions: number, clicks: number): number {
  if (clicks === 0) return 0
  return Number(((conversions / clicks) * 100).toFixed(2))
}

// Calculate variation percentage
export function calculateVariation(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Number((((current - previous) / previous) * 100).toFixed(1))
}

// Get performance status based on thresholds
export function getPerformanceStatus(
  metric: string,
  value: number,
  thresholds: { good: number; warning: number }
): 'good' | 'warning' | 'critical' {
  // For metrics where lower is better (CPL, CPC, CPA)
  const lowerIsBetter = ['cpl', 'cpc', 'cpa', 'cpm']
  
  if (lowerIsBetter.includes(metric.toLowerCase())) {
    if (value <= thresholds.good) return 'good'
    if (value <= thresholds.warning) return 'warning'
    return 'critical'
  }
  
  // For metrics where higher is better (CTR, ROAS, Conversion Rate)
  if (value >= thresholds.good) return 'good'
  if (value >= thresholds.warning) return 'warning'
  return 'critical'
}

// Default thresholds for common metrics
export const defaultThresholds = {
  ctr: { good: 2.0, warning: 1.0 },
  cpc: { good: 5.0, warning: 10.0 },
  cpm: { good: 50, warning: 100 },
  cpl: { good: 500, warning: 1000 },
  cpa: { good: 5000, warning: 10000 },
  roas: { good: 3.0, warning: 2.0 },
  conversionRate: { good: 5.0, warning: 2.0 }
}

// Generate alerts based on campaign performance
export function generateCampaignAlerts(campaign: MICampaign): string[] {
  const alerts: string[] = []
  
  // CPL alert
  if (campaign.cpl > 1500) {
    alerts.push(`CPL alto: $${campaign.cpl.toLocaleString()} MXN`)
  }
  
  // CTR alert
  if (campaign.ctr < 1.0) {
    alerts.push(`CTR bajo: ${campaign.ctr}%`)
  }
  
  // No leads alert
  if (campaign.leads === 0 && campaign.spent > 10000) {
    alerts.push('Sin leads con inversión activa')
  }
  
  // High frequency alert
  if (campaign.frequency > 5) {
    alerts.push(`Frecuencia alta: ${campaign.frequency}x`)
  }
  
  // Budget alert
  const budgetUsed = (campaign.spent / campaign.budget) * 100
  if (budgetUsed > 90) {
    alerts.push(`Presupuesto casi agotado: ${budgetUsed.toFixed(0)}%`)
  }
  
  return alerts
}

// Calculate aggregate metrics from campaigns
export function calculateAggregateMetrics(campaigns: MICampaign[]): MIMetrics {
  const activeCampaigns = campaigns.filter(c => c.status === 'activo')
  
  const totalInvestment = activeCampaigns.reduce((sum, c) => sum + c.spent, 0)
  const totalLeads = activeCampaigns.reduce((sum, c) => sum + c.leads, 0)
  const totalClicks = activeCampaigns.reduce((sum, c) => sum + c.clicks, 0)
  const totalImpressions = activeCampaigns.reduce((sum, c) => sum + c.impressions, 0)
  const totalConversions = activeCampaigns.reduce((sum, c) => sum + c.conversions, 0)
  const totalReach = activeCampaigns.reduce((sum, c) => sum + c.reach, 0)
  
  return {
    totalInvestment,
    totalLeads,
    avgCPL: calculateCPL(totalInvestment, totalLeads),
    avgCTR: calculateCTR(totalClicks, totalImpressions),
    avgCPC: calculateCPC(totalInvestment, totalClicks),
    avgCPM: calculateCPM(totalInvestment, totalImpressions),
    totalConversions,
    avgCPA: calculateCPA(totalInvestment, totalConversions),
    avgROAS: Number((activeCampaigns.reduce((sum, c) => sum + c.roas, 0) / activeCampaigns.length).toFixed(2)),
    totalReach,
    totalImpressions,
    connectedAccounts: 0,
    errorAccounts: 0,
    expiredTokens: 0,
    criticalAlerts: 0
  }
}

// Format currency in MXN
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

// Format large numbers
export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toLocaleString('es-MX')
}

// Format percentage
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}
