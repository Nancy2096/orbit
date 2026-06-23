"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Phone,
  Building2,
  Megaphone,
  Share2,
  MessageSquare,
  Database,
  Calendar,
  Mail,
  MoreHorizontal,
  Check,
  X,
  Settings,
  ExternalLink,
  Search,
  Loader2,
  Plug,
  Zap,
  RefreshCw,
  Shield,
  Key,
} from "lucide-react"
import { toast } from "sonner"

// Integration categories and their integrations
const integrationCategories = [
  {
    id: "telephony",
    name: "Telefonía",
    icon: Phone,
    description: "Centralitas, VoIP y sistemas de llamadas",
    integrations: [
      { id: "twilio", name: "Twilio", description: "Llamadas VoIP, SMS y WhatsApp Business API", logo: "🔵", popular: true },
      { id: "aircall", name: "Aircall", description: "Sistema telefónico en la nube para equipos", logo: "🟢", popular: true },
      { id: "ringcentral", name: "RingCentral", description: "Comunicaciones unificadas empresariales", logo: "🟠" },
      { id: "vonage", name: "Vonage", description: "APIs de comunicación y mensajería", logo: "🟣" },
      { id: "dialpad", name: "Dialpad", description: "Centro de contacto con IA", logo: "🔵" },
      { id: "telnyx", name: "Telnyx", description: "Infraestructura de comunicaciones", logo: "🟢" },
      { id: "plivo", name: "Plivo", description: "APIs de voz y SMS", logo: "🟡" },
      { id: "bandwidth", name: "Bandwidth", description: "Comunicaciones empresariales", logo: "🔴" },
      { id: "callrail", name: "CallRail", description: "Seguimiento y análisis de llamadas", logo: "🟢", popular: true },
      { id: "justcall", name: "JustCall", description: "Sistema telefónico para ventas", logo: "🔵" },
    ]
  },
  {
    id: "real_estate_portals",
    name: "Portales Inmobiliarios",
    icon: Building2,
    description: "Conexión con portales de propiedades",
    integrations: [
      { id: "inmuebles24", name: "Inmuebles24", description: "Portal inmobiliario líder en México", logo: "🏠", popular: true },
      { id: "segundamano", name: "Segundamano", description: "Clasificados y bienes raíces", logo: "🟡" },
      { id: "vivanuncios", name: "Vivanuncios", description: "Portal de anuncios clasificados", logo: "🟣" },
      { id: "metros_cubicos", name: "Metros Cúbicos", description: "Portal inmobiliario especializado", logo: "🔵", popular: true },
      { id: "casas_y_terrenos", name: "Casas y Terrenos", description: "Portal de propiedades", logo: "🟢" },
      { id: "propiedades_com", name: "Propiedades.com", description: "Buscador de inmuebles", logo: "🔴" },
      { id: "easybroker", name: "EasyBroker", description: "CRM y portal inmobiliario", logo: "🟠", popular: true },
      { id: "nocnok", name: "Nocnok", description: "Red inmobiliaria MLS", logo: "🔵" },
      { id: "lamudi", name: "Lamudi", description: "Portal de bienes raíces", logo: "🟢" },
      { id: "trovit", name: "Trovit", description: "Buscador de inmuebles", logo: "🟡" },
      { id: "idealista", name: "Idealista", description: "Portal inmobiliario internacional", logo: "🟡" },
      { id: "zillow", name: "Zillow", description: "Portal inmobiliario USA", logo: "🔵" },
    ]
  },
  {
    id: "advertising",
    name: "Publicidad",
    icon: Megaphone,
    description: "Plataformas de ads y marketing",
    integrations: [
      { id: "meta_ads", name: "Meta Ads", description: "Facebook e Instagram Ads Manager", logo: "🔵", popular: true },
      { id: "google_ads", name: "Google Ads", description: "Publicidad en búsqueda y display", logo: "🟡", popular: true },
      { id: "tiktok_ads", name: "TikTok Ads", description: "Publicidad en TikTok", logo: "⚫", popular: true },
      { id: "linkedin_ads", name: "LinkedIn Ads", description: "Publicidad B2B profesional", logo: "🔵" },
      { id: "twitter_ads", name: "X Ads", description: "Publicidad en X (Twitter)", logo: "⚫" },
      { id: "microsoft_ads", name: "Microsoft Ads", description: "Bing y red de Microsoft", logo: "🔵" },
      { id: "snapchat_ads", name: "Snapchat Ads", description: "Publicidad en Snapchat", logo: "🟡" },
      { id: "pinterest_ads", name: "Pinterest Ads", description: "Publicidad visual en Pinterest", logo: "🔴" },
      { id: "taboola", name: "Taboola", description: "Publicidad nativa y contenido", logo: "🔵" },
      { id: "outbrain", name: "Outbrain", description: "Descubrimiento de contenido", logo: "🟠" },
    ]
  },
  {
    id: "social_media",
    name: "Redes Sociales",
    icon: Share2,
    description: "Gestión y publicación en redes",
    integrations: [
      { id: "facebook", name: "Facebook", description: "Páginas, Messenger y publicaciones", logo: "🔵", popular: true },
      { id: "instagram", name: "Instagram", description: "Feed, Stories y DMs", logo: "🟣", popular: true },
      { id: "whatsapp_business", name: "WhatsApp Business", description: "API oficial de WhatsApp", logo: "🟢", popular: true },
      { id: "tiktok", name: "TikTok", description: "Publicación y analytics", logo: "⚫" },
      { id: "linkedin", name: "LinkedIn", description: "Red profesional y Company Pages", logo: "🔵" },
      { id: "twitter", name: "X (Twitter)", description: "Tweets y mensajes directos", logo: "⚫" },
      { id: "youtube", name: "YouTube", description: "Videos y YouTube Studio", logo: "🔴" },
      { id: "hootsuite", name: "Hootsuite", description: "Gestión de redes sociales", logo: "🟡", popular: true },
      { id: "buffer", name: "Buffer", description: "Programación de publicaciones", logo: "🔵" },
      { id: "sprout_social", name: "Sprout Social", description: "Suite de social media", logo: "🟢" },
      { id: "later", name: "Later", description: "Planificación visual de contenido", logo: "🟠" },
    ]
  },
  {
    id: "communication",
    name: "Comunicación",
    icon: MessageSquare,
    description: "Chat, email y mensajería",
    integrations: [
      { id: "whatsapp_api", name: "WhatsApp API", description: "Mensajería masiva y automatizada", logo: "🟢", popular: true },
      { id: "telegram", name: "Telegram Bot", description: "Bots y canales de Telegram", logo: "🔵" },
      { id: "slack", name: "Slack", description: "Notificaciones y comandos", logo: "🟣", popular: true },
      { id: "microsoft_teams", name: "Microsoft Teams", description: "Integración con Teams", logo: "🔵" },
      { id: "intercom", name: "Intercom", description: "Chat en vivo y soporte", logo: "🔵", popular: true },
      { id: "zendesk", name: "Zendesk", description: "Soporte y tickets", logo: "🟢" },
      { id: "freshdesk", name: "Freshdesk", description: "Help desk y soporte", logo: "🟢" },
      { id: "drift", name: "Drift", description: "Chat conversacional B2B", logo: "🔵" },
      { id: "crisp", name: "Crisp", description: "Chat multicanal", logo: "🟣" },
      { id: "livechat", name: "LiveChat", description: "Chat en vivo para web", logo: "🟠" },
      { id: "sendgrid", name: "SendGrid", description: "Email transaccional y marketing", logo: "🔵", popular: true },
      { id: "mailchimp", name: "Mailchimp", description: "Email marketing y automatización", logo: "🟡", popular: true },
    ]
  },
  {
    id: "data",
    name: "Datos",
    icon: Database,
    description: "Analytics, BI y almacenamiento",
    integrations: [
      { id: "google_analytics", name: "Google Analytics", description: "Analytics de sitio web", logo: "🟠", popular: true },
      { id: "google_tag_manager", name: "Google Tag Manager", description: "Gestión de tags y eventos", logo: "🔵", popular: true },
      { id: "mixpanel", name: "Mixpanel", description: "Analytics de producto", logo: "🟣" },
      { id: "amplitude", name: "Amplitude", description: "Analytics de comportamiento", logo: "🔵" },
      { id: "segment", name: "Segment", description: "Customer Data Platform", logo: "🟢", popular: true },
      { id: "hotjar", name: "Hotjar", description: "Heatmaps y grabaciones", logo: "🔴" },
      { id: "looker_studio", name: "Looker Studio", description: "Dashboards y reportes", logo: "🔵" },
      { id: "tableau", name: "Tableau", description: "Visualización de datos", logo: "🔵" },
      { id: "power_bi", name: "Power BI", description: "Business Intelligence", logo: "🟡" },
      { id: "bigquery", name: "BigQuery", description: "Data warehouse de Google", logo: "🔵" },
      { id: "snowflake", name: "Snowflake", description: "Data cloud platform", logo: "🔵" },
      { id: "airtable", name: "Airtable", description: "Base de datos colaborativa", logo: "🟡" },
    ]
  },
  {
    id: "calendar",
    name: "Calendario",
    icon: Calendar,
    description: "Agendas y programación de citas",
    integrations: [
      { id: "google_calendar", name: "Google Calendar", description: "Calendario de Google Workspace", logo: "🔵", popular: true },
      { id: "outlook_calendar", name: "Outlook Calendar", description: "Calendario de Microsoft 365", logo: "🔵", popular: true },
      { id: "calendly", name: "Calendly", description: "Programación de reuniones", logo: "🔵", popular: true },
      { id: "cal_com", name: "Cal.com", description: "Scheduling open source", logo: "⚫" },
      { id: "hubspot_meetings", name: "HubSpot Meetings", description: "Agenda integrada con CRM", logo: "🟠" },
      { id: "acuity", name: "Acuity Scheduling", description: "Citas y reservaciones", logo: "🟢" },
      { id: "doodle", name: "Doodle", description: "Encuestas de disponibilidad", logo: "🟢" },
      { id: "savvycal", name: "SavvyCal", description: "Scheduling personalizado", logo: "🔵" },
      { id: "reclaim", name: "Reclaim.ai", description: "Gestión inteligente de tiempo", logo: "🔵" },
      { id: "clockwise", name: "Clockwise", description: "Optimización de calendarios", logo: "🟢" },
    ]
  },
  {
    id: "google_suite",
    name: "Google Suite",
    icon: Mail,
    description: "Herramientas de Google Workspace",
    integrations: [
      { id: "gmail", name: "Gmail", description: "Correo electrónico y seguimiento", logo: "🔴", popular: true },
      { id: "google_drive", name: "Google Drive", description: "Almacenamiento de archivos", logo: "🟡", popular: true },
      { id: "google_docs", name: "Google Docs", description: "Documentos colaborativos", logo: "🔵" },
      { id: "google_sheets", name: "Google Sheets", description: "Hojas de cálculo", logo: "🟢", popular: true },
      { id: "google_forms", name: "Google Forms", description: "Formularios y encuestas", logo: "🟣" },
      { id: "google_meet", name: "Google Meet", description: "Videoconferencias", logo: "🟢", popular: true },
      { id: "google_chat", name: "Google Chat", description: "Mensajería de equipo", logo: "🟢" },
      { id: "google_contacts", name: "Google Contacts", description: "Sincronización de contactos", logo: "🔵" },
      { id: "google_tasks", name: "Google Tasks", description: "Lista de tareas", logo: "🔵" },
      { id: "google_maps", name: "Google Maps", description: "Ubicaciones y direcciones", logo: "🟢" },
    ]
  },
  {
    id: "others",
    name: "Otros",
    icon: MoreHorizontal,
    description: "Integraciones adicionales",
    integrations: [
      { id: "zapier", name: "Zapier", description: "Automatización entre apps", logo: "🟠", popular: true },
      { id: "make", name: "Make (Integromat)", description: "Automatización avanzada", logo: "🟣", popular: true },
      { id: "n8n", name: "n8n", description: "Workflow automation open source", logo: "🟠" },
      { id: "hubspot", name: "HubSpot CRM", description: "Sincronización bidireccional", logo: "🟠" },
      { id: "salesforce", name: "Salesforce", description: "Integración enterprise CRM", logo: "🔵" },
      { id: "pipedrive", name: "Pipedrive", description: "Sincronización de deals", logo: "🟢" },
      { id: "stripe", name: "Stripe", description: "Pagos y suscripciones", logo: "🟣", popular: true },
      { id: "paypal", name: "PayPal", description: "Procesamiento de pagos", logo: "🔵" },
      { id: "mercadopago", name: "Mercado Pago", description: "Pagos en LATAM", logo: "🔵", popular: true },
      { id: "docusign", name: "DocuSign", description: "Firma electrónica", logo: "🟡" },
      { id: "pandadoc", name: "PandaDoc", description: "Propuestas y contratos", logo: "🟢" },
      { id: "notion", name: "Notion", description: "Documentación y wikis", logo: "⚫" },
      { id: "asana", name: "Asana", description: "Gestión de proyectos", logo: "🟠" },
      { id: "trello", name: "Trello", description: "Tableros kanban", logo: "🔵" },
      { id: "monday", name: "Monday.com", description: "Work management", logo: "🔴" },
      { id: "jira", name: "Jira", description: "Gestión de proyectos ágiles", logo: "🔵" },
    ]
  },
]

// Store connected integrations
interface ConnectedIntegration {
  id: string
  integrationId: string
  categoryId: string
  connectedAt: string
  status: 'active' | 'error' | 'pending'
  config: Record<string, string>
  lastSync?: string
}

export default function CRMIntegrationsPage() {
  const [activeTab, setActiveTab] = useState("telephony")
  const [searchQuery, setSearchQuery] = useState("")

  // Permite abrir una categoría específica desde un enlace externo (ej. ?tab=google_suite)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get("tab")
    if (tab && integrationCategories.some((c) => c.id === tab)) {
      setActiveTab(tab)
    }
  }, [])
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<{
    category: typeof integrationCategories[0]
    integration: typeof integrationCategories[0]['integrations'][0]
  } | null>(null)
  const [connecting, setConnecting] = useState(false)
  
  // Mock connected integrations (in production, this would come from database)
  const [connectedIntegrations, setConnectedIntegrations] = useState<ConnectedIntegration[]>([
    {
      id: "1",
      integrationId: "whatsapp_business",
      categoryId: "social_media",
      connectedAt: "2024-01-15",
      status: "active",
      config: { phoneNumber: "+52 55 1234 5678" },
      lastSync: "2024-01-20T10:30:00"
    },
    {
      id: "2",
      integrationId: "google_calendar",
      categoryId: "calendar",
      connectedAt: "2024-01-10",
      status: "active",
      config: { email: "ventas@empresa.com" },
      lastSync: "2024-01-20T09:00:00"
    },
    {
      id: "3",
      integrationId: "meta_ads",
      categoryId: "advertising",
      connectedAt: "2024-01-05",
      status: "error",
      config: { accountId: "act_123456789" },
    },
  ])

  const [configFields, setConfigFields] = useState<Record<string, string>>({})

  const isConnected = (integrationId: string) => {
    return connectedIntegrations.some(ci => ci.integrationId === integrationId)
  }

  const getConnectionStatus = (integrationId: string) => {
    return connectedIntegrations.find(ci => ci.integrationId === integrationId)
  }

  const handleConnect = (category: typeof integrationCategories[0], integration: typeof integrationCategories[0]['integrations'][0]) => {
    setSelectedIntegration({ category, integration })
    setConfigFields({})
    setConfigModalOpen(true)
  }

  const handleDisconnect = (integrationId: string) => {
    setConnectedIntegrations(prev => prev.filter(ci => ci.integrationId !== integrationId))
    toast.success("Integración desconectada")
  }

  const handleSaveConnection = async () => {
    if (!selectedIntegration) return
    
    setConnecting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const newConnection: ConnectedIntegration = {
      id: crypto.randomUUID(),
      integrationId: selectedIntegration.integration.id,
      categoryId: selectedIntegration.category.id,
      connectedAt: new Date().toISOString().split('T')[0],
      status: 'active',
      config: configFields,
      lastSync: new Date().toISOString()
    }
    
    setConnectedIntegrations(prev => [...prev, newConnection])
    setConnecting(false)
    setConfigModalOpen(false)
    toast.success(`${selectedIntegration.integration.name} conectado exitosamente`)
  }

  const handleResync = async (integrationId: string) => {
    toast.info("Sincronizando...")
    await new Promise(resolve => setTimeout(resolve, 1000))
    setConnectedIntegrations(prev => prev.map(ci => 
      ci.integrationId === integrationId 
        ? { ...ci, lastSync: new Date().toISOString(), status: 'active' as const }
        : ci
    ))
    toast.success("Sincronización completada")
  }

  const getConfigFields = (integrationId: string): { key: string; label: string; type: string; placeholder: string }[] => {
    const configMap: Record<string, { key: string; label: string; type: string; placeholder: string }[]> = {
      // Telephony
      twilio: [
        { key: "accountSid", label: "Account SID", type: "text", placeholder: "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" },
        { key: "authToken", label: "Auth Token", type: "password", placeholder: "Tu auth token de Twilio" },
        { key: "phoneNumber", label: "Número de teléfono", type: "text", placeholder: "+52 55 1234 5678" },
      ],
      aircall: [
        { key: "apiId", label: "API ID", type: "text", placeholder: "Tu API ID" },
        { key: "apiToken", label: "API Token", type: "password", placeholder: "Tu API Token" },
      ],
      // WhatsApp
      whatsapp_business: [
        { key: "phoneNumberId", label: "Phone Number ID", type: "text", placeholder: "ID del número de WhatsApp" },
        { key: "accessToken", label: "Access Token", type: "password", placeholder: "Token de acceso de Meta" },
        { key: "webhookVerifyToken", label: "Webhook Verify Token", type: "text", placeholder: "Token de verificación" },
      ],
      whatsapp_api: [
        { key: "phoneNumberId", label: "Phone Number ID", type: "text", placeholder: "ID del número de WhatsApp" },
        { key: "accessToken", label: "Access Token", type: "password", placeholder: "Token de acceso de Meta" },
      ],
      // Advertising
      meta_ads: [
        { key: "accessToken", label: "Access Token", type: "password", placeholder: "Token de acceso de Meta" },
        { key: "adAccountId", label: "Ad Account ID", type: "text", placeholder: "act_XXXXXXXXXX" },
      ],
      google_ads: [
        { key: "developerToken", label: "Developer Token", type: "password", placeholder: "Token de desarrollador" },
        { key: "clientId", label: "Client ID", type: "text", placeholder: "ID de cliente OAuth" },
        { key: "clientSecret", label: "Client Secret", type: "password", placeholder: "Secret de cliente OAuth" },
        { key: "customerId", label: "Customer ID", type: "text", placeholder: "XXX-XXX-XXXX" },
      ],
      // Google Suite
      gmail: [
        { key: "clientId", label: "Client ID", type: "text", placeholder: "ID de cliente OAuth" },
        { key: "clientSecret", label: "Client Secret", type: "password", placeholder: "Secret OAuth" },
      ],
      google_calendar: [
        { key: "clientId", label: "Client ID", type: "text", placeholder: "ID de cliente OAuth" },
        { key: "clientSecret", label: "Client Secret", type: "password", placeholder: "Secret OAuth" },
      ],
      google_drive: [
        { key: "clientId", label: "Client ID", type: "text", placeholder: "ID de cliente OAuth" },
        { key: "clientSecret", label: "Client Secret", type: "password", placeholder: "Secret OAuth" },
      ],
      // Communication
      sendgrid: [
        { key: "apiKey", label: "API Key", type: "password", placeholder: "SG.XXXXXXXXXXXX" },
        { key: "fromEmail", label: "Email remitente", type: "email", placeholder: "noreply@tudominio.com" },
      ],
      mailchimp: [
        { key: "apiKey", label: "API Key", type: "password", placeholder: "XXXXXXXXXXXXXXXX-usX" },
        { key: "serverPrefix", label: "Server Prefix", type: "text", placeholder: "us1, us2, etc." },
      ],
      slack: [
        { key: "botToken", label: "Bot Token", type: "password", placeholder: "xoxb-XXXXXXXXXXXX" },
        { key: "signingSecret", label: "Signing Secret", type: "password", placeholder: "Signing secret de tu app" },
      ],
      // Real Estate
      inmuebles24: [
        { key: "apiKey", label: "API Key", type: "password", placeholder: "Tu API Key de Inmuebles24" },
        { key: "clientId", label: "Client ID", type: "text", placeholder: "ID de cliente" },
      ],
      easybroker: [
        { key: "apiKey", label: "API Key", type: "password", placeholder: "Tu API Key de EasyBroker" },
      ],
      // Automation
      zapier: [
        { key: "webhookUrl", label: "Webhook URL", type: "url", placeholder: "https://hooks.zapier.com/..." },
      ],
      make: [
        { key: "webhookUrl", label: "Webhook URL", type: "url", placeholder: "https://hook.make.com/..." },
      ],
      // Payments
      stripe: [
        { key: "secretKey", label: "Secret Key", type: "password", placeholder: "sk_live_XXXXXXXXXXXX" },
        { key: "webhookSecret", label: "Webhook Secret", type: "password", placeholder: "whsec_XXXXXXXXXXXX" },
      ],
      mercadopago: [
        { key: "accessToken", label: "Access Token", type: "password", placeholder: "Tu access token de Mercado Pago" },
        { key: "publicKey", label: "Public Key", type: "text", placeholder: "Tu public key" },
      ],
      // Analytics
      google_analytics: [
        { key: "measurementId", label: "Measurement ID", type: "text", placeholder: "G-XXXXXXXXXX" },
        { key: "apiSecret", label: "API Secret", type: "password", placeholder: "Secret de Measurement Protocol" },
      ],
      segment: [
        { key: "writeKey", label: "Write Key", type: "password", placeholder: "Tu write key de Segment" },
      ],
    }
    return configMap[integrationId] || [
      { key: "apiKey", label: "API Key", type: "password", placeholder: "Tu API Key" },
    ]
  }

  const filteredCategories = integrationCategories.map(category => ({
    ...category,
    integrations: category.integrations.filter(integration =>
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.integrations.length > 0)

  const activeCategory = integrationCategories.find(c => c.id === activeTab)
  const totalConnected = connectedIntegrations.length
  const activeConnections = connectedIntegrations.filter(c => c.status === 'active').length
  const errorConnections = connectedIntegrations.filter(c => c.status === 'error').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integraciones CRM</h1>
          <p className="text-muted-foreground">
            Conecta tus herramientas favoritas para potenciar tu CRM
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar integración..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-[300px] pl-9"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Plug className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalConnected}</p>
                <p className="text-sm text-muted-foreground">Conectadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeConnections}</p>
                <p className="text-sm text-muted-foreground">Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <X className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{errorConnections}</p>
                <p className="text-sm text-muted-foreground">Con errores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{integrationCategories.reduce((acc, c) => acc + c.integrations.length, 0)}</p>
                <p className="text-sm text-muted-foreground">Disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex h-auto p-1 bg-muted/50">
            {integrationCategories.map((category) => {
              const Icon = category.icon
              const connectedCount = connectedIntegrations.filter(ci => ci.categoryId === category.id).length
              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-background"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{category.name}</span>
                  {connectedCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {connectedCount}
                    </Badge>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        {integrationCategories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <category.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <h2 className="font-semibold">{category.name}</h2>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(searchQuery ? filteredCategories.find(c => c.id === category.id)?.integrations : category.integrations)?.map((integration) => {
                const connectionStatus = getConnectionStatus(integration.id)
                const connected = !!connectionStatus
                
                return (
                  <Card 
                    key={integration.id} 
                    className={`relative overflow-hidden transition-all hover:shadow-md ${
                      connected ? 'ring-2 ring-green-500/20' : ''
                    }`}
                  >
                    {integration.popular && !connected && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs">Popular</Badge>
                      </div>
                    )}
                    {connected && (
                      <div className="absolute top-2 right-2">
                        <Badge 
                          variant={connectionStatus?.status === 'active' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {connectionStatus?.status === 'active' ? (
                            <><Check className="h-3 w-3 mr-1" /> Conectado</>
                          ) : connectionStatus?.status === 'error' ? (
                            <><X className="h-3 w-3 mr-1" /> Error</>
                          ) : (
                            'Pendiente'
                          )}
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{integration.logo}</div>
                        <div>
                          <CardTitle className="text-base">{integration.name}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {integration.description}
                      </p>
                      
                      {connected && connectionStatus?.lastSync && (
                        <p className="text-xs text-muted-foreground mb-3">
                          Última sync: {new Date(connectionStatus.lastSync).toLocaleString('es-ES')}
                        </p>
                      )}
                      
                      <div className="flex gap-2">
                        {connected ? (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleResync(integration.id)}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Sincronizar
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleConnect(category, integration)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDisconnect(integration.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleConnect(category, integration)}
                          >
                            <Plug className="h-4 w-4 mr-2" />
                            Conectar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Configuration Modal */}
      <Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedIntegration?.integration.logo}</span>
              Configurar {selectedIntegration?.integration.name}
            </DialogTitle>
            <DialogDescription>
              Ingresa las credenciales necesarias para conectar esta integración con tu CRM.
            </DialogDescription>
          </DialogHeader>
          
          {selectedIntegration && (
            <div className="space-y-4 mt-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-start gap-2">
                  <Key className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Credenciales seguras</p>
                    <p className="text-blue-700">Tus credenciales se almacenan de forma encriptada y segura.</p>
                  </div>
                </div>
              </div>
              
              {getConfigFields(selectedIntegration.integration.id).map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input
                    id={field.key}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={configFields[field.key] || ""}
                    onChange={(e) => setConfigFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                  />
                </div>
              ))}
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sincronización automática</Label>
                  <p className="text-xs text-muted-foreground">Sincronizar datos cada hora</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setConfigModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveConnection} disabled={connecting}>
                  {connecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Guardar y Conectar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
