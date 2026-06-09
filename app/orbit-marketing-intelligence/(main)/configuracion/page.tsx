"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Settings, 
  Bell, 
  Palette, 
  Globe, 
  Key, 
  Database, 
  Mail, 
  Shield,
  Clock,
  DollarSign,
  Building2,
  Save,
  RefreshCw,
  Trash2,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Check,
  AlertTriangle
} from "lucide-react"

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [showApiKey, setShowApiKey] = useState(false)
  const [settings, setSettings] = useState({
    general: {
      companyName: "Mi Empresa",
      timezone: "America/Mexico_City",
      dateFormat: "DD/MM/YYYY",
      currency: "MXN",
      language: "es"
    },
    notifications: {
      emailAlerts: true,
      pushNotifications: true,
      slackIntegration: false,
      dailyDigest: true,
      weeklyReport: true,
      alertThreshold: "medium"
    },
    appearance: {
      theme: "system",
      compactMode: false,
      showAnimations: true,
      dashboardLayout: "grid"
    },
    dataRetention: {
      rawDataDays: 90,
      aggregatedDataMonths: 24,
      auditLogMonths: 12,
      autoCleanup: true
    },
    api: {
      apiKey: "mi_sk_live_xxxxxxxxxxxxxxxxxxxxx",
      webhookUrl: "https://mi-empresa.com/webhooks/marketing-intelligence",
      rateLimitPerMinute: 100,
      enableWebhooks: true
    },
    security: {
      twoFactorRequired: false,
      sessionTimeoutMinutes: 30,
      ipWhitelist: "",
      passwordExpireDays: 90
    }
  })

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configuracion</h1>
            <p className="text-muted-foreground">
              Personaliza Marketing Intelligence segun las necesidades de tu empresa
            </p>
          </div>
          <Button onClick={handleSave} className="gap-2">
            {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Guardado" : "Guardar Cambios"}
          </Button>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 w-full max-w-4xl">
            <TabsTrigger value="general" className="gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notificaciones
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              Apariencia
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Database className="h-4 w-4" />
              Datos
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Key className="h-4 w-4" />
              API
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Seguridad
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informacion de la Empresa
                </CardTitle>
                <CardDescription>
                  Configura los datos basicos de tu organizacion
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre de la Empresa</Label>
                    <Input 
                      value={settings.general.companyName}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, companyName: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Idioma</Label>
                    <Select 
                      value={settings.general.language}
                      onValueChange={(v) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, language: v }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">Espanol</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="pt">Portugues</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Zona Horaria
                    </Label>
                    <Select 
                      value={settings.general.timezone}
                      onValueChange={(v) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, timezone: v }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Mexico_City">Ciudad de Mexico (GMT-6)</SelectItem>
                        <SelectItem value="America/New_York">Nueva York (GMT-5)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Los Angeles (GMT-8)</SelectItem>
                        <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                        <SelectItem value="America/Bogota">Bogota (GMT-5)</SelectItem>
                        <SelectItem value="America/Buenos_Aires">Buenos Aires (GMT-3)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Formato de Fecha
                    </Label>
                    <Select 
                      value={settings.general.dateFormat}
                      onValueChange={(v) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, dateFormat: v }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Moneda
                    </Label>
                    <Select 
                      value={settings.general.currency}
                      onValueChange={(v) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, currency: v }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                        <SelectItem value="USD">USD - Dolar Americano</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
                        <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Preferencias de Notificaciones
                </CardTitle>
                <CardDescription>
                  Configura como y cuando recibir alertas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Alertas por Email</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe alertas importantes en tu correo
                      </p>
                    </div>
                    <Switch 
                      checked={settings.notifications.emailAlerts}
                      onCheckedChange={(v) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, emailAlerts: v }
                      }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificaciones Push</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificaciones en tiempo real en el navegador
                      </p>
                    </div>
                    <Switch 
                      checked={settings.notifications.pushNotifications}
                      onCheckedChange={(v) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, pushNotifications: v }
                      }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Integracion con Slack</Label>
                      <p className="text-sm text-muted-foreground">
                        Envia alertas a un canal de Slack
                      </p>
                    </div>
                    <Switch 
                      checked={settings.notifications.slackIntegration}
                      onCheckedChange={(v) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, slackIntegration: v }
                      }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Resumen Diario</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe un resumen de metricas cada manana
                      </p>
                    </div>
                    <Switch 
                      checked={settings.notifications.dailyDigest}
                      onCheckedChange={(v) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, dailyDigest: v }
                      }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Reporte Semanal</Label>
                      <p className="text-sm text-muted-foreground">
                        Reporte completo cada lunes
                      </p>
                    </div>
                    <Switch 
                      checked={settings.notifications.weeklyReport}
                      onCheckedChange={(v) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, weeklyReport: v }
                      }))}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Umbral de Alertas</Label>
                  <Select 
                    value={settings.notifications.alertThreshold}
                    onValueChange={(v) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, alertThreshold: v }
                    }))}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Bajo - Todas las alertas</SelectItem>
                      <SelectItem value="medium">Medio - Solo importantes</SelectItem>
                      <SelectItem value="high">Alto - Solo criticas</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Define que tan sensibles son las alertas automaticas
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Personalizacion Visual
                </CardTitle>
                <CardDescription>
                  Ajusta la apariencia de la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <div className="flex gap-4">
                    {[
                      { value: "light", label: "Claro" },
                      { value: "dark", label: "Oscuro" },
                      { value: "system", label: "Sistema" }
                    ].map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          appearance: { ...prev.appearance, theme: theme.value }
                        }))}
                        className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                          settings.appearance.theme === theme.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="text-center">
                          <div className={`w-8 h-8 mx-auto mb-2 rounded-full ${
                            theme.value === "light" ? "bg-amber-100 border border-amber-300" :
                            theme.value === "dark" ? "bg-slate-800 border border-slate-600" :
                            "bg-gradient-to-r from-amber-100 to-slate-800"
                          }`} />
                          <span className="text-sm font-medium">{theme.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Modo Compacto</Label>
                      <p className="text-sm text-muted-foreground">
                        Reduce el espaciado para ver mas contenido
                      </p>
                    </div>
                    <Switch 
                      checked={settings.appearance.compactMode}
                      onCheckedChange={(v) => setSettings(prev => ({
                        ...prev,
                        appearance: { ...prev.appearance, compactMode: v }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Animaciones</Label>
                      <p className="text-sm text-muted-foreground">
                        Habilita transiciones y animaciones suaves
                      </p>
                    </div>
                    <Switch 
                      checked={settings.appearance.showAnimations}
                      onCheckedChange={(v) => setSettings(prev => ({
                        ...prev,
                        appearance: { ...prev.appearance, showAnimations: v }
                      }))}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Layout del Dashboard</Label>
                  <Select 
                    value={settings.appearance.dashboardLayout}
                    onValueChange={(v) => setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, dashboardLayout: v }
                    }))}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Cuadricula</SelectItem>
                      <SelectItem value="list">Lista</SelectItem>
                      <SelectItem value="cards">Tarjetas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Retention Settings */}
          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Retencion de Datos
                </CardTitle>
                <CardDescription>
                  Configura por cuanto tiempo se almacenan los datos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Datos en Bruto</Label>
                    <Select 
                      value={settings.dataRetention.rawDataDays.toString()}
                      onValueChange={(v) => setSettings(prev => ({
                        ...prev,
                        dataRetention: { ...prev.dataRetention, rawDataDays: parseInt(v) }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 dias</SelectItem>
                        <SelectItem value="60">60 dias</SelectItem>
                        <SelectItem value="90">90 dias</SelectItem>
                        <SelectItem value="180">180 dias</SelectItem>
                        <SelectItem value="365">1 ano</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Datos granulares de APIs y conectores
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Datos Agregados</Label>
                    <Select 
                      value={settings.dataRetention.aggregatedDataMonths.toString()}
                      onValueChange={(v) => setSettings(prev => ({
                        ...prev,
                        dataRetention: { ...prev.dataRetention, aggregatedDataMonths: parseInt(v) }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12 meses</SelectItem>
                        <SelectItem value="24">24 meses</SelectItem>
                        <SelectItem value="36">36 meses</SelectItem>
                        <SelectItem value="60">5 anos</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Metricas agregadas diarias/mensuales
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Registros de Auditoria</Label>
                    <Select 
                      value={settings.dataRetention.auditLogMonths.toString()}
                      onValueChange={(v) => setSettings(prev => ({
                        ...prev,
                        dataRetention: { ...prev.dataRetention, auditLogMonths: parseInt(v) }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">6 meses</SelectItem>
                        <SelectItem value="12">12 meses</SelectItem>
                        <SelectItem value="24">24 meses</SelectItem>
                        <SelectItem value="36">36 meses</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Historial de acciones de usuarios
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Limpieza Automatica</Label>
                    <p className="text-sm text-muted-foreground">
                      Elimina automaticamente datos que excedan el periodo de retencion
                    </p>
                  </div>
                  <Switch 
                    checked={settings.dataRetention.autoCleanup}
                    onCheckedChange={(v) => setSettings(prev => ({
                      ...prev,
                      dataRetention: { ...prev.dataRetention, autoCleanup: v }
                    }))}
                  />
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800 dark:text-amber-200">Importante</h4>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Reducir los periodos de retencion puede afectar reportes historicos y analisis de tendencias a largo plazo.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Settings */}
          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Configuracion de API
                </CardTitle>
                <CardDescription>
                  Gestiona el acceso programatico a Marketing Intelligence
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input 
                        type={showApiKey ? "text" : "password"}
                        value={settings.api.apiKey}
                        readOnly
                        className="pr-10 font-mono"
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button variant="outline" size="icon">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Regenerar
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Usa esta clave para autenticar solicitudes a la API
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Habilitar Webhooks</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe eventos en tiempo real via HTTP
                      </p>
                    </div>
                    <Switch 
                      checked={settings.api.enableWebhooks}
                      onCheckedChange={(v) => setSettings(prev => ({
                        ...prev,
                        api: { ...prev.api, enableWebhooks: v }
                      }))}
                    />
                  </div>

                  {settings.api.enableWebhooks && (
                    <div className="space-y-2">
                      <Label>URL del Webhook</Label>
                      <Input 
                        value={settings.api.webhookUrl}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          api: { ...prev.api, webhookUrl: e.target.value }
                        }))}
                        placeholder="https://tu-servidor.com/webhooks/mi"
                      />
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Limite de Solicitudes (por minuto)</Label>
                  <Select 
                    value={settings.api.rateLimitPerMinute.toString()}
                    onValueChange={(v) => setSettings(prev => ({
                      ...prev,
                      api: { ...prev.api, rateLimitPerMinute: parseInt(v) }
                    }))}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">60 req/min</SelectItem>
                      <SelectItem value="100">100 req/min</SelectItem>
                      <SelectItem value="500">500 req/min</SelectItem>
                      <SelectItem value="1000">1000 req/min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Documentacion de la API</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Consulta la documentacion completa para integrar Marketing Intelligence con tus sistemas.
                  </p>
                  <Button variant="outline" size="sm">
                    Ver Documentacion
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Seguridad
                </CardTitle>
                <CardDescription>
                  Configura las politicas de seguridad de la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Autenticacion de Dos Factores Obligatoria</Label>
                    <p className="text-sm text-muted-foreground">
                      Requiere 2FA para todos los usuarios
                    </p>
                  </div>
                  <Switch 
                    checked={settings.security.twoFactorRequired}
                    onCheckedChange={(v) => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, twoFactorRequired: v }
                    }))}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Tiempo de Sesion (minutos)</Label>
                    <Select 
                      value={settings.security.sessionTimeoutMinutes.toString()}
                      onValueChange={(v) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, sessionTimeoutMinutes: parseInt(v) }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                        <SelectItem value="480">8 horas</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Cierra sesion automaticamente despues de inactividad
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Expiracion de Contrasena (dias)</Label>
                    <Select 
                      value={settings.security.passwordExpireDays.toString()}
                      onValueChange={(v) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, passwordExpireDays: parseInt(v) }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 dias</SelectItem>
                        <SelectItem value="60">60 dias</SelectItem>
                        <SelectItem value="90">90 dias</SelectItem>
                        <SelectItem value="0">Nunca</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Fuerza el cambio periodico de contrasenas
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Lista Blanca de IPs</Label>
                  <Textarea 
                    value={settings.security.ipWhitelist}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, ipWhitelist: e.target.value }
                    }))}
                    placeholder="192.168.1.1&#10;10.0.0.0/24&#10;(Una IP o rango por linea)"
                    className="font-mono"
                  />
                  <p className="text-sm text-muted-foreground">
                    Deja vacio para permitir acceso desde cualquier IP
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="h-5 w-5" />
                  Zona de Peligro
                </CardTitle>
                <CardDescription>
                  Acciones irreversibles que afectan todos los datos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <div>
                    <h4 className="font-medium text-red-800 dark:text-red-200">Eliminar Todos los Datos</h4>
                    <p className="text-sm text-red-600 dark:text-red-300">
                      Borra permanentemente todos los datos de la plataforma
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Eliminar Todo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  )
}
