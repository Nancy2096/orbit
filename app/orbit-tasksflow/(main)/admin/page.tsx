"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft, 
  Plus, 
  Pencil, 
  Trash2,
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Settings,
  Mail,
  MoreHorizontal,
  Search,
  Filter,
  Download,
  Upload,
  Copy,
  Check,
  X,
  Clock,
  UserCog,
  UsersRound,
  Key,
  Send,
  RefreshCw,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock data for users
const mockUsers = [
  { 
    id: "1", 
    name: "María García", 
    email: "maria.garcia@agencia.com", 
    role: "admin",
    groups: ["Directivos", "Project Managers"],
    status: "activo",
    avatar: "",
    initials: "MG",
    lastLogin: "2024-04-08T10:30:00",
    createdAt: "2023-01-15",
    permissions: { projects: true, tasks: true, reports: true, settings: true, admin: true }
  },
  { 
    id: "2", 
    name: "Juan Pérez", 
    email: "juan.perez@agencia.com", 
    role: "coordinator",
    groups: ["Project Managers", "Diseño"],
    status: "activo",
    avatar: "",
    initials: "JP",
    lastLogin: "2024-04-08T09:15:00",
    createdAt: "2023-03-20",
    permissions: { projects: true, tasks: true, reports: true, settings: false, admin: false }
  },
  { 
    id: "3", 
    name: "Ana López", 
    email: "ana.lopez@agencia.com", 
    role: "member",
    groups: ["Diseño"],
    status: "activo",
    avatar: "",
    initials: "AL",
    lastLogin: "2024-04-07T16:45:00",
    createdAt: "2023-06-10",
    permissions: { projects: false, tasks: true, reports: false, settings: false, admin: false }
  },
  { 
    id: "4", 
    name: "Carlos Ruiz", 
    email: "carlos.ruiz@agencia.com", 
    role: "member",
    groups: ["Social Media", "Contenido"],
    status: "activo",
    avatar: "",
    initials: "CR",
    lastLogin: "2024-04-08T08:00:00",
    createdAt: "2023-08-01",
    permissions: { projects: false, tasks: true, reports: false, settings: false, admin: false }
  },
  { 
    id: "5", 
    name: "Laura Martínez", 
    email: "laura.martinez@agencia.com", 
    role: "viewer",
    groups: ["Clientes"],
    status: "inactivo",
    avatar: "",
    initials: "LM",
    lastLogin: "2024-03-15T12:00:00",
    createdAt: "2023-09-15",
    permissions: { projects: false, tasks: false, reports: true, settings: false, admin: false }
  },
  { 
    id: "6", 
    name: "Roberto Hernández", 
    email: "roberto@cliente.com", 
    role: "client",
    groups: ["Clientes"],
    status: "activo",
    avatar: "",
    initials: "RH",
    lastLogin: "2024-04-06T14:30:00",
    createdAt: "2024-01-10",
    permissions: { projects: false, tasks: false, reports: true, settings: false, admin: false }
  },
]

// Mock data for groups
const mockGroups = [
  { 
    id: "1", 
    name: "Directivos", 
    description: "Dirección y gerencia de la agencia",
    color: "#ef4444",
    members: 2,
    permissions: { projects: true, tasks: true, reports: true, settings: true, admin: true }
  },
  { 
    id: "2", 
    name: "Project Managers", 
    description: "Coordinadores y gerentes de proyecto",
    color: "#3b82f6",
    members: 3,
    permissions: { projects: true, tasks: true, reports: true, settings: false, admin: false }
  },
  { 
    id: "3", 
    name: "Diseño", 
    description: "Equipo de diseño gráfico y UI/UX",
    color: "#8b5cf6",
    members: 4,
    permissions: { projects: false, tasks: true, reports: false, settings: false, admin: false }
  },
  { 
    id: "4", 
    name: "Social Media", 
    description: "Community managers y estrategia social",
    color: "#ec4899",
    members: 3,
    permissions: { projects: false, tasks: true, reports: false, settings: false, admin: false }
  },
  { 
    id: "5", 
    name: "Contenido", 
    description: "Redactores y creadores de contenido",
    color: "#10b981",
    members: 2,
    permissions: { projects: false, tasks: true, reports: false, settings: false, admin: false }
  },
  { 
    id: "6", 
    name: "Clientes", 
    description: "Acceso limitado para clientes externos",
    color: "#f59e0b",
    members: 5,
    permissions: { projects: false, tasks: false, reports: true, settings: false, admin: false }
  },
]

// Mock data for roles
const mockRoles = [
  { 
    id: "admin", 
    name: "Administrador", 
    description: "Acceso completo al sistema",
    color: "#ef4444",
    icon: ShieldAlert,
    usersCount: 1,
    permissions: { projects: true, tasks: true, reports: true, settings: true, admin: true }
  },
  { 
    id: "coordinator", 
    name: "Coordinador", 
    description: "Gestión de proyectos y equipos",
    color: "#3b82f6",
    icon: ShieldCheck,
    usersCount: 2,
    permissions: { projects: true, tasks: true, reports: true, settings: false, admin: false }
  },
  { 
    id: "member", 
    name: "Miembro", 
    description: "Acceso a tareas asignadas",
    color: "#10b981",
    icon: Shield,
    usersCount: 4,
    permissions: { projects: false, tasks: true, reports: false, settings: false, admin: false }
  },
  { 
    id: "viewer", 
    name: "Visualizador", 
    description: "Solo lectura de reportes",
    color: "#6b7280",
    icon: Eye,
    usersCount: 1,
    permissions: { projects: false, tasks: false, reports: true, settings: false, admin: false }
  },
  { 
    id: "client", 
    name: "Cliente", 
    description: "Acceso externo limitado",
    color: "#f59e0b",
    icon: Building2,
    usersCount: 3,
    permissions: { projects: false, tasks: false, reports: true, settings: false, admin: false }
  },
]

// Mock data for invitations
const mockInvitations = [
  { 
    id: "1", 
    email: "nuevo.empleado@agencia.com", 
    role: "member",
    groups: ["Diseño"],
    status: "pending",
    sentAt: "2024-04-07T10:00:00",
    expiresAt: "2024-04-14T10:00:00",
    invitedBy: "María García"
  },
  { 
    id: "2", 
    email: "freelancer@externo.com", 
    role: "member",
    groups: ["Contenido"],
    status: "pending",
    sentAt: "2024-04-06T14:30:00",
    expiresAt: "2024-04-13T14:30:00",
    invitedBy: "Juan Pérez"
  },
  { 
    id: "3", 
    email: "cliente.nuevo@empresa.com", 
    role: "client",
    groups: ["Clientes"],
    status: "expired",
    sentAt: "2024-03-20T09:00:00",
    expiresAt: "2024-03-27T09:00:00",
    invitedBy: "María García"
  },
]

export default function TasksFlowAdminPage() {
  const [users, setUsers] = useState(mockUsers)
  const [groups, setGroups] = useState(mockGroups)
  const [invitations, setInvitations] = useState(mockInvitations)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  
  // Dialogs
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [showGroupDialog, setShowGroupDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  // Edit states
  const [editingUser, setEditingUser] = useState<typeof mockUsers[0] | null>(null)
  const [editingGroup, setEditingGroup] = useState<typeof mockGroups[0] | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'user' | 'group' | 'invitation', id: string, name: string } | null>(null)
  
  // New invitation form
  const [newInvite, setNewInvite] = useState({
    email: "",
    role: "member",
    groups: [] as string[],
    message: ""
  })

  // New group form
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    permissions: { projects: false, tasks: true, reports: false, settings: false, admin: false }
  })

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  // Stats
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'activo').length,
    pendingInvites: invitations.filter(i => i.status === 'pending').length,
    totalGroups: groups.length
  }

  const getRoleBadge = (role: string) => {
    const config: Record<string, { label: string, className: string }> = {
      admin: { label: "Admin", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
      coordinator: { label: "Coordinador", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
      member: { label: "Miembro", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
      viewer: { label: "Visualizador", className: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300" },
      client: { label: "Cliente", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
    }
    return config[role] || config.member
  }

  const handleInvite = () => {
    if (!newInvite.email) return
    const invitation = {
      id: `inv-${Date.now()}`,
      email: newInvite.email,
      role: newInvite.role,
      groups: newInvite.groups,
      status: "pending",
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      invitedBy: "Usuario Actual"
    }
    setInvitations([invitation, ...invitations])
    setNewInvite({ email: "", role: "member", groups: [], message: "" })
    setShowInviteDialog(false)
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    
    if (deleteTarget.type === 'user') {
      setUsers(users.filter(u => u.id !== deleteTarget.id))
    } else if (deleteTarget.type === 'group') {
      setGroups(groups.filter(g => g.id !== deleteTarget.id))
    } else if (deleteTarget.type === 'invitation') {
      setInvitations(invitations.filter(i => i.id !== deleteTarget.id))
    }
    
    setDeleteTarget(null)
    setShowDeleteDialog(false)
  }

  const handleSaveGroup = () => {
    if (editingGroup) {
      setGroups(groups.map(g => g.id === editingGroup.id ? editingGroup : g))
    } else if (newGroup.name) {
      const group = {
        id: `group-${Date.now()}`,
        ...newGroup,
        members: 0
      }
      setGroups([...groups, group])
    }
    setEditingGroup(null)
    setNewGroup({ name: "", description: "", color: "#3b82f6", permissions: { projects: false, tasks: true, reports: false, settings: false, admin: false } })
    setShowGroupDialog(false)
  }

  const handleUpdateUserRole = (userId: string, newRole: string) => {
    const rolePermissions: Record<string, typeof mockUsers[0]['permissions']> = {
      admin: { projects: true, tasks: true, reports: true, settings: true, admin: true },
      coordinator: { projects: true, tasks: true, reports: true, settings: false, admin: false },
      member: { projects: false, tasks: true, reports: false, settings: false, admin: false },
      viewer: { projects: false, tasks: false, reports: true, settings: false, admin: false },
      client: { projects: false, tasks: false, reports: true, settings: false, admin: false },
    }
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole, permissions: rolePermissions[newRole] } : u))
  }

  const handleToggleUserStatus = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, status: u.status === 'activo' ? 'inactivo' : 'activo' } : u))
  }

  const resendInvitation = (invitationId: string) => {
    setInvitations(invitations.map(i => i.id === invitationId ? {
      ...i,
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "pending"
    } : i))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/orbit-tasksflow">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UserCog className="h-6 w-6" />
              Administración de Usuarios
            </h1>
            <p className="text-muted-foreground">
              Gestiona usuarios, grupos y permisos de TaskFlow
            </p>
          </div>
        </div>
        <Button onClick={() => setShowInviteDialog(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invitar Usuario
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground">Total Usuarios</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
                <p className="text-xs text-muted-foreground">Usuarios Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Mail className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.pendingInvites}</p>
                <p className="text-xs text-muted-foreground">Invitaciones Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <UsersRound className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.totalGroups}</p>
                <p className="text-xs text-muted-foreground">Grupos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuarios ({users.length})
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <UsersRound className="h-4 w-4" />
            Grupos ({groups.length})
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles y Permisos
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Invitaciones ({invitations.filter(i => i.status === 'pending').length})
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar por nombre o email..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="coordinator">Coordinador</SelectItem>
                    <SelectItem value="member">Miembro</SelectItem>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                    <SelectItem value="client">Cliente</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="activo">Activos</SelectItem>
                    <SelectItem value="inactivo">Inactivos</SelectItem>
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
                    <TableHead>Grupos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Último Acceso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const roleBadge = getRoleBadge(user.role)
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              {user.avatar ? (
                                <AvatarImage src={user.avatar} />
                              ) : null}
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {user.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={user.role}
                            onValueChange={(value) => handleUpdateUserRole(user.id, value)}
                          >
                            <SelectTrigger className={`w-[130px] h-7 text-xs border-0 ${roleBadge.className}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="coordinator">Coordinador</SelectItem>
                              <SelectItem value="member">Miembro</SelectItem>
                              <SelectItem value="viewer">Visualizador</SelectItem>
                              <SelectItem value="client">Cliente</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.groups.slice(0, 2).map((group) => (
                              <Badge key={group} variant="outline" className="text-xs">
                                {group}
                              </Badge>
                            ))}
                            {user.groups.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{user.groups.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={user.status === 'activo'}
                              onCheckedChange={() => handleToggleUserStatus(user.id)}
                            />
                            <span className={`text-sm ${user.status === 'activo' ? 'text-green-600' : 'text-muted-foreground'}`}>
                              {user.status === 'activo' ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.lastLogin).toLocaleDateString('es-MX', { 
                            day: 'numeric', 
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditingUser(user); setShowUserDialog(true) }}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar Usuario
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Key className="h-4 w-4 mr-2" />
                                Cambiar Permisos
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Restablecer Contraseña
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => {
                                  setDeleteTarget({ type: 'user', id: user.id, name: user.name })
                                  setShowDeleteDialog(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar Usuario
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

        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingGroup(null); setShowGroupDialog(true) }}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Grupo
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Card key={group.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: group.color }}
                      >
                        <UsersRound className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{group.name}</CardTitle>
                        <CardDescription className="text-xs">{group.members} miembros</CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingGroup(group); setShowGroupDialog(true) }}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => {
                            setDeleteTarget({ type: 'group', id: group.id, name: group.name })
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Permisos:</p>
                    <div className="flex flex-wrap gap-1">
                      {group.permissions.projects && <Badge variant="outline" className="text-xs">Proyectos</Badge>}
                      {group.permissions.tasks && <Badge variant="outline" className="text-xs">Tareas</Badge>}
                      {group.permissions.reports && <Badge variant="outline" className="text-xs">Reportes</Badge>}
                      {group.permissions.settings && <Badge variant="outline" className="text-xs">Config</Badge>}
                      {group.permissions.admin && <Badge variant="outline" className="text-xs bg-red-100 text-red-700">Admin</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Roles del Sistema</CardTitle>
              <CardDescription>Configura los permisos predefinidos para cada rol</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRoles.map((role) => {
                  const IconComponent = role.icon
                  return (
                    <div key={role.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className="p-2 rounded-lg text-white"
                            style={{ backgroundColor: role.color }}
                          >
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-medium">{role.name}</h4>
                            <p className="text-sm text-muted-foreground">{role.description}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">{role.usersCount} usuarios</Badge>
                      </div>
                      <div className="grid grid-cols-5 gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox checked={role.permissions.projects} disabled />
                          <Label className="text-sm">Proyectos</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox checked={role.permissions.tasks} disabled />
                          <Label className="text-sm">Tareas</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox checked={role.permissions.reports} disabled />
                          <Label className="text-sm">Reportes</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox checked={role.permissions.settings} disabled />
                          <Label className="text-sm">Configuración</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox checked={role.permissions.admin} disabled />
                          <Label className="text-sm">Administración</Label>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Permissions Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Permisos</CardTitle>
              <CardDescription>Vista detallada de permisos por rol</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permiso</TableHead>
                    <TableHead className="text-center">Admin</TableHead>
                    <TableHead className="text-center">Coordinador</TableHead>
                    <TableHead className="text-center">Miembro</TableHead>
                    <TableHead className="text-center">Visualizador</TableHead>
                    <TableHead className="text-center">Cliente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { name: "Ver proyectos", admin: true, coordinator: true, member: false, viewer: false, client: false },
                    { name: "Crear proyectos", admin: true, coordinator: true, member: false, viewer: false, client: false },
                    { name: "Editar proyectos", admin: true, coordinator: true, member: false, viewer: false, client: false },
                    { name: "Eliminar proyectos", admin: true, coordinator: false, member: false, viewer: false, client: false },
                    { name: "Ver tareas", admin: true, coordinator: true, member: true, viewer: false, client: false },
                    { name: "Crear tareas", admin: true, coordinator: true, member: true, viewer: false, client: false },
                    { name: "Editar tareas", admin: true, coordinator: true, member: true, viewer: false, client: false },
                    { name: "Ver reportes", admin: true, coordinator: true, member: false, viewer: true, client: true },
                    { name: "Exportar reportes", admin: true, coordinator: true, member: false, viewer: false, client: false },
                    { name: "Ver configuración", admin: true, coordinator: false, member: false, viewer: false, client: false },
                    { name: "Editar configuración", admin: true, coordinator: false, member: false, viewer: false, client: false },
                    { name: "Gestionar usuarios", admin: true, coordinator: false, member: false, viewer: false, client: false },
                  ].map((permission) => (
                    <TableRow key={permission.name}>
                      <TableCell className="font-medium">{permission.name}</TableCell>
                      <TableCell className="text-center">
                        {permission.admin ? <Check className="h-4 w-4 text-green-600 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                      </TableCell>
                      <TableCell className="text-center">
                        {permission.coordinator ? <Check className="h-4 w-4 text-green-600 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                      </TableCell>
                      <TableCell className="text-center">
                        {permission.member ? <Check className="h-4 w-4 text-green-600 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                      </TableCell>
                      <TableCell className="text-center">
                        {permission.viewer ? <Check className="h-4 w-4 text-green-600 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                      </TableCell>
                      <TableCell className="text-center">
                        {permission.client ? <Check className="h-4 w-4 text-green-600 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Invitaciones Pendientes</CardTitle>
                <CardDescription>Gestiona las invitaciones enviadas a nuevos usuarios</CardDescription>
              </div>
              <Button onClick={() => setShowInviteDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Nueva Invitación
              </Button>
            </CardHeader>
            <CardContent>
              {invitations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay invitaciones pendientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invitations.map((invitation) => {
                    const isExpired = invitation.status === 'expired' || new Date(invitation.expiresAt) < new Date()
                    const roleBadge = getRoleBadge(invitation.role)
                    return (
                      <div 
                        key={invitation.id} 
                        className={`p-4 border rounded-lg ${isExpired ? 'bg-muted/50 opacity-75' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isExpired ? 'bg-muted' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                              <Mail className={`h-4 w-4 ${isExpired ? 'text-muted-foreground' : 'text-amber-600'}`} />
                            </div>
                            <div>
                              <p className="font-medium">{invitation.email}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Invitado por {invitation.invitedBy}</span>
                                <span>•</span>
                                <span>{new Date(invitation.sentAt).toLocaleDateString('es-MX')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className={roleBadge.className}>
                              {roleBadge.label}
                            </Badge>
                            {isExpired ? (
                              <Badge variant="destructive">Expirada</Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-700">Pendiente</Badge>
                            )}
                            <div className="flex gap-1">
                              {isExpired ? (
                                <Button variant="outline" size="sm" onClick={() => resendInvitation(invitation.id)}>
                                  <RefreshCw className="h-4 w-4 mr-1" />
                                  Reenviar
                                </Button>
                              ) : (
                                <Button variant="ghost" size="sm">
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copiar Link
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  setDeleteTarget({ type: 'invitation', id: invitation.id, name: invitation.email })
                                  setShowDeleteDialog(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        {!isExpired && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              Expira el {new Date(invitation.expiresAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite User Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Invitar Usuario</DialogTitle>
            <DialogDescription>
              Envía una invitación por email para unirse a TaskFlow
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email"
                placeholder="correo@ejemplo.com"
                value={newInvite.email}
                onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={newInvite.role} onValueChange={(v) => setNewInvite({ ...newInvite, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coordinator">Coordinador</SelectItem>
                  <SelectItem value="member">Miembro</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grupos (opcional)</Label>
              <div className="grid grid-cols-2 gap-2">
                {groups.map((group) => (
                  <div key={group.id} className="flex items-center gap-2">
                    <Checkbox 
                      id={`group-${group.id}`}
                      checked={newInvite.groups.includes(group.name)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewInvite({ ...newInvite, groups: [...newInvite.groups, group.name] })
                        } else {
                          setNewInvite({ ...newInvite, groups: newInvite.groups.filter(g => g !== group.name) })
                        }
                      }}
                    />
                    <Label htmlFor={`group-${group.id}`} className="text-sm font-normal">
                      {group.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Mensaje personalizado (opcional)</Label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Añade un mensaje personal a la invitación..."
                value={newInvite.message}
                onChange={(e) => setNewInvite({ ...newInvite, message: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInvite}>
              <Send className="h-4 w-4 mr-2" />
              Enviar Invitación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Dialog */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Editar Grupo' : 'Nuevo Grupo'}</DialogTitle>
            <DialogDescription>
              {editingGroup ? 'Modifica la configuración del grupo' : 'Crea un nuevo grupo para organizar usuarios'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre del Grupo</Label>
              <Input 
                placeholder="Ej: Equipo de Diseño"
                value={editingGroup?.name || newGroup.name}
                onChange={(e) => {
                  if (editingGroup) {
                    setEditingGroup({ ...editingGroup, name: e.target.value })
                  } else {
                    setNewGroup({ ...newGroup, name: e.target.value })
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input 
                placeholder="Descripción del grupo..."
                value={editingGroup?.description || newGroup.description}
                onChange={(e) => {
                  if (editingGroup) {
                    setEditingGroup({ ...editingGroup, description: e.target.value })
                  } else {
                    setNewGroup({ ...newGroup, description: e.target.value })
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex items-center gap-3">
                <input 
                  type="color"
                  value={editingGroup?.color || newGroup.color}
                  onChange={(e) => {
                    if (editingGroup) {
                      setEditingGroup({ ...editingGroup, color: e.target.value })
                    } else {
                      setNewGroup({ ...newGroup, color: e.target.value })
                    }
                  }}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                />
                <div 
                  className="flex-1 h-10 rounded text-white text-sm flex items-center justify-center font-medium"
                  style={{ backgroundColor: editingGroup?.color || newGroup.color }}
                >
                  Vista Previa
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Permisos del Grupo</Label>
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-muted/30">
                {[
                  { key: 'projects', label: 'Proyectos' },
                  { key: 'tasks', label: 'Tareas' },
                  { key: 'reports', label: 'Reportes' },
                  { key: 'settings', label: 'Configuración' },
                  { key: 'admin', label: 'Administración' },
                ].map((perm) => {
                  const permissions = editingGroup?.permissions || newGroup.permissions
                  return (
                    <div key={perm.key} className="flex items-center gap-2">
                      <Checkbox 
                        id={`perm-${perm.key}`}
                        checked={permissions[perm.key as keyof typeof permissions]}
                        onCheckedChange={(checked) => {
                          const newPermissions = { ...permissions, [perm.key]: checked }
                          if (editingGroup) {
                            setEditingGroup({ ...editingGroup, permissions: newPermissions })
                          } else {
                            setNewGroup({ ...newGroup, permissions: newPermissions })
                          }
                        }}
                      />
                      <Label htmlFor={`perm-${perm.key}`} className="text-sm font-normal">
                        {perm.label}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowGroupDialog(false); setEditingGroup(null) }}>
              Cancelar
            </Button>
            <Button onClick={handleSaveGroup}>
              {editingGroup ? 'Guardar Cambios' : 'Crear Grupo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              {deleteTarget?.type === 'user' && `¿Estás seguro de que deseas eliminar al usuario "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
              {deleteTarget?.type === 'group' && `¿Estás seguro de que deseas eliminar el grupo "${deleteTarget?.name}"? Los usuarios del grupo no serán eliminados.`}
              {deleteTarget?.type === 'invitation' && `¿Estás seguro de que deseas cancelar la invitación para "${deleteTarget?.name}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
