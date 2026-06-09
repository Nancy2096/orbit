"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  FolderKanban,
  ListTodo,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
  Users,
  ArrowUpRight,
  MoreHorizontal,
  Plus,
} from "lucide-react"
import Link from "next/link"

const stats = [
  {
    title: "Proyectos Activos",
    value: "12",
    change: "+2",
    changeType: "increase",
    icon: FolderKanban,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    title: "Tareas Pendientes",
    value: "47",
    change: "-5",
    changeType: "decrease",
    icon: ListTodo,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  {
    title: "Completadas Hoy",
    value: "18",
    change: "+8",
    changeType: "increase",
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    title: "Horas Registradas",
    value: "156h",
    change: "+12h",
    changeType: "increase",
    icon: Clock,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
]

const recentProjects = [
  {
    id: "1",
    name: "Campaña Navidad 2024",
    client: "TechCorp",
    progress: 75,
    tasks: { total: 24, completed: 18 },
    dueDate: "2024-12-15",
    status: "on-track",
    team: [
      { name: "María García", initials: "MG" },
      { name: "Carlos López", initials: "CL" },
      { name: "Ana Martínez", initials: "AM" },
    ],
  },
  {
    id: "2",
    name: "Rediseño Web",
    client: "StartupX",
    progress: 45,
    tasks: { total: 32, completed: 14 },
    dueDate: "2024-12-20",
    status: "at-risk",
    team: [
      { name: "Pedro Sánchez", initials: "PS" },
      { name: "Laura Ruiz", initials: "LR" },
    ],
  },
  {
    id: "3",
    name: "App Mobile v2",
    client: "FinanceApp",
    progress: 90,
    tasks: { total: 18, completed: 16 },
    dueDate: "2024-12-10",
    status: "on-track",
    team: [
      { name: "Diego Torres", initials: "DT" },
      { name: "Elena Vega", initials: "EV" },
      { name: "Roberto Díaz", initials: "RD" },
    ],
  },
]

const upcomingTasks = [
  {
    id: "1",
    title: "Revisar diseños de landing page",
    project: "Campaña Navidad 2024",
    dueDate: "Hoy",
    priority: "alta",
    assignee: { name: "María García", initials: "MG" },
  },
  {
    id: "2",
    title: "Implementar módulo de pagos",
    project: "App Mobile v2",
    dueDate: "Mañana",
    priority: "alta",
    assignee: { name: "Diego Torres", initials: "DT" },
  },
  {
    id: "3",
    title: "Crear contenido para redes",
    project: "Campaña Navidad 2024",
    dueDate: "En 2 días",
    priority: "media",
    assignee: { name: "Ana Martínez", initials: "AM" },
  },
  {
    id: "4",
    title: "Testing de integración",
    project: "Rediseño Web",
    dueDate: "En 3 días",
    priority: "baja",
    assignee: { name: "Pedro Sánchez", initials: "PS" },
  },
]

const teamActivity = [
  {
    user: { name: "María García", initials: "MG" },
    action: "completó la tarea",
    target: "Diseño de banner principal",
    time: "Hace 5 min",
  },
  {
    user: { name: "Carlos López", initials: "CL" },
    action: "comentó en",
    target: "Revisión de copy",
    time: "Hace 15 min",
  },
  {
    user: { name: "Ana Martínez", initials: "AM" },
    action: "creó la tarea",
    target: "Optimización SEO",
    time: "Hace 30 min",
  },
  {
    user: { name: "Diego Torres", initials: "DT" },
    action: "actualizó el estado de",
    target: "Implementación API",
    time: "Hace 1 hora",
  },
]

export default function OrbitDashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido de vuelta, María. Aquí está el resumen de hoy.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Dic 2024
          </Button>
          <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <Badge
                  variant={stat.changeType === "increase" ? "default" : "secondary"}
                  className={
                    stat.changeType === "increase"
                      ? "bg-green-100 text-green-700 hover:bg-green-100"
                      : "bg-red-100 text-red-700 hover:bg-red-100"
                  }
                >
                  {stat.change}
                </Badge>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Proyectos Recientes</CardTitle>
              <CardDescription>Estado de tus proyectos activos</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/orbit-tasksflow/projects">
                Ver todos
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/orbit-tasksflow/projects/${project.id}`}
                      className="font-medium hover:underline truncate"
                    >
                      {project.name}
                    </Link>
                    <Badge
                      variant={project.status === "on-track" ? "default" : "destructive"}
                      className={
                        project.status === "on-track"
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : ""
                      }
                    >
                      {project.status === "on-track" ? "En tiempo" : "En riesgo"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{project.client}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex-1">
                      <Progress value={project.progress} className="h-2" />
                    </div>
                    <span className="text-sm font-medium">{project.progress}%</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {project.tasks.completed}/{project.tasks.total} tareas
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Vence: {project.dueDate}
                    </span>
                  </div>
                </div>
                <div className="flex -space-x-2">
                  {project.team.slice(0, 3).map((member, idx) => (
                    <Avatar key={idx} className="h-8 w-8 border-2 border-background">
                      <AvatarFallback className="text-xs">{member.initials}</AvatarFallback>
                    </Avatar>
                  ))}
                  {project.team.length > 3 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted border-2 border-background text-xs">
                      +{project.team.length - 3}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Team Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Actividad del Equipo</CardTitle>
            <CardDescription>Últimas actualizaciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamActivity.map((activity, idx) => (
              <div key={idx} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{activity.user.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user.name}</span>{" "}
                    <span className="text-muted-foreground">{activity.action}</span>{" "}
                    <span className="font-medium">{activity.target}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">Tareas Próximas</CardTitle>
            <CardDescription>Tareas que requieren tu atención</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/orbit-tasksflow/tasks">
              Ver todas
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {upcomingTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-lg border hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge
                    variant="outline"
                    className={
                      task.priority === "alta"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : task.priority === "media"
                        ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                        : "border-gray-200 bg-gray-50 text-gray-700"
                    }
                  >
                    {task.priority}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                <h4 className="font-medium text-sm mb-1 line-clamp-2">{task.title}</h4>
                <p className="text-xs text-muted-foreground mb-3">{task.project}</p>
                <div className="flex items-center justify-between">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px]">{task.assignee.initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">{task.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
