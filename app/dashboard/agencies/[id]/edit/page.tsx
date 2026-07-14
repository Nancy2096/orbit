"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, Building2, Plus, Trash2, Landmark, Coins, Users, Briefcase, Pencil, BadgePercent, Clock, Palette, Upload, Image as ImageIcon, Bell, Mail, Smartphone, Monitor, Palmtree, Award, Trophy, Medal, Handshake, Heart, Target, Lightbulb, Compass, GraduationCap, Rocket, MessageCircle, Flag, Zap } from "lucide-react"
import Link from "next/link"

interface Currency {
  id: string
  code: string
  name: string
  symbol: string
}

interface BankAccount {
  id: string
  currency_id: string
  bank_name: string
  account_name: string
  account_number: string
  clabe: string
  swift_code: string
  iban: string
  account_type: string
  is_primary: boolean
  isNew?: boolean
}

interface Department {
  id: string
  name: string
  description: string
  is_active: boolean
  sort_order: number
  isNew?: boolean
}

interface Position {
  id: string
  department_id: string | null
  name: string
  description: string
  level: string
  default_hourly_cost: number | null
  is_billable: boolean
  is_active: boolean
  sort_order: number
  min_accounts: number
  max_accounts: number
  min_projects: number
  max_projects: number
  min_subordinates: number
  max_subordinates: number
  isNew?: boolean
}

interface Agency {
  id: string
  name: string
  legal_name: string
  tax_id: string
  email: string
  phone: string
  website: string
  address: string
  is_active: boolean
}

interface NotificationType {
  id: string
  code: string
  name: string
  description: string
  category: string
}

interface NotificationSetting {
  type_code: string
  email_enabled: boolean
  push_enabled: boolean
  in_app_enabled: boolean
}

interface NotificationEmail {
  id: string
  email: string
  name: string
  categories: string[]
  is_active: boolean
  isNew?: boolean
}

interface CommissionType {
  id: string
  name: string
  amount: number
  is_active: boolean
  display_order: number
  isNew?: boolean
}

interface ContractType {
  id: string
  name: string
  code: string
  description: string
  weekly_hours: number
  is_billable: boolean
  is_active: boolean
  sort_order: number
  isNew?: boolean
}

interface BrandingSettings {
  logo_url: string
  primary_color: string
  secondary_color: string
  accent_color: string
  text_color: string
  background_color: string
  font_family: string
  tagline: string
}

interface LeaveType {
  id: string
  agency_id: string
  name: string
  description: string | null
  days_per_year: number
  requires_approval: boolean
  is_paid: boolean
  color: string
  is_active: boolean
  isNew?: boolean
}

interface RecognitionCategory {
  id: string
  agency_id: string
  name: string
  description: string | null
  points: number
  color: string
  icon: string
  is_active: boolean
  isNew?: boolean
}

interface RecognitionSettings {
  id?: string
  agency_id: string
  max_recognitions_per_month: number
  point_value: number
  min_redemption_points: number
}

// Formatea un costo por hora de ejemplo (salario ÷ horas) en pesos.
function formatCurrencyExample(salary: number, hours: number) {
  const perHour = hours > 0 ? salary / hours : 0
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(perHour)
}

const LEVELS = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-Level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "manager", label: "Manager" },
  { value: "director", label: "Director" },
  { value: "executive", label: "Ejecutivo" },
]

// Icon map for stored icon values
const iconMap: Record<string, typeof Award> = {
  award: Award,
  trophy: Trophy,
  medal: Medal,
  handshake: Handshake,
  users: Users,
  heart: Heart,
  target: Target,
  lightbulb: Lightbulb,
  compass: Compass,
  graduationcap: GraduationCap,
  rocket: Rocket,
  briefcase: Briefcase,
  flag: Flag,
  zap: Zap,
  messagecircle: MessageCircle,
}

// Get icon for category - prioritizes stored icon, fallback to name-based matching
const getIconForCategory = (category: { icon?: string; name: string }) => {
  // First try the stored icon
  if (category.icon && iconMap[category.icon.toLowerCase()]) {
    return iconMap[category.icon.toLowerCase()]
  }
  
  // Fallback to keyword matching based on category name
  const lowerName = category.name.toLowerCase()
  
  if (lowerName.includes('innovación') || lowerName.includes('innovacion') || lowerName.includes('innovar') || lowerName.includes('creativ')) return Lightbulb
  if (lowerName.includes('liderazgo') || lowerName.includes('líder') || lowerName.includes('lider')) return Compass
  if (lowerName.includes('equipo') || lowerName.includes('colabor') || lowerName.includes('team') || lowerName.includes('solo equipo')) return Users
  if (lowerName.includes('servicio') || lowerName.includes('cliente') || lowerName.includes('atención') || lowerName.includes('pensar en el')) return Heart
  if (lowerName.includes('excelencia') || lowerName.includes('calidad') || lowerName.includes('outstanding')) return Trophy
  if (lowerName.includes('mentor') || lowerName.includes('enseñ') || lowerName.includes('capacit')) return GraduationCap
  if (lowerName.includes('meta') || lowerName.includes('objetivo') || lowerName.includes('logro') || lowerName.includes('resultado')) return Target
  if (lowerName.includes('comunic') || lowerName.includes('feedback')) return MessageCircle
  if (lowerName.includes('esfuerzo') || lowerName.includes('dedicación') || lowerName.includes('dedicacion') || lowerName.includes('compromiso')) return Rocket
  if (lowerName.includes('trabajo') || lowerName.includes('profesional') || lowerName.includes('apropiada') || lowerName.includes('forma')) return Briefcase
  if (lowerName.includes('super') || lowerName.includes('estrella') || lowerName.includes('destacado')) return Medal
  if (lowerName.includes('futuro') || lowerName.includes('visión') || lowerName.includes('vision') || lowerName.includes('mirar')) return Flag
  if (lowerName.includes('cuenta') || lowerName.includes('conmigo') || lowerName.includes('confianza') || lowerName.includes('responsab')) return Handshake
  if (lowerName.includes('energía') || lowerName.includes('energia') || lowerName.includes('actitud') || lowerName.includes('proactiv')) return Zap
  
  return Award
}

export default function EditAgencyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([])
  const [defaultCurrency, setDefaultCurrency] = useState<string>("")
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
const [positions, setPositions] = useState<Position[]>([])
  const [editingPosition, setEditingPosition] = useState<Position | null>(null)
  const [positionDialogOpen, setPositionDialogOpen] = useState(false)
  const [commissionTypes, setCommissionTypes] = useState<CommissionType[]>([])
  const [editingCommissionType, setEditingCommissionType] = useState<CommissionType | null>(null)
  const [commissionTypeDialogOpen, setCommissionTypeDialogOpen] = useState(false)
  const [contractTypes, setContractTypes] = useState<ContractType[]>([])
  const [editingContractType, setEditingContractType] = useState<ContractType | null>(null)
  const [contractTypeDialogOpen, setContractTypeDialogOpen] = useState(false)
  const [deletedCommissionTypes, setDeletedCommissionTypes] = useState<string[]>([])
  const [deletedBankAccounts, setDeletedBankAccounts] = useState<string[]>([])
  const [deletedDepartments, setDeletedDepartments] = useState<string[]>([])
  const [deletedPositions, setDeletedPositions] = useState<string[]>([])
  const [deletedContractTypes, setDeletedContractTypes] = useState<string[]>([])
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false)
  const [branding, setBranding] = useState<BrandingSettings>({
    logo_url: "",
    primary_color: "#3B82F6",
    secondary_color: "#10B981",
    accent_color: "#F59E0B",
    text_color: "#1F2937",
    background_color: "#FFFFFF",
    font_family: "Inter",
    tagline: "",
  })
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Notifications
  const [notificationTypes, setNotificationTypes] = useState<NotificationType[]>([])
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([])
  const [notificationEmails, setNotificationEmails] = useState<NotificationEmail[]>([])
  const [newNotificationEmail, setNewNotificationEmail] = useState({ email: "", name: "", categories: [] as string[] })
  
  // Leave Types (Permisos)
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null)
  const [leaveTypeDialogOpen, setLeaveTypeDialogOpen] = useState(false)
  const [deletedLeaveTypes, setDeletedLeaveTypes] = useState<string[]>([])
  
  // Recognition (Reconocimientos)
  const [recognitionCategories, setRecognitionCategories] = useState<RecognitionCategory[]>([])
  const [recognitionSettings, setRecognitionSettings] = useState<RecognitionSettings | null>(null)
  const [editingCategory, setEditingCategory] = useState<RecognitionCategory | null>(null)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [deletedCategories, setDeletedCategories] = useState<string[]>([])

  // Alcance de aplicación de cambios de configuración unificada
  // (monedas, bancos, departamentos, puestos, contratos, permisos, reconocimientos, horas)
  const [allAgencies, setAllAgencies] = useState<{ id: string; name: string }[]>([])
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false)
  const [applyScope, setApplyScope] = useState<"all" | "current" | "select">("all")
  const [selectedTargetAgencies, setSelectedTargetAgencies] = useState<string[]>([])

  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState<Agency>({
    id: "",
    name: "",
    legal_name: "",
    tax_id: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    is_active: true,
  })

  // Horas laborables al mes: factor para calcular el costo por hora
  // (costo por hora = salario mensual ÷ horas laborables al mes).
  const [workingHoursPerMonth, setWorkingHoursPerMonth] = useState("160")

  // Objetivos de la agencia (metas). Se guardan en el JSON settings.objectives
  // y son específicos de cada agencia (no se propagan al sincronizar config).
  const [objectives, setObjectives] = useState({
    accounts_target: "",
    projects_target: "",
    monthly_revenue_target: "",
    annual_revenue_target: "",
  })

  // Configuración de correos para onboarding (encuestas de satisfacción)
  const [emailConfig, setEmailConfig] = useState({
    sender_name: "",
    sender_email: "",
    reply_to: "",
    hr_notification_email: "",
    survey_subject_week1: "Tu experiencia en la primera semana",
    survey_subject_day30: "Tu integración a 30 días",
    signature: "",
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      
      // Load agency
      const { data: agency } = await supabase
        .from("agencies")
        .select("*")
        .eq("id", id)
        .single()
      
      if (agency) {
        setFormData(agency)
        // Load branding settings from agency
        if (agency.logo_url || agency.settings) {
          setBranding(prev => ({
            ...prev,
            logo_url: agency.logo_url || "",
            ...(agency.settings?.branding || {})
          }))
        }
        if (agency.settings?.onboarding_email) {
          setEmailConfig(prev => ({
            ...prev,
            ...agency.settings.onboarding_email,
          }))
        }
        if (agency.settings?.working_hours_per_month != null) {
          setWorkingHoursPerMonth(String(agency.settings.working_hours_per_month))
        }
        if (agency.settings?.objectives) {
          const obj = agency.settings.objectives
          setObjectives({
            accounts_target: obj.accounts_target != null ? String(obj.accounts_target) : "",
            projects_target: obj.projects_target != null ? String(obj.projects_target) : "",
            monthly_revenue_target: obj.monthly_revenue_target != null ? String(obj.monthly_revenue_target) : "",
            annual_revenue_target: obj.annual_revenue_target != null ? String(obj.annual_revenue_target) : "",
          })
        }
      }

      // Load currencies
      const { data: currenciesData } = await supabase
        .from("currencies")
        .select("*")
        .eq("is_active", true)
        .order("code")
      
      if (currenciesData) {
        setCurrencies(currenciesData)
      }

      // Load agency currencies
      const { data: agencyCurrencies } = await supabase
        .from("agency_currencies")
        .select("*")
        .eq("agency_id", id)
      
      if (agencyCurrencies) {
        setSelectedCurrencies(agencyCurrencies.map(ac => ac.currency_id))
        const defaultCurr = agencyCurrencies.find(ac => ac.is_default)
        if (defaultCurr) {
          setDefaultCurrency(defaultCurr.currency_id)
        }
      }

      // Load bank accounts
      const { data: bankAccountsData } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("agency_id", id)
        .order("created_at")
      
      if (bankAccountsData) {
        setBankAccounts(bankAccountsData)
      }

      // Load departments
      const { data: departmentsData } = await supabase
        .from("departments")
        .select("*")
        .eq("agency_id", id)
        .order("sort_order")
      
      if (departmentsData) {
        setDepartments(departmentsData)
      }

      // Load positions
      const { data: positionsData } = await supabase
        .from("positions")
        .select("*")
        .eq("agency_id", id)
        .order("sort_order")
      
      if (positionsData) {
        setPositions(positionsData)
      }

      // Load commission types
      const { data: commissionTypesData } = await supabase
        .from("agency_commission_types")
        .select("*")
        .eq("agency_id", id)
        .order("display_order")
      
      if (commissionTypesData) {
        setCommissionTypes(commissionTypesData)
      }

      // Load contract types
      const { data: contractTypesData } = await supabase
        .from("contract_types")
        .select("*")
        .eq("agency_id", id)
        .order("sort_order")
      
      if (contractTypesData) {
        setContractTypes(contractTypesData)
      }

      // Load notification types
      const { data: notificationTypesData } = await supabase
        .from("notification_types")
        .select("*")
        .order("category", { ascending: true })
      
      if (notificationTypesData) {
        setNotificationTypes(notificationTypesData)
      }

      // Load agency notification settings
      const { data: notificationSettingsData } = await supabase
        .from("agency_notification_settings")
        .select("*")
        .eq("agency_id", id)
      
      if (notificationSettingsData) {
        setNotificationSettings(notificationSettingsData.map(ns => ({
          type_code: ns.type_code,
          email_enabled: ns.email_enabled,
          push_enabled: ns.push_enabled,
          in_app_enabled: ns.in_app_enabled,
        })))
      }

      // Load notification emails for agency
      const { data: notificationEmailsData } = await supabase
        .from("agency_notification_emails")
        .select("*")
        .eq("agency_id", id)
        .order("name")
      
      if (notificationEmailsData) {
        setNotificationEmails(notificationEmailsData)
      }

      // Load leave types for agency
      const { data: leaveTypesData } = await supabase
        .from("leave_types")
        .select("*")
        .eq("agency_id", id)
        .order("name")
      
      if (leaveTypesData) {
        setLeaveTypes(leaveTypesData)
      }

      // Load recognition settings for agency
      const { data: recSettingsData } = await supabase
        .from("recognition_settings")
        .select("*")
        .eq("agency_id", id)
        .single()
      
      if (recSettingsData) {
        setRecognitionSettings(recSettingsData)
      } else {
        setRecognitionSettings({
          agency_id: id,
          max_recognitions_per_month: 2,
          point_value: 10,
          min_redemption_points: 50,
        })
      }

      // Load recognition categories for agency
      const { data: recCategoriesData } = await supabase
        .from("recognition_categories")
        .select("*")
        .eq("agency_id", id)
        .order("name")
      
      if (recCategoriesData) {
        setRecognitionCategories(recCategoriesData)
      }

      // Cargar todas las agencias activas para el diálogo de alcance
      const { data: agenciesData } = await supabase
        .from("agencies")
        .select("id, name")
        .eq("is_active", true)
        .order("name")
      if (agenciesData) {
        setAllAgencies(agenciesData)
        // Por defecto, aplicar a todas las demás agencias
        setSelectedTargetAgencies(agenciesData.filter((a) => a.id !== id).map((a) => a.id))
      }

      setLoading(false)
    }
    
    loadData()
  }, [id, supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const toggleCurrency = (currencyId: string) => {
    setSelectedCurrencies(prev => {
      if (prev.includes(currencyId)) {
        const newSelected = prev.filter(cid => cid !== currencyId)
        if (defaultCurrency === currencyId && newSelected.length > 0) {
          setDefaultCurrency(newSelected[0])
        }
        setBankAccounts(prev => prev.filter(ba => ba.currency_id !== currencyId))
        return newSelected
      } else {
        return [...prev, currencyId]
      }
    })
  }

  const addBankAccount = () => {
    const newAccount: BankAccount = {
      id: crypto.randomUUID(),
      currency_id: selectedCurrencies[0] || "",
      bank_name: "",
      account_name: "",
      account_number: "",
      clabe: "",
      swift_code: "",
      iban: "",
      account_type: "checking",
      is_primary: bankAccounts.length === 0,
      isNew: true,
    }
    setBankAccounts([...bankAccounts, newAccount])
  }

  const updateBankAccount = (id: string, field: keyof BankAccount, value: string | boolean) => {
    setBankAccounts(prev => prev.map(ba => 
      ba.id === id ? { ...ba, [field]: value } : ba
    ))
  }

  const removeBankAccount = (id: string) => {
    const account = bankAccounts.find(ba => ba.id === id)
    if (account && !account.isNew) {
      setDeletedBankAccounts(prev => [...prev, id])
    }
    setBankAccounts(prev => prev.filter(ba => ba.id !== id))
  }

  // Department functions
  const openDepartmentDialog = (department?: Department) => {
    if (department) {
      setEditingDepartment(department)
    } else {
      setEditingDepartment({
        id: crypto.randomUUID(),
        name: "",
        description: "",
        is_active: true,
        sort_order: departments.length,
        isNew: true,
      })
    }
    setDepartmentDialogOpen(true)
  }

  const saveDepartment = () => {
    if (!editingDepartment || !editingDepartment.name.trim()) return
    
    setDepartments(prev => {
      const existing = prev.find(d => d.id === editingDepartment.id)
      if (existing) {
        return prev.map(d => d.id === editingDepartment.id ? editingDepartment : d)
      } else {
        return [...prev, editingDepartment]
      }
    })
    setDepartmentDialogOpen(false)
    setEditingDepartment(null)
  }

  const removeDepartment = (id: string) => {
    const dept = departments.find(d => d.id === id)
    if (dept && !dept.isNew) {
      setDeletedDepartments(prev => [...prev, id])
    }
    setDepartments(prev => prev.filter(d => d.id !== id))
    // Clear department from positions
    setPositions(prev => prev.map(p => 
      p.department_id === id ? { ...p, department_id: null } : p
    ))
  }

  // Position functions
  const openPositionDialog = (position?: Position) => {
    if (position) {
      setEditingPosition(position)
    } else {
      setEditingPosition({
        id: crypto.randomUUID(),
        department_id: null,
        name: "",
        description: "",
        level: "mid",
        default_hourly_cost: null,
        is_billable: true,
        is_active: true,
        sort_order: positions.length,
        min_accounts: 0,
        max_accounts: 10,
        min_projects: 0,
        max_projects: 10,
        min_subordinates: 0,
        max_subordinates: 5,
        isNew: true,
      })
    }
    setPositionDialogOpen(true)
  }

  const savePosition = () => {
    if (!editingPosition || !editingPosition.name.trim()) return
    
    setPositions(prev => {
      const existing = prev.find(p => p.id === editingPosition.id)
      if (existing) {
        return prev.map(p => p.id === editingPosition.id ? editingPosition : p)
      } else {
        return [...prev, editingPosition]
      }
    })
    setPositionDialogOpen(false)
    setEditingPosition(null)
  }

  const removePosition = (id: string) => {
    const pos = positions.find(p => p.id === id)
    if (pos && !pos.isNew) {
      setDeletedPositions(prev => [...prev, id])
    }
    setPositions(prev => prev.filter(p => p.id !== id))
  }

  const getCurrencyById = (currencyId: string) => currencies.find(c => c.id === currencyId)
  const getDepartmentById = (deptId: string | null) => departments.find(d => d.id === deptId)
  
  // Helper para obtener la URL correcta del logo (usando el proxy para blobs privados)
  const getLogoUrl = (logoUrl: string) => {
    if (!logoUrl) return ""
    // Si ya es una URL completa de blob, extraer pathname
    if (logoUrl.includes('.vercel-storage.com/')) {
      const pathname = logoUrl.split('.vercel-storage.com/')[1]
      return `/api/file?pathname=${encodeURIComponent(pathname)}`
    }
    // Si es un pathname directo (logos/...)
    if (logoUrl.startsWith('logos/') || logoUrl.startsWith('staff-photos/')) {
      return `/api/file?pathname=${encodeURIComponent(logoUrl)}`
    }
    // Si es otra URL, devolverla tal cual
    return logoUrl
  }

  // Notification functions
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      finance: "Finanzas",
      hr: "Recursos Humanos",
      operations: "Operaciones",
      system: "Sistema",
    }
    return labels[category] || category
  }

  const getNotificationSetting = (typeCode: string): NotificationSetting => {
    const found = notificationSettings.find(s => s.type_code === typeCode)
    return found || { type_code: typeCode, email_enabled: false, push_enabled: false, in_app_enabled: false }
  }

  const handleToggleNotification = async (typeCode: string, field: keyof NotificationSetting, value: boolean) => {
    const existing = notificationSettings.find(s => s.type_code === typeCode)
    
    if (existing) {
      setNotificationSettings(prev => prev.map(s => 
        s.type_code === typeCode ? { ...s, [field]: value } : s
      ))
    } else {
      setNotificationSettings(prev => [...prev, {
        type_code: typeCode,
        email_enabled: field === "email_enabled" ? value : false,
        push_enabled: field === "push_enabled" ? value : false,
        in_app_enabled: field === "in_app_enabled" ? value : false,
      }])
    }

    // Save to database
    await supabase.from("agency_notification_settings").upsert({
      agency_id: id,
      type_code: typeCode,
      [field]: value,
    }, { onConflict: "agency_id,type_code" })
  }

  const addNotificationEmail = async () => {
    if (!newNotificationEmail.email || !newNotificationEmail.name) return

    const { data, error } = await supabase
      .from("agency_notification_emails")
      .insert({
        agency_id: id,
        email: newNotificationEmail.email,
        name: newNotificationEmail.name,
        categories: newNotificationEmail.categories,
        is_active: true,
      })
      .select()
      .single()

    if (data) {
      setNotificationEmails(prev => [...prev, data])
      setNewNotificationEmail({ email: "", name: "", categories: [] })
    }
  }

  const removeNotificationEmail = async (emailId: string) => {
    await supabase.from("agency_notification_emails").delete().eq("id", emailId)
    setNotificationEmails(prev => prev.filter(e => e.id !== emailId))
  }

  const toggleEmailCategory = (category: string) => {
    setNewNotificationEmail(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  // Logo upload function
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      uploadFormData.append("folder", "logos")
      if (branding.logo_url) {
        uploadFormData.append("oldUrl", branding.logo_url)
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      })

      if (response.ok) {
        const data = await response.json()
        // Guardar el pathname para usar con el proxy de imágenes
        setBranding(prev => ({ ...prev, logo_url: data.pathname || data.url }))
      }
    } catch (error) {
      console.error("Error uploading logo:", error)
    } finally {
      setUploadingLogo(false)
    }
  }

  // Commission Type functions
  const openCommissionTypeDialog = (commissionType?: CommissionType) => {
    if (commissionType) {
      setEditingCommissionType({ ...commissionType })
    } else {
      setEditingCommissionType({
        id: crypto.randomUUID(),
        name: "",
        amount: 0,
        is_active: true,
        display_order: commissionTypes.length,
        isNew: true,
      })
    }
    setCommissionTypeDialogOpen(true)
  }

  const saveCommissionType = () => {
    if (!editingCommissionType || !editingCommissionType.name.trim()) return
    
    setCommissionTypes(prev => {
      const existing = prev.find(ct => ct.id === editingCommissionType.id)
      if (existing) {
        return prev.map(ct => ct.id === editingCommissionType.id ? editingCommissionType : ct)
      } else {
        return [...prev, editingCommissionType]
      }
    })
    setCommissionTypeDialogOpen(false)
    setEditingCommissionType(null)
  }

  const removeCommissionType = (id: string) => {
    const ct = commissionTypes.find(c => c.id === id)
    if (ct && !ct.isNew) {
      setDeletedCommissionTypes(prev => [...prev, id])
    }
    setCommissionTypes(prev => prev.filter(c => c.id !== id))
  }

  // Contract Type functions
  const openContractTypeDialog = (contractType?: ContractType) => {
    if (contractType) {
      setEditingContractType({ ...contractType })
    } else {
      setEditingContractType({
        id: crypto.randomUUID(),
        name: "",
        code: "",
        description: "",
        weekly_hours: 40,
        is_billable: true,
        is_active: true,
        sort_order: contractTypes.length,
        isNew: true,
      })
    }
    setContractTypeDialogOpen(true)
  }

  const saveContractType = () => {
    if (!editingContractType || !editingContractType.name.trim() || !editingContractType.code.trim()) return
    
    setContractTypes(prev => {
      const existing = prev.find(ct => ct.id === editingContractType.id)
      if (existing) {
        return prev.map(ct => ct.id === editingContractType.id ? editingContractType : ct)
      } else {
        return [...prev, editingContractType]
      }
    })
    setContractTypeDialogOpen(false)
    setEditingContractType(null)
  }

  const removeContractType = (id: string) => {
    const ct = contractTypes.find(c => c.id === id)
    if (ct && !ct.isNew) {
      setDeletedContractTypes(prev => [...prev, id])
    }
    setContractTypes(prev => prev.filter(c => c.id !== id))
  }

  // Leave Type handlers
  const openLeaveTypeDialog = (leaveType?: LeaveType) => {
    if (leaveType) {
      setEditingLeaveType(leaveType)
    } else {
      setEditingLeaveType({
        id: `new-${Date.now()}`,
        agency_id: id,
        name: "",
        description: null,
        days_per_year: 0,
        requires_approval: true,
        is_paid: true,
        color: "#22c55e",
        is_active: true,
        isNew: true,
      })
    }
    setLeaveTypeDialogOpen(true)
  }

  const saveLeaveType = () => {
    if (!editingLeaveType || !editingLeaveType.name.trim()) return
    
    setLeaveTypes(prev => {
      const existing = prev.find(lt => lt.id === editingLeaveType.id)
      if (existing) {
        return prev.map(lt => lt.id === editingLeaveType.id ? editingLeaveType : lt)
      } else {
        return [...prev, editingLeaveType]
      }
    })
    setLeaveTypeDialogOpen(false)
    setEditingLeaveType(null)
  }

  const removeLeaveType = (leaveTypeId: string) => {
    const lt = leaveTypes.find(l => l.id === leaveTypeId)
    if (lt && !lt.isNew) {
      setDeletedLeaveTypes(prev => [...prev, leaveTypeId])
    }
    setLeaveTypes(prev => prev.filter(l => l.id !== leaveTypeId))
  }

  // Recognition Category handlers
  const openCategoryDialog = (category?: RecognitionCategory) => {
    if (category) {
      setEditingCategory(category)
    } else {
      setEditingCategory({
        id: `new-${Date.now()}`,
        agency_id: id,
        name: "",
        description: null,
        points: 10,
        color: "#3b82f6",
        icon: "award",
        is_active: true,
        isNew: true,
      })
    }
    setCategoryDialogOpen(true)
  }

  const saveCategory = () => {
    if (!editingCategory || !editingCategory.name.trim()) return
    
    setRecognitionCategories(prev => {
      const existing = prev.find(c => c.id === editingCategory.id)
      if (existing) {
        return prev.map(c => c.id === editingCategory.id ? editingCategory : c)
      } else {
        return [...prev, editingCategory]
      }
    })
    setCategoryDialogOpen(false)
    setEditingCategory(null)
  }

  const removeCategory = (categoryId: string) => {
    const cat = recognitionCategories.find(c => c.id === categoryId)
    if (cat && !cat.isNew) {
      setDeletedCategories(prev => [...prev, categoryId])
    }
    setRecognitionCategories(prev => prev.filter(c => c.id !== categoryId))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Si hay más de una agencia, preguntar el alcance antes de guardar,
    // ya que estos apartados están unificados entre agencias.
    if (allAgencies.length > 1) {
      setApplyScope("all")
      setSelectedTargetAgencies(allAgencies.filter((a) => a.id !== id).map((a) => a.id))
      setScopeDialogOpen(true)
      return
    }
    performSave()
  }

  const performSave = async () => {
    setScopeDialogOpen(false)
    setSaving(true)
    setError(null)

    try {
      // Update agency with branding
      const { error: agencyError } = await supabase
        .from("agencies")
        .update({
          name: formData.name,
          legal_name: formData.legal_name || null,
          tax_id: formData.tax_id || null,
          email: formData.email || null,
          phone: formData.phone || null,
          website: formData.website || null,
          address: formData.address || null,
          is_active: formData.is_active,
          logo_url: branding.logo_url || null,
          settings: {
            branding: {
              primary_color: branding.primary_color,
              secondary_color: branding.secondary_color,
              accent_color: branding.accent_color,
              text_color: branding.text_color,
              background_color: branding.background_color,
              font_family: branding.font_family,
              tagline: branding.tagline,
            },
            onboarding_email: emailConfig,
            working_hours_per_month: Number.parseFloat(workingHoursPerMonth) || 160,
            objectives: {
              accounts_target: objectives.accounts_target === "" ? null : Number.parseInt(objectives.accounts_target, 10),
              projects_target: objectives.projects_target === "" ? null : Number.parseInt(objectives.projects_target, 10),
              monthly_revenue_target:
                objectives.monthly_revenue_target === "" ? null : Number.parseFloat(objectives.monthly_revenue_target),
              annual_revenue_target:
                objectives.annual_revenue_target === "" ? null : Number.parseFloat(objectives.annual_revenue_target),
            },
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (agencyError) throw agencyError

      // Delete removed currencies
      await supabase
        .from("agency_currencies")
        .delete()
        .eq("agency_id", id)
      
      // Insert currencies
      if (selectedCurrencies.length > 0) {
        await supabase
          .from("agency_currencies")
          .insert(selectedCurrencies.map(currencyId => ({
            agency_id: id,
            currency_id: currencyId,
            is_default: currencyId === defaultCurrency,
          })))
      }

      // Delete removed bank accounts
      if (deletedBankAccounts.length > 0) {
        await supabase
          .from("bank_accounts")
          .delete()
          .in("id", deletedBankAccounts)
      }

      // Upsert bank accounts
      for (const ba of bankAccounts) {
        if (ba.isNew) {
          await supabase.from("bank_accounts").insert({
            agency_id: id,
            currency_id: ba.currency_id,
            bank_name: ba.bank_name,
            account_name: ba.account_name,
            account_number: ba.account_number || null,
            clabe: ba.clabe || null,
            swift_code: ba.swift_code || null,
            iban: ba.iban || null,
            account_type: ba.account_type,
            is_primary: ba.is_primary,
          })
        } else {
          await supabase.from("bank_accounts").update({
            currency_id: ba.currency_id,
            bank_name: ba.bank_name,
            account_name: ba.account_name,
            account_number: ba.account_number || null,
            clabe: ba.clabe || null,
            swift_code: ba.swift_code || null,
            iban: ba.iban || null,
            account_type: ba.account_type,
            is_primary: ba.is_primary,
            updated_at: new Date().toISOString(),
          }).eq("id", ba.id)
        }
      }

      // Delete removed departments
      if (deletedDepartments.length > 0) {
        await supabase
          .from("departments")
          .delete()
          .in("id", deletedDepartments)
      }

      // Upsert departments
      for (const dept of departments) {
        if (dept.isNew) {
          const { data: newDept } = await supabase.from("departments").insert({
            agency_id: id,
            name: dept.name,
            description: dept.description || null,
            is_active: dept.is_active,
            sort_order: dept.sort_order,
          }).select().single()
          
          // Update positions that reference this department
          if (newDept) {
            setPositions(prev => prev.map(p => 
              p.department_id === dept.id ? { ...p, department_id: newDept.id } : p
            ))
          }
        } else {
          await supabase.from("departments").update({
            name: dept.name,
            description: dept.description || null,
            is_active: dept.is_active,
            sort_order: dept.sort_order,
            updated_at: new Date().toISOString(),
          }).eq("id", dept.id)
        }
      }

      // Delete removed positions
      if (deletedPositions.length > 0) {
        await supabase
          .from("positions")
          .delete()
          .in("id", deletedPositions)
      }

      // Upsert positions
      for (const pos of positions) {
        if (pos.isNew) {
          await supabase.from("positions").insert({
            agency_id: id,
            department_id: pos.department_id,
            name: pos.name,
            description: pos.description || null,
            level: pos.level,
            default_hourly_cost: pos.default_hourly_cost,
            is_billable: pos.is_billable,
            is_active: pos.is_active,
            sort_order: pos.sort_order,
            min_accounts: pos.min_accounts ?? 0,
            max_accounts: pos.max_accounts ?? 10,
            min_projects: pos.min_projects ?? 0,
            max_projects: pos.max_projects ?? 10,
            min_subordinates: pos.min_subordinates ?? 0,
            max_subordinates: pos.max_subordinates ?? 5,
          })
        } else {
          await supabase.from("positions").update({
            department_id: pos.department_id,
            name: pos.name,
            description: pos.description || null,
            level: pos.level,
            default_hourly_cost: pos.default_hourly_cost,
            is_billable: pos.is_billable,
            is_active: pos.is_active,
            sort_order: pos.sort_order,
            min_accounts: pos.min_accounts ?? 0,
            max_accounts: pos.max_accounts ?? 10,
            min_projects: pos.min_projects ?? 0,
            max_projects: pos.max_projects ?? 10,
            min_subordinates: pos.min_subordinates ?? 0,
            max_subordinates: pos.max_subordinates ?? 5,
            updated_at: new Date().toISOString(),
          }).eq("id", pos.id)
        }
      }

      // Delete removed commission types
      if (deletedCommissionTypes.length > 0) {
        await supabase
          .from("agency_commission_types")
          .delete()
          .in("id", deletedCommissionTypes)
      }

      // Upsert commission types
      for (const ct of commissionTypes) {
        if (ct.isNew) {
          await supabase.from("agency_commission_types").insert({
            agency_id: id,
            name: ct.name,
            amount: ct.amount,
            is_active: ct.is_active,
            display_order: ct.display_order,
          })
        } else {
          await supabase.from("agency_commission_types").update({
            name: ct.name,
            amount: ct.amount,
            is_active: ct.is_active,
            display_order: ct.display_order,
            updated_at: new Date().toISOString(),
}).eq("id", ct.id)
      }
      }

      // Delete removed contract types
      if (deletedContractTypes.length > 0) {
        await supabase
          .from("contract_types")
          .delete()
          .in("id", deletedContractTypes)
      }

      // Upsert contract types
      for (const ct of contractTypes) {
        if (ct.isNew) {
          await supabase.from("contract_types").insert({
            agency_id: id,
            name: ct.name,
            code: ct.code,
            description: ct.description || null,
            weekly_hours: ct.weekly_hours,
            is_billable: ct.is_billable,
            is_active: ct.is_active,
            sort_order: ct.sort_order,
          })
        } else {
          await supabase.from("contract_types").update({
            name: ct.name,
            code: ct.code,
            description: ct.description || null,
            weekly_hours: ct.weekly_hours,
            is_billable: ct.is_billable,
            is_active: ct.is_active,
            sort_order: ct.sort_order,
            updated_at: new Date().toISOString(),
          }).eq("id", ct.id)
        }
      }

      // Delete removed leave types
      if (deletedLeaveTypes.length > 0) {
        await supabase.from("leave_types").delete().in("id", deletedLeaveTypes)
      }

      // Save leave types
      for (const lt of leaveTypes) {
        if (lt.isNew) {
          await supabase.from("leave_types").insert({
            agency_id: id,
            name: lt.name,
            description: lt.description || null,
            days_per_year: lt.days_per_year,
            requires_approval: lt.requires_approval,
            is_paid: lt.is_paid,
            color: lt.color,
            is_active: lt.is_active,
          })
        } else {
          await supabase.from("leave_types").update({
            name: lt.name,
            description: lt.description || null,
            days_per_year: lt.days_per_year,
            requires_approval: lt.requires_approval,
            is_paid: lt.is_paid,
            color: lt.color,
            is_active: lt.is_active,
            updated_at: new Date().toISOString(),
          }).eq("id", lt.id)
        }
      }

      // Save recognition settings
      if (recognitionSettings) {
        if (recognitionSettings.id) {
          await supabase.from("recognition_settings").update({
            max_recognitions_per_month: recognitionSettings.max_recognitions_per_month,
            point_value: recognitionSettings.point_value,
            min_redemption_points: recognitionSettings.min_redemption_points,
            updated_at: new Date().toISOString(),
          }).eq("id", recognitionSettings.id)
        } else {
          const { data: newRecSettings } = await supabase.from("recognition_settings").insert({
            agency_id: id,
            max_recognitions_per_month: recognitionSettings.max_recognitions_per_month,
            point_value: recognitionSettings.point_value,
            min_redemption_points: recognitionSettings.min_redemption_points,
          }).select().single()
          if (newRecSettings) {
            setRecognitionSettings({ ...recognitionSettings, id: newRecSettings.id })
          }
        }
      }

      // Delete removed recognition categories
      if (deletedCategories.length > 0) {
        await supabase.from("recognition_categories").delete().in("id", deletedCategories)
      }

      // Save recognition categories
      for (const cat of recognitionCategories) {
        if (cat.isNew) {
          await supabase.from("recognition_categories").insert({
            agency_id: id,
            name: cat.name,
            description: cat.description || null,
            points: cat.points,
            color: cat.color,
            icon: cat.icon,
            is_active: cat.is_active,
          })
        } else {
          await supabase.from("recognition_categories").update({
            name: cat.name,
            description: cat.description || null,
            points: cat.points,
            color: cat.color,
            icon: cat.icon,
            is_active: cat.is_active,
            updated_at: new Date().toISOString(),
          }).eq("id", cat.id)
        }
      }
  
      // Propagar la configuración unificada a las demás agencias según el alcance
      // elegido. La agencia actual es la fuente; las destino se igualan a ella.
      let targets: string[] = []
      if (applyScope === "all") {
        targets = allAgencies.filter((a) => a.id !== id).map((a) => a.id)
      } else if (applyScope === "select") {
        targets = selectedTargetAgencies.filter((t) => t !== id)
      }
      for (const targetId of targets) {
        const { error: syncError } = await supabase.rpc("sync_agency_config", {
          p_source: id,
          p_target: targetId,
        })
        if (syncError) {
          console.error("[v0] Error sincronizando agencia:", targetId, syncError)
          throw new Error(`No se pudo sincronizar la configuración: ${syncError.message}`)
        }
      }

      router.push("/dashboard/agencies")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar los cambios")
    } finally {
      setSaving(false)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-40 bg-muted rounded animate-pulse" />
            <div className="h-4 w-60 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="h-96 bg-muted rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/agencies">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          {branding.logo_url ? (
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center border">
              <img 
                src={getLogoUrl(branding.logo_url)} 
                alt={formData.name}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">Configurar Agencia</h1>
            <p className="text-muted-foreground text-sm">{formData.name}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="general" className="space-y-6">
<TabsList className="flex flex-wrap h-auto gap-2 p-2 bg-muted/50 rounded-lg">
              <TabsTrigger value="general" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2">
                <Building2 className="h-4 w-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger value="branding" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2">
                <Palette className="h-4 w-4 mr-2" />
                Personalización
              </TabsTrigger>
              <TabsTrigger value="currencies" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2">
                <Coins className="h-4 w-4 mr-2" />
                Monedas y Bancos
              </TabsTrigger>
              <TabsTrigger value="departments" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2">
                <Users className="h-4 w-4 mr-2" />
                Departamentos
              </TabsTrigger>
              <TabsTrigger value="positions" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2">
                <Briefcase className="h-4 w-4 mr-2" />
                Puestos y Cargas
              </TabsTrigger>
              <TabsTrigger value="contracts" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2">
                <Clock className="h-4 w-4 mr-2" />
                Contratos y Horas
              </TabsTrigger>
              <TabsTrigger value="commissions" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2">
                <BadgePercent className="h-4 w-4 mr-2" />
                Comisiones
              </TabsTrigger>
              <TabsTrigger value="leaves" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2">
                <Palmtree className="h-4 w-4 mr-2" />
                Permisos
              </TabsTrigger>
              <TabsTrigger value="recognitions" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2">
                <Award className="h-4 w-4 mr-2" />
                Reconocimientos
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2">
                <Bell className="h-4 w-4 mr-2" />
                Notificaciones
              </TabsTrigger>
              <TabsTrigger value="onboarding-email" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2">
                <Mail className="h-4 w-4 mr-2" />
                Correos Onboarding
              </TabsTrigger>
              <TabsTrigger value="working-hours" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2">
                <Clock className="h-4 w-4 mr-2" />
                Horas Laborables
              </TabsTrigger>
              <TabsTrigger value="objectives" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2">
                <Target className="h-4 w-4 mr-2" />
                Objetivos
              </TabsTrigger>
            </TabsList>

          {/* Tab Correos Onboarding */}
          <TabsContent value="onboarding-email">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Correos de Onboarding
                </CardTitle>
                <CardDescription>
                  Configura los datos de envío de las encuestas de satisfacción (semana 1 y día 30) para esta agencia.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="sender_name">Nombre del remitente</Label>
                      <Input
                        id="sender_name"
                        value={emailConfig.sender_name}
                        onChange={(e) => setEmailConfig({ ...emailConfig, sender_name: e.target.value })}
                        placeholder="Recursos Humanos"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="sender_email">Correo del remitente</Label>
                      <Input
                        id="sender_email"
                        type="email"
                        value={emailConfig.sender_email}
                        onChange={(e) => setEmailConfig({ ...emailConfig, sender_email: e.target.value })}
                        placeholder="rrhh@agencia.com"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="reply_to">Responder a (Reply-To)</Label>
                      <Input
                        id="reply_to"
                        type="email"
                        value={emailConfig.reply_to}
                        onChange={(e) => setEmailConfig({ ...emailConfig, reply_to: e.target.value })}
                        placeholder="rrhh@agencia.com"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="hr_notification_email">Correo de notificación a RRHH</Label>
                      <Input
                        id="hr_notification_email"
                        type="email"
                        value={emailConfig.hr_notification_email}
                        onChange={(e) => setEmailConfig({ ...emailConfig, hr_notification_email: e.target.value })}
                        placeholder="Recibe avisos cuando se responde una encuesta"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="survey_subject_week1">Asunto — Encuesta Semana 1</Label>
                      <Input
                        id="survey_subject_week1"
                        value={emailConfig.survey_subject_week1}
                        onChange={(e) => setEmailConfig({ ...emailConfig, survey_subject_week1: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="survey_subject_day30">Asunto — Encuesta Día 30</Label>
                      <Input
                        id="survey_subject_day30"
                        value={emailConfig.survey_subject_day30}
                        onChange={(e) => setEmailConfig({ ...emailConfig, survey_subject_day30: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="signature">Firma del correo</Label>
                    <Textarea
                      id="signature"
                      value={emailConfig.signature}
                      onChange={(e) => setEmailConfig({ ...emailConfig, signature: e.target.value })}
                      placeholder="Equipo de Recursos Humanos"
                      rows={3}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Estos datos se usan para personalizar los correos de las encuestas de satisfacción del onboarding.
                    El disparo automático (día 7 y día 30) usará esta configuración una vez se conecte el proveedor de correo.
                  </p>
                </FieldGroup>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Horas Laborables */}
          <TabsContent value="working-hours">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horas Laborables
                </CardTitle>
                <CardDescription>
                  Número de horas laborables al mes de esta agencia. Es el factor por el que se divide automáticamente
                  el salario mensual para determinar el costo por hora en Sueldos y Salarios y en Personal.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <div className="grid gap-2 max-w-xs">
                    <Label htmlFor="working_hours_per_month">Horas laborables al mes</Label>
                    <Input
                      id="working_hours_per_month"
                      type="number"
                      step="1"
                      min="1"
                      inputMode="numeric"
                      value={workingHoursPerMonth}
                      onChange={(e) => setWorkingHoursPerMonth(e.target.value)}
                      placeholder="160"
                    />
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 p-4">
                    <p className="text-sm text-muted-foreground">
                      Ejemplo: con{" "}
                      <span className="font-medium text-foreground">
                        {Number.parseFloat(workingHoursPerMonth) > 0
                          ? Number.parseFloat(workingHoursPerMonth)
                          : 160}
                      </span>{" "}
                      horas al mes, un salario mensual de{" "}
                      <span className="font-medium text-foreground">$16,000</span> equivale a un costo por hora de{" "}
                      <span className="font-medium text-foreground">
                        {formatCurrencyExample(16000, Number.parseFloat(workingHoursPerMonth) || 160)}
                      </span>
                      .
                    </p>
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Objetivos */}
          <TabsContent value="objectives">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Objetivos
                </CardTitle>
                <CardDescription>
                  Define las metas de esta agencia. Estos objetivos son específicos de cada agencia y sirven de
                  referencia para medir el desempeño en cuentas, proyectos e ingresos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      Objetivos de operación
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 mt-3">
                      <div className="grid gap-2">
                        <Label htmlFor="accounts_target">Objetivo de cuentas</Label>
                        <Input
                          id="accounts_target"
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          value={objectives.accounts_target}
                          onChange={(e) => setObjectives({ ...objectives, accounts_target: e.target.value })}
                          placeholder="Ej. 50"
                        />
                        <p className="text-xs text-muted-foreground">Número de cuentas activas que se busca alcanzar.</p>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="projects_target">Objetivo de proyectos</Label>
                        <Input
                          id="projects_target"
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          value={objectives.projects_target}
                          onChange={(e) => setObjectives({ ...objectives, projects_target: e.target.value })}
                          placeholder="Ej. 120"
                        />
                        <p className="text-xs text-muted-foreground">Número de proyectos que se busca alcanzar.</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Coins className="h-4 w-4 text-muted-foreground" />
                      Objetivos de ingresos
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 mt-3">
                      <div className="grid gap-2">
                        <Label htmlFor="monthly_revenue_target">Ingresos mensuales</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                          <Input
                            id="monthly_revenue_target"
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            className="pl-7"
                            value={objectives.monthly_revenue_target}
                            onChange={(e) => setObjectives({ ...objectives, monthly_revenue_target: e.target.value })}
                            placeholder="Ej. 500000"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Meta de ingresos por mes.</p>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="annual_revenue_target">Ingresos anuales</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                          <Input
                            id="annual_revenue_target"
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            className="pl-7"
                            value={objectives.annual_revenue_target}
                            onChange={(e) => setObjectives({ ...objectives, annual_revenue_target: e.target.value })}
                            placeholder="Ej. 6000000"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Meta de ingresos por año.</p>
                      </div>
                    </div>
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab General */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
                <CardDescription>Datos básicos de la agencia</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="name">Nombre de la Agencia *</FieldLabel>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="legal_name">Razón Social</FieldLabel>
                      <Input
                        id="legal_name"
                        name="legal_name"
                        value={formData.legal_name || ""}
                        onChange={handleChange}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="tax_id">RFC / ID Fiscal</FieldLabel>
                      <Input
                        id="tax_id"
                        name="tax_id"
                        value={formData.tax_id || ""}
                        onChange={handleChange}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email || ""}
                        onChange={handleChange}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone || ""}
                        onChange={handleChange}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="website">Sitio Web</FieldLabel>
                      <Input
                        id="website"
                        name="website"
                        value={formData.website || ""}
                        onChange={handleChange}
                      />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="address">Dirección</FieldLabel>
                    <Textarea
                      id="address"
                      name="address"
                      value={formData.address || ""}
                      onChange={handleChange}
                      rows={3}
                    />
                  </Field>
                  <Field className="flex items-center gap-3">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <FieldLabel htmlFor="is_active" className="!mb-0">Agencia Activa</FieldLabel>
                  </Field>
                </FieldGroup>
</CardContent>
              </Card>
            </TabsContent>

            {/* Tab Personalización */}
            <TabsContent value="branding">
              <div className="space-y-6">
                {/* Logo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Logotipo
                    </CardTitle>
                    <CardDescription>
                      Sube el logotipo de la agencia. Se recomienda un formato PNG con fondo transparente.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-6">
                      <div className="relative">
                        {branding.logo_url ? (
                          <div className="relative w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 overflow-hidden bg-muted">
<img
                              src={getLogoUrl(branding.logo_url)}
                              alt="Logo de la agencia"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted">
                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label htmlFor="logo-upload">
                            <Button asChild variant="outline" disabled={uploadingLogo}>
                              <span>
                                {uploadingLogo ? (
                                  <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    Subiendo...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Subir Logo
                                  </>
                                )}
                              </span>
                            </Button>
                          </label>
                          <input
                            id="logo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
                          />
                        </div>
                        {branding.logo_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setBranding(prev => ({ ...prev, logo_url: "" }))}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar Logo
                          </Button>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Formatos: PNG, JPG, SVG. Tamaño máximo: 2MB
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Colores */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Colores de Marca
                    </CardTitle>
                    <CardDescription>
                      Define los colores que representan la identidad visual de la agencia.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <Field>
                        <FieldLabel>Color Primario</FieldLabel>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={branding.primary_color}
                            onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                            className="w-12 h-10 rounded border cursor-pointer"
                          />
                          <Input
                            value={branding.primary_color}
                            onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                            placeholder="#3B82F6"
                            className="font-mono"
                          />
                        </div>
                      </Field>

                      <Field>
                        <FieldLabel>Color Secundario</FieldLabel>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={branding.secondary_color}
                            onChange={(e) => setBranding(prev => ({ ...prev, secondary_color: e.target.value }))}
                            className="w-12 h-10 rounded border cursor-pointer"
                          />
                          <Input
                            value={branding.secondary_color}
                            onChange={(e) => setBranding(prev => ({ ...prev, secondary_color: e.target.value }))}
                            placeholder="#10B981"
                            className="font-mono"
                          />
                        </div>
                      </Field>

                      <Field>
                        <FieldLabel>Color de Acento</FieldLabel>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={branding.accent_color}
                            onChange={(e) => setBranding(prev => ({ ...prev, accent_color: e.target.value }))}
                            className="w-12 h-10 rounded border cursor-pointer"
                          />
                          <Input
                            value={branding.accent_color}
                            onChange={(e) => setBranding(prev => ({ ...prev, accent_color: e.target.value }))}
                            placeholder="#F59E0B"
                            className="font-mono"
                          />
                        </div>
                      </Field>

                      <Field>
                        <FieldLabel>Color de Texto</FieldLabel>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={branding.text_color}
                            onChange={(e) => setBranding(prev => ({ ...prev, text_color: e.target.value }))}
                            className="w-12 h-10 rounded border cursor-pointer"
                          />
                          <Input
                            value={branding.text_color}
                            onChange={(e) => setBranding(prev => ({ ...prev, text_color: e.target.value }))}
                            placeholder="#1F2937"
                            className="font-mono"
                          />
                        </div>
                      </Field>

                      <Field>
                        <FieldLabel>Color de Fondo</FieldLabel>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={branding.background_color}
                            onChange={(e) => setBranding(prev => ({ ...prev, background_color: e.target.value }))}
                            className="w-12 h-10 rounded border cursor-pointer"
                          />
                          <Input
                            value={branding.background_color}
                            onChange={(e) => setBranding(prev => ({ ...prev, background_color: e.target.value }))}
                            placeholder="#FFFFFF"
                            className="font-mono"
                          />
                        </div>
                      </Field>
                    </div>

                    {/* Preview */}
                    <div className="mt-6 p-4 border rounded-lg">
                      <p className="text-sm font-medium mb-3">Vista Previa</p>
                      <div 
                        className="p-6 rounded-lg"
                        style={{ backgroundColor: branding.background_color }}
                      >
                        <div className="flex items-center gap-4 mb-4">
                          {branding.logo_url && (
                            <img src={getLogoUrl(branding.logo_url)} alt="Logo" className="h-10 w-auto" />
                          )}
                          <h3 
                            className="text-lg font-bold"
                            style={{ color: branding.text_color }}
                          >
                            {formData.name || "Nombre de la Agencia"}
                          </h3>
                        </div>
                        <div className="flex gap-3">
                          <div 
                            className="px-4 py-2 rounded text-white text-sm font-medium"
                            style={{ backgroundColor: branding.primary_color }}
                          >
                            Primario
                          </div>
                          <div 
                            className="px-4 py-2 rounded text-white text-sm font-medium"
                            style={{ backgroundColor: branding.secondary_color }}
                          >
                            Secundario
                          </div>
                          <div 
                            className="px-4 py-2 rounded text-white text-sm font-medium"
                            style={{ backgroundColor: branding.accent_color }}
                          >
                            Acento
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tipografía y otros */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tipografía y Mensaje</CardTitle>
                    <CardDescription>
                      Configura la fuente y el eslogan de la agencia.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FieldGroup cols={2}>
                      <Field>
                        <FieldLabel>Familia de Fuente</FieldLabel>
                        <Select
                          value={branding.font_family}
                          onValueChange={(value) => setBranding(prev => ({ ...prev, font_family: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una fuente" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inter">Inter</SelectItem>
                            <SelectItem value="Roboto">Roboto</SelectItem>
                            <SelectItem value="Open Sans">Open Sans</SelectItem>
                            <SelectItem value="Lato">Lato</SelectItem>
                            <SelectItem value="Montserrat">Montserrat</SelectItem>
                            <SelectItem value="Poppins">Poppins</SelectItem>
                            <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                            <SelectItem value="Source Sans Pro">Source Sans Pro</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field>
                        <FieldLabel>Eslogan / Tagline</FieldLabel>
                        <Input
                          value={branding.tagline}
                          onChange={(e) => setBranding(prev => ({ ...prev, tagline: e.target.value }))}
                          placeholder="Ej: Transformando ideas en resultados"
                        />
                      </Field>
                    </FieldGroup>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
  
            {/* Tab Monedas y Bancos */}
          <TabsContent value="currencies">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>Monedas Habilitadas</CardTitle>
                      <CardDescription>Selecciona las monedas con las que opera esta agencia</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
                    {currencies.map((currency) => (
                      <div
                        key={currency.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedCurrencies.includes(currency.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground"
                        }`}
                        onClick={() => toggleCurrency(currency.id)}
                      >
                        <Checkbox
                          checked={selectedCurrencies.includes(currency.id)}
                          onCheckedChange={() => toggleCurrency(currency.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{currency.code}</p>
                          <p className="text-xs text-muted-foreground truncate">{currency.name}</p>
                        </div>
                        {selectedCurrencies.includes(currency.id) && (
                          <Badge
                            variant={defaultCurrency === currency.id ? "default" : "outline"}
                            className="cursor-pointer text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDefaultCurrency(currency.id)
                            }}
                          >
                            {defaultCurrency === currency.id ? "Principal" : "Hacer principal"}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle>Cuentas Bancarias</CardTitle>
                        <CardDescription>Configura las cuentas bancarias de la agencia</CardDescription>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addBankAccount}
                      disabled={selectedCurrencies.length === 0}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Cuenta
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {bankAccounts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay cuentas bancarias configuradas
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bankAccounts.map((account, index) => (
                        <div key={account.id} className="p-4 border rounded-lg space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Cuenta {index + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBankAccount(account.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid gap-4 md:grid-cols-3">
                            <Field>
                              <FieldLabel>Moneda</FieldLabel>
                              <Select
                                value={account.currency_id}
                                onValueChange={(v) => updateBankAccount(account.id, "currency_id", v)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {currencies.filter(c => selectedCurrencies.includes(c.id)).map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </Field>
                            <Field>
                              <FieldLabel>Banco</FieldLabel>
                              <Input
                                value={account.bank_name}
                                onChange={(e) => updateBankAccount(account.id, "bank_name", e.target.value)}
                                placeholder="Nombre del banco"
                              />
                            </Field>
                            <Field>
                              <FieldLabel>Titular</FieldLabel>
                              <Input
                                value={account.account_name}
                                onChange={(e) => updateBankAccount(account.id, "account_name", e.target.value)}
                                placeholder="Nombre del titular"
                              />
                            </Field>
                            <Field>
                              <FieldLabel>Número de Cuenta</FieldLabel>
                              <Input
                                value={account.account_number}
                                onChange={(e) => updateBankAccount(account.id, "account_number", e.target.value)}
                              />
                            </Field>
                            <Field>
                              <FieldLabel>CLABE</FieldLabel>
                              <Input
                                value={account.clabe}
                                onChange={(e) => updateBankAccount(account.id, "clabe", e.target.value)}
                                maxLength={18}
                              />
                            </Field>
                            <Field>
                              <FieldLabel>Tipo de Cuenta</FieldLabel>
                              <Select
                                value={account.account_type}
                                onValueChange={(v) => updateBankAccount(account.id, "account_type", v)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="checking">Cheques</SelectItem>
                                  <SelectItem value="savings">Ahorro</SelectItem>
                                  <SelectItem value="investment">Inversión</SelectItem>
                                  <SelectItem value="other">Otra</SelectItem>
                                </SelectContent>
                              </Select>
                            </Field>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Departamentos */}
          <TabsContent value="departments">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>Departamentos</CardTitle>
                      <CardDescription>Define los departamentos de esta agencia</CardDescription>
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => openDepartmentDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Departamento
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {departments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay departamentos configurados
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="w-[100px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departments.map((dept) => (
                        <TableRow key={dept.id}>
                          <TableCell className="font-medium">{dept.name}</TableCell>
                          <TableCell className="text-muted-foreground">{dept.description || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={dept.is_active ? "default" : "secondary"}>
                              {dept.is_active ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => openDepartmentDialog(dept)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeDepartment(dept.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Puestos */}
          <TabsContent value="positions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <div>
<CardTitle>Puestos y Cargas de Trabajo</CardTitle>
                  <CardDescription>Define los puestos y la capacidad de carga (cuentas y subordinados) para cada uno</CardDescription>
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => openPositionDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Puesto
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {positions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay puestos configurados
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Departamento</TableHead>
                        <TableHead>Nivel</TableHead>
                        <TableHead className="text-center">Cuentas (min-max)</TableHead>
                        <TableHead className="text-center">Proyectos (min-max)</TableHead>
                        <TableHead className="text-center">Subordinados (min-max)</TableHead>
                        <TableHead>Costo/Hora</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="w-[100px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {positions.map((pos) => (
                        <TableRow key={pos.id}>
                          <TableCell className="font-medium">{pos.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {getDepartmentById(pos.department_id)?.name || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {LEVELS.find(l => l.value === pos.level)?.label || pos.level}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm font-medium">
                              {pos.min_accounts ?? 0} - {pos.max_accounts ?? 10}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm font-medium">
                              {pos.min_projects ?? 0} - {pos.max_projects ?? 10}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm font-medium">
                              {pos.min_subordinates ?? 0} - {pos.max_subordinates ?? 5}
                            </span>
                          </TableCell>
                          <TableCell>
                            {pos.default_hourly_cost ? `$${pos.default_hourly_cost.toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={pos.is_active ? "default" : "secondary"}>
                              {pos.is_active ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => openPositionDialog(pos)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removePosition(pos.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Tipos de Contrato */}
          <TabsContent value="contracts">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>Tipos de Contrato & Horas</CardTitle>
                      <CardDescription>Define los tipos de contrato y horas semanales para el personal de esta agencia</CardDescription>
                    </div>
                  </div>
                  <Button type="button" onClick={() => openContractTypeDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Tipo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {contractTypes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay tipos de contrato configurados</p>
                    <p className="text-sm">Los tipos de contrato definen las horas semanales y si el personal es facturable</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead className="text-center">Horas/Semana</TableHead>
                        <TableHead className="text-center">Facturable</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contractTypes.map((ct) => (
                        <TableRow key={ct.id}>
                          <TableCell className="font-medium">{ct.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{ct.code}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {ct.weekly_hours > 0 ? `${ct.weekly_hours}h` : "Variable"}
                          </TableCell>
                          <TableCell className="text-center">
                            {ct.is_billable ? (
                              <Badge variant="default">Sí</Badge>
                            ) : (
                              <Badge variant="secondary">No</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {ct.is_active ? (
                              <Badge variant="default">Activo</Badge>
                            ) : (
                              <Badge variant="secondary">Inactivo</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => openContractTypeDialog(ct)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeContractType(ct.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Comisiones */}
          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BadgePercent className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>Tipos de Comisión por Citas</CardTitle>
                      <CardDescription>Define los tipos de cliente y montos de comisión personalizados para esta agencia</CardDescription>
                    </div>
                  </div>
                  <Button type="button" onClick={() => openCommissionTypeDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Tipo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {commissionTypes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <BadgePercent className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No hay tipos de comisión configurados</p>
                      <p className="text-sm">Agrega tipos de cliente para definir los montos de comisión por cita</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo de Cliente</TableHead>
                          <TableHead>Monto (MXN)</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="w-[100px]">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commissionTypes.map((ct) => (
                          <TableRow key={ct.id}>
                            <TableCell className="font-medium">{ct.name}</TableCell>
                            <TableCell>${ct.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell>
                              <Badge variant={ct.is_active ? "default" : "secondary"}>
                                {ct.is_active ? "Activo" : "Inactivo"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => openCommissionTypeDialog(ct)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => removeCommissionType(ct.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Nota sobre comisiones</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Las comisiones generadas requieren aprobacion de un gerente o director antes de ser pagadas.
                      Las comisiones por clientes se configuran en Cuentas y Proyectos.
                      Las comisiones se pueden gestionar desde el modulo de Recursos Humanos {"->"} Comisiones.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
</TabsContent>

            {/* Tab Notificaciones */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Configuración de Notificaciones
                  </CardTitle>
                  <CardDescription>
                    Configura qué notificaciones se envían y a quién para esta agencia
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Correos de Notificación */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Correos para Notificaciones</h3>
                        <p className="text-sm text-muted-foreground">
                          Agrega correos que recibirán notificaciones de la agencia
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-4 p-4 border rounded-lg bg-muted/30">
                      <div>
                        <Label htmlFor="notif-name">Nombre</Label>
                        <Input
                          id="notif-name"
                          value={newNotificationEmail.name}
                          onChange={(e) => setNewNotificationEmail(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ej: Contador"
                        />
                      </div>
                      <div>
                        <Label htmlFor="notif-email">Correo</Label>
                        <Input
                          id="notif-email"
                          type="email"
                          value={newNotificationEmail.email}
                          onChange={(e) => setNewNotificationEmail(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="correo@empresa.com"
                        />
                      </div>
                      <div>
                        <Label>Categorías</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {["finance", "hr", "operations", "system"].map(cat => (
                            <Badge
                              key={cat}
                              variant={newNotificationEmail.categories.includes(cat) ? "default" : "outline"}
                              className="cursor-pointer text-xs"
                              onClick={() => toggleEmailCategory(cat)}
                            >
                              {getCategoryLabel(cat)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-end">
                        <Button onClick={addNotificationEmail} disabled={!newNotificationEmail.email || !newNotificationEmail.name}>
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar
                        </Button>
                      </div>
                    </div>

                    {notificationEmails.length > 0 && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Correo</TableHead>
                            <TableHead>Categorías</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {notificationEmails.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>{item.email}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {item.categories?.map(cat => (
                                    <Badge key={cat} variant="secondary" className="text-xs">
                                      {getCategoryLabel(cat)}
                                    </Badge>
                                  ))}
                                  {(!item.categories || item.categories.length === 0) && (
                                    <span className="text-muted-foreground text-sm">Todas</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeNotificationEmail(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>

                  {/* Tipos de Notificaciones */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-1">Tipos de Notificaciones</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Activa o desactiva los canales de notificación por tipo de evento
                      </p>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground border-b pb-2 mb-4">
                        <span className="flex-1">Evento</span>
                        <span className="w-20 text-center flex items-center justify-center gap-1">
                          <Mail className="h-4 w-4" /> Email
                        </span>
                        <span className="w-20 text-center flex items-center justify-center gap-1">
                          <Smartphone className="h-4 w-4" /> Push
                        </span>
                        <span className="w-20 text-center flex items-center justify-center gap-1">
                          <Monitor className="h-4 w-4" /> App
                        </span>
                      </div>
                    </div>

                    {["finance", "hr", "operations", "system"].map((category) => {
                      const categoryTypes = notificationTypes.filter(t => t.category === category)
                      if (categoryTypes.length === 0) return null
                      
                      return (
                        <div key={category} className="space-y-3">
                          <h4 className="font-medium text-sm text-primary border-b pb-1">
                            {getCategoryLabel(category)}
                          </h4>
                          <div className="space-y-2">
                            {categoryTypes.map((type) => {
                              const setting = getNotificationSetting(type.code)
                              return (
                                <div key={type.id} className="flex items-center gap-6 py-2 hover:bg-muted/30 rounded px-2">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{type.name}</p>
                                    <p className="text-xs text-muted-foreground">{type.description}</p>
                                  </div>
                                  <div className="w-20 flex justify-center">
                                    <Switch 
                                      checked={setting.email_enabled}
                                      onCheckedChange={(checked) => handleToggleNotification(type.code, "email_enabled", checked)}
                                    />
                                  </div>
                                  <div className="w-20 flex justify-center">
                                    <Switch 
                                      checked={setting.push_enabled}
                                      onCheckedChange={(checked) => handleToggleNotification(type.code, "push_enabled", checked)}
                                    />
                                  </div>
                                  <div className="w-20 flex justify-center">
                                    <Switch 
                                      checked={setting.in_app_enabled}
                                      onCheckedChange={(checked) => handleToggleNotification(type.code, "in_app_enabled", checked)}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                    
                    {notificationTypes.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay tipos de notificación configurados en el sistema
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Permisos */}
            <TabsContent value="leaves">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Palmtree className="h-5 w-5" />
                      Tipos de Permiso
                    </CardTitle>
                    <CardDescription>
                      Configura los tipos de permisos y vacaciones disponibles para los empleados
                    </CardDescription>
                  </div>
                  <Button type="button" onClick={() => openLeaveTypeDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Tipo
                  </Button>
                </CardHeader>
                <CardContent>
                  {leaveTypes.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Palmtree className="mx-auto h-12 w-12 mb-4 opacity-30" />
                      <p className="font-medium">No hay tipos de permiso configurados</p>
                      <p className="text-sm mt-1">Agrega tipos como vacaciones, incapacidad, permisos personales, etc.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead className="text-center">Días/Año</TableHead>
                          <TableHead className="text-center">Requiere Aprobación</TableHead>
                          <TableHead className="text-center">Con Goce</TableHead>
                          <TableHead className="text-center">Color</TableHead>
                          <TableHead className="text-center">Estado</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaveTypes.map((type) => (
                          <TableRow key={type.id}>
                            <TableCell className="font-medium">{type.name}</TableCell>
                            <TableCell className="text-muted-foreground">{type.description || "-"}</TableCell>
                            <TableCell className="text-center">
                              {type.days_per_year === 0 ? (
                                <Badge variant="outline">Ilimitado</Badge>
                              ) : (
                                type.days_per_year
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {type.requires_approval ? (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700">Sí</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-50 text-gray-500">No</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {type.is_paid ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700">Con goce</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-50 text-red-700">Sin goce</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <div 
                                className="w-6 h-6 rounded-full border mx-auto"
                                style={{ backgroundColor: type.color }}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={type.is_active ? "default" : "secondary"}>
                                {type.is_active ? "Activo" : "Inactivo"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => openLeaveTypeDialog(type)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => removeLeaveType(type.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Reconocimientos */}
            <TabsContent value="recognitions">
              <div className="space-y-6">
                {/* Settings Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Configuración de Reconocimientos
                    </CardTitle>
                    <CardDescription>
                      Define los parámetros del sistema de reconocimientos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recognitionSettings && (
                      <div className="grid gap-4 md:grid-cols-3">
                        <Field>
                          <FieldLabel>Reconocimientos por Mes</FieldLabel>
                          <Input
                            type="number"
                            min={1}
                            max={10}
                            value={recognitionSettings.max_recognitions_per_month}
                            onChange={(e) => setRecognitionSettings({ ...recognitionSettings, max_recognitions_per_month: parseInt(e.target.value) || 2 })}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Cantidad de personas que cada empleado puede reconocer al mes</p>
                        </Field>
                        <Field>
                          <FieldLabel>Valor por Punto (MXN)</FieldLabel>
                          <Input
                            type="number"
                            step="0.01"
                            value={recognitionSettings.point_value}
                            onChange={(e) => setRecognitionSettings({ ...recognitionSettings, point_value: parseFloat(e.target.value) || 0 })}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Valor monetario de cada punto para canjes</p>
                        </Field>
                        <Field>
                          <FieldLabel>Puntos Mínimos para Canjear</FieldLabel>
                          <Input
                            type="number"
                            value={recognitionSettings.min_redemption_points}
                            onChange={(e) => setRecognitionSettings({ ...recognitionSettings, min_redemption_points: parseInt(e.target.value) || 0 })}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Mínimo de puntos necesarios para canjear</p>
                        </Field>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Categories Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Categorías de Reconocimiento</CardTitle>
                      <CardDescription>
                        Define las categorías y los puntos asociados a cada una
                      </CardDescription>
                    </div>
                    <Button type="button" onClick={() => openCategoryDialog()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Categoría
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {recognitionCategories.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Award className="mx-auto h-12 w-12 mb-4 opacity-30" />
                        <p className="font-medium">No hay categorías configuradas</p>
                        <p className="text-sm mt-1">Agrega categorías como Trabajo en Equipo, Innovación, Liderazgo, etc.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recognitionCategories.map((cat) => {
                          const IconComponent = getIconForCategory(cat)
                          return (
                            <div 
                              key={cat.id} 
                              className="flex items-start gap-4 p-4 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                            >
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${cat.color}20`, borderColor: cat.color, borderWidth: 2 }}
                              >
                                <IconComponent className="h-5 w-5" style={{ color: cat.color }} />
                              </div>
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="font-semibold">{cat.name}</span>
                                  <Badge variant="outline" className="text-xs font-medium">
                                    {cat.points} puntos
                                  </Badge>
                                  <Badge variant={cat.is_active ? "default" : "secondary"} className="text-xs">
                                    {cat.is_active ? "Activo" : "Inactivo"}
                                  </Badge>
                                </div>
{cat.description && (
                                <p 
                                  className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line"
                                  dangerouslySetInnerHTML={{ 
                                    __html: cat.description
                                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                      .replace(/__(.*?)__/g, '<em>$1</em>')
                                  }}
                                />
                              )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => openCategoryDialog(cat)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => removeCategory(cat.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
  
          <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/agencies">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Spinner className="mr-2 h-4 w-4" />}
            Guardar Cambios
          </Button>
        </div>
      </form>

      {/* Diálogo de alcance: a qué agencias aplicar los cambios de configuración unificada */}
      <Dialog open={scopeDialogOpen} onOpenChange={setScopeDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>¿Dónde aplicar estos cambios?</DialogTitle>
            <DialogDescription>
              Los apartados de Monedas y Bancos, Departamentos, Puestos y Cargas, Contratos y Horas,
              Permisos, Reconocimientos y Horas laborales están unificados entre agencias. Elige a qué
              agencias aplicar los cambios.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
              <input
                type="radio"
                name="apply-scope"
                className="mt-1"
                checked={applyScope === "all"}
                onChange={() => setApplyScope("all")}
              />
              <div>
                <p className="font-medium text-sm">Todas las agencias</p>
                <p className="text-muted-foreground text-xs">
                  Aplica la configuración a todas las agencias para mantenerlas unificadas (recomendado).
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
              <input
                type="radio"
                name="apply-scope"
                className="mt-1"
                checked={applyScope === "current"}
                onChange={() => setApplyScope("current")}
              />
              <div>
                <p className="font-medium text-sm">Solo esta agencia ({formData.name})</p>
                <p className="text-muted-foreground text-xs">
                  Guarda los cambios únicamente en esta agencia, sin propagarlos.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
              <input
                type="radio"
                name="apply-scope"
                className="mt-1"
                checked={applyScope === "select"}
                onChange={() => setApplyScope("select")}
              />
              <div className="flex-1">
                <p className="font-medium text-sm">Elegir agencias específicas</p>
                <p className="text-muted-foreground text-xs mb-2">
                  Selecciona a qué otras agencias aplicar además de esta.
                </p>
                {applyScope === "select" && (
                  <div className="space-y-2 mt-2">
                    {allAgencies
                      .filter((a) => a.id !== id)
                      .map((a) => (
                        <label key={a.id} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={selectedTargetAgencies.includes(a.id)}
                            onCheckedChange={(checked) => {
                              setSelectedTargetAgencies((prev) =>
                                checked ? [...prev, a.id] : prev.filter((x) => x !== a.id),
                              )
                            }}
                          />
                          <span className="text-sm">{a.name}</span>
                        </label>
                      ))}
                  </div>
                )}
              </div>
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setScopeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={performSave} disabled={saving}>
              {saving && <Spinner className="mr-2 h-4 w-4" />}
              Aplicar y guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

{/* Department Dialog */}
      <Dialog open={departmentDialogOpen} onOpenChange={setDepartmentDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDepartment?.isNew ? "Nuevo Departamento" : "Editar Departamento"}
            </DialogTitle>
            <DialogDescription>
              Define el nombre y descripción del departamento
            </DialogDescription>
          </DialogHeader>
          {editingDepartment && (
            <div className="space-y-4 py-4">
              <Field>
                <FieldLabel>Nombre *</FieldLabel>
                <Input
                  value={editingDepartment.name}
                  onChange={(e) => setEditingDepartment({ ...editingDepartment, name: e.target.value })}
                  placeholder="Ej: Creatividad, Desarrollo, Marketing"
                />
              </Field>
              <Field>
                <FieldLabel>Descripción</FieldLabel>
                <Textarea
                  value={editingDepartment.description}
                  onChange={(e) => setEditingDepartment({ ...editingDepartment, description: e.target.value })}
                  placeholder="Descripción opcional del departamento"
                  rows={3}
                />
              </Field>
              <Field className="flex items-center gap-3">
                <Switch
                  checked={editingDepartment.is_active}
                  onCheckedChange={(checked) => setEditingDepartment({ ...editingDepartment, is_active: checked })}
                />
                <FieldLabel className="!mb-0">Departamento Activo</FieldLabel>
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDepartmentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={saveDepartment}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

{/* Position Dialog */}
      <Dialog open={positionDialogOpen} onOpenChange={setPositionDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPosition?.isNew ? "Nuevo Puesto" : "Editar Puesto"}
            </DialogTitle>
            <DialogDescription>
              Define los detalles del puesto de trabajo
            </DialogDescription>
          </DialogHeader>
          {editingPosition && (
            <div className="space-y-4 py-4">
              <Field>
                <FieldLabel>Nombre del Puesto *</FieldLabel>
                <Input
                  value={editingPosition.name}
                  onChange={(e) => setEditingPosition({ ...editingPosition, name: e.target.value })}
                  placeholder="Ej: Diseñador Gráfico, Developer, Project Manager"
                />
              </Field>
              <div className="grid gap-4 grid-cols-2">
                <Field>
                  <FieldLabel>Departamento</FieldLabel>
                  <Select
                    value={editingPosition.department_id || "none"}
                    onValueChange={(v) => setEditingPosition({ ...editingPosition, department_id: v === "none" ? null : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin departamento</SelectItem>
                      {departments.filter(d => d.is_active).map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Nivel</FieldLabel>
                  <Select
                    value={editingPosition.level}
                    onValueChange={(v) => setEditingPosition({ ...editingPosition, level: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field>
                <FieldLabel>Costo por Hora (Predeterminado)</FieldLabel>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingPosition.default_hourly_cost || ""}
                  onChange={(e) => setEditingPosition({ 
                    ...editingPosition, 
                    default_hourly_cost: e.target.value ? parseFloat(e.target.value) : null 
                  })}
                  placeholder="0.00"
                />
              </Field>
              <Field>
                <FieldLabel>Descripción</FieldLabel>
                <Textarea
                  value={editingPosition.description}
                  onChange={(e) => setEditingPosition({ ...editingPosition, description: e.target.value })}
                  placeholder="Descripción opcional del puesto"
                  rows={2}
                />
              </Field>
              {/* Carga de Trabajo */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">Capacidad de Carga de Trabajo</p>
                <p className="text-xs text-muted-foreground mb-4">Define los limites de cuentas y subordinados que puede manejar este puesto</p>
                <div className="grid gap-4 grid-cols-2">
                  <Field>
                    <FieldLabel>Cuentas min.</FieldLabel>
                    <Input
                      type="number"
                      min="0"
                      value={editingPosition.min_accounts ?? 0}
                      onChange={(e) => setEditingPosition({ 
                        ...editingPosition, 
                        min_accounts: parseInt(e.target.value) || 0 
                      })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Cuentas max.</FieldLabel>
                    <Input
                      type="number"
                      min="0"
                      value={editingPosition.max_accounts ?? 10}
                      onChange={(e) => setEditingPosition({ 
                        ...editingPosition, 
                        max_accounts: parseInt(e.target.value) || 0 
                      })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Proyectos min.</FieldLabel>
                    <Input
                      type="number"
                      min="0"
                      value={editingPosition.min_projects ?? 0}
                      onChange={(e) => setEditingPosition({ 
                        ...editingPosition, 
                        min_projects: parseInt(e.target.value) || 0 
                      })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Proyectos max.</FieldLabel>
                    <Input
                      type="number"
                      min="0"
                      value={editingPosition.max_projects ?? 10}
                      onChange={(e) => setEditingPosition({ 
                        ...editingPosition, 
                        max_projects: parseInt(e.target.value) || 0 
                      })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Subordinados min.</FieldLabel>
                    <Input
                      type="number"
                      min="0"
                      value={editingPosition.min_subordinates ?? 0}
                      onChange={(e) => setEditingPosition({ 
                        ...editingPosition, 
                        min_subordinates: parseInt(e.target.value) || 0 
                      })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Subordinados max.</FieldLabel>
                    <Input
                      type="number"
                      min="0"
                      value={editingPosition.max_subordinates ?? 5}
                      onChange={(e) => setEditingPosition({ 
                        ...editingPosition, 
                        max_subordinates: parseInt(e.target.value) || 0 
                      })}
                    />
                  </Field>
                </div>
              </div>

              <div className="flex gap-6">
                <Field className="flex items-center gap-3">
                  <Switch
                    checked={editingPosition.is_billable}
                    onCheckedChange={(checked) => setEditingPosition({ ...editingPosition, is_billable: checked })}
                  />
                  <FieldLabel className="!mb-0">Facturable</FieldLabel>
                </Field>
                <Field className="flex items-center gap-3">
                  <Switch
                    checked={editingPosition.is_active}
                    onCheckedChange={(checked) => setEditingPosition({ ...editingPosition, is_active: checked })}
                  />
                  <FieldLabel className="!mb-0">Activo</FieldLabel>
                </Field>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPositionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={savePosition}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

{/* Commission Type Dialog */}
      <Dialog open={commissionTypeDialogOpen} onOpenChange={setCommissionTypeDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCommissionType?.isNew ? "Nuevo Tipo de Comisión" : "Editar Tipo de Comisión"}
            </DialogTitle>
            <DialogDescription>
              Define el nombre del tipo de cliente y el monto de comisión por cita
            </DialogDescription>
          </DialogHeader>
          {editingCommissionType && (
            <div className="space-y-4 py-4">
              <Field>
                <FieldLabel>Nombre del Tipo de Cliente *</FieldLabel>
                <Input
                  value={editingCommissionType.name}
                  onChange={(e) => setEditingCommissionType({ ...editingCommissionType, name: e.target.value })}
                  placeholder="Ej: Inmobiliaria, Desarrollador, Despacho de Arquitectos"
                />
              </Field>
              <Field>
                <FieldLabel>Monto de Comisión (MXN) *</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingCommissionType.amount || ""}
                    onChange={(e) => setEditingCommissionType({ 
                      ...editingCommissionType, 
                      amount: parseFloat(e.target.value) || 0 
                    })}
                    className="pl-8"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Monto que se pagara al vendedor por cada cita con este tipo de cliente
                </p>
              </Field>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Activo</div>
                  <div className="text-xs text-muted-foreground">
                    Los tipos inactivos no apareceran al crear comisiones
                  </div>
                </div>
                <Switch
                  checked={editingCommissionType.is_active}
                  onCheckedChange={(checked) => setEditingCommissionType({ 
                    ...editingCommissionType, 
                    is_active: checked 
                  })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCommissionTypeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={saveCommissionType}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

{/* Contract Type Dialog */}
      <Dialog open={contractTypeDialogOpen} onOpenChange={setContractTypeDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContractType?.isNew ? "Nuevo Tipo de Contrato" : "Editar Tipo de Contrato"}
            </DialogTitle>
            <DialogDescription>
              Define las características del tipo de contrato
            </DialogDescription>
          </DialogHeader>
          {editingContractType && (
            <div className="space-y-4">
              <Field>
                <FieldLabel>Nombre</FieldLabel>
                <Input
                  value={editingContractType.name}
                  onChange={(e) => setEditingContractType({ 
                    ...editingContractType, 
                    name: e.target.value 
                  })}
                  placeholder="Ej: Tiempo Completo"
                />
              </Field>
              <Field>
                <FieldLabel>Código</FieldLabel>
                <Input
                  value={editingContractType.code}
                  onChange={(e) => setEditingContractType({ 
                    ...editingContractType, 
                    code: e.target.value.toLowerCase().replace(/\s+/g, '_')
                  })}
                  placeholder="Ej: full_time"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Identificador único sin espacios (se usará internamente)
                </p>
              </Field>
              <Field>
                <FieldLabel>Descripción</FieldLabel>
                <Textarea
                  value={editingContractType.description || ""}
                  onChange={(e) => setEditingContractType({ 
                    ...editingContractType, 
                    description: e.target.value 
                  })}
                  placeholder="Descripción del tipo de contrato"
                  rows={2}
                />
              </Field>
              <Field>
                <FieldLabel>Horas por Semana</FieldLabel>
                <Input
                  type="number"
                  min="0"
                  max="168"
                  step="0.5"
                  value={editingContractType.weekly_hours}
                  onChange={(e) => setEditingContractType({ 
                    ...editingContractType, 
                    weekly_hours: parseFloat(e.target.value) || 0
                  })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Dejar en 0 para contratos variables (freelance, por proyecto)
                </p>
              </Field>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Facturable</div>
                  <div className="text-xs text-muted-foreground">
                    Las horas de este tipo de contrato se consideran para cobro a clientes
                  </div>
                </div>
                <Switch
                  checked={editingContractType.is_billable}
                  onCheckedChange={(checked) => setEditingContractType({ 
                    ...editingContractType, 
                    is_billable: checked 
                  })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Activo</div>
                  <div className="text-xs text-muted-foreground">
                    Los tipos inactivos no aparecerán al asignar personal
                  </div>
                </div>
                <Switch
                  checked={editingContractType.is_active}
                  onCheckedChange={(checked) => setEditingContractType({ 
                    ...editingContractType, 
                    is_active: checked 
                  })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setContractTypeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={saveContractType}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Type Dialog */}
      <Dialog open={leaveTypeDialogOpen} onOpenChange={setLeaveTypeDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLeaveType?.isNew ? "Nuevo Tipo de Permiso" : "Editar Tipo de Permiso"}
            </DialogTitle>
            <DialogDescription>
              Define las características del tipo de permiso
            </DialogDescription>
          </DialogHeader>
          {editingLeaveType && (
            <div className="space-y-4 py-4">
              <Field>
                <FieldLabel>Nombre *</FieldLabel>
                <Input
                  value={editingLeaveType.name}
                  onChange={(e) => setEditingLeaveType({ ...editingLeaveType, name: e.target.value })}
                  placeholder="Ej: Vacaciones, Incapacidad, Permiso Personal"
                />
              </Field>
              <Field>
                <FieldLabel>Descripción</FieldLabel>
                <Textarea
                  value={editingLeaveType.description || ""}
                  onChange={(e) => setEditingLeaveType({ ...editingLeaveType, description: e.target.value })}
                  placeholder="Descripción opcional del tipo de permiso"
                  rows={2}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel>Días por Año</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    value={editingLeaveType.days_per_year}
                    onChange={(e) => setEditingLeaveType({ ...editingLeaveType, days_per_year: parseInt(e.target.value) || 0 })}
                    placeholder="0 = ilimitado"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Usa 0 para permisos sin límite de días</p>
                </Field>
                <Field>
                  <FieldLabel>Color</FieldLabel>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingLeaveType.color}
                      onChange={(e) => setEditingLeaveType({ ...editingLeaveType, color: e.target.value })}
                      className="w-10 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={editingLeaveType.color}
                      onChange={(e) => setEditingLeaveType({ ...editingLeaveType, color: e.target.value })}
                      placeholder="#22c55e"
                      className="flex-1"
                    />
                  </div>
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Switch
                    checked={editingLeaveType.requires_approval}
                    onCheckedChange={(checked) => setEditingLeaveType({ ...editingLeaveType, requires_approval: checked })}
                  />
                  <div>
                    <FieldLabel className="!mb-0">Requiere Aprobación</FieldLabel>
                    <p className="text-xs text-muted-foreground">Debe ser aprobado por un supervisor</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Switch
                    checked={editingLeaveType.is_paid}
                    onCheckedChange={(checked) => setEditingLeaveType({ ...editingLeaveType, is_paid: checked })}
                  />
                  <div>
                    <FieldLabel className="!mb-0">Con Goce de Sueldo</FieldLabel>
                    <p className="text-xs text-muted-foreground">Se paga durante el permiso</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Switch
                    checked={editingLeaveType.is_active}
                    onCheckedChange={(checked) => setEditingLeaveType({ ...editingLeaveType, is_active: checked })}
                  />
                  <div>
                    <FieldLabel className="!mb-0">Activo</FieldLabel>
                    <p className="text-xs text-muted-foreground">Disponible para solicitar</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setLeaveTypeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={saveLeaveType}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recognition Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCategory?.isNew ? "Nueva Categoría de Reconocimiento" : "Editar Categoría"}
            </DialogTitle>
            <DialogDescription>
              Define las características de la categoría
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4 py-4">
              <Field>
                <FieldLabel>Nombre *</FieldLabel>
                <Input
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  placeholder="Ej: Trabajo en Equipo, Innovación, Liderazgo"
                />
              </Field>
              <Field>
                <FieldLabel>Descripción</FieldLabel>
                <Textarea
                  value={editingCategory.description || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  placeholder="Descripción de la categoría. Usa **texto** para negritas y saltos de línea para separar párrafos."
                  rows={4}
                  className="resize-y min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Usa **texto** para <strong>negritas</strong> y presiona Enter para saltos de línea
                </p>
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel>Puntos</FieldLabel>
                  <Input
                    type="number"
                    min={1}
                    value={editingCategory.points}
                    onChange={(e) => setEditingCategory({ ...editingCategory, points: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Puntos que otorga esta categoría</p>
                </Field>
                <Field>
                  <FieldLabel>Color</FieldLabel>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingCategory.color}
                      onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                      className="w-10 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={editingCategory.color}
                      onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </Field>
              </div>
              <Field>
                <FieldLabel>Icono</FieldLabel>
                <div className="grid grid-cols-6 gap-2 p-3 border rounded-lg bg-muted/20">
                  {[
                    { value: "award", icon: Award, label: "Premio" },
                    { value: "trophy", icon: Trophy, label: "Trofeo" },
                    { value: "medal", icon: Medal, label: "Medalla" },
                    { value: "handshake", icon: Handshake, label: "Colaboración" },
                    { value: "users", icon: Users, label: "Equipo" },
                    { value: "heart", icon: Heart, label: "Servicio" },
                    { value: "target", icon: Target, label: "Objetivo" },
                    { value: "lightbulb", icon: Lightbulb, label: "Innovación" },
                    { value: "compass", icon: Compass, label: "Liderazgo" },
                    { value: "graduationcap", icon: GraduationCap, label: "Mentoría" },
                    { value: "rocket", icon: Rocket, label: "Esfuerzo" },
                    { value: "briefcase", icon: Briefcase, label: "Profesional" },
                  ].map((iconOption) => {
                    const IconComp = iconOption.icon
                    const isSelected = editingCategory.icon === iconOption.value
                    return (
                      <button
                        key={iconOption.value}
                        type="button"
                        onClick={() => setEditingCategory({ ...editingCategory, icon: iconOption.value })}
                        className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                          isSelected 
                            ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2" 
                            : "hover:bg-muted border border-transparent hover:border-border"
                        }`}
                        title={iconOption.label}
                      >
                        <IconComp className="h-5 w-5" />
                        <span className="text-[10px]">{iconOption.label}</span>
                      </button>
                    )
                  })}
                </div>
              </Field>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Switch
                  checked={editingCategory.is_active}
                  onCheckedChange={(checked) => setEditingCategory({ ...editingCategory, is_active: checked })}
                />
                <div>
                  <FieldLabel className="!mb-0">Activo</FieldLabel>
                  <p className="text-xs text-muted-foreground">Disponible para seleccionar al reconocer</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={saveCategory}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
