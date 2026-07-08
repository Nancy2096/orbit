"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import { HandCoins, Eye } from "lucide-react"

interface StaffLoan {
  id: string
  loan_number: string | null
  loan_type: string
  principal_amount: number
  total_amount: number
  number_of_payments: number
  payments_made: number
  remaining_balance: number
  status: string
  approval_date: string | null
}

const statusLabels: Record<string, string> = {
  approved: "Aprobado",
  active: "Activo",
  paid: "Pagado",
  defaulted: "Vencido",
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  approved: "outline",
  active: "default",
  paid: "default",
  defaulted: "destructive",
}

const typeLabels: Record<string, string> = {
  personal: "Personal",
  emergency: "Emergencia",
  education: "Educación",
  medical: "Médico",
  housing: "Vivienda",
  other: "Otro",
}

export function StaffLoans({ staffId }: { staffId: string }) {
  const supabase = createClient()
  const [loans, setLoans] = useState<StaffLoan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function fetchLoans() {
      setLoading(true)
      // Solo se muestran los préstamos ya autorizados (no pendientes ni rechazados).
      const { data } = await supabase
        .from("loans")
        .select(
          "id, loan_number, loan_type, principal_amount, total_amount, number_of_payments, payments_made, remaining_balance, status, approval_date",
        )
        .eq("staff_id", staffId)
        .in("status", ["approved", "active", "paid", "defaulted"])
        .order("approval_date", { ascending: false })

      if (active && data) setLoans(data as StaffLoan[])
      if (active) setLoading(false)
    }
    fetchLoans()
    return () => {
      active = false
    }
  }, [staffId, supabase])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    const day = date.getUTCDate()
    const month = date.toLocaleString("es-MX", { month: "short", timeZone: "UTC" })
    const year = date.getUTCFullYear()
    return `${day} ${month} ${year}`
  }

  // Si no hay préstamos autorizados, no mostramos la tarjeta para no saturar el perfil.
  if (!loading && loans.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <HandCoins className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Préstamos</CardTitle>
            <CardDescription>Préstamos autorizados de este miembro del personal</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Autorizado</TableHead>
                  <TableHead className="text-right">Capital</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => {
                  const progress =
                    loan.number_of_payments > 0
                      ? (loan.payments_made / loan.number_of_payments) * 100
                      : 0
                  return (
                    <TableRow key={loan.id}>
                      <TableCell>
                        <div className="font-medium">
                          {typeLabels[loan.loan_type] || loan.loan_type}
                        </div>
                        {loan.loan_number && (
                          <div className="text-xs text-muted-foreground">#{loan.loan_number}</div>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(loan.approval_date)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(loan.principal_amount || 0))}
                      </TableCell>
                      <TableCell>
                        <div className="w-full max-w-[120px]">
                          <Progress value={progress} className="h-2" />
                          <div className="text-xs text-muted-foreground mt-1">
                            {loan.payments_made}/{loan.number_of_payments} pagos
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(loan.remaining_balance || 0))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[loan.status] || "secondary"}>
                          {statusLabels[loan.status] || loan.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/hr/loans/${loan.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
