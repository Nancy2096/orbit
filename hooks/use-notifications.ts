"use client"

import useSWR from "swr"
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationsResult,
} from "@/lib/notifications"

const KEY = "app-notifications"

/**
 * Hook compartido de notificaciones. Como SWR deduplica por clave, el header
 * (campana) y la sección de perfil comparten exactamente el mismo estado y se
 * actualizan juntos. Se refresca cada 60s y al reenfocar la ventana.
 */
export function useNotifications() {
  const { data, isLoading, mutate } = useSWR<NotificationsResult>(KEY, fetchNotifications, {
    refreshInterval: 60_000,
    revalidateOnFocus: true,
  })

  const notifications = data?.notifications ?? []
  const unreadCount = data?.unreadCount ?? 0
  const userId = data?.userId ?? null

  const markRead = async (key: string) => {
    if (!userId) return
    // Actualización optimista.
    mutate(
      (prev) => {
        if (!prev) return prev
        const next = prev.notifications.map((n) => (n.key === key ? { ...n, read: true } : n))
        return { ...prev, notifications: next, unreadCount: next.filter((n) => !n.read).length }
      },
      { revalidate: false },
    )
    await markNotificationRead(userId, key)
  }

  const markAllRead = async () => {
    if (!userId) return
    const keys = notifications.filter((n) => !n.read).map((n) => n.key)
    mutate(
      (prev) => {
        if (!prev) return prev
        const next = prev.notifications.map((n) => ({ ...n, read: true }))
        return { ...prev, notifications: next, unreadCount: 0 }
      },
      { revalidate: false },
    )
    await markAllNotificationsRead(userId, keys)
  }

  return { notifications, unreadCount, isLoading, markRead, markAllRead, refresh: () => mutate() }
}
