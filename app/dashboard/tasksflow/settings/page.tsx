"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Settings, 
  ArrowLeft, 
  Plus, 
  Pencil, 
  Trash2,
  Tag,
  ListTodo,
  Layers,
  AlertCircle,
  Save,
  Building2
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface TaskStatus {
  id: string
  name: string
  color: string
  sort_order: number
  is_default: boolean
}

interface TaskPriority {
  id: string
  name: string
  color: string
  level: number
}

interface TaskCategory {
  id: string
  name: string
  description: string
  color: string
}

// Default statuses for demo
const defaultStatuses: TaskStatus[] = [
  { id: "1", name: "Pendiente", color: "#6b7280", sort_order: 1, is_default: true },
  { id: "2", name: "En Progreso", color: "#3b82f6", sort_order: 2, is_default: false },
  { id: "3", name: "En Revisión", color: "#f59e0b", sort_order: 3, is_default: false },
  { id: "4", name: "Completada", color: "#10b981", sort_order: 4, is_default: false },
  { id: "5", name: "Cancelada", color: "#ef4444", sort_order: 5, is_default: false },
]

const defaultPriorities: TaskPriority[] = [
  { id: "1", name: "Crítica", color: "#ef4444", level: 1 },
  { id: "2", name: "Alta", color: "#f59e0b", level: 2 },
  { id: "3", name: "Media", color: "#3b82f6", level: 3 },
  { id: "4", name: "Baja", color: "#6b7280", level: 4 },
]

const defaultCategories: TaskCategory[] = [
  { id: "1", name: "Diseño", description: "Tareas de diseño gráfico y UI/UX", color: "#8b5cf6" },
  { id: "2", name: "Desarrollo", description: "Tareas de desarrollo y programación", color: "#3b82f6" },
  { id: "3", name: "Contenido", description: "Redacción y creación de contenido", color: "#10b981" },
  { id: "4", name: "Marketing", description: "Estrategia y campañas de marketing", color: "#f59e0b" },
  { id: "5", name: "Administración", description: "Tareas administrativas y gestión", color: "#6b7280" },
]

export default function TasksFlowSettingsPage() {
  const supabase = createClient()
  const { toast } = useToast()
  
  const [statuses, setStatuses] = useState<TaskStatus[]>(defaultStatuses)
  const [priorities, setPriorities] = useState<TaskPriority[]>(defaultPriorities)
  const [categories, setCategories] = useState<TaskCategory[]>(defaultCategories)
  
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [priorityDialogOpen, setPriorityDialogOpen] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  
  const [editingStatus, setEditingStatus] = useState<TaskStatus | null>(null)
  const [editingPriority, setEditingPriority] = useState<TaskPriority | null>(null)
  const [editingCategory, setEditingCategory] = useState<TaskCategory | null>(null)
  
  // Settings
  const [settings, setSettings] = useState({
    enableTimeTracking: true,
    enableSubtasks: true,
    enableDependencies: true,
    enableAttachments: true,
    enableComments: true,
    defaultView: "kanban",
    workingHoursPerDay: 8,
    notifyOnAssignment: true,
    notifyOnDueDate: true,
    notifyOnStatusChange: true,
  })

  const handleSaveSettings = () => {
    toast({
      title: "Configuración guardada",
      description: "Los cambios se han guardado correctamente.",
    })
  }

  const handleAddStatus = () => {
    setEditingStatus({
      id: "",
      name: "",
      color: "#3b82f6",
      sort_order: statuses.length + 1,
      is_default: false
    })
    setStatusDialogOpen(true)
  }

  const handleEditStatus = (status: TaskStatus) => {
    setEditingStatus(status)
    setStatusDialogOpen(true)
  }

  const handleSaveStatus = () => {
    if (!editingStatus) return
    
    if (editingStatus.id) {
      setStatuses(statuses.map(s => s.id === editingStatus.id ? editingStatus : s))
    } else {
      setStatuses([...statuses, { ...editingStatus, id: Date.now().toString() }])
    }
    setStatusDialogOpen(false)
    setEditingStatus(null)
    toast({ title: "Estado guardado" })
  }

  const handleDeleteStatus = (id: string) => {
    setStatuses(statuses.filter(s => s.id !== id))
    toast({ title: "Estado eliminado" })
  }

  const handleAddPriority = () => {
    setEditingPriority({
      id: "",
      name: "",
      color: "#3b82f6",
      level: priorities.length + 1
    })
    setPriorityDialogOpen(true)
  }

  const handleSavePriority = () => {
    if (!editingPriority) return
    
    if (editingPriority.id) {
      setPriorities(priorities.map(p => p.id === editingPriority.id ? editingPriority : p))
    } else {
      setPriorities([...priorities, { ...editingPriority, id: Date.now().toString() }])
    }
    setPriorityDialogOpen(false)
    setEditingPriority(null)
    toast({ title: "Prioridad guardada" })
  }

  const handleAddCategory = () => {
    setEditingCategory({
      id: "",
      name: "",
      description: "",
      color: "#3b82f6"
    })
    setCategoryDialogOpen(true)
  }

  const handleSaveCategory = () => {
    if (!editingCategory) return
    
    if (editingCategory.id) {
      setCategories(categories.map(c => c.id === editingCategory.id ? editingCategory : c))
    } else {
      setCategories([...categories, { ...editingCategory, id: Date.now().toString() }])
    }
    setCategoryDialogOpen(false)
    setEditingCategory(null)
    toast({ title: "Categoría guardada" })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/tasksflow">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Configuración de TasksFlow</h1>
            <p className="text-sm text-muted-foreground">Estados, prioridades, categorías y preferencias</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="statuses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="statuses" className="flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            Estados
          </TabsTrigger>
          <TabsTrigger value="priorities" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Prioridades
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Categorías
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
        </TabsList>

        {/* Estados */}
        <TabsContent value="statuses" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Estados de Tareas</CardTitle>
                <CardDescription>Define los estados por los que pasan las tareas</CardDescription>
              </div>
              <Button onClick={handleAddStatus}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Estado
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Color</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Orden</TableHead>
                    <TableHead>Por Defecto</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statuses.sort((a, b) => a.sort_order - b.sort_order).map((status) => (
                    <TableRow key={status.id}>
                      <TableCell>
                        <div 
                          className="w-6 h-6 rounded-full" 
                          style={{ backgroundColor: status.color }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{status.name}</TableCell>
                      <TableCell>{status.sort_order}</TableCell>
                      <TableCell>
                        {status.is_default && (
                          <Badge variant="secondary">Por defecto</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditStatus(status)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteStatus(status.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prioridades */}
        <TabsContent value="priorities" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Niveles de Prioridad</CardTitle>
                <CardDescription>Define los niveles de urgencia de las tareas</CardDescription>
              </div>
              <Button onClick={handleAddPriority}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Prioridad
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Color</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priorities.sort((a, b) => a.level - b.level).map((priority) => (
                    <TableRow key={priority.id}>
                      <TableCell>
                        <div 
                          className="w-6 h-6 rounded-full" 
                          style={{ backgroundColor: priority.color }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{priority.name}</TableCell>
                      <TableCell>{priority.level}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setEditingPriority(priority)
                              setPriorityDialogOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setPriorities(priorities.filter(p => p.id !== priority.id))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categorías */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Categorías de Tareas</CardTitle>
                <CardDescription>Organiza las tareas por tipo de trabajo</CardDescription>
              </div>
              <Button onClick={handleAddCategory}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Categoría
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <Card key={category.id} className="relative">
                    <div 
                      className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
                      style={{ backgroundColor: category.color }}
                    />
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{category.name}</CardTitle>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingCategory(category)
                              setCategoryDialogOpen(true)
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCategories(categories.filter(c => c.id !== category.id))}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General */}
        <TabsContent value="general" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Funcionalidades</CardTitle>
                <CardDescription>Habilitar o deshabilitar características</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Registro de tiempo</Label>
                    <p className="text-sm text-muted-foreground">Permitir trackear tiempo en tareas</p>
                  </div>
                  <Switch 
                    checked={settings.enableTimeTracking}
                    onCheckedChange={(checked) => setSettings({...settings, enableTimeTracking: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Subtareas</Label>
                    <p className="text-sm text-muted-foreground">Permitir crear subtareas</p>
                  </div>
                  <Switch 
                    checked={settings.enableSubtasks}
                    onCheckedChange={(checked) => setSettings({...settings, enableSubtasks: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dependencias</Label>
                    <p className="text-sm text-muted-foreground">Permitir dependencias entre tareas</p>
                  </div>
                  <Switch 
                    checked={settings.enableDependencies}
                    onCheckedChange={(checked) => setSettings({...settings, enableDependencies: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Archivos adjuntos</Label>
                    <p className="text-sm text-muted-foreground">Permitir subir archivos</p>
                  </div>
                  <Switch 
                    checked={settings.enableAttachments}
                    onCheckedChange={(checked) => setSettings({...settings, enableAttachments: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Comentarios</Label>
                    <p className="text-sm text-muted-foreground">Permitir comentarios en tareas</p>
                  </div>
                  <Switch 
                    checked={settings.enableComments}
                    onCheckedChange={(checked) => setSettings({...settings, enableComments: checked})}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notificaciones</CardTitle>
                <CardDescription>Configurar alertas y avisos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Al asignar tarea</Label>
                    <p className="text-sm text-muted-foreground">Notificar cuando te asignan una tarea</p>
                  </div>
                  <Switch 
                    checked={settings.notifyOnAssignment}
                    onCheckedChange={(checked) => setSettings({...settings, notifyOnAssignment: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Fecha de vencimiento</Label>
                    <p className="text-sm text-muted-foreground">Recordar antes de que venza</p>
                  </div>
                  <Switch 
                    checked={settings.notifyOnDueDate}
                    onCheckedChange={(checked) => setSettings({...settings, notifyOnDueDate: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cambio de estado</Label>
                    <p className="text-sm text-muted-foreground">Notificar cambios en tus tareas</p>
                  </div>
                  <Switch 
                    checked={settings.notifyOnStatusChange}
                    onCheckedChange={(checked) => setSettings({...settings, notifyOnStatusChange: checked})}
                  />
                </div>

                <div className="pt-4 border-t space-y-3">
                  <div className="space-y-2">
                    <Label>Vista por defecto</Label>
                    <Select 
                      value={settings.defaultView}
                      onValueChange={(value) => setSettings({...settings, defaultView: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kanban">Tablero Kanban</SelectItem>
                        <SelectItem value="list">Lista de Tareas</SelectItem>
                        <SelectItem value="calendar">Calendario</SelectItem>
                        <SelectItem value="gantt">Diagrama Gantt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Horas laborales por día</Label>
                    <Input 
                      type="number"
                      min="1"
                      max="24"
                      value={settings.workingHoursPerDay}
                      onChange={(e) => setSettings({...settings, workingHoursPerDay: parseInt(e.target.value) || 8})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Configuración
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStatus?.id ? "Editar Estado" : "Nuevo Estado"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input 
                value={editingStatus?.name || ""}
                onChange={(e) => setEditingStatus(editingStatus ? {...editingStatus, name: e.target.value} : null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                <Input 
                  type="color"
                  className="w-14 h-10 p-1"
                  value={editingStatus?.color || "#3b82f6"}
                  onChange={(e) => setEditingStatus(editingStatus ? {...editingStatus, color: e.target.value} : null)}
                />
                <Input 
                  value={editingStatus?.color || ""}
                  onChange={(e) => setEditingStatus(editingStatus ? {...editingStatus, color: e.target.value} : null)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Orden</Label>
              <Input 
                type="number"
                min="1"
                value={editingStatus?.sort_order || 1}
                onChange={(e) => setEditingStatus(editingStatus ? {...editingStatus, sort_order: parseInt(e.target.value) || 1} : null)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={editingStatus?.is_default || false}
                onCheckedChange={(checked) => setEditingStatus(editingStatus ? {...editingStatus, is_default: checked} : null)}
              />
              <Label>Estado por defecto para nuevas tareas</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveStatus}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Priority Dialog */}
      <Dialog open={priorityDialogOpen} onOpenChange={setPriorityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPriority?.id ? "Editar Prioridad" : "Nueva Prioridad"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input 
                value={editingPriority?.name || ""}
                onChange={(e) => setEditingPriority(editingPriority ? {...editingPriority, name: e.target.value} : null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                <Input 
                  type="color"
                  className="w-14 h-10 p-1"
                  value={editingPriority?.color || "#3b82f6"}
                  onChange={(e) => setEditingPriority(editingPriority ? {...editingPriority, color: e.target.value} : null)}
                />
                <Input 
                  value={editingPriority?.color || ""}
                  onChange={(e) => setEditingPriority(editingPriority ? {...editingPriority, color: e.target.value} : null)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nivel (menor = más urgente)</Label>
              <Input 
                type="number"
                min="1"
                value={editingPriority?.level || 1}
                onChange={(e) => setEditingPriority(editingPriority ? {...editingPriority, level: parseInt(e.target.value) || 1} : null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriorityDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSavePriority}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory?.id ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input 
                value={editingCategory?.name || ""}
                onChange={(e) => setEditingCategory(editingCategory ? {...editingCategory, name: e.target.value} : null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea 
                value={editingCategory?.description || ""}
                onChange={(e) => setEditingCategory(editingCategory ? {...editingCategory, description: e.target.value} : null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                <Input 
                  type="color"
                  className="w-14 h-10 p-1"
                  value={editingCategory?.color || "#3b82f6"}
                  onChange={(e) => setEditingCategory(editingCategory ? {...editingCategory, color: e.target.value} : null)}
                />
                <Input 
                  value={editingCategory?.color || ""}
                  onChange={(e) => setEditingCategory(editingCategory ? {...editingCategory, color: e.target.value} : null)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveCategory}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
