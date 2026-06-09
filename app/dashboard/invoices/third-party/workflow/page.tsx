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
  FileText,
  Mail,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  UserCheck,
  Receipt,
  DollarSign
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface WorkflowConfig {
  id?: string
  status_code: string
  status_name: string
  description: string
  color: string
  icon: typeof FileText
  // Email on enter
  notify_on_enter: boolean
  notify_email: string
  email_subject_template: string
  email_body_template: string
  // Next status
  next_status: string
  action_button_label: string
  action_requires_approval: boolean
  approval_email: string
}

const defaultStatuses: WorkflowConfig[] = [
  {
    status_code: "draft",
    status_name: "Borrador",
    description: "Pago registrado, pendiente de validación",
    color: "gray",
    icon: FileText,
    notify_on_enter: true,
    notify_email: "",
    email_subject_template: "Nuevo pago por cuenta de cliente pendiente de validación: {{payment_number}}",
    email_body_template: "Se ha registrado un nuevo pago por cuenta de cliente:\n\nNúmero: {{payment_number}}\nProveedor: {{vendor_name}}\nCliente: {{client_name}}\nMonto Original: {{original_amount}}\nComisión: {{commission_amount}}\nTotal a Facturar: {{total_amount}}\n\nPor favor revise y valide este pago.",
    next_status: "validated",
    action_button_label: "Validar Pago",
    action_requires_approval: true,
    approval_email: "",
  },
  {
    status_code: "validated",
    status_name: "Validado",
    description: "Pago aprobado, listo para generar factura",
    color: "blue",
    icon: CheckCircle2,
    notify_on_enter: true,
    notify_email: "",
    email_subject_template: "Pago validado: {{payment_number}}",
    email_body_template: "El pago por cuenta de cliente {{payment_number}} ha sido validado.\n\nCliente: {{client_name}}\nTotal a Facturar: {{total_amount}}\n\nYa puede generar la factura correspondiente.",
    next_status: "invoiced",
    action_button_label: "Generar Factura",
    action_requires_approval: false,
    approval_email: "",
  },
  {
    status_code: "rejected",
    status_name: "Rechazado",
    description: "Pago rechazado en validación",
    color: "red",
    icon: XCircle,
    notify_on_enter: true,
    notify_email: "",
    email_subject_template: "Pago rechazado: {{payment_number}}",
    email_body_template: "El pago por cuenta de cliente {{payment_number}} ha sido rechazado.\n\nMotivo: {{rejection_reason}}\n\nPor favor revise y corrija la información.",
    next_status: "",
    action_button_label: "",
    action_requires_approval: false,
    approval_email: "",
  },
  {
    status_code: "invoiced",
    status_name: "Facturado",
    description: "Factura emitida al cliente, esperando reembolso",
    color: "yellow",
    icon: Receipt,
    notify_on_enter: true,
    notify_email: "",
    email_subject_template: "Factura generada para pago: {{payment_number}}",
    email_body_template: "Se ha generado la factura {{invoice_number}} para el pago por cuenta de cliente {{payment_number}}.\n\nCliente: {{client_name}}\nTotal: {{total_amount}}\n\nEsperando reembolso del cliente.",
    next_status: "paid",
    action_button_label: "Registrar Reembolso",
    action_requires_approval: false,
    approval_email: "",
  },
  {
    status_code: "paid",
    status_name: "Reembolsado",
    description: "Cliente ha reembolsado el pago",
    color: "green",
    icon: DollarSign,
    notify_on_enter: true,
    notify_email: "",
    email_subject_template: "Reembolso recibido: {{payment_number}}",
    email_body_template: "Se ha recibido el reembolso del cliente para el pago {{payment_number}}.\n\nCliente: {{client_name}}\nMonto: {{total_amount}}\nComisión ganada: {{commission_amount}}",
    next_status: "",
    action_button_label: "",
    action_requires_approval: false,
    approval_email: "",
  },
]

const colorOptions = [
  { value: "gray", label: "Gris", class: "bg-gray-500" },
  { value: "blue", label: "Azul", class: "bg-blue-500" },
  { value: "green", label: "Verde", class: "bg-green-500" },
  { value: "yellow", label: "Amarillo", class: "bg-yellow-500" },
  { value: "red", label: "Rojo", class: "bg-red-500" },
  { value: "purple", label: "Morado", class: "bg-purple-500" },
  { value: "orange", label: "Naranja", class: "bg-orange-500" },
]

export default function ThirdPartyWorkflowPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [configs, setConfigs] = useState<WorkflowConfig[]>(defaultStatuses)
  const [activeTab, setActiveTab] = useState("draft")

  useEffect(() => {
    fetchWorkflowConfigs()
  }, [])

  const fetchWorkflowConfigs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("third_party_payment_workflow_config")
      .select("*")
      .order("status_code")

    if (error) {
      console.log("No workflow config found, using defaults")
      setConfigs(defaultStatuses)
    } else if (data && data.length > 0) {
      // Merge saved configs with defaults
      const mergedConfigs = defaultStatuses.map(defaultConfig => {
        const savedConfig = data.find(d => d.status_code === defaultConfig.status_code)
        return savedConfig ? { ...defaultConfig, ...savedConfig } : defaultConfig
      })
      setConfigs(mergedConfigs)
    }
    setLoading(false)
  }

  const updateConfig = (statusCode: string, field: keyof WorkflowConfig, value: unknown) => {
    setConfigs(prev => prev.map(config => 
      config.status_code === statusCode ? { ...config, [field]: value } : config
    ))
  }

  const handleSave = async () => {
    setSaving(true)
    
    // First, try to create the table if it doesn't exist
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS third_party_payment_workflow_config (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          status_code VARCHAR(50) UNIQUE NOT NULL,
          status_name VARCHAR(100) NOT NULL,
          description TEXT,
          color VARCHAR(20) DEFAULT 'gray',
          notify_on_enter BOOLEAN DEFAULT false,
          notify_email TEXT,
          email_subject_template TEXT,
          email_body_template TEXT,
          next_status VARCHAR(50),
          action_button_label VARCHAR(100),
          action_requires_approval BOOLEAN DEFAULT false,
          approval_email TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })

    // Save each config
    for (const config of configs) {
      const { error } = await supabase
        .from("third_party_payment_workflow_config")
        .upsert({
          status_code: config.status_code,
          status_name: config.status_name,
          description: config.description,
          color: config.color,
          notify_on_enter: config.notify_on_enter,
          notify_email: config.notify_email,
          email_subject_template: config.email_subject_template,
          email_body_template: config.email_body_template,
          next_status: config.next_status,
          action_button_label: config.action_button_label,
          action_requires_approval: config.action_requires_approval,
          approval_email: config.approval_email,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'status_code' })

      if (error) {
        console.error("Error saving config:", error)
      }
    }

    setSaving(false)
    toast.success("Configuración guardada correctamente")
  }

  const currentConfig = configs.find(c => c.status_code === activeTab)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/invoices/third-party">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Flujo de Trabajo - Pago por Cuenta de Cliente</h1>
            <p className="text-muted-foreground">
              Configura los estados, notificaciones y emails del flujo de trabajo
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
              Guardar Configuración
            </>
          )}
        </Button>
      </div>

      {/* Workflow Diagram */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Diagrama del Flujo</CardTitle>
          <CardDescription>
            Visualización de los estados y transiciones del flujo de trabajo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 flex-wrap py-4">
            {configs.filter(c => c.status_code !== "rejected").map((config, index, arr) => (
              <div key={config.status_code} className="flex items-center gap-2">
                <div 
                  className={`flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    activeTab === config.status_code 
                      ? "border-primary bg-primary/5" 
                      : "border-muted hover:border-muted-foreground/30"
                  }`}
                  onClick={() => setActiveTab(config.status_code)}
                >
                  <Badge 
                    variant="outline" 
                    className={`mb-1 ${
                      config.color === "gray" ? "bg-gray-100 text-gray-700 border-gray-300" :
                      config.color === "blue" ? "bg-blue-100 text-blue-700 border-blue-300" :
                      config.color === "green" ? "bg-green-100 text-green-700 border-green-300" :
                      config.color === "yellow" ? "bg-yellow-100 text-yellow-700 border-yellow-300" :
                      config.color === "red" ? "bg-red-100 text-red-700 border-red-300" :
                      "bg-gray-100"
                    }`}
                  >
                    {config.status_name}
                  </Badge>
                  <span className="text-xs text-muted-foreground text-center max-w-[100px]">
                    {config.description.substring(0, 30)}...
                  </span>
                </div>
                {index < arr.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
          {/* Rejected state separate */}
          <div className="flex justify-center mt-4 pt-4 border-t">
            <div 
              className={`flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                activeTab === "rejected" 
                  ? "border-primary bg-primary/5" 
                  : "border-muted hover:border-muted-foreground/30"
              }`}
              onClick={() => setActiveTab("rejected")}
            >
              <Badge variant="outline" className="mb-1 bg-red-100 text-red-700 border-red-300">
                Rechazado
              </Badge>
              <span className="text-xs text-muted-foreground">(desde Borrador)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="draft" className="gap-2">
            <FileText className="h-4 w-4" />
            Borrador
          </TabsTrigger>
          <TabsTrigger value="validated" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Validado
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rechazado
          </TabsTrigger>
          <TabsTrigger value="invoiced" className="gap-2">
            <Receipt className="h-4 w-4" />
            Facturado
          </TabsTrigger>
          <TabsTrigger value="paid" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Reembolsado
          </TabsTrigger>
        </TabsList>

        {configs.map(config => (
          <TabsContent key={config.status_code} value={config.status_code} className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <config.icon className="h-5 w-5" />
                  Configuración del Estado: {config.status_name}
                </CardTitle>
                <CardDescription>
                  Información básica y comportamiento del estado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre del Estado</Label>
                    <Input
                      value={config.status_name}
                      onChange={(e) => updateConfig(config.status_code, "status_name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex gap-2">
                      {colorOptions.map(color => (
                        <button
                          key={color.value}
                          onClick={() => updateConfig(config.status_code, "color", color.value)}
                          className={`w-8 h-8 rounded-full ${color.class} ${
                            config.color === color.value ? "ring-2 ring-offset-2 ring-primary" : ""
                          }`}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Input
                    value={config.description}
                    onChange={(e) => updateConfig(config.status_code, "description", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificaciones
                </CardTitle>
                <CardDescription>
                  Configura las notificaciones por email cuando un pago entra en este estado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enviar notificación al entrar en este estado</Label>
                    <p className="text-sm text-muted-foreground">
                      Se enviará un email cuando un pago cambie a este estado
                    </p>
                  </div>
                  <Switch
                    checked={config.notify_on_enter}
                    onCheckedChange={(checked) => updateConfig(config.status_code, "notify_on_enter", checked)}
                  />
                </div>

                {config.notify_on_enter && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Email(s) de notificación</Label>
                        <Input
                          placeholder="email1@ejemplo.com, email2@ejemplo.com"
                          value={config.notify_email}
                          onChange={(e) => updateConfig(config.status_code, "notify_email", e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Separa múltiples emails con comas
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Asunto del Email</Label>
                        <Input
                          value={config.email_subject_template}
                          onChange={(e) => updateConfig(config.status_code, "email_subject_template", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cuerpo del Email</Label>
                        <Textarea
                          rows={6}
                          value={config.email_body_template}
                          onChange={(e) => updateConfig(config.status_code, "email_body_template", e.target.value)}
                        />
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs font-medium mb-2">Variables disponibles:</p>
                          <div className="flex flex-wrap gap-2">
                            {["{{payment_number}}", "{{vendor_name}}", "{{client_name}}", "{{original_amount}}", "{{commission_amount}}", "{{total_amount}}", "{{rejection_reason}}", "{{invoice_number}}"].map(variable => (
                              <Badge key={variable} variant="secondary" className="text-xs">
                                {variable}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Transitions */}
            {config.next_status && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowRight className="h-5 w-5" />
                    Transición al Siguiente Estado
                  </CardTitle>
                  <CardDescription>
                    Configura el comportamiento de la acción principal
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Siguiente Estado</Label>
                      <Input
                        value={configs.find(c => c.status_code === config.next_status)?.status_name || config.next_status}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Texto del Botón de Acción</Label>
                      <Input
                        value={config.action_button_label}
                        onChange={(e) => updateConfig(config.status_code, "action_button_label", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Requiere Aprobación
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Solicitar aprobación por email antes de cambiar de estado
                      </p>
                    </div>
                    <Switch
                      checked={config.action_requires_approval}
                      onCheckedChange={(checked) => updateConfig(config.status_code, "action_requires_approval", checked)}
                    />
                  </div>

                  {config.action_requires_approval && (
                    <div className="space-y-2">
                      <Label>Email del Aprobador</Label>
                      <Input
                        placeholder="aprobador@ejemplo.com"
                        value={config.approval_email}
                        onChange={(e) => updateConfig(config.status_code, "approval_email", e.target.value)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Help Section */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Información del Flujo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong>Borrador:</strong> Estado inicial cuando se registra un nuevo pago. Requiere validación.</p>
          <p><strong>Validado:</strong> Pago aprobado, listo para generar la factura al cliente.</p>
          <p><strong>Rechazado:</strong> Pago rechazado durante la validación. No se puede facturar.</p>
          <p><strong>Facturado:</strong> Se ha generado la factura al cliente. Esperando reembolso.</p>
          <p><strong>Reembolsado:</strong> El cliente ha pagado la factura. Proceso completado.</p>
        </CardContent>
      </Card>
    </div>
  )
}
