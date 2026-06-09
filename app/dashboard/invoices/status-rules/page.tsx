"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { 
  ArrowLeft, 
  Save, 
  Bell, 
  Shield, 
  Clock, 
  FileText,
  Mail,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Info
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

interface StatusRule {
  id: string
  status_code: string
  status_name: string
  description: string
  color: string
  sort_order: number
  auto_transition_to: string | null
  auto_transition_days: number | null
  requires_approval: boolean
  can_edit_invoice: boolean
  can_delete_invoice: boolean
  can_add_payments: boolean
  notify_on_enter: boolean
  notify_client: boolean
  notify_account_manager: boolean
  notify_finance_team: boolean
  days_before_reminder: number | null
  reminder_frequency_days: number | null
  is_active: boolean
}

const colorOptions = [
  { value: "gray", label: "Gris", class: "bg-gray-100 text-gray-800" },
  { value: "blue", label: "Azul", class: "bg-blue-100 text-blue-800" },
  { value: "yellow", label: "Amarillo", class: "bg-yellow-100 text-yellow-800" },
  { value: "green", label: "Verde", class: "bg-green-100 text-green-800" },
  { value: "red", label: "Rojo", class: "bg-red-100 text-red-800" },
  { value: "slate", label: "Pizarra", class: "bg-slate-100 text-slate-800" },
  { value: "purple", label: "Morado", class: "bg-purple-100 text-purple-800" },
  { value: "orange", label: "Naranja", class: "bg-orange-100 text-orange-800" },
]

const getColorClass = (color: string) => {
  return colorOptions.find(c => c.value === color)?.class || "bg-gray-100 text-gray-800"
}

export default function InvoiceStatusRulesPage() {
  const [statusRules, setStatusRules] = useState<StatusRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    fetchStatusRules()
  }, [])

  async function fetchStatusRules() {
    const { data, error } = await supabase
      .from("invoice_status_rules")
      .select("*")
      .is("agency_id", null)
      .order("sort_order")

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las reglas de estado",
        variant: "destructive",
      })
    } else {
      setStatusRules(data || [])
    }
    setLoading(false)
  }

  async function handleSaveRule(rule: StatusRule) {
    setSaving(true)
    const { error } = await supabase
      .from("invoice_status_rules")
      .update({
        status_name: rule.status_name,
        description: rule.description,
        color: rule.color,
        auto_transition_to: rule.auto_transition_to,
        auto_transition_days: rule.auto_transition_days,
        requires_approval: rule.requires_approval,
        can_edit_invoice: rule.can_edit_invoice,
        can_delete_invoice: rule.can_delete_invoice,
        can_add_payments: rule.can_add_payments,
        notify_on_enter: rule.notify_on_enter,
        notify_client: rule.notify_client,
        notify_account_manager: rule.notify_account_manager,
        notify_finance_team: rule.notify_finance_team,
        days_before_reminder: rule.days_before_reminder,
        reminder_frequency_days: rule.reminder_frequency_days,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rule.id)

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la regla",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Guardado",
        description: `Reglas de "${rule.status_name}" actualizadas correctamente`,
      })
    }
    setSaving(false)
  }

  function updateRule(id: string, field: keyof StatusRule, value: any) {
    setStatusRules(prev => 
      prev.map(rule => 
        rule.id === id ? { ...rule, [field]: value } : rule
      )
    )
  }

  if (!mounted) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reglas de Estados</h1>
            <p className="text-muted-foreground">
              Configura las reglas y notificaciones para cada estado de factura
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="flex items-start gap-3 pt-4">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Flujo de estados de factura</p>
            <p>
              Las facturas siguen el flujo: <strong>Borrador</strong> → <strong>Validado</strong> → <strong>Por Cobrar</strong> → <strong>Pagado</strong>. 
              Si la fecha de vencimiento pasa sin pago, el estado cambia automáticamente a <strong>Vencido</strong>. 
              En cualquier momento se puede <strong>Cancelar</strong> una factura.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status Rules */}
      <Accordion type="single" collapsible className="space-y-4">
        {statusRules.map((rule) => (
          <AccordionItem key={rule.id} value={rule.id} className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-4">
                <Badge className={getColorClass(rule.color)}>
                  {rule.status_name}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {rule.description}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="general" className="gap-2">
                    <FileText className="h-4 w-4" />
                    General
                  </TabsTrigger>
                  <TabsTrigger value="rules" className="gap-2">
                    <Shield className="h-4 w-4" />
                    Reglas
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="gap-2">
                    <Bell className="h-4 w-4" />
                    Notificaciones
                  </TabsTrigger>
                  <TabsTrigger value="automation" className="gap-2">
                    <Clock className="h-4 w-4" />
                    Automatización
                  </TabsTrigger>
                </TabsList>

                {/* General Tab */}
                <TabsContent value="general">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Información General</CardTitle>
                      <CardDescription>Nombre, descripción y apariencia del estado</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FieldGroup>
                        <div className="grid grid-cols-2 gap-4">
                          <Field>
                            <FieldLabel>Nombre del estado</FieldLabel>
                            <Input
                              value={rule.status_name}
                              onChange={(e) => updateRule(rule.id, "status_name", e.target.value)}
                            />
                          </Field>
                          <Field>
                            <FieldLabel>Color</FieldLabel>
                            <Select
                              value={rule.color}
                              onValueChange={(value) => updateRule(rule.id, "color", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {colorOptions.map((color) => (
                                  <SelectItem key={color.value} value={color.value}>
                                    <div className="flex items-center gap-2">
                                      <Badge className={color.class}>{color.label}</Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>
                        </div>
                        <Field>
                          <FieldLabel>Descripción</FieldLabel>
                          <Textarea
                            value={rule.description || ""}
                            onChange={(e) => updateRule(rule.id, "description", e.target.value)}
                            rows={2}
                          />
                        </Field>
                      </FieldGroup>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Rules Tab */}
                <TabsContent value="rules">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Reglas de Comportamiento</CardTitle>
                      <CardDescription>Define qué acciones están permitidas en este estado</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">Editar factura</p>
                                <p className="text-sm text-muted-foreground">Permite modificar los datos de la factura</p>
                              </div>
                            </div>
                            <Switch
                              checked={rule.can_edit_invoice}
                              onCheckedChange={(checked) => updateRule(rule.id, "can_edit_invoice", checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <XCircle className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">Eliminar factura</p>
                                <p className="text-sm text-muted-foreground">Permite eliminar la factura del sistema</p>
                              </div>
                            </div>
                            <Switch
                              checked={rule.can_delete_invoice}
                              onCheckedChange={(checked) => updateRule(rule.id, "can_delete_invoice", checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">Registrar pagos</p>
                                <p className="text-sm text-muted-foreground">Permite agregar pagos a la factura</p>
                              </div>
                            </div>
                            <Switch
                              checked={rule.can_add_payments}
                              onCheckedChange={(checked) => updateRule(rule.id, "can_add_payments", checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Shield className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">Requiere aprobación</p>
                                <p className="text-sm text-muted-foreground">Se necesita autorización para este estado</p>
                              </div>
                            </div>
                            <Switch
                              checked={rule.requires_approval}
                              onCheckedChange={(checked) => updateRule(rule.id, "requires_approval", checked)}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Configuración de Notificaciones</CardTitle>
                      <CardDescription>Define quién recibe notificaciones cuando la factura entra en este estado</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Bell className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Activar notificaciones</p>
                              <p className="text-sm text-muted-foreground">Enviar notificaciones al entrar en este estado</p>
                            </div>
                          </div>
                          <Switch
                            checked={rule.notify_on_enter}
                            onCheckedChange={(checked) => updateRule(rule.id, "notify_on_enter", checked)}
                          />
                        </div>

                        {rule.notify_on_enter && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-4 border-l-2 border-primary">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Cliente</p>
                                  <p className="text-sm text-muted-foreground">Notificar al cliente</p>
                                </div>
                              </div>
                              <Switch
                                checked={rule.notify_client}
                                onCheckedChange={(checked) => updateRule(rule.id, "notify_client", checked)}
                              />
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Account Manager</p>
                                  <p className="text-sm text-muted-foreground">Notificar al responsable</p>
                                </div>
                              </div>
                              <Switch
                                checked={rule.notify_account_manager}
                                onCheckedChange={(checked) => updateRule(rule.id, "notify_account_manager", checked)}
                              />
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Equipo Finanzas</p>
                                  <p className="text-sm text-muted-foreground">Notificar a finanzas</p>
                                </div>
                              </div>
                              <Switch
                                checked={rule.notify_finance_team}
                                onCheckedChange={(checked) => updateRule(rule.id, "notify_finance_team", checked)}
                              />
                            </div>
                          </div>
                        )}

                        {(rule.status_code === "pending" || rule.status_code === "overdue") && (
                          <div className="space-y-4 pt-4 border-t">
                            <h4 className="font-medium flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              Recordatorios de pago
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <Field>
                                <FieldLabel>Días antes del vencimiento</FieldLabel>
                                <Input
                                  type="number"
                                  min="0"
                                  value={rule.days_before_reminder || ""}
                                  onChange={(e) => updateRule(rule.id, "days_before_reminder", e.target.value ? parseInt(e.target.value) : null)}
                                  placeholder="Ej: 5"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Enviar recordatorio X días antes de vencer
                                </p>
                              </Field>
                              <Field>
                                <FieldLabel>Frecuencia de recordatorios (días)</FieldLabel>
                                <Input
                                  type="number"
                                  min="1"
                                  value={rule.reminder_frequency_days || ""}
                                  onChange={(e) => updateRule(rule.id, "reminder_frequency_days", e.target.value ? parseInt(e.target.value) : null)}
                                  placeholder="Ej: 7"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Repetir cada X días si sigue pendiente
                                </p>
                              </Field>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Automation Tab */}
                <TabsContent value="automation">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Transiciones Automáticas</CardTitle>
                      <CardDescription>Configura cambios de estado automáticos basados en tiempo</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Field>
                            <FieldLabel>Cambiar automáticamente a</FieldLabel>
                            <Select
                              value={rule.auto_transition_to || "none"}
                              onValueChange={(value) => updateRule(rule.id, "auto_transition_to", value === "none" ? null : value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Ninguno" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Ninguno</SelectItem>
                                {statusRules
                                  .filter(s => s.status_code !== rule.status_code)
                                  .map((status) => (
                                    <SelectItem key={status.status_code} value={status.status_code}>
                                      {status.status_name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </Field>
                          <Field>
                            <FieldLabel>Después de (días)</FieldLabel>
                            <Input
                              type="number"
                              min="1"
                              value={rule.auto_transition_days || ""}
                              onChange={(e) => updateRule(rule.id, "auto_transition_days", e.target.value ? parseInt(e.target.value) : null)}
                              placeholder="Ej: 30"
                              disabled={!rule.auto_transition_to}
                            />
                          </Field>
                        </div>
                        {rule.auto_transition_to && (
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm">
                              <strong>Regla activa:</strong> Las facturas en estado "{rule.status_name}" 
                              cambiarán automáticamente a "{statusRules.find(s => s.status_code === rule.auto_transition_to)?.status_name}" 
                              después de {rule.auto_transition_days || "?"} días.
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Save Button */}
              <div className="flex justify-end mt-4">
                <Button 
                  onClick={() => handleSaveRule(rule)}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar cambios
                    </>
                  )}
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
