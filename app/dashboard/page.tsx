import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Shield, FolderKanban } from "lucide-react"

async function getDashboardStats() {
  const supabase = await createClient()

  const [
    { count: agencyCount },
    { count: userCount },
    { count: activeUserCount },
    { count: roleCount },
  ] = await Promise.all([
    supabase.from("agencies").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("roles").select("*", { count: "exact", head: true }),
  ])

  return {
    totalAgencies: agencyCount || 0,
    totalUsers: userCount || 0,
    activeUsers: activeUserCount || 0,
    totalRoles: roleCount || 0,
  }
}

async function getRecentUsers() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("users")
    .select(`
      *,
      role:roles(display_name)
    `)
    .order("created_at", { ascending: false })
    .limit(5)

  return data || []
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()
  const recentUsers = await getRecentUsers()

  const statCards = [
    {
      title: "Agencias",
      value: stats.totalAgencies,
      description: "Agencias registradas",
      icon: Building2,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Usuarios",
      value: stats.totalUsers,
      description: `${stats.activeUsers} activos`,
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Roles",
      value: stats.totalRoles,
      description: "Roles definidos",
      icon: Shield,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      title: "Proyectos",
      value: 0,
      description: "Proyectos activos",
      icon: FolderKanban,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido al sistema de gestión multiagencia
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Usuarios Recientes</CardTitle>
            <CardDescription>
              Últimos usuarios registrados en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No hay usuarios registrados
              </p>
            ) : (
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary font-medium text-sm">
                        {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {user.first_name || user.last_name
                            ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                            : user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {user.role?.display_name || "Sin rol"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acceso Rápido</CardTitle>
            <CardDescription>
              Acciones frecuentes del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <a
                href="/dashboard/agencies/new"
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Crear Agencia</p>
                  <p className="text-xs text-muted-foreground">
                    Registrar una nueva agencia
                  </p>
                </div>
              </a>
              <a
                href="/dashboard/users/new"
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <Users className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm font-medium">Agregar Usuario</p>
                  <p className="text-xs text-muted-foreground">
                    Invitar un nuevo usuario
                  </p>
                </div>
              </a>
              <a
                href="/dashboard/roles"
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <Shield className="h-5 w-5 text-chart-3" />
                <div>
                  <p className="text-sm font-medium">Gestionar Roles</p>
                  <p className="text-xs text-muted-foreground">
                    Configurar permisos
                  </p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
