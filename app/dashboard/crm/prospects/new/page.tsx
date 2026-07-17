"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { ArrowLeft, Save, User, Building2, Phone, Mail, DollarSign, Calendar, Target, Plus, Trash2, Globe, Facebook, Instagram, Linkedin, Twitter, MapPin, Check, ChevronsUpDown } from "lucide-react"
import { useAgency } from "@/contexts/agency-context"

interface Stage {
  id: string
  name: string
  color: string
  sort_order: number
}

interface Source {
  id: string
  name: string
}

interface Currency {
  id: string
  code: string
  name: string
}

interface ClientType {
  id: string
  name: string
  amount: number
}

interface SalesRep {
  id: string
  first_name: string
  last_name: string
}

interface AdditionalContact {
  id: string
  contact_name: string
  contact_email: string
  contact_phone: string
  contact_position: string
}

interface Service {
  id: string
  name: string
  description: string | null
  base_price: number | null
}

interface SelectedService {
  service_id: string
  quantity: number
}

export default function NewProspectPage() {
  const router = useRouter()
  const { selectedAgencyId, selectedAgency, loading: agencyLoading } = useAgency()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [stages, setStages] = useState<Stage[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [clientTypes, setClientTypes] = useState<ClientType[]>([])
  const [salesReps, setSalesReps] = useState<SalesRep[]>([])
  const [additionalContacts, setAdditionalContacts] = useState<AdditionalContact[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([])
  const [servicesPopoverOpen, setServicesPopoverOpen] = useState(false)

  const [formData, setFormData] = useState({
    assigned_to: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    contact_position: "",
    company_name: "",
    website: "",
    social_facebook: "",
    social_instagram: "",
    social_linkedin: "",
    social_twitter: "",
    country: "",
    state_province: "",
    client_type_id: "",
    stage_id: "",
    source_id: "",
    estimated_value: "",
    currency_id: "",
    probability: 50,
    expected_close_date: "",
    description: "",
    notes: "",
  })

  const supabase = createClient()

  useEffect(() => {
    if (selectedAgencyId) {
      fetchInitialData()
    } else {
      setLoading(false)
    }
  }, [selectedAgencyId])

  const fetchInitialData = async () => {
    if (!selectedAgencyId) return
    setLoading(true)

    // Fetch sales reps for this agency only
    const { data: salesRepsData } = await supabase
      .from("staff")
      .select("id, first_name, last_name")
      .eq("agency_id", selectedAgencyId)
      .eq("is_active", true)
      .order("first_name")

    if (salesRepsData) setSalesReps(salesRepsData)

    // Fetch stages for this agency
    const { data: stagesData, error: stagesError } = await supabase
      .from("crm_pipeline_stages")
      .select("id, name, color, sort_order")
      .eq("agency_id", selectedAgencyId)
      .eq("is_active", true)
      .order("sort_order")

    console.log("[v0] Stages loaded:", stagesData, "Error:", stagesError)

    if (stagesData) {
      setStages(stagesData)
      // Set first stage as default
      if (stagesData.length > 0) {
        setFormData(prev => ({ ...prev, stage_id: stagesData[0].id }))
      }
    }

    // Fetch sources for this agency
    const { data: sourcesData, error: sourcesError } = await supabase
      .from("crm_lead_sources")
      .select("id, name")
      .eq("agency_id", selectedAgencyId)
      .eq("is_active", true)
      .order("name")

    console.log("[v0] Sources loaded:", sourcesData, "Error:", sourcesError)

    if (sourcesData) setSources(sourcesData)

    // Fetch client types for this agency (from agency_commission_types)
    const { data: clientTypesData } = await supabase
      .from("agency_commission_types")
      .select("id, name, amount")
      .eq("agency_id", selectedAgencyId)
      .eq("is_active", true)
      .order("display_order")

    if (clientTypesData) setClientTypes(clientTypesData)

    // Fetch currencies
    const { data: currenciesData } = await supabase
      .from("currencies")
      .select("id, code, name")
      .eq("is_active", true)
      .order("code")

    if (currenciesData) {
      setCurrencies(currenciesData)
      const mxn = currenciesData.find(c => c.code === "MXN")
      if (mxn) {
        setFormData(prev => ({ ...prev, currency_id: mxn.id }))
      }
    }

    // Fetch services available for this agency (Servicios de Interés)
    const { data: servicesData } = await supabase
      .from("services")
      .select("id, name, description, base_price")
      .eq("agency_id", selectedAgencyId)
      .eq("is_active", true)
      .order("name")

    if (servicesData) setServices(servicesData)

    setLoading(false)
  }

  // Servicios de Interés: helpers
  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.some(s => s.service_id === serviceId)
        ? prev.filter(s => s.service_id !== serviceId)
        : [...prev, { service_id: serviceId, quantity: 1 }]
    )
  }

  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    setSelectedServices(prev =>
      prev.map(s => (s.service_id === serviceId ? { ...s, quantity: Math.max(1, quantity) } : s))
    )
  }

  const removeSelectedService = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(s => s.service_id !== serviceId))
  }

  const estimatedValueFromServices = selectedServices.reduce((total, sel) => {
    const service = services.find(s => s.id === sel.service_id)
    return total + (service?.base_price || 0) * sel.quantity
  }, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedAgencyId) {
      toast.error("Selecciona una agencia primero")
      return
    }

    if (!formData.contact_name) {
      toast.error("El nombre del contacto es requerido")
      return
    }

    if (!formData.stage_id) {
      toast.error("Selecciona una etapa")
      return
    }

    setSaving(true)

    // Si el prospecto se crea ya con un asesor comercial, registramos la fecha
    // y hora de la asignación inicial.
    const assignmentTimestamp = new Date().toISOString()
    const hasInitialAssignment = !!formData.assigned_to

    const { data: prospect, error } = await supabase.from("crm_prospects").insert({
      agency_id: selectedAgencyId,
      assigned_to: formData.assigned_to || null,
      assigned_at: hasInitialAssignment ? assignmentTimestamp : null,
      contact_name: formData.contact_name,
      contact_email: formData.contact_email || null,
      contact_phone: formData.contact_phone || null,
      contact_position: formData.contact_position || null,
      company_name: formData.company_name || null,
      website: formData.website || null,
      social_facebook: formData.social_facebook || null,
      social_instagram: formData.social_instagram || null,
      social_linkedin: formData.social_linkedin || null,
      social_twitter: formData.social_twitter || null,
      country: formData.country || null,
      state_province: formData.state_province || null,
      client_type_id: formData.client_type_id || null,
      stage_id: formData.stage_id,
      source_id: formData.source_id || null,
      estimated_value: estimatedValueFromServices > 0 ? estimatedValueFromServices : null,
      currency_id: formData.currency_id || null,
      probability: formData.probability,
      expected_close_date: formData.expected_close_date || null,
      description: formData.description || null,
      notes: formData.notes || null,
      status: "active",
    }).select("id").single()

    if (error) {
      setSaving(false)
      toast.error("Error al crear el prospecto")
      console.error(error)
      return
    }

    // Registrar la asignación inicial del asesor en el historial.
    if (prospect && hasInitialAssignment) {
      const { data: authData } = await supabase.auth.getUser()
      await supabase.from("crm_prospect_assignments").insert({
        prospect_id: prospect.id,
        assigned_to: formData.assigned_to,
        assigned_by: authData?.user?.id ?? null,
        created_at: assignmentTimestamp,
      })
    }

    // Insert additional contacts if any
    if (prospect && additionalContacts.length > 0) {
      const contactsToInsert = additionalContacts
        .filter(c => c.contact_name.trim())
        .map(c => ({
          prospect_id: prospect.id,
          contact_name: c.contact_name,
          contact_email: c.contact_email || null,
          contact_phone: c.contact_phone || null,
          contact_position: c.contact_position || null,
        }))

      if (contactsToInsert.length > 0) {
        await supabase.from("crm_prospect_contacts").insert(contactsToInsert)
      }
    }

    // Insert selected services (Servicios de Interés)
    if (prospect && selectedServices.length > 0) {
      const servicesToInsert = selectedServices.map(sel => {
        const service = services.find(s => s.id === sel.service_id)
        const unitPrice = service?.base_price || 0
        return {
          prospect_id: prospect.id,
          service_id: sel.service_id,
          quantity: sel.quantity,
          unit_price: unitPrice,
          total_price: unitPrice * sel.quantity,
        }
      })
      await supabase.from("crm_prospect_services").insert(servicesToInsert)
    }

    setSaving(false)
    toast.success("Prospecto creado exitosamente")
    router.push("/dashboard/crm/prospects")
  }

  const addContact = () => {
    setAdditionalContacts([
      ...additionalContacts,
      { id: crypto.randomUUID(), contact_name: "", contact_email: "", contact_phone: "", contact_position: "" }
    ])
  }

  const removeContact = (id: string) => {
    setAdditionalContacts(additionalContacts.filter(c => c.id !== id))
  }

  const updateContact = (id: string, field: keyof AdditionalContact, value: string) => {
    setAdditionalContacts(additionalContacts.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ))
  }

const getStageColor = (color: string | null) => {
  // If it's a hex color (from Ajustar Pipeline), return it for inline style
  if (color && color.startsWith("#")) {
    return color
  }
  // Fallback for legacy named colors
  const colors: Record<string, string> = {
    blue: "#3b82f6",
    cyan: "#06b6d4",
    yellow: "#eab308",
    orange: "#f97316",
    purple: "#a855f7",
    green: "#22c55e",
    red: "#ef4444",
  }
  return colors[color || ""] || "#6b7280"
  }

  if (loading || agencyLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!selectedAgencyId) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Selecciona una Agencia</h2>
          <p className="text-muted-foreground max-w-md">
            Para crear un nuevo prospecto, primero selecciona una agencia en el selector de arriba.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/crm/prospects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Prospecto</h1>
          <p className="text-muted-foreground">
            Registra un nuevo prospecto para darle seguimiento - {selectedAgency?.name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sales Rep Assignment - First */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Asignacion de Asesor Comercial
            </CardTitle>
            <CardDescription>
              Selecciona el asesor que dara seguimiento a este prospecto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Asesor Comercial *</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
              >
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Selecciona un asesor" />
                </SelectTrigger>
                <SelectContent>
                  {salesReps.map((rep) => (
                    <SelectItem key={rep.id} value={rep.id}>
                      {rep.first_name} {rep.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informacion del Contacto Principal
                </CardTitle>
                <CardDescription>
                  Datos del contacto principal del prospecto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact_name">Nombre del Contacto *</Label>
                    <Input
                      id="contact_name"
                      placeholder="Juan Perez"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_position">Cargo / Puesto</Label>
                    <Input
                      id="contact_position"
                      placeholder="Director de Marketing"
                      value={formData.contact_position}
                      onChange={(e) => setFormData({ ...formData, contact_position: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="client_type_id">Tipo de Cliente</Label>
                    <Select
                      value={formData.client_type_id}
                      onValueChange={(value) => setFormData({ ...formData, client_type_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo de cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        Email
                      </div>
                    </Label>
                    <Input
                      id="contact_email"
                      type="email"
                      placeholder="juan@empresa.com"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        Teléfono
                      </div>
                    </Label>
                    <Input
                      id="contact_phone"
                      placeholder="+52 55 1234 5678"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    />
                  </div>
                </div>

                {/* Additional Contacts */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium">Contactos Adicionales</h4>
                      <p className="text-sm text-muted-foreground">Agrega otros contactos de la empresa</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addContact}>
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar Contacto
                    </Button>
                  </div>

                  {additionalContacts.length > 0 && (
                    <div className="space-y-4">
                      {additionalContacts.map((contact, index) => (
                        <div key={contact.id} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Contacto {index + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeContact(contact.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <Input
                              placeholder="Nombre del contacto"
                              value={contact.contact_name}
                              onChange={(e) => updateContact(contact.id, "contact_name", e.target.value)}
                            />
                            <Input
                              placeholder="Cargo / Puesto"
                              value={contact.contact_position}
                              onChange={(e) => updateContact(contact.id, "contact_position", e.target.value)}
                            />
                            <Input
                              type="email"
                              placeholder="Email"
                              value={contact.contact_email}
                              onChange={(e) => updateContact(contact.id, "contact_email", e.target.value)}
                            />
                            <Input
                              placeholder="Telefono"
                              value={contact.contact_phone}
                              onChange={(e) => updateContact(contact.id, "contact_phone", e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Empresa
                </CardTitle>
                <CardDescription>
                  Informacion de la empresa del prospecto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Nombre de la Empresa</Label>
                    <Input
                      id="company_name"
                      placeholder="Empresa S.A. de C.V."
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        Pagina Web
                      </div>
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://www.empresa.com"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="country">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Pais
                      </div>
                    </Label>
                    <Input
                      id="country"
                      placeholder="Mexico"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state_province">Estado / Provincia</Label>
                    <Input
                      id="state_province"
                      placeholder="Ciudad de Mexico"
                      value={formData.state_province}
                      onChange={(e) => setFormData({ ...formData, state_province: e.target.value })}
                    />
                  </div>
                </div>

                {/* Social Media */}
                <div className="border-t pt-4 mt-2">
                  <h4 className="font-medium mb-3">Redes Sociales</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="social_facebook">
                        <div className="flex items-center gap-1">
                          <Facebook className="h-4 w-4" />
                          Facebook
                        </div>
                      </Label>
                      <Input
                        id="social_facebook"
                        placeholder="https://facebook.com/empresa"
                        value={formData.social_facebook}
                        onChange={(e) => setFormData({ ...formData, social_facebook: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="social_instagram">
                        <div className="flex items-center gap-1">
                          <Instagram className="h-4 w-4" />
                          Instagram
                        </div>
                      </Label>
                      <Input
                        id="social_instagram"
                        placeholder="https://instagram.com/empresa"
                        value={formData.social_instagram}
                        onChange={(e) => setFormData({ ...formData, social_instagram: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="social_linkedin">
                        <div className="flex items-center gap-1">
                          <Linkedin className="h-4 w-4" />
                          LinkedIn
                        </div>
                      </Label>
                      <Input
                        id="social_linkedin"
                        placeholder="https://linkedin.com/company/empresa"
                        value={formData.social_linkedin}
                        onChange={(e) => setFormData({ ...formData, social_linkedin: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="social_twitter">
                        <div className="flex items-center gap-1">
                          <Twitter className="h-4 w-4" />
                          Twitter / X
                        </div>
                      </Label>
                      <Input
                        id="social_twitter"
                        placeholder="https://twitter.com/empresa"
                        value={formData.social_twitter}
                        onChange={(e) => setFormData({ ...formData, social_twitter: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripcion / Necesidad</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe la necesidad del prospecto o el proyecto potencial..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Servicios de Interés */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Servicios de Interés
                </CardTitle>
                <CardDescription>
                  Selecciona los servicios que le interesan al prospecto. El valor estimado se calcula automáticamente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay servicios cargados para esta agencia. Crea servicios en la sección de Servicios.
                  </p>
                ) : (
                  <>
                    {/* Combo box multi-selección */}
                    <Popover open={servicesPopoverOpen} onOpenChange={setServicesPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={servicesPopoverOpen}
                          className="w-full justify-between font-normal"
                        >
                          {selectedServices.length > 0
                            ? `${selectedServices.length} servicio(s) seleccionado(s)`
                            : "Seleccionar servicios..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar servicio..." />
                          <CommandList>
                            <CommandEmpty>No se encontraron servicios.</CommandEmpty>
                            <CommandGroup>
                              {services.map((service) => {
                                const isSelected = selectedServices.some(s => s.service_id === service.id)
                                return (
                                  <CommandItem
                                    key={service.id}
                                    value={service.name}
                                    onSelect={() => toggleService(service.id)}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${isSelected ? "opacity-100" : "opacity-0"}`}
                                    />
                                    <div className="flex flex-1 flex-col">
                                      <span className="text-sm">{service.name}</span>
                                      {service.base_price != null && (
                                        <span className="text-xs text-muted-foreground">
                                          ${service.base_price.toLocaleString("es-MX")} c/u
                                        </span>
                                      )}
                                    </div>
                                  </CommandItem>
                                )
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {/* Lista de servicios seleccionados con cantidad */}
                    {selectedServices.length > 0 && (
                      <div className="space-y-2">
                        {selectedServices.map((sel) => {
                          const service = services.find(s => s.id === sel.service_id)
                          if (!service) return null
                          return (
                            <div
                              key={sel.service_id}
                              className="flex items-center gap-3 rounded-lg border p-3"
                            >
                              <div className="flex-1 space-y-0.5">
                                <p className="text-sm font-medium leading-none">{service.name}</p>
                                {service.base_price != null && (
                                  <p className="text-xs text-muted-foreground">
                                    ${service.base_price.toLocaleString("es-MX")} c/u
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Label htmlFor={`qty-${service.id}`} className="sr-only">
                                  Cantidad
                                </Label>
                                <Input
                                  id={`qty-${service.id}`}
                                  type="number"
                                  min={1}
                                  value={sel.quantity}
                                  onChange={(e) => updateServiceQuantity(service.id, parseInt(e.target.value) || 1)}
                                  className="w-16 h-8"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground"
                                  onClick={() => removeSelectedService(service.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}

                {selectedServices.length > 0 && (
                  <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="services_currency" className="text-sm">Moneda</Label>
                      <Select
                        value={formData.currency_id}
                        onValueChange={(value) => setFormData({ ...formData, currency_id: value })}
                      >
                        <SelectTrigger id="services_currency" className="w-[100px] h-8">
                          <SelectValue placeholder="Moneda" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.id} value={currency.id}>
                              {currency.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Valor estimado</p>
                      <p className="text-xl font-bold">${estimatedValueFromServices.toLocaleString("es-MX")}</p>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="expected_close_date">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Fecha Estimada de Cierre
                      </div>
                    </Label>
                    <Input
                      id="expected_close_date"
                      type="date"
                      value={formData.expected_close_date}
                      onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Probabilidad de Cierre</Label>
                    <span className="text-2xl font-bold">{formData.probability}%</span>
                  </div>
                  <Slider
                    value={[formData.probability]}
                    onValueChange={(value) => setFormData({ ...formData, probability: value[0] })}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0% - Muy baja</span>
                    <span>50% - Media</span>
                    <span>100% - Seguro</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notas Adicionales</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Agrega notas o comentarios sobre este prospecto..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pipeline Stage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Etapa del Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay etapas configuradas. Configuralas en Ajustar Pipeline.
                  </p>
                ) : (
                  stages.map((stage) => {
                    const stageColor = getStageColor(stage.color)
                    return (
                      <label
                        key={stage.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          formData.stage_id === stage.id
                            ? "ring-2 ring-offset-2"
                            : "border-muted hover:border-primary/50"
                        }`}
                        style={{
                          borderColor: formData.stage_id === stage.id ? stageColor : undefined,
                          ringColor: formData.stage_id === stage.id ? stageColor : undefined,
                        }}
                      >
                        <input
                          type="radio"
                          name="stage"
                          value={stage.id}
                          checked={formData.stage_id === stage.id}
                          onChange={(e) => setFormData({ ...formData, stage_id: e.target.value })}
                          className="sr-only"
                        />
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: stageColor }}
                        />
                        <span className="font-medium">{stage.name}</span>
                      </label>
                    )
                  })
                )}
              </CardContent>
            </Card>

            {/* Source */}
            <Card>
              <CardHeader>
                <CardTitle>Fuente del Lead</CardTitle>
              </CardHeader>
              <CardContent>
                {sources.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No hay fuentes de lead configuradas. Configuralas en el Dashboard CRM.
                  </p>
                ) : (
                  <Select
                    value={formData.source_id}
                    onValueChange={(value) => setFormData({ ...formData, source_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar fuente" />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map((source) => (
                        <SelectItem key={source.id} value={source.id}>
                          {source.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-2">
                  <Button type="submit" disabled={saving} className="w-full">
                    {saving ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Crear Prospecto
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" asChild className="w-full">
                    <Link href="/dashboard/crm/prospects">
                      Cancelar
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
