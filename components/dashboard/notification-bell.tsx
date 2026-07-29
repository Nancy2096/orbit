"use client"

import { useRouter } from "next/navigation"
import { Bell, GraduationCap, Receipt, CalendarDays, Award, Check, MessagesSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotifications } from "@/hooks/use-notifications"
import type { AppNotification, NotificationType } from "@/lib/notifications"
import { cn } from "@/lib/utils"

const ICONS: Record<NotificationType, typeof Bell> = {
  course: GraduationCap,
  expense: Receipt,
  leave: CalendarDays,
  bonus: Award,
  one2one: MessagesSquare,
}

export function NotificationBell() {
  const router = useRouter()
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()

  const handleOpen = async (n: AppNotification) => {
    await markRead(n.key)
    router.push(n.href)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : "Notificaciones"}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notificaciones</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} sin leer` : "Estás al día"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => markAllRead()}>
              <Check className="h-3.5 w-3.5" />
              Marcar todas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No tienes notificaciones</p>
            </div>
          ) : (
            <ul className="divide-y">
              {notifications.map((n) => {
                const Icon = ICONS[n.type] ?? Bell
                return (
                  <li key={n.key}>
                    <button
                      type="button"
                      onClick={() => handleOpen(n)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60",
                        !n.read && "bg-primary/5",
                      )}
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Icon className="h-4 w-4 text-foreground" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{n.title}</span>
                          {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground line-clamp-2">{n.description}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
