"use client"

import { useState, useEffect, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Plus, Pencil, Factory, Megaphone, Gift, Trash2 } from "lucide-react"
import Link from "next/link"
import {
  MONTH_OPTIONS,
  LIMIT_PERIOD_OPTIONS,
  describeAvailableMonths,
  describeLimit,
} from "@/lib/bonus-availability"

const supabase = createClient()

interface Industry {
  id: string
  name: string
  description: string | null
  is_active: boolean
}

interface ReferralSource {
  id: string
  name: string
  description: string | null
  source_type: string
  is_active: boolean
}

interface BonusType {
  id: string
  name: string
  description: string | null
  benefit_type: string
  benefit_value: number
  is_active: boolean
  available_months: number[]
  limit_period: string
  limit_count: number
}

const benefitTypeLabels: Record<string, string> = {
  money: "Dinero (monto fijo)",
  salary_days: "Días de sueldo",
  free_days: "Días libres",
}

const sourceTypeLabels: Record<string, string> = {
  advertising: "Publicidad",
  referral: "Referido",
  social_media: "Redes Sociales",
  event: "Evento",
  cold_call: "Llamada en Frío",
  website: "Sitio Web",
  other: "Otro",
}

export default function AgencyCatalogsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [agency, setAgency] = useState<{ id: string; name: string } | null>(null)
  const [industries, setIndustries] = useState<Industry[]>([])
  const [referralSources, setReferralSources] = useState<ReferralSource[]>([])
  const [bonusTypes, setBonusTypes] = useState<BonusType[]>([])
  const [loading, setLoading] = useState(true)

  // Industry dialog state
  const [industryDialogOpen, setIndustryDialogOpen] = useState(false)
  const [editingIndustry, setEditingIndustry] = useState<Industry | null>(null)
  const [industryForm, setIndustryForm] = useState({ name: "", description: "", is_active: true })
  const [savingIndustry, setSavingIndustry] = useState(false)

  // Referral source dialog state
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false)
  const [editingSource, setEditingSource] = useState<ReferralSource | null>(null)
  const [sourceForm, setSourceForm] = useState({ name: "", description: "", source_type: "other", is_active: true })
  const [savingSource, setSavingSource] = useState(false)

  // Bonus type dialog state
  const [bonusDialogOpen, setBonusDialogOpen] = useState(false)
  const [editingBonus, setEditingBonus] = useState<BonusType | null>(null)
  const [bonusForm, setBonusForm] = useState({
    name: "",
    description: "",
    benefit_type: "money",
    benefit_value: "",
    is_active: true,
    available_months: [] as number[],
    limit_period: "none",
    limit_count: "1",
  })
  const [savingBonus, setSavingBonus] = useState(false)

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    setLoading(true)

    const [agencyRes, industriesRes, sourcesRes, bonusTypesRes] = await Promise.all([
      supabase.from("agencies").select("id, name").eq("id", id).single(),
      supabase.from("industries").select("*").eq("agency_id", id).order("name"),
      supabase.from("referral_sources").select("*").eq("agency_id", id).order("name"),
      supabase.from("bonus_types").select("*").eq("agency_id", id).order("name"),
    ])

    if (agencyRes.data) setAgency(agencyRes.data)
    if (industriesRes.data) setIndustries(industriesRes.data)
    if (sourcesRes.data) setReferralSources(sourcesRes.data)
    if (bonusTypesRes.data) setBonusTypes(bonusTypesRes.data)

    setLoading(false)
  }

  // Industry handlers
  function openNewIndustry() {
    setEditingIndustry(null)
    setIndustryForm({ name: "", description: "", is_active: true })
    setIndustryDialogOpen(true)
  }

  function openEditIndustry(industry: Industry) {
    setEditingIndustry(industry)
    setIndustryForm({
      name: industry.name,
      description: industry.description || "",
      is_active: industry.is_active,
    })
    setIndustryDialogOpen(true)
  }

  async function saveIndustry() {
    if (!industryForm.name.trim()) return
    setSavingIndustry(true)

    if (editingIndustry) {
      await supabase
        .from("industries")
        .update({
          name: industryForm.name,
          description: industryForm.description || null,
          is_active: industryForm.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingIndustry.id)
    } else {
      await supabase.from("industries").insert({
        agency_id: id,
        name: industryForm.name,
        description: industryForm.description || null,
        is_active: industryForm.is_active,
      })
    }

    setSavingIndustry(false)
    setIndustryDialogOpen(false)
    fetchData()
  }

  // Referral source handlers
  function openNewSource() {
    setEditingSource(null)
    setSourceForm({ name: "", description: "", source_type: "other", is_active: true })
    setSourceDialogOpen(true)
  }

  function openEditSource(source: ReferralSource) {
    setEditingSource(source)
    setSourceForm({
      name: source.name,
      description: source.description || "",
      source_type: source.source_type,
      is_active: source.is_active,
    })
    setSourceDialogOpen(true)
  }

  async function saveSource() {
    if (!sourceForm.name.trim()) return
    setSavingSource(true)

    if (editingSource) {
      await supabase
        .from("referral_sources")
        .update({
          name: sourceForm.name,
          description: sourceForm.description || null,
          source_type: sourceForm.source_type,
          is_active: sourceForm.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingSource.id)
    } else {
      await supabase.from("referral_sources").insert({
        agency_id: id,
        name: sourceForm.name,
        description: sourceForm.description || null,
        source_type: sourceForm.source_type,
        is_active: sourceForm.is_active,
      })
    }

    setSavingSource(false)
    setSourceDialogOpen(false)
    fetchData()
  }

  // Bonus type handlers
  function openNewBonus() {
    setEditingBonus(null)
    setBonusForm({
      name: "",
      description: "",
      benefit_type: "money",
      benefit_value: "",
      is_active: true,
      available_months: [],
      limit_period: "none",
      limit_count: "1",
    })
    setBonusDialogOpen(true)
  }

  function openEditBonus(bonus: BonusType) {
    setEditingBonus(bonus)
    setBonusForm({
      name: bonus.name,
      description: bonus.description || "",
      benefit_type: bonus.benefit_type || "money",
      benefit_value: bonus.benefit_value != null ? String(bonus.benefit_value) : "",
      is_active: bonus.is_active,
      available_months: bonus.available_months || [],
      limit_period: bonus.limit_period || "none",
      limit_count: bonus.limit_count != null ? String(bonus.limit_count) : "1",
    })
    setBonusDialogOpen(true)
  }

  function toggleBonusMonth(month: number) {
    setBonusForm((prev) => ({
      ...prev,
      available_months: prev.available_months.includes(month)
        ? prev.available_months.filter((m) => m !== month)
        : [...prev.available_months, month].sort((a, b) => a - b),
    }))
  }

  async function saveBonus() {
    if (!bonusForm.name.trim()) return
    setSavingBonus(true)

    const payload = {
      name: bonusForm.name,
      description: bonusForm.description || null,
      benefit_type: bonusForm.benefit_type,
      benefit_value: Number.parseFloat(bonusForm.benefit_value) || 0,
      is_active: bonusForm.is_active,
      available_months: bonusForm.available_months,
      limit_period: bonusForm.limit_period,
      limit_count: bonusForm.limit_period === "none" ? 0 : Math.max(1, Number.parseInt(bonusForm.limit_count) || 1),
    }

    if (editingBonus) {
      await supabase
        .from("bonus_types")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editingBonus.id)
    } else {
      await supabase.from("bonus_types").insert({ agency_id: id, ...payload })
    }

    setSavingBonus(false)
    setBonusDialogOpen(false)
    fetchData()
  }

  async function deleteBonus(bonus: BonusType) {
    if (!confirm(`¿Eliminar el tipo de bono "${bonus.name}"? Esta acción no se puede deshacer.`)) return
    const { error } = await supabase.from("bonus_types").delete().eq("id", bonus.id)
    if (error) {
      alert("No se pudo eliminar el tipo de bono.")
      return
    }
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/agencies/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Catálogos de {agency?.name}</h1>
          <p className="text-muted-foreground">Administra los tipos de cliente, fuentes de referencia y tipos de bono</p>
        </div>
      </div>

      <Tabs defaultValue="industries" className="space-y-4">
        <TabsList>
          <TabsTrigger value="industries" className="gap-2">
            <Factory className="h-4 w-4" />
            Tipo de Cliente
          </TabsTrigger>
          <TabsTrigger value="sources" className="gap-2">
            <Megaphone className="h-4 w-4" />
            Fuentes/Referencias
          </TabsTrigger>
          <TabsTrigger value="bonuses" className="gap-2">
            <Gift className="h-4 w-4" />
            Bonos
          </TabsTrigger>
        </TabsList>

        {/* Industries Tab */}
        <TabsContent value="industries">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tipo de Cliente</CardTitle>
                <CardDescription>
                  Define los tipos de cliente disponibles para clasificar clientes
                </CardDescription>
              </div>
              <Dialog open={industryDialogOpen} onOpenChange={setIndustryDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openNewIndustry}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Tipo de Cliente
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingIndustry ? "Editar Tipo de Cliente" : "Nuevo Tipo de Cliente"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingIndustry ? "Modifica los datos del tipo de cliente" : "Agrega un nuevo tipo de cliente al catálogo"}
                    </DialogDescription>
                  </DialogHeader>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="industry_name">Nombre *</FieldLabel>
                      <Input
                        id="industry_name"
                        value={industryForm.name}
                        onChange={(e) => setIndustryForm({ ...industryForm, name: e.target.value })}
                        placeholder="Ej: Tecnología, Retail, Salud..."
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="industry_description">Descripción</FieldLabel>
                      <Textarea
                        id="industry_description"
                        value={industryForm.description}
                        onChange={(e) => setIndustryForm({ ...industryForm, description: e.target.value })}
                        placeholder="Descripción opcional..."
                        rows={3}
                      />
                    </Field>
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor="industry_active">Activa</FieldLabel>
                      <Switch
                        id="industry_active"
                        checked={industryForm.is_active}
                        onCheckedChange={(checked) => setIndustryForm({ ...industryForm, is_active: checked })}
                      />
                    </div>
                  </FieldGroup>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIndustryDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={saveIndustry} disabled={savingIndustry || !industryForm.name.trim()}>
                      {savingIndustry ? "Guardando..." : "Guardar"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {industries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay tipos de cliente definidos. Agrega uno para comenzar.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {industries.map((industry) => (
                      <TableRow key={industry.id}>
                        <TableCell className="font-medium">{industry.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {industry.description || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={industry.is_active ? "default" : "secondary"}>
                            {industry.is_active ? "Activa" : "Inactiva"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => openEditIndustry(industry)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referral Sources Tab */}
        <TabsContent value="sources">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Fuentes / Referencias</CardTitle>
                <CardDescription>
                  Define las fuentes de donde provienen los clientes
                </CardDescription>
              </div>
              <Dialog open={sourceDialogOpen} onOpenChange={setSourceDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openNewSource}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Fuente
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingSource ? "Editar Fuente" : "Nueva Fuente"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingSource ? "Modifica los datos de la fuente" : "Agrega una nueva fuente de referencia"}
                    </DialogDescription>
                  </DialogHeader>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="source_name">Nombre *</FieldLabel>
                      <Input
                        id="source_name"
                        value={sourceForm.name}
                        onChange={(e) => setSourceForm({ ...sourceForm, name: e.target.value })}
                        placeholder="Ej: Google Ads, Referido de cliente..."
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="source_type">Tipo</FieldLabel>
                      <Select
                        value={sourceForm.source_type}
                        onValueChange={(value) => setSourceForm({ ...sourceForm, source_type: value })}
                      >
                        <SelectTrigger id="source_type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="advertising">Publicidad</SelectItem>
                          <SelectItem value="referral">Referido</SelectItem>
                          <SelectItem value="social_media">Redes Sociales</SelectItem>
                          <SelectItem value="event">Evento</SelectItem>
                          <SelectItem value="cold_call">Llamada en Frío</SelectItem>
                          <SelectItem value="website">Sitio Web</SelectItem>
                          <SelectItem value="other">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="source_description">Descripción</FieldLabel>
                      <Textarea
                        id="source_description"
                        value={sourceForm.description}
                        onChange={(e) => setSourceForm({ ...sourceForm, description: e.target.value })}
                        placeholder="Descripción opcional..."
                        rows={3}
                      />
                    </Field>
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor="source_active">Activa</FieldLabel>
                      <Switch
                        id="source_active"
                        checked={sourceForm.is_active}
                        onCheckedChange={(checked) => setSourceForm({ ...sourceForm, is_active: checked })}
                      />
                    </div>
                  </FieldGroup>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSourceDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={saveSource} disabled={savingSource || !sourceForm.name.trim()}>
                      {savingSource ? "Guardando..." : "Guardar"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {referralSources.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay fuentes definidas. Agrega una para comenzar.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referralSources.map((source) => (
                      <TableRow key={source.id}>
                        <TableCell className="font-medium">{source.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {sourceTypeLabels[source.source_type] || source.source_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {source.description || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={source.is_active ? "default" : "secondary"}>
                            {source.is_active ? "Activa" : "Inactiva"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => openEditSource(source)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bonus Types Tab */}
        <TabsContent value="bonuses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tipos de Bono</CardTitle>
                <CardDescription>
                  Define los tipos de bono que se pueden otorgar al personal de esta agencia
                </CardDescription>
              </div>
              <Dialog open={bonusDialogOpen} onOpenChange={setBonusDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openNewBonus}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Tipo de Bono
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingBonus ? "Editar Tipo de Bono" : "Nuevo Tipo de Bono"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingBonus ? "Modifica los datos del tipo de bono" : "Agrega un nuevo tipo de bono al catálogo"}
                    </DialogDescription>
                  </DialogHeader>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="bonus_name">Nombre *</FieldLabel>
                      <Input
                        id="bonus_name"
                        value={bonusForm.name}
                        onChange={(e) => setBonusForm({ ...bonusForm, name: e.target.value })}
                        placeholder="Ej: Desempeño, Productividad, Aguinaldo..."
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="bonus_description">Descripción</FieldLabel>
                      <Textarea
                        id="bonus_description"
                        value={bonusForm.description}
                        onChange={(e) => setBonusForm({ ...bonusForm, description: e.target.value })}
                        placeholder="Descripción opcional..."
                        rows={3}
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="benefit_type">Tipo de beneficio *</FieldLabel>
                        <Select
                          value={bonusForm.benefit_type}
                          onValueChange={(value) => setBonusForm({ ...bonusForm, benefit_type: value })}
                        >
                          <SelectTrigger id="benefit_type">
                            <SelectValue placeholder="Selecciona" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="money">Dinero (monto fijo)</SelectItem>
                            <SelectItem value="salary_days">Días de sueldo</SelectItem>
                            <SelectItem value="free_days">Días libres</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="benefit_value">
                          {bonusForm.benefit_type === "money"
                            ? "Monto"
                            : bonusForm.benefit_type === "salary_days"
                              ? "Número de días de sueldo"
                              : "Número de días libres"}
                        </FieldLabel>
                        <Input
                          id="benefit_value"
                          type="number"
                          min="0"
                          step={bonusForm.benefit_type === "money" ? "0.01" : "1"}
                          value={bonusForm.benefit_value}
                          onChange={(e) => setBonusForm({ ...bonusForm, benefit_value: e.target.value })}
                          placeholder={bonusForm.benefit_type === "money" ? "Ej: 5000" : "Ej: 5"}
                        />
                      </Field>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {bonusForm.benefit_type === "money"
                        ? "Se otorgará un monto fijo en dinero."
                        : bonusForm.benefit_type === "salary_days"
                          ? "El monto se calculará según el sueldo diario del empleado multiplicado por el número de días."
                          : "Se otorgarán días libres al empleado (no representa un monto en dinero)."}
                    </p>
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor="bonus_active">Activo</FieldLabel>
                      <Switch
                        id="bonus_active"
                        checked={bonusForm.is_active}
                        onCheckedChange={(checked) => setBonusForm({ ...bonusForm, is_active: checked })}
                      />
                    </div>

                    <div className="rounded-lg border p-4 space-y-3">
                      <div>
                        <FieldLabel className="!mb-1">Disponibilidad por mes</FieldLabel>
                        <p className="text-xs text-muted-foreground">
                          Selecciona los meses en que este bono se habilita. Si no eliges ninguno, estará disponible todo el año.
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {MONTH_OPTIONS.map((m) => {
                          const selected = bonusForm.available_months.includes(m.value)
                          return (
                            <button
                              type="button"
                              key={m.value}
                              onClick={() => toggleBonusMonth(m.value)}
                              className={`rounded-md border px-2 py-1.5 text-sm transition-colors ${
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-input bg-background hover:bg-muted"
                              }`}
                              aria-pressed={selected}
                            >
                              {m.short}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="rounded-lg border p-4 space-y-3">
                      <div>
                        <FieldLabel className="!mb-1">Límite de uso por colaborador</FieldLabel>
                        <p className="text-xs text-muted-foreground">
                          Controla cuántas veces un colaborador puede recibir este bono en cada periodo, para que no se genere de forma continua.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel htmlFor="limit_period">Periodo</FieldLabel>
                          <Select
                            value={bonusForm.limit_period}
                            onValueChange={(value) => setBonusForm({ ...bonusForm, limit_period: value })}
                          >
                            <SelectTrigger id="limit_period">
                              <SelectValue placeholder="Selecciona" />
                            </SelectTrigger>
                            <SelectContent>
                              {LIMIT_PERIOD_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="limit_count">Veces permitidas</FieldLabel>
                          <Input
                            id="limit_count"
                            type="number"
                            min="1"
                            step="1"
                            value={bonusForm.limit_count}
                            disabled={bonusForm.limit_period === "none"}
                            onChange={(e) => setBonusForm({ ...bonusForm, limit_count: e.target.value })}
                          />
                        </Field>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {describeLimit(
                          bonusForm.limit_period,
                          Number.parseInt(bonusForm.limit_count) || 1,
                        )}
                        {". "}
                        {describeAvailableMonths(bonusForm.available_months)}.
                      </p>
                    </div>
                  </FieldGroup>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setBonusDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={saveBonus} disabled={savingBonus || !bonusForm.name.trim()}>
                      {savingBonus ? "Guardando..." : "Guardar"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {bonusTypes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay tipos de bono definidos. Agrega uno para comenzar.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Beneficio</TableHead>
                      <TableHead>Disponibilidad y límite</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bonusTypes.map((bonus) => (
                      <TableRow key={bonus.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{bonus.name}</span>
                            {bonus.description && (
                              <span className="text-xs text-muted-foreground">{bonus.description}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{benefitTypeLabels[bonus.benefit_type] || bonus.benefit_type}</span>
                            <span className="text-xs text-muted-foreground">
                              {bonus.benefit_type === "money"
                                ? `$${Number(bonus.benefit_value).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
                                : bonus.benefit_type === "salary_days"
                                  ? `${bonus.benefit_value} día(s) de sueldo`
                                  : `${bonus.benefit_value} día(s) libre(s)`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-xs">
                            <span className="text-muted-foreground">
                              {describeAvailableMonths(bonus.available_months)}
                            </span>
                            <span className="text-muted-foreground">
                              {describeLimit(bonus.limit_period, bonus.limit_count)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={bonus.is_active ? "default" : "secondary"}>
                            {bonus.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditBonus(bonus)}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteBonus(bonus)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
