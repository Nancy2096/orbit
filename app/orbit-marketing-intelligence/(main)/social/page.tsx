"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Play,
  Clock,
  MousePointer,
  ExternalLink,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { useOMIFilters } from "@/contexts/omi-filters-context"
import { mockSocialAccounts, mockSocialPosts, mockOrganicMetricsTimeline, mockBestPostingTimes } from "@/lib/marketing-intelligence/mock-data-phase2"

// Network icons mapping
const networkIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
    </svg>
  ),
  twitter: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  pinterest: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0a12 12 0 00-4.37 23.17c-.1-.94-.2-2.4.04-3.44l1.43-6.07s-.37-.74-.37-1.83c0-1.71.99-2.99 2.23-2.99 1.05 0 1.56.79 1.56 1.74 0 1.06-.68 2.64-1.03 4.1-.29 1.24.62 2.25 1.84 2.25 2.21 0 3.91-2.33 3.91-5.69 0-2.98-2.14-5.06-5.2-5.06-3.54 0-5.62 2.66-5.62 5.41 0 1.07.41 2.22.93 2.85a.37.37 0 01.09.36l-.35 1.41c-.05.23-.18.27-.42.17-1.56-.73-2.54-3.01-2.54-4.85 0-3.95 2.87-7.58 8.27-7.58 4.35 0 7.73 3.1 7.73 7.24 0 4.32-2.72 7.79-6.51 7.79-1.27 0-2.47-.66-2.88-1.44l-.78 2.99c-.28 1.09-1.05 2.45-1.56 3.28A12 12 0 1012 0z" />
    </svg>
  ),
  threads: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.17.408-2.133 1.37-2.788.812-.552 1.862-.9 3.04-.987.896-.066 1.728-.015 2.48.13-.045-.797-.22-1.405-.518-1.82-.39-.538-1.017-.817-1.865-.83-1.17-.017-2.105.41-2.508 1.146l-1.776-1.058c.757-1.38 2.36-2.203 4.299-2.172 1.44.024 2.596.482 3.437 1.362.755.79 1.206 1.878 1.342 3.233.457.166.869.374 1.23.624 1.323.913 2.126 2.3 2.321 4.012.257 2.254-.534 4.282-2.295 5.872-1.686 1.524-4.063 2.357-7.034 2.468-.034 0-.068.001-.102.001zM12.1 13.61c-.993.07-1.766.29-2.302.656-.468.319-.658.7-.635 1.268.025.451.244.848.651 1.183.509.418 1.24.625 2.1.578 1.076-.06 1.91-.44 2.48-1.133.458-.558.758-1.316.895-2.261-.93-.265-1.963-.376-3.189-.29z" />
    </svg>
  ),
  bluesky: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 01-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.479 0-.689-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z" />
    </svg>
  ),
}

const networkColors: Record<string, string> = {
  instagram: "#E4405F",
  facebook: "#1877F2",
  tiktok: "#000000",
  linkedin: "#0A66C2",
  youtube: "#FF0000",
  pinterest: "#E60023",
  twitter: "#000000",
  threads: "#000000",
  bluesky: "#0085FF",
}

// Growth data for charts
const followersGrowthData = [
  { date: "Ene 1", instagram: 42800, facebook: 31200, tiktok: 15800, linkedin: 8200 },
  { date: "Ene 8", instagram: 43500, facebook: 31500, tiktok: 16800, linkedin: 8400 },
  { date: "Ene 15", instagram: 45200, facebook: 32100, tiktok: 18500, linkedin: 8900 },
]

const engagementByNetwork = [
  { network: "Instagram", engagement: 4.2, fill: "#E4405F" },
  { network: "TikTok", engagement: 8.5, fill: "#000000" },
  { network: "Facebook", engagement: 2.8, fill: "#1877F2" },
  { network: "LinkedIn", engagement: 3.1, fill: "#0A66C2" },
]

const reachByMonth = [
  { month: "Oct", organic: 320000, paid: 150000 },
  { month: "Nov", organic: 380000, paid: 180000 },
  { month: "Dic", organic: 420000, paid: 200000 },
  { month: "Ene", organic: 485000, paid: 220000 },
]

const formatsByPerformance = [
  { format: "Reel", views: 520000, engagement: 5.2 },
  { format: "Carrusel", views: 180000, engagement: 4.8 },
  { format: "Video", views: 320000, engagement: 4.1 },
  { format: "Imagen", views: 95000, engagement: 3.2 },
  { format: "Story", views: 450000, engagement: 2.8 },
]

const bestHoursData = [
  { hour: "09:00", lunes: 45, martes: 52, miercoles: 48, jueves: 55, viernes: 42 },
  { hour: "12:00", lunes: 78, martes: 72, miercoles: 85, jueves: 70, viernes: 65 },
  { hour: "15:00", lunes: 55, martes: 60, miercoles: 58, jueves: 62, viernes: 70 },
  { hour: "18:00", lunes: 92, martes: 88, miercoles: 95, jueves: 85, viernes: 80 },
  { hour: "21:00", lunes: 85, martes: 90, miercoles: 88, jueves: 92, viernes: 75 },
]

export default function OrganicSocialPage() {
  const [selectedNetwork, setSelectedNetwork] = useState<string>("all")
  
  const { 
    selectedClient, 
    selectedBrand, 
    selectedPeriod,
    getClientName,
    getBrandName,
    getPeriodLabel 
  } = useOMIFilters()

  // Calculate totals with filter simulation
  const multiplier = useMemo(() => {
    let m = 1
    if (selectedClient !== "all") m *= 0.3
    if (selectedBrand !== "all") m *= 0.5
    return m
  }, [selectedClient, selectedBrand])

  const totalFollowers = Math.round(mockSocialAccounts.reduce((acc, a) => acc + a.followers, 0) * multiplier)
  const avgEngagement = mockSocialAccounts.reduce((acc, a) => acc + a.engagementRate, 0) / mockSocialAccounts.length
  const totalReach = Math.round(485000 * multiplier)
  const totalImpressions = Math.round(720000 * multiplier)

  // Top posts
  const publishedPosts = mockSocialPosts.filter(p => p.status === "publicado")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Redes Sociales Orgánicas</h1>
          <p className="text-muted-foreground">Analítica de rendimiento orgánico en todas las plataformas</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todas las redes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las redes</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="twitter">X / Twitter</SelectItem>
              <SelectItem value="threads">Threads</SelectItem>
              <SelectItem value="bluesky">Bluesky</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="h-9 px-3 flex items-center">
            {getPeriodLabel()}
          </Badge>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Seguidores Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFollowers.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +3.2% vs mes anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Crecimiento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+4,850</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              Este mes
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alcance Orgánico</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalReach / 1000).toFixed(0)}K</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +15.4% vs mes anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Impresiones</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalImpressions / 1000).toFixed(0)}K</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +12.8% vs mes anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgEngagement.toFixed(1)}%</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +0.3% vs mes anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reproducciones</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2M</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +28.5% vs mes anterior
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-500" />
              <span className="text-sm text-muted-foreground">Likes</span>
            </div>
            <div className="mt-1 text-xl font-bold">28.5K</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Comentarios</span>
            </div>
            <div className="mt-1 text-xl font-bold">1,892</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Compartidos</span>
            </div>
            <div className="mt-1 text-xl font-bold">3,420</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Guardados</span>
            </div>
            <div className="mt-1 text-xl font-bold">1,245</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MousePointer className="h-4 w-4 text-violet-500" />
              <span className="text-sm text-muted-foreground">Clics perfil</span>
            </div>
            <div className="mt-1 text-xl font-bold">4,520</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-cyan-500" />
              <span className="text-sm text-muted-foreground">Clics web</span>
            </div>
            <div className="mt-1 text-xl font-bold">1,890</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList>
          <TabsTrigger value="growth">Crecimiento</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="reach">Alcance</TabsTrigger>
          <TabsTrigger value="formats">Formatos</TabsTrigger>
          <TabsTrigger value="hours">Mejores Horarios</TabsTrigger>
        </TabsList>

        <TabsContent value="growth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Crecimiento de Seguidores por Red</CardTitle>
              <CardDescription>Evolución del número de seguidores en las últimas semanas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={followersGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))' 
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="instagram" name="Instagram" stroke="#E4405F" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="facebook" name="Facebook" stroke="#1877F2" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="tiktok" name="TikTok" stroke="#000000" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="linkedin" name="LinkedIn" stroke="#0A66C2" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Rate por Red</CardTitle>
                <CardDescription>Comparación del engagement entre plataformas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={engagementByNetwork} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" domain={[0, 10]} unit="%" className="text-xs" />
                      <YAxis dataKey="network" type="category" className="text-xs" width={80} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))' 
                        }}
                        formatter={(value) => [`${value}%`, 'Engagement']}
                      />
                      <Bar dataKey="engagement" radius={[0, 4, 4, 0]}>
                        {engagementByNetwork.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución de Interacciones</CardTitle>
                <CardDescription>Tipos de interacción más comunes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={[
                          { name: 'Likes', value: 28500, fill: '#E4405F' },
                          { name: 'Compartidos', value: 3420, fill: '#22C55E' },
                          { name: 'Comentarios', value: 1892, fill: '#3B82F6' },
                          { name: 'Guardados', value: 1245, fill: '#F59E0B' },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      />
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reach" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alcance Orgánico vs Pagado</CardTitle>
              <CardDescription>Comparación mensual de alcance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reachByMonth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `${value / 1000}K`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                      formatter={(value: number) => [value.toLocaleString(), '']}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="organic" name="Orgánico" stackId="1" stroke="#22C55E" fill="#22C55E" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="paid" name="Pagado" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Formato</CardTitle>
              <CardDescription>Comparación de reproducciones y engagement por tipo de contenido</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formatsByPerformance}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="format" className="text-xs" />
                    <YAxis yAxisId="left" className="text-xs" tickFormatter={(value) => `${value / 1000}K`} />
                    <YAxis yAxisId="right" orientation="right" className="text-xs" unit="%" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="views" name="Reproducciones" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="engagement" name="Engagement %" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mejores Horarios de Publicación</CardTitle>
              <CardDescription>Índice de engagement por hora y día de la semana</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bestHoursData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="hour" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                    />
                    <Legend />
                    <Bar dataKey="lunes" name="Lunes" fill="#3B82F6" />
                    <Bar dataKey="martes" name="Martes" fill="#22C55E" />
                    <Bar dataKey="miercoles" name="Miércoles" fill="#F59E0B" />
                    <Bar dataKey="jueves" name="Jueves" fill="#EF4444" />
                    <Bar dataKey="viernes" name="Viernes" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Accounts Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Cuentas Conectadas</CardTitle>
          <CardDescription>Estado y métricas de cada red social</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {mockSocialAccounts.slice(0, 4).map((account) => {
              const NetworkIcon = networkIcons[account.network] || Share2
              return (
                <Link 
                  key={account.id} 
                  href={`/orbit-marketing-intelligence/social/${account.network}`}
                  className="block"
                >
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="flex h-8 w-8 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${networkColors[account.network]}20` }}
                          >
                            <NetworkIcon 
                              className="h-4 w-4" 
                              style={{ color: networkColors[account.network] }} 
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium capitalize">{account.network}</p>
                            <p className="text-xs text-muted-foreground">{account.username}</p>
                          </div>
                        </div>
                        <Badge variant={account.connected ? "default" : "secondary"} className="text-[10px]">
                          {account.connected ? "Conectado" : "Desconectado"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Seguidores</p>
                          <p className="font-medium">{account.followers.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Engagement</p>
                          <p className="font-medium">{account.engagementRate}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Posts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Publicaciones con Mejor Rendimiento</CardTitle>
              <CardDescription>Posts con mayor engagement en el período seleccionado</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/orbit-marketing-intelligence/calendar">
                Ver todas
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Publicación</TableHead>
                <TableHead>Red</TableHead>
                <TableHead>Formato</TableHead>
                <TableHead className="text-right">Alcance</TableHead>
                <TableHead className="text-right">Engagement</TableHead>
                <TableHead className="text-right">Eng. Rate</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {publishedPosts.map((post) => {
                const NetworkIcon = networkIcons[post.networks[0]] || Share2
                return (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="max-w-[250px]">
                        <p className="font-medium truncate">{post.copy}</p>
                        <p className="text-xs text-muted-foreground truncate">{post.brandName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {post.networks.map((network) => {
                          const Icon = networkIcons[network] || Share2
                          return (
                            <div
                              key={network}
                              className="flex h-6 w-6 items-center justify-center rounded-full"
                              style={{ backgroundColor: `${networkColors[network]}20` }}
                            >
                              <Icon className="h-3 w-3" style={{ color: networkColors[network] }} />
                            </div>
                          )
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{post.format}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {post.reach?.toLocaleString() || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {post.engagement?.toLocaleString() || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{post.engagementRate?.toFixed(1)}%</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {post.publishedDate ? new Date(post.publishedDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : "-"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
