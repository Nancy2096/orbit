"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel, FieldSet, FieldLegend } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, UserPlus } from "lucide-react"
import Link from "next/link"
import type { Role, Agency } from "@/lib/types"

export default function NewUserPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    role_id: "",
    agency_id: "",
  })

  useEffect(() => {
    async function loadData() {
      const [{ data: rolesData }, { data: agenciesData }] = await Promise.all([
        supabase.from("roles").select("*").order("level", { ascending: true }),
        supabase.from("agencies").select("*").eq("is_active", true).order("name"),
      ])
      
      setRoles(rolesData || [])
      setAgencies(agenciesData || [])
    }
    loadData()
  }, [supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Use admin API to create user (bypasses email rate limits)
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          role_id: formData.role_id || null,
          agency_id: formData.agency_id === "__global__" ? null : formData.agency_id || null,
          is_global_access: formData.agency_id === "__global__",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Error al crear el usuario")
        setLoading(false)
        return
      }

      router.push("/dashboard/users")
      router.refresh()
    } catch (err) {
      setError("Error de conexión. Por favor intenta de nuevo.")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nuevo Usuario</h1>
          <p className="text-muted-foreground">
            Crea una cuenta para un nuevo miembro del equipo
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Información del Usuario</CardTitle>
              <CardDescription>
                El usuario podrá iniciar sesión inmediatamente con sus credenciales
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <FieldSet>
                <FieldLegend>Credenciales de Acceso</FieldLegend>
                
                <Field>
                  <FieldLabel htmlFor="email">Correo Electrónico *</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="usuario@empresa.com"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Contraseña Temporal *</FieldLabel>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    El usuario podrá cambiarla después de iniciar sesión
                  </p>
                </Field>
              </FieldSet>

              <FieldSet>
                <FieldLegend>Información Personal</FieldLegend>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="first_name">Nombre</FieldLabel>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="Nombre"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="last_name">Apellido</FieldLabel>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Apellido"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+52 55 1234 5678"
                  />
                </Field>
              </FieldSet>

              <FieldSet>
                <FieldLegend>Asignación</FieldLegend>
                
                <Field>
                  <FieldLabel htmlFor="role_id">Rol</FieldLabel>
                  <Select
                    value={formData.role_id}
                    onValueChange={(value) => setFormData({ ...formData, role_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Define los permisos del usuario en el sistema
                  </p>
                </Field>

                <Field>
                  <FieldLabel htmlFor="agency_id">Agencia Principal</FieldLabel>
                  <Select
                    value={formData.agency_id}
                    onValueChange={(value) => setFormData({ ...formData, agency_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar agencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__global__">Global (todas las agencias)</SelectItem>
                      {agencies.length === 0 ? (
                        <div className="py-2 px-2 text-sm text-muted-foreground">
                          No hay agencias disponibles
                        </div>
                      ) : (
                        agencies.map((agency) => (
                          <SelectItem key={agency.id} value={agency.id}>
                            {agency.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {formData.agency_id === "__global__" && (
                    <p className="text-sm text-muted-foreground">
                      El usuario tendrá acceso global y quedará asignado a todas las agencias cargadas.
                    </p>
                  )}
                </Field>
              </FieldSet>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" asChild className="flex-1">
                  <Link href="/dashboard/users">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Spinner className="mr-2" />
                      Creando...
                    </>
                  ) : (
                    "Crear Usuario"
                  )}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
