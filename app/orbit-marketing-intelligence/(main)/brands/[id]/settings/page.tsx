"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { getBrandById } from "@/lib/marketing-intelligence/brand-mock-data"
import { mockMIClients } from "@/lib/marketing-intelligence/mock-data"
import type { BrandStatus } from "@/lib/marketing-intelligence/brand-types"
import {
  ArrowLeft,
  Settings,
  Building2,
  ChevronRight,
  Save,
  Trash2,
  Bell,
  Users,
  ShieldCheck,
  Copy,
  Archive,
  Pause,
  CheckCircle2,
  Clock,
} from "lucide-react"

const statusOptions: { value: BrandStatus; label: string; icon: typeof CheckCircle2 }[] = [
  { value: "activo", label: "Activo", icon: CheckCircle2 },
  { value: "pausado", label: "Pausado", icon: Pause },
  { value: "borrador", label: "Borrador", icon: Clock },
  { value: "archivado", label: "Archivado", icon: Archive },
]

export default function BrandSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const brandId = params.id as string
  const brand = getBrandById(brandId)

  const [status, setStatus] = useState<BrandStatus>(brand?.status ?? "borrador")
  const [internalManager, setInternalManager] = useState(brand?.internalManager ?? "")
  const [notifications, setNotifications] = useState({
    weeklyReport: true,
    budgetAlerts: true,
    kpiAlerts: true,
    contentApprovals: false,
  })
  const [saving, setSaving] = useState(false)

  if (!brand) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <h2 className="text-xl font-semibold">Marca no encontrada</h2>
        <Button asChild>
          <Link href="/orbit-marketing-intelligence/brands">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Marcas
          </Link>
        </Button>
      </div>
    )
  }

  const client = mockMIClients.find((c) => c.id === brand.clientId)

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast.success("Configuración guardada", {
        description: "Los cambios de la marca se guardaron correctamente.",
      })
    }, 600)
  }

  const handleDuplicate = () => {
    toast.success("Marca duplicada", {
      description: `Se creó una copia de "${brand.name}" como borrador.`,
    })
  }

  const handleDelete = () => {
    toast.success("Marca eliminada", {
      description: `"${brand.name}" fue eliminada.`,
    })
    router.push("/orbit-marketing-intelligence/brands")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/orbit-marketing-intelligence/brands" className="hover:text-foreground">
              Marcas
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link
              href={`/orbit-marketing-intelligence/brands/${brandId}`}
              className="hover:text-foreground"
            >
              {brand.name}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span>Configuración</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Configuración
            </h1>
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {client?.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/orbit-marketing-intelligence/brands/${brandId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Link>
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>

      {/* General settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            General
          </CardTitle>
          <CardDescription>Estado y responsable de la marca</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="status">Estado de la marca</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as BrandStatus)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="manager">Responsable interno</Label>
            <Input
              id="manager"
              value={internalManager}
              onChange={(e) => setInternalManager(e.target.value)}
              placeholder="Nombre del responsable"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Notificaciones
          </CardTitle>
          <CardDescription>Define qué alertas se envían para esta marca</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "weeklyReport" as const, label: "Reporte semanal", desc: "Resumen de rendimiento cada lunes" },
            { key: "budgetAlerts" as const, label: "Alertas de presupuesto", desc: "Aviso cuando se supere el límite definido" },
            { key: "kpiAlerts" as const, label: "Alertas de KPIs", desc: "Notificar cuando un KPI salga de rango" },
            { key: "contentApprovals" as const, label: "Aprobaciones de contenido", desc: "Solicitudes de aprobación pendientes" },
          ].map((item, i, arr) => (
            <div key={item.key}>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  checked={notifications[item.key]}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, [item.key]: checked }))
                  }
                />
              </div>
              {i < arr.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Access & connections shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Accesos y conexiones
          </CardTitle>
          <CardDescription>Gestiona permisos e integraciones de la marca</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Button variant="outline" className="justify-between" asChild>
            <Link href={`/orbit-marketing-intelligence/brands/${brandId}/integrations`}>
              Integraciones
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" className="justify-between" asChild>
            <Link href={`/orbit-marketing-intelligence/brands/${brandId}/social`}>
              Redes sociales
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Zona de riesgo</CardTitle>
          <CardDescription>Acciones irreversibles sobre la marca</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicar marca
            </Button>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar marca
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar esta marca?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente
                  &quot;{brand.name}&quot; y toda su configuración asociada.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
