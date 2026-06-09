"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Building2,
  Palette,
  Bell,
  Shield,
  Database,
  Webhook,
  Mail,
  Globe,
  Save,
  Upload,
  Layers,
} from "lucide-react"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    companyName: "Mi Empresa",
    timezone: "America/Mexico_City",
    language: "es",
    dateFormat: "DD/MM/YYYY",
    emailNotifications: true,
    pushNotifications: true,
    weeklyReport: true,
    taskReminders: true,
    twoFactorAuth: false,
    sessionTimeout: "30",
    ipWhitelist: false,
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">
            Administra la configuración de Orbit TasksFlow
          </p>
        </div>
        <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
          <Save className="h-4 w-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="general" className="gap-2">
            <Building2 className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Apariencia
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Webhook className="h-4 w-4" />
            Integraciones
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Organización</CardTitle>
              <CardDescription>
                Configura los datos básicos de tu organización
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Layers className="h-10 w-10 text-white" />
                </div>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Cambiar Logo
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG o SVG. Máximo 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre de la Organización</Label>
                  <Input
                    value={settings.companyName}
                    onChange={(e) =>
                      setSettings({ ...settings, companyName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dominio</Label>
                  <Input value="miempresa.orbittasksflow.com" disabled />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Zona Horaria</Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) =>
                      setSettings({ ...settings, timezone: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Mexico_City">
                        Ciudad de México (GMT-6)
                      </SelectItem>
                      <SelectItem value="America/Bogota">
                        Bogotá (GMT-5)
                      </SelectItem>
                      <SelectItem value="America/Buenos_Aires">
                        Buenos Aires (GMT-3)
                      </SelectItem>
                      <SelectItem value="Europe/Madrid">
                        Madrid (GMT+1)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value) =>
                      setSettings({ ...settings, language: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Formato de Fecha</Label>
                <Select
                  value={settings.dateFormat}
                  onValueChange={(value) =>
                    setSettings({ ...settings, dateFormat: value })
                  }
                >
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personalización Visual</CardTitle>
              <CardDescription>
                Personaliza la apariencia de tu espacio de trabajo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Color Principal</Label>
                <div className="flex gap-2">
                  {["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"].map(
                    (color) => (
                      <button
                        key={color}
                        className="h-8 w-8 rounded-full border-2 border-transparent hover:border-gray-400 transition-colors"
                        style={{ backgroundColor: color }}
                      />
                    )
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Tema</Label>
                <div className="grid grid-cols-3 gap-4">
                  <Card className="cursor-pointer border-2 border-primary">
                    <CardContent className="p-4">
                      <div className="h-20 bg-white rounded border mb-2" />
                      <p className="text-sm font-medium text-center">Claro</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary">
                    <CardContent className="p-4">
                      <div className="h-20 bg-gray-900 rounded border mb-2" />
                      <p className="text-sm font-medium text-center">Oscuro</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-primary">
                    <CardContent className="p-4">
                      <div className="h-20 bg-gradient-to-b from-white to-gray-900 rounded border mb-2" />
                      <p className="text-sm font-medium text-center">Sistema</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Notificaciones</CardTitle>
              <CardDescription>
                Configura cómo y cuándo recibir notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe actualizaciones importantes por correo
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, emailNotifications: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones Push</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe notificaciones en tiempo real
                  </p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, pushNotifications: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Reporte Semanal</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe un resumen semanal de actividad
                  </p>
                </div>
                <Switch
                  checked={settings.weeklyReport}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, weeklyReport: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Recordatorios de Tareas</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe recordatorios antes de las fechas límite
                  </p>
                </div>
                <Switch
                  checked={settings.taskReminders}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, taskReminders: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Seguridad</CardTitle>
              <CardDescription>
                Protege tu cuenta y datos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Autenticación de Dos Factores</Label>
                  <p className="text-sm text-muted-foreground">
                    Añade una capa extra de seguridad
                  </p>
                </div>
                <Switch
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, twoFactorAuth: checked })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Tiempo de Sesión Inactiva</Label>
                <Select
                  value={settings.sessionTimeout}
                  onValueChange={(value) =>
                    setSettings({ ...settings, sessionTimeout: value })
                  }
                >
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Lista Blanca de IPs</Label>
                  <p className="text-sm text-muted-foreground">
                    Restringir acceso solo a IPs autorizadas
                  </p>
                </div>
                <Switch
                  checked={settings.ipWhitelist}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, ipWhitelist: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Settings */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integraciones</CardTitle>
              <CardDescription>
                Conecta con otras herramientas y servicios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "Slack", description: "Notificaciones en canales", connected: true },
                  { name: "Google Drive", description: "Adjuntar archivos", connected: true },
                  { name: "Jira", description: "Sincronizar tareas", connected: false },
                  { name: "GitHub", description: "Vincular commits", connected: false },
                  { name: "Zapier", description: "Automatizaciones", connected: false },
                  { name: "Webhooks", description: "API personalizada", connected: true },
                ].map((integration) => (
                  <Card key={integration.name}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{integration.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {integration.description}
                        </p>
                      </div>
                      <Button
                        variant={integration.connected ? "outline" : "default"}
                        size="sm"
                      >
                        {integration.connected ? "Configurar" : "Conectar"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
