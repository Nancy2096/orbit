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

  // Sin argumentos marca todas las no leídas; con `onlyKeys` limita el efecto
  // a ese subconjunto (p. ej. solo las notificaciones One 2 One).
  const markAllRead = async (onlyKeys?: string[]) => {
    if (!userId) return
    const limit = onlyKeys ? new Set(onlyKeys) : null
    const keys = notifications
      .filter((n) => !n.read && (!limit || limit.has(n.key)))
      .map((n) => n.key)
    if (keys.length === 0) return
    const keySet = new Set(keys)
    mutate(
      (prev) => {
        if (!prev) return prev
        const next = prev.notifications.map((n) => (keySet.has(n.key) ? { ...n, read: true } : n))
        return { ...prev, notifications: next, unreadCount: next.filter((n) => !n.read).length }
      },
      { revalidate: false },
    )
    await markAllNotificationsRead(userId, keys)
  }

  return { notifications, unreadCount, isLoading, markRead, markAllRead, refresh: () => mutate() }
}
