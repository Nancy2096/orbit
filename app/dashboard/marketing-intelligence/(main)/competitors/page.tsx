"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Globe,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Plus,
  ExternalLink,
  RefreshCw,
  Download,
  BarChart3,
  Target,
  Zap,
  Instagram,
  Facebook,
  Twitter
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts"

// Mock Competitors Data
const mockCompetitors = [
  {
    id: 1,
    name: "CompetidorA Digital",
    logo: "/placeholder.svg?height=40&width=40",
    website: "competidora.com",
    industry: "Marketing Digital",
    followers: { instagram: 45000, facebook: 32000, twitter: 12000, linkedin: 8500 },
    engagement: 4.2,
    postsPerWeek: 12,
    topContent: "Videos cortos",
    sentiment: 78,
    strengths: ["Contenido visual", "Engagement alto", "Branding consistente"],
    weaknesses: ["Poca presencia en LinkedIn", "Respuesta lenta"],
  },
  {
    id: 2,
    name: "MarketPro Agency",
    logo: "/placeholder.svg?height=40&width=40",
    website: "marketpro.com",
    industry: "Marketing Digital",
    followers: { instagram: 62000, facebook: 45000, twitter: 18000, linkedin: 15000 },
    engagement: 3.8,
    postsPerWeek: 18,
    topContent: "Infografías",
    sentiment: 82,
    strengths: ["Gran alcance", "Contenido educativo", "SEO fuerte"],
    weaknesses: ["Engagement bajo", "Contenido repetitivo"],
  },
  {
    id: 3,
    name: "Digital Growth MX",
    logo: "/placeholder.svg?height=40&width=40",
    website: "digitalgrowth.mx",
    industry: "Marketing Digital",
    followers: { instagram: 28000, facebook: 22000, twitter: 8000, linkedin: 12000 },
    engagement: 5.1,
    postsPerWeek: 8,
    topContent: "Casos de éxito",
    sentiment: 85,
    strengths: ["Alto engagement", "Comunidad activa", "Testimoniales"],
    weaknesses: ["Menor frecuencia", "Alcance limitado"],
  },
]

const mockYourBrand = {
  name: "Tu Marca",
  followers: { instagram: 35000, facebook: 28000, twitter: 10000, linkedin: 11000 },
  engagement: 4.5,
  postsPerWeek: 10,
  sentiment: 80,
}

const followerGrowthData = [
  { month: "Ene", tuMarca: 28000, competidorA: 38000, marketPro: 52000, digitalGrowth: 22000 },
  { month: "Feb", tuMarca: 29500, competidorA: 40000, marketPro: 54000, digitalGrowth: 23500 },
  { month: "Mar", tuMarca: 31000, competidorA: 41500, marketPro: 56000, digitalGrowth: 25000 },
  { month: "Abr", tuMarca: 32500, competidorA: 43000, marketPro: 58000, digitalGrowth: 26000 },
  { month: "May", tuMarca: 34000, competidorA: 44500, marketPro: 60000, digitalGrowth: 27500 },
  { month: "Jun", tuMarca: 35000, competidorA: 45000, marketPro: 62000, digitalGrowth: 28000 },
]

const engagementComparison = [
  { name: "Tu Marca", engagement: 4.5 },
  { name: "CompetidorA", engagement: 4.2 },
  { name: "MarketPro", engagement: 3.8 },
  { name: "DigitalGrowth", engagement: 5.1 },
]

const radarData = [
  { metric: "Seguidores", tuMarca: 70, competidorA: 85, marketPro: 95 },
  { metric: "Engagement", tuMarca: 90, competidorA: 80, marketPro: 70 },
  { metric: "Frecuencia", tuMarca: 75, competidorA: 85, marketPro: 95 },
  { metric: "Sentimiento", tuMarca: 80, competidorA: 75, marketPro: 82 },
  { metric: "Alcance", tuMarca: 65, competidorA: 80, marketPro: 90 },
  { metric: "Crecimiento", tuMarca: 85, competidorA: 70, marketPro: 75 },
]

const recentPosts = [
  { competitor: "CompetidorA", platform: "instagram", content: "Nuevo caso de éxito: +300% en ventas", likes: 1250, comments: 89, shares: 45, date: "Hace 2h" },
  { competitor: "MarketPro", platform: "facebook", content: "5 tendencias de marketing para 2024", likes: 890, comments: 156, shares: 234, date: "Hace 4h" },
  { competitor: "DigitalGrowth", platform: "instagram", content: "Detrás de cámaras de nuestra agencia", likes: 2100, comments: 178, shares: 67, date: "Hace 6h" },
  { competitor: "CompetidorA", platform: "twitter", content: "Thread: Cómo optimizar tu presupuesto de ads", likes: 456, comments: 34, shares: 189, date: "Hace 8h" },
]

export default function CompetitorsPage() {
  const [selectedClient, setSelectedClient] = useState("all")
  const [activeTab, setActiveTab] = useState("overview")
  const [showAddCompetitor, setShowAddCompetitor] = useState(false)

  const getTotalFollowers = (followers: typeof mockYourBrand.followers) => {
    return Object.values(followers).reduce((a, b) => a + b, 0)
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram": return <Instagram className="h-4 w-4 text-pink-500" />
      case "facebook": return <Facebook className="h-4 w-4 text-blue-600" />
      case "twitter": return <Twitter className="h-4 w-4 text-sky-500" />
      default: return <Globe className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Competidores</h1>
            <p className="text-muted-foreground">
              Analiza y compara tu desempeño con la competencia
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clientes</SelectItem>
                <SelectItem value="techcorp">TechCorp</SelectItem>
                <SelectItem value="fashionbrand">FashionBrand</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={() => setShowAddCompetitor(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Competidor
            </Button>
          </div>
        </div>

        {/* Quick Comparison Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tu Posición</CardTitle>
              <Trophy className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">#2</div>
              <p className="text-xs text-muted-foreground">
                De 4 competidores analizados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Seguidores Totales</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalFollowers(mockYourBrand.followers).toLocaleString()}</div>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +8.2% vs competencia promedio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
              <Heart className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockYourBrand.engagement}%</div>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Superior al promedio (4.0%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sentimiento</CardTitle>
              <Zap className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockYourBrand.sentiment}%</div>
              <p className="text-xs text-muted-foreground">
                Positivo
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="competitors">Competidores</TabsTrigger>
            <TabsTrigger value="social">Redes Sociales</TabsTrigger>
            <TabsTrigger value="content">Contenido</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Follower Growth Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Crecimiento de Seguidores</CardTitle>
                  <CardDescription>Comparativa últimos 6 meses (Instagram)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={followerGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="tuMarca" stroke="#3b82f6" name="Tu Marca" strokeWidth={2} />
                        <Line type="monotone" dataKey="competidorA" stroke="#ef4444" name="CompetidorA" />
                        <Line type="monotone" dataKey="marketPro" stroke="#22c55e" name="MarketPro" />
                        <Line type="monotone" dataKey="digitalGrowth" stroke="#f59e0b" name="DigitalGrowth" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Radar Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>Comparativa General</CardTitle>
                  <CardDescription>Análisis multidimensional</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar name="Tu Marca" dataKey="tuMarca" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                        <Radar name="CompetidorA" dataKey="competidorA" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                        <Radar name="MarketPro" dataKey="marketPro" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Engagement Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Comparativa de Engagement</CardTitle>
                <CardDescription>Tasa de interacción por marca</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={engagementComparison} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 6]} />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="engagement" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Competitors Tab */}
          <TabsContent value="competitors" className="space-y-4">
            <div className="grid gap-4">
              {mockCompetitors.map((competitor) => (
                <Card key={competitor.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                      {/* Competitor Info */}
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={competitor.logo} />
                          <AvatarFallback>{competitor.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg">{competitor.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {competitor.website}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{competitor.industry}</Badge>
                            <Badge variant="secondary">{competitor.postsPerWeek} posts/semana</Badge>
                          </div>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold">{getTotalFollowers(competitor.followers).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Seguidores</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{competitor.engagement}%</p>
                          <p className="text-xs text-muted-foreground">Engagement</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{competitor.sentiment}%</p>
                          <p className="text-xs text-muted-foreground">Sentimiento</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">{competitor.topContent}</p>
                          <p className="text-xs text-muted-foreground">Top Contenido</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Analizar
                        </Button>
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                      <div>
                        <p className="text-sm font-medium text-green-600 mb-2">Fortalezas</p>
                        <div className="flex flex-wrap gap-1">
                          {competitor.strengths.map((s, idx) => (
                            <Badge key={idx} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-600 mb-2">Debilidades</p>
                        <div className="flex flex-wrap gap-1">
                          {competitor.weaknesses.map((w, idx) => (
                            <Badge key={idx} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              {w}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Instagram Comparison */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Instagram className="h-5 w-5 text-pink-500" />
                    <CardTitle className="text-sm">Instagram</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Tu Marca</span>
                      <span className="font-medium">{mockYourBrand.followers.instagram.toLocaleString()}</span>
                    </div>
                    {mockCompetitors.map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm">{c.name.split(" ")[0]}</span>
                        <span className="text-sm">{c.followers.instagram.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Facebook Comparison */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Facebook className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-sm">Facebook</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Tu Marca</span>
                      <span className="font-medium">{mockYourBrand.followers.facebook.toLocaleString()}</span>
                    </div>
                    {mockCompetitors.map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm">{c.name.split(" ")[0]}</span>
                        <span className="text-sm">{c.followers.facebook.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Twitter Comparison */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Twitter className="h-5 w-5 text-sky-500" />
                    <CardTitle className="text-sm">Twitter/X</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Tu Marca</span>
                      <span className="font-medium">{mockYourBrand.followers.twitter.toLocaleString()}</span>
                    </div>
                    {mockCompetitors.map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm">{c.name.split(" ")[0]}</span>
                        <span className="text-sm">{c.followers.twitter.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* LinkedIn Comparison */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-700" />
                    <CardTitle className="text-sm">LinkedIn</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Tu Marca</span>
                      <span className="font-medium">{mockYourBrand.followers.linkedin.toLocaleString()}</span>
                    </div>
                    {mockCompetitors.map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm">{c.name.split(" ")[0]}</span>
                        <span className="text-sm">{c.followers.linkedin.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contenido Reciente de Competidores</CardTitle>
                <CardDescription>Últimas publicaciones detectadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentPosts.map((post, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 rounded-lg border">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        {getPlatformIcon(post.platform)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{post.competitor}</span>
                          <Badge variant="outline" className="text-xs">{post.platform}</Badge>
                          <span className="text-xs text-muted-foreground">{post.date}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{post.content}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {post.likes.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {post.comments}
                          </span>
                          <span className="flex items-center gap-1">
                            <Share2 className="h-3 w-3" />
                            {post.shares}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  )
}
