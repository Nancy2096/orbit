"use client"

import { useCallback, useEffect, useState } from "react"

export type CatalogItem = {
  id: string
  name: string
}

export const TASK_TYPES_STORAGE_KEY = "orbit-tasksflow-task-types"
export const TASK_FORMATS_STORAGE_KEY = "orbit-tasksflow-task-formats"
export const AREAS_STORAGE_KEY = "orbit-tasksflow-areas"
export const TASK_STATUSES_STORAGE_KEY = "orbit-tasksflow-task-statuses"

/**
 * Estados posibles de una tarea. Los `id` coinciden con las claves usadas en el
 * detalle de tarea (taskStatusConfig) para conservar los colores conocidos;
 * los estados nuevos que agregue el usuario obtienen un color por defecto.
 */
export const defaultTaskStatuses: CatalogItem[] = [
  { id: "nueva", name: "Nueva" },
  { id: "por_asignar", name: "Por Asignar" },
  { id: "en_proceso", name: "En Proceso" },
  { id: "revision_interna", name: "Revisión Interna" },
  { id: "revision_cliente", name: "Revisión Cliente" },
  { id: "cambios_solicitados", name: "Cambios" },
  { id: "aprobada", name: "Aprobada" },
  { id: "entregada", name: "Entregada" },
  { id: "pausada", name: "Pausada" },
  { id: "cancelada", name: "Cancelada" },
  { id: "vencida", name: "Vencida" },
]

export const defaultTaskTypes: CatalogItem[] = [
  { id: "brochure", name: "Brochure" },
  { id: "cartel", name: "Cartel" },
  { id: "espectacular", name: "Espectacular" },
  { id: "lona", name: "Lona" },
  { id: "papeleria", name: "Papelería" },
  { id: "ficha-tecnica", name: "Ficha técnica" },
  { id: "invitaciones", name: "Invitaciones" },
  { id: "email", name: "Email" },
]

export const defaultTaskFormats: CatalogItem[] = [
  { id: "fijo", name: "Fijo" },
  { id: "carrusel", name: "Carrusel" },
  { id: "video", name: "Video" },
  { id: "reel", name: "Reel" },
]

export const defaultAreas: CatalogItem[] = [
  { id: "finanzas", name: "Finanzas" },
  { id: "estrategia", name: "Estrategia" },
  { id: "tecnologia", name: "Tecnología" },
  { id: "diseno-creatividad", name: "Diseño & Creatividad" },
]

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

/**
 * Persistent catalog stored in localStorage so it is shared across the
 * management pages and the task detail view within Orbit TasksFlow.
 */
export function useCatalog(storageKey: string, defaults: CatalogItem[]) {
  const [items, setItems] = useState<CatalogItem[]>(defaults)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setItems(parsed)
        }
      }
    } catch (e) {
      console.error("[v0] Error loading catalog:", e)
    }
    setLoaded(true)
  }, [storageKey])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(items))
    } catch (e) {
      console.error("[v0] Error saving catalog:", e)
    }
  }, [items, loaded, storageKey])

  const addItem = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setItems((prev) => {
      const base = slugify(trimmed) || `item-${Date.now()}`
      let id = base
      let n = 1
      while (prev.some((i) => i.id === id)) {
        id = `${base}-${n++}`
      }
      return [...prev, { id, name: trimmed }]
    })
  }, [])

  const updateItem = useCallback((id: string, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, name: trimmed } : i)))
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  return { items, loaded, addItem, updateItem, removeItem }
}
