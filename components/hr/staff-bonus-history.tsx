"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import { Gift, Eye } from "lucide-react"

interface BonusRow {
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

export function StaffBonusHistory({ staffId }: { staffId: string }) {
  const supabase = createClient()
  const [bonuses, setBonuses] = useState<BonusRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const fetchBonuses = async () => {
      setLoading(true)
      const { data } = await supabase
        .from("bonuses")
        .select(`
          id, bonus_type, amount, status, effective_date, created_at,
          bonus_type_ref:bonus_types(name)
        `)
        .eq("staff_id", staffId)
        .order("created_at", { ascending: false })

      if (active && data) setBonuses(data as BonusRow[])
      if (active) setLoading(false)
    }
    fetchBonuses()
    return () => {
      active = false
    }
  }, [staffId])

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

  const total = bonuses.reduce((sum, b) => sum + Number(b.amount || 0), 0)
  const paid = bonuses
    .filter((b) => b.status === "paid")
    .reduce((sum, b) => sum + Number(b.amount || 0), 0)

  const typeName = (b: BonusRow) => b.bonus_type_ref?.name || typeLabels[b.bonus_type] || b.bonus_type

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Historial de Bonos</CardTitle>
            <CardDescription>
              {loading
                ? "Cargando..."
                : `${bonuses.length} bono(s) · Total: ${formatCurrency(total)} · Pagado: ${formatCurrency(paid)}`}
            </CardDescription>
          </div>
        </div>
        <Button size="sm" asChild>
          <Link href="/dashboard/hr/bonuses/new">Nuevo Bono</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-6 w-6" />
          </div>
        ) : bonuses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Este miembro no tiene bonos registrados.
          </div>
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
                  <TableHead className="w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bonuses.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{typeName(b)}</TableCell>
                    <TableCell>{formatDate(b.effective_date)}</TableCell>
                    <TableCell>{formatDate(b.created_at)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(b.amount || 0))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[b.status]}>
                        {statusLabels[b.status] || b.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/hr/bonuses/${b.id}`}>
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
  )
}
