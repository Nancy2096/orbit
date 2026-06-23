"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { 
  Shield, 
  Globe, 
  Building2, 
  FolderKanban, 
  Lock, 
  Plus, 
  Pencil, 
  Trash2, 
  Save, 
  AlertCircle,
  Users,
  UserCog,
  Eye,
  EyeOff,
  RefreshCw,
  Settings,
  DollarSign,
  Briefcase,
  Target
} from "lucide-react"
import { toast } from "sonner"

interface Role {
  id: string
  name: string
  display_name: string
  description: string
  level: number
  scope: string
  is_system: boolean
  permissions: Record<string, boolean>
  created_at: string
}

interface Permission {
  id: string
  module: string
  action: string
  description: string
}

interface RolePermission {
  id: string
  role_id: string
  permission_id: string
  scope: string
}

interface UserRole {
  role_name: string
}

export default function RolesPage() {
  const supabase = createClient()
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([])
  const [loading, setLoading] = useState(true)
  const [canEdit, setCanEdit] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string>("")
  
  // Dialog states
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<Role | null>(null)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  
  // Form state
  const [newRole, setNewRole] = useState({
    name: "",
    display_name: "",
    description: "",
    level: 2,
    scope: "agency",
  })
  
  // Selected permissions for a role
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string>>({})

  useEffect(() => {
    checkUserPermissions()
    fetchData()
  }, [])

  const checkUserPermissions = async () => {
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
      // Super Administrador (level 0) and Direccion General (level 1) can edit
      // Also check by name for backwards compatibility
      const editableRoles = ["superadmin", "super_admin", "direccion_general"]
      setCanEdit(roleLevel <= 1 || editableRoles.includes(roleName))
    } else {
      // If no role assigned, check if user is the first/admin user by checking if they have admin access
      // For now, allow edit if no role is assigned (they need to set up roles first)
      setCanEdit(true)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([fetchRoles(), fetchPermissions(), fetchRolePermissions()])
    setLoading(false)
  }

  const fetchRoles = async () => {
    const { data } = await supabase
      .from("roles")
      .select("*")
      .order("level", { ascending: true })
    if (data) setRoles(data)
  }

  const fetchPermissions = async () => {
    const { data } = await supabase
      .from("permissions")
      .select("*")
      .order("module", { ascending: true })
    if (data) setPermissions(data)
  }

  const fetchRolePermissions = async () => {
    const { data } = await supabase
      .from("role_permissions")
      .select("*")
    if (data) setRolePermissions(data)
  }

  const handleSaveRole = async () => {
    if (!newRole.name || !newRole.display_name) {
      toast.error("Nombre y nombre para mostrar son requeridos")
      return
    }

    if (editingRole) {
      // Update existing role
      const { error } = await supabase
        .from("roles")
        .update({
          display_name: newRole.display_name,
          description: newRole.description,
          level: newRole.level,
          scope: newRole.scope,
        })
        .eq("id", editingRole.id)

      if (error) {
        toast.error("Error al actualizar rol: " + error.message)
        return
      }
      toast.success("Rol actualizado correctamente")
    } else {
      // Create new role
      const { error } = await supabase
        .from("roles")
        .insert({
          name: newRole.name.toLowerCase().replace(/\s+/g, "_"),
          display_name: newRole.display_name,
          description: newRole.description,
          level: newRole.level,
          scope: newRole.scope,
          is_system: false,
          permissions: {},
        })

      if (error) {
        toast.error("Error al crear rol: " + error.message)
        return
      }
      toast.success("Rol creado correctamente")
    }

    setShowRoleDialog(false)
    resetRoleForm()
    fetchRoles()
  }

  const handleDeleteRole = async () => {
    if (!roleToDelete) return

    if (roleToDelete.is_system) {
      toast.error("No se pueden eliminar roles del sistema")
      return
    }

    const { error } = await supabase
      .from("roles")
      .delete()
      .eq("id", roleToDelete.id)

    if (error) {
      toast.error("Error al eliminar rol: " + error.message)
      return
    }

    toast.success("Rol eliminado correctamente")
    setShowDeleteDialog(false)
    setRoleToDelete(null)
    fetchRoles()
  }

  const handleSavePermissions = async () => {
    if (!selectedRoleForPermissions) return

    // Delete existing permissions for this role
    await supabase
      .from("role_permissions")
      .delete()
      .eq("role_id", selectedRoleForPermissions.id)

    // Insert new permissions
    const newPermissions = Object.entries(selectedPermissions)
      .filter(([_, scope]) => scope !== "none")
      .map(([permissionId, scope]) => ({
        role_id: selectedRoleForPermissions.id,
        permission_id: permissionId,
        scope: scope,
      }))

    if (newPermissions.length > 0) {
      const { error } = await supabase
        .from("role_permissions")
        .insert(newPermissions)

      if (error) {
        toast.error("Error al guardar permisos: " + error.message)
        return
      }
    }

    toast.success("Permisos actualizados correctamente")
    setShowPermissionsDialog(false)
    setSelectedRoleForPermissions(null)
    setSelectedPermissions({})
    fetchRolePermissions()
  }

  const openEditRole = (role: Role) => {
    setEditingRole(role)
    setNewRole({
      name: role.name,
      display_name: role.display_name,
      description: role.description || "",
      level: role.level,
      scope: role.scope,
    })
    setShowRoleDialog(true)
  }

  const openPermissionsDialog = (role: Role) => {
    setSelectedRoleForPermissions(role)
    
    // Load existing permissions for this role
    const existingPerms: Record<string, string> = {}
    rolePermissions
      .filter(rp => rp.role_id === role.id)
      .forEach(rp => {
        existingPerms[rp.permission_id] = rp.scope
      })
    setSelectedPermissions(existingPerms)
    setShowPermissionsDialog(true)
  }

  const resetRoleForm = () => {
    setEditingRole(null)
    setNewRole({
      name: "",
      display_name: "",
      description: "",
      level: 2,
      scope: "agency",
    })
  }

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case "global":
      case "all":
        return <Globe className="h-4 w-4" />
      case "agency":
        return <Building2 className="h-4 w-4" />
      case "project":
      case "own":
        return <FolderKanban className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case "global":
      case "all":
        return "Global"
      case "agency":
        return "Por Agencia"
      case "project":
        return "Por Proyecto"
      case "own":
        return "Propios"
      default:
        return scope
    }
  }

  // Categorias de secciones basadas en el menu lateral del dashboard
  const sectionCategories: Record<string, { label: string; icon: string; modules: string[] }> = {
    administracion: {
      label: "Administracion",
      icon: "building",
      modules: ["agencies", "users", "roles", "import_export"]
    },
    operaciones: {
      label: "Operaciones",
      icon: "briefcase",
      modules: ["clients", "accounts", "projects"]
    },
    comercial: {
      label: "Comercial",
      icon: "target",
      modules: ["crm_dashboard", "crm_pipeline", "crm_prospects", "crm_tasks", "crm_metrics", "crm_lead_sources", "crm_reassign", "services", "commissions"]
    },
    recursos_humanos: {
      label: "Recursos Humanos",
      icon: "users",
      modules: [
        "staff_own", "staff_subordinates", "staff_all",
        "organigrama", "workload",
        "payroll_own", "payroll_subordinates", "payroll_all",
        "bonuses_own", "bonuses_subordinates", "bonuses_all",
        "loans_own", "loans_subordinates", "loans_all",
        "recognitions", "training", "vacations"
      ]
    },
    finanzas: {
      label: "Finanzas",
      icon: "dollar",
      modules: ["invoices", "invoices_workflow", "invoices_third_party", "payments", "expenses", "vendors", "vendors_types", "profitability", "finance_reports", "client_reports"]
    },
    configuracion: {
      label: "Configuracion",
      icon: "cog",
      modules: ["dashboard", "settings", "profile"]
    }
  }

  const moduleLabels: Record<string, string> = {
    // Administracion
    agencies: "Agencias",
    users: "Usuarios",
    roles: "Roles y Permisos",
    import_export: "Importar/Exportar",
    
    // Operaciones
    clients: "Clientes y Marcas",
    accounts: "Cuentas",
    projects: "Proyectos",
    
    // Comercial (CRM)
    crm_dashboard: "Dashboard CRM",
    crm_pipeline: "Pipeline de Ventas",
    crm_prospects: "Prospectos",
    crm_tasks: "Tareas CRM",
    crm_metrics: "Metricas CRM",
    crm_lead_sources: "Fuentes de Leads",
    crm_reassign: "Reasignacion de Prospectos",
    services: "Servicios",
    commissions: "Comisiones de Ventas",
    
    // Recursos Humanos - Personal
    staff_own: "Mi Informacion Personal",
    staff_subordinates: "Personal de Subordinados",
    staff_all: "Todo el Personal",
    organigrama: "Organigrama",
    workload: "Cargas de Trabajo",
    
    // Recursos Humanos - Nomina y Compensaciones
    payroll_own: "Mi Nomina",
    payroll_subordinates: "Nomina de Subordinados",
    payroll_all: "Toda la Nomina",
    bonuses_own: "Mis Bonos",
    bonuses_subordinates: "Bonos de Subordinados",
    bonuses_all: "Todos los Bonos",
    loans_own: "Mis Prestamos",
    loans_subordinates: "Prestamos de Subordinados",
    loans_all: "Todos los Prestamos",
    
    // Recursos Humanos - Otros
    recognitions: "Reconocimientos",
    training: "Capacitacion",
    vacations: "Solicitud de Permisos",
    
    // Finanzas
    invoices: "Facturas y Pagos",
    invoices_workflow: "Flujo de Facturas",
    invoices_third_party: "Facturas de Terceros",
    payments: "Bancos e Ingresos",
    expenses: "Gastos",
    vendors: "Proveedores",
    vendors_types: "Tipos de Proveedores",
    profitability: "Rentabilidad",
    finance_reports: "Informes Financieros",
    client_reports: "Informes de Clientes",
    
    // Configuracion
    dashboard: "Dashboard Principal",
    settings: "Configuracion General",
    profile: "Mi Perfil",
  }

  const actionLabels: Record<string, string> = {
    // Acciones basicas CRUD
    create: "Crear",
    read: "Ver",
    update: "Editar",
    delete: "Eliminar",
    
    // Acciones de aprobacion
    approve: "Aprobar",
    reject: "Rechazar",
    
    // Acciones de asignacion
    assign: "Asignar",
    assign_role: "Asignar Rol",
    assign_team: "Asignar Equipo",
    reassign: "Reasignar",
    
    // Acciones de visualizacion
    read_own: "Ver Propios",
    read_subordinates: "Ver Subordinados",
    read_all: "Ver Todos",
    read_salary: "Ver Salarios",
    read_sensitive: "Ver Datos Sensibles",
    view_budget: "Ver Presupuesto",
    
    // Acciones de gestion
    manage: "Gestionar",
    manage_roles: "Gestionar Roles",
    manage_agencies: "Gestionar Agencias",
    manage_permissions: "Gestionar Permisos",
    manage_contacts: "Gestionar Contactos",
    manage_brands: "Gestionar Marcas y Proyectos",
    manage_tasks: "Gestionar Tareas",
    manage_team: "Gestionar Equipo",
    manage_budget: "Gestionar Presupuesto",
    manage_types: "Gestionar Tipos",
    manage_workflow: "Gestionar Flujo de Trabajo",
    manage_stages: "Gestionar Etapas",
    
    // Acciones comerciales
    convert_to_client: "Convertir a Cliente",
    move_stage: "Mover de Etapa",
    add_activity: "Agregar Actividad",
    manage_placements: "Gestionar Pautas",
    manage_creatives: "Gestionar Creativos",
    manage_catalogs: "Gestionar Catálogos",
    manage_documents: "Gestionar Documentos",
    manage_payments: "Gestionar Pagos",
    
    // Acciones financieras
    create_invoice: "Crear Facturas",
    approve_expenses: "Aprobar Gastos",
    cancel: "Cancelar",
    send: "Enviar",
    change_status: "Cambiar Estado",
    validate_invoice: "Validar Factura",
    register_payment: "Registrar Pago",
    
    // Acciones de procesamiento
    process: "Procesar",
    configure: "Configurar",
    export: "Exportar",
    close: "Cerrar",
    
    // Organigrama
    view_organigrama: "Ver Organigrama",
  }

  // Función para obtener la categoría de un módulo
  const getModuleCategory = (module: string): string => {
    for (const [category, data] of Object.entries(sectionCategories)) {
      if (data.modules.includes(module)) {
        return category
      }
    }
    return "otros"
  }

  // Agrupar permisos por categoría y luego por módulo
  const permissionsByCategory = Object.entries(sectionCategories).reduce((acc, [categoryKey, categoryData]) => {
    const categoryModules = categoryData.modules
    const categoryPermissions: Record<string, Permission[]> = {}
    
    permissions.forEach(perm => {
      if (categoryModules.includes(perm.module)) {
        if (!categoryPermissions[perm.module]) {
          categoryPermissions[perm.module] = []
        }
        categoryPermissions[perm.module].push(perm)
      }
    })
    
    if (Object.keys(categoryPermissions).length > 0) {
      acc[categoryKey] = {
        label: categoryData.label,
        permissions: categoryPermissions
      }
    }
    
    return acc
  }, {} as Record<string, { label: string; permissions: Record<string, Permission[]> }>)

  // Group permissions by module
  const permissionsByModule = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = []
    }
    acc[perm.module].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  const getRolePermissionCount = (roleId: string) => {
    return rolePermissions.filter(rp => rp.role_id === roleId).length
  }

  // Funcion para seleccionar todos los permisos con un alcance
  const selectAllPermissions = (scope: string) => {
    const newPerms: Record<string, string> = {}
    permissions.forEach(perm => {
      newPerms[perm.id] = scope
    })
    setSelectedPermissions(newPerms)
  }

  // Funcion para seleccionar todos los permisos de una categoria
  const selectCategoryPermissions = (categoryKey: string, scope: string) => {
    const categoryModules = sectionCategories[categoryKey]?.modules || []
    const newPerms = { ...selectedPermissions }
    permissions.forEach(perm => {
      if (categoryModules.includes(perm.module)) {
        newPerms[perm.id] = scope
      }
    })
    setSelectedPermissions(newPerms)
  }

  // Funcion para seleccionar todos los permisos de un modulo
  const selectModulePermissions = (module: string, scope: string) => {
    const newPerms = { ...selectedPermissions }
    permissions.forEach(perm => {
      if (perm.module === module) {
        newPerms[perm.id] = scope
      }
    })
    setSelectedPermissions(newPerms)
  }

  // Verificar si todos los permisos de una categoria tienen cierto alcance
  const getCategoryPermissionStatus = (categoryKey: string): string => {
    const categoryModules = sectionCategories[categoryKey]?.modules || []
    const categoryPerms = permissions.filter(p => categoryModules.includes(p.module))
    if (categoryPerms.length === 0) return "none"
    
    const scopes = categoryPerms.map(p => selectedPermissions[p.id] || "none")
    const allSame = scopes.every(s => s === scopes[0])
    return allSame ? scopes[0] : "mixed"
  }

  // Verificar si todos los permisos de un modulo tienen cierto alcance
  const getModulePermissionStatus = (module: string): string => {
    const modulePerms = permissions.filter(p => p.module === module)
    if (modulePerms.length === 0) return "none"
    
    const scopes = modulePerms.map(p => selectedPermissions[p.id] || "none")
    const allSame = scopes.every(s => s === scopes[0])
    return allSame ? scopes[0] : "mixed"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Roles y Permisos</h1>
          <p className="text-muted-foreground">
            {canEdit 
              ? "Gestiona los roles del sistema y sus permisos" 
              : "Visualiza los roles del sistema y sus permisos asignados"}
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => { resetRoleForm(); setShowRoleDialog(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Rol
          </Button>
        )}
      </div>

      {!canEdit && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
          <AlertCircle className="h-5 w-5" />
          <span>Solo el Super Administrador y Director General pueden modificar roles y permisos.</span>
        </div>
      )}

      <Tabs defaultValue="roles">
        <TabsList>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permisos
          </TabsTrigger>
          <TabsTrigger value="matrix" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Matriz de Permisos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Roles del Sistema
              </CardTitle>
              <CardDescription>
                Los roles definen el nivel de acceso de cada usuario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rol</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Alcance</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Permisos</TableHead>
                    <TableHead>Tipo</TableHead>
                    {canEdit && <TableHead className="text-right">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getScopeIcon(role.scope)}
                          {role.display_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {role.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getScopeLabel(role.scope)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{role.level}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getRolePermissionCount(role.id)} permisos
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {role.is_system ? (
                          <Badge variant="secondary">
                            <Lock className="h-3 w-3 mr-1" />
                            Sistema
                          </Badge>
                        ) : (
                          <Badge>Personalizado</Badge>
                        )}
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              title="Gestionar permisos"
                            >
                              <Link href={`/dashboard/roles/${role.id}/permissions`}>
                                <Shield className="h-4 w-4" />
                              </Link>
                            </Button>
<Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditRole(role)}
                          title="Editar rol"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                            {!role.is_system && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setRoleToDelete(role); setShowDeleteDialog(true) }}
                                title="Eliminar rol"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Role Hierarchy */}
          <Card>
            <CardHeader>
              <CardTitle>Jerarquía de Roles</CardTitle>
              <CardDescription>
                Los roles con menor nivel tienen mayor jerarquía y más permisos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {roles.map((role, index) => (
                  <div
                    key={role.id}
                    className="flex items-center gap-4"
                    style={{ paddingLeft: `${Math.min(index * 12, 60)}px` }}
                  >
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: `hsl(${250 - role.level * 20}, 70%, ${50 + role.level * 5}%)`,
                        color: role.level < 2 ? "white" : "black",
                      }}
                    >
                      {role.level}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{role.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getScopeLabel(role.scope)} - {getRolePermissionCount(role.id)} permisos
                      </p>
                    </div>
                    {role.is_system && (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <div className="space-y-6">
            {Object.entries(permissionsByCategory).map(([categoryKey, categoryData]) => (
              <Card key={categoryKey}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
{categoryKey === "administracion" && <Building2 className="h-5 w-5 text-blue-600" />}
  {categoryKey === "operaciones" && <Briefcase className="h-5 w-5 text-green-600" />}
  {categoryKey === "comercial" && <Target className="h-5 w-5 text-orange-600" />}
  {categoryKey === "recursos_humanos" && <Users className="h-5 w-5 text-purple-600" />}
  {categoryKey === "finanzas" && <DollarSign className="h-5 w-5 text-amber-600" />}
  {categoryKey === "configuracion" && <Settings className="h-5 w-5 text-rose-600" />}
  {categoryData.label}
  </CardTitle>
  <CardDescription>
  Permisos relacionados con {categoryData.label.toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full">
                    {Object.entries(categoryData.permissions).map(([module, perms]) => (
                      <AccordionItem key={module} value={module}>
                        <AccordionTrigger className="text-sm font-medium hover:no-underline">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            {moduleLabels[module] || module}
                            <Badge variant="secondary" className="ml-2">
                              {perms.length} {perms.length === 1 ? "permiso" : "permisos"}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid gap-2 pl-6">
                            {perms.map((perm) => (
                              <div
                                key={perm.id}
                                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                              >
                                <div>
                                  <p className="text-sm font-medium">
                                    {actionLabels[perm.action] || perm.action}
                                  </p>
                                  {perm.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {perm.description}
                                    </p>
                                  )}
                                </div>
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                  {perm.module}:{perm.action}
                                </code>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Permisos</CardTitle>
              <CardDescription>
                Vista consolidada de permisos por rol, organizada por secciones
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background min-w-[200px]">Sección / Módulo / Acción</TableHead>
                    {roles.map((role) => (
                      <TableHead key={role.id} className="text-center min-w-[100px]">
                        <div className="flex flex-col items-center gap-1">
                          {getScopeIcon(role.scope)}
                          <span className="text-xs">{role.display_name}</span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(permissionsByCategory).map(([categoryKey, categoryData]) => (
                    <>
                      {/* Category Header */}
                      <TableRow key={`cat-${categoryKey}`} className="bg-primary/10">
                        <TableCell colSpan={roles.length + 1} className="font-bold text-primary">
                          <div className="flex items-center gap-2">
{categoryKey === "administracion" && <Building2 className="h-4 w-4" />}
  {categoryKey === "operaciones" && <Briefcase className="h-4 w-4" />}
  {categoryKey === "comercial" && <Target className="h-4 w-4" />}
  {categoryKey === "recursos_humanos" && <Users className="h-4 w-4" />}
  {categoryKey === "finanzas" && <DollarSign className="h-4 w-4" />}
  {categoryKey === "configuracion" && <Settings className="h-4 w-4" />}
  {categoryData.label}
  </div>
  </TableCell>
  </TableRow>
  {/* Module and Permissions */}
                      {Object.entries(categoryData.permissions).map(([module, perms]) => (
                        <>
                          <TableRow key={`mod-${module}`} className="bg-muted/50">
                            <TableCell colSpan={roles.length + 1} className="font-medium pl-6">
                              {moduleLabels[module] || module}
                            </TableCell>
                          </TableRow>
                          {perms.map((perm) => (
                            <TableRow key={perm.id}>
                              <TableCell className="sticky left-0 bg-background pl-10">
                                {actionLabels[perm.action] || perm.action}
                              </TableCell>
                              {roles.map((role) => {
                                const hasPermission = rolePermissions.some(
                                  rp => rp.role_id === role.id && rp.permission_id === perm.id
                                )
                                const permScope = rolePermissions.find(
                                  rp => rp.role_id === role.id && rp.permission_id === perm.id
                                )?.scope
                                return (
                                  <TableCell key={role.id} className="text-center">
                                    {hasPermission ? (
                                      <Badge variant="default" className="text-xs">
                                        {permScope === "all" ? "Global" : 
                                         permScope === "agency" ? "Agencia" : 
                                         permScope === "own" ? "Propio" : permScope}
                                      </Badge>
                                    ) : (
                                      <EyeOff className="h-4 w-4 mx-auto text-muted-foreground/30" />
                                    )}
                                  </TableCell>
                                )
                              })}
                            </TableRow>
                          ))}
                        </>
                      ))}
                    </>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? "Editar Rol" : "Nuevo Rol"}</DialogTitle>
            <DialogDescription>
              {editingRole ? "Modifica los datos del rol" : "Crea un nuevo rol en el sistema"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!editingRole && (
              <div className="space-y-2">
                <Label>Nombre interno *</Label>
                <Input
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="nombre_rol"
                />
                <p className="text-xs text-muted-foreground">
                  Solo minúsculas y guiones bajos. Se usará como identificador.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Nombre para mostrar *</Label>
              <Input
                value={newRole.display_name}
                onChange={(e) => setNewRole({ ...newRole, display_name: e.target.value })}
                placeholder="Nombre del Rol"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                placeholder="Descripción del rol..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nivel de jerarquía</Label>
                <Select 
                  value={newRole.level.toString()} 
                  onValueChange={(value) => setNewRole({ ...newRole, level: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 - Máximo (Dirección)</SelectItem>
                    <SelectItem value="1">1 - Alto (Gerencia)</SelectItem>
                    <SelectItem value="2">2 - Medio (Liderazgo)</SelectItem>
                    <SelectItem value="3">3 - Básico (Operativo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Alcance</Label>
                <Select 
                  value={newRole.scope} 
                  onValueChange={(value) => setNewRole({ ...newRole, scope: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="agency">Por Agencia</SelectItem>
                    <SelectItem value="project">Por Proyecto</SelectItem>
                    <SelectItem value="own">Solo propios</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRole}>
              <Save className="h-4 w-4 mr-2" />
              {editingRole ? "Guardar cambios" : "Crear rol"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Permisos de: {selectedRoleForPermissions?.display_name}
            </DialogTitle>
            <DialogDescription>
              Selecciona los permisos y su alcance para este rol. Los permisos estan organizados por seccion.
            </DialogDescription>
          </DialogHeader>
          
          {/* Acciones globales - Todos */}
          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Todos los permisos</p>
                <p className="text-xs text-muted-foreground">Asignar el mismo alcance a todos los permisos del sistema</p>
              </div>
            </div>
            <Select
              value=""
              onValueChange={(value) => selectAllPermissions(value)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Aplicar a todos..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin acceso</SelectItem>
                <SelectItem value="own">Solo propios</SelectItem>
                <SelectItem value="agency">Por agencia</SelectItem>
                <SelectItem value="all">Acceso Global</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-6">
            {Object.entries(permissionsByCategory).map(([categoryKey, categoryData]) => (
              <div key={categoryKey} className="space-y-3">
                {/* Category Header con selector de "Todos" para la seccion */}
                <div className="flex items-center justify-between pb-2 border-b bg-muted/30 -mx-6 px-6 py-3 rounded-t-lg">
                  <div className="flex items-center gap-2">
{categoryKey === "administracion" && <Building2 className="h-5 w-5 text-blue-600" />}
  {categoryKey === "operaciones" && <Briefcase className="h-5 w-5 text-green-600" />}
  {categoryKey === "comercial" && <Target className="h-5 w-5 text-orange-600" />}
  {categoryKey === "recursos_humanos" && <Users className="h-5 w-5 text-purple-600" />}
  {categoryKey === "finanzas" && <DollarSign className="h-5 w-5 text-amber-600" />}
  {categoryKey === "configuracion" && <Settings className="h-5 w-5 text-rose-600" />}
  <h3 className="font-semibold text-lg">{categoryData.label}</h3>
  {getCategoryPermissionStatus(categoryKey) !== "none" && getCategoryPermissionStatus(categoryKey) !== "mixed" && (
  <Badge variant="secondary" className="ml-2">
  {getCategoryPermissionStatus(categoryKey) === "all" ? "Global" :
  getCategoryPermissionStatus(categoryKey) === "agency" ? "Agencia" :
  getCategoryPermissionStatus(categoryKey) === "own" ? "Propios" : ""}
                      </Badge>
                    )}
                  </div>
                  <Select
                    value=""
                    onValueChange={(value) => selectCategoryPermissions(categoryKey, value)}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Todos en seccion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin acceso</SelectItem>
                      <SelectItem value="own">Solo propios</SelectItem>
                      <SelectItem value="agency">Por agencia</SelectItem>
                      <SelectItem value="all">Acceso Global</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Modules within category */}
                <div className="space-y-3 pl-2">
                  {Object.entries(categoryData.permissions).map(([module, perms]) => (
                    <div key={module} className="border rounded-lg p-4 bg-muted/20">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium flex items-center gap-2 text-sm">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          {moduleLabels[module] || module}
                          <Badge variant="outline">
                            {perms.length} {perms.length === 1 ? "permiso" : "permisos"}
                          </Badge>
                          {getModulePermissionStatus(module) !== "none" && getModulePermissionStatus(module) !== "mixed" && (
                            <Badge variant="secondary" className="text-xs">
                              {getModulePermissionStatus(module) === "all" ? "Global" : 
                               getModulePermissionStatus(module) === "agency" ? "Agencia" : 
                               getModulePermissionStatus(module) === "own" ? "Propios" : ""}
                            </Badge>
                          )}
                        </h4>
                        <Select
                          value=""
                          onValueChange={(value) => selectModulePermissions(module, value)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Todos..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin acceso</SelectItem>
                            <SelectItem value="own">Solo propios</SelectItem>
                            <SelectItem value="agency">Por agencia</SelectItem>
                            <SelectItem value="all">Global</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        {perms.map((perm) => (
                          <div key={perm.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                            <div className="flex-1 min-w-0 mr-4">
                              <p className="text-sm font-medium">{actionLabels[perm.action] || perm.action}</p>
                              {perm.description && (
                                <p className="text-xs text-muted-foreground truncate">{perm.description}</p>
                              )}
                            </div>
                            <Select
                              value={selectedPermissions[perm.id] || "none"}
                              onValueChange={(value) => setSelectedPermissions({
                                ...selectedPermissions,
                                [perm.id]: value
                              })}
                            >
                              <SelectTrigger className="w-[140px] flex-shrink-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Sin acceso</SelectItem>
                                <SelectItem value="own">Solo propios</SelectItem>
                                <SelectItem value="agency">Por agencia</SelectItem>
                                <SelectItem value="all">Global</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t">
            <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePermissions}>
              <Save className="h-4 w-4 mr-2" />
              Guardar permisos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Rol</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el rol "{roleToDelete?.display_name}"? 
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteRole}>
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
