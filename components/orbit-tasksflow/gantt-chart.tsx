"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GanttChartSquare } from "lucide-react"

export interface GanttTask {
  id: string
  title: string
  status: string
  assigneeName?: string
  createdAt: string
  dueDate: string
}

interface GanttChartProps {
  tasks: GanttTask[]
  title?: string
  description?: string
}

const statusBarConfig: Record<string, { bar: string; label: string }> = {
  completado: { bar: "bg-green-500", label: "Completado" },
  en_progreso: { bar: "bg-blue-500", label: "En Progreso" },
  pendiente: { bar: "bg-gray-400", label: "Pendiente" },
  vencido: { bar: "bg-red-500", label: "Vencido" },
}

const MS_PER_DAY = 1000 * 60 * 60 * 24
const DAY_WIDTH = 34 // px por día
const LABEL_WIDTH = 220 // px de la columna de nombres

function startOfDay(dateStr: string) {
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  return d
}

function diffInDays(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / MS_PER_DAY)
}

function formatShort(d: Date) {
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" })
}

export function GanttChart({ tasks, title = "Diagrama de Gantt", description }: GanttChartProps) {
  const model = useMemo(() => {
    const valid = tasks.filter((t) => t.createdAt && t.dueDate)
    if (valid.length === 0) return null

    let rangeStart = startOfDay(valid[0].createdAt)
    let rangeEnd = startOfDay(valid[0].dueDate)

    for (const t of valid) {
      const s = startOfDay(t.createdAt)
      const e = startOfDay(t.dueDate)
      if (s < rangeStart) rangeStart = s
      if (e > rangeEnd) rangeEnd = e
    }

    // Margen de 1 día a cada lado para respirar
    rangeStart = new Date(rangeStart.getTime() - MS_PER_DAY)
    rangeEnd = new Date(rangeEnd.getTime() + MS_PER_DAY)

    const totalDays = diffInDays(rangeEnd, rangeStart) + 1
    const today = startOfDay(new Date().toISOString())
    const todayOffset = diffInDays(today, rangeStart)

    const rows = valid.map((t) => {
      const s = startOfDay(t.createdAt)
      const e = startOfDay(t.dueDate)
      const offset = diffInDays(s, rangeStart)
      const duration = Math.max(1, diffInDays(e, s) + 1)
      return { task: t, offset, duration }
    })

    // Marcadores semanales
    const ticks: { offset: number; label: string }[] = []
    for (let i = 0; i < totalDays; i += 7) {
      const d = new Date(rangeStart.getTime() + i * MS_PER_DAY)
      ticks.push({ offset: i, label: formatShort(d) })
    }

    return { totalDays, rows, ticks, todayOffset }
  }, [tasks])

  if (!model) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GanttChartSquare className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground text-sm">
            No hay tareas con fechas para mostrar en el diagrama.
          </div>
        </CardContent>
      </Card>
    )
  }

  const timelineWidth = model.totalDays * DAY_WIDTH

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GanttChartSquare className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div style={{ minWidth: LABEL_WIDTH + timelineWidth }}>
            {/* Encabezado del timeline */}
            <div className="flex border-b">
              <div
                className="flex-shrink-0 py-2 pr-4 text-xs font-medium text-muted-foreground"
                style={{ width: LABEL_WIDTH }}
              >
                Tarea
              </div>
              <div className="relative flex-1" style={{ width: timelineWidth, height: 28 }}>
                {model.ticks.map((tick, i) => (
                  <div
                    key={i}
                    className="absolute top-0 flex h-full items-center border-l border-border/60 pl-1 text-xs text-muted-foreground"
                    style={{ left: tick.offset * DAY_WIDTH }}
                  >
                    {tick.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Filas de tareas */}
            <div className="relative">
              {/* Línea de "hoy" */}
              {model.todayOffset >= 0 && model.todayOffset <= model.totalDays && (
                <div
                  className="absolute top-0 bottom-0 z-10 w-px bg-primary/70"
                  style={{ left: LABEL_WIDTH + model.todayOffset * DAY_WIDTH }}
                  aria-hidden="true"
                >
                  <span className="absolute -top-0.5 left-1 text-[10px] font-medium text-primary whitespace-nowrap">
                    Hoy
                  </span>
                </div>
              )}

              {model.rows.map(({ task, offset, duration }) => {
                const cfg = statusBarConfig[task.status] ?? statusBarConfig.pendiente
                return (
                  <div key={task.id} className="flex items-center border-b last:border-b-0 hover:bg-muted/40">
                    <div
                      className="flex-shrink-0 py-3 pr-4"
                      style={{ width: LABEL_WIDTH }}
                    >
                      <p className="truncate text-sm font-medium">{task.title}</p>
                      {task.assigneeName && (
                        <p className="truncate text-xs text-muted-foreground">{task.assigneeName}</p>
                      )}
                    </div>
                    <div className="relative flex-1" style={{ width: timelineWidth, height: 44 }}>
                      <div
                        className={`absolute top-1/2 flex -translate-y-1/2 items-center rounded-md ${cfg.bar} px-2 shadow-sm`}
                        style={{
                          left: offset * DAY_WIDTH,
                          width: Math.max(DAY_WIDTH, duration * DAY_WIDTH) - 4,
                          height: 22,
                        }}
                        title={`${cfg.label} · ${formatShort(startOfDay(task.createdAt))} → ${formatShort(startOfDay(task.dueDate))}`}
                      >
                        <span className="truncate text-[11px] font-medium text-white">{cfg.label}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Leyenda */}
        <div className="mt-4 flex flex-wrap gap-4">
          {Object.entries(statusBarConfig).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={`h-3 w-3 rounded-sm ${cfg.bar}`} />
              {cfg.label}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
