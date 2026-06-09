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
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { Plus, Search, Gift, DollarSign, Clock, CheckCircle, Eye } from "lucide-react"

interface Bonus {
  id: string
  bonus_type: string
  description: string | null
  amount: number
  status: string
  effective_date: string | null
  staff: {
    id: string
    first_name: string
    last_name: string
  }
  agency: {
    id: string
    name: string
  }
}

interface Agency {
  id: string
  name: string
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
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [agencyFilter, setAgencyFilter] = useState<string>("all")
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [bonusesRes, agenciesRes] = await Promise.all([
        supabase
          .from("bonuses")
          .select(`
            *,
            staff:staff(id, first_name, last_name),
            agency:agencies(id, name)
          `)
          .order("created_at", { ascending: false }),
        supabase
          .from("agencies")
          .select("id, name")
          .eq("is_active", true)
          .order("name"),
      ])

      if (bonusesRes.data) setBonuses(bonusesRes.data)
      if (agenciesRes.data) setAgencies(agenciesRes.data)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBonuses = bonuses.filter((bonus) => {
    const staffName = `${bonus.staff?.first_name || ""} ${bonus.staff?.last_name || ""}`.toLowerCase()
    const matchesSearch = staffName.includes(searchTerm.toLowerCase()) ||
      (bonus.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    const matchesStatus = statusFilter === "all" || bonus.status === statusFilter
    const matchesType = typeFilter === "all" || bonus.bonus_type === typeFilter
    const matchesAgency = agencyFilter === "all" || bonus.agency?.id === agencyFilter
    return matchesSearch && matchesStatus && matchesType && matchesAgency
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

  // Stats
  const totalBonuses = bonuses.reduce((sum, b) => sum + Number(b.amount || 0), 0)
  const pendingAmount = bonuses
    .filter((b) => b.status === "pending")
    .reduce((sum, b) => sum + Number(b.amount || 0), 0)
  const paidAmount = bonuses
    .filter((b) => b.status === "paid")
    .reduce((sum, b) => sum + Number(b.amount || 0), 0)
  const pendingCount = bonuses.filter((b) => b.status === "pending").length

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
        <CardHeader>
          <CardTitle>Lista de Bonos</CardTitle>
          <CardDescription>Todos los bonos registrados del equipo</CardDescription>
        </CardHeader>
        <CardContent>
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
            <Select value={agencyFilter} onValueChange={setAgencyFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Agencia" />
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
          ) : filteredBonuses.length === 0 ? (
            <Empty>
              <EmptyMedia variant="icon">
                <Gift className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No hay bonos</EmptyTitle>
              <EmptyDescription>
                {searchTerm || statusFilter !== "all" || typeFilter !== "all" || agencyFilter !== "all"
                  ? "No se encontraron resultados para tu búsqueda"
                  : "Comienza registrando el primer bono"}
              </EmptyDescription>
              {!searchTerm && statusFilter === "all" && typeFilter === "all" && agencyFilter === "all" && (
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
                    <TableHead>Agencia</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBonuses.map((bonus) => (
                    <TableRow key={bonus.id}>
                      <TableCell className="font-medium">
                        {bonus.staff?.first_name} {bonus.staff?.last_name}
                      </TableCell>
                      <TableCell>{bonus.agency?.name || "-"}</TableCell>
                      <TableCell>{typeLabels[bonus.bonus_type] || bonus.bonus_type}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {bonus.description || "-"}
                      </TableCell>
                      <TableCell>
                        {bonus.effective_date ? formatDate(bonus.effective_date) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(bonus.amount || 0))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[bonus.status]}>
                          {statusLabels[bonus.status] || bonus.status}
                        </Badge>
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
        </CardContent>
      </Card>
    </div>
  )
}
