"use client"

import { useState, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { Plus, Search, Gift, DollarSign, Clock, CheckCircle, Eye, Users, ScrollText, Pencil, Save, X } from "lucide-react"
import { DepartmentFilter } from "@/components/hr/department-filter"
import { useAgency } from "@/contexts/agency-context"
import { STAGE_LABELS, STAGE_BADGE_STYLES } from "@/lib/bonus-workflow"

interface Bonus {
  id: string
  bonus_type: string
  description: string | null
  amount: number
  status: string
  effective_date: string | null
  created_at: string
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

interface StaffRecord {
  staffId: string
  name: string
  department: string | null
  isActive: boolean
  count: number
  total: number
  paid: number
  pending: number
  lastDate: string | null
  latestBonusId: string
}

export default function BonusesPage() {
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
      const { data, error } = await supabase
        .from("bonus_policies")
        .upsert(
          {
            agency_id: selectedAgencyId,
            content: policyDraft.trim() || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "agency_id" }
        )
        .select("content, updated_at")
        .single()

      if (error) throw error
      setPolicyContent(data?.content || "")
      setPolicyDraft(data?.content || "")
      setPolicyUpdatedAt(data?.updated_at || null)
      setEditingPolicy(false)
    } catch (error) {
      console.error("Error saving policy:", error)
    } finally {
      setSavingPolicy(false)
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

  // Registro por personal activo: agrupa los bonos por empleado (solo activos)
  const staffRecords: StaffRecord[] = Object.values(
    filteredBonuses.reduce((acc: Record<string, StaffRecord>, bonus) => {
      const staff = bonus.staff
      if (!staff || !staff.is_active) return acc

      const amount = Number(bonus.amount || 0)
      const dateRef = bonus.effective_date || bonus.created_at

      if (!acc[staff.id]) {
        acc[staff.id] = {
          staffId: staff.id,
          name: `${staff.first_name} ${staff.last_name}`,
          department: staff.department?.name || null,
          isActive: staff.is_active,
          count: 0,
          total: 0,
          paid: 0,
          pending: 0,
          lastDate: null,
          latestBonusId: bonus.id,
        }
      }

      const record = acc[staff.id]
      record.count += 1
      record.total += amount
      if (bonus.status === "paid") record.paid += amount
      if (bonus.status === "pending" || bonus.status === "approved") record.pending += amount
      if (!record.lastDate || new Date(dateRef) > new Date(record.lastDate)) {
        record.lastDate = dateRef
        record.latestBonusId = bonus.id
      }
      return acc
    }, {})
  ).sort((a, b) => b.total - a.total)

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
        <Button asChild>
          <Link href="/dashboard/hr/bonuses/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Bono
          </Link>
        </Button>
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
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por empleado o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <DepartmentFilter
              departments={departments}
              agencyId={selectedAgencyId}
              value={departmentFilter}
              onChange={setDepartmentFilter}
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="performance">Desempeño</SelectItem>
                <SelectItem value="annual">Anual</SelectItem>
                <SelectItem value="christmas">Aguinaldo</SelectItem>
                <SelectItem value="productivity">Productividad</SelectItem>
                <SelectItem value="attendance">Asistencia</SelectItem>
                <SelectItem value="seniority">Antigüedad</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="approved">Aprobado</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : (
            <Tabs defaultValue="policy">
              <TabsList>
                <TabsTrigger value="policy">
                  <ScrollText className="mr-2 h-4 w-4" />
                  Política de Bonos
                </TabsTrigger>
                <TabsTrigger value="bonuses">
                  <Gift className="mr-2 h-4 w-4" />
                  Bonos
                </TabsTrigger>
                <TabsTrigger value="staff">
                  <Users className="mr-2 h-4 w-4" />
                  Por Personal
                </TabsTrigger>
              </TabsList>

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

              {/* Tab: registro por personal activo */}
              <TabsContent value="staff" className="mt-6">
                {staffRecords.length === 0 ? (
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
                          <TableHead>Departamento</TableHead>
                          <TableHead className="text-center">Bonos</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Pagado</TableHead>
                          <TableHead className="text-right">Pendiente</TableHead>
                          <TableHead>Último bono</TableHead>
                          <TableHead className="w-[100px]">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staffRecords.map((record) => (
                          <TableRow key={record.staffId}>
                            <TableCell className="font-medium">{record.name}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {record.department || "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{record.count}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(record.total)}
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              {formatCurrency(record.paid)}
                            </TableCell>
                            <TableCell className="text-right text-amber-600">
                              {formatCurrency(record.pending)}
                            </TableCell>
                            <TableCell>
                              {record.lastDate ? formatDate(record.lastDate) : "-"}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/dashboard/hr/bonuses/${record.latestBonusId}`}>
                                  <Eye className="mr-1 h-4 w-4" />
                                  Ver
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
                    {!editingPolicy ? (
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
                    )}
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
                          Aún no has escrito la política de bonos para esta agencia. Haz clic en
                          &quot;Escribir política&quot; para comenzar.
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
    </div>
  )
}
