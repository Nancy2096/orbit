"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { 
  FileDown,
  FileUp,
  Download, 
  Upload, 
  Database, 
  Building2, 
  Users, 
  Receipt,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileSpreadsheet,
  Info,
  LayoutTemplate,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Briefcase,
  Settings
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface Agency {
  id: string
  name: string
}

interface ExportTable {
  id: string
  name: string
  label: string
  description: string
  icon: React.ReactNode
  category: string
  rowCount?: number
}

const exportTables: ExportTable[] = [
  // 1. ADMINISTRACIÓN - Clientes y Cuentas
  { id: "clients", name: "clients", label: "Clientes", description: "Empresas y clientes", icon: <Building2 className="h-4 w-4" />, category: "administracion" },
  { id: "client_contacts", name: "client_contacts", label: "Contactos de Clientes", description: "Contactos asociados a clientes", icon: <Users className="h-4 w-4" />, category: "administracion" },
  { id: "accounts", name: "accounts", label: "Cuentas/Marcas", description: "Cuentas y marcas de clientes", icon: <Briefcase className="h-4 w-4" />, category: "administracion" },
  { id: "industries", name: "industries", label: "Industrias", description: "Catálogo de industrias", icon: <Database className="h-4 w-4" />, category: "administracion" },
  { id: "referral_sources", name: "referral_sources", label: "Fuentes de Referencia", description: "Catálogo de fuentes de referencia", icon: <Database className="h-4 w-4" />, category: "administracion" },
  
  // 2. OPERACIONES - Proyectos y Servicios
  { id: "projects", name: "projects", label: "Proyectos", description: "Proyectos y campañas", icon: <FolderKanban className="h-4 w-4" />, category: "operaciones" },
  { id: "services", name: "services", label: "Servicios", description: "Catálogo de servicios", icon: <Receipt className="h-4 w-4" />, category: "operaciones" },
  { id: "account_services", name: "account_services", label: "Servicios de Cuentas", description: "Servicios asignados a cuentas", icon: <Receipt className="h-4 w-4" />, category: "operaciones" },
  { id: "project_services", name: "project_services", label: "Servicios de Proyectos", description: "Servicios asignados a proyectos", icon: <Receipt className="h-4 w-4" />, category: "operaciones" },
  
  // 3. RECURSOS HUMANOS - Personal
  { id: "staff", name: "staff", label: "Personal", description: "Empleados y colaboradores", icon: <Users className="h-4 w-4" />, category: "rrhh" },
  { id: "staff_documents", name: "staff_documents", label: "Documentos de Personal", description: "Documentos de empleados", icon: <FileSpreadsheet className="h-4 w-4" />, category: "rrhh" },
  { id: "departments", name: "departments", label: "Departamentos", description: "Departamentos de la empresa", icon: <Building2 className="h-4 w-4" />, category: "rrhh" },
  { id: "positions", name: "positions", label: "Puestos", description: "Catálogo de puestos", icon: <Briefcase className="h-4 w-4" />, category: "rrhh" },
  { id: "contract_types", name: "contract_types", label: "Tipos de Contrato", description: "Catálogo de tipos de contrato", icon: <Database className="h-4 w-4" />, category: "rrhh" },
  { id: "candidates", name: "candidates", label: "Candidatos", description: "Candidatos a puestos", icon: <Users className="h-4 w-4" />, category: "rrhh" },
  { id: "leave_types", name: "leave_types", label: "Tipos de Ausencia", description: "Catálogo de tipos de ausencia", icon: <Database className="h-4 w-4" />, category: "rrhh" },
  { id: "leave_balances", name: "leave_balances", label: "Saldos de Vacaciones", description: "Saldos de días de vacaciones", icon: <Database className="h-4 w-4" />, category: "rrhh" },
  { id: "leave_requests", name: "leave_requests", label: "Solicitudes de Ausencia", description: "Solicitudes de vacaciones y permisos", icon: <Database className="h-4 w-4" />, category: "rrhh" },
  { id: "holidays", name: "holidays", label: "Días Festivos", description: "Calendario de días festivos", icon: <Database className="h-4 w-4" />, category: "rrhh" },
  { id: "training_categories", name: "training_categories", label: "Categorías de Capacitación", description: "Catálogo de categorías de cursos", icon: <Database className="h-4 w-4" />, category: "rrhh" },
  { id: "training_courses", name: "training_courses", label: "Cursos de Capacitación", description: "Cursos disponibles", icon: <Database className="h-4 w-4" />, category: "rrhh" },
  { id: "training_enrollments", name: "training_enrollments", label: "Inscripciones a Cursos", description: "Inscripciones de empleados", icon: <Database className="h-4 w-4" />, category: "rrhh" },
  { id: "recognition_categories", name: "recognition_categories", label: "Categorías de Reconocimiento", description: "Tipos de reconocimientos", icon: <Database className="h-4 w-4" />, category: "rrhh" },
  { id: "bonuses", name: "bonuses", label: "Bonos", description: "Bonos otorgados al personal", icon: <CreditCard className="h-4 w-4" />, category: "rrhh" },
  { id: "loans", name: "loans", label: "Préstamos", description: "Préstamos al personal", icon: <CreditCard className="h-4 w-4" />, category: "rrhh" },
  { id: "loan_payments", name: "loan_payments", label: "Pagos de Préstamos", description: "Pagos de préstamos", icon: <CreditCard className="h-4 w-4" />, category: "rrhh" },
  
  // 4. COMERCIAL - CRM
  { id: "crm_pipeline_stages", name: "crm_pipeline_stages", label: "Etapas del Pipeline", description: "Etapas del proceso de ventas", icon: <Database className="h-4 w-4" />, category: "comercial" },
  { id: "crm_lead_sources", name: "crm_lead_sources", label: "Fuentes de Leads", description: "Origen de los prospectos", icon: <Database className="h-4 w-4" />, category: "comercial" },
  { id: "crm_prospects", name: "crm_prospects", label: "Prospectos", description: "Oportunidades de venta", icon: <Users className="h-4 w-4" />, category: "comercial" },
  { id: "crm_activities", name: "crm_activities", label: "Actividades CRM", description: "Actividades de seguimiento", icon: <FolderKanban className="h-4 w-4" />, category: "comercial" },
  { id: "crm_tasks", name: "crm_tasks", label: "Tareas CRM", description: "Tareas pendientes de CRM", icon: <FolderKanban className="h-4 w-4" />, category: "comercial" },
  { id: "quotations", name: "quotations", label: "Cotizaciones", description: "Cotizaciones enviadas a prospectos", icon: <Receipt className="h-4 w-4" />, category: "comercial" },
  
  // 5. FINANZAS - Facturas, Pagos, Gastos, Proveedores
  { id: "invoices", name: "invoices", label: "Facturas", description: "Facturas emitidas", icon: <Receipt className="h-4 w-4" />, category: "finanzas" },
  { id: "invoice_items", name: "invoice_items", label: "Partidas de Facturas", description: "Detalle de facturas", icon: <Receipt className="h-4 w-4" />, category: "finanzas" },
  { id: "payments", name: "payments", label: "Pagos Recibidos", description: "Pagos de clientes", icon: <CreditCard className="h-4 w-4" />, category: "finanzas" },
  { id: "expenses", name: "expenses", label: "Gastos", description: "Gastos registrados", icon: <CreditCard className="h-4 w-4" />, category: "finanzas" },
  { id: "expense_categories", name: "expense_categories", label: "Categorías de Gastos", description: "Catálogo de categorías", icon: <Database className="h-4 w-4" />, category: "finanzas" },
  { id: "vendors", name: "vendors", label: "Proveedores", description: "Proveedores y terceros", icon: <Building2 className="h-4 w-4" />, category: "finanzas" },
  { id: "vendor_contacts", name: "vendor_contacts", label: "Contactos de Proveedores", description: "Contactos de proveedores", icon: <Users className="h-4 w-4" />, category: "finanzas" },
  { id: "vendor_types", name: "vendor_types", label: "Tipos de Proveedor", description: "Catálogo de tipos de proveedor", icon: <Database className="h-4 w-4" />, category: "finanzas" },
  { id: "commissions", name: "commissions", label: "Comisiones", description: "Comisiones por citas y clientes", icon: <CreditCard className="h-4 w-4" />, category: "finanzas" },
  { id: "third_party_payments", name: "third_party_payments", label: "Pagos a Terceros", description: "Pagos a proveedores y terceros", icon: <CreditCard className="h-4 w-4" />, category: "finanzas" },
  { id: "payroll_periods", name: "payroll_periods", label: "Periodos de Nómina", description: "Periodos de pago de nómina", icon: <CreditCard className="h-4 w-4" />, category: "finanzas" },
  { id: "payroll_details", name: "payroll_details", label: "Detalles de Nómina", description: "Detalles de pago por empleado", icon: <CreditCard className="h-4 w-4" />, category: "finanzas" },
  
  // 6. CONFIGURACIÓN - Sistema
  { id: "agencies", name: "agencies", label: "Agencias", description: "Agencias del sistema", icon: <Building2 className="h-4 w-4" />, category: "configuracion" },
  { id: "agency_commission_types", name: "agency_commission_types", label: "Tipos de Comisión", description: "Tipos de comisión por agencia", icon: <CreditCard className="h-4 w-4" />, category: "configuracion" },
  { id: "currencies", name: "currencies", label: "Monedas", description: "Catálogo de monedas", icon: <Database className="h-4 w-4" />, category: "configuracion" },
  { id: "bank_accounts", name: "bank_accounts", label: "Cuentas Bancarias", description: "Cuentas de banco", icon: <CreditCard className="h-4 w-4" />, category: "configuracion" },
  { id: "roles", name: "roles", label: "Roles", description: "Roles de usuario", icon: <Settings className="h-4 w-4" />, category: "configuracion" },
]

const categoryLabels: Record<string, string> = {
  administracion: "Administración",
  operaciones: "Operaciones",
  rrhh: "Recursos Humanos",
  comercial: "Comercial",
  finanzas: "Finanzas",
  configuracion: "Configuración",
}

// Template columns for each importable table - ALL fields from database schema
// IMPORTANTE: agency_name es obligatorio en tablas que pertenecen a una agencia específica
const templateColumns: Record<string, { field: string; required: boolean; description: string; example: string }[]> = {
  
  // ==================== 1. ADMINISTRACIÓN ====================
  clients: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir en el sistema)", example: "Mi Agencia Digital" },
    { field: "company_name", required: true, description: "Nombre comercial del cliente", example: "Acme Corp" },
    { field: "legal_name", required: false, description: "Razón social completa", example: "Acme Corporation S.A. de C.V." },
    { field: "tax_id", required: false, description: "RFC (13 caracteres)", example: "ACM123456ABC" },
    { field: "tax_regime", required: false, description: "Régimen fiscal", example: "601 - General de Ley" },
    { field: "cfdi_use", required: false, description: "Uso de CFDI", example: "G03" },
    { field: "industry", required: false, description: "Industria/Giro", example: "Tecnología" },
    { field: "website", required: false, description: "Sitio web", example: "https://acme.com" },
    { field: "street", required: false, description: "Calle", example: "Av. Reforma" },
    { field: "exterior_number", required: false, description: "Número exterior", example: "123" },
    { field: "interior_number", required: false, description: "Número interior", example: "4B" },
    { field: "neighborhood", required: false, description: "Colonia", example: "Juárez" },
    { field: "city", required: false, description: "Ciudad", example: "Ciudad de México" },
    { field: "state", required: false, description: "Estado", example: "CDMX" },
    { field: "country", required: false, description: "País", example: "México" },
    { field: "postal_code", required: false, description: "Código postal", example: "06600" },
    { field: "primary_contact_name", required: false, description: "Nombre contacto principal", example: "Juan Pérez" },
    { field: "primary_contact_position", required: false, description: "Puesto contacto principal", example: "Director General" },
    { field: "primary_contact_email", required: false, description: "Email contacto principal", example: "juan@acme.com" },
    { field: "primary_contact_phone", required: false, description: "Teléfono contacto principal", example: "+52 55 1234 5678" },
    { field: "billing_email", required: false, description: "Email de facturación", example: "facturacion@acme.com" },
    { field: "payment_terms", required: false, description: "Días de pago (número)", example: "30" },
    { field: "credit_limit", required: false, description: "Límite de crédito", example: "100000" },
    { field: "status", required: false, description: "Estado (active/inactive/prospect)", example: "active" },
    { field: "source", required: false, description: "Origen del cliente", example: "Referido" },
    { field: "instagram", required: false, description: "Instagram", example: "@acmecorp" },
    { field: "facebook", required: false, description: "Facebook", example: "facebook.com/acmecorp" },
    { field: "tiktok", required: false, description: "TikTok", example: "@acmecorp" },
    { field: "linkedin", required: false, description: "LinkedIn", example: "linkedin.com/company/acme" },
    { field: "notes", required: false, description: "Notas adicionales", example: "Cliente VIP" },
  ],
  client_contacts: [
    { field: "client_company_name", required: true, description: "Nombre del cliente al que pertenece (debe existir)", example: "Acme Corp" },
    { field: "name", required: true, description: "Nombre completo del contacto", example: "María García López" },
    { field: "position", required: false, description: "Puesto o cargo", example: "Director de Marketing" },
    { field: "email", required: false, description: "Correo electrónico", example: "maria@acme.com" },
    { field: "phone", required: false, description: "Teléfono de oficina", example: "+52 55 1234 5678" },
    { field: "mobile", required: false, description: "Teléfono celular", example: "+52 55 9876 5432" },
    { field: "is_primary", required: false, description: "Es el contacto principal (true/false)", example: "true" },
    { field: "is_billing_contact", required: false, description: "Es contacto de facturación (true/false)", example: "false" },
    { field: "is_active", required: false, description: "Contacto activo (true/false)", example: "true" },
    { field: "notes", required: false, description: "Notas o comentarios", example: "Prefiere comunicación por email" },
  ],
  accounts: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir en el sistema)", example: "Mi Agencia Digital" },
    { field: "client_company_name", required: true, description: "Nombre del cliente al que pertenece (debe existir)", example: "Acme Corp" },
    { field: "client_tax_id", required: false, description: "RFC del cliente (alternativa para identificar cliente)", example: "ACM123456ABC" },
    { field: "account_name", required: true, description: "Nombre de la cuenta/marca", example: "Marca Premium" },
    { field: "account_code", required: false, description: "Código interno de la cuenta", example: "ACC-001" },
    { field: "account_type", required: false, description: "Tipo: project (por proyecto) o retainer (mensualidad fija)", example: "retainer" },
    { field: "account_manager_email", required: false, description: "Email del ejecutivo de cuenta (debe existir en staff)", example: "ejecutivo@agencia.com" },
    { field: "sales_advisor_email", required: false, description: "Email del asesor de ventas (debe existir en staff)", example: "ventas@agencia.com" },
    // Equipo Operativo - Tecnología y Programación
    { field: "tech_manager_email", required: false, description: "Email del Gerente de Tecnología y Programación", example: "tech.manager@agencia.com" },
    { field: "tech_coordinator_email", required: false, description: "Email del Coordinador de Tecnología y Programación", example: "tech.coord@agencia.com" },
    // Equipo Operativo - Planeación Estratégica
    { field: "strategy_manager_email", required: false, description: "Email del Gerente de Planeación Estratégica", example: "strategy.manager@agencia.com" },
    { field: "strategy_coordinator_email", required: false, description: "Email del Coordinador de Planeación Estratégica", example: "strategy.coord@agencia.com" },
    // Equipo Operativo - Creatividad y Diseño
    { field: "creative_manager_email", required: false, description: "Email del Gerente de Creatividad y Diseño", example: "creative.manager@agencia.com" },
    { field: "creative_coordinator_email", required: false, description: "Email del Coordinador de Creatividad y Diseño", example: "creative.coord@agencia.com" },
    { field: "retainer_amount", required: false, description: "Monto del retainer/mensualidad (solo para tipo retainer)", example: "50000" },
    { field: "currency_code", required: false, description: "Código de moneda para el retainer (MXN/USD)", example: "MXN" },
    { field: "bank_account_name", required: false, description: "Nombre de la cuenta bancaria de la agencia para pagos", example: "Cuenta Principal BBVA" },
    { field: "contract_start_date", required: false, description: "Fecha inicio de contrato (YYYY-MM-DD)", example: "2024-01-01" },
    { field: "contract_end_date", required: false, description: "Fecha fin de contrato (YYYY-MM-DD)", example: "2024-12-31" },
    { field: "payment_terms", required: false, description: "Días de pago (número entero)", example: "30" },
    { field: "discount_percentage", required: false, description: "Porcentaje de descuento aplicable (0-100)", example: "10" },
    { field: "status", required: false, description: "Estado: active, inactive, on_hold, prospect", example: "active" },
    { field: "notes", required: false, description: "Notas internas sobre la cuenta", example: "Cuenta premium con atención prioritaria" },
  ],
  
  // ==================== 2. OPERACIONES ====================
  projects: [
    { field: "account_name", required: true, description: "Nombre de la cuenta/marca (debe existir)", example: "Marca Premium" },
    { field: "client_company_name", required: true, description: "Nombre del cliente (para identificar cuenta)", example: "Acme Corp" },
    { field: "name", required: true, description: "Nombre del proyecto", example: "Campaña Navidad 2024" },
    { field: "project_code", required: false, description: "Código interno del proyecto", example: "PRJ-2024-001" },
    { field: "description", required: false, description: "Descripción del proyecto", example: "Campaña publicitaria navideña" },
    { field: "project_type", required: false, description: "Tipo (standard/retainer/hourly)", example: "standard" },
    { field: "status", required: false, description: "Estado (draft/active/completed/on_hold/cancelled)", example: "active" },
    { field: "priority", required: false, description: "Prioridad (low/medium/high/urgent)", example: "high" },
    { field: "start_date", required: false, description: "Fecha inicio planificada (YYYY-MM-DD)", example: "2024-11-01" },
    { field: "end_date", required: false, description: "Fecha fin planificada (YYYY-MM-DD)", example: "2024-12-24" },
    { field: "actual_start_date", required: false, description: "Fecha inicio real (YYYY-MM-DD)", example: "2024-11-05" },
    { field: "actual_end_date", required: false, description: "Fecha fin real (YYYY-MM-DD)", example: "" },
    { field: "budget_amount", required: false, description: "Presupuesto", example: "100000" },
    { field: "currency_code", required: false, description: "Código de moneda (MXN/USD)", example: "MXN" },
    { field: "quoted_amount", required: false, description: "Monto cotizado", example: "110000" },
    { field: "final_amount", required: false, description: "Monto final", example: "105000" },
    { field: "estimated_hours", required: false, description: "Horas estimadas", example: "200" },
    { field: "actual_hours", required: false, description: "Horas reales trabajadas", example: "180" },
    { field: "project_manager_email", required: false, description: "Email del PM (debe existir en staff)", example: "pm@agencia.com" },
    { field: "progress_percentage", required: false, description: "Porcentaje de avance (0-100)", example: "75" },
    { field: "is_billable", required: false, description: "Es facturable (true/false)", example: "true" },
    { field: "billing_type", required: false, description: "Tipo facturación (fixed/hourly/milestone)", example: "fixed" },
    { field: "notes", required: false, description: "Notas del proyecto", example: "Proyecto prioritario" },
  ],
  services: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir en el sistema)", example: "Mi Agencia Digital" },
    { field: "name", required: true, description: "Nombre del servicio", example: "Diseño de Logo" },
    { field: "service_code", required: false, description: "Código del servicio", example: "SRV-DIS-001" },
    { field: "description", required: false, description: "Descripción detallada", example: "Diseño de identidad visual" },
    { field: "category", required: false, description: "Categoría del servicio", example: "Diseño Gráfico" },
    { field: "department_name", required: false, description: "Departamento (debe existir)", example: "Diseño" },
    { field: "service_type", required: false, description: "Tipo (one_time/recurring/retainer)", example: "one_time" },
    { field: "base_price", required: false, description: "Precio base MXN", example: "5000" },
    { field: "base_price_usd", required: false, description: "Precio base USD", example: "300" },
    { field: "unit_type", required: false, description: "Unidad (hour/project/month/piece)", example: "project" },
    { field: "estimated_hours", required: false, description: "Horas estimadas", example: "20" },
    { field: "is_active", required: false, description: "Activo (true/false)", example: "true" },
  ],
  
  // ==================== 3. RECURSOS HUMANOS ====================
  staff: [
    { field: "agency_name", required: false, description: "Nombre de la agencia principal (dejar vacío si is_global=true)", example: "Mi Agencia Digital" },
    { field: "is_global", required: false, description: "Acceso global a todas las agencias (true/false)", example: "false" },
    { field: "employee_code", required: false, description: "Código de empleado", example: "EMP-001" },
    { field: "first_name", required: true, description: "Nombre(s)", example: "María Elena" },
    { field: "last_name", required: true, description: "Apellidos", example: "González López" },
    { field: "email", required: true, description: "Email corporativo (único)", example: "maria@agencia.com" },
    { field: "phone", required: false, description: "Teléfono de trabajo", example: "+52 55 1234 5678" },
    { field: "position", required: true, description: "Nombre del puesto", example: "Diseñador Gráfico Senior" },
    { field: "department", required: false, description: "Nombre del departamento", example: "Diseño" },
    { field: "reports_to_email", required: false, description: "Email del jefe directo (debe existir)", example: "director@agencia.com" },
    { field: "hire_date", required: false, description: "Fecha de ingreso (YYYY-MM-DD)", example: "2024-01-15" },
    { field: "contract_type", required: false, description: "Tipo: full_time/part_time/contractor/freelance/intern", example: "full_time" },
    { field: "monthly_salary", required: false, description: "Salario mensual bruto", example: "35000" },
    { field: "hourly_cost", required: false, description: "Costo por hora", example: "250" },
    { field: "currency_code", required: false, description: "Moneda del salario (MXN/USD)", example: "MXN" },
    { field: "is_billable", required: false, description: "Es facturable (true/false)", example: "true" },
    { field: "utilization_target", required: false, description: "Meta de utilización % (0-100)", example: "75" },
{ field: "commission_type", required: false, description: "Tipo comision: none/sales/revenue/both", example: "none" },
  { field: "commission_percentage", required: false, description: "Porcentaje de comisión", example: "0" },
  { field: "min_subordinates", required: false, description: "Mínimo de subordinados permitidos", example: "0" },
  { field: "max_subordinates", required: false, description: "Máximo de subordinados permitidos", example: "5" },
  { field: "min_accounts", required: false, description: "Mínimo de cuentas/clientes a manejar", example: "0" },
  { field: "max_accounts", required: false, description: "Máximo de cuentas/clientes a manejar", example: "10" },
  { field: "role_name", required: false, description: "Nombre del rol de usuario (debe existir en roles)", example: "Ejecutivo de Cuentas" },
  { field: "skills", required: false, description: "Habilidades separadas por coma", example: "Photoshop, Illustrator, Figma" },
    { field: "personal_email", required: false, description: "Email personal", example: "maria.personal@gmail.com" },
    { field: "personal_phone", required: false, description: "Teléfono personal", example: "+52 55 9876 5432" },
    { field: "address_street", required: false, description: "Calle y número", example: "Av. Reforma 123" },
    { field: "address_colony", required: false, description: "Colonia", example: "Juárez" },
    { field: "address_city", required: false, description: "Ciudad", example: "Ciudad de México" },
    { field: "address_state", required: false, description: "Estado", example: "CDMX" },
    { field: "address_zip", required: false, description: "Código postal", example: "06600" },
    { field: "address_country", required: false, description: "País", example: "México" },
{ field: "emergency_contact_name", required: false, description: "Nombre contacto emergencia", example: "Juan Pérez" },
  { field: "emergency_contact_relationship", required: false, description: "Relación", example: "Esposo" },
  { field: "emergency_contact_phone", required: false, description: "Teléfono emergencia", example: "+52 55 1111 2222" },
  { field: "emergency_contact_email", required: false, description: "Email contacto emergencia", example: "juan.perez@gmail.com" },
  { field: "photo_url", required: false, description: "URL de la foto del empleado", example: "https://..." },
  { field: "bank_name", required: false, description: "Nombre del banco", example: "BBVA" },
    { field: "bank_account_number", required: false, description: "Número de cuenta", example: "0123456789" },
    { field: "bank_clabe", required: false, description: "CLABE interbancaria", example: "012345678901234567" },
    { field: "bank_account_holder", required: false, description: "Titular de la cuenta", example: "María Elena González López" },
    { field: "is_active", required: false, description: "Empleado activo (true/false)", example: "true" },
    { field: "notes", required: false, description: "Notas adicionales", example: "Trabaja remoto los viernes" },
  ],
  departments: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir en el sistema)", example: "Mi Agencia Digital" },
    { field: "name", required: true, description: "Nombre del departamento", example: "Diseño" },
    { field: "description", required: false, description: "Descripción del departamento", example: "Equipo de diseño gráfico y UI/UX" },
    { field: "sort_order", required: false, description: "Orden de aparición", example: "1" },
    { field: "is_active", required: false, description: "Activo (true/false)", example: "true" },
  ],
  positions: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir en el sistema)", example: "Mi Agencia Digital" },
    { field: "department_name", required: false, description: "Nombre del departamento (debe existir)", example: "Diseño" },
    { field: "name", required: true, description: "Nombre del puesto", example: "Diseñador Gráfico Senior" },
    { field: "description", required: false, description: "Descripción del puesto", example: "Responsable de proyectos de diseño" },
    { field: "level", required: false, description: "Nivel (junior/mid/senior/lead/director)", example: "senior" },
    { field: "default_hourly_cost", required: false, description: "Costo por hora por defecto", example: "350" },
    { field: "is_billable", required: false, description: "Es facturable (true/false)", example: "true" },
    { field: "sort_order", required: false, description: "Orden de aparición", example: "1" },
    { field: "is_active", required: false, description: "Activo (true/false)", example: "true" },
  ],
  
  // ==================== 4. COMERCIAL ====================
  crm_prospects: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir en el sistema)", example: "Mi Agencia Digital" },
    { field: "contact_name", required: true, description: "Nombre del contacto principal", example: "Carlos Rodríguez" },
    { field: "company_name", required: false, description: "Nombre de la empresa", example: "Tech Solutions" },
    { field: "contact_email", required: false, description: "Email del contacto", example: "carlos@techsol.com" },
    { field: "contact_phone", required: false, description: "Teléfono del contacto", example: "+52 55 9876 5432" },
    { field: "contact_position", required: false, description: "Puesto del contacto", example: "Director de Marketing" },
    { field: "stage_name", required: false, description: "Etapa del pipeline (debe existir)", example: "Propuesta Enviada" },
    { field: "source_name", required: false, description: "Fuente/origen (debe existir)", example: "Referido" },
    { field: "assigned_to_email", required: false, description: "Email del ejecutivo asignado (debe existir en staff)", example: "ventas@agencia.com" },
    { field: "estimated_value", required: false, description: "Valor estimado del proyecto", example: "50000" },
    { field: "currency_code", required: false, description: "Código de moneda (MXN/USD)", example: "MXN" },
    { field: "probability", required: false, description: "Probabilidad de cierre % (0-100)", example: "60" },
    { field: "expected_close_date", required: false, description: "Fecha esperada de cierre (YYYY-MM-DD)", example: "2024-03-15" },
    { field: "status", required: false, description: "Estado (active/won/lost)", example: "active" },
    { field: "lost_reason", required: false, description: "Razón de pérdida (si aplica)", example: "" },
    { field: "description", required: false, description: "Descripción de la oportunidad", example: "Interesado en campaña digital" },
    { field: "notes", required: false, description: "Notas adicionales", example: "Seguimiento en 2 semanas" },
  ],
  crm_activities: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir en el sistema)", example: "Mi Agencia Digital" },
    { field: "prospect_contact_name", required: true, description: "Nombre del prospecto (debe existir)", example: "Carlos Rodríguez" },
    { field: "activity_type", required: true, description: "Tipo: call/email/meeting/task/note", example: "call" },
    { field: "subject", required: true, description: "Asunto de la actividad", example: "Llamada de seguimiento" },
    { field: "description", required: false, description: "Descripción detallada", example: "Discutir propuesta comercial" },
    { field: "activity_date", required: false, description: "Fecha y hora (YYYY-MM-DD HH:MM)", example: "2024-01-15 10:00" },
    { field: "duration_minutes", required: false, description: "Duración en minutos", example: "30" },
    { field: "assigned_to_email", required: false, description: "Email del responsable (debe existir en staff)", example: "ventas@agencia.com" },
    { field: "is_completed", required: false, description: "Completada (true/false)", example: "false" },
  ],
  quotations: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir en el sistema)", example: "Mi Agencia Digital" },
    { field: "prospect_contact_name", required: true, description: "Nombre del prospecto (debe existir)", example: "Carlos Rodríguez" },
    { field: "staff_email", required: false, description: "Email del vendedor que envía (debe existir en staff)", example: "ventas@agencia.com" },
    { field: "quotation_number", required: false, description: "Número de cotización", example: "COT-2024-001" },
    { field: "title", required: true, description: "Título de la cotización", example: "Propuesta Campaña Digital" },
    { field: "description", required: false, description: "Descripción detallada", example: "Propuesta integral de marketing digital" },
    { field: "subtotal", required: false, description: "Subtotal antes de impuestos", example: "50000" },
    { field: "tax_amount", required: false, description: "Monto de impuestos", example: "8000" },
    { field: "total_amount", required: false, description: "Total con impuestos", example: "58000" },
    { field: "currency_code", required: false, description: "Código de moneda (MXN/USD)", example: "MXN" },
    { field: "valid_until", required: false, description: "Fecha de vigencia (YYYY-MM-DD)", example: "2024-02-28" },
    { field: "status", required: false, description: "Estado (draft/sent/accepted/rejected/expired)", example: "sent" },
    { field: "sent_date", required: false, description: "Fecha de envío (YYYY-MM-DD)", example: "2024-01-15" },
    { field: "file_url", required: false, description: "URL del archivo de cotización", example: "https://..." },
    { field: "notes", required: false, description: "Notas adicionales", example: "Incluye 3 revisiones" },
  ],
  
  // ==================== 5. FINANZAS ====================
  vendors: [
    { field: "agency_name", required: true, description: "Nombre de la agencia a la que pertenece (debe existir en el sistema)", example: "Mi Agencia Digital" },
    { field: "name", required: true, description: "Nombre comercial del proveedor", example: "Office Depot" },
    { field: "legal_name", required: false, description: "Razón social", example: "Office Depot de México S.A. de C.V." },
    { field: "tax_id", required: false, description: "RFC (13 caracteres)", example: "ODM123456ABC" },
    { field: "vendor_type", required: false, description: "Tipo de proveedor", example: "Suministros" },
    { field: "contact_name", required: false, description: "Nombre del contacto principal", example: "Juan Pérez" },
    { field: "contact_email", required: false, description: "Email del contacto", example: "juan@officedepot.com" },
    { field: "contact_phone", required: false, description: "Teléfono del contacto", example: "+52 55 1234 5678" },
    { field: "website", required: false, description: "Sitio web", example: "https://officedepot.com.mx" },
    { field: "address", required: false, description: "Dirección completa", example: "Av. Insurgentes Sur 1234, Col. Del Valle" },
    { field: "city", required: false, description: "Ciudad", example: "Ciudad de México" },
    { field: "state", required: false, description: "Estado", example: "CDMX" },
    { field: "country", required: false, description: "País", example: "México" },
    { field: "postal_code", required: false, description: "Código postal", example: "03100" },
    { field: "payment_terms", required: false, description: "Días de crédito", example: "30" },
    { field: "bank_name", required: false, description: "Nombre del banco", example: "BBVA" },
    { field: "bank_account", required: false, description: "Número de cuenta", example: "0123456789" },
    { field: "bank_clabe", required: false, description: "CLABE interbancaria (18 dígitos)", example: "012345678901234567" },
    { field: "currency_code", required: false, description: "Código de moneda (MXN/USD)", example: "MXN" },
    { field: "credit_limit", required: false, description: "Límite de crédito", example: "50000" },
    { field: "is_active", required: false, description: "Activo (true/false)", example: "true" },
    { field: "notes", required: false, description: "Notas adicionales", example: "Proveedor preferido" },
  ],
  vendor_contacts: [
    { field: "vendor_name", required: true, description: "Nombre del proveedor al que pertenece (debe existir en el sistema)", example: "Office Depot" },
    { field: "name", required: true, description: "Nombre completo del contacto", example: "María García López" },
    { field: "position", required: false, description: "Puesto o cargo", example: "Ejecutivo de Ventas" },
    { field: "email", required: false, description: "Correo electrónico", example: "maria.garcia@officedepot.com" },
    { field: "phone", required: false, description: "Teléfono de oficina", example: "+52 55 1234 5678" },
    { field: "mobile", required: false, description: "Teléfono celular", example: "+52 55 9876 5432" },
    { field: "is_primary", required: false, description: "Es el contacto principal (true/false)", example: "true" },
    { field: "is_active", required: false, description: "Contacto activo (true/false)", example: "true" },
    { field: "notes", required: false, description: "Notas o comentarios", example: "Contacto para pedidos urgentes" },
  ],

  // ==================== FACTURAS Y PAGOS ====================
  invoices: [
    { field: "agency_name", required: true, description: "Nombre de la agencia a la que pertenece (debe existir en el sistema)", example: "Mi Agencia Digital" },
    { field: "client_company_name", required: true, description: "Nombre del cliente (debe existir en el sistema)", example: "Acme Corp" },
    { field: "account_name", required: false, description: "Nombre de la cuenta/marca del cliente (debe existir en el sistema)", example: "Marca Principal" },
    { field: "project_name", required: false, description: "Nombre del proyecto asociado (debe existir en el sistema)", example: "Campaña Q1 2024" },
    { field: "invoice_number", required: true, description: "Número de factura (único)", example: "FAC-2024-001" },
    { field: "invoice_type", required: false, description: "Tipo (standard/credit_note/debit_note/proforma)", example: "standard" },
    { field: "status", required: false, description: "Estado (draft/pending/sent/partial/paid/overdue/cancelled)", example: "pending" },
    { field: "issue_date", required: true, description: "Fecha de emisión (YYYY-MM-DD)", example: "2024-01-15" },
    { field: "due_date", required: false, description: "Fecha de vencimiento (YYYY-MM-DD)", example: "2024-02-15" },
    { field: "subtotal", required: false, description: "Subtotal antes de impuestos", example: "10000" },
    { field: "tax_rate", required: false, description: "Tasa de IVA (%)", example: "16" },
    { field: "tax_amount", required: false, description: "Monto de IVA", example: "1600" },
    { field: "discount_amount", required: false, description: "Monto de descuento", example: "500" },
    { field: "total_amount", required: false, description: "Total de la factura", example: "11100" },
    { field: "paid_amount", required: false, description: "Monto pagado", example: "5000" },
    { field: "balance_due", required: false, description: "Saldo pendiente", example: "6100" },
    { field: "currency_code", required: false, description: "Código de moneda (MXN/USD)", example: "MXN" },
    { field: "exchange_rate", required: false, description: "Tipo de cambio", example: "17.50" },
    { field: "payment_terms", required: false, description: "Días de pago", example: "30" },
    { field: "cfdi_use", required: false, description: "Uso de CFDI", example: "G03" },
    { field: "payment_method", required: false, description: "Método de pago", example: "Transferencia" },
    { field: "payment_reference", required: false, description: "Referencia de pago", example: "REF-12345" },
    { field: "payment_date", required: false, description: "Fecha de pago (YYYY-MM-DD)", example: "2024-02-10" },
    { field: "payment_notes", required: false, description: "Notas del pago", example: "Pago parcial" },
    { field: "notes", required: false, description: "Notas para el cliente", example: "Gracias por su preferencia" },
    { field: "internal_notes", required: false, description: "Notas internas", example: "Cliente VIP" },
  ],
  invoice_items: [
    { field: "invoice_number", required: true, description: "Número de factura a la que pertenece (debe existir en el sistema)", example: "FAC-2024-001" },
    { field: "service_name", required: false, description: "Nombre del servicio del catálogo (debe existir en el sistema)", example: "Diseño de Logo" },
    { field: "description", required: true, description: "Descripción del concepto", example: "Diseño de Logo Corporativo" },
    { field: "quantity", required: false, description: "Cantidad", example: "1" },
    { field: "unit_price", required: true, description: "Precio unitario", example: "5000" },
    { field: "discount_percentage", required: false, description: "Porcentaje de descuento", example: "10" },
    { field: "tax_rate", required: false, description: "Tasa de IVA (%)", example: "16" },
    { field: "subtotal", required: true, description: "Subtotal (cantidad x precio)", example: "4500" },
    { field: "tax_amount", required: false, description: "Monto de IVA", example: "720" },
    { field: "total", required: true, description: "Total del concepto", example: "5220" },
    { field: "sort_order", required: false, description: "Orden de aparición", example: "1" },
  ],
  expenses: [
    { field: "agency_name", required: true, description: "Nombre de la agencia a la que pertenece (debe existir en el sistema)", example: "Mi Agencia Digital" },
    { field: "category_name", required: false, description: "Nombre de la categoría de gasto (debe existir en el sistema)", example: "Suministros de Oficina" },
    { field: "project_name", required: false, description: "Nombre del proyecto asociado (debe existir en el sistema)", example: "Campaña Q1 2024" },
    { field: "expense_date", required: true, description: "Fecha del gasto (YYYY-MM-DD)", example: "2024-01-15" },
    { field: "vendor_name", required: false, description: "Nombre del proveedor (si existe en sistema se vincula)", example: "Office Depot" },
    { field: "description", required: true, description: "Descripción del gasto", example: "Material de oficina" },
    { field: "amount", required: true, description: "Monto sin IVA", example: "1000" },
    { field: "tax_amount", required: false, description: "Monto de IVA", example: "160" },
    { field: "total_amount", required: true, description: "Total con IVA", example: "1160" },
    { field: "currency_code", required: false, description: "Código de moneda (MXN/USD)", example: "MXN" },
    { field: "exchange_rate", required: false, description: "Tipo de cambio", example: "1" },
    { field: "payment_method", required: false, description: "Método (cash/card/transfer/check)", example: "transfer" },
    { field: "is_billable", required: false, description: "Facturable al cliente (true/false)", example: "false" },
    { field: "is_reimbursable", required: false, description: "Reembolsable (true/false)", example: "false" },
    { field: "status", required: false, description: "Estado (pending/approved/paid/rejected)", example: "pending" },
    { field: "approval_status", required: false, description: "Estado aprobación (pending/approved/rejected)", example: "pending" },
    { field: "rejection_reason", required: false, description: "Razón de rechazo", example: "Falta comprobante" },
    { field: "notes", required: false, description: "Notas adicionales", example: "Compra urgente" },
  ],
  
  // ==================== PAGOS RECIBIDOS ====================
  payments: [
    { field: "agency_name", required: true, description: "Nombre de la agencia a la que pertenece (debe existir en el sistema)", example: "Mi Agencia Digital" },
    { field: "invoice_number", required: false, description: "Número de factura asociada (debe existir en el sistema)", example: "FAC-2024-001" },
    { field: "client_company_name", required: false, description: "Nombre del cliente (debe existir en el sistema)", example: "Acme Corp" },
    { field: "account_name", required: false, description: "Nombre de la cuenta/marca del cliente (debe existir en el sistema)", example: "Marca Principal" },
    { field: "project_name", required: false, description: "Nombre del proyecto asociado (debe existir en el sistema)", example: "Campaña Q1 2024" },
    { field: "payment_number", required: false, description: "Número de pago", example: "PAY-2024-001" },
    { field: "payment_date", required: true, description: "Fecha del pago (YYYY-MM-DD)", example: "2024-01-15" },
    { field: "amount", required: true, description: "Monto del pago", example: "5000" },
    { field: "currency_code", required: false, description: "Código de moneda (MXN/USD)", example: "MXN" },
    { field: "exchange_rate", required: false, description: "Tipo de cambio", example: "17.50" },
    { field: "payment_method", required: false, description: "Método (transfer/cash/check/card)", example: "transfer" },
    { field: "reference_number", required: false, description: "Número de referencia bancaria", example: "REF-123456" },
    { field: "bank_account_name", required: false, description: "Nombre de la cuenta bancaria destino (debe existir en el sistema)", example: "Cuenta Principal BBVA" },
    { field: "status", required: false, description: "Estado (pending/completed/cancelled)", example: "completed" },
    { field: "notes", required: false, description: "Notas adicionales", example: "Pago parcial de factura" },
  ],
  
  expense_categories: [
    { field: "agency_name", required: false, description: "Nombre de la agencia (si es específica de una agencia)", example: "Mi Agencia Digital" },
    { field: "name", required: true, description: "Nombre de la categoría", example: "Suministros de Oficina" },
    { field: "code", required: false, description: "Código de la categoría", example: "SUP-001" },
    { field: "description", required: false, description: "Descripción de la categoría", example: "Gastos de papelería y material de oficina" },
    { field: "expense_type", required: false, description: "Tipo de gasto (operational/administrative/marketing/travel/other)", example: "operational" },
    { field: "parent_category_name", required: false, description: "Nombre de la categoría padre (para subcategorías)", example: "Gastos Operativos" },
    { field: "is_active", required: false, description: "Activa (true/false)", example: "true" },
  ],
  commissions: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir en el sistema)", example: "Mi Agencia Digital" },
    { field: "staff_email", required: true, description: "Email del empleado que recibe la comisión (debe existir en staff)", example: "ventas@agencia.com" },
    { field: "commission_type", required: true, description: "Tipo: appointment (por cita) o client (por cliente)", example: "appointment" },
    { field: "prospect_contact_name", required: false, description: "Nombre del prospecto (para tipo appointment)", example: "Carlos Rodríguez" },
    { field: "quotation_number", required: false, description: "Número de cotización relacionada", example: "COT-2024-001" },
    { field: "client_company_name", required: false, description: "Nombre del cliente (para tipo client)", example: "Acme Corp" },
    { field: "base_amount", required: false, description: "Monto base (pago o cotización)", example: "50000" },
    { field: "commission_rate", required: false, description: "Porcentaje de comisión (para tipo client)", example: "5" },
    { field: "commission_amount", required: true, description: "Monto de la comisión", example: "2500" },
    { field: "currency_code", required: false, description: "Código de moneda (MXN/USD)", example: "MXN" },
    { field: "status", required: false, description: "Estado: pending/approved/rejected/paid", example: "pending" },
    { field: "description", required: false, description: "Descripción de la comisión", example: "Comisión por cita con prospecto" },
    { field: "notes", required: false, description: "Notas adicionales", example: "Aprobada por gerente" },
  ],
  third_party_payments: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir en el sistema)", example: "Mi Agencia Digital" },
    { field: "client_company_name", required: true, description: "Nombre del cliente (debe existir)", example: "Acme Corp" },
    { field: "vendor_name", required: false, description: "Nombre del proveedor (debe existir)", example: "Facebook Ads" },
    { field: "project_name", required: false, description: "Nombre del proyecto relacionado", example: "Campaña Q1" },
    { field: "payment_date", required: true, description: "Fecha del pago (YYYY-MM-DD)", example: "2024-01-15" },
    { field: "amount", required: true, description: "Monto del pago", example: "10000" },
    { field: "currency_code", required: false, description: "Código de moneda (MXN/USD)", example: "MXN" },
    { field: "payment_method", required: false, description: "Método (transfer/card/cash)", example: "card" },
    { field: "description", required: false, description: "Descripción del pago", example: "Pago de pauta publicitaria" },
    { field: "invoice_number", required: false, description: "Número de factura del proveedor", example: "INV-12345" },
    { field: "status", required: false, description: "Estado (pending/approved/paid)", example: "paid" },
    { field: "notes", required: false, description: "Notas adicionales", example: "Pago mensual de pauta" },
  ],
  payroll_periods: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir en el sistema)", example: "Mi Agencia Digital" },
    { field: "period_name", required: true, description: "Nombre del periodo", example: "Enero 2024 - Quincena 1" },
    { field: "period_type", required: false, description: "Tipo (weekly/biweekly/monthly)", example: "biweekly" },
    { field: "start_date", required: true, description: "Fecha inicio del periodo (YYYY-MM-DD)", example: "2024-01-01" },
    { field: "end_date", required: true, description: "Fecha fin del periodo (YYYY-MM-DD)", example: "2024-01-15" },
    { field: "payment_date", required: false, description: "Fecha de pago (YYYY-MM-DD)", example: "2024-01-17" },
    { field: "status", required: false, description: "Estado (draft/processing/completed/cancelled)", example: "draft" },
  ],
  payroll_details: [
    { field: "period_name", required: true, description: "Nombre del periodo de nómina (debe existir)", example: "Enero 2024 - Quincena 1" },
    { field: "staff_email", required: true, description: "Email del empleado (debe existir en staff)", example: "empleado@agencia.com" },
    { field: "base_salary", required: false, description: "Salario base del periodo", example: "15000" },
    { field: "bonuses", required: false, description: "Total de bonos", example: "2000" },
    { field: "commissions", required: false, description: "Total de comisiones", example: "5000" },
    { field: "deductions", required: false, description: "Total de deducciones", example: "3000" },
    { field: "loan_deductions", required: false, description: "Deducciones por préstamos", example: "1000" },
    { field: "net_salary", required: false, description: "Salario neto", example: "18000" },
    { field: "notes", required: false, description: "Notas adicionales", example: "Incluye bono de productividad" },
  ],
  
  // ==================== NUEVAS TABLAS RRHH ====================
  staff_documents: [
    { field: "staff_email", required: true, description: "Email del empleado (debe existir en staff)", example: "empleado@agencia.com" },
    { field: "document_type", required: true, description: "Tipo de documento", example: "Contrato" },
    { field: "document_name", required: true, description: "Nombre del documento", example: "Contrato Laboral 2024" },
    { field: "file_url", required: false, description: "URL del archivo", example: "https://..." },
    { field: "expiry_date", required: false, description: "Fecha de vencimiento (YYYY-MM-DD)", example: "2025-01-15" },
    { field: "notes", required: false, description: "Notas adicionales", example: "Contrato por tiempo indeterminado" },
  ],
  contract_types: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir)", example: "Mi Agencia Digital" },
    { field: "name", required: true, description: "Nombre del tipo de contrato", example: "Tiempo Completo" },
    { field: "code", required: false, description: "Código del tipo", example: "FT" },
    { field: "description", required: false, description: "Descripción", example: "Contrato de tiempo completo" },
    { field: "is_active", required: false, description: "Activo (true/false)", example: "true" },
  ],
  candidates: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir)", example: "Mi Agencia Digital" },
    { field: "first_name", required: true, description: "Nombre(s) del candidato", example: "Juan" },
    { field: "last_name", required: true, description: "Apellidos del candidato", example: "Pérez García" },
    { field: "email", required: true, description: "Email del candidato", example: "juan.perez@gmail.com" },
    { field: "phone", required: false, description: "Teléfono", example: "+52 55 1234 5678" },
    { field: "position_name", required: false, description: "Puesto al que aplica (debe existir)", example: "Diseñador Gráfico" },
    { field: "source", required: false, description: "Fuente de reclutamiento", example: "LinkedIn" },
    { field: "status", required: false, description: "Estado (new/screening/interview/offer/hired/rejected)", example: "new" },
    { field: "resume_url", required: false, description: "URL del CV", example: "https://..." },
    { field: "salary_expectation", required: false, description: "Expectativa salarial", example: "25000" },
    { field: "notes", required: false, description: "Notas", example: "Excelente perfil técnico" },
  ],
  leave_types: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir)", example: "Mi Agencia Digital" },
    { field: "name", required: true, description: "Nombre del tipo de ausencia", example: "Vacaciones" },
    { field: "code", required: false, description: "Código", example: "VAC" },
    { field: "description", required: false, description: "Descripción", example: "Días de vacaciones" },
    { field: "default_days", required: false, description: "Días por defecto anuales", example: "15" },
    { field: "is_paid", required: false, description: "Es pagada (true/false)", example: "true" },
    { field: "requires_approval", required: false, description: "Requiere aprobación (true/false)", example: "true" },
    { field: "is_active", required: false, description: "Activo (true/false)", example: "true" },
  ],
  leave_balances: [
    { field: "staff_email", required: true, description: "Email del empleado (debe existir)", example: "empleado@agencia.com" },
    { field: "leave_type_name", required: true, description: "Nombre del tipo de ausencia (debe existir)", example: "Vacaciones" },
    { field: "year", required: true, description: "Año", example: "2024" },
    { field: "entitled_days", required: false, description: "Días asignados", example: "15" },
    { field: "used_days", required: false, description: "Días usados", example: "5" },
    { field: "pending_days", required: false, description: "Días pendientes de aprobación", example: "0" },
    { field: "carry_over_days", required: false, description: "Días arrastrados del año anterior", example: "3" },
  ],
  leave_requests: [
    { field: "staff_email", required: true, description: "Email del empleado (debe existir)", example: "empleado@agencia.com" },
    { field: "leave_type_name", required: true, description: "Tipo de ausencia (debe existir)", example: "Vacaciones" },
    { field: "start_date", required: true, description: "Fecha inicio (YYYY-MM-DD)", example: "2024-03-15" },
    { field: "end_date", required: true, description: "Fecha fin (YYYY-MM-DD)", example: "2024-03-20" },
    { field: "total_days", required: false, description: "Total de días", example: "5" },
    { field: "reason", required: false, description: "Motivo de la solicitud", example: "Vacaciones familiares" },
    { field: "status", required: false, description: "Estado (pending/approved/rejected/cancelled)", example: "pending" },
  ],
  holidays: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir)", example: "Mi Agencia Digital" },
    { field: "name", required: true, description: "Nombre del día festivo", example: "Día de la Independencia" },
    { field: "date", required: true, description: "Fecha (YYYY-MM-DD)", example: "2024-09-16" },
    { field: "is_recurring", required: false, description: "Se repite cada año (true/false)", example: "true" },
    { field: "is_active", required: false, description: "Activo (true/false)", example: "true" },
  ],
  training_categories: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir)", example: "Mi Agencia Digital" },
    { field: "name", required: true, description: "Nombre de la categoría", example: "Desarrollo Profesional" },
    { field: "description", required: false, description: "Descripción", example: "Cursos de desarrollo profesional" },
    { field: "is_active", required: false, description: "Activo (true/false)", example: "true" },
  ],
  training_courses: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir)", example: "Mi Agencia Digital" },
    { field: "category_name", required: false, description: "Categoría del curso (debe existir)", example: "Desarrollo Profesional" },
    { field: "title", required: true, description: "Título del curso", example: "Introducción a Figma" },
    { field: "description", required: false, description: "Descripción del curso", example: "Curso básico de diseño en Figma" },
    { field: "instructor_email", required: false, description: "Email del instructor (si es interno)", example: "instructor@agencia.com" },
    { field: "duration_hours", required: false, description: "Duración en horas", example: "8" },
    { field: "is_mandatory", required: false, description: "Es obligatorio (true/false)", example: "false" },
    { field: "is_active", required: false, description: "Activo (true/false)", example: "true" },
  ],
  training_enrollments: [
    { field: "course_title", required: true, description: "Título del curso (debe existir)", example: "Introducción a Figma" },
    { field: "staff_email", required: true, description: "Email del empleado (debe existir)", example: "empleado@agencia.com" },
    { field: "enrollment_date", required: false, description: "Fecha de inscripción (YYYY-MM-DD)", example: "2024-01-15" },
    { field: "status", required: false, description: "Estado (enrolled/in_progress/completed/dropped)", example: "enrolled" },
    { field: "completion_date", required: false, description: "Fecha de finalización (YYYY-MM-DD)", example: "2024-01-30" },
    { field: "score", required: false, description: "Calificación obtenida", example: "95" },
  ],
  recognition_categories: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir)", example: "Mi Agencia Digital" },
    { field: "name", required: true, description: "Nombre de la categoría", example: "Excelencia" },
    { field: "description", required: false, description: "Descripción", example: "Reconocimientos por excelencia" },
    { field: "points_value", required: false, description: "Puntos por defecto", example: "100" },
    { field: "is_active", required: false, description: "Activo (true/false)", example: "true" },
  ],
  bonuses: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir)", example: "Mi Agencia Digital" },
    { field: "staff_email", required: true, description: "Email del empleado (debe existir)", example: "empleado@agencia.com" },
    { field: "bonus_type", required: true, description: "Tipo de bono", example: "Productividad" },
    { field: "amount", required: true, description: "Monto del bono", example: "5000" },
    { field: "currency_code", required: false, description: "Código de moneda (MXN/USD)", example: "MXN" },
    { field: "effective_date", required: false, description: "Fecha efectiva (YYYY-MM-DD)", example: "2024-01-31" },
    { field: "reason", required: false, description: "Motivo del bono", example: "Logro de metas Q1" },
    { field: "status", required: false, description: "Estado (pending/approved/paid/cancelled)", example: "pending" },
    { field: "notes", required: false, description: "Notas adicionales", example: "Bono trimestral" },
  ],
  loans: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir)", example: "Mi Agencia Digital" },
    { field: "staff_email", required: true, description: "Email del empleado (debe existir)", example: "empleado@agencia.com" },
    { field: "loan_type", required: false, description: "Tipo de préstamo", example: "Personal" },
    { field: "amount", required: true, description: "Monto del préstamo", example: "10000" },
    { field: "currency_code", required: false, description: "Código de moneda (MXN/USD)", example: "MXN" },
    { field: "interest_rate", required: false, description: "Tasa de interés anual (%)", example: "0" },
    { field: "term_months", required: false, description: "Plazo en meses", example: "6" },
    { field: "monthly_payment", required: false, description: "Pago mensual", example: "1666.67" },
    { field: "start_date", required: false, description: "Fecha de inicio (YYYY-MM-DD)", example: "2024-02-01" },
    { field: "status", required: false, description: "Estado (pending/approved/active/paid/cancelled)", example: "pending" },
    { field: "reason", required: false, description: "Motivo del préstamo", example: "Emergencia médica" },
    { field: "notes", required: false, description: "Notas adicionales", example: "Aprobado por RH" },
  ],
  loan_payments: [
    { field: "staff_email", required: true, description: "Email del empleado con préstamo", example: "empleado@agencia.com" },
    { field: "payment_date", required: true, description: "Fecha del pago (YYYY-MM-DD)", example: "2024-02-15" },
    { field: "amount", required: true, description: "Monto del pago", example: "1666.67" },
    { field: "payment_method", required: false, description: "Método (payroll_deduction/manual)", example: "payroll_deduction" },
    { field: "notes", required: false, description: "Notas", example: "Deducción de nómina quincena 1" },
  ],
  
  // ==================== NUEVAS TABLAS COMERCIAL ====================
  crm_pipeline_stages: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir)", example: "Mi Agencia Digital" },
    { field: "name", required: true, description: "Nombre de la etapa", example: "Contacto Inicial" },
    { field: "description", required: false, description: "Descripción", example: "Primera llamada o contacto" },
    { field: "sort_order", required: false, description: "Orden de aparición", example: "1" },
    { field: "probability", required: false, description: "Probabilidad de cierre (%)", example: "10" },
    { field: "is_active", required: false, description: "Activo (true/false)", example: "true" },
  ],
  crm_lead_sources: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir)", example: "Mi Agencia Digital" },
    { field: "name", required: true, description: "Nombre de la fuente", example: "Referido" },
    { field: "description", required: false, description: "Descripción", example: "Cliente referido por otro cliente" },
    { field: "is_active", required: false, description: "Activo (true/false)", example: "true" },
  ],
  crm_tasks: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir)", example: "Mi Agencia Digital" },
    { field: "prospect_contact_name", required: true, description: "Nombre del prospecto (debe existir)", example: "Carlos Rodríguez" },
    { field: "title", required: true, description: "Título de la tarea", example: "Enviar propuesta comercial" },
    { field: "description", required: false, description: "Descripción detallada", example: "Preparar y enviar propuesta de servicios" },
    { field: "due_date", required: false, description: "Fecha límite (YYYY-MM-DD)", example: "2024-02-15" },
    { field: "priority", required: false, description: "Prioridad (low/medium/high)", example: "high" },
    { field: "assigned_to_email", required: false, description: "Email del responsable", example: "ventas@agencia.com" },
    { field: "status", required: false, description: "Estado (pending/in_progress/completed/cancelled)", example: "pending" },
  ],
  
  // ==================== TABLAS ADMINISTRACIÓN ADICIONALES ====================
  industries: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir)", example: "Mi Agencia Digital" },
    { field: "name", required: true, description: "Nombre de la industria", example: "Tecnología" },
    { field: "description", required: false, description: "Descripción", example: "Empresas de tecnología y software" },
    { field: "is_active", required: false, description: "Activo (true/false)", example: "true" },
  ],
  referral_sources: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir)", example: "Mi Agencia Digital" },
    { field: "name", required: true, description: "Nombre de la fuente", example: "Google" },
    { field: "description", required: false, description: "Descripción", example: "Búsqueda en Google" },
    { field: "is_active", required: false, description: "Activo (true/false)", example: "true" },
  ],
  vendor_types: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir)", example: "Mi Agencia Digital" },
    { field: "name", required: true, description: "Nombre del tipo", example: "Servicios Profesionales" },
    { field: "description", required: false, description: "Descripción", example: "Proveedores de servicios profesionales" },
    { field: "is_active", required: false, description: "Activo (true/false)", example: "true" },
  ],
  account_services: [
    { field: "account_name", required: true, description: "Nombre de la cuenta (debe existir)", example: "Marca Premium" },
    { field: "service_name", required: true, description: "Nombre del servicio (debe existir)", example: "Community Management" },
    { field: "client_company_name", required: true, description: "Nombre del cliente (para identificar cuenta)", example: "Acme Corp" },
    { field: "quantity", required: false, description: "Cantidad", example: "1" },
    { field: "unit_price", required: false, description: "Precio unitario", example: "15000" },
    { field: "currency_code", required: false, description: "Código de moneda", example: "MXN" },
    { field: "is_active", required: false, description: "Activo (true/false)", example: "true" },
  ],
  project_services: [
    { field: "project_name", required: true, description: "Nombre del proyecto (debe existir)", example: "Campaña Navidad 2024" },
    { field: "service_name", required: true, description: "Nombre del servicio (debe existir)", example: "Diseño de Banner" },
    { field: "quantity", required: false, description: "Cantidad", example: "5" },
    { field: "unit_price", required: false, description: "Precio unitario", example: "2000" },
    { field: "total", required: false, description: "Total", example: "10000" },
  ],
  
  // ==================== 6. CONFIGURACIÓN ====================
  agencies: [
    { field: "name", required: true, description: "Nombre comercial de la agencia", example: "Mi Agencia Digital" },
    { field: "legal_name", required: false, description: "Razón social completa", example: "Mi Agencia Digital S.A. de C.V." },
    { field: "tax_id", required: false, description: "RFC de la agencia (13 caracteres)", example: "MAD123456ABC" },
    { field: "address", required: false, description: "Dirección completa", example: "Av. Reforma 500, Col. Juárez, CDMX" },
    { field: "phone", required: false, description: "Teléfono principal", example: "+52 55 1234 5678" },
    { field: "email", required: false, description: "Email principal", example: "info@miagencia.com" },
    { field: "website", required: false, description: "Sitio web", example: "https://miagencia.com" },
    { field: "logo_url", required: false, description: "URL del logo", example: "https://example.com/logo.png" },
    { field: "currency", required: false, description: "Moneda principal (código)", example: "MXN" },
    { field: "is_active", required: false, description: "Agencia activa (true/false)", example: "true" },
  ],
  agency_commission_types: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir)", example: "Mi Agencia Digital" },
    { field: "name", required: true, description: "Nombre del tipo de cliente", example: "Inmobiliaria" },
    { field: "amount", required: true, description: "Monto de comisión por cita (MXN)", example: "500" },
    { field: "display_order", required: false, description: "Orden de visualización", example: "1" },
    { field: "is_active", required: false, description: "Tipo activo (true/false)", example: "true" },
  ],
  currencies: [
    { field: "code", required: true, description: "Código ISO de la moneda (3 letras)", example: "MXN" },
    { field: "name", required: true, description: "Nombre completo de la moneda", example: "Peso Mexicano" },
    { field: "symbol", required: true, description: "Símbolo de la moneda", example: "$" },
    { field: "decimal_places", required: false, description: "Número de decimales", example: "2" },
    { field: "is_active", required: false, description: "Moneda activa (true/false)", example: "true" },
  ],
  bank_accounts: [
    { field: "agency_name", required: true, description: "Nombre de la agencia (debe existir en el sistema)", example: "Mi Agencia Digital" },
    { field: "bank_name", required: true, description: "Nombre del banco", example: "BBVA" },
    { field: "account_name", required: true, description: "Nombre descriptivo de la cuenta", example: "Cuenta Principal Operativa" },
    { field: "account_number", required: false, description: "Número de cuenta", example: "0123456789" },
    { field: "clabe", required: false, description: "CLABE interbancaria (18 dígitos)", example: "012345678901234567" },
    { field: "swift_code", required: false, description: "Código SWIFT para transferencias internacionales", example: "BBVAMXMM" },
    { field: "iban", required: false, description: "IBAN (cuentas internacionales)", example: "" },
    { field: "routing_number", required: false, description: "Routing Number (cuentas USA)", example: "" },
    { field: "branch", required: false, description: "Sucursal", example: "Reforma 222" },
    { field: "account_type", required: false, description: "Tipo (checking/savings/investment)", example: "checking" },
    { field: "currency_code", required: false, description: "Código de moneda (MXN/USD)", example: "MXN" },
    { field: "is_primary", required: false, description: "Es cuenta principal (true/false)", example: "true" },
    { field: "is_active", required: false, description: "Cuenta activa (true/false)", example: "true" },
    { field: "notes", required: false, description: "Notas adicionales", example: "Cuenta para pagos a proveedores" },
  ],
  roles: [
    { field: "name", required: true, description: "Nombre técnico del rol (sin espacios)", example: "account_manager" },
    { field: "display_name", required: true, description: "Nombre visible del rol", example: "Ejecutivo de Cuenta" },
    { field: "description", required: false, description: "Descripción del rol", example: "Gestiona cuentas de clientes" },
    { field: "level", required: true, description: "Nivel de permisos (1-100, mayor = más permisos)", example: "50" },
    { field: "scope", required: false, description: "Alcance (agency/global)", example: "agency" },
    { field: "is_active", required: false, description: "Rol activo (true/false)", example: "true" },
  ],
}

export default function ImportExportPage() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [selectedAgency, setSelectedAgency] = useState<string>("all")
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [importProgress, setImportProgress] = useState(0)
  const [importResults, setImportResults] = useState<{ table: string; success: number; errors: number; errorMessages?: string[] }[]>([])
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({})
  const [exportFormat, setExportFormat] = useState<"xlsx" | "csv">("xlsx")
  const [expandedImportCategories, setExpandedImportCategories] = useState<string[]>(["administracion"])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const categoryFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [showImportModeDialog, setShowImportModeDialog] = useState(false)
  const [pendingImport, setPendingImport] = useState<Record<string, unknown[]> | null>(null)
  const [importMode, setImportMode] = useState<"update" | "replace">("update")
  const supabase = createClient()

  // Abre el diálogo para elegir el modo de importación antes de procesar
  const requestImport = (importData: Record<string, unknown[]>) => {
    setPendingImport(importData)
    setImportMode("update")
    setShowImportModeDialog(true)
  }

  const confirmImport = async () => {
    const data = pendingImport
    const mode = importMode
    setShowImportModeDialog(false)
    setPendingImport(null)
    if (data) {
      await processImport(data, mode)
    }
  }

  const toggleImportCategory = (category: string) => {
    setExpandedImportCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handleDownloadTemplate = (tableId: string) => {
    const table = exportTables.find(t => t.id === tableId)
    if (!table) return

    const columns = templateColumns[tableId]
    if (!columns) {
      toast.error("No hay template disponible para esta tabla")
      return
    }

    // Create workbook with template
    const workbook = XLSX.utils.book_new()
    
    // Create headers row
    const headers = columns.map(col => col.field)
    const descriptions = columns.map(col => `${col.description}${col.required ? " *" : ""}`)
    const examples = columns.map(col => col.example)

    // Create worksheet with header, description, and example rows
    const wsData = [
      headers,
      descriptions,
      examples,
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(wsData)

    // Set column widths
    const colWidths = columns.map(col => ({ wch: Math.max(col.field.length, col.description.length, col.example.length) + 2 }))
    worksheet["!cols"] = colWidths

    XLSX.utils.book_append_sheet(workbook, worksheet, table.name.substring(0, 31))

    // Download
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `template_${table.name}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success(`Template descargado: ${table.label}`)
  }

  const handleDownloadAllTemplates = () => {
    const workbook = XLSX.utils.book_new()

    for (const table of exportTables) {
      const columns = templateColumns[table.id]
      if (!columns) continue

      const headers = columns.map(col => col.field)
      const descriptions = columns.map(col => `${col.description}${col.required ? " *" : ""}`)
      const examples = columns.map(col => col.example)

      const wsData = [headers, descriptions, examples]
      const worksheet = XLSX.utils.aoa_to_sheet(wsData)
      
      const colWidths = columns.map(col => ({ wch: Math.max(col.field.length, col.description.length, col.example.length) + 2 }))
      worksheet["!cols"] = colWidths

      XLSX.utils.book_append_sheet(workbook, worksheet, table.name.substring(0, 31))
    }

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `templates_importacion_completo.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success("Todos los templates descargados en un archivo Excel")
  }

  const handleCategoryFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, tableId: string) => {
    const file = event.target.files?.[0]
    if (!file) return

    const fileExtension = file.name.split(".").pop()?.toLowerCase()
    const table = exportTables.find(t => t.id === tableId)
    if (!table) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = e.target?.result
        let jsonData: Record<string, unknown>[] = []

        if (fileExtension === "xlsx" || fileExtension === "xls" || fileExtension === "csv") {
          const workbook = XLSX.read(data, { type: "array" })
          const worksheet = workbook.Sheets[workbook.SheetNames[0]]
          
// Check if this is a template file by looking at the raw data
            const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][]
            
            
            if (rawData.length >= 2) {
              const row1 = rawData[0] as unknown[]
              const row2 = rawData[1] as unknown[]
              const row2Text = row2?.join(" ") || ""
              
              // Check if row 1 has valid field names (template headers)
              const row1HasFieldNames = row1?.some(cell => 
                typeof cell === "string" && (
                  cell.includes("_") || // field_name format
                  cell === "agency_name" ||
                  cell === "company_name" ||
                  cell === "name" ||
                  cell === "email"
                )
              )
              
              // Check if row 2 looks like descriptions (contains " *" for required fields or descriptive text)
              const isTemplateFormat = row2Text.includes(" *") || 
                                       row2Text.toLowerCase().includes("debe existir") ||
                                       row2Text.toLowerCase().includes("nombre de la agencia") ||
                                       row2Text.toLowerCase().includes("obligatorio")
              
              
              
              if (isTemplateFormat && row1HasFieldNames) {
                // Template format: Row 1 = headers, Row 2 = descriptions, Row 3 = examples, Row 4+ = data
                // We need to manually build JSON using Row 1 as headers and Row 4+ as data
                const headers = rawData[0] as string[]
                const dataRows = rawData.slice(3) // Skip rows 0, 1, 2 (headers, descriptions, examples)
                
                
                
                // Build JSON objects from data rows using headers
                jsonData = dataRows
                  .filter(row => row && row.length > 0 && row.some(cell => cell !== undefined && cell !== null && cell !== ""))
                  .map(row => {
                    const obj: Record<string, unknown> = {}
                    headers.forEach((header, index) => {
                      if (header && row[index] !== undefined && row[index] !== null && row[index] !== "") {
                        obj[header] = row[index]
                      }
                    })
                    return obj
                  })
                  .filter(obj => Object.keys(obj).length > 0)
                
                
              } else if (row1HasFieldNames) {
                // Has field names but no description row - regular format
                jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[]
              } else {
                // Try to detect if headers are in a different row
                jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[]
              }
            } else {
              jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[]
            }
        } else {
          toast.error("Formato no soportado. Use archivos .xlsx, .xls o .csv")
          return
        }

        if (jsonData.length === 0) {
          toast.error("El archivo no contiene datos para importar (solo encontramos headers/descripciones/ejemplos)")
          return
        }

        requestImport({ [table.name]: jsonData })
      } catch (error) {
        console.error("Import error:", error)
        toast.error("Error al procesar el archivo")
      }
    }
    reader.readAsArrayBuffer(file)
    
    // Reset input
    event.target.value = ""
  }

  useEffect(() => {
    fetchAgencies()
    fetchTableCounts()
  }, [])

  async function fetchAgencies() {
    const { data } = await supabase.from("agencies").select("id, name").eq("is_active", true).order("name")
    if (data) setAgencies(data)
  }

  async function fetchTableCounts() {
    const counts: Record<string, number> = {}
    for (const table of exportTables) {
      try {
        const { count } = await supabase.from(table.name).select("*", { count: "exact", head: true })
        counts[table.id] = count || 0
      } catch {
        counts[table.id] = 0
      }
    }
    setTableCounts(counts)
  }

  const toggleTable = (tableId: string) => {
    setSelectedTables(prev => 
      prev.includes(tableId) 
        ? prev.filter(t => t !== tableId)
        : [...prev, tableId]
    )
  }

  const selectAllTables = () => {
    setSelectedTables(exportTables.map(t => t.id))
  }

  const deselectAllTables = () => {
    setSelectedTables([])
  }

  const selectCategory = (category: string) => {
    const categoryTables = exportTables.filter(t => t.category === category).map(t => t.id)
    const allSelected = categoryTables.every(t => selectedTables.includes(t))
    
    if (allSelected) {
      setSelectedTables(prev => prev.filter(t => !categoryTables.includes(t)))
    } else {
      setSelectedTables(prev => [...new Set([...prev, ...categoryTables])])
    }
  }

  // Define select queries with related data for each table
  const getSelectQuery = (tableName: string): string => {
    const selectQueries: Record<string, string> = {
      // Administración
      clients: "*, agency:agencies(name)",
      client_contacts: "*, client:clients(company_name, agency_id)",
      accounts: "*, client:clients(company_name), agency:agencies(name)",
      industries: "*, agency:agencies(name)",
      referral_sources: "*, agency:agencies(name)",
      
      // Operaciones
      projects: "*, account:accounts(account_name), agency:agencies(name), currency:currencies(code)",
      services: "*, agency:agencies(name), department:departments(name)",
      account_services: "*, account:accounts(account_name), service:services(name)",
      project_services: "*, project:projects(name), service:services(name)",
      
      // RRHH
      staff: "*, agency:agencies(name), payroll_agency:agencies!staff_payroll_agency_id_fkey(name), currency:currencies(code), reports_to:staff!staff_reports_to_id_fkey(first_name, last_name, email), department:departments(name), position:positions(name), role:roles(name, display_name)",
      staff_documents: "*, staff:staff(first_name, last_name, email, agency_id)",
      departments: "*, agency:agencies(name)",
      positions: "*, agency:agencies(name), department:departments(name)",
      contract_types: "*, agency:agencies(name)",
      candidates: "*, agency:agencies(name), position:positions(name)",
      leave_types: "*, agency:agencies(name)",
      leave_balances: "*, agency:agencies(name), staff:staff(first_name, last_name, email), leave_type:leave_types(name)",
      leave_requests: "*, agency:agencies(name), staff:staff(first_name, last_name, email), leave_type:leave_types(name)",
      holidays: "*, agency:agencies(name)",
      training_categories: "*, agency:agencies(name)",
      training_courses: "*, agency:agencies(name), category:training_categories(name)",
      training_enrollments: "*, course:training_courses(title), staff:staff(first_name, last_name, email)",
      recognition_categories: "*, agency:agencies(name)",
      bonuses: "*, agency:agencies(name), staff:staff(first_name, last_name, email), currency:currencies(code)",
      loans: "*, agency:agencies(name), staff:staff(first_name, last_name, email), currency:currencies(code)",
      loan_payments: "*, loan:loans(id, staff_id)",
      
      // Comercial
      crm_pipeline_stages: "*, agency:agencies(name)",
      crm_lead_sources: "*, agency:agencies(name)",
      crm_prospects: "*, agency:agencies(name), stage:crm_pipeline_stages(name), source:crm_lead_sources(name), assigned_to:staff(first_name, last_name, email)",
      crm_activities: "*, agency:agencies(name), prospect:crm_prospects(contact_name, company_name), staff:staff(first_name, last_name)",
      crm_tasks: "*, agency:agencies(name), prospect:crm_prospects(contact_name, company_name), assigned_to:staff(first_name, last_name)",
      quotations: "*, agency:agencies(name), prospect:crm_prospects(contact_name, company_name), staff:staff(first_name, last_name, email), currency:currencies(code)",
      
      // Finanzas
      invoices: "*, client:clients(company_name), account:accounts(account_name), project:projects(name), agency:agencies(name), currency:currencies(code)",
      invoice_items: "*, invoice:invoices(invoice_number), service:services(name)",
      payments: "*, invoice:invoices(invoice_number), client:clients(company_name), account:accounts(account_name), agency:agencies(name), currency:currencies(code), bank_account:bank_accounts(account_name)",
      expenses: "*, category:expense_categories(name), project:projects(name), agency:agencies(name), currency:currencies(code), bank_account:bank_accounts(account_name), vendor:vendors(name)",
      expense_categories: "*, agency:agencies(name)",
      vendors: "*, agency:agencies(name), currency:currencies(code), vendor_type:vendor_types(name)",
      vendor_contacts: "*, vendor:vendors(name, agency_id)",
      vendor_types: "*, agency:agencies(name)",
      commissions: "*, agency:agencies(name), staff:staff(first_name, last_name, email), prospect:crm_prospects(contact_name), client:clients(company_name), quotation:quotations(quotation_number), currency:currencies(code)",
      third_party_payments: "*, client:clients(company_name), vendor:vendors(name), project:projects(name), agency:agencies(name), currency:currencies(code)",
      payroll_periods: "*, agency:agencies(name)",
      payroll_details: "*, period:payroll_periods(period_name), staff:staff(first_name, last_name, email)",
      
      // Configuración
      agencies: "*",
      agency_commission_types: "*, agency:agencies(name)",
      currencies: "*",
      bank_accounts: "*, agency:agencies(name), currency:currencies(code)",
      roles: "*",
    }
    return selectQueries[tableName] || "*"
  }

  // Flatten nested objects for export
  const flattenData = (data: Record<string, unknown>[]): Record<string, unknown>[] => {
    return data.map(row => {
      const flatRow: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(row)) {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          // Flatten nested object (like agency: {name: "..."})
          const nestedObj = value as Record<string, unknown>
          for (const [nestedKey, nestedValue] of Object.entries(nestedObj)) {
            flatRow[`${key}_${nestedKey}`] = nestedValue
          }
        } else {
          flatRow[key] = value
        }
      }
      return flatRow
    })
  }

  const handleExport = async () => {
    if (selectedTables.length === 0) {
      toast.error("Selecciona al menos una tabla para exportar")
      return
    }

    setExporting(true)
    setExportProgress(0)

    try {
      const exportData: Record<string, unknown[]> = {}
      const totalTables = selectedTables.length

      for (let i = 0; i < selectedTables.length; i++) {
        const tableId = selectedTables[i]
        const table = exportTables.find(t => t.id === tableId)
        if (!table) continue

        const selectQuery = getSelectQuery(table.name)
        let query = supabase.from(table.name).select(selectQuery)
        
        // Filter by agency if selected and table has agency_id
        if (selectedAgency !== "all") {
          // Check if table supports agency_id filtering
          const tablesWithAgencyId = [
            "clients", "client_contacts", "accounts", "industries", "referral_sources",
            "vendors", "vendor_contacts", "vendor_types",
            "projects", "services", "account_services", "project_services",
            "invoices", "invoice_items", "expenses", "expense_categories", "bank_accounts", "payments", "third_party_payments",
            "payroll_periods", "payroll_details", "commissions", "bonuses", "loans",
            "staff", "staff_documents", "departments", "positions", "contract_types", "candidates",
            "leave_types", "leave_balances", "leave_requests", "holidays",
            "training_categories", "training_courses", "recognition_categories",
            "crm_pipeline_stages", "crm_lead_sources", "crm_prospects", "crm_activities", "crm_tasks", "quotations",
            "agency_commission_types"
          ]
          if (tablesWithAgencyId.includes(table.name)) {
            query = query.eq("agency_id", selectedAgency)
          }
        }

        const { data, error } = await query

        if (error) {
          console.error(`Error exporting ${table.name}:`, error)
          toast.error(`Error al exportar ${table.label}`)
        } else {
          // Flatten nested data and include all records
          const flatData = flattenData((data || []) as Record<string, unknown>[])
          exportData[table.name] = flatData
        }

        setExportProgress(Math.round(((i + 1) / totalTables) * 100))
      }

      const agencyName = selectedAgency === "all" ? "global" : agencies.find(a => a.id === selectedAgency)?.name || "agency"
      const dateStr = new Date().toISOString().split("T")[0]
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")

      if (exportFormat === "xlsx") {
        // Create Excel workbook with multiple sheets
        const workbook = XLSX.utils.book_new()
        
        for (const [tableName, data] of Object.entries(exportData)) {
          // Always create sheet, even if empty - include headers from template
          const tableConfig = exportTables.find(t => t.name === tableName)
          const columns = tableConfig ? templateColumns[tableConfig.id] : null
          
          let worksheet: XLSX.WorkSheet
          
          if (data.length > 0) {
            // If we have data, export it
            worksheet = XLSX.utils.json_to_sheet(data)
          } else if (columns) {
            // If no data but we have template, create empty sheet with headers
            const headers = columns.map(col => col.field)
            worksheet = XLSX.utils.aoa_to_sheet([headers])
          } else {
            // Skip tables with no data and no template
            continue
          }
          
          // Set column widths for better readability
          const colWidths = Object.keys(data[0] || {}).map(() => ({ wch: 20 }))
          worksheet["!cols"] = colWidths
          
          const sheetName = tableName.substring(0, 31)
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
        }

        // Generate and download Excel file
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
        const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `export_${agencyName}_${dateStr}_${timestamp}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        // Export as CSV
        if (selectedTables.length === 1) {
          const tableName = Object.keys(exportData)[0]
          const data = exportData[tableName]
          const tableConfig = exportTables.find(t => t.name === tableName)
          const columns = tableConfig ? templateColumns[tableConfig.id] : null
          
          let worksheet: XLSX.WorkSheet
          if (data && data.length > 0) {
            worksheet = XLSX.utils.json_to_sheet(data)
          } else if (columns) {
            const headers = columns.map(col => col.field)
            worksheet = XLSX.utils.aoa_to_sheet([headers])
          } else {
            toast.error("No hay datos para exportar")
            return
          }
          
          const csvContent = XLSX.utils.sheet_to_csv(worksheet)
          const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" }) // BOM for Excel compatibility
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `${tableName}_${dateStr}.csv`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        } else {
          // For multiple tables, create Excel
          toast.info("Para exportar múltiples tablas en CSV, usa la opción Excel (.xlsx) que incluye todas las hojas")
          const workbook = XLSX.utils.book_new()
          for (const [tableName, data] of Object.entries(exportData)) {
            const tableConfig = exportTables.find(t => t.name === tableName)
            const columns = tableConfig ? templateColumns[tableConfig.id] : null
            
            let worksheet: XLSX.WorkSheet
            if (data.length > 0) {
              worksheet = XLSX.utils.json_to_sheet(data)
            } else if (columns) {
              const headers = columns.map(col => col.field)
              worksheet = XLSX.utils.aoa_to_sheet([headers])
            } else {
              continue
            }
            
            const sheetName = tableName.substring(0, 31)
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
          }
          const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
          const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `export_${agencyName}_${dateStr}_${timestamp}.xlsx`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
      }

      // Count total records exported
      const totalRecords = Object.values(exportData).reduce((sum, arr) => sum + arr.length, 0)
      toast.success(`Exportación completada: ${Object.keys(exportData).length} tablas, ${totalRecords} registros`)
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Error durante la exportación")
    } finally {
      setExporting(false)
      setExportProgress(0)
    }
  }

  const handleExportSingleTable = async (tableId: string, format: "xlsx" | "csv") => {
    const table = exportTables.find(t => t.id === tableId)
    if (!table) return

    try {
      const selectQuery = getSelectQuery(table.name)
      let query = supabase.from(table.name).select(selectQuery)
      
      // Filter by agency if applicable
const tablesWithAgencyId = [
          "clients", "client_contacts", "accounts", "industries", "referral_sources",
          "vendors", "vendor_contacts", "vendor_types",
          "projects", "services", "account_services", "project_services",
          "invoices", "invoice_items", "expenses", "expense_categories", "bank_accounts", "payments", "third_party_payments",
          "payroll_periods", "payroll_details", "commissions", "bonuses", "loans",
          "staff", "staff_documents", "departments", "positions", "contract_types", "candidates",
          "leave_types", "leave_balances", "leave_requests", "holidays",
          "training_categories", "training_courses", "recognition_categories",
          "crm_pipeline_stages", "crm_lead_sources", "crm_prospects", "crm_activities", "crm_tasks", "quotations",
          "agency_commission_types"
        ]
        if (selectedAgency !== "all" && tablesWithAgencyId.includes(table.name)) {
        query = query.eq("agency_id", selectedAgency)
      }

      const { data, error } = await query

      if (error) {
        toast.error(`Error al exportar ${table.label}`)
        return
      }

      const columns = templateColumns[tableId]
      const dateStr = new Date().toISOString().split("T")[0]
      
      let worksheet: XLSX.WorkSheet
      let recordCount = 0

      if (data && data.length > 0) {
        // Flatten nested data
        const flatData = flattenData(data as Record<string, unknown>[])
        worksheet = XLSX.utils.json_to_sheet(flatData)
        recordCount = flatData.length
        
        // Set column widths
        const colWidths = Object.keys(flatData[0] || {}).map(() => ({ wch: 20 }))
        worksheet["!cols"] = colWidths
      } else if (columns) {
        // Create sheet with headers only if no data
        const headers = columns.map(col => col.field)
        worksheet = XLSX.utils.aoa_to_sheet([headers])
        toast.info(`${table.label}: No hay datos, se exportaron solo los encabezados`)
      } else {
        toast.error(`No hay datos para exportar en ${table.label}`)
        return
      }

      if (format === "xlsx") {
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, table.name.substring(0, 31))
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
        const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${table.name}_${dateStr}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success(`${table.label} exportado: ${recordCount} registros`)
      } else {
        const csvContent = XLSX.utils.sheet_to_csv(worksheet)
        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" }) // BOM for Excel
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${table.name}_${dateStr}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success(`${table.label} exportado: ${recordCount} registros`)
      }
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Error al exportar")
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const fileExtension = file.name.split(".").pop()?.toLowerCase()

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = e.target?.result

        if (fileExtension === "xlsx" || fileExtension === "xls") {
          // Parse Excel file
          const workbook = XLSX.read(data, { type: "array" })
          const importData: Record<string, unknown[]> = {}
          
          for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName]
            
            // Check if this is a template file by looking at the second row
            // Template format: Row 1 = headers, Row 2 = descriptions (contains "*" for required), Row 3 = examples
            const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][]
            
            let jsonData: unknown[]
            if (rawData.length >= 2) {
              const row2 = rawData[1] as unknown[]
              const row2Text = row2?.join(" ") || ""
              
              // Check if row 2 looks like descriptions (contains " *" for required fields or descriptive text)
              const isTemplateFormat = row2Text.includes(" *") || 
                                       row2Text.toLowerCase().includes("debe existir") ||
                                       row2Text.toLowerCase().includes("nombre de la agencia")
              
if (isTemplateFormat) {
  // Template format: Row 1 = headers, Row 2 = descriptions, Row 3 = examples, Row 4+ = data
  // We need to manually build JSON using Row 1 as headers and Row 4+ as data
  const headers = rawData[0] as string[]
  const dataRows = rawData.slice(3) // Skip rows 0, 1, 2 (headers, descriptions, examples)
  
  // Build JSON objects from data rows using headers
  jsonData = dataRows
    .filter(row => row && row.length > 0 && row.some(cell => cell !== undefined && cell !== null && cell !== ""))
    .map(row => {
      const obj: Record<string, unknown> = {}
      headers.forEach((header, index) => {
        if (header && row[index] !== undefined && row[index] !== null && row[index] !== "") {
          obj[header] = row[index]
        }
      })
      return obj
    })
    .filter(obj => Object.keys(obj).length > 0)
  
  
  } else {
  // Regular format - no description row
  jsonData = XLSX.utils.sheet_to_json(worksheet)
  }
  } else {
  jsonData = XLSX.utils.sheet_to_json(worksheet)
  }
            
            if (jsonData.length > 0) {
              importData[sheetName] = jsonData
            }
          }
          
          if (Object.keys(importData).length === 0) {
            toast.error("El archivo no contiene datos para importar (solo headers/descripciones)")
            return
          }
          
          requestImport(importData)
        } else if (fileExtension === "csv") {
          // Parse CSV file - use filename (without extension) as table name
          const workbook = XLSX.read(data, { type: "array" })
          const worksheet = workbook.Sheets[workbook.SheetNames[0]]
          
          // Same template detection logic for CSV
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][]
          let jsonData: unknown[]
          
          if (rawData.length >= 2) {
            const row2 = rawData[1] as unknown[]
            const row2Text = row2?.join(" ") || ""
            const isTemplateFormat = row2Text.includes(" *") || 
                                     row2Text.toLowerCase().includes("debe existir")
            
if (isTemplateFormat) {
  // Template format: Row 1 = headers, Row 2 = descriptions, Row 3 = examples, Row 4+ = data
  const headers = rawData[0] as string[]
  const dataRows = rawData.slice(3)
  
  jsonData = dataRows
    .filter(row => row && row.length > 0 && row.some(cell => cell !== undefined && cell !== null && cell !== ""))
    .map(row => {
      const obj: Record<string, unknown> = {}
      headers.forEach((header, index) => {
        if (header && row[index] !== undefined && row[index] !== null && row[index] !== "") {
          obj[header] = row[index]
        }
      })
      return obj
    })
    .filter(obj => Object.keys(obj).length > 0)
  
  
  } else {
  jsonData = XLSX.utils.sheet_to_json(worksheet)
  }
  } else {
  jsonData = XLSX.utils.sheet_to_json(worksheet)
  }
          
          const tableName = file.name.replace(/\.[^/.]+$/, "").split("_")[0]
          
          if (jsonData.length === 0) {
            toast.error("El archivo no contiene datos para importar")
            return
          }
          
          requestImport({ [tableName]: jsonData })
        } else {
          toast.error("Formato no soportado. Usa archivos .xlsx, .xls o .csv")
        }
      } catch (error) {
        console.error("Import parse error:", error)
        toast.error("Error al leer el archivo. Verifica que sea un archivo Excel o CSV válido.")
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // Helper function to resolve reference fields (e.g., agency_name -> agency_id)
  const resolveReferences = async (
    tableName: string, 
    rows: Record<string, unknown>[]
  ): Promise<{ data: Record<string, unknown>[]; errors: string[] }> => {
    const resolvedRows: Record<string, unknown>[] = []
    const errors: string[] = []

    // Cache for lookups to avoid repeated queries
    const agencyCache = new Map<string, string>()
    const clientCache = new Map<string, string>()
    const vendorCache = new Map<string, string>()
    const employeeCache = new Map<string, string>()
    const currencyCache = new Map<string, string>()
    const projectCache = new Map<string, string>()
    const categoryCache = new Map<string, string>()

    // Pre-fetch agencies for resolution
    const { data: agenciesData } = await supabase.from("agencies").select("id, name")
    agenciesData?.forEach(a => agencyCache.set(a.name.toLowerCase(), a.id))

    for (const row of rows) {
      const resolved: Record<string, unknown> = {}
      let hasError = false

      for (const [key, value] of Object.entries(row)) {
        // Skip system fields
        if (["id", "created_at", "updated_at"].includes(key)) continue
        
        // Handle agency_name -> agency_id
        if (key === "agency_name" && value) {
          const agencyId = agencyCache.get(String(value).toLowerCase())
          if (agencyId) {
            resolved.agency_id = agencyId
          } else {
            errors.push(`Agencia no encontrada: ${value}`)
            hasError = true
          }
          continue
        }

        // Handle agency_names -> agency_ids (for staff with multiple agencies)
        if (key === "agency_names" && value) {
          const names = String(value).split(",").map(n => n.trim().toLowerCase())
          const ids: string[] = []
          for (const name of names) {
            const agencyId = agencyCache.get(name)
            if (agencyId) {
              ids.push(agencyId)
            } else {
              errors.push(`Agencia no encontrada: ${name}`)
            }
          }
          if (ids.length > 0) {
            resolved.agency_ids = ids
            if (!resolved.agency_id) resolved.agency_id = ids[0]
          }
          continue
        }

        // Handle client_company_name -> client_id
        if (key === "client_company_name" && value) {
          const cacheKey = `${resolved.agency_id || ""}:${String(value).toLowerCase()}`
          if (!clientCache.has(cacheKey)) {
            const query = supabase.from("clients").select("id").ilike("company_name", String(value))
            if (resolved.agency_id) query.eq("agency_id", resolved.agency_id)
            const { data } = await query.limit(1).single()
            if (data) clientCache.set(cacheKey, data.id)
          }
          const clientId = clientCache.get(cacheKey)
          if (clientId) {
            resolved.client_id = clientId
          } else {
            errors.push(`Cliente no encontrado: ${value}`)
            hasError = true
          }
          continue
        }

        // Handle client_tax_id -> client_id (alternative to company_name)
        if (key === "client_tax_id" && value && !resolved.client_id) {
          const cacheKey = `tax:${resolved.agency_id || ""}:${String(value).toUpperCase()}`
          if (!clientCache.has(cacheKey)) {
            const query = supabase.from("clients").select("id").ilike("tax_id", String(value))
            if (resolved.agency_id) query.eq("agency_id", resolved.agency_id)
            const { data } = await query.limit(1).single()
            if (data) clientCache.set(cacheKey, data.id)
          }
          const clientId = clientCache.get(cacheKey)
          if (clientId) {
            resolved.client_id = clientId
          }
          continue
        }

        // Handle bank_account_name -> bank_account_id
        if (key === "bank_account_name" && value) {
          const { data } = await supabase
            .from("agency_bank_accounts")
            .select("id")
            .eq("agency_id", resolved.agency_id)
            .ilike("bank_name", String(value))
            .limit(1)
            .single()
          if (data) {
            resolved.bank_account_id = data.id
          }
          continue
        }

        // Handle vendor_name -> vendor_id
        if (key === "vendor_name" && value && tableName !== "vendors") {
          const cacheKey = `${resolved.agency_id || ""}:${String(value).toLowerCase()}`
          if (!vendorCache.has(cacheKey)) {
            const query = supabase.from("vendors").select("id").ilike("name", String(value))
            if (resolved.agency_id) query.eq("agency_id", resolved.agency_id)
            const { data } = await query.limit(1).single()
            if (data) vendorCache.set(cacheKey, data.id)
          }
          const vendorId = vendorCache.get(cacheKey)
          if (vendorId) {
            resolved.vendor_id = vendorId
          }
          continue
        }

        // Handle project_name -> project_id
        if (key === "project_name" && value) {
          const cacheKey = `${resolved.agency_id || ""}:${String(value).toLowerCase()}`
          if (!projectCache.has(cacheKey)) {
            const query = supabase.from("projects").select("id").ilike("name", String(value))
            if (resolved.agency_id) query.eq("agency_id", resolved.agency_id)
            const { data } = await query.limit(1).single()
            if (data) projectCache.set(cacheKey, data.id)
          }
          const projectId = projectCache.get(cacheKey)
          if (projectId) {
            resolved.project_id = projectId
          }
          continue
        }

        // Handle employee_email/reports_to_email -> staff_id/reports_to_id
        if ((key === "employee_email" || key === "reports_to_email") && value) {
          const cacheKey = String(value).toLowerCase()
          if (!employeeCache.has(cacheKey)) {
            const { data } = await supabase.from("staff").select("id").ilike("email", String(value)).limit(1).single()
            if (data) employeeCache.set(cacheKey, data.id)
          }
          const staffId = employeeCache.get(cacheKey)
          if (staffId) {
            if (key === "employee_email") {
              resolved.staff_id = staffId
            } else {
              resolved.reports_to_id = staffId
            }
          }
          continue
        }

        // Handle team member emails -> staff IDs for accounts
        const teamEmailMappings: Record<string, string> = {
          "account_manager_email": "account_manager_id",
          "sales_advisor_email": "sales_rep_id",
          "tech_manager_email": "tech_manager_id",
          "tech_coordinator_email": "tech_coordinator_id",
          "strategy_manager_email": "strategy_manager_id",
          "strategy_coordinator_email": "strategy_coordinator_id",
          "creative_manager_email": "creative_manager_id",
          "creative_coordinator_email": "creative_coordinator_id",
          "project_manager_email": "project_manager_id",
        }
        if (teamEmailMappings[key] && value) {
          const cacheKey = String(value).toLowerCase()
          if (!employeeCache.has(cacheKey)) {
            const { data } = await supabase.from("staff").select("id").ilike("email", String(value)).limit(1).single()
            if (data) employeeCache.set(cacheKey, data.id)
          }
          const staffId = employeeCache.get(cacheKey)
          if (staffId) {
            resolved[teamEmailMappings[key]] = staffId
          }
          continue
        }

        // Handle employee_name -> employee_id for payroll
        if (key === "employee_name" && value) {
          const cacheKey = String(value).toLowerCase()
          if (!employeeCache.has(cacheKey)) {
            // Try to find by full name (first_name + last_name)
            const { data } = await supabase
              .from("staff")
              .select("id, first_name, last_name")
            if (data) {
              const match = data.find(s => 
                `${s.first_name} ${s.last_name}`.toLowerCase() === cacheKey ||
                `${s.first_name}`.toLowerCase() === cacheKey
              )
              if (match) employeeCache.set(cacheKey, match.id)
            }
          }
          const staffId = employeeCache.get(cacheKey)
          if (staffId) {
            resolved.employee_id = staffId
          }
          continue
        }

        // Handle currency_code -> currency_id
        if (key === "currency_code" && value) {
          const cacheKey = String(value).toUpperCase()
          if (!currencyCache.has(cacheKey)) {
            const { data } = await supabase.from("currencies").select("id").eq("code", cacheKey).limit(1).single()
            if (data) currencyCache.set(cacheKey, data.id)
          }
          const currencyId = currencyCache.get(cacheKey)
          if (currencyId) {
            resolved.currency_id = currencyId
          }
          continue
        }

        // Handle category_name -> category_id for expenses
        if (key === "category_name" && value) {
          const cacheKey = `${resolved.agency_id || ""}:${String(value).toLowerCase()}`
          if (!categoryCache.has(cacheKey)) {
            const query = supabase.from("expense_categories").select("id").ilike("name", String(value))
            if (resolved.agency_id) query.eq("agency_id", resolved.agency_id)
            const { data } = await query.limit(1).single()
            if (data) categoryCache.set(cacheKey, data.id)
          }
          const categoryId = categoryCache.get(cacheKey)
          if (categoryId) {
            resolved.category_id = categoryId
          }
          continue
        }

        // Handle status field - normalize to lowercase (active, inactive, prospect, pending, completed, cancelled, etc.)
        if (key === "status" && value) {
          resolved[key] = String(value).toLowerCase().replace(/\s+/g, "_")
          continue
        }

        // Handle contract_type field - normalize to valid values
        if (key === "contract_type" && value) {
          const normalized = String(value).toLowerCase().replace(/\s+/g, "_")
          const validTypes = ["full_time", "part_time", "contractor", "freelance", "intern", "commission"]
          resolved[key] = validTypes.includes(normalized) ? normalized : "full_time"
          continue
        }

        // Handle payment_status field - normalize to lowercase
        if (key === "payment_status" && value) {
          const normalized = String(value).toLowerCase().replace(/\s+/g, "_")
          const validStatuses = ["pending", "partial", "paid", "overdue", "cancelled"]
          resolved[key] = validStatuses.includes(normalized) ? normalized : "pending"
          continue
        }

        // Handle invoice_status field - normalize to lowercase
        if (key === "invoice_status" && value) {
          const normalized = String(value).toLowerCase().replace(/\s+/g, "_")
          const validStatuses = ["draft", "sent", "paid", "partial", "overdue", "cancelled"]
          resolved[key] = validStatuses.includes(normalized) ? normalized : "draft"
          continue
        }

        // Handle project_status field - normalize to lowercase
        if (key === "project_status" && value) {
          const normalized = String(value).toLowerCase().replace(/\s+/g, "_")
          const validStatuses = ["planning", "active", "on_hold", "completed", "cancelled"]
          resolved[key] = validStatuses.includes(normalized) ? normalized : "planning"
          continue
        }

        // Handle priority field - normalize to lowercase
        if (key === "priority" && value) {
          const normalized = String(value).toLowerCase()
          const validPriorities = ["low", "medium", "high", "urgent"]
          resolved[key] = validPriorities.includes(normalized) ? normalized : "medium"
          continue
        }

        // Handle commission_type field - normalize to valid values
        if (key === "commission_type" && value) {
          const normalized = String(value).toLowerCase().replace(/\s+/g, "_")
          const validTypes = ["none", "revenue", "profit", "fixed"]
          resolved[key] = validTypes.includes(normalized) ? normalized : "none"
          continue
        }

        // Handle payment_method field - normalize to lowercase
        if (key === "payment_method" && value) {
          const normalized = String(value).toLowerCase().replace(/\s+/g, "_")
          const validMethods = ["cash", "check", "transfer", "credit_card", "debit_card", "paypal", "other"]
          resolved[key] = validMethods.includes(normalized) ? normalized : "transfer"
          continue
        }

        // Handle expense_type field - normalize to lowercase
        if (key === "expense_type" && value) {
          resolved[key] = String(value).toLowerCase().replace(/\s+/g, "_")
          continue
        }

        // Handle document_type field for staff_documents - normalize to valid values
        if (key === "document_type" && value) {
          const normalized = String(value).toLowerCase().replace(/\s+/g, "_")
          const validTypes = ["carta_interna", "comprobante_domicilio", "cv", "estado_cuenta", "identificacion_oficial"]
          resolved[key] = validTypes.includes(normalized) ? normalized : normalized
          continue
        }

        // Handle type fields generically - normalize to lowercase
        if (key === "type" && value) {
          resolved[key] = String(value).toLowerCase().replace(/\s+/g, "_")
          continue
        }

        // Handle boolean conversions
        if (key.startsWith("is_") || key === "is_active" || key === "is_billable" || key === "is_global" || key === "is_primary" || key === "is_billing_contact" || key === "taxable" || key === "recurring") {
          resolved[key] = String(value).toLowerCase() === "true" || value === true || value === 1 || value === "1" || String(value).toLowerCase() === "si" || String(value).toLowerCase() === "sí" || String(value).toLowerCase() === "yes"
          continue
        }

        // Handle numeric fields
        if (["payment_terms", "credit_limit", "monthly_salary", "hourly_cost", "commission_percentage", 
             "min_subordinates", "max_subordinates", "min_accounts", "max_accounts", "utilization_target",
             "amount", "subtotal", "tax_amount", "total", "quantity", "unit_price", "file_size",
             "discount", "discount_percentage", "tax_rate", "exchange_rate", "balance", "budget",
             "estimated_hours", "actual_hours", "rate", "cost", "price", "margin"].includes(key)) {
          const num = parseFloat(String(value).replace(/[,$]/g, ""))
          resolved[key] = isNaN(num) ? 0 : num
          continue
        }

        // Handle date fields - ensure proper format
        if (key.endsWith("_date") || key.endsWith("_at") || key === "date" || key === "due_date" || key === "start_date" || key === "end_date" || key === "hire_date" || key === "birth_date") {
          if (value) {
            // Try to parse and format date
            const dateVal = new Date(value as string)
            if (!isNaN(dateVal.getTime())) {
              resolved[key] = dateVal.toISOString().split("T")[0]
            } else {
              resolved[key] = value
            }
          }
          continue
        }

        // Handle skills field - convert comma-separated string to array
        if (key === "skills" && value) {
          if (typeof value === "string") {
            resolved[key] = value.split(",").map(s => s.trim()).filter(s => s.length > 0)
          } else if (Array.isArray(value)) {
            resolved[key] = value
          }
          continue
        }

        // Handle tags field - convert comma-separated string to array
        if (key === "tags" && value) {
          if (typeof value === "string") {
            resolved[key] = value.split(",").map(s => s.trim()).filter(s => s.length > 0)
          } else if (Array.isArray(value)) {
            resolved[key] = value
          }
          continue
        }

        // Skip document URL fields that need special handling
        if (key.startsWith("doc_") && key.endsWith("_url")) {
          // These are handled separately for staff_documents import
          continue
        }

        // Handle phone numbers - clean formatting
        if (key.includes("phone") && value) {
          resolved[key] = String(value).replace(/[^\d+\-\s()]/g, "")
          continue
        }

        // Handle email fields - lowercase and trim
        if (key.includes("email") && value) {
          resolved[key] = String(value).toLowerCase().trim()
          continue
        }

        // La columna real de la tabla accounts es account_name (no existe "name")
        if (key === "account_name" && value) {
          resolved["account_name"] = value
          continue
        }

        // Map account_type to type for accounts table
        if (key === "account_type" && value) {
          const normalized = String(value).toLowerCase().replace(/\s+/g, "_")
          const validTypes = ["standard", "retainer", "project"]
          resolved["type"] = validTypes.includes(normalized) ? normalized : "standard"
          continue
        }

        // Handle staff_email -> staff_id for various tables
        if (key === "staff_email" && value) {
          const cacheKey = String(value).toLowerCase()
          if (!employeeCache.has(cacheKey)) {
            const { data } = await supabase.from("staff").select("id").ilike("email", String(value)).limit(1).single()
            if (data) employeeCache.set(cacheKey, data.id)
          }
          const staffId = employeeCache.get(cacheKey)
          if (staffId) {
            resolved.staff_id = staffId
          } else {
            errors.push(`Empleado no encontrado: ${value}`)
            hasError = true
          }
          continue
        }

        // Handle assigned_to_email -> assigned_to_id
        if (key === "assigned_to_email" && value) {
          const cacheKey = String(value).toLowerCase()
          if (!employeeCache.has(cacheKey)) {
            const { data } = await supabase.from("staff").select("id").ilike("email", String(value)).limit(1).single()
            if (data) employeeCache.set(cacheKey, data.id)
          }
          const staffId = employeeCache.get(cacheKey)
          if (staffId) {
            resolved.assigned_to_id = staffId
          }
          continue
        }

        // Handle instructor_email -> instructor_id for training courses
        if (key === "instructor_email" && value) {
          const cacheKey = String(value).toLowerCase()
          if (!employeeCache.has(cacheKey)) {
            const { data } = await supabase.from("staff").select("id").ilike("email", String(value)).limit(1).single()
            if (data) employeeCache.set(cacheKey, data.id)
          }
          const staffId = employeeCache.get(cacheKey)
          if (staffId) {
            resolved.instructor_id = staffId
          }
          continue
        }

        // Handle department_name -> department_id
        if (key === "department_name" && value) {
          const query = supabase.from("departments").select("id").ilike("name", String(value))
          if (resolved.agency_id) query.eq("agency_id", resolved.agency_id)
          const { data } = await query.limit(1).single()
          if (data) {
            resolved.department_id = data.id
          }
          continue
        }

        // Handle position_name -> position_id
        if (key === "position_name" && value) {
          const query = supabase.from("positions").select("id").ilike("name", String(value))
          if (resolved.agency_id) query.eq("agency_id", resolved.agency_id)
          const { data } = await query.limit(1).single()
          if (data) {
            resolved.position_id = data.id
          }
          continue
        }

        // Handle leave_type_name -> leave_type_id
        if (key === "leave_type_name" && value) {
          const query = supabase.from("leave_types").select("id").ilike("name", String(value))
          if (resolved.agency_id) query.eq("agency_id", resolved.agency_id)
          const { data } = await query.limit(1).single()
          if (data) {
            resolved.leave_type_id = data.id
          }
          continue
        }

        // Handle stage_name -> stage_id for CRM prospects
        if (key === "stage_name" && value) {
          const query = supabase.from("crm_pipeline_stages").select("id").ilike("name", String(value))
          if (resolved.agency_id) query.eq("agency_id", resolved.agency_id)
          const { data } = await query.limit(1).single()
          if (data) {
            resolved.stage_id = data.id
          }
          continue
        }

        // Handle source_name -> source_id for CRM prospects
        if (key === "source_name" && value) {
          const query = supabase.from("crm_lead_sources").select("id").ilike("name", String(value))
          if (resolved.agency_id) query.eq("agency_id", resolved.agency_id)
          const { data } = await query.limit(1).single()
          if (data) {
            resolved.source_id = data.id
          }
          continue
        }

        // Handle prospect_contact_name -> prospect_id
        if (key === "prospect_contact_name" && value) {
          const query = supabase.from("crm_prospects").select("id").ilike("contact_name", String(value))
          if (resolved.agency_id) query.eq("agency_id", resolved.agency_id)
          const { data } = await query.limit(1).single()
          if (data) {
            resolved.prospect_id = data.id
          }
          continue
        }

        // Handle course_title -> course_id for training enrollments
        if (key === "course_title" && value) {
          const query = supabase.from("training_courses").select("id").ilike("title", String(value))
          if (resolved.agency_id) query.eq("agency_id", resolved.agency_id)
          const { data } = await query.limit(1).single()
          if (data) {
            resolved.course_id = data.id
          }
          continue
        }

        // Handle period_name -> period_id for payroll details
        if (key === "period_name" && value) {
          const query = supabase.from("payroll_periods").select("id").ilike("period_name", String(value))
          if (resolved.agency_id) query.eq("agency_id", resolved.agency_id)
          const { data } = await query.limit(1).single()
          if (data) {
            resolved.period_id = data.id
          }
          continue
        }

        // Handle role_name -> role_id
        if (key === "role_name" && value) {
          const { data } = await supabase.from("roles").select("id").ilike("name", String(value)).limit(1).single()
          if (data) {
            resolved.role_id = data.id
          }
          continue
        }

        // Handle service_name -> service_id
        if (key === "service_name" && value) {
          const query = supabase.from("services").select("id").ilike("name", String(value))
          if (resolved.agency_id) query.eq("agency_id", resolved.agency_id)
          const { data } = await query.limit(1).single()
          if (data) {
            resolved.service_id = data.id
          }
          continue
        }

        // Handle quotation_number -> quotation_id
        if (key === "quotation_number" && value) {
          const query = supabase.from("quotations").select("id").eq("quotation_number", String(value))
          if (resolved.agency_id) query.eq("agency_id", resolved.agency_id)
          const { data } = await query.limit(1).single()
          if (data) {
            resolved.quotation_id = data.id
          }
          continue
        }

        // Handle invoice_number -> invoice_id
        if (key === "invoice_number" && value && tableName !== "invoices") {
          const query = supabase.from("invoices").select("id").eq("invoice_number", String(value))
          if (resolved.agency_id) query.eq("agency_id", resolved.agency_id)
          const { data } = await query.limit(1).single()
          if (data) {
            resolved.invoice_id = data.id
          }
          continue
        }

        // Pass through other fields
        if (value !== undefined && value !== null && value !== "") {
          resolved[key] = value
        }
      }

      if (!hasError) {
        resolvedRows.push(resolved)
      }
    }

    return { data: resolvedRows, errors }
  }

  // Map template table names to actual database table names
  const getActualTableName = (templateName: string): string => {
    const mapping: Record<string, string> = {
      // Staff / Employees
      "employees": "staff",
      "Empleados": "staff",
      "Personal": "staff",
      "staff_documents": "staff_documents",
      "Documentos de Personal": "staff_documents",
      
      // Clients
      "clients": "clients",
      "Clientes": "clients",
      "client_contacts": "client_contacts",
      "Contactos de Clientes": "client_contacts",
      "accounts": "accounts",
      "Cuentas/Marcas": "accounts",
      
      // Vendors
      "vendors": "vendors",
      "Proveedores": "vendors",
      "vendor_contacts": "vendor_contacts",
      "Contactos de Proveedores": "vendor_contacts",
      "vendor_types": "vendor_types",
      "Tipos de Proveedor": "vendor_types",
      
      // Projects & Services
      "projects": "projects",
      "Proyectos": "projects",
      "services": "services",
      "Servicios": "services",
      "account_services": "account_services",
      "Servicios de Cuentas": "account_services",
      "project_services": "project_services",
      "Servicios de Proyectos": "project_services",
      
      // HR - RRHH
      "departments": "departments",
      "Departamentos": "departments",
      "positions": "positions",
      "Puestos": "positions",
      "contract_types": "contract_types",
      "Tipos de Contrato": "contract_types",
      "candidates": "candidates",
      "Candidatos": "candidates",
      "leave_types": "leave_types",
      "Tipos de Ausencia": "leave_types",
      "leave_balances": "leave_balances",
      "Saldos de Vacaciones": "leave_balances",
      "leave_requests": "leave_requests",
      "Solicitudes de Ausencia": "leave_requests",
      "holidays": "holidays",
      "Días Festivos": "holidays",
      "training_categories": "training_categories",
      "Categorías de Capacitación": "training_categories",
      "training_courses": "training_courses",
      "Cursos de Capacitación": "training_courses",
      "training_enrollments": "training_enrollments",
      "Inscripciones a Cursos": "training_enrollments",
      "recognition_categories": "recognition_categories",
      "Categorías de Reconocimiento": "recognition_categories",
      "bonuses": "bonuses",
      "Bonos": "bonuses",
      "loans": "loans",
      "Préstamos": "loans",
      "loan_payments": "loan_payments",
      "Pagos de Préstamos": "loan_payments",
      
      // Finance
      "invoices": "invoices",
      "Facturas": "invoices",
      "invoice_items": "invoice_items",
      "Partidas de Factura": "invoice_items",
      "expenses": "expenses",
      "Gastos": "expenses",
      "expense_categories": "expense_categories",
      "Categorías de Gastos": "expense_categories",
      "payments": "payments",
      "Pagos Recibidos": "payments",
      "bank_accounts": "bank_accounts",
      "Cuentas Bancarias": "bank_accounts",
      "third_party_payments": "third_party_payments",
      "Pagos a Terceros": "third_party_payments",
      "payroll_periods": "payroll_periods",
      "Periodos de Nómina": "payroll_periods",
      "payroll_details": "payroll_details",
      "Detalles de Nómina": "payroll_details",
      "commissions": "commissions",
      "Comisiones": "commissions",
      
      // CRM / Commercial
      "crm_pipeline_stages": "crm_pipeline_stages",
      "Etapas del Pipeline": "crm_pipeline_stages",
      "crm_lead_sources": "crm_lead_sources",
      "Fuentes de Leads": "crm_lead_sources",
      "crm_prospects": "crm_prospects",
      "Prospectos": "crm_prospects",
      "crm_activities": "crm_activities",
      "Actividades CRM": "crm_activities",
      "crm_tasks": "crm_tasks",
      "Tareas CRM": "crm_tasks",
      "quotations": "quotations",
      "Cotizaciones": "quotations",
      
      // Admin catalogs
      "industries": "industries",
      "Industrias": "industries",
      "referral_sources": "referral_sources",
      "Fuentes de Referencia": "referral_sources",
      
      // Configuration
      "agencies": "agencies",
      "Agencias": "agencies",
      "agency_commission_types": "agency_commission_types",
      "Tipos de Comisión": "agency_commission_types",
      "currencies": "currencies",
      "Monedas": "currencies",
      "roles": "roles",
      "Roles": "roles",
    }
    return mapping[templateName] || templateName
  }

  const processImport = async (importData: Record<string, unknown[]>, mode: "update" | "replace" = "update") => {
    setImporting(true)
    setImportProgress(0)
    setImportResults([])

    const tables = Object.keys(importData)
    const results: { table: string; success: number; errors: number; errorMessages: string[] }[] = []

    for (let i = 0; i < tables.length; i++) {
      const templateTableName = tables[i]
      const tableName = getActualTableName(templateTableName)
      const rows = importData[templateTableName] as Record<string, unknown>[]
      let success = 0
      let errors = 0
      const errorMessages: string[] = []

      if (!Array.isArray(rows) || rows.length === 0) {
        results.push({ table: tableName, success: 0, errors: 1, errorMessages: ["No hay datos para importar"] })
        continue
      }

      // Resolve references (agency_name -> agency_id, etc.)
      const { data: resolvedRows, errors: resolveErrors } = await resolveReferences(tableName, rows)
      
      if (resolveErrors.length > 0) {
        errorMessages.push(...resolveErrors.slice(0, 5)) // Only show first 5 errors
        if (resolveErrors.length > 5) {
          errorMessages.push(`... y ${resolveErrors.length - 5} errores más`)
        }
      }

      if (resolvedRows.length === 0) {
        results.push({ 
          table: tableName, 
          success: 0, 
          errors: rows.length, 
          errorMessages: errorMessages.length > 0 ? errorMessages : ["Todos los registros fallaron la validación"] 
        })
        continue
      }

      // Process in batches using UPSERT (update or insert)
      const batchSize = 50
      
      // Define unique constraint field for each table
      const getUniqueField = (table: string): string | string[] | null => {
        const uniqueFields: Record<string, string | string[]> = {
          // Personal
          staff: "email",
          candidates: "email",
          
          // Clientes y cuentas (deduplicar SIEMPRE por nombre, nunca por RFC/tax_id)
          clients: ["agency_id", "company_name"],
          accounts: ["client_id", "agency_id", "account_name"],
          projects: ["account_id", "name"],
          
          // CRM
          crm_prospects: "contact_email",
          crm_lead_sources: ["agency_id", "name"],
          crm_pipeline_stages: ["agency_id", "name"],
          
          // Configuración
          agencies: "name",
          currencies: "code",
          
          // Catálogos
          positions: ["agency_id", "name"],
          departments: ["agency_id", "name"],
          contract_types: ["agency_id", "name"],
          leave_types: ["agency_id", "name"],
          training_categories: ["agency_id", "name"],
          recognition_categories: ["agency_id", "name"],
          vendor_types: ["agency_id", "name"],
          industries: ["agency_id", "name"],
          referral_sources: ["agency_id", "name"],
          expense_categories: ["agency_id", "name"],
          
          // Roles
          roles: "name",
        }
        return uniqueFields[table] || null
      }
      
      const uniqueField = getUniqueField(tableName)

      // Modo "replace": borrar TODOS los registros previos de la tabla antes de importar
      if (mode === "replace") {
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .not("id", "is", null)
        if (deleteError) {
          console.error(`Error eliminando registros previos de ${tableName}:`, deleteError)
          errorMessages.push(`No se pudieron borrar los registros previos: ${deleteError.message}`)
        }
      }
      
      // Deduplicate rows within the import file to avoid "cannot affect row a second time" error
      let deduplicatedRows = resolvedRows
      if (uniqueField) {
        const uniqueKeys = Array.isArray(uniqueField) ? uniqueField : [uniqueField]
        const seen = new Map<string, any>()
        for (const row of resolvedRows) {
          const key = uniqueKeys.map(k => row[k] ?? '').join('|')
          // Keep the last occurrence (overwrite previous)
          seen.set(key, row)
        }
        deduplicatedRows = Array.from(seen.values())
      }
      
      for (let j = 0; j < deduplicatedRows.length; j += batchSize) {
        const batch = deduplicatedRows.slice(j, j + batchSize)

        let result
        if (uniqueField) {
          // Use upsert - if record exists (by unique field), update it; otherwise insert
          const conflictField = Array.isArray(uniqueField) ? uniqueField.join(',') : uniqueField
          result = await supabase
            .from(tableName)
            .upsert(batch, { 
              onConflict: conflictField,
              ignoreDuplicates: false // Update existing records
            })
        } else {
          // Fallback to insert for tables without unique field
          result = await supabase.from(tableName).insert(batch)
        }

        if (result.error) {
          console.error(`Error importing ${tableName}:`, result.error)
          errorMessages.push(result.error.message)
          errors += batch.length
        } else {
          success += batch.length
        }
        
        // Update progress
        setImportProgress(Math.round(((i + (j / resolvedRows.length)) / tables.length) * 100))
      }

      results.push({ table: tableName, success, errors: errors + (rows.length - resolvedRows.length), errorMessages })
      setImportProgress(Math.round(((i + 1) / tables.length) * 100))
    }

    setImportResults(results)
    setImporting(false)
    
    const totalSuccess = results.reduce((sum, r) => sum + r.success, 0)
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0)
    
    if (totalErrors === 0) {
      toast.success(`Importación completada: ${totalSuccess} registros importados`)
    } else if (totalSuccess > 0) {
      toast.warning(`Importación completada con errores: ${totalSuccess} éxitos, ${totalErrors} errores`)
    } else {
      toast.error(`Importación fallida: ${totalErrors} errores. Revisa los mensajes de error.`)
    }

    // Refresh counts
    fetchTableCounts()
  }

  const groupedTables = exportTables.reduce((acc, table) => {
    if (!acc[table.category]) acc[table.category] = []
    acc[table.category].push(table)
    return acc
  }, {} as Record<string, ExportTable[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Importación y Exportación</h1>
        <p className="text-muted-foreground">
          Importa y exporta datos del sistema: Administración, Operaciones, RRHH, Comercial, Finanzas y Configuración.
        </p>
      </div>

      {/* Agency Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtro de Agencia</CardTitle>
          <CardDescription>Selecciona una agencia para filtrar los datos o exporta todo globalmente.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedAgency} onValueChange={setSelectedAgency}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Seleccionar agencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <span className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Global (Todas las agencias)
                </span>
              </SelectItem>
              {agencies.map((agency) => (
                <SelectItem key={agency.id} value={agency.id}>
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {agency.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs defaultValue="export" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="export" className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            Exportar
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            Importar
          </TabsTrigger>
        </TabsList>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Exportar Datos</CardTitle>
                  <CardDescription>Selecciona las tablas que deseas exportar a Excel o CSV.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllTables}>
                    Seleccionar Todo
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAllTables}>
                    Deseleccionar Todo
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(groupedTables).map(([category, tables]) => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      {categoryLabels[category]}
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-7"
                      onClick={() => selectCategory(category)}
                    >
                      {tables.every(t => selectedTables.includes(t.id)) ? "Deseleccionar" : "Seleccionar"} categoría
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {tables.map((table) => (
                      <div
                        key={table.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedTables.includes(table.id) 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => toggleTable(table.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            checked={selectedTables.includes(table.id)}
                            onCheckedChange={() => toggleTable(table.id)}
                          />
                          <div className="p-1.5 bg-muted rounded">
                            {table.icon}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{table.label}</p>
                            <p className="text-xs text-muted-foreground">{table.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {tableCounts[table.id] || 0}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleExportSingleTable(table.id, "xlsx")
                            }}
                            title="Exportar como Excel"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {exporting && (
                <div className="space-y-2 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Exportando datos...</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} />
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4">
                  <Label className="text-sm">Formato:</Label>
                  <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as "xlsx" | "csv")}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xlsx">
                        <span className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          Excel (.xlsx)
                        </span>
                      </SelectItem>
                      <SelectItem value="csv">
                        <span className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          CSV (.csv)
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleExport} disabled={exporting || selectedTables.length === 0}>
                  {exporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar {selectedTables.length} tabla{selectedTables.length !== 1 ? "s" : ""} ({exportFormat.toUpperCase()})
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Cómo importar datos</AlertTitle>
            <AlertDescription>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Descarga el <strong>Template</strong> de la tabla que deseas importar</li>
                <li>Llena el archivo con tus datos (la fila 1 son encabezados, fila 2 descripciones, fila 3 ejemplo)</li>
                <li>Elimina las filas de descripción y ejemplo antes de importar</li>
                <li>Haz clic en <strong>Importar</strong> y selecciona tu archivo</li>
              </ol>
              <p className="mt-2 text-sm text-muted-foreground">* Los campos marcados con asterisco son obligatorios</p>
            </AlertDescription>
          </Alert>

          {/* Download All Templates */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Templates de Importación</CardTitle>
                  <CardDescription>
                    Descarga los templates para cada sección y llénalos con tus datos
                  </CardDescription>
                </div>
                <Button onClick={handleDownloadAllTemplates} variant="outline">
                  <LayoutTemplate className="mr-2 h-4 w-4" />
                  Descargar Todos los Templates
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Import by Category */}
          <div className="space-y-3">
            {Object.entries(categoryLabels).map(([category, label]) => {
              const categoryTables = exportTables.filter(t => t.category === category && templateColumns[t.id])
              if (categoryTables.length === 0) return null

              const isExpanded = expandedImportCategories.includes(category)

              return (
                <Card key={category}>
                  <Collapsible open={isExpanded} onOpenChange={() => toggleImportCategory(category)}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <CardTitle className="text-base">{label}</CardTitle>
                            <Badge variant="secondary" className="ml-2">{categoryTables.length} tablas</Badge>
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {categoryTables.map(table => {
                            const columns = templateColumns[table.id]
                            const requiredCount = columns?.filter(c => c.required).length || 0
                            
                            return (
                              <div 
                                key={table.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-background rounded-md border">
                                    {table.icon}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{table.label}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {columns?.length || 0} campos ({requiredCount} obligatorios)
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadTemplate(table.id)}
                                  >
                                    <LayoutTemplate className="mr-2 h-3.5 w-3.5" />
                                    Template
                                  </Button>
                                  <input
                                    ref={el => { categoryFileInputRefs.current[table.id] = el }}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    className="hidden"
                                    onChange={(e) => handleCategoryFileSelect(e, table.id)}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => categoryFileInputRefs.current[table.id]?.click()}
                                  >
                                    <Upload className="mr-2 h-3.5 w-3.5" />
                                    Importar
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )
            })}
          </div>

          {/* Bulk Import */}
          <Card>
            <CardHeader>
              <CardTitle>Importación Masiva</CardTitle>
              <CardDescription>
                Importa múltiples tablas desde un archivo Excel con varias hojas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Arrastra un archivo o haz clic para seleccionar</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Excel con múltiples hojas (cada hoja = una tabla) o CSV individual
                </p>
              </div>

              {importing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Importando datos...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} />
                </div>
              )}

              {importResults.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Resultados de importación:</h4>
                  <div className="grid gap-2">
{importResults.map((result, index) => (
  <div
  key={index}
  className={`p-3 rounded-lg border ${
  result.errors > 0 ? "border-destructive/50 bg-destructive/5" : "border-green-500/50 bg-green-500/5"
  }`}
  >
  <div className="flex items-center justify-between">
  <div className="flex items-center gap-2">
  {result.errors > 0 ? (
  <AlertCircle className="h-4 w-4 text-destructive" />
  ) : (
  <CheckCircle2 className="h-4 w-4 text-green-500" />
  )}
  <span className="font-medium">{result.table}</span>
  </div>
  <div className="flex items-center gap-3 text-sm">
  <span className="text-green-600">{result.success} importados</span>
  {result.errors > 0 && (
  <span className="text-destructive">{result.errors} errores</span>
  )}
  </div>
  </div>
  {result.errorMessages && result.errorMessages.length > 0 && (
  <div className="mt-2 pl-6 text-xs text-muted-foreground space-y-1">
  {result.errorMessages.map((msg, i) => (
    <div key={i} className="text-destructive">{msg}</div>
  ))}
  </div>
  )}
  </div>
  ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo: modo de importación */}
      <Dialog open={showImportModeDialog} onOpenChange={setShowImportModeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Cómo quieres importar?</DialogTitle>
            <DialogDescription>
              Los registros nunca se duplican: se identifican por su nombre (o correo, en el caso de personas). Elige qué hacer con la información existente.
            </DialogDescription>
          </DialogHeader>

          <RadioGroup value={importMode} onValueChange={(v) => setImportMode(v as "update" | "replace")} className="gap-3 py-2">
            <Label
              htmlFor="mode-update"
              className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <RadioGroupItem value="update" id="mode-update" className="mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">Solo actualizar los actuales</p>
                <p className="text-sm text-muted-foreground">
                  Actualiza los registros que coincidan por nombre y agrega los nuevos. No se borra nada de lo que ya existe.
                </p>
              </div>
            </Label>
            <Label
              htmlFor="mode-replace"
              className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-destructive has-[:checked]:bg-destructive/5"
            >
              <RadioGroupItem value="replace" id="mode-replace" className="mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-destructive">Actualizar y borrar registros anteriores</p>
                <p className="text-sm text-muted-foreground">
                  Elimina todos los registros existentes de las tablas seleccionadas y los reemplaza por los del archivo. Esta acción no se puede deshacer.
                </p>
              </div>
            </Label>
          </RadioGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowImportModeDialog(false); setPendingImport(null) }}>
              Cancelar
            </Button>
            <Button
              variant={importMode === "replace" ? "destructive" : "default"}
              onClick={confirmImport}
            >
              {importMode === "replace" ? "Borrar e importar" : "Importar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
