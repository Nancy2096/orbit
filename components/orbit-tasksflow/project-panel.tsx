"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import {
  Pie,
  PieChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Cell,
} from "recharts"
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  ListTodo,
  CalendarClock,
  MessageSquarePlus,
} from "lucide-react"

interface PanelTask {
  id: string
  title: string
  status: string
  priority: string
  assigneeName: string
  dueDate: string
  createdAt: string
  hours: number
}

interface PanelReport {
  id: string
  name: string
  month: string
  year: string
  area: string
  fileName: string
}

interface ProjectPanelProps {
  tasks: PanelTask[]
  reports: PanelReport[]
  projectName: string
}

const MONTH_ORDER = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const statusLabels: Record<string, string> = {
  completado: "Finalizadas",
  en_progreso: "En progreso",
  pendiente: "Pendientes",
  vencido: "Con retraso",
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
}

export function ProjectPanel({ tasks, reports, projectName }: ProjectPanelProps) {
  const metrics = useMemo(() => {
    const finalizadas = tasks.filter((t) => t.status === "completado").length
    const conRetraso = tasks.filter((t) => t.status === "vencido").length
    const sinFinalizar = tasks.filter(
      (t) => t.status === "en_progreso" || t.status === "pendiente",
    ).length
    return { finalizadas, conRetraso, sinFinalizar, total: tasks.length }
  }, [tasks])

  // Distribución por estado (pie)
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {}
    tasks.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1
    })
    const colorByStatus: Record<string, string> = {
      completado: "var(--chart-2)",
      en_progreso: "var(--chart-1)",
      pendiente: "var(--chart-4)",
      vencido: "var(--chart-5)",
    }
    return Object.entries(counts).map(([status, value]) => ({
      status,
      label: statusLabels[status] || status,
      value,
      fill: colorByStatus[status] || "var(--chart-3)",
    }))
  }, [tasks])

  // Tareas por responsable (barras)
  const assigneeData = useMemo(() => {
    const counts: Record<string, number> = {}
    tasks.forEach((t) => {
      counts[t.assigneeName] = (counts[t.assigneeName] || 0) + 1
    })
    return Object.entries(counts).map(([name, tareas]) => ({
      name: name.split(" ")[0],
      tareas,
    }))
  }, [tasks])

  // Carga de horas por prioridad (barras)
  const priorityData = useMemo(() => {
    const order = ["alta", "media", "baja"]
    const labels: Record<string, string> = { alta: "Alta", media: "Media", baja: "Baja" }
    const counts: Record<string, number> = {}
    tasks.forEach((t) => {
      counts[t.priority] = (counts[t.priority] || 0) + t.hours
    })
    return order
      .filter((p) => counts[p] != null)
      .map((p) => ({ prioridad: labels[p], horas: counts[p] }))
  }, [tasks])

  // Timeline de entregas (dueDate) y solicitudes (createdAt)
  const timeline = useMemo(() => {
    const events = [
      ...tasks.map((t) => ({
        id: `d-${t.id}`,
        type: "entrega" as const,
        title: t.title,
        date: t.dueDate,
      })),
      ...tasks.map((t) => ({
        id: `s-${t.id}`,
        type: "solicitud" as const,
        title: t.title,
        date: t.createdAt,
      })),
    ]
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [tasks])

  // Entrega de reportes por mes (barras)
  const reportsData = useMemo(() => {
    const counts: Record<string, number> = {}
    reports.forEach((r) => {
      counts[r.month] = (counts[r.month] || 0) + 1
    })
    return MONTH_ORDER.filter((m) => counts[m]).map((m) => ({
      mes: m.slice(0, 3),
      reportes: counts[m],
    }))
  }, [reports])

  // Planeaciones / Parrillas RSS entregadas vs planeadas (línea)
  const rssData = useMemo(
    () => [
      { semana: "Sem 1", planeadas: 5, entregadas: 5 },
      { semana: "Sem 2", planeadas: 6, entregadas: 5 },
      { semana: "Sem 3", planeadas: 6, entregadas: 6 },
      { semana: "Sem 4", planeadas: 7, entregadas: 4 },
    ],
    [],
  )

  const metricCards = [
    {
      label: "Tareas Finalizadas",
      value: metrics.finalizadas,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      label: "Tareas sin Finalizar",
      value: metrics.sinFinalizar,
      icon: Circle,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "Tareas con Retraso",
      value: metrics.conRetraso,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-100 dark:bg-red-900/30",
    },
    {
      label: "Total de Tareas",
      value: metrics.total,
      icon: ListTodo,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ]

  return (
    <div className="space-y-4">
      {/* Métricas principales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${m.bg}`}>
                  <m.icon className={`h-5 w-5 ${m.color}`} />
                </div>
                <div>
                  <p className={`text-3xl font-bold ${m.color}`}>{m.value}</p>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pie + Barras responsable */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución de Tareas</CardTitle>
            <CardDescription>Estado actual de las tareas de {projectName}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ value: { label: "Tareas" } }}
              className="mx-auto aspect-square max-h-[280px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
                <Pie data={statusData} dataKey="value" nameKey="label" innerRadius={60} strokeWidth={4}>
                  {statusData.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="label" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tareas por Responsable</CardTitle>
            <CardDescription>Carga de trabajo del equipo</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ tareas: { label: "Tareas", color: "var(--chart-1)" } }}
              className="max-h-[280px] w-full"
            >
              <BarChart data={assigneeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="tareas" fill="var(--color-tareas)" radius={6} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Barras horas por prioridad + Reportes */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Horas por Prioridad</CardTitle>
            <CardDescription>Distribución de esfuerzo estimado</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ horas: { label: "Horas", color: "var(--chart-3)" } }}
              className="max-h-[260px] w-full"
            >
              <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="prioridad" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="horas" fill="var(--color-horas)" radius={6} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Entrega de Reportes</CardTitle>
            <CardDescription>Reportes entregados por mes</CardDescription>
          </CardHeader>
          <CardContent>
            {reportsData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                Aún no hay reportes cargados para graficar.
              </p>
            ) : (
              <ChartContainer
                config={{ reportes: { label: "Reportes", color: "var(--chart-2)" } }}
                className="max-h-[260px] w-full"
              >
                <BarChart data={reportsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="reportes" fill="var(--color-reportes)" radius={6} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Planeaciones / Parrillas RSS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Planeaciones y Parrillas RSS</CardTitle>
          <CardDescription>Publicaciones planeadas vs entregadas por semana</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              planeadas: { label: "Planeadas", color: "var(--chart-4)" },
              entregadas: { label: "Entregadas", color: "var(--chart-1)" },
            }}
            className="max-h-[280px] w-full"
          >
            <LineChart data={rssData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="semana" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line dataKey="planeadas" stroke="var(--color-planeadas)" strokeWidth={2} dot={{ r: 4 }} />
              <Line dataKey="entregadas" stroke="var(--color-entregadas)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Timeline de entregas y solicitudes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Línea de Tiempo — Entregas y Solicitudes</CardTitle>
          <CardDescription>Cronología de solicitudes y fechas de entrega</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative pl-6">
            <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border" aria-hidden />
            <ul className="space-y-4">
              {timeline.map((event) => {
                const isEntrega = event.type === "entrega"
                return (
                  <li key={event.id} className="relative flex items-start gap-3">
                    <span
                      className={`absolute -left-6 mt-1 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-background ${
                        isEntrega ? "bg-emerald-500" : "bg-blue-500"
                      }`}
                    />
                    <div className="flex flex-1 items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {isEntrega ? (
                          <CalendarClock className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <MessageSquarePlus className="h-4 w-4 text-blue-600 shrink-0" />
                        )}
                        <span className="text-sm font-medium truncate">{event.title}</span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${
                            isEntrega
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}
                        >
                          {isEntrega ? "Entrega" : "Solicitud"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{formatDate(event.date)}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
