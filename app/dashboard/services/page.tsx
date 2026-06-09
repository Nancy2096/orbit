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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, ClipboardList } from "lucide-react"
import { useAgency } from "@/contexts/agency-context"

interface Service {
  id: string
  service_code: string | null
  name: string
  description: string | null
  unit_type: string
  base_price: number
  base_price_usd: number | null
  is_active: boolean
  agency: {
    name: string
  } | null
  department: {
    name: string
  } | null
}

const unitTypeLabels: Record<string, string> = {
  hour: "Por hora",
  day: "Por día",
  project: "Por proyecto",
  unit: "Por unidad",
  month: "Mensual",
}

export default function ServicesPage() {
  const { selectedAgencyId, loading: agencyLoading } = useAgency()
  const [mounted, setMounted] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && selectedAgencyId) {
      fetchServices()
    } else if (mounted && !selectedAgencyId) {
      setLoading(false)
      setServices([])
    }
  }, [mounted, selectedAgencyId])

  async function fetchServices() {
    if (!selectedAgencyId) return
    setLoading(true)
    const { data, error } = await supabase
      .from("services")
      .select(`
        id,
        service_code,
        name,
        description,
        unit_type,
        base_price,
        base_price_usd,
        is_active,
        agency:agencies(name),
        department:departments(name)
      `)
      .eq("agency_id", selectedAgencyId)
      .order("name", { ascending: true })

    if (!error && data) {
      setServices(data as Service[])
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar este servicio?")) return

    const { error } = await supabase.from("services").delete().eq("id", id)
    if (!error) {
      setServices(services.filter((s) => s.id !== id))
    }
  }

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.service_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!mounted || agencyLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!selectedAgencyId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <ClipboardList className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Selecciona una Agencia</h2>
        <p className="text-muted-foreground max-w-md">
          Para ver los servicios, primero selecciona una agencia en el selector de arriba.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Servicios</h1>
          <p className="text-muted-foreground">
            Catalogo de servicios de la agencia
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/services/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Servicio
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Catálogo de Servicios</CardTitle>
              <CardDescription>
                {services.length} servicio{services.length !== 1 ? "s" : ""} registrado{services.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o departamento..."
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
          ) : filteredServices.length === 0 ? (
            <Empty>
              <EmptyMedia variant="icon">
                <ClipboardList className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No hay servicios</EmptyTitle>
              <EmptyDescription>
                {searchTerm ? "No se encontraron resultados para tu búsqueda" : "Comienza agregando tu primer servicio"}
              </EmptyDescription>
              {!searchTerm && (
                <Button asChild>
                  <Link href="/dashboard/services/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Servicio
                  </Link>
                </Button>
              )}
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Agencia</TableHead>
                  <TableHead className="text-right">Precio (MXN)</TableHead>
                  <TableHead className="text-right">Precio (USD)</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-12">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{service.name}</div>
                        {service.service_code && (
                          <div className="text-xs text-muted-foreground">
                            {service.service_code}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {service.department?.name ? (
                        <Badge variant="outline">{service.department.name}</Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{service.agency?.name || "-"}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">
                        ${service.base_price.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {service.base_price_usd ? (
                        <div className="font-medium">
                          ${service.base_price_usd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {unitTypeLabels[service.unit_type] || service.unit_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={service.is_active ? "default" : "secondary"}>
                        {service.is_active ? "Activo" : "Inactivo"}
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
                            <Link href={`/dashboard/services/${service.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(service.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
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
