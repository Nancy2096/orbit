"use client"

import { MessagesSquare, Check, CalendarClock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useNotifications } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })
  } catch {
    return ""
  }
}

/**
 * Muestra, dentro de la sección de Reuniones One 2 One, los recordatorios de
 * reuniones por hito (1er, 2do y 3er mes) del usuario actual, tanto como líder
 * como colaborador.
 */
export function OneToOneNotifications() {
  const { notifications, isLoading, markRead, markAllRead } = useNotifications()

  const items = notifications.filter((n) => n.type === "one2one")
  const unread = items.filter((n) => !n.read)

  if (isLoading || items.length === 0) return null

  // Agrupar los recordatorios por departamento para tener orden.
  const groups = new Map<string, typeof items>()
  for (const n of items) {
    const key = n.group || "Sin departamento"
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(n)
  }
  const orderedGroups = Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]))

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessagesSquare className="h-5 w-5 text-primary" />
            Reuniones One 2 One pendientes
          </CardTitle>
          <CardDescription>
            Recordatorios generados automáticamente según la fecha de ingreso de cada persona
            (1er, 2do y 3er mes).
          </CardDescription>
        </div>
        {unread.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1"
            onClick={() => markAllRead(items.map((n) => n.key))}
          >
            <Check className="h-4 w-4" />
            Marcar como leídas
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {orderedGroups.map(([dept, groupItems]) => (
          <div key={dept} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {dept}
              </h4>
              <Badge variant="outline" className="text-[10px]">
                {groupItems.length}
              </Badge>
            </div>
            <ul className="flex flex-col gap-2">
              {groupItems.map((n) => (
                <li
                  key={n.key}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border bg-background p-3",
                    !n.read && "border-primary/40",
                  )}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <CalendarClock className="h-4 w-4 text-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{n.title}</span>
                      {!n.read && (
                        <Badge variant="secondary" className="text-[10px]">
                          Nueva
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground/70">{formatDate(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <Button variant="ghost" size="sm" className="shrink-0 gap-1" onClick={() => markRead(n.key)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
