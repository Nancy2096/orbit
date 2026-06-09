"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Users,
  UserPlus,
  Shield,
  Settings,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Key,
  Copy,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { mockUsers, mockRolePermissions } from "@/lib/marketing-intelligence/mock-data-phase3"
import type { User, UserRole, UserStatus, RolePermissions, Permission, PermissionAction } from "@/lib/marketing-intelligence/types-phase3"

const roleConfig: Record<UserRole, { label: string; color: string; description: string }> = {
  director: { label: "Director", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300", description: "Acceso completo" },
  account_manager: { label: "Account Manager", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", description: "Gestión de clientes" },
  analista: { label: "Analista", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", description: "Visualización y datos" },
  community_manager: { label: "Community Manager", color: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300", description: "Contenido y redes" },
  disenador: { label: "Diseñador", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300", description: "Creativos" },
  cliente: { label: "Cliente", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300", description: "Acceso limitado" },
  solo_lectura: { label: "Solo Lectura", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", description: "Visualización" },
}

const statusConfig: Record<UserStatus, { label: string; color: string; icon: any }> = {
  activo: { label: "Activo", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", icon: CheckCircle },
  inactivo: { label: "Inactivo", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: XCircle },
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300", icon: Clock },
}

const actionLabels: Record<PermissionAction, string> = {
  ver: "Ver",
  crear: "Crear",
  editar: "Editar",
  eliminar: "Eliminar",
  aprobar: "Aprobar",
  comentar: "Comentar",
  exportar: "Exportar",
  programar: "Programar",
  publicar: "Publicar",
  responder_inbox: "Responder Inbox",
  ver_metricas: "Ver Métricas",
  ver_reportes: "Ver Reportes",
  conectar_cuentas: "Conectar Cuentas",
  admin_usuarios: "Admin Usuarios",
  config_ia: "Config IA",
  config_reportes: "Config Reportes",
}

const USERS_STORAGE_KEY = "orbit-mi-users"

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [roles] = useState<RolePermissions[]>(mockRolePermissions)
  const [activeTab, setActiveTab] = useState("usuarios")
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState<RolePermissions | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Cargar usuarios del localStorage al montar
  useEffect(() => {
    const savedUsers = localStorage.getItem(USERS_STORAGE_KEY)
    if (savedUsers) {
      try {
        setUsers(JSON.parse(savedUsers))
      } catch (e) {
        console.error("Error loading users:", e)
      }
    }
    setIsLoaded(true)
  }, [])

  // Guardar usuarios en localStorage cuando cambian
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
    }
  }, [users, isLoaded])

  // Edit user form state
  const [editUser, setEditUser] = useState({
    name: "",
    email: "",
    role: "analista" as UserRole,
    assignedClients: [] as string[],
  })

  // New user form state
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "analista" as UserRole,
    assignedClients: [] as string[],
  })

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleCreateUser = () => {
    const newUserData: User = {
      id: `user-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      assignedClients: newUser.assignedClients,
      assignedBrands: [],
      status: 'pendiente',
      createdAt: new Date().toISOString().split('T')[0],
    }
    setUsers([...users, newUserData])
    setShowCreateDialog(false)
    setNewUser({
      name: "",
      email: "",
      role: "analista",
      assignedClients: [],
    })
    // Simulated: Send invitation email
    alert('Invitación enviada a ' + newUser.email)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditUser({
      name: user.name,
      email: user.email,
      role: user.role,
      assignedClients: user.assignedClients,
    })
    setShowEditDialog(true)
  }

  const handleSaveEditUser = () => {
    if (selectedUser) {
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { 
              ...u, 
              name: editUser.name, 
              email: editUser.email, 
              role: editUser.role,
              assignedClients: editUser.assignedClients,
            }
          : u
      ))
    }
    setShowEditDialog(false)
    setSelectedUser(null)
  }

  const handleToggleUserStatus = (userId: string) => {
    setUsers(users.map(u => 
      u.id === userId 
        ? { ...u, status: u.status === 'activo' ? 'inactivo' : 'activo' }
        : u
    ))
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      setUsers(users.filter(u => u.id !== userId))
    }
  }

  const viewRolePermissions = (role: UserRole) => {
    const rolePermissions = roles.find(r => r.role === role)
    if (rolePermissions) {
      setSelectedRole(rolePermissions)
      setShowPermissionsDialog(true)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Usuarios y Permisos
          </h1>
          <p className="text-muted-foreground">Gestiona los usuarios de tu equipo y sus permisos de acceso</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invitar Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Invitar Nuevo Usuario</DialogTitle>
              <DialogDescription>Envía una invitación por correo electrónico</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nombre Completo</Label>
                <Input 
                  placeholder="Nombre del usuario"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Correo Electrónico</Label>
                <Input 
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Rol</Label>
                <Select value={newUser.role} onValueChange={(v) => setNewUser({...newUser, role: v as UserRole})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span>{config.label}</span>
                          <span className="text-xs text-muted-foreground">- {config.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Asignar Clientes</Label>
                <div className="space-y-2 p-3 border rounded-lg">
                  {['Vertex Inmobiliaria', 'TechStart', 'FoodDelight'].map((client, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`client-${i}`}
                        checked={newUser.assignedClients.includes(`client-${i + 1}`)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewUser({...newUser, assignedClients: [...newUser.assignedClients, `client-${i + 1}`]})
                          } else {
                            setNewUser({...newUser, assignedClients: newUser.assignedClients.filter(c => c !== `client-${i + 1}`)})
                          }
                        }}
                      />
                      <label htmlFor={`client-${i}`} className="text-sm">{client}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreateUser}>
                <Mail className="mr-2 h-4 w-4" />
                Enviar Invitación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">{users.filter(u => u.status === 'activo').length} activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Equipo Interno</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.role !== 'cliente' && u.role !== 'solo_lectura').length}</div>
            <p className="text-xs text-muted-foreground">Miembros de la agencia</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.role === 'cliente').length}</div>
            <p className="text-xs text-muted-foreground">Con acceso al sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.status === 'pendiente').length}</div>
            <p className="text-xs text-muted-foreground">Invitaciones sin aceptar</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="usuarios" className="gap-2">
            <Users className="h-4 w-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            Roles y Permisos
          </TabsTrigger>
        </TabsList>

        {/* Usuarios Tab */}
        <TabsContent value="usuarios" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuarios..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    {Object.entries(roleConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Clientes Asignados</TableHead>
                    <TableHead>Último Acceso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const StatusIcon = statusConfig[user.status].icon
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={roleConfig[user.role].color}>
                            {roleConfig[user.role].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{user.assignedClients.length} cliente(s)</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.lastAccess ? (
                            <div className="text-sm">
                              {new Date(user.lastAccess).toLocaleDateString('es-MX', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Nunca</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig[user.status].color}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusConfig[user.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
<DropdownMenuContent align="end">
                                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Editar
                                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => viewRolePermissions(user.role)}>
                                <Shield className="mr-2 h-4 w-4" />
                                Ver Permisos
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id)}>
                                {user.status === 'activo' ? (
                                  <>
                                    <EyeOff className="mr-2 h-4 w-4" />
                                    Desactivar
                                  </>
                                ) : (
                                  <>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Activar
                                  </>
                                )}
                              </DropdownMenuItem>
                              {user.status === 'pendiente' && (
                                <DropdownMenuItem>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Reenviar Invitación
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <Card key={role.role} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge className={roleConfig[role.role].color}>
                      {role.roleName}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => viewRolePermissions(role.role)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription className="mt-2">{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Módulos con acceso:</div>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((perm) => (
                        <Badge key={perm.moduleId} variant="outline" className="text-xs">
                          {perm.moduleName}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {role.permissions.reduce((acc, p) => acc + p.actions.filter(a => a.allowed).length, 0)} acciones permitidas
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Permissions Matrix Legend */}
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Permisos</CardTitle>
              <CardDescription>Vista general de permisos por rol</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background">Módulo / Acción</TableHead>
                      {Object.entries(roleConfig).map(([key, config]) => (
                        <TableHead key={key} className="text-center min-w-[100px]">
                          <Badge className={config.color} variant="outline">{config.label}</Badge>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles[0]?.permissions.map((perm) => (
                      <TableRow key={perm.moduleId}>
                        <TableCell className="sticky left-0 bg-background font-medium">
                          {perm.moduleName}
                        </TableCell>
                        {Object.keys(roleConfig).map((roleKey) => {
                          const rolePerms = roles.find(r => r.role === roleKey)
                          const modulePerm = rolePerms?.permissions.find(p => p.moduleId === perm.moduleId)
                          const allowedCount = modulePerm?.actions.filter(a => a.allowed).length || 0
                          const totalCount = modulePerm?.actions.length || 0
                          return (
                            <TableCell key={roleKey} className="text-center">
                              {allowedCount > 0 ? (
                                <Badge variant={allowedCount === totalCount ? "default" : "secondary"}>
                                  {allowedCount}/{totalCount}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Permissions Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permisos de {selectedRole?.roleName}
            </DialogTitle>
            <DialogDescription>{selectedRole?.description}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-4">
              {selectedRole?.permissions.map((perm) => (
                <div key={perm.moduleId} className="p-4 rounded-lg border">
                  <h4 className="font-medium mb-3">{perm.moduleName}</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {perm.actions.map((action) => (
                      <div key={action.action} className="flex items-center gap-2">
                        {action.allowed ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm ${action.allowed ? '' : 'text-muted-foreground'}`}>
                          {actionLabels[action.action]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>Cerrar</Button>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Editar Permisos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Modifica la información del usuario</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nombre Completo</Label>
              <Input 
                placeholder="Nombre del usuario"
                value={editUser.name}
                onChange={(e) => setEditUser({...editUser, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label>Correo Electrónico</Label>
              <Input 
                type="email"
                placeholder="email@ejemplo.com"
                value={editUser.email}
                onChange={(e) => setEditUser({...editUser, email: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label>Rol</Label>
              <Select value={editUser.role} onValueChange={(v) => setEditUser({...editUser, role: v as UserRole})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span>{config.label}</span>
                        <span className="text-xs text-muted-foreground">- {config.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Asignar Clientes</Label>
              <div className="space-y-2 p-3 border rounded-lg">
                {['Vertex Inmobiliaria', 'TechStart', 'FoodDelight'].map((client, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`edit-client-${i}`}
                      checked={editUser.assignedClients.includes(`client-${i + 1}`)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEditUser({...editUser, assignedClients: [...editUser.assignedClients, `client-${i + 1}`]})
                        } else {
                          setEditUser({...editUser, assignedClients: editUser.assignedClients.filter(c => c !== `client-${i + 1}`)})
                        }
                      }}
                    />
                    <label htmlFor={`edit-client-${i}`} className="text-sm">{client}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveEditUser}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
