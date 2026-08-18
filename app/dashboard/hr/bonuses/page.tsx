"use client"

import { useState, useEffect } from "react"
import { useTabParam } from "@/hooks/use-tab-param"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Textarea } from "@/components/ui/textarea"
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { Plus, Search, Gift, DollarSign, Clock, CheckCircle, Eye, Users, ScrollText, Pencil, Save, X, HandCoins, GraduationCap, Trash2, RefreshCw } from "lucide-react"
import { DepartmentFilter } from "@/components/hr/department-filter"
import { BonusTypePanel } from "@/components/hr/bonus-type-sections"
import { useAgency } from "@/contexts/agency-context"
import { STAGE_LABELS, STAGE_BADGE_STYLES } from "@/lib/bonus-workflow"
import { usePermissions } from "@/components/dashboard/permissions-provider"

// Roles autorizados para modificar las políticas de bonos.
const BONUS_POLICY_ROLES = ["rrhh", "direccion_general", "superadmin"]

interface Bonus {
  id: string
  bonus_type: string
  description: string | null
  amount: number
  status: string
  effective_date: string | null
  created_at: string
  approved_at: string | null
  paid_at: string | null
  course_name: string | null
  workflow_stage: string | null
  staff: {
    id: string
    first_name: string
    last_name: string
    is_active: boolean
    department: { name: string } | null
  }
  agency: {
    id: string
    name: string
  }
}

interface Department {
  id: string
  name: string
  agency_id: string | null
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  paid: "Pagado",
  cancelled: "Cancelado",
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "outline",
  paid: "default",
  cancelled: "destructive",
}

const typeLabels: Record<string, string> = {
  performance: "Desempeño",
  annual: "Anual",
  christmas: "Aguinaldo",
  productivity: "Productividad",
  attendance: "Asistencia",
  seniority: "Antigüedad",
  other: "Otro",
}

export default function BonusesPage() {
  const [pageTab, setPageTab] = useTabParam("training")
  const { selectedAgencyId, loading: agencyLoading } = useAgency()
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  // Política de bonos
  const [policyContent, setPolicyContent] = useState("")
  const [policyDraft, setPolicyDraft] = useState("")
  const [policyUpdatedAt, setPolicyUpdatedAt] = useState<string | null>(null)
  const [editingPolicy, setEditingPolicy] = useState(false)
  const [savingPolicy, setSavingPolicy] = useState(false)
  const supabase = createClient()

  // Solo Recursos Humanos, Dirección General o Super administrador (o acceso
  // total) pueden modificar la política de bonos.
  const { roleName, fullAccess } = usePermissions()
  const canManagePolicy = fullAccess || (roleName != null && BONUS_POLICY_ROLES.includes(roleName))
  // El cambio manual de estatus de un bono solo lo puede ver y hacer el Super
  // administrador o la Dirección General.
  const canChangeStatus = roleName === "superadmin" || roleName === "direccion_general"

  useEffect(() => {
    if (selectedAgencyId) {
      fetchData()
    } else {
      setLoading(false)
      setBonuses([])
    }
  }, [selectedAgencyId])

  const fetchData = async () => {
    if (!selectedAgencyId) return
    setLoading(true)
    try {
      const [bonusesRes, departmentsRes, policyRes] = await Promise.all([
        supabase
          .from("bonuses")
          .select(`
            *,
            staff:staff(id, first_name, last_name, is_active, department:departments(name)),
            agency:agencies(id, name)
          `)
          .eq("agency_id", selectedAgencyId)
          .order("created_at", { ascending: false }),
        supabase
          .from("departments")
          .select("id, name, agency_id")
          .order("name"),
        supabase
          .from("bonus_policies")
          .select("content, updated_at")
          .eq("agency_id", selectedAgencyId)
          .is("bonus_type_id", null)
          .maybeSingle(),
      ])

      if (bonusesRes.data) setBonuses(bonusesRes.data)
      if (departmentsRes.data) setDepartments(departmentsRes.data)
      const policy = policyRes.data
      setPolicyContent(policy?.content || "")
      setPolicyDraft(policy?.content || "")
      setPolicyUpdatedAt(policy?.updated_at || null)
      setEditingPolicy(false)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const savePolicy = async () => {
    if (!selectedAgencyId) return
    setSavingPolicy(true)
    try {
      const content = policyDraft.trim() || null
      const nowIso = new Date().toISOString()

      // Política general de la agencia (bonus_type_id nulo).
      const { data: existing } = await supabase
        .from("bonus_policies")
        .select("id")
        .eq("agency_id", selectedAgencyId)
        .is("bonus_type_id", null)
        .maybeSingle()

      let saved: { content: string | null; updated_at: string | null } | null = null
      if (existing?.id) {
        const { data, error } = await supabase
          .from("bonus_policies")
          .update({ content, updated_at: nowIso })
          .eq("id", existing.id)
          .select("content, updated_at")
          .single()
        if (error) throw error
        saved = data
      } else {
        const { data, error } = await supabase
          .from("bonus_policies")
          .insert({ agency_id: selectedAgencyId, content, updated_at: nowIso })
          .select("content, updated_at")
          .single()
        if (error) throw error
        saved = data
      }

      setPolicyContent(saved?.content || "")
      setPolicyDraft(saved?.content || "")
      setPolicyUpdatedAt(saved?.updated_at || null)
      setEditingPolicy(false)
    } catch (error) {
      console.error("Error saving policy:", error)
    } finally {
      setSavingPolicy(false)
    }
  }

  // Eliminación de un bono individual.
  const [bonusToDelete, setBonusToDelete] = useState<Bonus | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteBonus = async () => {
    if (!bonusToDelete) return
    setDeleting(true)
    try {
      const { error } = await supabase.from("bonuses").delete().eq("id", bonusToDelete.id)
      if (error) throw error
      setBonusToDelete(null)
      await fetchData()
    } catch (error) {
      console.error("Error deleting bonus:", error)
    } finally {
      setDeleting(false)
    }
  }

  // Cambio manual de estatus (con confirmación). Permite Aprobado, Pagado y
  // Cancelado. Al pasar a "aprobado" o "pagado" se registra la fecha
  // correspondiente si aún no existe, y se ajusta la etapa del flujo.
  const [statusChangeBonus, setStatusChangeBonus] = useState<Bonus | null>(null)
  const [statusChangeTarget, setStatusChangeTarget] = useState<string>("")
  const [changingStatus, setChangingStatus] = useState(false)

  const closeStatusChange = () => {
    setStatusChangeBonus(null)
    setStatusChangeTarget("")
  }

  const handleChangeStatus = async () => {
    if (!statusChangeBonus || !statusChangeTarget) return
    // Solo Super administrador o Dirección General pueden cambiar el estatus.
    if (!canChangeStatus) return
    setChangingStatus(true)
    try {
      const now = new Date().toISOString()
      const updates: Record<string, unknown> = { status: statusChangeTarget }
      if (statusChangeTarget === "approved") {
        updates.approved_at = statusChangeBonus.approved_at || now
        updates.workflow_stage = "authorized"
      } else if (statusChangeTarget === "paid") {
        updates.approved_at = statusChangeBonus.approved_at || now
        updates.paid_at = statusChangeBonus.paid_at || now
        updates.workflow_stage = "paid"
      } else if (statusChangeTarget === "cancelled") {
        updates.workflow_stage = "rejected"
      }
      const { error } = await supabase.from("bonuses").update(updates).eq("id", statusChangeBonus.id)
      if (error) throw error
      closeStatusChange()
      await fetchData()
    } catch (error) {
      console.error("Error changing bonus status:", error)
    } finally {
      setChangingStatus(false)
    }
  }

  const filteredBonuses = bonuses.filter((bonus) => {
    const staffName = `${bonus.staff?.first_name || ""} ${bonus.staff?.last_name || ""}`.toLowerCase()
    const matchesSearch = staffName.includes(searchTerm.toLowerCase()) ||
      (bonus.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    const matchesStatus = statusFilter === "all" || bonus.status === statusFilter
    const matchesType = typeFilter === "all" || bonus.bonus_type === typeFilter
    const matchesDepartment = departmentFilter === "all" || bonus.staff?.department?.name === departmentFilter
    return matchesSearch && matchesStatus && matchesType && matchesDepartment
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getUTCDate()
    const month = date.toLocaleString("es-MX", { month: "short", timeZone: "UTC" })
    const year = date.getUTCFullYear()
    return `${day} ${month} ${year}`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  // Registro por personal activo: se listan los bonos individualmente (solo del
  // personal activo), ordenados por empleado y por fecha más reciente.
  const staffBonuses = filteredBonuses
    .filter((bonus) => bonus.staff?.is_active)
    .sort((a, b) => {
      const nameA = `${a.staff?.first_name || ""} ${a.staff?.last_name || ""}`
      const nameB = `${b.staff?.first_name || ""} ${b.staff?.last_name || ""}`
      if (nameA !== nameB) return nameA.localeCompare(nameB)
      const dateA = a.effective_date || a.created_at
      const dateB = b.effective_date || b.created_at
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })

  // Stats
  const totalBonuses = bonuses.reduce((sum, b) => sum + Number(b.amount || 0), 0)
  const pendingAmount = bonuses
    .filter((b) => b.status === "pending")
    .reduce((sum, b) => sum + Number(b.amount || 0), 0)
  const paidAmount = bonuses
    .filter((b) => b.status === "paid")
    .reduce((sum, b) => sum + Number(b.amount || 0), 0)
  const pendingCount = bonuses.filter((b) => b.status === "pending").length

  if (agencyLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!selectedAgencyId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Gift className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Selecciona una Agencia</h2>
        <p className="text-muted-foreground max-w-md">
          Para ver los bonos, primero selecciona una agencia en el selector de arriba.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bonos</h1>
          <p className="text-muted-foreground">
            Gestiona los bonos y gratificaciones del equipo
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bonos</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBonuses)}</div>
            <p className="text-xs text-muted-foreground">Todos los bonos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">{pendingCount} bonos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(paidAmount)}</div>
            <p className="text-xs text-muted-foreground">Total pagado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(bonuses.length > 0 ? totalBonuses / bonuses.length : 0)}
            </div>
            <p className="text-xs text-muted-foreground">Por bono</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : (
            <Tabs value={pageTab} onValueChange={setPageTab}>
              <TabsList>
                <TabsTrigger value="training">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Capacitación
                </TabsTrigger>
                <TabsTrigger value="year_end">
                  <HandCoins className="mr-2 h-4 w-4" />
                  Bono fin de año
                </TabsTrigger>
                <TabsTrigger value="staff">
                  <Users className="mr-2 h-4 w-4" />
                  Por Personal
                </TabsTrigger>
              </TabsList>

              {/* Tab: Capacitación (política + solicitar por flujo de 4 pasos) */}
              <TabsContent value="training" className="mt-6">
                <BonusTypePanel
                  agencyId={selectedAgencyId}
                  matchNames={["capacit"]}
                  label="Capacitación"
                  requestMode="flow"
                />
              </TabsContent>

              {/* Tab: Bono fin de año (política + solicitud directa) */}
              <TabsContent value="year_end" className="mt-6">
                <BonusTypePanel
                  agencyId={selectedAgencyId}
                  matchNames={["fin de año", "fin de ano", "año", "anual"]}
                  label="Bono fin de año"
                  requestMode="direct"
                />
              </TabsContent>

              {/* Tab: lista de bonos */}
              <TabsContent value="bonuses" className="mt-6">
                {filteredBonuses.length === 0 ? (
                  <Empty>
                    <EmptyMedia variant="icon">
                      <Gift className="h-6 w-6" />
                    </EmptyMedia>
                    <EmptyTitle>No hay bonos</EmptyTitle>
                    <EmptyDescription>
                      {searchTerm || statusFilter !== "all" || typeFilter !== "all" || departmentFilter !== "all"
                        ? "No se encontraron resultados para tu búsqueda"
                        : "Comienza registrando el primer bono"}
                    </EmptyDescription>
                    {!searchTerm && statusFilter === "all" && typeFilter === "all" && departmentFilter === "all" && (
                      <Button asChild className="mt-4">
                        <Link href="/dashboard/hr/bonuses/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Nuevo Bono
                        </Link>
                      </Button>
                    )}
                  </Empty>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Empleado</TableHead>
                          <TableHead>Curso / Tipo</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                          <TableHead>Etapa</TableHead>
                          <TableHead className="w-[100px]">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBonuses.map((bonus) => (
                          <TableRow key={bonus.id}>
                            <TableCell className="font-medium">
                              {bonus.staff?.first_name} {bonus.staff?.last_name}
                            </TableCell>
                            <TableCell className="max-w-[220px]">
                              <div className="truncate font-medium">
                                {bonus.course_name || typeLabels[bonus.bonus_type] || bonus.bonus_type}
                              </div>
                              {bonus.course_name && (
                                <div className="truncate text-xs text-muted-foreground">
                                  {typeLabels[bonus.bonus_type] || bonus.bonus_type}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {bonus.effective_date
                                ? formatDate(bonus.effective_date)
                                : formatDate(bonus.created_at)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(Number(bonus.amount || 0))}
                            </TableCell>
                            <TableCell>
                              {bonus.workflow_stage ? (
                                <Badge className={STAGE_BADGE_STYLES[bonus.workflow_stage] || ""}>
                                  {STAGE_LABELS[bonus.workflow_stage] || bonus.workflow_stage}
                                </Badge>
                              ) : (
                                <Badge variant={statusColors[bonus.status]}>
                                  {statusLabels[bonus.status] || bonus.status}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/dashboard/hr/bonuses/${bonus.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* Tab: registro por personal activo (cada bono individual) */}
              <TabsContent value="staff" className="mt-6">
                {staffBonuses.length === 0 ? (
                  <Empty>
                    <EmptyMedia variant="icon">
                      <Users className="h-6 w-6" />
                    </EmptyMedia>
                    <EmptyTitle>Sin registro de personal</EmptyTitle>
                    <EmptyDescription>
                      Aún no hay personal activo con bonos registrados para los filtros seleccionados.
                    </EmptyDescription>
                  </Empty>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Empleado</TableHead>
                          <TableHead>Bono</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                          <TableHead>Estatus</TableHead>
                          <TableHead>Fecha de aprobación</TableHead>
                          <TableHead>Fecha de pago</TableHead>
                          <TableHead className="w-[220px]">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staffBonuses.map((bonus) => (
                          <TableRow key={bonus.id}>
                            <TableCell className="font-medium">
                              {bonus.staff?.first_name} {bonus.staff?.last_name}
                            </TableCell>
                            <TableCell className="max-w-[220px]">
                              <div className="truncate font-medium">
                                {bonus.course_name || typeLabels[bonus.bonus_type] || bonus.bonus_type}
                              </div>
                              {bonus.staff?.department?.name && (
                                <div className="truncate text-xs text-muted-foreground">
                                  {bonus.staff.department.name}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(Number(bonus.amount || 0))}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusColors[bonus.status]}>
                                {statusLabels[bonus.status] || bonus.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {bonus.approved_at ? formatDate(bonus.approved_at) : "-"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {bonus.paid_at ? formatDate(bonus.paid_at) : "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/dashboard/hr/bonuses/${bonus.id}`}>
                                    <Eye className="mr-1 h-4 w-4" />
                                    Ver
                                  </Link>
                                </Button>
                                {canChangeStatus && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setStatusChangeBonus(bonus)
                                      setStatusChangeTarget("")
                                    }}
                                  >
                                    <RefreshCw className="mr-1 h-4 w-4" />
                                    Estatus
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => setBonusToDelete(bonus)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Eliminar bono</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* Tab: política de bonos */}
              <TabsContent value="policy" className="mt-6">
                <div className="rounded-lg border bg-card">
                  <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <ScrollText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold leading-tight">Política de Bonos</h3>
                        <p className="text-sm text-muted-foreground">
                          Define cómo funcionan los bonos y los pasos a seguir.
                        </p>
                        {policyUpdatedAt && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Última actualización: {formatDate(policyUpdatedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    {canManagePolicy &&
                      (!editingPolicy ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPolicyDraft(policyContent)
                            setEditingPolicy(true)
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          {policyContent ? "Editar" : "Escribir política"}
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPolicyDraft(policyContent)
                              setEditingPolicy(false)
                            }}
                            disabled={savingPolicy}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancelar
                          </Button>
                          <Button size="sm" onClick={savePolicy} disabled={savingPolicy}>
                            {savingPolicy ? (
                              <Spinner className="mr-2 h-4 w-4" />
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            Guardar
                          </Button>
                        </div>
                      ))}
                  </div>

                  <div className="p-4">
                    {editingPolicy ? (
                      <Textarea
                        value={policyDraft}
                        onChange={(e) => setPolicyDraft(e.target.value)}
                        placeholder={
                          "Describe la política de bonos: en qué consiste, quién es elegible, cómo se calcula, y los pasos a realizar para otorgarlos.\n\nEjemplo:\n1. El bono de desempeño se evalúa trimestralmente.\n2. El líder de área propone el monto según los resultados.\n3. Recursos Humanos valida y aprueba.\n4. El bono se paga en la siguiente nómina."
                        }
                        rows={16}
                        className="resize-y leading-relaxed"
                      />
                    ) : policyContent ? (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {policyContent}
                      </div>
                    ) : (
                      <Empty>
                        <EmptyMedia variant="icon">
                          <ScrollText className="h-6 w-6" />
                        </EmptyMedia>
                        <EmptyTitle>Sin política definida</EmptyTitle>
                        <EmptyDescription>
                          {canManagePolicy
                            ? 'Aún no has escrito la política de bonos para esta agencia. Haz clic en "Escribir política" para comenzar.'
                            : "Aún no se ha definido la política de bonos para esta agencia."}
                        </EmptyDescription>
                      </Empty>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Confirmación para eliminar un bono individual */}
      <AlertDialog open={!!bonusToDelete} onOpenChange={(open) => !open && setBonusToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar bono</AlertDialogTitle>
            <AlertDialogDescription>
              {bonusToDelete
                ? `Se eliminará permanentemente el bono de ${bonusToDelete.staff?.first_name} ${bonusToDelete.staff?.last_name} por ${formatCurrency(Number(bonusToDelete.amount || 0))}. Esta acción no se puede deshacer.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteBonus()
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Spinner className="mr-2 h-4 w-4" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cambio de estatus con confirmación */}
      <AlertDialog open={!!statusChangeBonus} onOpenChange={(open) => !open && closeStatusChange()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambiar estatus del bono</AlertDialogTitle>
            <AlertDialogDescription>
              {statusChangeBonus
                ? `Bono de ${statusChangeBonus.staff?.first_name} ${statusChangeBonus.staff?.last_name} por ${formatCurrency(Number(statusChangeBonus.amount || 0))}. Estatus actual: ${statusLabels[statusChangeBonus.status] || statusChangeBonus.status}. Selecciona el nuevo estatus; el cambio se aplicará al confirmar.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Select value={statusChangeTarget} onValueChange={setStatusChangeTarget}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un estatus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Aprobado</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            {statusChangeTarget === "paid" && (
              <p className="mt-2 text-xs text-muted-foreground">
                Normalmente el estatus &quot;Pagado&quot; se asigna automáticamente cuando la nómina que
                incluye el bono se marca como pagada. Úsalo manualmente solo para ajustes.
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changingStatus}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleChangeStatus()
              }}
              disabled={changingStatus || !statusChangeTarget || statusChangeTarget === statusChangeBonus?.status}
            >
              {changingStatus ? <Spinner className="mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Confirmar cambio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
