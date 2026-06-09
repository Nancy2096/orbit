"use client"

import { useState, useEffect, use } from "react"
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
import { ArrowLeft, FolderKanban, DollarSign, Calendar, Users, Briefcase, Package, Plus, Trash2, FileText, Upload, Download, X } from "lucide-react"

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
  id?: string
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
  is_new?: boolean
  is_deleted?: boolean
}

interface ProjectTeamMember {
  id?: string
  department_id: string
  department_name: string
  manager_id: string | null
  coordinator_id: string | null
  is_new?: boolean
}

interface Commission {
  id?: string
  staff_id: string
  staff_name: string
  role: string
  commission_percentage: number
  is_new?: boolean
  is_deleted?: boolean
}

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>("")
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [bankAccounts, setBankAccounts] = useState<{ id: string; bank_name: string; account_name: string; account_number: string; currency_id: string }[]>([])
  const [contractedServices, setContractedServices] = useState<ContractedService[]>([])
  const [teamMembers, setTeamMembers] = useState<ProjectTeamMember[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [currentAgencyId, setCurrentAgencyId] = useState<string | null>(null)
  const [selectedServiceCurrency, setSelectedServiceCurrency] = useState<"MXN" | "USD">("MXN")
  const [quotation, setQuotation] = useState<{ url: string; filename: string; uploadedAt: string } | null>(null)
  const [uploadingQuotation, setUploadingQuotation] = useState(false)
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
    actual_start_date: "",
    actual_end_date: "",
    budget_amount: "",
    budget_currency_id: "",
    payment_terms: "30",
    bank_account_id: "",
    quoted_amount: "",
    final_amount: "",
    estimated_hours: "",
    actual_hours: "",
    commercial_manager_id: "",
    sales_advisor_id: "",
    progress_percentage: "",
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
  }, [mounted, id])

  async function fetchData() {
    setFetching(true)
    const [agenciesRes, clientsRes, accountsRes, currenciesRes, staffRes, projectRes] = await Promise.all([
      supabase.from("agencies").select("id, name").eq("is_active", true).order("name"),
      supabase.from("clients").select("id, company_name, agency_id").order("company_name"),
      supabase.from("accounts").select(`
        id,
        account_name,
        client_id,
        agency_id,
        client:clients(company_name),
        agency:agencies(name)
      `).order("account_name"),
      supabase.from("currencies").select("id, code, name, symbol").eq("is_active", true).order("code"),
      supabase.from("staff").select("id, first_name, last_name, position").eq("is_active", true).order("first_name"),
      supabase.from("projects").select("*").eq("id", id).single(),
    ])

    if (agenciesRes.data) setAgencies(agenciesRes.data)
    if (clientsRes.data) setClients(clientsRes.data)
    if (accountsRes.data) setAccounts(accountsRes.data as Account[])
    if (currenciesRes.data) setCurrencies(currenciesRes.data)
    if (staffRes.data) setStaffList(staffRes.data)

    if (projectRes.data) {
      const p = projectRes.data
      setFormData({
        account_id: p.account_id || "",
        project_code: p.project_code || "",
        name: p.name || "",
        description: p.description || "",
        project_type: p.project_type || "standard",
        status: p.status || "draft",
        priority: p.priority || "medium",
        start_date: p.start_date || "",
        end_date: p.end_date || "",
        actual_start_date: p.actual_start_date || "",
        actual_end_date: p.actual_end_date || "",
        budget_amount: p.budget_amount?.toString() || "",
        budget_currency_id: p.budget_currency_id || "",
        payment_terms: p.payment_terms?.toString() || "30",
        bank_account_id: p.bank_account_id || "",
        quoted_amount: p.quoted_amount?.toString() || "",
        final_amount: p.final_amount?.toString() || "",
        estimated_hours: p.estimated_hours?.toString() || "",
        actual_hours: p.actual_hours?.toString() || "",
        commercial_manager_id: p.commercial_manager_id || "",
        sales_advisor_id: p.sales_advisor_id || "",
        progress_percentage: p.progress_percentage?.toString() || "0",
        is_billable: p.is_billable ?? true,
        billing_type: p.billing_type || "fixed",
        notes: p.notes || "",
      })

      // Set agency and client from account
      if (p.account_id && accountsRes.data) {
        const account = accountsRes.data.find((a: Account) => a.id === p.account_id)
        if (account) {
          setSelectedAgencyId(account.agency_id || "")
          setSelectedClientId(account.client_id || "")
          
          // Filter clients and accounts
          if (account.agency_id && clientsRes.data) {
            setFilteredClients(clientsRes.data.filter((c: Client) => c.agency_id === account.agency_id))
          }
          if (account.client_id && accountsRes.data) {
            setFilteredAccounts(accountsRes.data.filter((a: Account) => a.client_id === account.client_id))
          }
        }
      }

      // Load quotation if exists
      if (p.quotation_url) {
        setQuotation({
          url: p.quotation_url,
          filename: p.quotation_filename || "Cotización",
          uploadedAt: p.quotation_uploaded_at || "",
        })
      }

      // Fetch agency data if account is set
      if (p.account_id) {
        const account = accountsRes.data?.find((a: Account) => a.id === p.account_id)
        if (account) {
          const { data: accountData } = await supabase
            .from("accounts")
            .select("agency_id")
            .eq("id", p.account_id)
            .single()
          
if (accountData?.agency_id) {
  setCurrentAgencyId(accountData.agency_id)
  await Promise.all([
  fetchAgencyDepartments(accountData.agency_id),
  fetchAgencyServices(accountData.agency_id),
  fetchAgencyBankAccounts(accountData.agency_id),
  fetchContractedServices(),
  fetchTeamMembers(),
  fetchCommissions(p.commercial_manager_id, p.sales_advisor_id),
  ])
          }
        }
      }
    }
    setFetching(false)
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

async function fetchAgencyServices(agencyId: string) {
  const { data } = await supabase
  .from("services")
  .select("id, name, category, base_price, base_price_usd")
  .eq("agency_id", agencyId)
  .eq("is_active", true)
  .order("name")
  
  if (data) setServices(data)
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
  
  async function fetchContractedServices() {
    const { data } = await supabase
      .from("project_services")
      .select(`
        id,
        service_id,
        quantity,
        unit_price,
        currency,
        discount_percentage,
        discount_amount,
        final_price,
        frequency,
        notes,
        services (name, category)
      `)
      .eq("project_id", id)
    
    if (data) {
      const mapped = data.map((item: any) => ({
        id: item.id,
        service_id: item.service_id,
        service_name: item.services?.name || "Servicio desconocido",
        category: item.services?.category || null,
        currency: item.currency || "MXN",
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        discount_percentage: Number(item.discount_percentage),
        discount_amount: Number(item.discount_amount),
        final_price: Number(item.final_price),
        frequency: item.frequency || "one_time",
        notes: item.notes || "",
        is_new: false,
        is_deleted: false,
      }))
      setContractedServices(mapped)
    }
  }

  async function fetchTeamMembers() {
    const { data } = await supabase
      .from("project_team_members")
      .select(`
        id,
        department_id,
        manager_id,
        coordinator_id,
        departments (name)
      `)
      .eq("project_id", id)
    
    if (data) {
      const mapped = data.map((item: any) => ({
        id: item.id,
        department_id: item.department_id,
        department_name: item.departments?.name || "Departamento desconocido",
        manager_id: item.manager_id,
        coordinator_id: item.coordinator_id,
        is_new: false,
      }))
      setTeamMembers(mapped)
    }
  }

  async function fetchCommissions(commercialManagerId: string | null, salesAdvisorId: string | null) {
    // First load existing commissions from database
    const { data: existingCommissions } = await supabase
      .from("project_commissions")
      .select(`
        id,
        staff_id,
        role,
        commission_percentage,
        staff (first_name, last_name)
      `)
      .eq("project_id", id)
    
    const commissionsMap = new Map<string, Commission>()
    
    // Add existing commissions
    if (existingCommissions) {
      existingCommissions.forEach((item: any) => {
        commissionsMap.set(item.staff_id, {
          id: item.id,
          staff_id: item.staff_id,
          staff_name: `${item.staff?.first_name || ""} ${item.staff?.last_name || ""}`.trim() || "Sin nombre",
          role: item.role,
          commission_percentage: Number(item.commission_percentage),
          is_new: false,
          is_deleted: false,
        })
      })
    }
    
    // Auto-add commercial manager if assigned and not in commissions
    if (commercialManagerId && !commissionsMap.has(commercialManagerId)) {
      const manager = staffList.find(s => s.id === commercialManagerId)
      if (manager) {
        commissionsMap.set(commercialManagerId, {
          staff_id: commercialManagerId,
          staff_name: `${manager.first_name} ${manager.last_name}`,
          role: "commercial_manager",
          commission_percentage: 0,
          is_new: true,
          is_deleted: false,
        })
      }
    }
    
    // Auto-add sales advisor if assigned and not in commissions
    if (salesAdvisorId && !commissionsMap.has(salesAdvisorId)) {
      const advisor = staffList.find(s => s.id === salesAdvisorId)
      if (advisor) {
        commissionsMap.set(salesAdvisorId, {
          staff_id: salesAdvisorId,
          staff_name: `${advisor.first_name} ${advisor.last_name}`,
          role: "sales_advisor",
          commission_percentage: 0,
          is_new: true,
          is_deleted: false,
        })
      }
    }
    
    setCommissions(Array.from(commissionsMap.values()))
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
  fetchAgencyDepartments(agencyId)
  fetchAgencyServices(agencyId)
  fetchAgencyBankAccounts(agencyId)
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

  // Quotation functions
  async function handleQuotationUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingQuotation(true)
    setError(null)

    const formDataUpload = new FormData()
    formDataUpload.append("file", file)
    formDataUpload.append("projectId", id)
    if (quotation?.url) {
      formDataUpload.append("oldUrl", quotation.url)
    }

    try {
      const res = await fetch("/api/quotations/project", {
        method: "POST",
        body: formDataUpload,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error al subir archivo")
      }

      const data = await res.json()
      setQuotation({
        url: data.url,
        filename: data.filename,
        uploadedAt: data.uploadedAt,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir archivo")
    } finally {
      setUploadingQuotation(false)
      e.target.value = ""
    }
  }

  async function handleQuotationDelete() {
    if (!quotation?.url) return

    setUploadingQuotation(true)
    setError(null)

    try {
      const res = await fetch("/api/quotations/project", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: id, url: quotation.url }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error al eliminar archivo")
      }

      setQuotation(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar archivo")
    } finally {
      setUploadingQuotation(false)
    }
  }

  // Service functions
  function handleServiceSelect(serviceId: string) {
    const service = services.find(s => s.id === serviceId)
    if (!service) return
    if (contractedServices.some(cs => cs.service_id === serviceId && !cs.is_deleted)) return

    const unitPrice = selectedServiceCurrency === "USD" 
      ? (service.base_price_usd || 0) 
      : service.base_price

    const newService: ContractedService = {
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
      is_new: true,
    }
    setContractedServices([...contractedServices, newService])
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
    setContractedServices(contractedServices.map(s =>
      s.service_id === serviceId ? { ...s, is_deleted: true } : s
    ))
  }

  function getTotalContractedAmount() {
    const activeServices = contractedServices.filter(s => !s.is_deleted)
    const totalMXN = activeServices
      .filter(s => s.currency === "MXN")
      .reduce((sum, s) => sum + s.final_price, 0)
    const totalUSD = activeServices
      .filter(s => s.currency === "USD")
      .reduce((sum, s) => sum + s.final_price, 0)
    return { totalMXN, totalUSD }
  }

  // Commission functions
  function addCommissionMember(staffId: string) {
    if (commissions.some(c => c.staff_id === staffId && !c.is_deleted)) return
    const staff = staffList.find(s => s.id === staffId)
    if (!staff) return
    
    setCommissions([...commissions, {
      staff_id: staffId,
      staff_name: `${staff.first_name} ${staff.last_name}`,
      role: "additional",
      commission_percentage: 0,
      is_new: true,
      is_deleted: false,
    }])
  }

  function updateCommissionPercentage(staffId: string, percentage: number) {
    setCommissions(commissions.map(c => 
      c.staff_id === staffId ? { ...c, commission_percentage: percentage } : c
    ))
  }

  function removeCommissionMember(staffId: string) {
    setCommissions(commissions.map(c => 
      c.staff_id === staffId ? { ...c, is_deleted: true } : c
    ))
  }

  function getAvailableStaffForCommission() {
    return staffList.filter(s => !commissions.some(c => c.staff_id === s.id && !c.is_deleted))
  }

  function getProjectRoleLabel(role: string) {
    switch (role) {
      case "commercial_manager": return "Gerente Comercial"
      case "sales_advisor": return "Asesor de Ventas"
      case "additional": return "Adicional"
      default: return role
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
      is_new: true,
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
      if (contractedServices.some(cs => cs.service_id === s.id && !cs.is_deleted)) return false
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

    const { error: updateError } = await supabase
      .from("projects")
      .update({
        account_id: formData.account_id || null,
        project_code: formData.project_code || null,
        name: formData.name,
        description: formData.description || null,
        project_type: formData.project_type,
        status: formData.status,
        priority: formData.priority,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        actual_start_date: formData.actual_start_date || null,
        actual_end_date: formData.actual_end_date || null,
        budget_amount: formData.budget_amount ? parseFloat(formData.budget_amount) : null,
        budget_currency_id: formData.budget_currency_id || null,
        payment_terms: formData.payment_terms ? parseInt(formData.payment_terms) : null,
        bank_account_id: formData.bank_account_id || null,
        quoted_amount: formData.quoted_amount ? parseFloat(formData.quoted_amount) : null,
        final_amount: formData.final_amount ? parseFloat(formData.final_amount) : null,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
        actual_hours: formData.actual_hours ? parseFloat(formData.actual_hours) : null,
        commercial_manager_id: formData.commercial_manager_id || null,
        sales_advisor_id: formData.sales_advisor_id || null,
        progress_percentage: formData.progress_percentage ? parseFloat(formData.progress_percentage) : 0,
        is_billable: formData.is_billable,
        billing_type: formData.billing_type,
        notes: formData.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    // Handle contracted services
    const deletedServices = contractedServices.filter(s => s.is_deleted && s.id)
    const newServices = contractedServices.filter(s => s.is_new && !s.is_deleted)
    const updatedServices = contractedServices.filter(s => !s.is_new && !s.is_deleted && s.id)

    // Delete removed services
    for (const service of deletedServices) {
      await supabase.from("project_services").delete().eq("id", service.id)
    }

    // Insert new services
    if (newServices.length > 0) {
      const servicesToInsert = newServices.map(s => ({
        project_id: id,
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

    // Update existing services
    for (const service of updatedServices) {
      await supabase
        .from("project_services")
        .update({
          currency: service.currency,
          quantity: service.quantity,
          unit_price: service.unit_price,
          discount_percentage: service.discount_percentage,
          discount_amount: service.discount_amount,
          final_price: service.final_price,
          frequency: service.frequency,
          notes: service.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", service.id)
    }

    // Handle team members - delete existing and insert new
    await supabase.from("project_team_members").delete().eq("project_id", id)
    
    if (teamMembers.length > 0) {
      const teamToInsert = teamMembers.map(tm => ({
        project_id: id,
        department_id: tm.department_id,
        manager_id: tm.manager_id || null,
        coordinator_id: tm.coordinator_id || null,
      }))
      await supabase.from("project_team_members").insert(teamToInsert)
    }

    // Handle commissions
    const commissionsToDelete = commissions.filter(c => c.is_deleted && c.id)
    const commissionsToInsert = commissions.filter(c => c.is_new && !c.is_deleted)
    const commissionsToUpdate = commissions.filter(c => !c.is_new && !c.is_deleted && c.id)

    // Delete removed commissions
    for (const commission of commissionsToDelete) {
      await supabase.from("project_commissions").delete().eq("id", commission.id)
    }

    // Insert new commissions
    if (commissionsToInsert.length > 0) {
      const toInsert = commissionsToInsert.map(c => ({
        project_id: id,
        staff_id: c.staff_id,
        role: c.role,
        commission_percentage: c.commission_percentage,
      }))
      await supabase.from("project_commissions").insert(toInsert)
    }

    // Update existing commissions
    for (const commission of commissionsToUpdate) {
      await supabase.from("project_commissions")
        .update({
          commission_percentage: commission.commission_percentage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", commission.id)
    }

    router.push("/dashboard/projects")
  }

  if (!mounted || fetching) {
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
          <h1 className="text-2xl font-bold text-foreground">Editar Proyecto</h1>
          <p className="text-muted-foreground">{formData.name}</p>
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

                <Field>
                  <FieldLabel htmlFor="progress_percentage">Progreso (%)</FieldLabel>
                  <Input
                    id="progress_percentage"
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={formData.progress_percentage}
                    onChange={(e) => setFormData({ ...formData, progress_percentage: e.target.value })}
                  />
                </Field>
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
                      onValueChange={(value) => setFormData({ ...formData, commercial_manager_id: value === "none" ? "" : value })}
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
                      onValueChange={(value) => setFormData({ ...formData, sales_advisor_id: value === "none" ? "" : value })}
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
              <CardDescription>Fechas planificadas y reales del proyecto</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="start_date">Fecha de inicio planificada</FieldLabel>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="end_date">Fecha de fin planificada</FieldLabel>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="actual_start_date">Fecha de inicio real</FieldLabel>
                    <Input
                      id="actual_start_date"
                      type="date"
                      value={formData.actual_start_date}
                      onChange={(e) => setFormData({ ...formData, actual_start_date: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="actual_end_date">Fecha de fin real</FieldLabel>
                    <Input
                      id="actual_end_date"
                      type="date"
                      value={formData.actual_end_date}
                      onChange={(e) => setFormData({ ...formData, actual_end_date: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                  <Field>
                    <FieldLabel htmlFor="actual_hours">Horas reales</FieldLabel>
                    <Input
                      id="actual_hours"
                      type="number"
                      step="0.5"
                      min="0"
                      value={formData.actual_hours}
                      onChange={(e) => setFormData({ ...formData, actual_hours: e.target.value })}
                      placeholder="0"
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
                  <CardDescription>Asigna un gerente y coordinador por cada área</CardDescription>
                </div>
                {getAvailableDepartments().length > 0 && (
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
              {teamMembers.length === 0 ? (
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
              </div>
            </CardHeader>
            <CardContent>
              {contractedServices.filter(s => !s.is_deleted).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay servicios contratados</p>
                  <p className="text-sm">Selecciona servicios para agregar al proyecto</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contractedServices.filter(s => !s.is_deleted).map((service) => (
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
                            value={service.currency || "MXN"}
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
                      disabled={!currentAgencyId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={currentAgencyId ? "Selecciona cuenta bancaria" : "Selecciona una agencia primero"} />
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

          {/* Cotización */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Cotización
              </CardTitle>
              <CardDescription>
                Documento de cotización para consulta (solo lectura)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quotation ? (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">{quotation.filename}</p>
                      {quotation.uploadedAt && (
                        <p className="text-sm text-muted-foreground">
                          Subido: {new Date(quotation.uploadedAt).toLocaleDateString("es-MX", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={quotation.url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Ver / Descargar
                      </a>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleQuotationDelete}
                      disabled={uploadingQuotation}
                      className="text-destructive hover:text-destructive"
                    >
                      {uploadingQuotation ? (
                        <Spinner className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                  <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-3">No hay cotización cargada</p>
                  <label htmlFor="quotation-upload">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploadingQuotation}
                      asChild
                    >
                      <span>
                        {uploadingQuotation ? (
                          <>
                            <Spinner className="h-4 w-4 mr-2" />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Subir Cotización
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                  <input
                    id="quotation-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    onChange={handleQuotationUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    PDF, Word, Excel o imágenes
                  </p>
                </div>
              )}
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
              {commissions.filter(c => !c.is_deleted).length === 0 ? (
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
                      {commissions.filter(c => !c.is_deleted).map((commission) => (
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
                        {commissions.filter(c => !c.is_deleted).reduce((sum, c) => sum + c.commission_percentage, 0).toFixed(2)}%
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
                  value={formData.notes || ""}
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
                "Guardar Cambios"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
