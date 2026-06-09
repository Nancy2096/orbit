"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Play,
  Pause,
  Copy,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  MousePointer,
  Users,
  Target,
  Eye,
  Image,
  Video,
  Layers,
} from "lucide-react"
import { Facebook, Chrome, Smartphone, Linkedin } from "lucide-react"
import { PaidCampaign, AdSet, Ad, CampaignStatus } from "@/lib/marketing-intelligence/brand-phase2-types"
import { formatCurrency, formatNumber } from "@/lib/marketing-intelligence/calculations"

// Platform icons
const platformIcons: Record<string, React.ReactNode> = {
  meta: <Facebook className="h-4 w-4 text-blue-600" />,
  google: <Chrome className="h-4 w-4 text-red-500" />,
  tiktok: <Smartphone className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4 text-blue-700" />,
}

// Status colors
const statusColors: Record<CampaignStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  archived: 'bg-gray-100 text-gray-500',
}

// Status labels
const statusLabels: Record<CampaignStatus, string> = {
  draft: 'Borrador',
  pending: 'Pendiente',
  active: 'Activa',
  paused: 'Pausada',
  completed: 'Completada',
  archived: 'Archivada',
}

// Format icons for ads
const formatIcons: Record<string, React.ReactNode> = {
  image: <Image className="h-3 w-3" />,
  video: <Video className="h-3 w-3" />,
  carousel: <Layers className="h-3 w-3" />,
  collection: <Layers className="h-3 w-3" />,
  stories: <Layers className="h-3 w-3" />,
}

// Ad Component
interface CampaignTreeAdProps {
  ad: Ad
  onEdit?: (ad: Ad) => void
}

function CampaignTreeAd({ ad, onEdit }: CampaignTreeAdProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-background rounded">
          {formatIcons[ad.format]}
        </div>
        <div>
          <p className="text-sm font-medium">{ad.name}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {ad.primaryText?.substring(0, 50)}...
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {ad.metrics && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatNumber(ad.metrics.impressions)}
            </span>
            <span className="flex items-center gap-1">
              <MousePointer className="h-3 w-3" />
              {formatNumber(ad.metrics.clicks)}
            </span>
            <span>{ad.metrics.ctr.toFixed(2)}% CTR</span>
          </div>
        )}
        <Badge variant={ad.status === 'active' ? 'default' : 'secondary'} className="text-xs">
          {ad.status === 'active' ? 'Activo' : ad.status === 'paused' ? 'Pausado' : ad.status}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(ad)}>Editar</DropdownMenuItem>
            <DropdownMenuItem>Duplicar</DropdownMenuItem>
            <DropdownMenuItem>Ver preview</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// AdSet Component
interface CampaignTreeAdSetProps {
  adSet: AdSet
  onEditAd?: (ad: Ad) => void
  onEditAdSet?: (adSet: AdSet) => void
}

function CampaignTreeAdSet({ adSet, onEditAd, onEditAdSet }: CampaignTreeAdSetProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const budgetSpent = adSet.metrics?.spend || 0
  const budgetProgress = (budgetSpent / adSet.budget) * 100

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">{adSet.name}</p>
                <p className="text-xs text-muted-foreground">
                  {adSet.ads.length} anuncios
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {adSet.metrics && (
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <p className="text-muted-foreground text-xs">Gastado</p>
                    <p className="font-medium">{formatCurrency(budgetSpent)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-xs">Leads</p>
                    <p className="font-medium">{adSet.metrics.leads}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-xs">CPL</p>
                    <p className="font-medium">{formatCurrency(adSet.metrics.cpl)}</p>
                  </div>
                </div>
              )}
              <Badge className={statusColors[adSet.status]}>
                {statusLabels[adSet.status]}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEditAdSet?.(adSet)}>Editar</DropdownMenuItem>
                  <DropdownMenuItem>Duplicar</DropdownMenuItem>
                  <DropdownMenuItem>Ver segmentación</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Budget Progress */}
        <div className="mt-3 mb-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Presupuesto</span>
            <span>{formatCurrency(budgetSpent)} / {formatCurrency(adSet.budget)}</span>
          </div>
          <Progress value={budgetProgress} className="h-1.5" />
        </div>

        <CollapsibleContent>
          <div className="mt-4 space-y-2 pl-6 border-l-2 border-muted">
            {adSet.ads.map(ad => (
              <CampaignTreeAd 
                key={ad.id} 
                ad={ad} 
                onEdit={onEditAd}
              />
            ))}
            {adSet.ads.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Sin anuncios creados
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

// Campaign Component
interface CampaignTreeCampaignProps {
  campaign: PaidCampaign
  onEditAd?: (ad: Ad) => void
  onEditAdSet?: (adSet: AdSet) => void
  onEditCampaign?: (campaign: PaidCampaign) => void
}

export function CampaignTreeCampaign({ 
  campaign, 
  onEditAd,
  onEditAdSet,
  onEditCampaign
}: CampaignTreeCampaignProps) {
  const [isOpen, setIsOpen] = React.useState(true)
  const budgetSpent = campaign.metrics?.spend || 0
  const budgetProgress = (budgetSpent / campaign.budget) * 100

  // Calculate KPI status
  const getKPIStatus = (actual: number, target: { min: number; max: number; target: number }) => {
    if (actual <= target.min) return { status: 'excellent', color: 'text-green-600' }
    if (actual <= target.target) return { status: 'good', color: 'text-emerald-600' }
    if (actual <= target.max) return { status: 'warning', color: 'text-amber-600' }
    return { status: 'critical', color: 'text-red-600' }
  }

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-start justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                {isOpen ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground mt-0.5" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground mt-0.5" />
                )}
                <div className="flex items-center gap-2">
                  {platformIcons[campaign.platform]}
                  <div>
                    <CardTitle className="text-base">{campaign.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {campaign.adSets.length} conjuntos de anuncios
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={statusColors[campaign.status]}>
                  {statusLabels[campaign.status]}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditCampaign?.(campaign)}>
                      Editar campaña
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      {campaign.status === 'active' ? (
                        <><Pause className="h-4 w-4 mr-2" /> Pausar</>
                      ) : (
                        <><Play className="h-4 w-4 mr-2" /> Activar</>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem><Copy className="h-4 w-4 mr-2" /> Duplicar</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" /> Archivar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CollapsibleTrigger>

          {/* Campaign Metrics Summary */}
          {campaign.metrics && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Gastado
                </p>
                <p className="font-semibold">{formatCurrency(campaign.metrics.spend)}</p>
                <Progress value={budgetProgress} className="h-1 mt-1" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Eye className="h-3 w-3" /> Alcance
                </p>
                <p className="font-semibold">{formatNumber(campaign.metrics.reach)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MousePointer className="h-3 w-3" /> Clicks
                </p>
                <p className="font-semibold">{formatNumber(campaign.metrics.clicks)}</p>
                <p className="text-xs text-muted-foreground">{campaign.metrics.ctr.toFixed(2)}% CTR</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" /> Leads
                </p>
                <p className="font-semibold">{campaign.metrics.leads}</p>
                {campaign.targetKPIs?.cpl && (
                  <p className={`text-xs ${getKPIStatus(campaign.metrics.cpl, campaign.targetKPIs.cpl).color}`}>
                    CPL: {formatCurrency(campaign.metrics.cpl)}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Target className="h-3 w-3" /> Conversiones
                </p>
                <p className="font-semibold">{campaign.metrics.conversions}</p>
                {campaign.metrics.cpa > 0 && (
                  <p className="text-xs text-muted-foreground">
                    CPA: {formatCurrency(campaign.metrics.cpa)}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {campaign.adSets.map(adSet => (
                <CampaignTreeAdSet
                  key={adSet.id}
                  adSet={adSet}
                  onEditAd={onEditAd}
                  onEditAdSet={onEditAdSet}
                />
              ))}
              {campaign.adSets.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  Sin conjuntos de anuncios
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

// Full Campaign Tree
interface CampaignTreeProps {
  campaigns: PaidCampaign[]
  onEditAd?: (ad: Ad) => void
  onEditAdSet?: (adSet: AdSet) => void
  onEditCampaign?: (campaign: PaidCampaign) => void
}

export function CampaignTree({ 
  campaigns,
  onEditAd,
  onEditAdSet,
  onEditCampaign
}: CampaignTreeProps) {
  return (
    <div className="space-y-4">
      {campaigns.map(campaign => (
        <CampaignTreeCampaign
          key={campaign.id}
          campaign={campaign}
          onEditAd={onEditAd}
          onEditAdSet={onEditAdSet}
          onEditCampaign={onEditCampaign}
        />
      ))}
      {campaigns.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay campañas creadas
          </CardContent>
        </Card>
      )}
    </div>
  )
}
