"use client"

import { LayoutTemplate } from "lucide-react"
import { CatalogManager } from "@/components/orbit-tasksflow/catalog-manager"
import { TASK_FORMATS_STORAGE_KEY, defaultTaskFormats } from "@/lib/orbit-tasksflow/catalogs"

export default function TaskFormatsPage() {
  return (
    <CatalogManager
      title="Formato"
      description="Define los formatos de tarea disponibles en Orbit TasksFlow"
      icon={LayoutTemplate}
      storageKey={TASK_FORMATS_STORAGE_KEY}
      defaults={defaultTaskFormats}
      itemNoun="Formato"
    />
  )
}
