"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Globe,
  Target,
  Users,
  Palette,
  CheckCircle2,
  Loader2,
  Upload,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
} from "lucide-react"

// Wizard steps
const steps = [
  { id: 1, name: "Información Básica", icon: Building2 },
  { id: 2, name: "Industria y Tipo", icon: Target },
  { id: 3, name: "Contacto y Redes", icon: Globe },
  { id: 4, name: "Identidad Visual", icon: Palette },
  { id: 5, name: "Confirmación", icon: CheckCircle2 },
]

// Industries with real estate emphasis
const industries = [
  { value: "real_estate", label: "Bienes Raíces / Inmobiliaria", highlighted: true },
  { value: "real_estate_residential", label: "Desarrollos Residenciales", highlighted: true },
  { value: "real_estate_commercial", label: "Inmuebles Comerciales", highlighted: true },
  { value: "real_estate_luxury", label: "Bienes Raíces de Lujo", highlighted: true },
  { value: "construction", label: "Construcción", highlighted: false },
  { value: "architecture", label: "Arquitectura y Diseño", highlighted: false },
  { value: "technology", label: "Tecnología", highlighted: false },
  { value: "ecommerce", label: "E-commerce", highlighted: false },
  { value: "finance", label: "Finanzas y Banca", highlighted: false },
  { value: "healthcare", label: "Salud", highlighted: false },
  { value: "education", label: "Educación", highlighted: false },
  { value: "hospitality", label: "Hotelería y Turismo", highlighted: false },
  { value: "food_beverage", label: "Alimentos y Bebidas", highlighted: false },
  { value: "retail", label: "Retail", highlighted: false },
  { value: "automotive", label: "Automotriz", highlighted: false },
  { value: "professional_services", label: "Servicios Profesionales", highlighted: false },
  { value: "entertainment", label: "Entretenimiento", highlighted: false },
  { value: "other", label: "Otro", highlighted: false },
]

// Brand types
const brandTypes = [
  { value: "corporate", label: "Corporativa", description: "Marca principal de la empresa" },
  { value: "product", label: "Producto", description: "Marca de un producto específico" },
  { value: "project", label: "Proyecto", description: "Marca de un proyecto o desarrollo" },
  { value: "subdivision", label: "Subdivisión", description: "Submarca o línea de negocio" },
]

export default function NewBrandWizardPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    // Step 1 - Basic Info
    name: "",
    description: "",
    clientId: "",
    
    // Step 2 - Industry & Type
    industry: "",
    brandType: "corporate",
    isRealEstate: false,
    
    // Real Estate specific fields
    projectType: "", // residencial, comercial, mixto
    projectLocation: "",
    projectPhase: "", // preventa, construccion, entrega
    priceRange: "",
    targetDeliveryDate: "",
    
    // Step 3 - Contact & Social
    website: "",
    email: "",
    phone: "",
    address: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    twitter: "",
    
    // Step 4 - Visual Identity
    primaryColor: "#3b82f6",
    secondaryColor: "#10b981",
    logoUrl: "",
    brandGuidelines: "",
  })
  
  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Auto-detect if it's real estate based on industry
      if (field === "industry") {
        const isRealEstateIndustry = value.toString().includes("real_estate")
        updated.isRealEstate = isRealEstateIndustry
      }
      
      return updated
    })
  }
  
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name.length > 0
      case 2:
        return formData.industry.length > 0
      case 3:
        return true // Optional step
      case 4:
        return true // Optional step
      default:
        return true
    }
  }
  
  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }
  
  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    toast.success("Marca creada exitosamente")
    router.push("/orbit-marketing-intelligence/brands")
  }
  
  const progressPercentage = (currentStep / steps.length) * 100

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/orbit-marketing-intelligence/brands">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nueva Marca</h1>
          <p className="text-muted-foreground">Configura una nueva marca paso a paso</p>
        </div>
      </div>
      
      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = step.id === currentStep
              const isComplete = step.id < currentStep
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div 
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                        isComplete 
                          ? "bg-primary border-primary text-primary-foreground" 
                          : isActive 
                            ? "border-primary text-primary" 
                            : "border-muted text-muted-foreground"
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className={`mt-2 text-xs ${isActive ? "font-medium" : "text-muted-foreground"}`}>
                      {step.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div 
                      className={`w-16 h-0.5 mx-2 ${
                        step.id < currentStep ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
          <Progress value={progressPercentage} className="h-1" />
        </CardContent>
      </Card>
      
      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {/* Step 1 - Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-1">Información Básica</h2>
                <p className="text-muted-foreground">Define el nombre y descripción de la marca</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la Marca *</Label>
                  <Input
                    id="name"
                    placeholder="Ej: Residencial Los Pinos"
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Breve descripción de la marca o proyecto..."
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente Asociado</Label>
                  <Select 
                    value={formData.clientId} 
                    onValueChange={(v) => updateFormData("clientId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un cliente (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client-1">Grupo Inmobiliario ABC</SelectItem>
                      <SelectItem value="client-2">Desarrollos Premium SA</SelectItem>
                      <SelectItem value="client-3">Constructora del Valle</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Asocia esta marca a un cliente existente
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2 - Industry & Type */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-1">Industria y Tipo</h2>
                <p className="text-muted-foreground">Clasifica tu marca para una mejor configuración</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Industria *</Label>
                  <Select 
                    value={formData.industry} 
                    onValueChange={(v) => updateFormData("industry", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una industria" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Bienes Raíces
                      </div>
                      {industries.filter(i => i.highlighted).map(industry => (
                        <SelectItem key={industry.value} value={industry.value}>
                          {industry.label}
                        </SelectItem>
                      ))}
                      <Separator className="my-1" />
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Otras Industrias
                      </div>
                      {industries.filter(i => !i.highlighted).map(industry => (
                        <SelectItem key={industry.value} value={industry.value}>
                          {industry.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Tipo de Marca</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {brandTypes.map(type => (
                      <div
                        key={type.value}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          formData.brandType === type.value 
                            ? "border-primary bg-primary/5" 
                            : "hover:border-muted-foreground/50"
                        }`}
                        onClick={() => updateFormData("brandType", type.value)}
                      >
                        <p className="font-medium">{type.label}</p>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Real Estate specific fields */}
                {formData.isRealEstate && (
                  <>
                    <Separator />
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Campos específicos para Bienes Raíces
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tipo de Proyecto</Label>
                          <Select 
                            value={formData.projectType} 
                            onValueChange={(v) => updateFormData("projectType", v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="residencial">Residencial</SelectItem>
                              <SelectItem value="comercial">Comercial</SelectItem>
                              <SelectItem value="mixto">Mixto</SelectItem>
                              <SelectItem value="industrial">Industrial</SelectItem>
                              <SelectItem value="terreno">Terreno / Lotes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Fase del Proyecto</Label>
                          <Select 
                            value={formData.projectPhase} 
                            onValueChange={(v) => updateFormData("projectPhase", v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona fase" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="planeacion">En planeación</SelectItem>
                              <SelectItem value="preventa">Preventa</SelectItem>
                              <SelectItem value="construccion">En construcción</SelectItem>
                              <SelectItem value="entrega">Entrega inmediata</SelectItem>
                              <SelectItem value="vendido">Vendido</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Ubicación del Proyecto</Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="Ej: Polanco, CDMX"
                              className="pl-9"
                              value={formData.projectLocation}
                              onChange={(e) => updateFormData("projectLocation", e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Rango de Precios</Label>
                          <Select 
                            value={formData.priceRange} 
                            onValueChange={(v) => updateFormData("priceRange", v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona rango" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="economic">Económico (&lt; $2M MXN)</SelectItem>
                              <SelectItem value="medium">Medio ($2M - $5M MXN)</SelectItem>
                              <SelectItem value="premium">Premium ($5M - $15M MXN)</SelectItem>
                              <SelectItem value="luxury">Lujo ($15M+ MXN)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Step 3 - Contact & Social */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-1">Contacto y Redes Sociales</h2>
                <p className="text-muted-foreground">Información de contacto y presencia digital</p>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Sitio Web</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="website"
                        placeholder="https://www.ejemplo.com"
                        className="pl-9"
                        value={formData.website}
                        onChange={(e) => updateFormData("website", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email de Contacto</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="contacto@ejemplo.com"
                        className="pl-9"
                        value={formData.email}
                        onChange={(e) => updateFormData("email", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="phone"
                        placeholder="+52 55 1234 5678"
                        className="pl-9"
                        value={formData.phone}
                        onChange={(e) => updateFormData("phone", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="address"
                        placeholder="Calle, Colonia, Ciudad"
                        className="pl-9"
                        value={formData.address}
                        onChange={(e) => updateFormData("address", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                <p className="text-sm font-medium">Redes Sociales</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="instagram"
                        placeholder="@usuario"
                        className="pl-9"
                        value={formData.instagram}
                        onChange={(e) => updateFormData("instagram", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <div className="relative">
                      <Facebook className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="facebook"
                        placeholder="facebook.com/pagina"
                        className="pl-9"
                        value={formData.facebook}
                        onChange={(e) => updateFormData("facebook", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="linkedin"
                        placeholder="linkedin.com/company/empresa"
                        className="pl-9"
                        value={formData.linkedin}
                        onChange={(e) => updateFormData("linkedin", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter / X</Label>
                    <div className="relative">
                      <Twitter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="twitter"
                        placeholder="@usuario"
                        className="pl-9"
                        value={formData.twitter}
                        onChange={(e) => updateFormData("twitter", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4 - Visual Identity */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-1">Identidad Visual</h2>
                <p className="text-muted-foreground">Configura los elementos visuales de la marca</p>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Color Primario</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => updateFormData("primaryColor", e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={formData.primaryColor}
                        onChange={(e) => updateFormData("primaryColor", e.target.value)}
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Color Secundario</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.secondaryColor}
                        onChange={(e) => updateFormData("secondaryColor", e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={formData.secondaryColor}
                        onChange={(e) => updateFormData("secondaryColor", e.target.value)}
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Logo de la Marca</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Arrastra tu logo aquí o haz clic para seleccionar
                    </p>
                    <Button variant="outline" size="sm">
                      Seleccionar Archivo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG, SVG o JPG. Máximo 5MB.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="guidelines">URL de Brand Guidelines (opcional)</Label>
                  <Input
                    id="guidelines"
                    placeholder="https://drive.google.com/..."
                    value={formData.brandGuidelines}
                    onChange={(e) => updateFormData("brandGuidelines", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enlace a documento de lineamientos de marca
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 5 - Confirmation */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-1">Confirmar y Crear</h2>
                <p className="text-muted-foreground">Revisa la información antes de crear la marca</p>
              </div>
              
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Información General</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nombre:</span>
                      <span className="font-medium">{formData.name || "No especificado"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Industria:</span>
                      <span className="font-medium">
                        {industries.find(i => i.value === formData.industry)?.label || "No especificado"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="font-medium">
                        {brandTypes.find(t => t.value === formData.brandType)?.label || "No especificado"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                {formData.isRealEstate && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Datos del Proyecto Inmobiliario
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tipo de proyecto:</span>
                        <span className="font-medium">{formData.projectType || "No especificado"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fase:</span>
                        <span className="font-medium">{formData.projectPhase || "No especificado"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ubicación:</span>
                        <span className="font-medium">{formData.projectLocation || "No especificado"}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Contacto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {formData.website && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Website:</span>
                        <span className="font-medium">{formData.website}</span>
                      </div>
                    )}
                    {formData.email && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{formData.email}</span>
                      </div>
                    )}
                    {!formData.website && !formData.email && (
                      <p className="text-muted-foreground italic">Sin información de contacto</p>
                    )}
                  </CardContent>
                </Card>
                
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 inline mr-2" />
                    Después de crear la marca, podrás completar el brief inteligente para desbloquear 
                    la generación de buyer personas con IA.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        {/* Navigation Buttons */}
        <Separator />
        <div className="p-4 flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrev}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          
          {currentStep < steps.length ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Siguiente
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Crear Marca
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
