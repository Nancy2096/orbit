"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { upload } from "@vercel/blob/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useAgency } from "@/contexts/agency-context"
import { 
  ArrowLeft,
  Save,
  Phone,
  Mail,
  Building2,
  Calendar,
  CalendarDays,
  DollarSign,
  Target,
  Clock,
  Plus,
  CheckCircle,
  User,
  Briefcase,
  Activity,
  ListTodo,
  FileText,
  Upload,
  Trash2,
  Package,
  ExternalLink,
  Globe,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  MapPin,
  Video,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  AlertTriangle,
  Paperclip,
  UserPlus,
  Pencil,
  X,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"

interface Stage {
  id: string
  name: string
  color: string
  sort_order: number
  is_won: boolean
  is_lost: boolean
}

interface Source {
  id: string
  name: string
}

interface Currency {
  id: string
  code: string
  name: string
}

interface ClientType {
  id: string
  name: string
  amount: number
}

interface Industry {
  id: string
  name: string
  description: string | null
}

interface SalesRep {
  id: string
  first_name: string
  last_name: string
}

interface ActivityItem {
  id: string
  activity_type: string
  subject: string
  description: string | null
  activity_date: string
  is_completed: boolean
  attachment_url: string | null
  attachment_name: string | null
  attachment_size: number | null
}

interface Task {
  id: string
  title: string
  description: string | null
  task_type: string
  due_date: string
  priority: string
  is_completed: boolean
}

interface Service {
  id: string
  name: string
  description: string | null
  base_price: number | null
}

interface ProspectService {
  id: string
  service: Service
  quantity: number
  unit_price: number | null
  total_price: number | null
  billing_type: "retainer" | "project"
}

interface Quotation {
  id: string
  file_name: string
  file_url: string
  version: number
  notes: string | null
  created_at: string
}

interface AdditionalContact {
  id: string
  contact_name: string
  contact_email: string
  contact_phone: string
  contact_position: string
  isNew?: boolean
}

interface Appointment {
  id: string
  prospect_id: string
  title: string
  description: string | null
  appointment_type: 'call' | 'video_call' | 'in_person' | 'other'
  start_datetime: string
  end_datetime: string
  location: string | null
  meeting_link: string | null
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  reminder_sent: boolean
  notes: string | null
  created_at: string
}

export default function ProspectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { selectedAgencyId, selectedAgency } = useAgency()
  const prospectId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [stages, setStages] = useState<Stage[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [clientTypes, setClientTypes] = useState<ClientType[]>([])
  const [industries, setIndustries] = useState<Industry[]>([])
  const [salesReps, setSalesReps] = useState<SalesRep[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [prospectServices, setProspectServices] = useState<ProspectService[]>([])
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [additionalContacts, setAdditionalContacts] = useState<AdditionalContact[]>([])
  const [deletedContactIds, setDeletedContactIds] = useState<string[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [calendarDate, setCalendarDate] = useState(new Date())
  
  // Metadatos del prospecto necesarios para la conversión a cliente
  const [prospectAgencyId, setProspectAgencyId] = useState<string | null>(null)
  const [convertedClientId, setConvertedClientId] = useState<string | null>(null)
  const [convertModalOpen, setConvertModalOpen] = useState(false)
  const [converting, setConverting] = useState(false)
  const [initialPaymentDone, setInitialPaymentDone] = useState<"yes" | "no" | null>(null)

  const [activityModalOpen, setActivityModalOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [uploadingQuotation, setUploadingQuotation] = useState(false)
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false)
  
  const [newAppointment, setNewAppointment] = useState({
    title: "",
    description: "",
    appointment_type: "video_call" as const,
    date: "",
    start_time: "",
    end_time: "",
    location: "",
    meeting_link: "",
  })
  
  const [formData, setFormData] = useState({
    assigned_to: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    contact_position: "",
    company_name: "",
    website: "",
    social_facebook: "",
    social_instagram: "",
    social_linkedin: "",
    social_twitter: "",
    country: "",
    state_province: "",
    client_type_id: "",
    industry_id: "",
    stage_id: "",
    source_id: "",
    estimated_value: "",
    currency_id: "",
    probability: 50,
    expected_close_date: "",
    description: "",
    notes: "",
  })
  
  const [newActivity, setNewActivity] = useState({
    activity_type: "call",
    subject: "",
    description: "",
    file: null as File | null,
  })
  const [savingActivity, setSavingActivity] = useState(false)
  
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    task_type: "call",
    due_date: "",
    due_time: "",
    priority: "medium",
  })

  const [newService, setNewService] = useState<{
    service_id: string
    quantity: number
    currency_id: string
    billing_type: "retainer" | "project"
    unit_price: number
  }>({
    service_id: "",
    quantity: 1,
    currency_id: "",
    billing_type: "project",
    unit_price: 0,
  })
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [editingPrice, setEditingPrice] = useState<number>(0)

  const supabase = createClient()

  useEffect(() => {
    if (prospectId && selectedAgencyId) {
      fetchData()
    }
  }, [prospectId, selectedAgencyId])

  const fetchData = async () => {
    setLoading(true)

    // Fetch prospect
    const { data: prospectData, error: prospectError } = await supabase
      .from("crm_prospects")
      .select("*")
      .eq("id", prospectId)
      .single()

    if (prospectError || !prospectData) {
      toast.error("No se pudo cargar el prospecto")
      router.push("/dashboard/crm/prospects")
      return
    }

    // Populate form data
    setFormData({
      assigned_to: prospectData.assigned_to || "",
      contact_name: prospectData.contact_name || "",
      contact_email: prospectData.contact_email || "",
      contact_phone: prospectData.contact_phone || "",
      contact_position: prospectData.contact_position || "",
      company_name: prospectData.company_name || "",
      website: prospectData.website || "",
      social_facebook: prospectData.social_facebook || "",
      social_instagram: prospectData.social_instagram || "",
      social_linkedin: prospectData.social_linkedin || "",
      social_twitter: prospectData.social_twitter || "",
      country: prospectData.country || "",
state_province: prospectData.state_province || "",
    client_type_id: prospectData.client_type_id || "",
    industry_id: prospectData.industry_id || "",
    stage_id: prospectData.stage_id || "",
      source_id: prospectData.source_id || "",
      estimated_value: prospectData.estimated_value?.toString() || "",
      currency_id: prospectData.currency_id || "",
      probability: prospectData.probability || 50,
      expected_close_date: prospectData.expected_close_date ? prospectData.expected_close_date.split("T")[0] : "",
      description: prospectData.description || "",
      notes: prospectData.notes || "",
    })

    const agencyId = prospectData.agency_id || selectedAgencyId
    setProspectAgencyId(agencyId)
    setConvertedClientId(prospectData.converted_to_client_id || null)

    // First get Commercial and Direction department IDs
    const { data: commercialDepts } = await supabase
      .from("departments")
      .select("id")
      .eq("agency_id", agencyId)
      .in("name", ["Comercial", "Dirección"])
    
    const deptIds = commercialDepts?.map(d => d.id) || []

    // Fetch all related data in parallel
    const [
      stagesRes,
      sourcesRes,
      currenciesRes,
      clientTypesRes,
      industriesRes,
      salesRepsRes,
      activitiesRes,
      tasksRes,
      servicesRes,
      prospectServicesRes,
      quotationsRes,
      contactsRes,
    ] = await Promise.all([
      supabase.from("crm_pipeline_stages").select("*").eq("agency_id", agencyId).eq("is_active", true).order("sort_order"),
      supabase.from("crm_lead_sources").select("id, name").eq("agency_id", agencyId).eq("is_active", true).order("name"),
      supabase.from("agency_currencies").select("currency:currencies(id, code, name), is_default").eq("agency_id", agencyId).order("is_default", { ascending: false }),
      supabase.from("client_types").select("id, name, amount").eq("agency_id", agencyId).order("name"),
      supabase.from("industries").select("id, name, description").eq("agency_id", agencyId).eq("is_active", true).order("name"),
      // Filter sales reps by Commercial and Direction departments only
      supabase.from("staff").select("id, first_name, last_name, department_id").eq("agency_id", agencyId).eq("is_active", true).in("department_id", deptIds.length > 0 ? deptIds : ["00000000-0000-0000-0000-000000000000"]).order("first_name"),
      supabase.from("crm_activities").select("*").eq("prospect_id", prospectId).order("activity_date", { ascending: false }),
      supabase.from("crm_tasks").select("*").eq("prospect_id", prospectId).order("due_date", { ascending: true }),
      supabase.from("services").select("id, name, description, base_price").eq("agency_id", agencyId).eq("is_active", true).order("name"),
      supabase.from("crm_prospect_services").select(`id, quantity, unit_price, total_price, billing_type, service:services(id, name, description, base_price)`).eq("prospect_id", prospectId),
      supabase.from("crm_prospect_quotations").select("*").eq("prospect_id", prospectId).order("created_at", { ascending: false }),
      supabase.from("crm_prospect_contacts").select("id, contact_name, contact_email, contact_phone, contact_position").eq("prospect_id", prospectId),
    ])

    if (stagesRes.data) setStages(stagesRes.data)
    if (sourcesRes.data) setSources(sourcesRes.data)
    // Extract currencies from agency_currencies relation
    if (currenciesRes.data) {
      const agencyCurrencies = currenciesRes.data
        .filter((ac: any) => ac.currency)
        .map((ac: any) => ac.currency)
      setCurrencies(agencyCurrencies)
    }
    if (clientTypesRes.data) setClientTypes(clientTypesRes.data)
    if (industriesRes.data) setIndustries(industriesRes.data)
    if (salesRepsRes.data) setSalesReps(salesRepsRes.data)
    if (activitiesRes.data) setActivities(activitiesRes.data)
    if (tasksRes.data) setTasks(tasksRes.data)
    if (servicesRes.data) setServices(servicesRes.data)
    if (prospectServicesRes.data) setProspectServices(prospectServicesRes.data as ProspectService[])
    if (quotationsRes.data) setQuotations(quotationsRes.data)
    if (contactsRes.data) setAdditionalContacts(contactsRes.data.map(c => ({ ...c, isNew: false })))

    setLoading(false)
  }

  const handleSave = async () => {
    if (!formData.contact_name.trim()) {
      toast.error("El nombre del contacto es requerido")
      return
    }

    if (!formData.stage_id) {
      toast.error("La etapa del pipeline es requerida")
      return
    }

    setSaving(true)

    const stage = stages.find(s => s.id === formData.stage_id)
    const updateData: Record<string, unknown> = {
      assigned_to: formData.assigned_to || null,
      contact_name: formData.contact_name,
      contact_email: formData.contact_email || null,
      contact_phone: formData.contact_phone || null,
      contact_position: formData.contact_position || null,
      company_name: formData.company_name || null,
      website: formData.website || null,
      social_facebook: formData.social_facebook || null,
      social_instagram: formData.social_instagram || null,
      social_linkedin: formData.social_linkedin || null,
      social_twitter: formData.social_twitter || null,
      country: formData.country || null,
      state_province: formData.state_province || null,
      client_type_id: formData.client_type_id || null,
      industry_id: formData.industry_id || null,
      stage_id: formData.stage_id,
      source_id: formData.source_id || null,
      estimated_value: prospectServices.length > 0 ? getTotalServicesValue() : null,
      currency_id: formData.currency_id || null,
      probability: formData.probability,
      expected_close_date: formData.expected_close_date || null,
      description: formData.description || null,
      notes: formData.notes || null,
      updated_at: new Date().toISOString(),
    }

    if (stage?.is_won) {
      updateData.won_date = new Date().toISOString()
    }
    if (stage?.is_lost) {
      updateData.lost_date = new Date().toISOString()
    }

    const { error } = await supabase
      .from("crm_prospects")
      .update(updateData)
      .eq("id", prospectId)

    if (error) {
      setSaving(false)
      toast.error("Error al guardar los cambios")
      console.error(error)
      return
    }

    // Delete removed contacts
    if (deletedContactIds.length > 0) {
      await supabase.from("crm_prospect_contacts").delete().in("id", deletedContactIds)
    }

    // Update existing contacts and insert new ones
    for (const contact of additionalContacts) {
      if (!contact.contact_name.trim()) continue

      if (contact.isNew) {
        await supabase.from("crm_prospect_contacts").insert({
          prospect_id: prospectId,
          contact_name: contact.contact_name,
          contact_email: contact.contact_email || null,
          contact_phone: contact.contact_phone || null,
          contact_position: contact.contact_position || null,
        })
      } else {
        await supabase
          .from("crm_prospect_contacts")
          .update({
            contact_name: contact.contact_name,
            contact_email: contact.contact_email || null,
            contact_phone: contact.contact_phone || null,
            contact_position: contact.contact_position || null,
          })
          .eq("id", contact.id)
      }
    }

    setDeletedContactIds([])
    setSaving(false)
    toast.success("Cambios guardados exitosamente")
  }

  const addActivity = async () => {
    if (!newActivity.subject) {
      toast.error("El asunto es requerido")
      return
    }

    setSavingActivity(true)

    try {
      let attachmentUrl: string | null = null
      let attachmentName: string | null = null
      let attachmentSize: number | null = null

      // Si se adjuntó un archivo, súbelo DIRECTO a Vercel Blob (store privado),
      // reutilizando el endpoint que genera el token de subida.
      if (newActivity.file) {
        const file = newActivity.file
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
        const blob = await upload(`activities/${prospectId}/${Date.now()}-${safeName}`, file, {
          access: "private",
          handleUploadUrl: "/api/crm/quotations",
        })
        attachmentUrl = blob.url
        attachmentName = file.name
        attachmentSize = file.size
      }

      const { error } = await supabase.from("crm_activities").insert({
        prospect_id: prospectId,
        activity_type: newActivity.activity_type,
        subject: newActivity.subject,
        description: newActivity.description || null,
        activity_date: new Date().toISOString(),
        is_completed: true,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
        attachment_size: attachmentSize,
      })

      if (error) {
        toast.error("Error al registrar la actividad")
        return
      }

      toast.success("Actividad registrada")
      setActivityModalOpen(false)
      setNewActivity({ activity_type: "call", subject: "", description: "", file: null })
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Error al registrar la actividad")
    } finally {
      setSavingActivity(false)
    }
  }

  // Borra solo el archivo adjunto de una actividad (conserva la actividad)
  const deleteActivityAttachment = async (activity: ActivityItem) => {
    if (!activity.attachment_url) return
    try {
      await fetch(`/api/crm/activities?blobUrl=${encodeURIComponent(activity.attachment_url)}`, {
        method: "DELETE",
      })
    } catch {
      console.warn("No se pudo borrar el archivo del blob")
    }

    const { error } = await supabase
      .from("crm_activities")
      .update({ attachment_url: null, attachment_name: null, attachment_size: null })
      .eq("id", activity.id)

    if (error) {
      toast.error("Error al eliminar el archivo adjunto")
      return
    }

    setActivities((prev) =>
      prev.map((a) =>
        a.id === activity.id
          ? { ...a, attachment_url: null, attachment_name: null, attachment_size: null }
          : a,
      ),
    )
    toast.success("Archivo adjunto eliminado")
  }

  // Borra la actividad completa (y su archivo adjunto si existe)
  const deleteActivity = async (activity: ActivityItem) => {
    if (activity.attachment_url) {
      try {
        await fetch(`/api/crm/activities?blobUrl=${encodeURIComponent(activity.attachment_url)}`, {
          method: "DELETE",
        })
      } catch {
        console.warn("No se pudo borrar el archivo del blob")
      }
    }

    const { error } = await supabase.from("crm_activities").delete().eq("id", activity.id)

    if (error) {
      toast.error("Error al eliminar la actividad")
      return
    }

    setActivities((prev) => prev.filter((a) => a.id !== activity.id))
    toast.success("Actividad eliminada")
  }

  // Convierte el prospecto (Ganado) en cliente. El registro del prospecto se conserva.
  const convertToClient = async () => {
    if (initialPaymentDone === null) {
      toast.error("Indica si el prospecto ya realizó el pago inicial")
      return
    }
    if (!formData.company_name && !formData.contact_name) {
      toast.error("El prospecto necesita al menos un nombre de empresa o contacto")
      return
    }

    setConverting(true)
    try {
      // 1. Crear el cliente con la información del prospecto.
      // Si ya pagó el inicial => cliente "active"; si no => queda como "prospect".
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          agency_id: prospectAgencyId || selectedAgencyId,
          company_name: formData.company_name || formData.contact_name,
          website: formData.website || null,
          country: formData.country || null,
          state: formData.state_province || null,
          primary_contact_name: formData.contact_name || null,
          primary_contact_email: formData.contact_email || null,
          primary_contact_phone: formData.contact_phone || null,
          primary_contact_position: formData.contact_position || null,
          industry_id: formData.industry_id || null,
          referral_source_id: formData.source_id || null,
          instagram: formData.social_instagram || null,
          facebook: formData.social_facebook || null,
          linkedin: formData.social_linkedin || null,
          notes: formData.notes || formData.description || null,
          source: "Convertido de prospecto",
          status: initialPaymentDone === "yes" ? "active" : "prospect",
        })
        .select("id")
        .single()

      if (clientError || !client) {
        console.error(clientError)
        toast.error("Error al crear el cliente")
        return
      }

      // 1.5 Crear la cuenta y los proyectos a partir de los servicios del prospecto.
      // projects.account_id es obligatorio, por lo que SIEMPRE creamos una cuenta
      // para el cliente y de ella cuelgan tanto los servicios retainer como los proyectos.
      if (prospectServices.length > 0) {
        const agencyForAccount = prospectAgencyId || selectedAgencyId
        const retainerServices = prospectServices.filter((s) => s.billing_type === "retainer")
        const projectServices = prospectServices.filter((s) => s.billing_type === "project")
        const retainerTotal = retainerServices.reduce((sum, s) => sum + (s.total_price || 0), 0)

        const { data: account, error: accountError } = await supabase
          .from("accounts")
          .insert({
            client_id: client.id,
            agency_id: agencyForAccount,
            account_name: formData.company_name || formData.contact_name,
            account_type: retainerServices.length > 0 ? "retainer" : "project",
            retainer_amount: retainerServices.length > 0 ? retainerTotal : null,
            status: "active",
            notes: "Creada automaticamente al convertir el prospecto",
          })
          .select("id")
          .single()

        if (accountError || !account) {
          console.error(accountError)
          toast.error("Cliente creado, pero no se pudo crear la cuenta automaticamente")
        } else {
          // Servicios retainer -> account_services (recurrentes en la cuenta)
          if (retainerServices.length > 0) {
            const accountServicesToInsert = retainerServices.map((s) => ({
              account_id: account.id,
              service_id: s.service.id,
              quantity: s.quantity,
              unit_price: s.unit_price || 0,
              final_price: s.total_price || 0,
              frequency: "monthly",
              is_active: true,
            }))
            const { error: accSvcError } = await supabase.from("account_services").insert(accountServicesToInsert)
            if (accSvcError) console.error("No se pudieron crear los servicios de la cuenta:", accSvcError.message)
          }

          // Servicios por proyecto -> un proyecto por servicio + su project_service
          for (const s of projectServices) {
            const { data: project, error: projectError } = await supabase
              .from("projects")
              .insert({
                account_id: account.id,
                name: s.service?.name || "Proyecto",
                project_type: "standard",
                status: "draft",
                budget_amount: s.total_price || null,
              })
              .select("id")
              .single()

            if (projectError || !project) {
              console.error("No se pudo crear el proyecto:", projectError?.message)
              continue
            }

            const { error: projSvcError } = await supabase.from("project_services").insert({
              project_id: project.id,
              service_id: s.service.id,
              quantity: s.quantity,
              unit_price: s.unit_price || 0,
              total_price: s.total_price || 0,
            })
            if (projSvcError) console.error("No se pudo agregar el servicio al proyecto:", projSvcError.message)
          }
        }
      }

      // 2. Vincular las cotizaciones del prospecto al nuevo cliente (se conservan en el prospecto).
      if (quotations.length > 0) {
        const { error: quotationError } = await supabase
          .from("crm_prospect_quotations")
          .update({ client_id: client.id })
          .eq("prospect_id", prospectId)
        if (quotationError) console.error("No se pudieron vincular las cotizaciones:", quotationError.message)
      }

      // 3. Marcar el prospecto como convertido (sin borrarlo).
      const { error: prospectError } = await supabase
        .from("crm_prospects")
        .update({ converted_to_client_id: client.id })
        .eq("id", prospectId)
      if (prospectError) console.error("No se pudo marcar el prospecto:", prospectError.message)

      setConvertedClientId(client.id)
      setConvertModalOpen(false)
      setInitialPaymentDone(null)
      toast.success("Prospecto convertido a cliente correctamente")
      router.push(`/dashboard/clients/${client.id}`)
    } catch (error) {
      console.error(error)
      toast.error("Error al convertir el prospecto")
    } finally {
      setConverting(false)
    }
  }

  const addTask = async () => {
    if (!newTask.title || !newTask.due_date || !newTask.due_time) {
      toast.error("El titulo, fecha y hora son requeridos")
      return
    }

    const dueDateTime = `${newTask.due_date}T${newTask.due_time}:00`

    const { error } = await supabase.from("crm_tasks").insert({
      prospect_id: prospectId,
      agency_id: selectedAgencyId,
      title: newTask.title,
      description: newTask.description || null,
      task_type: newTask.task_type,
      due_date: dueDateTime,
      priority: newTask.priority,
    })

    if (error) {
      toast.error("Error al crear la tarea")
      return
    }

    // Registrar actividad automáticamente al crear la tarea
    const taskTypeLabels: Record<string, string> = {
      call: "Llamada",
      email: "Email", 
      meeting: "Reunión",
      follow_up: "Seguimiento",
      presentation: "Presentación",
      negotiation: "Negociación",
      other: "Otro"
    }
    
    const priorityLabels: Record<string, string> = {
      high: "Alta",
      medium: "Media",
      low: "Baja"
    }
    
    const formattedDate = new Date(dueDateTime).toLocaleDateString('es-MX', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    
    await supabase.from("crm_activities").insert({
      prospect_id: prospectId,
      activity_type: newTask.task_type === "meeting" ? "meeting" : newTask.task_type === "email" ? "email" : "task",
      subject: `Tarea programada: ${newTask.title}`,
      description: `Se programó una tarea de tipo "${taskTypeLabels[newTask.task_type] || newTask.task_type}" para el ${formattedDate}.\n\nPrioridad: ${priorityLabels[newTask.priority] || newTask.priority}${newTask.description ? `\n\nDescripción: ${newTask.description}` : ''}`,
      activity_date: new Date().toISOString(),
      is_completed: false,
    })

    toast.success("Tarea creada y registrada en actividades")
    setTaskModalOpen(false)
    setNewTask({ title: "", description: "", task_type: "call", due_date: "", due_time: "", priority: "medium" })
    fetchData()
  }

  const toggleTaskComplete = async (taskId: string, isCompleted: boolean) => {
    const task = tasks.find(t => t.id === taskId)
    
    const { error } = await supabase
      .from("crm_tasks")
      .update({
        is_completed: !isCompleted,
        completed_at: !isCompleted ? new Date().toISOString() : null,
      })
      .eq("id", taskId)

    if (error) {
      toast.error("Error al actualizar la tarea")
      return
    }

    // Registrar actividad cuando se completa una tarea
    if (!isCompleted && task) {
      await supabase.from("crm_activities").insert({
        prospect_id: prospectId,
        activity_type: "task",
        subject: `Tarea completada: ${task.title}`,
        description: `Se completó la tarea "${task.title}"${task.description ? `\n\nDescripción: ${task.description}` : ''}`,
        activity_date: new Date().toISOString(),
        is_completed: true,
      })
    }

    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, is_completed: !isCompleted } : t
    ))
    
    if (!isCompleted) {
      toast.success("Tarea completada y registrada")
      fetchData() // Refrescar actividades
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    const task = tasks.find(t => t.id === taskId)
    
    const { error } = await supabase
      .from("crm_tasks")
      .update({ 
        status: newStatus,
        is_completed: newStatus === "completed",
        completed_at: newStatus === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", taskId)

    if (error) {
      toast.error("Error al actualizar el estado")
      return
    }

    // Registrar actividad si se completa
    if (newStatus === "completed" && task) {
      await supabase.from("crm_activities").insert({
        prospect_id: prospectId,
        activity_type: "task",
        subject: `Tarea completada: ${task.title}`,
        description: `Se completó la tarea "${task.title}"`,
        activity_date: new Date().toISOString(),
        is_completed: true,
      })
    }

    toast.success("Estado actualizado")
    fetchData()
  }

  const deleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    
    const { error } = await supabase
      .from("crm_tasks")
      .delete()
      .eq("id", taskId)

    if (error) {
      toast.error("Error al eliminar la tarea")
      return
    }

    // Registrar actividad de eliminación
    if (task) {
      await supabase.from("crm_activities").insert({
        prospect_id: prospectId,
        activity_type: "note",
        subject: `Tarea eliminada: ${task.title}`,
        description: `Se eliminó la tarea "${task.title}"`,
        activity_date: new Date().toISOString(),
        is_completed: true,
      })
    }

    toast.success("Tarea eliminada")
    fetchData()
  }

  const getStatusSemaphore = (task: Task) => {
    const now = new Date()
    const dueDate = new Date(task.due_date)
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (task.status === "completed" || task.is_completed) {
      return { color: "bg-blue-500", label: "Completada", textColor: "text-blue-600" }
    }
    if (task.status === "cancelled") {
      return { color: "bg-gray-400", label: "Cancelada", textColor: "text-gray-500" }
    }
    if (dueDate < now) {
      return { color: "bg-red-500", label: "Vencida", textColor: "text-red-600" }
    }
    if (hoursUntilDue <= 24) {
      return { color: "bg-amber-500", label: "Urgente", textColor: "text-amber-600" }
    }
    if (task.status === "in_progress") {
      return { color: "bg-yellow-500", label: "En Progreso", textColor: "text-yellow-600" }
    }
    return { color: "bg-green-500", label: "Pendiente", textColor: "text-green-600" }
  }

  const addService = async () => {
    if (!newService.service_id) {
      toast.error("Selecciona un servicio")
      return
    }

    const unitPrice = newService.unit_price || 0
    const totalPrice = unitPrice * newService.quantity

    const { error } = await supabase.from("crm_prospect_services").insert({
      prospect_id: prospectId,
      service_id: newService.service_id,
      quantity: newService.quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      billing_type: newService.billing_type,
    })

    if (error) {
      if (error.code === '23505') {
        toast.error("Este servicio ya esta agregado")
      } else {
        toast.error("Error al agregar servicio")
      }
      return
    }

    toast.success("Servicio agregado")
    setServiceModalOpen(false)
    setNewService({ service_id: "", quantity: 1, currency_id: "", billing_type: "project", unit_price: 0 })
    fetchData()
  }

  const removeService = async (serviceId: string) => {
    const { error } = await supabase
      .from("crm_prospect_services")
      .delete()
      .eq("id", serviceId)

    if (error) {
      toast.error("Error al eliminar servicio")
      return
    }

    setProspectServices(prev => prev.filter(s => s.id !== serviceId))
    toast.success("Servicio eliminado")
  }

  const updateServicePrice = async (ps: ProspectService, newUnitPrice: number) => {
    const unitPrice = newUnitPrice || 0
    const totalPrice = unitPrice * ps.quantity

    const { error } = await supabase
      .from("crm_prospect_services")
      .update({ unit_price: unitPrice, total_price: totalPrice })
      .eq("id", ps.id)

    if (error) {
      toast.error("Error al actualizar el precio")
      return
    }

    setProspectServices(prev =>
      prev.map(s => (s.id === ps.id ? { ...s, unit_price: unitPrice, total_price: totalPrice } : s))
    )
    setEditingServiceId(null)
    toast.success("Precio actualizado")
  }

  const uploadQuotation = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg", ".webp"]
    const hasAllowedExtension = allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    if (!hasAllowedExtension) {
      toast.error("Formato no permitido. Sube PDF, Word, Excel o imagen (JPG, PNG).")
      return
    }

    setUploadingQuotation(true)

    try {
      // Sube el archivo DIRECTO a Vercel Blob (store privado), sin pasar por el
      // servidor, así no aplica el límite de ~4.5MB de los Route Handlers ni
      // ninguna restricción de peso.
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
      const blob = await upload(`quotations/${prospectId}/${Date.now()}-${safeName}`, file, {
        access: "private",
        handleUploadUrl: "/api/crm/quotations",
      })

      // Guarda el registro de la cotización en la base de datos (con versión).
      const response = await fetch("/api/crm/quotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId,
          url: blob.url,
          filename: file.name,
          fileSize: file.size,
        }),
      })

      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error || "Error al subir la cotización")
      }

      toast.success("Cotización subida exitosamente")
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Error al subir la cotización")
    } finally {
      setUploadingQuotation(false)
      event.target.value = ""
    }
  }

  const deleteQuotation = async (quotationId: string) => {
    const response = await fetch(`/api/crm/quotations?id=${quotationId}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      toast.error("Error al eliminar cotización")
      return
    }

    setQuotations(prev => prev.filter(q => q.id !== quotationId))
    toast.success("Cotización eliminada")
  }

  const addContact = () => {
    setAdditionalContacts([
      ...additionalContacts,
      { id: crypto.randomUUID(), contact_name: "", contact_email: "", contact_phone: "", contact_position: "", isNew: true }
    ])
  }

  const removeContact = (id: string, isNew?: boolean) => {
    if (!isNew) {
      setDeletedContactIds([...deletedContactIds, id])
    }
    setAdditionalContacts(additionalContacts.filter(c => c.id !== id))
  }

  const updateContact = (id: string, field: keyof AdditionalContact, value: string) => {
    setAdditionalContacts(additionalContacts.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ))
  }

  const getTotalServicesValue = () => {
    return prospectServices.reduce((sum, ps) => sum + (ps.total_price || 0), 0)
  }

  const selectedCurrencyCode = currencies.find(c => c.id === formData.currency_id)?.code || "MXN"

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: selectedCurrencyCode,
    }).format(amount)
  }

  // Appointment functions
  const addAppointment = async () => {
    if (!newAppointment.title || !newAppointment.date || !newAppointment.start_time) {
      toast.error("Por favor completa los campos requeridos")
      return
    }

    const startDatetime = `${newAppointment.date}T${newAppointment.start_time}:00`
    const endDatetime = newAppointment.end_time 
      ? `${newAppointment.date}T${newAppointment.end_time}:00`
      : `${newAppointment.date}T${newAppointment.start_time.split(':').map((v, i) => i === 0 ? String(Number(v) + 1).padStart(2, '0') : v).join(':')}:00`

    const { data, error } = await supabase
      .from("crm_appointments")
      .insert({
        prospect_id: prospectId,
        agency_id: selectedAgencyId,
        title: newAppointment.title,
        description: newAppointment.description || null,
        appointment_type: newAppointment.appointment_type,
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        location: newAppointment.location || null,
        meeting_link: newAppointment.meeting_link || null,
        status: 'scheduled',
      })
      .select()
      .single()

    if (error) {
      // If table doesn't exist, simulate locally
      const newApt: Appointment = {
        id: crypto.randomUUID(),
        prospect_id: prospectId,
        title: newAppointment.title,
        description: newAppointment.description || null,
        appointment_type: newAppointment.appointment_type,
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        location: newAppointment.location || null,
        meeting_link: newAppointment.meeting_link || null,
        status: 'scheduled',
        reminder_sent: false,
        notes: null,
        created_at: new Date().toISOString(),
      }
      setAppointments([...appointments, newApt])
      toast.success("Cita agendada (modo local)")
    } else {
      setAppointments([...appointments, data])
      toast.success("Cita agendada exitosamente")
    }

    setAppointmentModalOpen(false)
    setNewAppointment({
      title: "",
      description: "",
      appointment_type: "video_call",
      date: "",
      start_time: "",
      end_time: "",
      location: "",
      meeting_link: "",
    })
  }

  const updateAppointmentStatus = async (appointmentId: string, status: Appointment['status']) => {
    const { error } = await supabase
      .from("crm_appointments")
      .update({ status })
      .eq("id", appointmentId)

    if (error) {
      // Update locally if table doesn't exist
      setAppointments(appointments.map(a => 
        a.id === appointmentId ? { ...a, status } : a
      ))
      toast.success(`Cita ${status === 'completed' ? 'completada' : 'cancelada'} (modo local)`)
    } else {
      setAppointments(appointments.map(a => 
        a.id === appointmentId ? { ...a, status } : a
      ))
      toast.success(`Cita ${status === 'completed' ? 'completada' : 'cancelada'}`)
    }
  }


  const getStageColor = (color: string | null): string => {
    if (color && color.startsWith("#")) return color
    const colors: Record<string, string> = {
      blue: "#3b82f6", cyan: "#06b6d4", yellow: "#eab308",
      orange: "#f97316", purple: "#a855f7", green: "#22c55e", red: "#ef4444",
    }
    return colors[color || ""] || "#6b7280"
  }

  const getActivityIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      call: <Phone className="h-4 w-4" />,
      email: <Mail className="h-4 w-4" />,
      meeting: <User className="h-4 w-4" />,
      note: <Activity className="h-4 w-4" />,
    }
    return icons[type] || <Clock className="h-4 w-4" />
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      high: "destructive", medium: "default", low: "secondary",
    }
    const labels: Record<string, string> = { high: "Alta", medium: "Media", low: "Baja" }
    return <Badge variant={variants[priority]}>{labels[priority] || priority}</Badge>
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  // ¿El prospecto está en una etapa "Ganado"? Habilita la conversión a cliente.
  const isWonStage = stages.find((s) => s.id === formData.stage_id)?.is_won ?? false

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/crm/prospects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl">
                {formData.contact_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{formData.contact_name || "Sin nombre"}</h1>
                {formData.stage_id && (() => {
                  const currentStage = stages.find(s => s.id === formData.stage_id)
                  if (currentStage) {
                    const stageColor = getStageColor(currentStage.color)
                    return (
                      <Badge 
                        className="text-sm px-3 py-1 font-medium"
                        style={{ 
                          backgroundColor: stageColor,
                          color: 'white',
                          borderColor: stageColor 
                        }}
                      >
                        {currentStage.name}
                      </Badge>
                    )
                  }
                  return null
                })()}
              </div>
              {formData.company_name && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  {formData.company_name}
                </div>
              )}
              {formData.contact_position && (
                <div className="text-sm text-muted-foreground">{formData.contact_position}</div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {convertedClientId ? (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/clients/${convertedClientId}`}>
                <User className="mr-2 h-4 w-4" />
                Ver Cliente
              </Link>
            </Button>
          ) : (
            isWonStage && (
              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  setInitialPaymentDone(null)
                  setConvertModalOpen(true)
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Pasar a Clientes
              </Button>
            )
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
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
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="info">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="info">
                <User className="mr-2 h-4 w-4" />
                Informacion
              </TabsTrigger>
              <TabsTrigger value="tasks">
                <ListTodo className="mr-2 h-4 w-4" />
                Tareas
              </TabsTrigger>
              <TabsTrigger value="activities">
                <Activity className="mr-2 h-4 w-4" />
                Actividades
              </TabsTrigger>
              <TabsTrigger value="services">
                <Package className="mr-2 h-4 w-4" />
                Servicios
              </TabsTrigger>
              <TabsTrigger value="quotations">
                <FileText className="mr-2 h-4 w-4" />
                Cotizaciones
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <CalendarDays className="mr-2 h-4 w-4" />
                Calendario
              </TabsTrigger>
              <TabsTrigger value="appointments">
                <Video className="mr-2 h-4 w-4" />
                Citas
              </TabsTrigger>
            </TabsList>

            {/* Tab: Informacion */}
            <TabsContent value="info" className="mt-4 space-y-6">
              {/* Asesor Comercial */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Asesor Comercial
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={formData.assigned_to}
                    onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
                  >
                    <SelectTrigger className="w-full md:w-[300px]">
                      <SelectValue placeholder="Selecciona un asesor" />
                    </SelectTrigger>
                    <SelectContent>
                      {salesReps.map((rep) => (
                        <SelectItem key={rep.id} value={rep.id}>
                          {rep.first_name} {rep.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Contacto Principal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Contacto Principal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nombre del Contacto *</Label>
                      <Input
                        placeholder="Juan Perez"
                        value={formData.contact_name}
                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cargo / Puesto</Label>
                      <Input
                        placeholder="Director de Marketing"
                        value={formData.contact_position}
                        onChange={(e) => setFormData({ ...formData, contact_position: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
<div className="space-y-2">
                    <Label>Tipo de Cliente (Industria)</Label>
                    <Select
                      value={formData.industry_id}
                      onValueChange={(value) => setFormData({ ...formData, industry_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una industria" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry.id} value={industry.id}>{industry.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1"><Mail className="h-4 w-4" /> Email</Label>
                      <Input
                        type="email"
                        placeholder="juan@empresa.com"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1"><Phone className="h-4 w-4" /> Telefono</Label>
                      <Input
                        placeholder="+52 55 1234 5678"
                        value={formData.contact_phone}
                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Contactos Adicionales */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium">Contactos Adicionales</h4>
                        <p className="text-sm text-muted-foreground">Otros contactos de la empresa</p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={addContact}>
                        <Plus className="h-4 w-4 mr-1" /> Agregar
                      </Button>
                    </div>
                    {additionalContacts.length > 0 && (
                      <div className="space-y-4">
                        {additionalContacts.map((contact, index) => (
                          <div key={contact.id} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Contacto {index + 1}</span>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeContact(contact.id, contact.isNew)} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <Input placeholder="Nombre" value={contact.contact_name} onChange={(e) => updateContact(contact.id, "contact_name", e.target.value)} />
                              <Input placeholder="Cargo" value={contact.contact_position} onChange={(e) => updateContact(contact.id, "contact_position", e.target.value)} />
                              <Input type="email" placeholder="Email" value={contact.contact_email} onChange={(e) => updateContact(contact.id, "contact_email", e.target.value)} />
                              <Input placeholder="Telefono" value={contact.contact_phone} onChange={(e) => updateContact(contact.id, "contact_phone", e.target.value)} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Empresa */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Informacion de la Empresa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nombre de la Empresa</Label>
                      <Input
                        placeholder="Empresa S.A. de C.V."
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1"><Globe className="h-4 w-4" /> Sitio Web</Label>
                      <Input
                        placeholder="https://www.empresa.com"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Pais</Label>
                      <Input
                        placeholder="Mexico"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Estado / Provincia</Label>
                      <Input
                        placeholder="CDMX"
                        value={formData.state_province}
                        onChange={(e) => setFormData({ ...formData, state_province: e.target.value })}
                      />
                    </div>
                  </div>
                  {/* Redes Sociales */}
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-4">Redes Sociales</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1"><Facebook className="h-4 w-4" /> Facebook</Label>
                        <Input placeholder="https://facebook.com/empresa" value={formData.social_facebook} onChange={(e) => setFormData({ ...formData, social_facebook: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1"><Instagram className="h-4 w-4" /> Instagram</Label>
                        <Input placeholder="https://instagram.com/empresa" value={formData.social_instagram} onChange={(e) => setFormData({ ...formData, social_instagram: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1"><Linkedin className="h-4 w-4" /> LinkedIn</Label>
                        <Input placeholder="https://linkedin.com/company/empresa" value={formData.social_linkedin} onChange={(e) => setFormData({ ...formData, social_linkedin: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1"><Twitter className="h-4 w-4" /> Twitter / X</Label>
                        <Input placeholder="https://twitter.com/empresa" value={formData.social_twitter} onChange={(e) => setFormData({ ...formData, social_twitter: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detalles del Negocio */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Detalles del Negocio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Valor Estimado</Label>
                      {prospectServices.length > 0 ? (
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-lg font-semibold">{formatCurrency(getTotalServicesValue())}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm text-yellow-700">Agrega servicios de interes para calcular el valor</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">Calculado automaticamente desde Servicios de Interes</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Moneda</Label>
                      {prospectServices.length > 0 ? (
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                          <span className="text-lg font-semibold">{selectedCurrencyCode}</span>
                          <span className="text-sm text-muted-foreground">
                            {currencies.find(c => c.id === formData.currency_id)?.name || ""}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm text-yellow-700">Agrega servicios para definir moneda</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">Definido en Servicios de Interes</p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Fecha Estimada de Cierre</Label>
                      <Input
                        type="date"
                        value={formData.expected_close_date}
                        onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-4">
                      <Label>Probabilidad de Cierre: {formData.probability}%</Label>
                      <Slider
                        value={[formData.probability]}
                        onValueChange={(value) => setFormData({ ...formData, probability: value[0] })}
                        max={100}
                        step={5}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Descripcion del Proyecto</Label>
                    <Textarea
                      placeholder="Describe el proyecto o necesidad del prospecto..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notas Adicionales</Label>
                    <Textarea
                      placeholder="Cualquier informacion adicional relevante..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                    />
</div>
              </CardContent>
              </Card>

              {/* Botón Guardar */}
              <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={saving} size="lg">
                  {saving ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar Información
                    </>
                  )}
                </Button>
              </div>
              </TabsContent>
              
              {/* Tab: Tareas */}
            <TabsContent value="tasks" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Tareas Pendientes</CardTitle>
                  <Button size="sm" onClick={() => setTaskModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Nueva Tarea
                  </Button>
                </CardHeader>
                <CardContent>
                  {tasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ListTodo className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p>No hay tareas pendientes</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tasks.map((task) => {
                        const semaphore = getStatusSemaphore(task)
                        return (
                          <div key={task.id} className={`flex items-start gap-3 p-4 rounded-lg border ${task.is_completed || task.status === "completed" ? "bg-muted/50 opacity-70" : ""}`}>
                            {/* Semáforo de estado */}
                            <div className="flex flex-col items-center gap-1 pt-1">
                              <div className={`w-4 h-4 rounded-full ${semaphore.color} shadow-sm`} title={semaphore.label} />
                              <span className={`text-[10px] font-medium ${semaphore.textColor}`}>{semaphore.label}</span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-medium ${task.is_completed || task.status === "completed" ? "line-through" : ""}`}>{task.title}</span>
                                {getPriorityBadge(task.priority)}
                              </div>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(task.due_date).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              
                              {/* Acciones de estado */}
                              <div className="flex items-center gap-2 mt-3 flex-wrap">
                                <Select
                                  value={task.status || "pending"}
                                  onValueChange={(value) => updateTaskStatus(task.id, value)}
                                >
                                  <SelectTrigger className="h-8 w-[140px] text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pendiente</SelectItem>
                                    <SelectItem value="in_progress">En Progreso</SelectItem>
                                    <SelectItem value="completed">Completada</SelectItem>
                                    <SelectItem value="cancelled">Cancelada</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    if (confirm("¿Estás seguro de eliminar esta tarea?")) {
                                      deleteTask(task.id)
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Actividades */}
            <TabsContent value="activities" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Historial de Actividades</CardTitle>
                  <Button size="sm" onClick={() => setActivityModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Registrar
                  </Button>
                </CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p>No hay actividades registradas</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex gap-4 p-3 rounded-lg border">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                            {getActivityIcon(activity.activity_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{activity.subject}</div>
                            {activity.description && (
                              <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                            )}
                            {activity.attachment_url && activity.attachment_name && (
                              <a
                                href={`/api/file?pathname=${encodeURIComponent(
                                  new URL(activity.attachment_url).pathname.replace(/^\//, "")
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-2 rounded-md border bg-muted/40 px-2 py-1 text-xs hover:bg-muted transition-colors max-w-full"
                              >
                                <Paperclip className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{activity.attachment_name}</span>
                              </a>
                            )}
                            <div className="text-xs text-muted-foreground mt-2">
                              {new Date(activity.activity_date).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                          <div className="flex items-start gap-1 shrink-0">
                            {activity.attachment_url && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteActivityAttachment(activity)}
                                title="Eliminar solo el archivo adjunto"
                              >
                                <Paperclip className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteActivity(activity)}
                              title="Eliminar actividad completa"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Servicios */}
            <TabsContent value="services" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Servicios de Interes</CardTitle>
                    {prospectServices.length > 0 && (
                      <CardDescription>
                        Total: {formatCurrency(getTotalServicesValue())} {selectedCurrencyCode}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={formData.currency_id}
                      onValueChange={(value) => setFormData({ ...formData, currency_id: value })}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => setServiceModalOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" /> Agregar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {prospectServices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p>No hay servicios agregados</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {prospectServices.map((ps) => (
                        <div key={ps.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{ps.service?.name}</span>
                              <Badge variant={ps.billing_type === "retainer" ? "default" : "secondary"}>
                                {ps.billing_type === "retainer" ? "Retainer" : "Por proyecto"}
                              </Badge>
                            </div>
                            {editingServiceId === ps.id ? (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-muted-foreground">{ps.quantity} x</span>
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={editingPrice}
                                  onChange={(e) => setEditingPrice(parseFloat(e.target.value) || 0)}
                                  className="h-8 w-32"
                                />
                                <span className="text-sm text-muted-foreground">{selectedCurrencyCode}</span>
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                {ps.quantity} x {formatCurrency(ps.unit_price || 0)} {selectedCurrencyCode}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {editingServiceId === ps.id ? (
                              <>
                                <span className="font-semibold">
                                  {formatCurrency((editingPrice || 0) * ps.quantity)} {selectedCurrencyCode}
                                </span>
                                <Button variant="ghost" size="icon" onClick={() => updateServicePrice(ps, editingPrice)} title="Guardar precio">
                                  <Save className="h-4 w-4 text-primary" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setEditingServiceId(null)} title="Cancelar">
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <span className="font-semibold">{formatCurrency(ps.total_price || 0)} {selectedCurrencyCode}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => { setEditingServiceId(ps.id); setEditingPrice(ps.unit_price || 0) }}
                                  title="Editar precio"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => removeService(ps.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Cotizaciones */}
            <TabsContent value="quotations" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Cotizaciones</CardTitle>
                  <div>
                    <input
                      type="file"
                      id="quotation-upload"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                      className="hidden"
                      onChange={uploadQuotation}
                      disabled={uploadingQuotation}
                    />
                    <Button size="sm" disabled={uploadingQuotation} onClick={() => document.getElementById("quotation-upload")?.click()}>
                      {uploadingQuotation ? (
                        <><Spinner className="mr-2 h-4 w-4" /> Subiendo...</>
                      ) : (
                        <><Upload className="mr-2 h-4 w-4" /> Subir documento</>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {quotations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p>No hay cotizaciones</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {quotations.map((q) => (
                        <div key={q.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-red-500" />
                            <div>
                              <div className="font-medium">{q.file_name}</div>
                              <div className="text-xs text-muted-foreground">
                                Versión {q.version} ·{" "}
                                {new Date(q.created_at).toLocaleString("es-MX", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" asChild title="Ver / descargar">
                              <a
                                href={`/api/file?pathname=${encodeURIComponent(
                                  new URL(q.file_url).pathname.replace(/^\//, "")
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteQuotation(q.id)}
                              title="Eliminar archivo"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Calendario */}
            <TabsContent value="calendar" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Calendario del Prospecto</CardTitle>
                    <CardDescription>Tareas y actividades programadas para este lead</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => setCalendarDate(new Date())}>
                      Hoy
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold capitalize">
                      {calendarDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </h3>
                  </div>
                  
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                      <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const year = calendarDate.getFullYear()
                      const month = calendarDate.getMonth()
                      const firstDay = new Date(year, month, 1)
                      const lastDay = new Date(year, month + 1, 0)
                      const startPadding = (firstDay.getDay() + 6) % 7
                      const days = []
                      
                      // Padding days
                      for (let i = 0; i < startPadding; i++) {
                        days.push(<div key={`pad-${i}`} className="min-h-[80px] p-1 bg-muted/20 rounded" />)
                      }
                      
                      // Actual days
                      for (let day = 1; day <= lastDay.getDate(); day++) {
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                        const isToday = new Date().toISOString().split('T')[0] === dateStr
                        
                        // Filter tasks for this day
                        const dayTasks = tasks.filter(t => t.due_date?.startsWith(dateStr))
                        const dayAppointments = appointments.filter(a => a.start_datetime?.startsWith(dateStr))
                        
                        days.push(
                          <div
                            key={day}
                            className={`min-h-[80px] p-1 border rounded transition-colors ${
                              isToday ? 'ring-2 ring-primary bg-primary/5' : 'bg-background hover:bg-muted/50'
                            }`}
                          >
                            <div className={`text-xs font-medium mb-1 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                              {day}
                            </div>
                            <div className="space-y-1">
                              {dayTasks.slice(0, 2).map(task => (
                                <div
                                  key={task.id}
                                  className={`text-xs p-1 rounded truncate ${
                                    task.is_completed 
                                      ? 'bg-green-100 text-green-700 line-through' 
                                      : task.priority === 'high' 
                                        ? 'bg-red-100 text-red-700'
                                        : task.priority === 'medium'
                                          ? 'bg-yellow-100 text-yellow-700'
                                          : 'bg-blue-100 text-blue-700'
                                  }`}
                                  title={task.title}
                                >
                                  <ListTodo className="h-3 w-3 inline mr-1" />
                                  {task.title.substring(0, 10)}...
                                </div>
                              ))}
                              {dayAppointments.slice(0, 2).map(apt => (
                                <div
                                  key={apt.id}
                                  className="text-xs p-1 rounded truncate bg-purple-100 text-purple-700"
                                  title={apt.title}
                                >
                                  <Video className="h-3 w-3 inline mr-1" />
                                  {apt.title.substring(0, 10)}...
                                </div>
                              ))}
                              {(dayTasks.length + dayAppointments.length) > 2 && (
                                <div className="text-xs text-muted-foreground text-center">
                                  +{dayTasks.length + dayAppointments.length - 2} más
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      }
                      
                      return days
                    })()}
                  </div>
                  
                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
                      <span className="text-xs text-muted-foreground">Tarea Alta</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300" />
                      <span className="text-xs text-muted-foreground">Tarea Media</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
                      <span className="text-xs text-muted-foreground">Tarea Baja</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
                      <span className="text-xs text-muted-foreground">Completada</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-purple-100 border border-purple-300" />
                      <span className="text-xs text-muted-foreground">Cita</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Citas */}
            <TabsContent value="appointments" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Citas y Videollamadas</CardTitle>
                    <CardDescription>Agenda reuniones con el prospecto</CardDescription>
                  </div>
                  <Button onClick={() => setAppointmentModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Cita
                  </Button>
                </CardHeader>
                <CardContent>
                  {appointments.length === 0 ? (
                    <div className="text-center py-8">
                      <Video className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground">No hay citas programadas</p>
                      <Button variant="outline" className="mt-4" onClick={() => setAppointmentModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Agendar Primera Cita
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {appointments.map(apt => {
                        const startDate = new Date(apt.start_datetime)
                        const endDate = new Date(apt.end_datetime)
                        const isPast = startDate < new Date()
                        
                        return (
                          <div
                            key={apt.id}
                            className={`p-4 border rounded-lg ${
                              apt.status === 'cancelled' 
                                ? 'bg-muted/50 opacity-60' 
                                : apt.status === 'completed'
                                  ? 'bg-green-50 border-green-200'
                                  : isPast
                                    ? 'bg-yellow-50 border-yellow-200'
                                    : 'bg-background'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {apt.appointment_type === 'video_call' && <Video className="h-4 w-4 text-purple-600" />}
                                  {apt.appointment_type === 'call' && <Phone className="h-4 w-4 text-blue-600" />}
                                  {apt.appointment_type === 'in_person' && <MapPin className="h-4 w-4 text-green-600" />}
                                  <span className="font-medium">{apt.title}</span>
                                  <Badge variant={
                                    apt.status === 'completed' ? 'default' :
                                    apt.status === 'cancelled' ? 'destructive' :
                                    apt.status === 'no_show' ? 'secondary' : 'outline'
                                  }>
                                    {apt.status === 'scheduled' && 'Programada'}
                                    {apt.status === 'completed' && 'Completada'}
                                    {apt.status === 'cancelled' && 'Cancelada'}
                                    {apt.status === 'no_show' && 'No asistió'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {apt.description}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {startDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {apt.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {apt.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {apt.meeting_link && apt.status === 'scheduled' && (
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={apt.meeting_link} target="_blank" rel="noopener noreferrer">
                                      <LinkIcon className="h-4 w-4 mr-1" />
                                      Unirse
                                    </a>
                                  </Button>
                                )}
                                {apt.status === 'scheduled' && (
                                  <>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  
                  {/* Google Calendar Integration */}
                  <Separator className="my-6" />
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <svg className="h-6 w-6" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">Google Calendar</p>
                        <p className="text-sm text-muted-foreground">Sincroniza tus citas con Google Calendar</p>
                      </div>
                    </div>
                    <Button variant="outline" asChild>
                      <Link href="/dashboard/crm/integrations?tab=google_suite">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Conectar
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

{/* Sidebar - Right Column */}
          <div className="space-y-6">
          {/* Etapa del Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Etapa del Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {stages.map((stage, index) => {
                  const isActive = formData.stage_id === stage.id
                  const isPast = stages.findIndex(s => s.id === formData.stage_id) > index
                  const stageColor = getStageColor(stage.color)
                  
                  return (
                    <button
                      key={stage.id}
                      onClick={() => setFormData({ ...formData, stage_id: stage.id })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium w-full text-left ${
                        isActive
                          ? "text-white shadow-md"
                          : isPast
                          ? "bg-muted border-muted-foreground/20 opacity-60"
                          : "bg-background hover:opacity-80"
                      }`}
                      style={{
                        backgroundColor: isActive ? stageColor : undefined,
                        borderColor: stageColor,
                        color: isActive ? "white" : stageColor,
                      }}
                    >
                      {isActive && <CheckCircle className="h-4 w-4" />}
                      <span>{stage.name}</span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
          
          {/* Fuente del Lead */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Fuente del Lead</CardTitle>
            </CardHeader>
            <CardContent>
              {sources.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">No hay fuentes configuradas.</p>
              ) : (
                <Select
                  value={formData.source_id}
                  onValueChange={(value) => setFormData({ ...formData, source_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar fuente" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>{source.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
</CardContent>
          </Card>

{/* Resumen */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Valor Estimado</span>
                <span className="font-semibold">
                  {prospectServices.length > 0 ? formatCurrency(getTotalServicesValue()) : (
                    <span className="text-yellow-600 text-xs">Sin servicios</span>
                  )}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Probabilidad</span>
                <Badge variant="secondary">{formData.probability}%</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cierre Estimado</span>
                <span className="text-sm">
                  {formData.expected_close_date 
                    ? new Date(formData.expected_close_date).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })
                    : "-"
                  }
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Contacto Rapido */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Contacto Rapido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {formData.contact_email && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={`mailto:${formData.contact_email}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    {formData.contact_email}
                  </a>
                </Button>
              )}
              {formData.contact_phone && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={`tel:${formData.contact_phone}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    {formData.contact_phone}
                  </a>
                </Button>
              )}
              {formData.website && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={formData.website} target="_blank" rel="noopener noreferrer">
                    <Globe className="mr-2 h-4 w-4" />
                    Sitio Web
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal: Nueva Actividad */}
      <Dialog open={activityModalOpen} onOpenChange={setActivityModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Actividad</DialogTitle>
            <DialogDescription>Registra una llamada, email, reunion o nota</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Actividad</Label>
              <Select value={newActivity.activity_type} onValueChange={(value) => setNewActivity({ ...newActivity, activity_type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Llamada</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Reunion</SelectItem>
                  <SelectItem value="note">Nota</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Asunto *</Label>
              <Input value={newActivity.subject} onChange={(e) => setNewActivity({ ...newActivity, subject: e.target.value })} placeholder="Resumen de la actividad" />
            </div>
            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Textarea value={newActivity.description} onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Archivo adjunto (opcional)</Label>
              {newActivity.file ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm">{newActivity.file.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => setNewActivity({ ...newActivity, file: null })}
                    title="Quitar archivo"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ) : (
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => setNewActivity({ ...newActivity, file: e.target.files?.[0] ?? null })}
                />
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setActivityModalOpen(false)} disabled={savingActivity}>Cancelar</Button>
            <Button onClick={addActivity} disabled={savingActivity}>
              {savingActivity ? (<><Spinner className="mr-2 h-4 w-4" /> Guardando...</>) : "Registrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Nueva Tarea */}
      <Dialog open={taskModalOpen} onOpenChange={setTaskModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Tarea</DialogTitle>
            <DialogDescription>Programa una tarea de seguimiento</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titulo *</Label>
              <Input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="Llamar para dar seguimiento" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={newTask.task_type} onValueChange={(value) => setNewTask({ ...newTask, task_type: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Llamada</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Reunion</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Input type="date" value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Hora *</Label>
                <Input type="time" value={newTask.due_time} onChange={(e) => setNewTask({ ...newTask, due_time: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setTaskModalOpen(false)}>Cancelar</Button>
            <Button onClick={addTask}>Crear Tarea</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Nueva Cita */}
      <Dialog open={appointmentModalOpen} onOpenChange={setAppointmentModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Agendar Cita</DialogTitle>
            <DialogDescription>Programa una reunion o videollamada con el prospecto</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titulo *</Label>
              <Input 
                value={newAppointment.title} 
                onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })} 
                placeholder="Reunion de presentacion de propuesta" 
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de cita</Label>
              <Select 
                value={newAppointment.appointment_type} 
                onValueChange={(value: 'call' | 'video_call' | 'in_person' | 'other') => 
                  setNewAppointment({ ...newAppointment, appointment_type: value })
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="video_call">
                    <span className="flex items-center gap-2"><Video className="h-4 w-4" /> Videollamada</span>
                  </SelectItem>
                  <SelectItem value="call">
                    <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> Llamada telefonica</span>
                  </SelectItem>
                  <SelectItem value="in_person">
                    <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Presencial</span>
                  </SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Input 
                  type="date" 
                  value={newAppointment.date} 
                  onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Hora inicio *</Label>
                <Input 
                  type="time" 
                  value={newAppointment.start_time} 
                  onChange={(e) => setNewAppointment({ ...newAppointment, start_time: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Hora fin</Label>
                <Input 
                  type="time" 
                  value={newAppointment.end_time} 
                  onChange={(e) => setNewAppointment({ ...newAppointment, end_time: e.target.value })} 
                />
              </div>
            </div>
            {newAppointment.appointment_type === 'video_call' && (
              <div className="space-y-2">
                <Label>Link de la reunion</Label>
                <Input 
                  value={newAppointment.meeting_link} 
                  onChange={(e) => setNewAppointment({ ...newAppointment, meeting_link: e.target.value })} 
                  placeholder="https://meet.google.com/xxx-xxxx-xxx" 
                />
                <p className="text-xs text-muted-foreground">Pega el link de Google Meet, Zoom, Teams, etc.</p>
              </div>
            )}
            {newAppointment.appointment_type === 'in_person' && (
              <div className="space-y-2">
                <Label>Ubicacion</Label>
                <Input 
                  value={newAppointment.location} 
                  onChange={(e) => setNewAppointment({ ...newAppointment, location: e.target.value })} 
                  placeholder="Oficina central, Av. Reforma 123" 
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Textarea 
                value={newAppointment.description} 
                onChange={(e) => setNewAppointment({ ...newAppointment, description: e.target.value })} 
                rows={2}
                placeholder="Notas o agenda de la reunion..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setAppointmentModalOpen(false)}>Cancelar</Button>
            <Button onClick={addAppointment}>
              <Calendar className="mr-2 h-4 w-4" />
              Agendar Cita
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Agregar Servicio */}
      <Dialog open={serviceModalOpen} onOpenChange={(open) => {
        setServiceModalOpen(open)
        if (!open) setNewService({ service_id: "", quantity: 1, currency_id: "", billing_type: "project", unit_price: 0 })
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Servicio</DialogTitle>
            <DialogDescription>Primero selecciona la moneda para ver los precios</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Paso 1: Seleccionar Moneda */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                Moneda
              </Label>
              <Select value={newService.currency_id} onValueChange={(value) => setNewService({ ...newService, currency_id: value, service_id: "" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la moneda" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Paso 2: Seleccionar Servicio (solo si hay moneda seleccionada) */}
            {newService.currency_id && (
              <>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                    Servicio
                  </Label>
                  <Select value={newService.service_id} onValueChange={(value) => {
                    const selected = services.find(s => s.id === value)
                    setNewService({ ...newService, service_id: value, unit_price: selected?.base_price || 0 })
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selecciona un servicio" /></SelectTrigger>
                    <SelectContent>
                      {services.map((s) => {
                        const selectedCurrency = currencies.find(c => c.id === newService.currency_id)
                        const currencyCode = selectedCurrency?.code || "MXN"
                        const formattedPrice = s.base_price 
                          ? new Intl.NumberFormat("es-MX", { style: "currency", currency: currencyCode }).format(s.base_price)
                          : ""
                        return (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} {formattedPrice && `- ${formattedPrice}`}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Paso 3: Cantidad */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                    Cantidad
                  </Label>
                  <Input type="number" min={1} value={newService.quantity} onChange={(e) => setNewService({ ...newService, quantity: parseInt(e.target.value) || 1 })} />
                </div>

                {/* Paso 4: Precio unitario (editable) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">4</span>
                    Precio unitario
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={newService.unit_price}
                    onChange={(e) => setNewService({ ...newService, unit_price: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Se prellena con el precio base del servicio. Ajústalo si este cliente tiene un precio distinto.
                  </p>
                </div>

                {/* Paso 5: Tipo de facturacion */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">5</span>
                    Tipo de facturacion
                  </Label>
                  <Select
                    value={newService.billing_type}
                    onValueChange={(value: "retainer" | "project") => setNewService({ ...newService, billing_type: value })}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecciona el tipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retainer">Retainer (mensual / cuenta)</SelectItem>
                      <SelectItem value="project">Por proyecto</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {newService.billing_type === "retainer"
                      ? "Al convertir, se agrega a la cuenta del cliente como servicio recurrente."
                      : "Al convertir, genera un proyecto independiente para el cliente."}
                  </p>
                </div>
                
                {/* Resumen del precio */}
                {newService.service_id && (
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total estimado:</span>
                      <span className="font-bold text-lg">
                        {(() => {
                          const selectedCurrency = currencies.find(c => c.id === newService.currency_id)
                          const currencyCode = selectedCurrency?.code || "MXN"
                          const total = (newService.unit_price || 0) * newService.quantity
                          return new Intl.NumberFormat("es-MX", { style: "currency", currency: currencyCode }).format(total)
                        })()}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setServiceModalOpen(false)}>Cancelar</Button>
            <Button onClick={addService} disabled={!newService.currency_id || !newService.service_id}>Agregar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Convertir a Cliente */}
      <Dialog open={convertModalOpen} onOpenChange={(open) => { setConvertModalOpen(open); if (!open) setInitialPaymentDone(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-green-600" />
              Pasar a Clientes
            </DialogTitle>
            <DialogDescription>
              Se creará un cliente con la información de <strong>{formData.company_name || formData.contact_name || "este prospecto"}</strong> y se adjuntarán sus cotizaciones. El registro del prospecto se conserva.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-sm font-medium">¿Este prospecto ya realizó el pago inicial para convertirlo a cliente?</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={initialPaymentDone === "yes" ? "default" : "outline"}
                  className={initialPaymentDone === "yes" ? "bg-green-600 hover:bg-green-700 text-white flex-1" : "flex-1"}
                  onClick={() => setInitialPaymentDone("yes")}
                >
                  {initialPaymentDone === "yes" && <CheckCircle className="mr-2 h-4 w-4" />}
                  Sí, ya pagó
                </Button>
                <Button
                  type="button"
                  variant={initialPaymentDone === "no" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setInitialPaymentDone("no")}
                >
                  {initialPaymentDone === "no" && <CheckCircle className="mr-2 h-4 w-4" />}
                  Aún no
                </Button>
              </div>
              {initialPaymentDone === "yes" && (
                <p className="text-xs text-muted-foreground">El cliente se registrará con estado <strong>Activo</strong>.</p>
              )}
              {initialPaymentDone === "no" && (
                <p className="text-xs text-muted-foreground">El cliente se registrará con estado <strong>Prospecto</strong> hasta confirmar el pago.</p>
              )}
            </div>

            {prospectServices.length > 0 && (
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-medium">Al convertir se crearán automáticamente:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                  {prospectServices.some((s) => s.billing_type === "retainer") && (
                    <li>
                      Una <strong>cuenta</strong> con{" "}
                      {prospectServices.filter((s) => s.billing_type === "retainer").length} servicio(s) tipo retainer.
                    </li>
                  )}
                  {prospectServices.some((s) => s.billing_type === "project") && (
                    <li>
                      {prospectServices.filter((s) => s.billing_type === "project").length}{" "}
                      <strong>proyecto(s)</strong> (uno por cada servicio por proyecto).
                    </li>
                  )}
                  {!prospectServices.some((s) => s.billing_type === "retainer") && (
                    <li>Una <strong>cuenta</strong> base para asociar los proyectos.</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertModalOpen(false)} disabled={converting}>Cancelar</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={convertToClient}
              disabled={converting || initialPaymentDone === null}
            >
              {converting ? (<><Spinner className="mr-2 h-4 w-4" /> Convirtiendo...</>) : "Confirmar y crear cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
