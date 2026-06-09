"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, Shield, Building2, Globe, Check } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"

interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
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

interface Agency {
  id: string
  name: string
}

export default function EditUserPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    is_active: true,
    is_global_access: false,
  })
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([])
  const [canManageRoles, setCanManageRoles] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchUser()
    fetchAgencies()
    checkUserPermissions()
  }, [userId])

  async function fetchAgencies() {
    const { data } = await supabase
      .from("agencies")
      .select("id, name")
      .eq("is_active", true)
      .order("name")
    
    if (data) {
      setAgencies(data)
    }
  }

  async function fetchUserAgencies() {
    const { data } = await supabase
      .from("user_agencies")
      .select("agency_id")
      .eq("user_id", userId)
    
    if (data) {
      setSelectedAgencies(data.map(ua => ua.agency_id))
    }
  }

  async function fetchUser() {
    setLoading(true)
    const { data, error } = await supabase
      .from("users")
      .select(`
        *,
        role:roles(id, name, display_name)
      `)
      .eq("id", userId)
      .single()

    if (error || !data) {
      router.push("/dashboard/users")
      return
    }

    setUser(data)
    setFormData({
      first_name: data.first_name || "",
      last_name: data.last_name || "",
      email: data.email || "",
      is_active: data.is_active ?? true,
      is_global_access: data.is_global_access ?? false,
    })
    await fetchUserAgencies()
    setLoading(false)
  }

  async function checkUserPermissions() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: staffData } = await supabase
      .from("staff")
      .select("role_id, roles:role_id(name, level)")
      .eq("user_id", user.id)
      .single()

    if (staffData?.roles) {
      const roleLevel = (staffData.roles as { name: string; level: number }).level
      setCanManageRoles(roleLevel <= 2)
    } else {
      setCanManageRoles(true)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    // Update user data
    const { error } = await supabase
      .from("users")
      .update({
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
        is_active: formData.is_active,
        is_global_access: formData.is_global_access,
      })
      .eq("id", userId)

    if (error) {
      alert("Error al guardar: " + error.message)
      setSaving(false)
      return
    }

    // Update user agencies (delete existing and insert new)
    await supabase
      .from("user_agencies")
      .delete()
      .eq("user_id", userId)

    if (!formData.is_global_access && selectedAgencies.length > 0) {
      const agencyInserts = selectedAgencies.map(agencyId => ({
        user_id: userId,
        agency_id: agencyId
      }))
      
      await supabase
        .from("user_agencies")
        .insert(agencyInserts)
    }

    // Sincronizar datos con tabla staff si hay registro vinculado
    await supabase
      .from("staff")
      .update({
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
      })
      .eq("user_id", userId)

    router.push("/dashboard/users")
  }

  function toggleAgency(agencyId: string) {
    setSelectedAgencies(prev => {
      if (prev.includes(agencyId)) {
        return prev.filter(id => id !== agencyId)
      } else {
        return [...prev, agencyId]
      }
    })
  }

  function selectAllAgencies() {
    setSelectedAgencies(agencies.map(a => a.id))
  }

  function deselectAllAgencies() {
    setSelectedAgencies([])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Editar Usuario</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informacion Personal</CardTitle>
              <CardDescription>
                Datos basicos del usuario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="first_name">Nombre</FieldLabel>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="Nombre"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="last_name">Apellido</FieldLabel>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Apellido"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="email">Correo electronico</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    El correo electronico no puede ser modificado
                  </p>
                </Field>

                <div className="flex items-center justify-between py-4 border-t">
                  <div>
                    <Label htmlFor="is_active" className="font-medium">Usuario Activo</Label>
                    <p className="text-sm text-muted-foreground">
                      Los usuarios inactivos no pueden acceder al sistema
                    </p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rol Asignado</CardTitle>
              <CardDescription>
                El rol determina los permisos del usuario en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    {user.role ? (
                      <>
                        <p className="font-medium">{user.role.display_name}</p>
                        <p className="text-sm text-muted-foreground">{user.role.name}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-muted-foreground">Sin rol asignado</p>
                        <p className="text-sm text-muted-foreground">Este usuario no tiene permisos especificos</p>
                      </>
                    )}
                  </div>
                </div>
                {canManageRoles && (
                  <Button variant="outline" asChild>
                    <Link href={`/dashboard/users/${userId}/role`}>
                      <Shield className="mr-2 h-4 w-4" />
                      Cambiar Rol
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agencias</CardTitle>
              <CardDescription>
                Selecciona las agencias a las que el usuario tendra acceso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Global Access Option */}
              <div 
                className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  formData.is_global_access 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-muted-foreground/50"
                }`}
                onClick={() => setFormData({ ...formData, is_global_access: !formData.is_global_access })}
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  formData.is_global_access ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                  <Globe className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Acceso Global</p>
                  <p className="text-sm text-muted-foreground">
                    El usuario tendra acceso a todas las agencias del sistema
                  </p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  formData.is_global_access 
                    ? "border-primary bg-primary text-primary-foreground" 
                    : "border-muted-foreground/30"
                }`}>
                  {formData.is_global_access && <Check className="h-4 w-4" />}
                </div>
              </div>

              {/* Individual Agencies Selection */}
              {!formData.is_global_access && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Seleccionar agencias individuales</Label>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={selectAllAgencies}
                      >
                        Seleccionar todas
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={deselectAllAgencies}
                      >
                        Deseleccionar
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
                    {agencies.map((agency) => (
                      <div
                        key={agency.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedAgencies.includes(agency.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/50"
                        }`}
                        onClick={() => toggleAgency(agency.id)}
                      >
                        <Checkbox 
                          checked={selectedAgencies.includes(agency.id)}
                          onCheckedChange={() => toggleAgency(agency.id)}
                        />
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{agency.name}</span>
                      </div>
                    ))}
                  </div>

                  {selectedAgencies.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedAgencies.length} agencia{selectedAgencies.length !== 1 ? "s" : ""} seleccionada{selectedAgencies.length !== 1 ? "s" : ""}
                    </p>
                  )}

                  {agencies.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      No hay agencias disponibles
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard/users">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
