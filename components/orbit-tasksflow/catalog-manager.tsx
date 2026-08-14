"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, Plus, Pencil, Trash2, Check, X } from "lucide-react"
import { useCatalog, type CatalogItem } from "@/lib/orbit-tasksflow/catalogs"
import type { LucideIcon } from "lucide-react"

interface CatalogManagerProps {
  title: string
  description: string
  icon: LucideIcon
  storageKey: string
  defaults: CatalogItem[]
  itemNoun: string
  embedded?: boolean
}

export function CatalogManager({
  title,
  description,
  icon: Icon,
  storageKey,
  defaults,
  itemNoun,
  embedded = false,
}: CatalogManagerProps) {
  const { items, addItem, updateItem, removeItem } = useCatalog(storageKey, defaults)

  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<CatalogItem | null>(null)

  const handleAdd = () => {
    if (!newName.trim()) return
    addItem(newName)
    setNewName("")
  }

  const startEdit = (item: CatalogItem) => {
    setEditingId(item.id)
    setEditingValue(item.name)
  }

  const saveEdit = () => {
    if (editingId && editingValue.trim()) {
      updateItem(editingId, editingValue)
    }
    setEditingId(null)
    setEditingValue("")
  }

  return (
    <div className={embedded ? "space-y-6" : "p-6 space-y-6"}>
      {/* Header */}
      {!embedded && (
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/orbit-tasksflow">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Icon className="h-6 w-6" />
              {title}
            </h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Add form */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Agregar {itemNoun}
            </CardTitle>
            <CardDescription>Crea un nuevo {itemNoun.toLowerCase()} para las tareas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder={`Nombre del ${itemNoun.toLowerCase()}`}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                  e.preventDefault()
                  handleAdd()
                }
              }}
            />
            <Button className="w-full" onClick={handleAdd} disabled={!newName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant="secondary">{items.length}</Badge>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-10">
                <Icon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Aún no hay {itemNoun.toLowerCase()}s. Agrega el primero.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-muted/40 transition-colors"
                  >
                    {editingId === item.id ? (
                      <>
                        <Input
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                              e.preventDefault()
                              saveEdit()
                            } else if (e.key === "Escape") {
                              setEditingId(null)
                            }
                          }}
                          autoFocus
                          className="h-9"
                        />
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={saveEdit}>
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="font-medium">{item.name}</span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => startEdit(item)}
                            aria-label={`Editar ${item.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setDeleteTarget(item)}
                            aria-label={`Eliminar ${item.name}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar {itemNoun.toLowerCase()}</DialogTitle>
            <DialogDescription>
              ¿Seguro que deseas eliminar &quot;{deleteTarget?.name}&quot;? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget) removeItem(deleteTarget.id)
                setDeleteTarget(null)
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
