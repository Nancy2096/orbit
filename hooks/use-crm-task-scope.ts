"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"

export const SCOPE_MINE = "mine"
export const SCOPE_TEAM = "all"

interface TaskScopeInfo {
  userId: string
  staffIds: string[]
  canSeeTeam: boolean
}

const fetcher = async (url: string): Promise<TaskScopeInfo> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("No se pudo cargar el alcance de tareas")
  return res.json()
}

/**
 * Alcance de tareas en Calendario y Tareas. Por defecto "Mis tareas"; quienes
 * pueden ver al equipo eligen "Mis tareas", un asesor o "Todo el equipo", y se
 * recuerda su última selección por usuario.
 */
export function useCrmTaskScope() {
  const { data, isLoading } = useSWR("/api/crm/task-scope", fetcher, { revalidateOnFocus: false })
  const [scope, setScopeState] = useState<string>(SCOPE_MINE)

  const storageKey = data ? `crm-task-scope:${data.userId}` : null

  useEffect(() => {
    if (!storageKey || !data?.canSeeTeam) return
    try {
      const stored = window.localStorage.getItem(storageKey)
      if (stored) setScopeState(stored)
    } catch {
      // localStorage no disponible
    }
  }, [storageKey, data?.canSeeTeam])

  const setScope = (value: string) => {
    setScopeState(value)
    if (!storageKey) return
    try {
      window.localStorage.setItem(storageKey, value)
    } catch {
      // localStorage no disponible
    }
  }

  const canSeeTeam = data?.canSeeTeam ?? false
  const effectiveScope = canSeeTeam ? scope : SCOPE_MINE
  const myStaffIds = data?.staffIds ?? []

  /** ¿La tarea asignada a `assignedTo` entra en el alcance elegido? */
  const matches = (assignedTo: string | null | undefined): boolean => {
    if (effectiveScope === SCOPE_TEAM) return true
    if (effectiveScope === SCOPE_MINE) return !!assignedTo && myStaffIds.includes(assignedTo)
    return assignedTo === effectiveScope
  }

  return { ready: !isLoading && !!data, canSeeTeam, scope: effectiveScope, setScope, myStaffIds, matches }
}
