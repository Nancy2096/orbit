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
import { ArrowLeft, Plus, Pencil, Factory, Megaphone } from "lucide-react"
import Link from "next/link"

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

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    setLoading(true)

    const [agencyRes, industriesRes, sourcesRes] = await Promise.all([
      supabase.from("agencies").select("id, name").eq("id", id).single(),
      supabase.from("industries").select("*").eq("agency_id", id).order("name"),
      supabase.from("referral_sources").select("*").eq("agency_id", id).order("name"),
    ])

    if (agencyRes.data) setAgency(agencyRes.data)
    if (industriesRes.data) setIndustries(industriesRes.data)
    if (sourcesRes.data) setReferralSources(sourcesRes.data)

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
          <p className="text-muted-foreground">Administra los tipos de clientes y fuentes de referencia</p>
        </div>
      </div>

      <Tabs defaultValue="industries" className="space-y-4">
        <TabsList>
          <TabsTrigger value="industries" className="gap-2">
            <Factory className="h-4 w-4" />
            Tipo de clientes
          </TabsTrigger>
          <TabsTrigger value="sources" className="gap-2">
            <Megaphone className="h-4 w-4" />
            Fuentes/Referencias
          </TabsTrigger>
        </TabsList>

        {/* Industries Tab */}
        <TabsContent value="industries">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tipo de clientes</CardTitle>
                <CardDescription>
                  Define los tipos de clientes disponibles para clasificar clientes
                </CardDescription>
              </div>
              <Dialog open={industryDialogOpen} onOpenChange={setIndustryDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openNewIndustry}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Tipo de cliente
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingIndustry ? "Editar Tipo de cliente" : "Nuevo Tipo de cliente"}
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
                  No hay tipos de clientes definidos. Agrega uno para comenzar.
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
      </Tabs>
    </div>
  )
}
