"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Building2, 
  Bell, 
  Plug, 
  History, 
  Download, 
  Save, 
  Plus, 
  RefreshCw,
  Mail,
  Smartphone,
  Monitor,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  FileJson,
  FileSpreadsheet,
  Database,
  Trash2,
  Edit,
  ExternalLink,
  DollarSign,
  ArrowRightLeft,
  Upload,
  ImageIcon,
  Palette,
  Settings2
} from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Agency {
  id: string
  name: string
}

interface SystemBranding {
  system_name: string
  tagline: string
  logo_url: string | null
  logo_name_url: string | null
  favicon_url: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  text_color: string
  background_color: string
  sidebar_color: string
  font_family: string
}

interface CompanySettings {
  id?: string
  agency_id: string
  company_name: string
  legal_name: string
  tax_id: string
  logo_url: string
  address: string
  city: string
  state: string
  country: string
  postal_code: string
  phone: string
  email: string
  website: string
  timezone: string
  date_format: string
  fiscal_year_start: number
  primary_color: string
  secondary_color: string
}

interface NotificationType {
  id: string
  code: string
  name: string
  description: string
  category: string
  is_active: boolean
}

interface NotificationSetting {
  notification_type: string
  email_enabled: boolean
  push_enabled: boolean
  in_app_enabled: boolean
}

interface Integration {
  id: string
  agency_id: string
  name: string
  type: string
  provider: string
  is_active: boolean
  config: Record<string, unknown>
  last_sync_at: string | null
  sync_status: string
  sync_error: string | null
  created_at: string
}

interface AuditLog {
  id: string
  agency_id: string
  user_id: string
  user_email: string
  action: string
  entity_type: string
  entity_id: string
  entity_name: string
  old_values: Record<string, unknown>
  new_values: Record<string, unknown>
  ip_address: string
  created_at: string
}

interface BackupHistory {
  id: string
  agency_id: string
  backup_type: string
  file_name: string
  file_url: string
  file_size_bytes: number
  tables_included: string[]
  status: string
  error_message: string | null
  started_at: string
  completed_at: string | null
}

interface Currency {
  id: string
  agency_id: string
  code: string
  name: string
  symbol: string
  exchange_rate: number
  is_default: boolean
  is_active: boolean
}

const timezones = [
  { value: "America/Mexico_City", label: "Ciudad de México (GMT-6)" },
  { value: "America/Tijuana", label: "Tijuana (GMT-8)" },
  { value: "America/Cancun", label: "Cancún (GMT-5)" },
  { value: "America/New_York", label: "Nueva York (GMT-5)" },
  { value: "America/Los_Angeles", label: "Los Ángeles (GMT-8)" },
  { value: "Europe/Madrid", label: "Madrid (GMT+1)" },
  { value: "UTC", label: "UTC (GMT+0)" },
]

const dateFormats = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
]

const months = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
]

const integrationProviders = [
  { type: "accounting", provider: "quickbooks", name: "QuickBooks", description: "Software de contabilidad" },
  { type: "accounting", provider: "contpaqi", name: "CONTPAQi", description: "Sistema contable y fiscal" },
  { type: "accounting", provider: "aspel", name: "Aspel", description: "Software administrativo" },
  { type: "crm", provider: "salesforce", name: "Salesforce", description: "CRM empresarial" },
  { type: "crm", provider: "hubspot", name: "HubSpot", description: "CRM y marketing" },
  { type: "email", provider: "mailchimp", name: "Mailchimp", description: "Email marketing" },
  { type: "email", provider: "sendgrid", name: "SendGrid", description: "Servicio de email" },
  { type: "storage", provider: "google_drive", name: "Google Drive", description: "Almacenamiento en la nube" },
  { type: "storage", provider: "dropbox", name: "Dropbox", description: "Almacenamiento en la nube" },
  { type: "payment", provider: "stripe", name: "Stripe", description: "Procesamiento de pagos" },
  { type: "payment", provider: "mercadopago", name: "Mercado Pago", description: "Pasarela de pagos" },
  { type: "facturacion", provider: "facturapi", name: "Facturapi", description: "Facturación electrónica" },
  { type: "facturacion", provider: "sat", name: "SAT", description: "Facturación SAT" },
]

export default function SettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [selectedAgency, setSelectedAgency] = useState<string>("")
  
  // Company Settings
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    agency_id: "",
    company_name: "",
    legal_name: "",
    tax_id: "",
    logo_url: "",
    address: "",
    city: "",
    state: "",
    country: "México",
    postal_code: "",
    phone: "",
    email: "",
    website: "",
    timezone: "America/Mexico_City",
    date_format: "DD/MM/YYYY",
    fiscal_year_start: 1,
    primary_color: "#3b82f6",
    secondary_color: "#1e40af",
  })

  // System Branding
  const [systemBranding, setSystemBranding] = useState<SystemBranding>({
    system_name: "ERP System",
    tagline: "Sistema de Gestión Empresarial",
    logo_url: null,
    logo_name_url: null,
    favicon_url: null,
    primary_color: "#3B82F6",
    secondary_color: "#10B981",
    accent_color: "#F59E0B",
    text_color: "#1F2937",
    background_color: "#FFFFFF",
    sidebar_color: "#1F2937",
    font_family: "Inter",
  })
  const [uploadingSystemLogo, setUploadingSystemLogo] = useState(false)
  const [uploadingLogoName, setUploadingLogoName] = useState(false)
  const [savingSystem, setSavingSystem] = useState(false)

  // Currencies
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false)
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null)
  const [newCurrency, setNewCurrency] = useState({
    code: "",
    name: "",
    symbol: "",
    exchange_rate: 1,
    is_default: false,
    is_active: true,
  })
  
  // Notifications
  const [notificationTypes, setNotificationTypes] = useState<NotificationType[]>([])
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([])
  
  // Integrations
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [showIntegrationDialog, setShowIntegrationDialog] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<typeof integrationProviders[0] | null>(null)
  
  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditFilter, setAuditFilter] = useState({ action: "all", entity_type: "all" })
  
  // Backups
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([])
  const [showBackupDialog, setShowBackupDialog] = useState(false)
  const [backupType, setBackupType] = useState<"full" | "partial" | "export">("full")
  const [selectedTables, setSelectedTables] = useState<string[]>([])

  const availableTables = [
    "clients", "accounts", "projects", "invoices", "payments", "expenses",
    "staff", "time_entries", "leave_requests", "training_courses"
  ]

useEffect(() => {
    fetchAgencies()
    fetchSystemBranding()
  }, [])
  
  const fetchSystemBranding = async () => {
    const { data } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "branding")
      .single()
    
    if (data?.value) {
      setSystemBranding(prev => ({ ...prev, ...data.value }))
    }
  }

  useEffect(() => {
    if (selectedAgency) {
      fetchAllData()
    }
  }, [selectedAgency])

  const fetchAgencies = async () => {
    const { data } = await supabase.from("agencies").select("id, name").order("name")
    if (data && data.length > 0) {
      setAgencies(data)
      setSelectedAgency(data[0].id)
    }
    setLoading(false)
  }

  const fetchAllData = async () => {
    setLoading(true)
    await Promise.all([
      fetchCompanySettings(),
      fetchCurrencies(),
      fetchNotificationTypes(),
      fetchNotificationSettings(),
      fetchIntegrations(),
      fetchAuditLogs(),
      fetchBackupHistory(),
    ])
    setLoading(false)
  }

  const fetchCompanySettings = async () => {
    const { data } = await supabase
      .from("company_settings")
      .select("*")
      .eq("agency_id", selectedAgency)
      .single()
    
    if (data) {
      setCompanySettings(data)
    } else {
      setCompanySettings({
        agency_id: selectedAgency,
        company_name: "",
        legal_name: "",
        tax_id: "",
        logo_url: "",
        address: "",
        city: "",
        state: "",
        country: "México",
        postal_code: "",
        phone: "",
        email: "",
        website: "",
        timezone: "America/Mexico_City",
        date_format: "DD/MM/YYYY",
        fiscal_year_start: 1,
        primary_color: "#3b82f6",
        secondary_color: "#1e40af",
      })
    }
  }

  const fetchCurrencies = async () => {
    const { data } = await supabase
      .from("currencies")
      .select("*")
      .eq("agency_id", selectedAgency)
      .order("is_default", { ascending: false })
    setCurrencies(data || [])
  }

  const fetchNotificationTypes = async () => {
    const { data } = await supabase
      .from("notification_types")
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true })
    setNotificationTypes(data || [])
  }

  const fetchNotificationSettings = async () => {
    const { data } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("agency_id", selectedAgency)
      .is("staff_id", null)
    
    if (data) {
      setNotificationSettings(data.map(s => ({
        notification_type: s.notification_type,
        email_enabled: s.email_enabled,
        push_enabled: s.push_enabled,
        in_app_enabled: s.in_app_enabled,
      })))
    }
  }

  const fetchIntegrations = async () => {
    const { data } = await supabase
      .from("integrations")
      .select("*")
      .eq("agency_id", selectedAgency)
      .order("created_at", { ascending: false })
    setIntegrations(data || [])
  }

  const fetchAuditLogs = async () => {
    let query = supabase
      .from("audit_logs")
      .select("*")
      .eq("agency_id", selectedAgency)
      .order("created_at", { ascending: false })
      .limit(100)
    
    if (auditFilter.action !== "all") {
      query = query.eq("action", auditFilter.action)
    }
    if (auditFilter.entity_type !== "all") {
      query = query.eq("entity_type", auditFilter.entity_type)
    }
    
    const { data } = await query
    setAuditLogs(data || [])
  }

  const fetchBackupHistory = async () => {
    const { data } = await supabase
      .from("backup_history")
      .select("*")
      .eq("agency_id", selectedAgency)
      .order("started_at", { ascending: false })
      .limit(50)
    setBackupHistory(data || [])
  }

// System branding functions
  const handleSystemLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingSystemLogo(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      uploadFormData.append("folder", "system")
      if (systemBranding.logo_url) {
        uploadFormData.append("oldUrl", systemBranding.logo_url)
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      })

      if (response.ok) {
        const data = await response.json()
        setSystemBranding(prev => ({ ...prev, logo_url: data.pathname || data.url }))
      }
    } catch (error) {
      console.error("Error uploading system logo:", error)
    } finally {
      setUploadingSystemLogo(false)
    }
  }

  const getSystemLogoUrl = (logoUrl: string | null) => {
    if (!logoUrl) return null
    if (logoUrl.includes('.vercel-storage.com/')) {
      const pathname = logoUrl.split('.vercel-storage.com/')[1]
      return `/api/file?pathname=${encodeURIComponent(pathname)}`
    }
    if (logoUrl.startsWith('system/') || logoUrl.startsWith('logos/')) {
      return `/api/file?pathname=${encodeURIComponent(logoUrl)}`
    }
    return logoUrl
  }

  const handleLogoNameUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogoName(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      uploadFormData.append("folder", "system")
      if (systemBranding.logo_name_url) {
        uploadFormData.append("oldUrl", systemBranding.logo_name_url)
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      })

      if (response.ok) {
        const data = await response.json()
        setSystemBranding(prev => ({ ...prev, logo_name_url: data.pathname || data.url }))
      }
    } catch (error) {
      console.error("Error uploading logo name:", error)
    } finally {
      setUploadingLogoName(false)
    }
  }

  const handleSaveSystemBranding = async () => {
    setSavingSystem(true)
    try {
      const { error } = await supabase
        .from("system_settings")
        .update({ 
          value: systemBranding,
          updated_at: new Date().toISOString()
        })
        .eq("key", "branding")

      if (error) throw error
      alert("Configuración guardada")
    } catch (error) {
      console.error("Error saving system branding:", error)
      alert("Error al guardar la configuración")
    } finally {
      setSavingSystem(false)
    }
  }

  const handleSaveCompanySettings = async () => {
    setSaving(true)
    
    if (companySettings.id) {
      await supabase
        .from("company_settings")
        .update({
          ...companySettings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", companySettings.id)
    } else {
      await supabase.from("company_settings").insert({
        ...companySettings,
        agency_id: selectedAgency,
      })
    }
    
    await fetchCompanySettings()
    setSaving(false)
  }

  const handleSaveCurrency = async () => {
    if (editingCurrency) {
      await supabase
        .from("currencies")
        .update({
          ...newCurrency,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingCurrency.id)
    } else {
      await supabase.from("currencies").insert({
        ...newCurrency,
        agency_id: selectedAgency,
      })
    }
    
    setShowCurrencyDialog(false)
    setEditingCurrency(null)
    setNewCurrency({
      code: "",
      name: "",
      symbol: "",
      exchange_rate: 1,
      is_default: false,
      is_active: true,
    })
    fetchCurrencies()
  }

  const handleSetDefaultCurrency = async (currencyId: string) => {
    await supabase
      .from("currencies")
      .update({ is_default: false })
      .eq("agency_id", selectedAgency)
    
    await supabase
      .from("currencies")
      .update({ is_default: true })
      .eq("id", currencyId)
    
    fetchCurrencies()
  }

  const handleDeleteCurrency = async (currencyId: string) => {
    await supabase.from("currencies").delete().eq("id", currencyId)
    fetchCurrencies()
  }

  const handleToggleNotification = async (typeCode: string, field: keyof NotificationSetting, value: boolean) => {
    const existing = notificationSettings.find(s => s.notification_type === typeCode)
    
    if (existing) {
      await supabase
        .from("notification_settings")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("agency_id", selectedAgency)
        .eq("notification_type", typeCode)
        .is("staff_id", null)
    } else {
      await supabase.from("notification_settings").insert({
        agency_id: selectedAgency,
        notification_type: typeCode,
        email_enabled: field === "email_enabled" ? value : true,
        push_enabled: field === "push_enabled" ? value : false,
        in_app_enabled: field === "in_app_enabled" ? value : true,
      })
    }
    
    fetchNotificationSettings()
  }

  const getNotificationSetting = (typeCode: string): NotificationSetting => {
    return notificationSettings.find(s => s.notification_type === typeCode) || {
      notification_type: typeCode,
      email_enabled: true,
      push_enabled: false,
      in_app_enabled: true,
    }
  }

  const handleAddIntegration = async () => {
    if (!selectedProvider) return
    
    await supabase.from("integrations").insert({
      agency_id: selectedAgency,
      name: selectedProvider.name,
      type: selectedProvider.type,
      provider: selectedProvider.provider,
      is_active: false,
      config: {},
      credentials: {},
    })
    
    setShowIntegrationDialog(false)
    setSelectedProvider(null)
    fetchIntegrations()
  }

  const handleToggleIntegration = async (integrationId: string, isActive: boolean) => {
    await supabase
      .from("integrations")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", integrationId)
    fetchIntegrations()
  }

  const handleDeleteIntegration = async (integrationId: string) => {
    await supabase.from("integrations").delete().eq("id", integrationId)
    fetchIntegrations()
  }

  const handleCreateBackup = async () => {
    const fileName = `backup_${backupType}_${format(new Date(), "yyyyMMdd_HHmmss")}.json`
    
    await supabase.from("backup_history").insert({
      agency_id: selectedAgency,
      backup_type: backupType,
      file_name: fileName,
      tables_included: backupType === "full" ? availableTables : selectedTables,
      status: "pending",
    })
    
    setShowBackupDialog(false)
    setBackupType("full")
    setSelectedTables([])
    fetchBackupHistory()
  }

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "create": return "bg-green-100 text-green-800"
      case "update": return "bg-blue-100 text-blue-800"
      case "delete": return "bg-red-100 text-red-800"
      case "login": return "bg-purple-100 text-purple-800"
      case "export": return "bg-amber-100 text-amber-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Completado</Badge>
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Procesando</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Fallido</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>
    }
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "N/A"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "finance": return "Finanzas"
      case "hr": return "Recursos Humanos"
      case "operations": return "Operaciones"
      case "system": return "Sistema"
      default: return category
    }
  }

  if (loading && agencies.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground">Administra la configuración del sistema</p>
        </div>
        <Select value={selectedAgency} onValueChange={setSelectedAgency}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Seleccionar agencia" />
          </SelectTrigger>
          <SelectContent>
            {agencies.map((agency) => (
              <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="system" className="space-y-6">
<TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Sistema
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Plug className="h-4 w-4" />
              Integraciones
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Auditoría
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Backup
            </TabsTrigger>
          </TabsList>

{/* System Settings Tab */}
            <TabsContent value="system" className="space-y-6">
              {/* Logo y Nombre del Sistema */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Identidad del Sistema
                  </CardTitle>
                  <CardDescription>
                    Configura el nombre, logotipo y eslogan del sistema que se mostrará en toda la aplicación.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start gap-6">
                    <div className="relative">
                      {systemBranding.logo_url ? (
                        <div className="relative w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 overflow-hidden bg-muted">
                          <img
                            src={getSystemLogoUrl(systemBranding.logo_url) || ""}
                            alt="Logo del sistema"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted">
                          <ImageIcon className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-3 flex-1">
                      <div>
                        <label htmlFor="system-logo-upload">
                          <Button asChild variant="outline" disabled={uploadingSystemLogo}>
                            <span>
                              {uploadingSystemLogo ? (
                                <>
                                  <Spinner className="mr-2 h-4 w-4" />
                                  Subiendo...
                                </>
                              ) : (
                                <>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Subir Logo
                                </>
                              )}
                            </span>
                          </Button>
                        </label>
                        <input
                          id="system-logo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleSystemLogoUpload}
                        />
                      </div>
                      {systemBranding.logo_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setSystemBranding(prev => ({ ...prev, logo_url: null }))}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar Logo
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Formatos: PNG, JPG, SVG. Tamaño recomendado: 512x512px
                      </p>
                    </div>
                  </div>

                  {/* Logo Nombre - para mostrar en login */}
                  <div className="flex items-start gap-6 p-4 border rounded-lg bg-muted/30">
                    <div className="w-48 h-16 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#1a5276] via-[#2980b9] to-[#5dade2]">
                      {systemBranding.logo_name_url ? (
                        <img 
                          src={getSystemLogoUrl(systemBranding.logo_name_url) || ""} 
                          alt="Logo Nombre" 
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="h-6 w-6 text-white/60 mx-auto" />
                          <span className="text-xs text-white/60">Logo Nombre</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3 flex-1">
                      <div>
                        <Label className="text-sm font-medium">Logotipo Nombre</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Este logo se mostrará en la pantalla de Login en lugar del nombre del sistema en texto.
                        </p>
                        <label htmlFor="logo-name-upload">
                          <Button asChild variant="outline" disabled={uploadingLogoName}>
                            <span>
                              {uploadingLogoName ? (
                                <>
                                  <Spinner className="mr-2 h-4 w-4" />
                                  Subiendo...
                                </>
                              ) : (
                                <>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Subir Logo Nombre
                                </>
                              )}
                            </span>
                          </Button>
                        </label>
                        <input
                          id="logo-name-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoNameUpload}
                        />
                      </div>
                      {systemBranding.logo_name_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setSystemBranding(prev => ({ ...prev, logo_name_url: null }))}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar Logo Nombre
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Formatos: PNG, JPG, SVG. Tamaño recomendado: 400x80px (horizontal)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="system_name">Nombre del Sistema</Label>
                      <Input
                        id="system_name"
                        value={systemBranding.system_name}
                        onChange={(e) => setSystemBranding(prev => ({ ...prev, system_name: e.target.value }))}
                        placeholder="Mi Sistema ERP"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tagline">Eslogan / Tagline</Label>
                      <Input
                        id="tagline"
                        value={systemBranding.tagline}
                        onChange={(e) => setSystemBranding(prev => ({ ...prev, tagline: e.target.value }))}
                        placeholder="Sistema de Gestión Empresarial"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="font_family">Tipografía</Label>
                    <Select
                      value={systemBranding.font_family}
                      onValueChange={(value) => setSystemBranding(prev => ({ ...prev, font_family: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una fuente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Open Sans">Open Sans</SelectItem>
                        <SelectItem value="Lato">Lato</SelectItem>
                        <SelectItem value="Montserrat">Montserrat</SelectItem>
                        <SelectItem value="Poppins">Poppins</SelectItem>
                        <SelectItem value="Source Sans Pro">Source Sans Pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Colores del Sistema */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Colores del Sistema
                  </CardTitle>
                  <CardDescription>
                    Define la paleta de colores que se aplicará en toda la interfaz del sistema.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>Color Primario</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={systemBranding.primary_color}
                          onChange={(e) => setSystemBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                          className="w-12 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={systemBranding.primary_color}
                          onChange={(e) => setSystemBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                          placeholder="#3B82F6"
                          className="font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Color Secundario</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={systemBranding.secondary_color}
                          onChange={(e) => setSystemBranding(prev => ({ ...prev, secondary_color: e.target.value }))}
                          className="w-12 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={systemBranding.secondary_color}
                          onChange={(e) => setSystemBranding(prev => ({ ...prev, secondary_color: e.target.value }))}
                          placeholder="#10B981"
                          className="font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Color de Acento</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={systemBranding.accent_color}
                          onChange={(e) => setSystemBranding(prev => ({ ...prev, accent_color: e.target.value }))}
                          className="w-12 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={systemBranding.accent_color}
                          onChange={(e) => setSystemBranding(prev => ({ ...prev, accent_color: e.target.value }))}
                          placeholder="#F59E0B"
                          className="font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Color de Texto</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={systemBranding.text_color}
                          onChange={(e) => setSystemBranding(prev => ({ ...prev, text_color: e.target.value }))}
                          className="w-12 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={systemBranding.text_color}
                          onChange={(e) => setSystemBranding(prev => ({ ...prev, text_color: e.target.value }))}
                          placeholder="#1F2937"
                          className="font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Color de Fondo</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={systemBranding.background_color}
                          onChange={(e) => setSystemBranding(prev => ({ ...prev, background_color: e.target.value }))}
                          className="w-12 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={systemBranding.background_color}
                          onChange={(e) => setSystemBranding(prev => ({ ...prev, background_color: e.target.value }))}
                          placeholder="#FFFFFF"
                          className="font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Color del Sidebar</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={systemBranding.sidebar_color}
                          onChange={(e) => setSystemBranding(prev => ({ ...prev, sidebar_color: e.target.value }))}
                          className="w-12 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={systemBranding.sidebar_color}
                          onChange={(e) => setSystemBranding(prev => ({ ...prev, sidebar_color: e.target.value }))}
                          placeholder="#1F2937"
                          className="font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vista Previa */}
                  <div className="mt-6 p-4 border rounded-lg">
                    <p className="text-sm font-medium mb-3">Vista Previa</p>
                    <div className="flex rounded-lg overflow-hidden border" style={{ height: "120px" }}>
                      {/* Sidebar Preview */}
                      <div 
                        className="w-16 p-2 flex flex-col items-center gap-2"
                        style={{ backgroundColor: systemBranding.sidebar_color }}
                      >
                        {systemBranding.logo_url ? (
                          <img 
                            src={getSystemLogoUrl(systemBranding.logo_url) || ""} 
                            alt="Logo" 
                            className="w-8 h-8 object-contain rounded"
                          />
                        ) : (
                          <div 
                            className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: systemBranding.primary_color }}
                          >
                            {systemBranding.system_name.charAt(0)}
                          </div>
                        )}
                        <div className="w-6 h-1 rounded" style={{ backgroundColor: systemBranding.primary_color }} />
                        <div className="w-6 h-1 rounded opacity-50" style={{ backgroundColor: "#fff" }} />
                        <div className="w-6 h-1 rounded opacity-50" style={{ backgroundColor: "#fff" }} />
                      </div>
                      {/* Content Preview */}
                      <div 
                        className="flex-1 p-3"
                        style={{ backgroundColor: systemBranding.background_color }}
                      >
                        <h4 
                          className="text-sm font-bold mb-1"
                          style={{ color: systemBranding.text_color }}
                        >
                          {systemBranding.system_name}
                        </h4>
                        <p 
                          className="text-xs mb-2"
                          style={{ color: systemBranding.secondary_color }}
                        >
                          {systemBranding.tagline}
                        </p>
                        <div className="flex gap-2">
                          <div 
                            className="px-2 py-1 rounded text-white text-xs"
                            style={{ backgroundColor: systemBranding.primary_color }}
                          >
                            Primario
                          </div>
                          <div 
                            className="px-2 py-1 rounded text-white text-xs"
                            style={{ backgroundColor: systemBranding.secondary_color }}
                          >
                            Secundario
                          </div>
                          <div 
                            className="px-2 py-1 rounded text-white text-xs"
                            style={{ backgroundColor: systemBranding.accent_color }}
                          >
                            Acento
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Botón Guardar */}
              <div className="flex justify-end">
                <Button onClick={handleSaveSystemBranding} disabled={savingSystem}>
                  {savingSystem ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar Configuración del Sistema
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* General Settings Tab */}
            <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Empresa</CardTitle>
              <CardDescription>Datos generales de la empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Nombre Comercial</Label>
                  <Input 
                    value={companySettings.company_name}
                    onChange={(e) => setCompanySettings({ ...companySettings, company_name: e.target.value })}
                    placeholder="Nombre de la empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Razón Social</Label>
                  <Input 
                    value={companySettings.legal_name}
                    onChange={(e) => setCompanySettings({ ...companySettings, legal_name: e.target.value })}
                    placeholder="Razón social completa"
                  />
                </div>
                <div className="space-y-2">
                  <Label>RFC</Label>
                  <Input 
                    value={companySettings.tax_id}
                    onChange={(e) => setCompanySettings({ ...companySettings, tax_id: e.target.value })}
                    placeholder="RFC de la empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subir Logotipo</Label>
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      {companySettings.logo_url ? (
                        <div className="relative w-24 h-24 rounded-lg border-2 overflow-hidden bg-white shadow-sm">
                          <img 
                            src={`/api/file?pathname=${encodeURIComponent(companySettings.logo_url)}`}
                            alt="Logo de la empresa" 
                            className="w-full h-full object-contain p-2"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center bg-muted/50 gap-1">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Sin logo</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="relative">
                        <Input
                          id="logo-upload"
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            
                            const formData = new FormData()
                            formData.append('file', file)
                            if (companySettings.logo_url) {
                              formData.append('oldPathname', companySettings.logo_url)
                            }
                            
                            try {
                              const res = await fetch('/api/upload/logo', {
                                method: 'POST',
                                body: formData
                              })
                              
                              if (!res.ok) {
                                const error = await res.json()
                                alert(error.error || 'Error al subir el logo')
                                return
                              }
                              
                              const { pathname } = await res.json()
                              setCompanySettings({ ...companySettings, logo_url: pathname })
                            } catch (error) {
                              console.error('Error uploading logo:', error)
                              alert('Error al subir el logo')
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => document.getElementById('logo-upload')?.click()}
                          className="w-full"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {companySettings.logo_url ? 'Cambiar Logo' : 'Subir Logo'}
                        </Button>
                      </div>
                      {companySettings.logo_url && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive w-full"
                          onClick={() => setCompanySettings({ ...companySettings, logo_url: '' })}
                        >
                          Eliminar logo
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">Formatos: PNG o JPG. Tamaño maximo: 5MB</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Textarea 
                  value={companySettings.address}
                  onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                  placeholder="Calle, número, colonia"
                />
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Ciudad</Label>
                  <Input 
                    value={companySettings.city}
                    onChange={(e) => setCompanySettings({ ...companySettings, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input 
                    value={companySettings.state}
                    onChange={(e) => setCompanySettings({ ...companySettings, state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>País</Label>
                  <Input 
                    value={companySettings.country}
                    onChange={(e) => setCompanySettings({ ...companySettings, country: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Código Postal</Label>
                  <Input 
                    value={companySettings.postal_code}
                    onChange={(e) => setCompanySettings({ ...companySettings, postal_code: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input 
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                    placeholder="+52 55 1234 5678"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={companySettings.email}
                    onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                    placeholder="contacto@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sitio Web</Label>
                  <Input 
                    value={companySettings.website}
                    onChange={(e) => setCompanySettings({ ...companySettings, website: e.target.value })}
                    placeholder="https://www.empresa.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferencias Regionales</CardTitle>
              <CardDescription>Configuración de zona horaria y formatos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Zona Horaria</Label>
                  <Select 
                    value={companySettings.timezone} 
                    onValueChange={(value) => setCompanySettings({ ...companySettings, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Formato de Fecha</Label>
                  <Select 
                    value={companySettings.date_format} 
                    onValueChange={(value) => setCompanySettings({ ...companySettings, date_format: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dateFormats.map((df) => (
                        <SelectItem key={df.value} value={df.value}>{df.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Inicio de Año Fiscal</Label>
                  <Select 
                    value={companySettings.fiscal_year_start.toString()} 
                    onValueChange={(value) => setCompanySettings({ ...companySettings, fiscal_year_start: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Color Primario</Label>
                  <div className="flex gap-2 items-center">
                    <div 
                      className="w-12 h-12 rounded-lg border shadow-sm cursor-pointer relative overflow-hidden"
                      style={{ backgroundColor: companySettings.primary_color || "#3b82f6" }}
                    >
                      <input 
                        type="color"
                        value={companySettings.primary_color || "#3b82f6"}
                        onChange={(e) => setCompanySettings({ ...companySettings, primary_color: e.target.value })}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                    <Input 
                      value={companySettings.primary_color || "#3b82f6"}
                      onChange={(e) => setCompanySettings({ ...companySettings, primary_color: e.target.value })}
                      className="flex-1 font-mono"
                      placeholder="#3b82f6"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Click en el cuadro para seleccionar color</p>
                </div>
                <div className="space-y-2">
                  <Label>Color Secundario</Label>
                  <div className="flex gap-2 items-center">
                    <div 
                      className="w-12 h-12 rounded-lg border shadow-sm cursor-pointer relative overflow-hidden"
                      style={{ backgroundColor: companySettings.secondary_color || "#1e40af" }}
                    >
                      <input 
                        type="color"
                        value={companySettings.secondary_color || "#1e40af"}
                        onChange={(e) => setCompanySettings({ ...companySettings, secondary_color: e.target.value })}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                    <Input 
                      value={companySettings.secondary_color || "#1e40af"}
                      onChange={(e) => setCompanySettings({ ...companySettings, secondary_color: e.target.value })}
                      className="flex-1 font-mono"
                      placeholder="#1e40af"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Click en el cuadro para seleccionar color</p>
                </div>
              </div>
              
              {/* Vista previa de colores */}
              <div className="mt-4 p-4 rounded-lg border bg-muted/30">
                <Label className="text-sm font-medium mb-3 block">Vista previa de colores</Label>
                <div className="flex gap-4 items-center">
                  <Button 
                    style={{ backgroundColor: companySettings.primary_color || "#3b82f6", borderColor: companySettings.primary_color || "#3b82f6" }}
                    className="text-white hover:opacity-90"
                  >
                    Botón Primario
                  </Button>
                  <Button 
                    style={{ backgroundColor: companySettings.secondary_color || "#1e40af", borderColor: companySettings.secondary_color || "#1e40af" }}
                    className="text-white hover:opacity-90"
                  >
                    Botón Secundario
                  </Button>
                  <div className="flex-1 h-8 rounded flex overflow-hidden border">
                    <div className="flex-1" style={{ backgroundColor: companySettings.primary_color || "#3b82f6" }} />
                    <div className="flex-1" style={{ backgroundColor: companySettings.secondary_color || "#1e40af" }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveCompanySettings} disabled={saving}>
              {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar Cambios
            </Button>
          </div>
        </TabsContent>

        

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Integraciones Externas</CardTitle>
                  <CardDescription>Conecta con servicios externos para ampliar las funcionalidades</CardDescription>
                </div>
                <Button onClick={() => setShowIntegrationDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Integración
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {integrations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Plug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay integraciones configuradas</p>
                  <p className="text-sm">Agrega una integración para conectar con servicios externos</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {integrations.map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${integration.is_active ? "bg-green-100" : "bg-gray-100"}`}>
                          <Plug className={`h-6 w-6 ${integration.is_active ? "text-green-600" : "text-gray-400"}`} />
                        </div>
                        <div>
                          <p className="font-medium">{integration.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">{integration.type}</p>
                          {integration.last_sync_at && (
                            <p className="text-xs text-muted-foreground">
                              Última sincronización: {format(new Date(integration.last_sync_at), "dd/MM/yyyy HH:mm", { locale: es })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {integration.sync_status === "error" && (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Error
                          </Badge>
                        )}
                        <Switch 
                          checked={integration.is_active}
                          onCheckedChange={(checked) => handleToggleIntegration(integration.id, checked)}
                        />
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteIntegration(integration.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Registro de Auditoría</CardTitle>
                  <CardDescription>Historial de todas las acciones realizadas en el sistema</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Select value={auditFilter.action} onValueChange={(value) => {
                    setAuditFilter({ ...auditFilter, action: value })
                    setTimeout(fetchAuditLogs, 100)
                  }}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Acción" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las acciones</SelectItem>
                      <SelectItem value="create">Crear</SelectItem>
                      <SelectItem value="update">Actualizar</SelectItem>
                      <SelectItem value="delete">Eliminar</SelectItem>
                      <SelectItem value="login">Iniciar sesión</SelectItem>
                      <SelectItem value="export">Exportar</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={auditFilter.entity_type} onValueChange={(value) => {
                    setAuditFilter({ ...auditFilter, entity_type: value })
                    setTimeout(fetchAuditLogs, 100)
                  }}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Entidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las entidades</SelectItem>
                      <SelectItem value="client">Cliente</SelectItem>
                      <SelectItem value="invoice">Factura</SelectItem>
                      <SelectItem value="payment">Pago</SelectItem>
                      <SelectItem value="expense">Gasto</SelectItem>
                      <SelectItem value="staff">Empleado</SelectItem>
                      <SelectItem value="project">Proyecto</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={fetchAuditLogs}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Entidad</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No hay registros de auditoría
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                        </TableCell>
                        <TableCell>{log.user_email || "Sistema"}</TableCell>
                        <TableCell>
                          <Badge className={getActionBadgeColor(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{log.entity_type}</TableCell>
                        <TableCell>{log.entity_name || "-"}</TableCell>
                        <TableCell className="font-mono text-xs">{log.ip_address || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Tab */}
        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Backup y Exportación</CardTitle>
                  <CardDescription>Crea respaldos de tus datos y exporta información</CardDescription>
                </div>
                <Button onClick={() => setShowBackupDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Backup
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Archivo</TableHead>
                    <TableHead>Tamaño</TableHead>
                    <TableHead>Tablas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backupHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No hay backups registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    backupHistory.map((backup) => (
                      <TableRow key={backup.id}>
                        <TableCell className="text-sm">
                          {format(new Date(backup.started_at), "dd/MM/yyyy HH:mm", { locale: es })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {backup.backup_type === "full" && <Database className="h-3 w-3 mr-1" />}
                            {backup.backup_type === "export" && <FileSpreadsheet className="h-3 w-3 mr-1" />}
                            {backup.backup_type === "partial" && <FileJson className="h-3 w-3 mr-1" />}
                            {backup.backup_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{backup.file_name}</TableCell>
                        <TableCell>{formatFileSize(backup.file_size_bytes)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {backup.tables_included?.length || 0} tablas
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(backup.status)}</TableCell>
                        <TableCell className="text-right">
                          {backup.status === "completed" && backup.file_url && (
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Currency Dialog */}
      <Dialog open={showCurrencyDialog} onOpenChange={setShowCurrencyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCurrency ? "Editar Moneda" : "Nueva Moneda"}</DialogTitle>
            <DialogDescription>
              {editingCurrency ? "Modifica los datos de la moneda" : "Agrega una nueva moneda al sistema"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input 
                  value={newCurrency.code}
                  onChange={(e) => setNewCurrency({ ...newCurrency, code: e.target.value.toUpperCase() })}
                  placeholder="USD, EUR, MXN"
                  maxLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Símbolo *</Label>
                <Input 
                  value={newCurrency.symbol}
                  onChange={(e) => setNewCurrency({ ...newCurrency, symbol: e.target.value })}
                  placeholder="$, €, £"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input 
                value={newCurrency.name}
                onChange={(e) => setNewCurrency({ ...newCurrency, name: e.target.value })}
                placeholder="Peso Mexicano, Dólar Estadounidense"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Cambio (respecto a la moneda predeterminada)</Label>
              <Input 
                type="number"
                step="0.0001"
                value={newCurrency.exchange_rate}
                onChange={(e) => setNewCurrency({ ...newCurrency, exchange_rate: parseFloat(e.target.value) || 1 })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={newCurrency.is_active}
                onCheckedChange={(checked) => setNewCurrency({ ...newCurrency, is_active: checked })}
              />
              <Label>Moneda activa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCurrencyDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveCurrency} disabled={!newCurrency.code || !newCurrency.name || !newCurrency.symbol}>
              {editingCurrency ? "Guardar Cambios" : "Crear Moneda"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Integration Dialog */}
      <Dialog open={showIntegrationDialog} onOpenChange={setShowIntegrationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar Integración</DialogTitle>
            <DialogDescription>Selecciona el servicio que deseas conectar</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
            {integrationProviders.map((provider) => (
              <div 
                key={provider.provider}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedProvider?.provider === provider.provider 
                    ? "border-primary bg-primary/5" 
                    : "hover:border-muted-foreground/50"
                }`}
                onClick={() => setSelectedProvider(provider)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                    <Plug className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{provider.name}</p>
                    <p className="text-sm text-muted-foreground">{provider.description}</p>
                    <Badge variant="outline" className="mt-2 text-xs capitalize">{provider.type}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowIntegrationDialog(false)
              setSelectedProvider(null)
            }}>
              Cancelar
            </Button>
            <Button onClick={handleAddIntegration} disabled={!selectedProvider}>
              Agregar Integración
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Dialog */}
      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Backup</DialogTitle>
            <DialogDescription>Selecciona el tipo de backup que deseas crear</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Backup</Label>
              <Select value={backupType} onValueChange={(value: "full" | "partial" | "export") => setBackupType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Backup Completo
                    </div>
                  </SelectItem>
                  <SelectItem value="partial">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-4 w-4" />
                      Backup Parcial
                    </div>
                  </SelectItem>
                  <SelectItem value="export">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Exportar a Excel
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {backupType !== "full" && (
              <div className="space-y-2">
                <Label>Tablas a incluir</Label>
                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto border rounded-lg p-3">
                  {availableTables.map((table) => (
                    <div key={table} className="flex items-center gap-2">
                      <input 
                        type="checkbox"
                        id={table}
                        checked={selectedTables.includes(table)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTables([...selectedTables, table])
                          } else {
                            setSelectedTables(selectedTables.filter(t => t !== table))
                          }
                        }}
                        className="rounded"
                      />
                      <label htmlFor={table} className="text-sm capitalize">{table.replace("_", " ")}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBackupDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateBackup} disabled={backupType !== "full" && selectedTables.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Crear Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
