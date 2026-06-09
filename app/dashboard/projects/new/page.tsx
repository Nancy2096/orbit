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
import { Checkbox } from "@/components/ui/checkbox"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, FolderKanban, DollarSign, Calendar, Users, Briefcase, Package, Trash2 } from "lucide-react"

interface Agency {
  id: string
  name: string
}

interface Client {
  id: string
  company_name: string
  agency_id: string
}

interface Account {
  id: string
  account_name: string
  client_id: string
  agency_id: string
  client: {
    company_name: string
  } | null
  agency: {
    name: string
  } | null
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
}

interface Department {
  id: string
  name: string
}

interface Service {
  id: string
  name: string
  category: string | null
  base_price: number
  base_price_usd: number
}

interface ContractedService {
  service_id: string
  service_name: string
  category: string | null
  currency: "MXN" | "USD"
  quantity: number
  unit_price: number
  discount_percentage: number
  discount_amount: number
  final_price: number
  frequency: string
  notes: string
}

interface ProjectTeamMember {
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

export default function NewProjectPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [bankAccounts, setBankAccounts] = useState<{ id: string; bank_name: string; account_name: string; account_number: string; currency_id: string }[]>([])
  const [contractedServices, setContractedServices] = useState<ContractedService[]>([])
  const [teamMembers, setTeamMembers] = useState<ProjectTeamMember[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [currentAgencyId, setCurrentAgencyId] = useState<string | null>(null)
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>("")
  const [selectedServiceCurrency, setSelectedServiceCurrency] = useState<"MXN" | "USD">("MXN")
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [formData, setFormData] = useState({
    account_id: "",
    project_code: "",
    name: "",
    description: "",
    project_type: "standard",
    status: "draft",
    priority: "medium",
    start_date: "",
    end_date: "",
    budget_currency_id: "",
    payment_terms: "30",
    bank_account_id: "",
    estimated_hours: "",
    commercial_manager_id: "",
    sales_advisor_id: "",
    is_billable: true,
    billing_type: "fixed",
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

  async function fetchData() {
    const [agenciesRes, clientsRes, accountsRes, currenciesRes, staffRes] = await Promise.all([
      supabase.from("agencies").select("id, name").eq("is_active", true).order("name"),
      supabase.from("clients").select("id, company_name, agency_id").order("company_name"),
      supabase.from("accounts").select(`
        id,
        account_name,
        client_id,
        agency_id,
        client:clients(company_name),
        agency:agencies(name)
      `).eq("status", "active").order("account_name"),
      supabase.from("currencies").select("id, code, name, symbol").eq("is_active", true).order("code"),
      supabase.from("staff").select("id, first_name, last_name, position").eq("is_active", true).order("first_name"),
    ])

    if (agenciesRes.data) setAgencies(agenciesRes.data)
    if (clientsRes.data) setClients(clientsRes.data)
    if (accountsRes.data) setAccounts(accountsRes.data as Account[])
    if (currenciesRes.data) setCurrencies(currenciesRes.data)
    if (staffRes.data) setStaffList(staffRes.data)
  }

  // Agency/Client selection handlers
  function handleAgencyChange(agencyId: string) {
    setSelectedAgencyId(agencyId)
    setSelectedClientId("")
    setFormData({ ...formData, account_id: "" })
    setFilteredClients(clients.filter(c => c.agency_id === agencyId))
    setFilteredAccounts([])
    setCurrentAgencyId(agencyId)
    
// Load departments and services for the selected agency
  if (agencyId) {
  loadAgencyDepartmentsAndServices(agencyId)
  loadAgencyBankAccounts(agencyId)
  } else {
  setDepartments([])
  setServices([])
  setBankAccounts([])
  }
    setContractedServices([])
    setTeamMembers([])
  }

  function handleClientChange(clientId: string) {
    setSelectedClientId(clientId)
    setFormData({ ...formData, account_id: "" })
    setFilteredAccounts(accounts.filter(a => a.client_id === clientId))
  }

  function handleAccountChange(accountId: string) {
    setFormData({ ...formData, account_id: accountId })
  }

  async function loadAgencyDepartmentsAndServices(agencyId: string) {
    const [deptRes, servRes] = await Promise.all([
      supabase
        .from("departments")
        .select("id, name")
        .eq("agency_id", agencyId)
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("services")
        .select("id, name, category, base_price, base_price_usd")
        .eq("agency_id", agencyId)
        .eq("is_active", true)
        .order("name"),
    ])

if (deptRes.data) setDepartments(deptRes.data)
  if (servRes.data) setServices(servRes.data)
  }

  async function loadAgencyBankAccounts(agencyId: string) {
    const { data } = await supabase
      .from("bank_accounts")
      .select("id, bank_name, account_name, account_number, currency_id")
      .eq("agency_id", agencyId)
      .eq("is_active", true)
      .order("is_primary", { ascending: false })
    
    if (data) setBankAccounts(data)
  }
  
  // Service functions
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
      currency: selectedServiceCurrency,
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

    setContractedServices(contractedServices.map(cs => {
      if (cs.service_id !== serviceId) return cs
      const newUnitPrice = currency === "MXN" ? service.base_price : (service.base_price_usd || 0)
      const subtotal = cs.quantity * newUnitPrice
      const discountAmount = subtotal * (cs.discount_percentage / 100)
      return {
        ...cs,
        currency,
        unit_price: newUnitPrice,
        discount_amount: discountAmount,
        final_price: subtotal - discountAmount,
      }
    }))
  }

  function updateServiceField(serviceId: string, field: keyof ContractedService, value: any) {
    setContractedServices(contractedServices.map(s => {
      if (s.service_id !== serviceId) return s
      const updated = { ...s, [field]: value }
      if (field === "quantity" || field === "unit_price" || field === "discount_percentage") {
        const subtotal = updated.quantity * updated.unit_price
        updated.discount_amount = subtotal * (updated.discount_percentage / 100)
        updated.final_price = subtotal - updated.discount_amount
      }
      return updated
    }))
  }

  function removeService(serviceId: string) {
    setContractedServices(contractedServices.filter(s => s.service_id !== serviceId))
  }

  function getTotalContractedAmount() {
    const totalMXN = contractedServices
      .filter(s => s.currency === "MXN")
      .reduce((sum, s) => sum + s.final_price, 0)
    const totalUSD = contractedServices
      .filter(s => s.currency === "USD")
      .reduce((sum, s) => sum + s.final_price, 0)
    return { totalMXN, totalUSD }
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

  function getProjectRoleLabel(role: string) {
    switch (role) {
      case "commercial_manager": return "Gerente Comercial"
      case "sales_advisor": return "Asesor de Ventas"
      case "additional": return "Adicional"
      default: return role
    }
  }

  // Auto-add commission when commercial manager or sales advisor is selected
  function handleCommercialManagerChange(staffId: string) {
    const realId = staffId === "none" ? "" : staffId
    setFormData({ ...formData, commercial_manager_id: realId })
    
    if (realId && !commissions.some(c => c.staff_id === realId)) {
      const staff = staffList.find(s => s.id === realId)
      if (staff) {
        setCommissions(prev => [...prev.filter(c => c.role !== "commercial_manager"), {
          staff_id: realId,
          staff_name: `${staff.first_name} ${staff.last_name}`,
          role: "commercial_manager",
          commission_percentage: 0,
        }])
      }
    }
  }

  function handleSalesAdvisorChange(staffId: string) {
    const realId = staffId === "none" ? "" : staffId
    setFormData({ ...formData, sales_advisor_id: realId })
    
    if (realId && !commissions.some(c => c.staff_id === realId)) {
      const staff = staffList.find(s => s.id === realId)
      if (staff) {
        setCommissions(prev => [...prev.filter(c => c.role !== "sales_advisor"), {
          staff_id: realId,
          staff_name: `${staff.first_name} ${staff.last_name}`,
          role: "sales_advisor",
          commission_percentage: 0,
        }])
      }
    }
  }

  // Team functions
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

  function getAvailableServices() {
    return services.filter(s => {
      // Filtrar servicios que ya están contratados
      if (contractedServices.some(cs => cs.service_id === s.id)) return false
      // Mostrar solo servicios que tengan precio en la moneda seleccionada
      if (selectedServiceCurrency === "USD") {
        return s.base_price_usd !== null && s.base_price_usd > 0
      }
      return s.base_price !== null && s.base_price > 0
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data: projectData, error: insertError } = await supabase.from("projects").insert({
      account_id: formData.account_id || null,
      project_code: formData.project_code || null,
      name: formData.name,
      description: formData.description || null,
      project_type: formData.project_type,
      status: formData.status,
      priority: formData.priority,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      budget_currency_id: formData.budget_currency_id || null,
      payment_terms: formData.payment_terms ? parseInt(formData.payment_terms) : null,
      bank_account_id: formData.bank_account_id || null,
      estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
      commercial_manager_id: formData.commercial_manager_id || null,
      sales_advisor_id: formData.sales_advisor_id || null,
      is_billable: formData.is_billable,
      billing_type: formData.billing_type,
      notes: formData.notes || null,
    }).select("id").single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Insert contracted services
    if (contractedServices.length > 0 && projectData) {
      const servicesToInsert = contractedServices.map(s => ({
        project_id: projectData.id,
        service_id: s.service_id,
        currency: s.currency,
        quantity: s.quantity,
        unit_price: s.unit_price,
        discount_percentage: s.discount_percentage,
        discount_amount: s.discount_amount,
        final_price: s.final_price,
        frequency: s.frequency,
        notes: s.notes || null,
      }))
      await supabase.from("project_services").insert(servicesToInsert)
    }

    // Insert team members
    if (teamMembers.length > 0 && projectData) {
      const teamToInsert = teamMembers.map(tm => ({
        project_id: projectData.id,
        department_id: tm.department_id,
        manager_id: tm.manager_id || null,
        coordinator_id: tm.coordinator_id || null,
      }))
      await supabase.from("project_team_members").insert(teamToInsert)
    }

    // Insert commissions
    if (commissions.length > 0 && projectData) {
      const commissionsToInsert = commissions.map(c => ({
        project_id: projectData.id,
        staff_id: c.staff_id,
        role: c.role,
        commission_percentage: c.commission_percentage,
      }))
      await supabase.from("project_commissions").insert(commissionsToInsert)
    }

    router.push("/dashboard/projects")
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nuevo Proyecto</h1>
          <p className="text-muted-foreground">Crea un nuevo proyecto para una cuenta</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Información básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                Información del Proyecto
              </CardTitle>
              <CardDescription>Datos básicos del proyecto</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid grid-cols-3 gap-4">
                  <Field>
                    <FieldLabel htmlFor="agency_id">Agencia *</FieldLabel>
                    <Select
                      value={selectedAgencyId}
                      onValueChange={handleAgencyChange}
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
                      value={selectedClientId}
                      onValueChange={handleClientChange}
                      disabled={!selectedAgencyId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedAgencyId ? "Selecciona un cliente" : "Primero selecciona agencia"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredClients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="account_id">Cuenta</FieldLabel>
                    <Select
                      value={formData.account_id || "none"}
                      onValueChange={(value) => handleAccountChange(value === "none" ? "" : value)}
                      disabled={!selectedClientId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedClientId ? "Selecciona una cuenta" : "Primero selecciona cliente"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin cuenta</SelectItem>
                        {filteredAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <Field>
                    <FieldLabel htmlFor="project_code">Código</FieldLabel>
                    <Input
                      id="project_code"
                      value={formData.project_code}
                      onChange={(e) => setFormData({ ...formData, project_code: e.target.value })}
                      placeholder="Ej: PRJ-001"
                    />
                  </Field>
                  <Field className="col-span-3">
                    <FieldLabel htmlFor="name">Nombre del proyecto *</FieldLabel>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="project_type">Tipo de proyecto</FieldLabel>
                    <Select
                      value={formData.project_type}
                      onValueChange={(value) => setFormData({ ...formData, project_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Estándar</SelectItem>
                        <SelectItem value="retainer">Retainer</SelectItem>
                        <SelectItem value="internal">Interno</SelectItem>
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
                        <SelectItem value="draft">Borrador</SelectItem>
                        <SelectItem value="quoted">Cotizado</SelectItem>
                        <SelectItem value="approved">Aprobado</SelectItem>
                        <SelectItem value="in_progress">En progreso</SelectItem>
                        <SelectItem value="on_hold">Pausado</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Equipo Comercial */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Equipo Comercial
              </CardTitle>
              <CardDescription>Asigna el equipo comercial responsable del proyecto</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Gerente Comercial</FieldLabel>
                    <Select
                      value={formData.commercial_manager_id || "none"}
                      onValueChange={handleCommercialManagerChange}
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
                    <FieldLabel>Asesor de Ventas</FieldLabel>
                    <Select
                      value={formData.sales_advisor_id || "none"}
                      onValueChange={handleSalesAdvisorChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar asesor" />
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
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Cronograma */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Cronograma
              </CardTitle>
              <CardDescription>Fechas del proyecto</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="start_date">Fecha de inicio</FieldLabel>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="end_date">Fecha de fin</FieldLabel>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="estimated_hours">Horas estimadas</FieldLabel>
                  <Input
                    id="estimated_hours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                    placeholder="0"
                  />
                </Field>
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
                  <CardDescription>Asigna un gerente y coordinador por cada área</CardDescription>
                </div>
                {selectedAgencyId && getAvailableDepartments().length > 0 && (
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
              {!selectedAgencyId ? (
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

          {/* Servicios Contratados */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Servicios Contratados
                  </CardTitle>
                  <CardDescription>Servicios incluidos en este proyecto</CardDescription>
                </div>
                {selectedAgencyId && (
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
              {!selectedAgencyId ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Selecciona una agencia primero</p>
                </div>
              ) : contractedServices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay servicios contratados</p>
                  <p className="text-sm">Selecciona servicios para agregar al proyecto</p>
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
                          onClick={() => removeService(service.service_id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-6 gap-3">
                        <Field>
                          <FieldLabel>Moneda</FieldLabel>
                          <Select
                            value={service.currency}
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
                  
                  <div className="flex justify-end pt-4 border-t">
                    <div className="text-right space-y-1">
                      <p className="text-sm text-muted-foreground">Total Contratado</p>
                      {getTotalContractedAmount().totalMXN > 0 && (
                        <p className="text-xl font-bold">
                          MXN ${getTotalContractedAmount().totalMXN.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </p>
                      )}
                      {getTotalContractedAmount().totalUSD > 0 && (
                        <p className="text-xl font-bold">
                          USD ${getTotalContractedAmount().totalUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                      )}
                      {getTotalContractedAmount().totalMXN === 0 && getTotalContractedAmount().totalUSD === 0 && (
                        <p className="text-xl font-bold">$0.00</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información Financiera */}
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
                      disabled={!selectedAgencyId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedAgencyId ? "Selecciona cuenta bancaria" : "Selecciona una agencia primero"} />
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
                    Define los porcentajes de comisión para el equipo comercial
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
                  <p className="text-sm">Asigna un gerente comercial o asesor de ventas para agregar comisiones automáticamente</p>
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
                            <Badge variant="outline">{getProjectRoleLabel(commission.role)}</Badge>
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

          {/* Notas Adicionales */}
          <Card>
            <CardHeader>
              <CardTitle>Notas Adicionales</CardTitle>
            </CardHeader>
            <CardContent>
              <Field>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas adicionales sobre el proyecto..."
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
              <Link href="/dashboard/projects">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="mr-2" />
                  Guardando...
                </>
              ) : (
                "Crear Proyecto"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
