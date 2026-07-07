"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, User, Lock, Shield, Building2, Camera, Briefcase, Mail, Phone, MapPin, Info, Calendar, FileText } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { StaffAvatar } from "@/components/staff-avatar"
import { StaffEditForm } from "@/components/hr/staff-edit-form"
import { toast } from "sonner"

interface StaffProfile {
  id: string
  user_id: string | null
  first_name: string
  last_name: string
  email: string
  phone: string | null
  photo_url: string | null
  position: string
  department: string | null
  hire_date: string | null
  contract_type: string
  personal_email: string | null
  personal_phone: string | null
  address_street: string | null
  address_colony: string | null
  address_city: string | null
  address_state: string | null
  address_zip: string | null
  address_country: string | null
  emergency_contact_name: string | null
  emergency_contact_relationship: string | null
  emergency_contact_phone: string | null
  emergency_contact_email: string | null
  agency: { name: string } | null
  agencies: { name: string }[] | null
  is_global: boolean
  role: { display_name: string } | null
}

interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  is_active: boolean
  is_global_access: boolean
  created_at: string
  role_id: string | null
  role: {
    id: string
    name: string
    display_name: string
  } | null
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [staff, setStaff] = useState<StaffProfile | null>(null)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    photo_url: "",
    personal_email: "",
    personal_phone: "",
    address_street: "",
    address_colony: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    address_country: "México",
    emergency_contact_name: "",
    emergency_contact_relationship: "",
    emergency_contact_phone: "",
    emergency_contact_email: "",
  })
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })
  const supabase = createClient()

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    setLoading(true)
    
    // Get current auth user
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      setLoading(false)
      return
    }

    // Get user profile from users table
    const { data: userData } = await supabase
      .from("users")
      .select(`
        *,
        role:roles(id, name, display_name)
      `)
      .eq("id", authUser.id)
      .single()

    if (userData) {
      setUser(userData)
    }

    // Buscar la ficha de Personal vinculada a este usuario.
    // Primero por user_id; si no existe (muchas fichas no tienen user_id
    // asignado), se intenta por email como respaldo.
    const staffSelect = `
        *,
        agency:agencies(name),
        role:roles(display_name)
      `

    let staffData: any = null
    const { data: staffByUserId } = await supabase
      .from("staff")
      .select(staffSelect)
      .eq("user_id", authUser.id)
      .maybeSingle()

    staffData = staffByUserId

    const emailToMatch = userData?.email || authUser.email
    if (!staffData && emailToMatch) {
      // Usar limit(1) en vez de maybeSingle() para que, aunque existiera más de
      // una ficha con el mismo email, no falle la carga del perfil (importante
      // para el personal Global, que suele no tener user_id asignado).
      const { data: staffByEmail } = await supabase
        .from("staff")
        .select(staffSelect)
        .ilike("email", emailToMatch)
        .limit(1)
      staffData = staffByEmail?.[0] ?? null

      // Vincular la ficha al usuario para futuras cargas (no bloquea la UI).
      if (staffData && !staffData.user_id) {
        await supabase.from("staff").update({ user_id: authUser.id }).eq("id", staffData.id)
      }
    }

    if (staffData) {
      setStaff(staffData)
      // Si hay staff vinculado, usar esos datos
      setFormData({
        first_name: staffData.first_name || "",
        last_name: staffData.last_name || "",
        photo_url: staffData.photo_url || "",
        personal_email: staffData.personal_email || "",
        personal_phone: staffData.personal_phone || "",
        address_street: staffData.address_street || "",
        address_colony: staffData.address_colony || "",
        address_city: staffData.address_city || "",
        address_state: staffData.address_state || "",
        address_zip: staffData.address_zip || "",
        address_country: staffData.address_country || "México",
        emergency_contact_name: staffData.emergency_contact_name || "",
        emergency_contact_relationship: staffData.emergency_contact_relationship || "",
        emergency_contact_phone: staffData.emergency_contact_phone || "",
        emergency_contact_email: staffData.emergency_contact_email || "",
      })
    } else if (userData) {
      // Si no hay staff, usar datos del usuario
      setFormData({
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        photo_url: userData.avatar_url || "",
        personal_email: "",
        personal_phone: "",
        address_street: "",
        address_colony: "",
        address_city: "",
        address_state: "",
        address_zip: "",
        address_country: "México",
        emergency_contact_name: "",
        emergency_contact_relationship: "",
        emergency_contact_phone: "",
        emergency_contact_email: "",
      })
    }

    setLoading(false)
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)

    try {
      const formDataUpload = new FormData()
      formDataUpload.append("file", file)
      formDataUpload.append("oldUrl", formData.photo_url || "")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      })

      if (!response.ok) {
        throw new Error("Error al subir la imagen")
      }

      const data = await response.json()
      setFormData({ ...formData, photo_url: data.url })
      toast.success("Foto actualizada")
    } catch {
      toast.error("Error al subir la foto")
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    setSaving(true)

    try {
      // Si hay staff vinculado, actualizar staff
      if (staff) {
        const { error: staffError } = await supabase
          .from("staff")
          .update({
            first_name: formData.first_name || null,
            last_name: formData.last_name || null,
            photo_url: formData.photo_url || null,
            personal_email: formData.personal_email || null,
            personal_phone: formData.personal_phone || null,
            address_street: formData.address_street || null,
            address_colony: formData.address_colony || null,
            address_city: formData.address_city || null,
            address_state: formData.address_state || null,
            address_zip: formData.address_zip || null,
            address_country: formData.address_country || null,
            emergency_contact_name: formData.emergency_contact_name || null,
            emergency_contact_relationship: formData.emergency_contact_relationship || null,
            emergency_contact_phone: formData.emergency_contact_phone || null,
            emergency_contact_email: formData.emergency_contact_email || null,
          })
          .eq("id", staff.id)

        if (staffError) throw staffError

        // Sincronizar con tabla users
        await supabase
          .from("users")
          .update({
            first_name: formData.first_name || null,
            last_name: formData.last_name || null,
            avatar_url: formData.photo_url || null,
          })
          .eq("id", user.id)
      } else {
        // Solo actualizar users si no hay staff
        const { error } = await supabase
          .from("users")
          .update({
            first_name: formData.first_name || null,
            last_name: formData.last_name || null,
            avatar_url: formData.photo_url || null,
          })
          .eq("id", user.id)

        if (error) throw error
      }

      toast.success("Perfil actualizado correctamente")
      fetchProfile()
    } catch {
      toast.error("Error al actualizar el perfil")
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    if (passwordData.new_password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setSaving(true)

    const { error } = await supabase.auth.updateUser({
      password: passwordData.new_password,
    })

    if (error) {
      toast.error("Error al cambiar la contraseña: " + error.message)
    } else {
      toast.success("Contraseña actualizada correctamente")
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      })
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No se pudo cargar el perfil</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Gestiona tu información personal y configuración de cuenta
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <User className="h-4 w-4" />
            General
          </TabsTrigger>
          {staff && (
            <TabsTrigger value="personal" className="gap-2">
              <MapPin className="h-4 w-4" />
              Datos Personales
            </TabsTrigger>
          )}
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="info" className="gap-2">
            <Info className="h-4 w-4" />
            Información
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <form onSubmit={handleSaveProfile}>
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
                <CardDescription>
                  Tu información básica de perfil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Photo */}
                <div className="flex items-center gap-6">
                  <StaffAvatar
                    photoUrl={formData.photo_url}
                    firstName={formData.first_name || "?"}
                    lastName={formData.last_name || "?"}
                    className="h-24 w-24"
                    fallbackClassName="text-2xl"
                  />
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingPhoto}
                        onClick={() => document.getElementById("photo-upload")?.click()}
                      >
                        {uploadingPhoto ? (
                          <Spinner className="h-4 w-4 mr-2" />
                        ) : (
                          <Camera className="h-4 w-4 mr-2" />
                        )}
                        Cambiar foto
                      </Button>
                      {formData.photo_url && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData({ ...formData, photo_url: "" })}
                        >
                          Quitar
                        </Button>
                      )}
                    </div>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG o GIF. Máximo 5MB.
                    </p>
                  </div>
                </div>

                {/* Name fields */}
                <FieldGroup>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="first_name">Nombre</FieldLabel>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        placeholder="Tu nombre"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="last_name">Apellido</FieldLabel>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        placeholder="Tu apellido"
                      />
                    </Field>
                  </div>
                </FieldGroup>

                {/* Read-only info */}
                <div className="pt-4 border-t space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Correo Electrónico</p>
                      <p className="text-sm flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {user.email}
                      </p>
                    </div>
                    {staff?.phone && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                        <p className="text-sm flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {staff.phone}
                        </p>
                      </div>
                    )}
                  </div>

                  {staff && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Puesto</p>
                        <p className="text-sm flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          {staff.position}
                        </p>
                      </div>
                      {staff.department && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Departamento</p>
                          <p className="text-sm">{staff.department}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Rol en el Sistema</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary">
                          {staff?.role?.display_name || user.role?.display_name || "Sin rol"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Agencia(s)</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {staff?.is_global || user.is_global_access ? (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            Global (todas las agencias)
                          </Badge>
                        ) : staff?.agency ? (
                          <Badge variant="outline">{staff.agency.name}</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin asignar</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {staff?.hire_date && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Fecha de Ingreso</p>
                      <p className="text-sm">
                        {new Date(staff.hire_date).toLocaleDateString("es-MX", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? <Spinner className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Guardar Cambios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {staff && (
          <TabsContent value="personal">
            <form onSubmit={handleSaveProfile}>
              <div className="space-y-6">
                {/* Contact personal */}
                <Card>
                  <CardHeader>
                    <CardTitle>Información de Contacto Personal</CardTitle>
                    <CardDescription>
                      Datos de contacto personales (diferentes al correo corporativo)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FieldGroup>
                      <div className="grid grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel htmlFor="personal_email">Correo Personal</FieldLabel>
                          <Input
                            id="personal_email"
                            type="email"
                            value={formData.personal_email}
                            onChange={(e) => setFormData({ ...formData, personal_email: e.target.value })}
                            placeholder="correo@personal.com"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="personal_phone">Teléfono Personal</FieldLabel>
                          <Input
                            id="personal_phone"
                            value={formData.personal_phone}
                            onChange={(e) => setFormData({ ...formData, personal_phone: e.target.value })}
                            placeholder="+52 55 1234 5678"
                          />
                        </Field>
                      </div>
                    </FieldGroup>
                  </CardContent>
                </Card>

                {/* Address */}
                <Card>
                  <CardHeader>
                    <CardTitle>Dirección</CardTitle>
                    <CardDescription>
                      Tu dirección de domicilio actual
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="address_street">Calle y Número</FieldLabel>
                        <Input
                          id="address_street"
                          value={formData.address_street}
                          onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                          placeholder="Av. Principal #123"
                        />
                      </Field>
                      <div className="grid grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel htmlFor="address_colony">Colonia</FieldLabel>
                          <Input
                            id="address_colony"
                            value={formData.address_colony}
                            onChange={(e) => setFormData({ ...formData, address_colony: e.target.value })}
                            placeholder="Centro"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="address_city">Ciudad</FieldLabel>
                          <Input
                            id="address_city"
                            value={formData.address_city}
                            onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
                            placeholder="Ciudad de México"
                          />
                        </Field>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <Field>
                          <FieldLabel htmlFor="address_state">Estado</FieldLabel>
                          <Input
                            id="address_state"
                            value={formData.address_state}
                            onChange={(e) => setFormData({ ...formData, address_state: e.target.value })}
                            placeholder="CDMX"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="address_zip">Código Postal</FieldLabel>
                          <Input
                            id="address_zip"
                            value={formData.address_zip}
                            onChange={(e) => setFormData({ ...formData, address_zip: e.target.value })}
                            placeholder="01234"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="address_country">País</FieldLabel>
                          <Input
                            id="address_country"
                            value={formData.address_country}
                            onChange={(e) => setFormData({ ...formData, address_country: e.target.value })}
                            placeholder="México"
                          />
                        </Field>
                      </div>
                    </FieldGroup>
                  </CardContent>
                </Card>

                {/* Emergency contact */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contacto de Emergencia</CardTitle>
                    <CardDescription>
                      Persona a contactar en caso de emergencia
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FieldGroup>
                      <div className="grid grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel htmlFor="emergency_contact_name">Nombre Completo</FieldLabel>
                          <Input
                            id="emergency_contact_name"
                            value={formData.emergency_contact_name}
                            onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                            placeholder="Nombre del contacto"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="emergency_contact_relationship">Parentesco</FieldLabel>
                          <Input
                            id="emergency_contact_relationship"
                            value={formData.emergency_contact_relationship}
                            onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                            placeholder="Esposo(a), Padre, Madre, etc."
                          />
                        </Field>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel htmlFor="emergency_contact_phone">Teléfono</FieldLabel>
                          <Input
                            id="emergency_contact_phone"
                            value={formData.emergency_contact_phone}
                            onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                            placeholder="+52 55 1234 5678"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="emergency_contact_email">Correo</FieldLabel>
                          <Input
                            id="emergency_contact_email"
                            type="email"
                            value={formData.emergency_contact_email}
                            onChange={(e) => setFormData({ ...formData, emergency_contact_email: e.target.value })}
                            placeholder="contacto@email.com"
                          />
                        </Field>
                      </div>
                    </FieldGroup>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? <Spinner className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Guardar Cambios
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>
        )}

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Cambiar Contraseña</CardTitle>
              <CardDescription>
                Actualiza tu contraseña de acceso al sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <Field>
                  <FieldLabel htmlFor="new_password">Nueva Contraseña</FieldLabel>
                  <Input
                    id="new_password"
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    placeholder="••••••••"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirm_password">Confirmar Contraseña</FieldLabel>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    placeholder="••••••••"
                  />
                </Field>
                <Button type="submit" disabled={saving}>
                  {saving ? <Spinner className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                  Cambiar Contraseña
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Información de la Cuenta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado de la Cuenta</p>
                  <Badge variant={user.is_active ? "default" : "destructive"} className="mt-1">
                    {user.is_active ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Registro</p>
                  <p className="text-sm mt-1">
                    {new Date(user.created_at).toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info">
          {staff?.id ? (
            <StaffEditForm
              staffId={staff.id}
              redirectTo="/dashboard/profile"
              cancelHref="/dashboard/profile"
              showHeader={false}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Información Laboral
                </CardTitle>
                <CardDescription>Datos de tu registro en Personal.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Tu cuenta no tiene un registro vinculado en Personal, por lo que no hay información editable.
                    Contacta a Recursos Humanos si crees que esto es un error.
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  full_time: "Tiempo completo",
  part_time: "Medio tiempo",
  freelance: "Freelance",
  commission: "Por comisión",
  fixed_variable: "Fijo + variable",
  intern: "Prácticas",
  temporary: "Temporal",
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string | null
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-sm mt-0.5 break-words">{value || "No especificado"}</p>
      </div>
    </div>
  )
}
