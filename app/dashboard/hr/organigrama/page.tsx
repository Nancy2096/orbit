"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StaffAvatar } from "@/components/staff-avatar"
import {
  Network,
  Building2,
  Globe,
  Users,
  ChevronDown,
  ChevronRight,
  Briefcase,
  FolderKanban,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  List,
  GitBranch,
  LayoutGrid,
} from "lucide-react"

interface Agency {
  id: string
  name: string
}

interface Department {
  id: string
  name: string
  agency_id: string
}

interface StaffMember {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  position: string
  department: string | null
  department_id: string | null
  reports_to_id: string | null
  is_active: boolean
  min_accounts: number | null
  max_accounts: number | null
  min_subordinates: number | null
  max_subordinates: number | null
  photo_url: string | null
  is_global: boolean
  agency_ids: string[] | null
}

interface OrgNode extends StaffMember {
  children: OrgNode[]
}

interface StaffWorkload extends StaffMember {
  accounts_count: number
  projects_count: number
  subordinate_count: number
}

export default function OrganigramaPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedAgency, setSelectedAgency] = useState<string>("")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  const [orgTree, setOrgTree] = useState<OrgNode[]>([])
  const [workloadData, setWorkloadData] = useState<StaffWorkload[]>([])
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [activeView, setActiveView] = useState<string>("jerarquica")
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchAgencies()
    }
  }, [mounted])

  useEffect(() => {
    if (selectedAgency) {
      setSelectedDepartment("all")
      fetchAgencyData()
    }
  }, [selectedAgency])

  async function fetchAgencies() {
    const { data } = await supabase
      .from("agencies")
      .select("id, name")
      .eq("is_active", true)
      .order("name")

    if (data && data.length > 0) {
      setAgencies(data)
      setSelectedAgency(data[0].id)
    }
    setLoading(false)
  }

  async function fetchAgencyData() {
    setLoading(true)

    const isGlobalView = selectedAgency === "global"

    // En la vista Global se muestra TODO el personal activo (de todas las agencias + globales).
    // En la vista de agencia se incluyen el staff de la agencia + los globales,
    // para que las líneas de mando hacia personas globales se rendericen correctamente.
    const [deptRes, staffAgencyRes, staffGlobalRes, accountTeamRes, projectTeamRes] = await Promise.all([
      isGlobalView
        ? Promise.resolve({ data: [] as Department[] })
        : supabase
            .from("departments")
            .select("id, name, agency_id")
            .eq("agency_id", selectedAgency)
            .eq("is_active", true)
            .order("sort_order"),
      // Vista global: todo el personal activo. Vista de agencia: staff de la agencia (por agency_id o agency_ids).
      isGlobalView
        ? supabase
            .from("staff")
            .select("*, photo_url, is_global, agency_ids")
            .eq("is_active", true)
            .order("first_name")
        : supabase
            .from("staff")
            .select("*, photo_url, is_global, agency_ids")
            .eq("is_active", true)
            .or(`agency_id.eq.${selectedAgency},agency_ids.cs.{${selectedAgency}}`)
            .eq("is_global", false)
            .order("first_name"),
      // Staff global (is_global = true)
      supabase
        .from("staff")
        .select("*, photo_url, is_global, agency_ids")
        .eq("is_active", true)
        .eq("is_global", true)
        .order("first_name"),
      isGlobalView
        ? supabase
            .from("account_team_members")
            .select(`id, manager_id, coordinator_id, accounts!inner (id, status)`)
            .eq("accounts.status", "active")
        : supabase
            .from("account_team_members")
            .select(`
              id,
              manager_id,
              coordinator_id,
              accounts!inner (
                id,
                agency_id,
                status
              )
            `)
            .eq("accounts.agency_id", selectedAgency)
            .eq("accounts.status", "active"),
      isGlobalView
        ? supabase
            .from("project_team_members")
            .select(`id, manager_id, coordinator_id, projects!inner (id, status)`)
            .in("projects.status", ["active", "in_progress"])
        : supabase
            .from("project_team_members")
            .select(`
              id,
              manager_id,
              coordinator_id,
              projects!inner (
                id,
                account_id,
                status,
                accounts!inner (agency_id)
              )
            `)
            .eq("projects.accounts.agency_id", selectedAgency)
            .in("projects.status", ["active", "in_progress"]),
    ])

    if (deptRes.data) setDepartments(deptRes.data)

    // Combinar staff de agencia + staff global (evitando duplicados)
    const agencyStaff = staffAgencyRes.data || []
    const globalStaff = staffGlobalRes.data || []
    const allStaffMap = new Map<string, StaffMember>()
    
    // Primero agregar staff global (tienen prioridad para mantener jerarquía)
    globalStaff.forEach(s => allStaffMap.set(s.id, s))
    // Luego agregar staff de agencia
    agencyStaff.forEach(s => allStaffMap.set(s.id, s))
    
    const allStaff = Array.from(allStaffMap.values())

    if (allStaff.length > 0) {
      // Build org tree
      const tree = buildOrgTree(allStaff)
      setOrgTree(tree)
      const allIds = new Set(allStaff.map((s) => s.id))
      setExpandedNodes(allIds)

      // Calculate workload
      const workload = allStaff.map((staff) => {
        const accountsCount = (accountTeamRes.data?.filter(
          (a) => a.manager_id === staff.id || a.coordinator_id === staff.id
        ).length || 0)
        const projectsCount = (projectTeamRes.data?.filter(
          (p) => p.manager_id === staff.id || p.coordinator_id === staff.id
        ).length || 0)
        
        // Count direct subordinates
        const subordinateCount = allStaff.filter(
          (s) => s.reports_to_id === staff.id
        ).length || 0

        return {
          ...staff,
          accounts_count: accountsCount,
          projects_count: projectsCount,
          subordinate_count: subordinateCount,
        }
      })

      setWorkloadData(workload)
    } else {
      setOrgTree([])
      setWorkloadData([])
    }

    setLoading(false)
  }

  function buildOrgTree(staff: StaffMember[]): OrgNode[] {
    const staffMap = new Map<string, OrgNode>()

    staff.forEach((s) => {
      staffMap.set(s.id, { ...s, children: [] })
    })

    const roots: OrgNode[] = []

    staff.forEach((s) => {
      const node = staffMap.get(s.id)!
      if (s.reports_to_id && staffMap.has(s.reports_to_id)) {
        staffMap.get(s.reports_to_id)!.children.push(node)
      } else {
        roots.push(node)
      }
    })

    function sortChildren(node: OrgNode) {
      node.children.sort((a, b) =>
        `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
      )
      node.children.forEach(sortChildren)
    }

    roots.forEach(sortChildren)
    roots.sort((a, b) =>
      `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
    )

    return roots
  }

  function toggleNode(nodeId: string) {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  function expandAll() {
    const allIds = new Set<string>()
    function collectIds(nodes: OrgNode[]) {
      nodes.forEach((node) => {
        allIds.add(node.id)
        collectIds(node.children)
      })
    }
    collectIds(orgTree)
    setExpandedNodes(allIds)
  }

  function collapseAll() {
    setExpandedNodes(new Set())
  }

  function getFilteredOrgTree(): OrgNode[] {
    if (selectedDepartment === "all") return orgTree

    const departmentStaff = workloadData.filter(
      (s) => s.department_id === selectedDepartment
    )
    const departmentIds = new Set(departmentStaff.map((s) => s.id))

    function filterTree(nodes: OrgNode[]): OrgNode[] {
      return nodes
        .map((node) => {
          const filteredChildren = filterTree(node.children)
          if (departmentIds.has(node.id) || filteredChildren.length > 0) {
            return { ...node, children: filteredChildren }
          }
          return null
        })
        .filter((n): n is OrgNode => n !== null)
    }

    return filterTree(orgTree)
  }

  function getWorkloadStatus(staff: StaffWorkload): "under" | "optimal" | "over" {
    const minAccounts = staff.min_accounts || 0
    const maxAccounts = staff.max_accounts || 999

    if (staff.accounts_count < minAccounts) return "under"
    if (staff.accounts_count > maxAccounts) return "over"
    return "optimal"
  }

  function getFilteredWorkloadData(): StaffWorkload[] {
    if (selectedDepartment === "all") return workloadData
    return workloadData.filter(s => s.department_id === selectedDepartment)
  }

  // Renderizar un nodo individual con sus subordinados
  function renderOrgCard(node: OrgNode): React.ReactNode {
    const workload = workloadData.find((w) => w.id === node.id)
    const status = workload ? getWorkloadStatus(workload) : "optimal"
    
    const statusColors = {
      under: "border-amber-500 bg-amber-50 dark:bg-amber-950/30",
      optimal: "border-green-500 bg-green-50 dark:bg-green-950/30",
      over: "border-red-500 bg-red-50 dark:bg-red-950/30",
    }

    const statusBorderTop = {
      under: "bg-amber-500",
      optimal: "bg-green-500",
      over: "bg-red-500",
    }

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Tarjeta del empleado - mas compacta */}
        <div
          className={`w-36 rounded-lg border-2 shadow-md transition-all hover:shadow-lg overflow-hidden ${statusColors[status]}`}
        >
          {/* Barra superior de estado */}
          <div className={`h-1 ${statusBorderTop[status]}`} />
          
          <div className="p-2">
            <div className="flex flex-col items-center text-center">
              <StaffAvatar
                photoUrl={node.photo_url}
                firstName={node.first_name}
                lastName={node.last_name}
                className="h-10 w-10 mb-1.5 ring-2 ring-white shadow-sm"
                fallbackClassName="text-xs font-semibold"
              />
              <p className="font-bold text-xs leading-tight line-clamp-1">
                {node.first_name} {node.last_name}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{node.position}</p>
              
              {(node.is_global || node.department) && (
                <div className="flex flex-wrap justify-center gap-0.5 mt-1">
                  {node.is_global && (
                    <Badge variant="secondary" className="text-[8px] px-1 py-0 h-4 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      Global
                    </Badge>
                  )}
                  {node.department && (
                    <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 line-clamp-1">
                      {node.department}
                    </Badge>
                  )}
                </div>
              )}
              
              {workload && (
                <div className="flex items-center justify-center gap-2 mt-1.5 pt-1.5 border-t border-border/50 w-full">
                  <div className="flex items-center gap-0.5" title="Cuentas">
                    <Briefcase className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-[10px] font-semibold">{workload.accounts_count}</span>
                  </div>
                  <div className="flex items-center gap-0.5" title="Proyectos">
                    <FolderKanban className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-[10px] font-semibold">{workload.projects_count}</span>
                  </div>
                  <div className="flex items-center gap-0.5" title="Equipo">
                    <Users className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-[10px] font-semibold">{workload.subordinate_count}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Linea vertical hacia abajo si tiene hijos */}
        {node.children.length > 0 && (
          <>
            <div className="w-1 h-6 bg-slate-400 dark:bg-slate-500 rounded-full" />
            
            {/* Linea horizontal que conecta a todos los hijos */}
            {node.children.length > 1 && (
              <div className="relative flex justify-center" style={{ width: `${(node.children.length - 1) * 160 + 144}px` }}>
                <div 
                  className="h-1 bg-slate-400 dark:bg-slate-500 rounded-full"
                  style={{
                    width: `${(node.children.length - 1) * 160}px`,
                  }}
                />
              </div>
            )}
            
            {/* Contenedor de hijos */}
            <div className="flex gap-6">
              {node.children.map((child) => (
                <div key={child.id} className="flex flex-col items-center">
                  {/* Linea vertical desde la linea horizontal hacia la tarjeta */}
                  <div className="w-1 h-6 bg-slate-400 dark:bg-slate-500 rounded-full" />
                  {renderOrgCard(child)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  // Renderizar arbol de tarjetas completo
  function renderCardTree(nodes: OrgNode[]): React.ReactNode {
    if (nodes.length === 0) return null

    return (
      <div className="flex flex-wrap justify-center gap-8 overflow-x-auto pb-8 pt-4">
        {nodes.map((node) => renderOrgCard(node))}
      </div>
    )
  }

  function OrgNodeCard({ node, level = 0 }: { node: OrgNode; level?: number }) {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children.length > 0
    const workload = workloadData.find((w) => w.id === node.id)
    const workloadStatus = workload ? getWorkloadStatus(workload) : "optimal"

    const statusColors = {
      under: "border-l-amber-500",
      optimal: "border-l-green-500",
      over: "border-l-red-500",
    }

    return (
      <div className="space-y-2">
        <div
          className={`flex items-center gap-3 p-3 rounded-lg border border-l-4 bg-card hover:bg-muted/50 transition-colors ${statusColors[workloadStatus]}`}
          style={{ marginLeft: `${level * 24}px` }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              className="p-1 hover:bg-muted rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}

          <StaffAvatar
            photoUrl={node.photo_url}
            firstName={node.first_name}
            lastName={node.last_name}
            className="h-10 w-10 shrink-0"
            fallbackClassName="text-sm"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">
                {node.first_name} {node.last_name}
              </p>
              {node.is_global && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 shrink-0">
                  Global
                </Badge>
              )}
              {workloadStatus === "over" && (
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
              )}
              {workloadStatus === "under" && (
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
              )}
              {workloadStatus === "optimal" && (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{node.position}</p>
            {node.department && (
              <p className="text-xs text-muted-foreground">{node.department}</p>
            )}
          </div>

          {workload && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1" title="Cuentas">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>{workload.accounts_count}</span>
              </div>
              <div className="flex items-center gap-1" title="Proyectos">
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                <span>{workload.projects_count}</span>
              </div>
              <div className="flex items-center gap-1" title="Subordinados">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{workload.subordinate_count}</span>
              </div>
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child) => (
              <OrgNodeCard key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (!mounted) return null

  const totalStaff = workloadData.length
  const totalWithSubordinates = workloadData.filter(s => s.subordinate_count > 0).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Network className="h-8 w-8" />
            Organigrama
          </h1>
          <p className="text-muted-foreground">
            {selectedAgency === "global"
              ? "Estructura organizacional global: personas que mantienen su puesto y nivel en todas las agencias"
              : "Visualiza la estructura organizacional del equipo"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedAgency} onValueChange={setSelectedAgency}>
            <SelectTrigger className="w-[220px]">
              {selectedAgency === "global" ? (
                <Globe className="h-4 w-4 mr-2" />
              ) : (
                <Building2 className="h-4 w-4 mr-2" />
              )}
              <SelectValue placeholder="Seleccionar organigrama" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">
                <span className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Organigrama Global
                </span>
              </SelectItem>
              {agencies.map((agency) => (
                <SelectItem key={agency.id} value={agency.id}>
                  {agency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedAgency !== "global" && (
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[200px]">
                <Users className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las áreas</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalStaff}</p>
                    <p className="text-sm text-muted-foreground">Total Personal</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Network className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalWithSubordinates}</p>
                    <p className="text-sm text-muted-foreground">Con Subordinados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Building2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{departments.length}</p>
                    <p className="text-sm text-muted-foreground">Departamentos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs de Vistas */}
          <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="jerarquica" className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Jerárquica
              </TabsTrigger>
              <TabsTrigger value="tarjetas" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                Tarjetas
              </TabsTrigger>
              <TabsTrigger value="lista" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Lista
              </TabsTrigger>
            </TabsList>

            {/* Vista Jerárquica (Original) */}
            <TabsContent value="jerarquica" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Estructura Organizacional</CardTitle>
                      <CardDescription>
                        Jerarquía del equipo con indicadores de carga de trabajo
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={expandAll}>
                        Expandir todo
                      </Button>
                      <Button variant="outline" size="sm" onClick={collapseAll}>
                        Colapsar todo
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {getFilteredOrgTree().length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No hay personal en esta área</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getFilteredOrgTree().map((node) => (
                        <OrgNodeCard key={node.id} node={node} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Carga óptima</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span>Subcarga</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Sobrecarga</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    Global
                  </Badge>
                  <span>Miembro en todas las agencias</span>
                </div>
              </div>
            </TabsContent>

            {/* Vista de Tarjetas (Grid) */}
            <TabsContent value="tarjetas" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Vista de Tarjetas</CardTitle>
                  <CardDescription>
                    Organigrama visual con tarjetas conectadas por niveles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {getFilteredOrgTree().length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No hay personal en esta área</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Renderizar árbol por niveles */}
                      {renderCardTree(getFilteredOrgTree())}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Vista de Lista/Tabla */}
            <TabsContent value="lista" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Vista de Lista</CardTitle>
                  <CardDescription>
                    Listado completo del personal con su jerarquía
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {workloadData.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No hay personal en esta área</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Empleado</TableHead>
                          <TableHead>Puesto</TableHead>
                          <TableHead>Departamento</TableHead>
                          <TableHead>Reporta a</TableHead>
                          <TableHead className="text-center">Subordinados</TableHead>
                          <TableHead className="text-center">Cuentas</TableHead>
                          <TableHead className="text-center">Proyectos</TableHead>
                          <TableHead className="text-center">Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredWorkloadData().map((staff) => {
                          const reportsTo = workloadData.find(s => s.id === staff.reports_to_id)
                          const status = getWorkloadStatus(staff)
                          return (
                            <TableRow key={staff.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <StaffAvatar
                                    photoUrl={staff.photo_url}
                                    firstName={staff.first_name}
                                    lastName={staff.last_name}
                                    className="h-8 w-8"
                                    fallbackClassName="text-xs"
                                  />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">{staff.first_name} {staff.last_name}</p>
                                      {staff.is_global && (
                                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                          Global
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{staff.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{staff.position}</TableCell>
                              <TableCell>{staff.department || "-"}</TableCell>
                              <TableCell>
                                {reportsTo ? (
                                  <span className="text-sm">{reportsTo.first_name} {reportsTo.last_name}</span>
                                ) : (
                                  <Badge variant="outline">Sin jefe directo</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary">{staff.subordinate_count}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary">{staff.accounts_count}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary">{staff.projects_count}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {status === "optimal" && (
                                  <Badge className="bg-green-500 hover:bg-green-600">Óptimo</Badge>
                                )}
                                {status === "under" && (
                                  <Badge className="bg-amber-500 hover:bg-amber-600">Subcarga</Badge>
                                )}
                                {status === "over" && (
                                  <Badge className="bg-red-500 hover:bg-red-600">Sobrecarga</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
