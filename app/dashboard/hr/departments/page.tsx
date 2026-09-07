"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useTabParam } from "@/hooks/use-tab-param"
import { toast } from "sonner"
import { StaffAvatar } from "@/components/staff-avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Building2,
  Users,
  Gauge,
  Layers,
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Copy,
  FileDown,
} from "lucide-react"
import { DepartmentDialog } from "./department-dialog"
import { PositionProfileDialog } from "./position-profile-dialog"
import { printProfile } from "./print-profile"
import {
  jobTypeLabel,
  levelLabel,
  POSITION_LEVELS,
  profileStatusMeta,
  type Agency,
  type Department,
  type Position,
  type StaffMini,
} from "./types"

export default function DepartmentsPositionsPage() {
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useTabParam("departments")

  const [agencies, setAgencies] = useState<Agency[]>([])
  const [staff, setStaff] = useState<StaffMini[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])

  // Filtro por agencia (compartido entre ambas pestañas)
  const [agencyFilter, setAgencyFilter] = useState("all")

  // Departamentos: filtros
  const [deptSearch, setDeptSearch] = useState("")
  const [deptStatus, setDeptStatus] = useState("all")
  const [deptDialogOpen, setDeptDialogOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null)

  // Puestos: filtros
  const [posSearch, setPosSearch] = useState("")
  const [posDept, setPosDept] = useState("all")
  const [posLevel, setPosLevel] = useState("all")
  const [posDialogOpen, setPosDialogOpen] = useState(false)
  const [editingPos, setEditingPos] = useState<Position | null>(null)
  const [posDuplicate, setPosDuplicate] = useState(false)
  const [posReadOnly, setPosReadOnly] = useState(false)
  const [posToDelete, setPosToDelete] = useState<Position | null>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (mounted) fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  async function fetchAll() {
    setLoading(true)
    const [agenciesRes, staffRes, deptRes, posRes] = await Promise.all([
      supabase.from("agencies").select("id, name").eq("is_active", true).order("name"),
      supabase
        .from("staff")
        .select("id, first_name, last_name, photo_url, department_id, position_id, is_active"),
      supabase
        .from("departments")
        .select(
          "id, agency_id, name, description, is_active, sort_order, code, cost_center, leader_staff_id",
        )
        .order("name"),
      supabase
        .from("positions")
        .select(
          "id, agency_id, department_id, name, description, level, is_active, reports_to_position_id, headcount_target, job_type, work_schedule, salary_range, profile_status, profile",
        )
        .order("name"),
    ])

    if (agenciesRes.data) setAgencies(agenciesRes.data as Agency[])
    if (staffRes.data) setStaff(staffRes.data as StaffMini[])
    if (deptRes.data) setDepartments(deptRes.data as Department[])
    if (posRes.data) setPositions(posRes.data as Position[])
    setLoading(false)
  }

  // Índices de conteo
  const staffById = useMemo(() => new Map(staff.map((s) => [s.id, s])), [staff])
  const activeStaff = useMemo(() => staff.filter((s) => s.is_active !== false), [staff])

  const headcountByDept = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of activeStaff) {
      if (!s.department_id) continue
      map.set(s.department_id, (map.get(s.department_id) ?? 0) + 1)
    }
    return map
  }, [activeStaff])

  const positionsByDept = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of positions) {
      if (!p.department_id) continue
      map.set(p.department_id, (map.get(p.department_id) ?? 0) + 1)
    }
    return map
  }, [positions])

  const headcountByPosition = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of activeStaff) {
      if (!s.position_id) continue
      map.set(s.position_id, (map.get(s.position_id) ?? 0) + 1)
    }
    return map
  }, [activeStaff])

  const supervisedCount = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of positions) {
      if (!p.reports_to_position_id) continue
      map.set(p.reports_to_position_id, (map.get(p.reports_to_position_id) ?? 0) + 1)
    }
    return map
  }, [positions])

  const positionsById = useMemo(() => new Map(positions.map((p) => [p.id, p])), [positions])
  const departmentsById = useMemo(() => new Map(departments.map((d) => [d.id, d])), [departments])

  // KPIs
  const kpis = useMemo(() => {
    const totalDepts = departments.length
    const headcountTotal = activeStaff.filter((s) => s.department_id).length
    const avg = totalDepts > 0 ? headcountTotal / totalDepts : 0
    const totalPositions = positions.length
    const filledPositions = positions.filter((p) => (headcountByPosition.get(p.id) ?? 0) > 0).length
    const coverage = totalPositions > 0 ? Math.round((filledPositions / totalPositions) * 100) : 0
    return { totalDepts, headcountTotal, avg, coverage, totalPositions }
  }, [departments, activeStaff, positions, headcountByPosition])

  // Filtrado departamentos
  const filteredDepartments = useMemo(() => {
    const term = deptSearch.trim().toLowerCase()
    return departments.filter((d) => {
      if (agencyFilter !== "all" && d.agency_id !== agencyFilter) return false
      if (deptStatus === "active" && !d.is_active) return false
      if (deptStatus === "inactive" && d.is_active) return false
      if (term && !`${d.name} ${d.code ?? ""} ${d.cost_center ?? ""}`.toLowerCase().includes(term))
        return false
      return true
    })
  }, [departments, deptSearch, deptStatus, agencyFilter])

  // Filtrado puestos
  const filteredPositions = useMemo(() => {
    const term = posSearch.trim().toLowerCase()
    return positions.filter((p) => {
      if (agencyFilter !== "all" && p.agency_id !== agencyFilter) return false
      if (posDept !== "all" && p.department_id !== posDept) return false
      if (posLevel !== "all" && p.level !== posLevel) return false
      if (term) {
        const deptName = p.department_id ? departmentsById.get(p.department_id)?.name ?? "" : ""
        if (!`${p.name} ${deptName}`.toLowerCase().includes(term)) return false
      }
      return true
    })
  }, [positions, posSearch, posDept, posLevel, departmentsById, agencyFilter])

  function staffName(id: string | null) {
    if (!id) return null
    const s = staffById.get(id)
    return s ? `${s.first_name} ${s.last_name}` : null
  }

  async function confirmDeleteDept() {
    if (!deptToDelete) return
    const { error } = await supabase.from("departments").delete().eq("id", deptToDelete.id)
    if (error) {
      toast.error("No se pudo eliminar", { description: error.message })
    } else {
      toast.success("Departamento eliminado")
      fetchAll()
    }
    setDeptToDelete(null)
  }

  async function confirmDeletePos() {
    if (!posToDelete) return
    const { error } = await supabase.from("positions").delete().eq("id", posToDelete.id)
    if (error) {
      toast.error("No se pudo eliminar", { description: error.message })
    } else {
      toast.success("Puesto eliminado")
      fetchAll()
    }
    setPosToDelete(null)
  }

  function openNewPosition() {
    setEditingPos(null)
    setPosDuplicate(false)
    setPosReadOnly(false)
    setPosDialogOpen(true)
  }

  function openPosition(pos: Position, mode: "edit" | "view" | "duplicate") {
    setEditingPos(pos)
    setPosDuplicate(mode === "duplicate")
    setPosReadOnly(mode === "view")
    setPosDialogOpen(true)
  }

  if (!mounted || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Departamentos y Puestos</h1>
        <p className="text-muted-foreground">
          Estructura organizacional y perfiles de cargo del equipo.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="departments">Departamentos</TabsTrigger>
          <TabsTrigger value="positions">Puestos</TabsTrigger>
        </TabsList>

        {/* ------------------------- DEPARTAMENTOS ------------------------- */}
        <TabsContent value="departments" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Total Departamentos"
              value={String(kpis.totalDepts)}
              icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
            />
            <KpiCard
              label="Headcount Total"
              value={String(kpis.headcountTotal)}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />
            <KpiCard
              label="Promedio Empleados/Dpto"
              value={kpis.avg.toFixed(1)}
              icon={<Gauge className="h-4 w-4 text-muted-foreground" />}
            />
            <KpiCard
              label="Puestos Cobertura"
              value={`${kpis.coverage}%`}
              hint={`${kpis.totalPositions} puestos definidos`}
              icon={<Layers className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  placeholder="Buscar por nombre o código"
                  className="pl-8"
                />
              </div>
              <Select value={agencyFilter} onValueChange={setAgencyFilter}>
                <SelectTrigger className="sm:w-[180px]">
                  <SelectValue placeholder="Agencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las agencias</SelectItem>
                  {agencies.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={deptStatus} onValueChange={setDeptStatus}>
                <SelectTrigger className="sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                setEditingDept(null)
                setDeptDialogOpen(true)
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              Crear Departamento
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Líder / Responsable</TableHead>
                    <TableHead>Puestos / Headcount</TableHead>
                    <TableHead>Centro de Costos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDepartments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        No hay departamentos que coincidan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDepartments.map((d) => {
                      const leader = d.leader_staff_id ? staffById.get(d.leader_staff_id) : null
                      return (
                        <TableRow key={d.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">{d.name}</p>
                                {d.code && (
                                  <p className="text-xs text-muted-foreground">{d.code}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {leader ? (
                              <div className="flex items-center gap-2">
                                <StaffAvatar
                                  photoUrl={leader.photo_url}
                                  firstName={leader.first_name}
                                  lastName={leader.last_name}
                                  className="h-7 w-7"
                                  fallbackClassName="text-[10px]"
                                />
                                <span className="text-sm">
                                  {leader.first_name} {leader.last_name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Sin asignar</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {positionsByDept.get(d.id) ?? 0} puestos /{" "}
                              {headcountByDept.get(d.id) ?? 0} empleados
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {d.cost_center ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={d.is_active ? "default" : "secondary"}>
                              {d.is_active ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingDept(d)
                                    setDeptDialogOpen(true)
                                  }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeptToDelete(d)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------- PUESTOS ---------------------------- */}
        <TabsContent value="positions" className="space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={posSearch}
                  onChange={(e) => setPosSearch(e.target.value)}
                  placeholder="Buscar por cargo o área"
                  className="pl-8"
                />
              </div>
              <Select value={agencyFilter} onValueChange={setAgencyFilter}>
                <SelectTrigger className="sm:w-[180px]">
                  <SelectValue placeholder="Agencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las agencias</SelectItem>
                  {agencies.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={posDept} onValueChange={setPosDept}>
                <SelectTrigger className="sm:w-[180px]">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los deptos.</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={posLevel} onValueChange={setPosLevel}>
                <SelectTrigger className="sm:w-[160px]">
                  <SelectValue placeholder="Nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los niveles</SelectItem>
                  {POSITION_LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={openNewPosition}>
              <Plus className="mr-1 h-4 w-4" />
              Nuevo Perfil de Puesto
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Reporta a</TableHead>
                    <TableHead>Supervisa</TableHead>
                    <TableHead>A cargo</TableHead>
                    <TableHead>Jornada</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPositions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                        No hay puestos que coincidan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPositions.map((p) => {
                      const dept = p.department_id ? departmentsById.get(p.department_id) : null
                      const reportsTo = p.reports_to_position_id
                        ? positionsById.get(p.reports_to_position_id)?.name
                        : null
                      const status = profileStatusMeta(p.profile_status)
                      return (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{levelLabel(p.level)}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{dept?.name ?? "—"}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{reportsTo ?? "—"}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {supervisedCount.get(p.id) ?? 0} cargos
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{headcountByPosition.get(p.id) ?? 0}</span>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{jobTypeLabel(p.job_type)}</p>
                              {p.work_schedule && (
                                <p className="text-xs text-muted-foreground">{p.work_schedule}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.badge}>{status.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openPosition(p, "view")}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver perfil completo
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openPosition(p, "edit")}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openPosition(p, "duplicate")}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    printProfile(
                                      p,
                                      p.department_id ? departmentsById.get(p.department_id) ?? null : null,
                                      reportsTo ?? null,
                                    )
                                  }
                                >
                                  <FileDown className="mr-2 h-4 w-4" />
                                  Descargar PDF
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setPosToDelete(p)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DepartmentDialog
        open={deptDialogOpen}
        onOpenChange={setDeptDialogOpen}
        department={editingDept}
        agencies={agencies}
        staff={staff}
        onSaved={fetchAll}
      />

      <PositionProfileDialog
        open={posDialogOpen}
        onOpenChange={setPosDialogOpen}
        position={editingPos}
        isDuplicate={posDuplicate}
        readOnly={posReadOnly}
        departments={departments}
        positions={positions}
        agencies={agencies}
        onSaved={fetchAll}
      />

      <AlertDialog open={!!deptToDelete} onOpenChange={(o) => !o && setDeptToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar departamento</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que deseas eliminar &quot;{deptToDelete?.name}&quot;? Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDept}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!posToDelete} onOpenChange={(o) => !o && setPosToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar puesto</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que deseas eliminar el perfil &quot;{posToDelete?.name}&quot;? Esta acción no
              se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePos}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function KpiCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: string
  hint?: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}
