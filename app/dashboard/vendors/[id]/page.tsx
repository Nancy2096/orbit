"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Truck, User, Building2, CreditCard, MapPin } from "lucide-react"
import { getCountries, getStatesByCountry, getCitiesByState } from "@/lib/locations-data"

const vendorTypes = [
  { value: "general", label: "General" },
  { value: "freelancer", label: "Freelancer" },
  { value: "contractor", label: "Contratista" },
  { value: "supplier", label: "Proveedor de Insumos" },
  { value: "service_provider", label: "Proveedor de Servicios" },
  { value: "media", label: "Medios" },
  { value: "technology", label: "Tecnología" },
  { value: "other", label: "Otro" },
]

export default function EditVendorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([])
  const [currencies, setCurrencies] = useState<{ id: string; code: string; name: string }[]>([])
  
  // Location states
  const [availableStates, setAvailableStates] = useState<string[]>([])
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const countries = getCountries()

  const [formData, setFormData] = useState({
    agency_id: "",
    name: "",
    legal_name: "",
    tax_id: "",
    vendor_type: "general",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    country: "MX",
    postal_code: "",
    payment_terms: "30",
    bank_name: "",
    bank_account: "",
    bank_clabe: "",
    currency_id: "",
    credit_limit: "",
    is_active: true,
    notes: "",
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    fetchData()
  }, [])

  async function fetchData() {
    setFetching(true)
    const [agenciesRes, currenciesRes, vendorRes] = await Promise.all([
      supabase.from("agencies").select("id, name").eq("is_active", true).order("name"),
      supabase.from("currencies").select("id, code, name").eq("is_active", true).order("code"),
      supabase.from("vendors").select("*").eq("id", id).single(),
    ])

    if (agenciesRes.data) setAgencies(agenciesRes.data)
    if (currenciesRes.data) setCurrencies(currenciesRes.data)

    if (vendorRes.data) {
      const v = vendorRes.data

      // Determine country code
      let countryCode = v.country || "MX"
      if (countryCode === "México") countryCode = "MX"
      else if (countryCode === "Estados Unidos") countryCode = "US"
      else if (countryCode === "España") countryCode = "ES"
      else if (countryCode === "Colombia") countryCode = "CO"
      else if (countryCode === "Argentina") countryCode = "AR"
      else if (countryCode === "Chile") countryCode = "CL"

      // Load location dropdowns
      const states = getStatesByCountry(countryCode)
      setAvailableStates(states)
      
      if (v.state) {
        const cities = getCitiesByState(countryCode, v.state)
        setAvailableCities(cities)
      }

      setFormData({
        agency_id: v.agency_id || "",
        name: v.name || "",
        legal_name: v.legal_name || "",
        tax_id: v.tax_id || "",
        vendor_type: v.vendor_type || "general",
        contact_name: v.contact_name || "",
        contact_email: v.contact_email || "",
        contact_phone: v.contact_phone || "",
        website: v.website || "",
        address: v.address || "",
        city: v.city || "",
        state: v.state || "",
        country: countryCode,
        postal_code: v.postal_code || "",
        payment_terms: v.payment_terms?.toString() || "30",
        bank_name: v.bank_name || "",
        bank_account: v.bank_account || "",
        bank_clabe: v.bank_clabe || "",
        currency_id: v.currency_id || "",
        credit_limit: v.credit_limit?.toString() || "",
        is_active: v.is_active ?? true,
        notes: v.notes || "",
      })
    }
    setFetching(false)
  }

  function handleCountryChange(countryCode: string) {
    setFormData({ ...formData, country: countryCode, state: "", city: "" })
    const states = getStatesByCountry(countryCode)
    setAvailableStates(states)
    setAvailableCities([])
  }

  function handleStateChange(stateName: string) {
    setFormData({ ...formData, state: stateName, city: "" })
    const cities = getCitiesByState(formData.country, stateName)
    setAvailableCities(cities)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.name) {
      setError("El nombre del proveedor es requerido")
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase
      .from("vendors")
      .update({
        agency_id: formData.agency_id || null,
        name: formData.name,
        legal_name: formData.legal_name || null,
        tax_id: formData.tax_id || null,
        vendor_type: formData.vendor_type,
        contact_name: formData.contact_name || null,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        website: formData.website || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        country: formData.country || null,
        postal_code: formData.postal_code || null,
        payment_terms: formData.payment_terms ? parseInt(formData.payment_terms) : 30,
        bank_name: formData.bank_name || null,
        bank_account: formData.bank_account || null,
        bank_clabe: formData.bank_clabe || null,
        currency_id: formData.currency_id || null,
        credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : null,
        is_active: formData.is_active,
        notes: formData.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.push("/dashboard/vendors")
  }

  if (!mounted || fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/vendors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Proveedor</h1>
          <p className="text-muted-foreground">{formData.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Información General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Información General
            </CardTitle>
            <CardDescription>Datos básicos del proveedor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="name">Nombre del Proveedor *</FieldLabel>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nombre comercial"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="agency_id">Agencia</FieldLabel>
                  <Select
                    value={formData.agency_id}
                    onValueChange={(value) => setFormData({ ...formData, agency_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una agencia (opcional)" />
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="legal_name">Razón Social</FieldLabel>
                  <Input
                    id="legal_name"
                    value={formData.legal_name}
                    onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                    placeholder="Razón social completa"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="tax_id">RFC</FieldLabel>
                  <Input
                    id="tax_id"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value.toUpperCase() })}
                    placeholder="RFC del proveedor"
                    maxLength={13}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="vendor_type">Tipo de Proveedor</FieldLabel>
                  <Select
                    value={formData.vendor_type}
                    onValueChange={(value) => setFormData({ ...formData, vendor_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vendorTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="website">Sitio Web</FieldLabel>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.ejemplo.com"
                  />
                </Field>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Proveedor Activo</p>
                  <p className="text-sm text-muted-foreground">
                    El proveedor estará disponible para asignar a gastos
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información de Contacto
            </CardTitle>
            <CardDescription>Datos del contacto principal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup>
              <div className="grid grid-cols-3 gap-4">
                <Field>
                  <FieldLabel htmlFor="contact_name">Nombre del Contacto</FieldLabel>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="Nombre completo"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="contact_email">Email</FieldLabel>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="correo@ejemplo.com"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="contact_phone">Teléfono</FieldLabel>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="+52 55 1234 5678"
                  />
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Dirección */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Dirección
            </CardTitle>
            <CardDescription>Ubicación del proveedor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="address">Dirección</FieldLabel>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Calle, número, colonia..."
                  rows={2}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="country">País</FieldLabel>
                  <Select value={formData.country} onValueChange={handleCountryChange}>
                    <SelectTrigger>
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
                    <SelectTrigger>
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
                    onValueChange={(value) => setFormData({ ...formData, city: value })}
                    disabled={!formData.state}
                  >
                    <SelectTrigger>
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
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="00000"
                    maxLength={10}
                  />
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Información Bancaria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Información Bancaria y Pagos
            </CardTitle>
            <CardDescription>Datos para pagos al proveedor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup>
              <div className="grid grid-cols-3 gap-4">
                <Field>
                  <FieldLabel htmlFor="bank_name">Banco</FieldLabel>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    placeholder="Nombre del banco"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="bank_account">Número de Cuenta</FieldLabel>
                  <Input
                    id="bank_account"
                    value={formData.bank_account}
                    onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                    placeholder="Número de cuenta"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="bank_clabe">CLABE</FieldLabel>
                  <Input
                    id="bank_clabe"
                    value={formData.bank_clabe}
                    onChange={(e) => setFormData({ ...formData, bank_clabe: e.target.value })}
                    placeholder="CLABE interbancaria"
                    maxLength={18}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Field>
                  <FieldLabel htmlFor="currency_id">Moneda Preferida</FieldLabel>
                  <Select
                    value={formData.currency_id}
                    onValueChange={(value) => setFormData({ ...formData, currency_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.id} value={currency.id}>
                          {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="payment_terms">Términos de Pago (días)</FieldLabel>
                  <Input
                    id="payment_terms"
                    type="number"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    placeholder="30"
                    min="0"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="credit_limit">Límite de Crédito</FieldLabel>
                  <Input
                    id="credit_limit"
                    type="number"
                    value={formData.credit_limit}
                    onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Notas */}
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <Field>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales sobre el proveedor..."
                rows={3}
              />
            </Field>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/vendors">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Spinner className="mr-2 h-4 w-4" />}
            Guardar Cambios
          </Button>
        </div>
      </form>
    </div>
  )
}
