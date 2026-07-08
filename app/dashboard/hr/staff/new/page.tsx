"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
  import { createClient } from "@/lib/supabase/client"
  import { upload } from "@vercel/blob/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Users, AlertCircle, Camera, MapPin, Phone, CreditCard, Upload, Globe } from "lucide-react"
import { StaffAvatar } from "@/components/staff-avatar"
import { StaffDocuments } from "@/components/hr/staff-documents"
import { toast } from "sonner"

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

interface Department {
  id: string
  name: string
}

interface Position {
  id: string
  name: string
  department_id: string | null
  level: string
  default_hourly_cost: number | null
  is_billable: boolean
}

interface StaffMember {
  id: string
  first_name: string
  last_name: string
  position: string
  agency_id?: string
  agencies?: { name: string } | null
  is_global?: boolean
}

export default function NewStaffPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([])
  const [agencyStaff, setAgencyStaff] = useState<StaffMember[]>([])
  const [contractTypes, setContractTypes] = useState<any[]>([])
  const [formData, setFormData] = useState({
    agency_id: "",
    agency_ids: [] as string[],
    is_global: false,
    employee_code: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    position: "",
    position_id: "",
    department: "",
    department_id: "",
  reports_to_id: "",
  hire_date: "",
  birth_date: "",
  contract_type: "full_time",
    contract_type_id: "",
    hourly_cost: "",
    monthly_salary: "",
    currency_id: "",
    commission_percentage: "",
    commission_type: "none",
    is_billable: true,
    skills: "",
    notes: "",
    // Foto
    photo_url: "",
    // Información de contacto personal
    personal_email: "",
    personal_phone: "",
    address_street: "",
    address_colony: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    address_country: "México",
    // Contacto de emergencia
    emergency_contact_name: "",
    emergency_contact_relationship: "",
    emergency_contact_phone: "",
    emergency_contact_email: "",
    // Información de pagos
    bank_name: "",
    bank_account_number: "",
    bank_clabe: "",
    bank_account_holder: "",
    // Agencia que paga la nómina
    payroll_agency_id: "",
  })
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [pendingDocuments, setPendingDocuments] = useState<Map<string, File>>(new Map())
  const [error, setError] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [canEditBilling, setCanEditBilling] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchInitialData()
    }
  }, [mounted])

  // Fetch departments, positions and staff when agency changes or is_global changes
  useEffect(() => {
    // Si es global, cargar datos de todas las agencias
    if (formData.is_global) {
      fetchGlobalData()
    } else if (formData.agency_id) {
      fetchAgencyData(formData.agency_id)
    } else if (formData.agency_ids?.length > 0) {
      fetchAgencyData(formData.agency_ids[0])
    } else {
      setDepartments([])
      setPositions([])
      setFilteredPositions([])
      setAgencyStaff([])
    }
  }, [formData.agency_id, formData.is_global, formData.agency_ids])

  // Filter positions when department changes
  useEffect(() => {
    if (formData.department_id) {
      setFilteredPositions(positions.filter(p => 
        p.department_id === formData.department_id || p.department_id === null
      ))
    } else {
      setFilteredPositions(positions)
    }
  }, [formData.department_id, positions])

  async function fetchInitialData() {
    // Verificar el rol del usuario actual para permisos de edición de Costos y Facturación
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: currentStaff } = await supabase
        .from("staff")
        .select("position, position_id, role_id, positions(name, level), roles(name)")
        .eq("user_id", user.id)
        .single()
      
      if (currentStaff) {
        const positionName = (currentStaff.position || currentStaff.positions?.name || "").toLowerCase()
        const positionLevel = (currentStaff.positions?.level || "").toLowerCase()
        const roleName = (currentStaff.roles?.name || "").toLowerCase()
        
        // Permitir edición a: Super Admin, Dirección, RRHH, Finanzas, Gerentes RH
        const canEdit = 
          roleName === "superadmin" ||
          roleName === "direccion_general" ||
          roleName === "direccion_agencia" ||
          roleName === "rrhh" ||
          roleName === "finanzas" ||
          positionName.includes("gerente") && positionName.includes("rh") ||
          positionName.includes("gerente") && positionName.includes("recursos humanos") ||
          positionName.includes("director") ||
          positionLevel === "director" ||
          positionLevel === "c-level" ||
          positionName.includes("ceo") ||
          positionName.includes("cfo") ||
          positionName.includes("coo")
        
        setCanEditBilling(canEdit)
        setCurrentUserRole(positionName)
      } else {
        // Si no hay registro de staff para este usuario, permitir edición (probablemente es super admin)
        setCanEditBilling(true)
      }
    } else {
      // Si no hay usuario autenticado, no permitir edición
      setCanEditBilling(false)
    }

    const [agenciesRes, currenciesRes] = await Promise.all([
      supabase.from("agencies").select("id, name").eq("is_active", true).order("name"),
      supabase.from("currencies").select("id, code, name, symbol").eq("is_active", true).order("code"),
    ])

    if (agenciesRes.data) setAgencies(agenciesRes.data)
    if (currenciesRes.data) setCurrencies(currenciesRes.data)
  }

  async function fetchAgencyData(agencyId: string) {
    const [deptsRes, positionsRes, staffRes, contractTypesRes] = await Promise.all([
      supabase.from("departments").select("id, name").eq("agency_id", agencyId).eq("is_active", true).order("sort_order"),
      supabase.from("positions").select("id, name, department_id, level, default_hourly_cost, is_billable").eq("agency_id", agencyId).eq("is_active", true).order("sort_order"),
      // Incluir staff de la misma agencia Y empleados globales como posibles jefes
      supabase.from("staff").select("id, first_name, last_name, position, is_global").or(`agency_id.eq.${agencyId},is_global.eq.true`).eq("is_active", true).order("first_name"),
      supabase.from("contract_types").select("id, name, code, weekly_hours, is_billable").eq("agency_id", agencyId).eq("is_active", true).order("sort_order"),
    ])

    if (deptsRes.data) setDepartments(deptsRes.data)
    if (positionsRes.data) {
      setPositions(positionsRes.data)
      setFilteredPositions(positionsRes.data)
    }
    if (staffRes.data) setAgencyStaff(staffRes.data)
    if (contractTypesRes.data) setContractTypes(contractTypesRes.data)
  }

  // Cargar datos de todas las agencias para miembros globales
  async function fetchGlobalData() {
    const [deptsRes, positionsRes, staffRes, contractTypesRes] = await Promise.all([
      supabase.from("departments").select("id, name, agency_id, agencies(name)").eq("is_active", true).order("sort_order"),
      supabase.from("positions").select("id, name, department_id, level, default_hourly_cost, is_billable, agency_id").eq("is_active", true).order("sort_order"),
      supabase.from("staff").select("id, first_name, last_name, position, agency_id, agencies(name), is_global").eq("is_active", true).order("first_name"),
      supabase.from("contract_types").select("id, name, code, weekly_hours, is_billable, agency_id, agencies(name)").eq("is_active", true).order("sort_order"),
    ])

    // Los departamentos y puestos son iguales entre agencias, así que
    // mostramos solo uno de cada uno (deduplicado por nombre).
    const idToDeptName = new Map<string, string>((deptsRes.data || []).map((d: any) => [d.id, d.name]))

    // Departamento canónico por nombre (se conserva el primero)
    const canonicalDeptByName = new Map<string, any>()
    const uniqueDepartments: any[] = []
    for (const dept of deptsRes.data || []) {
      if (!canonicalDeptByName.has(dept.name)) {
        canonicalDeptByName.set(dept.name, dept)
        uniqueDepartments.push(dept)
      }
    }
    setDepartments(uniqueDepartments)

    if (positionsRes.data) {
      // Remapear el department_id de cada puesto al departamento canónico (por nombre)
      // para que el filtrado por departamento siga funcionando, y deduplicar puestos.
      const seenPositions = new Set<string>()
      const uniquePositions: any[] = []
      for (const pos of positionsRes.data) {
        const deptName = pos.department_id ? idToDeptName.get(pos.department_id) : null
        const canonicalDeptId = deptName ? canonicalDeptByName.get(deptName)?.id ?? pos.department_id : pos.department_id
        const remapped = { ...pos, department_id: canonicalDeptId }
        const key = `${pos.name}|${canonicalDeptId ?? "none"}`
        if (!seenPositions.has(key)) {
          seenPositions.add(key)
          uniquePositions.push(remapped)
        }
      }
      setPositions(uniquePositions)
      setFilteredPositions(uniquePositions)
    }
    if (staffRes.data) setAgencyStaff(staffRes.data)
    if (contractTypesRes.data) setContractTypes(contractTypesRes.data)
  }

  function handleAgencyChange(value: string) {
    setFormData({ 
      ...formData, 
      agency_id: value,
      department_id: "",
      department: "",
      position_id: "",
      position: "",
      reports_to_id: "",
      contract_type_id: "",
    })
  }

  function handleDepartmentChange(value: string) {
    const dept = departments.find(d => d.id === value)
    setFormData({ 
      ...formData, 
      department_id: value, 
      department: dept?.name || "",
      position_id: "",
      position: "",
    })
    // Filter positions by department
    if (value) {
      const filtered = positions.filter(p => p.department_id === value || !p.department_id)
      setFilteredPositions(filtered)
    } else {
      setFilteredPositions(positions)
    }
  }

  function handlePositionChange(value: string) {
    const pos = positions.find(p => p.id === value)
    if (pos) {
      setFormData({ 
        ...formData, 
        position_id: value, 
        position: pos.name,
        hourly_cost: pos.default_hourly_cost?.toString() || formData.hourly_cost,
        is_billable: pos.is_billable,
        // Auto-set department if position has one and no department selected
        department_id: formData.department_id || pos.department_id || "",
        department: formData.department || (pos.department_id ? departments.find(d => d.id === pos.department_id)?.name : "") || "",
      })
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData({ ...formData, photo_url: data.url })
      } else {
        setError("Error al subir la foto")
      }
    } catch {
      setError("Error al subir la foto")
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

const { data: insertedStaff, error: insertError } = await supabase.from("staff").insert({
  agency_id: formData.is_global ? null : (formData.agency_ids.length > 0 ? formData.agency_ids[0] : formData.agency_id),
  agency_ids: formData.is_global ? [] : formData.agency_ids,
  is_global: formData.is_global,
  employee_code: formData.employee_code || null,
  first_name: formData.first_name,
  last_name: formData.last_name,
  email: formData.email,
  phone: formData.phone || null,
  position: formData.position,
  position_id: formData.position_id || null,
  department: formData.department || null,
  department_id: formData.department_id || null,
  reports_to_id: formData.reports_to_id || null,
  hire_date: formData.hire_date || null,
  birth_date: formData.birth_date || null,
  contract_type: formData.contract_type,
  contract_type_id: formData.contract_type_id || null,
  hourly_cost: formData.contract_type === "commission" ? 0 : (parseFloat(formData.hourly_cost) || 0),
      monthly_salary: formData.contract_type === "commission" ? 0 : (parseFloat(formData.monthly_salary) || 0),
      currency_id: formData.currency_id || null,
      commission_percentage: (formData.contract_type === "commission" || formData.contract_type === "full_time_variable") ? (parseFloat(formData.commission_percentage) || 0) : 0,
      commission_type: (formData.contract_type === "commission" || formData.contract_type === "full_time_variable") ? formData.commission_type : "none",
  is_billable: formData.is_billable,
  skills: formData.skills ? formData.skills.split(",").map((s) => s.trim()) : [],
  notes: formData.notes || null,
  // Foto
  photo_url: formData.photo_url || null,
  // Información de contacto personal
  personal_email: formData.personal_email || null,
  personal_phone: formData.personal_phone || null,
  address_street: formData.address_street || null,
  address_colony: formData.address_colony || null,
  address_city: formData.address_city || null,
  address_state: formData.address_state || null,
  address_zip: formData.address_zip || null,
  address_country: formData.address_country || null,
  // Contacto de emergencia
  emergency_contact_name: formData.emergency_contact_name || null,
  emergency_contact_relationship: formData.emergency_contact_relationship || null,
  emergency_contact_phone: formData.emergency_contact_phone || null,
  emergency_contact_email: formData.emergency_contact_email || null,
  // Información de pagos
  bank_name: formData.bank_name || null,
  bank_account_number: formData.bank_account_number || null,
  bank_clabe: formData.bank_clabe || null,
  bank_account_holder: formData.bank_account_holder || null,
  // Agencia que paga la nómina
  payroll_agency_id: formData.payroll_agency_id || null,
  }).select().single()
  
  if (insertError) {
  setError(insertError.message)
  setLoading(false)
  return
  }
  
  // Upload pending documents if any
  if (insertedStaff && pendingDocuments.size > 0) {
    const uploadPromises: Promise<Response>[] = []
    
    for (const [documentType, file] of pendingDocuments.entries()) {
      // Subir el archivo directamente del navegador a Vercel Blob y luego
      // registrar sus metadatos (evita el límite del body serverless).
      const extension = file.name.split(".").pop() || "pdf"
      const pathname = `staff/${insertedStaff.id}/${documentType}_${Date.now()}.${extension}`

      uploadPromises.push(
        upload(pathname, file, {
          access: "private",
          handleUploadUrl: "/api/staff/documents/upload",
          contentType: file.type,
          multipart: file.size > 5 * 1024 * 1024,
        }).then((blob) =>
          fetch("/api/staff/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              staffId: insertedStaff.id,
              documentType,
              fileName: file.name,
              fileUrl: blob.url,
              fileSize: file.size,
              mimeType: file.type,
            }),
          }),
        ),
      )
    }
    
    try {
      const results = await Promise.allSettled(uploadPromises)
      const failedCount = results.filter((r) => r.status === "rejected" || !r.value.ok).length
      
      if (failedCount > 0) {
        toast.warning(`${failedCount} documento(s) no se pudieron subir. Puedes subirlos desde el perfil del empleado.`)
      } else {
        toast.success("Miembro y documentos creados correctamente")
      }
    } catch {
      toast.warning("Algunos documentos no se pudieron subir. Puedes subirlos desde el perfil del empleado.")
    }
  }
  
  router.push("/dashboard/hr/staff")
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const hasPredefinedData = departments.length > 0 || positions.length > 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/hr/staff">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nuevo Miembro</h1>
          <p className="text-muted-foreground">Agrega un nuevo miembro al equipo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Foto de perfil */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Foto de Perfil
              </CardTitle>
              <CardDescription>Sube una foto del miembro del equipo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <StaffAvatar
                  photoUrl={formData.photo_url}
                  firstName={formData.first_name || "?"}
                  lastName={formData.last_name || "?"}
                  className="h-24 w-24"
                  fallbackClassName="text-2xl"
                />
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="photo-upload"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer text-sm font-medium"
                  >
                    {uploadingPhoto ? (
                      <>
                        <Spinner className="h-4 w-4" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Cargar Foto
                      </>
                    )}
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                  {formData.photo_url && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, photo_url: "" })}
                    >
                      Quitar foto
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG o GIF. Máximo 5MB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Información Personal
              </CardTitle>
              <CardDescription>Datos básicos del miembro del equipo</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>Agencias *</FieldLabel>
                  <div className="space-y-3">
                    {/* Opción Global */}
                    <div className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/50">
                      <Checkbox
                        id="is_global"
                        checked={formData.is_global}
                        onCheckedChange={(checked) => {
                          const isGlobal = checked === true
                          setFormData({
                            ...formData,
                            is_global: isGlobal,
                            agency_ids: isGlobal ? [] : formData.agency_ids,
                          })
                          // Si es global, cargar datos de todas las agencias
                          if (isGlobal) {
                            fetchGlobalData()
                          } else if (formData.agency_ids.length > 0) {
                            // Si no es global pero tiene agencias seleccionadas, cargar datos de la primera
                            fetchAgencyData(formData.agency_ids[0])
                          }
                        }}
                      />
                      <label
                        htmlFor="is_global"
                        className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                      >
                        <Globe className="h-4 w-4 text-primary" />
                        Global (todas las agencias)
                      </label>
                    </div>
                    
                    {/* Lista de agencias */}
                    {!formData.is_global && (
                      <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                        {agencies.map((agency) => (
                          <div key={agency.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`agency-${agency.id}`}
                              checked={formData.agency_ids.includes(agency.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData({
                                    ...formData,
                                    agency_ids: [...formData.agency_ids, agency.id],
                                    agency_id: formData.agency_ids.length === 0 ? agency.id : formData.agency_id,
                                  })
                                } else {
                                  const newIds = formData.agency_ids.filter((id) => id !== agency.id)
                                  setFormData({
                                    ...formData,
                                    agency_ids: newIds,
                                    agency_id: newIds.length > 0 ? newIds[0] : "",
                                  })
                                }
                              }}
                            />
                            <label
                              htmlFor={`agency-${agency.id}`}
                              className="text-sm leading-none cursor-pointer"
                            >
                              {agency.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {!formData.is_global && formData.agency_ids.length === 0 && (
                      <p className="text-xs text-destructive">Selecciona al menos una agencia</p>
                    )}
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="first_name">Nombre *</FieldLabel>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="last_name">Apellidos *</FieldLabel>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="email">Correo electrónico *</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="employee_code">Código de empleado</FieldLabel>
                  <Input
                    id="employee_code"
                    value={formData.employee_code}
                    onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                    placeholder="Ej: EMP-001"
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Información laboral */}
          <Card>
            <CardHeader>
              <CardTitle>Información Laboral</CardTitle>
              <CardDescription>Puesto, departamento y estructura organizacional</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                {formData.agency_id && !hasPredefinedData && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      Esta agencia no tiene departamentos ni puestos predefinidos. 
                      <Link href={`/dashboard/agencies/${formData.agency_id}/edit`} className="ml-1 underline hover:no-underline">
                        Configúralos aquí
                      </Link>
                    </div>
                  </div>
                )}

<div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="department">Departamento</FieldLabel>
                    {departments.length > 0 ? (
                      <Select
                        value={formData.department_id || ""}
                        onValueChange={handleDepartmentChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un departamento" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept: any) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                              {formData.is_global && dept.agencies?.name && (
                                <span className="text-muted-foreground ml-1">({dept.agencies.name})</span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">
                        {formData.is_global 
                          ? "No hay departamentos configurados en ninguna agencia."
                          : (
                            <>
                              No hay departamentos configurados.{" "}
                              {formData.agency_id && (
                                <Link href={`/dashboard/agencies/${formData.agency_id}/edit`} className="text-primary underline hover:no-underline">
                                  Configurar
                                </Link>
                              )}
                            </>
                          )
                        }
                      </p>
                    )}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="position">Puesto *</FieldLabel>
                    {filteredPositions.length > 0 ? (
                      <Select
                        value={formData.position_id || ""}
                        onValueChange={handlePositionChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un puesto" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredPositions.map((pos: any) => (
                            <SelectItem key={pos.id} value={pos.id}>
                              {pos.name}
                              {formData.is_global && pos.agency_id && agencies.find((a: any) => a.id === pos.agency_id) && (
                                <span className="text-muted-foreground ml-1">
                                  ({agencies.find((a: any) => a.id === pos.agency_id)?.name})
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">
                        {formData.is_global 
                          ? "No hay puestos configurados en ninguna agencia."
                          : (
                            <>
                              No hay puestos configurados.{" "}
                              {formData.agency_id && (
                                <Link href={`/dashboard/agencies/${formData.agency_id}/edit`} className="text-primary underline hover:no-underline">
                                  Configurar
                                </Link>
                              )}
                            </>
                          )
                        }
                      </p>
                    )}
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="reports_to_id">Jefe Inmediato</FieldLabel>
                  <Select
                    value={formData.reports_to_id || "none"}
                    onValueChange={(value) => setFormData({ ...formData, reports_to_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el jefe inmediato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin jefe inmediato (nivel más alto)</SelectItem>
                      {agencyStaff.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.first_name} {staff.last_name} - {staff.position}
                          {staff.is_global && (
                            <span className="text-muted-foreground ml-1">(Global)</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.is_global 
                      ? "Define la jerarquía para el organigrama (miembros de todas las agencias disponibles)"
                      : "Define la jerarquía para el organigrama de la agencia"
                    }
                  </p>
                </Field>

<div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="contract_type">Tipo de Contrato</FieldLabel>
                    {contractTypes.length > 0 ? (
                      <Select
                        value={formData.contract_type_id || ""}
                        onValueChange={(value) => {
                          const ct = contractTypes.find(c => c.id === value)
                          setFormData({ 
                            ...formData, 
                            contract_type_id: value,
                            contract_type: ct?.code || "",
                            is_billable: ct?.is_billable ?? formData.is_billable,
                          })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tipo de contrato" />
                        </SelectTrigger>
                        <SelectContent>
                          {contractTypes.map((ct: any) => (
                            <SelectItem key={ct.id} value={ct.id}>
                              {ct.name}
                              {ct.weekly_hours > 0 && (
                                <span className="text-muted-foreground ml-1">({ct.weekly_hours}h/sem)</span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">
                        No hay tipos de contrato configurados.{" "}
                        {formData.agency_id && (
                          <Link href={`/dashboard/agencies/${formData.agency_id}/edit`} className="text-primary underline hover:no-underline">
                            Configurar
                          </Link>
                        )}
                      </p>
                    )}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="hire_date">Fecha de ingreso</FieldLabel>
                    <Input
                      id="hire_date"
                      type="date"
                      value={formData.hire_date}
                      onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="birth_date">Fecha de nacimiento</FieldLabel>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    />
                  </Field>
                </div>

                {/* Capacidad de carga */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Capacidad de Carga</h4>
                  <p className="text-xs text-muted-foreground mb-4">Define la capacidad de subordinados y cuentas que puede manejar esta persona</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Field>
                      <FieldLabel htmlFor="min_subordinates">Subordinados mín.</FieldLabel>
                      <Input
                        id="min_subordinates"
                        type="number"
                        min="0"
                        value={formData.min_subordinates}
                        onChange={(e) => setFormData({ ...formData, min_subordinates: e.target.value })}
                        placeholder="0"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="max_subordinates">Subordinados máx.</FieldLabel>
                      <Input
                        id="max_subordinates"
                        type="number"
                        min="0"
                        value={formData.max_subordinates}
                        onChange={(e) => setFormData({ ...formData, max_subordinates: e.target.value })}
                        placeholder="0"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="min_accounts">Cuentas mín.</FieldLabel>
                      <Input
                        id="min_accounts"
                        type="number"
                        min="0"
                        value={formData.min_accounts}
                        onChange={(e) => setFormData({ ...formData, min_accounts: e.target.value })}
                        placeholder="0"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="max_accounts">Cuentas máx.</FieldLabel>
                      <Input
                        id="max_accounts"
                        type="number"
                        min="0"
                        value={formData.max_accounts}
                        onChange={(e) => setFormData({ ...formData, max_accounts: e.target.value })}
                        placeholder="0"
                      />
                    </Field>
                  </div>
                </div>

                <Field>
                  <FieldLabel htmlFor="skills">Habilidades</FieldLabel>
                  <Input
                    id="skills"
                    value={formData.skills || ""}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="Ej: Diseño gráfico, Illustrator, Photoshop (separadas por coma)"
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Información de costos */}
          <Card className={!canEditBilling ? "border-amber-200 bg-amber-50/30" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Costos y Facturación</CardTitle>
                  <CardDescription>Información para cálculo de rentabilidad y nómina</CardDescription>
                </div>
                {!canEditBilling && (
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-100 px-3 py-1.5 rounded-md text-xs font-medium">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Solo lectura - Requiere permisos de Gerente RH o Director
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                {/* Agencia que paga la nómina */}
                <Field>
                  <FieldLabel htmlFor="payroll_agency_id">Agencia que Paga la Nómina</FieldLabel>
                  <Select
                    value={formData.payroll_agency_id}
                    onValueChange={(value) => setFormData({ ...formData, payroll_agency_id: value })}
                    disabled={!canEditBilling}
                  >
                    <SelectTrigger className={!canEditBilling ? "bg-muted cursor-not-allowed" : ""}>
                      <SelectValue placeholder="Selecciona la agencia responsable de la nómina" />
                    </SelectTrigger>
                    <SelectContent>
                      {agencies.map((agency) => (
                        <SelectItem key={agency.id} value={agency.id}>
                          {agency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Define qué agencia será responsable del pago de nómina de este colaborador
                  </p>
                </Field>

                <Field>
                  <FieldLabel htmlFor="currency_id">Moneda</FieldLabel>
                  <Select
                    value={formData.currency_id}
                    onValueChange={(value) => setFormData({ ...formData, currency_id: value })}
                    disabled={!canEditBilling}
                  >
                    <SelectTrigger className={!canEditBilling ? "bg-muted cursor-not-allowed" : ""}>
                      <SelectValue placeholder="Selecciona una moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.id} value={currency.id}>
                          {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

{formData.contract_type === "commission" ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel htmlFor="commission_type">Tipo de Comisión</FieldLabel>
                          <Select
                            value={formData.commission_type}
                            onValueChange={(value) => setFormData({ ...formData, commission_type: value })}
                            disabled={!canEditBilling}
                          >
                            <SelectTrigger className={!canEditBilling ? "bg-muted cursor-not-allowed" : ""}>
                              <SelectValue placeholder="Selecciona tipo de comisión" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sales">Comisión sobre Ventas</SelectItem>
                              <SelectItem value="revenue">Comisión sobre Ingresos</SelectItem>
                              <SelectItem value="both">Ambos tipos</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="commission_percentage">Porcentaje de Comisión (%)</FieldLabel>
                          <Input
                            id="commission_percentage"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={formData.commission_percentage}
                            onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
                            placeholder="Ej: 10.00"
                            disabled={!canEditBilling}
                            className={!canEditBilling ? "bg-muted cursor-not-allowed" : ""}
                          />
                        </Field>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Los comisionistas no tienen salario fijo. Sus ingresos se calculan según el porcentaje de comisión sobre ventas o ingresos.
                      </p>
                    </>
                  ) : formData.contract_type === "full_time_variable" ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel htmlFor="monthly_salary">Salario Mensual</FieldLabel>
                          <Input
                            id="monthly_salary"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.monthly_salary}
                            onChange={(e) => setFormData({ ...formData, monthly_salary: e.target.value })}
                            placeholder="Ej: 15000.00"
                            disabled={!canEditBilling}
                            className={!canEditBilling ? "bg-muted cursor-not-allowed" : ""}
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="hourly_cost">Costo por Hora</FieldLabel>
                          <Input
                            id="hourly_cost"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.hourly_cost}
                            onChange={(e) => setFormData({ ...formData, hourly_cost: e.target.value })}
                            placeholder="Ej: 150.00"
                            disabled={!canEditBilling}
                            className={!canEditBilling ? "bg-muted cursor-not-allowed" : ""}
                          />
                        </Field>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <Field>
                          <FieldLabel htmlFor="currency_id">Moneda</FieldLabel>
                          <Select
                            value={formData.currency_id}
                            onValueChange={(value) => setFormData({ ...formData, currency_id: value })}
                            disabled={!canEditBilling}
                          >
                            <SelectTrigger className={!canEditBilling ? "bg-muted cursor-not-allowed" : ""}>
                              <SelectValue placeholder="Selecciona moneda" />
                            </SelectTrigger>
                            <SelectContent>
                              {currencies.map((currency) => (
                                <SelectItem key={currency.id} value={currency.id}>
                                  {currency.code} - {currency.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      </div>
                      <div className="border-t pt-4 mt-4">
                        <p className="text-sm font-medium mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Comisión Variable
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <Field>
                            <FieldLabel htmlFor="commission_type">Tipo de Comisión</FieldLabel>
                            <Select
                              value={formData.commission_type}
                              onValueChange={(value) => setFormData({ ...formData, commission_type: value })}
                              disabled={!canEditBilling}
                            >
                              <SelectTrigger className={!canEditBilling ? "bg-muted cursor-not-allowed" : ""}>
                                <SelectValue placeholder="Selecciona tipo de comisión" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sales">Comisión sobre Ventas</SelectItem>
                                <SelectItem value="revenue">Comisión sobre Ingresos</SelectItem>
                                <SelectItem value="both">Ambos tipos</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>
                          <Field>
                            <FieldLabel htmlFor="commission_percentage">Porcentaje de Comisión (%)</FieldLabel>
                            <Input
                              id="commission_percentage"
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={formData.commission_percentage}
                              onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
                              placeholder="Ej: 5.00"
                              disabled={!canEditBilling}
                              className={!canEditBilling ? "bg-muted cursor-not-allowed" : ""}
                            />
                          </Field>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Además del salario fijo, este empleado puede recibir comisiones variables por ventas o ingresos.
                        </p>
                      </div>
                    </>
                  ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="hourly_cost">Costo por hora</FieldLabel>
                      <Input
                        id="hourly_cost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.hourly_cost}
                        onChange={(e) => setFormData({ ...formData, hourly_cost: e.target.value })}
                        placeholder="0.00"
                        disabled={!canEditBilling}
                        className={!canEditBilling ? "bg-muted cursor-not-allowed" : ""}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="monthly_salary">Salario mensual</FieldLabel>
                      <Input
                        id="monthly_salary"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.monthly_salary}
                        onChange={(e) => setFormData({ ...formData, monthly_salary: e.target.value })}
                        placeholder="0.00"
                        disabled={!canEditBilling}
                        className={!canEditBilling ? "bg-muted cursor-not-allowed" : ""}
                      />
                    </Field>
                  </div>
                )}

<div className="flex items-center gap-2">
                  <Checkbox
                    id="is_billable"
                    checked={formData.is_billable}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_billable: checked as boolean })
                    }
                    disabled={!canEditBilling}
                  />
                  <label htmlFor="is_billable" className={`text-sm ${!canEditBilling ? "text-muted-foreground" : ""}`}>
                    Es facturable (sus horas se consideran para cobro a clientes)
                  </label>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Información de Contacto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Información de Contacto
              </CardTitle>
              <CardDescription>Dirección completa y datos de contacto personal</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="personal_email">Correo Personal</FieldLabel>
                    <Input
                      id="personal_email"
                      type="email"
                      value={formData.personal_email}
                      onChange={(e) => setFormData({ ...formData, personal_email: e.target.value })}
                      placeholder="correo@personal.com"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="personal_phone">Teléfono Personal</FieldLabel>
                    <Input
                      id="personal_phone"
                      value={formData.personal_phone}
                      onChange={(e) => setFormData({ ...formData, personal_phone: e.target.value })}
                      placeholder="+52 55 1234 5678"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="address_street">Calle y Número</FieldLabel>
                  <Input
                    id="address_street"
                    value={formData.address_street}
                    onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                    placeholder="Av. Insurgentes Sur 123, Int. 4"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="address_colony">Colonia</FieldLabel>
                    <Input
                      id="address_colony"
                      value={formData.address_colony}
                      onChange={(e) => setFormData({ ...formData, address_colony: e.target.value })}
                      placeholder="Roma Norte"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="address_city">Ciudad</FieldLabel>
                    <Input
                      id="address_city"
                      value={formData.address_city}
                      onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
                      placeholder="Ciudad de México"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Field>
                    <FieldLabel htmlFor="address_state">Estado</FieldLabel>
                    <Input
                      id="address_state"
                      value={formData.address_state}
                      onChange={(e) => setFormData({ ...formData, address_state: e.target.value })}
                      placeholder="CDMX"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="address_zip">Código Postal</FieldLabel>
                    <Input
                      id="address_zip"
                      value={formData.address_zip}
                      onChange={(e) => setFormData({ ...formData, address_zip: e.target.value })}
                      placeholder="06700"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="address_country">País</FieldLabel>
                    <Input
                      id="address_country"
                      value={formData.address_country}
                      onChange={(e) => setFormData({ ...formData, address_country: e.target.value })}
                      placeholder="México"
                    />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Contacto de Emergencia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contacto de Emergencia
              </CardTitle>
              <CardDescription>Persona a contactar en caso de emergencia</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="emergency_contact_name">Nombre Completo</FieldLabel>
                    <Input
                      id="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      placeholder="Nombre del contacto"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="emergency_contact_relationship">Parentesco</FieldLabel>
                    <Select
                      value={formData.emergency_contact_relationship}
                      onValueChange={(value) => setFormData({ ...formData, emergency_contact_relationship: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona parentesco" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">Cónyuge</SelectItem>
                        <SelectItem value="parent">Padre/Madre</SelectItem>
                        <SelectItem value="sibling">Hermano/a</SelectItem>
                        <SelectItem value="child">Hijo/a</SelectItem>
                        <SelectItem value="friend">Amigo/a</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="emergency_contact_phone">Teléfono</FieldLabel>
                    <Input
                      id="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                      placeholder="+52 55 1234 5678"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="emergency_contact_email">Correo Electrónico</FieldLabel>
                    <Input
                      id="emergency_contact_email"
                      type="email"
                      value={formData.emergency_contact_email}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_email: e.target.value })}
                      placeholder="correo@ejemplo.com"
                    />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Información de Pagos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Información de Pagos
              </CardTitle>
              <CardDescription>Datos bancarios para realizar pagos</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="bank_name">Banco</FieldLabel>
                    <Select
                      value={formData.bank_name}
                      onValueChange={(value) => setFormData({ ...formData, bank_name: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un banco" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BBVA">BBVA</SelectItem>
                        <SelectItem value="Santander">Santander</SelectItem>
                        <SelectItem value="Banamex">Banamex (Citibanamex)</SelectItem>
                        <SelectItem value="Banorte">Banorte</SelectItem>
                        <SelectItem value="HSBC">HSBC</SelectItem>
                        <SelectItem value="Scotiabank">Scotiabank</SelectItem>
                        <SelectItem value="Inbursa">Inbursa</SelectItem>
                        <SelectItem value="Azteca">Banco Azteca</SelectItem>
                        <SelectItem value="BanCoppel">BanCoppel</SelectItem>
                        <SelectItem value="Nu">Nu</SelectItem>
                        <SelectItem value="Hey Banco">Hey Banco</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="bank_account_holder">Titular de la Cuenta</FieldLabel>
                    <Input
                      id="bank_account_holder"
                      value={formData.bank_account_holder}
                      onChange={(e) => setFormData({ ...formData, bank_account_holder: e.target.value })}
                      placeholder="Nombre como aparece en el banco"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="bank_account_number">Número de Cuenta</FieldLabel>
                    <Input
                      id="bank_account_number"
                      value={formData.bank_account_number}
                      onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                      placeholder="0123456789"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="bank_clabe">CLABE Interbancaria</FieldLabel>
                    <Input
                      id="bank_clabe"
                      value={formData.bank_clabe}
                      onChange={(e) => setFormData({ ...formData, bank_clabe: e.target.value })}
                      placeholder="18 dígitos"
                      maxLength={18}
                    />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
</Card>

          {/* Documentos */}
          <StaffDocuments
            pendingUploads={pendingDocuments}
            onPendingUploadsChange={setPendingDocuments}
          />
  
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
                  placeholder="Notas adicionales sobre el miembro del equipo..."
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
              <Link href="/dashboard/hr/staff">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="mr-2" />
                  Guardando...
                </>
              ) : (
                "Crear Miembro"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
