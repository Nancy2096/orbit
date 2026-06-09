"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Shield, Save } from "lucide-react"

interface Role {
  id: string
  name: string
  display_name: string
  level: number
  description: string | null
}

interface Staff {
  id: string
  first_name: string
  last_name: string
  email: string
  role_id: string | null
}

export default function StaffRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [staff, setStaff] = useState<Staff | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [canManageRoles, setCanManageRoles] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
    checkUserPermissions()
  }, [id])

  async function checkUserPermissions() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/dashboard/hr/staff")
      return
    }

    const { data: staffData } = await supabase
      .from("staff")
      .select("role_id, roles:role_id(name, level)")
      .eq("user_id", user.id)
      .single()

    if (staffData?.roles) {
      const roleLevel = (staffData.roles as { name: string; level: number }).level
      // Super Administrador (level 1) and Direccion General (level 2) can manage roles
      setCanManageRoles(roleLevel <= 2)
      if (roleLevel > 2) {
        alert("No tienes permisos para gestionar roles")
        router.push("/dashboard/hr/staff")
      }
    } else {
      setCanManageRoles(true)
    }
  }

  async function fetchData() {
    setLoading(true)

    const [staffRes, rolesRes] = await Promise.all([
      supabase
        .from("staff")
        .select("id, first_name, last_name, email, role_id")
        .eq("id", id)
        .single(),
      supabase
        .from("roles")
        .select("*")
        .order("level", { ascending: true })
    ])

    if (staffRes.data) {
      setStaff(staffRes.data)
      setSelectedRoleId(staffRes.data.role_id || "")
    }
    if (rolesRes.data) {
      setRoles(rolesRes.data)
    }

    setLoading(false)
  }

  async function handleSave() {
    if (!staff || !canManageRoles) return

    setSaving(true)
    const { error } = await supabase
      .from("staff")
      .update({ role_id: selectedRoleId || null })
      .eq("id", id)

    if (error) {
      alert("Error al guardar el rol")
    } else {
      router.push("/dashboard/hr/staff")
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Usuario no encontrado</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/hr/staff">Volver</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/hr/staff">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Asignar Rol</h1>
          <p className="text-muted-foreground">
            Asigna un rol a {staff.first_name} {staff.last_name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Rol del Usuario
          </CardTitle>
          <CardDescription>
            El rol determina los permisos y accesos del usuario en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="font-medium">{staff.first_name} {staff.last_name}</p>
            <p className="text-sm text-muted-foreground">{staff.email}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol Asignado</Label>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{role.display_name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        (Nivel {role.level})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRoleId && (
              <p className="text-sm text-muted-foreground">
                {roles.find(r => r.id === selectedRoleId)?.description || "Sin descripcion"}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" asChild className="flex-1">
              <Link href="/dashboard/hr/staff">Cancelar</Link>
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? (
                <Spinner className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar Rol
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
