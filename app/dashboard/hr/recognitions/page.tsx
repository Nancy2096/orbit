"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { 
  Award, 
  Send, 
  Clock, 
  Gift, 
  TrendingUp,
  Users,
  ChevronRight,
  Plus,
  Sparkles,
  Heart,
  ThumbsUp,
  Target,
  Zap,
  ShoppingCart,
  Check,
  Trophy,
  Medal,
  Crown,
  Handshake,
  Flag,
  Rocket,
  Lightbulb,
  Compass,
  Briefcase,
  GraduationCap,
  MessageCircle
} from "lucide-react"

interface Agency {
  id: string
  name: string
}

interface Staff {
  id: string
  first_name: string
  last_name: string
  position: string | null
  agency_id: string | null
}

interface Category {
  id: string
  name: string
  description: string | null
  points: number
  color: string
  icon: string
  is_active: boolean
}

interface Transaction {
  id: string
  from_staff_id: string
  to_staff_id: string
  category_id: string | null
  points: number
  reason: string
  created_at: string
  from_staff?: { first_name: string; last_name: string }
  to_staff?: { first_name: string; last_name: string }
  category?: { name: string; color: string; icon: string }
}

interface Allocation {
  id: string
  staff_id: string
  recognitions_given: number
  points_received: number
}

interface Balance {
  id: string
  staff_id: string
  total_points: number
  total_redeemed: number
}

interface RecognitionSettings {
  id?: string
  max_recognitions_per_month: number
  point_value: number
  min_redemption_points: number
}

interface Reward {
  id: string
  name: string
  description: string | null
  points_cost: number
  is_active: boolean
}

interface Redemption {
  id: string
  staff_id: string
  reward_id: string
  points_spent: number
  status: string
  created_at: string
  staff?: { first_name: string; last_name: string }
  reward?: { name: string }
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  // Reconocimientos de excelencia
  award: Award,
  trophy: Trophy,
  medal: Medal,
  crown: Crown,
  // Colaboración y equipo
  handshake: Handshake,
  users: Users,
  heart: Heart,
  // Logros y metas
  target: Target,
  flag: Flag,
  rocket: Rocket,
  trending: TrendingUp,
  // Innovación y creatividad
  lightbulb: Lightbulb,
  zap: Zap,
  sparkles: Sparkles,
  // Liderazgo y mentoría  
  compass: Compass,
  briefcase: Briefcase,
  graduationcap: GraduationCap,
  // Comunicación y servicio
  thumbsup: ThumbsUp,
  messageCircle: MessageCircle,
  // Fallback
  star: Award,
}

export default function RecognitionsPage() {
  const supabase = createClient()
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [selectedAgency, setSelectedAgency] = useState<string>("")
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [balances, setBalances] = useState<Balance[]>([])
  const [settings, setSettings] = useState<RecognitionSettings | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [loading, setLoading] = useState(true)

  const [showSendDialog, setShowSendDialog] = useState(false)
  const [sendForm, setSendForm] = useState({ to_staff_id: "", category_id: "", reason: "" })

  const [showRedeemDialog, setShowRedeemDialog] = useState(false)
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const currentQuarter = Math.ceil(currentMonth / 3)

  // Calculate stats
  const myAllocation = allocations[0]
  const myBalance = balances[0]
  const maxRecognitions = settings?.max_recognitions_per_month || 2
  const remainingRecognitions = Math.max(0, maxRecognitions - (myAllocation?.recognitions_given || 0))
  const totalPointsGiven = transactions.reduce((sum, t) => sum + t.points, 0)
  const totalRedemptions = redemptions.reduce((sum, r) => r.status === "completed" ? sum + r.points_spent : sum, 0)

  useEffect(() => {
    fetchAgencies()
  }, [])

  useEffect(() => {
    if (selectedAgency) {
      fetchAllData()
    }
  }, [selectedAgency])

  const fetchAgencies = async () => {
    const { data } = await supabase.from("agencies").select("id, name").order("name")
    if (data && data.length > 0) {
      setAgencies(data)
      setSelectedAgency(data[0].id)
    }
    setLoading(false)
  }

  const fetchAllData = async () => {
    setLoading(true)
    await Promise.all([
      fetchStaff(),
      fetchCategories(),
      fetchTransactions(),
      fetchAllocations(),
      fetchBalances(),
      fetchSettings(),
      fetchRewards(),
      fetchRedemptions(),
    ])
    setLoading(false)
  }

  const fetchStaff = async () => {
    const { data } = await supabase
      .from("staff")
      .select("id, first_name, last_name, position, agency_id")
      .or(`agency_id.eq.${selectedAgency},agency_id.is.null`)
      .eq("is_active", true)
      .order("first_name")
    setStaffList(data || [])
  }

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("recognition_categories")
      .select("*")
      .eq("agency_id", selectedAgency)
      .eq("is_active", true)
      .order("name")
    setCategories(data || [])
  }

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from("recognition_transactions")
      .select(`
        id, from_staff_id, to_staff_id, category_id, points, reason, created_at,
        from_staff:from_staff_id(first_name, last_name),
        to_staff:to_staff_id(first_name, last_name),
        category:category_id(name, color, icon)
      `)
      .eq("agency_id", selectedAgency)
      .order("created_at", { ascending: false })
      .limit(50)
    setTransactions(data || [])
  }

  const fetchAllocations = async () => {
    const { data } = await supabase
      .from("recognition_point_allocations")
      .select("id, staff_id, recognitions_given, points_received")
      .eq("agency_id", selectedAgency)
      .eq("year", currentYear)
      .eq("quarter", currentQuarter)
    setAllocations(data || [])
  }

  const fetchBalances = async () => {
    const { data } = await supabase
      .from("recognition_balances")
      .select("id, staff_id, total_points, total_redeemed")
      .eq("agency_id", selectedAgency)
    setBalances(data || [])
  }

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("recognition_settings")
      .select("*")
      .eq("agency_id", selectedAgency)
      .single()
    setSettings(data)
  }

  const fetchRewards = async () => {
    const { data } = await supabase
      .from("recognition_rewards")
      .select("*")
      .eq("agency_id", selectedAgency)
      .eq("is_active", true)
      .order("points_cost")
    setRewards(data || [])
  }

  const fetchRedemptions = async () => {
    const { data } = await supabase
      .from("recognition_redemptions")
      .select(`
        id, staff_id, reward_id, points_spent, status, created_at,
        staff:staff_id(first_name, last_name),
        reward:reward_id(name)
      `)
      .eq("agency_id", selectedAgency)
      .order("created_at", { ascending: false })
    setRedemptions(data || [])
  }

  const handleInitializeMonth = async () => {
    const allocationsToCreate = staffList.map(staff => ({
      agency_id: selectedAgency,
      staff_id: staff.id,
      year: currentYear,
      month: currentMonth,
      quarter: currentQuarter,
      recognitions_given: 0,
      points_received: 0,
    }))

    await supabase.from("recognition_point_allocations").upsert(allocationsToCreate, {
      onConflict: "staff_id,year,quarter",
    })

    for (const staff of staffList) {
      await supabase.from("recognition_balances").upsert({
        agency_id: selectedAgency,
        staff_id: staff.id,
        total_points: 0,
        total_redeemed: 0,
      }, { onConflict: "staff_id" })
    }

    await fetchAllocations()
    await fetchBalances()
    setShowSendDialog(true)
  }

  const handleSendRecognition = async () => {
    if (!sendForm.to_staff_id || !sendForm.category_id || !sendForm.reason) {
      return
    }

    const selectedCategory = categories.find(c => c.id === sendForm.category_id)
    if (!selectedCategory) {
      alert("Categoría no encontrada")
      return
    }

    const fromStaffId = staffList[0]?.id
    if (!fromStaffId) {
      alert("No hay personal disponible")
      return
    }

    let fromAllocation = allocations.find(a => a.staff_id === fromStaffId)
    
    if (!fromAllocation) {
      const { data: newAllocation, error } = await supabase
        .from("recognition_point_allocations")
        .upsert({
          agency_id: selectedAgency,
          staff_id: fromStaffId,
          year: currentYear,
          month: currentMonth,
          quarter: currentQuarter,
          recognitions_given: 0,
          points_received: 0,
        }, { onConflict: "staff_id,year,quarter" })
        .select()
        .single()
      
      if (error) {
        alert("Error al crear asignación: " + error.message)
        return
      }
      fromAllocation = newAllocation
    }

    // Create transaction
    await supabase.from("recognition_transactions").insert({
      agency_id: selectedAgency,
      from_staff_id: fromStaffId,
      to_staff_id: sendForm.to_staff_id,
      category_id: sendForm.category_id,
      points: selectedCategory.points,
      reason: sendForm.reason,
    })

    // Update from allocation (recognitions given)
    await supabase
      .from("recognition_point_allocations")
      .update({ recognitions_given: (fromAllocation?.recognitions_given || 0) + 1 })
      .eq("id", fromAllocation?.id)

    // Update to allocation
    let toAllocation = allocations.find(a => a.staff_id === sendForm.to_staff_id)
    if (!toAllocation) {
      const { data: newToAlloc } = await supabase
        .from("recognition_point_allocations")
        .upsert({
          agency_id: selectedAgency,
          staff_id: sendForm.to_staff_id,
          year: currentYear,
          month: currentMonth,
          quarter: currentQuarter,
          recognitions_given: 0,
          points_received: selectedCategory.points,
        }, { onConflict: "staff_id,year,quarter" })
        .select()
        .single()
      toAllocation = newToAlloc
    } else {
      await supabase
        .from("recognition_point_allocations")
        .update({ points_received: toAllocation.points_received + selectedCategory.points })
        .eq("id", toAllocation.id)
    }

    // Update balance
    let toBalance = balances.find(b => b.staff_id === sendForm.to_staff_id)
    if (!toBalance) {
      await supabase
        .from("recognition_balances")
        .insert({
          agency_id: selectedAgency,
          staff_id: sendForm.to_staff_id,
          total_points: selectedCategory.points,
          total_redeemed: 0,
        })
    } else {
      await supabase
        .from("recognition_balances")
        .update({ total_points: toBalance.total_points + selectedCategory.points })
        .eq("id", toBalance.id)
    }

    setShowSendDialog(false)
    setSendForm({ to_staff_id: "", category_id: "", reason: "" })
    fetchAllData()
  }

  const handleRedeemReward = async () => {
    if (!selectedReward || !myBalance) return

    if (myBalance.total_points < selectedReward.points_cost) {
      alert("No tienes suficientes puntos")
      return
    }

    const fromStaffId = staffList[0]?.id
    if (!fromStaffId) return

    await supabase.from("recognition_redemptions").insert({
      agency_id: selectedAgency,
      staff_id: fromStaffId,
      reward_id: selectedReward.id,
      points_spent: selectedReward.points_cost,
      status: "pending",
    })

    await supabase
      .from("recognition_balances")
      .update({
        total_points: myBalance.total_points - selectedReward.points_cost,
        total_redeemed: myBalance.total_redeemed + selectedReward.points_cost,
      })
      .eq("id", myBalance.id)

    setShowRedeemDialog(false)
    setSelectedReward(null)
    fetchAllData()
  }

  const getStaffName = (staff: { first_name?: string; last_name?: string } | null | undefined) => {
    if (!staff) return "Desconocido"
    return `${staff.first_name || ""} ${staff.last_name || ""}`.trim() || "Desconocido"
  }

  const getIconComponent = (iconName: string) => {
    return iconMap[iconName.toLowerCase()] || Award
  }

  // Get icon based on category name keywords for better semantic matching
  const getIconForCategory = (category: { icon: string; name: string }) => {
    const name = category.name.toLowerCase()
    
    // First try the stored icon
    if (category.icon && iconMap[category.icon.toLowerCase()]) {
      return iconMap[category.icon.toLowerCase()]
    }
    
    // Fallback to keyword matching based on category name
    if (name.includes('innovación') || name.includes('innovacion') || name.includes('creativ')) return Lightbulb
    if (name.includes('liderazgo') || name.includes('líder') || name.includes('lider')) return Compass
    if (name.includes('equipo') || name.includes('colabor') || name.includes('team')) return Handshake
    if (name.includes('servicio') || name.includes('cliente') || name.includes('atención')) return Heart
    if (name.includes('excelencia') || name.includes('calidad') || name.includes('outstanding')) return Trophy
    if (name.includes('mentor') || name.includes('enseñ') || name.includes('capacit')) return GraduationCap
    if (name.includes('meta') || name.includes('objetivo') || name.includes('logro')) return Target
    if (name.includes('comunic') || name.includes('feedback')) return MessageCircle
    if (name.includes('esfuerzo') || name.includes('dedicación') || name.includes('dedicacion')) return Rocket
    if (name.includes('trabajo') || name.includes('profesional')) return Briefcase
    if (name.includes('super') || name.includes('estrella') || name.includes('destacado')) return Medal
    
    return Award
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Pendiente</Badge>
      case "completed": return <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50">Completado</Badge>
      case "cancelled": return <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">Cancelado</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading && agencies.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reconocimientos</h1>
          <p className="text-muted-foreground">Celebra y reconoce los logros de tu equipo</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedAgency} onValueChange={setSelectedAgency}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar agencia" />
            </SelectTrigger>
            <SelectContent>
              {agencies.map((agency) => (
                <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200/60">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Mes Actual</p>
                <p className="text-xl font-semibold capitalize mt-1">
                  {new Date().toLocaleDateString("es-MX", { month: "long" })}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-slate-200/80 flex items-center justify-center">
                <Award className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/60">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">Puntos Otorgados</p>
                <p className="text-xl font-semibold text-emerald-900 mt-1">{totalPointsGiven.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-200/80 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/60">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Disponibles</p>
                <p className="text-xl font-semibold text-blue-900 mt-1">{remainingRecognitions} de {maxRecognitions}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-200/80 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200/60">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Canjes Realizados</p>
                <p className="text-xl font-semibold text-amber-900 mt-1">${totalRedemptions.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-200/80 flex items-center justify-center">
                <Gift className="h-5 w-5 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="give" className="space-y-6">
        <TabsList className="bg-muted/30 p-1.5 h-auto flex-wrap gap-2">
          <TabsTrigger 
            value="give" 
            className="px-5 py-2.5 rounded-lg font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:bg-background data-[state=inactive]:border data-[state=inactive]:border-border data-[state=inactive]:hover:bg-muted/50 transition-all"
          >
            <Send className="h-4 w-4 mr-2" />
            Reconocer
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="px-5 py-2.5 rounded-lg font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:bg-background data-[state=inactive]:border data-[state=inactive]:border-border data-[state=inactive]:hover:bg-muted/50 transition-all"
          >
            <Clock className="h-4 w-4 mr-2" />
            Historial
          </TabsTrigger>
          <TabsTrigger 
            value="rewards" 
            className="px-5 py-2.5 rounded-lg font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:bg-background data-[state=inactive]:border data-[state=inactive]:border-border data-[state=inactive]:hover:bg-muted/50 transition-all"
          >
            <Gift className="h-4 w-4 mr-2" />
            Recompensas
          </TabsTrigger>
          <TabsTrigger 
            value="redemptions" 
            className="px-5 py-2.5 rounded-lg font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:bg-background data-[state=inactive]:border data-[state=inactive]:border-border data-[state=inactive]:hover:bg-muted/50 transition-all"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Canjes
          </TabsTrigger>
        </TabsList>

        {/* Give Recognition Tab */}
        <TabsContent value="give" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Section */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Enviar Reconocimiento
                  </CardTitle>
                  <CardDescription className="space-y-1">
                    <span className="font-semibold text-foreground">Los reconocimientos están basados en los pilares de la agencia.</span>
                    <br />
                    Selecciona el pilar que mejor represente la actitud, aporte o desempeño de un integrante del equipo, y utilízalo para reconocer su contribución.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {remainingRecognitions > 0 ? (
                    <div className="space-y-4">
                      {categories.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Award className="h-10 w-10 mx-auto mb-3 opacity-40" />
                          <p className="font-medium">No hay categorías configuradas</p>
                          <p className="text-sm mt-1">Configura las categorías en la sección de agencias</p>
                        </div>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {categories.map((category) => {
                            const IconComponent = getIconForCategory(category)
                            // Adjust color if too light (yellow tones)
                            const displayColor = category.color?.toLowerCase().includes('ff') && category.color?.toLowerCase().includes('ff00') 
                              ? '#D97706' // amber-600 instead of yellow
                              : category.color
                            return (
                              <button
                                key={category.id}
                                onClick={() => {
                                  setSendForm(prev => ({ ...prev, category_id: category.id }))
                                  setShowSendDialog(true)
                                }}
                                className="group flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/30 hover:shadow-sm transition-all text-left"
                              >
                                <div 
                                  className="h-11 w-11 rounded-lg flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: `${displayColor}15`, color: displayColor }}
                                >
                                  <IconComponent className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0 space-y-1.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="font-semibold text-sm">{category.name}</p>
                                    <Badge variant="outline" className="shrink-0 text-xs font-medium" style={{ borderColor: displayColor, color: displayColor }}>
                                      +{category.points} pts
                                    </Badge>
                                  </div>
                                  {category.description && (
                                    <p 
                                      className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line"
                                      dangerouslySetInnerHTML={{ 
                                        __html: category.description
                                          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
                                          .replace(/__(.*?)__/g, '<em>$1</em>')
                                      }}
                                    />
                                  )}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ) : allocations.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Award className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Comienza a reconocer</h3>
                      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                        Inicia el período para comenzar a enviar reconocimientos a tu equipo
                      </p>
                      <Button onClick={handleInitializeMonth} size="lg">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Reconocer a alguien del equipo
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <Check className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Has usado todos tus reconocimientos</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        Podrás enviar más reconocimientos el próximo mes
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Actividad Reciente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transactions.slice(0, 5).map((transaction) => {
                      const IconComponent = transaction.category ? getIconComponent(transaction.category.icon) : Award
                      return (
                        <div key={transaction.id} className="flex items-start gap-4">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs bg-muted">
                              {transaction.from_staff?.first_name?.[0]}{transaction.from_staff?.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-medium">{getStaffName(transaction.from_staff)}</span>
                              <span className="text-muted-foreground"> reconoció a </span>
                              <span className="font-medium">{getStaffName(transaction.to_staff)}</span>
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {transaction.category && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs"
                                  style={{ 
                                    borderColor: `${transaction.category.color}50`,
                                    backgroundColor: `${transaction.category.color}10`,
                                    color: transaction.category.color 
                                  }}
                                >
                                  <IconComponent className="h-3 w-3 mr-1" />
                                  {transaction.category.name}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {new Date(transaction.created_at).toLocaleDateString("es-MX", { 
                                  day: "numeric", 
                                  month: "short" 
                                })}
                              </span>
                            </div>
                          </div>
                          <Badge variant="secondary" className="shrink-0 font-medium">
                            +{transaction.points}
                          </Badge>
                        </div>
                      )
                    })}
                    {transactions.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No hay actividad reciente</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="bg-slate-900 text-white border-0">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    Tu Balance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-amber-400">
                      {myBalance?.total_points || 0}
                    </div>
                    <p className="text-slate-400 mt-1">puntos disponibles</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-emerald-400">
                        {myAllocation?.points_received || 0}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Recibidos este mes</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-blue-400">
                        {myBalance?.total_redeemed || 0}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Total canjeado</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Este Mes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reconocimientos dados</span>
                    <span className="font-medium">{myAllocation?.recognitions_given || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Disponibles</span>
                    <span className="font-medium">{remainingRecognitions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Puntos recibidos</span>
                    <span className="font-medium text-emerald-600">+{myAllocation?.points_received || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Reconocimientos</CardTitle>
              <CardDescription>
                Todos los reconocimientos enviados y recibidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => {
                  const IconComponent = transaction.category ? getIconComponent(transaction.category.icon) : Award
                  return (
                    <div key={transaction.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Avatar>
                        <AvatarFallback>
                          {transaction.from_staff?.first_name?.[0]}{transaction.from_staff?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{getStaffName(transaction.from_staff)}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{getStaffName(transaction.to_staff)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{transaction.reason}</p>
                        <div className="flex items-center gap-3 mt-2">
                          {transaction.category && (
                            <Badge 
                              variant="outline"
                              style={{ 
                                borderColor: `${transaction.category.color}50`,
                                backgroundColor: `${transaction.category.color}10`,
                                color: transaction.category.color 
                              }}
                            >
                              <IconComponent className="h-3 w-3 mr-1" />
                              {transaction.category.name}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString("es-MX", { 
                              day: "numeric", 
                              month: "long", 
                              year: "numeric" 
                            })}
                          </span>
                        </div>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 shrink-0">
                        +{transaction.points} pts
                      </Badge>
                    </div>
                  )
                })}
                {transactions.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No hay reconocimientos aún</p>
                    <p className="text-sm mt-1">Sé el primero en reconocer a alguien</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Catálogo de Recompensas</CardTitle>
              <CardDescription>
                Canjea tus puntos por increíbles recompensas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rewards.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Gift className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No hay recompensas disponibles</p>
                  <p className="text-sm mt-1">Las recompensas se configuran desde la administración</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {rewards.map((reward) => {
                    const canAfford = (myBalance?.total_points || 0) >= reward.points_cost
                    return (
                      <Card key={reward.id} className={`overflow-hidden transition-all ${canAfford ? 'hover:shadow-md' : 'opacity-60'}`}>
                        <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
                        <CardContent className="pt-5">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Gift className="h-5 w-5 text-primary" />
                            </div>
                            <Badge variant="secondary" className="font-semibold">
                              {reward.points_cost} pts
                            </Badge>
                          </div>
                          <h4 className="font-semibold mb-1">{reward.name}</h4>
                          {reward.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{reward.description}</p>
                          )}
                          <Button 
                            className="w-full mt-4" 
                            size="sm"
                            disabled={!canAfford}
                            onClick={() => {
                              setSelectedReward(reward)
                              setShowRedeemDialog(true)
                            }}
                          >
                            {canAfford ? "Canjear" : "Puntos insuficientes"}
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Redemptions Tab */}
        <TabsContent value="redemptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Canjes</CardTitle>
              <CardDescription>
                Todos los canjes realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {redemptions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No hay canjes realizados</p>
                  <p className="text-sm mt-1">Los canjes aparecerán aquí</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {redemptions.map((redemption) => (
                    <div key={redemption.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Gift className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{redemption.reward?.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">
                              {getStaffName(redemption.staff)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(redemption.created_at).toLocaleDateString("es-MX")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-muted-foreground">
                          -{redemption.points_spent} pts
                        </span>
                        {getStatusBadge(redemption.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Send Recognition Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Reconocimiento</DialogTitle>
            <DialogDescription>
              Selecciona a quién quieres reconocer y escribe un mensaje
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select 
                value={sendForm.category_id} 
                onValueChange={(v) => setSendForm(prev => ({ ...prev, category_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => {
                    const IconComponent = getIconComponent(cat.icon)
                    return (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4 shrink-0" style={{ color: cat.color }} />
                          <span className="truncate">{cat.name}</span>
                          <span className="ml-auto text-xs text-muted-foreground">+{cat.points} pts</span>
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Compañero</Label>
              <Select 
                value={sendForm.to_staff_id} 
                onValueChange={(v) => setSendForm(prev => ({ ...prev, to_staff_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona a quién reconocer" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.filter(s => s.id !== staffList[0]?.id).map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.first_name} {staff.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mensaje</Label>
              <Textarea
                placeholder="Escribe por qué reconoces a esta persona..."
                value={sendForm.reason}
                onChange={(e) => setSendForm(prev => ({ ...prev, reason: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSendRecognition}
              disabled={!sendForm.to_staff_id || !sendForm.category_id || !sendForm.reason}
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redeem Dialog */}
      <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Canje</DialogTitle>
            <DialogDescription>
              {selectedReward && `¿Deseas canjear "${selectedReward.name}" por ${selectedReward.points_cost} puntos?`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">{selectedReward?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedReward?.description}</p>
              </div>
              <Badge className="text-lg px-3 py-1">{selectedReward?.points_cost} pts</Badge>
            </div>
            <div className="mt-4 text-sm text-muted-foreground text-center">
              Tu balance después del canje: <strong>{(myBalance?.total_points || 0) - (selectedReward?.points_cost || 0)} puntos</strong>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRedeemDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRedeemReward}>
              Confirmar Canje
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
