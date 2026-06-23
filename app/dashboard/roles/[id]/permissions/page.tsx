"use client"

import { useState, useEffect, useMemo, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  Building2,
  Briefcase,
  Target,
  Users,
  DollarSign,
  Settings,
  Shield,
  Save,
  ArrowLeft,
  Search,
  Globe,
  CheckCircle2,
  Lock,
  RotateCcw,
} from "lucide-react"
import { toast } from "sonner"
import {
  sectionCategories,
  moduleLabels,
  actionLabels,
  getScopeLabel,
} from "@/lib/permissions-config"

interface Role {
  id: string
  name: string
  display_name: string
  description: string
  level: number
  scope: string
  is_system: boolean
}

interface Permission {
  id: string
  module: string
  action: string
  description: string
}

interface RolePermission {
  role_id: string
  permission_id: string
  scope: string
}

const SCOPE_OPTIONS = [
  { value: "none", label: "Sin acceso" },
  { value: "own", label: "Solo propios" },
  { value: "agency", label: "Por agencia" },
  { value: "all", label: "Global" },
]

const categoryIcons: Record<string, React.ReactNode> = {
  administracion: <Building2 className="h-5 w-5 text-blue-600" />,
  operaciones: <Briefcase className="h-5 w-5 text-green-600" />,
  comercial: <Target className="h-5 w-5 text-orange-600" />,
  recursos_humanos: <Users className="h-5 w-5 text-purple-600" />,
  finanzas: <DollarSign className="h-5 w-5 text-amber-600" />,
  configuracion: <Settings className="h-5 w-5 text-rose-600" />,
}

function scopeBadgeClass(scope: string): string {
  switch (scope) {
    case "all":
      return "bg-primary/15 text-primary border-primary/30"
    case "agency":
      return "bg-blue-100 text-blue-700 border-blue-200"
    case "own":
      return "bg-amber-100 text-amber-700 border-amber-200"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export default function ManagePermissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [role, setRole] = useState<Role | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string>>({})
  const [initialPermissions, setInitialPermissions] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")

  useEffect(() => {
    void init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const init = async () => {
    setLoading(true)
    await Promise.all([checkUserPermissions(), fetchAll()])
    setLoading(false)
  }

  const checkUserPermissions = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: staffData } = await supabase
      .from("staff")
      .select("role_id, roles:role_id(name, level)")
      .eq("user_id", user.id)
      .single()
    if (staffData?.roles) {
      const roleData = staffData.roles as { name: string; level: number }
      const editableRoles = ["superadmin", "super_admin", "direccion_general"]
      setCanEdit(roleData.level <= 1 || editableRoles.includes(roleData.name))
    } else {
      setCanEdit(true)
    }
  }

  const fetchAll = async () => {
    const [{ data: roleData }, { data: permsData }, { data: rolePermsData }] = await Promise.all([
      supabase.from("roles").select("*").eq("id", id).single(),
      supabase.from("permissions").select("*").order("module", { ascending: true }),
      supabase.from("role_permissions").select("role_id, permission_id, scope").eq("role_id", id),
    ])

    if (roleData) setRole(roleData)
    if (permsData) setPermissions(permsData)

    const existing: Record<string, string> = {}
    ;(rolePermsData as RolePermission[] | null)?.forEach((rp) => {
      existing[rp.permission_id] = rp.scope
    })
    setSelectedPermissions(existing)
    setInitialPermissions(existing)
  }

  // Agrupa permisos por categoría -> módulo
  const permissionsByCategory = useMemo(() => {
    return Object.entries(sectionCategories).reduce((acc, [categoryKey, categoryData]) => {
      const categoryPermissions: Record<string, Permission[]> = {}
      permissions.forEach((perm) => {
        if (categoryData.modules.includes(perm.module)) {
          if (!categoryPermissions[perm.module]) categoryPermissions[perm.module] = []
          categoryPermissions[perm.module].push(perm)
        }
      })
      if (Object.keys(categoryPermissions).length > 0) {
        acc[categoryKey] = { label: categoryData.label, permissions: categoryPermissions }
      }
      return acc
    }, {} as Record<string, { label: string; permissions: Record<string, Permission[]> }>)
  }, [permissions])

  const setPerm = (permId: string, scope: string) => {
    setSelectedPermissions((prev) => ({ ...prev, [permId]: scope }))
  }

  const selectAll = (scope: string) => {
    const next: Record<string, string> = {}
    permissions.forEach((p) => { next[p.id] = scope })
    setSelectedPermissions(next)
  }

  const selectCategory = (categoryKey: string, scope: string) => {
    const modules = sectionCategories[categoryKey]?.modules || []
    setSelectedPermissions((prev) => {
      const next = { ...prev }
      permissions.forEach((p) => { if (modules.includes(p.module)) next[p.id] = scope })
      return next
    })
  }

  const selectModule = (module: string, scope: string) => {
    setSelectedPermissions((prev) => {
      const next = { ...prev }
      permissions.forEach((p) => { if (p.module === module) next[p.id] = scope })
      return next
    })
  }

  const categoryStatus = (categoryKey: string): string => {
    const modules = sectionCategories[categoryKey]?.modules || []
    const perms = permissions.filter((p) => modules.includes(p.module))
    if (perms.length === 0) return "none"
    const scopes = perms.map((p) => selectedPermissions[p.id] || "none")
    return scopes.every((s) => s === scopes[0]) ? scopes[0] : "mixed"
  }

  const moduleStatus = (module: string): string => {
    const perms = permissions.filter((p) => p.module === module)
    if (perms.length === 0) return "none"
    const scopes = perms.map((p) => selectedPermissions[p.id] || "none")
    return scopes.every((s) => s === scopes[0]) ? scopes[0] : "mixed"
  }

  // Resumen: total con acceso
  const grantedCount = useMemo(
    () => Object.values(selectedPermissions).filter((s) => s && s !== "none").length,
    [selectedPermissions],
  )

  const hasChanges = useMemo(() => {
    const keys = new Set([...Object.keys(selectedPermissions), ...Object.keys(initialPermissions)])
    for (const k of keys) {
      const a = selectedPermissions[k] || "none"
      const b = initialPermissions[k] || "none"
      if (a !== b) return true
    }
    return false
  }, [selectedPermissions, initialPermissions])

  const handleSave = async () => {
    if (!role) return
    setSaving(true)

    const { error: deleteError } = await supabase
      .from("role_permissions")
      .delete()
      .eq("role_id", role.id)

    if (deleteError) {
      toast.error("Error al guardar permisos: " + deleteError.message)
      setSaving(false)
      return
    }

    const newPermissions = Object.entries(selectedPermissions)
      .filter(([, scope]) => scope && scope !== "none")
      .map(([permissionId, scope]) => ({
        role_id: role.id,
        permission_id: permissionId,
        scope,
      }))

    if (newPermissions.length > 0) {
      const { error } = await supabase.from("role_permissions").insert(newPermissions)
      if (error) {
        toast.error("Error al guardar permisos: " + error.message)
        setSaving(false)
        return
      }
    }

    setInitialPermissions(selectedPermissions)
    setSaving(false)
    toast.success("Permisos actualizados correctamente")
  }

  const handleReset = () => {
    setSelectedPermissions(initialPermissions)
    toast.info("Cambios descartados")
  }

  // Filtra categorías por búsqueda y categoría activa
  const visibleCategories = useMemo(() => {
    const term = search.trim().toLowerCase()
    return Object.entries(permissionsByCategory).filter(([categoryKey, categoryData]) => {
      if (activeCategory !== "all" && activeCategory !== categoryKey) return false
      if (!term) return true
      // Coincide si la categoría, módulo o acción contienen el término
      if (categoryData.label.toLowerCase().includes(term)) return true
      return Object.entries(categoryData.permissions).some(([module, perms]) => {
        if ((moduleLabels[module] || module).toLowerCase().includes(term)) return true
        return perms.some((p) => (actionLabels[p.action] || p.action).toLowerCase().includes(term))
      })
    })
  }, [permissionsByCategory, search, activeCategory])

  const filterPerms = (perms: Permission[]) => {
    const term = search.trim().toLowerCase()
    if (!term) return perms
    return perms.filter((p) => (actionLabels[p.action] || p.action).toLowerCase().includes(term) ||
      (p.description || "").toLowerCase().includes(term))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8 text-muted-foreground" />
      </div>
    )
  }

  if (!role) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/roles">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Roles
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No se encontró el rol solicitado.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="w-fit" asChild>
          <Link href="/dashboard/roles">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Roles
          </Link>
        </Button>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                Gestionar Permisos
                {role.is_system && (
                  <Badge variant="secondary">
                    <Lock className="h-3 w-3 mr-1" />
                    Sistema
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground">
                {role.display_name} — {getScopeLabel(role.scope)} · Nivel {role.level}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{grantedCount}</p>
              <p className="text-xs text-muted-foreground">permisos con acceso</p>
            </div>
          </div>
        </div>
      </div>

      {!canEdit && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
          <Lock className="h-5 w-5" />
          <span>Solo lectura. No tienes permisos para modificar este rol.</span>
        </div>
      )}

      {/* Toolbar */}
      <Card>
        <CardContent className="py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar permiso, módulo o sección..."
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-3">
            <Select value="" onValueChange={(v) => selectAll(v)} disabled={!canEdit}>
              <SelectTrigger className="w-[200px]">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <SelectValue placeholder="Aplicar a todos..." />
                </div>
              </SelectTrigger>
              <SelectContent>
                {SCOPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveCategory("all")}
        >
          Todas
        </Button>
        {Object.entries(permissionsByCategory).map(([categoryKey, categoryData]) => (
          <Button
            key={categoryKey}
            variant={activeCategory === categoryKey ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(categoryKey)}
            className="gap-2"
          >
            {categoryIcons[categoryKey]}
            {categoryData.label}
          </Button>
        ))}
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {visibleCategories.map(([categoryKey, categoryData]) => {
          const status = categoryStatus(categoryKey)
          return (
            <Card key={categoryKey}>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2">
                    {categoryIcons[categoryKey]}
                    <CardTitle className="text-lg">{categoryData.label}</CardTitle>
                    {status !== "none" && status !== "mixed" && (
                      <Badge variant="outline" className={scopeBadgeClass(status)}>
                        {getScopeLabel(status)}
                      </Badge>
                    )}
                  </div>
                  <Select value="" onValueChange={(v) => selectCategory(categoryKey, v)} disabled={!canEdit}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Toda la sección..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SCOPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(categoryData.permissions).map(([module, perms]) => {
                  const visiblePerms = filterPerms(perms)
                  if (visiblePerms.length === 0) return null
                  const modStatus = moduleStatus(module)
                  return (
                    <div key={module} className="border rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between gap-3 bg-muted/40 px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium text-sm truncate">
                            {moduleLabels[module] || module}
                          </span>
                          <Badge variant="outline" className="shrink-0">
                            {perms.length}
                          </Badge>
                          {modStatus !== "none" && modStatus !== "mixed" && (
                            <Badge variant="outline" className={`shrink-0 ${scopeBadgeClass(modStatus)}`}>
                              {getScopeLabel(modStatus)}
                            </Badge>
                          )}
                        </div>
                        <Select value="" onValueChange={(v) => selectModule(module, v)} disabled={!canEdit}>
                          <SelectTrigger className="w-[150px] shrink-0">
                            <SelectValue placeholder="Todo el módulo..." />
                          </SelectTrigger>
                          <SelectContent>
                            {SCOPE_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="divide-y">
                        {visiblePerms.map((perm) => {
                          const current = selectedPermissions[perm.id] || "none"
                          return (
                            <div
                              key={perm.id}
                              className="flex items-center justify-between gap-4 px-4 py-2.5 hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {current !== "none" ? (
                                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                ) : (
                                  <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <p className="text-sm font-medium">
                                    {actionLabels[perm.action] || perm.action}
                                  </p>
                                  {perm.description && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {perm.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Select
                                value={current}
                                onValueChange={(v) => setPerm(perm.id, v)}
                                disabled={!canEdit}
                              >
                                <SelectTrigger className="w-[140px] shrink-0">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {SCOPE_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )
        })}

        {visibleCategories.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No se encontraron permisos que coincidan con la búsqueda.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sticky action bar */}
      {canEdit && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 backdrop-blur md:left-64">
          <div className="flex items-center justify-between gap-4 px-6 py-3">
            <p className="text-sm text-muted-foreground">
              {hasChanges ? (
                <span className="text-foreground font-medium">Tienes cambios sin guardar</span>
              ) : (
                "Sin cambios pendientes"
              )}
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleReset} disabled={!hasChanges || saving}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Descartar
              </Button>
              <Button onClick={handleSave} disabled={!hasChanges || saving}>
                {saving ? (
                  <Spinner className="h-4 w-4 mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar permisos
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
