"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, FolderKanban, Calendar, DollarSign } from "lucide-react"

interface Project {
  id: string
  project_code: string | null
  name: string
  status: string
  priority: string
  start_date: string | null
  end_date: string | null
  budget_amount: number | null
  progress_percentage: number
  account: {
    account_name: string
    client: {
      company_name: string
    } | null
    agency: {
      name: string
    } | null
  } | null
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Borrador", variant: "outline" },
  quoted: { label: "Cotizado", variant: "secondary" },
  approved: { label: "Aprobado", variant: "default" },
  in_progress: { label: "En progreso", variant: "default" },
  on_hold: { label: "Pausado", variant: "secondary" },
  completed: { label: "Completado", variant: "default" },
  cancelled: { label: "Cancelado", variant: "destructive" },
}

const priorityLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  low: { label: "Baja", variant: "outline" },
  medium: { label: "Media", variant: "secondary" },
  high: { label: "Alta", variant: "default" },
  urgent: { label: "Urgente", variant: "destructive" },
}

export default function ProjectsPage() {
  const [mounted, setMounted] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchProjects()
    }
  }, [mounted])

  async function fetchProjects() {
    setLoading(true)
    const { data, error } = await supabase
      .from("projects")
      .select(`
        id,
        project_code,
        name,
        status,
        priority,
        start_date,
        end_date,
        budget_amount,
        progress_percentage,
        account:accounts(
          account_name,
          client:clients(company_name),
          agency:agencies(name)
        )
      `)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setProjects(data as Project[])
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar este proyecto?")) return

    const { error } = await supabase.from("projects").delete().eq("id", id)
    if (!error) {
      setProjects(projects.filter((p) => p.id !== id))
    }
  }

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.project_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.account?.client?.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  function formatDate(date: string | null) {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
  }

  function formatCurrency(amount: number | null) {
    if (!amount) return "-"
    return `$${amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
  }

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
          <h1 className="text-2xl font-bold text-foreground">Proyectos</h1>
          <p className="text-muted-foreground">
            Gestiona todos los proyectos de tus agencias
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proyecto
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Lista de Proyectos</CardTitle>
              <CardDescription>
                {projects.length} proyecto{projects.length !== 1 ? "s" : ""} registrado{projects.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o cliente..."
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
          ) : filteredProjects.length === 0 ? (
            <Empty>
              <EmptyMedia variant="icon">
                <FolderKanban className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No hay proyectos</EmptyTitle>
              <EmptyDescription>
                {searchTerm ? "No se encontraron resultados para tu búsqueda" : "Comienza creando tu primer proyecto"}
              </EmptyDescription>
              {!searchTerm && (
                <Button asChild>
                  <Link href="/dashboard/projects/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Proyecto
                  </Link>
                </Button>
              )}
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Cliente / Cuenta</TableHead>
                  <TableHead>Fechas</TableHead>
                  <TableHead>Presupuesto</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{project.name}</div>
                        {project.project_code && (
                          <div className="text-xs text-muted-foreground">
                            {project.project_code}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {project.account?.client?.company_name || "-"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {project.account?.account_name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{formatDate(project.start_date)}</span>
                        <span className="text-muted-foreground">-</span>
                        <span>{formatDate(project.end_date)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        {formatCurrency(project.budget_amount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-24 space-y-1">
                        <Progress value={project.progress_percentage} className="h-2" />
                        <div className="text-xs text-muted-foreground text-right">
                          {project.progress_percentage}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={statusLabels[project.status]?.variant || "outline"}>
                          {statusLabels[project.status]?.label || project.status}
                        </Badge>
                        <Badge variant={priorityLabels[project.priority]?.variant || "outline"} className="text-xs">
                          {priorityLabels[project.priority]?.label || project.priority}
                        </Badge>
                      </div>
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
                            <Link href={`/dashboard/projects/${project.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(project.id)}
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
