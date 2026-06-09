"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Users, MoreHorizontal, Pencil, Trash2, Shield } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"

interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  is_active: boolean
  created_at: string
  role: {
    id: string
    name: string
    display_name: string
  } | null
}

interface Role {
  id: string
  name: string
  display_name: string
  level: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [canManageRoles, setCanManageRoles] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
    checkUserPermissions()
  }, [])

  async function fetchData() {
    setLoading(true)
    
    const [usersRes, rolesRes] = await Promise.all([
      supabase
        .from("users")
        .select(`
          *,
          role:roles(id, name, display_name),
          user_agencies(agency:agencies(name))
        `)
        .order("created_at", { ascending: false }),
      supabase
        .from("roles")
        .select("*")
        .order("level", { ascending: true })
    ])

    if (usersRes.data) setUsers(usersRes.data)
    if (rolesRes.data) setRoles(rolesRes.data)
    setLoading(false)
  }

  async function checkUserPermissions() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get user's role from staff table with role relationship
    const { data: staffData } = await supabase
      .from("staff")
      .select("role_id, roles:role_id(name, level)")
      .eq("user_id", user.id)
      .single()

    if (staffData?.roles) {
      const roleName = (staffData.roles as { name: string; level: number }).name
      const roleLevel = (staffData.roles as { name: string; level: number }).level
      setCurrentUserRole(roleName)
      // Super Administrador (level 1) and Direccion General (level 2) can manage roles
      // Levels 1 and 2 are the highest administrative roles
      setCanManageRoles(roleLevel <= 2)
    } else {
      // If no role assigned, allow management (for initial setup)
      setCanManageRoles(true)
    }
  }

  async function handleDelete(userId: string) {
    if (!canManageRoles) {
      alert("No tienes permisos para eliminar usuarios")
      return
    }
    
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return

    const { error } = await supabase.from("users").delete().eq("id", userId)
    if (!error) {
      setUsers(users.filter((u) => u.id !== userId))
    }
  }

  const getInitials = (user: User) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()
    }
    return user.email[0].toUpperCase()
  }

  const getDisplayName = (user: User) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ""} ${user.last_name || ""}`.trim()
    }
    return user.email
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getUTCDate()
    const month = date.toLocaleString("es-MX", { month: "short", timeZone: "UTC" })
    const year = date.getUTCFullYear()
    return `${day} ${month} ${year}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios del sistema y sus accesos
          </p>
        </div>
        {canManageRoles && (
          <Button asChild>
            <Link href="/dashboard/users/new">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Link>
          </Button>
        )}
      </div>

      {users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No hay usuarios registrados</h3>
            <p className="text-muted-foreground text-center mb-4">
              Invita a los miembros de tu equipo para comenzar
            </p>
            {canManageRoles && (
              <Button asChild>
                <Link href="/dashboard/users/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Invitar Usuario
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Agencias</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha de Registro</TableHead>
                <TableHead className="w-[80px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{getDisplayName(user)}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.role ? (
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span>{user.role.display_name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Sin rol</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.is_global_access ? (
                      <Badge variant="outline" className="bg-primary/10">
                        Global
                      </Badge>
                    ) : user.user_agencies && user.user_agencies.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.user_agencies.slice(0, 2).map((ua: { agency: { name: string } }) => (
                          <Badge key={ua.agency?.name} variant="outline" className="text-xs">
                            {ua.agency?.name}
                          </Badge>
                        ))}
                        {user.user_agencies.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{user.user_agencies.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Sin agencias</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Acciones</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/users/${user.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        {canManageRoles && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/users/${user.id}/role`}>
                                <Shield className="mr-2 h-4 w-4" />
                                Cambiar Rol
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDelete(user.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-medium mb-4">Roles Disponibles</h3>
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <Badge key={role.id} variant="outline" className="py-1">
                {role.display_name}
                <span className="ml-1 text-xs text-muted-foreground">
                  (Nivel {role.level})
                </span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
