"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  Shield,
  Bell,
  Lock,
  Camera,
  Save,
  CheckCircle,
  Clock,
  FolderKanban,
  ListTodo,
} from "lucide-react"

const PROFILE_STORAGE_KEY = "orbit-tasksflow-profile"
const NOTIFICATIONS_STORAGE_KEY = "orbit-tasksflow-notifications"

const defaultProfile = {
  name: "María García",
  email: "maria.garcia@empresa.com",
  phone: "+52 55 1234 5678",
  location: "Ciudad de México, México",
  department: "Gestión de Proyectos",
  role: "Administrador",
  bio: "Project Manager con 5 años de experiencia en gestión de proyectos digitales y equipos multidisciplinarios.",
  joinDate: "15 de Enero, 2023",
  timezone: "America/Mexico_City",
  language: "es",
}

const defaultNotifications = {
  emailTasks: true,
  emailComments: true,
  emailDeadlines: true,
  pushTasks: true,
  pushComments: false,
  pushDeadlines: true,
  weeklyReport: true,
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  
  const [profile, setProfile] = useState(defaultProfile)
  const [notifications, setNotifications] = useState(defaultNotifications)

  // Cargar datos del localStorage al montar
  useEffect(() => {
    const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY)
    const savedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
    
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile))
      } catch (e) {
        console.error("Error loading profile:", e)
      }
    }
    
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications))
      } catch (e) {
        console.error("Error loading notifications:", e)
      }
    }
    
    setIsLoaded(true)
  }, [])

  const stats = {
    projectsActive: 8,
    tasksCompleted: 156,
    tasksInProgress: 12,
    hoursLogged: 342,
  }

  const recentActivity = [
    { action: "Completó tarea", item: "Diseño de wireframes", time: "Hace 2 horas", project: "Rediseño Web" },
    { action: "Comentó en", item: "Revisión de contenido", time: "Hace 4 horas", project: "Campaña Q1" },
    { action: "Creó tarea", item: "Implementar formulario", time: "Ayer", project: "Portal Cliente" },
    { action: "Actualizó", item: "Cronograma del proyecto", time: "Hace 2 días", project: "App Móvil" },
  ]

  const handleSave = async () => {
    setIsSaving(true)
    // Guardar en localStorage
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsSaving(false)
    setIsEditing(false)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleSaveNotifications = async () => {
    setIsSaving(true)
    // Guardar en localStorage
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications))
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsSaving(false)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  if (!isLoaded) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Cargando perfil...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mi Perfil</h1>
          <p className="text-muted-foreground">Gestiona tu información personal y preferencias</p>
        </div>
        {showSuccess && (
          <Badge className="bg-green-100 text-green-700 gap-1">
            <CheckCircle className="h-3 w-3" />
            Cambios guardados
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback className="text-2xl">MG</AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="mt-4 text-xl font-semibold">{profile.name}</h2>
              <p className="text-muted-foreground">{profile.department}</p>
              <Badge className="mt-2 bg-purple-100 text-purple-700">{profile.role}</Badge>
              
              <Separator className="my-4 w-full" />
              
              <div className="w-full space-y-3 text-left">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{profile.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{profile.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{profile.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Desde {profile.joinDate}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <FolderKanban className="h-5 w-5 mx-auto text-indigo-600" />
                <p className="text-2xl font-bold mt-1">{stats.projectsActive}</p>
                <p className="text-xs text-muted-foreground">Proyectos Activos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-5 w-5 mx-auto text-green-600" />
                <p className="text-2xl font-bold mt-1">{stats.tasksCompleted}</p>
                <p className="text-xs text-muted-foreground">Tareas Completadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <ListTodo className="h-5 w-5 mx-auto text-amber-600" />
                <p className="text-2xl font-bold mt-1">{stats.tasksInProgress}</p>
                <p className="text-xs text-muted-foreground">En Progreso</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-5 w-5 mx-auto text-blue-600" />
                <p className="text-2xl font-bold mt-1">{stats.hoursLogged}</p>
                <p className="text-xs text-muted-foreground">Horas Registradas</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Card>
            <Tabs defaultValue="info" className="w-full">
              <CardHeader className="pb-0">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Información</TabsTrigger>
                  <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
                  <TabsTrigger value="security">Seguridad</TabsTrigger>
                </TabsList>
              </CardHeader>
              
              <CardContent className="pt-6">
                {/* Info Tab */}
                <TabsContent value="info" className="mt-0 space-y-4">
                  <div className="flex justify-end">
                    {!isEditing ? (
                      <Button variant="outline" onClick={() => setIsEditing(true)}>
                        Editar Perfil
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                          <Save className="h-4 w-4 mr-2" />
                          {isSaving ? "Guardando..." : "Guardar"}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre completo</Label>
                      <Input
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Correo electrónico</Label>
                      <Input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <Input
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ubicación</Label>
                      <Input
                        value={profile.location}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Zona horaria</Label>
                      <Select
                        value={profile.timezone}
                        onValueChange={(value) => setProfile({ ...profile, timezone: value })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/Mexico_City">Ciudad de México (GMT-6)</SelectItem>
                          <SelectItem value="America/New_York">Nueva York (GMT-5)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Los Ángeles (GMT-8)</SelectItem>
                          <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Idioma</Label>
                      <Select
                        value={profile.language}
                        onValueChange={(value) => setProfile({ ...profile, language: value })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Biografía</Label>
                    <Textarea
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      disabled={!isEditing}
                      rows={3}
                    />
                  </div>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="mt-0 space-y-6">
                  <div>
                    <h3 className="font-medium mb-4">Notificaciones por Email</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Asignación de tareas</p>
                          <p className="text-sm text-muted-foreground">Recibe un email cuando te asignen una tarea</p>
                        </div>
                        <Switch
                          checked={notifications.emailTasks}
                          onCheckedChange={(checked) => setNotifications({ ...notifications, emailTasks: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Comentarios</p>
                          <p className="text-sm text-muted-foreground">Recibe un email cuando comenten en tus tareas</p>
                        </div>
                        <Switch
                          checked={notifications.emailComments}
                          onCheckedChange={(checked) => setNotifications({ ...notifications, emailComments: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Fechas límite</p>
                          <p className="text-sm text-muted-foreground">Recibe recordatorios de fechas próximas</p>
                        </div>
                        <Switch
                          checked={notifications.emailDeadlines}
                          onCheckedChange={(checked) => setNotifications({ ...notifications, emailDeadlines: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Reporte semanal</p>
                          <p className="text-sm text-muted-foreground">Recibe un resumen semanal de tu actividad</p>
                        </div>
                        <Switch
                          checked={notifications.weeklyReport}
                          onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReport: checked })}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium mb-4">Notificaciones Push</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Asignación de tareas</p>
                          <p className="text-sm text-muted-foreground">Notificación instantánea al asignarte tareas</p>
                        </div>
                        <Switch
                          checked={notifications.pushTasks}
                          onCheckedChange={(checked) => setNotifications({ ...notifications, pushTasks: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Comentarios</p>
                          <p className="text-sm text-muted-foreground">Notificación instantánea de nuevos comentarios</p>
                        </div>
                        <Switch
                          checked={notifications.pushComments}
                          onCheckedChange={(checked) => setNotifications({ ...notifications, pushComments: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Fechas límite</p>
                          <p className="text-sm text-muted-foreground">Alertas de tareas próximas a vencer</p>
                        </div>
                        <Switch
                          checked={notifications.pushDeadlines}
                          onCheckedChange={(checked) => setNotifications({ ...notifications, pushDeadlines: checked })}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveNotifications} disabled={isSaving}>
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? "Guardando..." : "Guardar Notificaciones"}
                    </Button>
                  </div>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="mt-0 space-y-6">
                  <div>
                    <h3 className="font-medium mb-4">Cambiar Contraseña</h3>
                    <div className="space-y-4 max-w-md">
                      <div className="space-y-2">
                        <Label>Contraseña actual</Label>
                        <Input type="password" placeholder="••••••••" />
                      </div>
                      <div className="space-y-2">
                        <Label>Nueva contraseña</Label>
                        <Input type="password" placeholder="••••••••" />
                      </div>
                      <div className="space-y-2">
                        <Label>Confirmar nueva contraseña</Label>
                        <Input type="password" placeholder="••••••••" />
                      </div>
                      <Button>
                        <Lock className="h-4 w-4 mr-2" />
                        Actualizar Contraseña
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium mb-4">Sesiones Activas</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Este dispositivo</p>
                            <p className="text-xs text-muted-foreground">Chrome en macOS - Ciudad de México</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700">Activa</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">iPhone 14</p>
                            <p className="text-xs text-muted-foreground">Safari en iOS - Hace 2 días</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Cerrar</Button>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium mb-2">Autenticación de dos factores</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Añade una capa extra de seguridad a tu cuenta
                    </p>
                    <Button variant="outline">
                      <Shield className="h-4 w-4 mr-2" />
                      Configurar 2FA
                    </Button>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actividad Reciente</CardTitle>
              <CardDescription>Tu actividad en los últimos días</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="text-muted-foreground">{activity.action}</span>{" "}
                        <span className="font-medium">{activity.item}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.project} • {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
