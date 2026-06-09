"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { 
  ArrowLeft,
  Save,
  Trash,
  Plus,
  GripVertical,
  Settings,
  X
} from "lucide-react"
import { toast } from "sonner"

// Mock dashboard data
const mockDashboards: Record<string, {
  id: string
  name: string
  description: string
  isShared: boolean
}> = {
  "dash1": { id: "dash1", name: "Performance General", description: "Vista general de todas las campañas", isShared: true },
  "dash2": { id: "dash2", name: "ROI por Canal", description: "Análisis de retorno por canal de marketing", isShared: false },
  "dash3": { id: "dash3", name: "Embudo de Conversión", description: "Seguimiento del funnel de ventas", isShared: true },
  "dash4": { id: "dash4", name: "Social Media Metrics", description: "Métricas de redes sociales", isShared: false },
  "dash5": { id: "dash5", name: "Leads Overview", description: "Estado y calidad de leads", isShared: true }
}

const mockWidgets = [
  { id: "w1", type: "kpi", title: "Gasto Total", size: "small" },
  { id: "w2", type: "kpi", title: "Impresiones", size: "small" },
  { id: "w3", type: "kpi", title: "Clics", size: "small" },
  { id: "w4", type: "kpi", title: "Conversiones", size: "small" },
  { id: "w5", type: "chart", title: "Tendencia de Gasto", size: "medium" },
  { id: "w6", type: "chart", title: "Rendimiento por Canal", size: "medium" },
  { id: "w7", type: "chart", title: "Distribución de Presupuesto", size: "small" },
  { id: "w8", type: "table", title: "Top Campañas", size: "large" }
]

export default function EditDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  
  const dashboard = mockDashboards[resolvedParams.id]
  
  const [formData, setFormData] = useState({
    name: dashboard?.name || "",
    description: dashboard?.description || "",
    isShared: dashboard?.isShared || false
  })
  const [widgets, setWidgets] = useState(mockWidgets)
  const [saving, setSaving] = useState(false)

  if (!dashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Dashboard no encontrado</p>
        <Button asChild>
          <Link href="/orbit-marketing-intelligence/dashboards">Volver a Dashboards</Link>
        </Button>
      </div>
    )
  }

  const handleSave = async () => {
    setSaving(true)
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    toast.success("Dashboard guardado correctamente")
    router.push(`/orbit-marketing-intelligence/dashboards/${resolvedParams.id}`)
  }

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id))
    toast.success("Widget eliminado")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/orbit-marketing-intelligence/dashboards/${resolvedParams.id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Dashboard</h1>
            <p className="text-muted-foreground">Configura el dashboard y sus widgets</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/orbit-marketing-intelligence/dashboards/${resolvedParams.id}`}>
              Cancelar
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
            <CardDescription>Información básica del dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input 
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea 
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compartir Dashboard</Label>
                <p className="text-xs text-muted-foreground">
                  Permitir que otros usuarios vean este dashboard
                </p>
              </div>
              <Switch 
                checked={formData.isShared}
                onCheckedChange={(checked) => setFormData({ ...formData, isShared: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Widgets Panel */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Widgets</CardTitle>
              <CardDescription>Arrastra para reordenar los widgets</CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Widget
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {widgets.map((widget) => (
                <div 
                  key={widget.id} 
                  className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                  <div className="flex-1">
                    <p className="font-medium">{widget.title}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {widget.type} - {widget.size}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeWidget(widget.id)}
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
              {widgets.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay widgets en este dashboard</p>
                  <Button variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Widget
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Zona de Peligro</CardTitle>
          <CardDescription>Acciones irreversibles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Eliminar Dashboard</p>
              <p className="text-sm text-muted-foreground">
                Esta acción no se puede deshacer
              </p>
            </div>
            <Button variant="destructive">
              <Trash className="h-4 w-4 mr-2" />
              Eliminar Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
