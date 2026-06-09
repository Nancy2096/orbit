"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react"
import { toast } from "sonner"

interface Agency {
  id: string
  name: string
}

interface Client {
  id: string
  company_name: string
}

interface Account {
  id: string
  name: string
  client_id: string
}

interface Currency {
  id: string
  code: string
  symbol: string
  exchange_rate: number
}

interface Service {
  id: string
  name: string
  base_price: number
}

interface Project {
  id: string
  name: string
  account_id: string
}

interface InvoiceItem {
  id: string
  service_id: string | null
  description: string
  quantity: number
  unit_price: number
  discount_percentage: number
  tax_rate: number
  subtotal: number
  tax_amount: number
  total: number
}

const cfdiUses = [
  { value: "G01", label: "G01 - Adquisición de mercancías" },
  { value: "G02", label: "G02 - Devoluciones, descuentos o bonificaciones" },
  { value: "G03", label: "G03 - Gastos en general" },
  { value: "I01", label: "I01 - Construcciones" },
  { value: "I02", label: "I02 - Mobiliario y equipo de oficina" },
  { value: "I03", label: "I03 - Equipo de transporte" },
  { value: "I04", label: "I04 - Equipo de cómputo" },
  { value: "I08", label: "I08 - Otra maquinaria y equipo" },
  { value: "P01", label: "P01 - Por definir" },
  { value: "S01", label: "S01 - Sin efectos fiscales" },
]

const paymentMethods = [
  { value: "PUE", label: "PUE - Pago en una sola exhibición" },
  { value: "PPD", label: "PPD - Pago en parcialidades o diferido" },
]

export default function EditInvoicePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  const [formData, setFormData] = useState({
    agency_id: "",
    client_id: "",
    account_id: "",
    project_id: "",
    invoice_number: "",
    invoice_type: "standard",
    issue_date: "",
    due_date: "",
    currency_id: "",
    exchange_rate: 1,
    tax_rate: 16,
    payment_terms: 30,
    cfdi_use: "G03",
    payment_method: "PUE",
    notes: "",
    internal_notes: "",
  })

  const [items, setItems] = useState<InvoiceItem[]>([])
  const [showItemDialog, setShowItemDialog] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [newItem, setNewItem] = useState<InvoiceItem>({
    id: "",
    service_id: null,
    description: "",
    quantity: 1,
    unit_price: 0,
    discount_percentage: 0,
    tax_rate: 16,
    subtotal: 0,
    tax_amount: 0,
    total: 0,
  })

  useEffect(() => {
    fetchInvoice()
    fetchAgencies()
    fetchCurrencies()
  }, [id])

  useEffect(() => {
    if (formData.agency_id) {
      fetchClients(formData.agency_id)
      fetchServices(formData.agency_id)
    }
  }, [formData.agency_id])

  useEffect(() => {
    if (formData.client_id && formData.agency_id) {
      fetchAccounts(formData.client_id, formData.agency_id)
    }
  }, [formData.client_id, formData.agency_id])

  useEffect(() => {
    if (formData.account_id) {
      fetchProjects(formData.account_id)
    }
  }, [formData.account_id])

  const fetchInvoice = async () => {
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !invoice) {
      toast.error("Error al cargar la factura")
      router.push("/dashboard/invoices")
      return
    }

    setFormData({
      agency_id: invoice.agency_id || "",
      client_id: invoice.client_id || "",
      account_id: invoice.account_id || "",
      project_id: invoice.project_id || "",
      invoice_number: invoice.invoice_number || "",
      invoice_type: invoice.invoice_type || "standard",
      issue_date: invoice.issue_date || "",
      due_date: invoice.due_date || "",
      currency_id: invoice.currency_id || "",
      exchange_rate: invoice.exchange_rate || 1,
      tax_rate: invoice.tax_rate || 16,
      payment_terms: invoice.payment_terms || 30,
      cfdi_use: invoice.cfdi_use || "G03",
      payment_method: invoice.payment_method || "PUE",
      notes: invoice.notes || "",
      internal_notes: invoice.internal_notes || "",
    })

    // Fetch invoice items
    const { data: itemsData } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id)
      .order("sort_order")

    if (itemsData) {
      setItems(itemsData.map(item => ({
        id: item.id,
        service_id: item.service_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage || 0,
        tax_rate: item.tax_rate || 16,
        subtotal: item.subtotal,
        tax_amount: item.tax_amount,
        total: item.total,
      })))
    }

    setLoading(false)
  }

  const fetchAgencies = async () => {
    const { data } = await supabase.from("agencies").select("id, name").eq("is_active", true).order("name")
    if (data) setAgencies(data)
  }

  const fetchClients = async (agencyId: string) => {
    const { data } = await supabase
      .from("clients")
      .select("id, company_name")
      .eq("agency_id", agencyId)
      .order("company_name")
    if (data) setClients(data)
  }

  const fetchAccounts = async (clientId: string, agencyId: string) => {
    const { data } = await supabase
      .from("accounts")
      .select("id, account_name, client_id")
      .eq("client_id", clientId)
      .eq("agency_id", agencyId)
      .order("account_name")
    if (data) setAccounts(data.map(a => ({ id: a.id, name: a.account_name, client_id: a.client_id })))
  }

  const fetchCurrencies = async () => {
    const { data } = await supabase.from("currencies").select("*").eq("is_active", true).order("code")
    if (data) setCurrencies(data)
  }

  const fetchServices = async (agencyId: string) => {
    const { data } = await supabase
      .from("services")
      .select("id, name, base_price")
      .eq("agency_id", agencyId)
      .eq("is_active", true)
      .order("name")
    if (data) setServices(data)
  }

  const fetchProjects = async (accountId: string) => {
    const { data } = await supabase
      .from("projects")
      .select("id, name, account_id")
      .eq("account_id", accountId)
      .order("name")
    if (data) setProjects(data)
  }

  const calculateItemTotals = (item: InvoiceItem): InvoiceItem => {
    const subtotal = item.quantity * item.unit_price * (1 - item.discount_percentage / 100)
    const taxAmount = subtotal * (item.tax_rate / 100)
    return {
      ...item,
      subtotal: Math.round(subtotal * 100) / 100,
      tax_amount: Math.round(taxAmount * 100) / 100,
      total: Math.round((subtotal + taxAmount) * 100) / 100,
    }
  }

  const handleServiceSelect = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    if (service) {
      const updatedItem = calculateItemTotals({
        ...newItem,
        service_id: serviceId,
        description: service.name,
        unit_price: Number(service.base_price),
      })
      setNewItem(updatedItem)
    }
  }

  const handleItemChange = (field: keyof InvoiceItem, value: number | string) => {
    const updatedItem = calculateItemTotals({
      ...newItem,
      [field]: value,
    })
    setNewItem(updatedItem)
  }

  const addOrUpdateItem = () => {
    if (!newItem.description || newItem.unit_price <= 0) {
      return
    }
    
    if (editingItemId) {
      setItems(items.map(item => item.id === editingItemId ? { ...newItem, id: editingItemId } : item))
    } else {
      const itemWithId = { ...newItem, id: crypto.randomUUID() }
      setItems([...items, itemWithId])
    }
    
    resetItemForm()
  }

  const editItem = (item: InvoiceItem) => {
    setNewItem(item)
    setEditingItemId(item.id)
    setShowItemDialog(true)
  }

  const resetItemForm = () => {
    setNewItem({
      id: "",
      service_id: null,
      description: "",
      quantity: 1,
      unit_price: 0,
      discount_percentage: 0,
      tax_rate: formData.tax_rate,
      subtotal: 0,
      tax_amount: 0,
      total: 0,
    })
    setEditingItemId(null)
    setShowItemDialog(false)
  }

  const removeItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId))
  }

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
    const taxAmount = items.reduce((sum, item) => sum + item.tax_amount, 0)
    const total = items.reduce((sum, item) => sum + item.total, 0)
    return { subtotal, taxAmount, total }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    if (items.length === 0) {
      toast.error("Debe agregar al menos una partida a la factura")
      setSaving(false)
      return
    }

    const totals = calculateTotals()

    // Update invoice
    const { error: invoiceError } = await supabase
      .from("invoices")
      .update({
        agency_id: formData.agency_id,
        client_id: formData.client_id || null,
        account_id: formData.account_id || null,
        project_id: formData.project_id || null,
        invoice_number: formData.invoice_number,
        invoice_type: formData.invoice_type,
        issue_date: formData.issue_date,
        due_date: formData.due_date || null,
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        tax_rate: formData.tax_rate,
        total_amount: totals.total,
        balance_due: totals.total,
        currency_id: formData.currency_id || null,
        exchange_rate: formData.exchange_rate,
        payment_terms: formData.payment_terms,
        cfdi_use: formData.cfdi_use,
        payment_method: formData.payment_method,
        notes: formData.notes || null,
        internal_notes: formData.internal_notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (invoiceError) {
      toast.error("Error al actualizar la factura: " + invoiceError.message)
      setSaving(false)
      return
    }

    // Delete existing items
    await supabase.from("invoice_items").delete().eq("invoice_id", id)

    // Insert updated items
    const itemsToInsert = items.map((item, index) => ({
      invoice_id: id,
      service_id: item.service_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percentage: item.discount_percentage,
      tax_rate: item.tax_rate,
      subtotal: item.subtotal,
      tax_amount: item.tax_amount,
      total: item.total,
      sort_order: index,
    }))

    const { error: itemsError } = await supabase.from("invoice_items").insert(itemsToInsert)

    if (itemsError) {
      toast.error("Error al actualizar las partidas: " + itemsError.message)
      setSaving(false)
      return
    }

    toast.success("Factura actualizada correctamente")
    router.push(`/dashboard/invoices/${id}`)
  }

  const formatCurrency = (amount: number) => {
    const currency = currencies.find(c => c.id === formData.currency_id)
    const symbol = currency?.symbol || "$"
    return `${symbol}${Number(amount).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const totals = calculateTotals()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/invoices/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Factura</h1>
            <p className="text-muted-foreground">{formData.invoice_number}</p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>Datos básicos de la factura</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Agencia</Label>
              <Select
                value={formData.agency_id}
                onValueChange={(value) => setFormData({ ...formData, agency_id: value, client_id: "", account_id: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar agencia" />
                </SelectTrigger>
                <SelectContent>
                  {agencies.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id}>
                      {agency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData({ ...formData, client_id: value, account_id: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cuenta</Label>
              <Select
                value={formData.account_id}
                onValueChange={(value) => setFormData({ ...formData, account_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Proyecto (Opcional)</Label>
              <Select
                value={formData.project_id || "none"}
                onValueChange={(value) => setFormData({ ...formData, project_id: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin proyecto</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Dates and Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Fechas y Condiciones</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Número de Factura</Label>
              <Input
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha de Emisión</Label>
              <Input
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha de Vencimiento</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Términos de Pago (días)</Label>
              <Input
                type="number"
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select
                value={formData.currency_id}
                onValueChange={(value) => setFormData({ ...formData, currency_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar moneda" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.id} value={currency.id}>
                      {currency.code} ({currency.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Uso de CFDI</Label>
              <Select
                value={formData.cfdi_use}
                onValueChange={(value) => setFormData({ ...formData, cfdi_use: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cfdiUses.map((cfdi) => (
                    <SelectItem key={cfdi.value} value={cfdi.value}>
                      {cfdi.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tasa de IVA (%)</Label>
              <Input
                type="number"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Partidas</CardTitle>
              <CardDescription>Conceptos de la factura</CardDescription>
            </div>
            <Button type="button" onClick={() => setShowItemDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Partida
            </Button>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay partidas agregadas. Haz clic en "Agregar Partida" para comenzar.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Precio Unitario</TableHead>
                    <TableHead className="text-right">Descuento</TableHead>
                    <TableHead className="text-right">IVA</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell className="text-right">{item.discount_percentage}%</TableCell>
                      <TableCell className="text-right">{item.tax_rate}%</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => editItem(item)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Totals */}
            {items.length > 0 && (
              <div className="mt-6 flex justify-end">
                <div className="w-72 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA:</span>
                    <span>{formatCurrency(totals.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Notas (visibles en factura)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas para el cliente..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Notas Internas</Label>
              <Textarea
                value={formData.internal_notes}
                onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                placeholder="Notas internas (no visibles en factura)..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Add/Edit Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={(open) => { if (!open) resetItemForm() }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingItemId ? "Editar Partida" : "Agregar Partida"}</DialogTitle>
            <DialogDescription>
              {editingItemId ? "Modifica los datos de la partida" : "Agrega un concepto a la factura"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Servicio (opcional)</Label>
              <Select
                value={newItem.service_id || ""}
                onValueChange={handleServiceSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar servicio" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descripción *</Label>
              <Input
                value={newItem.description}
                onChange={(e) => handleItemChange("description", e.target.value)}
                placeholder="Descripción del concepto"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) => handleItemChange("quantity", parseFloat(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label>Precio Unitario *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.unit_price}
                  onChange={(e) => handleItemChange("unit_price", parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Descuento (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={newItem.discount_percentage}
                  onChange={(e) => handleItemChange("discount_percentage", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>IVA (%)</Label>
                <Input
                  type="number"
                  value={newItem.tax_rate}
                  onChange={(e) => handleItemChange("tax_rate", parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(newItem.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA:</span>
                <span>{formatCurrency(newItem.tax_amount)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>{formatCurrency(newItem.total)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetItemForm}>
              Cancelar
            </Button>
            <Button onClick={addOrUpdateItem}>
              {editingItemId ? "Guardar Cambios" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
