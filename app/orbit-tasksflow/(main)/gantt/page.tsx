"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Kanban,
  Calendar,
  GanttChart,
  FileCheck,
  Activity,
  FileText,
  ChevronLeft,
  ChevronRight,
  Building2,
  Briefcase,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"

const projectHealthConfig = {
  saludable: { color: "bg-emerald-500", border: "border-emerald-500" },
  atencion: { color: "bg-amber-500", border: "border-amber-500" },
  riesgo: { color: "bg-orange-500", border: "border-orange-500" },
  critico: { color: "bg-red-500", border: "border-red-500" },
}

// Gantt data - projects with tasks
const ganttData = [
  {
    id: "1",
    name: "Campaña Leads Q2",
    client: "Desarrolladora Horizonte",
    startDate: "2026-05-01",
    endDate: "2026-05-25",
    progress: 75,
    health: "saludable",
    tasks: [
      { id: "1-1", name: "Diseñar artes", start: "2026-05-01", end: "2026-05-08", progress: 100, assignee: "DG" },
      { id: "1-2", name: "Configurar Meta Ads", start: "2026-05-08", end: "2026-05-12", progress: 50, assignee: "EM" },
      { id: "1-3", name: "Optimización", start: "2026-05-12", end: "2026-05-20", progress: 20, assignee: "EM" },
      { id: "1-4", name: "Reporte final", start: "2026-05-20", end: "2026-05-25", progress: 0, assignee: "AT" },
    ]
  },
  {
    id: "2",
    name: "Landing Torre Central",
    client: "Torre Central Living",
    startDate: "2026-05-05",
    endDate: "2026-05-22",
    progress: 45,
    health: "atencion",
    tasks: [
      { id: "2-1", name: "Diseño UI/UX", start: "2026-05-05", end: "2026-05-10", progress: 100, assignee: "DG" },
      { id: "2-2", name: "Desarrollo frontend", start: "2026-05-10", end: "2026-05-16", progress: 60, assignee: "CR" },
      { id: "2-3", name: "Integración backend", start: "2026-05-14", end: "2026-05-18", progress: 20, assignee: "CR" },
      { id: "2-4", name: "QA y ajustes", start: "2026-05-18", end: "2026-05-22", progress: 0, assignee: "CR" },
    ]
  },
  {
    id: "3",
    name: "Branding Residencial",
    client: "Residencial Bosques",
    startDate: "2026-05-03",
    endDate: "2026-05-30",
    progress: 30,
    health: "riesgo",
    tasks: [
      { id: "3-1", name: "Investigación", start: "2026-05-03", end: "2026-05-07", progress: 100, assignee: "ML" },
      { id: "3-2", name: "Diseño logo", start: "2026-05-07", end: "2026-05-14", progress: 70, assignee: "DG" },
      { id: "3-3", name: "Manual de marca", start: "2026-05-14", end: "2026-05-22", progress: 10, assignee: "DG" },
      { id: "3-4", name: "Aplicaciones", start: "2026-05-22", end: "2026-05-30", progress: 0, assignee: "DG" },
    ]
  },
  {
    id: "4",
    name: "Renders 3D",
    client: "Nova Arquitectura",
    startDate: "2026-05-01",
    endDate: "2026-05-15",
    progress: 15,
    health: "critico",
    tasks: [
      { id: "4-1", name: "Modelado 3D", start: "2026-05-01", end: "2026-05-06", progress: 40, assignee: "RS" },
      { id: "4-2", name: "Texturizado", start: "2026-05-06", end: "2026-05-10", progress: 0, assignee: "RS" },
      { id: "4-3", name: "Iluminación", start: "2026-05-10", end: "2026-05-13", progress: 0, assignee: "RS" },
      { id: "4-4", name: "Render final", start: "2026-05-13", end: "2026-05-15", progress: 0, assignee: "RS" },
    ]
  },
  {
    id: "5",
    name: "SEO Mensual Mayo",
    client: "Grupo Inmobiliario Altiva",
    startDate: "2026-05-01",
    endDate: "2026-05-30",
    progress: 60,
    health: "saludable",
    tasks: [
      { id: "5-1", name: "Auditoría", start: "2026-05-01", end: "2026-05-05", progress: 100, assignee: "AT" },
      { id: "5-2", name: "Optimización on-page", start: "2026-05-05", end: "2026-05-15", progress: 80, assignee: "AT" },
      { id: "5-3", name: "Link building", start: "2026-05-10", end: "2026-05-25", progress: 40, assignee: "AT" },
      { id: "5-4", name: "Reporte", start: "2026-05-25", end: "2026-05-30", progress: 0, assignee: "AT" },
    ]
  },
]

// Generate days for May 2026
const generateDays = () => {
  const days = []
  for (let i = 1; i <= 31; i++) {
    const date = new Date(2026, 4, i)
    days.push({
      day: i,
      date: date,
      dayOfWeek: date.getDay(),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    })
  }
  return days
}

const days = generateDays()
const TODAY = new Date(2026, 4, 11) // May 11, 2026

export default function GanttPage() {
  const [loading, setLoading] = useState(true)
  const [selectedAgency, setSelectedAgency] = useState("all")
  const [agencies, setAgencies] = useState<any[]>([])
  const [expandedProjects, setExpandedProjects] = useState<string[]>(ganttData.map(p => p.id))

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("agencies").select("id, name").eq("is_active", true)
      if (data) setAgencies(data)
      setLoading(false)
    }
    fetchData()
  }, [])

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => 
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    )
  }

  const getBarPosition = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const startDay = start.getDate()
    const endDay = end.getDate()
    const duration = endDay - startDay + 1
    
    return {
      left: `${(startDay - 1) * 40}px`,
      width: `${duration * 40 - 4}px`,
    }
  }

  const getProgressWidth = (progress: number, totalWidth: string) => {
    const width = parseInt(totalWidth)
    return `${(width * progress) / 100}px`
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GanttChart className="h-7 w-7 text-primary" />
            Diagrama de Gantt
          </h1>
          <p className="text-muted-foreground">Vista de línea de tiempo de proyectos y tareas</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedAgency} onValueChange={setSelectedAgency}>
            <SelectTrigger className="w-36">
              <Building2 className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Agencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {agencies.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex border rounded-md">
            <Button variant="ghost" size="icon">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Mayo 2026</CardTitle>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <Button variant="outline" size="sm">
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex">
            {/* Left panel - Project names */}
            <div className="w-64 flex-shrink-0 border-r">
              {/* Header */}
              <div className="h-12 border-b bg-muted/50 flex items-center px-3">
                <span className="font-medium text-sm">Proyecto / Tarea</span>
              </div>
              
              {/* Project rows */}
              {ganttData.map(project => {
                const health = projectHealthConfig[project.health as keyof typeof projectHealthConfig]
                const isExpanded = expandedProjects.includes(project.id)
                
                return (
                  <div key={project.id}>
                    {/* Project row */}
                    <div 
                      className="h-10 border-b flex items-center px-3 hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleProject(project.id)}
                    >
                      <div className={`w-2 h-2 rounded-full mr-2 ${health.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{project.name}</p>
                      </div>
                      <Badge variant="outline" className="text-xs ml-2">{project.progress}%</Badge>
                    </div>
                    
                    {/* Task rows */}
                    {isExpanded && project.tasks.map(task => (
                      <div key={task.id} className="h-8 border-b flex items-center px-3 pl-6 bg-muted/20">
                        <p className="text-xs text-muted-foreground truncate flex-1">{task.name}</p>
                        <span className="text-xs text-muted-foreground ml-2">{task.assignee}</span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>

            {/* Right panel - Timeline */}
            <ScrollArea className="flex-1">
              <div style={{ width: `${31 * 40}px` }}>
                {/* Days header */}
                <div className="h-12 border-b bg-muted/50 flex">
                  {days.map(day => (
                    <div 
                      key={day.day}
                      className={`w-10 flex-shrink-0 flex flex-col items-center justify-center border-r text-xs ${
                        day.isWeekend ? "bg-muted/70" : ""
                      } ${day.day === TODAY.getDate() ? "bg-primary/10" : ""}`}
                    >
                      <span className={`font-medium ${day.day === TODAY.getDate() ? "text-primary" : ""}`}>
                        {day.day}
                      </span>
                      <span className="text-muted-foreground text-[10px]">
                        {["D", "L", "M", "M", "J", "V", "S"][day.dayOfWeek]}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Project bars */}
                {ganttData.map(project => {
                  const health = projectHealthConfig[project.health as keyof typeof projectHealthConfig]
                  const isExpanded = expandedProjects.includes(project.id)
                  const projectBar = getBarPosition(project.startDate, project.endDate)
                  
                  return (
                    <div key={project.id}>
                      {/* Project bar row */}
                      <div className="h-10 border-b relative">
                        {/* Background grid */}
                        <div className="absolute inset-0 flex">
                          {days.map(day => (
                            <div 
                              key={day.day}
                              className={`w-10 flex-shrink-0 border-r ${
                                day.isWeekend ? "bg-muted/30" : ""
                              } ${day.day === TODAY.getDate() ? "bg-primary/5" : ""}`}
                            />
                          ))}
                        </div>
                        
                        {/* Today line */}
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                          style={{ left: `${(TODAY.getDate() - 1) * 40 + 20}px` }}
                        />
                        
                        {/* Project bar */}
                        <div
                          className={`absolute top-2 h-6 rounded ${health.color} opacity-80`}
                          style={projectBar}
                        >
                          <div 
                            className="h-full rounded bg-white/30"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Task bar rows */}
                      {isExpanded && project.tasks.map(task => {
                        const taskBar = getBarPosition(task.start, task.end)
                        const isPast = new Date(task.end) < TODAY
                        const isDelayed = isPast && task.progress < 100
                        
                        return (
                          <div key={task.id} className="h-8 border-b relative bg-muted/10">
                            {/* Background grid */}
                            <div className="absolute inset-0 flex">
                              {days.map(day => (
                                <div 
                                  key={day.day}
                                  className={`w-10 flex-shrink-0 border-r ${
                                    day.isWeekend ? "bg-muted/20" : ""
                                  } ${day.day === TODAY.getDate() ? "bg-primary/5" : ""}`}
                                />
                              ))}
                            </div>
                            
                            {/* Today line */}
                            <div 
                              className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                              style={{ left: `${(TODAY.getDate() - 1) * 40 + 20}px` }}
                            />
                            
                            {/* Task bar */}
                            <div
                              className={`absolute top-1.5 h-5 rounded ${
                                isDelayed ? "bg-red-400" : "bg-blue-400"
                              }`}
                              style={taskBar}
                            >
                              <div 
                                className="h-full rounded bg-blue-600"
                                style={{ width: `${task.progress}%` }}
                              />
                              {isDelayed && (
                                <AlertTriangle className="absolute -right-1 -top-1 h-3 w-3 text-red-600" />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-sm font-medium text-muted-foreground">Leyenda:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 rounded bg-blue-600" />
              <span className="text-sm">Progreso de tarea</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 rounded bg-blue-400" />
              <span className="text-sm">Duración restante</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 rounded bg-red-400" />
              <span className="text-sm">Tarea retrasada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-4 bg-primary" />
              <span className="text-sm">Hoy</span>
            </div>
            <span className="text-sm text-muted-foreground">|</span>
            <span className="text-sm font-medium text-muted-foreground">Salud del proyecto:</span>
            {Object.entries(projectHealthConfig).map(([key, config]) => (
              <div key={key} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded-full ${config.color}`} />
                <span className="text-xs capitalize">{key}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
