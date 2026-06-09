"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { StaffAvatar } from "@/components/staff-avatar"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Users, Shield } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface Staff {
  id: string
  employee_code: string | null
  first_name: string
  last_name: string
  email: string
  phone: string | null
  position: string
  department: string | null
  position_id: string | null
  department_id: string | null
  contract_type: string
  hourly_cost: number
  is_billable: boolean
  is_active: boolean
  role_id: string | null
  photo_url: string | null
  reports_to_id: string | null
  agency: {
    id: string
    name: string
  } | null
  roles: {
    name: string
    display_name: string
  } | null
  manager: {
    first_name: string
    last_name: string
  } | null
  position_info: {
    name: string
  } | null
  department_info: {
    name: string
  } | null
}

const contractTypeLabels: Record<string, string> = {
  full_time: "Tiempo completo",
  full_time_variable: "Tiempo Completo + Variable",
  part_time: "Medio tiempo",
  freelance: "Freelance",
  contractor: "Contratista",
  commission: "Comisionista",
}

interface Agency {
  id: string
  name: string
}

interface Department {
  id: string
  name: string
  agency_id: string
}

export default function StaffPage() {
  const [mounted, setMounted] = useState(false)
  const [staff, setStaff] = useState<Staff[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedAgency, setSelectedAgency] = useState<string>("all")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [canManageRoles, setCanManageRoles] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchAgencies()
      fetchDepartments()
      fetchStaff()
      checkUserPermissions()
    }
  }, [mounted])

  async function fetchAgencies() {
    const { data } = await supabase
      .from("agencies")
      .select("id, name")
      .eq("is_active", true)
      .order("name")
    if (data) setAgencies(data)
  }

  async function fetchDepartments() {
    const { data } = await supabase
      .from("departments")
      .select("id, name, agency_id")
      .order("name")
    if (data) setDepartments(data)
  }

  async function checkUserPermissions() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: staffData } = await supabase
      .from("staff")
      .select("role_id, roles:role_id(name, level)")
      .eq("user_id", user.id)
      .single()

    if (staffData?.roles) {
      const roleLevel = (staffData.roles as { name: string; level: number }).level
      // Super Administrador (level 1) and Direccion General (level 2) can manage roles
      setCanManageRoles(roleLevel <= 2)
    } else {
      setCanManageRoles(true)
    }
  }

  async function fetchStaff() {
    setLoading(true)
    const { data, error } = await supabase
      .from("staff")
      .select(`
        id,
        employee_code,
        first_name,
        last_name,
        email,
        phone,
        position,
        department,
        contract_type,
        hourly_cost,
        is_billable,
        is_active,
        role_id,
        photo_url,
        reports_to_id,
        position_id,
        department_id,
        agency:agencies!staff_agency_id_fkey(id, name),
        roles:role_id(name, display_name)
      `)
      .order("first_name", { ascending: true })

    console.log("[v0] Staff data:", data?.length, "Error:", error)

    if (error) {
      console.error("[v0] Error fetching staff:", error)
      setLoading(false)
      return
    }

    if (data && data.length > 0) {
      // Fetch managers (staff who are reports_to_id)
      const managerIds = [...new Set(data.filter(s => s.reports_to_id).map(s => s.reports_to_id))]
      let managersMap: Record<string, { first_name: string; last_name: string }> = {}
      
      if (managerIds.length > 0) {
        const { data: managers } = await supabase
          .from("staff")
          .select("id, first_name, last_name")
          .in("id", managerIds)
        
        if (managers) {
          managersMap = managers.reduce((acc, m) => {
            acc[m.id] = { first_name: m.first_name, last_name: m.last_name }
            return acc
          }, {} as Record<string, { first_name: string; last_name: string }>)
        }
      }

      // Fetch positions
      const positionIds = [...new Set(data.filter(s => s.position_id).map(s => s.position_id))]
      let positionsMap: Record<string, { name: string }> = {}
      
      if (positionIds.length > 0) {
        const { data: positions } = await supabase
          .from("positions")
          .select("id, name")
          .in("id", positionIds)
        
        if (positions) {
          positionsMap = positions.reduce((acc, p) => {
            acc[p.id] = { name: p.name }
            return acc
          }, {} as Record<string, { name: string }>)
        }
      }

      // Fetch departments
      const departmentIds = [...new Set(data.filter(s => s.department_id).map(s => s.department_id))]
      let departmentsMap: Record<string, { name: string }> = {}
      
      if (departmentIds.length > 0) {
        const { data: departments } = await supabase
          .from("departments")
          .select("id, name")
          .in("id", departmentIds)
        
        if (departments) {
          departmentsMap = departments.reduce((acc, d) => {
            acc[d.id] = { name: d.name }
            return acc
          }, {} as Record<string, { name: string }>)
        }
      }

      // Map data with related info
      const mappedData = data.map(s => ({
        ...s,
        manager: s.reports_to_id ? managersMap[s.reports_to_id] || null : null,
        position_info: s.position_id ? positionsMap[s.position_id] || null : null,
        department_info: s.department_id ? departmentsMap[s.department_id] || null : null,
      }))

      setStaff(mappedData as Staff[])
    } else {
      setStaff([])
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar este miembro del equipo?")) return

    const { error } = await supabase.from("staff").delete().eq("id", id)
    if (!error) {
      setStaff(staff.filter((s) => s.id !== id))
    }
  }

  const filteredStaff = staff.filter((s) => {
    // Filter by agency
    if (selectedAgency !== "all") {
      const staffAgencyId = (s.agency as unknown as { id?: string })?.id
      if (staffAgencyId !== selectedAgency) return false
    }
    // Filter by department
    if (selectedDepartment !== "all") {
      if (s.department_id !== selectedDepartment) return false
    }
    // Filter by search term
    if (searchTerm) {
      return (
        s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.position.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    return true
  })

  // Filter departments based on selected agency
  const filteredDepartments = selectedAgency === "all" 
    ? departments 
    : departments.filter(d => d.agency_id === selectedAgency)

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Personal</h1>
          <p className="text-muted-foreground">
            Gestiona los miembros del personal y sus asignaciones
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/hr/staff/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Miembro
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Agencia:</span>
          <Select value={selectedAgency} onValueChange={(value) => {
            setSelectedAgency(value)
            setSelectedDepartment("all") // Reset department when agency changes
          }}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Selecciona una agencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las agencias</SelectItem>
              {agencies.map((agency) => (
                <SelectItem key={agency.id} value={agency.id}>
                  {agency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Departamento:</span>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Selecciona un departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los departamentos</SelectItem>
              {filteredDepartments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Miembros del Personal</CardTitle>
              <CardDescription>
                {staff.length} miembro{staff.length !== 1 ? "s" : ""} registrado{staff.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o puesto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner className="h-8 w-8" />
            </div>
          ) : filteredStaff.length === 0 ? (
            <Empty>
              <EmptyMedia variant="icon">
                <Users className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No hay miembros del equipo</EmptyTitle>
              <EmptyDescription>
                {searchTerm ? "No se encontraron resultados para tu búsqueda" : "Comienza agregando el primer miembro del equipo"}
              </EmptyDescription>
              {!searchTerm && (
                <Button asChild>
                  <Link href="/dashboard/hr/staff/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Miembro
                  </Link>
                </Button>
              )}
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agencia</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Puesto</TableHead>
                  <TableHead>Jefe Inmediato</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <span className="text-sm">
                        {member.agency?.name || <span className="text-primary font-medium">Global</span>}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <StaffAvatar
                          photoUrl={member.photo_url}
                          firstName={member.first_name}
                          lastName={member.last_name}
                          className="h-10 w-10"
                          fallbackClassName="text-sm"
                        />
                        <div>
                          <div className="font-medium">
                            {member.first_name} {member.last_name}
                          </div>
                          {member.employee_code && (
                            <div className="text-xs text-muted-foreground">
                              {member.employee_code}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {member.department_info?.name || member.department || <span className="text-muted-foreground">Sin departamento</span>}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {member.position_info?.name || member.position || <span className="text-muted-foreground">Sin puesto</span>}
                      </span>
                    </TableCell>
                    <TableCell>
                      {member.manager ? (
                        <span className="text-sm">
                          {member.manager.first_name} {member.manager.last_name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sin jefe asignado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.is_active ? "default" : "secondary"}>
                        {member.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/hr/staff/${member.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          {canManageRoles && (
                            <>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/hr/staff/${member.id}/role`}>
                                  <Shield className="mr-2 h-4 w-4" />
                                  Asignar Rol
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(member.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </>
                          )}
                          {!canManageRoles && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(member.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
