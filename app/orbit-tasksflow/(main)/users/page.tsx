"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Plus,
  MoreVertical,
  Mail,
  Shield,
  UserCog,
  UserX,
  Key,
  CheckCircle,
  XCircle,
} from "lucide-react"

const USERS_STORAGE_KEY = "orbit-tasksflow-users"

const defaultUsers = [
  {
    id: "1",
    name: "María García",
    email: "maria.garcia@empresa.com",
    role: "admin",
    status: "activo",
    avatar: null,
    initials: "MG",
    lastLogin: "2024-12-06 09:30",
    projects: 5,
  },
  {
    id: "2",
    name: "Carlos López",
    email: "carlos.lopez@empresa.com",
    role: "editor",
    status: "activo",
    avatar: null,
    initials: "CL",
    lastLogin: "2024-12-06 08:15",
    projects: 3,
  },
  {
    id: "3",
    name: "Ana Martínez",
    email: "ana.martinez@empresa.com",
    role: "editor",
    status: "activo",
    avatar: null,
    initials: "AM",
    lastLogin: "2024-12-05 17:45",
    projects: 4,
  },
  {
    id: "4",
    name: "Diego Torres",
    email: "diego.torres@empresa.com",
    role: "viewer",
    status: "activo",
    avatar: null,
    initials: "DT",
    lastLogin: "2024-12-06 10:00",
    projects: 2,
  },
  {
    id: "5",
    name: "Laura Ruiz",
    email: "laura.ruiz@empresa.com",
    role: "editor",
    status: "inactivo",
    avatar: null,
    initials: "LR",
    lastLogin: "2024-11-28 14:30",
    projects: 1,
  },
  {
    id: "6",
    name: "Roberto Méndez",
    email: "roberto@cliente-abc.com",
    role: "cliente",
    status: "activo",
    avatar: null,
    initials: "RM",
    lastLogin: "2024-12-06 11:20",
    projects: 1,
    accountId: "acc-001",
    accountName: "Cliente ABC Corp",
  },
  {
    id: "7",
    name: "Patricia Vega",
    email: "patricia@distribuidora-xyz.com",
    role: "cliente",
    status: "activo",
    avatar: null,
    initials: "PV",
    lastLogin: "2024-12-05 16:45",
    projects: 2,
    accountId: "acc-002",
    accountName: "Distribuidora XYZ",
  },
]

const roles = [
  {
    id: "admin",
    name: "Administrador",
    description: "Acceso completo al sistema",
    permissions: ["crear", "editar", "eliminar", "configurar", "gestionar_usuarios"],
    color: "bg-purple-100 text-purple-700",
  },
  {
    id: "editor",
    name: "Editor",
    description: "Puede crear y editar contenido",
    permissions: ["crear", "editar"],
    color: "bg-blue-100 text-blue-700",
  },
  {
    id: "viewer",
    name: "Visor",
    description: "Solo puede ver contenido",
    permissions: ["ver"],
    color: "bg-gray-100 text-gray-700",
  },
  {
    id: "cliente",
    name: "Cliente",
    description: "Ve solo su cuenta y proyectos asignados",
    permissions: ["ver_propio", "comentar", "aprobar"],
    color: "bg-amber-100 text-amber-700",
    restrictions: ["solo_cuenta_propia", "solo_proyectos_asignados"],
  },
]

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<typeof defaultUsers[0] | null>(null)
  const [usersList, setUsersList] = useState(defaultUsers)
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "" })
  const [isLoaded, setIsLoaded] = useState(false)

  // Cargar usuarios del localStorage al montar
  useEffect(() => {
    const savedUsers = localStorage.getItem(USERS_STORAGE_KEY)
    if (savedUsers) {
      try {
        setUsersList(JSON.parse(savedUsers))
      } catch (e) {
        console.error("Error loading users:", e)
      }
    }
    setIsLoaded(true)
  }, [])

  // Guardar usuarios en localStorage cuando cambian
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersList))
    }
  }, [usersList, isLoaded])

  const handleEditUser = (user: typeof defaultUsers[0]) => {
    setSelectedUser(user)
    setEditForm({ name: user.name, email: user.email, role: user.role })
    setShowEditDialog(true)
  }

  const handleChangeRole = (user: typeof defaultUsers[0]) => {
    setSelectedUser(user)
    setEditForm({ ...editForm, role: user.role })
    setShowRoleDialog(true)
  }

  const handleResetPassword = (user: typeof defaultUsers[0]) => {
    setSelectedUser(user)
    setShowPasswordDialog(true)
  }

  const handleDeactivate = (user: typeof defaultUsers[0]) => {
    setSelectedUser(user)
    setShowDeactivateDialog(true)
  }

  const saveEditUser = () => {
    if (selectedUser) {
      setUsersList(prev => prev.map(u => 
        u.id === selectedUser.id 
          ? { ...u, name: editForm.name, email: editForm.email, role: editForm.role }
          : u
      ))
    }
    setShowEditDialog(false)
    setSelectedUser(null)
  }

  const saveRoleChange = () => {
    if (selectedUser) {
      setUsersList(prev => prev.map(u => 
        u.id === selectedUser.id 
          ? { ...u, role: editForm.role }
          : u
      ))
    }
    setShowRoleDialog(false)
    setSelectedUser(null)
  }

  const confirmDeactivate = () => {
    if (selectedUser) {
      setUsersList(prev => prev.map(u => 
        u.id === selectedUser.id 
          ? { ...u, status: u.status === "activo" ? "inactivo" : "activo" }
          : u
      ))
    }
    setShowDeactivateDialog(false)
    setSelectedUser(null)
  }

  const filteredUsers = usersList.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRoleConfig = (roleId: string) => {
    return roles.find((r) => r.id === roleId) || roles[2]
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios y sus permisos en Orbit TasksFlow
          </p>
        </div>
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Invitar Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invitar Usuario</DialogTitle>
              <DialogDescription>
                Envía una invitación por correo electrónico
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Correo electrónico</Label>
                <Input type="email" placeholder="usuario@empresa.com" />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div>
                          <p className="font-medium">{role.name}</p>
                          <p className="text-xs text-muted-foreground">{role.description}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Proyectos</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Asignar a proyectos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los proyectos</SelectItem>
                    <SelectItem value="selected">Proyectos seleccionados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setShowInviteDialog(false)}>
                <Mail className="h-4 w-4 mr-2" />
                Enviar Invitación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{usersList.length}</div>
            <p className="text-sm text-muted-foreground">Total usuarios</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {usersList.filter((u) => u.status === "activo").length}
            </div>
            <p className="text-sm text-muted-foreground">Usuarios activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {usersList.filter((u) => u.role === "admin").length}
            </div>
            <p className="text-sm text-muted-foreground">Administradores</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {usersList.filter((u) => u.status === "inactivo").length}
            </div>
            <p className="text-sm text-muted-foreground">Inactivos</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuarios..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium">Usuario</th>
                <th className="text-left p-4 font-medium">Rol</th>
                <th className="text-left p-4 font-medium">Estado</th>
                <th className="text-left p-4 font-medium">Proyectos</th>
                <th className="text-left p-4 font-medium">Último acceso</th>
                <th className="text-right p-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const role = getRoleConfig(user.role)
                return (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback>{user.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={role.color}>{role.name}</Badge>
                      {user.role === "cliente" && (user as any).accountName && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Cuenta: {(user as any).accountName}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {user.status === "activo" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span
                          className={
                            user.status === "activo"
                              ? "text-green-600"
                              : "text-gray-500"
                          }
                        >
                          {user.status === "activo" ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{user.projects} proyectos</span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {user.lastLogin}
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
<DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                            <UserCog className="h-4 w-4 mr-2" />
                                            Editar usuario
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleChangeRole(user)}>
                                            <Shield className="h-4 w-4 mr-2" />
                                            Cambiar rol
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                                            <Key className="h-4 w-4 mr-2" />
                                            Restablecer contraseña
                                          </DropdownMenuItem>
                                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeactivate(user)}>
                                            <UserX className="h-4 w-4 mr-2" />
                                            {user.status === "activo" ? "Desactivar" : "Activar"} usuario
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Roles Section */}
      <Card>
        <CardHeader>
          <CardTitle>Roles y Permisos</CardTitle>
          <CardDescription>
            Configuración de roles disponibles en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((role) => (
              <Card key={role.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={role.color}>{role.name}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {usersList.filter((u) => u.role === role.id).length} usuarios
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {role.description}
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Permisos:</p>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((perm) => (
                        <Badge key={perm} variant="outline" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                    {(role as any).restrictions && (
                      <>
                        <p className="text-xs font-medium text-amber-600 mt-2">Restricciones:</p>
                        <div className="flex flex-wrap gap-1">
                          {(role as any).restrictions.map((rest: string) => (
                            <Badge key={rest} variant="outline" className="text-xs border-amber-300 text-amber-700">
                              {rest.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica la información del usuario
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input 
                value={editForm.name} 
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Correo electrónico</Label>
              <Input 
                type="email" 
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveEditUser}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Rol</DialogTitle>
            <DialogDescription>
              Cambia el rol de {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nuevo rol</Label>
              <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div>
                        <p className="font-medium">{role.name}</p>
                        <p className="text-xs text-muted-foreground">{role.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveRoleChange}>
              Cambiar Rol
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restablecer Contraseña</DialogTitle>
            <DialogDescription>
              Se enviará un correo a {selectedUser?.email} con instrucciones para restablecer su contraseña
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              El usuario recibirá un enlace para crear una nueva contraseña. El enlace expirará en 24 horas.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setShowPasswordDialog(false)}>
              <Mail className="h-4 w-4 mr-2" />
              Enviar Correo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate User Dialog */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.status === "activo" ? "Desactivar" : "Activar"} Usuario
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.status === "activo" 
                ? `¿Estás seguro de que deseas desactivar a ${selectedUser?.name}?`
                : `¿Estás seguro de que deseas activar a ${selectedUser?.name}?`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {selectedUser?.status === "activo"
                ? "El usuario no podrá acceder al sistema hasta que sea reactivado."
                : "El usuario podrá volver a acceder al sistema con sus credenciales anteriores."
              }
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant={selectedUser?.status === "activo" ? "destructive" : "default"}
              onClick={confirmDeactivate}
            >
              {selectedUser?.status === "activo" ? "Desactivar" : "Activar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
