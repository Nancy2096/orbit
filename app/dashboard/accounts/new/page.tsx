"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, Briefcase, DollarSign, Plus, Trash2, Package, Users } from "lucide-react"

interface Client {
  id: string
  company_name: string
}

interface Agency {
  id: string
  name: string
}

interface Currency {
  id: string
  code: string
  name: string
  symbol: string
}

interface Staff {
  id: string
  first_name: string
  last_name: string
  position: string
  agency_id: string
}

interface Service {
  id: string
  name: string
  category: string | null
  base_price: number | null
  base_price_usd: number | null
  service_type: string
  department: {
    name: string
  } | null
}

interface ContractedService {
  service_id: string
  service_name: string
  category: string | null
  quantity: number
  unit_price: number
  discount_percentage: number
  discount_amount: number
  final_price: number
  frequency: string
  notes: string
  currency_code?: string
  currency_symbol?: string
}

interface Department {
  id: string
  name: string
}

interface AccountTeamMember {
  department_id: string
  department_name: string
  manager_id: string | null
  coordinator_id: string | null
}

interface Commission {
  staff_id: string
  staff_name: string
  role: string
  commission_percentage: number
}

export default function NewAccountPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [bankAccounts, setBankAccounts] = useState<{ id: string; bank_name: string; account_name: string; account_number: string; currency_id: string }[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [teamMembers, setTeamMembers] = useState<AccountTeamMember[]>([])
  const [contractedServices, setContractedServices] = useState<ContractedService[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [selectedServiceCurrency, setSelectedServiceCurrency] = useState<"MXN" | "USD">("MXN")
  const [formData, setFormData] = useState({
    client_id: "",
    agency_id: "",
    account_code: "",
    account_name: "",
    account_manager_id: "",
    sales_advisor_id: "",
    account_type: "project",
    retainer_amount: "",
    retainer_currency_id: "",
    contract_start_date: "",
    contract_end_date: "",
payment_terms: "30",
  discount_percentage: "0",
  bank_account_id: "",
  status: "active",
  notes: "",
  })
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchData()
    }
  }, [mounted])

  useEffect(() => {
    if (formData.agency_id) {
      fetchAgencyClients(formData.agency_id)
      fetchAgencyServices(formData.agency_id)
      fetchAgencyStaff(formData.agency_id)
      fetchAgencyDepartments(formData.agency_id)
      fetchAgencyBankAccounts(formData.agency_id)
    } else {
      setClients([])
      setDepartments([])
      setTeamMembers([])
      setBankAccounts([])
    }
  }, [formData.agency_id])

  async function fetchData() {
    const [agenciesRes, currenciesRes] = await Promise.all([
      supabase.from("agencies").select("id, name").eq("is_active", true).order("name"),
      supabase.from("currencies").select("id, code, name, symbol").eq("is_active", true).order("code"),
    ])

    if (agenciesRes.data) setAgencies(agenciesRes.data)
    if (currenciesRes.data) setCurrencies(currenciesRes.data)
  }

  async function fetchAgencyClients(agencyId: string) {
    // Mostrar TODOS los clientes de la agencia (activos e inactivos) para poder
    // dar de alta cuentas/proyectos con cualquier cliente registrado.
    const { data } = await supabase
      .from("clients")
      .select("id, company_name")
      .eq("agency_id", agencyId)
      .order("company_name")
    
    if (data) setClients(data)
  }

  async function fetchAgencyServices(agencyId: string) {
    const { data } = await supabase
      .from("services")
      .select("id, name, category, base_price, base_price_usd, service_type, department:departments(name)")
      .eq("agency_id", agencyId)
      .eq("is_active", true)
      .order("name")
    
    if (data) setServices(data)
  }

  async function fetchAgencyStaff(agencyId: string) {
    // Obtener personal de la agencia específica
    const { data: agencyStaff } = await supabase
      .from("staff")
      .select("id, first_name, last_name, position, agency_id, is_global")
      .eq("agency_id", agencyId)
      .eq("is_active", true)
      .order("first_name")
    
    // Obtener personal global
    const { data: globalStaff } = await supabase
      .from("staff")
      .select("id, first_name, last_name, position, agency_id, is_global")
      .eq("is_global", true)
      .eq("is_active", true)
      .order("first_name")
    
    // Combinar y eliminar duplicados
    const allStaff = [...(agencyStaff || []), ...(globalStaff || [])]
    const uniqueStaff = allStaff.filter((staff, index, self) => 
      index === self.findIndex(s => s.id === staff.id)
    )
    
    setStaffList(uniqueStaff)
  }

async function fetchAgencyDepartments(agencyId: string) {
  const { data } = await supabase
  .from("departments")
  .select("id, name")
  .eq("agency_id", agencyId)
  .eq("is_active", true)
  .order("sort_order")
  
  if (data) setDepartments(data)
  }

  async function fetchAgencyBankAccounts(agencyId: string) {
    const { data } = await supabase
      .from("bank_accounts")
      .select("id, bank_name, account_name, account_number, currency_id")
      .eq("agency_id", agencyId)
      .eq("is_active", true)
      .order("is_primary", { ascending: false })
    
    if (data) setBankAccounts(data)
  }

  function addTeamMember(departmentId: string) {
    const department = departments.find(d => d.id === departmentId)
    if (!department) return
    if (teamMembers.some(tm => tm.department_id === departmentId)) return

    setTeamMembers([...teamMembers, {
      department_id: departmentId,
      department_name: department.name,
      manager_id: null,
      coordinator_id: null,
    }])
  }

  function updateTeamMember(departmentId: string, field: 'manager_id' | 'coordinator_id', value: string | null) {
    setTeamMembers(teamMembers.map(tm => 
      tm.department_id === departmentId ? { ...tm, [field]: value } : tm
    ))
  }

  function removeTeamMember(departmentId: string) {
    setTeamMembers(teamMembers.filter(tm => tm.department_id !== departmentId))
  }

  function getAvailableDepartments() {
    return departments.filter(d => !teamMembers.some(tm => tm.department_id === d.id))
  }

  // Commission functions
  function addCommissionMember(staffId: string) {
    if (commissions.some(c => c.staff_id === staffId)) return
    const staff = staffList.find(s => s.id === staffId)
    if (!staff) return
    
    setCommissions([...commissions, {
      staff_id: staffId,
      staff_name: `${staff.first_name} ${staff.last_name}`,
      role: "additional",
      commission_percentage: 0,
    }])
  }

  function updateCommissionPercentage(staffId: string, percentage: number) {
    setCommissions(commissions.map(c => 
      c.staff_id === staffId ? { ...c, commission_percentage: percentage } : c
    ))
  }

  function removeCommissionMember(staffId: string) {
    setCommissions(commissions.filter(c => c.staff_id !== staffId))
  }

  function getAvailableStaffForCommission() {
    return staffList.filter(s => !commissions.some(c => c.staff_id === s.id))
  }

  function getRoleLabel(role: string) {
    switch (role) {
      case "manager": return "Gerente de Cuenta"
      case "coordinator": return "Coordinador"
      case "additional": return "Adicional"
      default: return role
    }
  }

  // Auto-add commission when account manager or coordinator is selected
  function handleAccountManagerChange(staffId: string) {
    const realId = staffId === "none" ? "" : staffId
    setFormData({ ...formData, account_manager_id: realId })
    
    if (realId && !commissions.some(c => c.staff_id === realId)) {
      const staff = staffList.find(s => s.id === realId)
      if (staff) {
        setCommissions(prev => [...prev.filter(c => c.role !== "manager"), {
          staff_id: realId,
          staff_name: `${staff.first_name} ${staff.last_name}`,
          role: "manager",
          commission_percentage: 0,
        }])
      }
    }
  }

  function handleCoordinatorChange(staffId: string) {
    const realId = staffId === "none" ? "" : staffId
    setFormData({ ...formData, sales_advisor_id: realId })
    
    if (realId && !commissions.some(c => c.staff_id === realId)) {
      const staff = staffList.find(s => s.id === realId)
      if (staff) {
        setCommissions(prev => [...prev.filter(c => c.role !== "coordinator"), {
          staff_id: realId,
          staff_name: `${staff.first_name} ${staff.last_name}`,
          role: "coordinator",
          commission_percentage: 0,
        }])
      }
    }
  }

function handleServiceSelect(serviceId: string) {
    const service = services.find(s => s.id === serviceId)
    if (!service) return
    if (contractedServices.some(cs => cs.service_id === serviceId)) return

    const unitPrice = selectedServiceCurrency === "USD" 
      ? (service.base_price_usd || 0) 
      : service.base_price

    setContractedServices([...contractedServices, {
      service_id: serviceId,
      service_name: service.name,
      category: service.category,
      currency_code: selectedServiceCurrency,
      currency_symbol: "$",
      quantity: 1,
      unit_price: unitPrice,
      discount_percentage: 0,
      discount_amount: 0,
      final_price: unitPrice,
      frequency: "one_time",
      notes: "",
    }])
  }

  function handleServiceCurrencyChange(serviceId: string, currency: "MXN" | "USD") {
    const service = services.find(s => s.id === serviceId)
    if (!service) return
    
    const newUnitPrice = currency === "USD" 
      ? (service.base_price_usd || 0) 
      : service.base_price

    setContractedServices(contractedServices.map(s => {
      if (s.service_id !== serviceId) return s
      const discountAmount = (newUnitPrice * s.quantity * s.discount_percentage) / 100
      return {
        ...s,
        currency_code: currency,
        unit_price: newUnitPrice,
        discount_amount: discountAmount,
        final_price: Math.max(0, (newUnitPrice * s.quantity) - discountAmount)
      }
    }))
  }

  function updateServiceField(serviceId: string, field: keyof ContractedService, value: number | string) {
    setContractedServices(contractedServices.map(s => {
      if (s.service_id !== serviceId) return s
      const updated = { ...s, [field]: value }
      // Recalcular totales
      updated.discount_amount = (updated.unit_price * updated.quantity * updated.discount_percentage) / 100
      updated.final_price = Math.max(0, (updated.unit_price * updated.quantity) - updated.discount_amount)
      return updated
    }))
  }

  function removeContractedService(serviceId: string) {
    setContractedServices(contractedServices.filter(s => s.service_id !== serviceId))
  }

  function getAvailableServices() {
    return services.filter(s => {
      if (contractedServices.some(cs => cs.service_id === s.id)) return false
      if (selectedServiceCurrency === "USD") {
        return s.base_price_usd !== null && s.base_price_usd > 0
      }
      return s.base_price !== null && s.base_price > 0
    })
  }

  function calculateFinalPrice(quantity: number, unitPrice: number, discountPercentage: number, discountAmount: number) {
    const subtotal = quantity * unitPrice
    const percentageDiscount = subtotal * (discountPercentage / 100)
    return subtotal - percentageDiscount - discountAmount
  }

  function updateServiceCalculations(updates: Partial<ContractedService>) {
    const updated = { ...newService, ...updates }
    updated.final_price = calculateFinalPrice(
      updated.quantity,
      updated.unit_price,
      updated.discount_percentage,
      updated.discount_amount
    )
    setNewService(updated)
  }

  function addContractedService() {
    if (!newService.service_id) return
    
    // Check if service already exists
    if (contractedServices.some(s => s.service_id === newService.service_id)) {
      return
    }

    setContractedServices([...contractedServices, { ...newService }])
    setNewService({
      service_id: "",
      service_name: "",
      category: null,
      quantity: 1,
      unit_price: 0,
      discount_percentage: 0,
      discount_amount: 0,
      final_price: 0,
      frequency: "one_time",
      notes: "",
    })
    setServiceDialogOpen(false)
  }

  function removeContractedService(serviceId: string) {
    setContractedServices(contractedServices.filter(s => s.service_id !== serviceId))
  }

  function getTotalContractedAmount() {
    return contractedServices.reduce((sum, s) => sum + s.final_price, 0)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Insert account
    const { data: accountData, error: insertError } = await supabase
      .from("accounts")
      .insert({
        client_id: formData.client_id,
        agency_id: formData.agency_id,
        account_code: formData.account_code || null,
        account_name: formData.account_name,
        account_manager_id: formData.account_manager_id || null,
        sales_advisor_id: formData.sales_advisor_id || null,
        account_type: formData.account_type,
        retainer_amount: formData.retainer_amount ? parseFloat(formData.retainer_amount) : null,
        retainer_currency_id: formData.retainer_currency_id || null,
        contract_start_date: formData.contract_start_date || null,
        contract_end_date: formData.contract_end_date || null,
        payment_terms: parseInt(formData.payment_terms) || 30,
        discount_percentage: parseFloat(formData.discount_percentage) || 0,
        bank_account_id: formData.bank_account_id || null,
        status: formData.status,
        notes: formData.notes || null,
      })
      .select("id")
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Insert contracted services
    if (contractedServices.length > 0 && accountData) {
      const servicesToInsert = contractedServices.map(s => ({
        account_id: accountData.id,
        service_id: s.service_id,
        custom_name: null,
        quantity: s.quantity,
        unit_price: s.unit_price,
        discount_percentage: s.discount_percentage,
        discount_amount: s.discount_amount,
        final_price: s.final_price,
        frequency: s.frequency,
        notes: s.notes || null,
        is_active: true,
      }))

      const { error: servicesError } = await supabase
        .from("account_services")
        .insert(servicesToInsert)

      if (servicesError) {
        setError(servicesError.message)
        setLoading(false)
        return
      }
    }

    // Insert team members
    if (teamMembers.length > 0 && accountData) {
      const teamToInsert = teamMembers.map(tm => ({
        account_id: accountData.id,
        department_id: tm.department_id,
        manager_id: tm.manager_id || null,
        coordinator_id: tm.coordinator_id || null,
      }))

      await supabase.from("account_team_members").insert(teamToInsert)
    }

    // Insert commissions
    if (commissions.length > 0 && accountData) {
      const commissionsToInsert = commissions.map(c => ({
        account_id: accountData.id,
        staff_id: c.staff_id,
        role: c.role,
        commission_percentage: c.commission_percentage,
      }))
      await supabase.from("account_commissions").insert(commissionsToInsert)
    }

    router.push("/dashboard/accounts")
  }

  const frequencyLabels: Record<string, string> = {
    one_time: "Único",
    monthly: "Mensual",
    quarterly: "Trimestral",
    annual: "Anual",
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/accounts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nueva Cuenta</h1>
          <p className="text-muted-foreground">Crea una relación comercial cliente-agencia</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Información básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Información de la Cuenta
              </CardTitle>
              <CardDescription>Relación entre cliente y agencia</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="agency_id">Agencia *</FieldLabel>
                    <Select
                      value={formData.agency_id}
                      onValueChange={(value) => {
                        setFormData({ 
                          ...formData, 
                          agency_id: value,
                          client_id: "",
                          account_manager_id: "",
                          sales_advisor_id: "",
                        })
                        setContractedServices([])
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una agencia" />
                      </SelectTrigger>
                      <SelectContent>
                        {agencies.map((agency) => (
                          <SelectItem key={agency.id} value={agency.id}>
                            {agency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="client_id">Cliente *</FieldLabel>
                    <Select
                      value={formData.client_id}
                      onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                      disabled={!formData.agency_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.agency_id ? "Selecciona un cliente" : "Selecciona agencia primero"} />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <Field>
                    <FieldLabel htmlFor="account_code">Código</FieldLabel>
                    <Input
                      id="account_code"
                      value={formData.account_code}
                      onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                      placeholder="Ej: ACC-001"
                    />
                  </Field>
                  <Field className="col-span-3">
                    <FieldLabel htmlFor="account_name">Nombre de la cuenta *</FieldLabel>
                    <Input
                      id="account_name"
                      value={formData.account_name}
                      onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                      placeholder="Ej: Campaña Digital 2024"
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="account_type">Tipo de cuenta</FieldLabel>
                    <Select
                      value={formData.account_type}
                      onValueChange={(value) => setFormData({ ...formData, account_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="project">Por proyecto</SelectItem>
                        <SelectItem value="retainer">Retainer</SelectItem>
                        <SelectItem value="mixed">Mixta</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="status">Estado</FieldLabel>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Activa</SelectItem>
                        <SelectItem value="inactive">Inactiva</SelectItem>
                        <SelectItem value="on_hold">En pausa</SelectItem>
                        <SelectItem value="closed">Cerrada</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Equipo comercial */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Equipo Comercial
              </CardTitle>
              <CardDescription>Asigna el equipo responsable de la cuenta</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                {!formData.agency_id && (
                  <div className="p-4 rounded-lg bg-muted text-muted-foreground text-sm">
                    Selecciona una agencia para ver el equipo disponible
                  </div>
                )}
                {formData.agency_id && staffList.length === 0 && (
                  <div className="p-4 rounded-lg bg-amber-500/10 text-amber-700 text-sm">
                    No hay miembros del equipo registrados para esta agencia.{" "}
                    <Link href="/dashboard/hr/staff/new" className="underline">
                      Agregar miembros
                    </Link>
                  </div>
                )}
                {formData.agency_id && staffList.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="account_manager_id">Gerente de Cuenta</FieldLabel>
                      <Select
                        value={formData.account_manager_id || "none"}
                        onValueChange={handleAccountManagerChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un gerente" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin asignar</SelectItem>
                          {staffList.map((staff) => (
                            <SelectItem key={staff.id} value={staff.id}>
                              {staff.first_name} {staff.last_name} - {staff.position}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="sales_advisor_id">Coordinador</FieldLabel>
                      <Select
                        value={formData.sales_advisor_id || "none"}
                        onValueChange={handleCoordinatorChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un coordinador" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin asignar</SelectItem>
                          {staffList.map((staff) => (
                            <SelectItem key={staff.id} value={staff.id}>
                              {staff.first_name} {staff.last_name} - {staff.position}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                )}
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Cronograma */}
          <Card>
            <CardHeader>
              <CardTitle>Cronograma</CardTitle>
              <CardDescription>Vigencia y términos del contrato</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="contract_start_date">Fecha de inicio</FieldLabel>
                    <Input
                      id="contract_start_date"
                      type="date"
                      value={formData.contract_start_date}
                      onChange={(e) => setFormData({ ...formData, contract_start_date: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="contract_end_date">Fecha de fin</FieldLabel>
                    <Input
                      id="contract_end_date"
                      type="date"
                      value={formData.contract_end_date}
                      onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })}
                    />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Equipo Operativo */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Equipo Operativo
                  </CardTitle>
                  <CardDescription>Asigna un gerente y coordinador por cada área de la agencia</CardDescription>
                </div>
                {formData.agency_id && getAvailableDepartments().length > 0 && (
                  <Select onValueChange={addTeamMember}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Agregar área" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableDepartments().map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!formData.agency_id ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Selecciona una agencia primero</p>
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay áreas asignadas</p>
                  <p className="text-sm">Selecciona un área para asignar el equipo operativo</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teamMembers.map((tm) => (
                    <div key={tm.department_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">{tm.department_name}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTeamMember(tm.department_id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel>Gerente</FieldLabel>
                          <Select
                            value={tm.manager_id || "none"}
                            onValueChange={(value) => updateTeamMember(tm.department_id, 'manager_id', value === "none" ? null : value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar gerente" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin asignar</SelectItem>
                              {staffList.map((staff) => (
                                <SelectItem key={staff.id} value={staff.id}>
                                  {staff.first_name} {staff.last_name} {staff.position ? `(${staff.position})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field>
                          <FieldLabel>Coordinador</FieldLabel>
                          <Select
                            value={tm.coordinator_id || "none"}
                            onValueChange={(value) => updateTeamMember(tm.department_id, 'coordinator_id', value === "none" ? null : value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar coordinador" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin asignar</SelectItem>
                              {staffList.map((staff) => (
                                <SelectItem key={staff.id} value={staff.id}>
                                  {staff.first_name} {staff.last_name} {staff.position ? `(${staff.position})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

{/* Servicios contratados */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Servicios Contratados
                  </CardTitle>
                  <CardDescription>Servicios incluidos en esta cuenta</CardDescription>
                </div>
                {formData.agency_id && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedServiceCurrency}
                      onValueChange={(value: "MXN" | "USD") => setSelectedServiceCurrency(value)}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MXN">MXN</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                    {getAvailableServices().length > 0 && (
                      <Select onValueChange={handleServiceSelect}>
                        <SelectTrigger className="w-[300px]">
                          <SelectValue placeholder="Agregar servicio" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableServices().map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} - ${selectedServiceCurrency === "USD" 
                                ? service.base_price_usd?.toLocaleString("en-US", { minimumFractionDigits: 2 }) 
                                : service.base_price?.toLocaleString("es-MX", { minimumFractionDigits: 2 })
                              } {selectedServiceCurrency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
<CardContent>
              {!formData.agency_id ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Selecciona una agencia primero</p>
                </div>
              ) : contractedServices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay servicios contratados</p>
                  <p className="text-sm">Selecciona servicios para agregar a la cuenta</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contractedServices.map((service) => (
                    <div key={service.service_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium">{service.service_name}</h4>
                          {service.category && (
                            <p className="text-sm text-muted-foreground">{service.category}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeContractedService(service.service_id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-6 gap-3">
                        <Field>
                          <FieldLabel>Moneda</FieldLabel>
                          <Select
                            value={service.currency_code}
                            onValueChange={(value: "MXN" | "USD") => handleServiceCurrencyChange(service.service_id, value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MXN">MXN</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field>
                          <FieldLabel>Cantidad</FieldLabel>
                          <Input
                            type="number"
                            min="1"
                            value={service.quantity}
                            onChange={(e) => updateServiceField(service.service_id, "quantity", parseFloat(e.target.value) || 1)}
                          />
                        </Field>
                        <Field>
                          <FieldLabel>Precio Unit.</FieldLabel>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={service.unit_price}
                            onChange={(e) => updateServiceField(service.service_id, "unit_price", parseFloat(e.target.value) || 0)}
                          />
                        </Field>
                        <Field>
                          <FieldLabel>Desc. %</FieldLabel>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={service.discount_percentage}
                            onChange={(e) => updateServiceField(service.service_id, "discount_percentage", parseFloat(e.target.value) || 0)}
                          />
                        </Field>
                        <Field>
                          <FieldLabel>Frecuencia</FieldLabel>
                          <Select
                            value={service.frequency}
                            onValueChange={(value) => updateServiceField(service.service_id, "frequency", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="one_time">Una vez</SelectItem>
                              <SelectItem value="weekly">Semanal</SelectItem>
                              <SelectItem value="biweekly">Quincenal</SelectItem>
                              <SelectItem value="monthly">Mensual</SelectItem>
                              <SelectItem value="quarterly">Trimestral</SelectItem>
                              <SelectItem value="annual">Anual</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field>
                          <FieldLabel>Total</FieldLabel>
                          <div className="h-9 flex items-center font-medium">
                            ${service.final_price.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                          </div>
                        </Field>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end p-4 bg-muted rounded-lg">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Servicios</p>
                      <p className="text-2xl font-bold">
                        ${getTotalContractedAmount().toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información financiera */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Información Financiera
              </CardTitle>
              <CardDescription>Términos de pago y cuenta bancaria</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="payment_terms">Términos de pago (días)</FieldLabel>
                    <Select
                      value={formData.payment_terms}
                      onValueChange={(value) => setFormData({ ...formData, payment_terms: value })}
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
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="bank_account_id">Cuenta bancaria para depósitos</FieldLabel>
                    <Select
                      value={formData.bank_account_id}
                      onValueChange={(value) => setFormData({ ...formData, bank_account_id: value })}
                      disabled={!formData.agency_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.agency_id ? "Selecciona cuenta bancaria" : "Selecciona una agencia primero"} />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((bank) => (
                          <SelectItem key={bank.id} value={bank.id}>
                            {bank.bank_name} - {bank.account_name} (*{bank.account_number.slice(-4)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Comisiones */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Comisiones
                  </CardTitle>
                  <CardDescription>
                    Define los porcentajes de comisión para el equipo asignado
                  </CardDescription>
                </div>
                {getAvailableStaffForCommission().length > 0 && (
                  <Select onValueChange={addCommissionMember}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Agregar persona" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableStaffForCommission().map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.first_name} {staff.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {commissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay comisiones configuradas</p>
                  <p className="text-sm">Asigna un gerente o coordinador para agregar comisiones automáticamente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Persona</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead className="w-[150px]">Comisión (%)</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map((commission) => (
                        <TableRow key={commission.staff_id}>
                          <TableCell className="font-medium">{commission.staff_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getRoleLabel(commission.role)}</Badge>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={commission.commission_percentage}
                              onChange={(e) => updateCommissionPercentage(commission.staff_id, parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            {commission.role === "additional" && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCommissionMember(commission.staff_id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-end pt-2 border-t">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Comisiones</p>
                      <p className="text-lg font-semibold">
                        {commissions.reduce((sum, c) => sum + c.commission_percentage, 0).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notas */}
          <Card>
            <CardHeader>
              <CardTitle>Notas Adicionales</CardTitle>
            </CardHeader>
            <CardContent>
              <Field>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas adicionales sobre la cuenta..."
                  rows={4}
                />
              </Field>
            </CardContent>
          </Card>

          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/accounts">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="mr-2" />
                  Guardando...
                </>
              ) : (
                "Crear Cuenta"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
