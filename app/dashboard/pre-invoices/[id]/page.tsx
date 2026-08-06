"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Eye, Send, FileCheck, Loader2, Printer, Mail, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { usePermissions } from "@/components/dashboard/permissions-provider"
import {
  type PreInvoice,
  type PreInvoiceItem,
  STATUS_LABELS,
  STATUS_VARIANTS,
  STATUS_CLASSES,
  canEditPreInvoicePrices,
  computeTotals,
  formatCurrency,
  lineAmount,
  periodLabel,
  refreshPreInvoiceAmounts,
  convertPreInvoiceToInvoice,
} from "@/lib/pre-invoices"

interface RelatedInfo {
  accountName: string | null
  projectName: string | null
  clientName: string | null
  clientEmail: string | null
  agencyName: string | null
}

export default function PreInvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const id = params.id as string

  const [preInvoice, setPreInvoice] = useState<PreInvoice | null>(null)
  const [items, setItems] = useState<PreInvoiceItem[]>([])
  const [related, setRelated] = useState<RelatedInfo>({
    accountName: null,
    projectName: null,
    clientName: null,
    clientEmail: null,
    agencyName: null,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [converting, setConverting] = useState(false)
  const [sending, setSending] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [recipient, setRecipient] = useState("")

  const { roleName } = usePermissions()
  // Solo Finanzas/Administración, Dirección General y Superadmin editan precios.
  const canEditPrices = canEditPreInvoicePrices(roleName)

  const loadData = useCallback(async () => {
    setLoading(true)
    const { data: pi } = await supabase.from("pre_invoices").select("*").eq("id", id).single()

    if (!pi) {
      setError("No se encontró la prefactura")
      setLoading(false)
      return
    }
    setPreInvoice(pi as PreInvoice)
    setTaxRateInput(String(pi.tax_rate != null ? Number(pi.tax_rate) : 16))

    const { data: itemsData } = await supabase
      .from("pre_invoice_items")
      .select("*")
      .eq("pre_invoice_id", id)
      .order("sort_order", { ascending: true })
    setItems((itemsData as PreInvoiceItem[]) || [])

    // Datos relacionados para la vista previa
    const info: RelatedInfo = {
      accountName: null,
      projectName: null,
      clientName: null,
      clientEmail: null,
      agencyName: null,
    }

    if (pi.account_id) {
      const { data: acc } = await supabase.from("accounts").select("name").eq("id", pi.account_id).single()
      info.accountName = acc?.name ?? null
    }
    if (pi.project_id) {
      const { data: proj } = await supabase.from("projects").select("name").eq("id", pi.project_id).single()
      info.projectName = proj?.name ?? null
    }
    if (pi.client_id) {
      const { data: client } = await supabase
        .from("clients")
        .select("name, email")
        .eq("id", pi.client_id)
        .single()
      info.clientName = client?.name ?? null
      info.clientEmail = client?.email ?? null
    }
    if (pi.agency_id) {
      const { data: agency } = await supabase.from("agencies").select("name").eq("id", pi.agency_id).single()
      info.agencyName = agency?.name ?? null
    }
    setRelated(info)
    setRecipient((prev) => prev || info.clientEmail || pi.sent_to || "")
    setLoading(false)
  }, [id, supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  const editable = preInvoice?.status === "draft" || preInvoice?.status === "sent"
  const taxEnabled = preInvoice?.tax_enabled !== false
  const taxRate = preInvoice?.tax_rate != null ? Number(preInvoice.tax_rate) : 16
  const [taxRateInput, setTaxRateInput] = useState<string>("16")
  const totals = computeTotals(items, taxEnabled, taxRate)

  const persistTotals = async (
    nextItems: PreInvoiceItem[],
    nextTaxEnabled = taxEnabled,
    nextTaxRate = taxRate,
  ) => {
    const t = computeTotals(nextItems, nextTaxEnabled, nextTaxRate)
    await supabase
      .from("pre_invoices")
      .update({ subtotal: t.subtotal, tax: t.tax, total: t.total })
      .eq("id", id)
  }

  const toggleItem = async (itemId: string, included: boolean) => {
    if (!editable) return
    setSaving(true)
    const nextItems = items.map((i) => (i.id === itemId ? { ...i, is_included: included } : i))
    setItems(nextItems)
    await supabase.from("pre_invoice_items").update({ is_included: included }).eq("id", itemId)
    await persistTotals(nextItems)
    setSaving(false)
  }

  // Activa/desactiva el IVA (p. ej. cuentas extranjeras o acuerdos sin impuestos).
  const toggleTax = async (enabled: boolean) => {
    if (!editable || !preInvoice) return
    setSaving(true)
    setPreInvoice({ ...preInvoice, tax_enabled: enabled })
    await supabase.from("pre_invoices").update({ tax_enabled: enabled }).eq("id", id)
    await persistTotals(items, enabled)
    setSaving(false)
  }

  // Actualiza el porcentaje de IVA de la prefactura (no queda fijo en 16%).
  const updateTaxRate = async (value: number) => {
    if (!editable || !preInvoice) return
    const rate = Number.isFinite(value) && value >= 0 ? Math.round(value * 100) / 100 : 16
    if (rate === taxRate) return
    setSaving(true)
    setPreInvoice({ ...preInvoice, tax_rate: rate })
    setTaxRateInput(String(rate))
    await supabase.from("pre_invoices").update({ tax_rate: rate }).eq("id", id)
    await persistTotals(items, taxEnabled, rate)
    setSaving(false)
  }

  // Edición manual del precio unitario (solo roles autorizados).
  const updateUnitPrice = async (itemId: string, value: number) => {
    if (!canEditPrices || !editable) return
    const unit_price = Number.isFinite(value) && value >= 0 ? value : 0
    setSaving(true)
    const nextItems = items.map((i) =>
      i.id === itemId ? { ...i, unit_price, amount: lineAmount(i.quantity, unit_price, i.discount) } : i,
    )
    setItems(nextItems)
    const updated = nextItems.find((i) => i.id === itemId)
    await supabase
      .from("pre_invoice_items")
      .update({ unit_price, amount: updated?.amount ?? 0 })
      .eq("id", itemId)
    await persistTotals(nextItems)
    setSaving(false)
  }

  // Recalcula los montos con los datos actuales de Cuentas/Proyectos.
  const handleRefresh = async () => {
    setRefreshing(true)
    setError(null)
    try {
      await refreshPreInvoiceAmounts(supabase, id)
      await loadData()
      toast.success("Montos actualizados con los datos de Cuentas/Proyectos")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar la prefactura")
    } finally {
      setRefreshing(false)
    }
  }

  const includedItems = items.filter((i) => i.is_included)

  const handleConvert = async () => {
    if (!preInvoice) return
    if (includedItems.length === 0) {
      setError("Debe incluir al menos un servicio para convertir a factura")
      return
    }
    setConverting(true)
    setError(null)

    try {
      const { invoiceId } = await convertPreInvoiceToInvoice(supabase, id)
      router.push(`/dashboard/invoices/${invoiceId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al convertir la prefactura")
      setConverting(false)
    }
  }

  const handleSend = async () => {
    if (!recipient) {
      setError("Ingresa un correo de destino")
      return
    }
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/pre-invoices/${id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: recipient }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo enviar el correo")
      setShowSendDialog(false)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar el correo")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!preInvoice) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/pre-invoices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <p className="text-destructive">{error || "No se encontró la prefactura"}</p>
      </div>
    )
  }

  const targetName = preInvoice.source_type === "account" ? related.accountName : related.projectName

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/pre-invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{preInvoice.pre_invoice_number}</h1>
              <Badge variant={STATUS_VARIANTS[preInvoice.status]} className={STATUS_CLASSES[preInvoice.status]}>
            {STATUS_LABELS[preInvoice.status]}
          </Badge>
            </div>
            <p className="text-muted-foreground">
              {targetName || "—"} · {periodLabel(preInvoice.period_start)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing || !editable}>
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Actualizar
          </Button>
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Vista previa
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowSendDialog(true)}
            disabled={preInvoice.status === "cancelled"}
          >
            <Send className="mr-2 h-4 w-4" />
            Enviar por correo
          </Button>
          {preInvoice.status === "invoiced" && preInvoice.invoice_id ? (
            <Button asChild>
              <Link href={`/dashboard/invoices/${preInvoice.invoice_id}`}>
                <FileCheck className="mr-2 h-4 w-4" />
                Ver factura
              </Link>
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={!editable || includedItems.length === 0}>
                  <FileCheck className="mr-2 h-4 w-4" />
                  Mandar a Facturas
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Convertir a factura</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se creará una factura en el módulo de Facturas con los {includedItems.length} servicios
                    incluidos. Los servicios no entregados (desmarcados) no se facturarán. Esta prefactura quedará
                    marcada como facturada.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={converting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConvert} disabled={converting}>
                    {converting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Servicios a prefacturar</CardTitle>
              <CardDescription>
                Desmarca los servicios o proyectos que no se hayan entregado para excluirlos de la factura que se
                enviará al cliente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Incluir</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead className="text-right">Cant.</TableHead>
                    <TableHead className="text-right">P. Unitario</TableHead>
                    <TableHead className="text-right">Desc.</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No hay servicios en esta prefactura
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id} className={item.is_included ? "" : "opacity-50"}>
                        <TableCell>
                          <Checkbox
                            checked={item.is_included}
                            disabled={!editable || saving}
                            onCheckedChange={(checked) => toggleItem(item.id, Boolean(checked))}
                            aria-label={`Incluir ${item.description}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {canEditPrices && editable ? (
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              defaultValue={item.unit_price}
                              disabled={saving}
                              onBlur={(e) => {
                                const v = Number.parseFloat(e.target.value)
                                if (v !== item.unit_price) updateUnitPrice(item.id, v)
                              }}
                              className="h-8 w-28 text-right ml-auto"
                              aria-label={`Precio unitario de ${item.description}`}
                            />
                          ) : (
                            formatCurrency(item.unit_price, preInvoice.currency)
                          )}
                        </TableCell>
                        <TableCell className="text-right">{item.discount ? `${item.discount}%` : "—"}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.amount, preInvoice.currency)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cliente</span>
                <span className="font-medium">{related.clientName || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cuenta</span>
                <span className="font-medium">{related.accountName || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Agencia</span>
                <span className="font-medium">{related.agencyName || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Periodo</span>
                <span className="font-medium">{periodLabel(preInvoice.period_start)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Servicios incluidos</span>
                <span className="font-medium">
                  {includedItems.length} / {items.length}
                </span>
              </div>
              <Separator />
              <div className="space-y-2 rounded-md bg-muted/50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <Label htmlFor="tax-toggle" className="text-sm font-medium">
                      Aplicar IVA
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {taxEnabled ? "Se incluye el impuesto" : "Prefactura sin impuestos"}
                    </span>
                  </div>
                  <Switch
                    id="tax-toggle"
                    checked={taxEnabled}
                    disabled={!editable || saving}
                    onCheckedChange={(v) => toggleTax(Boolean(v))}
                  />
                </div>
                {taxEnabled && (
                  <div className="flex items-center justify-between">
                    <Label htmlFor="tax-rate" className="text-sm text-muted-foreground">
                      Porcentaje (%)
                    </Label>
                    <div className="relative w-24">
                      <Input
                        id="tax-rate"
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={taxRateInput}
                        disabled={!editable || saving}
                        onChange={(e) => setTaxRateInput(e.target.value)}
                        onBlur={(e) => updateTaxRate(Number.parseFloat(e.target.value))}
                        className="h-8 pr-6 text-right"
                        aria-label="Porcentaje de IVA"
                      />
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(totals.subtotal, preInvoice.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{taxEnabled ? `IVA (${taxRate}%)` : "IVA (exento)"}</span>
                <span className="font-medium">{formatCurrency(totals.tax, preInvoice.currency)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>{formatCurrency(totals.total, preInvoice.currency)}</span>
              </div>
              {preInvoice.sent_at && (
                <p className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  Enviada a {preInvoice.sent_to} el{" "}
                  {new Date(preInvoice.sent_at).toLocaleDateString("es-MX")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Vista previa */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista previa de la prefactura</DialogTitle>
            <DialogDescription>Así se verá el documento que recibirá el cliente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 rounded-lg border bg-card p-6 text-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-bold">Pre-Factura</p>
                <p className="text-muted-foreground">{preInvoice.pre_invoice_number}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{related.agencyName}</p>
                <p className="text-muted-foreground">{periodLabel(preInvoice.period_start)}</p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Cliente</p>
              <p className="font-medium">{related.clientName || "—"}</p>
              {targetName && <p className="text-muted-foreground">{targetName}</p>}
            </div>
            <Separator />
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2">Servicio</th>
                  <th className="pb-2 text-right">Cant.</th>
                  <th className="pb-2 text-right">Importe</th>
                </tr>
              </thead>
              <tbody>
                {includedItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">{item.description}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right">{formatCurrency(item.amount, preInvoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="ml-auto w-56 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(totals.subtotal, preInvoice.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{taxEnabled ? `IVA (${taxRate}%)` : "IVA (exento)"}</span>
                <span>{formatCurrency(totals.tax, preInvoice.currency)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(totals.total, preInvoice.currency)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enviar por correo */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar prefactura por correo</DialogTitle>
            <DialogDescription>
              Se enviará el detalle de los {includedItems.length} servicios incluidos al cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="recipient">Correo del destinatario</Label>
            <Input
              id="recipient"
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="cliente@empresa.com"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)} disabled={sending}>
              Cancelar
            </Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
