"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Settings,
  Save,
  FolderKanban,
  Calendar,
  Users,
  Briefcase,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Mail,
  Phone,
  Plus,
  Trash2,
  Link2,
  Star,
  Building2,
  Package,
  Palette,
  Video,
  Megaphone,
  BarChart3,
  Image,
  Upload,
  X,
  CheckCircle
} from "lucide-react"

// Mock project data
const mockProject = {
  id: "proj-001",
  name: "Campaña Digital Q2 2024",
  description: "Campaña integral de marketing digital incluyendo redes sociales, pauta digital y contenido.",
  client: "Coca-Cola México",
  clientId: "client-001",
  account: "Coca-Cola Zero",
  accountId: "account-001",
  logo: "/images/logos/coca-cola.png",
  status: "en_progreso",
  priority: "alta",
  startDate: "2024-03-01",
  dueDate: "2024-06-30",
  hoursBudget: 240,
  budget: 450000,
  services: [
    { id: "s1", name: "Diseño Gráfico", category: "Diseño", quantity: 20, unit: "diseños", pricePerUnit: 1500 },
    { id: "s2", name: "Posts Redes Sociales", category: "Social Media", quantity: 30, unit: "posts", pricePerUnit: 500 },
    { id: "s3", name: "Stories/Reels", category: "Social Media", quantity: 15, unit: "piezas", pricePerUnit: 800 },
    { id: "s4", name: "Videos Cortos", category: "Video", quantity: 4, unit: "videos", pricePerUnit: 15000 },
    { id: "s5", name: "Pauta Digital", category: "Pauta", quantity: 1, unit: "campaña", pricePerUnit: 150000 },
    { id: "s6", name: "Community Management", category: "Social Media", quantity: 3, unit: "meses", pricePerUnit: 25000 },
  ],
  manager: { id: "1", name: "María García", initials: "MG" },
  coordinator: { id: "2", name: "Juan Pérez", initials: "JP" },
  socialLinks: {
    website: "https://www.coca-cola.com.mx",
    facebook: "https://facebook.com/cocacolamx",
    instagram: "https://instagram.com/cocacolamx",
    twitter: "https://twitter.com/cocacolamx",
    linkedin: "https://linkedin.com/company/coca-cola",
    youtube: "https://youtube.com/cocacolamx",
    tiktok: "https://tiktok.com/@cocacolamx"
  },
  clientContacts: [
    { 
      id: "c1", 
      name: "Roberto Hernández", 
      position: "Director de Marketing", 
      email: "roberto.hernandez@coca-cola.com", 
      phone: "+52 55 1234 5678",
      isPrimary: true
    },
    { 
      id: "c2", 
      name: "Laura Martínez", 
      position: "Brand Manager", 
      email: "laura.martinez@coca-cola.com", 
      phone: "+52 55 2345 6789",
      isPrimary: false
    }
  ],
  driveLink: "https://drive.google.com/drive/folders/1ABC123xyz",
  calendarId: "proyecto-q2-2024@group.calendar.google.com"
}

interface StaffMember {
  id: string
  first_name: string
  last_name: string
  position: string
  department: string | null
  department_id: string | null
  photo_url: string | null
  agency_id: string | null
  agency?: { id: string; name: string } | null
  department_info?: { id: string; name: string } | null
}

interface Department {
  id: string
  name: string
  agency_id: string
}

interface TeamMember {
  id: string
  staffId: string
  name: string
  initials: string
  area: string
  position: string
  hoursAssigned: number
}

interface AvailableService {
  id: string
  name: string
  description: string | null
  unit_type: string
  base_price: number
  department: { id: string; name: string } | null
  category: string | null
}

interface ProjectService {
  id: string
  serviceId: string
  name: string
  department: string
  category: string
  quantity: number
  unit: string
  price: number
}

export default function ProjectSettingsPage() {
  const [project, setProject] = useState(mockProject)
  const [contacts, setContacts] = useState(mockProject.clientContacts)
  const [socialLinks, setSocialLinks] = useState(mockProject.socialLinks)
  const [services, setServices] = useState(mockProject.services)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [availableStaff, setAvailableStaff] = useState<StaffMember[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [availableServices, setAvailableServices] = useState<AvailableService[]>([])
  const [projectServices, setProjectServices] = useState<ProjectService[]>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const supabase = createClient()
  
  // Handle save changes
  const handleSaveChanges = async () => {
    setSaving(true)
    setSaveSuccess(false)
    
    try {
      // Simulate saving to database
      // In production, you would save to Supabase here
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log("[v0] Saving project settings:", {
        project,
        contacts,
        socialLinks,
        services,
        teamMembers,
        projectServices
      })
      
      setSaveSuccess(true)
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)
    } catch (error) {
      console.error("[v0] Error saving:", error)
    } finally {
      setSaving(false)
    }
  }
  
  // Fetch staff and departments from database
  useEffect(() => {
    async function fetchData() {
      setLoadingStaff(true)
      
      // Fetch staff with their department info
      const { data: staffData } = await supabase
        .from("staff")
        .select(`
          id,
          first_name,
          last_name,
          position,
          department,
          department_id,
          photo_url,
          agency_id,
          agency:agencies(id, name),
          department_info:departments(id, name)
        `)
        .eq("is_active", true)
        .order("first_name")
      
      if (staffData) {
        setAvailableStaff(staffData as StaffMember[])
        
        // Initialize team with first 4 members as example
        const initialTeam = staffData.slice(0, 4).map((s, i) => ({
          id: `tm-${s.id}`,
          staffId: s.id,
          name: `${s.first_name} ${s.last_name}`,
          initials: `${s.first_name[0]}${s.last_name[0]}`,
          area: (s as any).department_info?.name || s.department || "Sin área",
          position: s.position,
          hoursAssigned: [40, 60, 80, 60][i] || 40
        }))
        setTeamMembers(initialTeam)
      }
      
      // Fetch departments
      const { data: deptData } = await supabase
        .from("departments")
        .select("id, name, agency_id")
        .order("name")
      
      if (deptData) {
        setDepartments(deptData)
      }
      
      setLoadingStaff(false)
    }
    
    fetchData()
  }, [])
  
  // Helper to get initials
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }
  
  // Fetch services from database
  useEffect(() => {
    async function fetchServices() {
      setLoadingServices(true)
      
      try {
        // Fetch available services with department info
        const { data: servicesData, error } = await supabase
          .from("services")
          .select(`
            id,
            name,
            description,
            unit_type,
            base_price,
            category,
            department:departments(id, name)
          `)
          .eq("is_active", true)
          .order("name")
        
        if (error) {
          console.log("[v0] Error fetching services:", error)
        }
        
        if (servicesData && servicesData.length > 0) {
          setAvailableServices(servicesData as AvailableService[])
          
          // Initialize with some example services
          const initialServices: ProjectService[] = servicesData.slice(0, 2).map((s, i) => ({
            id: `ps-${s.id}`,
            serviceId: s.id,
            name: s.name,
            department: (s as any).department?.name || "Sin departamento",
            category: s.category || "General",
            quantity: i === 0 ? 10 : 4,
            unit: s.unit_type === "hour" ? "horas" : s.unit_type === "unit" ? "piezas" : s.unit_type === "month" ? "meses" : "proyectos",
            price: s.base_price
          }))
          setProjectServices(initialServices)
        } else {
          // No services in database, set empty arrays
          setAvailableServices([])
          setProjectServices([])
        }
      } catch (err) {
        console.log("[v0] Error in fetchServices:", err)
        setAvailableServices([])
        setProjectServices([])
      } finally {
        setLoadingServices(false)
      }
    }
    
    fetchServices()
  }, [])

  const addContact = () => {
    const newContact = {
      id: `c${Date.now()}`,
      name: "",
      position: "",
      email: "",
      phone: "",
      isPrimary: false
    }
    setContacts([...contacts, newContact])
  }

  const removeContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id))
  }

  const setPrimaryContact = (id: string) => {
    setContacts(contacts.map(c => ({ ...c, isPrimary: c.id === id })))
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/orbit-tasksflow/projects/${project.id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              Configurar Proyecto
            </h1>
            <p className="text-muted-foreground">{project.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/orbit-tasksflow/projects/${project.id}`}>
              Cancelar
            </Link>
          </Button>
          <Button onClick={handleSaveChanges} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Guardando...
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Guardado
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Servicios
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Equipo
          </TabsTrigger>
          <TabsTrigger value="client" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Cliente
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Redes Sociales
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Integraciones
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información del Proyecto</CardTitle>
              <CardDescription>Configura los datos básicos del proyecto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo Upload Section */}
              <div className="space-y-3">
                <Label>Logotipo de la Cuenta</Label>
                <div className="flex items-start gap-4">
                  <div className="relative">
                    {project.logo ? (
                      <div className="relative w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 overflow-hidden bg-muted/30">
                        <img 
                          src={project.logo} 
                          alt="Logo de la cuenta" 
                          className="w-full h-full object-contain p-2"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                        <div className="hidden w-full h-full flex items-center justify-center text-muted-foreground">
                          <Building2 className="h-8 w-8" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setProject({ ...project, logo: "" })}
                          className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/30">
                        <Building2 className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = 'image/*'
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onload = (e) => {
                                setProject({ ...project, logo: e.target?.result as string })
                              }
                              reader.readAsDataURL(file)
                            }
                          }
                          input.click()
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Subir Logo
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG o SVG. Recomendado: 200x200px
                    </p>
                    <div className="space-y-1">
                      <Label htmlFor="logoUrl" className="text-xs">O ingresa URL del logo</Label>
                      <Input 
                        id="logoUrl"
                        placeholder="https://ejemplo.com/logo.png"
                        value={project.logo || ""}
                        onChange={(e) => setProject({ ...project, logo: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Proyecto</Label>
                  <Input 
                    id="name" 
                    value={project.name}
                    onChange={(e) => setProject({ ...project, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account">Cuenta</Label>
                  <Input id="account" value={project.account} disabled className="bg-muted" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea 
                  id="description" 
                  value={project.description}
                  onChange={(e) => setProject({ ...project, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select value={project.status} onValueChange={(value) => setProject({ ...project, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="en_progreso">En Progreso</SelectItem>
                      <SelectItem value="en_revision">En Revisión</SelectItem>
                      <SelectItem value="completado">Completado</SelectItem>
                      <SelectItem value="pausado">Pausado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select value={project.priority} onValueChange={(value) => setProject({ ...project, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha de Inicio</Label>
                  <Input 
                    id="startDate" 
                    type="date" 
                    value={project.startDate}
                    onChange={(e) => setProject({ ...project, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Fecha de Entrega</Label>
                  <Input 
                    id="dueDate" 
                    type="date" 
                    value={project.dueDate}
                    onChange={(e) => setProject({ ...project, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hoursBudget">Presupuesto de Horas</Label>
                  <Input 
                    id="hoursBudget" 
                    type="number" 
                    value={project.hoursBudget}
                    onChange={(e) => setProject({ ...project, hoursBudget: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Presupuesto ($)</Label>
                  <Input 
                    id="budget" 
                    type="number" 
                    value={project.budget}
                    onChange={(e) => setProject({ ...project, budget: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

{/* Services Settings */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Servicios Contratados</CardTitle>
                <CardDescription>Selecciona los servicios dados de alta en el sistema para este proyecto</CardDescription>
              </div>
              <Button 
                size="sm"
                onClick={() => {
                  console.log("[v0] Adding new service, current count:", projectServices.length)
                  const newService: ProjectService = {
                    id: `ps-${Date.now()}`,
                    serviceId: "",
                    name: "",
                    department: "",
                    category: "General",
                    quantity: 1,
                    unit: "piezas",
                    price: 0
                  }
                  setProjectServices(prev => [...prev, newService])
                  console.log("[v0] New service added")
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Servicio
              </Button>
            </CardHeader>
            <CardContent>
              {loadingServices ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p>Cargando servicios...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projectServices.map((service, index) => {
                    const categoryIcons: Record<string, React.ReactNode> = {
                      "Diseño": <Palette className="h-5 w-5 text-purple-600" />,
                      "Social Media": <Megaphone className="h-5 w-5 text-pink-600" />,
                      "Video": <Video className="h-5 w-5 text-red-600" />,
                      "Pauta": <BarChart3 className="h-5 w-5 text-blue-600" />,
                      "Fotografía": <Image className="h-5 w-5 text-amber-600" />,
                      "General": <Package className="h-5 w-5 text-gray-600" />
                    }
                    return (
                      <div key={service.id} className="p-4 border rounded-lg bg-muted/30">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-background border shrink-0">
                            {categoryIcons[service.category] || <Package className="h-5 w-5 text-gray-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            {/* First row: Service selector and Department */}
                            <div className="grid gap-4 sm:grid-cols-2 mb-4">
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Servicio</Label>
                                <Select 
                                  value={service.serviceId}
                                  onValueChange={(value) => {
                                    const selectedService = availableServices.find(s => s.id === value)
                                    if (selectedService) {
                                      const updated = [...projectServices]
                                      updated[index] = {
                                        ...updated[index],
                                        serviceId: value,
                                        name: selectedService.name,
                                        department: selectedService.department?.name || "Sin departamento",
                                        category: selectedService.category || "General",
                                        price: selectedService.base_price,
                                        unit: selectedService.unit_type === "hour" ? "horas" : 
                                              selectedService.unit_type === "unit" ? "piezas" : 
                                              selectedService.unit_type === "month" ? "meses" : 
                                              selectedService.unit_type === "day" ? "días" : "proyectos"
                                      }
                                      setProjectServices(updated)
                                    }
                                  }}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Seleccionar servicio" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableServices.map(s => (
                                      <SelectItem key={s.id} value={s.id}>
                                        <div className="flex items-center gap-2">
                                          <span>{s.name}</span>
                                          <span className="text-xs text-muted-foreground">
                                            (${s.base_price.toLocaleString()})
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Departamento</Label>
                                <Input 
                                  value={service.department}
                                  disabled
                                  className="h-9 bg-muted/50"
                                />
                              </div>
                            </div>
                            {/* Second row: Category, Quantity, Unit, Price */}
                            <div className="grid gap-4 sm:grid-cols-4">
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Categoría</Label>
                                <Select 
                                  value={service.category}
                                  onValueChange={(value) => {
                                    const updated = [...projectServices]
                                    updated[index] = { ...updated[index], category: value }
                                    setProjectServices(updated)
                                  }}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Diseño">Diseño</SelectItem>
                                    <SelectItem value="Social Media">Social Media</SelectItem>
                                    <SelectItem value="Video">Video</SelectItem>
                                    <SelectItem value="Pauta">Pauta</SelectItem>
                                    <SelectItem value="Fotografía">Fotografía</SelectItem>
                                    <SelectItem value="Web">Web</SelectItem>
                                    <SelectItem value="Estrategia">Estrategia</SelectItem>
                                    <SelectItem value="General">General</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Cantidad</Label>
                                <Input 
                                  type="number"
                                  min="1"
                                  value={service.quantity}
                                  className="h-9"
                                  onChange={(e) => {
                                    const updated = [...projectServices]
                                    updated[index] = { ...updated[index], quantity: parseInt(e.target.value) || 1 }
                                    setProjectServices(updated)
                                  }}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Unidad</Label>
                                <Select 
                                  value={service.unit}
                                  onValueChange={(value) => {
                                    const updated = [...projectServices]
                                    updated[index] = { ...updated[index], unit: value }
                                    setProjectServices(updated)
                                  }}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="diseños">Diseños</SelectItem>
                                    <SelectItem value="posts">Posts</SelectItem>
                                    <SelectItem value="piezas">Piezas</SelectItem>
                                    <SelectItem value="videos">Videos</SelectItem>
                                    <SelectItem value="fotos">Fotos</SelectItem>
                                    <SelectItem value="horas">Horas</SelectItem>
                                    <SelectItem value="días">Días</SelectItem>
                                    <SelectItem value="meses">Meses</SelectItem>
                                    <SelectItem value="campaña">Campaña</SelectItem>
                                    <SelectItem value="proyectos">Proyectos</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Precio</Label>
                                <Input 
                                  type="number"
                                  min="0"
                                  value={service.price}
                                  className="h-9"
                                  onChange={(e) => {
                                    const updated = [...projectServices]
                                    updated[index] = { ...updated[index], price: parseInt(e.target.value) || 0 }
                                    setProjectServices(updated)
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                            onClick={() => setProjectServices(projectServices.filter(s => s.id !== service.id))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {service.quantity} {service.unit} x ${service.price.toLocaleString()}
                          </span>
                          <span className="font-semibold">
                            Total: ${(service.quantity * service.price).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )
                  })}

                  {projectServices.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No hay servicios configurados</p>
                      <p className="text-sm">Selecciona los servicios dados de alta en el sistema</p>
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              {projectServices.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{projectServices.length} servicios configurados</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total del Proyecto</p>
                      <p className="text-2xl font-bold text-primary">
                        ${projectServices.reduce((sum, s) => sum + (s.quantity * s.price), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Settings */}
        <TabsContent value="team" className="space-y-4">
          {/* Responsables */}
          <Card>
            <CardHeader>
              <CardTitle>Responsables del Proyecto</CardTitle>
              <CardDescription>Asigna el gerente y coordinador del proyecto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Gerente de Proyecto</Label>
                  <Select value={project.manager.id}>
                    <SelectTrigger>
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">{project.manager.initials}</AvatarFallback>
                          </Avatar>
                          {project.manager.name}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableStaff.map(staff => (
                        <SelectItem key={staff.id} value={staff.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">{getInitials(staff.first_name, staff.last_name)}</AvatarFallback>
                            </Avatar>
                            {staff.first_name} {staff.last_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Coordinador</Label>
                  <Select value={project.coordinator.id}>
                    <SelectTrigger>
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">{project.coordinator.initials}</AvatarFallback>
                          </Avatar>
                          {project.coordinator.name}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableStaff.map(staff => (
                        <SelectItem key={staff.id} value={staff.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">{getInitials(staff.first_name, staff.last_name)}</AvatarFallback>
                            </Avatar>
                            {staff.first_name} {staff.last_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Equipo del Proyecto */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Equipo del Proyecto</CardTitle>
                <CardDescription>Miembros asignados a este proyecto con su área y horas</CardDescription>
              </div>
              <Button size="sm" onClick={() => {
                setTeamMembers([...teamMembers, {
                  id: `tm-${Date.now()}`,
                  staffId: "",
                  name: "",
                  initials: "",
                  area: "",
                  position: "",
                  hoursAssigned: 0
                }])
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Miembro
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingStaff ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p>Cargando personal...</p>
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay miembros asignados al proyecto</p>
                  <p className="text-sm">Agrega miembros del equipo para comenzar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teamMembers.map((member, index) => (
                    <div 
                      key={member.id} 
                      className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-lg">
                            {member.initials || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          {/* First row: Persona and Área */}
                          <div className="grid gap-4 sm:grid-cols-2 mb-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Persona</Label>
                              <Select 
                                value={member.staffId} 
                                onValueChange={(value) => {
                                  const selectedStaff = availableStaff.find(s => s.id === value)
                                  if (selectedStaff) {
                                    const updated = [...teamMembers]
                                    updated[index] = {
                                      ...updated[index],
                                      staffId: value,
                                      name: `${selectedStaff.first_name} ${selectedStaff.last_name}`,
                                      initials: getInitials(selectedStaff.first_name, selectedStaff.last_name),
                                      position: selectedStaff.position,
                                      area: (selectedStaff as any).department_info?.name || selectedStaff.department || ""
                                    }
                                    setTeamMembers(updated)
                                  }
                                }}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Seleccionar persona" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableStaff.map(staff => (
                                    <SelectItem key={staff.id} value={staff.id}>
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-5 w-5 shrink-0">
                                          <AvatarFallback className="text-[10px]">{getInitials(staff.first_name, staff.last_name)}</AvatarFallback>
                                        </Avatar>
                                        <span className="truncate">{staff.first_name} {staff.last_name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Área</Label>
                              <Select 
                                value={member.area}
                                onValueChange={(value) => {
                                  const updated = [...teamMembers]
                                  updated[index] = { ...updated[index], area: value }
                                  setTeamMembers(updated)
                                }}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Seleccionar área" />
                                </SelectTrigger>
                                <SelectContent>
                                  {departments.map(dept => (
                                    <SelectItem key={dept.id} value={dept.name}>
                                      {dept.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {/* Second row: Rol and Horas */}
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Rol en Proyecto</Label>
                              <Input 
                                value={member.position}
                                onChange={(e) => {
                                  const updated = [...teamMembers]
                                  updated[index] = { ...updated[index], position: e.target.value }
                                  setTeamMembers(updated)
                                }}
                                placeholder="Ej: Diseñador Sr."
                                className="h-9"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Horas Asignadas</Label>
                              <Input 
                                type="number"
                                value={member.hoursAssigned}
                                onChange={(e) => {
                                  const updated = [...teamMembers]
                                  updated[index] = { ...updated[index], hoursAssigned: parseInt(e.target.value) || 0 }
                                  setTeamMembers(updated)
                                }}
                                placeholder="0"
                                className="h-9"
                              />
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => {
                            setTeamMembers(teamMembers.filter(m => m.id !== member.id))
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Summary */}
              {teamMembers.length > 0 && (
                <div className="pt-4 border-t flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {teamMembers.length} miembro{teamMembers.length !== 1 ? "s" : ""} en el equipo
                  </span>
                  <span className="font-medium">
                    Total: {teamMembers.reduce((sum, m) => sum + m.hoursAssigned, 0)}h asignadas
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Settings */}
        <TabsContent value="client" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Contactos del Cliente</CardTitle>
                <CardDescription>Gestiona los contactos del cliente para este proyecto</CardDescription>
              </div>
              <Button size="sm" onClick={addContact}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Contacto
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {contacts.map((contact, index) => (
                <div 
                  key={contact.id} 
                  className={`p-4 rounded-lg border ${contact.isPrimary ? 'border-primary bg-primary/5' : 'border-border'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Contacto {index + 1}</span>
                      {contact.isPrimary && (
                        <Badge variant="secondary">
                          <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                          Principal
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!contact.isPrimary && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setPrimaryContact(contact.id)}
                        >
                          <Star className="h-4 w-4 mr-1" />
                          Hacer Principal
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeContact(contact.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nombre</Label>
                      <Input 
                        value={contact.name}
                        onChange={(e) => {
                          const updated = contacts.map(c => 
                            c.id === contact.id ? { ...c, name: e.target.value } : c
                          )
                          setContacts(updated)
                        }}
                        placeholder="Nombre completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Puesto</Label>
                      <Input 
                        value={contact.position}
                        onChange={(e) => {
                          const updated = contacts.map(c => 
                            c.id === contact.id ? { ...c, position: e.target.value } : c
                          )
                          setContacts(updated)
                        }}
                        placeholder="Cargo o puesto"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          className="pl-10"
                          type="email"
                          value={contact.email}
                          onChange={(e) => {
                            const updated = contacts.map(c => 
                              c.id === contact.id ? { ...c, email: e.target.value } : c
                            )
                            setContacts(updated)
                          }}
                          placeholder="correo@empresa.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          className="pl-10"
                          value={contact.phone}
                          onChange={(e) => {
                            const updated = contacts.map(c => 
                              c.id === contact.id ? { ...c, phone: e.target.value } : c
                            )
                            setContacts(updated)
                          }}
                          placeholder="+52 55 1234 5678"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Links Settings */}
        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Redes Sociales y Página Web</CardTitle>
              <CardDescription>Configura los links de redes sociales del cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Página Web</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600" />
                    <Input 
                      className="pl-10"
                      value={socialLinks.website}
                      onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                      placeholder="https://www.ejemplo.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Facebook</Label>
                  <div className="relative">
                    <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-700" />
                    <Input 
                      className="pl-10"
                      value={socialLinks.facebook}
                      onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                      placeholder="https://facebook.com/usuario"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Instagram</Label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-600" />
                    <Input 
                      className="pl-10"
                      value={socialLinks.instagram}
                      onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                      placeholder="https://instagram.com/usuario"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Twitter / X</Label>
                  <div className="relative">
                    <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-500" />
                    <Input 
                      className="pl-10"
                      value={socialLinks.twitter}
                      onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                      placeholder="https://twitter.com/usuario"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn</Label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600" />
                    <Input 
                      className="pl-10"
                      value={socialLinks.linkedin}
                      onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/company/empresa"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>YouTube</Label>
                  <div className="relative">
                    <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-600" />
                    <Input 
                      className="pl-10"
                      value={socialLinks.youtube}
                      onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                      placeholder="https://youtube.com/canal"
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>TikTok</Label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    <Input 
                      className="pl-10"
                      value={socialLinks.tiktok}
                      onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
                      placeholder="https://tiktok.com/@usuario"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Settings */}
        <TabsContent value="integrations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="h-5 w-5" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                  </svg>
                  Google Drive
                </CardTitle>
                <CardDescription>Conecta una carpeta de Google Drive para documentos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Link de Carpeta Raíz</Label>
                  <Input 
                    value={project.driveLink}
                    onChange={(e) => setProject({ ...project, driveLink: e.target.value })}
                    placeholder="https://drive.google.com/drive/folders/..."
                  />
                </div>
                <Button variant="outline" className="w-full">
                  <Link2 className="h-4 w-4 mr-2" />
                  Conectar con Google Drive
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.316 5.684H24v12.632h-5.684V5.684z" fill="#1a73e8"/>
                    <path d="M5.684 24v-5.684h12.632V24H5.684z" fill="#1a73e8"/>
                    <path d="M18.316 5.684V0H1.895A1.895 1.895 0 0 0 0 1.895v16.421h5.684V5.684h12.632z" fill="#ea4335"/>
                    <path d="M5.684 18.316H0v3.789A1.895 1.895 0 0 0 1.895 24h3.789v-5.684z" fill="#188038"/>
                    <path d="M24 5.684h-5.684V0h3.789A1.895 1.895 0 0 1 24 1.895v3.789z" fill="#1967d2"/>
                    <path d="M18.316 18.316H24V24h-3.789a1.895 1.895 0 0 1-1.895-1.895v-3.789z" fill="#1967d2"/>
                    <path d="M5.684 5.684h12.632v12.632H5.684z" fill="#fff"/>
                    <path d="M15.789 9.474H8.211v1.263h7.578V9.474zM15.789 12h-7.578v1.263h7.578V12zM15.789 14.526H8.211v1.263h7.578v-1.263z" fill="#1a73e8"/>
                  </svg>
                  Google Calendar
                </CardTitle>
                <CardDescription>Sincroniza tareas y eventos con Google Calendar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>ID del Calendario</Label>
                  <Input 
                    value={project.calendarId}
                    onChange={(e) => setProject({ ...project, calendarId: e.target.value })}
                    placeholder="calendario@group.calendar.google.com"
                  />
                </div>
                <Button variant="outline" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Conectar con Google Calendar
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
