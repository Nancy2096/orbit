"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { usePermissions } from "@/components/dashboard/permissions-provider"
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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Plus, Landmark, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface BankAccountLite {
  id: string
  bank_name: string
  account_name: string | null
  agency_id: string | null
  is_primary: boolean
  initial_balance: number
  currency: { code: string; symbol: string } | null
  agency: { id: string; name: string } | null
}

interface Movement {
  id: string
  bank_account_id: string
  movement_type: "ingreso" | "salida"
  category: string
  amount: number
  description: string | null
  reference: string | null
  movement_date: string
  source: "bank" | "payment" | "equity"
  deletable: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  nomina: "Nómina",
  manual: "Manual",
  transferencia: "Transferencia",
  cobro: "Cobro de factura",
  capital: "Capital",
  otro: "Otro",
}

// Rango del mes en curso (primer y último día), en formato YYYY-MM-DD usando la
// fecha local para evitar desfases por zona horaria.
function getMonthRange() {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const toStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  return { from: toStr(first), to: toStr(last) }
}

function MovementsContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const bankNameParam = searchParams.get("bank") || ""

  const { roleName, fullAccess } = usePermissions()
  // Solo Finanzas/Administración, Dirección General y Super Administrador pueden
  // registrar o eliminar movimientos manuales. (superadmin => fullAccess).
  const canManage =
    fullAccess || roleName === "finanzas" || roleName === "direccion_general"

  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState<BankAccountLite[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState<string>(() => getMonthRange().from)
  const [dateTo, setDateTo] = useState<string>(() => getMonthRange().to)
  const [showDialog, setShowDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    bank_account_id: "",
    movement_type: "salida" as "ingreso" | "salida",
    category: "manual",
    amount: "",
    description: "",
    reference: "",
    movement_date: new Date().toISOString().split("T")[0],
  })

  const load = useCallback(async () => {
    setLoading(true)

    let accQuery = supabase
      .from("bank_accounts")
      .select(`
        id, bank_name, account_name, agency_id, is_primary, initial_balance,
        currency:currencies(code, symbol),
        agency:agencies(id, name)
      `)
      .eq("is_active", true)
      .order("bank_name")

    if (bankNameParam) {
      accQuery = accQuery.ilike("bank_name", bankNameParam)
    }

    const { data: accData, error: accError } = await accQuery
    if (accError) {
      console.error("Error cargando cuentas:", accError)
      setLoading(false)
      return
    }

    const normalized: BankAccountLite[] = (accData || []).map((a: Record<string, unknown>) => ({
      ...(a as unknown as BankAccountLite),
      currency: Array.isArray(a.currency) ? (a.currency[0] as BankAccountLite["currency"]) : (a.currency as BankAccountLite["currency"]),
      agency: Array.isArray(a.agency) ? (a.agency[0] as BankAccountLite["agency"]) : (a.agency as BankAccountLite["agency"]),
    }))
    setAccounts(normalized)

    const accountIds = normalized.map((a) => a.id)
    if (accountIds.length === 0) {
      setMovements([])
      setLoading(false)
      return
    }

    // Cada banco debe reflejar TODAS sus entradas y salidas. Estas viven en tres
    // tablas distintas, así que las combinamos aquí:
    //  - bank_movements: movimientos manuales y salidas de nómina
    //  - payments (cobrados): entradas de dinero por cobro de facturas
    //  - equity_transactions: aportaciones (entrada) y retiros (salida) de capital
    const [bmRes, payRes, eqRes] = await Promise.all([
      supabase.from("bank_movements").select("*").in("bank_account_id", accountIds),
      supabase
        .from("payments")
        .select(
          "id, bank_account_id, amount, payment_date, reference_number, payment_number, notes, invoice:invoices(invoice_number)",
        )
        .eq("status", "completed")
        .in("bank_account_id", accountIds),
      supabase
        .from("equity_transactions")
        .select("id, bank_account_id, amount, transaction_date, transaction_type, description, reference_document")
        .in("bank_account_id", accountIds),
    ])

    if (bmRes.error) console.error("Error cargando movimientos:", bmRes.error)
    if (payRes.error) console.error("Error cargando cobros:", payRes.error)
    if (eqRes.error) console.error("Error cargando capital:", eqRes.error)

    const bankMovs: Movement[] = ((bmRes.data as Record<string, unknown>[]) || []).map((m) => ({
      id: m.id as string,
      bank_account_id: m.bank_account_id as string,
      movement_type: m.movement_type as "ingreso" | "salida",
      category: m.category as string,
      amount: Number(m.amount),
      description: (m.description as string) ?? null,
      reference: (m.reference as string) ?? null,
      movement_date: m.movement_date as string,
      source: "bank",
      deletable: (m.category as string) !== "nomina",
    }))

    const paymentMovs: Movement[] = ((payRes.data as Record<string, unknown>[]) || []).map((p) => {
      const invoice = Array.isArray(p.invoice) ? p.invoice[0] : p.invoice
      const invoiceNumber = (invoice as { invoice_number?: string } | undefined)?.invoice_number
      return {
        id: `pay-${p.id as string}`,
        bank_account_id: p.bank_account_id as string,
        movement_type: "ingreso",
        category: "cobro",
        amount: Number(p.amount),
        description: invoiceNumber
          ? `Cobro factura ${invoiceNumber}`
          : ((p.notes as string) || "Cobro recibido"),
        reference: (p.reference_number as string) || (p.payment_number as string) || null,
        movement_date: p.payment_date as string,
        source: "payment",
        deletable: false,
      }
    })

    const equityMovs: Movement[] = ((eqRes.data as Record<string, unknown>[]) || []).map((e) => {
      const type = e.transaction_type as string
      const isOut = type === "retiro" || type === "withdrawal" || type === "expense"
      return {
        id: `eq-${e.id as string}`,
        bank_account_id: e.bank_account_id as string,
        movement_type: isOut ? "salida" : "ingreso",
        category: "capital",
        amount: Number(e.amount),
        description: (e.description as string) || (isOut ? "Retiro de capital" : "Aportación de capital"),
        reference: (e.reference_document as string) || null,
        movement_date: e.transaction_date as string,
        source: "equity",
        deletable: false,
      }
    })

    const all = [...bankMovs, ...paymentMovs, ...equityMovs].sort((a, b) =>
      a.movement_date === b.movement_date ? 0 : a.movement_date < b.movement_date ? 1 : -1,
    )
    setMovements(all)
    setLoading(false)
  }, [supabase, bankNameParam])

  useEffect(() => {
    load()
  }, [load])

  const openDialog = () => {
    setForm({
      bank_account_id: accounts[0]?.id || "",
      movement_type: "salida",
      category: "manual",
      amount: "",
      description: "",
      reference: "",
      movement_date: new Date().toISOString().split("T")[0],
    })
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!form.bank_account_id) {
      toast.error("Selecciona una cuenta bancaria")
      return
    }
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) {
      toast.error("Ingresa un monto válido mayor a cero")
      return
    }

    setSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const acct = accounts.find((a) => a.id === form.bank_account_id)

      const { error } = await supabase.from("bank_movements").insert({
        bank_account_id: form.bank_account_id,
        agency_id: acct?.agency_id ?? null,
        movement_type: form.movement_type,
        category: form.category,
        amount,
        description: form.description.trim() || null,
        reference: form.reference.trim() || null,
        movement_date: form.movement_date,
        source_type: "manual",
        created_by: user?.id ?? null,
      })

      if (error) throw error
      toast.success("Movimiento registrado")
      setShowDialog(false)
      load()
    } catch (error) {
      console.error("Error guardando movimiento:", error)
      toast.error("Error al registrar el movimiento")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (movement: Movement) => {
    if (movement.source === "payment") {
      toast.error("Los cobros se revierten desde la factura correspondiente en Facturas y Pagos.")
      return
    }
    if (movement.source === "equity") {
      toast.error("Los movimientos de capital se administran desde Capital / Aportaciones.")
      return
    }
    if (movement.category === "nomina") {
      toast.error("Los movimientos de nómina se revierten desde el periodo de nómina, no aquí.")
      return
    }
    if (!confirm("¿Eliminar este movimiento? El saldo del banco se ajustará.")) return

    const { error } = await supabase.from("bank_movements").delete().eq("id", movement.id)
    if (error) {
      console.error("Error eliminando movimiento:", error)
      toast.error("Error al eliminar el movimiento")
      return
    }
    toast.success("Movimiento eliminado")
    load()
  }

  const filteredMovements = movements.filter((m) => {
    if (selectedAccountId !== "all" && m.bank_account_id !== selectedAccountId) return false
    if (dateFrom && m.movement_date < dateFrom) return false
    if (dateTo && m.movement_date > dateTo) return false
    return true
  })

  const accountById = new Map(accounts.map((a) => [a.id, a]))
  const symbol = accounts[0]?.currency?.symbol || "$"

  const totalIngresos = filteredMovements
    .filter((m) => m.movement_type === "ingreso")
    .reduce((s, m) => s + Number(m.amount), 0)
  const totalSalidas = filteredMovements
    .filter((m) => m.movement_type === "salida")
    .reduce((s, m) => s + Number(m.amount), 0)

  const fmt = (n: number) =>
    n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const bankTitle = bankNameParam || "Todos los bancos"

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/payments">
            <ArrowLeft className="h-4 w-4" />
            Bancos
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Movimientos · {bankTitle}</h1>
            <p className="text-sm text-muted-foreground">
              Ingresos y salidas de dinero de cada banco, con detalle.
            </p>
          </div>
        </div>
        {canManage && (
          <Button onClick={openDialog}>
            <Plus className="h-4 w-4" />
            Registrar movimiento
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="date_from">Desde</Label>
            <Input
              id="date_from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="date_to">Hasta</Label>
            <Input
              id="date_to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const r = getMonthRange()
                setDateFrom(r.from)
                setDateTo(r.to)
              }}
            >
              Mes actual
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateFrom("")
                setDateTo("")
              }}
            >
              Todo
            </Button>
          </div>
          {accounts.length > 1 && (
            <div className="ml-auto flex flex-col gap-2">
              <Label>Cuenta</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Filtrar por cuenta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las cuentas</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.bank_name}
                      {a.agency?.name ? ` · ${a.agency.name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
              Ingresos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-600">
              {symbol}
              {fmt(totalIngresos)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-red-600" />
              Salidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-red-600">
              {symbol}
              {fmt(totalSalidas)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Neto de movimientos</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {symbol}
              {fmt(totalIngresos - totalSalidas)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle de movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : filteredMovements.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No hay movimientos en el rango de fechas seleccionado. Ajusta las fechas o usa
              &quot;Todo&quot; para ver el historial completo.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Banco / Cuenta</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  {canManage && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((m) => {
                  const acct = accountById.get(m.bank_account_id)
                  const isIngreso = m.movement_type === "ingreso"
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(m.movement_date + "T00:00:00").toLocaleDateString("es-MX")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            isIngreso
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-red-200 bg-red-50 text-red-700"
                          }
                        >
                          {isIngreso ? (
                            <ArrowUpRight className="mr-1 h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="mr-1 h-3 w-3" />
                          )}
                          {isIngreso ? "Ingreso" : "Salida"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{CATEGORY_LABELS[m.category] || m.category}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {acct?.bank_name}
                        {acct?.agency?.name ? (
                          <span className="block text-xs text-muted-foreground">{acct.agency.name}</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {m.description || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {m.reference || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${isIngreso ? "text-emerald-600" : "text-red-600"}`}
                      >
                        {isIngreso ? "+" : "-"}
                        {acct?.currency?.symbol || "$"}
                        {fmt(Number(m.amount))}
                      </TableCell>
                      {canManage && (
                        <TableCell>
                          {m.deletable && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(m)}
                              aria-label="Eliminar movimiento"
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar movimiento</DialogTitle>
            <DialogDescription>
              Registra un ingreso o una salida de dinero en una cuenta bancaria.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Cuenta bancaria</Label>
              <Select
                value={form.bank_account_id}
                onValueChange={(v) => setForm({ ...form, bank_account_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.bank_name}
                      {a.agency?.name ? ` · ${a.agency.name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Tipo</Label>
                <Select
                  value={form.movement_type}
                  onValueChange={(v) => setForm({ ...form, movement_type: v as "ingreso" | "salida" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ingreso">Ingreso</SelectItem>
                    <SelectItem value="salida">Salida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Categoría</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="amount">Monto</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="movement_date">Fecha</Label>
                <Input
                  id="movement_date"
                  type="date"
                  value={form.movement_date}
                  onChange={(e) => setForm({ ...form, movement_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="reference">Referencia</Label>
              <Input
                id="reference"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder="No. de transferencia, folio, etc."
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detalle del movimiento"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Spinner className="h-4 w-4" /> : "Guardar movimiento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function BankMovementsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      }
    >
      <MovementsContent />
    </Suspense>
  )
}
