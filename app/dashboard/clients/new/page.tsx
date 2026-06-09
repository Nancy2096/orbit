"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Building2, User, CreditCard, Plus, Trash2, Instagram, Facebook, Linkedin, Globe } from "lucide-react"
import { getCountries, getStatesByCountry, getCitiesByState, getPostalCodesByCity } from "@/lib/locations-data"

// Opciones de Régimen Fiscal México
const TAX_REGIMES = [
  { value: "601", label: "601 - General de Ley Personas Morales" },
  { value: "603", label: "603 - Personas Morales con Fines no Lucrativos" },
  { value: "605", label: "605 - Sueldos y Salarios e Ingresos Asimilados a Salarios" },
  { value: "606", label: "606 - Arrendamiento" },
  { value: "607", label: "607 - Régimen de Enajenación o Adquisición de Bienes" },
  { value: "608", label: "608 - Demás ingresos" },
  { value: "610", label: "610 - Residentes en el Extranjero sin Establecimiento Permanente en México" },
  { value: "611", label: "611 - Ingresos por Dividendos (socios y accionistas)" },
  { value: "612", label: "612 - Personas Físicas con Actividades Empresariales y Profesionales" },
  { value: "614", label: "614 - Ingresos por intereses" },
  { value: "615", label: "615 - Régimen de los ingresos por obtención de premios" },
  { value: "616", label: "616 - Sin obligaciones fiscales" },
  { value: "620", label: "620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos" },
  { value: "621", label: "621 - Incorporación Fiscal" },
  { value: "622", label: "622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras" },
  { value: "623", label: "623 - Opcional para Grupos de Sociedades" },
  { value: "624", label: "624 - Coordinados" },
  { value: "625", label: "625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas" },
  { value: "626", label: "626 - Régimen Simplificado de Confianza" },
]

// Opciones de Uso de CFDI
const CFDI_USES = [
  { value: "G01", label: "G01 - Adquisición de mercancías" },
  { value: "G02", label: "G02 - Devoluciones, descuentos o bonificaciones" },
  { value: "G03", label: "G03 - Gastos en general" },
  { value: "I01", label: "I01 - Construcciones" },
  { value: "I02", label: "I02 - Mobiliario y equipo de oficina por inversiones" },
  { value: "I03", label: "I03 - Equipo de transporte" },
  { value: "I04", label: "I04 - Equipo de cómputo y accesorios" },
  { value: "I05", label: "I05 - Dados, troqueles, moldes, matrices y herramental" },
  { value: "I06", label: "I06 - Comunicaciones telefónicas" },
  { value: "I07", label: "I07 - Comunicaciones satelitales" },
  { value: "I08", label: "I08 - Otra maquinaria y equipo" },
  { value: "D01", label: "D01 - Honorarios médicos, dentales y gastos hospitalarios" },
  { value: "D02", label: "D02 - Gastos médicos por incapacidad o discapacidad" },
  { value: "D03", label: "D03 - Gastos funerales" },
  { value: "D04", label: "D04 - Donativos" },
  { value: "D05", label: "D05 - Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación)" },
  { value: "D06", label: "D06 - Aportaciones voluntarias al SAR" },
  { value: "D07", label: "D07 - Primas por seguros de gastos médicos" },
  { value: "D08", label: "D08 - Gastos de transportación escolar obligatoria" },
  { value: "D09", label: "D09 - Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones" },
  { value: "D10", label: "D10 - Pagos por servicios educativos (colegiaturas)" },
  { value: "S01", label: "S01 - Sin efectos fiscales" },
  { value: "CP01", label: "CP01 - Pagos" },
  { value: "CN01", label: "CN01 - Nómina" },
]

interface Contact {
  id?: string
  name: string
  position: string
  email: string
  phone: string
  mobile: string
  is_primary: boolean
  is_billing_contact: boolean
  notes: string
}

export default function NewClientPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([])
  const [industries, setIndustries] = useState<{ id: string; name: string }[]>([])
  const [referralSources, setReferralSources] = useState<{ id: string; name: string }[]>([])
  
  // Location states
  const [availableStates, setAvailableStates] = useState<string[]>([])
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [availablePostalCodes, setAvailablePostalCodes] = useState<string[]>([])
  const countries = getCountries()

  const [formData, setFormData] = useState({
    agency_id: "",
    company_name: "",
    legal_name: "",
    tax_id: "",
    industry_id: "",
    website: "",
    // Dirección detallada
    street: "",
    exterior_number: "",
    interior_number: "",
    neighborhood: "",
    between_streets: "",
    address_references: "",
    city: "",
    state: "",
    country: "MX",
    postal_code: "",
    // Redes sociales
    instagram: "",
    facebook: "",
    tiktok: "",
    linkedin: "",
    // Datos fiscales
    tax_regime: "",
    cfdi_use: "",
    // Contacto principal
    primary_contact_name: "",
    primary_contact_position: "",
    primary_contact_email: "",
    primary_contact_phone: "",
    // Facturación
    billing_email: "",
    payment_terms: "30",
    credit_limit: "",
    status: "active",
    referral_source_id: "",
    notes: "",
  })
  const [additionalContacts, setAdditionalContacts] = useState<Contact[]>([])
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [contactForm, setContactForm] = useState<Contact>({
    name: "",
    position: "",
    email: "",
    phone: "",
    mobile: "",
    is_primary: false,
    is_billing_contact: false,
    notes: "",
  })
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    fetchAgencies()
    // Load states for default country (México)
    const states = getStatesByCountry("MX")
    setAvailableStates(states)
  }, [])

  async function fetchAgencies() {
    const { data } = await supabase
      .from("agencies")
      .select("id, name")
      .eq("is_active", true)
      .order("name")
    if (data) setAgencies(data)
  }

  async function fetchCatalogs(agencyId: string) {
    const [industriesRes, sourcesRes] = await Promise.all([
      supabase.from("industries").select("id, name").eq("agency_id", agencyId).eq("is_active", true).order("name"),
      supabase.from("referral_sources").select("id, name").eq("agency_id", agencyId).eq("is_active", true).order("name"),
    ])
    if (industriesRes.data) setIndustries(industriesRes.data)
    if (sourcesRes.data) setReferralSources(sourcesRes.data)
  }

  function handleAgencyChange(agencyId: string) {
    setFormData({ ...formData, agency_id: agencyId, industry_id: "", referral_source_id: "" })
    setIndustries([])
    setReferralSources([])
    if (agencyId) {
      fetchCatalogs(agencyId)
    }
  }

  function handleCountryChange(countryCode: string) {
    setFormData({ ...formData, country: countryCode, state: "", city: "", postal_code: "" })
    const states = getStatesByCountry(countryCode)
    setAvailableStates(states)
    setAvailableCities([])
    setAvailablePostalCodes([])
  }

  function handleStateChange(stateName: string) {
    setFormData({ ...formData, state: stateName, city: "", postal_code: "" })
    const cities = getCitiesByState(formData.country, stateName)
    setAvailableCities(cities)
    setAvailablePostalCodes([])
  }

  function handleCityChange(cityName: string) {
    setFormData({ ...formData, city: cityName, postal_code: "" })
    const postalCodes = getPostalCodesByCity(formData.country, formData.state, cityName)
    setAvailablePostalCodes(postalCodes)
  }

  function openAddContact() {
    setEditingContact(null)
    setContactForm({
      name: "",
      position: "",
      email: "",
      phone: "",
      mobile: "",
      is_primary: false,
      is_billing_contact: false,
      notes: "",
    })
    setContactDialogOpen(true)
  }

  function openEditContact(contact: Contact, index: number) {
    setEditingContact({ ...contact, id: index.toString() })
    setContactForm(contact)
    setContactDialogOpen(true)
  }

  function saveContact() {
    if (!contactForm.name.trim()) return

    if (editingContact) {
      const index = parseInt(editingContact.id || "0")
      const updated = [...additionalContacts]
      updated[index] = contactForm
      setAdditionalContacts(updated)
    } else {
      setAdditionalContacts([...additionalContacts, contactForm])
    }
    setContactDialogOpen(false)
  }

  function deleteContact(index: number) {
    setAdditionalContacts(additionalContacts.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!formData.agency_id) {
      setError("Debes seleccionar una agencia")
      return
    }

    setLoading(true)

    // Crear cliente
    const { data: client, error: insertError } = await supabase.from("clients").insert({
      agency_id: formData.agency_id,
      company_name: formData.company_name,
      legal_name: formData.legal_name || null,
      tax_id: formData.tax_id || null,
      industry_id: formData.industry_id || null,
      referral_source_id: formData.referral_source_id || null,
      website: formData.website || null,
      street: formData.street || null,
      exterior_number: formData.exterior_number || null,
      interior_number: formData.interior_number || null,
      neighborhood: formData.neighborhood || null,
      between_streets: formData.between_streets || null,
      address_references: formData.address_references || null,
      city: formData.city || null,
      state: formData.state || null,
      country: formData.country || null,
      postal_code: formData.postal_code || null,
      instagram: formData.instagram || null,
      facebook: formData.facebook || null,
      tiktok: formData.tiktok || null,
      linkedin: formData.linkedin || null,
      tax_regime: formData.tax_regime || null,
      cfdi_use: formData.cfdi_use || null,
      primary_contact_name: formData.primary_contact_name || null,
      primary_contact_position: formData.primary_contact_position || null,
      primary_contact_email: formData.primary_contact_email || null,
      primary_contact_phone: formData.primary_contact_phone || null,
      billing_email: formData.billing_email || null,
      payment_terms: parseInt(formData.payment_terms) || 30,
      credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : null,
      status: formData.status,
      notes: formData.notes || null,
    }).select().single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Crear contactos adicionales
    if (additionalContacts.length > 0 && client) {
      const contactsToInsert = additionalContacts.map(contact => ({
        client_id: client.id,
        name: contact.name,
        position: contact.position || null,
        email: contact.email || null,
        phone: contact.phone || null,
        mobile: contact.mobile || null,
        is_primary: contact.is_primary,
        is_billing_contact: contact.is_billing_contact,
        notes: contact.notes || null,
      }))

      const { error: contactsError } = await supabase.from("client_contacts").insert(contactsToInsert)
      if (contactsError) {
        console.error("Error creating contacts:", contactsError)
      }
    }

    router.push("/dashboard/clients")
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/clients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nuevo Cliente</h1>
          <p className="text-muted-foreground">Registra un nuevo cliente en el sistema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Información de la empresa */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Información de la Empresa
              </CardTitle>
              <CardDescription>Datos básicos del cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="agency_id">Agencia *</FieldLabel>
                  <Select
                    value={formData.agency_id}
                    onValueChange={handleAgencyChange}
                  >
                    <SelectTrigger id="agency_id">
                      <SelectValue placeholder="Selecciona una agencia" />
                    </SelectTrigger>
                    <SelectContent>
                      {agencies.map((agency) => (
                        <SelectItem key={agency.id} value={agency.id}>
                          {agency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="company_name">Nombre comercial *</FieldLabel>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="legal_name">Razón social</FieldLabel>
                    <Input
                      id="legal_name"
                      value={formData.legal_name}
                      onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="industry_id">Industria</FieldLabel>
                    <Select
                      value={formData.industry_id}
                      onValueChange={(value) => setFormData({ ...formData, industry_id: value })}
                      disabled={!formData.agency_id}
                    >
                      <SelectTrigger id="industry_id">
                        <SelectValue placeholder={formData.agency_id ? "Selecciona industria" : "Selecciona agencia primero"} />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((ind) => (
                          <SelectItem key={ind.id} value={ind.id}>
                            {ind.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="website">Sitio web</FieldLabel>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="referral_source_id">Fuente / Referencia</FieldLabel>
                    <Select
                      value={formData.referral_source_id}
                      onValueChange={(value) => setFormData({ ...formData, referral_source_id: value })}
                      disabled={!formData.agency_id}
                    >
                      <SelectTrigger id="referral_source_id">
                        <SelectValue placeholder={formData.agency_id ? "Selecciona fuente" : "Selecciona agencia primero"} />
                      </SelectTrigger>
                      <SelectContent>
                        {referralSources.map((src) => (
                          <SelectItem key={src.id} value={src.id}>
                            {src.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="status">Estado</FieldLabel>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prospect">Prospecto</SelectItem>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                        <SelectItem value="suspended">Suspendido</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                {/* Redes Sociales */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Redes Sociales</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="instagram" className="flex items-center gap-2">
                        <Instagram className="h-4 w-4" />
                        Instagram
                      </FieldLabel>
                      <Input
                        id="instagram"
                        value={formData.instagram}
                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                        placeholder="@usuario"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="facebook" className="flex items-center gap-2">
                        <Facebook className="h-4 w-4" />
                        Facebook
                      </FieldLabel>
                      <Input
                        id="facebook"
                        value={formData.facebook}
                        onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                        placeholder="URL o nombre de página"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="tiktok" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        TikTok
                      </FieldLabel>
                      <Input
                        id="tiktok"
                        value={formData.tiktok}
                        onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                        placeholder="@usuario"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="linkedin" className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </FieldLabel>
                      <Input
                        id="linkedin"
                        value={formData.linkedin}
                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                        placeholder="URL del perfil de empresa"
                      />
                    </Field>
                  </div>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Datos Fiscales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Datos Fiscales
              </CardTitle>
              <CardDescription>Información fiscal para facturación</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="tax_id">RFC</FieldLabel>
                    <Input
                      id="tax_id"
                      value={formData.tax_id}
                      onChange={(e) => setFormData({ ...formData, tax_id: e.target.value.toUpperCase() })}
                      placeholder="XAXX010101000"
                      maxLength={13}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="tax_regime">Régimen Fiscal</FieldLabel>
                    <Select
                      value={formData.tax_regime}
                      onValueChange={(value) => setFormData({ ...formData, tax_regime: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona régimen fiscal" />
                      </SelectTrigger>
                      <SelectContent>
                        {TAX_REGIMES.map(regime => (
                          <SelectItem key={regime.value} value={regime.value}>
                            {regime.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="cfdi_use">Uso de CFDI</FieldLabel>
                  <Select
                    value={formData.cfdi_use}
                    onValueChange={(value) => setFormData({ ...formData, cfdi_use: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona uso de CFDI" />
                    </SelectTrigger>
                    <SelectContent>
                      {CFDI_USES.map(use => (
                        <SelectItem key={use.value} value={use.value}>
                          {use.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Dirección */}
          <Card>
            <CardHeader>
              <CardTitle>Dirección Fiscal</CardTitle>
              <CardDescription>Domicilio fiscal del cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                {/* Ubicación geográfica - de lo general a lo particular */}
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="country">País</FieldLabel>
                    <Select
                      value={formData.country}
                      onValueChange={handleCountryChange}
                    >
                      <SelectTrigger id="country">
                        <SelectValue placeholder="Selecciona país" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="state">Estado / Provincia</FieldLabel>
                    <Select
                      value={formData.state}
                      onValueChange={handleStateChange}
                      disabled={!formData.country}
                    >
                      <SelectTrigger id="state">
                        <SelectValue placeholder={formData.country ? "Selecciona estado" : "Selecciona país primero"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStates.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="city">Ciudad</FieldLabel>
                    <Select
                      value={formData.city}
                      onValueChange={handleCityChange}
                      disabled={!formData.state}
                    >
                      <SelectTrigger id="city">
                        <SelectValue placeholder={formData.state ? "Selecciona ciudad" : "Selecciona estado primero"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="postal_code">Código Postal</FieldLabel>
                    <Select
                      value={formData.postal_code}
                      onValueChange={(value) => setFormData({ ...formData, postal_code: value })}
                      disabled={!formData.city}
                    >
                      <SelectTrigger id="postal_code">
                        <SelectValue placeholder={formData.city ? "Selecciona C.P." : "Selecciona ciudad primero"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePostalCodes.map((cp) => (
                          <SelectItem key={cp} value={cp}>
                            {cp}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                {/* Dirección específica */}
                <Field>
                  <FieldLabel htmlFor="street">Calle</FieldLabel>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    placeholder="Nombre de la calle"
                  />
                </Field>

                <div className="grid grid-cols-3 gap-4">
                  <Field>
                    <FieldLabel htmlFor="exterior_number">Número Exterior</FieldLabel>
                    <Input
                      id="exterior_number"
                      value={formData.exterior_number}
                      onChange={(e) => setFormData({ ...formData, exterior_number: e.target.value })}
                      placeholder="Ej: 123"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="interior_number">Número Interior</FieldLabel>
                    <Input
                      id="interior_number"
                      value={formData.interior_number}
                      onChange={(e) => setFormData({ ...formData, interior_number: e.target.value })}
                      placeholder="Ej: A, 2B, 301"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="neighborhood">Colonia</FieldLabel>
                    <Input
                      id="neighborhood"
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                      placeholder="Nombre de la colonia"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="between_streets">Entre Calles</FieldLabel>
                  <Input
                    id="between_streets"
                    value={formData.between_streets}
                    onChange={(e) => setFormData({ ...formData, between_streets: e.target.value })}
                    placeholder="Ej: Entre Calle A y Calle B"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="address_references">Referencias</FieldLabel>
                  <Textarea
                    id="address_references"
                    value={formData.address_references}
                    onChange={(e) => setFormData({ ...formData, address_references: e.target.value })}
                    rows={2}
                    placeholder="Ej: Edificio azul, frente al parque, junto a la farmacia"
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Contacto principal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contacto Principal
              </CardTitle>
              <CardDescription>Persona de contacto principal del cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="primary_contact_name">Nombre completo</FieldLabel>
                    <Input
                      id="primary_contact_name"
                      value={formData.primary_contact_name}
                      onChange={(e) => setFormData({ ...formData, primary_contact_name: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="primary_contact_position">Puesto</FieldLabel>
                    <Input
                      id="primary_contact_position"
                      value={formData.primary_contact_position}
                      onChange={(e) => setFormData({ ...formData, primary_contact_position: e.target.value })}
                      placeholder="Ej: Director de Marketing"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="primary_contact_email">Correo electrónico</FieldLabel>
                    <Input
                      id="primary_contact_email"
                      type="email"
                      value={formData.primary_contact_email}
                      onChange={(e) => setFormData({ ...formData, primary_contact_email: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="primary_contact_phone">Teléfono</FieldLabel>
                    <Input
                      id="primary_contact_phone"
                      value={formData.primary_contact_phone}
                      onChange={(e) => setFormData({ ...formData, primary_contact_phone: e.target.value })}
                    />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Contactos adicionales */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Contactos Adicionales</CardTitle>
                  <CardDescription>Otros contactos relacionados con el cliente</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={openAddContact}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Contacto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {additionalContacts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No hay contactos adicionales
                </p>
              ) : (
                <div className="space-y-3">
                  {additionalContacts.map((contact, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{contact.name}</span>
                          {contact.position && (
                            <span className="text-sm text-muted-foreground">- {contact.position}</span>
                          )}
                          {contact.is_primary && <Badge variant="secondary">Principal</Badge>}
                          {contact.is_billing_contact && <Badge variant="outline">Facturación</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {contact.email && <span>{contact.email}</span>}
                          {contact.email && contact.phone && <span> | </span>}
                          {contact.phone && <span>{contact.phone}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => openEditContact(contact, index)}>
                          Editar
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => deleteContact(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información de facturación */}
          <Card>
            <CardHeader>
              <CardTitle>Condiciones de Pago</CardTitle>
              <CardDescription>Términos de facturación y crédito</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="billing_email">Correo de facturación</FieldLabel>
                  <Input
                    id="billing_email"
                    type="email"
                    value={formData.billing_email}
                    onChange={(e) => setFormData({ ...formData, billing_email: e.target.value })}
                    placeholder="facturacion@empresa.com"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="payment_terms">Términos de pago</FieldLabel>
                    <Select
                      value={formData.payment_terms}
                      onValueChange={(value) => setFormData({ ...formData, payment_terms: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Contado</SelectItem>
                        <SelectItem value="15">15 días</SelectItem>
                        <SelectItem value="30">30 días</SelectItem>
                        <SelectItem value="45">45 días</SelectItem>
                        <SelectItem value="60">60 días</SelectItem>
                        <SelectItem value="90">90 días</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="credit_limit">Límite de crédito (MXN)</FieldLabel>
                    <Input
                      id="credit_limit"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.credit_limit}
                      onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                      placeholder="Sin límite"
                    />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Notas */}
          <Card>
            <CardHeader>
              <CardTitle>Notas Adicionales</CardTitle>
            </CardHeader>
            <CardContent>
              <Field>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas adicionales sobre el cliente..."
                  rows={4}
                />
              </Field>
            </CardContent>
          </Card>

          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/clients">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="mr-2" />
                  Guardando...
                </>
              ) : (
                "Guardar Cliente"
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Dialog para agregar/editar contacto */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingContact ? "Editar Contacto" : "Agregar Contacto"}</DialogTitle>
            <DialogDescription>
              Información del contacto adicional
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="contact_name">Nombre *</FieldLabel>
                <Input
                  id="contact_name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="contact_position">Puesto</FieldLabel>
                <Input
                  id="contact_position"
                  value={contactForm.position}
                  onChange={(e) => setContactForm({ ...contactForm, position: e.target.value })}
                  placeholder="Ej: Gerente de Compras"
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="contact_email">Correo electrónico</FieldLabel>
              <Input
                id="contact_email"
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="contact_phone">Teléfono</FieldLabel>
                <Input
                  id="contact_phone"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="contact_mobile">Celular</FieldLabel>
                <Input
                  id="contact_mobile"
                  value={contactForm.mobile}
                  onChange={(e) => setContactForm({ ...contactForm, mobile: e.target.value })}
                />
              </Field>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_primary"
                  checked={contactForm.is_primary}
                  onCheckedChange={(checked) => setContactForm({ ...contactForm, is_primary: !!checked })}
                />
                <label htmlFor="is_primary" className="text-sm">Contacto principal</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_billing"
                  checked={contactForm.is_billing_contact}
                  onCheckedChange={(checked) => setContactForm({ ...contactForm, is_billing_contact: !!checked })}
                />
                <label htmlFor="is_billing" className="text-sm">Contacto de facturación</label>
              </div>
            </div>
            <Field>
              <FieldLabel htmlFor="contact_notes">Notas</FieldLabel>
              <Textarea
                id="contact_notes"
                value={contactForm.notes || ""}
                onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                rows={2}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setContactDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={saveContact} disabled={!contactForm.name.trim()}>
              {editingContact ? "Guardar Cambios" : "Agregar Contacto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
