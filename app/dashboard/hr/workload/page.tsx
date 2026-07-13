"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Activity,
  Building2,
  Users,
  ChevronDown,
  ChevronRight,
  Briefcase,
  FolderKanban,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  Filter,
  X,
  CalendarDays,
  User,
  RefreshCw,
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

interface Position {
  id: string
  name: string
  level: number | null
  min_accounts: number | null
  max_accounts: number | null
  min_projects: number | null
  max_projects: number | null
  min_subordinates: number | null
  max_subordinates: number | null
}

interface Department {
  id: string
  name: string
}

interface StaffMember {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  position: string
  position_id: string | null
  department: string | null
  department_id: string | null
  reports_to_id: string | null
  is_active: boolean
  is_global: boolean
  agency_ids: string[] | null
  positions: Position | null
  departments: Department | null
}

interface OrgNode extends StaffMember {
  children: OrgNode[]
}

interface StaffWorkload extends StaffMember {
  // Cuentas donde el empleado participa (account_team_members).
  // Una cuenta involucra varios departamentos; cada uno tiene un
  // gerente y un coordinador. Se cuentan cuentas DISTINTAS por rol.
  accounts_as_manager: number
  accounts_as_coordinator: number
  accounts_commercial: number
  total_accounts: number
  // Proyectos
  projects_as_manager: number
  projects_as_coordinator: number
  total_projects: number
  total_assignments: number
  // Detalle de nombres de cuentas y proyectos asignados (para desglose de
  // empleados que no son gerentes ni directores).
  assigned_accounts: { id: string; name: string; roles: string[] }[]
  assigned_projects: { id: string; name: string; roles: string[] }[]
  // Subordinados (de la relación reports_to_id en staff)
  subordinate_count: number
  // Cargas desde el puesto (Puestos y Cargas de la agencia)
  min_accounts: number
  max_accounts: number
  min_projects: number
  max_projects: number
  min_subordinates: number
  max_subordinates: number
}

export default function WorkloadPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedAgency, setSelectedAgency] = useState<string>("")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  const [orgTree, setOrgTree] = useState<OrgNode[]>([])
  const [workloadData, setWorkloadData] = useState<StaffWorkload[]>([])
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedPerson, setSelectedPerson] = useState("all")
  const [selectedAccount, setSelectedAccount] = useState("all")
  const [accounts, setAccounts] = useState<{id: string; name: string}[]>([])
  const supabase = createClient()
  
  const activeFiltersCount = [dateFrom, dateTo, selectedPerson !== "all" ? selectedPerson : "", selectedAccount !== "all" ? selectedAccount : ""].filter(Boolean).length

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
      fetchAgencyData()
    }
  }, [selectedAgency])

  // Auto-actualización: mantener las cargas de trabajo sincronizadas cuando se
  // hacen cambios en cuentas o proyectos (desde otra pantalla, pestaña o usuario).
  useEffect(() => {
    if (!selectedAgency) return

    // 1) Realtime: recargar (en silencio) ante cambios en las tablas relevantes.
    const channel = supabase
      .channel("workload-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "accounts" }, () => {
        fetchAgencyData({ silent: true })
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => {
        fetchAgencyData({ silent: true })
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "project_team_members" }, () => {
        fetchAgencyData({ silent: true })
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "staff" }, () => {
        fetchAgencyData({ silent: true })
      })
      .subscribe()

    // 2) Respaldo: recargar al volver el foco o visibilidad de la pestaña,
    // por si realtime no está habilitado en el proyecto.
    const handleRefocus = () => {
      if (document.visibilityState === "visible") {
        fetchAgencyData({ silent: true })
      }
    }
    window.addEventListener("focus", handleRefocus)
    document.addEventListener("visibilitychange", handleRefocus)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener("focus", handleRefocus)
      document.removeEventListener("visibilitychange", handleRefocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgency])

  async function fetchAgencies() {
    const { data } = await supabase
      .from("agencies")
      .select("id, name")
      .eq("is_active", true)
      .order("name")

    if (data && data.length > 0) {
      setAgencies(data)
      setSelectedAgency("all") // Default to all agencies
    }
    
    // Fetch accounts for filter
    const { data: accountsData } = await supabase
      .from("accounts")
      .select("id, name")
      .eq("is_active", true)
      .order("name")
    
    if (accountsData) {
      setAccounts(accountsData)
    }
    
    setLoading(false)
  }

  async function fetchAgencyData({ silent = false }: { silent?: boolean } = {}) {
    // En recargas automáticas (silent) no mostramos el spinner para no
    // interrumpir la vista; solo actualizamos los datos en segundo plano.
    if (!silent) setLoading(true)

    const isAllAgencies = selectedAgency === "all"

    // Build queries based on whether we're fetching all agencies or a specific one
    let deptQuery = supabase
      .from("departments")
      .select("id, name, agency_id")
      .eq("is_active", true)
      .order("sort_order")
    
    const staffSelectFields = `
        id,
        first_name,
        last_name,
        email,
        phone,
        position,
        position_id,
        department,
        department_id,
        reports_to_id,
        is_active,
        agency_id,
        is_global,
        agency_ids,
        positions (
          id,
          name,
          min_accounts,
          max_accounts,
          min_projects,
          max_projects,
          min_subordinates,
          max_subordinates,
          level
        ),
        departments (
          id,
          name
        )
      `

    // Columnas comerciales directas en accounts (asesor de ventas / ejecutivo).
    let accountsQuery = supabase
      .from("accounts")
      .select("id, name, agency_id, sales_advisor_id, account_manager_id")
      .eq("status", "active")

    // Asignaciones operativas reales: una cuenta involucra a varios
    // departamentos, y cada departamento tiene un gerente y un coordinador.
    let accountTeamQuery = supabase
      .from("account_team_members")
      .select(`
        id,
        manager_id,
        coordinator_id,
        department_id,
        accounts!inner ( id, name, agency_id, status )
      `)
      .eq("accounts.status", "active")

    // Proyectos activos donde el empleado es gerente o coordinador.
    let projectTeamQuery = supabase
      .from("project_team_members")
      .select(`
        id,
        manager_id,
        coordinator_id,
        projects!inner (
          id,
          name,
          account_id,
          status,
          accounts!inner ( agency_id )
        )
      `)
      .in("projects.status", ["active", "in_progress"])

    // Apply agency filter if not "all"
    if (!isAllAgencies) {
      deptQuery = deptQuery.eq("agency_id", selectedAgency)
      accountsQuery = accountsQuery.eq("agency_id", selectedAgency)
      accountTeamQuery = accountTeamQuery.eq("accounts.agency_id", selectedAgency)
      projectTeamQuery = projectTeamQuery.eq("projects.accounts.agency_id", selectedAgency)
    }

    // Fetch staff - for specific agency, include global staff too
    const staffPromises = isAllAgencies
      ? [supabase.from("staff").select(staffSelectFields).eq("is_active", true).order("first_name")]
      : [
          // Staff from specific agency
          supabase.from("staff").select(staffSelectFields).eq("agency_id", selectedAgency).eq("is_active", true).order("first_name"),
          // Global staff
          supabase.from("staff").select(staffSelectFields).eq("is_global", true).eq("is_active", true).order("first_name")
        ]

    const [deptRes, projectTeamRes, accountsRes, accountTeamRes, ...staffResults] = await Promise.all([
      deptQuery,
      projectTeamQuery,
      accountsQuery,
      accountTeamQuery,
      ...staffPromises,
    ])

    console.log("[v0] accountTeamRes", {
      error: accountTeamRes.error,
      count: accountTeamRes.data?.length,
      sample: accountTeamRes.data?.[0],
    })
    console.log("[v0] projectTeamRes", {
      error: projectTeamRes.error,
      count: projectTeamRes.data?.length,
      sample: projectTeamRes.data?.[0],
    })

    // Combine staff results and remove duplicates
    let allStaff: any[] = []
    staffResults.forEach((res: any) => {
      if (res.data) {
        allStaff = [...allStaff, ...res.data]
      }
    })
    // Remove duplicates by id
    const staffMap = new Map()
    allStaff.forEach(s => staffMap.set(s.id, s))
    const staffData = Array.from(staffMap.values())

    if (deptRes.data) setDepartments(deptRes.data)

    if (staffData.length > 0) {
      // Build org tree
      const tree = buildOrgTree(staffData)
      setOrgTree(tree)
      const allIds = new Set(staffData.map((s) => s.id))
      setExpandedNodes(allIds)

      // Calculate workload
      const workload = staffData.map((staff: any) => {
        // La carga de trabajo se mide por la cantidad de CUENTAS DISTINTAS
        // asignadas. Una cuenta involucra varios departamentos y en cada uno
        // hay un gerente y un coordinador (account_team_members). Un empleado
        // afecta la carga cuando es gerente o coordinador de esa cuenta.
        const managerAccountIds = new Set<string>()
        const coordinatorAccountIds = new Set<string>()
        const commercialAccountIds = new Set<string>()
        const allAccountIds = new Set<string>()
        // Mapa de cuentas asignadas con su nombre y los roles del empleado en ella.
        const accountDetails = new Map<string, { id: string; name: string; roles: string[] }>()

        const addAccountRole = (id: string, name: string, role: string) => {
          const existing = accountDetails.get(id)
          if (existing) {
            if (!existing.roles.includes(role)) existing.roles.push(role)
          } else {
            accountDetails.set(id, { id, name: name || "Sin nombre", roles: [role] })
          }
        }

        // Equipo comercial (columnas directas en accounts)
        accountsRes.data?.forEach((a: any) => {
          if (a.sales_advisor_id === staff.id || a.account_manager_id === staff.id) {
            commercialAccountIds.add(a.id)
            allAccountIds.add(a.id)
            addAccountRole(a.id, a.name, "Comercial")
          }
        })

        // Equipo operativo (gerentes/coordinadores por departamento)
        accountTeamRes.data?.forEach((row: any) => {
          const acctId = row.accounts?.id
          if (!acctId) return
          if (row.manager_id === staff.id) {
            managerAccountIds.add(acctId)
            allAccountIds.add(acctId)
            addAccountRole(acctId, row.accounts?.name, "Gerente")
          }
          if (row.coordinator_id === staff.id) {
            coordinatorAccountIds.add(acctId)
            allAccountIds.add(acctId)
            addAccountRole(acctId, row.accounts?.name, "Coordinador")
          }
        })

        const accountsAsManager = managerAccountIds.size
        const accountsAsCoordinator = coordinatorAccountIds.size
        const accountsCommercial = commercialAccountIds.size
        // Total de cuentas distintas donde participa el empleado
        const totalAccounts = allAccountIds.size

        // Mapa de proyectos asignados con su nombre y los roles del empleado.
        const projectDetails = new Map<string, { id: string; name: string; roles: string[] }>()
        const addProjectRole = (id: string, name: string, role: string) => {
          const existing = projectDetails.get(id)
          if (existing) {
            if (!existing.roles.includes(role)) existing.roles.push(role)
          } else {
            projectDetails.set(id, { id, name: name || "Sin nombre", roles: [role] })
          }
        }

        projectTeamRes.data?.forEach((p: any) => {
          const projId = p.projects?.id
          if (!projId) return
          if (p.manager_id === staff.id) addProjectRole(projId, p.projects?.name, "Gerente")
          if (p.coordinator_id === staff.id) addProjectRole(projId, p.projects?.name, "Coordinador")
        })

        const projectsAsManager = projectTeamRes.data?.filter(
          (p) => p.manager_id === staff.id
        ).length || 0
        const projectsAsCoordinator = projectTeamRes.data?.filter(
          (p) => p.coordinator_id === staff.id
        ).length || 0
        
        // Count direct subordinates from staff hierarchy
        const subordinateCount = staffData?.filter(
          (s: any) => s.reports_to_id === staff.id
        ).length || 0

        // Get workload limits from position (Puestos y Cargas)
        const position = staff.positions
        const minAccounts = position?.min_accounts || 0
        const maxAccounts = position?.max_accounts || 0
        const minProjects = position?.min_projects || 0
        const maxProjects = position?.max_projects || 0
        const minSubordinates = position?.min_subordinates || 0
        const maxSubordinates = position?.max_subordinates || 0

        // Total projects
        const totalProjects = projectsAsManager + projectsAsCoordinator

        return {
          ...staff,
          accounts_as_manager: accountsAsManager,
          accounts_as_coordinator: accountsAsCoordinator,
          accounts_commercial: accountsCommercial,
          total_accounts: totalAccounts,
          assigned_accounts: Array.from(accountDetails.values()).sort((a, b) => a.name.localeCompare(b.name)),
          assigned_projects: Array.from(projectDetails.values()).sort((a, b) => a.name.localeCompare(b.name)),
          projects_as_manager: projectsAsManager,
          projects_as_coordinator: projectsAsCoordinator,
          total_projects: totalProjects,
          total_assignments: totalAccounts + totalProjects,
          subordinate_count: subordinateCount,
          min_accounts: minAccounts,
          max_accounts: maxAccounts,
          min_projects: minProjects,
          max_projects: maxProjects,
          min_subordinates: minSubordinates,
          max_subordinates: maxSubordinates,
        }
      })

      setWorkloadData(workload)
    }

    if (!silent) setLoading(false)
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

    function filterByDepartment(nodes: OrgNode[]): OrgNode[] {
      return nodes
        .filter((node) => (node.departments?.name || node.department) === selectedDepartment)
        .map((node) => ({
          ...node,
          children: filterByDepartment(node.children),
        }))
    }

    // Also include top-level managers that might not be in the department
    const departmentStaff = workloadData.filter(
      (s) => (s.departments?.name || s.department) === selectedDepartment
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

function getWorkloadStatus(staff: StaffWorkload): "under" | "optimal" | "over" | "none" {
    const totalAccounts = staff.total_accounts
    const minAccounts = staff.min_accounts
    const maxAccounts = staff.max_accounts
    
    // Si no tiene configuración de cargas, no aplica
    if (maxAccounts === 0 && minAccounts === 0) return "none"
    
    if (minAccounts > 0 && totalAccounts < minAccounts) return "under"
    if (maxAccounts > 0 && totalAccounts > maxAccounts) return "over"
    return "optimal"
  }

  function getProjectStatus(staff: StaffWorkload): "under" | "optimal" | "over" | "none" {
    const totalProjects = staff.total_projects
    const minProjects = staff.min_projects
    const maxProjects = staff.max_projects
    
    // Si no tiene configuración de proyectos, no aplica
    if (maxProjects === 0 && minProjects === 0) return "none"
    
    if (minProjects > 0 && totalProjects < minProjects) return "under"
    if (maxProjects > 0 && totalProjects > maxProjects) return "over"
    return "optimal"
  }

  function getSubordinateStatus(staff: StaffWorkload): "under" | "optimal" | "over" | "none" {
    const minSub = staff.min_subordinates
    const maxSub = staff.max_subordinates

    // Si no tiene configuración de subordinados, no aplica
    if (maxSub === 0 && minSub === 0) return "none"

    if (minSub > 0 && staff.subordinate_count < minSub) return "under"
    if (maxSub > 0 && staff.subordinate_count > maxSub) return "over"
    return "optimal"
  }

  function OrgNodeCard({ node, level = 0 }: { node: OrgNode; level?: number }) {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children.length > 0
    const workload = workloadData.find((w) => w.id === node.id)
    const workloadStatus = workload ? getWorkloadStatus(workload) : "none"

    const statusColors = {
      under: "border-l-amber-500",
      optimal: "border-l-green-500",
      over: "border-l-red-500",
      none: "border-l-muted-foreground/30",
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

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">
                {node.first_name} {node.last_name}
              </p>
              {workloadStatus === "over" && (
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
              )}
              {workloadStatus === "under" && (
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
              )}
              {workloadStatus === "optimal" && (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              )}
              {workloadStatus === "none" && workload && workload.total_assignments > 0 && (
                <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{node.position}</p>
          </div>

          {workload && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1" title="Cuentas">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>{workload.total_accounts}</span>
                {workload.max_accounts > 0 && (
                  <span className="text-muted-foreground">/ {workload.max_accounts}</span>
                )}
              </div>
              <div className="flex items-center gap-1" title="Proyectos">
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                <span>{workload.projects_as_manager + workload.projects_as_coordinator}</span>
              </div>
              <div className="flex items-center gap-1" title="Subordinados">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{workload.subordinate_count}</span>
                {workload.max_subordinates > 0 && (
                  <span className="text-muted-foreground">/ {workload.max_subordinates}</span>
                )}
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

  function WorkloadCard({ staff }: { staff: StaffWorkload }) {
    const workloadStatus = getWorkloadStatus(staff)
    const projectStatus = getProjectStatus(staff)
    const subordinateStatus = getSubordinateStatus(staff)
    
    const totalAccounts = staff.total_accounts
    const minAccounts = staff.min_accounts
    const maxAccounts = staff.max_accounts
    const hasAccountConfig = maxAccounts > 0 || minAccounts > 0
    
    const totalProjects = staff.total_projects
    const minProjects = staff.min_projects
    const maxProjects = staff.max_projects
    const hasProjectConfig = maxProjects > 0 || minProjects > 0
    
    // Detect if staff is a Manager or Director based on position name
    const positionLower = (staff.position || "").toLowerCase()
    const isManagerOrDirector = positionLower.includes("gerente") || 
                                 positionLower.includes("director") ||
                                 positionLower.includes("manager")

    console.log("[v0] WorkloadCard", staff.first_name, staff.last_name, {
      position: staff.position,
      isManagerOrDirector,
      assigned_accounts: staff.assigned_accounts,
      assigned_projects: staff.assigned_projects,
    })
    
    // Border style for managers and directors
    const cardBorderClass = isManagerOrDirector 
      ? "ring-2 ring-primary border-primary" 
      : ""
    const accountPercentage = maxAccounts > 0 ? Math.min((totalAccounts / maxAccounts) * 100, 100) : 0
    const projectPercentage = maxProjects > 0 ? Math.min((totalProjects / maxProjects) * 100, 100) : 0

    const minSub = staff.min_subordinates
    const maxSub = staff.max_subordinates
    const hasSubConfig = maxSub > 0 || minSub > 0
    const subPercentage = maxSub > 0 ? Math.min((staff.subordinate_count / maxSub) * 100, 100) : 0

    const statusBadge = {
      under: { label: "Subcarga", variant: "outline" as const, className: "border-amber-500 text-amber-600" },
      optimal: { label: "Óptimo", variant: "outline" as const, className: "border-green-500 text-green-600" },
      over: { label: "Sobrecarga", variant: "destructive" as const, className: "" },
      none: { label: "Sin config", variant: "secondary" as const, className: "" },
    }

    const progressColor = {
      under: "bg-amber-500",
      optimal: "bg-green-500",
      over: "bg-red-500",
      none: "bg-muted-foreground/50",
    }

    return (
      <Card className={cardBorderClass}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                {staff.first_name} {staff.last_name}
                {staff.is_global && (
                  <Badge variant="outline" className="text-xs border-blue-500 text-blue-600 bg-blue-50">
                    Global
                  </Badge>
                )}
              </CardTitle>
            </div>
            <Badge variant={statusBadge[workloadStatus].variant} className={statusBadge[workloadStatus].className}>
              {statusBadge[workloadStatus].label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cuentas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Cuentas Asignadas
              </span>
              <span className="font-medium">
                {hasAccountConfig ? (
                  <>
                    {totalAccounts} / {maxAccounts}
                    {minAccounts > 0 && <span className="text-muted-foreground ml-1">(mín: {minAccounts})</span>}
                  </>
                ) : (
                  <>{totalAccounts}</>
                )}
              </span>
            </div>
            {hasAccountConfig && (
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${progressColor[workloadStatus]}`}
                  style={{ width: `${accountPercentage}%` }}
                />
              </div>
            )}
<div className="flex justify-between text-xs text-muted-foreground">
                <span>Gerente: {staff.accounts_as_manager}</span>
                <span>Coordinador: {staff.accounts_as_coordinator}</span>
                {staff.accounts_commercial > 0 && <span>Comercial: {staff.accounts_commercial}</span>}
              </div>
            {/* Desglose de nombres de cuentas para quienes no son gerentes/directores */}
            {!isManagerOrDirector && staff.assigned_accounts.length > 0 && (
              <ul className="mt-1 space-y-1">
                {staff.assigned_accounts.map((acc) => (
                  <li key={acc.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2 py-1 text-xs">
                    <span className="truncate">{acc.name}</span>
                    <span className="shrink-0 text-muted-foreground">{acc.roles.join(" · ")}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Proyectos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4" />
                Proyectos Asignados
              </span>
              <span className="font-medium">
                {hasProjectConfig ? (
                  <>
                    {totalProjects} / {maxProjects}
                    {minProjects > 0 && <span className="text-muted-foreground ml-1">(mín: {minProjects})</span>}
                  </>
                ) : (
                  <>{totalProjects}</>
                )}
              </span>
            </div>
            {hasProjectConfig && (
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${progressColor[projectStatus]}`}
                  style={{ width: `${projectPercentage}%` }}
                />
              </div>
            )}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Gerente: {staff.projects_as_manager}</span>
              <span>Coordinador: {staff.projects_as_coordinator}</span>
            </div>
            {/* Desglose de nombres de proyectos para quienes no son gerentes/directores */}
            {!isManagerOrDirector && staff.assigned_projects.length > 0 && (
              <ul className="mt-1 space-y-1">
                {staff.assigned_projects.map((proj) => (
                  <li key={proj.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2 py-1 text-xs">
                    <span className="truncate">{proj.name}</span>
                    <span className="shrink-0 text-muted-foreground">{proj.roles.join(" · ")}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Subordinados */}
          {hasSubConfig && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Subordinados
                </span>
                <span className="font-medium">
                  {staff.subordinate_count} / {maxSub}
                  {minSub > 0 && <span className="text-muted-foreground ml-1">(mín: {minSub})</span>}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${progressColor[subordinateStatus]}`}
                  style={{ width: `${subPercentage}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Mostrar puesto si tiene configuración */}
          {staff.positions && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Puesto: <span className="font-medium text-foreground">{staff.positions.name}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (!mounted) return null

  const filteredWorkload = selectedDepartment === "all"
    ? workloadData
    : workloadData.filter((s) => (s.departments?.name || s.department) === selectedDepartment)

  const overloadedCount = filteredWorkload.filter((s) => getWorkloadStatus(s) === "over").length
  const underloadedCount = filteredWorkload.filter((s) => getWorkloadStatus(s) === "under").length
  const optimalCount = filteredWorkload.filter((s) => getWorkloadStatus(s) === "optimal").length
  const noConfigCount = filteredWorkload.filter((s) => getWorkloadStatus(s) === "none").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="h-8 w-8" />
            Cargas de Trabajo
          </h1>
          <p className="text-muted-foreground">
            Visualiza y gestiona la carga de trabajo del equipo
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedAgency} onValueChange={setSelectedAgency}>
            <SelectTrigger className="w-[220px]">
              <Building2 className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Seleccionar agencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las agencias</SelectItem>
              {agencies.map((agency) => (
                <SelectItem key={agency.id} value={agency.id}>
                  {agency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[200px]">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las áreas</SelectItem>
              {Array.from(new Map(departments.map((d) => [d.name, d])).values())
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((dept) => (
                  <SelectItem key={dept.name} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchAgencyData({ silent: true })}
            title="Actualizar"
            aria-label="Actualizar"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros Avanzados
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setDateFrom("")
                  setDateTo("")
                  setSelectedPerson("all")
                  setSelectedAccount("all")
                }}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar Filtros
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Date Range */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  Fecha Desde
                </Label>
                <Input 
                  type="date" 
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  Fecha Hasta
                </Label>
                <Input 
                  type="date" 
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              
              {/* Person Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Persona
                </Label>
                <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar persona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las personas</SelectItem>
                    {workloadData.map(person => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.first_name} {person.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Account Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  Cuenta
                </Label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las cuentas</SelectItem>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Active Filters Summary */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                <span className="text-sm text-muted-foreground">Filtros activos:</span>
                {dateFrom && (
                  <Badge variant="secondary" className="gap-1">
                    Desde: {dateFrom}
                    <button onClick={() => setDateFrom("")} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {dateTo && (
                  <Badge variant="secondary" className="gap-1">
                    Hasta: {dateTo}
                    <button onClick={() => setDateTo("")} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedPerson !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {workloadData.find(p => p.id === selectedPerson)?.first_name} {workloadData.find(p => p.id === selectedPerson)?.last_name}
                    <button onClick={() => setSelectedPerson("all")} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedAccount !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {accounts.find(a => a.id === selectedAccount)?.name}
                    <button onClick={() => setSelectedAccount("all")} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-muted shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold">{filteredWorkload.length}</p>
                    <p className="text-xs text-muted-foreground truncate">Personal</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold">{optimalCount}</p>
                    <p className="text-xs text-muted-foreground truncate">Óptima</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 shrink-0">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold">{underloadedCount}</p>
                    <p className="text-xs text-muted-foreground truncate">Subcarga</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 shrink-0">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold">{overloadedCount}</p>
                    <p className="text-xs text-muted-foreground truncate">Sobrecarga</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-muted shrink-0">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold">{noConfigCount}</p>
                    <p className="text-xs text-muted-foreground truncate">Sin config</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="cargas" className="space-y-4">
            <TabsList>
              <TabsTrigger value="cargas">Cargas de Trabajo</TabsTrigger>
              <TabsTrigger value="lista">Vista de Lista</TabsTrigger>
            </TabsList>

            <TabsContent value="cargas" className="space-y-6">
              {filteredWorkload.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay personal en esta área</p>
                </div>
              ) : (
                // Group by department
                (() => {
                  // Get unique departments - use departments relation name, fallback to department field
                  const deptGroups = new Map<string, StaffWorkload[]>()
                  filteredWorkload.forEach((staff) => {
                    const deptName = staff.departments?.name || staff.department || "Sin área"
                    if (!deptGroups.has(deptName)) {
                      deptGroups.set(deptName, [])
                    }
                    deptGroups.get(deptName)!.push(staff)
                  })

                  // Sort each department's staff - Directors/Managers first, then by name
                  deptGroups.forEach((staffList) => {
                    staffList.sort((a, b) => {
                      const posA = (a.position || "").toLowerCase()
                      const posB = (b.position || "").toLowerCase()
                      const isManagerA = posA.includes("director") || posA.includes("gerente") || posA.includes("manager")
                      const isManagerB = posB.includes("director") || posB.includes("gerente") || posB.includes("manager")
                      
                      // Directors/Managers first
                      if (isManagerA && !isManagerB) return -1
                      if (!isManagerA && isManagerB) return 1
                      
                      // Then sort by name
                      return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
                    })
                  })

                  return Array.from(deptGroups.entries()).map(([deptName, staffList]) => (
                    <div key={deptName} className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        {deptName}
                        <Badge variant="secondary" className="ml-2">{staffList.length}</Badge>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {staffList.map((staff) => (
                          <WorkloadCard 
                            key={staff.id} 
                            staff={staff}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                })()
              )}
            </TabsContent>

            <TabsContent value="lista" className="space-y-6">
              {filteredWorkload.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay personal en esta área</p>
                </div>
              ) : (
                // Group by department
                (() => {
                  const deptGroups = new Map<string, StaffWorkload[]>()
                  filteredWorkload.forEach((staff) => {
                    const deptName = staff.departments?.name || staff.department || "Sin área"
                    if (!deptGroups.has(deptName)) {
                      deptGroups.set(deptName, [])
                    }
                    deptGroups.get(deptName)!.push(staff)
                  })

                  // Sort each department's staff - Directors/Managers first, then by name
                  deptGroups.forEach((staffList) => {
                    staffList.sort((a, b) => {
                      const posA = (a.position || "").toLowerCase()
                      const posB = (b.position || "").toLowerCase()
                      const isManagerA = posA.includes("director") || posA.includes("gerente") || posA.includes("manager")
                      const isManagerB = posB.includes("director") || posB.includes("gerente") || posB.includes("manager")
                      
                      // Directors/Managers first
                      if (isManagerA && !isManagerB) return -1
                      if (!isManagerA && isManagerB) return 1
                      
                      // Then sort by name
                      return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
                    })
                  })

                  return Array.from(deptGroups.entries()).map(([deptName, staffList]) => (
                    <Card key={deptName}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="h-5 w-5 text-primary" />
                          {deptName}
                          <Badge variant="secondary" className="ml-2">{staffList.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-3 font-medium">Nombre</th>
                                <th className="text-left p-3 font-medium">Posición</th>
                                <th className="text-center p-3 font-medium">Cuentas</th>
                                <th className="text-center p-3 font-medium">Proyectos</th>
                                <th className="text-center p-3 font-medium">Subordinados</th>
                                <th className="text-center p-3 font-medium">Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {staffList.map((staff, index) => {
                                const status = getWorkloadStatus(staff)
                                const totalAccounts = staff.total_accounts
                                const totalProjects = staff.total_projects
                                
                                // Detect if staff is a Manager or Director
                                const positionLower = (staff.position || "").toLowerCase()
                                const isManagerOrDirector = positionLower.includes("gerente") || 
                                                             positionLower.includes("director") ||
                                                             positionLower.includes("manager")

                                return (
                                  <tr key={staff.id} className={`border-b hover:bg-muted/50 ${isManagerOrDirector ? "bg-primary/5" : ""}`}>
                                    <td className="p-3">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium">
                                          {staff.first_name} {staff.last_name}
                                        </span>
                                        {staff.is_global && (
                                          <Badge variant="outline" className="text-xs border-blue-500 text-blue-600 bg-blue-50">
                                            Global
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-sm text-muted-foreground">{staff.email}</div>
                                    </td>
                                    <td className="p-3">{staff.position}</td>
                                    <td className="text-center p-3">
                                      <div>
                                        {totalAccounts}
                                        <span className="text-muted-foreground text-sm">
                                          {" "}/ {staff.max_accounts || "-"}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="text-center p-3">
                                      <div>
                                        {totalProjects}
                                        <span className="text-muted-foreground text-sm">
                                          {" "}/ {staff.max_projects || "-"}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="text-center p-3">
                                      <div>
                                        {staff.subordinate_count}
                                        <span className="text-muted-foreground text-sm">
                                          {" "}/ {staff.max_subordinates || "-"}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="text-center p-3">
                                      {status === "optimal" && (
                                        <Badge variant="outline" className="border-green-500 text-green-600">
                                          Óptimo
                                        </Badge>
                                      )}
                                      {status === "under" && (
                                        <Badge variant="outline" className="border-amber-500 text-amber-600">
                                          Subcarga
                                        </Badge>
                                      )}
                                      {status === "over" && (
                                        <Badge variant="destructive">Sobrecarga</Badge>
                                      )}
                                      {status === "none" && (
                                        <Badge variant="secondary">Sin config</Badge>
                                      )}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                })()
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
