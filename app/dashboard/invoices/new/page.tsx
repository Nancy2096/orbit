"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
import { ArrowLeft, Plus, Trash2, Calculator, Pencil, X, Check, BadgePercent } from "lucide-react"

interface Agency {
  id: string
  name: string
}

interface Client {
  id: string
  company_name: string
  legal_name: string | null
  tax_id: string | null
  tax_regime: string | null
  cfdi_use: string | null
  street: string | null
  exterior_number: string | null
  interior_number: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null
  billing_email: string | null
  payment_terms: number | null
}

interface Account {
  id: string
  name: string
  client_id: string
  sales_rep_id: string | null
  account_manager_id: string | null
}

interface CommissionInfo {
  sales_rep: {
    id: string
    name: string
    commission_percentage: number
    commission_amount: number
  } | null
  sales_manager: {
    id: string
    name: string
    commission_percentage: number
    commission_amount: number
  } | null
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
  base_price_usd: number | null
  category: string | null
}

interface Project {
  id: string
  name: string
  project_code: string | null
  account_id: string
}

interface ContractedService {
  id: string
  service_id: string
  service_name: string
  quantity: number
  unit_price: number
  currency_code: string
  frequency: string
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

export default function NewInvoicePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [contractedServices, setContractedServices] = useState<ContractedService[]>([])
  const [error, setError] = useState<string | null>(null)
  const [editingClientBilling, setEditingClientBilling] = useState(false)
  const [showAdditionalServices, setShowAdditionalServices] = useState(false)
  const [serviceCurrencyFilter, setServiceCurrencyFilter] = useState<"MXN" | "USD">("MXN")
  const [editedClientData, setEditedClientData] = useState<Partial<Client>>({})
  const [savingClient, setSavingClient] = useState(false)
  const [commissionInfo, setCommissionInfo] = useState<CommissionInfo>({ sales_rep: null, sales_manager: null })
  const [additionalCommissions, setAdditionalCommissions] = useState<Array<{
    staff_id: string
    name: string
    commission_percentage: number
    commission_amount: number
  }>>([])
  const [agencyStaff, setAgencyStaff] = useState<Array<{ id: string; first_name: string; last_name: string; commission_percentage: number }>>([])
  const [showAddCommissionMember, setShowAddCommissionMember] = useState(false)
  const [newCommissionMember, setNewCommissionMember] = useState({ staff_id: "", commission_percentage: 0 })

  const [formData, setFormData] = useState({
    agency_id: "",
    client_id: "",
    account_id: "",
    project_id: "",
    invoice_number: "",
    invoice_type: "standard",
    issue_date: new Date().toISOString().split("T")[0],
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
    fetchAgencies()
    fetchCurrencies()
  }, [])

  // Función para guardar cambios del cliente
  async function handleSaveClientBilling() {
    if (!formData.client_id || Object.keys(editedClientData).length === 0) return
    
    setSavingClient(true)
    try {
      const { error } = await supabase
        .from("clients")
        .update(editedClientData)
        .eq("id", formData.client_id)
      
      if (error) throw error
      
      // Actualizar el cliente en la lista local
      setClients(prev => prev.map(c => 
        c.id === formData.client_id 
          ? { ...c, ...editedClientData } 
          : c
      ))
      
      setEditingClientBilling(false)
      setEditedClientData({})
    } catch (err) {
      console.error("Error updating client:", err)
      setError("Error al actualizar los datos del cliente")
    } finally {
      setSavingClient(false)
    }
  }

  function handleStartEditClient() {
    const client = clients.find(c => c.id === formData.client_id)
    if (client) {
      setEditedClientData({
        legal_name: client.legal_name || "",
        tax_id: client.tax_id || "",
        tax_regime: client.tax_regime || "",
        cfdi_use: client.cfdi_use || "",
        billing_email: client.billing_email || "",
        payment_terms: client.payment_terms || 0,
        street: client.street || "",
        exterior_number: client.exterior_number || "",
        interior_number: client.interior_number || "",
        neighborhood: client.neighborhood || "",
        city: client.city || "",
        state: client.state || "",
        country: client.country || "México",
        postal_code: client.postal_code || "",
      })
      setEditingClientBilling(true)
    }
  }

  function handleCancelEditClient() {
    setEditingClientBilling(false)
    setEditedClientData({})
  }

  // Cargar clientes y servicios cuando cambia la agencia
useEffect(() => {
    if (formData.agency_id) {
      fetchClients(formData.agency_id)
      fetchProjects(formData.agency_id)
      fetchServices(formData.agency_id)
      fetchAgencyStaff(formData.agency_id)
    }
  }, [formData.agency_id])

  // Cargar cuentas cuando cambia el cliente
  useEffect(() => {
    if (formData.client_id && formData.agency_id) {
      fetchAccounts(formData.client_id, formData.agency_id)
      // Set CFDI use from client if available
      const client = clients.find(c => c.id === formData.client_id)
      if (client?.cfdi_use) {
        setFormData(prev => ({ ...prev, cfdi_use: client.cfdi_use || "G03" }))
      }
    } else {
      setAccounts([])
    }
  }, [formData.client_id])

  // Cargar proyectos y servicios contratados cuando cambia la cuenta
  useEffect(() => {
    if (formData.account_id) {
      fetchProjects(formData.account_id)
      fetchContractedServices(formData.account_id)
    } else {
      setProjects([])
      setContractedServices([])
    }
}, [formData.account_id])

  // Actualizar información de comisiones cuando cambia la cuenta o los items
  useEffect(() => {
    const total = items.reduce((sum, item) => sum + item.total, 0)
    if (formData.account_id && accounts.length > 0) {
      fetchCommissionInfo(formData.account_id, total)
    } else {
      setCommissionInfo({ sales_rep: null, sales_manager: null })
    }
    // También actualizar comisiones adicionales
    if (additionalCommissions.length > 0) {
      updateAdditionalCommissions(total)
    }
  }, [formData.account_id, items, accounts])
  
  useEffect(() => {
  // Calculate due date based on payment terms
    if (formData.issue_date && formData.payment_terms) {
      const issueDate = new Date(formData.issue_date)
      issueDate.setDate(issueDate.getDate() + formData.payment_terms)
      setFormData(prev => ({ ...prev, due_date: issueDate.toISOString().split("T")[0] }))
    }
  }, [formData.issue_date, formData.payment_terms])

  const fetchAgencies = async () => {
    const { data } = await supabase.from("agencies").select("id, name").eq("is_active", true).order("name")
    if (data) {
      setAgencies(data)
      if (data.length === 1) {
        setFormData(prev => ({ ...prev, agency_id: data[0].id }))
      }
    }
  }

  const fetchClients = async (agencyId: string) => {
    const { data } = await supabase
      .from("clients")
      .select(`
        id, company_name, legal_name, tax_id, tax_regime, cfdi_use,
        street, exterior_number, interior_number, neighborhood,
        city, state, country, postal_code, billing_email, payment_terms
      `)
      .eq("agency_id", agencyId)
      .order("company_name")
    if (data) setClients(data)
  }

const fetchAccounts = async (clientId: string, agencyId: string) => {
    if (!clientId || !agencyId) return
    
    const { data } = await supabase
      .from("accounts")
      .select("id, account_name, client_id, sales_rep_id, account_manager_id")
      .eq("client_id", clientId)
      .eq("agency_id", agencyId)
      .order("account_name")
    if (data) setAccounts(data.map(a => ({ 
      id: a.id, 
      name: a.account_name, 
      client_id: a.client_id,
      sales_rep_id: a.sales_rep_id,
      account_manager_id: a.account_manager_id
    })))
  }

  const fetchAgencyStaff = async (agencyId: string) => {
    if (!agencyId) {
      setAgencyStaff([])
      return
    }
    const { data } = await supabase
      .from("staff")
      .select("id, first_name, last_name, commission_percentage")
      .eq("agency_id", agencyId)
      .eq("is_active", true)
      .order("first_name")
    if (data) setAgencyStaff(data)
  }

  const addCommissionMember = () => {
    if (!newCommissionMember.staff_id || additionalCommissions.length >= 3) return
    
    const staff = agencyStaff.find(s => s.id === newCommissionMember.staff_id)
    if (!staff) return

    // Check if already added
    if (additionalCommissions.some(c => c.staff_id === staff.id)) {
      return
    }

    const total = items.reduce((sum, item) => sum + item.total, 0)
    const commissionPct = newCommissionMember.commission_percentage || staff.commission_percentage || 0

    setAdditionalCommissions(prev => [...prev, {
      staff_id: staff.id,
      name: `${staff.first_name} ${staff.last_name}`,
      commission_percentage: commissionPct,
      commission_amount: (total * commissionPct) / 100
    }])
    
    setNewCommissionMember({ staff_id: "", commission_percentage: 0 })
    setShowAddCommissionMember(false)
  }

  const removeCommissionMember = (staffId: string) => {
    setAdditionalCommissions(prev => prev.filter(c => c.staff_id !== staffId))
  }

  const updateAdditionalCommissions = (total: number) => {
    setAdditionalCommissions(prev => prev.map(c => ({
      ...c,
      commission_amount: (total * c.commission_percentage) / 100
    })))
  }

  const fetchCommissionInfo = async (accountId: string, invoiceTotal: number) => {
    const account = accounts.find(a => a.id === accountId)
    if (!account) {
      setCommissionInfo({ sales_rep: null, sales_manager: null })
      return
    }

    const staffIds = [account.sales_rep_id, account.account_manager_id].filter(Boolean)
    if (staffIds.length === 0) {
      setCommissionInfo({ sales_rep: null, sales_manager: null })
      return
    }

    const { data: staffData } = await supabase
      .from("staff")
      .select("id, first_name, last_name, commission_percentage")
      .in("id", staffIds)

    if (!staffData) {
      setCommissionInfo({ sales_rep: null, sales_manager: null })
      return
    }

    const salesRep = account.sales_rep_id 
      ? staffData.find(s => s.id === account.sales_rep_id) 
      : null
    const salesManager = account.account_manager_id 
      ? staffData.find(s => s.id === account.account_manager_id) 
      : null

    setCommissionInfo({
      sales_rep: salesRep ? {
        id: salesRep.id,
        name: `${salesRep.first_name} ${salesRep.last_name}`,
        commission_percentage: salesRep.commission_percentage || 0,
        commission_amount: (invoiceTotal * (salesRep.commission_percentage || 0)) / 100
      } : null,
      sales_manager: salesManager ? {
        id: salesManager.id,
        name: `${salesManager.first_name} ${salesManager.last_name}`,
        commission_percentage: salesManager.commission_percentage || 0,
        commission_amount: (invoiceTotal * (salesManager.commission_percentage || 0)) / 100
      } : null
    })
  }

  const fetchCurrencies = async () => {
    const { data } = await supabase.from("currencies").select("*").eq("is_active", true).order("code")
    if (data) {
      setCurrencies(data)
      const mxn = data.find(c => c.code === "MXN")
      if (mxn) {
        setFormData(prev => ({ ...prev, currency_id: mxn.id }))
      }
    }
  }

  const fetchProjects = async (accountId: string) => {
    if (!accountId) return
    
    const { data } = await supabase
      .from("projects")
      .select("id, name, project_code, account_id")
      .eq("account_id", accountId)
      .order("name")
    if (data) setProjects(data)
  }

  const fetchContractedServices = async (accountId: string) => {
    if (!accountId) return
    
    const { data } = await supabase
      .from("account_services")
      .select(`
        id,
        service_id,
        custom_name,
        quantity,
        unit_price,
        final_price,
        frequency,
        service:services(name)
      `)
      .eq("account_id", accountId)
      .eq("is_active", true)
    
    if (data) {
      setContractedServices(data.map(cs => ({
        id: cs.id,
        service_id: cs.service_id,
        service_name: cs.custom_name || (cs.service as { name: string })?.name || "",
        quantity: parseFloat(String(cs.quantity)) || 1,
        unit_price: parseFloat(String(cs.unit_price)) || 0,
        currency_code: "MXN",
        frequency: cs.frequency || "monthly"
      })))
    }
  }

  const fetchServices = async () => {
    const { data } = await supabase
      .from("services")
      .select("id, name, base_price, base_price_usd, category")
      .eq("agency_id", formData.agency_id)
      .eq("is_active", true)
      .order("name")
    if (data) setServices(data)
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

  const addItem = () => {
    if (!newItem.description || newItem.unit_price <= 0) {
      return
    }
    const itemWithId = { ...newItem, id: crypto.randomUUID() }
    setItems([...items, itemWithId])
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
    setShowItemDialog(false)
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
    const taxAmount = items.reduce((sum, item) => sum + item.tax_amount, 0)
    const total = items.reduce((sum, item) => sum + item.total, 0)
    return { subtotal, taxAmount, total }
  }

  const generateInvoiceNumber = async () => {
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("agency_id", formData.agency_id)
    
    const nextNumber = (count || 0) + 1
    return `FAC-${year}-${String(nextNumber).padStart(5, "0")}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (items.length === 0) {
      setError("Debe agregar al menos una partida a la factura")
      setLoading(false)
      return
    }

    const totals = calculateTotals()
    const invoiceNumber = formData.invoice_number || await generateInvoiceNumber()

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        agency_id: formData.agency_id,
        client_id: formData.client_id || null,
        account_id: formData.account_id || null,
        project_id: formData.project_id || null,
        invoice_number: invoiceNumber,
        invoice_type: formData.invoice_type,
        status: "draft",
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
      })
      .select()
      .single()

    if (invoiceError) {
      setError(invoiceError.message)
      setLoading(false)
      return
    }

    // Insert items
    const itemsToInsert = items.map((item, index) => ({
      invoice_id: invoice.id,
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
      setError(itemsError.message)
      setLoading(false)
      return
    }

    router.push(`/dashboard/invoices/${invoice.id}`)
  }

  const totals = calculateTotals()
  const invoiceCurrency = currencies.find(c => c.id === formData.currency_id)

  const formatCurrency = (amount: number) => {
    const symbol = invoiceCurrency?.symbol || "$"
    return `${symbol}${amount.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva Factura</h1>
          <p className="text-muted-foreground">Crea una nueva factura para tus clientes</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
                <CardDescription>Datos principales de la factura</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="agency_id">Agencia *</Label>
<Select
                      value={formData.agency_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, agency_id: value, client_id: "", account_id: "" }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar agencia" />
                      </SelectTrigger>
                      <SelectContent>
                        {agencies.map((agency) => (
                          <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoice_number">Número de Factura</Label>
                    <Input
                      id="invoice_number"
                      value={formData.invoice_number}
                      onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                      placeholder="Auto-generado si se deja vacío"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="client_id">Cliente *</Label>
                    <Select
                      value={formData.client_id}
                      onValueChange={(value) => {
                        const selectedClient = clients.find(c => c.id === value)
                        setFormData({ 
                          ...formData, 
                          client_id: value, 
                          account_id: "",
                          payment_terms: selectedClient?.payment_terms || formData.payment_terms
                        })
                      }}
                      disabled={!formData.agency_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.company_name} {client.tax_id && `(${client.tax_id})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Datos de Facturación del Cliente */}
                {formData.client_id && (() => {
                  const selectedClient = clients.find(c => c.id === formData.client_id)
                  if (!selectedClient) return null
                  
                  // Modo edición
                  if (editingClientBilling) {
                    return (
                      <div className="rounded-lg border bg-muted/30 p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-sm">Editar Datos de Facturación</h4>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEditClient}
                              disabled={savingClient}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleSaveClientBilling}
                              disabled={savingClient}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              {savingClient ? "Guardando..." : "Guardar"}
                            </Button>
                          </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Razón Social</Label>
                            <Input
                              value={editedClientData.legal_name || ""}
                              onChange={(e) => setEditedClientData(prev => ({ ...prev, legal_name: e.target.value }))}
                              placeholder="Razón social"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">RFC</Label>
                            <Input
                              value={editedClientData.tax_id || ""}
                              onChange={(e) => setEditedClientData(prev => ({ ...prev, tax_id: e.target.value.toUpperCase() }))}
                              placeholder="RFC"
                              maxLength={13}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Régimen Fiscal</Label>
                            <Input
                              value={editedClientData.tax_regime || ""}
                              onChange={(e) => setEditedClientData(prev => ({ ...prev, tax_regime: e.target.value }))}
                              placeholder="Ej: 601 - General de Ley"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Uso de CFDI</Label>
                            <Select
                              value={editedClientData.cfdi_use || ""}
                              onValueChange={(value) => setEditedClientData(prev => ({ ...prev, cfdi_use: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar uso" />
                              </SelectTrigger>
                              <SelectContent>
                                {cfdiUses.map((use) => (
                                  <SelectItem key={use.value} value={use.value}>{use.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Email de Facturación</Label>
                            <Input
                              type="email"
                              value={editedClientData.billing_email || ""}
                              onChange={(e) => setEditedClientData(prev => ({ ...prev, billing_email: e.target.value }))}
                              placeholder="facturacion@empresa.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Días de Crédito</Label>
                            <Input
                              type="number"
                              min="0"
                              value={editedClientData.payment_terms || 0}
                              onChange={(e) => setEditedClientData(prev => ({ ...prev, payment_terms: parseInt(e.target.value) || 0 }))}
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2 lg:col-span-3">
                            <Label className="text-xs">Domicilio Fiscal</Label>
                            <div className="grid gap-2 md:grid-cols-4">
                              <Input
                                value={editedClientData.street || ""}
                                onChange={(e) => setEditedClientData(prev => ({ ...prev, street: e.target.value }))}
                                placeholder="Calle"
                                className="md:col-span-2"
                              />
                              <Input
                                value={editedClientData.exterior_number || ""}
                                onChange={(e) => setEditedClientData(prev => ({ ...prev, exterior_number: e.target.value }))}
                                placeholder="No. Ext"
                              />
                              <Input
                                value={editedClientData.interior_number || ""}
                                onChange={(e) => setEditedClientData(prev => ({ ...prev, interior_number: e.target.value }))}
                                placeholder="No. Int"
                              />
                            </div>
                            <div className="grid gap-2 md:grid-cols-4">
                              <Input
                                value={editedClientData.neighborhood || ""}
                                onChange={(e) => setEditedClientData(prev => ({ ...prev, neighborhood: e.target.value }))}
                                placeholder="Colonia"
                              />
                              <Input
                                value={editedClientData.city || ""}
                                onChange={(e) => setEditedClientData(prev => ({ ...prev, city: e.target.value }))}
                                placeholder="Ciudad"
                              />
                              <Input
                                value={editedClientData.state || ""}
                                onChange={(e) => setEditedClientData(prev => ({ ...prev, state: e.target.value }))}
                                placeholder="Estado"
                              />
                              <Input
                                value={editedClientData.postal_code || ""}
                                onChange={(e) => setEditedClientData(prev => ({ ...prev, postal_code: e.target.value }))}
                                placeholder="C.P."
                                maxLength={5}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  
                  // Modo visualización
                  const addressParts = [
                    selectedClient.street,
                    selectedClient.exterior_number && `#${selectedClient.exterior_number}`,
                    selectedClient.interior_number && `Int. ${selectedClient.interior_number}`,
                  ].filter(Boolean).join(" ")
                  
                  const locationParts = [
                    selectedClient.neighborhood,
                    selectedClient.city,
                    selectedClient.state,
                    selectedClient.postal_code && `C.P. ${selectedClient.postal_code}`,
                  ].filter(Boolean).join(", ")
                  
                  return (
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm">Datos de Facturación</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleStartEditClient}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Razón Social</p>
                          <p className="font-medium">{selectedClient.legal_name || selectedClient.company_name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">RFC</p>
                          <p className="font-medium">{selectedClient.tax_id || "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Régimen Fiscal</p>
                          <p className="font-medium">{selectedClient.tax_regime || "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Uso de CFDI</p>
                          <p className="font-medium">{selectedClient.cfdi_use || "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Email de Facturación</p>
                          <p className="font-medium">{selectedClient.billing_email || "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Días de Crédito</p>
                          <p className="font-medium">{selectedClient.payment_terms ? `${selectedClient.payment_terms} días` : "Contado"}</p>
                        </div>
                        {(addressParts || locationParts) && (
                          <div className="md:col-span-2 lg:col-span-3">
                            <p className="text-muted-foreground text-xs">Domicilio Fiscal</p>
                            <p className="font-medium">
                              {addressParts && <span>{addressParts}</span>}
                              {addressParts && locationParts && <br />}
                              {locationParts && <span>{locationParts}</span>}
                              {selectedClient.country && selectedClient.country !== "México" && (
                                <span>, {selectedClient.country}</span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="issue_date">Fecha de Emisión *</Label>
                    <Input
                      id="issue_date"
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_terms">Días de Crédito</Label>
                    <Select
                      value={String(formData.payment_terms)}
                      onValueChange={(value) => setFormData({ ...formData, payment_terms: Number(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Contado</SelectItem>
                        <SelectItem value="15">15 días</SelectItem>
                        <SelectItem value="30">30 días</SelectItem>
                        <SelectItem value="45">45 días</SelectItem>
                        <SelectItem value="60">60 días</SelectItem>
                        <SelectItem value="90">90 días</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Fecha de Vencimiento</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle>Partidas</CardTitle>
                <CardDescription>Servicios y conceptos a facturar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Selectores de Cuenta y Proyecto */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="account_id">Cuenta *</Label>
                    <Select
                      value={formData.account_id}
                      onValueChange={(value) => setFormData({ ...formData, account_id: value, project_id: "" })}
                      disabled={!formData.client_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cuenta" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!formData.client_id && (
                      <p className="text-xs text-muted-foreground">Selecciona un cliente primero</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project_id">Proyecto</Label>
                    <Select
                      value={formData.project_id || ""}
                      onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                      disabled={!formData.account_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar proyecto (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.project_code && `[${project.project_code}] `}{project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Servicios Contratados */}
                {formData.account_id && contractedServices.length > 0 && (
                  <div className="rounded-lg border p-4">
                    <h4 className="font-medium mb-3 text-sm">Servicios Contratados</h4>
                    <p className="text-xs text-muted-foreground mb-3">Selecciona los servicios contratados que deseas facturar</p>
                    <div className="space-y-2">
                      {contractedServices.map((cs) => {
                        const isAdded = items.some(item => item.service_id === cs.service_id)
                        return (
                          <div key={cs.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{cs.service_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {cs.quantity} x ${cs.unit_price.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {cs.currency_code}
                                {cs.frequency !== "one_time" && ` (${cs.frequency === "monthly" ? "Mensual" : cs.frequency})`}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant={isAdded ? "secondary" : "outline"}
                              size="sm"
                              disabled={isAdded}
                              onClick={() => {
                                const newItemFromContract = calculateItemTotals({
                                  id: crypto.randomUUID(),
                                  service_id: cs.service_id,
                                  description: cs.service_name,
                                  quantity: cs.quantity,
                                  unit_price: cs.unit_price,
                                  discount_percentage: 0,
                                  tax_rate: 16,
                                  subtotal: 0,
                                  tax_amount: 0,
                                  total: 0,
                                })
                                setItems(prev => [...prev, newItemFromContract])
                              }}
                            >
                              {isAdded ? "Agregado" : "Agregar"}
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Botón Agregar Otro Servicio */}
                <div className="flex items-center gap-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowAdditionalServices(!showAdditionalServices)}
                    disabled={!formData.agency_id}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Otro Servicio
                  </Button>
                  <Button type="button" onClick={() => setShowItemDialog(true)} disabled={!formData.agency_id}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Partida Manual
                  </Button>
                </div>

                {/* Lista de Servicios Adicionales */}
                {showAdditionalServices && (
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-sm">Catálogo de Servicios</h4>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Moneda:</Label>
                        <Select
                          value={serviceCurrencyFilter}
                          onValueChange={(value: "MXN" | "USD") => setServiceCurrencyFilter(value)}
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MXN">MXN</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {services
                        .filter(s => serviceCurrencyFilter === "USD" ? (s.base_price_usd && s.base_price_usd > 0) : s.base_price > 0)
                        .map((service) => {
                          const price = serviceCurrencyFilter === "USD" ? service.base_price_usd : service.base_price
                          const isAdded = items.some(item => item.service_id === service.id)
                          return (
                            <div key={service.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{service.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {service.category && `${service.category} • `}
                                  ${price?.toLocaleString(serviceCurrencyFilter === "USD" ? "en-US" : "es-MX", { minimumFractionDigits: 2 })} {serviceCurrencyFilter}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant={isAdded ? "secondary" : "outline"}
                                size="sm"
                                disabled={isAdded}
                                onClick={() => {
                                  const newServiceItem = calculateItemTotals({
                                    id: crypto.randomUUID(),
                                    service_id: service.id,
                                    description: service.name,
                                    quantity: 1,
                                    unit_price: price || 0,
                                    discount_percentage: 0,
                                    tax_rate: 16,
                                    subtotal: 0,
                                    tax_amount: 0,
                                    total: 0,
                                  })
                                  setItems(prev => [...prev, newServiceItem])
                                }}
                              >
                                {isAdded ? "Agregado" : "Agregar"}
                              </Button>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* Tabla de Items */}
                {items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay partidas agregadas</p>
                    <p className="text-sm">Selecciona servicios contratados o agrega servicios adicionales</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Descripción</TableHead>
                        <TableHead className="text-right">Cant.</TableHead>
                        <TableHead className="text-right">P. Unit.</TableHead>
                        <TableHead className="text-right">Desc.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="text-right">IVA</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell className="text-right">{item.discount_percentage}%</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.tax_amount)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas para el Cliente</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notas que aparecerán en la factura..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="internal_notes">Notas Internas</Label>
                  <Textarea
                    id="internal_notes"
                    value={formData.internal_notes || ""}
                    onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                    placeholder="Notas internas (no visibles en la factura)..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Fiscal Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información Fiscal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cfdi_use">Uso de CFDI</Label>
                  <Select
                    value={formData.cfdi_use}
                    onValueChange={(value) => setFormData({ ...formData, cfdi_use: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cfdiUses.map((use) => (
                        <SelectItem key={use.value} value={use.value}>{use.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Método de Pago</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_rate">Tasa de IVA (%)</Label>
                  <Select
                    value={String(formData.tax_rate)}
                    onValueChange={(value) => setFormData({ ...formData, tax_rate: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="8">8%</SelectItem>
                      <SelectItem value="16">16%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Currency */}
            <Card>
              <CardHeader>
                <CardTitle>Moneda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency_id">Moneda</Label>
                  <Select
                    value={formData.currency_id}
                    onValueChange={(value) => {
                      const currency = currencies.find(c => c.id === value)
                      setFormData({ ...formData, currency_id: value, exchange_rate: currency?.exchange_rate || 1 })
                    }}
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
                {invoiceCurrency && invoiceCurrency.code !== "MXN" && (
                  <div className="space-y-2">
                    <Label htmlFor="exchange_rate">Tipo de Cambio</Label>
                    <Input
                      id="exchange_rate"
                      type="number"
                      step="0.0001"
                      value={formData.exchange_rate}
                      onChange={(e) => setFormData({ ...formData, exchange_rate: Number(e.target.value) })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Totals */}
            <Card>
              <CardHeader>
                <CardTitle>Totales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA ({formData.tax_rate}%)</span>
                  <span>{formatCurrency(totals.taxAmount)}</span>
                </div>
<div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold">{formatCurrency(totals.total)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Comisiones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BadgePercent className="h-5 w-5" />
                    Comisiones
                  </CardTitle>
                  <CardDescription>
                    Comisiones calculadas basadas en el personal asignado a la cuenta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
{!commissionInfo.sales_rep && !commissionInfo.sales_manager && additionalCommissions.length === 0 ? (
                  <div className="space-y-4">
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">No hay asesores o gerentes asignados a esta cuenta.</p>
                      <p className="text-xs mt-1">Puedes agregar personas para comisionar o crear la factura sin comisiones.</p>
                    </div>
                    
                    {/* Agregar Comisión Manual cuando no hay comisiones automáticas */}
                    {additionalCommissions.length < 3 && formData.agency_id && (
                      <>
                        {showAddCommissionMember ? (
                          <div className="p-4 border rounded-lg border-dashed space-y-3">
                            <div className="space-y-2">
                              <Label className="text-sm">Seleccionar Persona</Label>
                              <Select
                                value={newCommissionMember.staff_id}
                                onValueChange={(value) => {
                                  const staff = agencyStaff.find(s => s.id === value)
                                  setNewCommissionMember({
                                    staff_id: value,
                                    commission_percentage: staff?.commission_percentage || 0
                                  })
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar persona del equipo" />
                                </SelectTrigger>
                                <SelectContent>
                                  {agencyStaff
                                    .filter(s => !additionalCommissions.some(c => c.staff_id === s.id))
                                    .map((staff) => (
                                      <SelectItem key={staff.id} value={staff.id}>
                                        {staff.first_name} {staff.last_name} {staff.commission_percentage ? `(${staff.commission_percentage}%)` : ""}
                                      </SelectItem>
                                    ))
                                  }
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">Porcentaje de Comisión</Label>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                step={0.5}
                                value={newCommissionMember.commission_percentage}
                                onChange={(e) => setNewCommissionMember(prev => ({
                                  ...prev,
                                  commission_percentage: parseFloat(e.target.value) || 0
                                }))}
                                placeholder="Ej: 5"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={addCommissionMember} disabled={!newCommissionMember.staff_id}>
                                Agregar
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                setShowAddCommissionMember(false)
                                setNewCommissionMember({ staff_id: "", commission_percentage: 0 })
                              }}>
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full border-dashed"
                            onClick={() => setShowAddCommissionMember(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Persona a Comisionar
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                    <div className="space-y-4">
                      {/* Asesor de Ventas */}
                      {commissionInfo.sales_rep && (
                        <div className="p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">Asesor de Ventas</p>
                              <p className="font-medium">{commissionInfo.sales_rep.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">{commissionInfo.sales_rep.commission_percentage}%</p>
                              <p className="font-semibold text-blue-600 dark:text-blue-400">
                                {formatCurrency(commissionInfo.sales_rep.commission_amount)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Gerente de Ventas */}
                      {commissionInfo.sales_manager && (
                        <div className="p-4 border rounded-lg bg-green-50/50 dark:bg-green-950/20">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">Gerente de Ventas</p>
                              <p className="font-medium">{commissionInfo.sales_manager.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">{commissionInfo.sales_manager.commission_percentage}%</p>
                              <p className="font-semibold text-green-600 dark:text-green-400">
                                {formatCurrency(commissionInfo.sales_manager.commission_amount)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

{/* Comisiones Adicionales */}
                      {additionalCommissions.map((commission) => (
                        <div key={commission.staff_id} className="p-4 border rounded-lg bg-purple-50/50 dark:bg-purple-950/20">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">Comisión Adicional</p>
                              <p className="font-medium">{commission.name}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">{commission.commission_percentage}%</p>
                                <p className="font-semibold text-purple-600 dark:text-purple-400">
                                  {formatCurrency(commission.commission_amount)}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => removeCommissionMember(commission.staff_id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Agregar Miembro de Comisión */}
                      {additionalCommissions.length < 3 && (
                        <>
                          {showAddCommissionMember ? (
                            <div className="p-4 border rounded-lg border-dashed space-y-3">
                              <div className="space-y-2">
                                <Label className="text-sm">Seleccionar Persona</Label>
                                <Select
                                  value={newCommissionMember.staff_id}
                                  onValueChange={(value) => {
                                    const staff = agencyStaff.find(s => s.id === value)
                                    setNewCommissionMember({
                                      staff_id: value,
                                      commission_percentage: staff?.commission_percentage || 0
                                    })
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar persona del equipo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {agencyStaff
                                      .filter(s => 
                                        s.id !== commissionInfo.sales_rep?.id && 
                                        s.id !== commissionInfo.sales_manager?.id &&
                                        !additionalCommissions.some(c => c.staff_id === s.id)
                                      )
                                      .map((staff) => (
                                        <SelectItem key={staff.id} value={staff.id}>
                                          {staff.first_name} {staff.last_name} {staff.commission_percentage ? `(${staff.commission_percentage}%)` : ""}
                                        </SelectItem>
                                      ))
                                    }
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm">Porcentaje de Comisión</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  step={0.5}
                                  value={newCommissionMember.commission_percentage}
                                  onChange={(e) => setNewCommissionMember(prev => ({
                                    ...prev,
                                    commission_percentage: parseFloat(e.target.value) || 0
                                  }))}
                                  placeholder="Ej: 5"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={addCommissionMember} disabled={!newCommissionMember.staff_id}>
                                  Agregar
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => {
                                  setShowAddCommissionMember(false)
                                  setNewCommissionMember({ staff_id: "", commission_percentage: 0 })
                                }}>
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              className="w-full border-dashed"
                              onClick={() => setShowAddCommissionMember(true)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar Persona a Comisionar ({3 - additionalCommissions.length} restantes)
                            </Button>
                          )}
                        </>
                      )}

                      {/* Total Comisiones */}
                      {(commissionInfo.sales_rep || commissionInfo.sales_manager || additionalCommissions.length > 0) && (
                        <div className="border-t pt-3 flex justify-between">
                          <span className="text-muted-foreground">Total Comisiones</span>
                          <span className="font-semibold">
                            {formatCurrency(
                              (commissionInfo.sales_rep?.commission_amount || 0) +
                              (commissionInfo.sales_manager?.commission_amount || 0) +
                              additionalCommissions.reduce((sum, c) => sum + c.commission_amount, 0)
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={loading || !formData.agency_id || !formData.client_id || items.length === 0}>
                {loading && <Spinner className="mr-2 h-4 w-4" />}
                Crear Factura
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/invoices">Cancelar</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Add Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar Partida</DialogTitle>
            <DialogDescription>Agrega un servicio o concepto a la factura</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Servicio (opcional)</Label>
              <Select onValueChange={handleServiceSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar servicio..." />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - {formatCurrency(Number(service.base_price))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item_description">Descripción *</Label>
              <Textarea
                id="item_description"
                value={newItem.description}
                onChange={(e) => handleItemChange("description", e.target.value)}
                placeholder="Descripción del servicio o concepto..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item_quantity">Cantidad</Label>
                <Input
                  id="item_quantity"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newItem.quantity}
                  onChange={(e) => handleItemChange("quantity", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item_unit_price">Precio Unitario</Label>
                <Input
                  id="item_unit_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newItem.unit_price}
                  onChange={(e) => handleItemChange("unit_price", Number(e.target.value))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item_discount">Descuento (%)</Label>
                <Input
                  id="item_discount"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={newItem.discount_percentage}
                  onChange={(e) => handleItemChange("discount_percentage", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item_tax">IVA (%)</Label>
                <Input
                  id="item_tax"
                  type="number"
                  step="1"
                  min="0"
                  value={newItem.tax_rate}
                  onChange={(e) => handleItemChange("tax_rate", Number(e.target.value))}
                />
              </div>
            </div>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(newItem.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>IVA:</span>
                <span>{formatCurrency(newItem.tax_amount)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>{formatCurrency(newItem.total)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemDialog(false)}>Cancelar</Button>
            <Button onClick={addItem} disabled={!newItem.description || newItem.unit_price <= 0}>
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
