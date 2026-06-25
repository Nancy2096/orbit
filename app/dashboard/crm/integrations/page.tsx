"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Mail,
  Calendar,
  Video,
  Check,
  Loader2,
  RefreshCw,
  Megaphone,
  MessageSquare,
  Copy,
  Link2,
  Facebook,
  Zap,
  Globe,
  ArrowRight,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"
import { useAgency } from "@/contexts/agency-context"

export default function CRMIntegrationsPage() {
  const { selectedAgencyId } = useAgency()
  const [activeTab, setActiveTab] = useState("communication")

  // --- Comunicación: Google Workspace (OAuth real por usuario) ---
  const [googleConnection, setGoogleConnection] = useState<{
    connected: boolean
    configured: boolean
    email: string | null
    lastSync: string | null
    loading: boolean
  }>({ connected: false, configured: true, email: null, lastSync: null, loading: true })

  const fetchGoogleStatus = async () => {
    try {
      const res = await fetch("/api/google/status")
      if (res.ok) {
        const data = await res.json()
        setGoogleConnection({
          connected: Boolean(data.connected),
          configured: Boolean(data.configured),
          email: data.email ?? null,
          lastSync: data.lastSync ?? null,
          loading: false,
        })
        return
      }
    } catch (err) {
      console.log("[v0] Error obteniendo estado de Google:", err)
    }
    setGoogleConnection((prev) => ({ ...prev, loading: false }))
  }

  // --- Publicidad: webhook de captura de leads ---
  const [webhookToken, setWebhookToken] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [origin, setOrigin] = useState("")

  const fetchWebhookToken = async (agencyId: string) => {
    setTokenLoading(true)
    try {
      const res = await fetch(`/api/crm/webhook-token?agencyId=${agencyId}`)
      if (res.ok) {
        const data = await res.json()
        setWebhookToken(data.token ?? null)
      }
    } catch (err) {
      console.log("[v0] Error obteniendo token del webhook:", err)
    }
    setTokenLoading(false)
  }

  const regenerateToken = async () => {
    if (!selectedAgencyId) return
    setTokenLoading(true)
    try {
      const res = await fetch("/api/crm/webhook-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId: selectedAgencyId }),
      })
      if (res.ok) {
        const data = await res.json()
        setWebhookToken(data.token ?? null)
        toast.success("Se generó un nuevo enlace de captura de leads")
      } else {
        toast.error("No se pudo regenerar el enlace")
      }
    } catch {
      toast.error("No se pudo regenerar el enlace")
    }
    setTokenLoading(false)
  }

  useEffect(() => {
    setOrigin(window.location.origin)

    const params = new URLSearchParams(window.location.search)
    const tab = params.get("tab")
    if (tab === "communication" || tab === "advertising") {
      setActiveTab(tab)
    }

    const googleResult = params.get("google")
    if (googleResult === "connected") {
      toast.success("Google Workspace conectado exitosamente")
    } else if (googleResult === "error") {
      toast.error("No se pudo conectar Google Workspace")
    } else if (googleResult === "not_configured") {
      toast.error("Google no está configurado. Falta agregar las credenciales OAuth.")
    }
    if (googleResult) {
      window.history.replaceState({}, "", window.location.pathname + (tab ? `?tab=${tab}` : ""))
    }

    fetchGoogleStatus()
  }, [])

  useEffect(() => {
    if (selectedAgencyId) {
      void fetchWebhookToken(selectedAgencyId)
    }
  }, [selectedAgencyId])

  const handleConnectGoogle = () => {
    window.location.href = "/api/google/connect"
  }

  const handleDisconnectGoogle = async () => {
    const res = await fetch("/api/google/disconnect", { method: "POST" })
    if (res.ok) {
      setGoogleConnection((prev) => ({ ...prev, connected: false, email: null, lastSync: null }))
      toast.success("Google Workspace desconectado")
    } else {
      toast.error("No se pudo desconectar Google Workspace")
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado`)
  }

  const webhookUrl = webhookToken ? `${origin}/api/crm/inbound/${webhookToken}` : ""

  const googleCapabilities = [
    { icon: Mail, title: "Correo (Gmail)", desc: "Envía correos a tus prospectos desde tu cuenta de Google" },
    { icon: Calendar, title: "Calendario", desc: "Agenda reuniones que aparecen en tu Google Calendar" },
    { icon: Video, title: "Google Meet", desc: "Crea enlaces de videollamada automáticamente al agendar" },
  ]

  const adChannels = [
    {
      id: "meta",
      name: "Meta Ads",
      icon: Facebook,
      color: "text-blue-600",
      bg: "bg-blue-50",
      desc: "Facebook e Instagram Lead Ads",
      steps: [
        "En Meta Business Suite, abre Instant Forms de tu campaña.",
        "Conecta un CRM y elige la opción de Webhook personalizado.",
        "Pega el enlace de captura de arriba como URL de destino.",
      ],
    },
    {
      id: "google",
      name: "Google Ads",
      icon: Megaphone,
      color: "text-amber-600",
      bg: "bg-amber-50",
      desc: "Formularios de generación de leads",
      steps: [
        "En Google Ads, ve a tu extensión o campaña de formularios de leads.",
        "En 'Datos de clientes potenciales' selecciona Webhook.",
        "Pega el enlace de captura como URL del webhook y guarda.",
      ],
    },
    {
      id: "zapier",
      name: "Zapier",
      icon: Zap,
      color: "text-orange-600",
      bg: "bg-orange-50",
      desc: "Conecta cualquier app a Orbit",
      steps: [
        "Crea un Zap con la app que genera tus leads como disparador.",
        "Agrega una acción 'Webhooks by Zapier' tipo POST.",
        "Usa el enlace de captura como URL y mapea nombre, correo y teléfono.",
      ],
    },
    {
      id: "webform",
      name: "Formularios Web",
      icon: Globe,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      desc: "Formularios de tu página web",
      steps: [
        "En tu formulario web, configura el envío (action) por POST.",
        "Apunta el envío al enlace de captura de arriba.",
        "Incluye campos: name (o contact_name), email y phone.",
      ],
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integraciones</h1>
        <p className="text-muted-foreground">
          Conecta tus herramientas de comunicación y tus fuentes de publicidad con Orbit
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="communication" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Comunicación
          </TabsTrigger>
          <TabsTrigger value="advertising" className="gap-2">
            <Megaphone className="h-4 w-4" />
            Publicidad
          </TabsTrigger>
        </TabsList>

        {/* ============ COMUNICACIÓN ============ */}
        <TabsContent value="communication" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                    {/* Marca de Google con sus colores */}
                    <svg className="h-7 w-7" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Google Workspace
                      {googleConnection.connected && (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          <Check className="mr-1 h-3 w-3" />
                          Conectado
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1 max-w-xl">
                      Conecta tu cuenta una sola vez para habilitar Correo, Calendario y Google Meet.
                      Así puedes enviar correos y agendar reuniones desde Orbit usando tu cuenta de Google.
                    </CardDescription>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {googleConnection.loading ? (
                    <Button disabled variant="outline">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cargando
                    </Button>
                  ) : googleConnection.connected ? (
                    <>
                      <Button variant="outline" size="icon" onClick={fetchGoogleStatus} aria-label="Actualizar estado">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" onClick={handleDisconnectGoogle}>
                        Desconectar
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleConnectGoogle} disabled={!googleConnection.configured}>
                      <Link2 className="mr-2 h-4 w-4" />
                      Conectar Google Workspace
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!googleConnection.configured && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Google no está configurado todavía. Es necesario agregar las credenciales OAuth
                  (GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET) para habilitar la conexión.
                </div>
              )}

              {googleConnection.connected && googleConnection.email && (
                <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Cuenta conectada:</span>
                  <span className="font-medium text-foreground">{googleConnection.email}</span>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                {googleCapabilities.map((cap) => (
                  <div
                    key={cap.title}
                    className="flex flex-col gap-2 rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-2">
                      <cap.icon className="h-5 w-5 text-foreground" />
                      <span className="font-medium">{cap.title}</span>
                      {googleConnection.connected && (
                        <Check className="ml-auto h-4 w-4 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{cap.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ PUBLICIDAD ============ */}
        <TabsContent value="advertising" className="space-y-6">
          {/* Enlace de captura */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Enlace de captura de leads
              </CardTitle>
              <CardDescription className="max-w-2xl">
                Usa este enlace en Meta, Google, Zapier o tus formularios web. Cada lead recibido se
                crea automáticamente como prospecto en la sección de Prospectos de esta agencia.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedAgencyId ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Selecciona una agencia para generar su enlace de captura de leads.
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      readOnly
                      value={tokenLoading ? "Generando enlace..." : webhookUrl}
                      className="font-mono text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(webhookUrl, "Enlace")}
                        disabled={!webhookUrl}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar
                      </Button>
                      <Button variant="outline" onClick={regenerateToken} disabled={tokenLoading}>
                        {tokenLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        <span className="ml-2 hidden sm:inline">Regenerar</span>
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      Este enlace es secreto. Si lo regeneras, deberás actualizarlo en las plataformas
                      donde lo hayas pegado. Los envíos aceptan los campos{" "}
                      <code className="rounded bg-background px-1">name</code>,{" "}
                      <code className="rounded bg-background px-1">email</code> y{" "}
                      <code className="rounded bg-background px-1">phone</code>.
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Canales de publicidad */}
          <div className="grid gap-4 md:grid-cols-2">
            {adChannels.map((channel) => (
              <Card key={channel.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${channel.bg}`}>
                      <channel.icon className={`h-6 w-6 ${channel.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{channel.name}</CardTitle>
                      <CardDescription>{channel.desc}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {channel.steps.map((step, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                          {i + 1}
                        </span>
                        <span className="text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <ArrowRight className="h-4 w-4" />
                    Los leads llegan a{" "}
                    <span className="font-medium text-foreground">Prospectos</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
