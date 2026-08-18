"use client"

import Link from "next/link"
import { ArrowLeft, Library, Tag, LayoutTemplate, Building2, CircleDot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CatalogManager } from "@/components/orbit-tasksflow/catalog-manager"
import {
  TASK_TYPES_STORAGE_KEY,
  TASK_FORMATS_STORAGE_KEY,
  AREAS_STORAGE_KEY,
  TASK_STATUSES_STORAGE_KEY,
  defaultTaskTypes,
  defaultTaskFormats,
  defaultAreas,
  defaultTaskStatuses,
} from "@/lib/orbit-tasksflow/catalogs"

export default function CatalogsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/orbit-tasksflow">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Library className="h-6 w-6" />
            Catálogos
          </h1>
          <p className="text-muted-foreground">
            Gestiona los catálogos de Tipo, Formato, Áreas y Estado de Tareas de Orbit TasksFlow
          </p>
        </div>
      </div>

      <Tabs defaultValue="types" className="w-full">
        <TabsList>
          <TabsTrigger value="types" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tipo
          </TabsTrigger>
          <TabsTrigger value="formats" className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4" />
            Formato
          </TabsTrigger>
          <TabsTrigger value="areas" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Áreas / Departamentos
          </TabsTrigger>
          <TabsTrigger value="statuses" className="flex items-center gap-2">
            <CircleDot className="h-4 w-4" />
            Estado de Tareas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="mt-6">
          <CatalogManager
            title="Tipo"
            description="Define los tipos de tarea disponibles en Orbit TasksFlow"
            icon={Tag}
            storageKey={TASK_TYPES_STORAGE_KEY}
            defaults={defaultTaskTypes}
            itemNoun="Tipo"
            embedded
          />
        </TabsContent>

        <TabsContent value="formats" className="mt-6">
          <CatalogManager
            title="Formato"
            description="Define los formatos de tarea disponibles en Orbit TasksFlow"
            icon={LayoutTemplate}
            storageKey={TASK_FORMATS_STORAGE_KEY}
            defaults={defaultTaskFormats}
            itemNoun="Formato"
            embedded
          />
        </TabsContent>

        <TabsContent value="areas" className="mt-6">
          <CatalogManager
            title="Áreas / Departamentos"
            description="Define las áreas o departamentos disponibles para los reportes"
            icon={Building2}
            storageKey={AREAS_STORAGE_KEY}
            defaults={defaultAreas}
            itemNoun="Área"
            embedded
          />
        </TabsContent>

        <TabsContent value="statuses" className="mt-6">
          <CatalogManager
            title="Estado de Tareas"
            description="Define los estados disponibles para las tareas. Los cambios se reflejan en los estados seleccionables dentro del detalle de cada tarea."
            icon={CircleDot}
            storageKey={TASK_STATUSES_STORAGE_KEY}
            defaults={defaultTaskStatuses}
            itemNoun="Estado"
            embedded
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
