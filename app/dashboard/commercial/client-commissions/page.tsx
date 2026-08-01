"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Search, HandCoins, DollarSign, Users, Receipt } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAgency } from "@/contexts/agency-context"

// Etiqueta legible para el rol que comisiona.
function getRoleLabel(role: string) {
  switch (role) {
    case "manager":
      return "Gerente Comercial"
    case "advisor":
    case "sales_advisor":
      return "Asesor Comercial"
    case "coordinator":
      return "Coordinador"
    case "additional":
      return "Adicional"
    default:
      return role
  }
}

// Una línea de comisión = una factura pagada por un comisionista.
interface CommissionRow {
  key: string
  invoiceId: string
  invoiceNumber: string
  sourceType: "account" | "project"
  sourceName: string
  clientName: string
  staffName: string
  role: string
  percentage: number
  base: number
  commission: number
  paymentDate: string | null
  currencySymbol: string
}

export default function ClientCommissionsPage() {
  const { selectedAgencyId, loading: agencyLoading } = useAgency()
  const supabase = createClient()

  const [rows, setRows] = useState<CommissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [staffFilter, setStaffFilter] = useState<string>("all")

  useEffect(() => {
    if (selectedAgencyId) {
      fetchData()
    } else if (!agencyLoading) {
      setLoading(false)
      setRows([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgencyId, agencyLoading])

  const fetchData = async () => {
    if (!selectedAgencyId) return
    setLoading(true)
    try {
      // Facturas pagadas de la agencia (pagos de clientes).
      const { data: invoices } = await supabase
        .from("invoices")
        .select(
          "id, invoice_number, account_id, project_id, client_id, total_amount, paid_amount, payment_date, currency_id, status",
        )
        .eq("agency_id", selectedAgencyId)
        .eq("status", "paid")

      const paidInvoices = invoices || []

      // Catálogos para resolver nombres.
      const [accountsRes, projectsRes, clientsRes, currenciesRes] = await Promise.all([
        supabase.from("accounts").select("id, account_name, client_id").eq("agency_id", selectedAgencyId),
        supabase.from("projects").select("id, name, account_id"),
        supabase.from("clients").select("id, company_name"),
        supabase.from("currencies").select("id, symbol, code"),
      ])

      const accounts = new Map((accountsRes.data || []).map((a) => [a.id, a]))
      const projects = new Map((projectsRes.data || []).map((p) => [p.id, p]))
      const clients = new Map((clientsRes.data || []).map((c) => [c.id, c]))
      const currencies = new Map((currenciesRes.data || []).map((c) => [c.id, c]))

      // Determinar cuentas y proyectos involucrados en las facturas pagadas.
      const accountIds = new Set<string>()
      const projectIds = new Set<string>()
      paidInvoices.forEach((inv) => {
        if (inv.project_id) projectIds.add(inv.project_id)
        else if (inv.account_id) accountIds.add(inv.account_id)
      })

      // Config de comisiones registrada en cada cuenta / proyecto (quién comisiona).
      const [acctCommRes, projCommRes] = await Promise.all([
        accountIds.size > 0
          ? supabase
              .from("account_commissions")
              .select("account_id, staff_id, role, commission_percentage, staff (first_name, last_name)")
              .in("account_id", Array.from(accountIds))
          : Promise.resolve({ data: [] as any[] }),
        projectIds.size > 0
          ? supabase
              .from("project_commissions")
              .select("project_id, staff_id, role, commission_percentage, staff (first_name, last_name)")
              .in("project_id", Array.from(projectIds))
          : Promise.resolve({ data: [] as any[] }),
      ])

      // Agrupar comisionistas por cuenta / proyecto.
      const commByAccount = new Map<string, any[]>()
      ;(acctCommRes.data || []).forEach((c: any) => {
        const list = commByAccount.get(c.account_id) || []
        list.push(c)
        commByAccount.set(c.account_id, list)
      })
      const commByProject = new Map<string, any[]>()
      ;(projCommRes.data || []).forEach((c: any) => {
        const list = commByProject.get(c.project_id) || []
        list.push(c)
        commByProject.set(c.project_id, list)
      })

      const result: CommissionRow[] = []

      paidInvoices.forEach((inv) => {
        // Base sobre la que se comisiona: lo efectivamente pagado.
        const base = Number(inv.paid_amount ?? 0) || Number(inv.total_amount ?? 0)
        const currency = inv.currency_id ? currencies.get(inv.currency_id) : null
        const currencySymbol = currency?.symbol || "$"

        let commissioners: any[] = []
        let sourceType: "account" | "project" = "account"
        let sourceName = "Sin asignar"
        let clientId: string | null = inv.client_id

        if (inv.project_id) {
          sourceType = "project"
          const project = projects.get(inv.project_id)
          sourceName = project?.name || "Proyecto"
          commissioners = commByProject.get(inv.project_id) || []
          // El cliente del proyecto viene de su cuenta.
          if (!clientId && project?.account_id) {
            clientId = accounts.get(project.account_id)?.client_id ?? null
          }
        } else if (inv.account_id) {
          sourceType = "account"
          const account = accounts.get(inv.account_id)
          sourceName = account?.account_name || "Cuenta"
          commissioners = commByAccount.get(inv.account_id) || []
          if (!clientId) clientId = account?.client_id ?? null
        }

        const clientName = clientId ? clients.get(clientId)?.company_name || "Sin cliente" : "Sin cliente"

        // Solo cuentas / proyectos que tengan comisiones registradas.
        commissioners.forEach((c, idx) => {
          const percentage = Number(c.commission_percentage) || 0
          const staffName =
            `${c.staff?.first_name || ""} ${c.staff?.last_name || ""}`.trim() || "Sin nombre"
          result.push({
            key: `${inv.id}-${c.staff_id}-${c.role}-${idx}`,
            invoiceId: inv.id,
            invoiceNumber: inv.invoice_number || "S/N",
            sourceType,
            sourceName,
            clientName,
            staffName,
            role: c.role,
            percentage,
            base,
            commission: base * (percentage / 100),
            paymentDate: inv.payment_date,
            currencySymbol,
          })
        })
      })

      // Ordenar por fecha de pago descendente.
      result.sort((a, b) => {
        const da = a.paymentDate ? new Date(a.paymentDate).getTime() : 0
        const db = b.paymentDate ? new Date(b.paymentDate).getTime() : 0
        return db - da
      })

      setRows(result)
    } catch (error) {
      console.error("Error fetching client commissions:", error)
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  // Opciones de comisionistas para el filtro.
  const staffOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.staffName))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [rows])

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return rows.filter((r) => {
      const matchesSearch =
        term === "" ||
        r.clientName.toLowerCase().includes(term) ||
        r.sourceName.toLowerCase().includes(term) ||
        r.staffName.toLowerCase().includes(term) ||
        r.invoiceNumber.toLowerCase().includes(term)
      const matchesRole = roleFilter === "all" || r.role === roleFilter
      const matchesStaff = staffFilter === "all" || r.staffName === staffFilter
      return matchesSearch && matchesRole && matchesStaff
    })
  }, [rows, searchTerm, roleFilter, staffFilter])

  const totals = useMemo(() => {
    const totalBase = filteredRows.reduce((sum, r) => sum + r.base, 0)
    const totalCommission = filteredRows.reduce((sum, r) => sum + r.commission, 0)
    const uniqueStaff = new Set(filteredRows.map((r) => r.staffName)).size
    return { totalBase, totalCommission, uniqueStaff }
  }, [filteredRows])

  const formatCurrency = (amount: number, symbol = "$") =>
    `${symbol}${new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`

  const formatDate = (date: string | null) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
  }

  const availableRoles = useMemo(() => {
    const set = new Set(rows.map((r) => r.role))
    return Array.from(set)
  }, [rows])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-balance flex items-center gap-2">
          <HandCoins className="h-6 w-6 text-primary" />
          Comisiones Clientes
        </h1>
        <p className="text-muted-foreground text-pretty">
          Registro de comisiones generadas por los pagos de facturas de clientes, según los comisionistas
          registrados en cada cuenta o proyecto.
        </p>
      </div>

      {loading || agencyLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Base pagada</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totals.totalBase)}</div>
                <p className="text-xs text-muted-foreground">Monto de facturas pagadas con comisión</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total comisiones</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totals.totalCommission)}</div>
                <p className="text-xs text-muted-foreground">Suma de comisiones generadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comisionistas</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totals.uniqueStaff}</div>
                <p className="text-xs text-muted-foreground">Personas que comisionan</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Registro de Comisiones</CardTitle>
              <CardDescription>
                Cada línea representa la comisión de una persona por el pago de una factura.
              </CardDescription>
              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cliente, cuenta, proyecto, comisionista o factura"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="sm:w-52">
                    <SelectValue placeholder="Rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    {availableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {getRoleLabel(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={staffFilter} onValueChange={setStaffFilter}>
                  <SelectTrigger className="sm:w-52">
                    <SelectValue placeholder="Comisionista" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {staffOptions.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredRows.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <HandCoins className="mx-auto mb-3 h-10 w-10 opacity-40" />
                  <p>No hay comisiones registradas.</p>
                  <p className="text-sm">
                    Se generan automáticamente cuando una factura de un cliente se marca como pagada y su cuenta o
                    proyecto tiene comisionistas registrados.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Factura</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Cuenta / Proyecto</TableHead>
                        <TableHead>Comisionista</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead className="text-right">Base</TableHead>
                        <TableHead className="text-right">%</TableHead>
                        <TableHead className="text-right">Comisión</TableHead>
                        <TableHead>Fecha pago</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRows.map((r) => (
                        <TableRow key={r.key}>
                          <TableCell className="font-medium">{r.invoiceNumber}</TableCell>
                          <TableCell>{r.clientName}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{r.sourceName}</span>
                              <span className="text-xs text-muted-foreground">
                                {r.sourceType === "project" ? "Proyecto" : "Cuenta"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{r.staffName}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{getRoleLabel(r.role)}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(r.base, r.currencySymbol)}</TableCell>
                          <TableCell className="text-right">{r.percentage}%</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(r.commission, r.currencySymbol)}
                          </TableCell>
                          <TableCell>{formatDate(r.paymentDate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
