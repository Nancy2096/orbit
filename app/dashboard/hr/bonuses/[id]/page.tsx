"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Gift, User, Building2, Calendar, DollarSign, History } from "lucide-react"
import { toast } from "sonner"

interface Bonus {
  id: string
  bonus_type: string
  bonus_type_id: string | null
  description: string | null
  amount: number
  status: string
  effective_date: string | null
  notes: string | null
  created_at: string
  staff: {
    id: string
    first_name: string
    last_name: string
    department: { name: string } | null
  } | null
  agency: {
    id: string
    name: string
  } | null
  bonus_type_ref: {
    id: string
    name: string
  } | null
}

interface HistoryBonus {
  id: string
  bonus_type: string
  amount: number
  status: string
  effective_date: string | null
  created_at: string
  bonus_type_ref: { name: string } | null
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

export default function BonusDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [bonus, setBonus] = useState<Bonus | null>(null)
  const [history, setHistory] = useState<HistoryBonus[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    fetchBonus()
  }, [id])

  const fetchBonus = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("bonuses")
      .select(`
        *,
        staff:staff(id, first_name, last_name, department:departments(name)),
        agency:agencies(id, name),
        bonus_type_ref:bonus_types(id, name)
      `)
      .eq("id", id)
      .single()

    if (error || !data) {
      toast.error("No se encontró el bono")
      setLoading(false)
      return
    }

    setBonus(data as Bonus)

    // Historial de bonos del mismo miembro del personal
    if (data.staff?.id) {
      const { data: historyData } = await supabase
        .from("bonuses")
        .select(`
          id, bonus_type, amount, status, effective_date, created_at,
          bonus_type_ref:bonus_types(name)
        `)
        .eq("staff_id", data.staff.id)
        .order("created_at", { ascending: false })

      if (historyData) setHistory(historyData as HistoryBonus[])
    }

    setLoading(false)
  }

  const updateStatus = async (newStatus: string) => {
    if (!bonus) return
    setUpdatingStatus(true)

    const updates: Record<string, unknown> = { status: newStatus }
    if (newStatus === "paid") updates.paid_at = new Date().toISOString()
    if (newStatus === "approved") updates.approved_at = new Date().toISOString()

    const { error } = await supabase.from("bonuses").update(updates).eq("id", bonus.id)

    if (error) {
      toast.error("Error al actualizar el estado")
    } else {
      toast.success("Estado actualizado")
      fetchBonus()
    }
    setUpdatingStatus(false)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    const day = date.getUTCDate()
    const month = date.toLocaleString("es-MX", { month: "short", timeZone: "UTC" })
    const year = date.getUTCFullYear()
    return `${day} ${month} ${year}`
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount)

  const typeName = (b: { bonus_type_ref: { name: string } | null; bonus_type: string }) =>
    b.bonus_type_ref?.name || typeLabels[b.bonus_type] || b.bonus_type

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!bonus) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Gift className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Bono no encontrado</h2>
        <Button asChild className="mt-4">
          <Link href="/dashboard/hr/bonuses">Volver a Bonos</Link>
        </Button>
      </div>
    )
  }

  const totalHistory = history.reduce((sum, b) => sum + Number(b.amount || 0), 0)
  const paidHistory = history
    .filter((b) => b.status === "paid")
    .reduce((sum, b) => sum + Number(b.amount || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/hr/bonuses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Detalle del Bono</h1>
          <p className="text-muted-foreground">
            {bonus.staff?.first_name} {bonus.staff?.last_name}
          </p>
        </div>
        <Badge variant={statusColors[bonus.status]} className="text-sm">
          {statusLabels[bonus.status] || bonus.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Info principal */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <CardTitle>Información del Bono</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Empleado</p>
                  <p className="font-medium">
                    {bonus.staff?.first_name} {bonus.staff?.last_name}
                  </p>
                  {bonus.staff?.department?.name && (
                    <p className="text-sm text-muted-foreground">{bonus.staff.department.name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Agencia</p>
                  <p className="font-medium">{bonus.agency?.name || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Gift className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de bono</p>
                  <p className="font-medium">{typeName(bonus)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Fecha efectiva</p>
                  <p className="font-medium">{formatDate(bonus.effective_date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <DollarSign className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Monto</p>
                  <p className="font-medium text-lg text-green-600">
                    {formatCurrency(Number(bonus.amount || 0))}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Registrado</p>
                  <p className="font-medium">{formatDate(bonus.created_at)}</p>
                </div>
              </div>
            </div>

            {bonus.description && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Descripción</p>
                <p className="text-sm">{bonus.description}</p>
              </div>
            )}
            {bonus.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notas internas</p>
                <p className="text-sm">{bonus.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estado */}
        <Card>
          <CardHeader>
            <CardTitle>Cambiar Estado</CardTitle>
            <CardDescription>Actualiza el estado del bono</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={bonus.status} onValueChange={updateStatus} disabled={updatingStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="approved">Aprobado</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            {updatingStatus && <Spinner className="h-4 w-4" />}
          </CardContent>
        </Card>
      </div>

      {/* Historial de bonos del empleado */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Historial de Bonos</CardTitle>
              <CardDescription>
                Todos los bonos de {bonus.staff?.first_name} {bonus.staff?.last_name} — Total:{" "}
                {formatCurrency(totalHistory)} · Pagado: {formatCurrency(paidHistory)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Sin historial de bonos</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha efectiva</TableHead>
                    <TableHead>Registrado</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h) => (
                    <TableRow key={h.id} className={h.id === bonus.id ? "bg-muted/50" : ""}>
                      <TableCell className="font-medium">{typeName(h)}</TableCell>
                      <TableCell>{formatDate(h.effective_date)}</TableCell>
                      <TableCell>{formatDate(h.created_at)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(h.amount || 0))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[h.status]}>
                          {statusLabels[h.status] || h.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {h.id === bonus.id ? (
                          <span className="text-xs text-muted-foreground">Actual</span>
                        ) : (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/hr/bonuses/${h.id}`}>Ver</Link>
                          </Button>
                        )}
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
