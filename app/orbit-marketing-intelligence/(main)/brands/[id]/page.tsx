"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  BrandProgressCard, 
  BrandProgressGrid,
  QualityScoreCircle,
  MissingInfoPanel,
  BlockingAlert
} from "@/components/marketing-intelligence/brands"
import { KpiCard, KpiGrid } from "@/components/marketing-intelligence/kpi-card"
import { 
  getBrandById, 
  getPersonasByBrand, 
  getBriefByBrand, 
  getObjectivesByBrand,
  getAssetsByBrand,
  calculateOverallCompletion 
} from "@/lib/marketing-intelligence/brand-mock-data"
import { mockMIClients } from "@/lib/marketing-intelligence/mock-data"
import { formatCurrency, formatNumber } from "@/lib/marketing-intelligence/calculations"
import {
  ArrowLeft,
  Building2,
  FileText,
  Target,
  Users,
  FolderOpen,
  Settings,
  MapPin,
  Globe,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Pause,
  Archive,
  ExternalLink,
  Sparkles,
  ChevronRight,
  BarChart3,
  Megaphone,
  ImageIcon,
  Plug,
  Bell,
  Lightbulb,
  Trophy,
  FileBarChart,
  Cpu,
  Palette,
  Wand2,
  Bot,
  Search,
} from "lucide-react"

export default function BrandDashboardPage() {
  const params = useParams()
  const brandId = params.id as string
  
  const brand = getBrandById(brandId)
  const personas = getPersonasByBrand(brandId)
  const brief = getBriefByBrand(brandId)
  const objectives = getObjectivesByBrand(brandId)
  const assets = getAssetsByBrand(brandId)
  
  if (!brand) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <h2 className="text-xl font-semibold">Marca no encontrada</h2>
        <Button asChild>
          <Link href="/orbit-marketing-intelligence/brands">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Marcas
          </Link>
        </Button>
      </div>
    )
  }

  const client = mockMIClients.find(c => c.id === brand.clientId)
  const overallCompletion = calculateOverallCompletion(brand)
  const approvedPersonas = personas.filter(p => p.status === 'aprobado').length

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
      activo: { label: 'Activo', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
      pausado: { label: 'Pausado', color: 'bg-amber-100 text-amber-700', icon: Pause },
      archivado: { label: 'Archivado', color: 'bg-gray-100 text-gray-600', icon: Archive },
      borrador: { label: 'Borrador', color: 'bg-blue-100 text-blue-700', icon: Clock },
    }
    return configs[status] || configs.borrador
  }

  const statusConfig = getStatusConfig(brand.status)
  const StatusIcon = statusConfig.icon

  // Calculate missing info items
  const missingItems = []
  if (brand.profileCompletion < 100) {
    missingItems.push({ label: 'Completar perfil de marca', priority: 'high' as const, section: 'Perfil', actionUrl: `/orbit-marketing-intelligence/brands/${brandId}/profile` })
  }
  if (brand.briefCompletion < 70) {
    missingItems.push({ label: 'Brief al menos 70% completo', priority: 'high' as const, section: 'Brief', actionUrl: `/orbit-marketing-intelligence/brands/${brandId}/brief` })
  }
  if (approvedPersonas === 0) {
    missingItems.push({ label: 'Al menos 1 buyer persona aprobado', priority: 'high' as const, section: 'Personas', actionUrl: `/orbit-marketing-intelligence/brands/${brandId}/personas` })
  }
  if (brand.objectivesCompletion < 80) {
    missingItems.push({ label: 'Definir objetivos y KPIs', priority: 'medium' as const, section: 'Objetivos', actionUrl: `/orbit-marketing-intelligence/brands/${brandId}/objectives` })
  }
  if (brand.assetsCompletion < 50) {
    missingItems.push({ label: 'Subir activos visuales', priority: 'medium' as const, section: 'Activos', actionUrl: `/orbit-marketing-intelligence/brands/${brandId}/assets` })
  }

  // Check blocking conditions
  const isBriefBlocked = brand.briefCompletion < 70
  const isPersonasBlocked = brand.briefCompletion < 70
  const isPlanningBlocked = approvedPersonas === 0 || brand.objectivesCompletion < 80

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/orbit-marketing-intelligence/brands" className="hover:text-foreground">
              Marcas
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span>{brand.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{brand.name}</h1>
            <Badge variant="outline" className={statusConfig.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {client?.name}
            <span className="text-muted-foreground/50">•</span>
            <MapPin className="h-4 w-4" />
            {brand.city}, {brand.country}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {brand.website && (
            <Button variant="outline" size="sm" asChild>
              <a href={brand.website} target="_blank" rel="noopener noreferrer">
                <Globe className="h-4 w-4 mr-2" />
                Sitio Web
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/orbit-marketing-intelligence/brands/${brandId}/settings`}>
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </Link>
          </Button>
        </div>
      </div>

      {/* Overall Progress & Quick Stats */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Completion Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Progreso de Configuración</CardTitle>
            <CardDescription>Completa todas las secciones para desbloquear funcionalidades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <QualityScoreCircle score={overallCompletion} size={100} />
              <div className="flex-1 space-y-4">
                <BrandProgressGrid className="grid-cols-5">
                  <BrandProgressCard
                    title="Perfil"
                    progress={brand.profileCompletion}
                    href={`/orbit-marketing-intelligence/brands/${brandId}/profile`}
                    icon={<Building2 className="h-4 w-4" />}
                  />
                  <BrandProgressCard
                    title="Brief"
                    progress={brand.briefCompletion}
                    href={`/orbit-marketing-intelligence/brands/${brandId}/brief`}
                    icon={<FileText className="h-4 w-4" />}
                  />
                  <BrandProgressCard
                    title="Objetivos"
                    progress={brand.objectivesCompletion}
                    href={`/orbit-marketing-intelligence/brands/${brandId}/objectives`}
                    icon={<Target className="h-4 w-4" />}
                  />
                  <BrandProgressCard
                    title="Personas"
                    progress={brand.personasCompletion}
                    href={`/orbit-marketing-intelligence/brands/${brandId}/personas`}
                    icon={<Users className="h-4 w-4" />}
                  />
                  <BrandProgressCard
                    title="Activos"
                    progress={brand.assetsCompletion}
                    href={`/orbit-marketing-intelligence/brands/${brandId}/assets`}
                    icon={<FolderOpen className="h-4 w-4" />}
                  />
                </BrandProgressGrid>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Missing Info Panel */}
        {missingItems.length > 0 && (
          <MissingInfoPanel
            title="Pendientes"
            description="Completa estos elementos para habilitar funcionalidades"
            items={missingItems}
            maxItems={4}
          />
        )}
      </div>

      {/* Quick Stats */}
      <KpiGrid>
        <KpiCard
          title="Presupuesto Mensual"
          value={brand.monthlyBudget ? formatCurrency(brand.monthlyBudget) : 'No definido'}
          icon={DollarSign}
        />
        <KpiCard
          title="Buyer Personas"
          value={`${approvedPersonas}/${personas.length}`}
          changeLabel={`${personas.length - approvedPersonas} pendientes`}
          icon={Users}
        />
        <KpiCard
          title="Quality Score Brief"
          value={brief ? `${brief.qualityScore}%` : 'Sin brief'}
          icon={FileText}
          status={brief && brief.qualityScore >= 70 ? 'good' : brief && brief.qualityScore >= 40 ? 'warning' : 'critical'}
        />
        <KpiCard
          title="Activos Cargados"
          value={assets.length.toString()}
          changeLabel={`${assets.filter(a => a.status === 'aprobado').length} aprobados`}
          icon={ImageIcon}
        />
      </KpiGrid>

      {/* Real Estate Specific Section */}
      {brand.realEstate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Información del Proyecto Inmobiliario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Ubicación</p>
                <p className="font-medium">{brand.realEstate.location}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Precio desde</p>
                <p className="font-medium">{formatCurrency(brand.realEstate.priceFrom)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Unidades disponibles</p>
                <p className="font-medium">{brand.realEstate.availableUnits} de {brand.realEstate.totalUnits}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Fecha de entrega</p>
                <p className="font-medium">{new Date(brand.realEstate.deliveryDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long' })}</p>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Meta de ventas</p>
                <p className="font-medium text-lg">{brand.realEstate.salesGoal || 0} unidades</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Meta de apartados</p>
                <p className="font-medium text-lg">{brand.realEstate.reservationsGoal || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Meta de citas</p>
                <p className="font-medium text-lg">{brand.realEstate.appointmentsGoal || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Meta de visitas</p>
                <p className="font-medium text-lg">{brand.realEstate.visitsGoal || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blocking Alerts */}
      {isPlanningBlocked && (
        <BlockingAlert
          feature="Planeación Orgánica"
          reason="No puedes generar planeación de contenido orgánico hasta completar los requisitos"
          missingPrerequisites={[
            ...(approvedPersonas === 0 ? ['Al menos 1 buyer persona aprobado'] : []),
            ...(brand.objectivesCompletion < 80 ? ['Objetivos al 80% completos'] : [])
          ]}
          actionUrl={approvedPersonas === 0 
            ? `/orbit-marketing-intelligence/brands/${brandId}/personas`
            : `/orbit-marketing-intelligence/brands/${brandId}/objectives`
          }
        />
      )}

      {/* Quick Navigation */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="group hover:shadow-md transition-all cursor-pointer" asChild>
          <Link href={`/orbit-marketing-intelligence/brands/${brandId}/profile`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Perfil de Marca
                </CardTitle>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <CardDescription>
                Información general, identidad visual y datos del proyecto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={brand.profileCompletion} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">{brand.profileCompletion}% completo</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="group hover:shadow-md transition-all cursor-pointer" asChild>
          <Link href={`/orbit-marketing-intelligence/brands/${brandId}/brief`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Brief Inteligente
                </CardTitle>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <CardDescription>
                Información estratégica para campañas y contenido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={brand.briefCompletion} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">{brand.briefCompletion}% completo</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="group hover:shadow-md transition-all cursor-pointer" asChild>
          <Link href={`/orbit-marketing-intelligence/brands/${brandId}/objectives`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Objetivos y KPIs
                </CardTitle>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <CardDescription>
                Metas, presupuestos y métricas de rendimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={brand.objectivesCompletion} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">{brand.objectivesCompletion}% completo</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="group hover:shadow-md transition-all cursor-pointer" asChild>
          <Link href={`/orbit-marketing-intelligence/brands/${brandId}/personas`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Buyer Personas
                </CardTitle>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <CardDescription>
                Perfiles de audiencia objetivo con insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Progress value={brand.personasCompletion} className="h-2 w-32" />
                  <p className="text-xs text-muted-foreground mt-2">{brand.personasCompletion}% completo</p>
                </div>
                <Badge variant="secondary">{personas.length} personas</Badge>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="group hover:shadow-md transition-all cursor-pointer" asChild>
          <Link href={`/orbit-marketing-intelligence/brands/${brandId}/assets`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-primary" />
                  Activos
                </CardTitle>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <CardDescription>
                Logos, renders, videos y materiales de marca
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Progress value={brand.assetsCompletion} className="h-2 w-32" />
                  <p className="text-xs text-muted-foreground mt-2">{brand.assetsCompletion}% completo</p>
                </div>
                <Badge variant="secondary">{assets.length} archivos</Badge>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="group hover:shadow-md transition-all cursor-pointer border-dashed" asChild>
          <Link href={`/orbit-marketing-intelligence/brands/${brandId}/settings`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Configuración
                </CardTitle>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <CardDescription>
                Permisos, notificaciones y conexiones
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Content Management - Phase 2 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-primary" />
            Gestión de Contenido
          </CardTitle>
          <CardDescription>
            Planeación, creación y publicación de contenido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link 
              href={`/orbit-marketing-intelligence/brands/${brandId}/content`}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-purple-50">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm group-hover:text-primary transition-colors">Planeación Orgánica</p>
                <p className="text-xs text-muted-foreground">Contenido y pilares</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              href={`/orbit-marketing-intelligence/brands/${brandId}/calendar`}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-blue-50">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm group-hover:text-primary transition-colors">Calendario</p>
                <p className="text-xs text-muted-foreground">Programador</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              href={`/orbit-marketing-intelligence/brands/${brandId}/paid`}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-green-50">
                <Megaphone className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm group-hover:text-primary transition-colors">Pauta y Campañas</p>
                <p className="text-xs text-muted-foreground">Inversión pagada</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              href={`/orbit-marketing-intelligence/brands/${brandId}/social`}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-pink-50">
                <Share2 className="h-5 w-5 text-pink-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm group-hover:text-primary transition-colors">Redes Sociales</p>
                <p className="text-xs text-muted-foreground">Conexiones</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              href={`/orbit-marketing-intelligence/brands/${brandId}/moodboards`}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-amber-50">
                <Palette className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm group-hover:text-primary transition-colors">Moodboards</p>
                <p className="text-xs text-muted-foreground">Referencias visuales</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              href={`/orbit-marketing-intelligence/brands/${brandId}/creatives`}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-indigo-50">
                <Wand2 className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm group-hover:text-primary transition-colors">Estudio Creativo</p>
                <p className="text-xs text-muted-foreground">Generación IA</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              href={`/orbit-marketing-intelligence/brands/${brandId}/gems`}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-cyan-50">
                <Bot className="h-5 w-5 text-cyan-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm group-hover:text-primary transition-colors">GEMs y Agentes</p>
                <p className="text-xs text-muted-foreground">Asistentes IA</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Marketing Intelligence Center - Phase 3 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Centro de Marketing Intelligence
          </CardTitle>
          <CardDescription>
            Analítica avanzada, insights y reportes de rendimiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link 
              href={`/orbit-marketing-intelligence/brands/${brandId}/media`}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-blue-50">
                <Plug className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm group-hover:text-primary transition-colors">Panel de Medios</p>
                <p className="text-xs text-muted-foreground">Conexiones y métricas</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              href={`/orbit-marketing-intelligence/brands/${brandId}/analytics`}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-purple-50">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm group-hover:text-primary transition-colors">Analytics</p>
                <p className="text-xs text-muted-foreground">KPIs y semáforos</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              href={`/orbit-marketing-intelligence/brands/${brandId}/rankings/campaigns`}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-amber-50">
                <Trophy className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm group-hover:text-primary transition-colors">Rankings</p>
                <p className="text-xs text-muted-foreground">Top campañas y contenido</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              href={`/orbit-marketing-intelligence/brands/${brandId}/performance`}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-green-50">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm group-hover:text-primary transition-colors">Performance</p>
                <p className="text-xs text-muted-foreground">Por persona y canal</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              href={`/orbit-marketing-intelligence/brands/${brandId}/insights`}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-indigo-50">
                <Lightbulb className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm group-hover:text-primary transition-colors">Insights IA</p>
                <p className="text-xs text-muted-foreground">Recomendaciones</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              href={`/orbit-marketing-intelligence/brands/${brandId}/alerts`}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-red-50">
                <Bell className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm group-hover:text-primary transition-colors">Alertas</p>
                <p className="text-xs text-muted-foreground">Notificaciones inteligentes</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              href={`/orbit-marketing-intelligence/brands/${brandId}/reports`}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-emerald-50">
                <FileBarChart className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm group-hover:text-primary transition-colors">Reportes</p>
                <p className="text-xs text-muted-foreground">Ejecutivos mensuales</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              href={`/orbit-marketing-intelligence/brands/${brandId}/seo`}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-orange-50">
                <Search className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm group-hover:text-primary transition-colors">SEO</p>
                <p className="text-xs text-muted-foreground">Keywords, meta tags y auditoría</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              href={`/orbit-marketing-intelligence/brands/${brandId}/integrations`}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-slate-50">
                <Cpu className="h-5 w-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm group-hover:text-primary transition-colors">Integraciones</p>
                <p className="text-xs text-muted-foreground">Looker, CRM, más</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Features */}
      <Card className="border-dashed bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Próximamente
          </CardTitle>
          <CardDescription>
            Funcionalidades que se desbloquearán cuando completes la configuración
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
              <div className="p-2 rounded-lg bg-primary/10">
                <Megaphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Planeación Orgánica</p>
                <p className="text-xs text-muted-foreground">Calendario de contenido con IA</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Pauta Inteligente</p>
                <p className="text-xs text-muted-foreground">Campañas optimizadas automáticamente</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
              <div className="p-2 rounded-lg bg-primary/10">
                <ImageIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Creativos con IA</p>
                <p className="text-xs text-muted-foreground">Generación de imágenes y copy</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
