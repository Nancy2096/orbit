"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Save, 
  Bell, 
  Clock, 
  FileText,
  Mail,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Send,
  UserCheck,
  CalendarClock,
  MailWarning
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface WorkflowConfig {
  id?: string
  status_code: string
  status_name: string
  description: string
  color: string
  // Email on enter
  notify_on_enter: boolean
  notify_validator_email: string
  email_subject_template: string
  email_body_template: string
  // Send to client
  send_to_client_on_enter: boolean
  // Next status
  next_status_after_action: string
  action_button_label: string
  action_requires_approval: boolean
  approval_email: string
  // Auto transition
  auto_transition_to: string
  auto_transition_days: number | null
  // Reminders
  send_reminder_on_overdue: boolean
  reminder_email_subject: string
  reminder_email_body: string
  days_before_reminder: number | null
  reminder_frequency_days: number | null
}

const defaultStatuses: WorkflowConfig[] = [
  {
    status_code: "draft",
    status_name: "Borrador",
    description: "Factura en proceso de creación",
    color: "gray",
    notify_on_enter: true,
    notify_validator_email: "",
    email_subject_template: "Nueva factura pendiente de validación: {{invoice_number}}",
    email_body_template: "Se ha creado una nueva factura {{invoice_number}} para el cliente {{client_name}} por un monto de {{total_amount}}. Por favor revise y valide la factura.",
    send_to_client_on_enter: false,
    next_status_after_action: "validated",
    action_button_label: "Validar Factura",
    action_requires_approval: true,
    approval_email: "",
    auto_transition_to: "",
    auto_transition_days: null,
    send_reminder_on_overdue: false,
    reminder_email_subject: "",
    reminder_email_body: "",
    days_before_reminder: null,
    reminder_frequency_days: null,
  },
  {
    status_code: "validated",
    status_name: "Validado",
    description: "Factura aprobada, lista para enviar al cliente",
    color: "blue",
    notify_on_enter: false,
    notify_validator_email: "",
    email_subject_template: "",
    email_body_template: "",
    send_to_client_on_enter: true,
    next_status_after_action: "pending",
    action_button_label: "Enviar al Cliente",
    action_requires_approval: false,
    approval_email: "",
    auto_transition_to: "",
    auto_transition_days: null,
    send_reminder_on_overdue: false,
    reminder_email_subject: "",
    reminder_email_body: "",
    days_before_reminder: null,
    reminder_frequency_days: null,
  },
  {
    status_code: "pending",
    status_name: "Por Cobrar",
    description: "Factura enviada al cliente, esperando pago",
    color: "yellow",
    notify_on_enter: false,
    notify_validator_email: "",
    email_subject_template: "Factura {{invoice_number}} - {{client_name}}",
    email_body_template: "Estimado {{client_name}},\n\nAdjunto encontrará la factura {{invoice_number}} por un monto de {{total_amount}}.\n\nFecha de vencimiento: {{due_date}}\n\nGracias por su preferencia.",
    send_to_client_on_enter: true,
    next_status_after_action: "paid",
    action_button_label: "Registrar Pago",
    action_requires_approval: false,
    approval_email: "",
    auto_transition_to: "overdue",
    auto_transition_days: 30,
    send_reminder_on_overdue: false,
    reminder_email_subject: "",
    reminder_email_body: "",
    days_before_reminder: 5,
    reminder_frequency_days: 7,
  },
  {
    status_code: "paid",
    status_name: "Pagado",
    description: "Factura completamente pagada",
    color: "green",
    notify_on_enter: true,
    notify_validator_email: "",
    email_subject_template: "Pago recibido - Factura {{invoice_number}}",
    email_body_template: "Se ha registrado el pago de la factura {{invoice_number}} del cliente {{client_name}}.",
    send_to_client_on_enter: true,
    next_status_after_action: "",
    action_button_label: "",
    action_requires_approval: false,
    approval_email: "",
    auto_transition_to: "",
    auto_transition_days: null,
    send_reminder_on_overdue: false,
    reminder_email_subject: "",
    reminder_email_body: "",
    days_before_reminder: null,
    reminder_frequency_days: null,
  },
  {
    status_code: "overdue",
    status_name: "Vencido",
    description: "Factura con fecha de pago vencida",
    color: "red",
    notify_on_enter: true,
    notify_validator_email: "",
    email_subject_template: "Factura vencida - {{invoice_number}}",
    email_body_template: "La factura {{invoice_number}} del cliente {{client_name}} ha vencido. Monto pendiente: {{total_amount}}.",
    send_to_client_on_enter: true,
    next_status_after_action: "paid",
    action_button_label: "Registrar Pago",
    action_requires_approval: false,
    approval_email: "",
    auto_transition_to: "",
    auto_transition_days: null,
    send_reminder_on_overdue: true,
    reminder_email_subject: "Recordatorio: Factura {{invoice_number}} vencida",
    reminder_email_body: "Estimado {{client_name}},\n\nLe recordamos que la factura {{invoice_number}} por {{total_amount}} se encuentra vencida desde el {{due_date}}.\n\nPor favor realice el pago a la brevedad posible.\n\nGracias.",
    days_before_reminder: 0,
    reminder_frequency_days: 7,
  },
  {
    status_code: "cancelled",
    status_name: "Cancelado",
    description: "Factura anulada",
    color: "slate",
    notify_on_enter: true,
    notify_validator_email: "",
    email_subject_template: "Factura cancelada - {{invoice_number}}",
    email_body_template: "La factura {{invoice_number}} ha sido cancelada.",
    send_to_client_on_enter: false,
    next_status_after_action: "",
    action_button_label: "",
    action_requires_approval: false,
    approval_email: "",
    auto_transition_to: "",
    auto_transition_days: null,
    send_reminder_on_overdue: false,
    reminder_email_subject: "",
    reminder_email_body: "",
    days_before_reminder: null,
    reminder_frequency_days: null,
  },
]

const colorOptions = [
  { value: "gray", label: "Gris", class: "bg-gray-500" },
  { value: "blue", label: "Azul", class: "bg-blue-500" },
  { value: "yellow", label: "Amarillo", class: "bg-yellow-500" },
  { value: "green", label: "Verde", class: "bg-green-500" },
  { value: "red", label: "Rojo", class: "bg-red-500" },
  { value: "slate", label: "Slate", class: "bg-slate-500" },
]

const variablesHelp = [
  { variable: "{{invoice_number}}", description: "Número de factura" },
  { variable: "{{client_name}}", description: "Nombre del cliente" },
  { variable: "{{client_email}}", description: "Email del cliente" },
  { variable: "{{total_amount}}", description: "Monto total" },
  { variable: "{{due_date}}", description: "Fecha de vencimiento" },
  { variable: "{{issue_date}}", description: "Fecha de emisión" },
  { variable: "{{days_overdue}}", description: "Días vencido" },
]

export default function InvoiceWorkflowPage() {
  const [configs, setConfigs] = useState<WorkflowConfig[]>(defaultStatuses)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeStatus, setActiveStatus] = useState("draft")
  const supabase = createClient()

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("invoice_status_rules")
      .select("*")
      .order("sort_order")

    if (error) {
      console.error("Error fetching configs:", error)
      setLoading(false)
      return
    }

    if (data && data.length > 0) {
      // Merge database data with defaults
      const mergedConfigs = defaultStatuses.map(defaultConfig => {
        const dbConfig = data.find(d => d.status_code === defaultConfig.status_code)
        if (dbConfig) {
          return {
            ...defaultConfig,
            ...dbConfig,
          }
        }
        return defaultConfig
      })
      setConfigs(mergedConfigs)
    }
    setLoading(false)
  }

  const updateConfig = (statusCode: string, field: keyof WorkflowConfig, value: unknown) => {
    setConfigs(prev => prev.map(config => 
      config.status_code === statusCode 
        ? { ...config, [field]: value }
        : config
    ))
  }

  const getConfig = (statusCode: string): WorkflowConfig => {
    return configs.find(c => c.status_code === statusCode) || defaultStatuses[0]
  }

  const handleSave = async () => {
    setSaving(true)

    for (const config of configs) {
      const { id, ...configData } = config
      
      if (id) {
        // Update existing
        const { error } = await supabase
          .from("invoice_status_rules")
          .update({
            ...configData,
            updated_at: new Date().toISOString()
          })
          .eq("id", id)

        if (error) {
          toast.error(`Error al guardar ${config.status_name}`)
          console.error(error)
          setSaving(false)
          return
        }
      } else {
        // Insert new
        const { error } = await supabase
          .from("invoice_status_rules")
          .upsert({
            ...configData,
            sort_order: configs.indexOf(config) + 1
          }, { onConflict: "status_code" })

        if (error) {
          toast.error(`Error al guardar ${config.status_name}`)
          console.error(error)
          setSaving(false)
          return
        }
      }
    }

    toast.success("Configuración guardada exitosamente")
    setSaving(false)
    fetchConfigs()
  }

  const activeConfig = getConfig(activeStatus)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Flujo de Trabajo de Facturas</h1>
            <p className="text-muted-foreground">
              Configura las acciones automáticas para cada estado de las facturas
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>

      {/* Workflow Diagram */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Diagrama del Flujo
          </CardTitle>
          <CardDescription>
            Visualización del flujo de estados de las facturas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 flex-wrap py-4">
            {configs.map((config, index) => {
              const colorClass = colorOptions.find(c => c.value === config.color)?.class || "bg-gray-500"
              const isActive = activeStatus === config.status_code
              return (
                <div key={config.status_code} className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveStatus(config.status_code)}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      isActive 
                        ? "border-primary bg-primary/5 shadow-md" 
                        : "border-transparent hover:border-muted-foreground/20 hover:bg-muted/50"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center text-white mb-1`}>
                      {config.status_code === "draft" && <FileText className="h-5 w-5" />}
                      {config.status_code === "validated" && <UserCheck className="h-5 w-5" />}
                      {config.status_code === "pending" && <Clock className="h-5 w-5" />}
                      {config.status_code === "paid" && <CheckCircle2 className="h-5 w-5" />}
                      {config.status_code === "overdue" && <AlertTriangle className="h-5 w-5" />}
                      {config.status_code === "cancelled" && <XCircle className="h-5 w-5" />}
                    </div>
                    <span className={`text-xs font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                      {config.status_name}
                    </span>
                  </button>
                  {index < configs.length - 1 && config.status_code !== "cancelled" && config.status_code !== "paid" && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              )
            })}
          </div>
          <div className="text-center text-sm text-muted-foreground mt-2">
            Haz clic en un estado para configurar sus acciones
          </div>
        </CardContent>
      </Card>

      {/* Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${colorOptions.find(c => c.value === activeConfig.color)?.class || "bg-gray-500"} flex items-center justify-center text-white`}>
                {activeConfig.status_code === "draft" && <FileText className="h-5 w-5" />}
                {activeConfig.status_code === "validated" && <UserCheck className="h-5 w-5" />}
                {activeConfig.status_code === "pending" && <Clock className="h-5 w-5" />}
                {activeConfig.status_code === "paid" && <CheckCircle2 className="h-5 w-5" />}
                {activeConfig.status_code === "overdue" && <AlertTriangle className="h-5 w-5" />}
                {activeConfig.status_code === "cancelled" && <XCircle className="h-5 w-5" />}
              </div>
              <div>
                <CardTitle>{activeConfig.status_name}</CardTitle>
                <CardDescription>{activeConfig.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Variables Disponibles</Label>
              <div className="mt-2 space-y-1">
                {variablesHelp.map(v => (
                  <div key={v.variable} className="flex justify-between text-xs">
                    <code className="bg-muted px-1 rounded">{v.variable}</code>
                    <span className="text-muted-foreground">{v.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Configuración de Acciones</CardTitle>
            <CardDescription>
              Define qué sucede cuando una factura entra en el estado "{activeConfig.status_name}"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="notifications" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="notifications">
                  <Bell className="h-4 w-4 mr-2" />
                  Notificaciones
                </TabsTrigger>
                <TabsTrigger value="emails">
                  <Mail className="h-4 w-4 mr-2" />
                  Emails
                </TabsTrigger>
                <TabsTrigger value="transitions">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Transiciones
                </TabsTrigger>
                <TabsTrigger value="reminders">
                  <MailWarning className="h-4 w-4 mr-2" />
                  Recordatorios
                </TabsTrigger>
              </TabsList>

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="space-y-6 pt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base">Notificar al entrar en este estado</Label>
                      <p className="text-sm text-muted-foreground">
                        Enviar notificación cuando una factura cambie a "{activeConfig.status_name}"
                      </p>
                    </div>
                    <Switch
                      checked={activeConfig.notify_on_enter}
                      onCheckedChange={(checked) => updateConfig(activeStatus, "notify_on_enter", checked)}
                    />
                  </div>

                  {activeConfig.status_code === "draft" && (
                    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-blue-500" />
                        <Label className="text-base">Validador de Facturas</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Email de la persona que debe validar las facturas antes de enviarlas al cliente
                      </p>
                      <Input
                        type="email"
                        placeholder="validador@empresa.com"
                        value={activeConfig.notify_validator_email || ""}
                        onChange={(e) => updateConfig(activeStatus, "notify_validator_email", e.target.value)}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base">Enviar email al cliente</Label>
                      <p className="text-sm text-muted-foreground">
                        Enviar automáticamente un email al cliente cuando la factura entre en este estado
                      </p>
                    </div>
                    <Switch
                      checked={activeConfig.send_to_client_on_enter}
                      onCheckedChange={(checked) => updateConfig(activeStatus, "send_to_client_on_enter", checked)}
                    />
                  </div>

                  {activeConfig.action_requires_approval && (
                    <div className="space-y-3 p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <Label className="text-base">Requiere Aprobación</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Este estado requiere que alguien apruebe la factura antes de continuar
                      </p>
                      <Input
                        type="email"
                        placeholder="aprobador@empresa.com"
                        value={activeConfig.approval_email || ""}
                        onChange={(e) => updateConfig(activeStatus, "approval_email", e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Emails Tab */}
              <TabsContent value="emails" className="space-y-6 pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Asunto del Email</Label>
                    <Input
                      placeholder="Ej: Factura {{invoice_number}} - {{client_name}}"
                      value={activeConfig.email_subject_template || ""}
                      onChange={(e) => updateConfig(activeStatus, "email_subject_template", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Cuerpo del Email</Label>
                    <Textarea
                      placeholder="Escribe el contenido del email usando las variables disponibles..."
                      value={activeConfig.email_body_template || ""}
                      onChange={(e) => updateConfig(activeStatus, "email_body_template", e.target.value)}
                      rows={8}
                    />
                    <p className="text-xs text-muted-foreground">
                      Usa las variables como {"{{client_name}}"} para personalizar el mensaje
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Transitions Tab */}
              <TabsContent value="transitions" className="space-y-6 pt-4">
                <div className="space-y-4">
                  {activeConfig.next_status_after_action && (
                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        <Label className="text-base">Acción Principal</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{activeConfig.status_name}</Badge>
                        <ArrowRight className="h-4 w-4" />
                        <Badge variant="default">
                          {configs.find(c => c.status_code === activeConfig.next_status_after_action)?.status_name || activeConfig.next_status_after_action}
                        </Badge>
                      </div>
                      <Input
                        value={activeConfig.action_button_label || ""}
                        onChange={(e) => updateConfig(activeStatus, "action_button_label", e.target.value)}
                        placeholder="Texto del botón de acción"
                      />
                    </div>
                  )}

                  {(activeConfig.status_code === "pending") && (
                    <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20 space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <Label className="text-base">Transición Automática por Vencimiento</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Si pasa el tiempo de pago establecido con el cliente, la factura cambiará automáticamente a "Vencido"
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Después de</span>
                        <Input
                          type="number"
                          className="w-20"
                          min={1}
                          value={activeConfig.auto_transition_days || 30}
                          onChange={(e) => updateConfig(activeStatus, "auto_transition_days", parseInt(e.target.value) || null)}
                        />
                        <span className="text-sm">días sin pago, cambiar a</span>
                        <Badge variant="destructive">Vencido</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Nota: Se usará el plazo de pago configurado en cada cliente si está disponible
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base">Requiere Aprobación</Label>
                      <p className="text-sm text-muted-foreground">
                        La acción requiere aprobación antes de ejecutarse
                      </p>
                    </div>
                    <Switch
                      checked={activeConfig.action_requires_approval}
                      onCheckedChange={(checked) => updateConfig(activeStatus, "action_requires_approval", checked)}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Reminders Tab */}
              <TabsContent value="reminders" className="space-y-6 pt-4">
                {activeConfig.status_code === "overdue" || activeConfig.status_code === "pending" ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label className="text-base">Enviar Recordatorios</Label>
                        <p className="text-sm text-muted-foreground">
                          Enviar recordatorios automáticos al cliente sobre facturas pendientes/vencidas
                        </p>
                      </div>
                      <Switch
                        checked={activeConfig.send_reminder_on_overdue}
                        onCheckedChange={(checked) => updateConfig(activeStatus, "send_reminder_on_overdue", checked)}
                      />
                    </div>

                    {activeConfig.send_reminder_on_overdue && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Días antes del vencimiento</Label>
                            <Input
                              type="number"
                              min={0}
                              value={activeConfig.days_before_reminder || 0}
                              onChange={(e) => updateConfig(activeStatus, "days_before_reminder", parseInt(e.target.value) || 0)}
                            />
                            <p className="text-xs text-muted-foreground">
                              0 = solo después de vencido
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label>Frecuencia de recordatorios</Label>
                            <Input
                              type="number"
                              min={1}
                              value={activeConfig.reminder_frequency_days || 7}
                              onChange={(e) => updateConfig(activeStatus, "reminder_frequency_days", parseInt(e.target.value) || 7)}
                            />
                            <p className="text-xs text-muted-foreground">
                              Cada cuántos días enviar
                            </p>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <Label>Asunto del Recordatorio</Label>
                          <Input
                            placeholder="Recordatorio: Factura {{invoice_number}} pendiente"
                            value={activeConfig.reminder_email_subject || ""}
                            onChange={(e) => updateConfig(activeStatus, "reminder_email_subject", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Cuerpo del Recordatorio</Label>
                          <Textarea
                            placeholder="Estimado {{client_name}}, le recordamos que la factura..."
                            value={activeConfig.reminder_email_body || ""}
                            onChange={(e) => updateConfig(activeStatus, "reminder_email_body", e.target.value)}
                            rows={6}
                          />
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MailWarning className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Los recordatorios solo están disponibles para estados "Por Cobrar" y "Vencido"</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen del Flujo de Trabajo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">1. Borrador</p>
                <p className="text-sm text-muted-foreground">
                  Al crear una factura, se envía un email al validador ({getConfig("draft").notify_validator_email || "no configurado"}) para su revisión y aprobación.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
                <UserCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">2. Validado</p>
                <p className="text-sm text-muted-foreground">
                  Una vez validada, la factura está lista para enviarse al cliente. {getConfig("validated").send_to_client_on_enter ? "Se enviará automáticamente al email del cliente." : "Se deberá enviar manualmente."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white shrink-0">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">3. Por Cobrar</p>
                <p className="text-sm text-muted-foreground">
                  Factura enviada al cliente, esperando pago. Si pasan más de {getConfig("pending").auto_transition_days || 30} días (o el plazo configurado con el cliente), pasa automáticamente a Vencido.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white shrink-0">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">4. Vencido</p>
                <p className="text-sm text-muted-foreground">
                  {getConfig("overdue").send_reminder_on_overdue 
                    ? `Se envían recordatorios automáticos cada ${getConfig("overdue").reminder_frequency_days || 7} días al cliente.`
                    : "Los recordatorios automáticos están desactivados."
                  }
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">5. Pagado</p>
                <p className="text-sm text-muted-foreground">
                  Al registrar el pago completo, {getConfig("paid").send_to_client_on_enter ? "se envía confirmación al cliente." : "no se envía notificación al cliente."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
