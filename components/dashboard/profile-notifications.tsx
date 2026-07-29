"use client"

import Link from "next/link"
import { Bell, GraduationCap, Receipt, CalendarDays, Award, Check, ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useNotifications } from "@/hooks/use-notifications"
import type { NotificationType } from "@/lib/notifications"
import { cn } from "@/lib/utils"

const ICONS: Record<NotificationType, typeof Bell> = {
  course: GraduationCap,
  expense: Receipt,
  leave: CalendarDays,
  bonus: Award,
}

const TYPE_LABELS: Record<NotificationType, string> = {
  course: "Capacitación",
  expense: "Gasto",
  leave: "Día libre",
  bonus: "Bono",
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })
  } catch {
    return ""
  }
}

export function ProfileNotifications() {
  const { notifications, unreadCount, isLoading, markRead, markAllRead } = useNotifications()

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </CardTitle>
          <CardDescription>
            Cursos esenciales asignados y pendientes que requieren tu aprobación (gastos, bonos y días libres).
          </CardDescription>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="shrink-0 gap-1" onClick={() => markAllRead()}>
            <Check className="h-4 w-4" />
            Marcar todas como leídas
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Cargando notificaciones...</p>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Bell className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium">No tienes notificaciones</p>
            <p className="text-xs text-muted-foreground">
              Aquí verás tus cursos obligatorios y las solicitudes que debas revisar.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {notifications.map((n) => {
              const Icon = ICONS[n.type] ?? Bell
              return (
                <li key={n.key}>
                  <Link
                    href={n.href}
                    onClick={() => markRead(n.key)}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/60",
                      !n.read && "border-primary/30 bg-primary/5",
                    )}
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-4 w-4 text-foreground" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{n.title}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {TYPE_LABELS[n.type]}
                        </Badge>
                        {!n.read && (
                          <span className="h-2 w-2 rounded-full bg-primary" aria-label="Sin leer" />
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{n.description}</p>
                      <p className="mt-1 text-xs text-muted-foreground/70">{formatDate(n.createdAt)}</p>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
