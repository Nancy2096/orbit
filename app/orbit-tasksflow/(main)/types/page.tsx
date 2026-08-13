"use client"

import { Tag } from "lucide-react"
import { CatalogManager } from "@/components/orbit-tasksflow/catalog-manager"
import { TASK_TYPES_STORAGE_KEY, defaultTaskTypes } from "@/lib/orbit-tasksflow/catalogs"

export default function TaskTypesPage() {
  return (
    <CatalogManager
      title="Tipo"
      description="Define los tipos de tarea disponibles en Orbit TasksFlow"
      icon={Tag}
      storageKey={TASK_TYPES_STORAGE_KEY}
      defaults={defaultTaskTypes}
      itemNoun="Tipo"
    />
  )
}
