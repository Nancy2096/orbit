"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useAgency } from "@/contexts/agency-context"
import { 
  ArrowLeft,
  Plus, 
  Pencil, 
  Trash2, 
  Globe,
  Phone,
  Users,
  MessageSquare,
  Mail,
  Share2,
  Megaphone,
  FileSpreadsheet,
  Link2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from "lucide-react"

interface LeadSource {
  id: string
  name: string
  description: string | null
  source_type: string
  icon: string | null
  color: string | null
  is_active: boolean
  display_order: number
  integration_config: {
    spreadsheet_url?: string
    spreadsheet_id?: string
    sheet_name?: string
    campaign_id?: string
    account_id?: string
    last_sync?: string
    sync_status?: string
  }
}

const sourceTypeLabels: Record<string, string> = {
  manual: "Manual",
  google_sheets: "Google Sheets",
  google_ads: "Google Ads",
  meta_ads: "Meta Ads",
  linkedin_ads: "LinkedIn Ads",
}

const sourceTypeIcons: Record<string, React.ReactNode> = {
  manual: <Globe className="h-4 w-4" />,
  google_sheets: <FileSpreadsheet className="h-4 w-4" />,
  google_ads: <Megaphone className="h-4 w-4" />,
  meta_ads: <Share2 className="h-4 w-4" />,
  linkedin_ads: <Users className="h-4 w-4" />,
}

const iconOptions = [
  { value: "globe", label: "Web", icon: <Globe className="h-4 w-4" /> },
  { value: "phone", label: "Telefono", icon: <Phone className="h-4 w-4" /> },
  { value: "users", label: "Referido", icon: <Users className="h-4 w-4" /> },
  { value: "message", label: "Chat", icon: <MessageSquare className="h-4 w-4" /> },
  { value: "mail", label: "Email", icon: <Mail className="h-4 w-4" /> },
  { value: "share", label: "Redes Sociales", icon: <Share2 className="h-4 w-4" /> },
  { value: "megaphone", label: "Publicidad", icon: <Megaphone className="h-4 w-4" /> },
]

const colorOptions = [
  { value: "#3b82f6", label: "Azul" },
  { value: "#10b981", label: "Verde" },
  { value: "#f59e0b", label: "Amarillo" },
  { value: "#ef4444", label: "Rojo" },
  { value: "#8b5cf6", label: "Morado" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#6b7280", label: "Gris" },
]

export default function LeadSourcesSettingsPage() {
  const { selectedAgencyId, loading: agencyLoading } = useAgency()
  const [sources, setSources] = useState<LeadSource[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [integrationDialogOpen, setIntegrationDialogOpen] = useState(false)
  const [editingSource, setEditingSource] = useState<LeadSource | null>(null)
  const [editingIntegration, setEditingIntegration] = useState<LeadSource | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "globe",
    color: "#3b82f6",
  })
  const [integrationForm, setIntegrationForm] = useState({
    name: "",
    source_type: "google_sheets",
    spreadsheet_url: "",
    sheet_name: "",
    campaign_id: "",
    account_id: "",
  })
  const supabase = createClient()

  useEffect(() => {
    if (selectedAgencyId) {
      fetchSources()
    } else {
      setLoading(false)
    }
  }, [selectedAgencyId])

  async function fetchSources() {
    setLoading(true)
    const { data, error } = await supabase
      .from("crm_lead_sources")
      .select("*")
      .eq("agency_id", selectedAgencyId)
      .order("display_order", { ascending: true })

    if (data) setSources(data)
    if (error) console.error("Error fetching sources:", error)
    setLoading(false)
  }

  function openCreateDialog() {
    setEditingSource(null)
    setFormData({
      name: "",
      description: "",
      icon: "globe",
      color: "#3b82f6",
    })
    setDialogOpen(true)
  }

  function openEditDialog(source: LeadSource) {
    setEditingSource(source)
    setFormData({
      name: source.name,
      description: source.description || "",
      icon: source.icon || "globe",
      color: source.color || "#3b82f6",
    })
    setDialogOpen(true)
  }

  function openIntegrationDialog(source?: LeadSource) {
    if (source) {
      setEditingIntegration(source)
      setIntegrationForm({
        name: source.name,
        source_type: source.source_type,
        spreadsheet_url: source.integration_config?.spreadsheet_url || "",
        sheet_name: source.integration_config?.sheet_name || "",
        campaign_id: source.integration_config?.campaign_id || "",
        account_id: source.integration_config?.account_id || "",
      })
    } else {
      setEditingIntegration(null)
      setIntegrationForm({
        name: "",
        source_type: "google_sheets",
        spreadsheet_url: "",
        sheet_name: "",
        campaign_id: "",
        account_id: "",
      })
    }
    setIntegrationDialogOpen(true)
  }

  async function handleSaveSource() {
    console.log("[v0] handleSaveSource called")
    console.log("[v0] formData:", formData)
    console.log("[v0] selectedAgencyId:", selectedAgencyId)
    
    if (!formData.name.trim()) {
      toast.error("El nombre es requerido")
      return
    }

    if (!selectedAgencyId) {
      toast.error("No hay agencia seleccionada")
      console.log("[v0] No agency selected, returning")
      return
    }

    setSaving(true)
    
    if (editingSource) {
      const { error } = await supabase
        .from("crm_lead_sources")
        .update({
          name: formData.name,
          description: formData.description || null,
          icon: formData.icon,
          color: formData.color,
        })
        .eq("id", editingSource.id)

      if (error) {
        toast.error("Error al actualizar la fuente")
        console.error(error)
      } else {
        toast.success("Fuente actualizada")
        fetchSources()
        setDialogOpen(false)
      }
    } else {
      const maxOrder = sources.length > 0 ? Math.max(...sources.map(s => s.display_order)) : 0
      
      const insertData = {
        agency_id: selectedAgencyId,
        name: formData.name,
        description: formData.description || null,
        source_type: "manual",
        icon: formData.icon,
        color: formData.color,
        display_order: maxOrder + 1,
      }
      
      console.log("[v0] Inserting new source:", insertData)
      
      const { data, error } = await supabase
        .from("crm_lead_sources")
        .insert(insertData)
        .select()

      console.log("[v0] Insert result - data:", data, "error:", error)

      if (error) {
        toast.error("Error al crear la fuente: " + error.message)
        console.error("[v0] Insert error:", error)
      } else {
        toast.success("Fuente creada")
        fetchSources()
        setDialogOpen(false)
      }
    }
    
    setSaving(false)
  }

  async function handleSaveIntegration() {
    if (!integrationForm.name.trim()) {
      toast.error("El nombre es requerido")
      return
    }

    setSaving(true)
    
    const integrationConfig: Record<string, string> = {}
    
    if (integrationForm.source_type === "google_sheets") {
      if (!integrationForm.spreadsheet_url) {
        toast.error("La URL del Google Sheet es requerida")
        setSaving(false)
        return
      }
      integrationConfig.spreadsheet_url = integrationForm.spreadsheet_url
      integrationConfig.sheet_name = integrationForm.sheet_name || "Sheet1"
      // Extraer ID del spreadsheet de la URL
      const match = integrationForm.spreadsheet_url.match(/\/d\/([a-zA-Z0-9-_]+)/)
      if (match) {
        integrationConfig.spreadsheet_id = match[1]
      }
    } else {
      if (integrationForm.account_id) {
        integrationConfig.account_id = integrationForm.account_id
      }
      if (integrationForm.campaign_id) {
        integrationConfig.campaign_id = integrationForm.campaign_id
      }
    }

    integrationConfig.sync_status = "pending"
    integrationConfig.last_sync = new Date().toISOString()

    if (editingIntegration) {
      const { error } = await supabase
        .from("crm_lead_sources")
        .update({
          name: integrationForm.name,
          source_type: integrationForm.source_type,
          integration_config: integrationConfig,
        })
        .eq("id", editingIntegration.id)

      if (error) {
        toast.error("Error al actualizar la integracion")
        console.error(error)
      } else {
        toast.success("Integracion actualizada")
        fetchSources()
        setIntegrationDialogOpen(false)
      }
    } else {
      const maxOrder = sources.length > 0 ? Math.max(...sources.map(s => s.display_order)) : 0
      
      const { error } = await supabase
        .from("crm_lead_sources")
        .insert({
          agency_id: selectedAgencyId,
          name: integrationForm.name,
          source_type: integrationForm.source_type,
          integration_config: integrationConfig,
          display_order: maxOrder + 1,
        })

      if (error) {
        toast.error("Error al crear la integracion")
        console.error(error)
      } else {
        toast.success("Integracion creada")
        fetchSources()
        setIntegrationDialogOpen(false)
      }
    }
    
    setSaving(false)
  }

  async function handleToggleActive(source: LeadSource) {
    const { error } = await supabase
      .from("crm_lead_sources")
      .update({ is_active: !source.is_active })
      .eq("id", source.id)

    if (error) {
      toast.error("Error al actualizar")
    } else {
      fetchSources()
    }
  }

  async function handleDelete(source: LeadSource) {
    if (!confirm(`¿Eliminar la fuente "${source.name}"?`)) return

    const { error } = await supabase
      .from("crm_lead_sources")
      .delete()
      .eq("id", source.id)

    if (error) {
      toast.error("Error al eliminar")
      console.error(error)
    } else {
      toast.success("Fuente eliminada")
      fetchSources()
    }
  }

  async function handleSyncIntegration(source: LeadSource) {
    toast.info(`Sincronizando ${source.name}...`)
    
    // Actualizar estado de sincronizacion
    await supabase
      .from("crm_lead_sources")
      .update({
        integration_config: {
          ...source.integration_config,
          sync_status: "syncing",
          last_sync: new Date().toISOString(),
        }
      })
      .eq("id", source.id)

    // Simular sincronizacion (en produccion aqui iria la logica real)
    setTimeout(async () => {
      await supabase
        .from("crm_lead_sources")
        .update({
          integration_config: {
            ...source.integration_config,
            sync_status: "success",
            last_sync: new Date().toISOString(),
          }
        })
        .eq("id", source.id)
      
      toast.success(`${source.name} sincronizado correctamente`)
      fetchSources()
    }, 2000)
  }

  const manualSources = sources.filter(s => s.source_type === "manual")
  const integrationSources = sources.filter(s => s.source_type !== "manual")

  if (agencyLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!selectedAgencyId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Globe className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Selecciona una Agencia</h2>
        <p className="text-muted-foreground max-w-md">
          Para configurar las fuentes de lead, primero selecciona una agencia en el selector de arriba.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/crm">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Fuentes de Lead</h1>
          <p className="text-muted-foreground">
            Define las fuentes de donde pueden venir tus prospectos y conecta integraciones
          </p>
        </div>
      </div>

      <Tabs defaultValue="sources" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sources">Fuentes Manuales</TabsTrigger>
          <TabsTrigger value="integrations">Integraciones</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Fuentes de Lead Manuales</CardTitle>
                <CardDescription>
                  Define los canales de donde pueden llegar tus prospectos
                </CardDescription>
              </div>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Fuente
              </Button>
            </CardHeader>
            <CardContent>
              {manualSources.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay fuentes configuradas. Crea la primera fuente de lead.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fuente</TableHead>
                      <TableHead>Descripcion</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manualSources.map((source) => (
                      <TableRow key={source.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                              style={{ backgroundColor: source.color || "#6b7280" }}
                            >
                              {iconOptions.find(i => i.value === source.icon)?.icon || <Globe className="h-4 w-4" />}
                            </div>
                            <span className="font-medium">{source.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {source.description || "-"}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={source.is_active}
                            onCheckedChange={() => handleToggleActive(source)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(source)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(source)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Integraciones de Leads</CardTitle>
                <CardDescription>
                  Conecta Google Sheets, Google Ads, Meta Ads o LinkedIn Ads para importar prospectos automaticamente
                </CardDescription>
              </div>
              <Button onClick={() => openIntegrationDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Integracion
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {integrationSources.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground mb-4">
                    No hay integraciones configuradas
                  </div>
                  <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => {
                      setIntegrationForm(prev => ({ ...prev, source_type: "google_sheets" }))
                      openIntegrationDialog()
                    }}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Google Sheets
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIntegrationForm(prev => ({ ...prev, source_type: "google_ads" }))
                      openIntegrationDialog()
                    }}>
                      <Megaphone className="mr-2 h-4 w-4" />
                      Google Ads
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIntegrationForm(prev => ({ ...prev, source_type: "meta_ads" }))
                      openIntegrationDialog()
                    }}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Meta Ads
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIntegrationForm(prev => ({ ...prev, source_type: "linkedin_ads" }))
                      openIntegrationDialog()
                    }}>
                      <Users className="mr-2 h-4 w-4" />
                      LinkedIn Ads
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {integrationSources.map((source) => (
                    <Card key={source.id} className="relative">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {sourceTypeIcons[source.source_type]}
                            <CardTitle className="text-base">{source.name}</CardTitle>
                          </div>
                          <Badge variant={source.is_active ? "default" : "secondary"}>
                            {source.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                        <CardDescription>
                          {sourceTypeLabels[source.source_type]}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {source.source_type === "google_sheets" && source.integration_config?.spreadsheet_url && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Spreadsheet:</span>
                            <a 
                              href={source.integration_config.spreadsheet_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-primary hover:underline inline-flex items-center gap-1"
                            >
                              Abrir <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                        
                        {source.source_type !== "google_sheets" && source.integration_config?.account_id && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">ID de Cuenta:</span>
                            <span className="ml-2 font-mono">{source.integration_config.account_id}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Estado:</span>
                          {source.integration_config?.sync_status === "success" ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Sincronizado
                            </span>
                          ) : source.integration_config?.sync_status === "syncing" ? (
                            <span className="flex items-center gap-1 text-blue-600">
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              Sincronizando...
                            </span>
                          ) : source.integration_config?.sync_status === "error" ? (
                            <span className="flex items-center gap-1 text-red-600">
                              <AlertCircle className="h-3 w-3" />
                              Error
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Pendiente</span>
                          )}
                        </div>

                        {source.integration_config?.last_sync && (
                          <div className="text-xs text-muted-foreground">
                            Ultima sincronizacion: {new Date(source.integration_config.last_sync).toLocaleString("es-MX")}
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSyncIntegration(source)}
                            disabled={source.integration_config?.sync_status === "syncing"}
                          >
                            <RefreshCw className="mr-1 h-3 w-3" />
                            Sincronizar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openIntegrationDialog(source)}
                          >
                            <Pencil className="mr-1 h-3 w-3" />
                            Editar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(source)}
                          >
                            <Trash2 className="mr-1 h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Link2 className="h-6 w-6 text-blue-600 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">Como funcionan las integraciones</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li><strong>Google Sheets:</strong> Conecta una hoja de calculo y los nuevos registros se importaran como prospectos automaticamente.</li>
                    <li><strong>Google Ads:</strong> Importa leads generados desde tus campanas de Google Ads Lead Forms.</li>
                    <li><strong>Meta Ads:</strong> Sincroniza leads desde Facebook e Instagram Lead Ads.</li>
                    <li><strong>LinkedIn Ads:</strong> Importa leads desde LinkedIn Lead Gen Forms.</li>
                  </ul>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    Nota: La sincronizacion se realiza cada 15 minutos automaticamente o puedes forzarla manualmente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para crear/editar fuente manual */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSource ? "Editar Fuente" : "Nueva Fuente de Lead"}
            </DialogTitle>
            <DialogDescription>
              Define una fuente de donde pueden venir tus prospectos
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                placeholder="Ej: Sitio Web, Referidos, Redes Sociales"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Textarea
                placeholder="Descripcion opcional de esta fuente"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icono</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData({ ...formData, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((icon) => (
                      <SelectItem key={icon.value} value={icon.value}>
                        <div className="flex items-center gap-2">
                          {icon.icon}
                          <span>{icon.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => setFormData({ ...formData, color: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: color.value }}
                          />
                          <span>{color.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <Label className="text-xs text-muted-foreground mb-2 block">Vista previa</Label>
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: formData.color }}
                >
                  {iconOptions.find(i => i.value === formData.icon)?.icon}
                </div>
                <span className="font-medium">{formData.name || "Nombre de la fuente"}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSource} disabled={saving}>
              {saving && <Spinner className="mr-2 h-4 w-4" />}
              {editingSource ? "Guardar Cambios" : "Crear Fuente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para crear/editar integracion */}
      <Dialog open={integrationDialogOpen} onOpenChange={setIntegrationDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingIntegration ? "Editar Integracion" : "Nueva Integracion"}
            </DialogTitle>
            <DialogDescription>
              Conecta una fuente externa para importar prospectos automaticamente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de la integracion *</Label>
              <Input
                placeholder="Ej: Campana Black Friday, Leads Website"
                value={integrationForm.name}
                onChange={(e) => setIntegrationForm({ ...integrationForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Integracion</Label>
              <Select
                value={integrationForm.source_type}
                onValueChange={(value) => setIntegrationForm({ ...integrationForm, source_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google_sheets">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Google Sheets
                    </div>
                  </SelectItem>
                  <SelectItem value="google_ads">
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-4 w-4" />
                      Google Ads
                    </div>
                  </SelectItem>
                  <SelectItem value="meta_ads">
                    <div className="flex items-center gap-2">
                      <Share2 className="h-4 w-4" />
                      Meta Ads (Facebook/Instagram)
                    </div>
                  </SelectItem>
                  <SelectItem value="linkedin_ads">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      LinkedIn Ads
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campos especificos segun el tipo */}
            {integrationForm.source_type === "google_sheets" && (
              <>
                <div className="space-y-2">
                  <Label>URL del Google Sheet *</Label>
                  <Input
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={integrationForm.spreadsheet_url}
                    onChange={(e) => setIntegrationForm({ ...integrationForm, spreadsheet_url: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Asegurate de que el documento tenga permisos de lectura
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Nombre de la Hoja</Label>
                  <Input
                    placeholder="Sheet1"
                    value={integrationForm.sheet_name}
                    onChange={(e) => setIntegrationForm({ ...integrationForm, sheet_name: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Nombre de la hoja dentro del documento (por defecto: Sheet1)
                  </p>
                </div>
              </>
            )}

            {integrationForm.source_type !== "google_sheets" && (
              <>
                <div className="space-y-2">
                  <Label>ID de Cuenta</Label>
                  <Input
                    placeholder={
                      integrationForm.source_type === "google_ads" ? "123-456-7890" :
                      integrationForm.source_type === "meta_ads" ? "act_123456789" :
                      "12345678"
                    }
                    value={integrationForm.account_id}
                    onChange={(e) => setIntegrationForm({ ...integrationForm, account_id: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ID de Campana (opcional)</Label>
                  <Input
                    placeholder="ID de la campana especifica"
                    value={integrationForm.campaign_id}
                    onChange={(e) => setIntegrationForm({ ...integrationForm, campaign_id: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Deja vacio para importar de todas las campanas
                  </p>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Para conectar {sourceTypeLabels[integrationForm.source_type]}, necesitaras autorizar el acceso a tu cuenta. 
                    Despues de guardar, haz clic en "Sincronizar" para iniciar la conexion.
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIntegrationDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveIntegration} disabled={saving}>
              {saving && <Spinner className="mr-2 h-4 w-4" />}
              {editingIntegration ? "Guardar Cambios" : "Crear Integracion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
