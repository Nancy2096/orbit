"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, Shield, Check } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface Role {
  id: string
  name: string
  display_name: string
  description: string | null
  level: number
}

interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role_id: string | null
}

export default function ChangeUserRolePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [canManageRoles, setCanManageRoles] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
    checkUserPermissions()
  }, [userId])

  async function fetchData() {
    setLoading(true)
    
    const [userRes, rolesRes] = await Promise.all([
      supabase
        .from("users")
        .select("id, email, first_name, last_name, role_id")
        .eq("id", userId)
        .single(),
      supabase
        .from("roles")
        .select("*")
        .order("level", { ascending: true })
    ])

    if (userRes.error || !userRes.data) {
      router.push("/dashboard/users")
      return
    }

    setUser(userRes.data)
    setSelectedRoleId(userRes.data.role_id)
    if (rolesRes.data) setRoles(rolesRes.data)
    setLoading(false)
  }

  async function checkUserPermissions() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/dashboard/users")
      return
    }

    const { data: staffData } = await supabase
      .from("staff")
      .select("role_id, roles:role_id(name, level)")
      .eq("user_id", user.id)
      .single()

    if (staffData?.roles) {
      const roleLevel = (staffData.roles as { name: string; level: number }).level
      if (roleLevel > 2) {
        router.push("/dashboard/users")
        return
      }
      setCanManageRoles(true)
    } else {
      setCanManageRoles(true)
    }
  }

  async function handleSubmit() {
    if (!canManageRoles) {
      alert("No tienes permisos para cambiar roles")
      return
    }
    
    setSaving(true)

    const { error } = await supabase
      .from("users")
      .update({ role_id: selectedRoleId })
      .eq("id", userId)

    if (error) {
      alert("Error al guardar: " + error.message)
      setSaving(false)
      return
    }

    router.push("/dashboard/users")
  }

  const getDisplayName = () => {
    if (!user) return ""
    if (user.first_name || user.last_name) {
      return `${user.first_name || ""} ${user.last_name || ""}`.trim()
    }
    return user.email
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!user || !canManageRoles) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/users/${userId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Asignar Rol</h1>
          <p className="text-muted-foreground">{getDisplayName()}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecciona un Rol</CardTitle>
          <CardDescription>
            El rol determina los permisos y accesos del usuario en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {roles.map((role) => (
              <div
                key={role.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all",
                  selectedRoleId === role.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
                )}
                onClick={() => setSelectedRoleId(role.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full",
                    selectedRoleId === role.id ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{role.display_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {role.description || `Nivel ${role.level}`}
                    </p>
                  </div>
                </div>
                {selectedRoleId === role.id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
            ))}

            <div
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all",
                selectedRoleId === null
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
              )}
              onClick={() => setSelectedRoleId(null)}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full",
                  selectedRoleId === null ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Sin Rol</p>
                  <p className="text-sm text-muted-foreground">
                    El usuario no tendra permisos especiales
                  </p>
                </div>
              </div>
              {selectedRoleId === null && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/users/${userId}`}>Cancelar</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Rol
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
