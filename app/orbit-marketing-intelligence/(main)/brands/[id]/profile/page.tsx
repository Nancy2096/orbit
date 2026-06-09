"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { toast } from "sonner"
import { QualityScoreBadge } from "@/components/marketing-intelligence/brands"
import { getBrandById } from "@/lib/marketing-intelligence/brand-mock-data"
import { mockMIClients } from "@/lib/marketing-intelligence/mock-data"
import {
  ArrowLeft,
  Building2,
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Save,
  ChevronRight,
  Palette,
  Type,
  MessageSquare,
  Target,
  Users,
  DollarSign,
  Calendar,
  MapPin,
  Home,
  Layers,
  CreditCard,
  TrendingUp,
  X,
  Plus
} from "lucide-react"
import type { ProjectType, RealEstateStage } from "@/lib/marketing-intelligence/brand-types"

const projectTypes = [
  { value: 'inmobiliario', label: 'Inmobiliario' },
  { value: 'producto', label: 'Producto' },
  { value: 'servicio', label: 'Servicio' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'otro', label: 'Otro' },
]

const industries = [
  'Real Estate', 'Tecnología', 'E-commerce', 'Finanzas', 'Salud', 
  'Educación', 'Retail', 'Automotriz', 'Turismo', 'Alimentos', 
  'Servicios Profesionales', 'Entretenimiento', 'Manufactura', 'Otro'
]

const realEstateStages: { value: RealEstateStage; label: string }[] = [
  { value: 'preventa', label: 'Preventa' },
  { value: 'lanzamiento', label: 'Lanzamiento' },
  { value: 'comercializacion', label: 'Comercialización' },
  { value: 'cierre', label: 'Cierre' },
  { value: 'entregado', label: 'Entregado' },
]

export default function BrandProfilePage() {
  const params = useParams()
  const brandId = params.id as string
  const brand = getBrandById(brandId)
  
  const [formData, setFormData] = useState({
    // Basic info
    name: brand?.name || '',
    clientId: brand?.clientId || '',
    projectType: brand?.projectType || 'inmobiliario' as ProjectType,
    industry: brand?.industry || '',
    country: brand?.country || 'México',
    city: brand?.city || '',
    website: brand?.website || '',
    
    // Social media
    instagram: brand?.socialMedia?.instagram || '',
    facebook: brand?.socialMedia?.facebook || '',
    linkedin: brand?.socialMedia?.linkedin || '',
    youtube: brand?.socialMedia?.youtube || '',
    tiktok: brand?.socialMedia?.tiktok || '',
    
    // Brand identity
    colors: brand?.colors || [''],
    typography: brand?.typography || '',
    toneOfVoice: brand?.toneOfVoice || '',
    valueProposition: brand?.valueProposition || '',
    differentiators: brand?.differentiators || [''],
    competitors: brand?.competitors || [''],
    productsServices: brand?.productsServices || [''],
    
    // Business
    monthlyBudget: brand?.monthlyBudget || 0,
    commercialObjective: brand?.commercialObjective || '',
    startDate: brand?.startDate || '',
    internalManager: brand?.internalManager || '',
    
    // Real Estate specific
    realEstate: {
      location: brand?.realEstate?.location || '',
      priceFrom: brand?.realEstate?.priceFrom || 0,
      priceTo: brand?.realEstate?.priceTo || 0,
      totalUnits: brand?.realEstate?.totalUnits || 0,
      availableUnits: brand?.realEstate?.availableUnits || 0,
      typologies: brand?.realEstate?.typologies || [''],
      sqmFrom: brand?.realEstate?.sqmFrom || 0,
      sqmTo: brand?.realEstate?.sqmTo || 0,
      amenities: brand?.realEstate?.amenities || [''],
      deliveryDate: brand?.realEstate?.deliveryDate || '',
      stage: brand?.realEstate?.stage || 'preventa' as RealEstateStage,
      paymentOptions: brand?.realEstate?.paymentOptions || '',
      financing: brand?.realEstate?.financing || '',
      appreciation: brand?.realEstate?.appreciation || '',
      salesGoal: brand?.realEstate?.salesGoal || 0,
      reservationsGoal: brand?.realEstate?.reservationsGoal || 0,
      appointmentsGoal: brand?.realEstate?.appointmentsGoal || 0,
      visitsGoal: brand?.realEstate?.visitsGoal || 0,
    }
  })

  const isRealEstate = formData.projectType === 'inmobiliario'

  const updateField = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateRealEstateField = (field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      realEstate: { ...prev.realEstate, [field]: value }
    }))
  }

  const addArrayItem = (field: 'colors' | 'differentiators' | 'competitors' | 'productsServices') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const updateArrayItem = (field: 'colors' | 'differentiators' | 'competitors' | 'productsServices', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const removeArrayItem = (field: 'colors' | 'differentiators' | 'competitors' | 'productsServices', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const addRealEstateArrayItem = (field: 'typologies' | 'amenities') => {
    setFormData(prev => ({
      ...prev,
      realEstate: {
        ...prev.realEstate,
        [field]: [...prev.realEstate[field], '']
      }
    }))
  }

  const updateRealEstateArrayItem = (field: 'typologies' | 'amenities', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      realEstate: {
        ...prev.realEstate,
        [field]: prev.realEstate[field].map((item, i) => i === index ? value : item)
      }
    }))
  }

  const removeRealEstateArrayItem = (field: 'typologies' | 'amenities', index: number) => {
    setFormData(prev => ({
      ...prev,
      realEstate: {
        ...prev.realEstate,
        [field]: prev.realEstate[field].filter((_, i) => i !== index)
      }
    }))
  }

  const handleSave = () => {
    toast.success('Perfil guardado correctamente')
  }

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
            <Link href={`/orbit-marketing-intelligence/brands/${brandId}`} className="hover:text-foreground">
              {brand.name}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span>Perfil</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Perfil de Marca</h1>
            <QualityScoreBadge score={brand.profileCompletion} />
          </div>
          <p className="text-muted-foreground">
            Información general, identidad visual y datos del proyecto
          </p>
        </div>
        
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>

      {/* Form */}
      <Accordion type="multiple" defaultValue={['basic', 'social', 'identity', 'business']} className="space-y-4">
        {/* Basic Information */}
        <AccordionItem value="basic" className="border rounded-lg px-6">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="font-semibold">Información Básica</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Marca *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Ej: Torre Central Living"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="client">Cliente</Label>
                <Select value={formData.clientId} onValueChange={(v) => updateField('clientId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockMIClients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="projectType">Tipo de Proyecto *</Label>
                <Select 
                  value={formData.projectType} 
                  onValueChange={(v) => updateField('projectType', v as ProjectType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="industry">Industria *</Label>
                <Select value={formData.industry} onValueChange={(v) => updateField('industry', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una industria" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map(ind => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => updateField('country', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="website">Sitio Web</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    placeholder="https://ejemplo.com"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Social Media */}
        <AccordionItem value="social" className="border rounded-lg px-6">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-primary" />
              <span className="font-semibold">Redes Sociales</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => updateField('instagram', e.target.value)}
                    placeholder="@usuario"
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <div className="relative">
                  <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="facebook"
                    value={formData.facebook}
                    onChange={(e) => updateField('facebook', e.target.value)}
                    placeholder="Nombre de página"
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="linkedin"
                    value={formData.linkedin}
                    onChange={(e) => updateField('linkedin', e.target.value)}
                    placeholder="company/nombre"
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="youtube">YouTube</Label>
                <div className="relative">
                  <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="youtube"
                    value={formData.youtube}
                    onChange={(e) => updateField('youtube', e.target.value)}
                    placeholder="@canal"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Brand Identity */}
        <AccordionItem value="identity" className="border rounded-lg px-6">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <span className="font-semibold">Identidad de Marca</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6">
            <div className="space-y-6">
              {/* Colors */}
              <div className="space-y-2">
                <Label>Colores de Marca</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.colors.map((color, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={color || '#000000'}
                        onChange={(e) => updateArrayItem('colors', index, e.target.value)}
                        className="w-12 h-9 p-1 cursor-pointer"
                      />
                      <Input
                        value={color}
                        onChange={(e) => updateArrayItem('colors', index, e.target.value)}
                        placeholder="#000000"
                        className="w-28"
                      />
                      {formData.colors.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => removeArrayItem('colors', index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addArrayItem('colors')}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar color
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="typography">Tipografía</Label>
                <Input
                  id="typography"
                  value={formData.typography}
                  onChange={(e) => updateField('typography', e.target.value)}
                  placeholder="Ej: Montserrat, Open Sans"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="toneOfVoice">Tono de Voz</Label>
                <Textarea
                  id="toneOfVoice"
                  value={formData.toneOfVoice}
                  onChange={(e) => updateField('toneOfVoice', e.target.value)}
                  placeholder="Describe el tono de comunicación de la marca..."
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="valueProposition">Propuesta de Valor</Label>
                <Textarea
                  id="valueProposition"
                  value={formData.valueProposition}
                  onChange={(e) => updateField('valueProposition', e.target.value)}
                  placeholder="¿Qué hace única a esta marca?"
                  rows={3}
                />
              </div>
              
              {/* Differentiators */}
              <div className="space-y-2">
                <Label>Diferenciadores</Label>
                <div className="space-y-2">
                  {formData.differentiators.map((diff, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={diff}
                        onChange={(e) => updateArrayItem('differentiators', index, e.target.value)}
                        placeholder="Ej: Ubicación premium"
                      />
                      {formData.differentiators.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={() => removeArrayItem('differentiators', index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addArrayItem('differentiators')}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar diferenciador
                  </Button>
                </div>
              </div>
              
              {/* Competitors */}
              <div className="space-y-2">
                <Label>Competidores</Label>
                <div className="space-y-2">
                  {formData.competitors.map((comp, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={comp}
                        onChange={(e) => updateArrayItem('competitors', index, e.target.value)}
                        placeholder="Nombre del competidor"
                      />
                      {formData.competitors.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={() => removeArrayItem('competitors', index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addArrayItem('competitors')}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar competidor
                  </Button>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Business Info */}
        <AccordionItem value="business" className="border rounded-lg px-6">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="font-semibold">Información Comercial</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="monthlyBudget">Presupuesto Mensual (MXN)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="monthlyBudget"
                    type="number"
                    value={formData.monthlyBudget || ''}
                    onChange={(e) => updateField('monthlyBudget', parseFloat(e.target.value) || 0)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de Inicio</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => updateField('startDate', e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="internalManager">Responsable Interno</Label>
                <Input
                  id="internalManager"
                  value={formData.internalManager}
                  onChange={(e) => updateField('internalManager', e.target.value)}
                  placeholder="Nombre del responsable"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="commercialObjective">Objetivo Comercial</Label>
                <Textarea
                  id="commercialObjective"
                  value={formData.commercialObjective}
                  onChange={(e) => updateField('commercialObjective', e.target.value)}
                  placeholder="Describe el objetivo comercial principal..."
                  rows={3}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Real Estate Specific - Only shown if project type is inmobiliario */}
        {isRealEstate && (
          <AccordionItem value="realestate" className="border rounded-lg px-6 border-primary/30 bg-primary/5">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-primary" />
                <span className="font-semibold">Información del Proyecto Inmobiliario</span>
                <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/30">
                  Campos específicos
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6">
              <div className="space-y-8">
                {/* Location & Pricing */}
                <div>
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Ubicación y Precios
                  </h4>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2 md:col-span-2 lg:col-span-3">
                      <Label htmlFor="location">Ubicación del Proyecto</Label>
                      <Input
                        id="location"
                        value={formData.realEstate.location}
                        onChange={(e) => updateRealEstateField('location', e.target.value)}
                        placeholder="Ej: Colonia Roma Norte, CDMX"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="priceFrom">Precio Desde (MXN)</Label>
                      <Input
                        id="priceFrom"
                        type="number"
                        value={formData.realEstate.priceFrom || ''}
                        onChange={(e) => updateRealEstateField('priceFrom', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="priceTo">Precio Hasta (MXN)</Label>
                      <Input
                        id="priceTo"
                        type="number"
                        value={formData.realEstate.priceTo || ''}
                        onChange={(e) => updateRealEstateField('priceTo', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="stage">Etapa del Proyecto</Label>
                      <Select 
                        value={formData.realEstate.stage} 
                        onValueChange={(v) => updateRealEstateField('stage', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {realEstateStages.map(stage => (
                            <SelectItem key={stage.value} value={stage.value}>{stage.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Units & Typologies */}
                <div>
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Unidades y Tipologías
                  </h4>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="totalUnits">Total de Unidades</Label>
                      <Input
                        id="totalUnits"
                        type="number"
                        value={formData.realEstate.totalUnits || ''}
                        onChange={(e) => updateRealEstateField('totalUnits', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="availableUnits">Unidades Disponibles</Label>
                      <Input
                        id="availableUnits"
                        type="number"
                        value={formData.realEstate.availableUnits || ''}
                        onChange={(e) => updateRealEstateField('availableUnits', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="sqmFrom">m² Desde</Label>
                      <Input
                        id="sqmFrom"
                        type="number"
                        value={formData.realEstate.sqmFrom || ''}
                        onChange={(e) => updateRealEstateField('sqmFrom', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="sqmTo">m² Hasta</Label>
                      <Input
                        id="sqmTo"
                        type="number"
                        value={formData.realEstate.sqmTo || ''}
                        onChange={(e) => updateRealEstateField('sqmTo', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <Label>Tipologías</Label>
                    <div className="space-y-2">
                      {formData.realEstate.typologies.map((typ, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={typ}
                            onChange={(e) => updateRealEstateArrayItem('typologies', index, e.target.value)}
                            placeholder="Ej: Depto 2 recámaras"
                          />
                          {formData.realEstate.typologies.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 shrink-0"
                              onClick={() => removeRealEstateArrayItem('typologies', index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => addRealEstateArrayItem('typologies')}>
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar tipología
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <Label>Amenidades</Label>
                    <div className="space-y-2">
                      {formData.realEstate.amenities.map((amen, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={amen}
                            onChange={(e) => updateRealEstateArrayItem('amenities', index, e.target.value)}
                            placeholder="Ej: Gimnasio"
                          />
                          {formData.realEstate.amenities.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 shrink-0"
                              onClick={() => removeRealEstateArrayItem('amenities', index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => addRealEstateArrayItem('amenities')}>
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar amenidad
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Payment & Delivery */}
                <div>
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Pago y Entrega
                  </h4>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="deliveryDate">Fecha de Entrega</Label>
                      <Input
                        id="deliveryDate"
                        type="date"
                        value={formData.realEstate.deliveryDate}
                        onChange={(e) => updateRealEstateField('deliveryDate', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="appreciation">Plusvalía Estimada</Label>
                      <Input
                        id="appreciation"
                        value={formData.realEstate.appreciation}
                        onChange={(e) => updateRealEstateField('appreciation', e.target.value)}
                        placeholder="Ej: 12% anual"
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="paymentOptions">Formas de Pago</Label>
                      <Textarea
                        id="paymentOptions"
                        value={formData.realEstate.paymentOptions}
                        onChange={(e) => updateRealEstateField('paymentOptions', e.target.value)}
                        placeholder="Ej: 10% enganche, 30% durante construcción, 60% a entrega"
                        rows={2}
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="financing">Opciones de Financiamiento</Label>
                      <Textarea
                        id="financing"
                        value={formData.realEstate.financing}
                        onChange={(e) => updateRealEstateField('financing', e.target.value)}
                        placeholder="Ej: Crédito bancario, Infonavit, Fovissste"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Sales Goals */}
                <div>
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Metas Comerciales
                  </h4>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="salesGoal">Meta de Ventas</Label>
                      <Input
                        id="salesGoal"
                        type="number"
                        value={formData.realEstate.salesGoal || ''}
                        onChange={(e) => updateRealEstateField('salesGoal', parseInt(e.target.value) || 0)}
                        placeholder="# unidades"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reservationsGoal">Meta de Apartados</Label>
                      <Input
                        id="reservationsGoal"
                        type="number"
                        value={formData.realEstate.reservationsGoal || ''}
                        onChange={(e) => updateRealEstateField('reservationsGoal', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="appointmentsGoal">Meta de Citas</Label>
                      <Input
                        id="appointmentsGoal"
                        type="number"
                        value={formData.realEstate.appointmentsGoal || ''}
                        onChange={(e) => updateRealEstateField('appointmentsGoal', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="visitsGoal">Meta de Visitas</Label>
                      <Input
                        id="visitsGoal"
                        type="number"
                        value={formData.realEstate.visitsGoal || ''}
                        onChange={(e) => updateRealEstateField('visitsGoal', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {/* Save Button (fixed at bottom on mobile) */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" asChild>
          <Link href={`/orbit-marketing-intelligence/brands/${brandId}`}>
            Cancelar
          </Link>
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>
    </div>
  )
}
